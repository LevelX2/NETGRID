import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";
import {
  resolveMysteryBoxInstallSelection,
  resolveSelfModifyingCodeSearchInstallSelection,
  resolveSneakPreviewSearchInstallSelection,
} from "./search-choice-resolvers";

type HiddenZonePayload = Record<string, string | number | boolean>;

export type SearchInstallSourceZone = "stack" | "heap";
export type SearchInstallDestination = "install_program";

export type SearchInstallIntent = {
  selectedCardId: CardInstanceId;
  selectedCardDefinitionId: CardDefinitionId;
  sourceCardId?: CardInstanceId | undefined;
  sourceDefinitionId: CardDefinitionId;
  sourceZone: SearchInstallSourceZone;
  destination: SearchInstallDestination;
  shuffleNeeded: boolean;
  sourceTrashNeeded: boolean;
  freeInstall: boolean;
  temporaryReturnNeeded: boolean;
};

export type SearchInstallExecutionPlan = SearchInstallIntent & {
  canPay: boolean;
  uniqueBlocked: boolean;
  needsMemory: boolean;
  shouldOpenMemoryChoice: boolean;
  canAttemptInstall: boolean;
};

export type SneakPreviewSearchInstallExecutionPlan = SearchInstallIntent & {
  isCardImplementationChoice: boolean;
};

export type MysteryBoxSearchInstallExecutionPlan = {
  sourceCardId: CardInstanceId;
  topCardIds: readonly CardInstanceId[];
  programCandidateIds: readonly CardInstanceId[];
  selectedCardId?: CardInstanceId | undefined;
  selectedCardDefinitionId?: CardDefinitionId | undefined;
  destination: SearchInstallDestination;
  shuffleNeeded: true;
  freeInstall: boolean;
  sourceTrashNeeded: boolean;
  revealTopCards: true;
  showToCorp: true;
  installedProgramCount: 0 | 1;
  selfTrashed: boolean;
};

function sneakPreviewSourceZone(
  choice: ChoiceRequest | undefined,
): SearchInstallSourceZone | undefined {
  return choice?.source.startsWith("v1911.sneak_preview_heap_install")
    ? "heap"
    : choice?.source.startsWith("v1911.sneak_preview_stack_install")
      ? "stack"
      : choice?.source.startsWith("p3_38.stack_or_trash_program_install")
        ? (choice.source.split(":")[3] as SearchInstallSourceZone | undefined)
        : undefined;
}

export function resolveSelfModifyingCodeSearchInstallIntent(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  stackCardIds: readonly CardInstanceId[];
  selectedCardDefinition:
    | {
        id: CardDefinitionId;
        type: string;
        installCost?: number | undefined;
        memoryCost?: number | undefined;
      }
    | undefined;
  availableInstallCredits: number;
  runnerMemoryUsed: number;
  runnerMemoryLimit: number;
  uniqueBlocked: boolean;
  sourceDefinitionId: CardDefinitionId;
}): SearchInstallExecutionPlan {
  const selection = resolveSelfModifyingCodeSearchInstallSelection({
    choice: input.choice,
    selectedCardId: input.selectedCardId,
    stackCardIds: input.stackCardIds,
    isSelectedProgram: input.selectedCardDefinition?.type === "program",
  });
  const selectedDefinition = input.selectedCardDefinition;
  if (!selectedDefinition)
    throw new Error("Self-Modifying Code kann nur Programme installieren.");
  const sourceCardId = input.choice?.source.split(":")[1] as
    | CardInstanceId
    | undefined;
  const installCost = selectedDefinition.installCost ?? 0;
  const memoryCost = selectedDefinition.memoryCost ?? 0;
  const canPay = input.availableInstallCredits >= installCost;
  const needsMemory =
    input.runnerMemoryUsed + memoryCost > input.runnerMemoryLimit;
  return {
    selectedCardId: selection.selectedCardId,
    selectedCardDefinitionId: selectedDefinition.id,
    sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
    sourceZone: "stack",
    destination: "install_program",
    shuffleNeeded: selection.shuffleNeeded,
    sourceTrashNeeded: true,
    freeInstall: false,
    temporaryReturnNeeded: false,
    canPay,
    uniqueBlocked: input.uniqueBlocked,
    needsMemory,
    shouldOpenMemoryChoice: canPay && !input.uniqueBlocked && needsMemory,
    canAttemptInstall: canPay && !input.uniqueBlocked,
  };
}

