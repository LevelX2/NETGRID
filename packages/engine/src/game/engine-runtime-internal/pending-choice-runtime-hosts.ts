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
  ResolvedGameEffect,
  RuntimeDeps,
  ServerId,
  Side,
} from "./runtime-shared";
import type { ChoiceHiddenZoneRuntimeLinks } from "./choice-hidden-zone-runtime-links";
import { resolveClassicDeflectorChoice as resolveClassicDeflectorChoiceInRunModule } from "../run/encounter-printed-nontrace-effects";
import { resumeAccessEffectAfterTagPrevention } from "../access/access-effect-handlers";
import { resumeOnPlayCardImplementationAfterTagPrevention } from "../../ability-engine/card-implementation-runtime";
import { resumeSuccessfulRunAccessReplacementAfterTagPrevention } from "../run/run-access-transition";
import { resumeRunEndCleanupAfterTagPrevention } from "../run/run-end-cleanup";
import {
  resumeEndTurnAfterTagPrevention,
  resumeRunnerDrawSequenceAfterTagPrevention,
  resumeStartOfTurnAfterTagPrevention,
} from "./runtime-port-bindings";
import { resolveAccessProgramInstallMemoryChoice } from "../access/access-flow";
import { resolveRunnerMemoryCheckpointChoice } from "../checkpoints/runner-memory-checkpoint";
import { resolveStrategicPlanningGroupDrawChoice } from "../choices/strategic-planning-group-draw-choice";

