import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { buildSneakPreviewProgramChoice } from "./search-choice-builders";
import {
  buildSelfModifyingCodeMemoryDeferredPayload,
  buildMysteryBoxSearchInstallResolvedPayload,
  buildSneakPreviewSearchInstallResolvedPayload,
  resolveMysteryBoxSearchInstallIntent,
  buildSelfModifyingCodeResolvedPayload,
  resolveSneakPreviewSearchInstallIntent,
  resolveSelfModifyingCodeSearchInstallIntent,
} from "./search-install-intents";
import {
  resolveLookTopStackTakeMatchingSelection,
  resolveSearchStackInstallSelection,
  resolveSearchToGripSelection,
} from "./search-choice-resolvers";
import { applyResolvedSearchToGripMove } from "./search-choice-move-intents";
import {
  applyTopNTakeMatchingMoveIntent,
  buildTopNTakeMatchingResolvedPayload,
  createTopNTakeMatchingMoveIntent,
  toTopNSelectedCardMove,
} from "./topn-move-intents";
import {
  createMysteryBoxFreeProgramInstallInput,
  createSneakPreviewFreeProgramInstallInput,
  executeFreeProgramInstallPlan,
} from "./free-program-install-execution";
import {
  applyMysteryBoxOncePerRunPlan,
  applyMysteryBoxSourceTrashPlan,
  applySneakPreviewTemporaryReturnPlan,
  createMysteryBoxPostInstallSideEffectPlan,
  createSneakPreviewPostInstallSideEffectPlan,
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
    | "sneakPreviewTemporaryInstalls"
    | "run"
  >;
  constants: {
    aujourdOuiResourceCardId: CardDefinitionId;
    mysteryBoxId: CardDefinitionId;
    selfModifyingCodeId: CardDefinitionId;
    shortCircuitResourceCardId: CardDefinitionId;
    sneakPreviewId: CardDefinitionId;
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
  startSelfModifyingCodeFreeMuChoice: (cardId: CardInstanceId) => boolean;
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
    sneakPreviewInstallableProgramIds: (
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
  if (isSelfModifyingCodeChoiceSource(source))
    return handleSelfModifyingCodeChoice(host);
  if (isSneakPreviewChoiceSource(source))
    return handleSneakPreviewChoice(host);
  if (isMysteryBoxChoiceSource(source))
    return handleMysteryBoxChoice(host);
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

export function handleSelfModifyingCodeChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  if (host.choice.source.startsWith("v1911.self_modifying_code_free_mu"))
    return handleSelfModifyingCodeFreeMuChoice(host);
  return handleSelfModifyingCodeStackChoice(host);
}

export function handleSneakPreviewChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  if (isSneakPreviewSourceChoiceSource(host.choice.source))
    return handleSneakPreviewSourceChoice(host);
  return handleSneakPreviewProgramChoice(host);
}

export function handleMysteryBoxChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  const selectedId = selectedChoiceCardIds(choice, host.playerAction)[0];
  const currentTopCards = state.runner.stack.slice(0, 5);
  const selectedDefinition = selectedId
    ? host.cards.definitionFor(selectedId)
    : undefined;
  const plan = resolveMysteryBoxSearchInstallIntent({
    choice,
    selectedCardId: selectedId,
    topCardIds: currentTopCards,
    selectedCardDefinition: selectedDefinition,
  });
  const sourceCardId = plan.sourceCardId;
  if (!sourceCardId || !state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Mystery Box ist nicht mehr installiert.");
  if (host.cards.definitionFor(sourceCardId).id !== host.constants.mysteryBoxId)
    throw new Error("Die Mystery-Box-Choice passt nicht zur Quelle.");
  const execution = executeFreeProgramInstallPlan({
    plan: createMysteryBoxFreeProgramInstallInput(plan),
    callbacks: {
      installProgramForFree: (programId) =>
        host.install.installRunnerProgramForFree(programId, {
          checkUnique: false,
          typeError: "Mystery Box kann nur ein Programm installieren.",
          memoryError: "Nicht genug Memory fuer das Mystery-Box-Programm.",
        }),
    },
  });
  const postInstall = createMysteryBoxPostInstallSideEffectPlan(execution);
  applyMysteryBoxSourceTrashPlan(postInstall, {
    trashSource: host.zones.trashRunnerInstalledCardToHeap,
  });
  if (execution.shuffleNeeded)
    host.shuffleRunnerStack(
      `v1915.mystery_box.shuffle.after_install.${sourceCardId}.${execution.installedProgramId}`,
    );
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildMysteryBoxSearchInstallResolvedPayload(plan, {
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
    publicRevealKind: "reveal",
    publicRevealDefinitionId: selectedDefinition.id,
    installed: true,
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

function handleSneakPreviewSourceChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice } = host;
  if (!isSneakPreviewSourceChoiceSource(choice.source))
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
    : host.constants.sneakPreviewId;
  const optionId = selectedChoiceIds(host.playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === optionId);
  const selectedSource = option?.value;
  if (selectedSource !== "heap" && selectedSource !== "stack")
    throw new Error("Die Sneak-Preview-Quelle ist ungueltig.");
  startSneakPreviewProgramChoice(host, {
    sourceZone: selectedSource,
    sourcePrefix: isCardImplementationChoice
      ? "p3_38.stack_or_trash_program_install"
      : "v1911.sneak_preview",
    sourceCardId,
    sourceDefinitionId: sourceDefinitionId ?? host.constants.sneakPreviewId,
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: isCardImplementationChoice
      ? "p3_38_stack_or_trash_program_install_source_selected"
      : "sneak_preview_source_selected",
    sourceDefinitionId: sourceDefinitionId ?? host.constants.sneakPreviewId,
    choiceVisibility: "runner_private",
  };
  return {
    handled: true,
    stateChanged: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

function handleSneakPreviewProgramChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice } = host;
  const selectedCardId = selectedChoiceCardIds(choice, host.playerAction)[0];
  const selectedDefinition =
    selectedCardId && host.state.cardInstances[selectedCardId]
      ? host.cards.definitionFor(selectedCardId)
      : undefined;
  const plan = resolveSneakPreviewSearchInstallIntent({
    choice,
    selectedCardId,
    legalTargetIdsForSourceZone: (sourceZone) =>
      host.install.sneakPreviewInstallableProgramIds(sourceZone),
    selectedCardDefinition: selectedDefinition,
    defaultSourceDefinitionId: host.constants.sneakPreviewId,
  });
  const execution = executeFreeProgramInstallPlan({
    plan: createSneakPreviewFreeProgramInstallInput(plan),
    callbacks: {
      installProgramForFree: (programId) =>
        host.install.installRunnerProgramForFree(programId),
    },
  });
  const postInstall = createSneakPreviewPostInstallSideEffectPlan({
    execution,
    sourceCardDefinitionId: plan.sourceDefinitionId,
  });
  applySneakPreviewTemporaryReturnPlan(postInstall, {
    recordTemporaryReturn: (record) => {
      host.state.sneakPreviewTemporaryInstalls ??= [];
      host.state.sneakPreviewTemporaryInstalls.push(record);
    },
  });
  if (execution.shuffleNeeded)
    host.shuffleRunnerStack(`v1911_sneak_preview:${choice.choiceId}:shuffle`);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildSneakPreviewSearchInstallResolvedPayload(plan),
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

function startSneakPreviewProgramChoice(
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
  const targets = host.install.sneakPreviewInstallableProgramIds(input.sourceZone);
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
  host.state.pendingChoice = buildSneakPreviewProgramChoice({
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
  let shortCircuitSourceId: CardInstanceId | undefined;
  if (choice.source.startsWith("v1911.short_circuit_search:")) {
    shortCircuitSourceId = choice.source.split(":")[1] as
      | CardInstanceId
      | undefined;
    if (
      !shortCircuitSourceId ||
      !state.runner.rig.resources.includes(shortCircuitSourceId) ||
      host.cards.definitionFor(shortCircuitSourceId).id !==
        host.constants.shortCircuitResourceCardId
    )
      throw new Error("The Short Circuit ist nicht mehr installiert.");
  }
  host.shuffleRunnerStack(`v098_search_stack:${choice.choiceId}:shuffle`);
  const payload: HiddenZonePayload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: shortCircuitSourceId
      ? "v1911_short_circuit_search"
      : "search_stack",
    selectedCount: 1,
    searchDestination: "runner_grip",
    shuffled: true,
    ...(shortCircuitSourceId
      ? {
          sourceDefinitionId: host.constants.shortCircuitResourceCardId,
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
  const selection = resolveSearchToGripSelection({
    choice,
    selectedCardId: selectedChoiceCardIds(choice, host.playerAction)[0],
    legalTargetIdsFor: ({ sourceZone, filter }) =>
      sourceZone === "heap"
        ? searchTrashToGripTargets(host, filter)
        : searchStackToGripTargets(host, filter),
  });
  const move = applyResolvedSearchToGripMove({
    selection,
    sourceCardIds: selection.sourceZone === "heap" ? state.runner.heap : state.runner.stack,
    sourceDefinition: host.cards.definitionFor(selection.sourceCardId),
    selectedCardDefinitionId: host.cards.definitionFor(selection.selectedCardId).id,
    installedRunnerResourceIds: state.runner.rig.resources,
    cardInstances: state.cardInstances,
    removeFromAllZones: host.zones.removeFromAllZones,
    addToGrip: host.zones.addToGrip,
  });
  if (move.result.shuffleNeeded)
    host.shuffleRunnerStack(`p3_37_search_stack_to_grip:${choice.choiceId}:shuffle`);
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...move.payload };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
    shufflePerformed: move.result.shuffleNeeded,
    movedCardIds: [move.result.movedCardId],
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
      host.constants.aujourdOuiResourceCardId
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
    sourceDefinitionId: host.constants.aujourdOuiResourceCardId,
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

function handleSelfModifyingCodeStackChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  const selectedCardId = selectedChoiceCardIds(choice, host.playerAction)[0];
  const selectedDefinition = selectedCardId
    ? host.cards.definitionFor(selectedCardId)
    : undefined;
  const plan = resolveSelfModifyingCodeSearchInstallIntent({
    choice,
    selectedCardId,
    stackCardIds: state.runner.stack,
    selectedCardDefinition: selectedDefinition,
    availableInstallCredits: host.availableRunnerProgramInstallCredits(),
    runnerMemoryUsed: state.runner.memoryUsed,
    runnerMemoryLimit: host.runnerMemoryLimit(),
    uniqueBlocked: !!selectedDefinition &&
      host.cards.isUniqueRunnerDefinitionInstalled(selectedDefinition),
    sourceDefinitionId: host.constants.selfModifyingCodeId,
  });
  const cardId = plan.selectedCardId;
  if (plan.shouldOpenMemoryChoice) {
    if (plan.shuffleNeeded)
      host.shuffleRunnerStack(`v1911_self_modifying_code:${choice.choiceId}:shuffle`);
    const opened = host.startSelfModifyingCodeFreeMuChoice(cardId);
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      ...buildSelfModifyingCodeMemoryDeferredPayload(plan, { installDeferredForMemory: opened }),
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
    host.shuffleRunnerStack(`v1911_self_modifying_code:${choice.choiceId}:shuffle`);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildSelfModifyingCodeResolvedPayload(plan, { installed }),
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

function handleSelfModifyingCodeFreeMuChoice(
  host: HiddenZoneSearchChoiceHandlerHost,
): HiddenZoneChoiceHandlerResult {
  const { choice, state } = host;
  if (!choice.source.startsWith("v1911.self_modifying_code_free_mu"))
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
    sourceDefinitionId: host.constants.selfModifyingCodeId,
    hiddenZoneAction: "self_modifying_code_free_mu",
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

function isSelfModifyingCodeChoiceSource(source: string): boolean {
  return (
    source.startsWith("v1911.self_modifying_code_install_program") ||
    source.startsWith("v1911.self_modifying_code_free_mu")
  );
}

function isSneakPreviewChoiceSource(source: string): boolean {
  return (
    isSneakPreviewSourceChoiceSource(source) ||
    source.startsWith("v1911.sneak_preview_heap_install") ||
    source.startsWith("v1911.sneak_preview_stack_install") ||
    source.startsWith("p3_38.stack_or_trash_program_install")
  );
}

function isSneakPreviewSourceChoiceSource(source: string): boolean {
  return (
    source.startsWith("v1911.sneak_preview_source") ||
    source.startsWith("p3_38.stack_or_trash_program_install_source")
  );
}

function isMysteryBoxChoiceSource(source: string): boolean {
  return source.startsWith("v1915.mystery_box");
}

function isP338SearchInstallChoiceSource(source: string): boolean {
  return source.startsWith("p3_38.search_stack_install");
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
    source.startsWith("v1911.short_circuit_search") ||
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
