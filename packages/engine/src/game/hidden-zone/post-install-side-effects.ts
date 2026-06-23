import type {
  CardDefinitionId,
  CardInstanceId,
  TemporaryProgramInstallReturn,
} from "@netgrid/shared";
import type { FreeProgramInstallExecutionResult } from "./free-program-install-execution";

export type TemporaryProgramInstallPostInstallSideEffectPlan = {
  kind: "temporary_program_install";
  installedProgramId: CardInstanceId;
  selectedProgramId: CardInstanceId;
  sourceCardId?: CardInstanceId | undefined;
  sourceCardDefinitionId: CardDefinitionId;
  temporaryReturnNeeded: boolean;
  sourceTrashNeeded: false;
  oncePerRunNeeded: false;
  temporaryReturnRecord?: TemporaryProgramInstallReturn | undefined;
};

export type SourceTrashPostInstallSideEffectPlan = {
  kind: "revealed_stack_program_install";
  installedProgramId: CardInstanceId;
  selectedProgramId: CardInstanceId;
  sourceCardId?: CardInstanceId | undefined;
  temporaryReturnNeeded: false;
  sourceTrashNeeded: boolean;
  oncePerRunNeeded: false;
};

export type SourceOncePerRunPostInstallPlan = {
  kind: "once_per_run_source_use";
  sourceCardId: CardInstanceId;
  usedSourceIdsThisRun: CardInstanceId[];
  nextUsedSourceIdsThisRun: CardInstanceId[];
  oncePerRunUsed: true;
};

export type HiddenZonePostInstallSideEffectPlan =
  | TemporaryProgramInstallPostInstallSideEffectPlan
  | SourceTrashPostInstallSideEffectPlan;

export function createTemporaryProgramInstallPostInstallSideEffectPlan(input: {
  execution: FreeProgramInstallExecutionResult;
  sourceCardDefinitionId: CardDefinitionId;
}): TemporaryProgramInstallPostInstallSideEffectPlan {
  const temporaryReturnRecord = input.execution.temporaryReturnNeeded
    ? {
        cardId: input.execution.installedProgramId,
        sourceCardDefinitionId: input.sourceCardDefinitionId,
      }
    : undefined;
  return {
    kind: "temporary_program_install",
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

export function createSourceTrashPostInstallSideEffectPlan(
  execution: FreeProgramInstallExecutionResult,
): SourceTrashPostInstallSideEffectPlan {
  if (execution.sourceTrashNeeded && !execution.sourceCardId)
    throw new Error("Der Source-Trash-Plan hat keine Source-Karte.");
  return {
    kind: "revealed_stack_program_install",
    installedProgramId: execution.installedProgramId,
    selectedProgramId: execution.selectedProgramId,
    sourceCardId: execution.sourceCardId,
    temporaryReturnNeeded: false,
    sourceTrashNeeded: execution.sourceTrashNeeded,
    oncePerRunNeeded: false,
  };
}

export function createSourceOncePerRunPostInstallPlan(input: {
  sourceCardId: CardInstanceId;
  usedSourceIdsThisRun: readonly CardInstanceId[];
}): SourceOncePerRunPostInstallPlan {
  if (input.usedSourceIdsThisRun.includes(input.sourceCardId))
    throw new Error("Die Source wurde in diesem Run bereits genutzt.");
  return {
    kind: "once_per_run_source_use",
    sourceCardId: input.sourceCardId,
    usedSourceIdsThisRun: [...input.usedSourceIdsThisRun],
    nextUsedSourceIdsThisRun: [
      ...input.usedSourceIdsThisRun,
      input.sourceCardId,
    ].sort(),
    oncePerRunUsed: true,
  };
}

export function applyTemporaryProgramInstallReturnPlan(
  plan: TemporaryProgramInstallPostInstallSideEffectPlan,
  callbacks: {
    recordTemporaryReturn: (record: TemporaryProgramInstallReturn) => void;
  },
): { temporaryReturnRecorded: boolean } {
  if (!plan.temporaryReturnNeeded || !plan.temporaryReturnRecord)
    return { temporaryReturnRecorded: false };
  callbacks.recordTemporaryReturn(plan.temporaryReturnRecord);
  return { temporaryReturnRecorded: true };
}

export function applySourceTrashPostInstallPlan(
  plan: SourceTrashPostInstallSideEffectPlan,
  callbacks: {
    trashSource: (sourceCardId: CardInstanceId) => void;
  },
): { sourceTrashed: boolean } {
  if (!plan.sourceTrashNeeded) return { sourceTrashed: false };
  if (!plan.sourceCardId)
    throw new Error("Der Source-Trash-Plan hat keine Source-Karte.");
  callbacks.trashSource(plan.sourceCardId);
  return { sourceTrashed: true };
}

export function applySourceOncePerRunPostInstallPlan(
  plan: SourceOncePerRunPostInstallPlan,
  callbacks: {
    markUsedThisRun: (usedSourceIds: CardInstanceId[]) => void;
  },
): { oncePerRunMarked: true } {
  callbacks.markUsedThisRun(plan.nextUsedSourceIdsThisRun);
  return { oncePerRunMarked: true };
}
