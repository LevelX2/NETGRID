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
  expect(definition, String(definitionId)).toBeDefined();
  return (
    printedSubroutinesForCardImplementation(definition!) ??
    definition!.subroutines ??
    []
  );
}

describe("printed subroutine implementations", () => {
  it("maps pay-or-end-run printed subroutines with variable amounts", () => {
    const definition = {
      id: 3474921859,
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
      id: "card_implementation.3474921859.printed_subroutine.1.end_the_run_unless_runner_pays",
      type: "end_the_run_unless_runner_pays",
      amount: 2,
    });
  });

  it("registers P3.25 simple ICE printed subroutines as implemented", () => {
    const p325IceCases = [
      [444, 1],
      [449, 1],
      [450, 1],
      [456, 1],
      [464, 1],
      [468, 1],
      [473, 1],
      [477, 1],
      [478, 1],
      [482, 1],
      [491, 1],
      [451, 2],
      [475, 2],
      [442, 3],
      [465, 2],
      [474, 2],
      [481, 2],
      [469, 2],
      [443, 2],
      [441, 3],
      [492, 3],
      [466, 4],
      [490, 4],
    ] as const;

    for (const [definitionId, subroutineCount] of p325IceCases) {
      expect(
        runtimePrintedSubroutines(definitionId),
        String(definitionId),
      ).toHaveLength(subroutineCount);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        String(definitionId),
      ).toBe("implemented");
    }
  });

  it("registers P3.26 program-trash ICE printed subroutines as implemented", () => {
    const p326IceCases = [
      435,
      445,
      447,
      462,
      479,
      485,
    ] as const;

    for (const definitionId of p326IceCases) {
      expect(runtimePrintedSubroutines(definitionId), String(definitionId)).toEqual([
        expect.objectContaining({
          type: "trash_installed_program",
        }),
        expect.objectContaining({
          type: "end_the_run",
        }),
      ]);
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        String(definitionId),
      ).toBe("implemented");
    }
  });

  it("registers P3.27 next-ICE restriction printed subroutines as implemented", () => {
    const p327IceCases = [
      {
        definitionId: 436,
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
        definitionId: 446,
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
        definitionId: 470,
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
        definitionId: 480,
        subroutines: [
          expect.objectContaining({
            type: "set_next_encounter_lock",
            breakTags: ["stun"],
          }),
        ],
      },
    ] as const;

    for (const { definitionId, subroutines } of p327IceCases) {
      expect(runtimePrintedSubroutines(definitionId), String(definitionId)).toEqual(
        subroutines,
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        String(definitionId),
      ).toBe("implemented");
    }
  });

  it("registers P3.30 run-duration and ETR catchup ICE as implemented", () => {
    const p330IceCases = [
      {
        definitionId: 457,
        subroutines: [expect.objectContaining({ type: "end_the_run" })],
      },
      {
        definitionId: 471,
        subroutines: [expect.objectContaining({ type: "end_the_run" })],
      },
      {
        definitionId: 438,
        subroutines: [
          expect.objectContaining({
            type: "set_run_future_strength_bonus",
            amount: 1,
          }),
        ],
      },
      {
        definitionId: 437,
        subroutines: [
          expect.objectContaining({
            type: "set_run_future_strength_bonus",
            amount: 2,
          }),
        ],
      },
      {
        definitionId: 486,
        subroutines: [
          expect.objectContaining({
            type: "set_run_future_end_the_run_subroutine",
          }),
        ],
      },
      {
        definitionId: 489,
        subroutines: [
          expect.objectContaining({
            type: "set_run_break_subroutine_cost_modifier",
            amount: 1,
          }),
        ],
      },
      {
        definitionId: 463,
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
      expect(runtimePrintedSubroutines(definitionId), String(definitionId)).toEqual(
        subroutines,
      );
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        String(definitionId),
      ).toBe("implemented");
    }
    expect(runtimePrintedSubroutines(434)).toEqual([
      expect.objectContaining({
        type: "set_run_encounter_tax",
        amount: 2,
      }),
    ]);
    expect(
      cardImplementationCoverageForDefinitionId(434)
        ?.status,
    ).toBe("implemented");
  });
});
