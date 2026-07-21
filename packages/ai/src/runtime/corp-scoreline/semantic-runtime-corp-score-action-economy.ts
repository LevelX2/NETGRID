import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { TacticalGoalLike } from "../../decision/semantic-decision-frame";
import { actionProvidesCredits } from "../../actions/action-effect-classification";
import { scoreEconomyAction } from "../../economy/economy-action-score";
import { visibleCardDefinition } from "../card-definition-lookup";
import { rolesMatch } from "../role-match";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import {
  type CorpBurstEconomyOperation,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score-contracts";

export function visibleActionSourceId(action: LegalAction): string | undefined {
  if (
    typeof action.source === "string" &&
    action.source !== "basic_action" &&
    action.source !== "game_rule"
  ) {
    return action.source;
  }
  const payloadCardId = action.payload?.cardId;
  return typeof payloadCardId === "string" ? payloadCardId : undefined;
}

export function semanticRuntimeCorpActionCreditCost<TConsumer extends string>(
  dependencies: Pick<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    "actionCreditCost"
  >,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number {
  const costProfile = actionSemanticCandidate?.costProfile;
  if (costProfile === undefined) return dependencies.actionCreditCost(action);
  if (typeof costProfile.creditCost === "number") return costProfile.creditCost;
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    return 0;
  }
  return dependencies.actionCreditCost(action);
}

export function semanticRuntimeCorpActionClickCost(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number {
  const candidateClickCost = actionSemanticCandidate?.costProfile.clickCost;
  if (
    typeof candidateClickCost === "number" &&
    Number.isFinite(candidateClickCost)
  ) {
    return Math.max(0, Math.floor(candidateClickCost));
  }
  const costs = action.costs
    .map((cost) => cost.clicks)
    .filter((value): value is number => typeof value === "number");
  if (costs.length > 0) {
    return costs.reduce((sum, value) => sum + value, 0);
  }
  return action.type === "advance_card" ? 1 : 0;
}

export function corpSameTurnScoreCloseoutComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: Pick<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    "actionCreditCost" | "corpAdvanceCompletesScore"
  >,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "advance_card") return undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard || sourceCard.known === false) return undefined;
  if (!corpVisibleCardIsAgenda(sourceCard)) return undefined;
  const requirement = corpVisibleAdvancementRequirement(sourceCard);
  if (requirement === undefined) return undefined;
  const counters = positiveOrZeroNumber(sourceCard.advancementCounters) ?? 0;
  if (counters >= requirement) return undefined;
  const countersAfterCurrentAction = counters + 1;
  const additionalAdvancesNeeded = Math.max(
    0,
    requirement - countersAfterCurrentAction,
  );
  if (additionalAdvancesNeeded === 0) {
    if (dependencies.corpAdvanceCompletesScore?.(input, action) !== true) {
      return undefined;
    }
  }
  const actionClickCost = Math.max(
    1,
    semanticRuntimeCorpActionClickCost(action, actionSemanticCandidate),
  );
  const actionCreditCost = Math.max(
    1,
    semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    ),
  );
  const remainingClicks = input.playerView.own.clicks - actionClickCost;
  const remainingCredits = input.playerView.own.credits - actionCreditCost;
  if (remainingClicks < additionalAdvancesNeeded) return undefined;
  if (remainingCredits < additionalAdvancesNeeded) return undefined;
  const serverId = corpServerIdForRootCard(input, sourceCard.instanceId);
  return {
    key: "corp_same_turn_score_closeout_advance",
    label: "Score-Closeout",
    value: 3400,
    reason: [
      "same_turn_score_closeout:true",
      `card:${sourceCard.instanceId}`,
      `server:${serverId ?? "unknown"}`,
      `advancement_requirement:${requirement}`,
      `advancement_counters:${counters}`,
      `additional_advances_needed:${additionalAdvancesNeeded}`,
      `remaining_clicks_after_action:${remainingClicks}`,
      `remaining_credits_after_action:${remainingCredits}`,
    ].join("|"),
  };
}

