import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { TACTICAL_PLAN_SCHEMA_VERSION } from "./tactical-plan-types";
import type {
  PlanProgressionStatus,
  PlanStep,
  TacticalPlan,
  TacticalPlanMemorySnapshot,
  TacticalPlanRuntimeResult,
} from "./tactical-plan-types";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import {
  getPlanPortfolioMemorySnapshot,
  rememberPlanPortfolioSnapshot,
  resetPlanPortfolioMemory,
} from "./plan-portfolio-memory";
import {
  advancePlanPortfolioForSelectedAction,
  planPortfolioEntryForPlan,
} from "./plan-portfolio";
import type { RunnerEconomyPosture } from "../runner-run-target-evaluation";
import {
  runnerSurvivalFlatlineRiskLevelFromPlan,
  runnerSurvivalMinimumCreditsForPlan,
} from "./tactical-plan-runner-survival-progress";

export type PlanContinuityMemorySnapshot = {
  type?: string;
  portfolioRole?: "background";
  portfolioLifecycle?: string;
  actionsUsedThisTurn?: number;
  turnKey?: string;
};

const tacticalPlanMemoryByKey = new Map<string, TacticalPlanMemorySnapshot>();

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
  context: { runnerEconomyPosture?: RunnerEconomyPosture } = {},
): TacticalPlanMemorySnapshot | undefined {
  if (input.playerView.winner !== null) {
    tacticalPlanMemoryByKey.delete(tacticalPlanMemoryKey(input));
    return undefined;
  }
  if (result.planPortfolio) {
    const selectedPortfolioEntry =
      result.selectedPlan &&
      result.selectedStep?.actionCandidateIds.includes(selectedAction.actionId)
        ? planPortfolioEntryForPlan(result.planPortfolio, result.selectedPlan)
        : undefined;
    rememberPlanPortfolioSnapshot(
      input,
      advancePlanPortfolioForSelectedAction(
        result.planPortfolio,
        selectedAction.actionId,
        selectedPortfolioEntry?.portfolioEntryId,
      ),
    );
  }
  const selectedPlan = result.selectedPlan;
  const selectedStep = result.selectedStep;
  if (!selectedPlan || !selectedStep) {
    const key = tacticalPlanMemoryKey(input);
    const previousPlan = tacticalPlanMemoryByKey.get(key);
    if (
      previousPlan &&
      previousCreditBaseGoalIsSatisfied(
        input,
        previousPlan,
        context.runnerEconomyPosture,
      )
    ) {
      tacticalPlanMemoryByKey.delete(key);
    }
    return undefined;
  }
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

function previousCreditBaseGoalIsSatisfied(
  input: AiDecisionInput,
  previousPlan: TacticalPlanMemorySnapshot,
  economyPosture: RunnerEconomyPosture | undefined,
): boolean {
  return (
    input.side === "runner" &&
    previousPlan.type === "runner.build_credit_base" &&
    economyPosture !== undefined &&
    !economyPosture.fundingNeed &&
    input.playerView.own.credits >= economyPosture.desiredCreditReserve
  );
}

export function resetTacticalPlanMemory(): void {
  tacticalPlanMemoryByKey.clear();
  resetPlanPortfolioMemory();
  resetRunnerRunPlanMemory();
  resetStrategicIntentMemory();
}

export function restoreTacticalPlanMemorySnapshot(
  input: AiDecisionInput,
  snapshot: TacticalPlanMemorySnapshot | undefined,
): void {
  const key = tacticalPlanMemoryKey(input);
  if (!snapshot) {
    tacticalPlanMemoryByKey.delete(key);
    return;
  }
  if (
    snapshot.schemaVersion !== TACTICAL_PLAN_SCHEMA_VERSION ||
    snapshot.memoryId !== key ||
    snapshot.side !== input.side ||
    snapshot.updatedAtStateVersion > input.playerView.stateVersion
  ) {
    throw new Error("invalid_tactical_plan_memory_checkpoint");
  }
  tacticalPlanMemoryByKey.set(key, structuredClone(snapshot));
}

export function getPlanContinuityMemorySnapshot(
  input: AiDecisionInput,
): TacticalPlanMemorySnapshot | PlanContinuityMemorySnapshot | undefined {
  const bankBackground = getPlanPortfolioMemorySnapshot(
    input,
  )?.backgrounds.find((entry) => entry.planType === "runner.build_credit_bank");
  if (bankBackground) {
    return {
      type: bankBackground.planType,
      portfolioRole: "background",
      portfolioLifecycle: bankBackground.lifecycle,
      actionsUsedThisTurn: bankBackground.cadence.actionsUsedThisTurn,
      turnKey: bankBackground.cadence.turnKey,
    };
  }
  return getTacticalPlanMemorySnapshot(input);
}

function tacticalPlanMemoryKey(input: AiDecisionInput): string {
  return `${tacticalPlanMemoryContextId(input)}:${input.side}:${input.profileId}`;
}

function tacticalPlanMemoryContextId(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}

function samePlanLine(
  plan: TacticalPlan,
  previousPlan: TacticalPlanMemorySnapshot,
): boolean {
  if (plan.type !== previousPlan.type) return false;
  if (!plan.target && !previousPlan.target) return true;
  return (
    plan.target?.kind === previousPlan.target?.kind &&
    plan.target?.id === previousPlan.target?.id
  );
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
  const mappedStatus = planMemoryStatus(params.plan, params.step);
  const noObservableProgress =
    params.planProgressionReason === "no_observable_progress";
  const ttlDecisionsRemaining = noObservableProgress
    ? Math.max(0, (params.previousPlan?.ttlDecisionsRemaining ?? 2) - 1)
    : params.plan.type === "runner.opportunistic_central_run"
      ? mappedStatus === "satisfied"
        ? 0
        : Math.max(1, (params.previousPlan?.ttlDecisionsRemaining ?? 2) - 1)
      : 2;
  const status =
    noObservableProgress && ttlDecisionsRemaining === 0
      ? "abandoned"
      : mappedStatus;
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
    selectedActionType: params.selectedAction.type,
    ...scoreConversionDesiredCountersField(params.plan),
    blockedBy: params.plan.blockers.map((blocker) => blocker.kind),
    ttlDecisionsRemaining,
    planProgressionReason:
      params.planProgressionReason ??
      (params.previousPlan && samePlanLine(params.plan, params.previousPlan)
        ? "continued_previous_plan"
        : "selected_new_plan"),
    progressBaseline: {
      ownCredits: params.input.playerView.own.credits,
      opponentCredits: params.input.playerView.opponent.credits,
      ownAgendaPoints: params.input.playerView.own.agendaPoints,
      opponentAgendaPoints: params.input.playerView.opponent.agendaPoints,
      opponentTags: params.input.playerView.opponent.tags,
      opponentCoreDamage: params.input.playerView.opponent.coreDamage ?? 0,
      ...runnerSurvivalProgressBaseline(params.input, params.plan, params.step),
    },
    ...(params.whyPlanAbandoned
      ? { whyPlanAbandoned: params.whyPlanAbandoned }
      : {}),
    updatedAtStateVersion: params.input.playerView.stateVersion,
  };
}

