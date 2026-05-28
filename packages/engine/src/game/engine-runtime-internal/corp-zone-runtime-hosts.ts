// @ts-nocheck
import { runtimeBinding } from "./runtime-shared";
import type { RuntimeDeps } from "./runtime-shared";

export function createCorpZoneRuntimeHosts(
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
    canInstallRunnerProgramFromZone,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    continueV1921PlayfulAiLoop,
    creditTextForPrompt,
    diePromptText,
    discardChoice,
    hiddenZoneArrangeChoiceHandlerHost,
    hiddenZoneNonSearchChoiceHandlerHost,
    hiddenZoneSearchActivationHandlerHost,
    hiddenZoneSearchActivationTargetHost,
    hiddenZoneSearchChoiceHandlerHost,
    hiddenZoneSearchHandlerHostBase,
    iceChoiceLabelForSide,
    installRunnerProgramForFree,
    installRunnerProgramFromStackWithoutClick,
    installRunnerProgramFromZoneWithoutClick,
    installedRunnerConnectionIds,
    parsePlayfulAiChoiceSource,
    parsePlayfulAiSplit,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    pendingChoiceResolutionHost,
    playfulAiSplitOptions,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    resolveAnonymousTipDerezBlackIceChoice,
    resolveCardImplementationAccessPaymentChoice,
    resolveChimeraDaemonTrashChoice,
    resolveCoreCommandJettisonIceChoice,
    resolveDiscardChoice,
    resolveForgedActivationOrdersCorpChoice,
    resolveForgedActivationOrdersTargetChoice,
    resolveIncubatorTransformChoice,
    resolveOpenEndedMileageProgramReturnChoice,
    resolveP358HiddenReplacementChoice,
    resolvePlayfulAiDiceLoopEvent,
    resolveProteusRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveSecurityCodeWormChipTrashIceChoice,
    resolveSetupMulliganChoice,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    resolveV1911RunnerHiddenZoneAbility,
    resolveV1921PlayfulAiChoice,
    revealCorpRdTop,
    revealRunnerStackTop,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    setupMulliganChoice,
    shuffleRunnerStack,
    startAnonymousTipDerezBlackIceChoice,
    startCoreCommandJettisonIceChoice,
    startForgedActivationOrdersTargetChoice,
    startOpenEndedMileageProgramReturnChoice,
    startRunnerHostingChoice,
    startSecurityCodeWormChipTrashIceChoice,
    startSelfModifyingCodeFreeMuChoice,
    startV1921PlayfulAiChoice,
    takeSetupMulligan,
  } = new Proxy(
    {},
    { get: (_target, property) => runtimeBinding(runtime, property) },
  ) as any;

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

  function corpAgendaPointTotal(state: GameState): number {
    const scoredPoints = state.corp.scoreArea.reduce(
      (sum, cardId) => sum + agendaPointsForScoredCard(state, cardId),
      0,
    );
    return (
      scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
    );
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
      throw new Error(
        "Diese installierte Korp-Karte kann nicht exposed werden.",
      );
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
      .filter((cardId) =>
        cardHasSubtype(definitionFor(state, cardId), "icebreaker"),
      )
      .sort();
  }

  function addCounterToAllInstalledRunnerIcebreakers(
    state: GameState,
    counterType: CounterType,
    amount: number,
  ): {
    amount: number;
    counterType: Extract<CounterType, "militech" | "pattel_antibody">;
    countersAfter: number;
    publicPayload: Record<string, string | number | boolean>;
  } {
    if (counterType !== "militech" && counterType !== "pattel_antibody")
      throw new Error("Dieser Icebreaker-Counter-Typ wird nicht unterstuetzt.");
    const targetIds = installedRunnerIcebreakerIds(state);
    for (const cardId of targetIds)
      addCardCounter(state, cardId, counterType, amount);
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
      throw new Error(
        "Die gescorte Agenda hat keinen gueltigen Installationsserver.",
      );
    const server = mustServer(
      state,
      serverId as Exclude<ServerId, "new_remote">,
    );
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
      throw new Error(
        "Deal with Militech benoetigt eine befreite Research-Agenda in diesem Zug.",
      );
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
    return exposeInstalledCorpCardTargets(state, "any_installed").map(
      (cardId) => ({
        id: `card_${cardId}`,
        label: exposeInstalledCorpCardLabel(state, cardId),
        value: cardId,
      }),
    );
  }

  function startHuntClubBbsExposeChoice(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const options = huntClubBbsExposeTargets(state).map((cardId) => ({
      id: `card_${cardId}`,
      label: huntClubBbsExposeOptionLabel(state, cardId),
      value: cardId,
    }));
    if (options.length === 0)
      throw new Error(
        "Hunt Club BBS findet keine installierte verdeckte Korp-Karte.",
      );
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
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
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
    const definitionIds = selectedIds.map(
      (cardId) => definitionFor(state, cardId).id,
    );
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
    const [, sourceCardId = "", sourceDefinitionId = ""] =
      choice.source.split(":");
    if (!sourceCardId || !state.cardInstances[sourceCardId])
      throw new Error("Die Expose-Quelle ist nicht mehr installiert.");
    const sourceDefinition = definitionFor(state, sourceCardId);
    if (sourceDefinition.id !== sourceDefinitionId)
      throw new Error("Die Expose-Quelle passt nicht mehr zur Choice.");
    const selectedIds = selectedChoiceCardIds(choice, playerAction);
    const legalTargets = new Set(
      exposeInstalledCorpCardTargets(state, "any_installed"),
    );
    for (const cardId of selectedIds) {
      if (!legalTargets.has(cardId))
        throw new Error(
          "Diese installierte Korp-Karte darf nicht exposed werden.",
        );
    }
    const labels = selectedIds.map((cardId) =>
      exposeInstalledCorpCardLabel(state, cardId),
    );
    const definitions = selectedIds.map((cardId) =>
      definitionFor(state, cardId),
    );
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
      throw new Error(
        "Es liegt kein outermost ICE zum Exposen in einem Data Fort.",
      );
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
      exposedServerLabels: exposures
        .map(({ server }) => server.label)
        .join(","),
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...payload,
    };
    return { publicPayload: payload };
  }

  return {
    addCounterToAllInstalledRunnerIcebreakers,
    chooseCorpAgendasForPointCost,
    corpAgendaPointTotal,
    corpZoneChoiceHandlerHost,
    exposeCorpCardInServer,
    exposeInstalledCorpCardForImplementation,
    exposeInstalledCorpCardLabel,
    exposeInstalledCorpCardTargets,
    exposeInstalledCorpCardsChoiceOptions,
    exposeOutermostIceOfEachDataFort,
    exposedCorpCardInServer,
    huntClubBbsExposeOptionLabel,
    huntClubBbsExposeTargets,
    installedCorpCardServerContext,
    installedRunnerIcebreakerIds,
    outermostIceExposures,
    resolveDealWithMilitech,
    resolveExposeInstalledCorpCardsChoice,
    resolveHuntClubBbsExposeChoice,
    resolveV1911CorporateDownsizing,
    shuffleCorpCardIntoRd,
    startExposeInstalledCorpCardsChoice,
    startHuntClubBbsExposeChoice,
    trashCorpInstalledCardsInScoredSourceServer,
  };
}
