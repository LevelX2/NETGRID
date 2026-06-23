// @ts-nocheck
import { runtimeProxy } from "./runtime-shared";
import type { RuntimeDeps } from "./runtime-shared";

export function createHiddenZoneNonSearchRuntime(
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
    resolveVirusCounterPurgePreserveChoice,
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
    resolveHqIceSwapChoice,
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
    addCounterToAllInstalledRunnerIcebreakers,
    canInstallRunnerProgramFromZone,
    chooseCorpAgendasForPointCost,
    corpAgendaPointTotal,
    corpZoneChoiceHandlerHost,
    discardChoice,
    exposeCorpCardInServer,
    exposeInstalledCorpCardForImplementation,
    exposeInstalledCorpCardLabel,
    exposeInstalledCorpCardTargets,
    exposeInstalledCorpCardsChoiceOptions,
    exposeOutermostIceOfEachDataFort,
    exposedCorpCardInServer,
    hiddenZoneArrangeChoiceHandlerHost,
    hiddenZoneSearchActivationHandlerHost,
    hiddenZoneSearchActivationTargetHost,
    hiddenZoneSearchChoiceHandlerHost,
    hiddenZoneSearchHandlerHostBase,
    multiExposeInstalledCorpCardOptionLabel,
    multiExposeInstalledCorpCardTargets,
    installRunnerProgramForFree,
    installRunnerProgramFromStackWithoutClick,
    installRunnerProgramFromZoneWithoutClick,
    installedCorpCardServerContext,
    installedRunnerIcebreakerIds,
    outermostIceExposures,
    pendingChoiceResolutionHost,
    resolveDealWithMilitech,
    resolveDiscardChoice,
    resolveExposeInstalledCorpCardsChoice,
    resolveMultiExposeInstalledCorpCardsChoice,
    resolveP358HiddenReplacementChoice,
    resolveSetupMulliganChoice,
    resolveV1911CorporateDownsizing,
    resolveV1911RunnerHiddenZoneAbility,
    revealCorpRdTop,
    revealRunnerStackTop,
    setupMulliganChoice,
    shuffleCorpCardIntoRd,
    shuffleRunnerStack,
    startExposeInstalledCorpCardsChoice,
    startMultiExposeInstalledCorpCardsChoice,
    startSelfModifyingCodeFreeMuChoice,
    takeSetupMulligan,
    trashCorpInstalledCardsInScoredSourceServer,
  } = runtimeProxy<Record<string, unknown>>(runtime);

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
          const implementation =
            uniqueDirectLongtailImplementationForDefinition(
              definitionFor(state, cardId).id,
            );
          return implementation?.kind ===
            "start_turn_trash_for_credits"
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
            { secretSpendGuessRunAutoPassIceId: iceId },
            legalAction,
          ),
      },
    };
  }

  function startDerezRezzedBlackIceChoice(
    state: GameState,
    sourceCardId: string,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const targets = rezzedBlackIceIds(state);
    if (targets.length === 0)
      throw new Error("Keine gerezzte Black ICE als Ziel.");
    state.pendingChoice = {
      choiceId: `card_implementation_derez_rezzed_black_ice_${state.stateVersion + 1}`,
      side: "runner",
      source: `card_implementation.derez_rezzed_black_ice:${sourceCardId}`,
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

  function resolveDerezRezzedBlackIceChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("card_implementation.derez_rezzed_black_ice")
    )
      throw new Error("Es ist keine Derez-Black-ICE-Choice offen.");
    const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
    if (!selectedId || !rezzedBlackIceIds(state).includes(selectedId))
      throw new Error("Das Ziel ist keine gerezzte Black ICE.");
    const targetDefinition = definitionFor(state, selectedId);
    state.cardInstances[selectedId] = {
      ...withoutVariableIceState(mustInstance(state.cardInstances, selectedId)),
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

  function startPayRezCostToTrashRezzedIceChoice(
    state: GameState,
    sourceCardId: string,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const targets = affordableRezzedInstalledIceIdsForRunner(state);
    if (targets.length === 0)
      throw new Error(
        "Keine bezahlbare gerezzte ICE als Ziel.",
      );
    state.pendingChoice = {
      choiceId: `card_implementation_pay_rez_cost_trash_rezzed_ice_${state.stateVersion + 1}`,
      side: "runner",
      source: `card_implementation.pay_rez_cost_trash_rezzed_ice:${sourceCardId}:${state.stateVersion + 1}`,
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

  function resolvePayRezCostToTrashRezzedIceChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("card_implementation.pay_rez_cost_trash_rezzed_ice"))
      throw new Error("Es ist keine Pay-Rez-Cost-Trash-Choice offen.");
    if (!hasSuccessfulHqRunThisTurn(state))
      throw new Error(
        "Diese Choice benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
      );
    const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
    if (!selectedId || !rezzedInstalledIceIds(state).includes(selectedId))
      throw new Error(
        "Das Ziel ist keine gerezzte installierte ICE.",
      );
    const rezCost = rezCostForCard(state, selectedId);
    if (state.runner.credits < rezCost)
      throw new Error(
        "Der Runner kann die Rez-Kosten fuer diese Choice nicht zahlen.",
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
      v1922RunnerEventAbility:
        "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
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

  function startCorpChoiceRezOrTrashIceChoice(
    state: GameState,
    sourceCardId: string,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const targets = unrezzedInstalledIceIds(state);
    if (targets.length === 0)
      throw new Error(
        "Keine unrezzte ICE als Ziel.",
      );
    state.pendingChoice = {
      choiceId: `card_implementation_corp_choice_rez_or_trash_ice_target_${state.stateVersion + 1}`,
      side: "runner",
      source: `card_implementation.corp_choice_rez_or_trash_ice_target:${sourceCardId}:${state.stateVersion + 1}`,
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

  function resolveCorpChoiceRezOrTrashIceTargetChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("card_implementation.corp_choice_rez_or_trash_ice_target")
    )
      throw new Error(
        "Es ist keine Rez-oder-Trash-Ziel-Choice offen.",
      );
    const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
    if (!selectedId || !unrezzedInstalledIceIds(state).includes(selectedId))
      throw new Error(
        "Das Ziel ist keine installierte unrezzte ICE.",
      );
    const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
    const icePositionLabel =
      publicIcePositionLabelForCard(state, selectedId) ?? serverLabel;
    const choiceTargetLabel = icePositionLabel || "ICE";
    state.pendingChoice = {
      choiceId: `card_implementation_corp_choice_rez_or_trash_ice_decision_${state.stateVersion + 1}`,
      side: "corp",
      source: `card_implementation.corp_choice_rez_or_trash_ice_decision:${selectedId}:${state.stateVersion + 1}`,
      prompt: `Rez-oder-Trash-Entscheidung: ${choiceTargetLabel} rezzen oder trashen`,
      kind: "select_option",
      options: [
        ...(!mustInstance(state.cardInstances, selectedId).rezzed &&
        state.corp.credits >= rezCostForCard(state, selectedId)
          ? [
              {
                id: "rez_ice",
                label: `${choiceTargetLabel} rezzen`,
                publicLabel: `${choiceTargetLabel} gerezzt`,
                value: "rez_ice",
              },
            ]
          : []),
        {
          id: "trash_ice",
          label: `${choiceTargetLabel} trashen`,
          publicLabel: `${choiceTargetLabel} getrasht`,
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

  function resolveCorpChoiceRezOrTrashIceDecisionChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("card_implementation.corp_choice_rez_or_trash_ice_decision")
    )
      throw new Error(
        "Es ist keine Rez-oder-Trash-Korp-Choice offen.",
      );
    const [, targetIceId] = choice.source.split(":");
    if (
      !targetIceId ||
      !corpInstalledCardIds(state).includes(targetIceId) ||
      mustInstance(state.cardInstances, targetIceId).zone.zone !== "serverIce"
    )
      throw new Error(
        "Das Ziel ist nicht mehr installierte ICE.",
      );
    if (mustInstance(state.cardInstances, targetIceId).rezzed)
      throw new Error(
        "Das Ziel ist nicht mehr unrezzte ICE.",
      );
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    const definition = definitionFor(state, targetIceId);
    const serverLabel =
      publicServerLabelForCard(state, targetIceId) ?? "Server";
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
        "Die Rez-oder-Trash-Korp-Entscheidung ist ungueltig.",
      );
    const targetWasKnownToRunner =
      mustInstance(state.cardInstances, targetIceId).faceup === true ||
      mustInstance(state.cardInstances, targetIceId).rezzed === true;
    trashCorpInstalledCardToArchives(state, targetIceId);
    if (!targetWasKnownToRunner) {
      state.cardInstances[targetIceId] = {
        ...mustInstance(state.cardInstances, targetIceId),
        faceup: false,
        rezzed: false,
      };
    }
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      corpDecision: "trash_ice",
      trashedCount: 1,
      ...(targetWasKnownToRunner
        ? { targetCardDefinitionId: definition.id }
        : {}),
      targetServerLabel: serverLabel,
      targetIcePositionLabel: icePositionLabel,
      targetVisibility: targetWasKnownToRunner
        ? "public_installed_ice"
        : "hidden_installed_ice_position",
    };
  }

  function startTrashUnrezzedIceChoice(
    state: GameState,
    sourceCardId: string,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const targets = unrezzedInstalledIceIds(state);
    if (targets.length === 0)
      throw new Error(
        "Keine unrezzte ICE als Ziel.",
      );
    state.pendingChoice = {
      choiceId: `card_implementation_trash_unrezzed_ice_${state.stateVersion + 1}`,
      side: "runner",
      source: `card_implementation.trash_unrezzed_ice:${sourceCardId}:${state.stateVersion + 1}`,
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

  function resolveTrashUnrezzedIceChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("card_implementation.trash_unrezzed_ice"))
      throw new Error(
        "Es ist keine Trash-Unrezzed-ICE-Choice offen.",
      );
    if (!hasSuccessfulHqRunThisTurn(state))
      throw new Error(
        "Diese Choice benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
      );
    const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
    if (!selectedId || !unrezzedInstalledIceIds(state).includes(selectedId))
      throw new Error(
        "Das Ziel ist keine unrezzte installierte ICE.",
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

  function startPaidSourceReturnToGripChoice(
    state: GameState,
    sourceCardId: string,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `card_implementation_paid_source_return_to_grip_${state.stateVersion + 1}`,
      side: "runner",
      source: `card_implementation.paid_source_return_to_grip:${sourceCardId}`,
      prompt: "Quelle zuruecknehmen?",
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

  function resolvePaidSourceReturnToGripChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("card_implementation.paid_source_return_to_grip"))
      throw new Error("Es ist keine Ruecknahme-Choice offen.");
    const [, sourceCardId] = choice.source.split(":");
    if (!sourceCardId)
      throw new Error("Die Ruecknahme-Choice hat keine Quellkarte.");
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
        throw new Error("Die Quellkarte liegt nicht im Heap.");
      if (state.runner.credits < 1)
        throw new Error(
          "Der Runner kann die Ruecknahme nicht bezahlen.",
        );
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
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
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
        throw new Error(
          "Der gewählte Karten-Counter ist nicht mehr verfügbar.",
        );
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

  function resolveRunnerProgramReturnChoice(
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

  const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE =
    "card_implementation.runner_installed_connection_trash_bad_publicity";
  const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION =
    "card_implementation_runner_installed_connection_trash_bad_publicity";

  type TrashInstalledRunnerConnectionsThenAddBadPublicityImplementation =
    Extract<
      CardRunnerEventLongtailImplementation,
      { kind: "trash_installed_runner_connections_then_add_bad_publicity" }
    >;

  function installedRunnerConnectionIds(state: GameState): CardInstanceId[] {
    return runnerInstalledCardIds(state).filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        definition.type === "resource" &&
        cardHasSubtype(definition, "connection")
      );
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
      throw new Error(
        "Es sind nicht genug installierte Connections vorhanden.",
      );
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
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
    if (
      !sourceCardId ||
      !sourceDefinitionId ||
      !Number.isInteger(count) ||
      count <= 0
    )
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
      const option = choice.options.find(
        (candidate) => candidate.id === optionId,
      );
      if (typeof option?.value !== "string")
        throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
      return option.value as CardInstanceId;
    });
  }

  function parsePro018ChoiceSource(source: string): {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    value: string;
  } {
    const [, sourceCardId = "", sourceDefinitionId = "", value = ""] =
      source.split(":");
    if (!sourceCardId || !sourceDefinitionId)
      throw new Error("Die PRO018-Choice ist ungueltig.");
    return {
      sourceCardId: sourceCardId as CardInstanceId,
      sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
      value,
    };
  }

  function installRunnerGripCardWithTemporaryCredits(
    state: GameState,
    cardId: CardInstanceId,
    temporaryCredits: number,
    legalAction: LegalAction,
  ) {
    if (!state.runner.grip.includes(cardId))
      throw new Error("Die gewaehlte Karte liegt nicht im Grip.");
    const definition = definitionFor(state, cardId);
    if (definition.type !== "program" && definition.type !== "hardware")
      throw new Error(
        "Die gewaehlte Karte ist kein Programm oder keine Hardware.",
      );
    if (
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      definition.type === "program" &&
      state.runner.memoryUsed + (definition.memoryCost ?? 0) >
        runnerMemoryLimit(state)
    )
      throw new Error("Der Runner hat nicht genug freien Speicher.");
    const installCost = definition.installCost ?? 0;
    const temporarySpent = Math.min(temporaryCredits, installCost);
    const runnerPaid = installCost - temporarySpent;
    if (state.runner.credits < runnerPaid)
      throw new Error(
        "Der Runner kann die Installationskosten nicht bezahlen.",
      );
    if (runnerPaid > 0) spendCredits(state, "runner", runnerPaid);
    removeFromAllZones(state, cardId);
    if (definition.type === "program") {
      state.runner.rig.programs.push(cardId);
      state.runner.memoryUsed += definition.memoryCost ?? 0;
    } else {
      state.runner.rig.hardware.push(cardId);
      if (definition.memoryLimitModifier)
        state.runner.memoryLimit += definition.memoryLimitModifier;
    }
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
    };
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_install",
    );
    return { definition, temporarySpent, runnerPaid };
  }

  function resolveGripInstallTemporaryCreditChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith(
        "card_implementation.pro018_grip_install_temporary_credits:",
      )
    )
      throw new Error("Es ist keine PRO018-Grip-Install-Choice offen.");
    const { sourceDefinitionId, value } = parsePro018ChoiceSource(
      choice.source,
    );
    const temporaryCredits = Math.max(0, Math.floor(Number(value)));
    const selectedIds = selectedChoiceCardIdsForChoice(choice, playerAction);
    if (selectedIds.length !== 1)
      throw new Error("Genau eine Karte muss gewaehlt werden.");
    const { definition, temporarySpent, runnerPaid } =
      installRunnerGripCardWithTemporaryCredits(
        state,
        selectedIds[0],
        temporaryCredits,
        legalAction,
      );
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "pro018_grip_install_temporary_credits",
      sourceDefinitionId,
      installedCardDefinitionId: definition.id,
      temporaryCreditsProvided: temporaryCredits,
      temporaryCreditsSpent: temporarySpent,
      temporaryCreditsReturned: temporaryCredits - temporarySpent,
      installCostPaid: runnerPaid,
      runnerCreditsAfter: state.runner.credits,
    };
  }

  function resolveStackInstallRunCleanupChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith(
        "card_implementation.pro018_stack_install_run_cleanup:",
      )
    )
      throw new Error("Es ist keine PRO018-Stack-Install-Choice offen.");
    const {
      sourceCardId,
      sourceDefinitionId,
      value: serverIdRaw,
    } = parsePro018ChoiceSource(choice.source);
    const selectedIds = selectedChoiceCardIdsForChoice(choice, playerAction);
    if (selectedIds.length !== 1)
      throw new Error("Genau ein Programm muss gewaehlt werden.");
    const selectedId = selectedIds[0];
    const definition = definitionFor(state, selectedId);
    const installCostPenalty = definition.installCost ?? 0;
    const installed = installRunnerProgramFromZoneWithoutClick(
      state,
      selectedId,
      "stack",
      "free",
      legalAction,
    );
    if (!installed)
      throw new Error("Das Programm kann nicht installiert werden.");
    shuffleRunnerStack(state, `pro018_test_spin:${choice.choiceId}:shuffle`);
    delete state.pendingChoice;
    const serverId = (serverIdRaw || "hq") as Exclude<ServerId, "new_remote">;
    startRun(
      state,
      serverId,
      undefined,
      1,
      { bonusRunNoClick: true, testSpinRun: true },
      legalAction,
    );
    if (!state.run) throw new Error("Test Spin konnte keinen Run starten.");
    state.run.testSpinTemporaryInstall = {
      cardId: selectedId,
      sourceCardId,
      sourceDefinitionId,
      installCostPenalty,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "pro018_stack_install_run_cleanup",
      sourceDefinitionId,
      publicRevealDefinitionId: definition.id,
      installedProgramDefinitionId: definition.id,
      shufflePerformed: true,
      shuffled: true,
      randomCounterAfter: state.randomCounter,
      testSpinRunStarted: true,
      serverId,
    };
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
      parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(
        choice.source,
      );
    if (!state.runner.heap.includes(sourceCardId))
      throw new Error(
        "Die Runner-Connection-Trash-Choice gehoert nicht zur gespielten Karte.",
      );
    const sourceDefinition = definitionFor(state, sourceCardId);
    const implementation = runnerEventLongtailForDefinition(sourceDefinition);
    if (
      sourceDefinition.id !== sourceDefinitionId ||
      implementation?.kind !==
        "trash_installed_runner_connections_then_add_bad_publicity" ||
      implementation.count !== count
    )
      throw new Error(
        "Die Runner-Connection-Trash-Choice gehoert nicht zur gespielten Karte.",
      );

    const selectedIds = selectedChoiceCardIdsForChoice(choice, playerAction);
    if (
      selectedIds.length !== count ||
      new Set(selectedIds).size !== selectedIds.length
    )
      throw new Error(
        "Genau zwei unterschiedliche Connections muessen gewaehlt werden.",
      );
    const eligible = new Set(installedRunnerConnectionIds(state));
    for (const cardId of selectedIds) {
      if (!eligible.has(cardId))
        throw new Error(
          "Eine gewaehlte Karte ist keine installierte Connection.",
        );
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

  return {
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    hiddenZoneNonSearchChoiceHandlerHost,
    iceChoiceLabelForSide,
    installedRunnerConnectionIds,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    resolveDerezRezzedBlackIceChoice,
    resolveCardImplementationAccessPaymentChoice,
    resolveChimeraDaemonTrashChoice,
    resolvePayRezCostToTrashRezzedIceChoice,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
    resolveGripInstallTemporaryCreditChoice,
    resolveIncubatorTransformChoice,
    resolvePaidSourceReturnToGripChoice,
    resolveRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveTrashUnrezzedIceChoice,
    resolveStackInstallRunCleanupChoice,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    startDerezRezzedBlackIceChoice,
    startPayRezCostToTrashRezzedIceChoice,
    startCorpChoiceRezOrTrashIceChoice,
    startPaidSourceReturnToGripChoice,
    startRunnerHostingChoice,
    startTrashUnrezzedIceChoice,
  };
}
