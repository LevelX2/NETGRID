import {
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CounterType,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import {
  assertCorpRootRezCostQuoteValid,
  assertCorpRezCostQuoteValid,
  rezCostForCard,
} from "../payment";
import {
  corpRootAssetIdsInServer,
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustRun,
  mustServer,
} from "../state/card-server-lookup";
import { rollDeterministicDie, shuffleStateIds } from "../state/draw-random";
import { spendClick, spendCredits } from "../state/economy-mutation";
import {
  addCardCounter,
  cardCounter,
  ensureRunnerTurnFlags,
  setCardCounter,
} from "../state/turn-flags-counters";
import { createRemote, ensureSpecialZones, removeFromAllZones } from "../state/zone-mutation";
import { assertCorpCanCreateNewDataFort } from "../turn/corp-data-fort-lock";
import {
  installCard as executeInstallCard,
  type InstallCardHost,
} from "../install/install-card";
import {
  runnerInstallPaymentChoiceSourceSuffix,
  runnerInstallPaymentPayloadForChoiceSource,
  runnerInstallPaymentPublicPayload,
} from "../install/runner-program-install-payment";
import { type RezCardHost } from "../rez/rez-card";
import {
  addRunnerTagsWithPrevention,
  damagePreventionSourcesForDefinition,
  isRunnerHardwareDeckDefinition,
} from "../damage/damage-core";
import { hostedPaymentCredits, shouldLoadLegacyRecurringCredits } from "../run/run-duration-payment";
import { beginEncounter, continueAfterCorpRootRezIfWindowIsComplete } from "../run/encounter-entry";
import { corpRunRootRezActionsAvailable, handleRunRootRezPostRez } from "../run/run-rez-window";
import {
  isFortTraceBitPoolSource,
  markFortActivityForRunGate,
  fortTraceBitPoolCapacityForCard,
} from "../run/fort-run-side-families";
import { passApproachedIce } from "../run/run-movement";
import { onPlayCardImplementationEffects } from "../play/corp-operation-resolution";
import { hiddenRunnerResourceSlotId } from "../view/card-view";
import { runnerMemoryLimit } from "../../ability-engine/effective-values";
import { serverChoiceDisplayLabel } from "../view/server-view";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { executeCardImplementationLifecycleEffects } from "../../ability-engine/card-implementation-runtime";
import type { RuntimeDeps } from "./runtime-shared";

export function createCardLifecycleRuntimeHosts(
  deps: RuntimeDeps,
): Pick<
  import("./card-runtime-host-port").CardRuntimeHostPort,
  | "installCardHost"
  | "rezCardHost"
  | "resolveRunnerTargetedEventImplementation"
  | "resolvePostOnPlayGenericFollowups"
  | "resolveRunnerGripHeapStackShuffleDrawEvent"
  | "shuffleGripTrashAndStackThenDrawForCardImplementation"
  | "startRunnerProgramTrashBeforeInstallChoice"
  | "resolveRunnerProgramTrashBeforeInstallChoice"
> {
  function spendCorpInstallRezCredits(state: GameState, amount: number): void {
    const runCredits =
      state.phase === "run" ? state.run?.corpRunTemporaryCredits : undefined;
    const installRezCredits = state.corpTemporaryInstallRezCredits;
    if (
      runCredits &&
      (!Number.isSafeInteger(runCredits.remaining) ||
        runCredits.remaining < 0 ||
        runCredits.usableFor !== "corp_costs_during_this_run" ||
        runCredits.returnUnusedAtRunEnd !== true)
    )
      throw new Error("Der temporäre Run-Creditpool ist ungültig.");
    if (
      installRezCredits &&
      (!Number.isSafeInteger(installRezCredits.remaining) ||
        installRezCredits.remaining < 0 ||
        installRezCredits.usableFor !== "corp_install_or_rez" ||
        installRezCredits.returnUnusedAtTurnEnd !== true)
    )
      throw new Error(
        "Der temporäre Installations-/Rez-Creditpool ist ungültig.",
      );
    const traceCreditsBefore =
      state.trace?.corpTemporaryTraceCredits?.remaining ?? 0;
    spendCredits(state, "corp", amount);
    const traceCreditsSpent =
      traceCreditsBefore -
      (state.trace?.corpTemporaryTraceCredits?.remaining ?? 0);
    let unallocated = amount - traceCreditsSpent;
    // All pools are already included in Corp credits. Account for each paid
    // credit once, consuming pools in expiry order: trace, run, then turn.
    for (const pool of [runCredits, installRezCredits]) {
      if (!pool) continue;
      const spent = Math.min(unallocated, pool.remaining);
      pool.remaining -= spent;
      unallocated -= spent;
    }
  }

  function installCardHost(state: GameState): InstallCardHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
        isUniqueCard: deps.isUniqueCard,
        hasInstalledUniqueCardDefinition: (side, definitionId) =>
          deps.hasInstalledUniqueCardDefinition(state, side, definitionId),
        cardHasSubtype: deps.cardHasSubtype,
        isRunnerHardwareDeckDefinition,
        hasCardImplementationMemoryUnitModifier:
          deps.hasCardImplementationMemoryUnitModifier,
        shouldLoadLegacyRecurringCredits,
        damagePreventionSourcesForDefinition,
        cardImplementationAgendaPointInstallCost:
          deps.cardImplementationAgendaPointInstallCost,
      },
      servers: {
        assertCorpCanCreateNewDataFort: () =>
          assertCorpCanCreateNewDataFort(state),
        mustServer: (serverId) => mustServer(state, serverId),
        createRemote: () => createRemote(state),
        serverChoiceDisplayLabel: (serverId) =>
          serverChoiceDisplayLabel(state, serverId),
        canInstallCorpRootCardInServer: (definition, server) =>
          deps.canInstallCorpRootCardInServer(state, definition, server),
        corpRootAgendaOrNodeCapacityInServer: (server) =>
          deps.corpRootAgendaOrNodeCapacityInServer(state, server),
        corpRootAssetIdsInServer: (server) =>
          corpRootAssetIdsInServer(state, server),
        corpRootMainCardIdsInServer: (server) =>
          corpRootMainCardIdsInServer(state, server),
        rootInstallRezzesOnInstall: deps.rootInstallRezzesOnInstall,
        trashOlderRegionUpgradesInServer: (server, keepCardId, legalAction) =>
          deps.trashOlderRegionUpgradesInServer(
            state,
            server,
            keepCardId,
            legalAction,
          ),
        markFortActivityForRunGate: (serverId, legalAction) =>
          markFortActivityForRunGate(
            deps.fortRunSideFamiliesHostForState(state),
            serverId,
            legalAction,
          ),
      },
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        trashRunnerInstalledCardToHeap: (cardId) =>
          deps.trashRunnerInstalledCardToHeap(state, cardId),
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          deps.trashCorpInstalledCardToArchives(state, cardId, legalAction),
      },
      runner: {
        ensureTurnFlags: () => ensureRunnerTurnFlags(state),
        requiresDataFortInstallTarget: deps.requiresDataFortInstallTarget,
        startRunnerProgramTrashBeforeInstallChoice: (cardId, legalAction) =>
          startRunnerProgramTrashBeforeInstallChoice(
            state,
            cardId,
            legalAction,
          ),
        forfeitRunnerAgendaForPointCost: (cardId) =>
          deps.forfeitRunnerAgendaForPointCost(state, cardId),
        consumeValuPakProgramInstallAction: (legalAction) =>
          deps.consumeValuPakProgramInstallAction(state, legalAction),
        hiddenRunnerResourceSlotId: (cardId) =>
          hiddenRunnerResourceSlotId(state, cardId),
      },
      corp: {
        expireScoredAgendaInstallRezCreditAbilities: () =>
          deps.expireScoredAgendaInstallRezCreditAbilities(state),
        consumeEdgerunnerTempsInstallAction: (legalAction) =>
          deps.consumeEdgerunnerTempsInstallAction(state, legalAction),
        isRegionUpgrade: deps.isRegionUpgrade,
        isFortTraceBitPoolSource: (cardId) =>
          isFortTraceBitPoolSource(
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        fortTraceBitPoolCapacityForCard: (cardId) =>
          fortTraceBitPoolCapacityForCard(
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
      hosting: {
        canHostProgramOnDaemon: (hostCardId, definition) =>
          deps.canHostProgramOnDaemon(state, hostCardId, definition),
        hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
      },
      payment: {
        assertCorpIceInstallCostValid: (cardId, definition, legalAction) =>
          deps.assertCorpIceInstallCostValid(
            state,
            cardId,
            definition,
            legalAction,
          ),
        spendClick: (side) => spendClick(state, side),
        spendRunnerInstallCredits: (amount, cardType, paymentPayload) =>
          deps.spendRunnerInstallCredits(
            state,
            amount,
            cardType,
            paymentPayload,
          ),
        runnerCanPayInstallCost: (amount, cardType) =>
          deps.runnerCanPayInstallCost(state, amount, cardType),
        openRunnerCostPenaltySupportWindow: (legalAction, amount, cardType) =>
          deps.openRunnerCostPenaltySupportWindow(
            state,
            legalAction,
            amount,
            cardType,
          ),
        closeRunnerCostPenaltySupportWindowForPayment: (legalAction, amount) =>
          deps.closeRunnerCostPenaltySupportWindowForPayment(
            state,
            legalAction,
            amount,
          ),
        spendCredits: (side, amount) =>
          side === "corp"
            ? spendCorpInstallRezCredits(state, amount)
            : spendCredits(state, side, amount),
        rezCostForCard: (cardId) => rezCostForCard(state, cardId),
      },
      counters: {
        setCardCounter: (cardId, counterType, amount) =>
          setCardCounter(state, cardId, counterType as CounterType, amount),
        addCardCounter: (cardId, counterType, amount) =>
          addCardCounter(state, cardId, counterType as CounterType, amount),
        rollDeterministicDie: (purpose) => rollDeterministicDie(state, purpose),
      },
      lifecycle: {
        executeOnInstall: (legalAction, definition, cardId) =>
          executeCardImplementationLifecycleEffects(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
            "on_install",
          ),
      },
    };
  }

  function rezCardHost(state: GameState): RezCardHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
        hasCardImplementationForDefinition: (definitionId) =>
          Boolean(cardImplementationForDefinitionId(definitionId)),
        variableRezForDefinition: deps.variableRezForDefinition,
        stableSubtypeList: deps.stableSubtypeList,
      },
      run: {
        mustRun: () => mustRun(state),
        handleRunRootRezPostRez: (cardId, legalAction) =>
          handleRunRootRezPostRez(
            deps.runRezWindowHostForState(state),
            cardId,
            legalAction,
          ),
        handlePostIceRezContinuation: (cardId, legalAction) => {
          const run = state.run;
          const rootRezWindowStillOpen = Boolean(
            state.timingPoint === "run.approach_ice" &&
            run?.phase === "approach_ice" &&
            run.approachedIceId === cardId &&
            corpRunRootRezActionsAvailable(
              deps.runRezWindowHostForState(state),
            ),
          );
          if (rootRezWindowStillOpen) return true;
          if (
            state.timingPoint === "run.approach_ice" &&
            run?.phase === "approach_ice" &&
            run.approachedIceId === cardId &&
            run.bypassFirstIceRemaining === true
          ) {
            passApproachedIce(deps.runMovementHostForState(state), legalAction);
            return true;
          }
          const continuation = continueAfterCorpRootRezIfWindowIsComplete(
            deps.encounterEntryHostForState(state),
            legalAction,
          );
          if (continuation.handled) return true;
          return false;
        },
        beginEncounter: (cardId, legalAction) =>
          beginEncounter(
            deps.encounterEntryHostForState(state),
            cardId,
            legalAction,
          ),
      },
      payment: {
        rezCostForCard: (cardId) => rezCostForCard(state, cardId),
        assertCorpRezCostQuoteValid: (
          cardId,
          legalAction,
          additionalCreditCost,
        ) =>
          assertCorpRezCostQuoteValid(
            state,
            cardId,
            legalAction,
            additionalCreditCost,
          ),
        assertCorpRootRezCostQuoteValid: (cardId, legalAction) =>
          assertCorpRootRezCostQuoteValid(state, cardId, legalAction),
        creditCostForAction: deps.creditCostForAction,
        spendCredits: (side, amount) =>
          side === "corp"
            ? spendCorpInstallRezCredits(state, amount)
            : spendCredits(state, side, amount),
      },
      corp: {
        isObligationDebtDefinition: deps.isObligationDebtDefinition,
        spendCorpAgendaPointCost: (requiredPoints) =>
          deps.spendCorpAgendaPointCost(state, requiredPoints),
        activeObligationCount: () => deps.activeObligationCount(state),
      },
      runner: {
        ensureTurnFlags: () => ensureRunnerTurnFlags(state),
      },
      counters: {
        setCardCounter: (cardId, counterType, amount) =>
          setCardCounter(state, cardId, counterType as CounterType, amount),
      },
      lifecycle: {
        executeOnRez: (legalAction, definition, cardId) =>
          executeCardImplementationLifecycleEffects(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
            "on_rez",
          ),
      },
      fort: {
        isFortTraceBitPoolSource: (cardId) =>
          isFortTraceBitPoolSource(
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        fortTraceBitPoolCapacityForCard: (cardId) =>
          fortTraceBitPoolCapacityForCard(
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
    };
  }

  function resolveRunnerTargetedEventImplementation(
    state: GameState,
    definition: CardDefinition,
    legalAction: LegalAction,
  ): boolean {
    const effect = cardImplementationForDefinitionId(
      definition.id,
    )?.runnerEventTargetedEffect;
    if (effect?.kind !== "add_strength_counter_to_installed_icebreaker")
      return false;
    const targetCardId = String(
      legalAction.payload?.targetCardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.programs.includes(targetCardId))
      throw new Error("Das Ziel-Icebreaker-Programm ist nicht installiert.");
    const targetDefinition = definitionFor(state, targetCardId);
    if (!deps.cardHasSubtype(targetDefinition, "icebreaker"))
      throw new Error("Das Ziel ist kein Icebreaker.");
    addCardCounter(state, targetCardId, effect.counterType, effect.amount);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      targetDefinitionId: targetDefinition.id,
      counterType: effect.counterType,
      counterAmountAdded: effect.amount,
      remainingCounters: cardCounter(state, targetCardId, effect.counterType),
    };
    return true;
  }

  function resolvePostOnPlayGenericFollowups(
    state: GameState,
    definition: CardDefinition,
    legalAction: LegalAction,
  ): void {
    const effects = onPlayCardImplementationEffects(definition);
    const remoteServerTrashTagSequenceEffect = effects.find(
      (effect) =>
        effect.kind ===
        "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
    );
    if (remoteServerTrashTagSequenceEffect) {
      const tagAmount = remoteServerTrashTagSequenceEffect.tagAmount;
      if (!Number.isInteger(tagAmount) || tagAmount <= 0)
        throw new Error("Remote-Detonator-Tagmenge ist ungueltig.");
      const serverId = state.runnerTurnFlags?.lastSuccessfulRunServerId;
      if (!serverId)
        throw new Error("Es gibt keinen erfolgreichen Run-Fort in diesem Zug.");
      const server = mustServer(state, serverId);
      const trashedDefinitionIds: CardDefinitionId[] = [];
      for (const iceId of server.ice.slice()) {
        if (mustInstance(state.cardInstances, iceId).rezzed !== true) continue;
        trashedDefinitionIds.push(definitionFor(state, iceId).id);
        deps.trashCorpInstalledCardToArchives(state, iceId, legalAction);
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        remoteServerTrashTagSequenceResolved: true,
        serverId,
        trashedRezzedIceCount: trashedDefinitionIds.length,
        trashedCount: trashedDefinitionIds.length,
        ...(trashedDefinitionIds.length > 0
          ? { trashedCardDefinitionIds: trashedDefinitionIds.sort().join(",") }
          : {}),
      };
      state.pendingAddTagContinuation = {
        kind: "terminal",
        sourceDefinitionId: definition.id,
      };
      const runnerTagsBefore = state.runner.tags;
      if (
        addRunnerTagsWithPrevention(
          state,
          legalAction,
          tagAmount,
          definition.id,
        )
      )
        return;
      delete state.pendingAddTagContinuation;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        tagsAdded: Math.max(0, state.runner.tags - runnerTagsBefore),
        runnerTagsAfter: state.runner.tags,
      };
    }
  }

  function resolveRunnerGripHeapStackShuffleDrawEvent(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const cardId = String(legalAction.payload?.cardId);
    const sourceDefinitionId = mustInstance(
      state.cardInstances,
      cardId,
    ).definitionId;
    removeFromAllZones(state, cardId);
    const specialZones = ensureSpecialZones(state);
    specialZones.removedFromGame.push(cardId);
    specialZones.removedFromGame.sort();
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
    };

    const allIds = [
      ...state.runner.grip,
      ...state.runner.heap,
      ...state.runner.stack,
    ].filter((id) => id !== cardId);
    state.runner.grip = [];
    state.runner.heap = [];
    state.runner.stack = shuffleStateIds(
      state,
      allIds,
      [30, sourceDefinitionId, state.stateVersion + 1],
    );
    for (const id of state.runner.stack) {
      state.cardInstances[id] = {
        ...mustInstance(state.cardInstances, id),
        zone: { side: "runner", zone: "stack" },
      };
    }
    const drawSummary = deps.drawRunnerCards(state, 5);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      cardId,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_shuffle_grip_heap_stack_then_draw",
      specialZone: "removed_from_game",
      specialZoneVisibility: "public",
      specialZoneReason: sourceDefinitionId,
    };
    deps.applyRunnerDrawSummaryPayload(state, legalAction, drawSummary);
  }

  function shuffleGripTrashAndStackThenDrawForCardImplementation(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    drawCount: number,
    removePlayedCardFromGame: true,
  ): { publicPayload: Record<string, string | number | boolean> } {
    if (removePlayedCardFromGame !== true)
      throw new Error(
        "Diese Shuffle-Draw-Implementierung muss die ausgespielte Karte aus dem Spiel entfernen.",
      );
    removeFromAllZones(state, sourceCardId);
    const specialZones = ensureSpecialZones(state);
    specialZones.removedFromGame.push(sourceCardId);
    specialZones.removedFromGame.sort();
    state.cardInstances[sourceCardId] = {
      ...mustInstance(state.cardInstances, sourceCardId),
      faceup: true,
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
    };

    const gripCount = state.runner.grip.length;
    const heapCount = state.runner.heap.length;
    const stackCount = state.runner.stack.length;
    const allIds = [
      ...state.runner.grip,
      ...state.runner.heap,
      ...state.runner.stack,
    ].filter((id) => id !== sourceCardId);
    state.runner.grip = [];
    state.runner.heap = [];
    state.runner.stack = shuffleStateIds(
      state,
      allIds,
      [30, sourceDefinitionId, state.stateVersion + 1],
    );
    for (const id of state.runner.stack) {
      state.cardInstances[id] = {
        ...mustInstance(state.cardInstances, id),
        zone: { side: "runner", zone: "stack" },
      };
    }
    const drawSummary = deps.drawRunnerCards(state, drawCount);
    const payload = {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_shuffle_grip_heap_stack_then_draw",
      sourceDefinitionId,
      shuffledGripCount: gripCount,
      shuffledTrashCount: heapCount,
      shuffledStackCount: stackCount,
      shuffledCardsCount: allIds.length,
      drawnCount: drawSummary.drawnCount,
      removedFromGame: true,
      specialZone: "removed_from_game",
      specialZoneVisibility: "public",
      specialZoneReason: sourceDefinitionId,
      randomCounterAfter: state.randomCounter,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...payload,
    };
    deps.applyRunnerDrawSummaryPayload(state, legalAction, drawSummary);
    return { publicPayload: legalAction.payload ?? payload };
  }

  function startRunnerProgramTrashBeforeInstallChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction: LegalAction,
  ): void {
    if (!state.runner.grip.includes(sourceCardId))
      throw new Error("Die Programmquelle liegt nicht mehr im Grip.");
    const definition = definitionFor(state, sourceCardId);
    if (definition.type !== "program")
      throw new Error(
        "Nur Programme koennen vor der Installation Programmtrash oeffnen.",
      );
    if (
      deps.isUniqueCard(definition) &&
      deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      deps.availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
      throw new Error("Nicht genug Credits fuer die Programminstallation.");
    const options = deps
      .installedRunnerProgramTrashOptionsForInstall(state)
      .map((cardId: CardInstanceId) => {
        const optionDefinition = definitionFor(state, cardId);
        return {
          id: `card_${cardId}`,
          label: optionDefinition.title,
          value: cardId,
        };
      });
    if (options.length === 0)
      throw new Error("Es gibt kein installiertes Programm zum Trashen.");
    if (!deps.runnerProgramInstallMemoryReachableAfterTrash(state, definition))
      throw new Error(
        "Durch Programmtrash kann nicht genug MU freigemacht werden.",
      );
    state.pendingChoice = {
      choiceId: `runner_program_trash_before_install_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner_program_trash_before_install:${sourceCardId}:${state.stateVersion + 1}${runnerInstallPaymentChoiceSourceSuffix(legalAction.payload)}${legalAction.payload?.v1922ValuPakInstallAction === true ? ":valu_pak" : ""}`,
      sourceCardInstanceId: sourceCardId,
      sourceCardDefinitionId: definition.id,
      continuation: {
        family: "runner_program_trash_before_install",
        originActionId: legalAction.actionId,
        sourceCardInstanceId: sourceCardId,
        sourceCardDefinitionId: definition.id,
        ...(typeof legalAction.payload?.selectedCardId === "string"
          ? { selectedCardId: legalAction.payload.selectedCardId }
          : {}),
        ...(typeof legalAction.payload?.selectedSubtype === "string"
          ? { selectedSubtype: legalAction.payload.selectedSubtype }
          : {}),
        createdAtStateVersion: state.stateVersion + 1,
      },
      prompt: "Programme vor Installation trashen",
      kind: "select_cards",
      options,
      minSelections: 0,
      maxSelections: options.length,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
  }

  function resolveRunnerProgramTrashBeforeInstallChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("runner_program_trash_before_install")
    )
      throw new Error("Es ist keine Programmtrash-Installationschoice offen.");
    const continuation = choice.continuation;
    if (
      continuation?.family !== "runner_program_trash_before_install" ||
      continuation.createdAtStateVersion !== choice.stateVersion ||
      continuation.originActionId.length === 0 ||
      choice.sourceCardInstanceId !== continuation.sourceCardInstanceId ||
      choice.sourceCardDefinitionId !== continuation.sourceCardDefinitionId
    )
      throw new Error(
        "Die Programmtrash-Installationsfortsetzung ist ungültig.",
      );
    const sourceCardId = continuation.sourceCardInstanceId;
    if (!sourceCardId || !state.runner.grip.includes(sourceCardId))
      throw new Error("Die Programmquelle liegt nicht mehr im Grip.");
    // The authoritative install action may open this choice immediately before
    // another resolver moves the game into a run. The pending choice freezes
    // all other actions, so resolution remains bound to that validated install
    // even if the phase has advanced in the meantime.
    if (state.runner.clicks <= 0)
      throw new Error("Der Runner hat keinen Klick fuer die Installation.");
    const definition = definitionFor(state, sourceCardId);
    if (definition.id !== continuation.sourceCardDefinitionId)
      throw new Error(
        "Die Programmtrash-Installationsquelle stimmt nicht mehr überein.",
      );
    if (definition.type !== "program")
      throw new Error(
        "Nur Programme koennen ueber diese Choice installiert werden.",
      );
    if (
      deps.isUniqueCard(definition) &&
      deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      deps.availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
      throw new Error("Nicht genug Credits fuer die Programminstallation.");

    const trashIds = deps.selectedChoiceCardIds(
      choice,
      playerAction,
    ) as CardInstanceId[];
    const uniqueTrashIds = [...new Set(trashIds)];
    if (uniqueTrashIds.length !== trashIds.length)
      throw new Error("Die Programmtrash-Auswahl enthaelt doppelte Karten.");
    for (const cardId of uniqueTrashIds) {
      if (!state.runner.rig.programs.includes(cardId))
        throw new Error(
          "Die Programmtrash-Auswahl enthaelt kein installiertes Programm.",
        );
      if (definitionFor(state, cardId).type !== "program")
        throw new Error("Nur installierte Programme koennen getrasht werden.");
    }

    const memoryAfterSelection =
      state.runner.memoryUsed +
      (definition.memoryCost ?? 0) -
      uniqueTrashIds.reduce((sum, cardId) => {
        if (!deps.runnerProgramUsesMemory(state, cardId)) return sum;
        return sum + (definitionFor(state, cardId).memoryCost ?? 0);
      }, 0);
    const needsMemory = memoryAfterSelection > runnerMemoryLimit(state);
    if (needsMemory && uniqueTrashIds.length === 0) {
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        sourceDefinitionId: definition.id,
        runnerProgramTrashBeforeInstall: true,
        installed: false,
        installCancelled: true,
        installBlockedReason: "insufficient_memory",
      };
      return;
    }
    if (needsMemory)
      throw new Error("Die Programmtrash-Auswahl macht nicht genug MU frei.");

    const trashedDefinitionIds = uniqueTrashIds.map(
      (cardId) => definitionFor(state, cardId).id,
    );
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...runnerInstallPaymentPayloadForChoiceSource(choice.source),
      ...(choice.source.split(":").includes("valu_pak")
        ? { v1922ValuPakInstallAction: true }
        : {}),
      cardId: sourceCardId,
      ...(continuation.selectedCardId
        ? { selectedCardId: continuation.selectedCardId }
        : {}),
      ...(continuation.selectedSubtype
        ? { selectedSubtype: continuation.selectedSubtype }
        : {}),
      runnerProgramTrashBeforeInstall: true,
      runnerProgramTrashBeforeInstallResolved: true,
      runnerProgramTrashBeforeInstallCostsPrepaid: true,
      trashedCount: uniqueTrashIds.length,
      ...(trashedDefinitionIds.length > 0
        ? { trashedCardDefinitionIds: trashedDefinitionIds.join(",") }
        : {}),
    };
    const paymentResult = deps.spendRunnerInstallCredits(
      state,
      definition.installCost ?? 0,
      definition.type,
      legalAction.payload,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...runnerInstallPaymentPublicPayload(paymentResult),
    };
    for (const cardId of uniqueTrashIds)
      deps.trashRunnerInstalledCardToHeap(state, cardId);
    executeInstallCard(installCardHost(state), legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      sourceDefinitionId: definition.id,
      installed: true,
      memoryUsedAfter: state.runner.memoryUsed,
      memoryLimitAfter: runnerMemoryLimit(state),
    };
  }

  return {
    installCardHost,
    rezCardHost,
    resolveRunnerTargetedEventImplementation,
    resolvePostOnPlayGenericFollowups,
    resolveRunnerGripHeapStackShuffleDrawEvent,
    shuffleGripTrashAndStackThenDrawForCardImplementation,
    startRunnerProgramTrashBeforeInstallChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
  };
}
