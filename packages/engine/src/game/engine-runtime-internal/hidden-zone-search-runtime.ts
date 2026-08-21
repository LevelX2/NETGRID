import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  CounterType,
  CorpServer,
  CorpZoneChoiceHandlerHost,
  GameState,
  HiddenZoneArrangeChoiceHandlerHost,
  HiddenZoneNonSearchChoiceHandlerHost,
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
  LegalAction,
  PendingChoiceResolutionHost,
  PlayerAction,
  RuntimeDeps,
  ServerId,
  Side,
} from "./runtime-shared";
import type { ChoiceHiddenZoneRuntimeLinks } from "./choice-hidden-zone-runtime-links";
import { completeRunnerProgramRigInstall } from "../install/runner-rig-install-finalization";
import { runnerProgramInstallMemoryReachable } from "../install/runner-program-install-memory";

export function createHiddenZoneSearchRuntime(
  deps: RuntimeDeps,
  links: ChoiceHiddenZoneRuntimeLinks,
): import("./hidden-zone-search-runtime-port").HiddenZoneSearchRuntimePort {
  const {
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
    addCounterToAllInstalledRunnerIcebreakers,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    chooseCorpAgendasForPointCost,
    continueRandomDiceLoop,
    corpAgendaPointTotal,
    corpZoneChoiceHandlerHost,
    creditTextForPrompt,
    diePromptText,
    discardChoice,
    exposeCorpCardInServer,
    exposeInstalledCorpCardForImplementation,
    exposeInstalledCorpCardLabel,
    exposeInstalledCorpCardTargets,
    exposeInstalledCorpCardsChoiceOptions,
    exposeOutermostIceOfEachDataFort,
    exposedCorpCardInServer,
    hiddenZoneArrangeChoiceHandlerHost,
    hiddenZoneNonSearchChoiceHandlerHost,
    multiExposeInstalledCorpCardOptionLabel,
    multiExposeInstalledCorpCardTargets,
    iceChoiceLabelForSide,
    installedCorpCardServerContext,
    installedRunnerConnectionIds,
    installedRunnerIcebreakerIds,
    outermostIceExposures,
    parseRandomDiceSplitChoiceSource,
    parseRandomDiceSplit,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    pendingChoiceResolutionHost,
    randomDiceSplitOptions,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    resolveDerezRezzedBlackIceChoice,
    resolveCardImplementationAccessPaymentChoice,
    resolvePayRezCostToTrashRezzedIceChoice,
    resolveRunnerIcebreakerCounterEvent,
    resolveDiscardChoice,
    resolveExposeInstalledCorpCardsChoice,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
    resolveMultiExposeInstalledCorpCardsChoice,
    resolveIncubatorTransformChoice,
    resolvePaidSourceReturnToGripChoice,
    resolveP358HiddenReplacementChoice,
    resolveRandomDiceLoopEvent,
    resolveRunnerProgramReturnChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveTrashUnrezzedIceChoice,
    resolveSetupMulliganChoice,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    resolveScoredAgendaCorpRdTopReveal,
    resolveRandomDiceSplitChoice,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    setupMulliganChoice,
    shuffleCorpCardIntoRd,
    startDerezRezzedBlackIceChoice,
    startPayRezCostToTrashRezzedIceChoice,
    startExposeInstalledCorpCardsChoice,
    startCorpChoiceRezOrTrashIceChoice,
    startMultiExposeInstalledCorpCardsChoice,
    startPaidSourceReturnToGripChoice,
    startTrashUnrezzedIceChoice,
    startRandomDiceSplitChoice,
    takeSetupMulligan,
    trashCorpInstalledCardsInScoredSourceServer,
  } = links;

  function hiddenZoneSearchHandlerHostBase(
    state: GameState,
    legalAction: LegalAction,
  ): HiddenZoneSearchActivationHandlerHost {
    return {
      state,
      legalAction,
      cards: {
        definitionFor: (cardId) => deps.definitionFor(state, cardId),
        isUniqueRunnerDefinitionInstalled: (definition) =>
          deps.isUniqueCard(definition) &&
          deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id),
        runnerProgramUsesMemory: (cardId) =>
          deps.runnerProgramUsesMemory(state, cardId),
      },
      zones: {
        removeFromAllZones: (cardId) => deps.removeFromAllZones(state, cardId),
        addToGrip: (cardId) => state.runner.grip.push(cardId),
        trashRunnerInstalledCardToHeap: (cardId) =>
          deps.trashRunnerInstalledCardToHeap(state, cardId),
      },
      shuffleRunnerStack: (purpose) => shuffleRunnerStack(state, purpose),
      spendRunnerCredits: (amount) =>
        deps.spendCredits(state, "runner", amount),
      installRunnerProgramFromStackWithoutClick: (cardId) =>
        installRunnerProgramFromStackWithoutClick(state, cardId, legalAction),
      startRunnerProgramFreeMemoryChoice: (cardId, sourceCardId) =>
        startRunnerProgramFreeMemoryChoice(state, cardId, sourceCardId),
      availableRunnerProgramInstallCredits: () =>
        deps.availableRunnerProgramInstallCredits(state),
      runnerMemoryLimit: () => deps.runnerMemoryLimit(state),
      install: {
        canInstallRunnerProgramFromZone: (cardId, sourceZone, installCost) =>
          canInstallRunnerProgramFromZone(
            state,
            cardId,
            sourceZone,
            installCost,
          ),
        installRunnerProgramFromZoneWithoutClick: (
          cardId,
          sourceZone,
          installCost,
        ) =>
          installRunnerProgramFromZoneWithoutClick(
            state,
            cardId,
            sourceZone,
            installCost,
            legalAction,
          ),
        installRunnerProgramForFree: (cardId, options) =>
          installRunnerProgramForFree(state, cardId, legalAction, options),
        searchStackInstallTargets: (filter, installCost) =>
          deps.searchStackInstallTargets(
            hiddenZoneSearchActivationTargetHost(state),
            filter,
            installCost,
          ),
        temporaryProgramInstallableProgramIds: (sourceZone) =>
          deps.temporaryProgramInstallableProgramIds(
            hiddenZoneSearchActivationTargetHost(state),
            sourceZone,
          ),
        lookTopStackShowToCorpThenInstallMatchingTargets: (
          count,
          allowedTypes,
          installCost,
        ) =>
          deps.lookTopStackShowToCorpThenInstallMatchingTargets(
            hiddenZoneSearchActivationTargetHost(state),
            count,
            allowedTypes,
            installCost,
          ),
      },
    };
  }

  function hiddenZoneSearchActivationTargetHost(state: GameState) {
    return {
      state,
      cards: {
        definitionFor: (cardId: CardInstanceId) =>
          deps.definitionFor(state, cardId),
        isUniqueRunnerDefinitionInstalled: (definition: CardDefinition) =>
          deps.isUniqueCard(definition) &&
          deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id),
      },
      install: {
        canInstallRunnerProgramFromZone: (
          cardId: CardInstanceId,
          sourceZone: "heap" | "stack",
          installCost: "normal" | "free",
        ) =>
          canInstallRunnerProgramFromZone(
            state,
            cardId,
            sourceZone,
            installCost,
          ),
      },
      runnerMemoryLimit: () => deps.runnerMemoryLimit(state),
      shuffleRunnerStack: (purpose: string) =>
        shuffleRunnerStack(state, purpose),
    };
  }

  function hiddenZoneSearchChoiceHandlerHost(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): HiddenZoneSearchChoiceHandlerHost {
    if (!state.pendingChoice) throw new Error("Diese Choice ist nicht offen.");
    return {
      ...hiddenZoneSearchHandlerHostBase(state, legalAction),
      choice: state.pendingChoice,
      playerAction,
    };
  }

  function hiddenZoneSearchActivationHandlerHost(
    state: GameState,
    legalAction: LegalAction,
  ): HiddenZoneSearchActivationHandlerHost {
    return hiddenZoneSearchHandlerHostBase(state, legalAction);
  }

  function completeHiddenZoneRunnerProgramInstall(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ): void {
    completeRunnerProgramRigInstall({
      state,
      cardId,
      definition,
      usesMemory: true,
      mustInstance: (targetCardId) =>
        deps.mustInstance(state.cardInstances, targetCardId),
      setCardCounter: (targetCardId, counterType, amount) =>
        deps.setCardCounter(state, targetCardId, counterType, amount),
      addCardCounter: (targetCardId, counterType, amount) =>
        deps.addCardCounter(state, targetCardId, counterType, amount),
      shouldLoadLegacyRecurringCredits: deps.shouldLoadLegacyRecurringCredits,
    });
  }

  function installRunnerProgramFromStackWithoutClick(
    state: GameState,
    cardId: CardInstanceId,
    legalAction: LegalAction,
  ): boolean {
    if (!state.runner.stack.includes(cardId)) return false;
    const definition = deps.definitionFor(state, cardId);
    if (definition.type !== "program") return false;
    if (
      deps.isUniqueCard(definition) &&
      deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      return false;
    if (
      deps.availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
      return false;
    if (
      state.runner.memoryUsed + (definition.memoryCost ?? 0) >
      deps.runnerMemoryLimit(state)
    )
      return false;

    deps.spendRunnerInstallCredits(
      state,
      definition.installCost ?? 0,
      "program",
    );
    deps.removeFromAllZones(state, cardId);
    completeHiddenZoneRunnerProgramInstall(state, cardId, definition);
    deps.executeCardImplementationLifecycleEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_install",
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      installedProgramDefinitionId: definition.id,
      installCostPaid: definition.installCost ?? 0,
      runnerCreditsAfter: state.runner.credits,
    };
    return true;
  }

  function canInstallRunnerProgramFromZone(
    state: GameState,
    cardId: CardInstanceId,
    zone: "heap" | "stack",
    installCost: "normal" | "free",
  ): boolean {
    const zoneIds = zone === "heap" ? state.runner.heap : state.runner.stack;
    if (!zoneIds.includes(cardId)) return false;
    const definition = deps.definitionFor(state, cardId);
    if (definition.type !== "program") return false;
    if (
      deps.isUniqueCard(definition) &&
      deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      return false;
    if (
      installCost === "normal" &&
      deps.availableRunnerProgramInstallCredits(state) <
        (definition.installCost ?? 0)
    )
      return false;
    return runnerProgramInstallMemoryReachable({
      memoryUsed: state.runner.memoryUsed,
      targetMemoryCost: definition.memoryCost ?? 0,
      memoryLimit: deps.runnerMemoryLimit(state),
      trashableMemoryCosts: state.runner.rig.programs.map((installedCardId) =>
        deps.runnerProgramUsesMemory(state, installedCardId)
          ? (deps.definitionFor(state, installedCardId).memoryCost ?? 0)
          : 0,
      ),
    });
  }

  function installRunnerProgramFromZoneWithoutClick(
    state: GameState,
    cardId: CardInstanceId,
    zone: "heap" | "stack",
    installCost: "normal" | "free",
    legalAction: LegalAction,
  ): boolean {
    if (!canInstallRunnerProgramFromZone(state, cardId, zone, installCost))
      return false;
    const definition = deps.definitionFor(state, cardId);
    if (installCost === "normal")
      deps.spendRunnerInstallCredits(
        state,
        definition.installCost ?? 0,
        "program",
      );
    deps.removeFromAllZones(state, cardId);
    completeHiddenZoneRunnerProgramInstall(state, cardId, definition);
    deps.executeCardImplementationLifecycleEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_install",
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      installedProgramDefinitionId: definition.id,
      installedCardDefinitionId: definition.id,
      installedFromZone: zone === "heap" ? "runner_heap" : "runner_stack",
      installCostPaid:
        installCost === "normal" ? (definition.installCost ?? 0) : 0,
      runnerCreditsAfter: state.runner.credits,
    };
    return true;
  }

  function startRunnerProgramFreeMemoryChoice(
    state: GameState,
    selectedProgramId: CardInstanceId,
    sourceCardId: CardInstanceId,
  ): boolean {
    const options = state.runner.rig.programs
      .filter((cardId) => deps.runnerProgramUsesMemory(state, cardId))
      .sort()
      .map((cardId) => {
        const definition = deps.definitionFor(state, cardId);
        return { id: `card_${cardId}`, label: definition.title, value: cardId };
      });
    if (options.length === 0) return false;
    state.pendingChoice = {
      choiceId: `runner_program_free_memory_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner.program_free_memory:${selectedProgramId}:${sourceCardId}:${state.stateVersion + 1}`,
      prompt: "MU freimachen",
      kind: "select_cards",
      options,
      minSelections: 1,
      maxSelections: options.length,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    return true;
  }

  function installRunnerProgramForFree(
    state: GameState,
    cardId: CardInstanceId,
    legalAction: LegalAction,
    options: {
      checkUnique?: boolean;
      typeError?: string;
      memoryError?: string;
    } = {},
  ): CardInstanceId {
    const definition = deps.definitionFor(state, cardId);
    if (definition.type !== "program")
      throw new Error(
        options.typeError ??
          "Die temporaere Programminstallation darf nur Programme installieren.",
      );
    if (
      (options.checkUnique ?? true) &&
      deps.isUniqueCard(definition) &&
      deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      state.runner.memoryUsed + (definition.memoryCost ?? 0) >
      deps.runnerMemoryLimit(state)
    )
      throw new Error(
        options.memoryError ??
          "Nicht genug Memory fuer die temporaere Programminstallation.",
      );
    deps.removeFromAllZones(state, cardId);
    completeHiddenZoneRunnerProgramInstall(state, cardId, definition);
    deps.executeCardImplementationLifecycleEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_install",
    );
    return cardId;
  }

  function shuffleRunnerStack(state: GameState, purpose: string): void {
    const result = deps.shuffleRunnerStackAndRefreshZones({
      stack: state.runner.stack,
      cardInstances: state.cardInstances,
      shuffle: (stack) => deps.shuffleStateIds(state, stack, purpose),
    });
    state.runner.stack = result.shuffledStack;
  }

  function revealRunnerStackTop(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const cardId = state.runner.stack[0];
    if (!cardId) throw new Error("Der Stack ist leer.");
    const definition = deps.definitionFor(state, cardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      publicRevealKind: "reveal",
      publicRevealDefinitionId: definition.id,
    };
  }

  function revealCorpRdTop(state: GameState, legalAction: LegalAction): void {
    const cardId = state.corp.rd[0];
    if (!cardId) throw new Error("R&D ist leer.");
    const definition = deps.definitionFor(state, cardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_corp_reveal_rd_top",
      publicRevealKind: "reveal",
      publicRevealDefinitionId: definition.id,
    };
  }

  function resolveV1911RunnerHiddenZoneAbility(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    void state;
    void legalAction;
    throw new Error(
      "Die ausgemusterte V1.9.11-Hidden-Zone-Route hat keine CardSpec-Continuation.",
    );
  }

  return {
    canInstallRunnerProgramFromZone,
    hiddenZoneSearchActivationHandlerHost,
    hiddenZoneSearchActivationTargetHost,
    hiddenZoneSearchChoiceHandlerHost,
    hiddenZoneSearchHandlerHostBase,
    installRunnerProgramForFree,
    installRunnerProgramFromStackWithoutClick,
    installRunnerProgramFromZoneWithoutClick,
    resolveV1911RunnerHiddenZoneAbility,
    revealCorpRdTop,
    revealRunnerStackTop,
    shuffleRunnerStack,
    startRunnerProgramFreeMemoryChoice,
  };
}
