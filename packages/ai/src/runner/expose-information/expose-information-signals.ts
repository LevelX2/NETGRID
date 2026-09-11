import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { runnerExposeInstalledOpportunity } from "./expose-installed-card-choice";
import type { RunnerExposeInformationSignal } from "./expose-information-types";

export function runnerExposeInformationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): RunnerExposeInformationSignal[] {
  const currentServerId = input.playerView.run?.attackedServerId;
  const rememberedTargetIds = new Set(
    (previous?.runnerExposeInformationMemory ?? []).flatMap((record) =>
      previous !== undefined &&
      previous.side === "runner" &&
      record.selectedAtStateVersion < input.playerView.stateVersion &&
      record.serverId === currentServerId
        ? [record.targetIceInstanceId]
        : [],
    ),
  );
  const current = runnerCurrentExposeInformationSignal(
    input,
    previous,
    rememberedTargetIds,
  );
  return [
    ...(current ? [current] : []),
    ...runnerProactiveExposeInformationSignals(input, candidates),
  ];
}

function runnerProactiveExposeInformationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerExposeInformationSignal[] {
  if (input.side !== "runner" || input.playerView.run) return [];
  const opportunity = runnerExposeInstalledOpportunity(input);
  const unknownIcePositions = opportunity.unseenPositions.filter(
    (position) => position.area === "ice",
  );
  const unknownOutermostPositions = unknownIcePositions.filter((position) => {
    const server = input.playerView.servers.find(
      (entry) => entry.id === position.serverId,
    );
    return server !== undefined && position.index === server.ice.length - 1;
  });
  const informationCandidates = candidates.filter((candidate) => {
    if (
      candidate.actorSide !== "runner" ||
      !candidate.sourceCardInstanceId ||
      !candidate.sourceDefinitionId
    ) {
      return false;
    }
    const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
    if (hint?.planRoles?.includes("information") !== true) return false;
    if (
      candidate.actionType === "install_card" &&
      (input.playerView.own.rig ?? []).some(
        (installed) => installed.definitionId === candidate.sourceDefinitionId,
      )
    ) {
      return false;
    }
    const guide =
      candidate.actionType === "play_event" &&
      candidate.abilityKey ===
        "abilities_on_play_expose_outermost_ice_each_fort";
    const multiExpose =
      candidate.actionType === "play_event" &&
      candidate.abilityKey === "abilities_on_play_expose_installed_cards";
    const installTool = candidate.actionType === "install_card";
    return guide || multiExpose || installTool;
  });
  const bySource = new Map<string, ActionSemanticCandidate[]>();
  for (const candidate of informationCandidates) {
    const source = candidate.sourceCardInstanceId!;
    bySource.set(source, [...(bySource.get(source) ?? []), candidate]);
  }
  return [...bySource.values()].map((sourceCandidates) => {
    const candidate = [...sourceCandidates].sort((left, right) => {
      const leftAction = input.legalActions.find(
        (action) => action.actionId === left.actionId,
      );
      const rightAction = input.legalActions.find(
        (action) => action.actionId === right.actionId,
      );
      const leftTrash = leftAction?.payload?.runnerProgramTrashBeforeInstall
        ? 1
        : 0;
      const rightTrash = rightAction?.payload?.runnerProgramTrashBeforeInstall
        ? 1
        : 0;
      return (
        leftTrash - rightTrash || left.actionId.localeCompare(right.actionId)
      );
    })[0]!;
    const guide =
      candidate.actionType === "play_event" &&
      candidate.abilityKey ===
        "abilities_on_play_expose_outermost_ice_each_fort";
    const multiExpose =
      candidate.actionType === "play_event" &&
      candidate.abilityKey === "abilities_on_play_expose_installed_cards";
    const installTool = candidate.actionType === "install_card";
    const targetPositions = guide
      ? unknownOutermostPositions
      : multiExpose
        ? opportunity.unseenPositions
        : unknownIcePositions;
    const admissible = targetPositions.length > 0;
    return {
      kind: "proactive" as const,
      informationId: `card:${candidate.sourceCardInstanceId}`,
      sourceCardInstanceId: candidate.sourceCardInstanceId!,
      sourceDefinitionId: candidate.sourceDefinitionId!,
      targetPositionKeys: targetPositions.map(
        (position) => `${position.serverId}:${position.area}:${position.index}`,
      ),
      phase: admissible
        ? installTool
          ? ("install_information_tool" as const)
          : ("play_information_event" as const)
        : ("defer_known_information" as const),
      selectedActionId: candidate.actionId,
      actionIds: sourceCandidates.map((entry) => entry.actionId).sort(),
      rejectedActionIds: [],
      admissible,
      evidenceCodes: [
        admissible
          ? "runner_expose_information_unknown_target_available"
          : "runner_expose_information_no_unknown_target",
        `runner_expose_information_unknown_targets:${targetPositions.length}`,
        `runner_expose_information_source:${candidate.sourceCardInstanceId}`,
      ],
    };
  });
}

