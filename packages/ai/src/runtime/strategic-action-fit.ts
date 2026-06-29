import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { buildSemanticDecisionDebugScoreComponent } from "../diagnostics/decision-debug";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

export function semanticRuntimeStrategicActionFitScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent[] {
  const fit = semanticRuntimeStrategicActionFit(
    input,
    action,
    scopeId,
    actionSemanticCandidate,
  );
  if (!fit) return [];
  return [
    buildSemanticDecisionDebugScoreComponent({
      key: "semantic_strategic_action_fit",
      label: "StrategicIntent-Fit",
      value: fit.value,
      reason: fit.evidence.join("|"),
    }),
  ];
}

export function semanticRuntimeStrategicActionFitEvidence(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate?: ActionSemanticCandidate,
): string[] {
  const fit = semanticRuntimeStrategicActionFit(
    input,
    action,
    scopeId,
    actionSemanticCandidate,
  );
  if (!fit) return [];
  return [
    "semantic_strategic_action_fit:true",
    `semantic_strategic_action_fit_value:${fit.value}`,
    ...fit.evidence,
  ];
}

function semanticRuntimeStrategicActionFit(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate?: ActionSemanticCandidate,
): { value: number; evidence: string[] } | undefined {
  const state = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (!state || state.primaryStrategy.family === "neutral") return undefined;
  if (state.blockers.some((blocker) => blocker.severity === "hard")) {
    return undefined;
  }
  if (!strategicIntentPhaseAllowsAction(input, state, action, actionSemanticCandidate)) {
    return undefined;
  }
  const baseValue =
    input.side === "runner"
      ? runnerStrategicActionFitValue(action, scopeId, state)
      : corpStrategicActionFitValue(
          input,
          action,
          scopeId,
          state,
          actionSemanticCandidate,
        );
  if (baseValue <= 0) return undefined;
  const phaseBonus = strategicIntentPhaseActionBonus(state.phase);
  const targetMatch = strategicIntentActionTargetMatch(
    input,
    state,
    action,
    actionSemanticCandidate,
  );
  const targetBonus =
    targetMatch === "exact" ? 75 : targetMatch === "kind" ? 25 : 0;
  const value = Math.min(260, baseValue + phaseBonus + targetBonus);
  return {
    value,
    evidence: [
      `strategic_action_fit_family:${state.primaryStrategy.family}`,
      `strategic_action_fit_strategy:${state.primaryStrategy.strategyId}`,
      `strategic_action_fit_phase:${state.phase}`,
      `strategic_action_fit_target:${state.targetVector.kind}`,
      `strategic_action_fit_target_match:${targetMatch}`,
      `strategic_action_fit_scope:${scopeId}`,
    ],
  };
}

function runnerStrategicActionFitValue(
  action: LegalAction,
  scopeId: string,
  state: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >,
): number {
  const serverId = semanticRuntimeServerId(action);
  switch (state.primaryStrategy.family) {
    case "runner_central_pressure":
      if (
        action.type !== "start_run" ||
        (serverId !== "hq" && serverId !== "rd")
      ) {
        return 0;
      }
      if (state.targetVector.targetId) {
        return serverId === state.targetVector.targetId ? 185 : 0;
      }
      return 160;
    case "runner_remote_contest":
    case "runner_remote_trash":
      if (action.type === "trash_accessed_card") return 190;
      if (action.type !== "start_run" || !isRemoteServerTarget(serverId)) {
        return 0;
      }
      if (
        state.targetVector.targetId &&
        state.targetVector.targetId !== "best_visible_remote"
      ) {
        return serverId === state.targetVector.targetId ? 185 : 0;
      }
      return 160;
    case "runner_setup":
      return runnerStrategicSetupAction(action, scopeId) ? 125 : 0;
    case "runner_tempo":
      return action.type === "start_run" || action.type === "play_event"
        ? 130
        : 0;
    case "runner_survival":
      return action.type === "draw_card" ||
        action.type === "remove_tag" ||
        action.type === "jack_out"
        ? 160
        : 0;
    default:
      return 0;
  }
}

