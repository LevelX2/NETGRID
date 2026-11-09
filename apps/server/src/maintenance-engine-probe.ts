import {
  applyAction,
  applyRandomizedIceInstallSelection,
  getLegalActions,
  getPlayerView,
  hashState,
  quoteRandomizedIceInstallSelection,
} from "@netgrid/engine";
import type {
  GameState,
  EngineRandomizedIceInstallCandidate,
  EngineRandomizedIceInstallSelectionQuote,
  EngineRandomizedIceInstallSelectionRequest,
  LegalAction,
  PlayerAction,
  Side,
} from "@netgrid/shared";

type PlayerProbeInvocation = Pick<
  PlayerAction,
  "actionId" | "selectedTargets" | "selectedChoices"
>;
type ProbeInvocation =
  | PlayerProbeInvocation
  | {
      randomizedIceInstallSelection: EngineRandomizedIceInstallSelectionRequest;
    };
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
  randomizedIceInstallSelection?: {
    quote: EngineRandomizedIceInstallSelectionQuote;
    selectedCandidate: EngineRandomizedIceInstallCandidate;
    randomDrawCounter: number;
    randomDrawPurpose: string;
  };
};
export type HistoricalEngineProbeResult = {
  schemaVersion: "netgrid-historical-engine-probe-v1";
  status: "completed" | "unavailable" | "rejected";
  reason?: string;
  engineErrorCode?: string;
  rejectedStep?: number;
  sourceStateHash?: string;
  sourceStateVersion?: number;
  sourceRandomCounter?: number;
  steps?: ProbeStep[];
  /** Only the original actor's current Engine offers, at the final branch state. */
  nextLegalActions?: LegalAction[];
};

function validInvocations(value: unknown): value is ProbeInvocation[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 8 &&
    value.every((step) => {
      if (!step || typeof step !== "object" || Array.isArray(step))
        return false;
      if ("randomizedIceInstallSelection" in step) {
        const request = step.randomizedIceInstallSelection;
        return (
          Object.keys(step).length === 1 &&
          request !== null &&
          typeof request === "object" &&
          !Array.isArray(request)
        );
      }
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
    let actionId: string;
    let randomizedIceInstallSelection: ProbeStep["randomizedIceInstallSelection"];
    if ("randomizedIceInstallSelection" in invocation) {
      const request = invocation.randomizedIceInstallSelection;
      if (params.actor !== "corp" || request.side !== params.actor)
        return {
          ...result,
          status: "rejected",
          reason: "engine_selection_wrong_actor",
          rejectedStep: index + 1,
        };
      const quoted = quoteRandomizedIceInstallSelection(branch, request);
      if (!quoted.ok)
        return {
          ...result,
          status: "rejected",
          reason: "engine_selection_quote_rejected",
          engineErrorCode: quoted.error.code,
          rejectedStep: index + 1,
        };
      const applied = applyRandomizedIceInstallSelection(branch, {
        kind: "engine_randomized_ice_install_selection",
        quote: quoted.quote,
      });
      if (!applied.ok)
        return {
          ...result,
          status: "rejected",
          reason: "engine_selection_apply_rejected",
          engineErrorCode: applied.error.code,
          rejectedStep: index + 1,
        };
      branch = applied.state;
      actionId = applied.receipt.selectedCandidate.actionId;
      randomizedIceInstallSelection = {
        quote: quoted.quote,
        selectedCandidate: applied.receipt.selectedCandidate,
        randomDrawCounter: applied.receipt.randomDraw.counter,
        randomDrawPurpose: applied.receipt.randomDraw.purpose,
      };
    } else {
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
      actionId = invocation.actionId;
    }
    const view = getPlayerView(branch, params.actor);
    result.steps!.push({
      actionId,
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
      ...(randomizedIceInstallSelection
        ? { randomizedIceInstallSelection }
        : {}),
    });
  }
  result.nextLegalActions = getLegalActions(branch, params.actor);
  return result;
}