export function resolveSneakPreviewSearchInstallIntent(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  legalTargetIdsForSourceZone: (
    sourceZone: SearchInstallSourceZone,
  ) => readonly CardInstanceId[];
  selectedCardDefinition:
    | {
        id: CardDefinitionId;
        type: string;
      }
    | undefined;
  defaultSourceDefinitionId: CardDefinitionId;
}): SneakPreviewSearchInstallExecutionPlan {
  const sourceZone = sneakPreviewSourceZone(input.choice);
  const selection = resolveSneakPreviewSearchInstallSelection({
    choice: input.choice,
    selectedCardId: input.selectedCardId,
    legalTargetIds: sourceZone
      ? input.legalTargetIdsForSourceZone(sourceZone)
      : [],
    defaultSourceDefinitionId: input.defaultSourceDefinitionId,
  });
  const selectedDefinition = input.selectedCardDefinition;
  if (!selectedDefinition || selectedDefinition.type !== "program")
    throw new Error("Sneak Preview darf nur Programme installieren.");
  const sourceCardId = selection.isCardImplementationChoice
    ? (input.choice?.source.split(":")[1] as CardInstanceId | undefined)
    : undefined;
  return {
    selectedCardId: selection.selectedCardId,
    selectedCardDefinitionId: selectedDefinition.id,
    sourceCardId,
    sourceDefinitionId: selection.sourceDefinitionId,
    sourceZone: selection.sourceZone,
    destination: "install_program",
    shuffleNeeded: selection.shuffleNeeded,
    sourceTrashNeeded: false,
    freeInstall: true,
    temporaryReturnNeeded: true,
    isCardImplementationChoice: selection.isCardImplementationChoice,
  };
}

export function buildSneakPreviewSearchInstallResolvedPayload(
  plan: SneakPreviewSearchInstallExecutionPlan,
): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction: plan.isCardImplementationChoice
      ? "p3_38_stack_or_trash_program_install"
      : "sneak_preview_program_install",
    sourceDefinitionId: plan.sourceDefinitionId,
    searchReveal: plan.sourceZone === "stack" ? "public" : "hidden",
    searchDestination: plan.destination,
    searchShuffleAfter: plan.shuffleNeeded,
    shuffled: plan.shuffleNeeded,
    temporaryInstall: plan.temporaryReturnNeeded,
    selectedCount: 1,
    installedProgramDefinitionId: plan.selectedCardDefinitionId,
    ...(plan.sourceZone === "stack"
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: plan.selectedCardDefinitionId,
        }
      : {}),
  };
}

export function createMysteryBoxNoInstallIntent(input: {
  sourceCardId: CardInstanceId;
  topCardIds: readonly CardInstanceId[];
  programCandidateIds: readonly CardInstanceId[];
}): MysteryBoxSearchInstallExecutionPlan {
  if (input.programCandidateIds.length > 0)
    throw new Error("Mystery Box hat installierbare Programme gefunden.");
  return {
    sourceCardId: input.sourceCardId,
    topCardIds: [...input.topCardIds],
    programCandidateIds: [],
    destination: "install_program",
    shuffleNeeded: true,
    freeInstall: false,
    sourceTrashNeeded: false,
    revealTopCards: true,
    showToCorp: true,
    installedProgramCount: 0,
    selfTrashed: false,
  };
}

