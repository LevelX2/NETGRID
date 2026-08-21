import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { dynamicSubroutineAttributionFor } from "../../ability-engine/additional-subroutine-modifiers";
import { effectiveIceRunSubroutines } from "./effective-ice-run-subroutines";

const CRYSTAL_WALL = "onr_v1_232_crystal-wall" as CardDefinitionId;

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
});
