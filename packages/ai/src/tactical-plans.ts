import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import type {
  BreakerCoverageKind,
  DeckCapabilityProfile,
} from "./deck-capabilities";
import { redactedDeckCapabilityFacts } from "./deck-capabilities";
import { evaluateKnownCentralAccessPayoff } from "./known-central-access-payoff";
import { evaluateKnownRemoteAccessPayoff } from "./known-remote-access-payoff";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "./runner-run-target-evaluation";
import {
  redactedRunnerHandDevelopmentFacts,
  type RunnerHandDevelopmentEvaluation,
} from "./runner-hand-development";
import {
  redactedRunnerTacticalGoalFacts,
  type RunnerTacticalGoal,
} from "./runner-tactical-goals";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";

export const TACTICAL_PLAN_SCHEMA_VERSION = "tactical-plan-v1" as const;

export type PlanLifecycle =
  | "proposed"
  | "active"
  | "blocked"
  | "progressing"
  | "satisfied"
  | "failed"
  | "expired"
  | "abandoned";

export type TacticalPlanType =
  | "runner.obtain_breaker_coverage"
  | "runner.contest_remote"
  | "runner.opportunistic_central_run"
  | "runner.develop_hand_card"
  | "runner.build_credit_base"
  | "runner.build_credit_bank"
  | "runner.cash_out_credit_bank"
  | "corp.create_score_window"
  | "corp.build_credit_bank"
  | "corp.rez_defense";

export type PlanStepKind =
  | "install_breaker"
  | "resolve_missing_mu"
  | "pivot_to_alternative"
  | "draw_for_answer"
  | "search_for_answer"
  | "gain_credits"
  | "install_development_card"
  | "build_remote"
  | "protect_remote"
  | "build_rez_reserve"
  | "install_or_prepare_agenda"
  | "build_bank_counter"
  | "cash_out_bank"
  | "run_target"
  | "probe_central"
  | "rez_outer_ice"
  | "advance_score_card"
  | "score_agenda";

export type PlanMappingStatus =
  | "unmapped"
  | "matched"
  | "blocked_no_legal_action"
  | "blocked_missing_capability"
  | "blocked_too_expensive"
  | "blocked_timing"
  | "defer_to_reactive_window";

export type RequiredCapabilityKind =
  | "breaker_coverage"
  | "breaker_wall"
  | "breaker_code_gate"
  | "breaker_sentry"
  | "breaker_ap"
  | "breaker_trace"
  | "breaker_universal"
  | "mu"
  | "credits"
  | "card_draw"
  | "card_search"
  | "server_access"
  | "bank_capacity"
  | "bank_payout"
  | "remote_protection"
  | "agenda_score_window"
  | "rez_reserve"
  | "rez_window";

export type RequiredCapability = {
  capabilityId: string;
  kind: RequiredCapabilityKind;
  side: Side;
  target?: PlanTarget;
  minimumCredits?: number;
  evidence: string[];
};

export type PlanBlockerKind =
  | "missing_breaker_coverage"
  | "missing_wall_coverage"
  | "missing_code_gate_coverage"
  | "missing_sentry_coverage"
  | "missing_ap_coverage"
  | "missing_trace_coverage"
  | "coverage_not_in_deck"
  | "search_target_not_available"
  | "breaker_present_but_unaffordable"
  | "breaker_present_but_mu_blocked"
  | "missing_mu"
  | "too_expensive"
  | "target_unreachable"
  | "bank_tool_not_installed"
  | "bank_empty"
  | "score_window_unprotected"
  | "missing_rez_reserve"
  | "missing_credits"
  | "missing_legal_action"
  | "missing_remote_protection"
  | "timing_window_unavailable"
  | "reactive_window";

export type PlanBlocker = {
  blockerId: string;
  kind: PlanBlockerKind;
  severity: "soft" | "hard";
  target?: PlanTarget;
  removalStepKind?: PlanStepKind;
  evidence: string[];
};

export type PlanTarget = {
  kind: "server" | "card" | "ice" | "capability" | "bank";
  id: string;
  label?: string;
};

export type PlanScoreBreakdown = {
  key: string;
  label: string;
  value: number;
  reason: string;
};

export type PlanStep = {
  stepId: string;
  kind: PlanStepKind;
  desiredActionSemantics: string[];
  requiredCapabilities: RequiredCapability[];
  mappingStatus?: PlanMappingStatus;
  actionCandidateIds: string[];
  rationale: string[];
};

export type TacticalPlan = {
  schemaVersion: typeof TACTICAL_PLAN_SCHEMA_VERSION;
  planId: string;
  side: Side;
  type: TacticalPlanType;
  status: PlanLifecycle;
  priority: number;
  horizonTurns: number;
  target?: PlanTarget;
  requiredCapabilities: RequiredCapability[];
  blockers: PlanBlocker[];
  currentStep: PlanStep;
  nextSteps: PlanStep[];
  evidence: string[];
  scoreBreakdown: PlanScoreBreakdown[];
  createdAtStateVersion: number;
  updatedAtStateVersion: number;
};

export type TacticalPlanBuildContext = {
  input: AiDecisionInput;
  candidates?: readonly ActionSemanticCandidate[];
  previousPlan?: TacticalPlanSnapshot;
  deckCapabilities?: DeckCapabilityProfile;
  runnerStrategicIntent?: RunnerStrategicIntentProfile;
  runnerRunTargetEvaluations?: readonly RunnerRunTargetEvaluation[];
  runnerEconomyPosture?: RunnerEconomyPosture;
  runnerHandDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  runnerTacticalGoals?: readonly RunnerTacticalGoal[];
};

export type PlanProgressionStatus =
  | "active"
  | "blocked"
  | "progressing"
  | "satisfied"
  | "abandoned";

export type TacticalPlanMemorySnapshot = {
  schemaVersion: typeof TACTICAL_PLAN_SCHEMA_VERSION;
  memoryId: string;
  side: Side;
  planId: string;
  type: TacticalPlanType;
  status: PlanProgressionStatus;
  target?: PlanTarget;
  selectedStepKind?: PlanStepKind;
  selectedActionId?: string;
  blockedBy: string[];
  ttlDecisionsRemaining: number;
  planProgressionReason: string;
  whyPlanAbandoned?: string;
  updatedAtStateVersion: number;
};

export type TacticalPlanSnapshot = TacticalPlanMemorySnapshot;

export type PlanStepMappingResult = {
  plan: TacticalPlan;
  step: PlanStep;
  status: PlanMappingStatus;
  actionCandidateIds: string[];
  legalActions: LegalAction[];
  rationale: string[];
};

export type TacticalPlanRuntimeResult = {
  previousPlan?: TacticalPlanMemorySnapshot;
  deckCapabilitiesUsed?: string[];
  runnerStrategicIntentUsed?: string[];
  runnerRunTargetEvaluationsUsed?: string[];
  runnerEconomyPostureUsed?: string[];
  runnerHandDevelopmentEvaluationsUsed?: string[];
  runnerTacticalGoalsUsed?: string[];
  planAlternatives: TacticalPlan[];
  blockedPlans: TacticalPlan[];
  selectedPlan?: TacticalPlan;
  selectedStep?: PlanStep;
  selectedMapping?: PlanStepMappingResult;
  planProgressionReason?: string;
  whyPlanAbandoned?: string;
};

const tacticalPlanMemoryByKey = new Map<string, TacticalPlanMemorySnapshot>();

export function buildTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  return context.input.side === "runner"
    ? buildRunnerTacticalPlans(context)
    : buildCorpTacticalPlans(context);
}

export function evaluateTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlanRuntimeResult {
  const previousPlan = context.previousPlan ?? getTacticalPlanMemorySnapshot(context.input);
  const deckCapabilitiesUsed = context.deckCapabilities
    ? redactedDeckCapabilityFacts(context.deckCapabilities)
    : [];
  const runnerStrategicIntentUsed = context.runnerStrategicIntent
    ? redactedRunnerStrategicIntentFacts(context.runnerStrategicIntent)
    : [];
  const runnerRunTargetEvaluationsUsed = context.runnerRunTargetEvaluations
    ? redactedRunnerRunTargetEvaluationFacts(context.runnerRunTargetEvaluations)
    : [];
  const runnerEconomyPostureUsed = context.runnerEconomyPosture
    ? redactedRunnerEconomyPostureFacts(context.runnerEconomyPosture)
    : [];
  const runnerHandDevelopmentEvaluationsUsed = context.runnerHandDevelopmentEvaluations
    ? redactedRunnerHandDevelopmentFacts(context.runnerHandDevelopmentEvaluations)
    : [];
  const runnerTacticalGoalsUsed = context.runnerTacticalGoals
    ? redactedRunnerTacticalGoalFacts(context.runnerTacticalGoals)
    : [];
  const rawPlans = buildTacticalPlans({
    ...context,
    ...(previousPlan ? { previousPlan } : {}),
  });
  const progression = progressTacticalPlans(rawPlans, previousPlan);
  const planAlternatives = rankTacticalPlans(progression.plans);
  const blockedPlans = planAlternatives.filter((plan) => plan.status === "blocked");
  const candidates = context.candidates ?? [];
  for (const plan of planAlternatives) {
    if (!planCanMapToCurrentAction(plan)) continue;
    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      candidates,
      context.input,
    );
    if (mapping.status === "matched" && mapping.legalActions.length > 0) {
      return {
        ...(previousPlan ? { previousPlan } : {}),
        ...(deckCapabilitiesUsed.length > 0 ? { deckCapabilitiesUsed } : {}),
        ...(runnerStrategicIntentUsed.length > 0 ? { runnerStrategicIntentUsed } : {}),
        ...(runnerRunTargetEvaluationsUsed.length > 0 ? { runnerRunTargetEvaluationsUsed } : {}),
        ...(runnerEconomyPostureUsed.length > 0 ? { runnerEconomyPostureUsed } : {}),
        ...(runnerHandDevelopmentEvaluationsUsed.length > 0
          ? { runnerHandDevelopmentEvaluationsUsed }
          : {}),
        ...(runnerTacticalGoalsUsed.length > 0 ? { runnerTacticalGoalsUsed } : {}),
        planAlternatives,
        blockedPlans,
        selectedPlan: plan,
        selectedStep: mapping.step,
        selectedMapping: mapping,
        ...(progression.planProgressionReason
          ? { planProgressionReason: progression.planProgressionReason }
          : {}),
        ...(progression.whyPlanAbandoned
          ? { whyPlanAbandoned: progression.whyPlanAbandoned }
          : {}),
      };
    }
  }
  return {
    ...(previousPlan ? { previousPlan } : {}),
    ...(deckCapabilitiesUsed.length > 0 ? { deckCapabilitiesUsed } : {}),
    ...(runnerStrategicIntentUsed.length > 0 ? { runnerStrategicIntentUsed } : {}),
    ...(runnerRunTargetEvaluationsUsed.length > 0 ? { runnerRunTargetEvaluationsUsed } : {}),
    ...(runnerEconomyPostureUsed.length > 0 ? { runnerEconomyPostureUsed } : {}),
    ...(runnerHandDevelopmentEvaluationsUsed.length > 0
      ? { runnerHandDevelopmentEvaluationsUsed }
      : {}),
    ...(runnerTacticalGoalsUsed.length > 0 ? { runnerTacticalGoalsUsed } : {}),
    planAlternatives,
    blockedPlans,
    ...(progression.planProgressionReason
      ? { planProgressionReason: progression.planProgressionReason }
      : {}),
    ...(progression.whyPlanAbandoned
      ? { whyPlanAbandoned: progression.whyPlanAbandoned }
      : {}),
  };
}

