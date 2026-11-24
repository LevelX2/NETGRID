import {
  ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
  type AiDecisionInput,
  type EngineRandomizedTurnPlanCandidate,
  type EngineRandomizedTurnPlanSelectionCommand,
} from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import type { AiDecisionRuntimeOptions } from "../runtime/choose-ai-action";
import type { TurnPlannerCutoverResult } from "./corp-turn-planner-cutover";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import {
  selectResidentPlanPortfolioExecutor,
  type PendingRunnerCentralAccessVariation,
  type ResidentPlanPortfolio,
} from "./resident-plan-portfolio";

const MAX_LINE_VALUE_GAP = 20;

export type RunnerCentralAccessVariation = {
  opportunityKey: string;
  candidates: EngineRandomizedTurnPlanCandidate[];
  origins: PendingRunnerCentralAccessVariation["origins"];
};

/** Pilot for equally safe, independently executable one-click access lines. */
export function certifyRunnerCentralAccessVariation(params: {
  input: AiDecisionInput;
  cutover: TurnPlannerCutoverResult;
  previous: ResidentPlanPortfolio | undefined;
  runTargets: readonly RunnerRunTargetEvaluation[] | undefined;
}): RunnerCentralAccessVariation | undefined {
  const { input, cutover, previous, runTargets } = params;
  const view = input.playerView;
  if (
    input.side !== "runner" ||
    !runTargets ||
    view.timingPoint !== "runner_action.main" ||
    view.own.clicks !== 1 ||
    view.own.agendaPoints < view.agendaPointsToWin - 2 ||
    view.turnSerial === undefined ||
    view.run !== undefined ||
    view.pendingChoice !== undefined ||
    previous?.turnPlanCommitment?.status === "active" ||
    cutover.head.moduleId !== "runner.pressure_central" ||
    cutover.head.priorityClass !== "P4"
  )
    return undefined;

  const opportunities = (["hq", "rd"] as const).flatMap((serverId) => {
    const server = view.servers.find((entry) => entry.id === serverId);
    const target = runTargets.find(
      (entry) =>
        entry.targetServerId === serverId &&
        entry.accessServerId === serverId &&
        entry.runActionProjection.sourceKind === "basic_action" &&
        entry.knownAccessState === "unknown" &&
        entry.accessPayoff === "unknown" &&
        entry.pathPassability === "reachable" &&
        entry.pathCost === 0 &&
        entry.creditsAfterRun === view.own.credits &&
        entry.routeQuote?.reachability === "guaranteed_access" &&
        entry.routeQuote.fundingGap === 0 &&
        entry.routeQuote.effects.length === 0 &&
        (entry.routeQuote.conditionalRiskReasons?.length ?? 0) === 0 &&
        entry.prerunReserveQuote?.status === "not_required" &&
        entry.accessPayoffContestable !== false &&
        !entry.multiaccessAvailable,
    );
    if (
      !server ||
      server.ice.length !== 0 ||
      server.root.length !== 0 ||
      !target
    )
      return [];

    const action = input.legalActions.find(
      (entry) =>
        entry.actionId === target.actionId &&
        entry.type === "start_run" &&
        entry.source === "basic_action" &&
        entry.side === "runner" &&
        entry.timingPoint === view.timingPoint &&
        entry.expiresAtStateVersion === view.stateVersion &&
        entry.payload?.serverId === serverId &&
        entry.targetRequirements.length === 0 &&
        (entry.choiceRequirements?.length ?? 0) === 0,
    );
    const head = cutover.planner.heads.find(
      (entry) =>
        entry.moduleId === "runner.pressure_central" &&
        (entry.executorPlanInstanceId === undefined ||
          entry.rootPlanInstanceId === entry.executorPlanInstanceId) &&
        entry.priorityClass === "P4" &&
        entry.currentBinding.actionId === action?.actionId &&
        entry.currentBinding.stateVersion === view.stateVersion,
    );
    if (!action || !head) return [];

    const binding = cutover.planner.headBindings.find(
      (entry) => entry.candidateId === head.candidateId,
    );
    const line = cutover.planner.lines.find(
      (entry) =>
        entry.priorityClass === "P4" &&
        entry.steps.length === 1 &&
        entry.steps[0]?.candidateId === head.candidateId &&
        entry.stopReason === "observation_boundary" &&
        entry.priorityCoverage.requiredObligationIds.length === 0 &&
        entry.priorityCoverage.violatedObligationIds.length === 0,
    );
    if (!binding || binding.planInstanceId !== head.rootPlanInstanceId || !line)
      return [];
    return [{ serverId, head, binding, line, actionId: action.actionId }];
  });

  const [left, right] = opportunities;
  if (
    !left ||
    !right ||
    !opportunities.some(
      (entry) => entry.head.candidateId === cutover.head.candidateId,
    ) ||
    !Number.isFinite(left.line.scalarValue) ||
    !Number.isFinite(right.line.scalarValue) ||
    Math.abs(left.line.scalarValue - right.line.scalarValue) >
      MAX_LINE_VALUE_GAP
  )
    return undefined;
  const bestValue = Math.max(left.line.scalarValue, right.line.scalarValue);
  const tied = left.line.scalarValue === right.line.scalarValue;
  return {
    opportunityKey: "runner-central-access-v1:turn:" + view.turnSerial,
    candidates: opportunities.map((entry) => ({
      familyKey: "central:" + entry.serverId,
      lineId: entry.line.lineId,
      actionId: entry.actionId,
      weight: !tied && entry.line.scalarValue === bestValue ? 2 : 1,
    })),
    origins: opportunities.map((entry) => ({
      targetServerId: entry.serverId,
      origin: {
        rootPlanInstanceId: entry.head.rootPlanInstanceId,
        executorInstanceId: entry.binding.planInstanceId,
        selectedActionId: entry.actionId,
        selectedAtStateVersion: view.stateVersion,
        immediateChoicePolicy: "resolve_runner_run_start_order",
        sourceStepId: entry.binding.step.stepId,
        sourceActionType: "start_run",
        continuedThroughStateVersion: view.stateVersion,
      },
    })),
  };
}

