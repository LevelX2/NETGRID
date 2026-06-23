import type { CardInstanceId } from "@netgrid/shared";
import type {
  MysteryBoxSearchInstallExecutionPlan,
  SearchInstallSourceZone,
  SneakPreviewSearchInstallExecutionPlan,
} from "./search-install-intents";

export type FreeProgramInstallSourceZone = SearchInstallSourceZone;

export type FreeProgramInstallExecutionInput = {
  selectedProgramId: CardInstanceId;
  sourceZone: FreeProgramInstallSourceZone;
  sourceCardId?: CardInstanceId | undefined;
  freeInstall: true;
  temporaryReturnNeeded: boolean;
  sourceTrashNeeded: boolean;
  shuffleNeeded: boolean;
};

export type FreeProgramInstallExecutionResult = FreeProgramInstallExecutionInput & {
  installedProgramId: CardInstanceId;
};

export type FreeProgramInstallExecutionCallbacks = {
  installProgramForFree: (programId: CardInstanceId) => CardInstanceId | undefined;
};

export function createTemporaryProgramFreeInstallInput(
  plan: SneakPreviewSearchInstallExecutionPlan,
): FreeProgramInstallExecutionInput {
  return {
    selectedProgramId: plan.selectedCardId,
    sourceZone: plan.sourceZone,
    sourceCardId: plan.sourceCardId,
    freeInstall: true,
    temporaryReturnNeeded: plan.temporaryReturnNeeded,
    sourceTrashNeeded: plan.sourceTrashNeeded,
    shuffleNeeded: plan.shuffleNeeded,
  };
}

export function createMysteryBoxFreeProgramInstallInput(
  plan: MysteryBoxSearchInstallExecutionPlan,
): FreeProgramInstallExecutionInput {
  if (!plan.selectedCardId)
    throw new Error("Mystery Box hat kein installiertes Programm im Plan.");
  return {
    selectedProgramId: plan.selectedCardId,
    sourceZone: "stack",
    sourceCardId: plan.sourceCardId,
    freeInstall: true,
    temporaryReturnNeeded: false,
    sourceTrashNeeded: plan.sourceTrashNeeded,
    shuffleNeeded: plan.shuffleNeeded,
  };
}

export function executeFreeProgramInstallPlan(input: {
  plan: FreeProgramInstallExecutionInput;
  callbacks: FreeProgramInstallExecutionCallbacks;
}): FreeProgramInstallExecutionResult {
  const installedProgramId = input.callbacks.installProgramForFree(
    input.plan.selectedProgramId,
  );
  if (!installedProgramId)
    throw new Error("Das kostenlose Programm konnte nicht installiert werden.");
  return {
    ...input.plan,
    installedProgramId,
  };
}
