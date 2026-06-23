import type { CardInstanceId, ChoiceRequest } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  resolveLookTopStackTakeMatchingSelection,
  resolveMysteryBoxInstallSelection,
  resolveSearchStackInstallSelection,
  resolveSearchToGripSelection,
  resolveSelfModifyingCodeSearchInstallSelection,
  resolveSneakPreviewSearchInstallSelection,
} from "./search-choice-resolvers";

function choice(overrides: Partial<ChoiceRequest>): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "runner",
    source: "test",
    prompt: "Test",
    kind: "select_cards",
    options: [],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "hidden_info_barrier",
    ...overrides,
  };
}

describe("hidden-zone search choice resolvers", () => {
  it("validates search-to-grip selections without mutating inputs", () => {
    const selectedCardId = "stack_program" as CardInstanceId;
    const legalTargetIds = [selectedCardId] as CardInstanceId[];
    const beforeTargets = [...legalTargetIds];

    const result = resolveSearchToGripSelection({
      choice: choice({
        source:
          "p3_37.search_stack_to_grip:source_card:source_definition:program:reveal:shuffle:13",
      }),
      selectedCardId,
      legalTargetIdsFor: () => legalTargetIds,
    });

    expect(result).toEqual({
      sourceCardId: "source_card",
      sourceDefinitionId: "source_definition",
      filter: "program",
      sourceZone: "stack",
      selectedCardId,
      revealToCorp: true,
      shuffleNeeded: true,
    });
    expect(legalTargetIds).toEqual(beforeTargets);
    expect(() =>
      resolveSearchToGripSelection({
        choice: choice({
          source:
            "p3_37.search_trash_to_grip:source_card:source_definition:any_card:13",
        }),
        selectedCardId: "other_card" as CardInstanceId,
        legalTargetIdsFor: () => legalTargetIds,
      }),
    ).toThrow("Die gewaehlte Karte ist fuer diese Suche nicht legal.");
  });

  it("validates stack-install and top-N take-matching intents", () => {
    const installProgramId = "install_program" as CardInstanceId;
    expect(resolveSearchStackInstallSelection({
      choice: choice({
        source:
          "p3_38.search_stack_install:source_card:source_definition:program:free:shuffle:3",
      }),
      selectedCardId: installProgramId,
      legalTargetIdsFor: () => [installProgramId],
    })).toEqual({
      sourceCardId: "source_card",
      sourceDefinitionId: "source_definition",
      filter: "program",
      installCost: "free",
      selectedCardId: installProgramId,
      shuffleNeeded: true,
    });

    const takenCardId = "taken_program" as CardInstanceId;
    expect(resolveLookTopStackTakeMatchingSelection({
      choice: choice({
        source:
          "p3_37.look_top_stack_take_matching:source_card:source_definition:5:program,event:2:reveal:shuffle:8",
      }),
      selectedCardIds: [takenCardId],
      topCardIdsForCount: () => [takenCardId, "other_card" as CardInstanceId],
      legalTargetIdsFor: () => [takenCardId],
      runnerCredits: 2,
    })).toEqual({
      sourceCardId: "source_card",
      sourceDefinitionId: "source_definition",
      count: 5,
      allowedTypes: ["program", "event"],
      costPerTaken: 2,
      selectedCardIds: [takenCardId],
      paidCredits: 2,
      shuffleNeeded: true,
    });
    expect(() =>
      resolveLookTopStackTakeMatchingSelection({
        choice: choice({
          source:
            "p3_37.look_top_stack_take_matching:source_card:source_definition:5:program:2:reveal:shuffle:8",
        }),
        selectedCardIds: [takenCardId],
        topCardIdsForCount: () => [takenCardId],
        legalTargetIdsFor: () => [takenCardId],
        runnerCredits: 1,
      }),
    ).toThrow("Der Runner kann die gewaehlten Stack-Karten nicht bezahlen.");
  });

  it("validates SMC, Sneak Preview and Mystery Box install selections", () => {
    const programId = "program" as CardInstanceId;
    expect(resolveSelfModifyingCodeSearchInstallSelection({
      choice: choice({
        source: "v1911.hidden_stack_program_install:source_card:8",
      }),
      selectedCardId: programId,
      stackCardIds: [programId],
      isSelectedProgram: true,
    })).toEqual({
      selectedCardId: programId,
      shuffleNeeded: true,
    });

    expect(resolveSneakPreviewSearchInstallSelection({
      choice: choice({
        source: "v1911.sneak_preview_stack_install:8",
      }),
      selectedCardId: programId,
      legalTargetIds: [programId],
      defaultSourceDefinitionId: "onr_v1_089_sneak-preview",
    })).toEqual({
      selectedCardId: programId,
      sourceZone: "stack",
      sourceDefinitionId: "onr_v1_089_sneak-preview",
      isCardImplementationChoice: false,
      shuffleNeeded: true,
    });

    expect(resolveMysteryBoxInstallSelection({
      choice: choice({
        source: "v1915.mystery_box:source_card:top_a,top_b:8",
      }),
      selectedCardId: programId,
      currentTopCardIds: [programId],
      isSelectedProgram: true,
    })).toEqual({
      sourceCardId: "source_card",
      selectedCardId: programId,
      shuffleNeeded: true,
    });
    expect(() =>
      resolveSelfModifyingCodeSearchInstallSelection({
        choice: choice({
          source: "v1911.hidden_stack_program_install:source_card:8",
        }),
        selectedCardId: programId,
        stackCardIds: [programId],
        isSelectedProgram: false,
      }),
    ).toThrow("Self-Modifying Code kann nur Programme installieren.");
  });
});
