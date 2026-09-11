import { type AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { type RunnerTargetedBypassChoiceContinuation } from "./runner-targeted-bypass-plan";
import {
  bindRunnerDevelopmentSearchEngineContinuation,
  bindRunnerEventInstallChoiceEngineContinuation,
} from "../hand-development/development-choice-bindings";
import { preserveSelectedRunnerCoverageBindingAcrossPaymentStep } from "../rig-coverage/coverage-bindings";

export function reconcileSelectedRunnerCostPenaltySupportOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  previous: ResidentPlanPortfolio | undefined,
): void {
  if (input.side !== "runner" || !result.portfolio) return;
  const pending = previous?.pendingRunnerCostPenaltySupportOrigin;
  const selectedActionId =
    result.lane === "plan" ? result.route.head.actionId : result.actionId;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === selectedActionId,
  );
  const continuationActions = input.legalActions.filter(
    (action) => action.payload?.runnerCostPenaltySupportContinuation === true,
  );
  const continuation =
    continuationActions.length === 1 ? continuationActions[0] : undefined;
  const supportWindowId =
    typeof selectedAction?.payload?.costPenaltySupportWindowId === "string"
      ? selectedAction.payload.costPenaltySupportWindowId
      : undefined;
  const supportOriginalActionId =
    typeof selectedAction?.payload?.costPenaltySupportOriginalActionId ===
    "string"
      ? selectedAction.payload.costPenaltySupportOriginalActionId
      : undefined;
  const continuationWindowId =
    typeof continuation?.payload?.runnerCostPenaltySupportWindowId === "string"
      ? continuation.payload.runnerCostPenaltySupportWindowId
      : undefined;
  const selectedPaymentSupport =
    supportWindowId !== undefined && supportOriginalActionId !== undefined;
  const continuationMatchesWindow =
    continuationActions.length === 0 ||
    (continuation !== undefined &&
      continuationWindowId === supportWindowId &&
      continuation.actionId === pending?.originalActionId);

  if (result.lane === "engine_window") {
    if (
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "plan_bound_runner_cost_penalty_support_action",
      )
    ) {
      const directSupportFromOriginalSelection =
        pending?.windowId === undefined &&
        previous !== undefined &&
        previous?.stateVersion === pending?.selectedAtStateVersion &&
        input.playerView.stateVersion === previous.stateVersion + 1;
      if (
        !pending ||
        !selectedAction ||
        !selectedPaymentSupport ||
        supportOriginalActionId !== pending.originalActionId ||
        (pending.windowId !== supportWindowId &&
          !directSupportFromOriginalSelection) ||
        selectedAction.side !== "runner" ||
        selectedAction.type !== "activated_card_ability" ||
        selectedAction.expiresAtStateVersion !==
          input.playerView.stateVersion ||
        result.origin.rootPlanInstanceId !== pending.rootPlanInstanceId ||
        result.origin.leafPlanInstanceId !== pending.executorInstanceId
      ) {
        throw new PlanResolutionFailure("window_origin_missing", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((action) => action.type),
          unresolvedActionIds: selectedAction ? [selectedAction.actionId] : [],
          owner: "continuation",
          ...(pending ? { planInstanceId: pending.executorInstanceId } : {}),
          ...(pending ? { stepId: pending.sourceStepId } : {}),
          removalCondition:
            "Select Runner payment support only from the exact original plan action and current Engine support window.",
        });
      }
      rebaseSelectedRunnerImmediateChoiceOriginForPaymentStep(
        input,
        result,
        previous,
        pending,
      );
      result.portfolio.stateVersion = input.playerView.stateVersion;
      result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
        ...structuredClone(pending),
        windowId: supportWindowId,
      };
      return;
    }
    if (
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code ===
          "plan_bound_runner_cost_penalty_support_continuation",
      )
    ) {
      if (!pending) {
        throw new PlanResolutionFailure("window_origin_missing", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((action) => action.type),
          unresolvedActionIds: selectedAction ? [selectedAction.actionId] : [],
          owner: "continuation",
          removalCondition:
            "Continue a Runner payment window only from its exact persisted original plan action.",
        });
      }
      rebaseSelectedRunnerImmediateChoiceOriginForPaymentStep(
        input,
        result,
        previous,
        pending,
      );
      bindRunnerEventInstallChoiceEngineContinuation(input, result, pending);
      bindRunnerDevelopmentSearchEngineContinuation(input, result, pending);
      result.portfolio.stateVersion = input.playerView.stateVersion;
      delete result.portfolio.pendingRunnerCostPenaltySupportOrigin;
      return;
    }
    const choice = input.playerView.pendingChoice;
    const run = input.playerView.run;
    const rootPlanInstanceId = previous?.rootForegroundInstanceId;
    const executorInstanceId = previous?.executorInstanceId;
    const root = previous?.instances.find(
      (instance) => instance.instanceId === rootPlanInstanceId,
    );
    const executor = previous?.instances.find(
      (instance) => instance.instanceId === executorInstanceId,
    );
    const executorState = executor?.moduleState as
      | {
          kind?: unknown;
          signal?: { windowId?: unknown; serverId?: unknown };
        }
      | undefined;
    const interveningEvents = (input.eventTail ?? []).filter(
      (event) =>
        previous !== undefined &&
        event.stateVersionBefore >= previous.stateVersion &&
        event.stateVersionAfter <= input.playerView.stateVersion,
    );
    const eventsAreContinuous =
      interveningEvents.length >= 2 &&
      interveningEvents[0]?.stateVersionBefore === previous?.stateVersion &&
      interveningEvents.at(-1)?.stateVersionAfter ===
        input.playerView.stateVersion &&
      interveningEvents.every(
        (event, index) =>
          index === 0 ||
          event.stateVersionBefore ===
            interveningEvents[index - 1]?.stateVersionAfter,
      );
    const traceStartIndex = interveningEvents.findIndex(
      (event) =>
        event.publicPayload?.actor === "runner" &&
        event.publicPayload.actionType === "continue_run" &&
        event.publicPayload.effectKind === "trace" &&
        event.publicPayload.traceStarted === true &&
        event.publicPayload.serverId === run?.attackedServerId,
    );
    const traceStart = interveningEvents[traceStartIndex];
    const tracePrefix = interveningEvents.slice(0, traceStartIndex);
    const traceSuffix = interveningEvents.slice(traceStartIndex + 1);
    const traceWindowIsContinuous =
      eventsAreContinuous &&
      traceStartIndex >= 0 &&
      traceStart?.publicPayload?.actor === "runner" &&
      traceStart.publicPayload.actionType === "continue_run" &&
      traceStart.publicPayload.effectKind === "trace" &&
      traceStart.publicPayload.traceStarted === true &&
      traceStart.publicPayload.serverId === run?.attackedServerId &&
      traceSuffix.every(
        (event) =>
          event.publicPayload?.actionType === "resolve_choice" &&
          event.publicPayload.effectKind === "trace",
      );
    const directRunRootPrefixIsBound =
      tracePrefix.length >= 1 &&
      tracePrefix[0]?.publicPayload?.actor === "runner" &&
      tracePrefix[0].publicPayload.actionType === "start_run" &&
      tracePrefix[0].publicPayload.serverId === run?.attackedServerId &&
      tracePrefix
        .slice(1)
        .every(
          (event) =>
            event.publicPayload?.actor === "corp" &&
            event.publicPayload.actionType === "rez_ice" &&
            event.publicPayload.serverId === run?.attackedServerId,
        );
    const requirement = selectedAction?.choiceRequirements?.[0];
    const choiceOptionIds = choice?.options.map((option) => option.id) ?? [];
    const traceOriginOwnedByRunWindowLeaf =
      executor?.moduleId === "runner.convert_run_window" &&
      executor.executionState === "executor" &&
      executor.parentInstanceId === root?.instanceId &&
      executorState?.kind === "run_window" &&
      executorState.signal?.windowId === `run:${run?.runId}` &&
      executorState.signal.serverId === run?.attackedServerId;
    const traceOriginOwnedDirectlyByRunRoot =
      executor?.instanceId === root?.instanceId &&
      executor?.executionState === "executor" &&
      (executor.moduleId === "runner.contest_remote" ||
        executor.moduleId === "runner.pressure_central");
    const exactRunTraceBidOrigin =
      previous !== undefined &&
      rootPlanInstanceId !== undefined &&
      executorInstanceId !== undefined &&
      result.portfolio.rootForegroundInstanceId === rootPlanInstanceId &&
      result.portfolio.executorInstanceId === executorInstanceId &&
      root?.side === "runner" &&
      executor?.side === "runner" &&
      ((traceOriginOwnedByRunWindowLeaf && traceStartIndex === 0) ||
        (traceOriginOwnedDirectlyByRunRoot && directRunRootPrefixIsBound)) &&
      choice?.side === "runner" &&
      choice.kind === "bid_amount" &&
      choice.source.startsWith(`trace:${run?.runId}.`) &&
      choice.stateVersion === input.playerView.stateVersion &&
      selectedAction?.side === "runner" &&
      selectedAction.type === "resolve_choice" &&
      selectedAction.source === "game_rule" &&
      selectedAction.expiresAtStateVersion === input.playerView.stateVersion &&
      selectedAction.choiceRequirements?.length === 1 &&
      requirement?.choiceId === choice.choiceId &&
      requirement.minSelections === choice.minSelections &&
      requirement.maxSelections === choice.maxSelections &&
      requirement.optionIds.length === choiceOptionIds.length &&
      choiceOptionIds.every((optionId) =>
        requirement.optionIds.includes(optionId),
      ) &&
      traceWindowIsContinuous;
    if (exactRunTraceBidOrigin) {
      result.portfolio.stateVersion = input.playerView.stateVersion;
      const staleRunStartOrigin = result.portfolio.selectedActionOrigin;
      if (
        staleRunStartOrigin?.immediateChoicePolicy ===
          "resolve_runner_run_start_order" &&
        staleRunStartOrigin.rootPlanInstanceId === rootPlanInstanceId &&
        staleRunStartOrigin.executorInstanceId === executorInstanceId &&
        (staleRunStartOrigin.sourceActionType === "start_run" ||
          staleRunStartOrigin.sourceActionType === "play_event" ||
          staleRunStartOrigin.sourceActionType === "activated_card_ability") &&
        staleRunStartOrigin.selectedAtStateVersion <
          input.playerView.stateVersion
      ) {
        delete result.portfolio.selectedActionOrigin;
      }
      result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
        rootPlanInstanceId,
        executorInstanceId,
        sourceStepId: result.origin.windowId,
        originalActionId: selectedAction.actionId,
        selectedAtStateVersion: input.playerView.stateVersion,
      };
    }
    return;
  }

  if (selectedPaymentSupport) {
    if (
      !pending ||
      continuationActions.length > 1 ||
      !continuationMatchesWindow ||
      supportWindowId === undefined ||
      supportOriginalActionId !== pending.originalActionId ||
      (pending.windowId !== undefined && pending.windowId !== supportWindowId)
    ) {
      throw new PlanResolutionFailure("window_origin_missing", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: input.legalActions.map(
          (action) => action.actionId,
        ),
        owner: "continuation",
        removalCondition:
          "Use Runner payment support only while preserving the exact original plan action and current Engine support-window id.",
      });
    }
    preserveSelectedRunnerCoverageBindingAcrossPaymentStep(
      input,
      result,
      previous,
      pending,
    );
    preserveSelectedRunnerTargetedBypassBindingAcrossPaymentStep(
      input,
      result,
      previous,
      pending,
    );
    result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
      ...structuredClone(pending),
      windowId: supportWindowId,
    };
    return;
  }

  const creditCost = selectedAction?.costs?.reduce(
    (total, cost) => total + Math.max(0, Number(cost.credits ?? 0)),
    0,
  );
  if (
    selectedAction?.side === "runner" &&
    selectedAction.expiresAtStateVersion === input.playerView.stateVersion &&
    Number.isFinite(creditCost) &&
    (Number(creditCost) > 0 ||
      (selectedAction.type === "continue_run" &&
        input.playerView.run !== undefined))
  ) {
    result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
      rootPlanInstanceId: result.portfolio.rootForegroundInstanceId!,
      executorInstanceId: result.portfolio.executorInstanceId!,
      sourceStepId: result.route.step.stepId,
      originalActionId: selectedAction.actionId,
      selectedAtStateVersion: input.playerView.stateVersion,
    };
    return;
  }
  delete result.portfolio.pendingRunnerCostPenaltySupportOrigin;
}

