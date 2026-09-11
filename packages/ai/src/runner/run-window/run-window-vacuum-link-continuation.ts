import { type AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

export function bindSelectedEngineWindowRunnerVacuumLinkOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  previous: ResidentPlanPortfolio | undefined,
): void {
  if (input.side !== "runner" || result.lane !== "engine_window") return;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.actionId,
  );
  const canOpenRunnerVacuumLinkRewind =
    selectedAction?.type === "continue_run" &&
    selectedAction.payload?.sourceDefinitionId === "onr_v1_275_vacuum-link" &&
    Number(selectedAction.payload?.unbrokenSubroutineCount) > 0 &&
    input.playerView.run?.encounteredIce?.definitionId ===
      "onr_v1_275_vacuum-link";
  if (!canOpenRunnerVacuumLinkRewind || !selectedAction) return;

  const currentPortfolio = result.portfolio;
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
        signal?: { serverId?: unknown };
      }
    | undefined;
  const lease = previous?.turnPlanExecutionLease;
  const commitment = previous?.turnPlanCommitment;
  const interveningEvents = (input.eventTail ?? []).filter(
    (event) =>
      previous !== undefined &&
      event.stateVersionBefore >= previous.stateVersion &&
      event.stateVersionAfter <= input.playerView.stateVersion,
  );
  const exactPriorActionChain =
    interveningEvents.length >= 1 &&
    interveningEvents[0]?.stateVersionBefore === previous?.stateVersion &&
    interveningEvents.at(-1)?.stateVersionAfter ===
      input.playerView.stateVersion &&
    interveningEvents[0]?.publicPayload?.actor === "runner" &&
    interveningEvents[0]?.publicPayload?.actionType === lease?.actionType &&
    interveningEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          interveningEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore),
    ) &&
    interveningEvents.slice(1).every((event) => {
      const payload = event.publicPayload;
      // Forced run windows preserve the existing execution owner. Only the
      // continuous, same-server run chain may connect its last chosen action
      // to this choice-producing Engine action.
      const passedUnrezzedIce =
        payload?.actor === "corp" &&
        payload.actionType === "decline_rez" &&
        payload.runPhase === "movement" &&
        typeof payload.passedIcePosition === "number" &&
        Number.isSafeInteger(payload.passedIcePosition) &&
        payload.passedIcePosition >= 0;
      // The Engine's pass transition carries the ICE position, not a server
      // field. In this continuous run-only chain it cannot change the run.
      return (
        passedUnrezzedIce ||
        (payload?.abilityFamily === "run-access" &&
          payload.serverId === input.playerView.run?.attackedServerId &&
          ((payload.actor === "corp" &&
            (payload.actionType === "rez_ice" ||
              payload.actionType === "decline_rez")) ||
            (payload.actor === "runner" &&
              payload.actionType === "continue_run")))
      );
    });
  const committedPhase = commitment?.phases?.[commitment.cursor.phaseIndex];
  const exactCommittedRunExecutor =
    committedPhase !== undefined &&
    executorInstanceId !== undefined &&
    commitment?.sequenceRootPlanInstanceId === executorInstanceId &&
    committedPhase?.root.planInstanceId === executorInstanceId &&
    committedPhase.phaseId === lease?.phaseId &&
    committedPhase.nodes[commitment!.cursor.nodeIndex]?.nodeId ===
      lease?.nodeId &&
    executor?.parentInstanceId === rootPlanInstanceId;
  const exactInheritedRunPlan =
    previous !== undefined &&
    currentPortfolio !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < input.playerView.stateVersion &&
    rootPlanInstanceId !== undefined &&
    executorInstanceId !== undefined &&
    currentPortfolio.rootForegroundInstanceId === rootPlanInstanceId &&
    currentPortfolio.executorInstanceId === executorInstanceId &&
    root?.side === "runner" &&
    executor?.side === "runner" &&
    executor.executionState === "executor" &&
    (executor.moduleId === "runner.convert_run_window" ||
      executor.moduleId === "runner.pressure_central" ||
      executor.moduleId === "runner.contest_remote") &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    executorState.signal?.serverId === input.playerView.run?.attackedServerId &&
    commitment?.status === "active" &&
    (commitment.sequenceRootPlanInstanceId === rootPlanInstanceId ||
      exactCommittedRunExecutor) &&
    lease !== undefined &&
    lease.commitmentId === commitment.commitmentId &&
    lease.sourcePlanId === commitment.sourcePlanId &&
    lease.currentBinding.stateVersion === previous.stateVersion &&
    exactPriorActionChain &&
    selectedAction.side === "runner" &&
    selectedAction.source === "game_rule" &&
    selectedAction.expiresAtStateVersion === input.playerView.stateVersion;
  if (!exactInheritedRunPlan) return;
  const sourceStepId =
    executor.moduleId === "runner.convert_run_window"
      ? `${executorInstanceId}:convert`
      : executor.moduleId === "runner.pressure_central"
        ? `${executorInstanceId}:pressure:${input.playerView.run!.attackedServerId}`
        : `${executorInstanceId}:contest`;
  currentPortfolio.stateVersion = input.playerView.stateVersion;
  currentPortfolio.selectedActionOrigin = {
    rootPlanInstanceId,
    executorInstanceId,
    selectedActionId: selectedAction.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
    immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
    sourceStepId,
    sourceActionType: "continue_run",
    sourceCardInstanceId: input.playerView.run!.encounteredIce!.instanceId,
    sourceCardDefinitionId: "onr_v1_275_vacuum-link",
  };
}