export function resolveMysteryBoxSearchInstallIntent(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  topCardIds: readonly CardInstanceId[];
  programCandidateIds?: readonly CardInstanceId[] | undefined;
  selectedCardDefinition:
    | {
        id: CardDefinitionId;
        type: string;
      }
    | undefined;
}): MysteryBoxSearchInstallExecutionPlan {
  const programCandidateIds =
    input.programCandidateIds ??
    input.choice?.options.map((option) => option.value as CardInstanceId) ??
    [];
  const selection = resolveMysteryBoxInstallSelection({
    choice: input.choice,
    selectedCardId: input.selectedCardId,
    currentTopCardIds: input.topCardIds,
    isSelectedProgram: input.selectedCardDefinition?.type === "program",
  });
  if (!programCandidateIds.includes(selection.selectedCardId))
    throw new Error(
      "Das gewaehlte Programm liegt nicht im Mystery-Box-Kandidatenpool.",
    );
  const selectedDefinition = input.selectedCardDefinition;
  if (!selectedDefinition)
    throw new Error("Mystery Box kann nur ein Programm installieren.");
  return {
    sourceCardId: selection.sourceCardId,
    topCardIds: [...input.topCardIds],
    programCandidateIds: [...programCandidateIds],
    selectedCardId: selection.selectedCardId,
    selectedCardDefinitionId: selectedDefinition.id,
    destination: "install_program",
    shuffleNeeded: selection.shuffleNeeded,
    freeInstall: true,
    sourceTrashNeeded: true,
    revealTopCards: true,
    showToCorp: true,
    installedProgramCount: 1,
    selfTrashed: true,
  };
}

export function buildMysteryBoxNoInstallResolvedPayload(
  plan: MysteryBoxSearchInstallExecutionPlan,
  input: {
    randomCounterAfter: number;
  },
): HiddenZonePayload {
  return {
    programFound: false,
    installedProgramCount: plan.installedProgramCount,
    selfTrashed: plan.selfTrashed,
    randomCounterAfter: input.randomCounterAfter,
  };
}

export function buildMysteryBoxSearchInstallResolvedPayload(
  plan: MysteryBoxSearchInstallExecutionPlan,
  input: {
    randomCounterAfter: number;
  },
): HiddenZonePayload {
  if (!plan.selectedCardDefinitionId)
    throw new Error("Mystery Box hat kein installiertes Programm im Plan.");
  return {
    v1915RunnerProgramAbility: "top5_program_install",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "mystery_box_program_install",
    installedProgramDefinitionId: plan.selectedCardDefinitionId,
    installedProgramCount: plan.installedProgramCount,
    selfTrashed: plan.selfTrashed,
    randomCounterAfter: input.randomCounterAfter,
  };
}

export function buildSelfModifyingCodeMemoryDeferredPayload(
  plan: SearchInstallExecutionPlan,
  input: {
    installDeferredForMemory: boolean;
  },
): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    sourceDefinitionId: plan.sourceDefinitionId,
    hiddenZoneAction: "hidden_stack_program_install",
    publicRevealKind: "reveal",
    publicRevealDefinitionId: plan.selectedCardDefinitionId,
    selectedCount: 1,
    searchDestination: plan.destination,
    shuffled: plan.shuffleNeeded,
    installDeferredForMemory: input.installDeferredForMemory,
    installed: false,
  };
}

export function buildSelfModifyingCodeResolvedPayload(
  plan: SearchInstallExecutionPlan,
  input: {
    installed: boolean;
  },
): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    sourceDefinitionId: plan.sourceDefinitionId,
    hiddenZoneAction: "hidden_stack_program_install",
    publicRevealKind: "reveal",
    publicRevealDefinitionId: plan.selectedCardDefinitionId,
    selectedCount: 1,
    searchDestination: input.installed ? "runner_rig" : "runner_stack",
    shuffled: plan.shuffleNeeded,
    installed: input.installed,
    ...(plan.uniqueBlocked
      ? { installBlockedReason: "unique_already_installed" }
      : {}),
    ...(!plan.canPay ? { installBlockedReason: "insufficient_credits" } : {}),
  };
}