function preserveSelectedRunnerTargetedBypassBindingAcrossPaymentStep(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "plan" }>,
  previous: ResidentPlanPortfolio | undefined,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const previousExecutor = previous?.instances.find(
    (instance) => instance.instanceId === pending.executorInstanceId,
  );
  if (
    previousExecutor?.moduleId !== "runner.pressure_central" &&
    previousExecutor?.moduleId !== "runner.contest_remote"
  ) {
    return;
  }
  const previousState = previousExecutor.moduleState as
    | {
        kind?: unknown;
        choiceContinuation?: RunnerTargetedBypassChoiceContinuation;
      }
    | undefined;
  const continuation = previousState?.choiceContinuation;
  if (continuation?.family !== "runner_targeted_bypass") return;
  const exactOrigin =
    previous?.side === "runner" &&
    previousExecutor.executionState === "executor" &&
    (previousState?.kind === "central_pressure" ||
      previousState?.kind === "remote_contest") &&
    continuation.ownerModuleId === previousExecutor.moduleId &&
    continuation.ownerDedupeKey === previousExecutor.dedupeKey &&
    continuation.sourceActionId === pending.originalActionId &&
    continuation.selectedActionId === pending.originalActionId &&
    continuation.selectedAtStateVersion === pending.selectedAtStateVersion;
  if (!exactOrigin || !continuation) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "continuation",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Carry the exact selected targeted-bypass plan and its bound Social Engineering continuation through payment support.",
    });
  }
  const existing = result.portfolio.instances.find(
    (instance) => instance.instanceId === previousExecutor.instanceId,
  );
  if (existing) {
    existing.moduleState = structuredClone(previousExecutor.moduleState);
    existing.executionState = "preempted";
    existing.portfolioRole = "background";
    return;
  }
  const preserved = structuredClone(previousExecutor);
  preserved.executionState = "preempted";
  preserved.portfolioRole = "background";
  result.portfolio.instances.push(preserved);
}

