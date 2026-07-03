import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import {
  buildLookTopStackShowToCorpThenInstallMatchingChoice,
  buildTemporaryProgramInstallChoice,
} from "./search-choice-builders";
import {
  buildPaidStackProgramInstallMemoryDeferredPayload,
  buildRevealedStackProgramInstallResolvedPayload,
  buildTemporaryProgramSearchInstallResolvedPayload,
  resolveRevealedStackProgramInstallIntent,
  buildPaidStackProgramInstallResolvedPayload,
  resolveTemporaryProgramSearchInstallIntent,
  resolvePaidStackProgramInstallIntent,
} from "./search-install-intents";
import {
  resolveLookTopStackTakeMatchingSelection,
  resolveSearchStackInstallSelection,
  resolveSearchToGripSelections,
} from "./search-choice-resolvers";
import { applyResolvedSearchToGripMoves } from "./search-choice-move-intents";
import {
  applyTopNTakeMatchingMoveIntent,
  buildTopNTakeMatchingResolvedPayload,
  createTopNTakeMatchingMoveIntent,
  toTopNSelectedCardMove,
} from "./topn-move-intents";
import {
  createRevealedStackFreeProgramInstallInput,
  createTemporaryProgramFreeInstallInput,
  executeFreeProgramInstallPlan,
} from "./free-program-install-execution";
import {
  applySourceOncePerRunPostInstallPlan,
  applySourceTrashPostInstallPlan,
  applyTemporaryProgramInstallReturnPlan,
  createSourceTrashPostInstallSideEffectPlan,
  createTemporaryProgramInstallPostInstallSideEffectPlan,
} from "./post-install-side-effects";

type HiddenZonePayload = Record<string, string | number | boolean>;
type SearchInstallCost = "normal" | "free";
type SearchInstallSourceZone = "heap" | "stack";

export type HiddenZoneSearchChoiceHandlerHost = {
  choice: ChoiceRequest;
  playerAction: PlayerAction;
  legalAction: LegalAction;
  state: Pick<
    GameState,
    | "runner"
    | "cardInstances"
    | "pendingChoice"
    | "randomCounter"
    | "stateVersion"
    | "temporaryProgramInstallReturns"
    | "run"
  >;
  constants: {
    topStackTakeMatchingSourceId: CardDefinitionId;
    randomStackProgramInstallSourceId: CardDefinitionId;
    stackProgramFreeInstallSourceId: CardDefinitionId;
    stackSearchGripSourceId: CardDefinitionId;
    temporaryProgramInstallSourceId: CardDefinitionId;
  };
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    isUniqueRunnerDefinitionInstalled: (definition: CardDefinition) => boolean;
    runnerProgramUsesMemory: (cardId: CardInstanceId) => boolean;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    addToGrip: (cardId: CardInstanceId) => void;
    trashRunnerInstalledCardToHeap: (cardId: CardInstanceId) => void;
  };
  shuffleRunnerStack: (purpose: string) => void;
  spendRunnerCredits: (amount: number) => void;
  installRunnerProgramFromStackWithoutClick: (cardId: CardInstanceId) => boolean;
  startRunnerProgramFreeMemoryChoice: (cardId: CardInstanceId) => boolean;
  availableRunnerProgramInstallCredits: () => number;
  runnerMemoryLimit: () => number;
  install: {
    canInstallRunnerProgramFromZone: (
      cardId: CardInstanceId,
      sourceZone: SearchInstallSourceZone,
      installCost: SearchInstallCost,
    ) => boolean;
    installRunnerProgramFromZoneWithoutClick: (
      cardId: CardInstanceId,
      sourceZone: SearchInstallSourceZone,
      installCost: SearchInstallCost,
    ) => boolean;
    installRunnerProgramForFree: (
      cardId: CardInstanceId,
      options?: {
        checkUnique?: boolean;
        typeError?: string;
        memoryError?: string;
      },
    ) => CardInstanceId;
    searchStackInstallTargets: (
      filter: "program",
      installCost: SearchInstallCost,
    ) => CardInstanceId[];
    temporaryProgramInstallableProgramIds: (
      sourceZone: SearchInstallSourceZone,
    ) => CardInstanceId[];
    lookTopStackShowToCorpThenInstallMatchingTargets: (
      count: 5,
      allowedTypes: readonly "program"[],
      installCost: "free",
    ) => CardInstanceId[];
  };
};

export type HiddenZoneSearchActivationHandlerHost = Omit<
  HiddenZoneSearchChoiceHandlerHost,
  "choice" | "playerAction"
>;

export type HiddenZoneChoiceHandlerResult = {
  handled: boolean;
  stateChanged?: boolean;
  deletePendingChoice?: boolean;
  resolvedPayload?: HiddenZonePayload;
  shufflePerformed?: boolean;
  installedCardId?: CardInstanceId;
  movedCardIds?: CardInstanceId[];
  sourceTrashCardIds?: CardInstanceId[];
};

export function handleHiddenZoneSearchChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const source = host.choice.source;
  if (isPaidStackProgramInstallChoiceSource(source))
    return handlePaidStackProgramInstallChoice(host);
  if (isTemporaryProgramInstallChoiceSource(source))
    return handleTemporaryProgramInstallFlowChoice(host);
  if (isRevealedStackProgramInstallChoiceSource(source))
    return handleRevealedStackProgramInstallChoice(host);
  if (isP338RevealedStackProgramInstallCorpReviewChoiceSource(source))
    return handleRevealedStackProgramInstallCorpReviewChoice(host);
  if (isP338SearchInstallChoiceSource(source))
    return handleSearchStackInstallChoice(host);
  if (isP338LookTopStackShowInstallChoiceSource(source))
    return handleLookTopStackShowInstallChoice(host);
  if (isTopNTakeMatchingChoiceSource(source))
    return handleTopNTakeMatchingChoice(host);
  if (isSearchToGripChoiceSource(source))
    return handleSearchToGripChoice(host);
  return { handled: false };
}

export function handleSearchToGripChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  if (isCardImplementationSearchToGripChoiceSource(host.choice.source))
    return handleCardImplementationSearchToGripChoice(host);
  return handleRunnerStackSearchChoice(host);
}

export function handleTopNTakeMatchingChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  if (host.choice.source.startsWith("v1911.aujourdoui_top5"))
    return handleAujourdOuiTop5Choice(host);
  return handleCardImplementationLookTopStackTakeMatchingChoice(host);
}

export function handlePaidStackProgramInstallChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  if (host.choice.source.startsWith("runner.program_free_memory"))
    return handlePaidStackProgramInstallFreeMemoryChoice(host);
  return handlePaidStackProgramInstallStackChoice(host);
}

export function handleTemporaryProgramInstallFlowChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  if (isTemporaryProgramInstallSourceChoiceSource(host.choice.source))
    return handleTemporaryProgramInstallSourceChoice(host);
  return handleTemporaryProgramInstallChoice(host);
}

export function handleRevealedStackProgramInstallChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  const selectedId = selectedChoiceCardIds(choice, host.playerAction)[0];
  const currentTopCards = state.runner.stack.slice(0, 5);
  const selectedDefinition = selectedId
    ? host.cards.definitionFor(selectedId)
    : undefined;
  const plan = resolveRevealedStackProgramInstallIntent({
    choice,
    selectedCardId: selectedId,
    topCardIds: currentTopCards,
    selectedCardDefinition: selectedDefinition,
  });
  const sourceCardId = plan.sourceCardId;
  if (!sourceCardId || !state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Die offengelegte Stack-Quelle ist nicht mehr installiert.");
  if (host.cards.definitionFor(sourceCardId).id !== host.constants.randomStackProgramInstallSourceId)
    throw new Error("Die Revealed-Stack-Program-Install-Choice passt nicht zur Quelle.");
  const execution = executeFreeProgramInstallPlan({
    plan: createRevealedStackFreeProgramInstallInput(plan),
    callbacks: {
      installProgramForFree: (programId) =>
        host.install.installRunnerProgramForFree(programId, {
          checkUnique: false,
          typeError: "Der offengelegte Stack-Plan kann nur ein Programm installieren.",
          memoryError: "Nicht genug Memory fuer das Programm aus offengelegtem Stack.",
        }),
    },
  });
  const postInstall = createSourceTrashPostInstallSideEffectPlan(execution);
  applySourceTrashPostInstallPlan(postInstall, {
    trashSource: host.zones.trashRunnerInstalledCardToHeap,
  });
  if (execution.shuffleNeeded)
    host.shuffleRunnerStack(
      `v1915.revealed_stack_program_install.shuffle.after_install.${sourceCardId}.${execution.installedProgramId}`,
    );
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildRevealedStackProgramInstallResolvedPayload(plan, {
      randomCounterAfter: state.randomCounter,
    }),
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: execution.shuffleNeeded,
    installedCardId: execution.installedProgramId,
    sourceTrashCardIds: postInstall.sourceCardId ? [postInstall.sourceCardId] : [],
  };
}

