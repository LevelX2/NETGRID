import type {
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { runnerMemoryLimit } from "../../ability-engine/effective-values";
import { selectedChoiceIds } from "../choices/choice-validation";

export const RUNNER_MEMORY_CHECKPOINT_CHOICE_SOURCE_PREFIX =
  "runner.checkpoint_memory_cleanup";

type RunnerMemoryCheckpointHost = {
  state: GameState;
  runnerMemoryLimit: () => number;
  runnerProgramUsesMemory: (cardId: CardInstanceId) => boolean;
  definitionFor: (cardId: CardInstanceId) => CardDefinition;
  trashRunnerInstalledCardToHeap: (
    cardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => void;
};

type RunnerMemoryCheckpointReadHost = Pick<
  RunnerMemoryCheckpointHost,
  "state" | "runnerMemoryLimit" | "runnerProgramUsesMemory" | "definitionFor"
>;

export function runnerMemoryCheckpointDeficit(
  state: GameState,
  memoryLimit: number,
): number {
  return Math.max(0, state.runner.memoryUsed - memoryLimit);
}

export function isRunnerMemoryCheckpointChoice(
  choice: ChoiceRequest | undefined,
): boolean {
  return Boolean(
    choice?.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith(
      `${RUNNER_MEMORY_CHECKPOINT_CHOICE_SOURCE_PREFIX}:`,
    ),
  );
}

export function runnerMemoryCheckpointChoiceStateIsValid(
  state: GameState,
): boolean {
  try {
    return validateRunnerMemoryCheckpointChoiceState({
      state,
      runnerMemoryLimit: () => runnerMemoryLimit(state),
      runnerProgramUsesMemory: (cardId) =>
        runnerProgramUsesMemoryForCheckpointState(state, cardId),
      definitionFor: (cardId) => definitionForCheckpointState(state, cardId),
    });
  } catch {
    return false;
  }
}

export function validateRunnerMemoryCheckpointChoiceState(
  host: RunnerMemoryCheckpointReadHost,
): boolean {
  const { state } = host;
  const choice = state.pendingChoice;
  if (!isRunnerMemoryCheckpointChoice(choice) || !choice) return false;
  const sourceParts = choice.source.split(":");
  const encodedDeficit = Number(sourceParts[1]);
  const encodedStateVersion = Number(sourceParts[2]);
  const currentDeficit = runnerMemoryCheckpointDeficit(
    state,
    host.runnerMemoryLimit(),
  );
  if (
    sourceParts.length !== 3 ||
    sourceParts[0] !== RUNNER_MEMORY_CHECKPOINT_CHOICE_SOURCE_PREFIX ||
    !Number.isSafeInteger(encodedDeficit) ||
    encodedDeficit <= 0 ||
    encodedDeficit !== currentDeficit ||
    !Number.isSafeInteger(encodedStateVersion) ||
    encodedStateVersion !== state.stateVersion ||
    choice.stateVersion !== state.stateVersion
  )
    return false;
  if (
    choice.minSelections !== 1 ||
    choice.maxSelections !== choice.options.length ||
    choice.options.length === 0
  )
    return false;
  const candidates = runnerMemoryCheckpointCandidates(host);
  if (choice.options.length !== candidates.length) return false;
  if (
    choice.options.some(
      (option, index) =>
        option.id !== `card_${candidates[index]}` ||
        option.value !== candidates[index],
    )
  )
    return false;
  const maximumFreedMemory = candidates.reduce(
    (sum, cardId) => sum + installedProgramMemoryCost(host, cardId),
    0,
  );
  return maximumFreedMemory >= currentDeficit;
}

export function startRunnerMemoryCheckpointChoice(
  host: RunnerMemoryCheckpointHost,
): boolean {
  const deficit = runnerMemoryCheckpointDeficit(
    host.state,
    host.runnerMemoryLimit(),
  );
  if (deficit <= 0) return false;
  if (host.state.pendingChoice) return false;
  const candidates = runnerMemoryCheckpointCandidates(host);
  const maximumFreedMemory = candidates.reduce(
    (sum, cardId) => sum + installedProgramMemoryCost(host, cardId),
    0,
  );
  if (maximumFreedMemory < deficit)
    throw new Error(
      "Die MU-Überschreitung kann nicht durch installierte Programme aufgelöst werden.",
    );
  const nextStateVersion = host.state.stateVersion + 1;
  host.state.pendingChoice = {
    choiceId: `runner_memory_checkpoint_${nextStateVersion}`,
    side: "runner",
    source: `${RUNNER_MEMORY_CHECKPOINT_CHOICE_SOURCE_PREFIX}:${deficit}:${nextStateVersion}`,
    prompt: "Programme für das MU-Limit trashen",
    kind: "select_cards",
    options: candidates.map((cardId) => ({
      id: `card_${cardId}`,
      label: host.definitionFor(cardId).title,
      publicLabel: "Installiertes Runner-Programm",
      value: cardId,
    })),
    minSelections: 1,
    maxSelections: candidates.length,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
  };
  return true;
}

export function resolveRunnerMemoryCheckpointChoice(
  host: RunnerMemoryCheckpointHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  if (!choice || !isRunnerMemoryCheckpointChoice(choice))
    throw new Error("Es ist keine MU-Checkpoint-Auswahl offen.");
  if (legalAction.side !== "runner" || playerAction.side !== "runner")
    throw new Error("Nur der Runner darf die MU-Checkpoint-Auswahl auflösen.");
  if (!validateRunnerMemoryCheckpointChoiceState(host))
    throw new Error("Die MU-Checkpoint-Auswahl ist veraltet.");
  const currentDeficit = runnerMemoryCheckpointDeficit(
    host.state,
    host.runnerMemoryLimit(),
  );
  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  const selectedCardIds = selectedOptionIds.map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error(
        "Die MU-Checkpoint-Auswahl enthält eine ungültige Option.",
      );
    return option.value as CardInstanceId;
  });
  if (new Set(selectedCardIds).size !== selectedCardIds.length)
    throw new Error("Die MU-Checkpoint-Auswahl enthält doppelte Programme.");
  const candidates = runnerMemoryCheckpointCandidates(host);
  for (const cardId of selectedCardIds) {
    if (!candidates.includes(cardId))
      throw new Error(
        "Die MU-Checkpoint-Auswahl enthält kein gültiges installiertes Programm.",
      );
  }
  const selectedCosts = selectedCardIds.map((cardId) =>
    installedProgramMemoryCost(host, cardId),
  );
  const freedMemory = selectedCosts.reduce((sum, amount) => sum + amount, 0);
  if (freedMemory < currentDeficit)
    throw new Error("Die MU-Checkpoint-Auswahl macht nicht genug MU frei.");
  if (
    selectedCosts.some(
      (memoryCost) => freedMemory - memoryCost >= currentDeficit,
    )
  )
    throw new Error("Die MU-Checkpoint-Auswahl ist nicht minimal.");

  const sortedCardIds = selectedCardIds.slice().sort();
  const trashedCardDefinitionIds = sortedCardIds
    .map((cardId) => host.definitionFor(cardId).id)
    .sort();
  for (const cardId of sortedCardIds)
    host.trashRunnerInstalledCardToHeap(cardId, legalAction);
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerMemoryCheckpointResolved: true,
    runnerMemoryDeficit: currentDeficit,
    memoryFreed: freedMemory,
    trashedProgramCount: sortedCardIds.length,
    trashedCardDefinitionIds: trashedCardDefinitionIds.join(","),
    runnerMemoryUsedAfter: host.state.runner.memoryUsed,
    runnerMemoryLimitAfter: host.runnerMemoryLimit(),
  };
}