function rebaseSelectedRunnerImmediateChoiceOriginForPaymentStep(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "engine_window" }>,
  previous: ResidentPlanPortfolio | undefined,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const selectedOrigin = previous?.selectedActionOrigin;
  if (!selectedOrigin) return;
  const exactOrigin =
    previous.side === "runner" &&
    previous.stateVersion === selectedOrigin.selectedAtStateVersion &&
    input.playerView.stateVersion === previous.stateVersion + 1 &&
    selectedOrigin.selectedActionId === pending.originalActionId &&
    selectedOrigin.rootPlanInstanceId === pending.rootPlanInstanceId &&
    selectedOrigin.executorInstanceId === pending.executorInstanceId &&
    previous.rootForegroundInstanceId === selectedOrigin.rootPlanInstanceId &&
    previous.executorInstanceId === selectedOrigin.executorInstanceId &&
    result.origin.rootPlanInstanceId === pending.rootPlanInstanceId &&
    result.origin.leafPlanInstanceId === pending.executorInstanceId;
  if (!exactOrigin) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "continuation",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Advance a possible immediate Runner choice only with the exact original payment action, root, executor and consecutive Engine state.",
    });
  }
  result.portfolio!.selectedActionOrigin =
    selectedOrigin.immediateChoicePolicy === "resolve_runner_run_start_order"
      ? {
          ...structuredClone(selectedOrigin),
          selectedAtStateVersion: input.playerView.stateVersion,
          continuedThroughStateVersion: input.playerView.stateVersion,
        }
      : {
          ...structuredClone(selectedOrigin),
          selectedAtStateVersion: input.playerView.stateVersion,
        };
}

