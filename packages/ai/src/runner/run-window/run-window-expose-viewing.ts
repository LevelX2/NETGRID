import type { AiDecisionInput } from "@netgrid/shared";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerRunOrigin } from "../../plans/runner-run-origin-contract";

/** Bind the Engine's immediate viewing continuation to the selected expose. */
export function runnerRunExposeViewingBinding(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
  rootPlanInstanceId: string | undefined,
): RunnerRunOrigin["exposeViewingContinuation"] {
  const finish = input.legalActions.find(
    (action) => action.payload?.approachIceExposeViewDecision === "finish",
  );
  if (!finish) return undefined;
  const run = input.playerView.run;
  const source = finish.payload?.cardId;
  const target = finish.payload?.iceId;
  const position = run?.position;
  const ice =
    position?.kind === "ice"
      ? input.playerView.servers.find(
          (server) => server.id === run?.attackedServerId,
        )?.ice[position.iceIndex]
      : undefined;
  const memory = previous?.runnerExposeInformationMemory?.find(
    (record) =>
      record.sourceCardInstanceId === source &&
      record.targetIceInstanceId === target &&
      record.serverId === run?.attackedServerId &&
      record.selectedAtStateVersion + 1 === input.playerView.stateVersion,
  );
  const exposeEvent = input.eventTail?.find(
    (event) =>
      event.stateVersionBefore === memory?.selectedAtStateVersion &&
      event.stateVersionAfter === input.playerView.stateVersion &&
      event.publicPayload?.actor === "runner" &&
      event.publicPayload.actionType === "trigger_ability" &&
      event.publicPayload.hiddenZoneAction === "approach_ice_expose",
  );
  const runParent = previous?.instances.find((instance) => {
    const state = instance.moduleState as {
      kind?: string;
      signal?: {
        windowId?: string;
        serverId?: string;
        rootPlanInstanceId?: string;
      };
    };
    return (
      instance.moduleId === "runner.convert_run_window" &&
      instance.parentInstanceId === rootPlanInstanceId &&
      state.kind === "run_window" &&
      state.signal?.windowId === `run:${run?.runId}` &&
      state.signal.serverId === run?.attackedServerId &&
      state.signal.rootPlanInstanceId === rootPlanInstanceId
    );
  });
  if (
    !rootPlanInstanceId ||
    input.side !== "runner" ||
    !run ||
    typeof run.runId !== "string" ||
    run.phase !== "approach_ice" ||
    input.playerView.timingPoint !== "run.approach_ice" ||
    finish.side !== "runner" ||
    finish.type !== "trigger_ability" ||
    finish.source !== source ||
    typeof source !== "string" ||
    typeof target !== "string" ||
    finish.expiresAtStateVersion !== input.playerView.stateVersion ||
    finish.costs.length !== 0 ||
    ice?.instanceId !== target ||
    ice.known !== true ||
    !input.playerView.own.rig?.some((card) => card.instanceId === source) ||
    !memory ||
    !exposeEvent ||
    !runParent ||
    previous?.side !== "runner" ||
    previous.rootForegroundInstanceId !== rootPlanInstanceId ||
    previous.stateVersion < memory.selectedAtStateVersion ||
    previous.stateVersion > input.playerView.stateVersion ||
    input.legalActions.some(
      (action) =>
        action.actionId !== finish.actionId &&
        !(
          action.type === "jack_out" &&
          action.payload?.approachIceExposeJackOut === true &&
          action.payload.cardId === source &&
          action.payload.iceId === target &&
          action.expiresAtStateVersion === input.playerView.stateVersion
        ),
    )
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [finish.actionId],
      owner: "continuation",
      ...(rootPlanInstanceId ? { planInstanceId: rootPlanInstanceId } : {}),
      removalCondition:
        "Bind the exact Engine viewing continuation to the immediately selected expose, same active Run root, source, ICE and state transition.",
    });
  }
  return {
    actionId: finish.actionId,
    rootPlanInstanceId,
    sourceCardInstanceId: source,
    targetIceInstanceId: target,
    serverId: run.attackedServerId,
    runId: run.runId,
    stateVersion: input.playerView.stateVersion,
  };
}
