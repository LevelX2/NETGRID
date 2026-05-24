import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  createMysteryBoxFreeProgramInstallInput,
  createSneakPreviewFreeProgramInstallInput,
  executeFreeProgramInstallPlan,
  type FreeProgramInstallExecutionInput,
} from "./free-program-install-execution";
import type {
  MysteryBoxSearchInstallExecutionPlan,
  SneakPreviewSearchInstallExecutionPlan,
} from "./search-install-intents";

const programId = "program_1" as CardInstanceId;
const sourceCardId = "source_card" as CardInstanceId;
const programDefinitionId = "program_definition" as CardDefinitionId;
const sourceDefinitionId = "source_definition" as CardDefinitionId;

function sneakPlan(
  overrides: Partial<SneakPreviewSearchInstallExecutionPlan> = {},
): SneakPreviewSearchInstallExecutionPlan {
  return {
    selectedCardId: programId,
    selectedCardDefinitionId: programDefinitionId,
    sourceDefinitionId,
    sourceZone: "stack",
    destination: "install_program",
    shuffleNeeded: true,
    sourceTrashNeeded: false,
    freeInstall: true,
    temporaryReturnNeeded: true,
    isCardImplementationChoice: false,
    ...overrides,
  };
}

function mysteryPlan(
  overrides: Partial<MysteryBoxSearchInstallExecutionPlan> = {},
): MysteryBoxSearchInstallExecutionPlan {
  return {
    sourceCardId,
    topCardIds: [programId],
    programCandidateIds: [programId],
    selectedCardId: programId,
    selectedCardDefinitionId: programDefinitionId,
    destination: "install_program",
    shuffleNeeded: true,
    freeInstall: true,
    sourceTrashNeeded: true,
    revealTopCards: true,
    showToCorp: true,
    installedProgramCount: 1,
    selfTrashed: true,
    ...overrides,
  };
}

describe("free program install execution", () => {
  it("executes the install callback with the selected program id", () => {
    const calls: string[] = [];
    const plan: FreeProgramInstallExecutionInput = {
      selectedProgramId: programId,
      sourceZone: "stack",
      freeInstall: true,
      temporaryReturnNeeded: false,
      sourceTrashNeeded: false,
      shuffleNeeded: true,
    };

    const result = executeFreeProgramInstallPlan({
      plan,
      callbacks: {
        installProgramForFree: (cardId) => {
          calls.push(cardId);
          return cardId;
        },
      },
    });

    expect(calls).toEqual([programId]);
    expect(result).toEqual({
      ...plan,
      installedProgramId: programId,
    });
  });

  it("carries Sneak Preview temporary return and stack shuffle metadata", () => {
    const plan = createSneakPreviewFreeProgramInstallInput(sneakPlan());

    expect(plan).toEqual({
      selectedProgramId: programId,
      sourceZone: "stack",
      sourceCardId: undefined,
      freeInstall: true,
      temporaryReturnNeeded: true,
      sourceTrashNeeded: false,
      shuffleNeeded: true,
    });
  });

  it("carries Sneak Preview heap metadata without shuffle", () => {
    const plan = createSneakPreviewFreeProgramInstallInput(
      sneakPlan({
        sourceZone: "heap",
        shuffleNeeded: false,
      }),
    );

    expect(plan).toMatchObject({
      selectedProgramId: programId,
      sourceZone: "heap",
      freeInstall: true,
      temporaryReturnNeeded: true,
      sourceTrashNeeded: false,
      shuffleNeeded: false,
    });
  });

  it("carries Mystery Box source-trash and shuffle metadata", () => {
    const plan = createMysteryBoxFreeProgramInstallInput(mysteryPlan());

    expect(plan).toEqual({
      selectedProgramId: programId,
      sourceZone: "stack",
      sourceCardId,
      freeInstall: true,
      temporaryReturnNeeded: false,
      sourceTrashNeeded: true,
      shuffleNeeded: true,
    });
  });

  it("rejects Mystery Box plans without an install target", () => {
    expect(() =>
      createMysteryBoxFreeProgramInstallInput(
        mysteryPlan({
          selectedCardId: undefined,
          selectedCardDefinitionId: undefined,
          freeInstall: false,
          sourceTrashNeeded: false,
          installedProgramCount: 0,
          selfTrashed: false,
        }),
      ),
    ).toThrow("Mystery Box hat kein installiertes Programm im Plan.");
  });

  it("fails when the install callback does not return an installed id", () => {
    expect(() =>
      executeFreeProgramInstallPlan({
        plan: createSneakPreviewFreeProgramInstallInput(sneakPlan()),
        callbacks: {
          installProgramForFree: () => undefined,
        },
      }),
    ).toThrow("Das kostenlose Programm konnte nicht installiert werden.");
  });
});
