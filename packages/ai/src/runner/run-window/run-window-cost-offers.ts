import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type {
  EngineWindowResolution,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

/** A selected movement may cross witnessed Corp rez windows or the exact
 * public temporary-encounter intervention before its entry payment. */
export function originalPaymentSelectionReachesWindow(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
  windowId: string | undefined,
): boolean {
  const origin = previous?.pendingRunnerCostPenaltySupportOrigin;
  if (
    !previous ||
    !origin ||
    windowId === undefined ||
    origin.windowId !== undefined ||
    previous.stateVersion !== origin.selectedAtStateVersion
  )
    return false;
  if (input.playerView.stateVersion === previous.stateVersion + 1) return true;
  const run = input.playerView.run;
  const executor = previous.instances.find(
    (p) => p.instanceId === origin.executorInstanceId,
  );
  const state = executor?.moduleState as
    | { kind?: string; signal?: { windowId?: string; serverId?: string } }
    | undefined;
  if (
    !run ||
    origin.originalActionId !== "runner.continue_run" ||
    executor?.moduleId !== "runner.convert_run_window" ||
    executor.parentInstanceId !== origin.rootPlanInstanceId ||
    previous.rootForegroundInstanceId !== origin.rootPlanInstanceId ||
    previous.executorInstanceId !== origin.executorInstanceId ||
    state?.kind !== "run_window" ||
    state.signal?.windowId !== `run:${run.runId}` ||
    state.signal.serverId !== run.attackedServerId
  )
    return false;
  const events = (input.eventTail ?? []).filter(
    (e) =>
      e.stateVersionBefore >= previous.stateVersion &&
      e.stateVersionAfter <= input.playerView.stateVersion,
  );
  const first = events[0],
    last = events.at(-1);
  const temporaryEncounterIntervention =
    events.length === 2 &&
    first?.publicPayload.hiddenZoneAction ===
      "p3_54_delayed_success_intervention_choice" &&
    first.publicPayload.abilityId ===
      "p3_54_delayed_success_intervention_choice" &&
    first.publicPayload.hiddenZoneBarrier === true &&
    typeof first.publicPayload.sourceDefinitionId === "string" &&
    last?.publicPayload.actionType === "resolve_choice" &&
    last.publicPayload.hiddenZoneAction ===
      "successful_run_temporary_encounter" &&
    last.publicPayload.abilityId === "successful_run_temporary_encounter" &&
    last.publicPayload.sourceDefinitionId ===
      first.publicPayload.sourceDefinitionId &&
    last.publicPayload.serverId === run.attackedServerId &&
    last.publicPayload.revealKind === "reveal" &&
    typeof last.publicPayload.cardDefinitionId === "string" &&
    last.publicPayload.cardDefinitionId ===
      last.publicPayload.targetIceDefinitionId;
  return (
    events.length >= 2 &&
    first?.stateVersionBefore === previous.stateVersion &&
    last?.stateVersionAfter === input.playerView.stateVersion &&
    events.every(
      (e, index) =>
        e.stateVersionAfter === e.stateVersionBefore + 1 &&
        (index === 0 ||
          e.stateVersionBefore === events[index - 1]!.stateVersionAfter),
    ) &&
    first.publicPayload.actor === "runner" &&
    first.publicPayload.actionType === "continue_run" &&
    first.publicPayload.serverId === run.attackedServerId &&
    events
      .slice(1)
      .every(
        (e) =>
          e.publicPayload.actor === "corp" &&
          (["rez_ice", "rez_card", "decline_rez"].includes(
            String(e.publicPayload.actionType),
          ) ||
            (e === last && temporaryEncounterIntervention)),
      ) &&
    last.publicPayload.runnerCostPenaltySupportWindowOpened === true &&
    last.publicPayload.runnerCostPenaltySupportWindowId === windowId &&
    last.publicPayload.runnerCostPenaltySupportOriginalActionId ===
      origin.originalActionId &&
    typeof last.publicPayload.targetIceDefinitionId === "string"
  );
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
      originalPaymentSelectionReachesWindow(context.input, previous, windowId);
    if (
      !origin ||
      previous?.side !== "runner" ||
      previous.stateVersion > context.input.playerView.stateVersion ||
      (origin.windowId !== windowId && !directSupportFromOriginalSelection) ||
      !actionMatchesCurrentDecision(context.input, action)
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
      supportAction.type === "activated_card_ability" &&
      actionMatchesCurrentDecision(context.input, supportAction) &&
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
    originalPaymentSelectionReachesWindow(context.input, previous, windowId);
  if (
    !action ||
    !origin ||
    previous?.side !== "runner" ||
    previous.stateVersion > context.input.playerView.stateVersion ||
    origin.originalActionId !== action.actionId ||
    (origin.windowId !== windowId &&
      !directContinuationFromOriginalSelection) ||
    !actionMatchesCurrentDecision(context.input, action) ||
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
