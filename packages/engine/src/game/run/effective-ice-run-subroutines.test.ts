import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { effectiveIceRunSubroutines } from "./effective-ice-run-subroutines";

const CRYSTAL_WALL = "onr_v1_232_crystal-wall" as CardDefinitionId;

describe("effective ICE run subroutines", () => {
  it("duplicates self-provided subroutines per mark but not a subroutine supplied by another ICE", () => {
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
        futureEncounterEndTheRunSourceIceId: externalSourceId,
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

    const subroutines = effectiveIceRunSubroutines(
      state,
      targetId,
      definition,
    );
    const ids = subroutines.map((subroutine) => subroutine.id);

    expect(
      ids.filter((id) => id === "v1922_tutor_future_end_the_run"),
    ).toHaveLength(1);
    expect(
      ids.filter((id) =>
        id.includes("current_encounter_additional_subroutine"),
      ),
    ).toHaveLength(2);
    expect(subroutines).toHaveLength(
      (definition.subroutines?.length ?? 0) * 2 + 3,
    );
  });
});
