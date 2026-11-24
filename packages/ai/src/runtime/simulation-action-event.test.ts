import type { GameState } from "@netgrid/shared";
import { expect, it } from "vitest";
import { advancementChangesForSimulationAction } from "./simulation-action-event";

it("reports applied advancement gains across exact cards without counting old or moved-away counters", () => {
  const before = stateWithCounters({
    asset: 1,
    agenda: 0,
    unchanged: 2,
    source: 2,
  });
  const after = stateWithCounters({
    asset: 2,
    agenda: 2,
    unchanged: 2,
    source: 0,
  });
  expect(advancementChangesForSimulationAction(before, before)).toEqual({
    added: 0,
    advancedCardIds: [],
  });
  expect(advancementChangesForSimulationAction(before, after)).toEqual({
    added: 3,
    advancedCardIds: ["asset", "agenda"],
  });
});

function stateWithCounters(counts: Record<string, number>): GameState {
  return {
    cardInstances: Object.fromEntries(
      Object.entries(counts).map(([instanceId, advancementCounters]) => [
        instanceId,
        { instanceId, advancementCounters },
      ]),
    ),
  } as GameState;
}
