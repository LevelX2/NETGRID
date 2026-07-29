import {
  ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
  type EngineRandomizedTurnPlanCandidate,
  type GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  applyAction,
  applyRandomizedTurnPlanSelection,
  createGame,
  getLegalActions,
  quoteRandomizedTurnPlanSelection,
  replayGameEvents,
} from "../index";

describe("Engine-randomized TurnPlan selection", () => {
  it("uses a separate replayable RNG domain and atomically applies one family head", () => {
    const initial = corpActionState();
    const snapshot = structuredClone(initial);
    const candidates = turnPlanCandidates(initial);
    const quoted = quoteRandomizedTurnPlanSelection(initial, {
      schemaVersion: ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
      matchId: initial.matchId,
      side: "corp",
      stateVersion: initial.stateVersion,
      timingPoint: initial.timingPoint,
      opportunityKey: "opening-rush:test",
      candidates: [...candidates].reverse(),
    });

    expect(quoted.ok).toBe(true);
    expect(initial).toEqual(snapshot);
    if (!quoted.ok) return;
    const applied = applyRandomizedTurnPlanSelection(initial, {
      kind: "engine_randomized_turn_plan_selection",
      quote: quoted.quote,
    });

    expect(applied.ok).toBe(true);
    expect(initial).toEqual(snapshot);
    if (!applied.ok) return;
    expect(applied.state.randomCounter).toBe(initial.randomCounter);
    expect(applied.state.randomDrawRecords).toEqual(initial.randomDrawRecords);
    expect(applied.state.aiTurnPlanRandomCounter).toBe(1);
    expect(applied.receipt.randomDraw).toMatchObject({
      domain: "ai_turn_plan_selection",
      counter: 0,
    });
    expect(applied.receipt.selectedCandidate.actionId).toBe(
      applied.receipt.selectedLegalAction.actionId,
    );
    expect(JSON.stringify(applied.publicEvents.at(-1))).not.toContain(
      "opening-rush:test",
    );

    const replay = replayGameEvents(initial, [applied.event]);
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(applied.stateHash);
    expect(replay.state.aiTurnPlanRandomDrawRecords?.at(-1)).toEqual(
      applied.receipt.randomDraw,
    );
  });
});

function corpActionState(): GameState {
  const initial = createGame({
    seed: "turn-plan-rng",
    setupMode: "completed",
  });
  const mandatoryDraw = getLegalActions(initial, "corp").find(
    (action) => action.type === "mandatory_draw",
  );
  if (!mandatoryDraw) throw new Error("Mandatory draw action missing.");
  const result = applyAction(initial, {
    matchId: initial.matchId,
    side: "corp",
    actionId: mandatoryDraw.actionId,
    clientKnownStateVersion: initial.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function turnPlanCandidates(
  state: GameState,
): EngineRandomizedTurnPlanCandidate[] {
  const actions = getLegalActions(state, "corp");
  const credit = actions.find((action) => action.type === "gain_credit");
  const install = actions.find(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      action.payload?.serverId === "rd",
  );
  if (!credit || !install) throw new Error("TurnPlan heads missing.");
  return [
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
  ];
}