function runnerMemoryCheckpointCandidates(
  host: RunnerMemoryCheckpointReadHost,
): CardInstanceId[] {
  return host.state.runner.rig.programs
    .filter(
      (cardId) =>
        host.runnerProgramUsesMemory(cardId) &&
        installedProgramMemoryCost(host, cardId) > 0,
    )
    .slice()
    .sort((left, right) => {
      const byTitle = host
        .definitionFor(left)
        .title.localeCompare(host.definitionFor(right).title, "de");
      return byTitle || left.localeCompare(right);
    });
}

function installedProgramMemoryCost(
  host: RunnerMemoryCheckpointReadHost,
  cardId: CardInstanceId,
): number {
  const instance = host.state.cardInstances[cardId];
  const memoryCost =
    instance?.installedAsRunnerProgram?.memoryCost ??
    host.definitionFor(cardId).memoryCost ??
    0;
  if (!Number.isSafeInteger(memoryCost) || memoryCost < 0)
    throw new Error("Die installierten Programm-MU sind ungültig.");
  return memoryCost;
}

function definitionForCheckpointState(
  state: GameState,
  cardId: CardInstanceId,
): CardDefinition {
  const instance = state.cardInstances[cardId];
  const definition = instance
    ? CARD_DEFINITIONS_BY_ID[instance.definitionId]
    : undefined;
  if (!definition) throw new Error(`Unbekannte Karte: ${cardId}`);
  return definition;
}

function runnerProgramUsesMemoryForCheckpointState(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = state.cardInstances[cardId];
  if (!instance) throw new Error(`CardInstance fehlt: ${cardId}`);
  if (!instance.hostedOn) return true;
  const hostDefinition = definitionForCheckpointState(state, instance.hostedOn);
  const isDaemon =
    hostDefinition.type === "program" &&
    (hostDefinition.subtypes ?? []).some(
      (subtype) => subtype.toLowerCase().replaceAll("-", "_") === "daemon",
    );
  const replacesTrashWithHosting =
    cardImplementationForDefinitionId(hostDefinition.id)?.runnerUtilityLongtail
      ?.kind === "replace_installed_program_trash_with_host_on_source";
  return !isDaemon && !replacesTrashWithHosting;
}