export function resolvePlanBoundRunnerCostPenaltyContinuation(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  if (context.input.side !== "runner") return undefined;
  const origin = previous?.pendingRunnerCostPenaltySupportOrigin;
  const continuationActions = context.input.legalActions.filter(
    (action) => action.payload?.runnerCostPenaltySupportContinuation === true,
  );
  const boundSupportActions = context.input.legalActions.filter(
    (action) =>
      action.side === "runner" &&
      action.type === "activated_card_ability" &&
      typeof action.payload?.costPenaltySupportWindowId === "string" &&
      action.payload?.costPenaltySupportOriginalActionId ===
        origin?.originalActionId,
  );
  if (continuationActions.length === 0) {
    if (boundSupportActions.length !== 1) return undefined;
    const action = boundSupportActions[0]!;
    const windowId = action.payload!.costPenaltySupportWindowId as string;
    const directSupportFromOriginalSelection =
      origin?.windowId === undefined &&
      previous !== undefined &&
      previous?.stateVersion === origin?.selectedAtStateVersion &&
      context.input.playerView.stateVersion === previous.stateVersion + 1;
    if (
      !origin ||
      previous?.side !== "runner" ||
      previous.stateVersion > context.input.playerView.stateVersion ||
      (origin.windowId !== windowId && !directSupportFromOriginalSelection) ||
      action.expiresAtStateVersion !== context.input.playerView.stateVersion
    ) {
      throw new PlanResolutionFailure("window_origin_missing", {
        side: context.input.side,
        stateVersion: context.input.playerView.stateVersion,
        timingPoint: context.input.playerView.timingPoint,
        legalActionTypes: context.input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: boundSupportActions.map(
          (legalAction) => legalAction.actionId,
        ),
        owner: "continuation",
        ...(origin ? { planInstanceId: origin.executorInstanceId } : {}),
        ...(origin ? { stepId: origin.sourceStepId } : {}),
        removalCondition:
          "Use the sole current Runner payment-support action only while preserving the exact original plan action and Engine support-window id.",
      });
    }
    return {
      actionId: action.actionId,
      reasonCode: "plan_bound_runner_cost_penalty_support_action",
      origin: {
        rootPlanInstanceId: origin.rootPlanInstanceId,
        leafPlanInstanceId: origin.executorInstanceId,
        side: "runner",
        windowKind: "optional_ability",
        windowId,
        stateVersion: context.input.playerView.stateVersion,
        timingPoint: context.input.playerView.timingPoint,
      },
    };
  }
  const action =
    continuationActions.length === 1 ? continuationActions[0] : undefined;
  const windowId =
    typeof action?.payload?.runnerCostPenaltySupportWindowId === "string"
      ? action.payload.runnerCostPenaltySupportWindowId
      : undefined;
  const supportActions = context.input.legalActions.filter(
    (legalAction) => legalAction.actionId !== action?.actionId,
  );
  const supportActionsMatchWindow = supportActions.every(
    (supportAction) =>
      supportAction.payload?.costPenaltySupportWindowId === windowId &&
      supportAction.payload?.costPenaltySupportOriginalActionId ===
        origin?.originalActionId,
  );
  const supportActionsExplicitlyRejected = supportActions.every(
    (supportAction) =>
      context.actionDispositions?.some(
        (disposition) =>
          disposition.actionId === supportAction.actionId &&
          disposition.disposition === "explicitly_nonproductive",
      ) === true,
  );
  const directContinuationFromOriginalSelection =
    origin?.windowId === undefined &&
    previous?.stateVersion === origin?.selectedAtStateVersion &&
    previous !== undefined &&
    context.input.playerView.stateVersion === previous.stateVersion + 1;
  if (
    !action ||
    !origin ||
    previous?.side !== "runner" ||
    previous.stateVersion > context.input.playerView.stateVersion ||
    origin.originalActionId !== action.actionId ||
    (origin.windowId !== windowId &&
      !directContinuationFromOriginalSelection) ||
    action.side !== "runner" ||
    action.expiresAtStateVersion !== context.input.playerView.stateVersion ||
    windowId === undefined ||
    !supportActionsMatchWindow
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: continuationActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(origin ? { planInstanceId: origin.executorInstanceId } : {}),
      ...(origin ? { stepId: origin.sourceStepId } : {}),
      removalCondition:
        "Resume only the exact original Runner plan action from the same current Engine cost/penalty support window.",
    });
  }
  if (supportActions.length > 0 && !supportActionsExplicitlyRejected) {
    return undefined;
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_cost_penalty_support_continuation",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "runner",
      windowKind: "optional_ability",
      windowId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}
