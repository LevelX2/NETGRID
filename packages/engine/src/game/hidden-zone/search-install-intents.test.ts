import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildSelfModifyingCodeMemoryDeferredPayload,
  buildSelfModifyingCodeResolvedPayload,
  buildSneakPreviewSearchInstallResolvedPayload,
  resolveSelfModifyingCodeSearchInstallIntent,
  resolveSneakPreviewSearchInstallIntent,
} from "./search-install-intents";

const sourceDefinitionId = "onr_v1_059_self-modifying-code" as CardDefinitionId;
const selectedCardId = "stack_program" as CardInstanceId;
const selectedDefinitionId = "simple_decoder" as CardDefinitionId;
const sneakPreviewDefinitionId =
  "onr_v1_089_sneak-preview" as CardDefinitionId;

function choice(overrides: Partial<ChoiceRequest> = {}): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "runner",
    source: "v1911.self_modifying_code_install_program:source_card:8",
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
    expect(buildSelfModifyingCodeResolvedPayload(plan, {
      installed: true,
    })).toEqual({
      hiddenZoneBarrier: true,
      sourceDefinitionId,
      hiddenZoneAction: "self_modifying_code_install_program",
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
    expect(buildSelfModifyingCodeMemoryDeferredPayload(plan, {
      installDeferredForMemory: true,
    })).toEqual({
      hiddenZoneBarrier: true,
      sourceDefinitionId,
      hiddenZoneAction: "self_modifying_code_install_program",
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
    expect(buildSelfModifyingCodeResolvedPayload(blocked, {
      installed: false,
    })).toMatchObject({
      searchDestination: "runner_stack",
      installed: false,
      installBlockedReason: "insufficient_credits",
    });
  });

  it("builds a Sneak Preview stack search/install plan", () => {
    const plan = resolveSneakPreviewSearchInstallIntent({
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
    expect(buildSneakPreviewSearchInstallResolvedPayload(plan)).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "sneak_preview_program_install",
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
    const plan = resolveSneakPreviewSearchInstallIntent({
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
    expect(buildSneakPreviewSearchInstallResolvedPayload(plan)).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "sneak_preview_program_install",
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
      resolveSneakPreviewSearchInstallIntent({
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
});
