import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildRevealedStackNoProgramInstallResolvedPayload,
  buildRevealedStackProgramInstallResolvedPayload,
  buildSelfModifyingCodeMemoryDeferredPayload,
  buildSelfModifyingCodeResolvedPayload,
  buildTemporaryProgramSearchInstallResolvedPayload,
  createRevealedStackNoProgramInstallIntent,
  resolveRevealedStackProgramInstallIntent,
  resolveSelfModifyingCodeSearchInstallIntent,
  resolveTemporaryProgramSearchInstallIntent,
} from "./search-install-intents";

const sourceDefinitionId = "onr_v1_059_self-modifying-code" as CardDefinitionId;
const selectedCardId = "stack_program" as CardInstanceId;
const selectedDefinitionId = "simple_decoder" as CardDefinitionId;
const sneakPreviewDefinitionId = "onr_v1_089_sneak-preview" as CardDefinitionId;
const mysterySourceCardId = "mystery_box" as CardInstanceId;

function choice(overrides: Partial<ChoiceRequest> = {}): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "runner",
    source: "v1911.hidden_stack_program_install:source_card:8",
    prompt: "Stack durchsuchen",
    kind: "select_cards",
    options: [],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 8,
    visibility: "hidden_info_barrier",
    ...overrides,
  };
}

