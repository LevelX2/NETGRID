import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { actionProvidesCredits } from "../../actions/action-effect-classification";
import { rolesMatch } from "../role-match";
import { visibleCardDefinition } from "../card-definition-lookup";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "../runner-visible-breaker-coverage";
import { semanticRuntimeCorpCentralPressureAssessment } from "../semantic-runtime-corp-central-pressure";
import { semanticRuntimeCorpEffectiveDefenseContext } from "../semantic-runtime-corp-effective-defense";
import { semanticRuntimeCorpCentralIceProfile } from "../semantic-runtime-corp-remote-score";
import { corpIcePlacementCandidateForAction } from "../corp-ice-placement/corp-ice-placement";
import type {
  CorpScoringWindowAssessment,
  CorpScoringWindowAgendaStealSeverity,
} from "../semantic-runtime-corp-scoring-window";
import { semanticRuntimeVisibleSourceCard } from "../visible-card-lookup";
import { corpStrategicKillLineFundingActive } from "../corp-visible-kill-line";
import type {
  CorpBoardTriage,
  CorpBoardTriageDependencies,
  ScoredLegalAction,
} from "./semantic-runtime-corp-board-triage-contracts";

export function corpLegalActions(input: AiDecisionInput): LegalAction[] {
  return (input.legalActions ?? input.playerView.legalActions ?? []).filter(
    (action) => action.side === "corp",
  );
}

export function existingReadyRemoteCanReceiveScoreline(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server !== undefined &&
    server.id.startsWith("remote_") &&
    server.ice.length > 0 &&
    (server.root.length === 0 ||
      corpLegalActions(input).some((action) => {
        if (
          action.type !== "install_card" ||
          action.payload?.placement === "ice" ||
          actionServerIdForAction(input, action) !== serverId
        ) {
          return false;
        }
        const source = semanticRuntimeVisibleSourceCard(input, action);
        return (
          source !== undefined &&
          source.known !== false &&
          corpTriageVisibleCardIsAgenda(source)
        );
      }))
  );
}

export function corpTriagePositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

export type CorpTriageStrategicIntentLike = {
  primaryWinIntent?: string;
  scorePlan?: readonly string[];
  punishPlan?: readonly string[];
};

export function corpTriageStrategicIntent(
  input: AiDecisionInput,
): CorpTriageStrategicIntentLike | undefined {
  return (
    input as AiDecisionInput & {
      ownCorpStrategicIntent?: CorpTriageStrategicIntentLike;
    }
  ).ownCorpStrategicIntent;
}

export function corpRemoteScoringStrategyWantsRemoteDevelopment(
  input: AiDecisionInput,
): boolean {
  const intent = corpTriageStrategicIntent(input);
  if (!intent) return false;
  if (intent.primaryWinIntent === "corp.punish_runner") {
    return (
      intent.scorePlan?.some((plan) =>
        ["corp.rush_scoreline", "corp.fast_advance_scoreline"].includes(plan),
      ) === true
    );
  }
  if (
    intent.primaryWinIntent === "corp.score_agendas" ||
    intent.primaryWinIntent === "corp.score_fast_advance" ||
    intent.primaryWinIntent === "corp.tax_and_score"
  ) {
    return true;
  }
  return (
    intent.scorePlan?.some((plan) =>
      [
        "corp.remote_scoreline",
        "corp.rush_scoreline",
        "corp.fast_advance_scoreline",
      ].includes(plan),
    ) === true
  );
}

