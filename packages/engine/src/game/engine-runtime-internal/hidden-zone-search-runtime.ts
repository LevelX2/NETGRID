// @ts-nocheck
import { runtimeProxy } from "./runtime-shared";
import type { RuntimeDeps } from "./runtime-shared";

export function createHiddenZoneSearchRuntime(
  deps: RuntimeDeps,
  runtime: Record<string, unknown>,
) {
  const {
    AUJOURD_OUI_RESOURCE_CARD_ID,
    BUTCHER_BOY_ID,
    COCKROACH_ID,
    CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID,
    CORP_HQ_AGENDA_REVEAL_CARD_ID,
    CORP_RD_TOP5_REORDER_OPERATION_CARD_ID,
    DEAL_WITH_MILITECH_ID,
    DEMO_CARDS_BY_ID,
    INITIAL_HAND_SIZE,
    MYSTERY_BOX_ID,
    RONIN_AROUND_ID,
    RUN_ACCESS_PRESSURE_EVENT_SOURCE,
    SELF_MODIFYING_CODE_ID,
    SERVER_EXPOSE_PROGRAM_CARD_IDS,
    SHORT_CIRCUIT_RESOURCE_CARD_ID,
    SKIVVISS_ID,
    SNEAK_PREVIEW_ID,
    STACK_SEARCH_PROGRAM_CARD_IDS,
    STACK_TOP_REORDER_RESOURCE_CARD_ID,
    TOO_MANY_DOORS_ID,
    accessEffectHandlerHost,
    addCardCounter,
    affordableRezzedInstalledIceIdsForRunner,
    agendaPointsForScoredCard,
    appendResolvedEffectsToPayload,
    applyRunnerStartOfTurnEffects,
    availableRunnerProgramInstallCredits,
    cardCounter,
    cardHasSubtype,
    cardImplementationForDefinitionId,
    cardImplementationRuntimeDeps,
    cockroachCounterTotal,
    cockroachRandomHqDiscardActive,
    completeDiscardPhase,
    corpInstallRezSequenceHandlerHost,
    corpInstalledCardIds,
    corpScoredAgendaForfeitTargets,
    creditCostForAction,
    definitionFor,
    discardRandomCorpHqCards,
    drawCorpCards,
    encounterResolutionHostForState,
    encounterSpecialWindowHostForState,
    ensureRunnerTurnFlags,
    executeCardImplementationEffects,
    executeCardImplementationLifecycleEffects,
    fortPassWindowHostForState,
    fortRunSideFamiliesHostForState,
    handForSide,
    handleCorpInstallRezSequenceChoice,
    handleCorpZoneChoice,
    handleHiddenZoneArrangeChoice,
    handleHiddenZoneNonSearchChoice,
    handleHiddenZoneSearchChoice,
    handleScoredAgendaFlowChoice,
    hasCorpUtilityKind,
    hasInstalledUniqueCardDefinition,
    hasSuccessfulHqRunThisTurn,
    isP358HiddenReplacementCompatibilityChoiceSource,
    isUniqueCard,
    lookTopStackShowToCorpThenInstallMatchingTargets,
    maxHandSize,
    mustServer,
    outermostIceIndex,
    poxCountersForServer,
    publicServerLabel,
    publicServerLabelForCard,
    recordStateRandomMarkers,
    removeFromAllZones,
    resolveAardvarkInterceptionChoice,
    resolveAccessChimeraDaemonTrashChoice,
    resolveAccessInstalledRunnerProgramReturnChoice,
    resolveAccessPaymentChoice,
    resolveCardImplementationAdvancementDistributionChoice,
    resolveCardImplementationMoveAdvancementChoice,
    resolveVirusCounterPurgePreserveChoice,
    resolveCrashEverettDrawChoice,
    resolveEventModificationChoice,
    resolveHammerStealthLossChoice,
    resolveCorpInstalledEconomyCreditChoice,
    resolvePreAccessTopRdReorderChoice,
    resolvePassRezzedIceProgramTrashChoiceInRunModule,
    resolveBrokenIceVirusCounterChoice,
    resolvePostMeatDamageHiddenResourceChoice,
    resolveHardwareTrashByCounterChoice,
    resolveSuccessfulRunCreditLossSpendChoice,
    resolveReplacementChoice,
    resolveRunnerPrivateLookChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
    resolveHqIceSwapChoice,
    resolveRezInterruptJackOutChoice,
    resolveSuccessfulRunInterventionChoiceInRunModule,
    resolveAdvancementPlacementChoice,
    resolveSecretSpendCompareChoiceInRunModule,
    resolveTraceChoice,
    resolveActiveIceProgramTrashChoiceInRunModule,
    rezCostForCard,
    rezzedBlackIceIds,
    rezzedCorpRootCardIds,
    rezzedInstalledIceIds,
    rollDeterministicDie,
    runAccessTransitionHost,
    runEndCleanupHost,
    runRezWindowHostForState,
    runnerEventLongtailForDefinition,
    runnerEventLongtailKindForDefinition,
    runnerInstalledCardIds,
    runnerMemoryLimit,
    runnerProgramUsesMemory,
    runnerStoleAgendaSubtypeThisTurn,
    scoredAgendaFlowHost,
    scoredAgendaImplementationForDefinition,
    scoredAgendaKindForDefinition,
    searchStackInstallTargets,
    selectedChoiceIds,
    setCardCounter,
    setHostedOn,
    shouldLoadLegacyRecurringCredits,
    shuffleRunnerStackAndRefreshZones,
    shuffleStateIds,
    temporaryProgramInstallableProgramIds,
    spendCardCounter,
    spendCredits,
    spendRunnerInstallCredits,
    startAujourdOuiTop5Activation,
    startIncubatorTransformChoice,
    startRun,
    startRunnerStackArrangeChoice,
    startRunnerStackSearchChoiceActivation,
    successfulRunInterventionHost,
    traceOrchestrationHost,
    trashCorpInstalledCardToArchives,
    trashRunnerInstalledCardToHeap,
    uniqueDirectLongtailImplementationForDefinition,
    unrezzedInstalledIceIds,
    mustInstance,
    credits,
    withoutVariableIceState,
  } = deps;

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
    resolveChimeraDaemonTrashChoice,
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
    resolveRunnerHostingChoice,
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
    startRunnerHostingChoice,
    startTrashUnrezzedIceChoice,
    startRandomDiceSplitChoice,
    takeSetupMulligan,
    trashCorpInstalledCardsInScoredSourceServer,
  } = runtimeProxy<Record<string, unknown>>(runtime);

  function hiddenZoneSearchHandlerHostBase(
    state: GameState,
    legalAction: LegalAction,
  ): HiddenZoneSearchActivationHandlerHost {
    return {
      state,
      legalAction,
      constants: {
        topStackTakeMatchingSourceId: AUJOURD_OUI_RESOURCE_CARD_ID,
        randomStackProgramInstallSourceId: MYSTERY_BOX_ID,
        stackProgramFreeInstallSourceId: SELF_MODIFYING_CODE_ID,
        stackSearchGripSourceId: SHORT_CIRCUIT_RESOURCE_CARD_ID,
        temporaryProgramInstallSourceId: SNEAK_PREVIEW_ID,
      },
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        isUniqueRunnerDefinitionInstalled: (definition) =>
          isUniqueCard(definition) &&
          hasInstalledUniqueCardDefinition(state, "runner", definition.id),
        runnerProgramUsesMemory: (cardId) =>
          runnerProgramUsesMemory(state, cardId),
      },
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        addToGrip: (cardId) => state.runner.grip.push(cardId),
        trashRunnerInstalledCardToHeap: (cardId) =>
          trashRunnerInstalledCardToHeap(state, cardId),
      },
      shuffleRunnerStack: (purpose) => shuffleRunnerStack(state, purpose),
      spendRunnerCredits: (amount) => spendCredits(state, "runner", amount),
      installRunnerProgramFromStackWithoutClick: (cardId) =>
        installRunnerProgramFromStackWithoutClick(state, cardId, legalAction),
      startRunnerProgramFreeMemoryChoice: (cardId) =>
        startRunnerProgramFreeMemoryChoice(state, cardId),
      availableRunnerProgramInstallCredits: () =>
        availableRunnerProgramInstallCredits(state),
      runnerMemoryLimit: () => runnerMemoryLimit(state),
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
          searchStackInstallTargets(
            hiddenZoneSearchActivationTargetHost(state),
            filter,
            installCost,
          ),
        temporaryProgramInstallableProgramIds: (sourceZone) =>
          temporaryProgramInstallableProgramIds(
            hiddenZoneSearchActivationTargetHost(state),
            sourceZone,
          ),
        lookTopStackShowToCorpThenInstallMatchingTargets: (
          count,
          allowedTypes,
          installCost,
        ) =>
          lookTopStackShowToCorpThenInstallMatchingTargets(
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
      constants: {
        topStackTakeMatchingSourceId: AUJOURD_OUI_RESOURCE_CARD_ID,
        randomStackProgramInstallSourceId: MYSTERY_BOX_ID,
        stackProgramFreeInstallSourceId: SELF_MODIFYING_CODE_ID,
        stackSearchGripSourceId: SHORT_CIRCUIT_RESOURCE_CARD_ID,
        temporaryProgramInstallSourceId: SNEAK_PREVIEW_ID,
      },
      cards: {
        definitionFor: (cardId: CardInstanceId) => definitionFor(state, cardId),
        isUniqueRunnerDefinitionInstalled: (definition: CardDefinition) =>
          isUniqueCard(definition) &&
          hasInstalledUniqueCardDefinition(state, "runner", definition.id),
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
      runnerMemoryLimit: () => runnerMemoryLimit(state),
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

  function installRunnerProgramFromStackWithoutClick(
    state: GameState,
    cardId: CardInstanceId,
    legalAction: LegalAction,
  ): boolean {
    if (!state.runner.stack.includes(cardId)) return false;
    const definition = definitionFor(state, cardId);
    if (definition.type !== "program") return false;
    if (
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      return false;
    if (
      availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
      return false;
    if (
      state.runner.memoryUsed + (definition.memoryCost ?? 0) >
      runnerMemoryLimit(state)
    )
      return false;

    spendRunnerInstallCredits(state, definition.installCost ?? 0, "program");
    removeFromAllZones(state, cardId);
    state.runner.rig.programs.push(cardId);
    state.runner.memoryUsed += definition.memoryCost ?? 0;
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
    };
    if (shouldLoadLegacyRecurringCredits(definition))
      setCardCounter(
        state,
        cardId,
        "recurring_credit",
        definition.recurringCredits ?? 0,
      );
    if (
      definition.mechanics.includes("virus") &&
      definition.id !== BUTCHER_BOY_ID &&
      definition.id !== SKIVVISS_ID
    )
      addCardCounter(state, cardId, "virus", 1);
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
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
    const definition = definitionFor(state, cardId);
    if (definition.type !== "program") return false;
    if (
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      return false;
    if (
      installCost === "normal" &&
      availableRunnerProgramInstallCredits(state) <
        (definition.installCost ?? 0)
    )
      return false;
    return (
      state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
      runnerMemoryLimit(state)
    );
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
    const definition = definitionFor(state, cardId);
    if (installCost === "normal")
      spendRunnerInstallCredits(state, definition.installCost ?? 0, "program");
    removeFromAllZones(state, cardId);
    state.runner.rig.programs.push(cardId);
    state.runner.memoryUsed += definition.memoryCost ?? 0;
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
    };
    if (shouldLoadLegacyRecurringCredits(definition))
      setCardCounter(
        state,
        cardId,
        "recurring_credit",
        definition.recurringCredits ?? 0,
      );
    if (
      definition.mechanics.includes("virus") &&
      definition.id !== BUTCHER_BOY_ID &&
      definition.id !== SKIVVISS_ID
    )
      addCardCounter(state, cardId, "virus", 1);
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
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
  ): boolean {
    const options = state.runner.rig.programs
      .filter((cardId) => runnerProgramUsesMemory(state, cardId))
      .sort()
      .map((cardId) => {
        const definition = definitionFor(state, cardId);
        return { id: `card_${cardId}`, label: definition.title, value: cardId };
      });
    if (options.length === 0) return false;
    state.pendingChoice = {
      choiceId: `runner_program_free_memory_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner.program_free_memory:${selectedProgramId}:${state.stateVersion + 1}`,
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
    const definition = definitionFor(state, cardId);
    if (definition.type !== "program")
      throw new Error(
        options.typeError ?? "Die temporaere Programminstallation darf nur Programme installieren.",
      );
    if (
      (options.checkUnique ?? true) &&
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      state.runner.memoryUsed + (definition.memoryCost ?? 0) >
      runnerMemoryLimit(state)
    )
      throw new Error(
        options.memoryError ?? "Nicht genug Memory fuer die temporaere Programminstallation.",
      );
    removeFromAllZones(state, cardId);
    state.runner.rig.programs.push(cardId);
    state.runner.memoryUsed += definition.memoryCost ?? 0;
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
    };
    if (shouldLoadLegacyRecurringCredits(definition))
      setCardCounter(
        state,
        cardId,
        "recurring_credit",
        definition.recurringCredits ?? 0,
      );
    if (
      definition.mechanics.includes("virus") &&
      definition.id !== BUTCHER_BOY_ID &&
      definition.id !== SKIVVISS_ID
    )
      addCardCounter(state, cardId, "virus", 1);
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_install",
    );
    return cardId;
  }

  function shuffleRunnerStack(state: GameState, purpose: string): void {
    const result = shuffleRunnerStackAndRefreshZones({
      stack: state.runner.stack,
      cardInstances: state.cardInstances,
      shuffle: (stack) => shuffleStateIds(state, stack, purpose),
    });
    state.runner.stack = result.shuffledStack;
  }

  function revealRunnerStackTop(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const cardId = state.runner.stack[0];
    if (!cardId) throw new Error("Der Stack ist leer.");
    const definition = definitionFor(state, cardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      publicRevealKind: "reveal",
      publicRevealDefinitionId: definition.id,
    };
  }

  function revealCorpRdTop(state: GameState, legalAction: LegalAction): void {
    const cardId = state.corp.rd[0];
    if (!cardId) throw new Error("R&D ist leer.");
    const definition = definitionFor(state, cardId);
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
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf V1.9.11-Hidden-Zone-Helfer nutzen.");
    const sourceCardId = String(legalAction.payload?.cardId ?? "");
    const installed = runnerInstalledCardIds(state);
    if (!installed.includes(sourceCardId))
      throw new Error("Der V1.9.11-Hidden-Zone-Helfer ist nicht installiert.");
    const sourceDefinition = definitionFor(state, sourceCardId);
    const ability = String(legalAction.payload?.v1911HiddenZoneAbility ?? "");
    if (ability === "search_stack_program_to_grip") {
      if (!STACK_SEARCH_PROGRAM_CARD_IDS.has(sourceDefinition.id))
        throw new Error("Diese Karte darf keine Stack-Search-Ability nutzen.");
      if (cardImplementationForDefinitionId(sourceDefinition.id))
        throw new Error(
          "Diese Stack-Search-Ability wird deklarativ abgewickelt.",
        );
      spendCredits(state, "runner", creditCostForAction(legalAction));
      if (sourceDefinition.id === AUJOURD_OUI_RESOURCE_CARD_ID) {
        startAujourdOuiTop5Activation(
          hiddenZoneSearchActivationHandlerHost(state, legalAction),
          sourceCardId,
        );
      } else {
        startRunnerStackSearchChoiceActivation(
          hiddenZoneSearchActivationHandlerHost(state, legalAction),
          {
            sourcePrefix:
              sourceDefinition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID
                ? `runner.stack_search_to_grip:${sourceCardId}`
                : "v1911.search_stack",
            choiceIdPrefix:
              sourceDefinition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID
                ? "runner_stack_search_to_grip"
                : "v1911_search_stack",
          },
        );
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        sourceDefinitionId: sourceDefinition.id,
        hiddenZoneAction:
          sourceDefinition.id === AUJOURD_OUI_RESOURCE_CARD_ID
            ? "v1911_aujourdoui_top5"
            : sourceDefinition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID
              ? "runner_stack_search_to_grip"
              : "v1911_search_stack",
      };
      return;
    }
    if (ability === "expose_server_card") {
      if (!SERVER_EXPOSE_PROGRAM_CARD_IDS.has(sourceDefinition.id))
        throw new Error("Diese Karte darf keine Expose-Ability nutzen.");
      if (cardImplementationForDefinitionId(sourceDefinition.id))
        throw new Error("Diese Expose-Ability wird deklarativ abgewickelt.");
      exposeCorpCardInServer(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
        legalAction,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        sourceDefinitionId: sourceDefinition.id,
        exposedServerId: String(legalAction.payload?.serverId ?? ""),
        hiddenZoneAction: "v1911_expose_server_card",
      };
      return;
    }
    if (ability === "reveal_stack_top") {
      throw new Error("Diese Karte darf keine Stack-Reveal-Ability nutzen.");
      revealRunnerStackTop(state, legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        sourceDefinitionId: sourceDefinition.id,
        hiddenZoneAction: "v1911_reveal_stack_top",
      };
      return;
    }
    if (ability === "arrange_stack_top2") {
      if (sourceDefinition.id !== STACK_TOP_REORDER_RESOURCE_CARD_ID)
        throw new Error("Diese Karte darf keine Stack-Reorder-Ability nutzen.");
      startRunnerStackArrangeChoice(
        hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
        {
          sourcePrefix: `v1911.arrange_stack_top2:${sourceCardId}`,
          choiceIdPrefix: "v1911_arrange_stack_top2",
        },
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        sourceDefinitionId: sourceDefinition.id,
        hiddenZoneAction: "v1911_arrange_stack",
      };
      return;
    }
    throw new Error("Unbekannte V1.9.11-Hidden-Zone-Ability.");
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