function redactedRunnerStrategicIntentFacts(
  intent: RunnerStrategicIntentProfile,
): string[] {
  return [
    `runner_strategic_intent:${intent.primaryWinIntent}`,
    ...(intent.executionStyle
      ? [`runner_execution_style:${intent.executionStyle}`]
      : []),
    `runner_setup_engine:${intent.setupEngine.join("|") || "none"}`,
    `runner_pressure_vectors:${intent.pressureVectors.join("|") || "none"}`,
    `runner_risk_profile:${intent.riskProfile.join("|") || "none"}`,
    `runner_rejected_intents:${intent.rejectedIntents.join("|") || "none"}`,
    `runner_intent_confidence:${intent.confidence}`,
  ];
}

function redactedRunnerRunTargetEvaluationFacts(
  evaluations: readonly RunnerRunTargetEvaluation[],
): string[] {
  return evaluations.slice(0, 8).map((evaluation) =>
    [
      `runner_run_target:${evaluation.targetServerId}`,
      `kind:${evaluation.targetKind}`,
      `payoff:${evaluation.accessPayoff}`,
      `known:${evaluation.knownAccessState}`,
      `path:${evaluation.pathPassability}`,
      `credits_after:${evaluation.creditsAfterRun}`,
      `recommendation:${evaluation.recommendation}`,
      `score:${evaluation.score}`,
    ].join("|"),
  );
}

function redactedRunnerEconomyPostureFacts(posture: RunnerEconomyPosture): string[] {
  const creditBase = posture.creditBasePlan;
  return [
    `runner_economy_min_floor:${posture.minimumCreditFloor}`,
    `runner_economy_desired_reserve:${posture.desiredCreditReserve}`,
    `runner_credit_base_recommendation:${creditBase.recommendation}`,
    `runner_credit_base_priority:${creditBase.economyPriority}`,
    `runner_credit_base_blocked_hand_cards:${creditBase.usefulHandCardsBlockedByCredits}`,
    `runner_credit_base_affordable_hand_cards:${creditBase.usefulHandCardsAffordableNow}`,
    ...(creditBase.topBlockedHandCandidate
      ? [
          `runner_credit_base_top_role:${creditBase.topBlockedHandCandidate.developmentRole}`,
          `runner_credit_base_top_need:${creditBase.topBlockedHandCandidate.currentNeed}`,
          `runner_credit_base_top_missing_credits:${creditBase.topBlockedHandCandidate.missingCredits}`,
        ]
      : []),
    `runner_economy_risk_adjusted:${posture.riskAdjustedRunReserve}`,
    `runner_economy_build_before_pressure:${posture.buildEconomyBeforePressure}`,
    `runner_economy_bank_relevant:${posture.bankToolsRelevant}`,
    `runner_economy_funding_need:${posture.fundingNeed}`,
    `runner_economy_recommendation:${posture.recommendation}`,
  ];
}

function planCanMapToCurrentAction(plan: TacticalPlan): boolean {
  return (
    plan.status !== "abandoned" &&
    plan.status !== "expired" &&
    plan.status !== "failed" &&
    plan.status !== "satisfied"
  );
}

export function getTacticalPlanMemorySnapshot(
  input: AiDecisionInput,
): TacticalPlanMemorySnapshot | undefined {
  if (input.playerView.winner !== null) {
    tacticalPlanMemoryByKey.delete(tacticalPlanMemoryKey(input));
    return undefined;
  }
  return tacticalPlanMemoryByKey.get(tacticalPlanMemoryKey(input));
}

export function rememberTacticalPlanRuntime(
  input: AiDecisionInput,
  result: TacticalPlanRuntimeResult,
  selectedAction: LegalAction,
): TacticalPlanMemorySnapshot | undefined {
  if (input.playerView.winner !== null) {
    tacticalPlanMemoryByKey.delete(tacticalPlanMemoryKey(input));
    return undefined;
  }
  const selectedPlan = result.selectedPlan;
  const selectedStep = result.selectedStep;
  if (!selectedPlan || !selectedStep) return undefined;
  const snapshot = createTacticalPlanMemorySnapshot({
    input,
    plan: selectedPlan,
    step: selectedStep,
    selectedAction,
    ...(result.previousPlan ? { previousPlan: result.previousPlan } : {}),
    ...(result.planProgressionReason
      ? { planProgressionReason: result.planProgressionReason }
      : {}),
    ...(result.whyPlanAbandoned
      ? { whyPlanAbandoned: result.whyPlanAbandoned }
      : {}),
  });
  tacticalPlanMemoryByKey.set(tacticalPlanMemoryKey(input), snapshot);
  return snapshot;
}

export function resetTacticalPlanMemory(): void {
  tacticalPlanMemoryByKey.clear();
}

function tacticalPlanMemoryKey(input: AiDecisionInput): string {
  return `${tacticalPlanMemoryContextId(input)}:${input.side}:${input.profileId}`;
}

function tacticalPlanMemoryContextId(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}

function progressTacticalPlans(
  plans: readonly TacticalPlan[],
  previousPlan: TacticalPlanMemorySnapshot | undefined,
): {
  plans: TacticalPlan[];
  planProgressionReason?: string;
  whyPlanAbandoned?: string;
} {
  if (!previousPlan) return { plans: [...plans] };
  const previousCentralProbeSatisfied =
    previousPlan.type === "runner.opportunistic_central_run" &&
    previousPlan.status === "satisfied" &&
    previousPlan.ttlDecisionsRemaining <= 0;
  const continued = plans.map((plan) => {
    if (!samePlanLine(plan, previousPlan)) return plan;
    if (previousCentralProbeSatisfied) {
      return {
        ...plan,
        evidence: [
          ...plan.evidence,
          `previous_plan:${previousPlan.planId}`,
          `plan_progression:${previousPlan.status}->new_plan_required`,
        ],
        scoreBreakdown: [
          ...plan.scoreBreakdown,
          {
            key: "previous_probe_satisfied",
            label: "Previous probe satisfied",
            value: 0,
            reason: previousPlan.planId,
          },
        ],
      } satisfies TacticalPlan;
    }
    return {
      ...plan,
      status: plan.status === "active" ? "progressing" : plan.status,
      priority: plan.priority + 80,
      evidence: [
        ...plan.evidence,
        `previous_plan:${previousPlan.planId}`,
        `plan_progression:${previousPlan.status}->${plan.status}`,
      ],
      scoreBreakdown: [
        ...plan.scoreBreakdown,
        {
          key: "previous_plan_continuity",
          label: "Planfortschreibung",
          value: 80,
          reason: previousPlan.planId,
        },
      ],
    } satisfies TacticalPlan;
  });
  if (
    previousPlan.type === "runner.opportunistic_central_run" &&
    previousPlan.ttlDecisionsRemaining <= 0 &&
    continued.some((plan) => plan.type === "runner.obtain_breaker_coverage")
  ) {
    return {
      plans: continued.map((plan) =>
        plan.type === "runner.opportunistic_central_run"
          ? {
              ...plan,
              status: "abandoned",
              priority: plan.priority - 600,
              evidence: [...plan.evidence, "central_probe_ttl_expired"],
            }
          : plan,
      ),
      planProgressionReason: "previous_central_probe_ttl_expired",
      whyPlanAbandoned: "opportunistic central run was a one-decision probe; returning to blocker plan",
    };
  }
  if (previousCentralProbeSatisfied) {
    return {
      plans: continued,
      planProgressionReason: "previous_central_probe_satisfied",
    };
  }
  return {
    plans: continued,
    planProgressionReason: "previous_plan_considered",
  };
}

function samePlanLine(
  plan: TacticalPlan,
  previousPlan: TacticalPlanMemorySnapshot,
): boolean {
  if (plan.type !== previousPlan.type) return false;
  if (!plan.target && !previousPlan.target) return true;
  return plan.target?.kind === previousPlan.target?.kind &&
    plan.target?.id === previousPlan.target?.id;
}

export function mapPlanStepToLegalActions(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
): PlanStepMappingResult {
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const matchedCandidateIds = candidates
    .filter((candidate) =>
      candidateMatchesStep(
        plan,
        step,
        candidate,
        legalActionsById.get(candidate.actionId),
        input,
      ),
    )
    .map((candidate) => candidate.actionId);
  const legalActions = matchedCandidateIds
    .map((actionId) => legalActionsById.get(actionId))
    .filter((action): action is LegalAction => Boolean(action));
  const status = mappingStatusForStep(step, legalActions);
  const matchedCandidates = candidates.filter((candidate) =>
    matchedCandidateIds.includes(candidate.actionId),
  );
  return {
    plan,
    step: {
      ...step,
      mappingStatus: status,
      actionCandidateIds: matchedCandidateIds,
    },
    status,
    actionCandidateIds: matchedCandidateIds,
    legalActions,
    rationale: [
      ...step.rationale,
      `mapped_candidate_count:${matchedCandidateIds.length}`,
      `mapped_legal_action_count:${legalActions.length}`,
      ...matchedCandidates.slice(0, 4).map(candidateMappingRationale),
    ],
  };
}

