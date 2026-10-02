import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type {
  EngineWindowResolution,
  PlanSchedulerContext,
  PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerRunWindowSignal } from "../../plans/runner-tactical-plan-contracts";
import {
  type PendingChoice,
  unresolvedChoiceFailure,
} from "../../runtime/plan-bound-choice-contract";

type RunWindowState = { kind: "run_window"; signal: RunnerRunWindowSignal };

export function resolvePlanBoundRunnerRunProgramSearchChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const input = context.input;
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "runner" ||
    !choice?.source.startsWith("p3_38.search_stack_install:")
  )
    return undefined;
  const action = input.legalActions.find(
    (entry) => entry.type === "resolve_choice",
  );
  if (
    !action ||
    !selectedRunnerRunProgramSearchOptionIds(input, action, choice, previous)
  )
    return undefined;
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_run_program_search_choice",
    origin: {
      rootPlanInstanceId: previous!.rootForegroundInstanceId!,
      leafPlanInstanceId: previous!.executorInstanceId!,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
    },
  };
}

export function bindSelectedRunnerRunProgramSearch(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (input.side !== "runner" || result.lane !== "plan") return;
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "runner.convert_run_window",
  );
  const state = executor?.moduleState as RunWindowState | undefined;
  const assessment =
    state?.kind === "run_window"
      ? state.signal.actionAssessments?.[result.route.head.actionId]
      : undefined;
  const binding = assessment?.programSearchCommitment;
  if (!binding) return;
  const action = input.legalActions.find(
    (entry) => entry.actionId === result.route.head.actionId,
  );
  if (
    !executor ||
    executor.executionState !== "executor" ||
    assessment?.admissible !== true ||
    binding.sourceActionId !== action?.actionId ||
    action.type !== "activated_card_ability" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.source !== binding.sourceCardInstanceId ||
    state?.signal.rootPlanInstanceId !==
      result.portfolio.rootForegroundInstanceId ||
    binding.plannedAtStateVersion !== input.playerView.stateVersion ||
    binding.selectedAtStateVersion !== undefined ||
    binding.runId !== input.playerView.run?.runId ||
    binding.serverId !== input.playerView.run.attackedServerId
  )
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((entry) => entry.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "continuation",
      removalCondition:
        "Bind an in-run program search only to its exact active run parent, selected executor, current source action and prequoted target.",
    });
  binding.selectedAtStateVersion = input.playerView.stateVersion;
}

/** Payload materialization only: the run owner chose the target before search. */
export function selectedRunnerRunProgramSearchOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] | undefined {
  if (
    input.side !== "runner" ||
    !choice.source.startsWith("p3_38.search_stack_install:")
  )
    return undefined;
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.convert_run_window",
  );
  if (!executor) {
    if (input.playerView.run)
      throw unresolvedChoiceFailure(
        input,
        action,
        "An active-run program search requires its original run executor and prebound target; it cannot be resolved as an unowned search.",
      );
    return undefined;
  }
  const state = executor.moduleState as RunWindowState | undefined;
  const bindings = Object.values(state?.signal.actionAssessments ?? {}).flatMap(
    (assessment) =>
      assessment.programSearchCommitment?.selectedAtStateVersion !== undefined
        ? [assessment.programSearchCommitment]
        : [],
  );
  const binding = bindings[0];
  const options = choice.options.filter(
    (option) =>
      option.selectable !== false &&
      option.card?.known === true &&
      option.card.definitionId === binding?.targetDefinitionId,
  );
  const requirement = action.choiceRequirements?.[0];
  const exact =
    portfolio &&
    state?.kind === "run_window" &&
    bindings.length === 1 &&
    binding &&
    executor.executionState === "executor" &&
    portfolio.rootForegroundInstanceId === state.signal.rootPlanInstanceId &&
    portfolio.instances.some(
      (instance) => instance.instanceId === portfolio.rootForegroundInstanceId,
    ) &&
    binding.selectedAtStateVersion === binding.plannedAtStateVersion &&
    binding.selectedAtStateVersion === portfolio.stateVersion &&
    input.playerView.stateVersion === binding.selectedAtStateVersion + 1 &&
    input.playerView.run?.runId === binding.runId &&
    input.playerView.run.attackedServerId === binding.serverId &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.side === "runner" &&
    choice.sourceCardInstanceId === binding.sourceCardInstanceId &&
    choice.sourceCardDefinitionId === binding.sourceDefinitionId &&
    choice.kind === "select_cards" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    choice.cardSearchPresentation?.sourceZone === "stack" &&
    choice.cardSearchPresentation.destination === "install_program" &&
    choice.cardSearchPresentation.selectableFilter === "program" &&
    action.type === "resolve_choice" &&
    action.side === "runner" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    options.length > 0 &&
    options.every(
      (option) =>
        requirement.optionIds.includes(option.id) &&
        option.card?.installCost === binding.installCost &&
        option.card.memoryCost === binding.targetMemoryCost &&
        binding.installCost <= input.playerView.own.credits &&
        input.playerView.own.memoryUsed! + binding.targetMemoryCost <=
          input.playerView.own.memoryLimit!,
    );
  if (!exact)
    throw unresolvedChoiceFailure(
      input,
      action,
      "The run search choice must preserve its exact selected source, immediate state version, run parent and prebound funded program; the resolver cannot select a replacement target.",
    );
  return [options.slice().sort((a, b) => a.id.localeCompare(b.id))[0]!.id];
}
