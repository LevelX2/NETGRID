import { expect, it } from "vitest";
import { createGameAfterSetup, getPlayerView, hashState } from "../../index";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import type { CardInstanceId, GameState } from "@netgrid/shared";
import { temporaryEncounterOptionFacts } from "./temporary-encounter-option-facts";

function stateWithRun() {
  const state = createGameAfterSetup({ seed: "temporary-encounter-facts" });
  state.run = {
    runId: "test-run",
    attackedServerId: "hq",
    phase: "movement",
    position: { kind: "ice", serverId: "hq", iceIndex: 0 },
    successful: false,
  } as NonNullable<GameState["run"]>;
  return state;
}

it.each([
  ["onr_v1_222_ball-and-chain", ["set_run_encounter_tax"]],
  [
    "onr_v1_234_data-darts",
    ["do_damage", "set_next_encounter_no_break_subroutines"],
  ],
  ["onr_v1_223_banpei", ["trash_installed_program", "end_the_run"]],
] as const)(
  "projects actual temporary effect kinds for %s without changing the state",
  (id, types) => {
    const state = stateWithRun();
    const iceId = "temporary-option" as CardInstanceId;
    const definition = CARD_DEFINITIONS_BY_ID[id]!;
    state.cardInstances[iceId] = {
      ...state.cardInstances[state.corp.hq[0]!]!,
      definitionId: definition.id,
      zone: { side: "corp", zone: "hq" },
      faceup: false,
      rezzed: false,
    };
    state.corp.hq.push(iceId);
    const before = hashState(state);
    expect(temporaryEncounterOptionFacts(state, iceId, definition)).toEqual({
      temporaryEncounterSubroutineTypes: types,
      temporaryEncounterHasAdditionalMechanics: false,
    });
    expect(hashState(state)).toBe(before);
  },
);

it("projects pending and active public break restrictions independently to both sides", () => {
  const state = stateWithRun();
  state.run!.nextEncounterNoBreakSubroutines = true;
  for (const side of ["runner", "corp"] as const) {
    expect(getPlayerView(state, side).run).toMatchObject({
      nextEncounterNoBreakSubroutines: true,
    });
    expect(getPlayerView(state, side).run).not.toHaveProperty(
      "noBreakSubroutinesActive",
    );
  }
  state.run!.nextEncounterNoBreakSubroutines = false;
  state.run!.noBreakSubroutinesActive = true;
  for (const side of ["runner", "corp"] as const) {
    expect(getPlayerView(state, side).run).toMatchObject({
      noBreakSubroutinesActive: true,
    });
    expect(getPlayerView(state, side).run).not.toHaveProperty(
      "nextEncounterNoBreakSubroutines",
    );
  }
});
