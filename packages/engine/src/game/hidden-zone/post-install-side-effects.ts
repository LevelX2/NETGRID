import type {
  CardDefinitionId,
  CardInstanceId,
  SneakPreviewTemporaryInstall,
} from "@netgrid/shared";
import type { FreeProgramInstallExecutionResult } from "./free-program-install-execution";

export type SneakPreviewPostInstallSideEffectPlan = {
  kind: "sneak_preview";
  installedProgramId: CardInstanceId;
  selectedProgramId: CardInstanceId;
  sourceCardId?: CardInstanceId | undefined;
  sourceCardDefinitionId: CardDefinitionId;
  temporaryReturnNeeded: boolean;
  sourceTrashNeeded: false;
  oncePerRunNeeded: false;
  temporaryReturnRecord?: SneakPreviewTemporaryInstall | undefined;
};

export type MysteryBoxPostInstallSideEffectPlan = {
  kind: "mystery_box";
  installedProgramId: CardInstanceId;
  selectedProgramId: CardInstanceId;
  sourceCardId?: CardInstanceId | undefined;
  temporaryReturnNeeded: false;
  sourceTrashNeeded: boolean;
  oncePerRunNeeded: false;
};

export type MysteryBoxOncePerRunPlan = {
  kind: "mystery_box_once_per_run";
  sourceCardId: CardInstanceId;
  usedSourceIdsThisRun: CardInstanceId[];
  nextUsedSourceIdsThisRun: CardInstanceId[];
  oncePerRunUsed: true;
};

export type HiddenZonePostInstallSideEffectPlan =
  | SneakPreviewPostInstallSideEffectPlan
  | MysteryBoxPostInstallSideEffectPlan;

export function createSneakPreviewPostInstallSideEffectPlan(input: {
  execution: FreeProgramInstallExecutionResult;
  sourceCardDefinitionId: CardDefinitionId;
}): SneakPreviewPostInstallSideEffectPlan {
  const temporaryReturnRecord = input.execution.temporaryReturnNeeded
    ? {
        cardId: input.execution.installedProgramId,
        sourceCardDefinitionId: input.sourceCardDefinitionId,
      }
    : undefined;
  return {
    kind: "sneak_preview",
    installedProgramId: input.execution.installedProgramId,
    selectedProgramId: input.execution.selectedProgramId,
    sourceCardId: input.execution.sourceCardId,
    sourceCardDefinitionId: input.sourceCardDefinitionId,
    temporaryReturnNeeded: input.execution.temporaryReturnNeeded,
    sourceTrashNeeded: false,
    oncePerRunNeeded: false,
    temporaryReturnRecord,
  };
}

export function createMysteryBoxPostInstallSideEffectPlan(
  execution: FreeProgramInstallExecutionResult,
): MysteryBoxPostInstallSideEffectPlan {
  if (execution.sourceTrashNeeded && !execution.sourceCardId)
    throw new Error("Mystery Box hat keine Source fuer Source-Trash im Plan.");
  return {
    kind: "mystery_box",
    installedProgramId: execution.installedProgramId,
    selectedProgramId: execution.selectedProgramId,
    sourceCardId: execution.sourceCardId,
    temporaryReturnNeeded: false,
    sourceTrashNeeded: execution.sourceTrashNeeded,
    oncePerRunNeeded: false,
  };
}

export function createMysteryBoxOncePerRunPlan(input: {
  sourceCardId: CardInstanceId;
  usedSourceIdsThisRun: readonly CardInstanceId[];
}): MysteryBoxOncePerRunPlan {
  if (input.usedSourceIdsThisRun.includes(input.sourceCardId))
    throw new Error("Mystery Box wurde in diesem Run bereits genutzt.");
  return {
    kind: "mystery_box_once_per_run",
    sourceCardId: input.sourceCardId,
    usedSourceIdsThisRun: [...input.usedSourceIdsThisRun],
    nextUsedSourceIdsThisRun: [
      ...input.usedSourceIdsThisRun,
      input.sourceCardId,
    ].sort(),
    oncePerRunUsed: true,
  };
}

export function applySneakPreviewTemporaryReturnPlan(
  plan: SneakPreviewPostInstallSideEffectPlan,
  callbacks: {
    recordTemporaryReturn: (record: SneakPreviewTemporaryInstall) => void;
  },
): { temporaryReturnRecorded: boolean } {
  if (!plan.temporaryReturnNeeded || !plan.temporaryReturnRecord)
    return { temporaryReturnRecorded: false };
  callbacks.recordTemporaryReturn(plan.temporaryReturnRecord);
  return { temporaryReturnRecorded: true };
}

export function applyMysteryBoxSourceTrashPlan(
  plan: MysteryBoxPostInstallSideEffectPlan,
  callbacks: {
    trashSource: (sourceCardId: CardInstanceId) => void;
  },
): { sourceTrashed: boolean } {
  if (!plan.sourceTrashNeeded) return { sourceTrashed: false };
  if (!plan.sourceCardId)
    throw new Error("Mystery Box hat keine Source fuer Source-Trash im Plan.");
  callbacks.trashSource(plan.sourceCardId);
  return { sourceTrashed: true };
}

export function applyMysteryBoxOncePerRunPlan(
  plan: MysteryBoxOncePerRunPlan,
  callbacks: {
    markUsedThisRun: (usedSourceIds: CardInstanceId[]) => void;
  },
): { oncePerRunMarked: true } {
  callbacks.markUsedThisRun(plan.nextUsedSourceIdsThisRun);
  return { oncePerRunMarked: true };
}