export function corpScoreableAgendaAdvancePenaltyComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "advance_card") return undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard || sourceCard.known === false) return undefined;
  if (!corpVisibleCardIsAgenda(sourceCard)) return undefined;
  const requirement = corpVisibleAdvancementRequirement(sourceCard);
  if (requirement === undefined) return undefined;
  const counters = positiveOrZeroNumber(sourceCard.advancementCounters) ?? 0;
  if (counters < requirement) return undefined;
  if (!corpLegalScoreActionExistsForCard(input, sourceCard.instanceId)) {
    return undefined;
  }
  if (
    corpAgendaAdvanceReachesVisibleOveradvancePayoff(
      sourceCard,
      counters,
      requirement,
    )
  ) {
    return undefined;
  }
  const serverId = corpServerIdForRootCard(input, sourceCard.instanceId);
  return {
    key: "corp_scoreable_agenda_overadvance_penalty",
    label: "Scorebare Agenda weiter advancen",
    value: -4200,
    reason: [
      "score_agenda_legal:true",
      "overadvance_next_threshold_reached:false",
      `card:${sourceCard.instanceId}`,
      `server:${serverId ?? "unknown"}`,
      `advancement_requirement:${requirement}`,
      `advancement_counters:${counters}`,
    ].join("|"),
  };
}

function corpLegalScoreActionExistsForCard(
  input: AiDecisionInput,
  cardId: string,
): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  return legalActions.some(
    (candidate) =>
      candidate.side === "corp" &&
      candidate.type === "score_agenda" &&
      visibleActionSourceId(candidate) === cardId,
  );
}

export function corpVisibleAdvancementRequirement(
  card: VisibleCard,
): number | undefined {
  return (
    positiveIntegerNumber(card.advancementRequirement) ??
    positiveIntegerNumber(visibleCardDefinition(card)?.advancementRequirement)
  );
}

function corpAgendaAdvanceReachesVisibleOveradvancePayoff(
  card: VisibleCard,
  counters: number,
  requirement: number,
): boolean {
  const interval = corpVisibleOveradvanceCounterInterval(card);
  if (interval === undefined) return false;
  const overNow = Math.max(0, counters - requirement);
  const overAfterAdvance = Math.max(0, counters + 1 - requirement);
  return (
    Math.floor(overAfterAdvance / interval) > Math.floor(overNow / interval)
  );
}

