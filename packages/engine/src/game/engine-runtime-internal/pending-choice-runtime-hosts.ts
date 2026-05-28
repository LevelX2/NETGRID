// @ts-nocheck
import { runtimeBinding } from "./runtime-shared";
import type { RuntimeDeps } from "./runtime-shared";

export function createPendingChoiceRuntimeHosts(
  deps: RuntimeDeps,
  runtime: Record<string, any>,
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
    HIDDEN_ZONE_REORDER_ASSET_CARD_IDS,
    INITIAL_HAND_SIZE,
    MYSTERY_BOX_ID,
    RONIN_AROUND_ID,
    RUN_ACCESS_PRESSURE_EVENT_CARD_ID,
    SELF_MODIFYING_CODE_ID,
    SERVER_EXPOSE_PROGRAM_CARD_IDS,
    SHORT_CIRCUIT_RESOURCE_CARD_ID,
    SKIVVISS_ID,
    SNEAK_PREVIEW_ID,
    STACK_SEARCH_PROGRAM_CARD_IDS,
    STACK_TOP_REORDER_RESOURCE_CARD_ID,
    STACK_TOP_REVEAL_PROGRAM_CARD_IDS,
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
    resolveCodeViralCachePurgeChoice,
    resolveCrashEverettDrawChoice,
    resolveEventModificationChoice,
    resolveHammerStealthLossChoice,
    resolveInvestmentFirmCreditChoice,
    resolveMicrotechAiInterfacePreAccessChoice,
    resolvePassRezzedIceProgramTrashChoiceInRunModule,
    resolvePattelsVirusCounterChoice,
    resolvePostMeatDamageHiddenResourceChoice,
    resolvePowerGridOverloadChoice,
    resolvePriorityWreckSpendChoice,
    resolveReplacementChoice,
    resolveRunnerPrivateLookChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
    resolveSingaporeCityGridSwapChoice,
    resolveSpeedTrapRezInterruptChoice,
    resolveSuccessfulRunInterventionChoiceInRunModule,
    resolveSystematicLayoffsAdvancementChoice,
    resolveTooManyDoorsSecretSpendChoiceInRunModule,
    resolveTraceChoice,
    resolveViral15ProgramTrashChoiceInRunModule,
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
    sneakPreviewInstallableProgramIds,
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
    canInstallRunnerProgramFromZone,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    chooseCorpAgendasForPointCost,
    continueV1921PlayfulAiLoop,
    corpAgendaPointTotal,
    corpZoneChoiceHandlerHost,
    creditTextForPrompt,
    diePromptText,
    exposeCorpCardInServer,
    exposeInstalledCorpCardForImplementation,
    exposeInstalledCorpCardLabel,
    exposeInstalledCorpCardTargets,
    exposeInstalledCorpCardsChoiceOptions,
    exposeOutermostIceOfEachDataFort,
    exposedCorpCardInServer,
    hiddenZoneArrangeChoiceHandlerHost,
    hiddenZoneNonSearchChoiceHandlerHost,
    hiddenZoneSearchActivationHandlerHost,
    hiddenZoneSearchActivationTargetHost,
    hiddenZoneSearchChoiceHandlerHost,
    hiddenZoneSearchHandlerHostBase,
    huntClubBbsExposeOptionLabel,
    huntClubBbsExposeTargets,
    iceChoiceLabelForSide,
    installRunnerProgramForFree,
    installRunnerProgramFromStackWithoutClick,
    installRunnerProgramFromZoneWithoutClick,
    installedCorpCardServerContext,
    installedRunnerConnectionIds,
    installedRunnerIcebreakerIds,
    outermostIceExposures,
    parsePlayfulAiChoiceSource,
    parsePlayfulAiSplit,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    playfulAiSplitOptions,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    resolveAnonymousTipDerezBlackIceChoice,
    resolveCardImplementationAccessPaymentChoice,
    resolveChimeraDaemonTrashChoice,
    resolveCoreCommandJettisonIceChoice,
    resolveDealWithMilitech,
    resolveExposeInstalledCorpCardsChoice,
    resolveForgedActivationOrdersCorpChoice,
    resolveForgedActivationOrdersTargetChoice,
    resolveHuntClubBbsExposeChoice,
    resolveIncubatorTransformChoice,
    resolveOpenEndedMileageProgramReturnChoice,
    resolveP358HiddenReplacementChoice,
    resolvePlayfulAiDiceLoopEvent,
    resolveProteusRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveSecurityCodeWormChipTrashIceChoice,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    resolveV1911CorporateDownsizing,
    resolveV1911RunnerHiddenZoneAbility,
    resolveV1921PlayfulAiChoice,
    revealCorpRdTop,
    revealRunnerStackTop,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    shuffleCorpCardIntoRd,
    shuffleRunnerStack,
    startAnonymousTipDerezBlackIceChoice,
    startCoreCommandJettisonIceChoice,
    startExposeInstalledCorpCardsChoice,
    startForgedActivationOrdersTargetChoice,
    startHuntClubBbsExposeChoice,
    startOpenEndedMileageProgramReturnChoice,
    startRunnerHostingChoice,
    startSecurityCodeWormChipTrashIceChoice,
    startSelfModifyingCodeFreeMuChoice,
    startV1921PlayfulAiChoice,
    trashCorpInstalledCardsInScoredSourceServer,
  } = new Proxy(
    {},
    { get: (_target, property) => runtimeBinding(runtime, property) },
  ) as any;

  function pendingChoiceResolutionHost(
    state: GameState,
  ): PendingChoiceResolutionHost {
    return {
      state,
      setup: {
        resolveSetupMulliganChoice,
        resolveDiscardChoice,
      },
      replacement: {
        resolveReplacementChoice,
        resolveEventModificationChoice,
      },
      trace: {
        resolveTraceChoice: (_state, actionToResolve, playerActionToResolve) =>
          resolveTraceChoice(
            traceOrchestrationHost(state),
            actionToResolve,
            playerActionToResolve,
          ),
      },
      hiddenZone: {
        handleHiddenZoneArrangeChoice,
        hiddenZoneArrangeChoiceHandlerHost,
        handleHiddenZoneNonSearchChoice,
        hiddenZoneNonSearchChoiceHandlerHost,
        handleCorpZoneChoice,
        corpZoneChoiceHandlerHost,
        isP358HiddenReplacementCompatibilityChoiceSource,
        resolveP358HiddenReplacementChoice,
        handleHiddenZoneSearchChoice,
        hiddenZoneSearchChoiceHandlerHost,
        resolveHuntClubBbsExposeChoice,
        resolveExposeInstalledCorpCardsChoice,
        resolveInvestmentFirmCreditChoice,
        resolveCrashEverettDrawChoice,
        resolvePowerGridOverloadChoice,
        resolveSystematicLayoffsAdvancementChoice,
        resolveAnonymousTipDerezBlackIceChoice,
        resolveCoreCommandJettisonIceChoice,
        resolveForgedActivationOrdersTargetChoice,
        resolveForgedActivationOrdersCorpChoice,
        resolveSecurityCodeWormChipTrashIceChoice,
        resolveV1921PlayfulAiChoice,
        resolveRunnerInstalledConnectionTrashBadPublicityChoice,
        resolveOpenEndedMileageProgramReturnChoice,
        resolveRunnerHostingChoice,
        resolveIncubatorTransformChoice,
        resolveCodeViralCachePurgeChoice,
        resolveChimeraDaemonTrashChoice,
        resolveProteusRunnerProgramReturnChoice,
        resolveRunnerPrivateLookChoice,
      },
      corp: {
        handleCorpInstallRezSequenceChoice,
        corpInstallRezSequenceHandlerHost,
        handleScoredAgendaFlowChoice,
        scoredAgendaFlowHost,
      },
      runner: {
        resolveRunnerProgramTrashBeforeInstallChoice,
      },
      run: {
        resolveSingaporeCityGridSwapChoice,
        fortPassWindowHostForState,
        resolveTooManyDoorsSecretSpendChoiceInRunModule,
        encounterSpecialWindowHostForState,
        resolveHammerStealthLossChoice,
        fortRunSideFamiliesHostForState,
        resolveViral15ProgramTrashChoiceInRunModule,
        encounterResolutionHostForState,
        resolvePassRezzedIceProgramTrashChoiceInRunModule,
        resolveSpeedTrapRezInterruptChoice,
        runRezWindowHostForState,
        resolvePattelsVirusCounterChoice,
        runEndCleanupHost,
        resolveAardvarkInterceptionChoice,
        resolveSuccessfulRunInterventionChoiceInRunModule,
        successfulRunInterventionHost,
        resolvePostMeatDamageHiddenResourceChoice,
      },
      access: {
        resolvePriorityWreckSpendChoice,
        runAccessTransitionHost,
        resolveMicrotechAiInterfacePreAccessChoice,
      },
      cardImplementation: {
        resolveCardImplementationAccessPaymentChoice,
        resolveCardImplementationAdvancementDistributionChoice,
        resolveCardImplementationMoveAdvancementChoice,
      },
      constants: {
        RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
      },
    };
  }

  function setupMulliganChoice(
    state: GameState,
    side: Side,
    stateVersion = state.stateVersion,
  ): ChoiceRequest {
    return {
      choiceId: `setup_mulligan_${side}_${stateVersion}`,
      side,
      source: "setup.mulligan",
      prompt: side === "runner" ? "Runner-Starthand" : "Korp-Starthand",
      kind: "select_option",
      options: [
        {
          id: "keep",
          label: "Starthand behalten",
          publicLabel: "Setup-Entscheidung",
        },
        {
          id: "mulligan",
          label: "Mulligan nehmen",
          publicLabel: "Setup-Entscheidung",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion,
      visibility: "hidden_info_barrier",
    };
  }

  function discardChoice(
    state: GameState,
    side: Side,
    requiredDiscardCount: number,
    stateVersion = state.stateVersion,
  ): ChoiceRequest {
    const hand = handForSide(state, side);
    return {
      choiceId: `discard_${side}_${stateVersion}`,
      side,
      source: "discard_phase",
      prompt: side === "corp" ? "Korp-Discard wählen" : "Runner-Discard wählen",
      kind: "select_cards",
      options: hand.map((cardId) => ({
        id: `card_${cardId}`,
        label: definitionFor(state, cardId).title,
        publicLabel: "Handkarte",
        value: cardId,
      })),
      minSelections: requiredDiscardCount,
      maxSelections: requiredDiscardCount,
      stateVersion,
      visibility: "hidden_info_barrier",
    };
  }

  function resolveDiscardChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || choice.source !== "discard_phase")
      throw new Error("Es ist keine Discard-Choice offen.");
    const side = choice.side;
    if (
      state.timingPoint !==
      (side === "corp"
        ? "corp_discard.select_cards"
        : "runner_discard.select_cards")
    ) {
      throw new Error("Discard ist im aktuellen Timingpoint nicht legal.");
    }
    const expectedCount =
      handForSide(state, side).length - maxHandSize(state, side);
    if (expectedCount !== choice.minSelections)
      throw new Error("Die Discard-Anzahl ist nicht mehr gueltig.");
    const cockroachRandomized =
      side === "corp" && cockroachRandomHqDiscardActive(state);
    let selectedCards: CardInstanceId[] = [];
    if (cockroachRandomized) {
      selectedCards = discardRandomCorpHqCards(
        state,
        expectedCount,
        `v191.random.${COCKROACH_ID}.hq_discard_phase`,
      );
    } else {
      const selectedIds = selectedChoiceIds(playerAction.selectedChoices);
      selectedCards = selectedIds.map((optionId) => {
        const option = choice.options.find(
          (candidate) => candidate.id === optionId,
        );
        if (typeof option?.value !== "string")
          throw new Error("Die Discard-Auswahl ist ungueltig.");
        return option.value;
      });
      if (selectedCards.length !== expectedCount)
        throw new Error("Die Discard-Anzahl ist nicht mehr gueltig.");
      const hand = handForSide(state, side);
      for (const cardId of selectedCards) {
        const instance = mustInstance(state.cardInstances, cardId);
        if (instance.owner !== side || !hand.includes(cardId))
          throw new Error("Eine Discard-Karte liegt nicht in der Hand.");
      }

      for (const cardId of selectedCards) {
        removeFromAllZones(state, cardId);
        if (side === "corp") {
          state.corp.archives.push(cardId);
          state.cardInstances[cardId] = {
            ...mustInstance(state.cardInstances, cardId),
            faceup: false,
            rezzed: false,
            zone: { side: "corp", zone: "archives" },
          };
        } else {
          state.runner.heap.push(cardId);
          state.cardInstances[cardId] = {
            ...mustInstance(state.cardInstances, cardId),
            faceup: true,
            rezzed: true,
            zone: { side: "runner", zone: "heap" },
          };
        }
      }
    }

    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      discardResolved: true,
      discardSide: side,
      discardCount: selectedCards.length,
      discardZone: side === "corp" ? "archives" : "heap",
      ...(cockroachRandomized
        ? {
            randomizedByCockroach: true,
            cockroachCounterTotal: cockroachCounterTotal(state),
          }
        : {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "discard_phase",
    };
    delete state.pendingChoice;
    completeDiscardPhase(state, side, legalAction);
  }

  function resolveSetupMulliganChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const setup = state.setup ?? {
      status:
        state.pendingChoice?.side === "runner"
          ? "mulligan_runner"
          : "mulligan_corp",
      initialHandSize: INITIAL_HAND_SIZE,
      resolved: {},
      mulligansTaken: {},
    };
    const side = state.pendingChoice?.side;
    if (!side) throw new Error("Es ist keine Setup-Choice offen.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
    if (selected !== "keep" && selected !== "mulligan")
      throw new Error("Die Mulligan-Auswahl ist ungueltig.");
    if (setup.resolved[side])
      throw new Error(
        "Diese Seite hat ihre Mulligan-Entscheidung bereits getroffen.",
      );

    if (selected === "mulligan") {
      if ((setup.mulligansTaken[side] ?? 0) >= 1)
        throw new Error("Diese Seite hat bereits einen Mulligan genommen.");
      takeSetupMulligan(state, side, setup.initialHandSize);
      setup.mulligansTaken[side] = (setup.mulligansTaken[side] ?? 0) + 1;
    }
    setup.resolved[side] = selected;
    state.setup = setup;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      setupStep: "mulligan",
      setupSide: side,
      setupDecision: selected,
      setupDecisionPublic: "resolved",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "setup_mulligan",
    };

    if (side === "runner") {
      setup.status = "mulligan_corp";
      state.activeSide = "corp";
      state.phase = "setup";
      state.timingPoint = "setup.mulligan.corp";
      state.pendingChoice = setupMulliganChoice(
        state,
        "corp",
        state.stateVersion + 1,
      );
      return;
    }

    setup.status = "complete";
    delete state.pendingChoice;
    state.activeSide = "corp";
    state.phase = "corp_draw_phase";
    state.timingPoint = "corp_draw.mandatory_draw";
  }

  function takeSetupMulligan(
    state: GameState,
    side: Side,
    handSize: number,
  ): void {
    if (side === "runner") {
      const allIds = [...state.runner.grip, ...state.runner.stack];
      for (const id of allIds)
        state.cardInstances[id] = {
          ...mustInstance(state.cardInstances, id),
          zone: { side: "runner", zone: "stack" },
        };
      const shuffled = shuffleStateIds(
        state,
        allIds,
        "setup.shuffle.runner.mulligan",
      );
      const grip = shuffled.splice(0, handSize);
      state.runner.grip = grip;
      state.runner.stack = shuffled;
      for (const id of grip)
        state.cardInstances[id] = {
          ...mustInstance(state.cardInstances, id),
          zone: { side: "runner", zone: "grip" },
        };
      recordStateRandomMarkers(
        state,
        "setup.draw.runner.mulligan_hand",
        grip.length,
      );
      return;
    }

    const allIds = [...state.corp.hq, ...state.corp.rd];
    for (const id of allIds)
      state.cardInstances[id] = {
        ...mustInstance(state.cardInstances, id),
        zone: { side: "corp", zone: "rd" },
      };
    const shuffled = shuffleStateIds(
      state,
      allIds,
      "setup.shuffle.corp.mulligan",
    );
    const hq = shuffled.splice(0, handSize);
    state.corp.hq = hq;
    state.corp.rd = shuffled;
    for (const id of hq)
      state.cardInstances[id] = {
        ...mustInstance(state.cardInstances, id),
        zone: { side: "corp", zone: "hq" },
      };
    recordStateRandomMarkers(state, "setup.draw.corp.mulligan_hand", hq.length);
  }

  return {
    discardChoice,
    pendingChoiceResolutionHost,
    resolveDiscardChoice,
    resolveSetupMulliganChoice,
    setupMulliganChoice,
    takeSetupMulligan,
  };
}