export function handleSearchStackInstallChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  const selection = resolveSearchStackInstallSelection({
    choice,
    selectedCardId: selectedChoiceCardIds(choice, host.playerAction)[0],
    legalTargetIdsFor: ({ filter, installCost }) =>
      host.install.searchStackInstallTargets(filter, installCost),
  });
  if (
    !state.cardInstances[selection.sourceCardId] ||
    host.cards.definitionFor(selection.sourceCardId).id !==
      selection.sourceDefinitionId
  )
    throw new Error("Die CardImplementation-Install-Choice ist ungueltig.");
  const cardId = selection.selectedCardId;
  const definition = host.cards.definitionFor(cardId);
  const installed = host.install.installRunnerProgramFromZoneWithoutClick(
    cardId,
    "stack",
    selection.installCost,
  );
  if (!installed) throw new Error("Das Programm kann nicht installiert werden.");
  if (selection.shuffleNeeded)
    host.shuffleRunnerStack(`p3_38_search_stack_install:${choice.choiceId}:shuffle`);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_38_search_stack_install",
    sourceDefinitionId: selection.sourceDefinitionId,
    searchedZone: "runner_stack",
    selectedCount: 1,
    publicRevealKind: "reveal",
    publicRevealDefinitionId: definition.id,
    installed: true,
    installedProgramCount: 1,
    searchDestination: "runner_rig",
    shufflePerformed: true,
    shuffled: true,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: selection.shuffleNeeded,
    installedCardId: cardId,
  };
}

export function handleRevealedStackProgramInstallCorpReviewChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  if (!isP338RevealedStackProgramInstallCorpReviewChoiceSource(choice.source))
    throw new Error("Es ist keine Revealed-Stack-Korp-Review-Choice offen.");
  if (!selectedChoiceIds(host.playerAction.selectedChoices).includes("done"))
    throw new Error("Die Revealed-Stack-Korp-Review wurde nicht bestaetigt.");
  const [
    ,
    sourceCardId = "",
    sourceDefinitionId = "",
    topCardsRaw = "",
  ] = choice.source.split(":");
  if (
    !sourceCardId ||
    !state.runner.rig.programs.includes(sourceCardId as CardInstanceId) ||
    host.cards.definitionFor(sourceCardId as CardInstanceId).id !==
      sourceDefinitionId
  )
    throw new Error("Die Stack-Show-Quelle ist nicht mehr installiert.");
  const run = requireRun(host);
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId as CardInstanceId))
    throw new Error("Diese Kartenquelle wurde in diesem Run bereits genutzt.");
  const topCardsAtReveal = topCardsRaw
    .split(",")
    .filter((cardId): cardId is CardInstanceId => Boolean(cardId));
  const currentTopCards = state.runner.stack.slice(0, topCardsAtReveal.length);
  if (
    topCardsAtReveal.length === 0 ||
    topCardsAtReveal.some((cardId, index) => currentTopCards[index] !== cardId)
  )
    throw new Error("Die Stack-Spitze hat sich seit dem Reveal veraendert.");
  const revealedCardDefinitionIds = topCardsAtReveal.map(
    (cardId) => host.cards.definitionFor(cardId).id,
  );
  const installableProgramIds = topCardsAtReveal.filter(
    (cardId) =>
      host.cards.definitionFor(cardId).type === "program" &&
      host.install.canInstallRunnerProgramFromZone(cardId, "stack", "free"),
  );
  if (!installableProgramIds.length) {
    run.successfulRunAbilityUsedSourceIds = [
      ...used,
      sourceCardId as CardInstanceId,
    ].sort();
    host.shuffleRunnerStack(
      `p3_38_stack_show_install:no_program:${sourceCardId}:${run.runId}`,
    );
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_38_look_top_stack_show_to_corp_then_install_matching",
      sourceDefinitionId,
      revealCount: topCardsAtReveal.length,
      shownCardDefinitionIds: revealedCardDefinitionIds.join(","),
      revealedCardDefinitionIds: revealedCardDefinitionIds.join(","),
      revealedProgramCount: topCardsAtReveal.filter(
        (cardId) => host.cards.definitionFor(cardId).type === "program",
      ).length,
      programFound: false,
      installedProgramCount: 0,
      selfTrashed: false,
      shufflePerformed: true,
      shuffled: true,
      randomCounterAfter: host.state.randomCounter,
    };
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: true,
      resolvedPayload: host.legalAction.payload as HiddenZonePayload,
      shufflePerformed: true,
    };
  }

  state.pendingChoice = buildLookTopStackShowToCorpThenInstallMatchingChoice({
    stateVersion: state.stateVersion,
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    topCards: topCardsAtReveal,
    options: installableProgramIds.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_38_look_top_stack_show_to_corp_then_install_matching",
    sourceDefinitionId,
    revealCount: topCardsAtReveal.length,
    shownCardDefinitionIds: revealedCardDefinitionIds.join(","),
    revealedCardDefinitionIds: revealedCardDefinitionIds.join(","),
    revealedProgramCount: topCardsAtReveal.filter(
      (cardId) => host.cards.definitionFor(cardId).type === "program",
    ).length,
    programFound: true,
    choiceVisibility: "public",
    shufflePerformed: false,
  };
  return {
    handled: true,
    stateChanged: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

export function handleLookTopStackShowInstallChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  if (!choice.source.startsWith("p3_38.look_top_stack_show_to_corp_then_install_matching"))
    throw new Error("Es ist keine Stack-Show-Install-Choice offen.");
  const [
    ,
    sourceCardId = "",
    sourceDefinitionId = "",
    topCardsRaw = "",
  ] = choice.source.split(":");
  if (
    !sourceCardId ||
    !state.runner.rig.programs.includes(sourceCardId) ||
    host.cards.definitionFor(sourceCardId as CardInstanceId).id !==
      sourceDefinitionId
  )
    throw new Error("Die Stack-Show-Quelle ist nicht mehr installiert.");
  const run = requireRun(host);
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId as CardInstanceId))
    throw new Error("Diese Kartenquelle wurde in diesem Run bereits genutzt.");
  const topCardsAtReveal = topCardsRaw
    .split(",")
    .filter((cardId): cardId is CardInstanceId => Boolean(cardId));
  const currentTopCards = state.runner.stack.slice(0, topCardsAtReveal.length);
  if (
    topCardsAtReveal.length === 0 ||
    topCardsAtReveal.some((cardId, index) => currentTopCards[index] !== cardId)
  )
    throw new Error("Die Stack-Spitze hat sich seit dem Reveal veraendert.");
  const revealedCardDefinitionIds = topCardsAtReveal.map(
    (cardId) => host.cards.definitionFor(cardId).id,
  );
  const selectedId = selectedChoiceCardIds(choice, host.playerAction)[0];
  if (
    !selectedId ||
    !topCardsAtReveal.includes(selectedId) ||
    !host.install.canInstallRunnerProgramFromZone(selectedId, "stack", "free")
  )
    throw new Error("Das gewaehlte Programm ist nicht legal installierbar.");
  const selectedDefinition = host.cards.definitionFor(selectedId);
  const installed = host.install.installRunnerProgramFromZoneWithoutClick(
    selectedId,
    "stack",
    "free",
  );
  if (!installed) throw new Error("Das Programm kann nicht installiert werden.");
  host.zones.trashRunnerInstalledCardToHeap(sourceCardId as CardInstanceId);
  run.successfulRunAbilityUsedSourceIds = [
    ...used,
    sourceCardId as CardInstanceId,
  ].sort();
  host.shuffleRunnerStack(`p3_38_stack_show_install:${choice.choiceId}:shuffle`);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_38_look_top_stack_show_to_corp_then_install_matching",
    sourceDefinitionId,
    revealCount: topCardsAtReveal.length,
    shownCardDefinitionIds: revealedCardDefinitionIds.join(","),
    revealedCardDefinitionIds: revealedCardDefinitionIds.join(","),
    revealedProgramCount: topCardsAtReveal.filter(
      (cardId) => host.cards.definitionFor(cardId).type === "program",
    ).length,
    programFound: true,
    publicRevealKind: "reveal",
    publicRevealDefinitionId: selectedDefinition.id,
    installed: true,
    installedProgramDefinitionId: selectedDefinition.id,
    installedProgramCount: 1,
    selfTrashed: true,
    shufflePerformed: true,
    shuffled: true,
    randomCounterAfter: host.state.randomCounter,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: true,
    installedCardId: selectedId,
    sourceTrashCardIds: [sourceCardId as CardInstanceId],
  };
}

function handleTemporaryProgramInstallSourceChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice } = host;
  if (!isTemporaryProgramInstallSourceChoiceSource(choice.source))
    throw new Error("Es ist keine Sneak-Preview-Quellenwahl offen.");
  const parts = choice.source.split(":");
  const isCardImplementationChoice = choice.source.startsWith(
    "p3_38.stack_or_trash_program_install_source",
  );
  const sourceCardId = isCardImplementationChoice
    ? (parts[1] as CardInstanceId | undefined)
    : undefined;
  const sourceDefinitionId = isCardImplementationChoice
    ? (parts[2] as CardDefinitionId | undefined)
    : host.constants.temporaryProgramInstallSourceId;
  const optionId = selectedChoiceIds(host.playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === optionId);
  const selectedSource = option?.value;
  if (selectedSource !== "heap" && selectedSource !== "stack")
    throw new Error("Die Sneak-Preview-Quelle ist ungueltig.");
  startTemporaryProgramInstallChoice(host, {
    sourceZone: selectedSource,
    sourcePrefix: isCardImplementationChoice
      ? "p3_38.stack_or_trash_program_install"
      : "v1911.temporary_program_install",
    sourceCardId,
    sourceDefinitionId: sourceDefinitionId ?? host.constants.temporaryProgramInstallSourceId,
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: isCardImplementationChoice
      ? "p3_38_stack_or_trash_program_install_source_selected"
      : "temporary_program_install_source_selected",
    sourceDefinitionId: sourceDefinitionId ?? host.constants.temporaryProgramInstallSourceId,
    choiceVisibility: "runner_private",
  };
  return {
    handled: true,
    stateChanged: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

function handleTemporaryProgramInstallChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice } = host;
  const selectedCardId = selectedChoiceCardIds(choice, host.playerAction)[0];
  const selectedDefinition =
    selectedCardId && host.state.cardInstances[selectedCardId]
      ? host.cards.definitionFor(selectedCardId)
      : undefined;
  const plan = resolveTemporaryProgramSearchInstallIntent({
    choice,
    selectedCardId,
    legalTargetIdsForSourceZone: (sourceZone) =>
      host.install.temporaryProgramInstallableProgramIds(sourceZone),
    selectedCardDefinition: selectedDefinition,
    defaultSourceDefinitionId: host.constants.temporaryProgramInstallSourceId,
  });
  const execution = executeFreeProgramInstallPlan({
    plan: createTemporaryProgramFreeInstallInput(plan),
    callbacks: {
      installProgramForFree: (programId) =>
        host.install.installRunnerProgramForFree(programId),
    },
  });
  const postInstall = createTemporaryProgramInstallPostInstallSideEffectPlan({
    execution,
    sourceCardDefinitionId: plan.sourceDefinitionId,
  });
  applyTemporaryProgramInstallReturnPlan(postInstall, {
    recordTemporaryReturn: (record) => {
      host.state.temporaryProgramInstallReturns ??= [];
      host.state.temporaryProgramInstallReturns.push(record);
    },
  });
  if (execution.shuffleNeeded)
    host.shuffleRunnerStack(`v1911_temporary_program_install:${choice.choiceId}:shuffle`);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildTemporaryProgramSearchInstallResolvedPayload(plan),
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: execution.shuffleNeeded,
    installedCardId: execution.installedProgramId,
  };
}

function startTemporaryProgramInstallChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
  input: {
    sourceZone: SearchInstallSourceZone;
    sourcePrefix: string;
    sourceCardId?: CardInstanceId | undefined;
    sourceDefinitionId: CardDefinitionId;
  },
): void {
  const sourceCards =
    input.sourceZone === "heap"
      ? host.state.runner.heap.slice().sort()
      : host.state.runner.stack;
  const targets = host.install.temporaryProgramInstallableProgramIds(input.sourceZone);
  const options = sourceCards.map((cardId) => {
    const definition = host.cards.definitionFor(cardId);
    const selectable = targets.includes(cardId);
    return {
      id: `card_${cardId}`,
      label: definition.title,
      value: cardId,
      ...(!selectable ? { selectable: false } : {}),
    };
  });
  if (targets.length === 0)
    throw new Error("In dieser Sneak-Preview-Quelle liegt kein legales Programm.");
  host.state.pendingChoice = buildTemporaryProgramInstallChoice({
    stateVersion: host.state.stateVersion,
    sourceZone: input.sourceZone,
    sourcePrefix: input.sourcePrefix,
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
    options,
  });
}

function handleRunnerStackSearchChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  const cardId = selectedChoiceCardIds(choice, host.playerAction)[0];
  if (!cardId || !state.runner.stack.includes(cardId))
    throw new Error("Die gewaehlte Karte liegt nicht im Stack.");
  if (
    !choice.source.startsWith("v1911.search_stack_card") &&
    host.cards.definitionFor(cardId).type !== "program"
  )
    throw new Error("Nur Programme sind in dieser Search-Harness legal.");
  host.zones.removeFromAllZones(cardId);
  host.zones.addToGrip(cardId);
  const instance = state.cardInstances[cardId];
  if (!instance) throw new Error(`CardInstance fehlt: ${cardId}`);
  state.cardInstances[cardId] = {
    ...instance,
    zone: { side: "runner", zone: "grip" },
  };
  let stackSearchGripSourceCardId: CardInstanceId | undefined;
  if (choice.source.startsWith("runner.stack_search_to_grip:")) {
    stackSearchGripSourceCardId = choice.source.split(":")[1] as
      | CardInstanceId
      | undefined;
    if (
      !stackSearchGripSourceCardId ||
      !state.runner.rig.resources.includes(stackSearchGripSourceCardId) ||
      host.cards.definitionFor(stackSearchGripSourceCardId).id !==
        host.constants.stackSearchGripSourceId
    )
      throw new Error("Die Stack-Search-to-Grip-Quelle ist nicht mehr installiert.");
  }
  host.shuffleRunnerStack(`v098_search_stack:${choice.choiceId}:shuffle`);
  const payload: HiddenZonePayload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: stackSearchGripSourceCardId
      ? "runner_stack_search_to_grip"
      : "search_stack",
    selectedCount: 1,
    searchDestination: "runner_grip",
    shuffled: true,
    ...(stackSearchGripSourceCardId
      ? {
          sourceDefinitionId: host.constants.stackSearchGripSourceId,
          cardDefinitionId: host.cards.definitionFor(cardId).id,
          publicRevealDefinitionId: host.cards.definitionFor(cardId).id,
          publicRevealKind: "reveal",
        }
      : {}),
  };
  host.legalAction.payload = payload;
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: payload,
    shufflePerformed: true,
    movedCardIds: [cardId],
  };
}

function handleCardImplementationSearchToGripChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  const selectedCardIds = selectedChoiceCardIds(choice, host.playerAction);
  const selection = resolveSearchToGripSelections({
    choice,
    selectedCardIds,
    legalTargetIdsFor: ({ sourceZone, filter }) =>
      sourceZone === "heap"
        ? searchTrashToGripTargets(host, filter)
        : searchStackToGripTargets(host, filter),
  });
  const move = applyResolvedSearchToGripMoves({
    selection,
    sourceCardIds:
      selection.sourceZone === "heap" ? state.runner.heap : state.runner.stack,
    sourceDefinition: host.cards.definitionFor(selection.sourceCardId),
    selectedCards: selection.selectedCardIds.map((cardId) => ({
      cardId,
      definitionId: host.cards.definitionFor(cardId).id,
    })),
    installedRunnerResourceIds: state.runner.rig.resources,
    cardInstances: state.cardInstances,
    removeFromAllZones: host.zones.removeFromAllZones,
    addToGrip: host.zones.addToGrip,
  });
  if (selection.shuffleNeeded)
    host.shuffleRunnerStack(
      `p3_37_search_stack_to_grip:${choice.choiceId}:shuffle`,
    );
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...move.payload,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: selection.shuffleNeeded,
    movedCardIds: move.results.map((result) => result.movedCardId),
  };
}

function handleAujourdOuiTop5Choice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  if (!choice.source.startsWith("v1911.aujourdoui_top5"))
    throw new Error("Es ist keine Aujourd'Oui-Top-5-Choice offen.");
  const sourceCardId = choice.source.split(":")[1] as
    | CardInstanceId
    | undefined;
  if (
    !sourceCardId ||
    !state.runner.rig.resources.includes(sourceCardId) ||
    host.cards.definitionFor(sourceCardId).id !==
      host.constants.topStackTakeMatchingSourceId
  ) {
    throw new Error("Aujourd'Oui ist nicht mehr installiert.");
  }

  const topCardIds = choice.options
    .map((option) => option.value)
    .filter((value): value is CardInstanceId => typeof value === "string");
  const selectedIds = selectedChoiceCardIds(choice, host.playerAction);
  const uniqueSelectedIds = [...new Set(selectedIds)];
  if (uniqueSelectedIds.length !== selectedIds.length)
    throw new Error("Die Aujourd'Oui-Auswahl enthaelt doppelte Karten.");
  if (uniqueSelectedIds.some((cardId) => !topCardIds.includes(cardId)))
    throw new Error("Aujourd'Oui darf nur Karten aus den obersten 5 waehlen.");
  if (
    uniqueSelectedIds.some((cardId) => host.cards.definitionFor(cardId).type !== "program")
  )
    throw new Error("Aujourd'Oui darf nur Programme in den Grip nehmen.");
  const creditCost = uniqueSelectedIds.length;
  if (state.runner.credits < creditCost)
    throw new Error("Der Runner kann die Aujourd'Oui-Kosten nicht bezahlen.");

  host.spendRunnerCredits(creditCost);
  for (const cardId of uniqueSelectedIds) {
    host.zones.removeFromAllZones(cardId);
    host.zones.addToGrip(cardId);
    const instance = state.cardInstances[cardId];
    if (!instance) throw new Error(`CardInstance fehlt: ${cardId}`);
    state.cardInstances[cardId] = {
      ...instance,
      zone: { side: "runner", zone: "grip" },
    };
  }
  host.shuffleRunnerStack(`v1911_aujourdoui_top5:${choice.choiceId}:shuffle`);
  const revealedDefinitionIds = uniqueSelectedIds.map(
    (cardId) => host.cards.definitionFor(cardId).id,
  );
  const revealPayload: HiddenZonePayload =
    revealedDefinitionIds.length > 0
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: revealedDefinitionIds[0]!,
          publicRevealDefinitionIds: revealedDefinitionIds.join(","),
          revealedCount: revealedDefinitionIds.length,
        }
      : { revealedCount: 0 };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_aujourdoui_top5",
    sourceDefinitionId: host.constants.topStackTakeMatchingSourceId,
    selectedCount: uniqueSelectedIds.length,
    searchedTopCount: topCardIds.length,
    searchDestination: "runner_grip",
    creditCostPaid: creditCost,
    runnerCreditsAfter: state.runner.credits,
    shuffled: true,
    ...revealPayload,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: true,
    movedCardIds: uniqueSelectedIds,
  };
}

