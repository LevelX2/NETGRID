import type {
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  buildRunnerProgramInstallMemoryChoice,
  resolveRunnerProgramInstallMemoryTrashSelection,
  runnerProgramInstallMemoryDeficit,
  runnerProgramInstallMemoryReachable,
  RUNNER_PROGRAM_INSTALL_MEMORY_CHOICE_PREFIX,
} from "./runner-program-install-memory";

export type NonSearchProgramInstallMemoryHost = {
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  runnerMemoryLimit: (state: GameState) => number;
  runnerProgramUsesMemory: (
    state: GameState,
    cardId: CardInstanceId,
  ) => boolean;
  trashRunnerInstalledCardToHeap: (
    state: GameState,
    cardId: CardInstanceId,
    legalAction: LegalAction,
  ) => void;
  continueGripInstall: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  continueStackInstall: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
};

export function deferNonSearchProgramInstallForMemory(
  host: NonSearchProgramInstallMemoryHost,
  state: GameState,
  choice: ChoiceRequest,
  targetCardId: CardInstanceId,
  legalAction: LegalAction,
): boolean {
  const definition = host.definitionFor(state, targetCardId);
  if (definition.type !== "program") return false;
  const deficit = runnerProgramInstallMemoryDeficit({
    memoryUsed: state.runner.memoryUsed,
    targetMemoryCost: definition.memoryCost ?? 0,
    memoryLimit: host.runnerMemoryLimit(state),
  });
  if (deficit === 0) return false;
  const trashableIds = state.runner.rig.programs.filter((cardId) =>
    host.runnerProgramUsesMemory(state, cardId),
  );
  if (
    !runnerProgramInstallMemoryReachable({
      memoryUsed: state.runner.memoryUsed,
      targetMemoryCost: definition.memoryCost ?? 0,
      memoryLimit: host.runnerMemoryLimit(state),
      trashableMemoryCosts: trashableIds.map(
        (cardId) => host.definitionFor(state, cardId).memoryCost ?? 0,
      ),
    })
  )
    throw new Error(
      "Durch Programmtrash kann nicht genug MU freigemacht werden.",
    );
  state.pendingChoice = buildRunnerProgramInstallMemoryChoice({
    stateVersion: state.stateVersion,
    kind: "nonsearch",
    targetCardId,
    originalChoiceId: choice.choiceId,
    originalChoiceSource: choice.source,
    options: trashableIds.map((cardId) => ({
      id: `card_${cardId}`,
      label: host.definitionFor(state, cardId).title,
      value: cardId,
    })),
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    installDeferredForMemory: true,
    memoryToFree: deficit,
  };
  return true;
}

export function resolveNonSearchProgramInstallMemoryChoice(
  host: NonSearchProgramInstallMemoryHost,
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith(
      `${RUNNER_PROGRAM_INSTALL_MEMORY_CHOICE_PREFIX}:nonsearch:`,
    )
  )
    throw new Error("Es ist keine MU-Installationschoice offen.");
  const targetDefinition = host.definitionFor(
    state,
    choice.source.split(":")[2] as CardInstanceId,
  );
  const selection = resolveRunnerProgramInstallMemoryTrashSelection({
    choice,
    selectedOptionIds: selectedChoiceIds(playerAction.selectedChoices),
    installedProgramIds: state.runner.rig.programs,
    memoryUsed: state.runner.memoryUsed,
    targetMemoryCost: targetDefinition.memoryCost ?? 0,
    memoryLimit: host.runnerMemoryLimit(state),
    memoryCostFor: (cardId) =>
      host.definitionFor(state, cardId).memoryCost ?? 0,
    usesMemory: (cardId) => host.runnerProgramUsesMemory(state, cardId),
  });
  const trashedDefinitionIds = selection.trashCardIds.map(
    (cardId) => host.definitionFor(state, cardId).id,
  );
  for (const cardId of selection.trashCardIds)
    host.trashRunnerInstalledCardToHeap(state, cardId, legalAction);
  state.pendingChoice = {
    choiceId: selection.continuation.originalChoiceId,
    source: selection.continuation.originalChoiceSource,
    side: "runner",
    prompt: "Programminstallation fortsetzen",
    kind: "select_cards",
    options: [
      {
        id: `card_${selection.continuation.targetCardId}`,
        label: targetDefinition.title,
        value: selection.continuation.targetCardId,
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: choice.stateVersion,
    visibility: "hidden_info_barrier",
  };
  const continuationAction = {
    ...playerAction,
    selectedChoices: {
      choiceId: selection.continuation.originalChoiceId,
      selectedOptionIds: [`card_${selection.continuation.targetCardId}`],
    },
  } as PlayerAction;
  if (
    selection.continuation.originalChoiceSource.startsWith(
      "card_implementation.pro018_grip_install_temporary_credits:",
    )
  )
    host.continueGripInstall(state, legalAction, continuationAction);
  else if (
    selection.continuation.originalChoiceSource.startsWith(
      "card_implementation.pro018_stack_install_run_cleanup:",
    )
  )
    host.continueStackInstall(state, legalAction, continuationAction);
  else throw new Error("Die MU-Installationsfortsetzung ist unbekannt.");
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    installDeferredForMemory: true,
    memoryFreed: selection.freedMemory,
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
  };
}
