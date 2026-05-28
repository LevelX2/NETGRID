// @ts-nocheck
import type { RuntimeDeps, GameState, LegalAction, PlayerAction, ChoiceRequest, Side, CardDefinition, CardDefinitionId, CardInstanceId, CorpServer, CounterType, DamageSummary, ResolvedGameEffect, ServerId, PendingChoiceResolutionHost, HiddenZoneSearchActivationHandlerHost, HiddenZoneSearchChoiceHandlerHost, HiddenZoneArrangeChoiceHandlerHost, HiddenZoneNonSearchChoiceHandlerHost, CorpZoneChoiceHandlerHost, CardRunnerEventLongtailImplementation } from "./runtime-shared";

export function createChoiceHiddenZoneRuntime(deps: RuntimeDeps) {
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

function hiddenZoneSearchHandlerHostBase(
  state: GameState,
  legalAction: LegalAction,
): HiddenZoneSearchActivationHandlerHost {
  return {
    state,
    legalAction,
    constants: {
      aujourdOuiResourceCardId: AUJOURD_OUI_RESOURCE_CARD_ID,
      mysteryBoxId: MYSTERY_BOX_ID,
      selfModifyingCodeId: SELF_MODIFYING_CODE_ID,
      shortCircuitResourceCardId: SHORT_CIRCUIT_RESOURCE_CARD_ID,
      sneakPreviewId: SNEAK_PREVIEW_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      isUniqueRunnerDefinitionInstalled: (definition) =>
        isUniqueCard(definition) &&
        hasInstalledUniqueCardDefinition(state, "runner", definition.id),
      runnerProgramUsesMemory: (cardId) => runnerProgramUsesMemory(state, cardId),
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
    startSelfModifyingCodeFreeMuChoice: (cardId) =>
      startSelfModifyingCodeFreeMuChoice(state, cardId),
    availableRunnerProgramInstallCredits: () =>
      availableRunnerProgramInstallCredits(state),
    runnerMemoryLimit: () => runnerMemoryLimit(state),
    install: {
      canInstallRunnerProgramFromZone: (cardId, sourceZone, installCost) =>
        canInstallRunnerProgramFromZone(state, cardId, sourceZone, installCost),
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
      sneakPreviewInstallableProgramIds: (sourceZone) =>
        sneakPreviewInstallableProgramIds(
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
      aujourdOuiResourceCardId: AUJOURD_OUI_RESOURCE_CARD_ID,
      mysteryBoxId: MYSTERY_BOX_ID,
      selfModifyingCodeId: SELF_MODIFYING_CODE_ID,
      shortCircuitResourceCardId: SHORT_CIRCUIT_RESOURCE_CARD_ID,
      sneakPreviewId: SNEAK_PREVIEW_ID,
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
    shuffleRunnerStack: (purpose: string) => shuffleRunnerStack(state, purpose),
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

function hiddenZoneArrangeChoiceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction?: PlayerAction,
): HiddenZoneArrangeChoiceHandlerHost {
  return {
    state,
    legalAction,
    ...(playerAction ? { playerAction } : {}),
    constants: {
      corpRdTop5ReorderOperationCardId: CORP_RD_TOP5_REORDER_OPERATION_CARD_ID,
      roninAroundId: RONIN_AROUND_ID,
      tooManyDoorsId: TOO_MANY_DOORS_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      hiddenReplacementLongtailKind: (definitionId) =>
        cardImplementationForDefinitionId(definitionId)
          ?.hiddenReplacementLongtail?.kind,
      isHiddenZoneReorderAssetDefinition: (definitionId) =>
        HIDDEN_ZONE_REORDER_ASSET_CARD_IDS.has(definitionId),
      hasCorpUtilityKind: (cardId, kind) =>
        hasCorpUtilityKind(
          state,
          cardId,
          kind as Parameters<typeof hasCorpUtilityKind>[2],
        ),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      rezzedCorpRootCardIds: () => rezzedCorpRootCardIds(state),
    },
    servers: {
      mustServer: (serverId) => mustServer(state, serverId),
      publicServerLabel: (serverId) => publicServerLabel(state, serverId),
    },
    choices: {
      iceChoiceLabelForSide: (cardId, visibleTo, fallback) =>
        iceChoiceLabelForSide(state, cardId, visibleTo, fallback),
    },
    callbacks: {
      runnerTurnFlags: () => ensureRunnerTurnFlags(state),
    },
  };
}

function hiddenZoneNonSearchChoiceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction?: PlayerAction,
): HiddenZoneNonSearchChoiceHandlerHost {
  return {
    state,
    legalAction,
    ...(playerAction ? { playerAction } : {}),
    constants: {
      corpArchivesToHqOperationCardId: CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID,
      runAccessPressureEventCardId: RUN_ACCESS_PRESSURE_EVENT_CARD_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      hasCorpUtilityKind: (cardId, kind) =>
        hasCorpUtilityKind(
          state,
          cardId,
          kind as Parameters<typeof hasCorpUtilityKind>[2],
        ),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      smithsPawnshopGainCredits: (cardId) => {
        const implementation = uniqueDirectLongtailImplementationForDefinition(
          definitionFor(state, cardId).id,
        );
        return implementation?.kind ===
          "smiths_pawnshop_start_turn_trash_for_credits"
          ? implementation.gainCredits
          : 2;
      },
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      trashRunnerInstalledCardToHeap: (cardId) =>
        trashRunnerInstalledCardToHeap(state, cardId),
    },
    servers: {
      mustServer: (serverId) => mustServer(state, serverId),
      publicServerLabel: (serverId) => publicServerLabel(state, serverId),
      iceChoiceLabelForSide: (cardId, visibleTo, fallback) =>
        iceChoiceLabelForSide(state, cardId, visibleTo, fallback),
    },
    callbacks: {
      hasSuccessfulHqRunThisTurn: () => hasSuccessfulHqRunThisTurn(state),
      spendCorpCredits: (amount) => spendCredits(state, "corp", amount),
      gainRunnerCredits: (amount) => credits(state, "runner", amount),
      startRunWithAutoPass: (serverId, iceId) =>
        startRun(
          state,
          serverId,
          undefined,
          1,
          { socialEngineeringAutoPassIceId: iceId },
          legalAction,
        ),
    },
  };
}

function corpZoneChoiceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction?: PlayerAction,
): CorpZoneChoiceHandlerHost {
  return {
    state,
    legalAction,
    ...(playerAction ? { playerAction } : {}),
    constants: {
      corpHqAgendaRevealCardId: CORP_HQ_AGENDA_REVEAL_CARD_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      hasCardImplementation: (definitionId) =>
        Boolean(cardImplementationForDefinitionId(definitionId)),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      scoredAgendaKind: (cardId) =>
        scoredAgendaImplementationForDefinition(definitionFor(state, cardId))
          ?.kind,
      scoredAgendaDrawCount: (cardId) => {
        const implementation = scoredAgendaImplementationForDefinition(
          definitionFor(state, cardId),
        );
        return implementation?.kind ===
          "ai_cfo_shuffle_hq_archives_into_rd_draw"
          ? implementation.drawCount
          : 5;
      },
    },
    zones: {
      rezzedCorpRootCardIds: () => rezzedCorpRootCardIds(state),
      shuffleCorpRnd: (cardIds, randomPurpose) =>
        shuffleStateIds(state, cardIds, randomPurpose),
    },
    credits: {
      gainCorpCredits: (amount) => credits(state, "corp", amount),
    },
    draw: {
      drawCorpCards: (amount) => drawCorpCards(state, amount),
    },
  };
}


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
  if (availableRunnerProgramInstallCredits(state) < (definition.installCost ?? 0))
    return false;
  if (state.runner.memoryUsed + (definition.memoryCost ?? 0) > runnerMemoryLimit(state))
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
    availableRunnerProgramInstallCredits(state) < (definition.installCost ?? 0)
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
    installCostPaid: installCost === "normal" ? definition.installCost ?? 0 : 0,
    runnerCreditsAfter: state.runner.credits,
  };
  return true;
}

function startSelfModifyingCodeFreeMuChoice(
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
    choiceId: `v1911_self_modifying_code_free_mu_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1911.self_modifying_code_free_mu:${selectedProgramId}:${state.stateVersion + 1}`,
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
    throw new Error(options.typeError ?? "Sneak Preview darf nur Programme installieren.");
  if (
    (options.checkUnique ?? true) &&
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  if (
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
    runnerMemoryLimit(state)
  )
    throw new Error(options.memoryError ?? "Nicht genug Memory fuer Sneak Preview.");
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
    setCardCounter(state, cardId, "recurring_credit", definition.recurringCredits ?? 0);
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

function startAnonymousTipDerezBlackIceChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = rezzedBlackIceIds(state);
  if (targets.length === 0)
    throw new Error("Keine gerezzte Black ICE als Ziel fuer Anonymous Tip.");
  state.pendingChoice = {
    choiceId: `v1922_anonymous_tip_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.anonymous_tip_derez_black_ice:${sourceCardId}`,
    prompt: "Black ICE derezzen",
    kind: "select_cards",
    options: targets.map((cardId) => {
      const definition = definitionFor(state, cardId);
      const serverLabel = publicServerLabelForCard(state, cardId) ?? "Server";
      return {
        id: `card_${cardId}`,
        label: `${definition.title} (${serverLabel})`,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveAnonymousTipDerezBlackIceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("v1922.anonymous_tip_derez_black_ice")
  )
    throw new Error("Es ist keine V1.9.22-Anonymous-Tip-Choice offen.");
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !rezzedBlackIceIds(state).includes(selectedId))
    throw new Error("Das Anonymous-Tip-Ziel ist keine gerezzte Black ICE.");
  const targetDefinition = definitionFor(state, selectedId);
  state.cardInstances[selectedId] = {
    ...withoutVariableIceState(
      mustInstance(state.cardInstances, selectedId),
    ),
    faceup: false,
    rezzed: false,
  };
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "derez_black_ice",
    derezzedCount: 1,
    targetCardDefinitionId: targetDefinition.id,
  };
}

function startCoreCommandJettisonIceChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = affordableRezzedInstalledIceIdsForRunner(state);
  if (targets.length === 0)
    throw new Error(
      "Keine bezahlbare gerezzte ICE als Ziel fuer Core Command: Jettison Ice.",
    );
  state.pendingChoice = {
    choiceId: `v1922_core_command_jettison_ice_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.core_command_jettison_ice:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Gerezzte ICE trashen",
    kind: "select_cards",
    options: targets.map((cardId) => {
      const definition = definitionFor(state, cardId);
      const serverLabel = publicServerLabelForCard(state, cardId) ?? "Server";
      return {
        id: `card_${cardId}`,
        label: `${definition.title} (${serverLabel})`,
        publicLabel: `${definition.title} (${serverLabel})`,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveCoreCommandJettisonIceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.core_command_jettison_ice"))
    throw new Error("Es ist keine V1.9.22-Core-Command-Choice offen.");
  if (!hasSuccessfulHqRunThisTurn(state))
    throw new Error(
      "Core Command: Jettison Ice benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
    );
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !rezzedInstalledIceIds(state).includes(selectedId))
    throw new Error(
      "Das Core-Command-Ziel ist keine gerezzte installierte ICE.",
    );
  const rezCost = rezCostForCard(state, selectedId);
  if (state.runner.credits < rezCost)
    throw new Error(
      "Der Runner kann die Rez-Kosten fuer Core Command nicht zahlen.",
    );
  const definition = definitionFor(state, selectedId);
  const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
  const icePositionLabel =
    publicIcePositionLabelForCard(state, selectedId) ?? serverLabel;
  spendCredits(state, "runner", rezCost);
  trashCorpInstalledCardToArchives(state, selectedId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
    rezCostPaid: rezCost,
    runnerCreditsAfter: state.runner.credits,
    trashedCount: 1,
    targetCardDefinitionId: definition.id,
    targetServerLabel: serverLabel,
    targetIcePositionLabel: icePositionLabel,
  };
}

function publicIcePositionLabelForCard(
  state: GameState,
  cardId: string | undefined,
): string | undefined {
  if (!cardId) return undefined;
  const zone = state.cardInstances[cardId]?.zone;
  const serverId = zone && "serverId" in zone ? zone.serverId : undefined;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const serverLabel = publicServerLabel(state, serverId);
  if (!server || !serverLabel) return serverLabel;
  const iceIndex = server.ice.indexOf(cardId);
  return iceIndex >= 0
    ? `ICE ${iceIndex + 1} in ${serverLabel}`
    : `ICE in ${serverLabel}`;
}

function publicIceSelectionLabelForCard(
  state: GameState,
  cardId: string | undefined,
): string | undefined {
  if (!cardId) return undefined;
  return publicIcePositionLabelForCard(state, cardId);
}

function startForgedActivationOrdersTargetChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = corpInstalledCardIds(state)
    .filter(
      (cardId) =>
        mustInstance(state.cardInstances, cardId).zone.zone === "serverIce",
    );
  if (targets.length === 0)
    throw new Error(
      "Keine ICE als Ziel fuer Forged Activation Orders.",
    );
  state.pendingChoice = {
    choiceId: `v1922_forged_activation_orders_target_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.forged_activation_orders_target:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "ICE für Rez-/Trash-Entscheidung wählen",
    kind: "select_cards",
    options: targets.map((cardId, index) => {
      const iceLabel = publicIceSelectionLabelForCard(state, cardId) ?? "ICE";
      return {
        id: `ice_${index + 1}`,
        label: iceLabel,
        publicLabel: iceLabel,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveForgedActivationOrdersTargetChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("v1922.forged_activation_orders_target")
  )
    throw new Error(
      "Es ist keine V1.9.22-Forged-Activation-Orders-Ziel-Choice offen.",
    );
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (
    !selectedId ||
    !corpInstalledCardIds(state).includes(selectedId) ||
    mustInstance(state.cardInstances, selectedId).zone.zone !== "serverIce"
  )
    throw new Error(
      "Das Forged-Activation-Orders-Ziel ist keine installierte ICE.",
    );
  const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
  const icePositionLabel =
    publicIcePositionLabelForCard(state, selectedId) ?? serverLabel;
  state.pendingChoice = {
    choiceId: `v1922_forged_activation_orders_corp_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.forged_activation_orders_corp:${selectedId}:${state.stateVersion + 1}`,
    prompt: "ICE rezzen oder trashen",
    kind: "select_option",
    options: [
      ...(!mustInstance(state.cardInstances, selectedId).rezzed &&
      state.corp.credits >= rezCostForCard(state, selectedId)
        ? [
            {
              id: "rez_ice",
              label: "ICE rezzen",
              publicLabel: "ICE gerezzt",
              value: "rez_ice",
            },
          ]
        : []),
      {
        id: "trash_ice",
        label: "ICE trashen",
        publicLabel: "ICE getrasht",
        value: "trash_ice",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "force_rez_or_trash_ice",
    targetServerLabel: serverLabel,
    targetIcePositionLabel: icePositionLabel,
    targetVisibility: "installed_ice_position",
  };
}

function resolveForgedActivationOrdersCorpChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("v1922.forged_activation_orders_corp")
  )
    throw new Error(
      "Es ist keine V1.9.22-Forged-Activation-Orders-Korp-Choice offen.",
    );
  const [, targetIceId] = choice.source.split(":");
  if (
    !targetIceId ||
    !corpInstalledCardIds(state).includes(targetIceId) ||
    mustInstance(state.cardInstances, targetIceId).zone.zone !== "serverIce"
  )
    throw new Error(
      "Das Forged-Activation-Orders-Ziel ist nicht mehr installierte ICE.",
    );
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const definition = definitionFor(state, targetIceId);
  const serverLabel = publicServerLabelForCard(state, targetIceId) ?? "Server";
  const icePositionLabel =
    publicIcePositionLabelForCard(state, targetIceId) ?? serverLabel;
  if (selected === "rez_ice") {
    if (mustInstance(state.cardInstances, targetIceId).rezzed)
      throw new Error("Die ICE ist bereits gerezzt.");
    const rezCost = rezCostForCard(state, targetIceId);
    if (state.corp.credits < rezCost)
      throw new Error("Die Korp kann die ICE nicht rezzen.");
    spendCredits(state, "corp", rezCost);
    state.cardInstances[targetIceId] = {
      ...mustInstance(state.cardInstances, targetIceId),
      rezzed: true,
      faceup: true,
    };
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      corpDecision: "rez_ice",
      rezCostPaid: rezCost,
      targetCardDefinitionId: definition.id,
      targetServerLabel: serverLabel,
      targetIcePositionLabel: icePositionLabel,
    };
    return;
  }
  if (selected !== "trash_ice")
    throw new Error(
      "Die Forged-Activation-Orders-Korp-Entscheidung ist ungueltig.",
    );
  trashCorpInstalledCardToArchives(state, targetIceId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "force_rez_or_trash_ice",
    corpDecision: "trash_ice",
    trashedCount: 1,
    targetCardDefinitionId: definition.id,
    targetServerLabel: serverLabel,
    targetIcePositionLabel: icePositionLabel,
  };
}

function startSecurityCodeWormChipTrashIceChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = unrezzedInstalledIceIds(state);
  if (targets.length === 0)
    throw new Error(
      "Keine unrezzte ICE als Ziel fuer Security Code WORM Chip.",
    );
  state.pendingChoice = {
    choiceId: `v1922_security_code_worm_chip_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.security_code_worm_chip:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Unrezzte ICE trashen",
    kind: "select_cards",
    options: targets.map((cardId, index) => {
      const iceLabel = publicIceSelectionLabelForCard(state, cardId) ?? "ICE";
      return {
        id: `ice_${index + 1}`,
        label: iceLabel,
        publicLabel: iceLabel,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveSecurityCodeWormChipTrashIceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.security_code_worm_chip"))
    throw new Error(
      "Es ist keine V1.9.22-Security-Code-WORM-Chip-Choice offen.",
    );
  if (!hasSuccessfulHqRunThisTurn(state))
    throw new Error(
      "Security Code WORM Chip benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
    );
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !unrezzedInstalledIceIds(state).includes(selectedId))
    throw new Error(
      "Das Security-Code-WORM-Chip-Ziel ist keine unrezzte installierte ICE.",
    );
  const definition = definitionFor(state, selectedId);
  const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
  trashCorpInstalledCardToArchives(state, selectedId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
    targetVisibility: "installed_ice_position",
    targetServerLabel: serverLabel,
    trashedCount: 1,
    targetCardDefinitionId: definition.id,
  };
}

function startOpenEndedMileageProgramReturnChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `v1922_open_ended_mileage_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.open_ended_mileage_return:${sourceCardId}`,
    prompt: "Open-Ended Mileage Program zuruecknehmen?",
    kind: "select_option",
    options: [
      {
        id: "leave_in_heap",
        label: "Im Heap lassen",
        publicLabel: "Nicht zurueckgenommen",
        value: "leave_in_heap",
      },
      {
        id: "pay_1_return_to_grip",
        label: "1 Credit zahlen und zuruecknehmen",
        publicLabel: "Zurueckgenommen",
        value: "pay_1_return_to_grip",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveOpenEndedMileageProgramReturnChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.open_ended_mileage_return"))
    throw new Error("Es ist keine V1.9.22-Open-Ended-Mileage-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (!sourceCardId)
    throw new Error("Open-Ended Mileage Program hat keine Quellkarte.");
  const selectedOptionIds = Array.isArray(
    playerAction.selectedChoices?.selectedOptionIds,
  )
    ? playerAction.selectedChoices.selectedOptionIds.map((optionId) =>
        String(optionId),
      )
    : [];
  const selectedOptionId = selectedOptionIds[0] ?? "";
  if (selectedOptionId === "pay_1_return_to_grip") {
    if (!state.runner.heap.includes(sourceCardId))
      throw new Error("Open-Ended Mileage Program liegt nicht im Heap.");
    if (state.runner.credits < 1)
      throw new Error("Der Runner kann Open-Ended Mileage Program nicht bezahlen.");
    spendCredits(state, "runner", 1);
    removeFromAllZones(state, sourceCardId);
    state.runner.grip.push(sourceCardId);
    state.cardInstances[sourceCardId] = {
      ...mustInstance(state.cardInstances, sourceCardId),
      faceup: true,
      zone: { side: "runner", zone: "grip" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "remove_tag_optional_return",
    returnDecision: selectedOptionId,
    returnedToGrip: selectedOptionId === "pay_1_return_to_grip",
    paidCredits: selectedOptionId === "pay_1_return_to_grip" ? 1 : 0,
    runnerCreditsAfter: state.runner.credits,
  };
}

function corpAgendaPointTotal(state: GameState): number {
  const scoredPoints = state.corp.scoreArea.reduce(
    (sum, cardId) => sum + agendaPointsForScoredCard(state, cardId),
    0,
  );
  return scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0));
}

function chooseCorpAgendasForPointCost(
  state: GameState,
  requiredPoints: number,
): CardInstanceId[] {
  let total = 0;
  const selected: CardInstanceId[] = [];
  for (const cardId of corpScoredAgendaForfeitTargets(state)) {
    selected.push(cardId);
    total += agendaPointsForScoredCard(state, cardId);
    if (total >= requiredPoints) return selected;
  }
  return [];
}

function startRunnerHostingChoice(
  state: GameState,
  hostId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const host = mustInstance(state.cardInstances, hostId);
  if (
    host.definitionId !== "v099_host_resource" ||
    !state.runner.rig.resources.includes(hostId)
  )
    throw new Error("Diese Karte kann in V0.99 nicht hosten.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.runner.grip
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        definition.type === "program" &&
        state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
          runnerMemoryLimit(state)
      );
    })
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0) return;
  state.pendingChoice = {
    choiceId: `v099_host_program_${state.stateVersion + 1}`,
    side: "runner",
    source: `v099.host_program:${hostId}:${state.stateVersion + 1}`,
    prompt: "Programm hosten",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "host_program",
    hostId,
  };
}

function resolveRunnerHostingChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Hosting-Choice offen.");
  const sourceParts = choice.source.split(":");
  const hostId = sourceParts[1];
  if (!hostId || !state.runner.rig.resources.includes(hostId))
    throw new Error("Der Host ist nicht mehr installiert.");
  const hostDefinition = definitionFor(state, hostId);
  if (hostDefinition.id !== "v099_host_resource")
    throw new Error("Diese Karte kann in V0.99 nicht hosten.");
  const cardId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!cardId || !state.runner.grip.includes(cardId))
    throw new Error("Die gewählte Karte liegt nicht in der Grip.");
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program")
    throw new Error(
      "Nur Programme können in dieser Hosting-Harness gehostet werden.",
    );
  if (
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
    runnerMemoryLimit(state)
  )
    throw new Error("Nicht genug Memory für das gehostete Programm.");
  setHostedOn(state, cardId, hostId);
  removeFromAllZones(state, cardId);
  state.runner.rig.programs.push(cardId);
  state.runner.memoryUsed += definition.memoryCost ?? 0;
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
    hostedOn: hostId,
  };
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "host_program",
    hostedCount: 1,
    hostId,
  };
}

function resolveIncubatorTransformChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v191.incubator_transform"))
    throw new Error("Es ist keine Incubator-Choice offen.");
  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const selectedOption = choice.options.find(
    (option) => option.id === selectedId,
  );
  if (!selectedOption || typeof selectedOption.value !== "string")
    throw new Error("Die Incubator-Auswahl ist ungültig.");

  const value = selectedOption.value;
  if (value.startsWith("card:")) {
    const cardId = value.slice("card:".length);
    if (!cardId || !state.cardInstances[cardId])
      throw new Error("Der gewählte Karten-Counter ist ungültig.");
    const available = cardCounter(state, cardId, "virus");
    if (available <= 0)
      throw new Error("Der gewählte Karten-Counter ist nicht mehr verfügbar.");
    spendCardCounter(state, cardId, "virus", 1);
    addCardCounter(state, cardId, "virus", 2);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "incubator_transform",
      incubatorTargetKind: "card",
    };
  } else if (value.startsWith("pox:")) {
    const serverId = value.slice("pox:".length) as Exclude<
      ServerId,
      "new_remote"
    >;
    const available = poxCountersForServer(state, serverId);
    if (available <= 0)
      throw new Error("Der gewählte Pox-Counter ist nicht mehr verfügbar.");
    state.poxCountersByServer = {
      ...(state.poxCountersByServer ?? {}),
      [serverId]: available + 1,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "incubator_transform",
      incubatorTargetKind: "server",
    };
  } else if (value.startsWith("fait:")) {
    const serverId = value.slice("fait:".length) as Exclude<
      ServerId,
      "new_remote"
    >;
    mustServer(state, serverId);
    const available = Math.max(
      0,
      Math.floor(state.faitAccompliCountersByServer?.[serverId] ?? 0),
    );
    if (available <= 0)
      throw new Error("Der gewählte Fait-Counter ist nicht mehr verfügbar.");
    state.faitAccompliCountersByServer = {
      ...(state.faitAccompliCountersByServer ?? {}),
      [serverId]: available + 1,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "incubator_transform",
      incubatorTargetKind: "server",
    };
  } else {
    throw new Error("Die Incubator-Auswahl hat einen ungültigen Targettyp.");
  }

  const flags = ensureRunnerTurnFlags(state);
  const remaining = Math.max(
    0,
    Math.floor((flags.incubatorPendingTransforms ?? 0) - 1),
  );
  flags.incubatorPendingTransforms = remaining;
  delete state.pendingChoice;
  if (remaining > 0) {
    startIncubatorTransformChoice(state);
    return;
  }
  applyRunnerStartOfTurnEffects(state);
}

function resolveChimeraDaemonTrashChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  resolveAccessChimeraDaemonTrashChoice(
    accessEffectHandlerHost(state, legalAction),
    selectedChoiceIds(playerAction.selectedChoices)[0] ?? "",
  );
}

function resolveCardImplementationAccessPaymentChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  resolveAccessPaymentChoice(
    accessEffectHandlerHost(state, legalAction),
    selectedChoiceIds(playerAction.selectedChoices)[0] ?? "",
  );
}

function resolveProteusRunnerProgramReturnChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  resolveAccessInstalledRunnerProgramReturnChoice(
    accessEffectHandlerHost(state, legalAction),
    selectedChoiceIds(playerAction.selectedChoices),
  );
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

function iceChoiceLabelForSide(
  state: GameState,
  cardId: CardInstanceId,
  visibleTo: Side,
  fallback: string,
): { label: string; publicLabel: string } {
  const instance = mustInstance(state.cardInstances, cardId);
  const definition = definitionFor(state, cardId);
  if (visibleTo === "corp" || instance.rezzed || instance.faceup) {
    return { label: definition.title, publicLabel: definition.title };
  }
  return { label: fallback, publicLabel: fallback };
}

function resolveP358HiddenReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const source = state.pendingChoice?.source ?? "";
  const hiddenZoneArrangeChoice = handleHiddenZoneArrangeChoice(
    hiddenZoneArrangeChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneArrangeChoice.handled) return;
  void legalAction;
  void playerAction;
  throw new Error("Unbekannte P3.58-Choice.");
}

const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE =
  "card_implementation.runner_installed_connection_trash_bad_publicity";
const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION =
  "card_implementation_runner_installed_connection_trash_bad_publicity";

type TrashInstalledRunnerConnectionsThenAddBadPublicityImplementation = Extract<
  CardRunnerEventLongtailImplementation,
  { kind: "trash_installed_runner_connections_then_add_bad_publicity" }
>;

function installedRunnerConnectionIds(state: GameState): CardInstanceId[] {
  return runnerInstalledCardIds(state).filter((cardId) => {
    const definition = definitionFor(state, cardId);
    return definition.type === "resource" && cardHasSubtype(definition, "connection");
  });
}

function canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(
  state: GameState,
  implementation: TrashInstalledRunnerConnectionsThenAddBadPublicityImplementation,
): boolean {
  return installedRunnerConnectionIds(state).length >= implementation.count;
}

function resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
  implementation: TrashInstalledRunnerConnectionsThenAddBadPublicityImplementation,
): void {
  if (
    implementation.kind !==
      "trash_installed_runner_connections_then_add_bad_publicity" ||
    implementation.count !== 2 ||
    implementation.badPublicity !== 1 ||
    implementation.visibility !== "hidden_info_barrier"
  )
    throw new Error("Runner-Connection-Trash-Implementation ist ungueltig.");
  if (
    !canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(
      state,
      implementation,
    )
  )
    throw new Error("Es sind nicht genug installierte Connections vorhanden.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!sourceCardId || !state.runner.heap.includes(sourceCardId))
    throw new Error("Die Runner-Event-Quelle liegt nicht im Heap.");

  const eligible = installedRunnerConnectionIds(state).sort();
  const choiceStateVersion = state.stateVersion + 1;
  state.pendingChoice = {
    choiceId: `card_impl_runner_connection_trash_${choiceStateVersion}`,
    side: "runner",
    source: [
      RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
      sourceCardId,
      sourceDefinitionId,
      String(implementation.count),
      String(choiceStateVersion),
    ].join(":"),
    prompt: "Zwei installierte Connections trashen",
    kind: "select_cards",
    options: eligible.map((cardId) => ({
      id: `card_${cardId}`,
      label: definitionFor(state, cardId).title,
      value: cardId,
    })),
    minSelections: implementation.count,
    maxSelections: implementation.count,
    stateVersion: choiceStateVersion,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    sourceDefinitionId,
    requiredConnectionTrashCount: implementation.count,
    eligibleConnectionCount: eligible.length,
    installedConnectionTrashChoiceOpened: true,
  };
}

function parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(
  source: string,
): {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  count: number;
} {
  const [kind, sourceCardId = "", sourceDefinitionId = "", countRaw = ""] =
    source.split(":");
  if (kind !== RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE)
    throw new Error("Es ist keine Runner-Connection-Trash-Choice offen.");
  const count = Number(countRaw);
  if (!sourceCardId || !sourceDefinitionId || !Number.isInteger(count) || count <= 0)
    throw new Error("Die Runner-Connection-Trash-Choice ist ungueltig.");
  return {
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    count,
  };
}

function selectedChoiceCardIdsForChoice(
  choice: ChoiceRequest,
  playerAction: PlayerAction,
): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value as CardInstanceId;
  });
}

function resolveRunnerInstalledConnectionTrashBadPublicityChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith(
      `${RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE}:`,
    )
  )
    throw new Error("Es ist keine Runner-Connection-Trash-Choice offen.");
  const { sourceCardId, sourceDefinitionId, count } =
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(choice.source);
  if (!state.runner.heap.includes(sourceCardId))
    throw new Error("Die Runner-Connection-Trash-Choice gehoert nicht zur gespielten Karte.");
  const sourceDefinition = definitionFor(state, sourceCardId);
  const implementation = runnerEventLongtailForDefinition(sourceDefinition);
  if (
    sourceDefinition.id !== sourceDefinitionId ||
    implementation?.kind !==
      "trash_installed_runner_connections_then_add_bad_publicity" ||
    implementation.count !== count
  )
    throw new Error("Die Runner-Connection-Trash-Choice gehoert nicht zur gespielten Karte.");

  const selectedIds = selectedChoiceCardIdsForChoice(choice, playerAction);
  if (selectedIds.length !== count || new Set(selectedIds).size !== selectedIds.length)
    throw new Error("Genau zwei unterschiedliche Connections muessen gewaehlt werden.");
  const eligible = new Set(installedRunnerConnectionIds(state));
  for (const cardId of selectedIds) {
    if (!eligible.has(cardId))
      throw new Error("Eine gewaehlte Karte ist keine installierte Connection.");
  }
  const trashedCardDefinitionIds = selectedIds.map(
    (cardId) => definitionFor(state, cardId).id,
  );

  delete state.pendingChoice;
  for (const cardId of selectedIds)
    trashRunnerInstalledCardToHeap(state, cardId, legalAction);

  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId,
      sourceDefinitionId,
      sourceTitle: sourceDefinition.title,
      controller: "runner",
    },
    [
      {
        kind: "add_bad_publicity",
        amount: implementation.badPublicity,
        visibility: "public",
      },
    ],
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    sourceDefinitionId,
    trashedCount: selectedIds.length,
    installedConnectionTrashCount: selectedIds.length,
    trashedCardDefinitionIds: trashedCardDefinitionIds.join(","),
    installedConnectionTrashChoiceResolved: true,
    ...result.publicPayload,
  };
  appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
}

function resolvePlayfulAiDiceLoopEvent(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
  implementation: CardRunnerEventLongtailImplementation,
): void {
  if (
    implementation.kind !== "playful_ai_dice_loop" ||
    implementation.dieFaces !== 6 ||
    implementation.visibility !== "public"
  )
    throw new Error("Playful-AI-Implementation ist ungueltig.");
  const dieRoll = rollDeterministicDie(
    state,
    `v1921.die.${sourceDefinitionId}.dice_loop.initial`,
  );
  const choiceOpened = implementation.choiceOn.includes(
    dieRoll as (typeof implementation.choiceOn)[number],
  );
  if (choiceOpened) {
    startV1921PlayfulAiChoice(
      state,
      String(legalAction.payload?.cardId ?? ""),
      dieRoll,
      0,
      1,
    );
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1921RunnerEventAbility: "playful_ai_dice_loop",
    sourceDefinitionId,
    v1921DieRoll: dieRoll,
    playfulAiDieRolls: String(dieRoll),
    playfulAiRolledDice: 1,
    playfulAiDiceQueuedAfterRolls: 0,
    playfulAiRemainingDice: 0,
    playfulAiChoiceOpened: choiceOpened,
    playfulAiComplete: !choiceOpened,
    randomCounterAfter: state.randomCounter,
  };
}

function startV1921PlayfulAiChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  dieRoll: number,
  remainingDice: number,
  rollIndex: number,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (!sourceCardId || !state.cardInstances[sourceCardId])
    throw new Error("Playful AI hat keine gültige Quelle.");
  if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 3)
    throw new Error(
      "Playful AI darf nur bei Wurf 1, 2 oder 3 eine Choice öffnen.",
    );
  if (!Number.isInteger(remainingDice) || remainingDice < 0)
    throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
  if (!Number.isInteger(rollIndex) || rollIndex < 1)
    throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
  const choiceStateVersion = state.stateVersion + 1;
  state.pendingChoice = {
    choiceId: `v1921_playful_ai_${choiceStateVersion}`,
    side: "runner",
    source: [
      "v1921.playful_ai",
      sourceCardId,
      String(dieRoll),
      String(remainingDice),
      String(rollIndex),
      String(choiceStateVersion),
    ].join(":"),
    prompt:
      `Playful AI: ${dieRoll} ${creditTextForPrompt(dieRoll)} nehmen ` +
      `und/oder ${dieRoll} ${diePromptText(dieRoll)} beiseitelegen.`,
    kind: "select_option",
    options: playfulAiSplitOptions(dieRoll),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: choiceStateVersion,
    visibility: "public",
  };
}

function creditTextForPrompt(amount: number): string {
  return amount === 1 ? "Credit" : "Credits";
}

function diePromptText(amount: number): string {
  return amount === 1 ? "Würfel" : "Würfel";
}

function playfulAiSplitOptions(dieRoll: number): ChoiceRequest["options"] {
  return Array.from({ length: dieRoll + 1 }, (_, gainedCredits) => {
    const setAsideDice = dieRoll - gainedCredits;
    const creditText = creditTextForPrompt(gainedCredits);
    const diceText = diePromptText(setAsideDice);
    return {
      id: `gain_${gainedCredits}_set_aside_${setAsideDice}`,
      label: `${gainedCredits} ${creditText} nehmen, ${setAsideDice} ${diceText} beiseitelegen`,
      publicLabel: "Playful-AI-Aufteilung",
      value: gainedCredits,
    };
  });
}

function parsePlayfulAiChoiceSource(source: string): {
  sourceCardId: CardInstanceId;
  dieRoll: number;
  remainingDice: number;
  rollIndex: number;
} {
  const [, sourceCardId = "", dieRollRaw = "", fourth = "", fifth = ""] =
    source.split(":");
  const dieRoll = Number(dieRollRaw);
  if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 6)
    throw new Error("Playful-AI-Wurf ist ungültig.");
  const remainingDice = Number(fourth);
  const rollIndex = Number(fifth);
  if (
    Number.isInteger(remainingDice) &&
    remainingDice >= 0 &&
    Number.isInteger(rollIndex) &&
    rollIndex >= 1
  ) {
    return { sourceCardId, dieRoll, remainingDice, rollIndex };
  }
  const oldRolls = fourth
    .split(",")
    .filter(Boolean)
    .map((value) => Number(value));
  if (
    oldRolls.length === 0 ||
    oldRolls.some((roll) => !Number.isInteger(roll) || roll < 1 || roll > 6)
  )
    throw new Error("Playful-AI-Wurfserie ist ungültig.");
  return {
    sourceCardId,
    dieRoll,
    remainingDice: 0,
    rollIndex: oldRolls.length,
  };
}

function parsePlayfulAiSplit(
  choice: ChoiceRequest,
  selectedOptionId: string | undefined,
  dieRoll: number,
): { gainedCredits: number; setAsideDice: number } {
  const option = choice.options.find(
    (candidate) => candidate.id === selectedOptionId,
  );
  if (!option) throw new Error("Playful-AI-Auswahl ist ungültig.");
  if (option.id === "take_credits")
    return { gainedCredits: dieRoll, setAsideDice: 0 };
  if (option.id === "set_aside")
    return { gainedCredits: 0, setAsideDice: dieRoll };
  const match = /^gain_(\d+)_set_aside_(\d+)$/.exec(option.id);
  if (!match) throw new Error("Playful-AI-Auswahl ist ungültig.");
  const gainedCredits = Number(match[1]);
  const setAsideDice = Number(match[2]);
  if (
    !Number.isInteger(gainedCredits) ||
    !Number.isInteger(setAsideDice) ||
    gainedCredits < 0 ||
    setAsideDice < 0 ||
    gainedCredits + setAsideDice !== dieRoll
  )
    throw new Error("Playful-AI-Aufteilung ist ungültig.");
  return { gainedCredits, setAsideDice };
}

function continueV1921PlayfulAiLoop(
  state: GameState,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  queuedDice: number,
  rollIndex: number,
): {
  rolledDice: number[];
  remainingDice: number;
  rollIndex: number;
  choiceOpened: boolean;
  complete: boolean;
} {
  if (!Number.isInteger(queuedDice) || queuedDice < 0)
    throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
  if (!Number.isInteger(rollIndex) || rollIndex < 1)
    throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
  let remainingDice = queuedDice;
  let nextRollIndex = rollIndex;
  const rolledDice: number[] = [];
  while (remainingDice > 0) {
    remainingDice -= 1;
    const nextRoll = rollDeterministicDie(
      state,
      `v1921.die.${sourceDefinitionId}.dice_loop.followup.${state.stateVersion + 1}.${nextRollIndex}`,
    );
    nextRollIndex += 1;
    rolledDice.push(nextRoll);
    if (nextRoll <= 3) {
      startV1921PlayfulAiChoice(
        state,
        sourceCardId,
        nextRoll,
        remainingDice,
        nextRollIndex,
      );
      return {
        rolledDice,
        remainingDice,
        rollIndex: nextRollIndex,
        choiceOpened: true,
        complete: false,
      };
    }
  }
  return {
    rolledDice,
    remainingDice: 0,
    rollIndex: nextRollIndex,
    choiceOpened: false,
    complete: true,
  };
}

function resolveV1921PlayfulAiChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1921.playful_ai"))
    throw new Error("Es ist keine Playful-AI-Choice offen.");
  const choiceState = parsePlayfulAiChoiceSource(choice.source);
  const { sourceCardId, dieRoll, remainingDice, rollIndex } = choiceState;
  if (
    !sourceCardId ||
    !state.runner.heap.includes(sourceCardId) ||
    runnerEventLongtailKindForDefinition(definitionFor(state, sourceCardId)) !==
      "playful_ai_dice_loop"
  )
    throw new Error("Die Playful-AI-Choice gehoert nicht zur gespielten Karte.");
  const sourceDefinitionId = definitionFor(state, sourceCardId).id;
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];

  delete state.pendingChoice;
  let gainedCredits = 0;
  let setAsideDice = 0;
  let queuedDiceBeforeRolls = remainingDice;
  let progress: ReturnType<typeof continueV1921PlayfulAiLoop> = {
    rolledDice: [],
    remainingDice,
    rollIndex,
    choiceOpened: false,
    complete: true,
  };
  if (dieRoll <= 3) {
    const split = parsePlayfulAiSplit(choice, selectedOptionId, dieRoll);
    gainedCredits = split.gainedCredits;
    setAsideDice = split.setAsideDice;
    if (gainedCredits > 0) credits(state, "runner", gainedCredits);
    queuedDiceBeforeRolls = remainingDice + setAsideDice;
    progress = continueV1921PlayfulAiLoop(
      state,
      sourceCardId,
      sourceDefinitionId,
      queuedDiceBeforeRolls,
      rollIndex,
    );
  }

  const payload: NonNullable<LegalAction["payload"]> = {
    ...(legalAction.payload ?? {}),
    v1921RunnerEventAbility: "playful_ai_dice_loop",
    sourceDefinitionId,
    playfulAiDieRolls: progress.rolledDice.join(","),
    playfulAiGainedCredits: gainedCredits,
    playfulAiSetAsideDice: setAsideDice,
    playfulAiRolledDice: progress.rolledDice.length,
    playfulAiDiceQueuedBeforeRolls: queuedDiceBeforeRolls,
    playfulAiDiceQueuedAfterRolls: progress.remainingDice,
    playfulAiRemainingDice: progress.remainingDice,
    playfulAiChoiceOpened: progress.choiceOpened,
    playfulAiComplete: progress.complete,
    randomCounterAfter: state.randomCounter,
    runnerCreditsAfter: state.runner.credits,
  };
  const lastRoll = progress.rolledDice.at(-1);
  if (lastRoll !== undefined) payload.v1921DieRoll = lastRoll;
  legalAction.payload = payload;
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
      throw new Error("Diese Stack-Search-Ability wird deklarativ abgewickelt.");
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
              ? `v1911.short_circuit_search:${sourceCardId}`
              : "v1911.search_stack",
          choiceIdPrefix:
            sourceDefinition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID
              ? "v1911_short_circuit_search"
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
          ? "v1911_short_circuit_search"
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
      String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">,
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
    if (!STACK_TOP_REVEAL_PROGRAM_CARD_IDS.has(sourceDefinition.id))
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

function resolveV1911CorporateDownsizing(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Corporate Downsizing nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.corp.scoreArea.includes(sourceCardId))
    throw new Error("Corporate Downsizing ist nicht gescort.");
  if (
    scoredAgendaKindForDefinition(definitionFor(state, sourceCardId)) !==
    "corporate_downsizing_hq_agendas"
  )
    throw new Error("Die Agenda-Aktion passt nicht zu Corporate Downsizing.");
  revealCorpRdTop(state, legalAction);
}

function exposedCorpCardInServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): CardInstanceId | undefined {
  const server = mustServer(state, serverId);
  return [...server.root, ...server.ice].find((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return !instance.rezzed;
  });
}

function exposeCorpCardInServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  legalAction: LegalAction,
): void {
  const cardId = exposedCorpCardInServer(state, serverId);
  if (!cardId)
    throw new Error(
      "In diesem Server liegt keine unrezzed installierte Korp-Karte.",
    );
  const definition = definitionFor(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    publicRevealKind: "expose",
    publicRevealDefinitionId: definition.id,
  };
}

function installedCorpCardServerContext(
  state: GameState,
  cardId: CardInstanceId,
): { server: CorpServer; area: "root" | "ice"; index: number } | undefined {
  for (const server of state.corp.servers) {
    const rootIndex = server.root.indexOf(cardId);
    if (rootIndex >= 0) return { server, area: "root", index: rootIndex };
    const iceIndex = server.ice.indexOf(cardId);
    if (iceIndex >= 0) return { server, area: "ice", index: iceIndex };
  }
  return undefined;
}

function exposeInstalledCorpCardTargets(
  state: GameState,
  _scope: "inside_data_fort" | "any_installed",
): CardInstanceId[] {
  const targets: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of [...server.root, ...server.ice]) {
      const instance = mustInstance(state.cardInstances, cardId);
      if (!instance.rezzed) targets.push(cardId);
    }
  }
  return targets.sort();
}

function exposeInstalledCorpCardLabel(
  state: GameState,
  cardId: CardInstanceId,
): string {
  const context = installedCorpCardServerContext(state, cardId);
  if (!context) return "Installierte Korp-Karte";
  return context.area === "ice"
    ? `${context.server.label} ICE ${context.index + 1}`
    : `${context.server.label} Root ${context.index + 1}`;
}

function exposeInstalledCorpCardForImplementation(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinition["id"],
  targetCardId: CardInstanceId,
  scope: "inside_data_fort" | "any_installed",
): { publicPayload: Record<string, string | number | boolean> } {
  const legalTargets = new Set(exposeInstalledCorpCardTargets(state, scope));
  if (!legalTargets.has(targetCardId))
    throw new Error("Diese installierte Korp-Karte kann nicht exposed werden.");
  const targetDefinition = definitionFor(state, targetCardId);
  const sourceDefinition = DEMO_CARDS_BY_ID[sourceDefinitionId];
  const context = installedCorpCardServerContext(state, targetCardId);
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_expose_server_card",
    publicRevealKind: "expose",
    publicRevealDefinitionId: targetDefinition.id,
    cardDefinitionId: targetDefinition.id,
    targetDefinitionId: targetDefinition.id,
    exposedCardDefinitionId: targetDefinition.id,
    exposedCardTitle: targetDefinition.title,
    exposedCardInstanceId: targetCardId,
    sourceCardId,
    sourceDefinitionId,
    ...(sourceDefinition ? { sourceTitle: sourceDefinition.title } : {}),
    ...(context
      ? {
          exposedServerId: context.server.id,
          exposedServerLabel: context.server.label,
          exposedArea: context.area,
          exposedIndex: context.index,
          exposedPositionKey: `${context.area}:${context.index}`,
        }
      : {}),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

function installedRunnerIcebreakerIds(state: GameState): CardInstanceId[] {
  return state.runner.rig.programs
    .filter((cardId) => cardHasSubtype(definitionFor(state, cardId), "icebreaker"))
    .sort();
}

function addCounterToAllInstalledRunnerIcebreakers(
  state: GameState,
  counterType: CounterType,
  amount: number,
): { amount: number; counterType: Extract<CounterType, "militech" | "pattel_antibody">; countersAfter: number; publicPayload: Record<string, string | number | boolean> } {
  if (counterType !== "militech" && counterType !== "pattel_antibody")
    throw new Error("Dieser Icebreaker-Counter-Typ wird nicht unterstuetzt.");
  const targetIds = installedRunnerIcebreakerIds(state);
  for (const cardId of targetIds) addCardCounter(state, cardId, counterType, amount);
  return {
    amount: targetIds.length * amount,
    counterType,
    countersAfter: targetIds.reduce(
      (sum, cardId) => sum + cardCounter(state, cardId, counterType),
      0,
    ),
    publicPayload: {
      counterType,
      addedCounterAmount: targetIds.length * amount,
      targetCount: targetIds.length,
      targetCardDefinitionIds: targetIds
        .map((cardId) => definitionFor(state, cardId).id)
        .join(","),
    },
  };
}

function shuffleCorpCardIntoRd(
  state: GameState,
  cardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  reason: "lifecycle" | "access",
): { publicPayload: Record<string, string | number | boolean> } {
  const instance = mustInstance(state.cardInstances, cardId);
  if (instance.owner !== "corp")
    throw new Error("Nur Korp-Karten koennen in R&D gemischt werden.");
  removeFromAllZones(state, cardId);
  state.corp.rd.push(cardId);
  state.cardInstances[cardId] = {
    ...instance,
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "rd" },
  };
  state.corp.rd = shuffleStateIds(
    state,
    state.corp.rd,
    `card_implementation.${sourceDefinitionId}.${reason}.shuffle_into_rd`,
  );
  for (const rdCardId of state.corp.rd) {
    state.cardInstances[rdCardId] = {
      ...mustInstance(state.cardInstances, rdCardId),
      zone: { side: "corp", zone: "rd" },
    };
  }
  return {
    publicPayload: {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "shuffle_source_into_corp_rd",
      movedCardCount: 1,
      sourceDefinitionId,
    },
  };
}

function trashCorpInstalledCardsInScoredSourceServer(
  state: GameState,
  legalAction: LegalAction | undefined,
  _sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
): { publicPayload: Record<string, string | number | boolean> } {
  const serverId =
    typeof legalAction?.payload?.scoredFromServerId === "string"
      ? legalAction.payload.scoredFromServerId
      : undefined;
  if (!serverId || serverId === "new_remote")
    throw new Error("Die gescorte Agenda hat keinen gueltigen Installationsserver.");
  const server = mustServer(state, serverId as Exclude<ServerId, "new_remote">);
  const targetIds = [...server.root, ...server.ice].sort();
  const publicDefinitionIds = targetIds
    .filter((targetId) => {
      const instance = mustInstance(state.cardInstances, targetId);
      return instance.rezzed === true || instance.faceup === true;
    })
    .map((targetId) => definitionFor(state, targetId).id);
  for (const targetId of targetIds) {
    trashCorpInstalledCardToArchives(state, targetId, legalAction);
  }
  return {
    publicPayload: {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "proteus_trash_source_server_installed_corp_cards",
      sourceDefinitionId,
      scoredFromServerId: server.id,
      trashedInstalledCount: targetIds.length,
      publicTrashedCardDefinitionIds: publicDefinitionIds.join(","),
    },
  };
}

function resolveDealWithMilitech(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (!runnerStoleAgendaSubtypeThisTurn(state, "research"))
    throw new Error("Deal with Militech benoetigt eine befreite Research-Agenda in diesem Zug.");
  const result = addCounterToAllInstalledRunnerIcebreakers(
    state,
    "militech",
    1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: DEAL_WITH_MILITECH_ID,
    ...result.publicPayload,
  };
}

function huntClubBbsExposeTargets(state: GameState): CardInstanceId[] {
  return exposeInstalledCorpCardTargets(state, "any_installed");
}

function huntClubBbsExposeOptionLabel(
  state: GameState,
  cardId: CardInstanceId,
): string {
  return exposeInstalledCorpCardLabel(state, cardId);
}

function exposeInstalledCorpCardsChoiceOptions(state: GameState) {
  return exposeInstalledCorpCardTargets(state, "any_installed").map((cardId) => ({
    id: `card_${cardId}`,
    label: exposeInstalledCorpCardLabel(state, cardId),
    value: cardId,
  }));
}

function startHuntClubBbsExposeChoice(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = huntClubBbsExposeTargets(state).map((cardId) => ({
    id: `card_${cardId}`,
    label: huntClubBbsExposeOptionLabel(state, cardId),
    value: cardId,
  }));
  if (options.length === 0)
    throw new Error("Hunt Club BBS findet keine installierte verdeckte Korp-Karte.");
  state.pendingChoice = {
    choiceId: `v1912_hunt_club_bbs_expose_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1912.hunt_club_bbs_expose:${state.stateVersion + 1}`,
    prompt: "Bis zu drei installierte Korp-Karten exposen",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: Math.min(3, options.length),
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose_choice",
    choiceVisibility: "runner_private",
  };
}

function startExposeInstalledCorpCardsChoice(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinition["id"],
  min: number,
  max: number,
): { publicPayload: Record<string, string | number | boolean> } {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = exposeInstalledCorpCardsChoiceOptions(state);
  if (options.length === 0)
    throw new Error("Es gibt keine installierte verdeckte Korp-Karte.");
  state.pendingChoice = {
    choiceId: `p3_36_expose_installed_cards_${state.stateVersion + 1}`,
    side: "runner",
    source: `p3_36.expose_installed_cards:${sourceCardId}:${sourceDefinitionId}:${state.stateVersion + 1}`,
    prompt: "Bis zu drei installierte Korp-Karten exposen",
    kind: "select_cards",
    options,
    minSelections: Math.min(min, options.length),
    maxSelections: Math.min(max, options.length),
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose_choice",
    choiceVisibility: "runner_private",
    sourceDefinitionId,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

function resolveHuntClubBbsExposeChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1912.hunt_club_bbs_expose"))
    throw new Error("Es ist keine Hunt-Club-BBS-Expose-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const legalTargets = new Set(huntClubBbsExposeTargets(state));
  for (const cardId of selectedIds) {
    if (!legalTargets.has(cardId))
      throw new Error("Hunt Club BBS darf dieses Ziel nicht exposen.");
  }
  const labels = selectedIds.map((cardId) =>
    huntClubBbsExposeOptionLabel(state, cardId),
  );
  const definitionIds = selectedIds.map((cardId) => definitionFor(state, cardId).id);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose",
    publicRevealKind: "expose",
    revealedCount: selectedIds.length,
    publicRevealDefinitionIds: definitionIds.join(","),
    exposedServerLabels: labels.join(","),
  };
}

function resolveExposeInstalledCorpCardsChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_36.expose_installed_cards"))
    throw new Error("Es ist keine Expose-Choice offen.");
  const [, sourceCardId = "", sourceDefinitionId = ""] = choice.source.split(":");
  if (!sourceCardId || !state.cardInstances[sourceCardId])
    throw new Error("Die Expose-Quelle ist nicht mehr installiert.");
  const sourceDefinition = definitionFor(state, sourceCardId);
  if (sourceDefinition.id !== sourceDefinitionId)
    throw new Error("Die Expose-Quelle passt nicht mehr zur Choice.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const legalTargets = new Set(exposeInstalledCorpCardTargets(state, "any_installed"));
  for (const cardId of selectedIds) {
    if (!legalTargets.has(cardId))
      throw new Error("Diese installierte Korp-Karte darf nicht exposed werden.");
  }
  const labels = selectedIds.map((cardId) =>
    exposeInstalledCorpCardLabel(state, cardId),
  );
  const definitions = selectedIds.map((cardId) => definitionFor(state, cardId));
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose",
    publicRevealKind: "expose",
    sourceDefinitionId,
    sourceTitle: sourceDefinition.title,
    revealedCount: selectedIds.length,
    publicRevealDefinitionIds: definitions
      .map((definition) => definition.id)
      .join(","),
    publicRevealTitles: definitions
      .map((definition) => definition.title)
      .join("||"),
    exposedServerLabels: labels.join(","),
  };
}

function outermostIceExposures(
  state: GameState,
): Array<{ server: CorpServer; cardId: CardInstanceId }> {
  return state.corp.servers
    .filter((server) => server.ice.length > 0)
    .map((server) => ({
      server,
      cardId: server.ice[outermostIceIndex(server)]!,
    }));
}

function exposeOutermostIceOfEachDataFort(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId?: CardInstanceId,
  sourceDefinitionId?: CardDefinition["id"],
): { publicPayload: Record<string, string | number | boolean> } {
  const exposures = outermostIceExposures(state);
  if (exposures.length === 0)
    throw new Error("Es liegt kein outermost ICE zum Exposen in einem Data Fort.");
  const sourceDefinition = sourceDefinitionId
    ? DEMO_CARDS_BY_ID[sourceDefinitionId]
    : undefined;
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_expose_outermost_ice_each_data_fort",
    publicRevealKind: "expose",
    ...(sourceCardId ? { sourceCardId } : {}),
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    ...(sourceDefinition ? { sourceTitle: sourceDefinition.title } : {}),
    revealedCount: exposures.length,
    publicRevealDefinitionIds: exposures
      .map(({ cardId }) => definitionFor(state, cardId).id)
      .join(","),
    exposedServerIds: exposures.map(({ server }) => server.id).join(","),
    exposedServerLabels: exposures.map(({ server }) => server.label).join(","),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}


  return {
    hiddenZoneSearchHandlerHostBase,
    hiddenZoneSearchActivationTargetHost,
    hiddenZoneSearchChoiceHandlerHost,
    hiddenZoneSearchActivationHandlerHost,
    hiddenZoneArrangeChoiceHandlerHost,
    hiddenZoneNonSearchChoiceHandlerHost,
    corpZoneChoiceHandlerHost,
    pendingChoiceResolutionHost,
    setupMulliganChoice,
    discardChoice,
    resolveDiscardChoice,
    resolveSetupMulliganChoice,
    takeSetupMulligan,
    installRunnerProgramFromStackWithoutClick,
    canInstallRunnerProgramFromZone,
    installRunnerProgramFromZoneWithoutClick,
    startSelfModifyingCodeFreeMuChoice,
    installRunnerProgramForFree,
    startAnonymousTipDerezBlackIceChoice,
    resolveAnonymousTipDerezBlackIceChoice,
    startCoreCommandJettisonIceChoice,
    resolveCoreCommandJettisonIceChoice,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    startForgedActivationOrdersTargetChoice,
    resolveForgedActivationOrdersTargetChoice,
    resolveForgedActivationOrdersCorpChoice,
    startSecurityCodeWormChipTrashIceChoice,
    resolveSecurityCodeWormChipTrashIceChoice,
    startOpenEndedMileageProgramReturnChoice,
    resolveOpenEndedMileageProgramReturnChoice,
    corpAgendaPointTotal,
    chooseCorpAgendasForPointCost,
    startRunnerHostingChoice,
    resolveRunnerHostingChoice,
    resolveIncubatorTransformChoice,
    resolveChimeraDaemonTrashChoice,
    resolveCardImplementationAccessPaymentChoice,
    resolveProteusRunnerProgramReturnChoice,
    selectedChoiceCardIds,
    iceChoiceLabelForSide,
    resolveP358HiddenReplacementChoice,
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    installedRunnerConnectionIds,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    selectedChoiceCardIdsForChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolvePlayfulAiDiceLoopEvent,
    startV1921PlayfulAiChoice,
    creditTextForPrompt,
    diePromptText,
    playfulAiSplitOptions,
    parsePlayfulAiChoiceSource,
    parsePlayfulAiSplit,
    continueV1921PlayfulAiLoop,
    resolveV1921PlayfulAiChoice,
    shuffleRunnerStack,
    revealRunnerStackTop,
    revealCorpRdTop,
    resolveV1911RunnerHiddenZoneAbility,
    resolveV1911CorporateDownsizing,
    exposedCorpCardInServer,
    exposeCorpCardInServer,
    installedCorpCardServerContext,
    exposeInstalledCorpCardTargets,
    exposeInstalledCorpCardLabel,
    exposeInstalledCorpCardForImplementation,
    installedRunnerIcebreakerIds,
    addCounterToAllInstalledRunnerIcebreakers,
    shuffleCorpCardIntoRd,
    trashCorpInstalledCardsInScoredSourceServer,
    resolveDealWithMilitech,
    huntClubBbsExposeTargets,
    huntClubBbsExposeOptionLabel,
    exposeInstalledCorpCardsChoiceOptions,
    startHuntClubBbsExposeChoice,
    startExposeInstalledCorpCardsChoice,
    resolveHuntClubBbsExposeChoice,
    resolveExposeInstalledCorpCardsChoice,
    outermostIceExposures,
    exposeOutermostIceOfEachDataFort
  };
}
