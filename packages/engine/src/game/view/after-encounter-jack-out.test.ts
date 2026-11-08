import { expect, it } from "vitest";
import { createGameAfterSetup, getPlayerView, hashState } from "../../index";
import type { GameState } from "@netgrid/shared";

function encounter(restrictions: Partial<NonNullable<GameState["run"]>> = {}) {
  const state = createGameAfterSetup({ seed: "public-after-encounter-exit" });
  state.run = {
    runId: "test-run",
    attackedServerId: "rd",
    phase: "encounter_ice",
    position: { kind: "ice", serverId: "rd", iceIndex: 0 },
    ...restrictions,
  } as NonNullable<GameState["run"]>;
  return state;
}

it.each([
  [{}, false, 0],
  [{ jackOutLockedUntilEncounterEnds: true }, false, 0],
  [{ nextEncounterJackOutLock: true }, true, 0],
  [{ jackOutLockedForRun: true }, true, 0],
  [{ jackOutAdditionalCostForRun: 2 }, false, 2],
  [
    {
      activeIceProgramTrashSourceIceId: "public-source",
      jackOutAdditionalCostForRun: 2,
    },
    false,
    3,
  ],
] as const)(
  "projects resolved public restrictions %j without mutating state",
  (restrictions, locked, additionalCost) => {
    const state = encounter(restrictions);
    const before = hashState(state);
    for (const side of ["runner", "corp"] as const) {
      expect(getPlayerView(state, side).run!.afterEncounterJackOut).toEqual({
        locked,
        additionalCost,
      });
    }
    expect(hashState(state)).toBe(before);
  },
);

it("limits the quote to the encounter boundary it describes", () => {
  const state = encounter();
  state.run!.phase = "movement";
  expect(getPlayerView(state, "runner").run).not.toHaveProperty(
    "afterEncounterJackOut",
  );
});