function corpVisibleOveradvanceCounterInterval(
  card: VisibleCard,
): number | undefined {
  const definition = visibleCardDefinition(card);
  const mechanics = definition?.mechanics ?? [];
  const text = [card.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const tokens = corpRulesTextTokens(text);
  const interval = tokens
    .map((token, index) => {
      if (token !== "for" || tokens[index + 1] !== "every") return 0;
      const amount = numberFromDigitOrWord(tokens[index + 2] ?? "");
      if (amount <= 0) return 0;
      const referencesAdvancementCounters =
        tokens[index + 3] === "advancement" &&
        (tokens[index + 4] === "counter" || tokens[index + 4] === "counters") &&
        tokens[index + 5] === "over";
      return referencesAdvancementCounters ? amount : 0;
    })
    .find((amount) => amount > 0);
  if (interval !== undefined) return interval;
  if (tokens.includes("overadvance")) return 1;
  if (
    mechanics.some((mechanic) =>
      rolesMatch([mechanic], ["overadvance", "overadvance_bonus"]),
    )
  ) {
    return 1;
  }
  return undefined;
}

function corpServerIdForRootCard(
  input: AiDecisionInput,
  cardId: string,
): string | undefined {
  return input.playerView.servers.find((server) =>
    (server.root ?? []).some((card) => card.instanceId === cardId),
  )?.id;
}

export function corpServerIdForInstalledCard(
  input: AiDecisionInput,
  cardId: string,
): string | undefined {
  return input.playerView.servers.find(
    (server) =>
      (server.root ?? []).some((card) => card.instanceId === cardId) ||
      (server.ice ?? []).some((card) => card.instanceId === cardId),
  )?.id;
}

export function highestPriorityCorpGoalForAction(
  goals: readonly TacticalGoalLike[],
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  sourceCard: VisibleCard | undefined,
): TacticalGoalLike | undefined {
  return goals
    .filter((goal) =>
      corpGoalMatchesAction(
        goal,
        action,
        scopeId,
        actionSemanticCandidate,
        sourceCard,
      ),
    )
    .sort((left, right) => right.priority - left.priority)[0];
}

function corpGoalMatchesAction(
  goal: TacticalGoalLike,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  sourceCard: VisibleCard | undefined,
): boolean {
  switch (goal.goalId) {
    case "corp.tactical.score_closeout":
      return (
        action.type === "score_agenda" ||
        corpActionCandidateHasScoreCloseoutSignal(actionSemanticCandidate)
      );
    case "corp.tactical.advance_scoreline":
      return (
        action.type === "advance_card" &&
        (sourceCard === undefined || sourceCard.type === "agenda")
      );
    case "corp.tactical.rez_relevant_ice":
      return action.type === "rez_ice" && sourceCard?.type === "ice";
    case "corp.tactical.prepare_remote":
    case "corp.tactical.protect_central":
      return action.type === "install_card";
    case "corp.tactical.stabilize_economy":
      return (
        actionProvidesCredits(action) ||
        (actionSemanticCandidate?.economyProjection?.netLiquidCreditGain ?? 0) >
          0 ||
        action.type === "draw_card" ||
        (action.type === "play_operation" &&
          corpActionCandidateHasVisibleSignal(actionSemanticCandidate, [
            "economy_operation",
            "recover_economy",
            "economy.corp_credit_burst",
            "corp_credit_burst",
          ]))
      );
    case "corp.tactical.visible_tag_punish":
      return (
        scopeId === "corp_tag_punish" ||
        corpActionCandidateHasVisibleSignal(actionSemanticCandidate, [
          "tag",
          "trace",
          "punish",
          "trash_runner_resource",
        ])
      );
    case "corp.tactical.visible_damage_or_ambush_window":
      return (
        scopeId === "corp_tag_punish" ||
        corpActionCandidateHasVisibleSignal(actionSemanticCandidate, ["ambush"])
      );
    default:
      return false;
  }
}

export function corpTacticalGoalScoreValue(goal: TacticalGoalLike): number {
  return 500 + Math.min(500, Math.max(0, goal.priority - 500));
}

export function corpActionCandidateHasVisibleSignal(
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

export function corpActionCandidateHasScoreCloseoutSignal(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  return corpActionCandidateHasVisibleSignal(candidate, [
    "corp.score_closeout",
    "closeout.agenda_score",
    "advance_burst",
    "advance.counter_cashout",
    "score.advance_burst",
  ]);
}

export function corpInputHasScoreCloseoutBasis(
  input: AiDecisionInput,
): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  if (
    legalActions.some(
      (candidate) =>
        candidate.side === "corp" &&
        (candidate.type === "score_agenda" ||
          (candidate.type === "advance_card" &&
            corpActionTargetsVisibleAgenda(input, candidate))),
    )
  ) {
    return true;
  }
  return (input.playerView.servers ?? []).some((server) =>
    (server.root ?? []).some(
      (card) => card.known !== false && corpVisibleCardIsAgenda(card),
    ),
  );
}

function corpActionTargetsVisibleAgenda(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const sourceCard = visibleSourceCardForAction(input, action);
  return sourceCard !== undefined && corpVisibleCardIsAgenda(sourceCard);
}

export function corpVisibleCardIsAgenda(card: VisibleCard): boolean {
  return (
    card.type === "agenda" || visibleCardDefinition(card)?.type === "agenda"
  );
}

export function corpBurstEconomyOperationForAction<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  _dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): CorpBurstEconomyOperation | undefined {
  if (
    action.type !== "play_operation" &&
    action.type !== "activated_card_ability" &&
    action.type !== "trigger_ability"
  ) {
    return undefined;
  }
  const projection = actionSemanticCandidate?.economyProjection;
  if (
    !projection ||
    projection.timing !== "immediate" ||
    (projection.netLiquidCreditGain ?? 0) <= 0
  ) {
    return undefined;
  }
  const score = scoreEconomyAction(actionSemanticCandidate);
  const cost = projection.creditCost;
  if (input.playerView.own.credits < cost) return undefined;
  const operation: CorpBurstEconomyOperation = {
    actionKind:
      action.type === "play_operation" ? "operation" : "activated_ability",
    cost,
    gain: projection.grossLiquidCreditGain ?? 0,
    drawCards: projection.cardsDrawn,
    netGain: projection.netLiquidCreditGain ?? 0,
    actionValue: score.total,
    evidence: [
      `economy_projection_source:${projection.source}`,
      `economy_projection_confidence:${projection.confidence}`,
      `economy_mode:${score.mode}`,
      `economy_score:${score.total}`,
      ...score.evidence,
    ],
  };
  return {
    ...operation,
    evidence: [
      operation.actionKind === "activated_ability"
        ? "corp_projected_activated_economy:true"
        : "corp_projected_operation_economy:true",
      ...operation.evidence,
      action.type === "play_operation"
        ? "play_operation_affordable:true"
        : "activated_economy_affordable:true",
    ],
  };
}