function corpStrategicActionFitValue(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  state: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number {
  switch (state.primaryStrategy.family) {
    case "corp_scoreline":
    case "corp_fast_advance":
      if (action.type === "score_agenda") return 230;
      if (action.type === "advance_card") return 170;
      return action.type === "install_card" &&
        corpActionLooksLikeScoreLine(input, action)
        ? 130
        : 0;
    case "corp_ice_tax":
    case "corp_central_defense":
      if (action.type === "rez_ice") return 160;
      return action.type === "install_card" &&
        action.payload?.placement === "ice"
        ? 130
        : 0;
    case "corp_asset_economy":
    case "corp_economy_reserve":
      if (action.type === "gain_credit") return 120;
      return action.type === "install_card" &&
        corpActionLooksLikeEconomy(input, action)
        ? 130
        : 0;
    case "corp_tag_trace_punish":
    case "corp_damage_kill":
    case "corp_ambush":
      return strategicIntentActionTargetMatch(
        input,
        state,
        action,
        actionSemanticCandidate,
      ) !== "none" ||
        corpStrategicPunishAction(input, action, scopeId, actionSemanticCandidate)
        ? 180
        : 0;
    default:
      return 0;
  }
}

function runnerStrategicSetupAction(
  action: LegalAction,
  scopeId: string,
): boolean {
  return (
    scopeIdHasToken(scopeId, "setup") ||
    action.type === "install_card" ||
    action.type === "play_event" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability" ||
    action.type === "draw_card"
  );
}

function corpStrategicPunishAction(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (
    !(
      action.type === "play_operation" ||
      action.type === "trash_resource" ||
      action.type === "trigger_ability" ||
      action.type === "activated_card_ability"
    )
  ) {
    return false;
  }
  const signals = semanticSignals(actionSemanticCandidate);
  const hasTagSource =
    signals.has("tag.source") ||
    signals.has("trace.source") ||
    signals.has("corp_tag_source_legal_action_classified_by_ontology:true");
  const hasPunishPayoff =
    signals.has("tag.payoff") ||
    signals.has("punish.payoff") ||
    signals.has("damage.corp_tagged_meat_payoff") ||
    signals.has("access.corp_ambush") ||
    signals.has("access.corp_access_punish") ||
    signals.has("target.runner_resource_trash") ||
    signals.has("target.runner_hardware_trash") ||
    signals.has("target.runner_program_trash") ||
    signals.has("corp_punish_legal_action_classified_by_ontology:true");
  const requiresRunnerTagged = actionSemanticCandidate?.conditions.some(
    (condition) => condition.kind === "requires_runner_tagged",
  );
  const runnerTagged = input.playerView.opponent.tags > 0;
  if (hasPunishPayoff && (!requiresRunnerTagged || runnerTagged)) return true;
  if (hasTagSource && scopeIdHasToken(scopeId, "tag")) {
    return true;
  }
  return false;
}

function scopeIdHasToken(scopeId: string, token: string): boolean {
  const scopeTokenSet = new Set(scopeId.split(/[._:-]+/));
  return scopeTokenSet.has(token);
}

function semanticSignals(
  candidate: ActionSemanticCandidate | undefined,
): Set<string> {
  return new Set([
    ...(candidate?.semanticActionType ? [candidate.semanticActionType] : []),
    ...(candidate?.actionTacticSignals ?? []),
    ...(candidate?.cardContextSignals ?? []),
    ...(candidate?.conditions ?? []).map((condition) => condition.kind),
    ...(candidate?.evidence ?? []),
  ]);
}

function strategicIntentPhaseActionBonus(
  phase: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >["phase"],
): number {
  switch (phase) {
    case "convert":
    case "closeout":
      return 35;
    case "pressure":
    case "enable":
      return 20;
    default:
      return 0;
  }
}

function strategicIntentPhaseAllowsAction(
  input: AiDecisionInput,
  state: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (state.phase === "recover") return false;
  if (state.phase !== "fund") return true;
  if (
    state.targetVector.kind === "tag" &&
    input.playerView.opponent.tags > 0 &&
    corpStrategicPunishAction(input, action, "corp_tag_punish", actionSemanticCandidate)
  ) {
    return true;
  }
  return (
    action.type === "score_agenda" ||
    action.type === "steal_agenda" ||
    action.type === "trash_accessed_card" ||
    action.type === "gain_credit" ||
    action.type === "draw_card" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  );
}

function strategicIntentActionTargetMatch(
  input: AiDecisionInput,
  state: NonNullable<
    AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
  >,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): "exact" | "kind" | "none" {
  const target = state.targetVector;
  const serverId = semanticRuntimeServerId(action);
  if (target.targetId && target.targetId === serverId) return "exact";
  if (target.kind === "central") {
    return serverId === "hq" || serverId === "rd" ? "kind" : "none";
  }
  if (target.kind === "remote") {
    if (!isRemoteServerTarget(serverId)) return "none";
    return target.targetId === "best_visible_remote" ? "kind" : "none";
  }
  if (target.kind === "scoreline") {
    return action.type === "score_agenda" || action.type === "advance_card"
      ? "kind"
      : "none";
  }
  if (target.kind === "economy") {
    return action.type === "gain_credit" ? "kind" : "none";
  }
  if (target.kind === "tag" || target.kind === "damage") {
    return corpStrategicPunishAction(
      input,
      action,
      target.kind === "tag" ? "corp_tag_punish" : "corp_damage_kill",
      actionSemanticCandidate,
    )
      ? "kind"
      : "none";
  }
  return "none";
}

function corpActionLooksLikeScoreLine(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = visibleSourceCard(input, action);
  return (
    source?.type === "agenda" ||
    typeof source?.advancementRequirement === "number" ||
    action.payload?.cardType === "agenda" ||
    action.payload?.targetCardType === "agenda"
  );
}

function corpActionLooksLikeEconomy(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = visibleSourceCard(input, action);
  if (!source) return false;
  if (source.type === "asset") return true;
  return visibleCardHasAnyToken(source, [
    "economy",
    "credit",
    "credits",
    "bit",
    "bits",
    "gain",
    "bank",
  ]);
}

function visibleCardHasAnyToken(
  card: VisibleCard,
  terms: readonly string[],
): boolean {
  const termSet = new Set(terms);
  return [
    card.title,
    card.definitionId,
    card.rulesText,
  ]
    .flatMap((entry) => visibleCardTokens(entry))
    .some((token) => termSet.has(token));
}

function visibleCardTokens(value: string | undefined): string[] {
  return (value ?? "")
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function visibleSourceCard(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const sourceId = String(action.source ?? "");
  const payloadSourceId =
    stringPayload(action, "sourceCardId") ??
    stringPayload(action, "sourceCardInstanceId");
  const ids = new Set([sourceId, payloadSourceId].filter(Boolean));
  return allVisibleCards(input).find(
    (card) =>
      ids.has(card.instanceId) ||
      ids.has(card.definitionId ?? "") ||
      stringPayload(action, "sourceDefinitionId") === card.definitionId ||
      stringPayload(action, "sourceCardDefinitionId") === card.definitionId,
  );
}

function allVisibleCards(input: AiDecisionInput): VisibleCard[] {
  return [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.own.scoreArea,
    ...input.playerView.opponent.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
}

function semanticRuntimeServerId(action: LegalAction): string | undefined {
  const serverId = action.payload?.serverId;
  return typeof serverId === "string" ? serverId : undefined;
}

function isRemoteServerTarget(serverId: string | undefined): boolean {
  return serverId?.startsWith("remote_") === true;
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
