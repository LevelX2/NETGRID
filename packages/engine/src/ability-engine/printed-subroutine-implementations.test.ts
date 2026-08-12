import { describe, expect, it } from "vitest";
import type {
  CardDefinition,
  CardDefinitionId,
  SubroutineDefinition,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import { cardImplementationCoverageForDefinitionId } from "../card-implementations/coverage";
import {
  printedSubroutineDefinitionForImplementation,
  printedSubroutinesForCardImplementation,
} from "./printed-subroutine-implementations";

function runtimePrintedSubroutines(
  definitionId: CardDefinitionId,
): SubroutineDefinition[] {
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  expect(definition, definitionId).toBeDefined();
  return (
    printedSubroutinesForCardImplementation(definition!) ??
    definition!.subroutines ??
    []
  );
}

describe("printed subroutine implementations", () => {
  it("maps pay-or-end-run printed subroutines with variable amounts", () => {
    const definition = {
      id: "test_variable_pay_or_end_ice",
    } as CardDefinition;

    expect(
      printedSubroutineDefinitionForImplementation(
        definition,
        {
          kind: "end_the_run_unless_runner_pays",
          amount: 2,
          text: "*End the run unless Runner pays [2].",
        },
        0,
      ),
    ).toEqual({
      id: "card_implementation.test_variable_pay_or_end_ice.printed_subroutine.1.end_the_run_unless_runner_pays",
      type: "end_the_run_unless_runner_pays",
      amount: 2,
    });
  });

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
      expect(
        runtimePrintedSubroutines(definitionId),
        definitionId,
      ).toHaveLength(subroutineCount);
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
      expect(runtimePrintedSubroutines(definitionId), definitionId).toEqual([
        expect.objectContaining({
          type: "trash_installed_program",
        }),
        expect.objectContaining({
          type: "end_the_run",
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
            type: "do_damage",
            damageType: "net",
            amount: 4,
          }),
          expect.objectContaining({
            type: "set_next_encounter_no_break_subroutines",
          }),
        ],
      },
      {
        definitionId: "onr_v1_234_data-darts",
        subroutines: [
          expect.objectContaining({
            type: "do_damage",
            damageType: "net",
            amount: 3,
          }),
          expect.objectContaining({
            type: "set_next_encounter_no_break_subroutines",
          }),
        ],
      },
      {
        definitionId: "onr_v1_258_neural-blade",
        subroutines: [
          expect.objectContaining({
            type: "do_damage",
            damageType: "net",
            amount: 1,
          }),
          expect.objectContaining({
            type: "set_next_encounter_no_break_subroutines",
          }),
        ],
      },
      {
        definitionId: "onr_v1_268_shock-r",
        subroutines: [
          expect.objectContaining({
            type: "set_next_encounter_lock",
            breakTags: ["stun"],
          }),
        ],
      },
    ] as const;

    for (const { definitionId, subroutines } of p327IceCases) {
      expect(runtimePrintedSubroutines(definitionId), definitionId).toEqual(
        subroutines,
      );
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
        subroutines: [expect.objectContaining({ type: "end_the_run" })],
      },
      {
        definitionId: "onr_v1_259_in-the-face",
        subroutines: [expect.objectContaining({ type: "end_the_run" })],
      },
      {
        definitionId: "onr_v1_226_canis-minor",
        subroutines: [
          expect.objectContaining({
            type: "set_run_future_strength_bonus",
            amount: 1,
          }),
        ],
      },
      {
        definitionId: "onr_v1_225_canis-major",
        subroutines: [
          expect.objectContaining({
            type: "set_run_future_strength_bonus",
            amount: 2,
          }),
        ],
      },
      {
        definitionId: "onr_v1_274_tutor",
        subroutines: [
          expect.objectContaining({
            type: "set_run_future_end_the_run_subroutine",
          }),
        ],
      },
      {
        definitionId: "onr_v1_277_virizz",
        subroutines: [
          expect.objectContaining({
            type: "set_run_break_subroutine_cost_modifier",
            amount: 1,
          }),
        ],
      },
      {
        definitionId: "onr_v1_251_jack-attack",
        subroutines: [
          expect.objectContaining({ type: "set_run_jack_out_lock" }),
          expect.objectContaining({
            type: "initiate_trace",
            traceLimit: 5,
          }),
        ],
      },
    ] as const;

    for (const { definitionId, subroutines } of p330IceCases) {
      expect(runtimePrintedSubroutines(definitionId), definitionId).toEqual(
        subroutines,
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
    expect(runtimePrintedSubroutines("onr_v1_222_ball-and-chain")).toEqual([
      expect.objectContaining({
        type: "set_run_encounter_tax",
        amount: 2,
      }),
    ]);
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_222_ball-and-chain")
        ?.status,
    ).toBe("implemented");
  });
});