export function actionHasVisibleDrawSource(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (action.type === "draw_card") return true;
  if (
    actionCandidateHasVisibleSignal(actionSemanticCandidate, [
      "draw",
      "draw_operation",
      "recover_draw",
    ])
  ) {
    return true;
  }
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return false;
  const definition = visibleCardDefinition(source);
  const text = [source.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  return corpBoardTriageTokensIncludeDraw(corpBoardTriageRulesTextTokens(text));
}

export function corpBoardTriageVisibleCardCoverageText(
  card: VisibleCard,
): string {
  const definition = visibleCardDefinition(card);
  return [
    card.title,
    card.rulesText,
    card.definitionId,
    ...(card.subtypes ?? []),
    definition?.title,
    definition?.rulesText,
    ...(definition?.subtypes ?? []),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

export function corpTriageVisibleCardIsAgenda(card: VisibleCard): boolean {
  if (card.known === false) return false;
  const definition = visibleCardDefinition(card);
  return card.type === "agenda" || definition?.type === "agenda";
}

export function corpTriageVisibleAgendaPoints(card: VisibleCard): number {
  const definition = visibleCardDefinition(card);
  return (
    corpTriagePositiveNumber(card.agendaPoints) ??
    corpTriagePositiveNumber(definition?.agendaPoints) ??
    0
  );
}

export function actionIsOffTargetInstall(
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
): boolean {
  if (action.type !== "install_card") return false;
  if (actionServerId === triage.targetServerId) return false;
  if (actionServerId === "archives") return true;
  return action.payload?.placement === "ice" && actionServerId !== undefined;
}

export function actionIsExpensiveNonProtection(
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
): boolean {
  return (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    actionServerId !== triage.targetServerId
  );
}

export function triageNeedsFunding(triage: CorpBoardTriage): boolean {
  return (
    triage.currentCredits !== undefined &&
    triage.requiredRezFloor !== undefined &&
    triage.currentCredits < triage.requiredRezFloor
  );
}

export function actionIsUnfundedTargetProtectionInstall<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (action.type !== "install_card") return false;
  if (action.payload?.placement !== "ice") return false;
  if (!triage.targetServerId || actionServerId !== triage.targetServerId) {
    return false;
  }
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return false;
  const rezCost = corpTriagePositiveNumber(source.rezCost);
  if (rezCost === undefined) return false;
  const creditsAfterAction =
    input.playerView.own.credits -
    Math.max(0, dependencies.actionCreditCost(action));
  return creditsAfterAction < rezCost;
}

export function actionDistractsFromCentralProtection(
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
): boolean {
  if (actionServerId === triage.targetServerId) return false;
  if (
    actionCreatesPurgeActionDebt(action) &&
    (triage.severity === "high" || triage.severity === "critical")
  ) {
    return true;
  }
  if (actionServerId === "archives") return true;
  if (action.type === "end_turn") return true;
  if (action.type === "advance_card") return true;
  if (action.type === "install_card") return true;
  if (triage.severity === "critical") {
    return action.type === "gain_credit" || action.type === "draw_card";
  }
  return false;
}

export function actionRelievesHqAgendaPressureViaSafeRemote<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  actionServerId: string | undefined,
  triage: CorpBoardTriage,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
): boolean {
  if (triage.primary !== "protect_hq" || triage.severity !== "high") {
    return false;
  }
  if (
    action.type !== "install_card" ||
    action.payload?.placement === "ice" ||
    !actionServerId?.startsWith("remote_")
  ) {
    return false;
  }
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || !corpTriageVisibleCardIsAgenda(source)) return false;
  if (
    !input.playerView.own.gripOrHq.some(
      (card) => card.instanceId === source.instanceId,
    )
  ) {
    return false;
  }
  const roles = dependencies.rolesForAction(input, action);
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return false;
  }
  if (!existingReadyRemoteCanReceiveScoreline(input, actionServerId)) {
    return false;
  }
  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  return assessmentCanSafelyRelieveHqAgendaPressure(assessment);
}

