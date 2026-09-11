import { type AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

export function resolvePlanBoundRunnerTraceBaseLinkChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith("trace_base_link:")
  ) {
    return undefined;
  }
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { serverId?: unknown };
        traceBaseLinkChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionId: string;
          sourceCardInstanceId?: string;
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const selected = planBoundRunnerTraceBaseLinkOption(context.input, choice);
  const traceId = choice.source.slice("trace_base_link:".length);
  const exactBinding =
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < context.input.playerView.stateVersion &&
    root?.side === "runner" &&
    executor !== undefined &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    executorState.signal?.serverId ===
      context.input.playerView.run?.attackedServerId &&
    context.input.playerView.trace?.traceId === traceId &&
    context.input.playerView.trace.phase === "base_link" &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selected !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (
    !exactBinding ||
    !action ||
    !root ||
    !executor ||
    !executorState ||
    !selected
  ) {
    const failedChecks = [
      ["previous", previous !== undefined],
      ["previous_side", previous?.side === "runner"],
      [
        "previous_state",
        previous !== undefined &&
          previous.stateVersion < context.input.playerView.stateVersion,
      ],
      ["root_side", root?.side === "runner"],
      ["executor", executor !== undefined],
      [
        "executor_kind",
        ["run_window", "central_pressure", "remote_contest"].includes(
          String(executorState?.kind),
        ),
      ],
      [
        "server",
        executorState?.signal?.serverId ===
          context.input.playerView.run?.attackedServerId,
      ],
      ["trace", context.input.playerView.trace?.traceId === traceId],
      ["phase", context.input.playerView.trace?.phase === "base_link"],
      ["selection", selected !== undefined],
      ["action", action !== undefined],
      ["action_source", action?.source === "game_rule"],
      [
        "action_state",
        action?.expiresAtStateVersion === context.input.playerView.stateVersion,
      ],
      ["choice_requirement", requirement?.choiceId === choice.choiceId],
    ]
      .filter(([, valid]) => !valid)
      .map(([name]) => name)
      .join(",");
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition: `Resolve a Trace Base-Link choice only from the active Runner run-plan executor, exact current Trace and complete Engine choice contract. Failed=${failedChecks || "unknown"}.`,
    });
  }
  executorState.traceBaseLinkChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: selected.optionId,
    ...(selected.sourceCardInstanceId
      ? { sourceCardInstanceId: selected.sourceCardInstanceId }
      : {}),
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_trace_base_link_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function planBoundRunnerTraceBaseLinkOption(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): { optionId: string; sourceCardInstanceId?: string } | undefined {
  const pass = choice.options.find((option) => option.id === "pass");
  if (!pass) return undefined;
  const quote = input.playerView.own.runnerTraceSupportQuote;
  const baseline = quote?.baseLinkOptions.find(
    (option) => option.sourceDefinitionId === undefined,
  );
  const baselineCapacity =
    (baseline?.baseLink ?? input.playerView.trace?.runnerLink ?? 0) +
    input.playerView.own.credits -
    (baseline?.activationCost ?? 0);
  const candidates = choice.options
    .flatMap((option) => {
      if (typeof option.value !== "string") return [];
      const sourceCard = (input.playerView.own.rig ?? []).find(
        (card) =>
          card.known &&
          card.instanceId === option.value &&
          typeof card.definitionId === "string",
      );
      if (!sourceCard?.definitionId) return [];
      const support = quote?.baseLinkOptions.find(
        (entry) =>
          entry.sourceDefinitionId === sourceCard.definitionId &&
          entry.safeForAccess &&
          entry.activationCost <= input.playerView.own.credits,
      );
      if (!support) return [];
      return [
        {
          optionId: option.id,
          sourceCardInstanceId: sourceCard.instanceId,
          capacity:
            support.baseLink +
            input.playerView.own.credits -
            support.activationCost,
          activationCost: support.activationCost,
        },
      ];
    })
    .filter((candidate) => candidate.capacity > baselineCapacity)
    .sort(
      (left, right) =>
        right.capacity - left.capacity ||
        left.activationCost - right.activationCost ||
        left.optionId.localeCompare(right.optionId),
    );
  const selected = candidates[0];
  return selected
    ? {
        optionId: selected.optionId,
        sourceCardInstanceId: selected.sourceCardInstanceId,
      }
    : { optionId: pass.id };
}

