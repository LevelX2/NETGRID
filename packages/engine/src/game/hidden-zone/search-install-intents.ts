import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";
import { resolveSelfModifyingCodeSearchInstallSelection } from "./search-choice-resolvers";

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

export function resolveSelfModifyingCodeSearchInstallIntent(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  stackCardIds: readonly CardInstanceId[];
  selectedCardDefinition: {
    id: CardDefinitionId;
    type: string;
    installCost?: number | undefined;
    memoryCost?: number | undefined;
  } | undefined;
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

export function buildSelfModifyingCodeMemoryDeferredPayload(
  plan: SearchInstallExecutionPlan,
  input: {
    installDeferredForMemory: boolean;
  },
): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    sourceDefinitionId: plan.sourceDefinitionId,
    hiddenZoneAction: "self_modifying_code_install_program",
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
    hiddenZoneAction: "self_modifying_code_install_program",
    publicRevealKind: "reveal",
    publicRevealDefinitionId: plan.selectedCardDefinitionId,
    selectedCount: 1,
    searchDestination: input.installed ? "runner_rig" : "runner_stack",
    shuffled: plan.shuffleNeeded,
    installed: input.installed,
    ...(plan.uniqueBlocked ? { installBlockedReason: "unique_already_installed" } : {}),
    ...(!plan.canPay ? { installBlockedReason: "insufficient_credits" } : {}),
  };
}