export function createPendingChoiceRuntimeHosts(
  deps: RuntimeDeps,
  links: ChoiceHiddenZoneRuntimeLinks,
): import("./pending-choice-runtime-port").PendingChoiceRuntimePort {
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
    resolvePayRezCostToTrashRezzedIceChoice,
    resolveRunnerIcebreakerCounterEvent,
    resolveExposeInstalledCorpCardsChoice,
    resolveExposePreventionChoice,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
    resolveGripInstallTemporaryCreditChoice,
    resolveNonSearchProgramInstallMemoryChoice,
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
  } = links;

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
    const runPhase = run?.phase as
      | NonNullable<GameState["run"]>["phase"]
      | "start"
      | undefined;
    if (run && runPhase === "start") {
      const server = deps.mustServer(state, run.attackedServerId);
      if (server.ice.length > 0) {
        const iceIndex = server.ice.length - 1;
        const approachedIceId = server.ice[iceIndex];
        if (!approachedIceId)
          throw new Error(
            "Das angegriffene Fort hat keine ICE an dieser Position.",
          );
        run.phase = "approach_ice";
        run.position = { kind: "ice", serverId: server.id, iceIndex };
        run.approachedIceId = approachedIceId;
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
    const source = deps.mustInstance(state.cardInstances, sourceCardId);
    if (
      source.zone.side !== "corp" ||
      (source.zone.zone !== "serverRoot" && source.zone.zone !== "serverIce")
    )
      throw new Error("Die Spend-Cap-Quelle liegt nicht in einem Korp-Fort.");
    const serverId = source.zone.serverId;
    if (serverId !== run.attackedServerId)
      throw new Error(
        "Die Spend-Cap-Quelle liegt nicht auf dem laufenden Fort.",
      );
    if (
      source.rezzed !== true ||
      deps.corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
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
      const selected =
        deps.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
      const amount = Number(selected.replace(/^spend_/, ""));
      if (!Number.isInteger(amount) || amount < 0)
        throw new Error("Die Spend-Cap-Ansage ist ungueltig.");
      const source = deps.mustInstance(state.cardInstances, sourceCardId);
      if (
        source.rezzed !== true ||
        deps.corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
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
      const selected =
        deps.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
      if (selected === "pass") {
        delete state.pendingChoice;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          startOfRunRedirectDecision: "pass",
          originalServerId: originalRunStartServerId(run),
        };
        const spendCap = deps
          .mustServer(state, run.attackedServerId)
          .root.slice()
          .sort()
          .find(
            (cardId) =>
              state.cardInstances[cardId]?.rezzed === true &&
              deps.corpUtilityImplementationForCard(state, cardId)?.kind ===
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
        const server = deps.mustServer(state, run.attackedServerId);
        const selectedSource = deps.mustInstance(
          state.cardInstances,
          sourceCardId,
        );
        if (
          selectedSource.rezzed !== true ||
          deps.corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
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
        const source = deps.mustInstance(state.cardInstances, sourceCardId);
        const cost = deps.rezCostForCard(state, sourceCardId);
        if (
          source.rezzed === true ||
          deps.corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
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
        deps.executeCardImplementationLifecycleEffects(
          deps.cardImplementationRuntimeDeps,
          state,
          legalAction,
          deps.definitionFor(state, sourceCardId),
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
      const source = deps.mustInstance(state.cardInstances, sourceCardId);
      if (
        source.zone.side !== "corp" ||
        (source.zone.zone !== "serverRoot" && source.zone.zone !== "serverIce")
      )
        throw new Error("Die Redirect-Quelle liegt nicht in einem Korp-Fort.");
      const targetServerId = source.zone.serverId;
      const intervention = startRunRedirectInterventionForSource(
        run,
        sourceCardId,
      );
      if (
        !intervention ||
        !targetServerId ||
        targetServerId !== intervention.targetServerId ||
        source.rezzed !== true ||
        deps.corpUtilityImplementationForCard(state, sourceCardId)?.kind !==
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
      const server = deps.mustServer(state, serverId);
      if (
        selectedIds.length !== server.ice.length ||
        new Set(selectedIds).size !== selectedIds.length ||
        selectedIds.some(
          (cardId: CardInstanceId) => !server.ice.includes(cardId),
        )
      )
        throw new Error("Die Reorder-Auswahl ist nicht legal.");
      server.ice = selectedIds;
      for (const cardId of selectedIds) {
        state.cardInstances[cardId] = {
          ...deps.mustInstance(state.cardInstances, cardId),
          zone: { side: "corp", zone: "serverIce", serverId: server.id },
        };
      }
      const source = deps.mustInstance(state.cardInstances, sourceCardId);
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

  function resolveClassicDeflectorChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    resolveClassicDeflectorChoiceInRunModule(
      deps.encounterPrintedNonTraceHostForState(state, legalAction),
      legalAction,
      playerAction,
    );
  }

  function resumeAddTagContinuation(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const continuation = state.pendingAddTagContinuation;
    if (!continuation)
      throw new Error("Es ist keine Add-Tag-Fortsetzung offen.");
    switch (continuation.kind) {
      case "terminal":
        delete state.pendingAddTagContinuation;
        return;
      case "access_effect":
        resumeAccessEffectAfterTagPrevention(
          deps.accessEffectHandlerHost(state, legalAction),
        );
        return;
      case "card_effect_on_play":
        resumeOnPlayCardImplementationAfterTagPrevention(
          deps.cardImplementationRuntimeDeps,
          state,
          legalAction,
        );
        return;
      case "runner_draw_tax":
        resumeRunnerDrawSequenceAfterTagPrevention(state, legalAction);
        return;
      case "successful_run_access_replacement":
        resumeSuccessfulRunAccessReplacementAfterTagPrevention(
          deps.runAccessTransitionHost(state),
          legalAction,
        );
        return;
      case "run_end_cleanup":
        resumeRunEndCleanupAfterTagPrevention(
          deps.runEndCleanupHost(state),
          legalAction,
        );
        return;
      case "end_turn_tag":
        resumeEndTurnAfterTagPrevention(state, legalAction);
        return;
      case "corp_start_turn":
      case "runner_start_turn":
        resumeStartOfTurnAfterTagPrevention(state, legalAction);
        return;
    }
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
        resolveReplacementChoice: deps.resolveReplacementChoice,
        resolveEventModificationChoice: deps.resolveEventModificationChoice,
        resumeAddTagContinuation,
        resolvePdcaDamageReplacementChoice:
          deps.resolvePdcaDamageReplacementChoice,
      },
      trace: {
        resolveTraceChoice: (_state, actionToResolve, playerActionToResolve) =>
          deps.resolveTraceChoice(
            deps.traceOrchestrationHost(state),
            actionToResolve,
            playerActionToResolve,
          ),
      },
      hiddenZone: {
        handleHiddenZoneArrangeChoice: deps.handleHiddenZoneArrangeChoice,
        hiddenZoneArrangeChoiceHandlerHost,
        handleHiddenZoneNonSearchChoice: deps.handleHiddenZoneNonSearchChoice,
        hiddenZoneNonSearchChoiceHandlerHost,
        handleCorpZoneChoice: deps.handleCorpZoneChoice,
        corpZoneChoiceHandlerHost,
        isP358HiddenReplacementCompatibilityChoiceSource:
          deps.isP358HiddenReplacementCompatibilityChoiceSource,
        resolveP358HiddenReplacementChoice,
        handleHiddenZoneSearchChoice: deps.handleHiddenZoneSearchChoice,
        hiddenZoneSearchChoiceHandlerHost,
        resolveMultiExposeInstalledCorpCardsChoice,
        resolveExposeInstalledCorpCardsChoice,
        resolveExposePreventionChoice,
        resolveCorpInstalledEconomyCreditChoice:
          deps.resolveCorpInstalledEconomyCreditChoice,
        resolveStrategicPlanningGroupDrawChoice,
        resolveCrashEverettDrawChoice: deps.resolveCrashEverettDrawChoice,
        resolveRunnerDrawSequenceChoice: deps.resolveRunnerDrawSequenceChoice,
        resolveHardwareTrashByCounterChoice:
          deps.resolveHardwareTrashByCounterChoice,
        resolveAdvancementPlacementChoice:
          deps.resolveAdvancementPlacementChoice,
        resolveDerezRezzedBlackIceChoice,
        resolvePayRezCostToTrashRezzedIceChoice,
        resolveCorpChoiceRezOrTrashIceTargetChoice,
        resolveCorpChoiceRezOrTrashIceDecisionChoice,
        resolveTrashUnrezzedIceChoice,
        resolveRandomDiceSplitChoice,
        resolveRunnerInstalledConnectionTrashBadPublicityChoice,
        resolveGripInstallTemporaryCreditChoice,
        resolveNonSearchProgramInstallMemoryChoice,
        resolveStackInstallRunCleanupChoice,
        resolvePaidSourceReturnToGripChoice,
        resolveRunnerHostingChoice,
        resolveIncubatorTransformChoice,
        resolveVirusCounterPurgePreserveChoice:
          deps.resolveVirusCounterPurgePreserveChoice,
        resolveRunnerProgramReturnChoice,
        resolveRunnerPrivateLookChoice: deps.resolveRunnerPrivateLookChoice,
        resolveSenatorialFieldTripChoice: deps.resolveSenatorialFieldTripChoice,
        resolveFortHqReplacementChoice: deps.resolveFortHqReplacementChoice,
      },
      corp: {
        handleCorpInstallRezSequenceChoice:
          deps.handleCorpInstallRezSequenceChoice,
        corpInstallRezSequenceHandlerHost:
          deps.corpInstallRezSequenceHandlerHost,
        handleScoredAgendaFlowChoice: deps.handleScoredAgendaFlowChoice,
        scoredAgendaFlowHost: deps.scoredAgendaFlowHost,
      },
      runner: {
        resolveRunnerProgramTrashBeforeInstallChoice:
          deps.resolveRunnerProgramTrashBeforeInstallChoice,
        resolveRunnerMemoryCheckpointChoice: (
          _state,
          legalAction,
          playerAction,
        ) =>
          resolveRunnerMemoryCheckpointChoice(
            {
              state,
              runnerMemoryLimit: () => deps.runnerMemoryLimit(state),
              runnerProgramUsesMemory: (cardId) =>
                deps.runnerProgramUsesMemory(state, cardId),
              definitionFor: (cardId) => deps.definitionFor(state, cardId),
              trashRunnerInstalledCardToHeap: (cardId, action) =>
                deps.trashRunnerInstalledCardToHeap(state, cardId, action),
            },
            legalAction,
            playerAction,
          ),
        resolveDelayedInstallMemoryChoice: (
          _state,
          legalAction,
          playerAction,
        ) => {
          const resumesStartOfTurn =
            state.pendingChoice?.source.split(":")[3] === "start_turn";
          const effects: ResolvedGameEffect[] = [];
          deps.resolveDelayedInstallMemoryChoice(
            deps.runnerSpecialTriggerExecutionHost(state),
            legalAction,
            playerAction,
            effects,
          );
          if (resumesStartOfTurn && !state.pendingChoice)
            deps.applyRunnerStartOfTurnEffects(
              state,
              effects,
              "after_delayed_install_choice",
            );
          deps.appendResolvedEffectsToPayload(legalAction, effects);
        },
        resolveDelayedInstallStartTurnChoice: (
          _state,
          legalAction,
          playerAction,
        ) => {
          const effects: ResolvedGameEffect[] = [];
          deps.resolveDelayedInstallStartTurnChoice(
            deps.runnerSpecialTriggerExecutionHost(state),
            legalAction,
            playerAction,
            effects,
          );
          if (!state.pendingChoice)
            deps.applyRunnerStartOfTurnEffects(
              state,
              effects,
              "after_delayed_install_choice",
            );
          deps.appendResolvedEffectsToPayload(legalAction, effects);
        },
      },
      run: {
        resolveHqIceSwapChoice: deps.resolveHqIceSwapChoice,
        fortPassWindowHostForState: deps.fortPassWindowHostForState,
        resolveSecretSpendCompareChoiceInRunModule:
          deps.resolveSecretSpendCompareChoiceInRunModule,
        encounterSpecialWindowHostForState:
          deps.encounterSpecialWindowHostForState,
        resolveHammerStealthLossChoice: deps.resolveHammerStealthLossChoice,
        fortRunSideFamiliesHostForState: deps.fortRunSideFamiliesHostForState,
        resolveActiveIceProgramTrashChoiceInRunModule:
          deps.resolveActiveIceProgramTrashChoiceInRunModule,
        encounterResolutionHostForState: deps.encounterResolutionHostForState,
        resolvePassRezzedIceProgramTrashChoiceInRunModule:
          deps.resolvePassRezzedIceProgramTrashChoiceInRunModule,
        resolveRezInterruptJackOutChoice: deps.resolveRezInterruptJackOutChoice,
        runRezWindowHostForState: deps.runRezWindowHostForState,
        resolveBrokenIceVirusCounterChoice:
          deps.resolveBrokenIceVirusCounterChoice,
        runEndCleanupHost: deps.runEndCleanupHost,
        resolveAardvarkInterceptionChoice:
          deps.resolveAardvarkInterceptionChoice,
        resolveSuccessfulRunInterventionChoiceInRunModule:
          deps.resolveSuccessfulRunInterventionChoiceInRunModule,
        successfulRunInterventionHost: deps.successfulRunInterventionHost,
        resolvePostMeatDamageHiddenResourceChoice:
          deps.resolvePostMeatDamageHiddenResourceChoice,
        resolveStartOfRunFortUtilityChoice,
        resolveClassicDeflectorChoice,
      },
      access: {
        resolveAccessProgramInstallMemoryChoice: (
          _state,
          legalAction,
          playerAction,
        ) => {
          resolveAccessProgramInstallMemoryChoice(
            deps.accessFlow.accessFlowHost(state),
            legalAction,
            playerAction,
          );
        },
        resolveSuccessfulRunCreditLossSpendChoice:
          deps.resolveSuccessfulRunCreditLossSpendChoice,
        runAccessTransitionHost: deps.runAccessTransitionHost,
        resolvePreAccessTopRdReorderChoice:
          deps.resolvePreAccessTopRdReorderChoice,
        resolveRevealRdUntilAgendaStoreInHqChoice:
          deps.resolveRevealRdUntilAgendaStoreInHqChoice,
      },
      cardImplementation: {
        resolveCardImplementationAccessPaymentChoice,
        resolveCardImplementationAdvancementDistributionChoice:
          deps.resolveCardImplementationAdvancementDistributionChoice,
        resolveCardImplementationMoveAdvancementChoice:
          deps.resolveCardImplementationMoveAdvancementChoice,
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
    const hand = deps.handForSide(state, side);
    return {
      choiceId: `discard_${side}_${stateVersion}`,
      side,
      source: "discard_phase",
      prompt: side === "corp" ? "Korp-Discard wählen" : "Runner-Discard wählen",
      kind: "select_cards",
      options: hand.map((cardId) => ({
        id: `card_${cardId}`,
        label: deps.definitionFor(state, cardId).title,
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
      deps.handForSide(state, side).length - deps.maxHandSize(state, side);
    if (expectedCount !== choice.minSelections)
      throw new Error("Die Discard-Anzahl ist nicht mehr gueltig.");
    const cockroachRandomized =
      side === "corp" && deps.cockroachRandomHqDiscardActive(state);
    let selectedCards: CardInstanceId[] = [];
    if (cockroachRandomized) {
      selectedCards = deps.discardRandomCorpHqCards(
        state,
        expectedCount,
        `v191.random.${deps.COCKROACH_ID}.hq_discard_phase`,
      );
    } else {
      const selectedIds = deps.selectedChoiceIds(playerAction.selectedChoices);
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
      const hand = deps.handForSide(state, side);
      for (const cardId of selectedCards) {
        const instance = deps.mustInstance(state.cardInstances, cardId);
        if (instance.owner !== side || !hand.includes(cardId))
          throw new Error("Eine Discard-Karte liegt nicht in der Hand.");
      }

      for (const cardId of selectedCards) {
        deps.removeFromAllZones(state, cardId);
        if (side === "corp") {
          state.corp.archives.push(cardId);
          state.cardInstances[cardId] = {
            ...deps.mustInstance(state.cardInstances, cardId),
            faceup: false,
            rezzed: false,
            zone: { side: "corp", zone: "archives" },
          };
        } else {
          state.runner.heap.push(cardId);
          state.cardInstances[cardId] = {
            ...deps.mustInstance(state.cardInstances, cardId),
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
            cockroachCounterTotal: deps.cockroachCounterTotal(state),
          }
        : {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "discard_phase",
    };
    delete state.pendingChoice;
    deps.completeDiscardPhase(state, side, legalAction);
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
      initialHandSize: deps.INITIAL_HAND_SIZE,
      resolved: {},
      mulligansTaken: {},
    };
    const side = state.pendingChoice?.side;
    if (!side) throw new Error("Es ist keine Setup-Choice offen.");
    const selected = deps.selectedChoiceIds(playerAction.selectedChoices)[0];
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
          ...deps.mustInstance(state.cardInstances, id),
          zone: { side: "runner", zone: "stack" },
        };
      const shuffled = deps.shuffleStateIds(
        state,
        allIds,
        "setup.shuffle.runner.mulligan",
      );
      const grip = shuffled.splice(0, handSize);
      state.runner.grip = grip;
      state.runner.stack = shuffled;
      for (const id of grip)
        state.cardInstances[id] = {
          ...deps.mustInstance(state.cardInstances, id),
          zone: { side: "runner", zone: "grip" },
        };
      deps.recordStateRandomMarkers(
        state,
        "setup.draw.runner.mulligan_hand",
        grip.length,
      );
      return;
    }

    const allIds = [...state.corp.hq, ...state.corp.rd];
    for (const id of allIds)
      state.cardInstances[id] = {
        ...deps.mustInstance(state.cardInstances, id),
        zone: { side: "corp", zone: "rd" },
      };
    const shuffled = deps.shuffleStateIds(
      state,
      allIds,
      "setup.shuffle.corp.mulligan",
    );
    const hq = shuffled.splice(0, handSize);
    state.corp.hq = hq;
    state.corp.rd = shuffled;
    for (const id of hq)
      state.cardInstances[id] = {
        ...deps.mustInstance(state.cardInstances, id),
        zone: { side: "corp", zone: "hq" },
      };
    deps.recordStateRandomMarkers(
      state,
      "setup.draw.corp.mulligan_hand",
      hq.length,
    );
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