function mappingStatusForStep(
  step: PlanStep,
  legalActions: readonly LegalAction[],
): PlanMappingStatus {
  if (legalActions.length > 0) return "matched";
  if (
    step.requiredCapabilities.some(
      (capability) =>
        capability.kind.startsWith("breaker_") ||
        capability.kind === "remote_protection" ||
        capability.kind === "bank_payout",
    )
  ) {
    return "blocked_missing_capability";
  }
  return "blocked_no_legal_action";
}

function candidateMatchesStep(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
  input: AiDecisionInput,
): boolean {
  if (!action) return false;
  if (candidate.actorSide !== plan.side) return false;
  if (
    candidate.primaryProjectionStatus === "blocked" ||
    candidate.primaryProjectionStatus === "hidden_info_blocked"
  ) {
    return false;
  }
  if (step.kind === "install_development_card") {
    return developmentCardStepMatchesAction(plan, action);
  }
  if (step.kind === "install_breaker" && action.type === "install_card") {
    const requiredCoverage = planRequiredBreakerCoverage(plan, step);
    const sourceCard = visibleCardByInstanceId(input.playerView, String(action.source));
    if (!sourceCard && !/breaker|icebreaker|fracter|decoder|killer/i.test(action.label)) {
      return false;
    }
    if (
      sourceCard &&
      !cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
    ) {
      return false;
    }
  }
  if (candidateSemanticsMatchStep(step, candidate)) {
    return candidateTargetMatchesPlan(plan, candidate, action) &&
      bankStepMatchesCandidate(step, candidate, action);
  }
  if (step.desiredActionSemantics.includes(candidate.semanticActionType)) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.actionTacticSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.cardContextSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  return actionTypeMatchesStep(step, candidate.actionType) &&
    candidateTargetMatchesPlan(plan, candidate, action) &&
    bankStepMatchesCandidate(step, candidate, action);
}