export function resolvePlanBoundRunnerVacuumLinkChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    choice?.source !== "card_implementation.vacuum_link_rewind"
  ) {
    return undefined;
  }
  const origin = previous?.selectedActionOrigin;
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
        signal?: {
          serverId?: unknown;
          accessCommitment?: { intendedAction?: unknown };
        };
        vacuumLinkChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionId: string;
          sourceCardInstanceId: string;
          sourceCardDefinitionId: string;
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
  const choiceRunId =
    /^card_implementation\.vacuum_link_rewind:([^:]+):([0-9]+)$/.exec(
      choice.choiceId,
    )?.[1];
  const sourceCard = context.input.playerView.run?.encounteredIce;
  const continuationEvents = (context.input.eventTail ?? []).filter(
    (event) =>
      previous !== undefined &&
      event.stateVersionBefore >= previous.stateVersion &&
      event.stateVersionAfter <= context.input.playerView.stateVersion,
  );
  const firstContinuationEvent = continuationEvents[0];
  const lastContinuationEvent = continuationEvents.at(-1);
  const exactContinuationChain =
    previous !== undefined &&
    continuationEvents.length >= 1 &&
    firstContinuationEvent?.stateVersionBefore === previous.stateVersion &&
    continuationEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          continuationEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore),
    ) &&
    firstContinuationEvent.publicPayload?.actor === "runner" &&
    firstContinuationEvent.publicPayload?.actionType ===
      previous?.turnPlanExecutionLease?.actionType &&
    lastContinuationEvent?.stateVersionAfter ===
      context.input.playerView.stateVersion &&
    lastContinuationEvent.publicPayload?.actor === "runner" &&
    lastContinuationEvent.publicPayload?.actionType === "continue_run" &&
    lastContinuationEvent.publicPayload?.resolvedEffects?.some(
      (effect) =>
        effect.kind === "resolve_subroutine" &&
        effect.sourceDefinitionId === choice.sourceCardDefinitionId,
    ) === true &&
    continuationEvents.slice(1, -1).every((event) => {
      const payload = event.publicPayload;
      const isCorpRezPass =
        payload?.actor === "corp" &&
        (payload.actionType === "rez_ice" ||
          payload.actionType === "decline_rez");
      const isBoundRunnerRunContinuation =
        payload?.actor === "runner" &&
        payload.actionType === "continue_run" &&
        payload.abilityFamily === "run-access" &&
        payload.serverId === context.input.playerView.run?.attackedServerId;
      return isCorpRezPass || isBoundRunnerRunContinuation;
    });
  const immediateOriginMatches =
    origin?.immediateChoicePolicy === "resolve_runner_vacuum_link_rewind" &&
    origin.selectedAtStateVersion === previous?.stateVersion &&
    origin.sourceActionType === "continue_run" &&
    origin.rootPlanInstanceId === previous?.rootForegroundInstanceId &&
    origin.executorInstanceId === previous?.executorInstanceId;
  const executionLease = previous?.turnPlanExecutionLease;
  const cardRunStartOriginMatches =
    origin?.immediateChoicePolicy === "resolve_runner_run_start_order" &&
    origin.selectedAtStateVersion === previous?.stateVersion &&
    origin.rootPlanInstanceId === previous?.rootForegroundInstanceId &&
    origin.executorInstanceId === previous?.executorInstanceId &&
    origin.selectedActionId === executionLease?.currentBinding.actionId &&
    origin.sourceActionType === executionLease?.actionType &&
    (origin.sourceActionType === "play_event" ||
      origin.sourceActionType === "activated_card_ability");
  const commitment = previous?.turnPlanCommitment;
  const committedPhase = commitment?.phases?.[commitment.cursor.phaseIndex];
  const exactCommittedRunExecutor =
    executor !== undefined &&
    root !== undefined &&
    executor.parentInstanceId === root.instanceId &&
    commitment?.sequenceRootPlanInstanceId === executor.instanceId &&
    committedPhase?.root.planInstanceId === executor.instanceId &&
    committedPhase.phaseId === executionLease?.phaseId &&
    committedPhase.nodes[commitment.cursor.nodeIndex]?.nodeId ===
      executionLease?.nodeId;
  const turnPlanContinuationMatches =
    previous !== undefined &&
    commitment?.status === "active" &&
    (commitment.sequenceRootPlanInstanceId ===
      previous.rootForegroundInstanceId ||
      exactCommittedRunExecutor) &&
    executionLease !== undefined &&
    executionLease.commitmentId === commitment.commitmentId &&
    executionLease.sourcePlanId === commitment.sourcePlanId &&
    executionLease.currentBinding.stateVersion === previous.stateVersion &&
    (executionLease.actionType === "continue_run" ||
      executionLease.actionType === "start_run" ||
      cardRunStartOriginMatches);
  const exactBinding =
    (immediateOriginMatches ||
      (turnPlanContinuationMatches && exactContinuationChain)) &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    sourceCard !== undefined &&
    sourceCard.instanceId === choice.sourceCardInstanceId &&
    sourceCard.definitionId === choice.sourceCardDefinitionId &&
    typeof choiceRunId === "string" &&
    choiceRunId.length > 0 &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    optionIds.length === 2 &&
    optionIds.includes("resume_from_rezzed_ice_back") &&
    optionIds.includes("jack_out") &&
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
    typeof executorState.signal?.accessCommitment?.intendedAction ===
      "string" &&
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
  if (!exactBinding || !action || !previous || !executor || !executorState) {
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
      removalCondition:
        "Resolve Vacuum Link only from an exact active Runner run-plan route, its bounded start/continue event chain and the complete current Engine choice contract.",
    });
  }
  executorState.vacuumLinkChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: "resume_from_rezzed_ice_back",
    sourceCardInstanceId: choice.sourceCardInstanceId!,
    sourceCardDefinitionId: choice.sourceCardDefinitionId!,
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_vacuum_link_rewind_choice",
    origin: {
      rootPlanInstanceId: previous.rootForegroundInstanceId!,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}