function runnerSurvivalProgressBaseline(
  input: AiDecisionInput,
  plan: TacticalPlan,
  step: PlanStep,
):
  | Pick<
      NonNullable<TacticalPlanMemorySnapshot["progressBaseline"]>,
      | "ownHandCount"
      | "runnerFlatlineRiskLevel"
      | "runnerSurvivalMinimumCredits"
      | "runnerSurvivalReserveGap"
    >
  | Record<string, never> {
  if (plan.type !== "runner.survival_defense") return {};
  const minimumCredits = runnerSurvivalMinimumCreditsForPlan(plan, step);
  const flatlineRiskLevel = runnerSurvivalFlatlineRiskLevelFromPlan(plan);
  return {
    ownHandCount: input.playerView.own.gripOrHq.length,
    ...(flatlineRiskLevel
      ? { runnerFlatlineRiskLevel: flatlineRiskLevel }
      : {}),
    runnerSurvivalMinimumCredits: minimumCredits,
    runnerSurvivalReserveGap: Math.max(
      0,
      minimumCredits - input.playerView.own.credits,
    ),
  };
}

function scoreConversionDesiredCountersField(
  plan: TacticalPlan,
):
  | Pick<
      TacticalPlanMemorySnapshot,
      "scoreConversionDesiredAdvancementCounters"
    >
  | Record<string, never> {
  if (plan.type !== "corp.create_score_window") return {};
  const prefix = "corp_score_conversion_desired_counters:";
  const raw = plan.evidence
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
  const amount = Number(raw);
  return Number.isInteger(amount) && amount > 0
    ? { scoreConversionDesiredAdvancementCounters: amount }
    : {};
}

function planMemoryStatus(
  plan: TacticalPlan,
  step: PlanStep,
): PlanProgressionStatus {
  if (plan.status === "abandoned") return "abandoned";
  if (plan.status === "blocked") return "blocked";
  if (step.mappingStatus === "matched") {
    if (plan.type === "runner.opportunistic_central_run") {
      return step.kind === "probe_central" ? "satisfied" : "progressing";
    }
    if (plan.type === "runner.cash_out_credit_bank") return "satisfied";
    if (plan.type === "corp.rez_defense") return "satisfied";
    if (
      plan.type === "corp.create_score_window" &&
      step.kind === "score_agenda"
    ) {
      return "satisfied";
    }
    return "progressing";
  }
  return "active";
}
