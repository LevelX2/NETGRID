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
  ["onr_proteus_016_coyote", ["set_run_future_strength_bonus"]],
  ["onr_proteus_035_roadblock", ["end_the_run"]],
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
    expect(
      temporaryEncounterOptionFacts(state, iceId, definition),
    ).toMatchObject({
      temporaryEncounterSubroutineTypes: types,
      temporaryEncounterHasAdditionalMechanics:
        id === "onr_proteus_035_roadblock",
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

it("keeps unprojected entry payments explicitly outside the temporary break comparison", () => {
  const state = stateWithRun();
  const iceId = "temporary-wall" as CardInstanceId;
  const definition = CARD_DEFINITIONS_BY_ID["onr_v1_279_wall-of-static"]!;
  state.cardInstances[iceId] = {
    ...state.cardInstances[state.corp.hq[0]!]!,
    definitionId: definition.id,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  state.corp.hq.push(iceId);
  state.run!.encounterTaxForFutureIce = 2;
  const before = hashState(state);
  const facts = temporaryEncounterOptionFacts(state, iceId, definition);
  expect(JSON.parse(facts.temporaryEncounterBreakQuoteJson)).toMatchObject({
    status: "unmodeled",
    reason: "non_equivalent_or_conditional_encounter",
    cardId: iceId,
    runId: state.run!.runId,
    stateVersion: state.stateVersion + 1,
  });
  expect(hashState(state)).toBe(before);
});