export function resolvePlanBoundRunnerTraceSuccessCancelChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith("trace_success_cancel:")
  ) {
    return undefined;
  }
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { serverId?: unknown };
        traceSuccessCancelChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionId: string;
          sourceCardInstanceId?: string;
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const selected = planBoundRunnerTraceSuccessCancelOption(
    context.input,
    choice,
  );
  const traceId = choice.source.slice("trace_success_cancel:".length);
  const exactBinding =
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < context.input.playerView.stateVersion &&
    root?.side === "runner" &&
    executor !== undefined &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    executorState.signal?.serverId ===
      context.input.playerView.run?.attackedServerId &&
    context.input.playerView.trace?.traceId === traceId &&
    context.input.playerView.trace.phase === "trace_success_cancel" &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selected !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (
    !exactBinding ||
    !action ||
    !root ||
    !executor ||
    !executorState ||
    !selected
  ) {
    const failedChecks = [
      ["previous", previous !== undefined],
      ["previous_side", previous?.side === "runner"],
      [
        "previous_state",
        previous !== undefined &&
          previous.stateVersion < context.input.playerView.stateVersion,
      ],
      ["root_side", root?.side === "runner"],
      ["executor", executor !== undefined],
      [
        "executor_kind",
        ["run_window", "central_pressure", "remote_contest"].includes(
          String(executorState?.kind),
        ),
      ],
      [
        "server",
        executorState?.signal?.serverId ===
          context.input.playerView.run?.attackedServerId,
      ],
      ["trace", context.input.playerView.trace?.traceId === traceId],
      [
        "phase",
        context.input.playerView.trace?.phase === "trace_success_cancel",
      ],
      ["selection", selected !== undefined],
      ["visibility", choice.visibility === "hidden_info_barrier"],
      ["action", action !== undefined],
      ["action_source", action?.source === "game_rule"],
      [
        "action_state",
        action?.expiresAtStateVersion === context.input.playerView.stateVersion,
      ],
      ["choice_requirement", requirement?.choiceId === choice.choiceId],
    ]
      .filter(([, valid]) => !valid)
      .map(([name]) => name)
      .join(",");
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition: `Resolve a Trace success-cancel choice only from the active Runner run-plan executor, exact current Trace, installed quoted support source and complete Engine choice contract. Failed=${failedChecks || "unknown"}.`,
    });
  }
  executorState.traceSuccessCancelChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: selected.optionId,
    ...(selected.sourceCardInstanceId
      ? { sourceCardInstanceId: selected.sourceCardInstanceId }
      : {}),
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_trace_success_cancel_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function planBoundRunnerTraceSuccessCancelOption(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): { optionId: string; sourceCardInstanceId?: string } | undefined {
  const pass = choice.options.find((option) => option.id === "pass");
  if (!pass) return undefined;
  const quote = input.playerView.own.runnerTraceSupportQuote;
  const candidates = choice.options
    .flatMap((option) => {
      if (typeof option.value !== "string") return [];
      const sourceCard = (input.playerView.own.rig ?? []).find(
        (card) => card.known && card.instanceId === option.value,
      );
      if (!sourceCard) return [];
      const support = quote?.traceSuccessCancelOptions.find(
        (entry) =>
          entry.sourceCardInstanceId === sourceCard.instanceId &&
          entry.activationCost <= input.playerView.own.credits,
      );
      if (!support) return [];
      return [
        {
          optionId: option.id,
          sourceCardInstanceId: sourceCard.instanceId,
          activationCost: support.activationCost,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.activationCost - right.activationCost ||
        left.optionId.localeCompare(right.optionId),
    );
  const selected = candidates[0];
  return selected
    ? {
        optionId: selected.optionId,
        sourceCardInstanceId: selected.sourceCardInstanceId,
      }
    : { optionId: pass.id };
}
