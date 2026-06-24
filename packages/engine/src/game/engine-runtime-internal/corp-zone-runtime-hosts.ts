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

export function createCorpZoneRuntimeHosts(
  deps: RuntimeDeps,
  links: ChoiceHiddenZoneRuntimeLinks,
) {
  const {
    DAILY_CREDIT_RESOURCE_SOURCE,
    BUTCHER_BOY_ID,
    COCKROACH_ID,
    ARCHIVES_TO_HQ_OPERATION_SOURCE,
    HQ_AGENDA_REVEAL_ASSET_SOURCE,
    RD_TOP5_REORDER_OPERATION_SOURCE,
    DEAL_WITH_MILITECH_ID,
    DEMO_CARDS_BY_ID,
    INITIAL_HAND_SIZE,
    MYSTERY_BOX_ID,
    RONIN_AROUND_ID,
    RUN_ACCESS_PRESSURE_EVENT_SOURCE,
    SELF_MODIFYING_CODE_ID,
    SERVER_EXPOSE_PROGRAM_SOURCES,
    PAID_STACK_SEARCH_RESOURCE_SOURCE,
    SKIVVISS_ID,
    SNEAK_PREVIEW_ID,
    STACK_SEARCH_PROGRAM_SOURCES,
    STACK_TOP_REORDER_RESOURCE_SOURCE,
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
    corpUtilityImplementationForCard,
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
    canInstallRunnerProgramFromZone,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    continueRandomDiceLoop,
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
    resolveDiscardChoice,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
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
    resolveV1911RunnerHiddenZoneAbility,
    resolveRandomDiceSplitChoice,
    revealCorpRdTop,
    revealRunnerStackTop,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    setupMulliganChoice,
    shuffleRunnerStack,
    startDerezRezzedBlackIceChoice,
    startPayRezCostToTrashRezzedIceChoice,
    startCorpChoiceRezOrTrashIceChoice,
    startPaidSourceReturnToGripChoice,
    startRunnerHostingChoice,
    startTrashUnrezzedIceChoice,
    startRunnerProgramFreeMemoryChoice,
    startRandomDiceSplitChoice,
    takeSetupMulligan,
  } = links;

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
        corpHqAgendaRevealCardId: HQ_AGENDA_REVEAL_ASSET_SOURCE,
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
            "shuffle_hq_archives_into_rd_then_draw"
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

  function resolveScoredAgendaCorpRdTopReveal(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Scored-Agenda-Aktion nutzen.");
    const sourceCardId = String(legalAction.payload?.cardId ?? "");
    if (!state.corp.scoreArea.includes(sourceCardId))
      throw new Error("Die Scored Agenda ist nicht gescort.");
    if (
      scoredAgendaKindForDefinition(definitionFor(state, sourceCardId)) !==
      "shuffle_selected_hq_agendas_into_rd_gain_credits"
    )
      throw new Error("Die Agenda-Aktion passt nicht zur Scored-Agenda-Art.");
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

  function hiddenInstalledCorpCardChoiceSlotId(cardId: CardInstanceId): string {
    let hash = 0x811c9dc5;
    for (let index = 0; index < cardId.length; index += 1) {
      hash ^= cardId.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return `hidden_${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function exposeInstalledCorpCardChoiceOptionId(
    cardId: CardInstanceId,
  ): string {
    return `card_${hiddenInstalledCorpCardChoiceSlotId(cardId)}`;
  }

  function startExposeInstalledCorpCardReviewChoice(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    targetCardId: CardInstanceId,
    scope: "inside_data_fort" | "any_installed",
  ): { publicPayload: Record<string, string | number | boolean> } {
    const targetDefinition = definitionFor(state, targetCardId);
    const sourceDefinition = DEMO_CARDS_BY_ID[sourceDefinitionId];
    const context = installedCorpCardServerContext(state, targetCardId);
    state.pendingChoice = {
      choiceId: `p3_36_expose_installed_card_review_${state.stateVersion + 1}`,
      side: "runner",
      source: `p3_36.expose_installed_card_review:${targetCardId}:${sourceCardId}:${sourceDefinitionId}:${scope}:${state.stateVersion + 1}`,
      prompt: "Karte ansehen",
      kind: "select_option",
      options: [{ id: "done", label: "Ansehen beenden", value: "done" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    state.activeSide = "runner";
    const payload = {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "expose_installed_card_review",
      publicRevealKind: "expose",
      publicRevealDefinitionId: targetDefinition.id,
      cardDefinitionId: targetDefinition.id,
      targetDefinitionId: targetDefinition.id,
      exposedCardDefinitionId: targetDefinition.id,
      exposedCardTitle: targetDefinition.title,
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
    const preventionOptions = corpInstalledCardIds(state)
      .filter((cardId) => {
        const utility = corpUtilityImplementationForCard(state, cardId);
        if (utility?.kind !== "expose_prevention") return false;
        const cost = utility.cost.kind === "credit" ? utility.cost.amount : 0;
        return state.corp.credits >= cost;
      })
      .sort();
    if (preventionOptions.length > 0) {
      state.pendingChoice = {
        choiceId: `corp_expose_prevention_${state.stateVersion + 1}`,
        side: "corp",
        source: `corp.expose_prevention:${targetCardId}:${sourceCardId}:${sourceDefinitionId}:${scope}`,
        prompt: "Expose verhindern",
        kind: "select_option",
        options: [
          { id: "pass", label: "Expose nicht verhindern" },
          ...preventionOptions.map((cardId) => ({
            id: `department_${cardId}`,
            label: `${definitionFor(state, cardId).title}: Expose verhindern`,
            publicLabel: "Expose Prevention",
            value: cardId,
          })),
        ],
        minSelections: 1,
        maxSelections: 1,
        stateVersion: state.stateVersion + 1,
        visibility: "public",
      };
      state.activeSide = "corp";
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "expose_prevention_choice",
        sourceCardId,
        sourceDefinitionId,
      };
      return { publicPayload: legalAction.payload ?? {} };
    }
    return startExposeInstalledCorpCardReviewChoice(
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      targetCardId,
      scope,
    );
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
    counterType: Extract<CounterType, "militech" | "breaker_strength_penalty">;
    countersAfter: number;
    publicPayload: Record<string, string | number | boolean>;
  } {
    if (counterType !== "militech" && counterType !== "breaker_strength_penalty")
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

  function resolveRunnerIcebreakerCounterEvent(
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

  function multiExposeInstalledCorpCardTargets(state: GameState): CardInstanceId[] {
    return exposeInstalledCorpCardTargets(state, "any_installed");
  }

  function multiExposeInstalledCorpCardOptionLabel(
    state: GameState,
    cardId: CardInstanceId,
  ): string {
    return exposeInstalledCorpCardLabel(state, cardId);
  }

  function exposeInstalledCorpCardsChoiceOptions(
    state: GameState,
    scope: "inside_data_fort" | "any_installed" = "any_installed",
  ) {
    return exposeInstalledCorpCardTargets(state, scope).map((cardId) => ({
      id: exposeInstalledCorpCardChoiceOptionId(cardId),
      label: exposeInstalledCorpCardLabel(state, cardId),
      value: cardId,
    }));
  }

  function installedCorpCardIdsInFort(
    state: GameState,
    serverId: string,
  ): CardInstanceId[] {
    const server = state.corp.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) return [];
    return [...server.root, ...server.ice]
      .filter((cardId) =>
        exposeInstalledCorpCardTargets(state, "any_installed").includes(cardId),
      )
      .sort();
  }

  function dataFortExposeChoiceOptions(state: GameState, serverId: string) {
    return installedCorpCardIdsInFort(state, serverId).map((cardId) => ({
      id: exposeInstalledCorpCardChoiceOptionId(cardId),
      label: exposeInstalledCorpCardLabel(state, cardId),
      value: cardId,
    }));
  }

  function dataFortSelectionOptions(state: GameState) {
    return [
      { id: "fort_none", label: "Keine Karten exposen", value: "none" },
      ...state.corp.servers
        .filter(
          (server) => installedCorpCardIdsInFort(state, server.id).length > 0,
        )
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((server) => ({
          id: `fort_${server.id}`,
          label: server.label,
          value: server.id,
        })),
    ];
  }

  function startMultiExposeInstalledCorpCardsChoice(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const options = multiExposeInstalledCorpCardTargets(state).map((cardId) => ({
      id: exposeInstalledCorpCardChoiceOptionId(cardId),
      label: multiExposeInstalledCorpCardOptionLabel(state, cardId),
      value: cardId,
    }));
    if (options.length === 0)
      throw new Error(
        "Die Multi-Expose-Choice findet keine installierte verdeckte Korp-Karte.",
      );
    state.pendingChoice = {
      choiceId: `card_implementation_multi_expose_installed_corp_cards_${state.stateVersion + 1}`,
      side: "runner",
      source: `card_implementation.multi_expose_installed_corp_cards:${state.stateVersion + 1}`,
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
      hiddenZoneAction: "multi_expose_installed_corp_cards_choice",
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
    scope?: "any_installed" | "inside_data_fort" | "single_data_fort",
  ): { publicPayload: Record<string, string | number | boolean> } {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    if (scope === "single_data_fort") {
      const options = dataFortSelectionOptions(state);
      if (options.length <= 1)
        throw new Error("Es gibt keine installierte verdeckte Korp-Karte.");
      state.pendingChoice = {
        choiceId: `p3_36_expose_installed_cards_fort_select_${state.stateVersion + 1}`,
        side: "runner",
        source: `p3_36.expose_installed_cards_fort_select:${sourceCardId}:${sourceDefinitionId}:${min}:${max}:${state.stateVersion + 1}`,
        prompt: "Ein Data Fort zum Exposen wählen",
        kind: "select_option",
        options,
        minSelections: 1,
        maxSelections: 1,
        stateVersion: state.stateVersion + 1,
        visibility: "hidden_info_barrier",
      };
      const payload = {
        hiddenZoneBarrier: true,
        hiddenZoneAction: "expose_installed_cards_fort_select",
        choiceVisibility: "runner_private",
        sourceDefinitionId,
      };
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...payload,
      };
      return { publicPayload: payload };
    }
    const targetScope =
      scope === "inside_data_fort" ? "inside_data_fort" : "any_installed";
    const options = exposeInstalledCorpCardsChoiceOptions(state, targetScope);
    if (options.length === 0)
      throw new Error("Es gibt keine installierte verdeckte Korp-Karte.");
    if (min === 1 && max === 1) {
      state.pendingChoice = {
        choiceId: `p3_36_expose_installed_card_${state.stateVersion + 1}`,
        side: "runner",
        source: `p3_36.expose_installed_card:${sourceCardId}:${sourceDefinitionId}:${targetScope}:${state.stateVersion + 1}`,
        prompt: "Installierte Korp-Karte exposen",
        kind: "select_cards",
        options,
        minSelections: 1,
        maxSelections: 1,
        stateVersion: state.stateVersion + 1,
        visibility: "hidden_info_barrier",
      };
      const payload = {
        hiddenZoneBarrier: true,
        hiddenZoneAction: "expose_installed_card_choice",
        choiceVisibility: "runner_private",
        sourceDefinitionId,
      };
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...payload,
      };
      return { publicPayload: payload };
    }
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
      hiddenZoneAction: "multi_expose_installed_corp_cards_choice",
      choiceVisibility: "runner_private",
      sourceDefinitionId,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...payload,
    };
    return { publicPayload: payload };
  }

  function resolveMultiExposeInstalledCorpCardsChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("card_implementation.multi_expose_installed_corp_cards"))
      throw new Error("Es ist keine Multi-Expose-Choice offen.");
    const selectedIds = selectedChoiceCardIds(choice, playerAction);
    const legalTargets = new Set(multiExposeInstalledCorpCardTargets(state));
    for (const cardId of selectedIds) {
      if (!legalTargets.has(cardId))
        throw new Error("Diese Multi-Expose-Choice darf dieses Ziel nicht exposen.");
    }
    const labels = selectedIds.map((cardId: CardInstanceId) =>
      multiExposeInstalledCorpCardOptionLabel(state, cardId),
    );
    const definitionIds = selectedIds.map(
      (cardId: CardInstanceId) => definitionFor(state, cardId).id,
    );
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "multi_expose_installed_corp_cards",
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
    if (choice?.source.startsWith("p3_36.expose_installed_card_review:")) {
      const [, targetCardId = "", sourceCardId = "", sourceDefinitionId = ""] =
        choice.source.split(":");
      if (!targetCardId || !state.cardInstances[targetCardId])
        throw new Error("Die angezeigte Korp-Karte ist nicht mehr vorhanden.");
      if (!sourceCardId || !state.cardInstances[sourceCardId])
        throw new Error("Die Expose-Quelle ist nicht mehr installiert.");
      const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
      if (selected !== "done")
        throw new Error("Diese Expose-Ansicht kann nur beendet werden.");
      delete state.pendingChoice;
      state.activeSide = "runner";
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "expose_installed_card_finish",
        sourceCardId,
        sourceDefinitionId,
      };
      return;
    }
    if (
      !choice ||
      (!choice.source.startsWith("p3_36.expose_installed_card:") &&
        !choice.source.startsWith("p3_36.expose_installed_cards"))
    )
      throw new Error("Es ist keine Expose-Choice offen.");
    if (choice.source.startsWith("p3_36.expose_installed_card:")) {
      const [
        ,
        sourceCardId = "",
        sourceDefinitionId = "",
        scopeText = "any_installed",
      ] = choice.source.split(":");
      if (!sourceCardId || !state.cardInstances[sourceCardId])
        throw new Error("Die Expose-Quelle ist nicht mehr installiert.");
      const sourceDefinition = definitionFor(state, sourceCardId);
      if (sourceDefinition.id !== sourceDefinitionId)
        throw new Error("Die Expose-Quelle passt nicht mehr zur Choice.");
      const selectedIds = selectedChoiceCardIds(choice, playerAction);
      if (selectedIds.length !== 1)
        throw new Error(
          "Es muss genau eine installierte Korp-Karte gewählt werden.",
        );
      const scope =
        scopeText === "inside_data_fort" ? "inside_data_fort" : "any_installed";
      const targetCardId = selectedIds[0];
      const legalTargets = new Set(
        exposeInstalledCorpCardTargets(state, scope),
      );
      if (!targetCardId || !legalTargets.has(targetCardId))
        throw new Error(
          "Diese installierte Korp-Karte darf nicht exposed werden.",
        );
      delete state.pendingChoice;
      exposeInstalledCorpCardForImplementation(
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        targetCardId,
        scope,
      );
      return;
    }
    if (choice.source.startsWith("p3_36.expose_installed_cards_fort_select")) {
      const [
        ,
        sourceCardId = "",
        sourceDefinitionId = "",
        minText = "0",
        maxText = "0",
      ] = choice.source.split(":");
      if (!sourceCardId || !state.cardInstances[sourceCardId])
        throw new Error("Die Expose-Quelle ist nicht mehr installiert.");
      const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
      if (selected === "fort_none") {
        delete state.pendingChoice;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "expose_installed_cards_single_fort",
          publicRevealKind: "expose",
          sourceDefinitionId,
          revealedCount: 0,
        };
        return;
      }
      const serverId = selected.replace(/^fort_/, "");
      if (!state.corp.servers.some((server) => server.id === serverId))
        throw new Error("Dieses Data Fort kann nicht gewählt werden.");
      const options = dataFortExposeChoiceOptions(state, serverId);
      if (options.length === 0)
        throw new Error("Dieses Data Fort enthält keine legalen Expose-Ziele.");
      const max = Math.max(0, Math.floor(Number(maxText)));
      const min = Math.max(0, Math.floor(Number(minText)));
      state.pendingChoice = {
        choiceId: `p3_36_expose_installed_cards_single_fort_${state.stateVersion + 1}`,
        side: "runner",
        source: `p3_36.expose_installed_cards:single_data_fort:${serverId}:${sourceCardId}:${sourceDefinitionId}:${state.stateVersion + 1}`,
        prompt: "Installierte Korp-Karten in diesem Fort exposen",
        kind: "select_cards",
        options,
        minSelections: Math.min(min, options.length),
        maxSelections: Math.min(max, options.length),
        stateVersion: state.stateVersion + 1,
        visibility: "hidden_info_barrier",
      };
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "expose_installed_cards_single_fort_choice",
        choiceVisibility: "runner_private",
        sourceDefinitionId,
        serverId,
      };
      return;
    }
    if (
      choice.source.startsWith("p3_36.expose_installed_cards:single_data_fort")
    ) {
      const [, , serverId = "", sourceCardId = "", sourceDefinitionId = ""] =
        choice.source.split(":");
      if (!sourceCardId || !state.cardInstances[sourceCardId])
        throw new Error("Die Expose-Quelle ist nicht mehr installiert.");
      const sourceDefinition = definitionFor(state, sourceCardId);
      if (sourceDefinition.id !== sourceDefinitionId)
        throw new Error("Die Expose-Quelle passt nicht mehr zur Choice.");
      const selectedIds = selectedChoiceCardIds(choice, playerAction);
      const legalTargets = new Set(installedCorpCardIdsInFort(state, serverId));
      for (const cardId of selectedIds) {
        if (!legalTargets.has(cardId))
          throw new Error(
            "Diese installierte Korp-Karte darf in diesem Fort nicht exposed werden.",
          );
      }
      const labels = selectedIds.map((cardId: CardInstanceId) =>
        exposeInstalledCorpCardLabel(state, cardId),
      );
      const definitions = selectedIds.map((cardId: CardInstanceId) =>
        definitionFor(state, cardId),
      );
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "expose_installed_cards_single_fort",
        publicRevealKind: "expose",
        sourceDefinitionId,
        sourceTitle: sourceDefinition.title,
        serverId,
        revealedCount: selectedIds.length,
        publicRevealDefinitionIds: definitions
          .map((definition: CardDefinition) => definition.id)
          .join(","),
        publicRevealTitles: definitions
          .map((definition: CardDefinition) => definition.title)
          .join("||"),
        exposedServerLabels: labels.join(","),
      };
      return;
    }
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
    const labels = selectedIds.map((cardId: CardInstanceId) =>
      exposeInstalledCorpCardLabel(state, cardId),
    );
    const definitions = selectedIds.map((cardId: CardInstanceId) =>
      definitionFor(state, cardId),
    );
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "multi_expose_installed_corp_cards",
      publicRevealKind: "expose",
      sourceDefinitionId,
      sourceTitle: sourceDefinition.title,
      revealedCount: selectedIds.length,
      publicRevealDefinitionIds: definitions
        .map((definition: CardDefinition) => definition.id)
        .join(","),
      publicRevealTitles: definitions
        .map((definition: CardDefinition) => definition.title)
        .join("||"),
      exposedServerLabels: labels.join(","),
    };
  }

  function resolveExposePreventionChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("corp.expose_prevention"))
      throw new Error("Es ist keine Expose-Prevention-Choice offen.");
    const [
      targetCardId = "",
      exposeSourceCardId = "",
      exposeSourceDefinitionId = "",
      scopeText = "any_installed",
    ] = choice.source.slice("corp.expose_prevention:".length).split(":");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    if (selected === "pass") {
      delete state.pendingChoice;
      const scope =
        scopeText === "inside_data_fort" ? "inside_data_fort" : "any_installed";
      const previousPayload = legalAction.payload ?? {};
      startExposeInstalledCorpCardReviewChoice(
        state,
        legalAction,
        exposeSourceCardId,
        exposeSourceDefinitionId,
        targetCardId,
        scope,
      );
      legalAction.payload = {
        ...previousPayload,
        ...(legalAction.payload ?? {}),
        exposePreventionDecision: "pass",
      };
      return;
    }
    const option = choice.options.find(
      (candidate) => candidate.id === selected,
    );
    const sourceCardId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    if (!sourceCardId)
      throw new Error("Die Expose-Prevention-Auswahl ist ungueltig.");
    const source = state.cardInstances[sourceCardId];
    const utility = corpUtilityImplementationForCard(state, sourceCardId);
    if (!source || utility?.kind !== "expose_prevention")
      throw new Error("Die Expose-Prevention-Quelle ist nicht mehr legal.");
    const cost = utility.cost.kind === "credit" ? utility.cost.amount : 0;
    if (state.corp.credits < cost)
      throw new Error("Die Korp kann Expose Prevention nicht bezahlen.");
    spendCredits(state, "corp", cost);
    state.cardInstances[sourceCardId] = {
      ...source,
      faceup: true,
      rezzed: true,
    };
    delete state.pendingChoice;
    state.activeSide = "runner";
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      exposePreventionDecision: "use",
      sourceCardId,
      sourceDefinitionId: source.definitionId,
      paidCredits: cost,
      corpCreditsAfter: state.corp.credits,
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
    multiExposeInstalledCorpCardOptionLabel,
    multiExposeInstalledCorpCardTargets,
    installedCorpCardServerContext,
    installedRunnerIcebreakerIds,
    outermostIceExposures,
    resolveRunnerIcebreakerCounterEvent,
    resolveExposePreventionChoice,
    resolveExposeInstalledCorpCardsChoice,
    resolveMultiExposeInstalledCorpCardsChoice,
    resolveScoredAgendaCorpRdTopReveal,
    shuffleCorpCardIntoRd,
    startExposeInstalledCorpCardsChoice,
    startMultiExposeInstalledCorpCardsChoice,
    trashCorpInstalledCardsInScoredSourceServer,
  };
}