function handleCardImplementationLookTopStackTakeMatchingChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  if (!choice.source.startsWith("p3_37.look_top_stack_take_matching"))
    throw new Error("Es ist keine Stack-Look-Choice offen.");
  const selection = resolveLookTopStackTakeMatchingSelection({
    choice,
    selectedCardIds: selectedChoiceCardIds(choice, host.playerAction),
    topCardIdsForCount: (count) => state.runner.stack.slice(0, count),
    legalTargetIdsFor: ({ count, allowedTypes }) =>
      lookTopStackTakeMatchingTargets(host, count, allowedTypes),
    runnerCredits: state.runner.credits,
  });
  const topCards = state.runner.stack.slice(0, selection.count);
  const moveIntent = createTopNTakeMatchingMoveIntent({
    selection,
    topCardIds: topCards,
    sourceDefinition: host.cards.definitionFor(selection.sourceCardId),
    installedRunnerResourceIds: state.runner.rig.resources,
    selectedCards: selection.selectedCardIds.map((cardId) =>
      toTopNSelectedCardMove(cardId, host.cards.definitionFor(cardId)),
    ),
  });
  host.spendRunnerCredits(selection.paidCredits);
  const moveResult = applyTopNTakeMatchingMoveIntent(moveIntent, {
    cardInstances: state.cardInstances,
    removeFromAllZones: host.zones.removeFromAllZones,
    addToGrip: host.zones.addToGrip,
  });
  if (moveResult.shuffleNeeded)
    host.shuffleRunnerStack(`p3_37_look_top_stack_take_matching:${choice.choiceId}:shuffle`);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildTopNTakeMatchingResolvedPayload(moveResult, {
      runnerCreditsAfter: state.runner.credits,
    }),
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: moveResult.shuffleNeeded,
    movedCardIds: moveResult.movedCardIds,
  };
}

function handlePaidStackProgramInstallStackChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  const selectedCardId = selectedChoiceCardIds(choice, host.playerAction)[0];
  const selectedDefinition = selectedCardId
    ? host.cards.definitionFor(selectedCardId)
    : undefined;
  const plan = resolvePaidStackProgramInstallIntent({
    choice,
    selectedCardId,
    stackCardIds: state.runner.stack,
    selectedCardDefinition: selectedDefinition,
    availableInstallCredits: host.availableRunnerProgramInstallCredits(),
    runnerMemoryUsed: state.runner.memoryUsed,
    runnerMemoryLimit: host.runnerMemoryLimit(),
    uniqueBlocked: !!selectedDefinition &&
      host.cards.isUniqueRunnerDefinitionInstalled(selectedDefinition),
    sourceDefinitionId: host.constants.stackProgramFreeInstallSourceId,
  });
  const cardId = plan.selectedCardId;
  if (plan.shouldOpenMemoryChoice) {
    if (plan.shuffleNeeded)
      host.shuffleRunnerStack(`paid_stack_program_install:${choice.choiceId}:shuffle`);
    const opened = host.startRunnerProgramFreeMemoryChoice(cardId);
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      ...buildPaidStackProgramInstallMemoryDeferredPayload(plan, { installDeferredForMemory: opened }),
    };
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: !opened,
      resolvedPayload: host.legalAction.payload as HiddenZonePayload,
      shufflePerformed: plan.shuffleNeeded,
    };
  }

  const installed = plan.canAttemptInstall
    ? host.installRunnerProgramFromStackWithoutClick(cardId)
    : false;
  if (plan.shuffleNeeded)
    host.shuffleRunnerStack(`paid_stack_program_install:${choice.choiceId}:shuffle`);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildPaidStackProgramInstallResolvedPayload(plan, { installed }),
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: plan.shuffleNeeded,
    ...(installed ? { installedCardId: cardId } : {}),
  };
}