export function assessmentCanSafelyRelieveHqAgendaPressure(
  assessment: CorpScoringWindowAssessment | undefined,
): boolean {
  if (!assessment) return false;
  if (
    assessment.recommendedNextStep === "build_remote_ice" ||
    assessment.recommendedNextStep === "gain_credit" ||
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve === false ||
    (assessment.dynamicProtectionWeaknessCount ?? 0) > 0 ||
    (assessment.affordableDurableRelevantIceCount ?? 0) < 1 ||
    assessment.agendaStealSeverity === "game_ending"
  ) {
    return false;
  }
  return (
    !assessment.runnerCanContestNow &&
    !assessment.runnerCanReachAccessNow &&
    !assessment.agendaStealRelevantNow &&
    !assessment.runnerCanContestBeforeScore &&
    !assessment.runnerCanReachAccessBeforeScore &&
    !assessment.agendaStealRelevantBeforeScore
  );
}

export function actionCreatesPurgeActionDebt(action: LegalAction): boolean {
  return action.type === "purge_runner_virus_counters";
}

export function actionBuildsScoreRemote(
  entry: Pick<ScoredLegalAction, "action" | "roles" | "serverId">,
): boolean {
  if (!entry.serverId || !entry.serverId.startsWith("remote_")) return false;
  if (entry.action.type !== "install_card") return false;
  return (
    entry.action.payload?.placement === "ice" ||
    rolesMatch(entry.roles, ["remote_score_support", "scoreline_support"])
  );
}

export function actionProvidesEconomy<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: CorpBoardTriageDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  if (actionProvidesCredits(action)) return true;
  if (
    action.type === "install_card" &&
    (input.playerView.own.credits > 1 ||
      corpStrategicKillLineFundingActive(input)) &&
    actionCandidateHasVisibleSignal(actionSemanticCandidate, [
      "finite_economy_pool",
      "economy.finite_pool",
      "remote.asset_economy",
    ])
  ) {
    return true;
  }
  const payoffPressure = dependencies.corpTaggedRunnerPayoffPressure?.(
    input,
    action,
  );
  if (
    payoffPressure?.key === "corp_card_action_economy_gain" ||
    payoffPressure?.reason?.includes("installed_corp_economy:true")
  ) {
    return true;
  }
  if (action.type === "play_operation") {
    return (
      actionCandidateHasVisibleSignal(actionSemanticCandidate, [
        "economy",
        "economy_operation",
        "draw_operation",
        "recover_economy",
        "economy.corp_credit_burst",
        "corp_credit_burst",
      ]) || actionHasVisibleImmediateEconomyOrDrawSource(input, action)
    );
  }
  if (
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  return (
    actionCandidateHasVisibleSignal(actionSemanticCandidate, [
      "economy",
      "economy_operation",
      "draw_operation",
      "recover_economy",
      "economy.corp_credit_burst",
      "corp_credit_burst",
    ]) || actionHasVisibleImmediateEconomyOrDrawSource(input, action)
  );
}

export function actionHasVisibleImmediateEconomyOrDrawSource(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (!source || source.known === false) return false;
  const definition = visibleCardDefinition(source);
  const type = source.type ?? definition?.type;
  if (action.type === "play_operation" && type !== "operation") {
    return false;
  }
  const text = [source.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const tokens = corpBoardTriageRulesTextTokens(text);
  return (
    corpBoardTriageTokensIncludeCreditGain(tokens) ||
    corpBoardTriageTokensIncludeDraw(tokens)
  );
}

export function corpBoardTriageRulesTextTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("de-DE")
    .split(/[^\p{L}0-9]+/u)
    .filter(Boolean);
}

export function corpBoardTriageTokensIncludeCreditGain(
  tokens: readonly string[],
): boolean {
  return tokens.some(
    (token, index) =>
      corpBoardTriageCreditGainVerb(tokens[index - 1]) &&
      corpBoardTriagePositiveInteger(token) > 0 &&
      corpBoardTriageCreditToken(tokens[index + 1]),
  );
}

export function corpBoardTriageTokensIncludeDraw(
  tokens: readonly string[],
): boolean {
  return tokens.some(
    (token, index) =>
      corpBoardTriageDrawVerb(tokens[index - 1]) &&
      corpBoardTriagePositiveInteger(token) > 0 &&
      corpBoardTriageCardToken(tokens[index + 1]),
  );
}