function runnerCurrentExposeInformationSignal(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
  rememberedTargetIds: ReadonlySet<string>,
): RunnerExposeInformationSignal | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.timingPoint !== "run.approach_ice" ||
    !input.playerView.run
  ) {
    return undefined;
  }
  const exposeActions = input.legalActions.filter(
    (action) =>
      action.side === "runner" &&
      action.type === "trigger_ability" &&
      action.payload?.approachIceExposeDecision === "expose",
  );
  const declineActions = input.legalActions.filter(
    (action) =>
      action.side === "runner" &&
      action.type === "trigger_ability" &&
      action.payload?.approachIceExposeDecision === "decline",
  );
  if (exposeActions.length === 0 && declineActions.length === 0) {
    return undefined;
  }
  const expose = exposeActions.length === 1 ? exposeActions[0] : undefined;
  const decline = declineActions.length === 1 ? declineActions[0] : undefined;
  const iceId =
    typeof expose?.payload?.iceId === "string"
      ? expose.payload.iceId
      : typeof decline?.payload?.iceId === "string"
        ? decline.payload.iceId
        : undefined;
  const sourceCardInstanceId =
    typeof expose?.payload?.cardId === "string"
      ? expose.payload.cardId
      : typeof decline?.payload?.cardId === "string"
        ? decline.payload.cardId
        : undefined;
  const origin = previous?.selectedActionOrigin;
  const rootPlanInstanceId =
    origin?.rootPlanInstanceId ?? previous?.rootForegroundInstanceId;
  const executorInstanceId =
    origin?.executorInstanceId ?? previous?.executorInstanceId;
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
  const exactWindow =
    input.legalActions.length === 2 &&
    expose !== undefined &&
    decline !== undefined &&
    iceId !== undefined &&
    expose.payload?.iceId === decline.payload?.iceId &&
    sourceCardInstanceId !== undefined &&
    expose.payload?.cardId === decline.payload?.cardId &&
    expose.expiresAtStateVersion === input.playerView.stateVersion &&
    decline.expiresAtStateVersion === input.playerView.stateVersion;
  const exactSelectedOrigin =
    previous !== undefined &&
    origin !== undefined &&
    origin.immediateChoicePolicy === "resolve_runner_run_start_order" &&
    (origin.sourceActionType === "start_run" ||
      origin.sourceActionType === "play_event" ||
      origin.sourceActionType === "activated_card_ability") &&
    previous.side === "runner" &&
    previous.stateVersion + 1 === input.playerView.stateVersion &&
    origin.selectedAtStateVersion === previous.stateVersion &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId;
  const executionLease = previous?.turnPlanExecutionLease;
  const turnPlanCommitment = previous?.turnPlanCommitment;
  const continuationEvents = (input.eventTail ?? []).filter(
    (event) =>
      previous !== undefined &&
      event.stateVersionBefore >= previous.stateVersion &&
      event.stateVersionAfter <= input.playerView.stateVersion,
  );
  const exactTurnPlanLease =
    previous !== undefined &&
    previous.stateVersion < input.playerView.stateVersion &&
    turnPlanCommitment?.status === "active" &&
    turnPlanCommitment.sequenceRootPlanInstanceId === rootPlanInstanceId &&
    executionLease !== undefined &&
    executionLease.commitmentId === turnPlanCommitment.commitmentId &&
    executionLease.sourcePlanId === turnPlanCommitment.sourcePlanId &&
    executionLease.currentBinding.stateVersion === previous.stateVersion &&
    (executionLease.actionType === "start_run" ||
      executionLease.actionType === "play_event" ||
      executionLease.actionType === "continue_run") &&
    continuationEvents.length >= 1 &&
    continuationEvents[0]?.stateVersionBefore === previous.stateVersion &&
    continuationEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          continuationEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore),
    ) &&
    continuationEvents.at(-1)?.stateVersionAfter ===
      input.playerView.stateVersion &&
    continuationEvents[0]?.publicPayload?.actor === "runner" &&
    continuationEvents[0]?.publicPayload?.actionType ===
      executionLease.actionType &&
    continuationEvents
      .slice(1)
      .every(
        (event) =>
          event.publicPayload?.actor === "corp" &&
          (event.publicPayload?.actionType === "rez_ice" ||
            event.publicPayload?.actionType === "decline_rez"),
      );
  const exactPlanBinding =
    previous !== undefined &&
    previous.side === "runner" &&
    rootPlanInstanceId !== undefined &&
    executorInstanceId !== undefined &&
    previous.rootForegroundInstanceId === rootPlanInstanceId &&
    previous.executorInstanceId === executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    root.side === "runner" &&
    executor.side === "runner" &&
    executor.executionState === "executor" &&
    (executor.moduleId === "runner.pressure_central" ||
      executor.moduleId === "runner.contest_remote" ||
      executor.moduleId === "runner.convert_run_window") &&
    (executor.instanceId === root.instanceId ||
      executor.parentInstanceId === root.instanceId) &&
    (executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest" ||
      executorState?.kind === "run_window") &&
    executorState.signal?.serverId === input.playerView.run.attackedServerId &&
    (exactSelectedOrigin || exactTurnPlanLease);
  const runPosition = input.playerView.run.position;
  const approachedServer = input.playerView.servers.find(
    (server) => server.id === input.playerView.run?.attackedServerId,
  );
  const approachedIce =
    runPosition?.kind === "ice"
      ? approachedServer?.ice[runPosition.iceIndex]
      : undefined;
  if (!exactWindow || !exactPlanBinding || !approachedIce) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: input.legalActions.map((action) => action.actionId),
      owner: "continuation",
      ...(executorInstanceId ? { planInstanceId: executorInstanceId } : {}),
      removalCondition:
        "Resolve an approach-ICE expose window only from the exact active Runner run-plan origin, current source card and current visible approached ICE.",
    });
  }
  const exposeUnknownIce =
    approachedIce.known === false && !rememberedTargetIds.has(iceId);
  const action = exposeUnknownIce ? expose : decline;
  const rejectedAction = exposeUnknownIce ? decline : expose;
  return {
    kind: "run_window",
    informationId: `ice:${iceId}`,
    rootPlanInstanceId,
    parentPlanInstanceId: executorInstanceId,
    serverId: input.playerView.run.attackedServerId,
    runId: input.playerView.run.runId ?? String(input.playerView.stateVersion),
    sourceCardInstanceId,
    targetIceInstanceId: iceId,
    phase: exposeUnknownIce ? "expose_unknown_ice" : "decline_known_ice",
    selectedActionId: action.actionId,
    rejectedActionIds: [rejectedAction.actionId],
    admissible: true,
    evidenceCodes: [
      exposeUnknownIce
        ? "runner_expose_information_unknown_ice_target"
        : "runner_expose_information_repeated_known_ice_declined",
      `runner_expose_information_server:${input.playerView.run.attackedServerId}`,
      `runner_expose_information_target:${iceId}`,
      `runner_expose_information_source:${sourceCardInstanceId}`,
    ],
  };
}
