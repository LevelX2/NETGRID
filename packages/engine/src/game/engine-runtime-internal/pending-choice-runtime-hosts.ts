// @ts-nocheck
import { runtimeProxy } from "./runtime-shared";
import type { RuntimeDeps } from "./runtime-shared";

export function createPendingChoiceRuntimeHosts(
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
    continueRun,
    corpUtilityImplementationForCard,
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
    resolveFortHqReplacementChoice,
    resolveHammerStealthLossChoice,
    resolvePdcaDamageReplacementChoice,
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
    resolveSenatorialFieldTripChoice,
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
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE:
      runnerInstalledConnectionTrashBadPublicityChoiceSource,
    addCounterToAllInstalledRunnerIcebreakers,
    canInstallRunnerProgramFromZone,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    chooseCorpAgendasForPointCost,
    continueRandomDiceLoop,
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
    multiExposeInstalledCorpCardOptionLabel,
    multiExposeInstalledCorpCardTargets,
    iceChoiceLabelForSide,
    installRunnerProgramForFree,
    installRunnerProgramFromStackWithoutClick,
    installRunnerProgramFromZoneWithoutClick,
    installedCorpCardServerContext,
    installedRunnerConnectionIds,
    installedRunnerIcebreakerIds,
    outermostIceExposures,
    parseRandomDiceSplitChoiceSource,
    parseRandomDiceSplit,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    randomDiceSplitOptions,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    resolveDerezRezzedBlackIceChoice,
    resolveCardImplementationAccessPaymentChoice,
    resolveChimeraDaemonTrashChoice,
    resolvePayRezCostToTrashRezzedIceChoice,
    resolveRunnerIcebreakerCounterEvent,
    resolveExposeInstalledCorpCardsChoice,
    resolveExposePreventionChoice,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
    resolveGripInstallTemporaryCreditChoice,
    resolveMultiExposeInstalledCorpCardsChoice,
    resolveIncubatorTransformChoice,
    resolvePaidSourceReturnToGripChoice,
    resolveP358HiddenReplacementChoice,
    resolveRandomDiceLoopEvent,
    resolveRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveTrashUnrezzedIceChoice,
    resolveStackInstallRunCleanupChoice,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    resolveScoredAgendaCorpRdTopReveal,
    resolveV1911RunnerHiddenZoneAbility,
    resolveRandomDiceSplitChoice,
    revealCorpRdTop,
    revealRunnerStackTop,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    shuffleCorpCardIntoRd,
    shuffleRunnerStack,
    startDerezRezzedBlackIceChoice,
    startPayRezCostToTrashRezzedIceChoice,
    startExposeInstalledCorpCardsChoice,
    startCorpChoiceRezOrTrashIceChoice,
    startMultiExposeInstalledCorpCardsChoice,
    startPaidSourceReturnToGripChoice,
    startRunnerHostingChoice,
    startTrashUnrezzedIceChoice,
    startRunnerProgramFreeMemoryChoice,
    startRandomDiceSplitChoice,
    trashCorpInstalledCardsInScoredSourceServer,
  } = runtimeProxy<Record<string, unknown>>(runtime);

  const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE =
    runnerInstalledConnectionTrashBadPublicityChoiceSource ??
    "card_implementation.runner_installed_connection_trash_bad_publicity";

  function continueRunAfterStartOfRunFortUtility(
    state: GameState,
    legalAction?: LegalAction,
  ): void {
    const run = state.run;
    if (run) delete run.runStartInterventions;
    state.activeSide = "runner";
    let advancedFromStart = false;
    if (run && run.phase === "start") {
      const server = mustServer(state, run.attackedServerId);
      if (server.ice.length > 0) {
        const iceIndex = server.ice.length - 1;
        run.phase = "approach_ice";
        run.position = { kind: "ice", serverId: server.id, iceIndex };
        run.approachedIceId = server.ice[iceIndex];
      } else {
        run.phase = "approach_ice";
        run.position = { kind: "server", serverId: server.id };
      }
      advancedFromStart = true;
    }
    return;
  }

  function originalRunStartServerId(
    run: NonNullable<GameState["run"]>,
  ): Exclude<ServerId, "new_remote"> {
    return (
      run.runStartInterventions?.[0]?.originalServerId ?? run.attackedServerId
    );
  }

  function startRunRedirectInterventionForSource(
    run: NonNullable<GameState["run"]>,
    sourceCardId: CardInstanceId,
  ):
    | Extract<
        NonNullable<
          NonNullable<GameState["run"]>["runStartInterventions"]
        >[number],
        { kind: "start_run_redirect_to_source_fort" }
      >
    | undefined {
    return run.runStartInterventions?.find(
      (candidate) =>
        candidate.kind === "start_run_redirect_to_source_fort" &&
        candidate.sourceCardInstanceId === sourceCardId,
    );
  }

  function openRunSpendCapChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    const run = state.run;
    if (!run) throw new Error("Es laeuft kein Run fuer die Spend-Cap-Ansage.");
    const source = mustInstance(state.cardInstances, sourceCardId);
    const serverId = source.zone.serverId;
    if (serverId !== run.attackedServerId)
      throw new Error(
        "Die Spend-Cap-Quelle liegt nicht auf dem laufenden Fort.",
      );
    if (
      source.rezzed !== true ||
      corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
        "fort_start_runner_spend_cap"
    )
      throw new Error("Die Spend-Cap-Quelle ist nicht legal.");
    const maxAnnouncement = Math.max(0, Math.floor(state.runner.credits));
    state.pendingChoice = {
      choiceId: `runner_run_spend_cap_${state.stateVersion + 1}`,
      side: "runner",
      source: `corp.start_of_run_redirect.runner_spend_cap:${run.runId}:${sourceCardId}:${serverId}`,
      prompt: "Run-Bit-Ausgabe ansagen",
      kind: "select_option",
      options: Array.from({ length: maxAnnouncement + 1 }, (_, amount) => ({
        id: `spend_${amount}`,
        label: `${amount}`,
        value: amount,
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "runner";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runCreditSpendCapChoiceOpened: true,
        sourceDefinitionId: source.definitionId,
        serverId,
      };
    }
  }

  function resolveStartOfRunFortUtilityChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    const run = state.run;
    if (
      choice?.source.startsWith("corp.start_of_run_redirect.runner_spend_cap")
    ) {
      if (!run)
        throw new Error("Es laeuft kein Run fuer die Spend-Cap-Ansage.");
      const [, runId = "", sourceCardId = "", serverId = ""] =
        choice.source.split(":");
      if (run.runId !== runId || run.attackedServerId !== serverId)
        throw new Error("Die Spend-Cap-Choice passt nicht mehr zum Run.");
      const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
      const amount = Number(selected.replace(/^spend_/, ""));
      if (!Number.isInteger(amount) || amount < 0)
        throw new Error("Die Spend-Cap-Ansage ist ungueltig.");
      const source = mustInstance(state.cardInstances, sourceCardId);
      if (
        source.rezzed !== true ||
        corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
          "fort_start_runner_spend_cap"
      )
        throw new Error("Die Spend-Cap-Quelle ist nicht mehr legal.");
      run.runCreditSpendCap = {
        sourceCardInstanceId: sourceCardId as CardInstanceId,
        sourceDefinitionId: source.definitionId,
        announcedSpendCap: amount,
        spentDuringRun: 0,
      };
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        sourceDefinitionId: source.definitionId,
        runCreditSpendCap: amount,
        runCreditSpentDuringRun: 0,
      };
      continueRunAfterStartOfRunFortUtility(state, legalAction);
      return;
    }
    if (
      choice?.source.startsWith("corp.start_of_run_redirect") &&
      !choice.source.startsWith("corp.start_of_run_redirect.herman_reorder") &&
      run
    ) {
      const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
      if (selected === "pass") {
        delete state.pendingChoice;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          startOfRunRedirectDecision: "pass",
          originalServerId: originalRunStartServerId(run),
        };
        const spendCap = mustServer(state, run.attackedServerId)
          .root.slice()
          .sort()
          .find(
            (cardId) =>
              state.cardInstances[cardId]?.rezzed === true &&
              corpUtilityImplementationForCard(state, cardId)?.kind ===
                "fort_start_runner_spend_cap",
          );
        if (spendCap) {
          openRunSpendCapChoice(state, spendCap as CardInstanceId, legalAction);
          return;
        }
        continueRunAfterStartOfRunFortUtility(state, legalAction);
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
        throw new Error("Die Start-of-run-Auswahl ist ungueltig.");
      if (selected.startsWith("herman_")) {
        const server = mustServer(state, run.attackedServerId);
        const selectedSource = mustInstance(state.cardInstances, sourceCardId);
        if (
          selectedSource.rezzed !== true ||
          corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
            "fort_start_reorder_ice"
        )
          throw new Error("Die Reorder-Quelle ist nicht legal.");
        if (server.ice.length < 2) {
          delete state.pendingChoice;
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            hiddenZoneBarrier: true,
            hiddenZoneAction: "fort_ice_reorder",
            sourceDefinitionId: selectedSource.definitionId,
            serverId: server.id,
            reorderedIceCount: server.ice.length,
          };
          continueRunAfterStartOfRunFortUtility(state, legalAction);
          return;
        }
        state.pendingChoice = {
          choiceId: `fort_ice_reorder_${state.stateVersion + 1}`,
          side: "corp",
          source: `corp.start_of_run_redirect.herman_reorder:${run.runId}:${sourceCardId}:${server.id}`,
          prompt: "Wähle die ICE in der neuen Reihenfolge vor diesem Server.",
          kind: "select_cards",
          options: server.ice.map((cardId, index) => ({
            id: `card_${cardId}`,
            label:
              exposeInstalledCorpCardLabel(state, cardId) || `ICE ${index + 1}`,
            publicLabel: `ICE ${index + 1}`,
            value: cardId,
          })),
          minSelections: server.ice.length,
          maxSelections: server.ice.length,
          stateVersion: state.stateVersion + 1,
          visibility: "hidden_info_barrier",
        };
        state.activeSide = "corp";
        return;
      }
      if (selected.startsWith("obfuscated_rez_")) {
        const source = mustInstance(state.cardInstances, sourceCardId);
        const cost = rezCostForCard(state, sourceCardId);
        if (
          source.rezzed === true ||
          corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
            "fort_start_runner_spend_cap" ||
          state.corp.credits < cost
        )
          throw new Error("Die Spend-Cap-Quelle kann nicht gerezzt werden.");
        state.corp.credits -= cost;
        state.cardInstances[sourceCardId] = {
          ...source,
          rezzed: true,
          faceup: true,
        };
        delete state.pendingChoice;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          startOfRunRez: true,
          sourceCardId,
          sourceDefinitionId: source.definitionId,
          rezCostPaid: cost,
          corpCreditsAfter: state.corp.credits,
        };
        executeCardImplementationLifecycleEffects(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
          definitionFor(state, sourceCardId),
          sourceCardId,
          "on_rez",
        );
        openRunSpendCapChoice(state, sourceCardId, legalAction);
        return;
      }
      if (selected.startsWith("obfuscated_")) {
        delete state.pendingChoice;
        openRunSpendCapChoice(state, sourceCardId, legalAction);
        return;
      }
      const targetServerId = mustInstance(state.cardInstances, sourceCardId)
        .zone.serverId;
      const source = mustInstance(state.cardInstances, sourceCardId);
      const intervention = startRunRedirectInterventionForSource(
        run,
        sourceCardId,
      );
      if (
        !intervention ||
        !targetServerId ||
        targetServerId !== intervention.targetServerId ||
        source.rezzed !== true ||
        corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
          "start_run_redirect_to_source_fort"
      )
        throw new Error("Diese Redirect-Quelle ist nicht legal.");
      const availableCredits = Math.max(
        0,
        state.corp.credits -
          Math.max(
            0,
            Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
          ),
      );
      if (availableCredits < intervention.costCredits)
        throw new Error("Die Korp kann den Redirect nicht bezahlen.");
      state.corp.credits -= intervention.costCredits;
      run.attackedServerId = targetServerId;
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        startOfRunRedirectDecision: "apply",
        sourceCardId,
        sourceDefinitionId: source.definitionId,
        originalServerId: intervention.originalServerId,
        redirectedServerId: targetServerId,
        paidCredits: intervention.costCredits,
        corpCreditsAfter: state.corp.credits,
      };
      continueRunAfterStartOfRunFortUtility(state, legalAction);
      return;
    }
    if (
      choice?.source.startsWith("corp.start_of_run_redirect.herman_reorder")
    ) {
      if (!run) throw new Error("Es laeuft kein Run fuer Fort-Reorder.");
      const [, runId = "", sourceCardId = "", serverId = ""] =
        choice.source.split(":");
      if (run.runId !== runId || run.attackedServerId !== serverId)
        throw new Error("Die Reorder-Choice passt nicht mehr zum Run.");
      const selectedIds = selectedChoiceCardIds(choice, playerAction);
      const server = mustServer(state, serverId);
      if (
        selectedIds.length !== server.ice.length ||
        new Set(selectedIds).size !== selectedIds.length ||
        selectedIds.some((cardId) => !server.ice.includes(cardId))
      )
        throw new Error("Die Reorder-Auswahl ist nicht legal.");
      server.ice = selectedIds;
      for (const cardId of selectedIds) {
        state.cardInstances[cardId] = {
          ...mustInstance(state.cardInstances, cardId),
          zone: { side: "corp", zone: "serverIce", serverId: server.id },
        };
      }
      const source = mustInstance(state.cardInstances, sourceCardId);
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenOrderChoice: true,
        hiddenZoneAction: "herman_revista_reorder",
        sourceDefinitionId: source.definitionId,
        serverId,
        reorderedIceCount: selectedIds.length,
      };
      continueRunAfterStartOfRunFortUtility(state, legalAction);
      return;
    }
    throw new Error("Es ist kein Start-of-run-Fort-Utility-Fenster offen.");
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
        resolvePdcaDamageReplacementChoice,
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
        resolveMultiExposeInstalledCorpCardsChoice,
        resolveExposeInstalledCorpCardsChoice,
        resolveExposePreventionChoice,
        resolveCorpInstalledEconomyCreditChoice,
        resolveCrashEverettDrawChoice,
        resolveHardwareTrashByCounterChoice,
        resolveAdvancementPlacementChoice,
        resolveDerezRezzedBlackIceChoice,
        resolvePayRezCostToTrashRezzedIceChoice,
        resolveCorpChoiceRezOrTrashIceTargetChoice,
        resolveCorpChoiceRezOrTrashIceDecisionChoice,
        resolveTrashUnrezzedIceChoice,
        resolveRandomDiceSplitChoice,
        resolveRunnerInstalledConnectionTrashBadPublicityChoice,
        resolveGripInstallTemporaryCreditChoice,
        resolveStackInstallRunCleanupChoice,
        resolvePaidSourceReturnToGripChoice,
        resolveRunnerHostingChoice,
        resolveIncubatorTransformChoice,
        resolveVirusCounterPurgePreserveChoice,
        resolveChimeraDaemonTrashChoice,
        resolveRunnerProgramReturnChoice,
        resolveRunnerPrivateLookChoice,
        resolveSenatorialFieldTripChoice,
        resolveFortHqReplacementChoice,
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
        resolveHqIceSwapChoice,
        fortPassWindowHostForState,
        resolveSecretSpendCompareChoiceInRunModule,
        encounterSpecialWindowHostForState,
        resolveHammerStealthLossChoice,
        fortRunSideFamiliesHostForState,
        resolveActiveIceProgramTrashChoiceInRunModule,
        encounterResolutionHostForState,
        resolvePassRezzedIceProgramTrashChoiceInRunModule,
        resolveRezInterruptJackOutChoice,
        runRezWindowHostForState,
        resolveBrokenIceVirusCounterChoice,
        runEndCleanupHost,
        resolveAardvarkInterceptionChoice,
        resolveSuccessfulRunInterventionChoiceInRunModule,
        successfulRunInterventionHost,
        resolvePostMeatDamageHiddenResourceChoice,
        resolveStartOfRunFortUtilityChoice,
      },
      access: {
        resolveSuccessfulRunCreditLossSpendChoice,
        runAccessTransitionHost,
        resolvePreAccessTopRdReorderChoice,
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