export function corpBoardTriageCreditGainVerb(
  token: string | undefined,
): boolean {
  return (
    token === "gain" ||
    token === "erhalte" ||
    token === "erhält" ||
    token === "nimm" ||
    token === "nehme"
  );
}

export function corpBoardTriageDrawVerb(token: string | undefined): boolean {
  return token === "draw" || token === "ziehe" || token === "zieht";
}

export function corpBoardTriageCreditToken(token: string | undefined): boolean {
  return (
    token === "credit" ||
    token === "credits" ||
    token === "kredit" ||
    token === "kredite" ||
    token === "bit" ||
    token === "bits"
  );
}

export function corpBoardTriageCardToken(token: string | undefined): boolean {
  return (
    token === "card" ||
    token === "cards" ||
    token === "karte" ||
    token === "karten"
  );
}

export function corpBoardTriagePositiveInteger(
  token: string | undefined,
): number {
  if (!token) return 0;
  const amount = Number.parseInt(token, 10);
  return String(amount) === token && amount > 0 ? amount : 0;
}

export function legalEconomyActionExists(input: AiDecisionInput): boolean {
  return corpLegalActions(input).some((action) =>
    actionProvidesCredits(action),
  );
}

export function actionCandidateHasVisibleSignal(
  candidate: ActionSemanticCandidate | undefined,
  needles: readonly string[],
): boolean {
  if (!candidate) return false;
  const signals = [
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.evidence,
  ].map((signal) => signal.toLocaleLowerCase("en-US"));
  return needles.some((needle) => {
    const normalizedNeedle = needle.toLocaleLowerCase("en-US");
    return (
      signals.includes(normalizedNeedle) ||
      rolesMatch(signals, [normalizedNeedle])
    );
  });
}

export function actionServerIdForAction(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  const payloadServer =
    stringPayload(action.payload, "serverId") ??
    stringPayload(action.payload, "targetServerId") ??
    stringPayload(action.payload, "attackedServerId");
  if (payloadServer) return payloadServer;
  const sourceId =
    typeof action.source === "string" ? action.source : undefined;
  if (!sourceId) return undefined;
  for (const server of input.playerView.servers ?? []) {
    if (
      server.ice.some((card) => card.instanceId === sourceId) ||
      server.root.some((card) => card.instanceId === sourceId)
    ) {
      return server.id;
    }
  }
  return undefined;
}

export function stringPayload(
  payload: LegalAction["payload"],
  key: string,
): string | undefined {
  const value = payload?.[key];
  return typeof value === "string" ? value : undefined;
}

export function triageReason(
  triage: CorpBoardTriage,
  action: LegalAction,
  actionServerId: string | undefined,
  alignment: "match" | "mismatch" | "neutral",
  rawValue = 0,
  normalizedValue = 0,
  componentValue = normalizedValue,
): string {
  return [
    `triage_primary:${triage.primary}`,
    `triage_severity:${triage.severity}`,
    ...(triage.targetServerId
      ? [`triage_target:${triage.targetServerId}`]
      : []),
    ...(triage.scoreRemoteServerId
      ? [`triage_score_remote:${triage.scoreRemoteServerId}`]
      : []),
    ...(triage.currentCredits !== undefined
      ? [`triage_current_credits:${triage.currentCredits}`]
      : []),
    ...(triage.requiredRezFloor !== undefined
      ? [`triage_required_rez_floor:${triage.requiredRezFloor}`]
      : []),
    ...(triage.runnerAgendaPointsAfterSteal !== undefined
      ? [
          `triage_runner_points_after_steal:${triage.runnerAgendaPointsAfterSteal}`,
        ]
      : []),
    `triage_action:${action.type}`,
    `triage_action_id:${action.actionId}`,
    `triage_action_server:${actionServerId ?? "none"}`,
    `triage_alignment:${alignment}`,
    `triage_raw_value:${rawValue}`,
    `triage_normalized_value:${normalizedValue}`,
    `triage_component_value:${componentValue}`,
    ...triage.evidence.slice(0, 12),
  ].join("|");
}

