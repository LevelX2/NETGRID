import { isRunnerPaymentWindowId, isTraceId, type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import {
  selectResidentPlanPortfolioExecutor,
  type ResidentPlanPortfolio,
} from "../../plans/resident-plan-portfolio";
import { type RunnerTargetedBypassChoiceContinuation } from "./runner-targeted-bypass-plan";
import type { RunnerTargetedIceTrashChoiceContinuation } from "../../runtime/runner-targeted-ice-trash-plan";
import { reconcileSelectedRunnerSuccessfulReplacementChoice } from "./run-window-successful-replacement-continuation";
import {
  bindRunnerDevelopmentSearchEngineContinuation,
  bindRunnerEventInstallChoiceEngineContinuation,
} from "../hand-development/development-choice-bindings";
import { preserveSelectedRunnerDevelopmentSearchAcrossPaymentStep } from "../hand-development/development-payment-continuation";
import { preserveSelectedRunnerCoverageBindingAcrossPaymentStep } from "../rig-coverage/coverage-bindings";

import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import { originalPaymentSelectionReachesWindow } from "./run-window-cost-offers";

export { resolvePlanBoundRunnerCostPenaltyContinuation } from "./run-window-cost-offers";

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
    isRunnerPaymentWindowId(selectedAction?.payload?.costPenaltySupportWindowId)
      ? selectedAction.payload.costPenaltySupportWindowId
      : undefined;
  const supportOriginalActionId =
    typeof selectedAction?.payload?.costPenaltySupportOriginalActionId ===
    "string"
      ? selectedAction.payload.costPenaltySupportOriginalActionId
      : undefined;
  const continuationWindowId =
    isRunnerPaymentWindowId(continuation?.payload?.runnerCostPenaltySupportWindowId)
      ? continuation.payload.runnerCostPenaltySupportWindowId
      : undefined;
  const selectedPaymentSupport =
    selectedAction !== undefined &&
    supportWindowId !== undefined &&
    supportOriginalActionId !== undefined;
  const continuationMatchesWindow =
    continuationActions.length === 0 ||
    (continuation !== undefined &&
      actionMatchesCurrentDecision(input, continuation) &&
      continuationWindowId === supportWindowId &&
      continuation.actionId === pending?.originalActionId);

  if (result.lane === "engine_window") {
    if (
      reconcileSelectedRunnerSuccessfulReplacementChoice(
        input,
        result,
        previous,
      )
    ) {
      return;
    }
    if (
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "plan_bound_runner_cost_penalty_support_action",
      )
    ) {
      const directSupportFromOriginalSelection =
        originalPaymentSelectionReachesWindow(input, previous, supportWindowId);
      if (
        !pending ||
        !selectedAction ||
        !selectedPaymentSupport ||
        supportOriginalActionId !== pending.originalActionId ||
        (pending.windowId !== supportWindowId &&
          !directSupportFromOriginalSelection) ||
        !actionMatchesCurrentDecision(input, selectedAction) ||
        selectedAction.type !== "activated_card_ability" ||
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
      preserveSelectedRunnerDevelopmentSearchAcrossPaymentStep(
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
      restorePaidRunnerServerExecutor(input, result, pending, selectedAction);
      delete result.portfolio.pendingRunnerCostPenaltySupportOrigin;
      return;
    }
    const ruleChoice = input.playerView.pendingChoice;
    const trace = input.playerView.trace;
    const ruleRequirement = selectedAction?.choiceRequirements?.[0];
    const ruleOptionIds = ruleChoice?.options.map((option) => option.id) ?? [];
    // A non-run Trace belongs to its mandatory rules window. Preserve that
    // exact origin through payment, rather than borrowing the idle plan.
    if (
      !input.playerView.run &&
      trace?.phase === "runner_bid" &&
      ruleChoice?.side === "runner" &&
      ruleChoice.kind === "bid_amount" &&
      ruleChoice.source === `trace:${trace.traceId}` &&
      ruleChoice.stateVersion === input.playerView.stateVersion &&
      result.origin.rootPlanInstanceId === "rules" &&
      result.origin.leafPlanInstanceId === "rules.window_resolution" &&
      result.origin.side === "runner" &&
      result.origin.windowKind === "mandatory_choice" &&
      result.origin.stateVersion === input.playerView.stateVersion &&
      result.origin.timingPoint === input.playerView.timingPoint &&
      selectedAction?.side === "runner" &&
      selectedAction.type === "resolve_choice" &&
      selectedAction.source === "game_rule" &&
      selectedAction.timingPoint === input.playerView.timingPoint &&
      selectedAction.expiresAtStateVersion === input.playerView.stateVersion &&
      selectedAction.choiceRequirements?.length === 1 &&
      ruleRequirement?.choiceId === ruleChoice.choiceId &&
      ruleRequirement.minSelections === ruleChoice.minSelections &&
      ruleRequirement.maxSelections === ruleChoice.maxSelections &&
      ruleRequirement.optionIds.length === ruleOptionIds.length &&
      ruleOptionIds.every((id) => ruleRequirement.optionIds.includes(id))
    ) {
      result.portfolio.stateVersion = input.playerView.stateVersion;
      result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
        rootPlanInstanceId: result.origin.rootPlanInstanceId,
        executorInstanceId: result.origin.leafPlanInstanceId,
        sourceStepId: result.origin.windowId,
        originalActionId: selectedAction.actionId,
        selectedAtStateVersion: input.playerView.stateVersion,
      };
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
    const directRunRootTraceContinuationIsBound =
      traceOriginOwnedDirectlyByRunRoot &&
      traceStartIndex === 0 &&
      traceStart?.publicPayload.traceId === trace?.traceId &&
      trace?.sourceCardInstanceId === run?.encounteredIce?.instanceId &&
      traceStart?.publicPayload.sourceDefinitionId ===
        run?.encounteredIce?.definitionId &&
      traceSuffix.every(
        (event) => event.publicPayload.traceId === trace?.traceId,
      ) &&
      pending !== undefined &&
      pending.rootPlanInstanceId === rootPlanInstanceId &&
      pending.executorInstanceId === executorInstanceId &&
      pending.selectedAtStateVersion === previous?.stateVersion &&
      pending.sourceStepId === `run.encounter_ice:${previous?.stateVersion}` &&
      pending.originalActionId.startsWith("r5.") &&
      executorState?.signal?.serverId === run?.attackedServerId &&
      root?.target !== undefined &&
      root.target.kind === "server" &&
      root.target.id === run?.attackedServerId;
    const exactRunTraceBidOrigin =
      previous !== undefined &&
      rootPlanInstanceId !== undefined &&
      executorInstanceId !== undefined &&
      result.portfolio.rootForegroundInstanceId === rootPlanInstanceId &&
      result.portfolio.executorInstanceId === executorInstanceId &&
      root?.side === "runner" &&
      executor?.side === "runner" &&
      ((traceOriginOwnedByRunWindowLeaf && traceStartIndex === 0) ||
        (traceOriginOwnedDirectlyByRunRoot && directRunRootPrefixIsBound) ||
        directRunRootTraceContinuationIsBound) &&
      choice?.side === "runner" &&
      choice.kind === "bid_amount" &&
      run !== undefined &&
      trace !== undefined &&
      trace.sourceRunId === run.runId &&
      choice.source === `trace:${trace.traceId}` &&
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
    const completedSelectedTrace =
      interveningEvents.length === 1 &&
      pending?.originalActionId === "rn" &&
      pending.selectedAtStateVersion === previous?.stateVersion &&
      pending.sourceStepId === `run.encounter_ice:${previous?.stateVersion}` &&
      interveningEvents[0]?.publicPayload.actor === "runner" &&
      interveningEvents[0]?.publicPayload.actionType === "resolve_choice" &&
      interveningEvents[0]?.publicPayload.effectKind === "trace" &&
      interveningEvents[0]?.publicPayload.traceStep === "runner_bid" &&
      typeof interveningEvents[0]?.publicPayload.traceSuccessful ===
        "boolean" &&
      isTraceId(interveningEvents[0]?.publicPayload.traceId) &&
      run !== undefined &&
      interveningEvents[0].publicPayload.traceSourceRunId === run.runId &&
      interveningEvents[0].publicPayload.choiceId ===
        `${interveningEvents[0].publicPayload.traceId}.runner.bid.${previous?.stateVersion}`;
    const exactForcedRunContinuationOrigin =
      previous !== undefined &&
      previous.side === "runner" &&
      previous.stateVersion < input.playerView.stateVersion &&
      rootPlanInstanceId !== undefined &&
      executorInstanceId !== undefined &&
      result.portfolio.rootForegroundInstanceId === rootPlanInstanceId &&
      result.portfolio.executorInstanceId === executorInstanceId &&
      root?.side === "runner" &&
      executor?.side === "runner" &&
      ((traceOriginOwnedByRunWindowLeaf &&
        executorState?.signal?.windowId === `run:${run?.runId}`) ||
        (traceOriginOwnedDirectlyByRunRoot &&
          completedSelectedTrace &&
          pending?.rootPlanInstanceId === rootPlanInstanceId &&
          pending.executorInstanceId === executorInstanceId &&
          executorState?.signal?.serverId === run?.attackedServerId &&
          root?.target !== undefined &&
          root.target.kind === "server" &&
          root.target.id === run?.attackedServerId)) &&
      !choice &&
      !trace &&
      selectedAction?.side === "runner" &&
      selectedAction.type === "continue_run" &&
      ((run?.phase === "movement" &&
        input.playerView.timingPoint === "run.jack_out_window" &&
        selectedAction.actionId === "r5") ||
        (run?.phase === "encounter_ice" &&
          input.playerView.timingPoint === "run.encounter_ice" &&
          selectedAction.payload?.encounterContinue === true)) &&
      selectedAction.source === "game_rule" &&
      selectedAction.expiresAtStateVersion === input.playerView.stateVersion &&
      input.legalActions.length === 1 &&
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "engine_window_single_legal_resolution",
      ) &&
      interveningEvents.length >= 1 &&
      interveningEvents[0]?.stateVersionBefore === previous.stateVersion &&
      interveningEvents.at(-1)?.stateVersionAfter ===
        input.playerView.stateVersion &&
      interveningEvents.every(
        (event, index) =>
          event.stateVersionAfter === event.stateVersionBefore + 1 &&
          (index === 0 ||
            event.stateVersionBefore ===
              interveningEvents[index - 1]!.stateVersionAfter),
      ) &&
      (completedSelectedTrace ||
        interveningEvents.every(
          (event) =>
            (event.publicPayload.serverId === run.attackedServerId ||
              (event.publicPayload.actor === "corp" &&
                event.publicPayload.actionType === "decline_rez" &&
                event.publicPayload.serverId === undefined)) &&
            ((event.publicPayload.actor === "runner" &&
              event.publicPayload.actionType === "continue_run") ||
              (event.publicPayload.actor === "corp" &&
                ["rez_ice", "rez_card", "decline_rez"].includes(
                  String(event.publicPayload.actionType),
                ))),
        ));
    if (exactRunTraceBidOrigin || exactForcedRunContinuationOrigin) {
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
      !actionMatchesCurrentDecision(input, selectedAction) ||
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
    preserveSelectedRunnerDevelopmentSearchAcrossPaymentStep(
      input,
      result,
      previous,
      pending,
    );
    preserveSelectedRunnerCoverageBindingAcrossPaymentStep(
      input,
      result,
      previous,
      pending,
    );
    preserveSelectedRunnerTargetedPreparationAcrossPaymentStep(
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
    selectedAction !== undefined &&
    actionMatchesCurrentDecision(input, selectedAction) &&
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

function preserveSelectedRunnerTargetedPreparationAcrossPaymentStep(
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
        choiceContinuation?:
          | RunnerTargetedBypassChoiceContinuation
          | RunnerTargetedIceTrashChoiceContinuation;
      }
    | undefined;
  const continuation = previousState?.choiceContinuation;
  if (
    continuation?.family !== "runner_targeted_bypass" &&
    continuation?.family !== "runner_targeted_ice_trash"
  )
    return;
  const exactOrigin =
    previous?.side === "runner" &&
    (previousExecutor.executionState === "executor" ||
      (previousExecutor.executionState === "preempted" &&
        pending.windowId !== undefined)) &&
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
        "Carry the selected server plan and its exact ICE preparation target through payment support.",
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

/** Payment support hands the action back to the server plan that selected
 * the run or its ICE preparation and owns the next Engine window.
 */
function restorePaidRunnerServerExecutor(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "engine_window" }>,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
  action: LegalAction | undefined,
): void {
  const portfolio = result.portfolio!;
  const original = portfolio.instances.find(
    (plan) => plan.instanceId === pending.executorInstanceId,
  );
  const state = original?.moduleState as
    | {
        kind?: string;
        signal?: { serverId?: string };
        choiceContinuation?: RunnerTargetedIceTrashChoiceContinuation;
      }
    | undefined;
  const preparation =
    state?.choiceContinuation?.family === "runner_targeted_ice_trash"
      ? state.choiceContinuation
      : undefined;
  if (
    !action ||
    (action.type !== "start_run" &&
      (action.type !== "play_event" ||
        (action.payload?.runnerEventRun !== true && !preparation))) ||
    input.playerView.run ||
    pending.rootPlanInstanceId !== pending.executorInstanceId ||
    (original?.moduleId !== "runner.pressure_central" &&
      original?.moduleId !== "runner.contest_remote") ||
    (portfolio.executorInstanceId === original.instanceId && !preparation)
  )
    return;
  const serverId = preparation
    ? preparation.serverId
    : action.payload?.serverId;
  const windowId = action.payload?.runnerCostPenaltySupportWindowId;
  if (
    original.side !== "runner" ||
    (original.executionState !== "preempted" &&
      !(
        original.executionState === "executor" &&
        portfolio.executorInstanceId === original.instanceId
      )) ||
    original.viability !== "ready" ||
    original.parentInstanceId !== undefined ||
    original.target?.kind !== "server" ||
    original.target.id !== serverId ||
    (state?.kind !== "central_pressure" && state?.kind !== "remote_contest") ||
    state.signal?.serverId !== serverId ||
    typeof serverId !== "string" ||
    !actionMatchesCurrentDecision(input, action) ||
    action.actionId !== pending.originalActionId ||
    action.payload?.runnerCostPenaltySupportContinuation !== true ||
    !isRunnerPaymentWindowId(windowId) ||
    (windowId !== pending.windowId &&
      !(
        pending.windowId === undefined &&
        windowId === pending.selectedAtStateVersion + 1
      )) ||
    result.origin.windowId !== String(windowId) ||
    result.origin.rootPlanInstanceId !== pending.rootPlanInstanceId ||
    result.origin.leafPlanInstanceId !== pending.executorInstanceId ||
    (preparation &&
      (action.type !== "play_event" ||
        action.source !== preparation.sourceCardInstanceId ||
        preparation.ownerModuleId !== original.moduleId ||
        preparation.ownerDedupeKey !== original.dedupeKey ||
        preparation.sourceActionId !== pending.originalActionId ||
        preparation.selectedActionId !== pending.originalActionId ||
        preparation.plannedAtStateVersion !== pending.selectedAtStateVersion ||
        preparation.selectedAtStateVersion !== pending.selectedAtStateVersion))
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((entry) => entry.type),
      unresolvedActionIds: [action.actionId],
      owner: "continuation",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Resume the exact paid action with its server plan, Engine payment window and bound target.",
    });
  }
  if (preparation)
    preparation.engineContinuationAtStateVersion =
      input.playerView.stateVersion;
  if (portfolio.executorInstanceId === original.instanceId) return;
  delete portfolio.turnPlanExecutionLease;
  delete portfolio.turnPlanCommitment;
  const resumed = selectResidentPlanPortfolioExecutor({
    portfolio,
    selectedExecutorInstanceId: original.instanceId,
    timingPoint: input.playerView.timingPoint,
    reason: "executor_selected",
  });
  if (!preparation)
    resumed.selectedActionOrigin = {
      rootPlanInstanceId: pending.rootPlanInstanceId,
      executorInstanceId: pending.executorInstanceId,
      selectedActionId: action.actionId,
      selectedAtStateVersion: input.playerView.stateVersion,
      immediateChoicePolicy: "resolve_runner_run_start_order",
      sourceStepId: pending.sourceStepId,
      sourceActionType: action.type,
      continuedThroughStateVersion: input.playerView.stateVersion,
    };
  result.portfolio = resumed;
}
