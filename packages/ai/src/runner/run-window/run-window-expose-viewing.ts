import type { AiDecisionInput } from "@netgrid/shared";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerRunOrigin } from "../../plans/runner-run-origin-contract";
import { runnerVisibleLethalIceDamageAssessment } from "../../runner-damage-threat-assessment";

/** Evaluate the Engine's conditional rez facts, without pretending it rezzed. */
export function runnerExposedIceSafetyAssessment(
  input: AiDecisionInput,
): { evidenceCode: string } | undefined {
  const finish = input.legalActions.find(
    (a) => a.payload?.approachIceExposeViewDecision === "finish",
  );
  if (!finish) return undefined;
  const run = input.playerView.run;
  const ice = run?.approachedIce;
  const cost = ice?.effectiveRezCostQuote;
  const projection = ice?.effectivePostRezRunQuote;
  const valid =
    run?.phase === "approach_ice" &&
    input.playerView.timingPoint === "run.approach_ice" &&
    ice?.known === true &&
    ice.rezzed === false &&
    finish.payload?.iceId === ice.instanceId &&
    cost?.context === "installed" &&
    cost.cardId === ice.instanceId &&
    cost.targetServerId === run.attackedServerId &&
    cost.projectedServerId === run.attackedServerId &&
    cost.expiresAtStateVersion === input.playerView.stateVersion &&
    cost.complete === true;
  if (!valid || !cost?.complete || !ice || !run) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [finish.actionId],
      owner: "plan_module",
      removalCondition:
        "Provide the exact Engine rez-cost projection for the exposed approach ICE before selecting its viewing continuation.",
    });
  }
  // Choice-dependent rez stays in the existing variable-rez risk contract;
  // this assessment consumes an exact fixed transition, never a guessed choice.
  if (cost.costKind === "variable") return undefined;
  const visibleRezSupport =
    input.playerView.servers
      .find((server) => server.id === run.attackedServerId)
      ?.statuses?.some(
        (status) => status.kind === "during_run_ice_rez_support",
      ) === true;
  const directlyFunded = cost.finalCredits <= input.playerView.opponent.credits;
  // Public during-run support can change the otherwise unaffordable payment.
  if (
    (!directlyFunded && !visibleRezSupport) ||
    cost.mandatoryAdditionalCosts.agendaPoints >
      input.playerView.opponent.agendaPoints
  )
    return undefined;
  if (
    projection?.context !== "installed_post_rez" ||
    projection.cardId !== ice.instanceId ||
    projection.iceDefinitionId !== ice.definitionId ||
    projection.targetServerId !== run.attackedServerId ||
    projection.projectedServerId !== run.attackedServerId ||
    projection.expiresAtStateVersion !== input.playerView.stateVersion ||
    !projection.complete
  ) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [finish.actionId],
      owner: "plan_module",
      removalCondition:
        "Provide the exact Engine post-rez run projection for the affordable exposed approach ICE.",
    });
  }
  const damage = runnerVisibleLethalIceDamageAssessment(input, [
    {
      ...ice,
      rezzed: true,
      effectiveRunQuote: projection.effectiveRunQuote,
    },
  ]);
  return damage
    ? {
        evidenceCode: `runner_exposed_ice_lethal_after_${directlyFunded ? "funded" : "possible_supported"}_rez|${damage.evidenceCode}`,
      }
    : undefined;
}

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
  const sourceIsAvailable =
    input.playerView.own.rig?.some((card) => card.instanceId === source) ===
      true ||
    (run?.eventApproachIceExposeBeforeRez === true &&
      input.playerView.own.heapOrArchives.some(
        (card) =>
          card.instanceId === source &&
          card.known === true &&
          card.type === "event",
      ));
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
    !sourceIsAvailable ||
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