export function triageIsActiveScorelineLock(triage: CorpBoardTriage): boolean {
  return triage.evidence.includes("corp_active_scoreline_clock:true");
}

export function triageIsEmergencyHqAgendaRemoteConversion(
  triage: CorpBoardTriage,
): boolean {
  return triage.evidence.includes(
    "corp_hq_agenda_emergency_remote_conversion:true",
  );
}

export function triageIsLastViableDeckoutMatchpoint(
  triage: CorpBoardTriage,
): boolean {
  return (
    triage.evidence.includes("corp_deckout_matchpoint_scoreline:true") &&
    triage.evidence.includes("corp_deckout_last_viable_window:true")
  );
}

export function actionUsesVisibleMatchpointAgenda(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const source = semanticRuntimeVisibleSourceCard(input, action);
  if (
    !source ||
    source.known === false ||
    !corpTriageVisibleCardIsAgenda(source)
  ) {
    return false;
  }
  const corpAgendaPoints =
    corpTriagePositiveNumber(input.playerView.own.agendaPoints) ?? 0;
  const pointsToWin =
    corpTriagePositiveNumber(input.playerView.agendaPointsToWin) ?? 7;
  return (
    corpAgendaPoints + corpTriageVisibleAgendaPoints(source) >= pointsToWin
  );
}

export function corpBoardTriageMismatchComponentValue(
  input: AiDecisionInput,
  triage: CorpBoardTriage,
  normalizedValue: number,
  action: LegalAction,
  actionServerId: string | undefined,
): number {
  if (
    triage.primary === "force_scoreline_clock" &&
    triage.severity === "critical"
  ) {
    return -5200;
  }
  if (
    triage.severity === "critical" &&
    triage.evidence.some((entry) =>
      entry.startsWith("corp_board_triage_score_now_deferred:"),
    )
  ) {
    return -12000;
  }
  if (
    triage.primary === "protect_score_remote" &&
    (triage.severity === "critical" || triage.severity === "high") &&
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    actionServerId !== triage.targetServerId &&
    corpRemoteScoringStrategyWantsRemoteDevelopment(input)
  ) {
    return -5200;
  }
  if (
    (triage.primary === "score_now" ||
      triage.primary === "force_scoreline_clock" ||
      triage.primary === "protect_score_remote" ||
      triage.primary === "fund_score_remote" ||
      triage.primary === "protect_hq" ||
      triage.primary === "protect_rd") &&
    (triage.severity === "critical" || triage.severity === "high")
  ) {
    return triage.severity === "critical" ? -3200 : -2400;
  }
  if (
    triage.primary === "setup_score_remote" &&
    triage.evidence.includes(
      "corp_board_triage_deck_strategy:remote_score_development",
    )
  ) {
    return -1600;
  }
  if (triage.primary === "setup_score_remote") {
    return -1200;
  }
  return normalizedValue;
}

export function normalizedCorpBoardTriageValue(rawValue: number): number {
  return Math.max(-100, Math.min(100, Math.round(rawValue / 50)));
}

export function inputWithOpponentDefaults(
  input: AiDecisionInput,
): AiDecisionInput {
  if (input.playerView.opponent) return input;
  return {
    ...input,
    playerView: {
      ...input.playerView,
      opponent: {
        identity: {
          instanceId: "triage-runner-identity",
          known: true,
          side: "runner",
          owner: "runner",
          type: "identity",
          counterDisplays: [],
        },
        credits: 0,
        clicks: 0,
        agendaPoints: 0,
        tags: 0,
        handCount: 0,
        maxHandSize: 5,
        deckCount: 0,
        discardCount: 0,
        rig: [],
        heapOrArchives: [],
        gripOrHq: [],
        scoreArea: [],
      },
    },
  } as unknown as AiDecisionInput;
}
