import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildSelfModifyingCodeMemoryDeferredPayload,
  buildSelfModifyingCodeResolvedPayload,
  resolveSelfModifyingCodeSearchInstallIntent,
} from "./search-install-intents";

const sourceDefinitionId = "onr_v1_059_self-modifying-code" as CardDefinitionId;
const selectedCardId = "stack_program" as CardInstanceId;
const selectedDefinitionId = "simple_decoder" as CardDefinitionId;

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
});
