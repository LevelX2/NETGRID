import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  additionalSubroutinesForIce,
  dynamicSubroutineAttributionFor,
} from "../../ability-engine/additional-subroutine-modifiers";
import { effectiveIceRunSubroutines } from "./effective-ice-run-subroutines";

const CRYSTAL_WALL = "onr_v1_232_crystal-wall" as CardDefinitionId;
const ENCODER = "onr_v1_320_encoder-inc" as CardDefinitionId;
const GALATEA = "onr_proteus_023_galatea" as CardDefinitionId;
const GATEKEEPER = "onr_proteus_024_gatekeeper" as CardDefinitionId;
const TUTOR = "onr_v1_274_tutor" as CardDefinitionId;

describe("effective ICE run subroutines", () => {
  it("stacks separately attributed run-duration subroutines without mark-copying external modifiers", () => {
    const targetId = "target_ice" as CardInstanceId;
    const externalSourceId = "external_source_ice" as CardInstanceId;
    const definition = CARD_DEFINITIONS_BY_ID[CRYSTAL_WALL]!;
    const state = {
      cardInstances: {
        [targetId]: {
          id: targetId,
          definitionId: CRYSTAL_WALL,
          owner: "corp",
          controller: "corp",
          faceup: true,
          rezzed: true,
          counters: { mark: 1 },
          zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        },
        [externalSourceId]: {
          id: externalSourceId,
          definitionId: CRYSTAL_WALL,
          owner: "corp",
          controller: "corp",
          faceup: true,
          rezzed: true,
          zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        },
      },
      corp: {
        servers: [
          {
            id: "rd",
            label: "R&D",
            kind: "rd",
            ice: [targetId, externalSourceId],
            root: [],
          },
        ],
      },
      run: {
        attackedServerId: "rd",
        encounteredIceId: targetId,
        runDurationAdditionalSubroutineModifiers: [
          {
            modifierId: "tutor_modifier_1",
            sourceCardInstanceId: externalSourceId,
            sourceDefinitionId: CRYSTAL_WALL,
            subroutineKind: "end_the_run",
            append: "after_existing",
          },
          {
            modifierId: "tutor_modifier_2",
            sourceCardInstanceId: externalSourceId,
            sourceDefinitionId: CRYSTAL_WALL,
            subroutineKind: "end_the_run",
            append: "after_existing",
          },
        ],
        encounterAdditionalSubroutines: [
          {
            sourceCardInstanceId: targetId,
            sourceDefinitionId: CRYSTAL_WALL,
            sourceTitle: definition.title,
            subroutineKind: "end_the_run",
          },
        ],
      },
    } as unknown as GameState;

    const subroutines = effectiveIceRunSubroutines(state, targetId, definition);
    const ids = subroutines.map((subroutine) => subroutine.id);

    expect(
      ids.filter((id) => id.includes("run_duration.tutor_modifier_")),
    ).toHaveLength(2);
    expect(
      subroutines
        .filter((subroutine) =>
          subroutine.id.includes("run_duration.tutor_modifier_"),
        )
        .map((subroutine) => dynamicSubroutineAttributionFor(subroutine)),
    ).toEqual([
      expect.objectContaining({ sourceCardInstanceId: externalSourceId }),
      expect.objectContaining({ sourceCardInstanceId: externalSourceId }),
    ]);
    expect(
      ids.filter((id) =>
        id.includes("current_encounter_additional_subroutine"),
      ),
    ).toHaveLength(2);
    expect(subroutines).toHaveLength(
      (definition.subroutines?.length ?? 0) * 2 + 4,
    );
  });

  it("places Tutor after Gatekeeper's paid subroutines", () => {
    const targetId = "gatekeeper" as CardInstanceId;
    const tutorId = "tutor" as CardInstanceId;
    const definition = CARD_DEFINITIONS_BY_ID[GATEKEEPER]!;
    const state = {
      cardInstances: {
        [targetId]: {
          id: targetId,
          definitionId: GATEKEEPER,
          owner: "corp",
          controller: "corp",
          faceup: true,
          rezzed: true,
          variableIceState: {
            family: "paid_end_the_run_subroutines",
            additionalCostPaid: 4,
            subroutineCount: 2,
          },
          zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        },
        [tutorId]: {
          id: tutorId,
          definitionId: TUTOR,
          owner: "corp",
          controller: "corp",
          faceup: true,
          rezzed: true,
          zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        },
      },
      corp: {
        servers: [
          {
            id: "rd",
            label: "R&D",
            kind: "rd",
            ice: [targetId, tutorId],
            root: [],
          },
        ],
      },
      run: {
        attackedServerId: "rd",
        encounteredIceId: targetId,
        runDurationAdditionalSubroutineModifiers: [
          {
            modifierId: "tutor_modifier",
            sourceCardInstanceId: tutorId,
            sourceDefinitionId: TUTOR,
            subroutineKind: "end_the_run",
            append: "after_existing",
          },
        ],
      },
    } as unknown as GameState;

    expect(
      effectiveIceRunSubroutines(state, targetId, definition).map(
        (subroutine) => subroutine.id,
      ),
    ).toEqual([
      "variable_ice_paid_end_the_run_1",
      "variable_ice_paid_end_the_run_2",
      "run_duration.tutor_modifier.end_the_run",
    ]);
  });

  it.each([
    ["code_gate", 1],
    ["wall", 0],
  ] as const)(
    "matches Encoder against Galatea's effective %s subtype",
    (selectedSubtype, expectedCount) => {
      const targetId = "galatea" as CardInstanceId;
      const encoderId = "encoder" as CardInstanceId;
      const state = {
        cardInstances: {
          [targetId]: {
            id: targetId,
            definitionId: GALATEA,
            owner: "corp",
            controller: "corp",
            faceup: true,
            rezzed: true,
            variableIceState: {
              family: "alternate_subtype",
              additionalCostPaid: selectedSubtype === "code_gate" ? 1 : 0,
              value: 1,
              selectedSubtypes: [selectedSubtype],
            },
            zone: {
              side: "corp",
              zone: "serverIce",
              serverId: "remote_1",
            },
          },
          [encoderId]: {
            id: encoderId,
            definitionId: ENCODER,
            owner: "corp",
            controller: "corp",
            faceup: true,
            rezzed: true,
            zone: {
              side: "corp",
              zone: "serverRoot",
              serverId: "remote_1",
            },
          },
        },
        corp: {
          servers: [
            {
              id: "remote_1",
              label: "Remote 1",
              kind: "remote",
              ice: [targetId],
              root: [encoderId],
            },
          ],
        },
      } as unknown as GameState;

      expect(additionalSubroutinesForIce(state, targetId)).toHaveLength(
        expectedCount,
      );
    },
  );
});