function developmentCardStepMatchesAction(
  plan: TacticalPlan,
  action: LegalAction,
): boolean {
  if (
    action.type !== "install_card" &&
    action.type !== "play_event" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  if (plan.target?.kind !== "card") return true;
  return legalActionReferencesCard(action, plan.target.id);
}

function legalActionReferencesCard(action: LegalAction, cardId: string): boolean {
  const payload = action.payload ?? {};
  return (
    action.source === cardId ||
    payload.cardId === cardId ||
    payload.sourceCardId === cardId ||
    payload.targetCardId === cardId ||
    payload.selectedCardId === cardId
  );
}

function candidateMappingRationale(candidate: ActionSemanticCandidate): string {
  return [
    `candidate_match:${candidate.actionId}`,
    `semantic:${candidate.semanticActionType}`,
    ...(candidate.sourceCardId ? [`source:${candidate.sourceCardId}`] : []),
    ...(candidate.abilityId ? [`ability:${candidate.abilityId}`] : []),
    ...(candidate.actionTacticSignals.length > 0
      ? [`tactics:${candidate.actionTacticSignals.slice(0, 4).join(",")}`]
      : []),
  ].join("|");
}

function candidateSemanticsMatchStep(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
): boolean {
  const signalText = candidateSemanticText(candidate);
  switch (step.kind) {
    case "install_breaker":
      return /install\.card/.test(signalText) &&
        /breaker|icebreaker|program/.test(signalText);
    case "search_for_answer":
      return /program_search|breaker_search|search\.stack|search_for_answer|setup\.program_search/.test(signalText);
    case "build_bank_counter":
      return /temporary_resource_bank|counter_bank|charge_bank|build_credit_bank|finite_economy_pool/.test(signalText);
    case "cash_out_bank":
      return /temporary_resource_bank|counter_bank|cash_out|payout|take_bank|finite_economy_pool/.test(signalText);
    case "build_rez_reserve":
      return /economy\.gain_credit|rez_reserve|corp_economy|operation_economy/.test(signalText);
    case "protect_remote":
      return /corp_window\.rez|install\.card|remote_protection|corp_rez_ice/.test(signalText);
    case "advance_score_card":
      return /score\.advance_card|advance\.corp_counter_bank/.test(signalText);
    case "score_agenda":
      return /score\.agenda|score\.action_counter_bank/.test(signalText);
    case "rez_outer_ice":
      return /corp_window\.rez|corp_rez_ice/.test(signalText);
    default:
      return false;
  }
}

function candidateSemanticText(candidate: ActionSemanticCandidate): string {
  return [
    candidate.semanticActionType,
    candidate.sourceCardId,
    candidate.abilityId,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.strategySupport.map((entry) => `${entry.strategyId}:${entry.role}`),
    ...candidate.conditions.map((entry) => entry.kind),
    ...candidate.risks.map((entry) => entry.kind),
    ...candidate.constraints.map((entry) => entry.kind),
    ...candidate.costProfile.additionalCosts,
    ...(candidate.targetContext?.targetProfileMatches.flatMap((entry) => entry.evidence) ?? []),
    ...candidate.evidence,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
}

function planRequiredBreakerCoverage(
  plan: TacticalPlan,
  step: PlanStep,
): RequiredCapabilityKind {
  const capability = [...step.requiredCapabilities, ...plan.requiredCapabilities].find(
    (candidate) => candidate.kind.startsWith("breaker_"),
  );
  return capability?.kind ?? "breaker_coverage";
}

function actionTypeMatchesStep(step: PlanStep, actionType: string): boolean {
  switch (step.kind) {
    case "install_breaker":
      return actionType === "install_card";
    case "resolve_missing_mu":
      return actionType === "install_card" || actionType === "trigger_ability";
    case "pivot_to_alternative":
      return false;
    case "draw_for_answer":
      return actionType === "draw_card";
    case "search_for_answer":
      return (
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability" ||
        actionType === "play_event" ||
        actionType === "draw_card"
      );
    case "gain_credits":
      return actionType === "gain_credit";
    case "install_development_card":
      return (
        actionType === "install_card" ||
        actionType === "play_event" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "build_remote":
    case "protect_remote":
    case "install_or_prepare_agenda":
      return actionType === "install_card";
    case "build_rez_reserve":
      return (
        actionType === "gain_credit" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "build_bank_counter":
    case "cash_out_bank":
      return actionType === "trigger_ability" || actionType === "activated_card_ability";
    case "run_target":
    case "probe_central":
      return actionType === "start_run";
    case "rez_outer_ice":
      return actionType === "rez_ice";
    case "advance_score_card":
      return actionType === "advance_card";
    case "score_agenda":
      return actionType === "score_agenda";
  }
}

function candidateTargetMatchesPlan(
  plan: TacticalPlan,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (!plan.target) return true;
  if (plan.target.kind !== "server") return true;
  const payloadServerId = actionServerId(action);
  if (payloadServerId) return payloadServerId === plan.target.id;
  const selectedServer = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetKind === "server",
  );
  if (selectedServer) return selectedServer.targetId === plan.target.id;
  return !candidate.legalActionRef.originalPayloadKeys.includes("serverId");
}

function bankStepMatchesCandidate(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (step.kind !== "build_bank_counter" && step.kind !== "cash_out_bank") {
    return true;
  }
  const evidence = candidate.evidence.join(" ").toLowerCase();
  const signals = [
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    candidate.semanticActionType,
  ].join(" ").toLowerCase();
  const label = action.label.toLowerCase();
  if (step.kind === "build_bank_counter") {
    return (
      label.includes("auf broker legen") ||
      label.includes("put") && label.includes("bank") ||
      evidence.includes("auf broker legen") ||
      signals.includes("bank") ||
      signals.includes("counter_bank") ||
      signals.includes("temporary_resource_bank")
    );
  }
  return (
    label.includes("von broker nehmen") ||
    label.includes("take") && label.includes("bank") ||
    evidence.includes("von broker nehmen") ||
    signals.includes("cash") ||
    signals.includes("payout") ||
    signals.includes("bank")
  );
}

function buildRunnerTacticalPlans(context: TacticalPlanBuildContext): TacticalPlan[] {
  const input = context.input;
  const previousPlan = context.previousPlan;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  const runnerGoalEvidence = runnerTacticalGoalEvidence(context);
  const remoteRunActions = input.legalActions.filter(
    (action) => action.type === "start_run" && isRemoteServer(actionServerId(action)),
  );
  const noPayoffRemoteRunActions: LegalAction[] = [];
  const noPayoffByActionId = new Map<
    string,
    ReturnType<typeof evaluateKnownRemoteAccessPayoff>
  >();
  for (const action of remoteRunActions) {
    const serverId = actionServerId(action);
    const payoff = evaluateKnownRemoteAccessPayoff(input, serverId);
    if (!payoff.knownNoCurrentPayoff) continue;
    noPayoffRemoteRunActions.push(action);
    noPayoffByActionId.set(action.actionId, payoff);
  }
  const emptyRemoteRunActions = remoteRunActions.filter((action) =>
    !noPayoffRemoteRunActions.includes(action) &&
    remoteRunHasNoRootValue(input.playerView, actionServerId(action)),
  );
  const blockedRemoteRuns = remoteRunActions.filter((action) =>
    !noPayoffRemoteRunActions.includes(action) &&
    !emptyRemoteRunActions.includes(action) &&
    runNeedsBreakerCoverage(input.playerView, actionServerId(action)),
  );
  const centralRunActions = input.legalActions.filter(
    (action) =>
      action.type === "start_run" && isCentralServer(actionServerId(action)),
  );
  const noPayoffCentralRunActions: LegalAction[] = [];
  const noPayoffCentralByActionId = new Map<
    string,
    ReturnType<typeof evaluateKnownCentralAccessPayoff>
  >();
  for (const action of centralRunActions) {
    const serverId = actionServerId(action);
    const payoff = evaluateKnownCentralAccessPayoff(input, serverId);
    if (!payoff.knownNoCurrentPayoff) continue;
    noPayoffCentralRunActions.push(action);
    noPayoffCentralByActionId.set(action.actionId, payoff);
  }
  const blockedCentralRuns = centralRunActions.filter((action) =>
    !noPayoffCentralRunActions.includes(action) &&
    runNeedsBreakerCoverage(input.playerView, actionServerId(action)),
  );
  for (const action of blockedRemoteRuns) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
    const deckCapabilityEvidence = deckCapabilityEvidenceForRequiredCoverage(
      context,
      missingCoverage,
    );
    const coverageStep = runnerBreakerCoverageStep(context, serverId);
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        priority: 920,
        horizonTurns: 2,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `missing_breaker_coverage:${serverId}`,
            kind: "missing_breaker_coverage",
            severity: "soft",
            target: { kind: "server", id: serverId },
            removalStepKind: coverageStep.kind,
            evidence: [
              "visible rezzed ICE path and no visible breaker coverage",
              `missing_coverage:${missingCoverage}`,
              ...deckCapabilityEvidence,
            ],
          },
          ...deckCapabilityBlockersForRequiredCoverage(
            context,
            missingCoverage,
            serverId,
          ),
        ],
        currentStep: coverageStep,
        evidence: [
          `blocked_remote_run_action:${action.actionId}`,
          ...deckCapabilityEvidence,
        ],
        scoreBreakdown: [
          {
            key: "remote_contest_blocked",
            label: "Remote contest blocked",
            value: 920,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
    plans.push(
      createTacticalPlan({
        planId: `runner.obtain_breaker_coverage:${serverId}`,
        side: "runner",
        type: "runner.obtain_breaker_coverage",
        status: coveragePlanStatusForRequiredCoverage(context, missingCoverage),
        priority: 940,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        requiredCapabilities: [
          {
            capabilityId: `breaker_coverage:${serverId}`,
            kind: missingCoverage,
            side: "runner",
            target: { kind: "server", id: serverId },
            evidence: [
              "required to resume blocked remote contest",
              `server:${serverId}`,
            ],
          },
        ],
        currentStep: coverageStep,
        nextSteps: [
          createPlanStep({
            stepId: `runner.contest_remote:${serverId}`,
            kind: "run_target",
            desiredActionSemantics: ["run.start"],
            rationale: ["return to the blocked remote after coverage improves"],
          }),
        ],
        evidence: [
          `unblocks_plan:runner.contest_remote:${serverId}`,
          ...deckCapabilityEvidence,
        ],
        scoreBreakdown: [
          {
            key: "unblocks_remote_contest",
            label: "Unblocks remote contest",
            value: 940,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of noPayoffRemoteRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const payoff = noPayoffByActionId.get(action.actionId);
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "abandoned",
        priority: -680,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `known_remote_no_current_payoff:${serverId}`,
            kind:
              payoff?.payoff === "trash_unaffordable"
                ? "too_expensive"
                : "target_unreachable",
            severity: "hard",
            target: { kind: "server", id: serverId },
            ...(payoff?.payoff === "trash_unaffordable"
              ? { removalStepKind: "gain_credits" as const }
              : {}),
            evidence: [
              "known remote root has no current access payoff",
              ...(payoff?.evidence ?? []),
            ],
          },
        ],
        currentStep: createPlanStep({
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "remote is known from Runner memory and currently has no payoff",
          ],
        }),
        evidence: [
          `known_no_payoff_remote_run_action:${action.actionId}`,
          ...(payoff?.reasons ?? []),
          ...(payoff?.evidence ?? []),
        ],
        scoreBreakdown: [
          {
            key: "remote_known_no_current_payoff",
            label: "Known remote has no current payoff",
            value: -680,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of emptyRemoteRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "abandoned",
        priority: -200,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: createPlanStep({
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: ["remote has no installed root card to access"],
        }),
        evidence: [`empty_remote_root_run_action:${action.actionId}`],
        scoreBreakdown: [
          {
            key: "empty_remote_no_root_value",
            label: "Empty remote has no root value",
            value: -200,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of noPayoffCentralRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const payoff = noPayoffCentralByActionId.get(action.actionId);
    plans.push(
      createTacticalPlan({
        planId: `runner.opportunistic_central_run:${serverId}`,
        side: "runner",
        type: "runner.opportunistic_central_run",
        status: "abandoned",
        priority: -640,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `known_central_no_current_payoff:${serverId}`,
            kind:
              payoff?.payoff === "trash_unaffordable"
                ? "too_expensive"
                : "target_unreachable",
            severity: "hard",
            target: { kind: "server", id: serverId },
            ...(payoff?.payoff === "trash_unaffordable"
              ? { removalStepKind: "gain_credits" as const }
              : {}),
            evidence: [
              "known central access has no current payoff",
              ...(payoff?.evidence ?? []),
            ],
          },
        ],
        currentStep: createPlanStep({
          stepId: `probe_central:${serverId}`,
          kind: "probe_central",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "central top card is known from Runner memory and currently has no payoff",
          ],
        }),
        evidence: [
          `known_no_payoff_central_run_action:${action.actionId}`,
          ...(payoff?.reasons ?? []),
          ...(payoff?.evidence ?? []),
        ],
        scoreBreakdown: [
          {
            key: "central_known_no_current_payoff",
            label: "Known central access has no current payoff",
            value: -640,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of remoteRunActions) {
    const serverId = actionServerId(action);
    if (
      !serverId ||
      blockedRemoteRuns.includes(action) ||
      emptyRemoteRunActions.includes(action) ||
      noPayoffRemoteRunActions.includes(action)
    ) continue;
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "active",
        priority: runnerAdjustedPlanPriority(context, action, 820),
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: runnerRunTargetCurrentStep(context, action, {
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "remote run is legal and no visible coverage blocker was detected",
            ...runnerRunTargetStepRationale(context, action),
          ],
        }),
        evidence: [
          `remote_run_action:${action.actionId}`,
          ...runnerRunTargetPlanEvidence(context, action),
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  for (const action of centralRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    if (noPayoffCentralRunActions.includes(action)) continue;
    if (blockedCentralRuns.includes(action)) {
      const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
      const deckCapabilityEvidence = deckCapabilityEvidenceForRequiredCoverage(
        context,
        missingCoverage,
      );
      const coverageStep = runnerBreakerCoverageStep(context, serverId);
      const basePriority = serverId === "rd" ? 760 : 740;
      plans.push(
        createTacticalPlan({
          planId: `runner.opportunistic_central_run:${serverId}`,
          side: "runner",
          type: "runner.opportunistic_central_run",
          priority: basePriority,
          horizonTurns: 1,
          target: { kind: "server", id: serverId },
          blockers: [
            {
              blockerId: `missing_breaker_coverage:${serverId}`,
              kind: "missing_breaker_coverage",
              severity: "soft",
              target: { kind: "server", id: serverId },
              removalStepKind: coverageStep.kind,
              evidence: [
                "visible rezzed ICE path and no visible breaker coverage",
                `missing_coverage:${missingCoverage}`,
                ...deckCapabilityEvidence,
              ],
            },
            ...deckCapabilityBlockersForRequiredCoverage(
              context,
              missingCoverage,
              serverId,
            ),
          ],
          currentStep: coverageStep,
          evidence: [
            `blocked_central_run_action:${action.actionId}`,
            ...deckCapabilityEvidence,
          ],
          scoreBreakdown: [
            {
              key: "central_run_blocked",
              label: "Central run blocked",
              value: basePriority,
              reason: serverId,
            },
          ],
          stateVersion,
        }),
      );
      plans.push(
        createTacticalPlan({
          planId: `runner.obtain_breaker_coverage:${serverId}`,
          side: "runner",
          type: "runner.obtain_breaker_coverage",
          status: coveragePlanStatusForRequiredCoverage(context, missingCoverage),
          priority: serverId === "rd" ? 900 : 880,
          horizonTurns: 1,
          target: { kind: "server", id: serverId },
          requiredCapabilities: [
            {
              capabilityId: `breaker_coverage:${serverId}`,
              kind: missingCoverage,
              side: "runner",
              target: { kind: "server", id: serverId },
              evidence: [
                "required to resume blocked central pressure",
                `server:${serverId}`,
              ],
            },
          ],
          currentStep: coverageStep,
          nextSteps: [
            createPlanStep({
              stepId: `runner.opportunistic_central_run:${serverId}`,
              kind: "probe_central",
              desiredActionSemantics: ["run.start"],
              rationale: ["return to the blocked central after coverage improves"],
            }),
          ],
          evidence: [
            `unblocks_plan:runner.opportunistic_central_run:${serverId}`,
            ...deckCapabilityEvidence,
          ],
          scoreBreakdown: [
            {
              key: "unblocks_central_pressure",
              label: "Unblocks central pressure",
              value: serverId === "rd" ? 900 : 880,
              reason: serverId,
            },
          ],
          stateVersion,
        }),
      );
      continue;
    }
    plans.push(
      createTacticalPlan({
        planId: `runner.opportunistic_central_run:${serverId}`,
        side: "runner",
        type: "runner.opportunistic_central_run",
        status: "active",
        priority: runnerAdjustedPlanPriority(
          context,
          action,
          serverId === "rd" ? 760 : 740,
        ),
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: runnerRunTargetCurrentStep(context, action, {
          stepId: `probe_central:${serverId}`,
          kind: "probe_central",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "central pressure remains available while blocked plans wait",
            ...runnerRunTargetStepRationale(context, action),
          ],
        }),
        evidence: [
          `central_run_action:${action.actionId}`,
          ...runnerRunTargetPlanEvidence(context, action),
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  plans.push(
    ...runnerHandDevelopmentPlans(context, stateVersion, runnerGoalEvidence),
  );
  plans.push(
    ...runnerCreditBasePlans(context, stateVersion, runnerGoalEvidence),
  );
  const bankBuildActions = input.legalActions.filter(isBankBuildAction);
  const runnerBankToolEvidence = bankToolEvidence(context, "runner");
  const runnerBankPayout = largestBankPayout(context, "runner");
  const runnerFundingNeed = runnerHasConcreteFundingNeed(input, [
    ...blockedRemoteRuns,
    ...blockedCentralRuns,
  ]);
  if (
    bankBuildActions.length > 0 &&
    input.playerView.own.credits >= 4 &&
    !runnerFundingNeed
  ) {
    plans.push(
      createTacticalPlan({
        planId: "runner.build_credit_bank",
        side: "runner",
        type: "runner.build_credit_bank",
        status: "active",
        priority: runnerEconomyGoalPriority(context, 700),
        horizonTurns: 2,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:runner",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "runner.bank_capacity",
              kind: "bank_capacity",
              side: "runner",
              target: { kind: "bank", id: "runner_credit_bank" },
              evidence: runnerBankToolEvidence,
            },
          ],
          rationale: ["credits are stable enough to bank for later plan execution"],
        }),
        evidence: [
          ...bankBuildActions.map((action) => `bank_build_action:${action.actionId}`),
          ...runnerBankToolEvidence,
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  const bankPayoutActions = input.legalActions.filter(isBankPayoutAction);
  const mayCashOutBank =
    bankPayoutActions.length > 0 &&
    (input.playerView.own.credits <= 3 || runnerFundingNeed) &&
    !(
      previousPlan?.type === "runner.build_credit_bank" &&
      input.playerView.own.credits > 3 &&
      !runnerFundingNeed
    );
  if (mayCashOutBank) {
    plans.push(
      createTacticalPlan({
        planId: "runner.cash_out_credit_bank",
        side: "runner",
        type: "runner.cash_out_credit_bank",
        status: "active",
        priority: runnerEconomyGoalPriority(context, 880),
        horizonTurns: 1,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "cash_out_bank:runner",
          kind: "cash_out_bank",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "runner.bank_payout",
              kind: "bank_payout",
              side: "runner",
              target: { kind: "bank", id: "runner_credit_bank" },
              evidence: [
                ...runnerBankToolEvidence,
                ...(runnerBankPayout !== undefined
                  ? [`bank_estimated_payout:${runnerBankPayout}`]
                  : []),
              ],
            },
          ],
          rationale: [
            runnerFundingNeed
              ? "stored credits can fund an active plan"
              : "low credits make stored bank credits immediately useful",
            ...(runnerBankPayout !== undefined
              ? [`bank_estimated_payout:${runnerBankPayout}`]
              : []),
          ],
        }),
        evidence: [
          ...bankPayoutActions.map((action) => `bank_payout_action:${action.actionId}`),
          ...runnerBankToolEvidence,
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  return plans;
}

function runnerHandDevelopmentPlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
): TacticalPlan[] {
  return (context.runnerHandDevelopmentEvaluations ?? [])
    .filter(usefulLegalRunnerHandDevelopment)
    .slice(0, 6)
    .map((evaluation) =>
      createTacticalPlan({
        planId: `runner.develop_hand_card:${evaluation.cardInstanceId}`,
        side: "runner",
        type: "runner.develop_hand_card",
        status: "active",
        priority: runnerHandDevelopmentPlanPriority(context, evaluation),
        horizonTurns: 1,
        target: {
          kind: "card",
          id: evaluation.cardInstanceId,
          label: evaluation.developmentRole,
        },
        currentStep: createPlanStep({
          stepId: `install_development_card:${evaluation.cardInstanceId}`,
          kind: "install_development_card",
          desiredActionSemantics: [
            "install.card",
            "play.runner_event",
            `runner_hand_development.${evaluation.developmentRole}`,
          ],
          rationale: [
            `hand development role ${evaluation.developmentRole} is ${evaluation.currentNeed}`,
            `hand development priority ${evaluation.priority}`,
          ],
        }),
        evidence: [
          `hand_development_role:${evaluation.developmentRole}`,
          `hand_development_need:${evaluation.currentNeed}`,
          `hand_development_fit:${evaluation.strategicFit}`,
          `hand_development_priority:${evaluation.priority}`,
          ...evaluation.evidence.slice(0, 6),
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: [
          {
            key: "runner_hand_development",
            label: "Runner hand development",
            value: runnerHandDevelopmentPlanPriority(context, evaluation),
            reason: evaluation.developmentRole,
          },
        ],
        stateVersion,
      }),
    );
}

function runnerCreditBasePlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
): TacticalPlan[] {
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  if (!creditBase || creditBase.economyPriority === "low") return [];
  if (!context.input.legalActions.some((action) => action.type === "gain_credit")) {
    return [];
  }
  return [
    createTacticalPlan({
      planId: "runner.build_credit_base",
      side: "runner",
      type: "runner.build_credit_base",
      status: "active",
      priority: creditBase.economyPriority === "high" ? 930 : 820,
      horizonTurns: 1,
      target: { kind: "capability", id: "runner_credit_base" },
      currentStep: createPlanStep({
        stepId: "gain_credits:runner_credit_base",
        kind: "gain_credits",
        desiredActionSemantics: ["economy.gain_credit"],
        rationale: [
          `creditbase recommends ${creditBase.recommendation}`,
          `desired reserve ${creditBase.desiredCreditReserve}`,
        ],
      }),
      evidence: [
        `credit_base_recommendation:${creditBase.recommendation}`,
        `credit_base_priority:${creditBase.economyPriority}`,
        `credit_base_funding_need:${creditBase.fundingNeed}`,
        `credit_base_desired_reserve:${creditBase.desiredCreditReserve}`,
        `credit_base_blocked_hand_cards:${creditBase.usefulHandCardsBlockedByCredits}`,
        ...runnerGoalEvidence,
      ],
      scoreBreakdown: [
        {
          key: "runner_credit_base",
          label: "Runner creditbase",
          value: creditBase.economyPriority === "high" ? 930 : 820,
          reason: creditBase.recommendation,
        },
      ],
      stateVersion,
    }),
  ];
}

function usefulLegalRunnerHandDevelopment(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (evaluation.availability !== "legal_now") return false;
  if (!evaluation.legalActionId) return false;
  if (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.developmentRole === "unknown"
  ) {
    return false;
  }
  if (evaluation.currentNeed === "none" || evaluation.currentNeed === "later") {
    return false;
  }
  if (
    evaluation.developmentRole === "defense_support" &&
    evaluation.currentNeed !== "acute"
  ) {
    return false;
  }
  return evaluation.priority >= 500;
}

function runnerHandDevelopmentPlanPriority(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  const roleScore = runnerHandDevelopmentRolePriority(evaluation);
  const needScore = runnerHandDevelopmentNeedPriority(evaluation);
  const fitScore = runnerHandDevelopmentFitPriority(evaluation);
  const creditBaseScore =
    creditBase?.recommendation === "allow_setup_spend" ? 40 :
    creditBase?.recommendation === "preserve_reserve" ? -40 :
    0;
  return Math.max(
    0,
    Math.min(930, roleScore + needScore + fitScore + creditBaseScore),
  );
}

function runnerHandDevelopmentRolePriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.developmentRole) {
    case "breaker_or_rig_piece":
      return 780;
    case "memory_support":
      return 760;
    case "access_payoff":
      return 750;
    case "economy_engine":
    case "bank_tool":
      return 730;
    case "draw_or_search_engine":
      return 700;
    case "run_event":
      return 680;
    case "defense_support":
      return evaluation.currentNeed === "acute" ? 780 : 420;
    case "duplicate_or_low_value":
    case "unknown":
      return 0;
  }
}

function runnerHandDevelopmentNeedPriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.currentNeed) {
    case "acute":
      return 110;
    case "useful_now":
      return 80;
    case "setup":
      return 40;
    case "later":
      return -180;
    case "none":
      return -420;
  }
}

function runnerHandDevelopmentFitPriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.strategicFit) {
    case "strong":
      return 60;
    case "medium":
      return 20;
    case "blocked":
      return -80;
    case "weak":
      return -220;
  }
}

function runnerAdjustedPlanPriority(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  basePriority: number,
): number {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (!evaluation) return basePriority;
  return basePriority + runnerRunTargetPriorityDelta(evaluation);
}

function runnerRunTargetPriorityDelta(
  evaluation: RunnerRunTargetEvaluation,
): number {
  switch (evaluation.recommendation) {
    case "run_now":
      return 180;
    case "run_if_free":
      return 40;
    case "setup_first":
      return -80;
    case "gain_credits_first":
      return -180;
    case "find_breaker_first":
      return -220;
    case "do_not_run_now":
      return -720;
  }
}

function runnerEconomyGoalPriority(
  context: TacticalPlanBuildContext,
  basePriority: number,
): number {
  const posture = context.runnerEconomyPosture;
  if (!posture) return basePriority;
  if (posture.recommendation === "cash_out_bank") return basePriority + 160;
  if (posture.creditBasePlan.recommendation === "fund_useful_hand_card")
    return basePriority + 140;
  if (posture.creditBasePlan.economyPriority === "high") return basePriority + 120;
  if (posture.recommendation === "build_economy") return basePriority + 90;
  return basePriority;
}

function runnerRunTargetEvaluationForAction(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): RunnerRunTargetEvaluation | undefined {
  return context.runnerRunTargetEvaluations?.find(
    (evaluation) => evaluation.actionId === action.actionId,
  );
}

function runnerRunTargetCurrentStep(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  defaultStep: Parameters<typeof createPlanStep>[0],
): PlanStep {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (evaluation?.recommendation === "gain_credits_first") {
    return createPlanStep({
      stepId: `gain_credits_before_run:${evaluation.targetServerId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      rationale: [
        "run target evaluation recommends funding before pressure",
        ...runnerRunTargetStepRationale(context, action),
      ],
    });
  }
  return createPlanStep(defaultStep);
}

function runnerRunTargetPlanEvidence(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): string[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (!evaluation) return [];
  return [
    `runner_run_target_recommendation:${evaluation.recommendation}`,
    `runner_run_target_payoff:${evaluation.accessPayoff}`,
    `runner_run_target_path:${evaluation.pathPassability}`,
    `runner_run_target_score:${evaluation.score}`,
  ];
}

function runnerRunTargetStepRationale(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): string[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (!evaluation) return [];
  return [
    `RunTargetEvaluation recommends ${evaluation.recommendation}.`,
    `Access payoff is ${evaluation.accessPayoff}; path is ${evaluation.pathPassability}.`,
  ];
}

function runnerTacticalGoalEvidence(context: TacticalPlanBuildContext): string[] {
  return (context.runnerTacticalGoals ?? []).slice(0, 6).map((goal) =>
    [
      `runner_tactical_goal:${goal.goalId}`,
      `priority:${goal.priority}`,
      `urgency:${goal.urgency}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
    ].join("|"),
  );
}

function buildCorpTacticalPlans(context: TacticalPlanBuildContext): TacticalPlan[] {
  const input = context.input;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  for (const action of input.legalActions.filter((candidate) => candidate.type === "score_agenda")) {
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: "active",
        priority: 980,
        horizonTurns: 1,
        currentStep: createPlanStep({
          stepId: `score_agenda:${action.actionId}`,
          kind: "score_agenda",
          desiredActionSemantics: ["score.agenda"],
          rationale: ["agenda score action is already legal"],
        }),
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `score_action:${action.actionId}`,
          "corp_score_sequence:score_now",
        ],
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "advance_card")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    const blockers = corpScoreWindowBlockers(input, serverId, action);
    const currentStep = corpScoreWindowCurrentStep(action, blockers);
    if (
      serverId &&
      !remoteIsProtected(input.playerView, serverId) &&
      !advanceCompletesScore(input.playerView, action) &&
      corpHasSafeScoreAlternative(input, action)
    ) {
      continue;
    }
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: blockers.length > 0 ? "blocked" : "active",
        priority: serverId && remoteIsProtected(input.playerView, serverId) ? 900 : 760,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        blockers,
        currentStep,
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `advance_action:${action.actionId}`,
          "corp_score_sequence:advance_score_card",
          ...blockers.flatMap((blocker) => blocker.evidence),
        ],
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "rez_ice")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    plans.push(
      createTacticalPlan({
        planId: `corp.rez_defense:${action.actionId}`,
        side: "corp",
        type: "corp.rez_defense",
        status: "active",
        priority: 930,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        currentStep: createPlanStep({
          stepId: `rez_outer_ice:${action.actionId}`,
          kind: "rez_outer_ice",
          desiredActionSemantics: ["corp_window.rez"],
          rationale: ["rez window can turn existing ICE into defense"],
        }),
        evidence: [`rez_action:${action.actionId}`],
        stateVersion,
      }),
    );
  }
  const bankBuildActions = input.legalActions.filter(isBankBuildAction);
  const corpBankToolEvidence = bankToolEvidence(context, "corp");
  if (
    bankBuildActions.length > 0 &&
    input.playerView.own.credits >= 4 &&
    context.previousPlan?.type !== "corp.build_credit_bank"
  ) {
    plans.push(
      createTacticalPlan({
        planId: "corp.build_credit_bank",
        side: "corp",
        type: "corp.build_credit_bank",
        status: "active",
        priority: 690,
        horizonTurns: 2,
        target: { kind: "bank", id: "corp_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:corp",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "corp.bank_capacity",
              kind: "bank_capacity",
              side: "corp",
              target: { kind: "bank", id: "corp_credit_bank" },
              evidence: corpBankToolEvidence,
            },
          ],
          rationale: ["corp can bank spare credits for future score or rez windows"],
        }),
        evidence: [
          ...bankBuildActions.map((action) => `bank_build_action:${action.actionId}`),
          ...corpBankToolEvidence,
        ],
        stateVersion,
      }),
    );
  }
  return plans;
}

function corpScoreWindowBlockers(
  input: AiDecisionInput,
  serverId: string | undefined,
  action: LegalAction,
): PlanBlocker[] {
  const blockers: PlanBlocker[] = [];
  const target = serverId ? { kind: "server" as const, id: serverId } : undefined;
  if (
    serverId &&
    isRemoteServer(serverId) &&
    !remoteIsProtected(input.playerView, serverId) &&
    !advanceCompletesScore(input.playerView, action)
  ) {
    blockers.push({
      blockerId: `score_window_unprotected:${serverId}`,
      kind: "score_window_unprotected",
      severity: "hard",
      ...(target ? { target } : {}),
      removalStepKind: "protect_remote",
      evidence: [`server:${serverId}`, "remote_protection:false"],
    });
  }
  if (
    serverId &&
    remoteIsProtected(input.playerView, serverId) &&
    serverHasUnrezzedIce(input.playerView, serverId) &&
    input.playerView.own.credits < 4
  ) {
    blockers.push({
      blockerId: `missing_rez_reserve:${serverId}`,
      kind: "missing_rez_reserve",
      severity: "soft",
      ...(target ? { target } : {}),
      removalStepKind: "build_rez_reserve",
      evidence: [
        `server:${serverId}`,
        `corp_credits:${input.playerView.own.credits}`,
        "rez_reserve_below_pragmatic_floor:4",
      ],
    });
  }
  return blockers;
}

function corpScoreWindowCurrentStep(
  action: LegalAction,
  blockers: readonly PlanBlocker[],
): PlanStep {
  if (blockers.some((blocker) => blocker.kind === "score_window_unprotected")) {
    return createPlanStep({
      stepId: `protect_remote:${action.actionId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "corp_window.rez"],
      requiredCapabilities: [
        {
          capabilityId: `remote_protection:${action.actionId}`,
          kind: "remote_protection",
          side: "corp",
          evidence: ["score_window_unprotected"],
        },
      ],
      rationale: ["score window must be protected before advancing safely"],
    });
  }
  if (blockers.some((blocker) => blocker.kind === "missing_rez_reserve")) {
    return createPlanStep({
      stepId: `build_rez_reserve:${action.actionId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
      requiredCapabilities: [
        {
          capabilityId: `rez_reserve:${action.actionId}`,
          kind: "rez_reserve",
          side: "corp",
          evidence: ["missing_rez_reserve"],
        },
      ],
      rationale: ["score window needs a small rez reserve before advancing"],
    });
  }
  return createPlanStep({
    stepId: `advance_score_card:${action.actionId}`,
    kind: "advance_score_card",
    desiredActionSemantics: ["score.advance_card"],
    rationale: ["advance action progresses a visible score window"],
  });
}

function corpScoreWindowSequence(actionId: string): PlanStep[] {
  return [
    createPlanStep({
      stepId: `build_remote:${actionId}`,
      kind: "build_remote",
      desiredActionSemantics: ["install.card"],
      rationale: ["build or reuse a scoring remote"],
    }),
    createPlanStep({
      stepId: `protect_remote:${actionId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "corp_window.rez"],
      requiredCapabilities: [
        {
          capabilityId: `remote_protection:${actionId}`,
          kind: "remote_protection",
          side: "corp",
          evidence: ["score_window_sequence"],
        },
      ],
      rationale: ["protect the scoring remote"],
    }),
    createPlanStep({
      stepId: `build_rez_reserve:${actionId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
      requiredCapabilities: [
        {
          capabilityId: `rez_reserve:${actionId}`,
          kind: "rez_reserve",
          side: "corp",
          evidence: ["score_window_sequence"],
        },
      ],
      rationale: ["hold credits for a relevant rez window"],
    }),
    createPlanStep({
      stepId: `install_or_prepare_agenda:${actionId}`,
      kind: "install_or_prepare_agenda",
      desiredActionSemantics: ["install.card"],
      rationale: ["prepare an agenda or scoreable card"],
    }),
    createPlanStep({
      stepId: `advance_score_card:${actionId}`,
      kind: "advance_score_card",
      desiredActionSemantics: ["score.advance_card"],
      rationale: ["advance the score card"],
    }),
    createPlanStep({
      stepId: `score_agenda:${actionId}`,
      kind: "score_agenda",
      desiredActionSemantics: ["score.agenda"],
      rationale: ["score when the agenda is ready"],
    }),
  ];
}

function serverHasUnrezzedIce(playerView: PlayerView, serverId: string): boolean {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  return server?.ice.some((ice) => ice.rezzed !== true) === true;
}

function bankToolEvidence(
  context: TacticalPlanBuildContext,
  side: Side,
): string[] {
  const tools = side === "runner"
    ? context.deckCapabilities?.runner?.economyBankTools ?? []
    : context.deckCapabilities?.corp?.economyBankTools ?? [];
  if (tools.length === 0) return [];
  const statuses = [...new Set(tools.map((tool) => tool.status))].sort();
  const legalBuild = tools.some((tool) => tool.buildActionLegal);
  const legalCashOut = tools.some((tool) => tool.cashOutActionLegal);
  return [
    `bank_tool_count:${tools.length}`,
    `bank_tool_status:${statuses.join(",")}`,
    `bank_build_legal:${legalBuild}`,
    `bank_cashout_legal:${legalCashOut}`,
    ...(largestBankPayout(context, side) !== undefined
      ? [`bank_estimated_payout:${largestBankPayout(context, side)}`]
      : []),
  ];
}

function largestBankPayout(
  context: TacticalPlanBuildContext,
  side: Side,
): number | undefined {
  const tools = side === "runner"
    ? context.deckCapabilities?.runner?.economyBankTools ?? []
    : context.deckCapabilities?.corp?.economyBankTools ?? [];
  const payouts = tools
    .map((tool) => tool.estimatedPayout ?? tool.currentBankAmount)
    .filter((value): value is number => typeof value === "number");
  if (payouts.length === 0) return undefined;
  return Math.max(...payouts);
}

function runnerBreakerCoverageStep(
  context: TacticalPlanBuildContext,
  serverId: string,
): PlanStep {
  const input = context.input;
  const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
  const deckState = deckCoverageStateForRequiredCoverage(context, missingCoverage);
  const deckInventoryEntry = bestDeckBreakerForRequiredCoverage(
    context,
    missingCoverage,
  );
  const memoryAvailable =
    context.deckCapabilities?.runner?.memoryProfile.memoryAvailable ??
    (input.playerView.own.memoryUsed !== undefined &&
    input.playerView.own.memoryLimit !== undefined
      ? Math.max(0, input.playerView.own.memoryLimit - input.playerView.own.memoryUsed)
      : undefined);
  const matchingHandBreaker = runnerHandBreakerForCoverage(
    input.playerView,
    missingCoverage,
  );
  if (deckState?.installed) {
    return createPlanStep({
      stepId: `run_target:${serverId}`,
      kind: "run_target",
      desiredActionSemantics: ["run.start"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability reports installed ${missingCoverage} coverage; retry the target plan`,
      ],
    });
  }
  if (input.legalActions.some(isBreakerInstallAction(input.playerView, missingCoverage))) {
    return createPlanStep({
      stepId: `install_breaker:${serverId}`,
      kind: "install_breaker",
      desiredActionSemantics: ["install.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `visible install action can add ${missingCoverage} coverage`,
      ],
    });
  }
  if (
    deckState?.inHand &&
    memoryAvailable !== undefined &&
    memoryAvailable <= 0
  ) {
    return createPlanStep({
      stepId: `resolve_missing_mu:${serverId}`,
      kind: "resolve_missing_mu",
      desiredActionSemantics: ["install.card", "memory"],
      requiredCapabilities: [
        breakerCoverageCapability(missingCoverage, serverId),
        {
          capabilityId: `mu:${serverId}`,
          kind: "mu",
          side: "runner",
          target: { kind: "capability", id: "memory" },
          evidence: [`memory_available:${memoryAvailable}`],
        },
      ],
      rationale: [
        `matching ${missingCoverage} breaker is in hand but MU is blocked`,
        "deck_capability:breaker_present_but_mu_blocked",
      ],
    });
  }
  if (
    (matchingHandBreaker || deckState?.inHand) &&
    input.legalActions.some((action) => action.type === "gain_credit")
  ) {
    const installCost = deckInventoryEntry?.installCost ?? matchingHandBreaker?.installCost;
    return createPlanStep({
      stepId: `gain_credits:${serverId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        installCost !== undefined && installCost > input.playerView.own.credits
          ? `matching ${missingCoverage} breaker is already in hand; needs ${installCost} credits before install`
          : `matching ${missingCoverage} breaker is already in hand; credits are needed before install`,
        matchingHandBreaker
          ? `hand_breaker:${matchingHandBreaker.definitionId ?? matchingHandBreaker.title ?? "unknown"}`
          : "deck_capability:breaker_in_hand",
      ],
    });
  }
  if (deckState?.searchableNow) {
    return createPlanStep({
      stepId: `search_for_answer:${serverId}`,
      kind: "search_for_answer",
      desiredActionSemantics: [
        "setup.program_search",
        "breaker_search",
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has ${missingCoverage} coverage and legal search access`,
      ],
    });
  }
  if (deckState?.inDeckKnown) {
    return createPlanStep({
      stepId: `draw_for_answer:${serverId}`,
      kind: "draw_for_answer",
      desiredActionSemantics: ["draw.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has ${missingCoverage} coverage but no legal search access`,
        "deck_capability:draw_only",
      ],
    });
  }
  if (deckState?.missing && deckCapabilityHasDeckSnapshot(context)) {
    return createPlanStep({
      stepId: `pivot_to_alternative:${serverId}`,
      kind: "pivot_to_alternative",
      desiredActionSemantics: [],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has no ${missingCoverage} coverage; do not blind-search`,
        "deck_capability:coverage_not_in_deck",
      ],
    });
  }
  if (
    input.legalActions.some(
      (action) =>
        action.type === "trigger_ability" ||
        action.type === "activated_card_ability" ||
        action.type === "play_event",
    )
  ) {
    return createPlanStep({
      stepId: `search_for_answer:${serverId}`,
      kind: "search_for_answer",
      desiredActionSemantics: [
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
        "draw.card",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `search or event actions may find ${missingCoverage} coverage`,
      ],
    });
  }
  if (input.legalActions.some((action) => action.type === "draw_card")) {
    return createPlanStep({
      stepId: `draw_for_answer:${serverId}`,
      kind: "draw_for_answer",
      desiredActionSemantics: ["draw.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `drawing is the safest available path toward ${missingCoverage} coverage`,
      ],
    });
  }
  return createPlanStep({
    stepId: `gain_credits:${serverId}`,
    kind: "gain_credits",
    desiredActionSemantics: ["economy.gain_credit"],
    requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
    rationale: [
      `no ${missingCoverage} answer action is visible; credits preserve future options`,
    ],
  });
}

function breakerCoverageCapability(
  kind: RequiredCapabilityKind,
  serverId: string,
): RequiredCapability {
  return {
    capabilityId: `breaker_coverage:${serverId}`,
    kind,
    side: "runner",
    target: { kind: "server", id: serverId },
    evidence: [`server:${serverId}`, `missing_coverage:${kind}`],
  };
}

function deckCoverageStateForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
) {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  return coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
}

function bestDeckBreakerForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
) {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  if (!coverage) return undefined;
  const inventory = context.deckCapabilities?.runner?.breakerInventory ?? [];
  return inventory.find((breaker) =>
    breaker.coverage.includes(coverage) ||
    breaker.coverage.includes("universal"),
  );
}

function coveragePlanStatusForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
): PlanLifecycle {
  return deckCoverageStateForRequiredCoverage(context, requiredCoverage)?.missing &&
    deckCapabilityHasDeckSnapshot(context)
    ? "blocked"
    : "active";
}

function deckCapabilityHasDeckSnapshot(context: TacticalPlanBuildContext): boolean {
  return context.deckCapabilities?.evidence.includes("deck_snapshot:present") === true;
}

function deckCapabilityEvidenceForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
): string[] {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  const state = coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
  if (!coverage || !state) return [];
  if (state.missing && !deckCapabilityHasDeckSnapshot(context)) return [];
  const status = state.installed
    ? "installed"
    : state.inHand
      ? "in_hand"
      : state.searchableNow
        ? "in_deck/searchable"
        : state.inDeckKnown
          ? "in_deck/draw_only"
          : "missing";
  return [`deck_capability:breaker_${coverage}=${status}`];
}

function deckCapabilityBlockersForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
  serverId: string,
): PlanBlocker[] {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  const state = coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
  if (!coverage || !state) return [];
  if (state.missing && deckCapabilityHasDeckSnapshot(context)) {
    return [
      {
        blockerId: `deck_missing_${coverage}_coverage:${serverId}`,
        kind: missingCoverageBlockerKind(coverage),
        severity: coverage === "special" || coverage === "subtype_limited" ? "soft" : "hard",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [
          `deck_capability:breaker_${coverage}=missing`,
          "coverage_not_in_deck",
        ],
      },
      {
        blockerId: `coverage_not_in_deck:${serverId}:${coverage}`,
        kind: "coverage_not_in_deck",
        severity: "hard",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [`missing_coverage:${coverage}`],
      },
    ];
  }
  const memoryAvailable = context.deckCapabilities?.runner?.memoryProfile.memoryAvailable;
  if (state.inHand && memoryAvailable !== undefined && memoryAvailable <= 0) {
    return [
      {
        blockerId: `breaker_present_but_mu_blocked:${serverId}:${coverage}`,
        kind: "breaker_present_but_mu_blocked",
        severity: "soft",
        target: { kind: "server", id: serverId },
        removalStepKind: "resolve_missing_mu",
        evidence: [
          `deck_capability:breaker_${coverage}=in_hand`,
          `memory_available:${memoryAvailable}`,
        ],
      },
      {
        blockerId: `missing_mu:${serverId}:${coverage}`,
        kind: "missing_mu",
        severity: "soft",
        target: { kind: "capability", id: "memory" },
        removalStepKind: "resolve_missing_mu",
        evidence: [`memory_available:${memoryAvailable}`],
      },
    ];
  }
  if (state.inDeckKnown && !state.searchableNow && !state.inHand && !state.installed) {
    return [
      {
        blockerId: `search_target_not_available:${serverId}:${coverage}`,
        kind: "search_target_not_available",
        severity: "soft",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [
          `deck_capability:breaker_${coverage}=in_deck/draw_only`,
          "searchable_now:false",
        ],
      },
    ];
  }
  return [];
}

function deckCoverageKindForRequiredCapability(
  requiredCoverage: RequiredCapabilityKind,
): BreakerCoverageKind | undefined {
  switch (requiredCoverage) {
    case "breaker_wall":
      return "wall";
    case "breaker_code_gate":
      return "code_gate";
    case "breaker_sentry":
      return "sentry";
    case "breaker_ap":
      return "ap";
    case "breaker_trace":
      return "trace";
    case "breaker_universal":
      return "universal";
    case "breaker_coverage":
      return "special";
    default:
      return undefined;
  }
}

function missingCoverageBlockerKind(
  coverage: BreakerCoverageKind,
): PlanBlockerKind {
  switch (coverage) {
    case "wall":
      return "missing_wall_coverage";
    case "code_gate":
      return "missing_code_gate_coverage";
    case "sentry":
      return "missing_sentry_coverage";
    case "ap":
      return "missing_ap_coverage";
    case "trace":
      return "missing_trace_coverage";
    case "universal":
    case "subtype_limited":
    case "special":
      return "missing_breaker_coverage";
  }
}

function actionServerId(action: LegalAction): string | undefined {
  const value = action.payload?.serverId;
  return typeof value === "string" ? value : undefined;
}

function isRemoteServer(serverId: string | undefined): boolean {
  return serverId?.startsWith("remote_") === true;
}

function isCentralServer(serverId: string | undefined): boolean {
  return serverId === "hq" || serverId === "rd";
}

function missingBreakerCoverageKind(
  playerView: PlayerView,
  serverId: string,
): RequiredCapabilityKind {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  const rezzedIce = server?.ice.find((ice) => ice.known && ice.rezzed === true);
  if (!rezzedIce) return "breaker_coverage";
  const text = [
    rezzedIce.title,
    rezzedIce.definitionId,
    ...(rezzedIce.subtypes ?? []),
    rezzedIce.rulesText,
  ].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("wall") || text.includes("barrier")) return "breaker_wall";
  if (text.includes("code gate") || text.includes("codegate")) {
    return "breaker_code_gate";
  }
  if (text.includes("sentry")) return "breaker_sentry";
  if (text.includes("ap")) return "breaker_ap";
  if (text.includes("trace")) return "breaker_trace";
  return "breaker_universal";
}

function runNeedsBreakerCoverage(
  playerView: PlayerView,
  serverId: string | undefined,
): boolean {
  if (!serverId) return false;
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  if (!server) return false;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    playerView.own.rig ?? [],
    playerView.own.credits,
    server.root,
  );
  return assessment.assessedKnownIceCount > 0 && !assessment.canReachAccess;
}

function remoteRunHasNoRootValue(
  playerView: PlayerView,
  serverId: string | undefined,
): boolean {
  if (!serverId || !isRemoteServer(serverId)) return false;
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  return (server?.root.length ?? 0) === 0;
}

function isBreakerInstallAction(
  playerView: PlayerView,
  requiredCoverage: RequiredCapabilityKind = "breaker_coverage",
) {
  return (action: LegalAction): boolean => {
    if (action.type !== "install_card") return false;
    const sourceCard = visibleCardByInstanceId(playerView, String(action.source));
    return sourceCard
      ? cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
      : /breaker|fracter|decoder|killer/i.test(action.label);
  };
}

function cardLooksLikeBreaker(card: VisibleCard): boolean {
  return (
    card.type === "program" &&
    ((card.subtypes ?? []).some((subtype) =>
      /breaker|icebreaker|fracter|decoder|killer/i.test(subtype),
    ) ||
      /breaker|icebreaker/i.test(card.title ?? "") ||
      /breaker|icebreaker/i.test(card.definitionId ?? ""))
  );
}

function runnerHandBreakerForCoverage(
  playerView: PlayerView,
  requiredCoverage: RequiredCapabilityKind,
): VisibleCard | undefined {
  return playerView.own.gripOrHq.find((card) =>
    card.known && cardProvidesBreakerCoverage(card, requiredCoverage),
  );
}

function cardProvidesBreakerCoverage(
  card: VisibleCard,
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  if (!cardLooksLikeBreaker(card)) return false;
  if (
    requiredCoverage === "breaker_coverage" ||
    requiredCoverage === "breaker_universal"
  ) {
    return true;
  }
  const text = cardCoverageSearchText(card);
  if (cardLooksLikeUniversalBreaker(text)) return true;
  switch (requiredCoverage) {
    case "breaker_wall":
      return /fracter|wall|barrier/.test(text);
    case "breaker_code_gate":
      return /decoder|code gate|codegate/.test(text);
    case "breaker_sentry":
      return /killer|sentry/.test(text);
    case "breaker_ap":
      return /\bap\b|anti-personnel/.test(text);
    case "breaker_trace":
      return /trace/.test(text);
    default:
      return false;
  }
}

function cardCoverageSearchText(card: VisibleCard): string {
  return [
    card.title,
    card.definitionId,
    ...(card.subtypes ?? []),
    card.rulesText,
  ].filter(Boolean).join(" ").toLowerCase();
}

function cardLooksLikeUniversalBreaker(text: string): boolean {
  return (
    /break (?:an? |one |\d+ )?ice subroutine/.test(text) ||
    /break(?:s)? .*subroutine/.test(text) && !/wall|barrier|code gate|codegate|sentry/.test(text)
  );
}

function isBankBuildAction(action: LegalAction): boolean {
  const label = action.label.toLowerCase();
  return (
    label.includes("auf broker legen") ||
    (label.includes("put") && label.includes("bank")) ||
    (label.includes("bank") && label.includes("counter"))
  );
}

function isBankPayoutAction(action: LegalAction): boolean {
  const label = action.label.toLowerCase();
  return (
    label.includes("von broker nehmen") ||
    (label.includes("take") && label.includes("bank")) ||
    (label.includes("cash") && label.includes("bank"))
  );
}

function runnerHasConcreteFundingNeed(
  input: AiDecisionInput,
  blockedRemoteRuns: readonly LegalAction[],
): boolean {
  if (input.playerView.own.credits <= 3) return true;
  return blockedRemoteRuns.length === 0 &&
    input.legalActions.some(
      (action) =>
        action.type === "start_run" &&
        isRemoteServer(actionServerId(action)) &&
        actionCreditCost(action) >= input.playerView.own.credits,
    );
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
}

function visibleSourceServerId(
  playerView: PlayerView,
  action: LegalAction,
): string | undefined {
  const source = String(action.source);
  for (const server of playerView.servers) {
    if (
      server.root.some((card) => card.instanceId === source) ||
      server.ice.some((card) => card.instanceId === source)
    ) {
      return server.id;
    }
  }
  return undefined;
}

function visibleCardByInstanceId(
  playerView: PlayerView,
  instanceId: string,
): VisibleCard | undefined {
  const ownCards = [
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...(playerView.own.rig ?? []),
    ...playerView.own.scoreArea,
  ];
  const serverCards = playerView.servers.flatMap((server) => [
    ...server.ice,
    ...server.root,
  ]);
  return [...ownCards, ...serverCards].find(
    (card) => card.instanceId === instanceId,
  );
}

function remoteIsProtected(playerView: PlayerView, serverId: string): boolean {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  return (server?.ice.length ?? 0) > 0;
}

function advanceCompletesScore(
  playerView: PlayerView,
  action: LegalAction,
): boolean {
  const sourceCard = visibleCardByInstanceId(playerView, String(action.source));
  if (!sourceCard) return false;
  const currentAdvancement = sourceCard.advancementCounters ?? 0;
  const requirement = sourceCard.advancementRequirement;
  return requirement !== undefined && currentAdvancement + 1 >= requirement;
}

function corpHasSafeScoreAlternative(
  input: AiDecisionInput,
  actionToSkip: LegalAction,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== actionToSkip.actionId &&
      (action.type === "gain_credit" ||
        action.type === "draw_card" ||
        action.type === "install_card" ||
        action.type === "rez_ice" ||
        action.type === "score_agenda"),
  );
}

export function createPlanStep(params: {
  stepId: string;
  kind: PlanStepKind;
  desiredActionSemantics: string[];
  requiredCapabilities?: RequiredCapability[];
  mappingStatus?: PlanMappingStatus;
  actionCandidateIds?: string[];
  rationale?: string[];
}): PlanStep {
  return {
    stepId: params.stepId,
    kind: params.kind,
    desiredActionSemantics: [...params.desiredActionSemantics],
    requiredCapabilities: [...(params.requiredCapabilities ?? [])],
    ...(params.mappingStatus ? { mappingStatus: params.mappingStatus } : {}),
    actionCandidateIds: [...(params.actionCandidateIds ?? [])],
    rationale: [...(params.rationale ?? [])],
  };
}

export function createTacticalPlan(params: {
  planId: string;
  side: Side;
  type: TacticalPlanType;
  status?: PlanLifecycle;
  priority: number;
  horizonTurns: number;
  target?: PlanTarget;
  requiredCapabilities?: RequiredCapability[];
  blockers?: PlanBlocker[];
  currentStep: PlanStep;
  nextSteps?: PlanStep[];
  evidence?: string[];
  scoreBreakdown?: PlanScoreBreakdown[];
  stateVersion: number;
}): TacticalPlan {
  const blockers = [...(params.blockers ?? [])];
  const status = params.status ?? (blockers.length > 0 ? "blocked" : "proposed");
  return {
    schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
    planId: params.planId,
    side: params.side,
    type: params.type,
    status,
    priority: params.priority,
    horizonTurns: params.horizonTurns,
    ...(params.target ? { target: params.target } : {}),
    requiredCapabilities: [...(params.requiredCapabilities ?? [])],
    blockers,
    currentStep: params.currentStep,
    nextSteps: [...(params.nextSteps ?? [])],
    evidence: [...(params.evidence ?? [])],
    scoreBreakdown: [...(params.scoreBreakdown ?? [])],
    createdAtStateVersion: params.stateVersion,
    updatedAtStateVersion: params.stateVersion,
  };
}

export function createTacticalPlanMemorySnapshot(params: {
  input: AiDecisionInput;
  plan: TacticalPlan;
  step: PlanStep;
  selectedAction: LegalAction;
  previousPlan?: TacticalPlanMemorySnapshot;
  planProgressionReason?: string;
  whyPlanAbandoned?: string;
}): TacticalPlanMemorySnapshot {
  const status = planMemoryStatus(params.plan, params.step);
  const ttlDecisionsRemaining =
    params.plan.type === "runner.opportunistic_central_run"
      ? Math.max(0, (params.previousPlan?.ttlDecisionsRemaining ?? 1) - 1)
      : 2;
  return {
    schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
    memoryId: tacticalPlanMemoryKey(params.input),
    side: params.plan.side,
    planId: params.plan.planId,
    type: params.plan.type,
    status,
    ...(params.plan.target ? { target: params.plan.target } : {}),
    selectedStepKind: params.step.kind,
    selectedActionId: params.selectedAction.actionId,
    blockedBy: params.plan.blockers.map((blocker) => blocker.kind),
    ttlDecisionsRemaining,
    planProgressionReason:
      params.planProgressionReason ??
      (params.previousPlan && samePlanLine(params.plan, params.previousPlan)
        ? "continued_previous_plan"
        : "selected_new_plan"),
    ...(params.whyPlanAbandoned
      ? { whyPlanAbandoned: params.whyPlanAbandoned }
      : {}),
    updatedAtStateVersion: params.input.playerView.stateVersion,
  };
}

function planMemoryStatus(
  plan: TacticalPlan,
  step: PlanStep,
): PlanProgressionStatus {
  if (plan.status === "abandoned") return "abandoned";
  if (plan.status === "blocked") return "blocked";
  if (step.mappingStatus === "matched") {
    if (plan.type === "runner.opportunistic_central_run") return "satisfied";
    if (plan.type === "runner.cash_out_credit_bank") return "satisfied";
    if (plan.type === "corp.rez_defense") return "satisfied";
    if (plan.type === "corp.create_score_window" && step.kind === "score_agenda") {
      return "satisfied";
    }
    return "progressing";
  }
  return "active";
}

export function rankTacticalPlans(plans: readonly TacticalPlan[]): TacticalPlan[] {
  return [...plans].sort(
    (left, right) =>
      planStatusRank(right.status) - planStatusRank(left.status) ||
      right.priority - left.priority ||
      left.planId.localeCompare(right.planId),
  );
}

function planStatusRank(status: PlanLifecycle): number {
  switch (status) {
    case "progressing":
      return 7;
    case "active":
      return 6;
    case "proposed":
      return 4;
    case "blocked":
      return 3;
    case "satisfied":
      return 2;
    case "expired":
      return 1;
    case "failed":
      return 0;
    case "abandoned":
      return -1;
  }
}
