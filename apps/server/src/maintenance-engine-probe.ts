import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashState,
} from "@netgrid/engine";
import type { GameState, PlayerAction, Side } from "@netgrid/shared";

type ProbeInvocation = Pick<
  PlayerAction,
  "actionId" | "selectedTargets" | "selectedChoices"
>;
type ProbeResources = {
  credits: number;
  clicks: number;
  handCount: number;
  agendaPoints: number;
};
type ProbeStep = {
  actionId: string;
  stateVersion: number;
  stateHash: string;
  randomCounter: number;
  timingPoint: string;
  own: ProbeResources;
  opponentAgendaPoints: number;
  winner: GameState["winner"];
};
export type HistoricalEngineProbeResult = {
  schemaVersion: "netgrid-historical-engine-probe-v1";
  status: "completed" | "unavailable" | "rejected";
  reason?: string;
  rejectedStep?: number;
  sourceStateHash?: string;
  sourceStateVersion?: number;
  sourceRandomCounter?: number;
  steps?: ProbeStep[];
};

function validInvocations(value: unknown): value is ProbeInvocation[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 8 &&
    value.every((step) => {
      if (!step || typeof step !== "object" || Array.isArray(step))
        return false;
      if (
        Object.keys(step).some(
          (k) =>
            !["actionId", "selectedTargets", "selectedChoices"].includes(k),
        )
      )
        return false;
      if (
        typeof step.actionId !== "string" ||
        !step.actionId.length ||
        step.actionId.length > 1024
      )
        return false;
      for (const key of ["selectedTargets", "selectedChoices"] as const) {
        if (
          step[key] !== undefined &&
          (!step[key] ||
            typeof step[key] !== "object" ||
            Array.isArray(step[key]))
        )
          return false;
      }
      return (
        step.selectedTargets === undefined ||
        Object.values(step.selectedTargets).every((v) => typeof v === "string")
      );
    })
  );
}

/** Runs explicit alternatives only. The original GameState, AI memories and
 * storage are never changed, and neither private opponent zones nor raw
 * states are included in the result. */
export function probeHistoricalEngineState(params: {
  state: GameState;
  expectedStateHash: string;
  actor: Side;
  actions: unknown;
}): HistoricalEngineProbeResult {
  const schemaVersion = "netgrid-historical-engine-probe-v1" as const;
  if (hashState(params.state) !== params.expectedStateHash)
    return {
      schemaVersion,
      status: "unavailable",
      reason: "snapshot_binding_mismatch",
    };
  if (!validInvocations(params.actions))
    return {
      schemaVersion,
      status: "rejected",
      reason: "invalid_probe_actions",
    };
  let branch = structuredClone(params.state);
  const result: HistoricalEngineProbeResult = {
    schemaVersion,
    status: "completed",
    sourceStateHash: params.expectedStateHash,
    sourceStateVersion: branch.stateVersion,
    sourceRandomCounter: branch.randomCounter,
    steps: [],
  };
  for (const [index, invocation] of params.actions.entries()) {
    if (
      !getLegalActions(branch, params.actor).some(
        (a) => a.actionId === invocation.actionId,
      )
    )
      return {
        ...result,
        status: "rejected",
        reason: "action_not_legal",
        rejectedStep: index + 1,
      };
    const applied = applyAction(branch, {
      ...invocation,
      matchId: branch.matchId,
      side: params.actor,
      clientKnownStateVersion: branch.stateVersion,
    });
    if (!applied.ok)
      return {
        ...result,
        status: "rejected",
        reason: "engine_rejected_invocation",
        rejectedStep: index + 1,
      };
    branch = applied.state;
    const view = getPlayerView(branch, params.actor);
    result.steps!.push({
      actionId: invocation.actionId,
      stateVersion: branch.stateVersion,
      stateHash: hashState(branch),
      randomCounter: branch.randomCounter,
      timingPoint: branch.timingPoint,
      own: {
        credits: view.own.credits,
        clicks: view.own.clicks,
        handCount: view.own.gripOrHq.length,
        agendaPoints: view.own.agendaPoints,
      },
      opponentAgendaPoints: view.opponent.agendaPoints,
      winner: branch.winner,
    });
  }
  return result;
}
