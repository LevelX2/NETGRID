import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildLookTopStackTakeMatchingChoice,
  buildLookTopStackTakeMatchingPayload,
  buildRevealedStackProgramInstallChoice,
  buildSearchStackInstallChoice,
  buildSearchStackInstallPayload,
  buildSearchStackToGripChoice,
  buildSearchStackToGripPayload,
  buildSearchTrashToGripChoice,
  buildSearchTrashToGripPayload,
  buildPaidStackProgramInstallChoice,
  buildTemporaryProgramInstallChoice,
  buildTemporaryProgramInstallSourceChoice,
  buildTemporaryProgramInstallSourceChoicePayload,
} from "./search-choice-builders";

const sourceCardId = "source_card" as CardInstanceId;
const sourceDefinitionId = "source_definition" as CardDefinitionId;

describe("hidden-zone search choice builders", () => {
  it("builds search-to-grip choices and payloads without changing marker fields", () => {
    const stackChoice = buildSearchStackToGripChoice({
      stateVersion: 12,
      sourceCardId,
      sourceDefinitionId,
      filter: "program",
      revealToCorp: true,
      shuffleAfterwards: true,
      options: [
        { id: "card_stack_program", label: "Program", value: "stack_program" },
        {
          id: "card_stack_resource",
          label: "Resource",
          value: "stack_resource",
          selectable: false,
        },
      ],
    });
    const trashChoice = buildSearchTrashToGripChoice({
      stateVersion: 12,
      sourceCardId,
      sourceDefinitionId,
      filter: "any_card",
      options: [{ id: "card_heap_card", label: "Heap Card", value: "heap_card" }],
    });

    expect(stackChoice).toEqual({
      choiceId: "p3_37_search_stack_to_grip_13",
      side: "runner",
      source:
        "p3_37.search_stack_to_grip:source_card:source_definition:program:reveal:shuffle:13",
      prompt: "Stack durchsuchen",
      kind: "select_cards",
      options: [
        { id: "card_stack_program", label: "Program", value: "stack_program" },
        {
          id: "card_stack_resource",
          label: "Resource",
          value: "stack_resource",
          selectable: false,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 13,
      visibility: "hidden_info_barrier",
      cardSearchPresentation: {
        sourceZone: "stack",
        selectableFilter: "program",
        reveal: "public",
        destination: "grip",
        shuffleAfter: true,
        showNonMatchingCards: true,
        publicRevealKind: "reveal",
      },
    });
    expect(buildSearchStackToGripPayload({
      sourceDefinitionId,
      filter: "program",
      revealToCorp: true,
    })).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      sourceDefinitionId,
      searchedZone: "runner_stack",
      searchFilter: "program",
      searchRevealToCorp: true,
      shufflePerformed: false,
    });
    expect(trashChoice).toMatchObject({
      choiceId: "p3_37_search_trash_to_grip_13",
      source:
        "p3_37.search_trash_to_grip:source_card:source_definition:any_card:13",
      prompt: "Heap durchsuchen",
      cardSearchPresentation: {
        sourceZone: "heap",
        selectableFilter: "any_card",
        reveal: "hidden",
        destination: "grip",
        shuffleAfter: false,
      },
    });
    expect(buildSearchTrashToGripPayload({
      sourceDefinitionId,
      filter: "any_card",
    })).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      sourceDefinitionId,
      searchedZone: "runner_heap",
      searchFilter: "any_card",
    });
  });

  it("builds top-N take-matching and stack-install choices without execution side effects", () => {
    const takeMatching = buildLookTopStackTakeMatchingChoice({
      stateVersion: 2,
      sourceCardId,
      sourceDefinitionId,
      count: 5,
      allowedTypes: ["program", "event"],
      costPerTaken: 1,
      revealTakenToCorp: true,
      shuffleRemainder: true,
      options: [
        { id: "card_program", label: "Program", value: "program" },
        { id: "card_resource", label: "Resource", value: "resource", selectable: false },
      ],
      maxSelections: 1,
    });
    const install = buildSearchStackInstallChoice({
      stateVersion: 2,
      sourceCardId,
      sourceDefinitionId,
      filter: "program",
      installCost: "free",
      shuffleAfterwards: true,
      options: [{ id: "card_program", label: "Program", value: "program" }],
    });

    expect(takeMatching).toMatchObject({
      choiceId: "p3_37_look_top_stack_take_matching_3",
      source:
        "p3_37.look_top_stack_take_matching:source_card:source_definition:5:program,event:1:reveal:shuffle:3",
      minSelections: 0,
      maxSelections: 1,
      stackSearchResolution: {
        reveal: "public",
        destination: "grip",
        shuffleAfter: true,
        publicRevealKind: "reveal",
      },
      cardSearchPresentation: {
        sourceZone: "stack",
        selectableFilter: "matching_cards",
        reveal: "public",
        destination: "grip",
        shuffleAfter: true,
        publicRevealKind: "reveal",
        showNonMatchingCards: true,
      },
    });
    expect(buildLookTopStackTakeMatchingPayload({
      sourceDefinitionId,
      privateLookCount: 5,
      costPerTaken: 1,
    })).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      sourceDefinitionId,
      privateLookCount: 5,
      searchedZone: "runner_stack",
      costPerTaken: 1,
    });
    expect(install).toMatchObject({
      choiceId: "p3_38_search_stack_install_3",
      source:
        "p3_38.search_stack_install:source_card:source_definition:program:free:shuffle:3",
      prompt: "Stack durchsuchen und Programm installieren",
      cardSearchPresentation: {
        sourceZone: "stack",
        selectableFilter: "program",
        reveal: "public",
        destination: "install_program",
        shuffleAfter: true,
        publicRevealKind: "reveal",
      },
    });
    expect(buildSearchStackInstallPayload({
      sourceDefinitionId,
      filter: "program",
    })).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_38_search_stack_install",
      sourceDefinitionId,
      searchedZone: "runner_stack",
      searchFilter: "program",
      searchDestination: "install_program",
      shufflePerformed: false,
    });
  });

  it("builds SMC, Sneak Preview and Mystery Box search choices with stable sources", () => {
    const smc = buildPaidStackProgramInstallChoice({
      stateVersion: 7,
      sourceCardId,
      options: [{ id: "card_program", label: "Program", value: "program" }],
    });
    const sneakSource = buildTemporaryProgramInstallSourceChoice({
      stateVersion: 7,
      sourcePrefix: "p3_38.stack_or_trash_program_install",
      sourceCardId,
      sourceDefinitionId,
      options: [{ id: "source_stack", label: "Stack", value: "stack" }],
    });
    const sneakProgram = buildTemporaryProgramInstallChoice({
      stateVersion: 7,
      sourceZone: "stack",
      sourcePrefix: "v1911.temporary_program_install",
      sourceDefinitionId,
      options: [{ id: "card_program", label: "Program", value: "program" }],
    });
    const mystery = buildRevealedStackProgramInstallChoice({
      stateVersion: 7,
      sourceCardId,
      topCards: ["top_a", "top_b"] as CardInstanceId[],
      options: [{ id: "card_top_a", label: "Program", publicLabel: "Program", value: "top_a" }],
    });

    expect(smc).toMatchObject({
      choiceId: "v1911_hidden_stack_program_install_8",
      source: "v1911.hidden_stack_program_install:source_card:8",
      cardSearchPresentation: {
        sourceZone: "stack",
        selectableFilter: "program",
        reveal: "public",
        destination: "install_program",
        shuffleAfter: true,
        publicRevealKind: "reveal",
      },
    });
    expect(sneakSource).toMatchObject({
      choiceId: "v1911_temporary_program_install_source_8",
      source:
        "p3_38.stack_or_trash_program_install_source:source_card:source_definition:8",
      prompt: "Sneak-Preview-Quelle wählen",
      visibility: "hidden_info_barrier",
    });
    expect(buildTemporaryProgramInstallSourceChoicePayload()).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "temporary_program_install_source_choice",
      choiceVisibility: "runner_private",
    });
    expect(sneakProgram).toMatchObject({
      choiceId: "v1911_temporary_program_install_stack_install_8",
      source: "v1911.temporary_program_install_stack_install:8",
      prompt: "Programm aus dem Stack installieren",
      cardSearchPresentation: {
        sourceZone: "stack",
        selectableFilter: "program",
        reveal: "public",
        destination: "install_program",
        shuffleAfter: true,
        publicRevealKind: "reveal",
        showNonMatchingCards: true,
        temporaryReturnAtEndOfTurn: true,
      },
    });
    expect(mystery).toMatchObject({
      choiceId: "v1915_revealed_stack_program_install_8",
      source: "v1915.revealed_stack_program_install:source_card:top_a,top_b:8",
      prompt: "Programm aus offengelegtem Stack installieren",
      visibility: "public",
    });
  });
});
