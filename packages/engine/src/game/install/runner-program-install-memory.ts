import type {
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";

export const RUNNER_PROGRAM_INSTALL_MEMORY_CHOICE_PREFIX =
  "runner.program_install_memory";

export type RunnerProgramInstallMemoryContinuationKind =
  | "hidden_search"
  | "nonsearch"
  | "access";

export type RunnerProgramInstallMemoryContinuation = {
  kind: RunnerProgramInstallMemoryContinuationKind;
  targetCardId: CardInstanceId;
  originalChoiceId: string;
  originalChoiceSource: string;
  automaticFreedMemory: number;
};

export function runnerProgramInstallMemoryDeficit(input: {
  memoryUsed: number;
  targetMemoryCost: number;
  memoryLimit: number;
  automaticFreedMemory?: number;
}): number {
  return Math.max(
    0,
    input.memoryUsed +
      input.targetMemoryCost -
      Math.max(0, input.automaticFreedMemory ?? 0) -
      input.memoryLimit,
  );
}

export function runnerProgramInstallMemoryReachable(input: {
  memoryUsed: number;
  targetMemoryCost: number;
  memoryLimit: number;
  trashableMemoryCosts: readonly number[];
  automaticFreedMemory?: number;
}): boolean {
  const maximumSelectableFreedMemory = input.trashableMemoryCosts.reduce(
    (sum, amount) => sum + Math.max(0, amount),
    0,
  );
  return (
    runnerProgramInstallMemoryDeficit(input) <= maximumSelectableFreedMemory
  );
}

export function buildRunnerProgramInstallMemoryChoice(input: {
  stateVersion: number;
  kind: RunnerProgramInstallMemoryContinuationKind;
  targetCardId: CardInstanceId;
  originalChoiceId: string;
  originalChoiceSource: string;
  automaticFreedMemory?: number;
  options: ChoiceRequest["options"];
}): ChoiceRequest {
  if (input.options.length === 0)
    throw new Error("Es gibt kein installiertes Programm zum Freimachen von MU.");
  const automaticFreedMemory = Math.max(
    0,
    Math.floor(input.automaticFreedMemory ?? 0),
  );
  return {
    choiceId: `runner_program_install_memory_${input.stateVersion + 1}`,
    side: "runner",
    source: [
      RUNNER_PROGRAM_INSTALL_MEMORY_CHOICE_PREFIX,
      input.kind,
      input.targetCardId,
      automaticFreedMemory,
      encodeURIComponent(input.originalChoiceId),
      encodeURIComponent(input.originalChoiceSource),
    ].join(":"),
    prompt: "Programme vor Installation trashen",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: input.options.length,
    stateVersion: input.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function parseRunnerProgramInstallMemoryContinuation(
  source: string,
): RunnerProgramInstallMemoryContinuation {
  const [
    prefix,
    kind,
    targetCardId,
    automaticFreedMemoryRaw,
    originalChoiceIdRaw,
    originalChoiceSourceRaw,
  ] = source.split(":");
  if (
    prefix !== RUNNER_PROGRAM_INSTALL_MEMORY_CHOICE_PREFIX ||
    (kind !== "hidden_search" && kind !== "nonsearch" && kind !== "access") ||
    !targetCardId ||
    !originalChoiceIdRaw ||
    !originalChoiceSourceRaw
  )
    throw new Error("Die MU-Installationsfortsetzung ist ungültig.");
  const automaticFreedMemory = Number(automaticFreedMemoryRaw);
  if (!Number.isInteger(automaticFreedMemory) || automaticFreedMemory < 0)
    throw new Error("Die automatische MU-Freimachung ist ungültig.");
  return {
    kind,
    targetCardId: targetCardId as CardInstanceId,
    automaticFreedMemory,
    originalChoiceId: decodeURIComponent(originalChoiceIdRaw),
    originalChoiceSource: decodeURIComponent(originalChoiceSourceRaw),
  };
}

export function resolveRunnerProgramInstallMemoryTrashSelection(input: {
  choice: ChoiceRequest;
  selectedOptionIds: readonly string[];
  installedProgramIds: readonly CardInstanceId[];
  memoryUsed: number;
  targetMemoryCost: number;
  memoryLimit: number;
  memoryCostFor: (cardId: CardInstanceId) => number;
  usesMemory: (cardId: CardInstanceId) => boolean;
}): {
  continuation: RunnerProgramInstallMemoryContinuation;
  trashCardIds: CardInstanceId[];
  freedMemory: number;
} {
  const continuation = parseRunnerProgramInstallMemoryContinuation(
    input.choice.source,
  );
  const selectedCardIds = input.selectedOptionIds.map((optionId) => {
    const option = input.choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error("Die MU-Auswahl enthält eine ungültige Option.");
    return option.value as CardInstanceId;
  });
  const trashCardIds = [...new Set(selectedCardIds)];
  if (trashCardIds.length !== selectedCardIds.length)
    throw new Error("Die MU-Auswahl enthält doppelte Programme.");
  if (trashCardIds.length === 0)
    throw new Error("Es wurde kein Programm zum Freimachen von MU gewählt.");
  for (const cardId of trashCardIds) {
    if (!input.installedProgramIds.includes(cardId))
      throw new Error("Die MU-Auswahl enthält kein installiertes Programm.");
  }
  const freedMemory = trashCardIds.reduce(
    (sum, cardId) =>
      sum + (input.usesMemory(cardId) ? input.memoryCostFor(cardId) : 0),
    0,
  );
  if (
    runnerProgramInstallMemoryDeficit({
      memoryUsed: input.memoryUsed,
      targetMemoryCost: input.targetMemoryCost,
      memoryLimit: input.memoryLimit,
      automaticFreedMemory:
        continuation.automaticFreedMemory + freedMemory,
    }) > 0
  )
    throw new Error("Die MU-Auswahl macht nicht genug MU frei.");
  return { continuation, trashCardIds, freedMemory };
}
