import {
  applyAction,
  applyRandomizedTurnPlanSelection,
  createGame,
  getLegalActions,
  quoteRandomizedTurnPlanSelection,
  replayGameEvents,
} from "@netgrid/engine";
import { ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";
import { expect, it } from "vitest";

import { observeTurnPlanAction } from "./turn-plan-observation";

it("projects the actual Engine-randomized action from a certified actor-private receipt", () => {
  const initial = createGame({ seed: "turn-plan-rng", setupMode: "completed" });
  const mandatoryDraw = getLegalActions(initial, "corp").find(
    (action) => action.type === "mandatory_draw",
  )!;
  const opened = applyAction(initial, {
    matchId: initial.matchId,
    side: "corp",
    actionId: mandatoryDraw.actionId,
    clientKnownStateVersion: initial.stateVersion,
  });
  if (!opened.ok) throw new Error(opened.error.message);
  const state = opened.state;
  const actions = getLegalActions(state, "corp");
  const credit = actions.find((action) => action.type === "gain_credit")!;
  const install = actions.find(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      action.payload.serverId === "rd",
  )!;
  const quoted = quoteRandomizedTurnPlanSelection(state, {
    schemaVersion: ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
    matchId: state.matchId,
    side: "corp",
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    opportunityKey: "turn-plan-outcome:test",
    candidates: [
      {
        familyKey: "safe_setup",
        lineId: "line:safe",
        actionId: credit.actionId,
        weight: 1,
      },
      {
        familyKey: "pure_rush",
        lineId: "line:rush",
        actionId: install.actionId,
        weight: 1,
      },
    ],
  });
  if (!quoted.ok) throw new Error(quoted.error.code);
  const applied = applyRandomizedTurnPlanSelection(state, {
    kind: "engine_randomized_turn_plan_selection",
    quote: quoted.quote,
  });
  if (!applied.ok) throw new Error(applied.error.message);
  const observationInput = {
    matchId: state.matchId,
    side: "corp" as const,
    stateVersion: applied.state.stateVersion,
    event: applied.event,
  };
  const observed = observeTurnPlanAction(observationInput);
  expect(observed).toMatchObject({
    matchId: state.matchId,
    side: "corp",
    stateVersionBefore: state.stateVersion,
    stateVersionAfter: applied.state.stateVersion,
    actionId: applied.receipt.selectedCandidate.actionId,
    actionType: applied.receipt.selectedLegalAction.type,
  });
  expect(
    observeTurnPlanAction({ ...observationInput, side: "runner" }),
  ).toBeUndefined();
  expect(
    observeTurnPlanAction({ ...observationInput, matchId: "another-match" }),
  ).toBeUndefined();
  expect(
    observeTurnPlanAction({
      ...observationInput,
      stateVersion: state.stateVersion,
    }),
  ).toBeUndefined();
  const mismatched = structuredClone(applied.event);
  mismatched.privatePayload!.corp!.randomizedTurnPlanSelectionReceipt = {
    ...applied.receipt,
    selectedCandidate: {
      ...applied.receipt.selectedCandidate,
      lineId: "line:unquoted",
    },
  };
  expect(
    observeTurnPlanAction({ ...observationInput, event: mismatched }),
  ).toBeUndefined();
  const replay = replayGameEvents(state, [applied.event]);
  expect(replay.ok).toBe(true);
  expect(replay.actualFinalStateHash).toBe(applied.stateHash);
  expect(
    observeTurnPlanAction({
      ...observationInput,
      event: replay.state.eventLog.at(-1),
    }),
  ).toEqual(observed);
});
