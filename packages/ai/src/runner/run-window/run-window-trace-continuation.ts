import type { AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type {
  EngineWindowResolution,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { visibleRunnerTraceSupport } from "../../run-analysis/visible-run-hazards";
import { exactCurrentChoiceAction } from "../../runtime/plan-bound-choice-contract";

type TraceChoicePhase = "base_link" | "trace_success_cancel";

type TraceChoiceBinding = {
  choiceId: string;
  actionId: string;
  selectedOptionId: string;
  sourceCardInstanceId?: string;
  observedAtStateVersion: number;
};

type TraceChoiceExecutorState = {
  kind?: unknown;
  signal?: { serverId?: unknown };
  traceBaseLinkChoiceBinding?: TraceChoiceBinding;
  traceSuccessCancelChoiceBinding?: TraceChoiceBinding;
};

export function resolvePlanBoundRunnerTraceBaseLinkChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  return resolvePlanBoundRunnerTraceChoice(context, previous, "base_link");
}

export function resolvePlanBoundRunnerTraceSuccessCancelChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  return resolvePlanBoundRunnerTraceChoice(
    context,
    previous,
    "trace_success_cancel",
  );
}

function resolvePlanBoundRunnerTraceChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
  phase: TraceChoicePhase,
): EngineWindowResolution | undefined {
  const { input } = context;
  const {
    pendingChoice: choice,
    trace,
    run,
    stateVersion,
    timingPoint,
  } = input.playerView;
  const baseLink = phase === "base_link";
  const prefix = baseLink ? "trace_base_link:" : "trace_success_cancel:";
  if (input.side !== "runner" || !choice?.source.startsWith(prefix))
    return undefined;
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.side === "runner" &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | TraceChoiceExecutorState
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const action = exactCurrentChoiceAction(input, choice);
  const selected = baseLink
    ? planBoundRunnerTraceBaseLinkOption(input, choice)
    : planBoundRunnerTraceSuccessCancelOption(input, choice);
  const failedChecks = [
    [
      "previous",
      previous?.side === "runner" && previous.stateVersion < stateVersion,
    ],
    [
      "root_and_executor",
      root?.side === "runner" &&
        executor &&
        (executor.parentInstanceId === root.instanceId ||
          executor.instanceId === root.instanceId),
    ],
    [
      "executor_kind",
      executorState?.kind === "run_window" ||
        executorState?.kind === "central_pressure" ||
        executorState?.kind === "remote_contest",
    ],
    ["server", run && executorState?.signal?.serverId === run.attackedServerId],
    ["trace", trace?.phase === phase && choice.source === `${prefix}${trace.traceId}`],
    [
      "choice",
      choice.kind === "select_option" &&
        choice.minSelections === 1 &&
        choice.maxSelections === 1 &&
        (baseLink || choice.visibility === "hidden_info_barrier"),
    ],
    ["action", action !== undefined],
    ["selection", selected !== undefined],
  ]
    .filter(([, valid]) => !valid)
    .map(([check]) => check);
  if (
    failedChecks.length > 0 ||
    !action ||
    !root ||
    !executor ||
    !executorState ||
    !selected
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion,
      timingPoint,
      legalActionTypes: input.legalActions.map(({ type }) => type),
      unresolvedActionIds: input.legalActions
        .filter(({ type }) => type === "resolve_choice")
        .map(({ actionId }) => actionId),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "Resolve the current Trace support choice from the active Runner executor and complete Engine offer. Failed=" +
        failedChecks.join(","),
    });
  }
  const binding: TraceChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: selected.optionId,
    ...(selected.sourceCardInstanceId
      ? { sourceCardInstanceId: selected.sourceCardInstanceId }
      : {}),
    observedAtStateVersion: stateVersion,
  };
  if (baseLink) executorState.traceBaseLinkChoiceBinding = binding;
  else executorState.traceSuccessCancelChoiceBinding = binding;
  return {
    actionId: action.actionId,
    reasonCode: baseLink
      ? "plan_bound_runner_trace_base_link_choice"
      : "plan_bound_runner_trace_success_cancel_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion,
      timingPoint,
    },
  };
}

function planBoundRunnerTraceBaseLinkOption(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): { optionId: string; sourceCardInstanceId?: string } | undefined {
  const pass = choice.options.find(
    (option) => option.id === "pass" && option.selectable !== false,
  );
  if (!pass) return undefined;
  const quote = input.playerView.own.runnerTraceSupportQuote;
  const baseline = quote?.baseLinkOptions.find(
    (option) => option.sourceDefinitionId === undefined,
  );
  const traceRulesProfile = input.playerView.trace?.profile;
  if (!quote || !baseline || traceRulesProfile === undefined) return undefined;
  const excludeStealthCredits =
    input.playerView.servers
      .find(({ id }) => id === input.playerView.run?.attackedServerId)
      ?.statuses?.some(
        (status) =>
          status.kind === "run_payment_restriction" &&
          status.restriction === "runner_stealth_bit_payment_sources",
      ) === true;
  const capacity = (baseLink: typeof baseline) =>
    visibleRunnerTraceSupport(
      { ...quote, baseLinkOptions: [baseLink] },
      input.playerView.own.credits,
      input.playerView.run?.runTraceLinkBonus ?? 0,
      { traceRulesProfile, excludeStealthCredits },
    ).runnerTraceCapacity;
  const baselineCapacity = capacity(baseline);
  const candidates = choice.options
    .flatMap((option) => {
      if (option.selectable === false || typeof option.value !== "string")
        return [];
      const sourceCard = (input.playerView.own.rig ?? []).find(
        (card) =>
          card.known &&
          card.instanceId === option.value &&
          typeof card.definitionId === "number",
      );
      if (!sourceCard?.definitionId) return [];
      const support = quote.baseLinkOptions.find(
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
          capacity: capacity(support),
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

function planBoundRunnerTraceSuccessCancelOption(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): { optionId: string; sourceCardInstanceId?: string } | undefined {
  const pass = choice.options.find(
    (option) => option.id === "pass" && option.selectable !== false,
  );
  if (!pass) return undefined;
  const quote = input.playerView.own.runnerTraceSupportQuote;
  const candidates = choice.options
    .flatMap((option) => {
      if (option.selectable === false || typeof option.value !== "string")
        return [];
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