describe("hidden-zone search/install intents", () => {
  it("builds an SMC search/install plan for a legal stack program", () => {
    const plan = resolveSelfModifyingCodeSearchInstallIntent({
      choice: choice(),
      selectedCardId,
      stackCardIds: [selectedCardId],
      selectedCardDefinition: {
        id: selectedDefinitionId,
        type: "program",
        installCost: 3,
        memoryCost: 1,
      },
      availableInstallCredits: 3,
      runnerMemoryUsed: 0,
      runnerMemoryLimit: 4,
      uniqueBlocked: false,
      sourceDefinitionId,
    });

    expect(plan).toEqual({
      selectedCardId,
      selectedCardDefinitionId: selectedDefinitionId,
      sourceCardId: "source_card",
      sourceDefinitionId,
      sourceZone: "stack",
      destination: "install_program",
      shuffleNeeded: true,
      sourceTrashNeeded: true,
      freeInstall: false,
      temporaryReturnNeeded: false,
      canPay: true,
      uniqueBlocked: false,
      needsMemory: false,
      shouldOpenMemoryChoice: false,
      canAttemptInstall: true,
    });
    expect(
      buildSelfModifyingCodeResolvedPayload(plan, {
        installed: true,
      }),
    ).toEqual({
      hiddenZoneBarrier: true,
      sourceDefinitionId,
      hiddenZoneAction: "hidden_stack_program_install",
      publicRevealKind: "reveal",
      publicRevealDefinitionId: selectedDefinitionId,
      selectedCount: 1,
      searchDestination: "runner_rig",
      shuffled: true,
      installed: true,
    });
  });

  it("marks SMC memory deferral without installing or mutating", () => {
    const plan = resolveSelfModifyingCodeSearchInstallIntent({
      choice: choice(),
      selectedCardId,
      stackCardIds: [selectedCardId],
      selectedCardDefinition: {
        id: selectedDefinitionId,
        type: "program",
        installCost: 2,
        memoryCost: 3,
      },
      availableInstallCredits: 2,
      runnerMemoryUsed: 2,
      runnerMemoryLimit: 4,
      uniqueBlocked: false,
      sourceDefinitionId,
    });

    expect(plan.shouldOpenMemoryChoice).toBe(true);
    expect(
      buildSelfModifyingCodeMemoryDeferredPayload(plan, {
        installDeferredForMemory: true,
      }),
    ).toEqual({
      hiddenZoneBarrier: true,
      sourceDefinitionId,
      hiddenZoneAction: "hidden_stack_program_install",
      publicRevealKind: "reveal",
      publicRevealDefinitionId: selectedDefinitionId,
      selectedCount: 1,
      searchDestination: "install_program",
      shuffled: true,
      installDeferredForMemory: true,
      installed: false,
    });
  });

  it("rejects invalid SMC selections and reports blocked install plans", () => {
    expect(() =>
      resolveSelfModifyingCodeSearchInstallIntent({
        choice: choice(),
        selectedCardId,
        stackCardIds: ["other_card" as CardInstanceId],
        selectedCardDefinition: {
          id: selectedDefinitionId,
          type: "program",
        },
        availableInstallCredits: 0,
        runnerMemoryUsed: 0,
        runnerMemoryLimit: 4,
        uniqueBlocked: false,
        sourceDefinitionId,
      }),
    ).toThrow("Die gewählte Karte liegt nicht im Stack.");

    const blocked = resolveSelfModifyingCodeSearchInstallIntent({
      choice: choice(),
      selectedCardId,
      stackCardIds: [selectedCardId],
      selectedCardDefinition: {
        id: selectedDefinitionId,
        type: "program",
        installCost: 4,
      },
      availableInstallCredits: 1,
      runnerMemoryUsed: 0,
      runnerMemoryLimit: 4,
      uniqueBlocked: false,
      sourceDefinitionId,
    });

    expect(blocked.canAttemptInstall).toBe(false);
    expect(
      buildSelfModifyingCodeResolvedPayload(blocked, {
        installed: false,
      }),
    ).toMatchObject({
      searchDestination: "runner_stack",
      installed: false,
      installBlockedReason: "insufficient_credits",
    });
  });

  it("builds a Sneak Preview stack search/install plan", () => {
    const plan = resolveTemporaryProgramSearchInstallIntent({
      choice: choice({
        source: "v1911.sneak_preview_stack_install:8",
      }),
      selectedCardId,
      legalTargetIdsForSourceZone: () => [selectedCardId],
      selectedCardDefinition: {
        id: selectedDefinitionId,
        type: "program",
      },
      defaultSourceDefinitionId: sneakPreviewDefinitionId,
    });

    expect(plan).toEqual({
      selectedCardId,
      selectedCardDefinitionId: selectedDefinitionId,
      sourceCardId: undefined,
      sourceDefinitionId: sneakPreviewDefinitionId,
      sourceZone: "stack",
      destination: "install_program",
      shuffleNeeded: true,
      sourceTrashNeeded: false,
      freeInstall: true,
      temporaryReturnNeeded: true,
      isCardImplementationChoice: false,
    });
    expect(buildTemporaryProgramSearchInstallResolvedPayload(plan)).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "temporary_program_install",
      sourceDefinitionId: sneakPreviewDefinitionId,
      searchReveal: "public",
      searchDestination: "install_program",
      searchShuffleAfter: true,
      shuffled: true,
      temporaryInstall: true,
      selectedCount: 1,
      installedProgramDefinitionId: selectedDefinitionId,
      publicRevealKind: "reveal",
      publicRevealDefinitionId: selectedDefinitionId,
    });
  });

  it("builds a Sneak Preview heap search/install plan without shuffle", () => {
    const plan = resolveTemporaryProgramSearchInstallIntent({
      choice: choice({
        source: "v1911.sneak_preview_heap_install:8",
      }),
      selectedCardId,
      legalTargetIdsForSourceZone: () => [selectedCardId],
      selectedCardDefinition: {
        id: selectedDefinitionId,
        type: "program",
      },
      defaultSourceDefinitionId: sneakPreviewDefinitionId,
    });

    expect(plan).toMatchObject({
      selectedCardId,
      selectedCardDefinitionId: selectedDefinitionId,
      sourceDefinitionId: sneakPreviewDefinitionId,
      sourceZone: "heap",
      destination: "install_program",
      shuffleNeeded: false,
      sourceTrashNeeded: false,
      freeInstall: true,
      temporaryReturnNeeded: true,
      isCardImplementationChoice: false,
    });
    expect(buildTemporaryProgramSearchInstallResolvedPayload(plan)).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "temporary_program_install",
      sourceDefinitionId: sneakPreviewDefinitionId,
      searchReveal: "hidden",
      searchDestination: "install_program",
      searchShuffleAfter: false,
      shuffled: false,
      temporaryInstall: true,
      selectedCount: 1,
      installedProgramDefinitionId: selectedDefinitionId,
    });
  });

  it("rejects invalid Sneak Preview program selections", () => {
    expect(() =>
      resolveTemporaryProgramSearchInstallIntent({
        choice: choice({
          source: "v1911.sneak_preview_stack_install:8",
        }),
        selectedCardId,
        legalTargetIdsForSourceZone: () => ["other_card" as CardInstanceId],
        selectedCardDefinition: {
          id: selectedDefinitionId,
          type: "program",
        },
        defaultSourceDefinitionId: sneakPreviewDefinitionId,
      }),
    ).toThrow("Dieses Programm ist nicht mehr legal installierbar.");
  });

  it("builds a Mystery Box no-install plan for top cards without programs", () => {
    const topCardIds = [
      "top_event_1",
      "top_event_2",
      "top_event_3",
    ] as CardInstanceId[];
    const plan = createRevealedStackNoProgramInstallIntent({
      sourceCardId: mysterySourceCardId,
      topCardIds,
      programCandidateIds: [],
    });

    expect(plan).toEqual({
      sourceCardId: mysterySourceCardId,
      topCardIds,
      programCandidateIds: [],
      destination: "install_program",
      shuffleNeeded: true,
      freeInstall: false,
      sourceTrashNeeded: false,
      revealTopCards: true,
      showToCorp: true,
      installedProgramCount: 0,
      selfTrashed: false,
    });
    expect(
      buildRevealedStackNoProgramInstallResolvedPayload(plan, {
        randomCounterAfter: 4,
      }),
    ).toEqual({
      programFound: false,
      installedProgramCount: 0,
      selfTrashed: false,
      randomCounterAfter: 4,
    });
  });

  it("builds a Mystery Box top-five program install plan", () => {
    const topCardIds = [
      selectedCardId,
      "top_event",
      "second_program",
    ] as CardInstanceId[];
    const plan = resolveRevealedStackProgramInstallIntent({
      choice: choice({
        source: `v1915.mystery_box:${mysterySourceCardId}:${topCardIds.join(",")}:8`,
      }),
      selectedCardId,
      topCardIds,
      programCandidateIds: [selectedCardId, "second_program" as CardInstanceId],
      selectedCardDefinition: {
        id: selectedDefinitionId,
        type: "program",
      },
    });

    expect(plan).toEqual({
      sourceCardId: mysterySourceCardId,
      topCardIds,
      programCandidateIds: [selectedCardId, "second_program"],
      selectedCardId,
      selectedCardDefinitionId: selectedDefinitionId,
      destination: "install_program",
      shuffleNeeded: true,
      freeInstall: true,
      sourceTrashNeeded: true,
      revealTopCards: true,
      showToCorp: true,
      installedProgramCount: 1,
      selfTrashed: true,
    });
    expect(
      buildRevealedStackProgramInstallResolvedPayload(plan, {
        randomCounterAfter: 5,
      }),
    ).toEqual({
      v1915RunnerProgramAbility: "top5_program_install",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "revealed_stack_program_install",
      installedProgramDefinitionId: selectedDefinitionId,
      installedProgramCount: 1,
      selfTrashed: true,
      randomCounterAfter: 5,
    });
  });

  it("rejects invalid Mystery Box top-five install selections", () => {
    expect(() =>
      resolveRevealedStackProgramInstallIntent({
        choice: choice({
          source: `v1915.mystery_box:${mysterySourceCardId}:top_event:8`,
        }),
        selectedCardId,
        topCardIds: ["top_event" as CardInstanceId],
        programCandidateIds: [selectedCardId],
        selectedCardDefinition: {
          id: selectedDefinitionId,
          type: "program",
        },
      }),
    ).toThrow("Das gewaehlte Programm liegt nicht mehr im Reveal-Fenster.");

    expect(() =>
      resolveRevealedStackProgramInstallIntent({
        choice: choice({
          source: `v1915.mystery_box:${mysterySourceCardId}:${selectedCardId}:8`,
        }),
        selectedCardId,
        topCardIds: [selectedCardId],
        programCandidateIds: [selectedCardId],
        selectedCardDefinition: {
          id: "simple_event" as CardDefinitionId,
          type: "event",
        },
      }),
    ).toThrow("Der offengelegte Stack-Plan kann nur ein Programm installieren.");
  });
});