export function runnerCentralAccessVariationCommand(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions,
  variation: RunnerCentralAccessVariation,
): EngineRandomizedTurnPlanSelectionCommand {
  const quote =
    input.matchId &&
    options.quoteRandomizedTurnPlanSelection?.({
      schemaVersion: ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
      matchId: input.matchId,
      side: "runner",
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      opportunityKey: variation.opportunityKey,
      candidates: variation.candidates,
    });
  if (!quote || !quote.ok) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: variation.candidates.map(
        (candidate) => candidate.actionId,
      ),
      owner: "rules_contract",
      removalCondition:
        "Revalidate both certified Runner access heads with the atomic Engine TurnPlan selection quote.",
    });
  }
  return { kind: "engine_randomized_turn_plan_selection", quote: quote.quote };
}

/** Consume the exact Engine-selected run origin before opening its run windows. */
export function reconcileRunnerCentralAccessVariation(
  input: AiDecisionInputWithDeckCapabilities,
  previous: ResidentPlanPortfolio | undefined,
): ResidentPlanPortfolio | undefined {
  const pending = previous?.pendingRunnerCentralAccessVariation;
  if (
    !previous ||
    !pending ||
    input.playerView.stateVersion <= previous.stateVersion
  )
    return previous;

  const observed =
    input.observedRandomizedRunnerRunStart ?? input.observedTurnPlanAction;
  const selected = pending.origins.find(
    (entry) =>
      entry.origin.selectedActionId === observed?.actionId &&
      entry.targetServerId === input.playerView.run?.attackedServerId,
  );
  if (
    !observed ||
    !selected ||
    observed.matchId !== input.matchId ||
    observed.side !== "runner" ||
    observed.actionType !== "start_run" ||
    observed.source !== "basic_action" ||
    observed.stateVersionBefore !== previous.stateVersion ||
    observed.stateVersionAfter !== previous.stateVersion + 1 ||
    observed.engineSelectionKey !== pending.engineSelectionKey
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: pending.origins.map(
        (entry) => entry.origin.selectedActionId,
      ),
      owner: "continuation",
      removalCondition:
        "Bind the observed Engine-selected Runner start to the exact preflighted plan and step.",
    });
  }
  const portfolio = { ...previous };
  delete portfolio.pendingRunnerCentralAccessVariation;
  delete portfolio.selectedActionOrigin;
  const assigned = selectResidentPlanPortfolioExecutor({
    portfolio,
    selectedExecutorInstanceId: selected.origin.executorInstanceId,
    timingPoint: input.playerView.timingPoint,
    reason: "executor_selected",
  });
  assigned.selectedActionOrigin = structuredClone(selected.origin);
  return assigned;
}
