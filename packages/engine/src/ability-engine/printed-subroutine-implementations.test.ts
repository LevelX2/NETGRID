import { describe, expect, it } from "vitest";
import { cardImplementationCoverageForDefinitionId } from "../card-implementations/coverage";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";

describe("printed subroutine implementations", () => {
  it("registers P3.25 simple ICE printed subroutines as implemented", () => {
    const p325IceCases = [
      ["onr_v1_232_crystal-wall", 1],
      ["onr_v1_237_data-wall", 1],
      ["onr_v1_238_data-wall-2-0", 1],
      ["onr_v1_244_filter", 1],
      ["onr_v1_252_keeper", 1],
      ["onr_v1_256_mazer", 1],
      ["onr_v1_261_quandary", 1],
      ["onr_v1_265_rock-is-strong", 1],
      ["onr_v1_266_scramble", 1],
      ["onr_v1_270_sleeper", 1],
      ["onr_v1_279_wall-of-static", 1],
      ["onr_v1_239_endless-corridor", 2],
      ["onr_v1_263_reinforced-wall", 2],
      ["onr_v1_230_cortical-scanner", 3],
      ["onr_v1_253_laser-wire", 2],
      ["onr_v1_262_razor-wire", 2],
      ["onr_v1_269_shotgun-wire", 2],
      ["onr_v1_257_nerve-labyrinth", 2],
      ["onr_v1_231_cortical-scrub", 2],
      ["onr_v1_229_code-corpse", 3],
      ["onr_v1_280_zombie", 3],
      ["onr_v1_254_liche", 4],
      ["onr_v1_278_wall-of-ice", 4],
    ] as const;

    for (const [definitionId, subroutineCount] of p325IceCases) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation?.printedSubroutines, definitionId).toHaveLength(
        subroutineCount,
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

  it("registers P3.26 program-trash ICE printed subroutines as implemented", () => {
    const p326IceCases = [
      "onr_v1_223_banpei",
      "onr_v1_233_d-arc-knight",
      "onr_v1_235_data-naga",
      "onr_v1_250_ice-pick-willie",
      "onr_v1_267_sentinels-prime",
      "onr_v1_273_triggerman",
    ] as const;

    for (const definitionId of p326IceCases) {
      const implementation = cardImplementationForDefinitionId(definitionId);
      expect(implementation?.printedSubroutines, definitionId).toEqual([
        expect.objectContaining({
          kind: "trash_program",
          text: "*Trash a program.",
        }),
        expect.objectContaining({
          kind: "end_the_run",
          text: "*End the run.",
        }),
      ]);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

  it("registers P3.27 next-ICE restriction printed subroutines as implemented", () => {
    const p327IceCases = [
      {
        definitionId: "onr_v1_224_bolter-cluster",
        subroutines: [
          expect.objectContaining({
            kind: "damage",
            damageType: "net",
            amount: 4,
            text: "*Do 4 Net damage.",
          }),
          expect.objectContaining({ kind: "prohibit_break_next_ice" }),
        ],
      },
      {
        definitionId: "onr_v1_234_data-darts",
        subroutines: [
          expect.objectContaining({
            kind: "damage",
            damageType: "net",
            amount: 3,
            text: "*Do 3 Net damage.",
          }),
          expect.objectContaining({ kind: "prohibit_break_next_ice" }),
        ],
      },
      {
        definitionId: "onr_v1_258_neural-blade",
        subroutines: [
          expect.objectContaining({
            kind: "damage",
            damageType: "net",
            amount: 1,
            text: "*Do 1 Net damage.",
          }),
          expect.objectContaining({ kind: "prohibit_break_next_ice" }),
        ],
      },
      {
        definitionId: "onr_v1_268_shock-r",
        subroutines: [
          expect.objectContaining({
            kind: "prohibit_break_and_jack_out_next_ice",
            breakTags: ["stun"],
          }),
        ],
      },
    ] as const;

    for (const { definitionId, subroutines } of p327IceCases) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.printedSubroutines,
        definitionId,
      ).toEqual(subroutines);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

  it("registers P3.30 run-duration and ETR catchup ICE as implemented", () => {
    const p330IceCases = [
      {
        definitionId: "onr_v1_245_fire-wall",
        subroutines: [expect.objectContaining({ kind: "end_the_run" })],
      },
      {
        definitionId: "onr_v1_259_in-the-face",
        subroutines: [expect.objectContaining({ kind: "end_the_run" })],
      },
      {
        definitionId: "onr_v1_226_canis-minor",
        subroutines: [
          expect.objectContaining({
            kind: "run_duration_ice_strength",
            amount: 1,
          }),
        ],
      },
      {
        definitionId: "onr_v1_225_canis-major",
        subroutines: [
          expect.objectContaining({
            kind: "run_duration_ice_strength",
            amount: 2,
          }),
        ],
      },
      {
        definitionId: "onr_v1_274_tutor",
        subroutines: [
          expect.objectContaining({
            kind: "run_duration_additional_subroutine",
            append: "after_existing",
            subroutine: expect.objectContaining({ kind: "end_the_run" }),
          }),
        ],
      },
      {
        definitionId: "onr_v1_277_virizz",
        subroutines: [
          expect.objectContaining({
            kind: "run_duration_break_subroutine_cost",
            amount: 1,
          }),
        ],
      },
      {
        definitionId: "onr_v1_251_jack-attack",
        subroutines: [
          expect.objectContaining({ kind: "run_duration_cannot_jack_out" }),
          expect.objectContaining({
            kind: "trace",
            baseTraceStrength: 5,
          }),
        ],
      },
    ] as const;

    for (const { definitionId, subroutines } of p330IceCases) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.printedSubroutines,
        definitionId,
      ).toEqual(subroutines);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
    expect(
      cardImplementationForDefinitionId("onr_v1_222_ball-and-chain")
        ?.printedSubroutines,
    ).toEqual([
      expect.objectContaining({
        kind: "run_duration_encounter_cost_or_end_run",
        amount: 2,
      }),
    ]);
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_222_ball-and-chain")
        ?.status,
    ).toBe("implemented");
  });

});