function handlePaidStackProgramInstallFreeMemoryChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  if (!choice.source.startsWith("runner.program_free_memory"))
    throw new Error("Es ist keine Self-Modifying-Code-MU-Choice offen.");
  const selectedProgramId = choice.source.split(":")[1] as
    | CardInstanceId
    | undefined;
  if (!selectedProgramId || !state.runner.stack.includes(selectedProgramId))
    throw new Error("Das Self-Modifying-Code-Programm liegt nicht mehr im Stack.");
  const trashIds = selectedChoiceCardIds(choice, host.playerAction);
  if (trashIds.length === 0) throw new Error("Es wurde kein Programm gewählt.");
  const uniqueTrashIds = [...new Set(trashIds)];
  if (uniqueTrashIds.length !== trashIds.length)
    throw new Error("Die MU-Auswahl enthält doppelte Karten.");
  for (const cardId of uniqueTrashIds) {
    if (!state.runner.rig.programs.includes(cardId))
      throw new Error("Die MU-Auswahl enthält kein installiertes Programm.");
    if (!host.cards.runnerProgramUsesMemory(cardId))
      throw new Error("Dieses Programm macht keine MU frei.");
  }
  const trashedDefinitionIds = uniqueTrashIds.map(
    (cardId) => host.cards.definitionFor(cardId).id,
  );
  for (const cardId of uniqueTrashIds)
    host.zones.trashRunnerInstalledCardToHeap(cardId);
  const installed = host.installRunnerProgramFromStackWithoutClick(selectedProgramId);
  if (!installed)
    throw new Error("Nach der MU-Auswahl kann das Programm nicht installiert werden.");
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    sourceDefinitionId: host.constants.stackProgramFreeInstallSourceId,
    hiddenZoneAction: "runner_program_free_memory",
    publicRevealKind: "reveal",
    publicRevealDefinitionId: host.cards.definitionFor(selectedProgramId).id,
    trashedCount: uniqueTrashIds.length,
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
    installed: true,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    installedCardId: selectedProgramId,
    sourceTrashCardIds: uniqueTrashIds,
  };
}

function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}

function selectedChoiceCardIds(
  choice: ChoiceRequest,
  playerAction: PlayerAction,
): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value;
  });
}

function searchStackToGripTargets(
  host: HiddenZoneSearchChoiceHandlerHost,
  filter: "program" | "any_card",
): CardInstanceId[] {
  return host.state.runner.stack.filter((cardId) =>
    filter === "any_card" || host.cards.definitionFor(cardId).type === "program",
  );
}

function searchTrashToGripTargets(
  host: HiddenZoneSearchChoiceHandlerHost,
  filter: "program" | "any_card",
): CardInstanceId[] {
  return host.state.runner.heap.filter((cardId) =>
    filter === "any_card" || host.cards.definitionFor(cardId).type === "program",
  );
}

function lookTopStackTakeMatchingTargets(
  host: HiddenZoneSearchChoiceHandlerHost,
  count: number,
  allowedTypes: readonly string[],
): CardInstanceId[] {
  return host.state.runner.stack
    .slice(0, count)
    .filter((cardId) => allowedTypes.includes(host.cards.definitionFor(cardId).type));
}

function isPaidStackProgramInstallChoiceSource(source: string): boolean {
  return (
    source.startsWith("v1911.hidden_stack_program_install") ||
    source.startsWith("runner.program_free_memory")
  );
}

function isTemporaryProgramInstallChoiceSource(source: string): boolean {
  return (
    isTemporaryProgramInstallSourceChoiceSource(source) ||
    source.startsWith("v1911.temporary_program_install_heap_install") ||
    source.startsWith("v1911.temporary_program_install_stack_install") ||
    source.startsWith("p3_38.stack_or_trash_program_install")
  );
}

function isTemporaryProgramInstallSourceChoiceSource(source: string): boolean {
  return (
    source.startsWith("v1911.temporary_program_install_source") ||
    source.startsWith("p3_38.stack_or_trash_program_install_source")
  );
}

function isRevealedStackProgramInstallChoiceSource(source: string): boolean {
  return source.startsWith("v1915.revealed_stack_program_install");
}

function isP338SearchInstallChoiceSource(source: string): boolean {
  return source.startsWith("p3_38.search_stack_install");
}

function isP338RevealedStackProgramInstallCorpReviewChoiceSource(source: string): boolean {
  return source.startsWith("p3_38.revealed_stack_program_install_corp_review");
}

function isP338LookTopStackShowInstallChoiceSource(source: string): boolean {
  return source.startsWith(
    "p3_38.look_top_stack_show_to_corp_then_install_matching",
  );
}

function isTopNTakeMatchingChoiceSource(source: string): boolean {
  return (
    source.startsWith("v1911.aujourdoui_top5") ||
    source.startsWith("p3_37.look_top_stack_take_matching")
  );
}

function isSearchToGripChoiceSource(source: string): boolean {
  return (
    source.startsWith("v098.search_stack") ||
    source.startsWith("v1911.search_stack") ||
    source.startsWith("v1912.search_stack") ||
    source.startsWith("runner.stack_search_to_grip") ||
    isCardImplementationSearchToGripChoiceSource(source)
  );
}

function isCardImplementationSearchToGripChoiceSource(source: string): boolean {
  return (
    source.startsWith("p3_37.search_trash_to_grip") ||
    source.startsWith("p3_37.search_stack_to_grip")
  );
}

function requireRun(
  host: HiddenZoneSearchActivationHandlerHost | HiddenZoneSearchChoiceHandlerHost,
): NonNullable<GameState["run"]> {
  if (!host.state.run) throw new Error("Es läuft kein Run.");
  return host.state.run;
}
