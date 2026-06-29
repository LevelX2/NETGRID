import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { semanticRuntimeCorpEffectiveDefenseContext } from "./semantic-runtime-corp-effective-defense";
import { visibleCardDefinition } from "./card-definition-lookup";
import { rolesMatch } from "./role-match";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

type SemanticRuntimeCorpSafetyGate = {
  allowed: boolean;
  evidence: string[];
};

type SemanticRuntimeCorpRezFloorAssessment = {
  blockedByFloor: boolean;
  evidence: string[];
};

type SemanticRuntimeCorpAdvancementPlacementAssessment = {
  dominatedByBasicAdvance: boolean;
  scoreValue: number;
  evidence: string[];
};

type SemanticRuntimeCorpContestabilityAssessment = {
  contestable: boolean;
  evidence: string[];
};

type CorpBurstEconomyOperation = {
  cost: number;
  gain: number;
  drawCards: number;
  netGain: number;
  actionValue: number;
  evidence: string[];
};

const CORP_IMMEDIATE_ECONOMY_MIN_ACTION_VALUE = 2;
const CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE = 3;

export type SemanticRuntimeCorpScoreDependencies<TConsumer extends string> = {
  actionCreditCost: (action: LegalAction) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpSafetyGate;
  corpAdvanceRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  corpRemoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpRezFloorAssessment | undefined;
  corpCentralRezReserveAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpRezFloorAssessment | undefined;
  corpRemoteScoreContestabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpContestabilityAssessment | undefined;
  corpActionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  corpInstallRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
    roles: string[],
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => number;
  corpScoringWindowAssessment?:
    | ((
        input: AiDecisionInput,
        action: LegalAction,
        roles?: string[],
      ) => CorpScoringWindowAssessment | undefined)
    | undefined;
  corpAdvancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpAdvancementPlacementAssessment | undefined;
  corpHasRemoteInstability: (input: AiDecisionInput) => boolean;
  corpHasRemoteRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpHasCentralRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpTaggedRunnerPayoffPressure: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpTaggedPayoffWindowPassiveActionPenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpPassiveScoreLinePenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function semanticRuntimeCorpScoreComponents<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const credits = input.playerView.own.credits;
  const tacticalGoalFit = corpTacticalGoalFitScoreComponent(
    input,
    action,
    scopeId,
    actionSemanticCandidate,
  );
  if (tacticalGoalFit) components.push(tacticalGoalFit);
  if (action.type === "score_agenda") {
    components.push({
      key: "corp_score_available_agenda",
      label: "Agenda punkten",
      value: 1200,
      reason: "score_agenda",
    });
    const safetyGate = dependencies.corpScoreNowSafetyGate(input, action);
    if (!safetyGate.allowed) {
      components.push({
        key: "corp_scoreline_safety_gate_blocks_doctrine",
        label: "Scoreline-Safety",
        value: -900,
        reason: safetyGate.evidence.join("|"),
      });
    }
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action),
    );
  }
  if (action.type === "advance_card") {
    components.push({
      key: "corp_advance_score_line",
      label: "Advance-Linie",
      value: 600,
      reason: "advance_card",
    });
    const remoteScore = dependencies.corpAdvanceRemoteScore(input, action);
    if (remoteScore !== 0) {
      components.push({
        key: "corp_advance_remote_context",
        label: "Remote-Kontext",
        value: remoteScore,
        reason: scopeId,
      });
    }
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push({
        key: "corp_remote_rez_floor_penalty",
        label: "Remote-Rez-Floor",
        value: -2400,
        reason: rezFloor.evidence.join("|"),
      });
    }
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action),
    );
  }
  if (action.type === "rez_ice") {
    const rezCost = semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    );
    components.push({
      key: "corp_rez_affordability",
      label: "Rez-Kosten zahlbar",
      value: credits >= rezCost ? 750 : -1200,
      reason: `credits:${credits};cost:${rezCost}`,
    });
    const effectiveDefense = semanticRuntimeCorpEffectiveDefenseContext(
      input,
      action,
      actionSemanticCandidate,
      { actionCreditCost: dependencies.actionCreditCost },
    );
    if (
      effectiveDefense?.hasImmediateStopPotential ||
      effectiveDefense?.hasMeaningfulTaxOrDamage
    ) {
      components.push({
        key: "corp_effective_defense_rez_value",
        label: "Wirksame Rez-Verteidigung",
        value: effectiveDefense.hasImmediateStopPotential ? 900 : 450,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    if (effectiveDefense?.postRezAbilityAffordable === true) {
      components.push({
        key: "corp_effective_defense_post_rez_budget",
        label: "Post-Rez-Fähigkeitsbudget",
        value: effectiveDefense.requiresPostRezPaidAbility ? 350 : 0,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    if (effectiveDefense?.zeroEffectRisk) {
      components.push({
        key: "corp_effective_defense_zero_effect_risk",
        label: "Rez ohne wirksame Verteidigung",
        value: -1600,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
  }
  if (action.type === "install_card") {
    const roles = dependencies.rolesForAction(input, action);
    if (dependencies.corpActionIsScoreLine(input, action, roles)) {
      components.push({
        key: "corp_install_score_line",
        label: "Scoring-Aufbau",
        value: 550,
        reason: "score_line",
      });
    }
    if (
      action.payload?.placement === "ice" ||
      rolesMatch(roles, ["ice", "protect"])
    ) {
      components.push({
        key: "corp_install_protection",
        label: "Schutz-Aufbau",
        value: 650,
        reason: "protect_role",
      });
    }
    if (rolesMatch(roles, ["economy"])) {
      components.push({
        key: "corp_install_economy",
        label: "Economy-Aufbau",
        value: 500,
        reason: "economy_role",
      });
    }
    const remoteScore = dependencies.corpInstallRemoteScore(
      input,
      action,
      roles,
      actionSemanticCandidate,
    );
    if (remoteScore !== 0) {
      components.push({
        key: "corp_install_remote_context",
        label: "Installations-Kontext",
        value: remoteScore,
        reason: scopeId,
      });
    }
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action, roles),
    );
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push({
        key: "corp_remote_rez_floor_penalty",
        label: "Remote-Rez-Floor",
        value: -2400,
        reason: rezFloor.evidence.join("|"),
      });
    }
    const centralRezFloor = dependencies.corpCentralRezReserveAssessment(
      input,
      action,
    );
    if (centralRezFloor?.blockedByFloor) {
      components.push({
        key: "corp_central_rez_floor_penalty",
        label: "Zentrale Rez-Reserve",
        value: -2600,
        reason: centralRezFloor.evidence.join("|"),
      });
    }
  }
  const contestableScoreLine =
    dependencies.corpRemoteScoreContestabilityAssessment(input, action);
  if (contestableScoreLine?.contestable) {
    components.push({
      key: "corp_contestable_remote_score_penalty",
      label: "Contestable Remote-Scoreline",
      value: -3000,
      reason: contestableScoreLine.evidence.join("|"),
    });
  }
  const advancementPlacement =
    dependencies.corpAdvancementCounterPlacementAssessment(input, action);
  if (advancementPlacement) {
    components.push({
      key: advancementPlacement.dominatedByBasicAdvance
        ? "corp_advancement_counter_placement_dominated_by_basic_advance"
        : "corp_advancement_counter_placement_incremental_value",
      label: advancementPlacement.dominatedByBasicAdvance
        ? "Basic-Advance-Dominanz"
        : "Advancement-Mehrwert",
      value: advancementPlacement.scoreValue,
      reason: advancementPlacement.evidence.join("|"),
    });
  }
  if (
    action.type !== "score_agenda" &&
    corpActionCandidateHasScoreCloseoutSignal(actionSemanticCandidate)
  ) {
    const hasScoreCloseoutBasis =
      corpInputHasScoreCloseoutBasis(input) ||
      corpActionCandidateTargetsCorpScoreline(actionSemanticCandidate);
    if (hasScoreCloseoutBasis) {
      components.push({
        key: "corp_score_closeout_semantic_candidate",
        label: "Score-Closeout-Semantik",
        value: 1050,
        reason: [
          "score_closeout_signal:true",
          `score_closeout_basis:${hasScoreCloseoutBasis}`,
          `action:${action.type}`,
        ].join("|"),
      });
    }
  }
  const burstEconomyOperation = corpBurstEconomyOperationForAction(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  if (burstEconomyOperation) {
    components.push({
      key: "corp_operation_burst_economy",
      label: "Immediate-Economy-Operation",
      value: corpImmediateEconomyOperationScoreValue(burstEconomyOperation),
      reason: burstEconomyOperation.evidence.join("|"),
    });
  }
  const burstEconomyThreshold =
    action.type === "gain_credit" && action.source === "basic_action"
      ? corpBurstEconomyThresholdAfterBasicCredit(input)
      : undefined;
  if (burstEconomyThreshold) {
    components.push({
      key: "corp_operation_economy_threshold_funding",
      label: "Operation-Schwelle",
      value: corpImmediateEconomyThresholdScoreValue(burstEconomyThreshold),
      reason: burstEconomyThreshold.evidence.join("|"),
    });
  }
  if (action.type === "gain_credit" && credits < 6) {
    components.push({
      key: "corp_low_credits",
      label: "Credit-Bedarf",
      value: 700,
      reason: `credits:${credits}`,
    });
    if (dependencies.corpHasRemoteInstability(input)) {
      components.push({
        key: "corp_remote_instability_credit_reserve",
        label: "Remote-Reserve",
        value: 250,
        reason: "remote_instability",
      });
    }
    if (dependencies.corpHasRemoteRezFloorFundingNeed(input)) {
      components.push({
        key: "corp_remote_rez_floor_credit_reserve",
        label: "Remote-Rez-Floor",
        value: 900,
        reason: "low_rez_reserve",
      });
    }
    if (dependencies.corpHasCentralRezFloorFundingNeed(input)) {
      components.push({
        key: "corp_central_rez_floor_credit_reserve",
        label: "Zentrale Rez-Reserve",
        value: 900,
        reason: "central_rez_reserve_needed",
      });
    }
  }
  if (action.type === "draw_card" && input.playerView.own.gripOrHq.length < 4) {
    components.push({
      key: "corp_low_hand",
      label: "Handkarten-Bedarf",
      value: 450,
      reason: `hand:${input.playerView.own.gripOrHq.length}`,
    });
    if (dependencies.corpHasRemoteInstability(input)) {
      components.push({
        key: "corp_remote_instability_draw",
        label: "Remote-Nachschub",
        value: 200,
        reason: "remote_instability",
      });
    }
    if (dependencies.corpHasRemoteRezFloorFundingNeed(input)) {
      components.push({
        key: "corp_remote_rez_floor_draw_fallback",
        label: "Remote-Rez-Floor",
        value: 450,
        reason: "low_rez_reserve",
      });
    }
    if (dependencies.corpHasCentralRezFloorFundingNeed(input)) {
      components.push({
        key: "corp_central_rez_floor_draw_fallback",
        label: "Zentrale Rez-Reserve",
        value: 450,
        reason: "central_rez_reserve_needed",
      });
    }
  }
  const taggedRunnerPayoffPressure =
    dependencies.corpTaggedRunnerPayoffPressure(input, action);
  if (taggedRunnerPayoffPressure) components.push(taggedRunnerPayoffPressure);
  const taggedPayoffPassivePenalty =
    dependencies.corpTaggedPayoffWindowPassiveActionPenalty(input, action);
  if (taggedPayoffPassivePenalty) components.push(taggedPayoffPassivePenalty);
  const passiveScoreLinePenalty = dependencies.corpPassiveScoreLinePenalty(
    input,
    action,
  );
  if (passiveScoreLinePenalty) components.push(passiveScoreLinePenalty);
  if (action.type === "decline_rez" && scopeId === "simple_rez") {
    components.push({
      key: "corp_decline_rez_pressure",
      label: "Rez ablehnen",
      value: -700,
      reason: scopeId,
    });
  }
  if (action.type === "end_turn" && input.playerView.own.clicks > 0) {
    components.push({
      key: "corp_unused_actions",
      label: "Ungenutzte Aktionen",
      value: -1400,
      reason: `actions:${input.playerView.own.clicks}`,
    });
  }
  return components;
}

function addCorpScoringWindowEvidenceComponent(
  components: AiDecisionScoreComponent[],
  assessment: CorpScoringWindowAssessment | undefined,
): void {
  if (!assessment) return;
  components.push({
    key: "corp_scoring_window_assessment",
    label: "Scoring-Window",
    value: 0,
    reason: assessment.evidence.join("|"),
  });
}

function corpTacticalGoalFitScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  const goals = corpTacticalGoalsForInput(input);
  if (goals.length === 0) return undefined;
  const goal = highestPriorityCorpGoalForAction(
    goals,
    action,
    scopeId,
    actionSemanticCandidate,
  );
  if (!goal) return undefined;
  return {
    key: "corp_goal_fit_tactical_goal",
    label: "Corp-TacticalGoal",
    value: corpTacticalGoalScoreValue(goal),
    reason: [
      `goal:${goal.goalId}`,
      `family:${goal.family}`,
      `urgency:${goal.urgency ?? "unknown"}`,
      `action:${action.type}`,
      `scope:${scopeId}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
    ].join("|"),
  };
}

function corpTacticalGoalsForInput(
  input: AiDecisionInput,
): readonly TacticalGoalLike[] {
  return (
    (
      input as AiDecisionInput & {
        ownCorpTacticalGoals?: readonly TacticalGoalLike[];
      }
    ).ownCorpTacticalGoals ?? []
  );
}

function semanticRuntimeCorpActionCreditCost<TConsumer extends string>(
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
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

function highestPriorityCorpGoalForAction(
  goals: readonly TacticalGoalLike[],
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): TacticalGoalLike | undefined {
  return goals
    .filter((goal) =>
      corpGoalMatchesAction(goal, action, scopeId, actionSemanticCandidate),
    )
    .sort((left, right) => right.priority - left.priority)[0];
}

function corpGoalMatchesAction(
  goal: TacticalGoalLike,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  switch (goal.goalId) {
    case "corp.tactical.score_closeout":
      return (
        action.type === "score_agenda" ||
        corpActionCandidateHasScoreCloseoutSignal(actionSemanticCandidate)
      );
    case "corp.tactical.advance_scoreline":
      return action.type === "advance_card";
    case "corp.tactical.rez_relevant_ice":
      return action.type === "rez_ice";
    case "corp.tactical.prepare_remote":
    case "corp.tactical.protect_central":
      return action.type === "install_card";
    case "corp.tactical.stabilize_economy":
      return (
        action.type === "gain_credit" ||
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

function corpTacticalGoalScoreValue(goal: TacticalGoalLike): number {
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

function corpActionCandidateHasScoreCloseoutSignal(
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

function corpInputHasScoreCloseoutBasis(input: AiDecisionInput): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  if (
    legalActions.some(
      (candidate) =>
        candidate.side === "corp" &&
        (candidate.type === "score_agenda" ||
          candidate.type === "advance_card"),
    )
  ) {
    return true;
  }
  return (input.playerView.servers ?? []).some((server) =>
    (server.root ?? []).some(
      (card) =>
        card.known !== false &&
        (card.type === "agenda" ||
          typeof card.advancementRequirement === "number"),
    ),
  );
}

function corpBurstEconomyOperationForAction<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): CorpBurstEconomyOperation | undefined {
  if (action.type !== "play_operation") return undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard) return undefined;
  const fallbackCost = semanticRuntimeCorpActionCreditCost(
    dependencies,
    action,
    actionSemanticCandidate,
  );
  const operation = corpBurstEconomyOperationForVisibleCard(
    sourceCard,
    fallbackCost,
  );
  if (!operation) return undefined;
  if (input.playerView.own.credits < operation.cost) return undefined;
  return {
    ...operation,
    evidence: [
      "corp_operation_burst_economy:true",
      ...operation.evidence,
      "play_operation_affordable:true",
    ],
  };
}

function corpBurstEconomyThresholdAfterBasicCredit(
  input: AiDecisionInput,
): CorpBurstEconomyOperation | undefined {
  const credits = input.playerView.own.credits;
  const creditsAfterFunding = credits + 1;
  const bestOperation = input.playerView.own.gripOrHq
    .map((card) => corpBurstEconomyOperationForVisibleCard(card))
    .filter((operation): operation is CorpBurstEconomyOperation => {
      return (
        operation !== undefined &&
        operation.cost > credits &&
        operation.cost <= creditsAfterFunding
      );
    })
    .sort((left, right) => right.actionValue - left.actionValue)[0];
  if (!bestOperation) return undefined;
  return {
    ...bestOperation,
    evidence: [
      "corp_operation_economy_threshold:true",
      `credits_before_funding:${credits}`,
      `credits_after_funding:${creditsAfterFunding}`,
      ...bestOperation.evidence,
    ],
  };
}

function corpBurstEconomyOperationForVisibleCard(
  card: VisibleCard,
  fallbackCost?: number,
): CorpBurstEconomyOperation | undefined {
  if (card.known === false) return undefined;
  const definition = visibleCardDefinition(card);
  const type = card.type ?? definition?.type;
  if (type !== "operation") return undefined;
  if (corpImmediateEconomyOperationHasVisibleDrawback(card, definition)) {
    return undefined;
  }
  const cost =
    positiveOrZeroNumber(card.cost) ??
    positiveOrZeroNumber(definition?.cost) ??
    positiveOrZeroNumber(fallbackCost) ??
    0;
  const rulesText = card.rulesText ?? definition?.rulesText;
  const gain = corpCreditGainFromRulesText(rulesText);
  const drawCards = corpDrawCountFromRulesText(rulesText);
  if (gain <= 0 && drawCards <= 0) return undefined;
  const netGain = gain - cost;
  const actionValue = netGain + drawCards;
  if (actionValue < CORP_IMMEDIATE_ECONOMY_MIN_ACTION_VALUE) return undefined;
  return {
    cost,
    gain,
    drawCards,
    netGain,
    actionValue,
    evidence: [
      `operation_cost:${cost}`,
      `operation_gain:${gain}`,
      `operation_draw:${drawCards}`,
      `burst_economy_net_gain:${netGain}`,
      `operation_action_value:${actionValue}`,
      `operation_economy_tier:${actionValue >= CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE ? "burst" : "efficient"}`,
    ],
  };
}

function corpImmediateEconomyOperationScoreValue(
  operation: CorpBurstEconomyOperation,
): number {
  return operation.actionValue >= CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE
    ? 1350 + operation.actionValue * 180
    : 700 + operation.actionValue * 160;
}

function corpImmediateEconomyThresholdScoreValue(
  operation: CorpBurstEconomyOperation,
): number {
  return operation.actionValue >= CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE
    ? 1200 + operation.actionValue * 160
    : 650 + operation.actionValue * 140;
}

function corpImmediateEconomyOperationHasVisibleDrawback(
  card: VisibleCard,
  definition: ReturnType<typeof visibleCardDefinition>,
): boolean {
  const mechanics = definition?.mechanics ?? [];
  if (
    mechanics.some((mechanic) =>
      ["bad_publicity", "add_bad_publicity"].includes(mechanic),
    )
  ) {
    return true;
  }
  const text = [card.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
  return /\b(?:take|add|gain|suffer)\s+\d+\s+bad publicity\b/i.test(text);
}

function visibleSourceCardForAction(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  ) {
    return undefined;
  }
  return [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ]
    .flat()
    .find((card) => card.instanceId === action.source && card.known);
}

function corpCreditGainFromRulesText(rulesText: string | undefined): number {
  const bracketMatch = rulesText?.match(/\bgain\s+\[(\d+)\](?=\W|$)/i);
  if (bracketMatch) return numberFromDigitOrWord(bracketMatch[1] ?? "");
  const englishMatch = rulesText?.match(
    /\bgain\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+credits?\b/i,
  );
  if (englishMatch) return numberFromDigitOrWord(englishMatch[1] ?? "");
  const germanMatch = rulesText?.match(
    /\berhalte\s+(eins|eine|einen|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|\d+)\s+credits?\b/i,
  );
  if (germanMatch) return numberFromDigitOrWord(germanMatch[1] ?? "");
  return 0;
}

function corpDrawCountFromRulesText(rulesText: string | undefined): number {
  const englishMatch = rulesText?.match(
    /\bdraw\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?\b/i,
  );
  if (englishMatch) return numberFromDigitOrWord(englishMatch[1] ?? "");
  const germanMatch = rulesText?.match(
    /\bziehe\s+(eins|eine|einen|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|\d+)\s+karten?\b/i,
  );
  if (germanMatch) return numberFromDigitOrWord(germanMatch[1] ?? "");
  return 0;
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

function positiveOrZeroNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function corpActionCandidateTargetsCorpScoreline(
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
        target.evidence.some((entry) => evidenceHasTerm(entry, "agenda")) ||
        target.evidence.some((entry) => evidenceHasTerm(entry, "scoreline")))
    );
  });
}

function evidenceHasTerm(entry: string, term: string): boolean {
  return entry
    .toLocaleLowerCase("en-US")
    .split(/[._:-]+/)
    .includes(term);
}