export function visibleSourceCardForAction(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const sourceId = visibleActionSourceId(action);
  if (!sourceId) return undefined;
  return [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ]
    .flat()
    .find((card) => card.instanceId === sourceId && card.known);
}

export function corpExtraActionGainFromRulesText(
  rulesText: string | undefined,
): number {
  const tokens = corpRulesTextTokens(rulesText);
  const actionToken = tokens.find(
    (token, index) =>
      (tokens[index - 1] === "gain" || tokens[index - 1] === "erhalte") &&
      (tokens[index + 1] === "action" ||
        tokens[index + 1] === "actions" ||
        tokens[index + 1] === "aktion" ||
        tokens[index + 1] === "aktionen"),
  );
  return actionToken ? numberFromDigitOrWord(actionToken) : 0;
}

function numberFromDigitOrWord(value: string): number {
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  switch (value.trim().toLocaleLowerCase("de-DE")) {
    case "one":
    case "eins":
    case "eine":
    case "einen":
      return 1;
    case "two":
    case "zwei":
      return 2;
    case "three":
    case "drei":
      return 3;
    case "four":
    case "vier":
      return 4;
    case "five":
    case "fünf":
    case "fuenf":
      return 5;
    case "six":
    case "sechs":
      return 6;
    case "seven":
    case "sieben":
      return 7;
    case "eight":
    case "acht":
      return 8;
    case "nine":
    case "neun":
      return 9;
    case "ten":
    case "zehn":
      return 10;
    default:
      return 0;
  }
}

function corpRulesTextTokens(rulesText: string | undefined): string[] {
  if (!rulesText) return [];
  return rulesText
    .replaceAll("[", " bracketopen ")
    .replaceAll("]", " bracketclose ")
    .replaceAll(":", " colon ")
    .toLocaleLowerCase("de-DE")
    .split(/[^\p{L}0-9]+/u)
    .filter(Boolean);
}

export function positiveOrZeroNumber(
  value: number | undefined,
): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function positiveIntegerNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;
}

export function corpActionCandidateTargetsCorpScoreline(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  if (!candidate?.targetContext) return false;
  const targets = [
    ...candidate.targetContext.selectedTargets,
    ...(candidate.targetContext.availableTargets ?? []),
  ];
  return targets.some((target) => {
    return (
      target.targetSide !== "runner" &&
      (target.targetKind === "agenda" ||
        target.evidence.some((entry) => evidenceHasTerm(entry, "agenda")))
    );
  });
}

function evidenceHasTerm(entry: string, term: string): boolean {
  const termSet = new Set(
    entry
      .toLocaleLowerCase("en-US")
      .split(/[._:-]+/)
      .filter(Boolean),
  );
  return termSet.has(term);
}
