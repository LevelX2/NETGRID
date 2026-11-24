import { parseCardDefinitionIdToken } from "../choices/card-definition-id-token";
import * as runtimePorts from "./runtime-port-bindings";
import { temporaryIceStrengthPulseBonus } from "../../ability-engine/temporary-ice-strength-pulse";
import { grantSourceBoundActions } from "./turn-action-economy-runtime";
import {
  type CardDefinitionId,
  type CardInstanceId,
  type CounterType,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type Side,
} from "@netgrid/shared";
import { rezCostForCard } from "../payment";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  corpInstalledCardIds,
  definitionFor,
  mustInstance,
  runnerInstalledCardIds,
} from "../state/card-server-lookup";
import { drawCorpCards } from "../state/draw-random";
import { spendClick, spendCredits } from "../state/economy-mutation";
import {
  applyCreditGain,
  creditGainPublicPayload,
} from "../economy/credit-gain";
import {
  addCardCounter,
  cardCounter,
  ensureRunnerTurnFlags,
  hasSuccessfulHqRunThisTurn,
  spendCardCounter,
} from "../state/turn-flags-counters";
import { removeFromAllZones } from "../state/zone-mutation";
import { buildLegalAction as action } from "../turn/action-builders";
import { purgeableRunnerVirusCounterAmount } from "../turn/turn-basic-execution";
import { addPurgeableRunnerVirusCounter } from "../run/run-end-counter-triggers";
import { effectiveIceRunSubroutines } from "../run/effective-ice-run-subroutines";
import { syncPendingChoiceAfterRunnerCostPenaltySupport } from "../payment/runner-payment-support";
import { topRunnerHeapCardId } from "../abilities/runner-special-trigger-execution";
import { addRunnerTagsWithPrevention, hiddenRunnerResourceRevealPayload } from "../damage/damage-core";
import { startCorpDiscardHqWithRetainPaymentChoice } from "../hidden-zone/nonsearch-choice-handlers";
import {
  createGameCardImplementationRuntimeDeps,
  type GameCardImplementationRuntimeDepsHost,
} from "../card-implementation/card-implementation-runtime-deps";
import { type HiddenZoneRuntimeDepsHost } from "../card-implementation/hidden-zone-runtime-deps";
import { type InstallRezRuntimeDepsHost } from "../card-implementation/install-rez-runtime-deps";
import { type CounterLifecycleRuntimeDepsHost } from "../card-implementation/counter-lifecycle-runtime-deps";
import { type TraceRuntimeDepsHost } from "../card-implementation/trace-runtime-deps";
import { createCardImplementationEffectAdapters } from "../../ability-engine/card-implementation-effect-adapters";
import { executeCardImplementationEffects } from "../../ability-engine/effect-interpreter";
import { executeCardImplementationLifecycleEffects } from "../../ability-engine/card-implementation-runtime";
import {
  replaceFortCardsFromHq,
  resolveFortHqReplacementChoice,
} from "./fort-hq-replacement-runtime";

import {
  corpScoredBlackOpsAgendaLastTurn,
  finishRun,
  resolveRunnerLastTurnInstalledResourceTargetId,
  runnerStoleAgendaSubtypeThisTurn,
  scoreInstalledRunnerProgramAsAgenda,
} from "./runtime-bootstrap-support";
export function configureCardRuntimeBootstrap() {
  // CardImplementation effect adapters are the mutation boundary for effects that
  // still need host primitives. The adapters may call these functions, but card
  // files and runtime code stay free of index.ts imports and card-specific logic.
  const cardImplementationEffectAdapters =
    createCardImplementationEffectAdapters({
      drawCorpCards,
      drawRunnerCards: runtimePorts.drawRunnerCards,
      runnerDrawSummaryPublicPayload:
        runtimePorts.runnerDrawSummaryPublicPayload,
      addCardCounter,
      cardCounter,
      spendCardCounter,
      gainCredits: (state, side, amount, sourceCardId) => {
        const sourceDefinitionId = definitionFor(state, sourceCardId).id;
        const result = applyCreditGain(state, {
          side,
          baseAmount: amount,
          source: {
            kind: "hosted_credit_take",
            sourceCardId,
            sourceDefinitionId,
            reason: "take_hosted_credits",
          },
        });
        return {
          creditedAmount: result.creditedAmount,
          creditsAfter: result.creditsAfter,
          publicPayload: creditGainPublicPayload(result),
        };
      },
      mustInstance,
      definitionFor,
      runnerInstalledCardIds,
      hiddenRunnerResourceRevealPayload,
      trashCorpInstalledCardToArchives:
        runtimePorts.trashCorpInstalledCardToArchives,
      trashRunnerInstalledCardToHeap:
        runtimePorts.trashRunnerInstalledCardToHeap,
    });

  // Runtime dependencies define the host contract for declarative
  // CardImplementation abilities and lifecycle hooks. Payment timing, movement,
  // damage windows, and source trashing remain owned by index.ts primitives.
  function hiddenZoneRuntimeDepsHost(): HiddenZoneRuntimeDepsHost {
    return {
      cards: {
        runnerInstalledCardIds,
        topRunnerHeapCardId,
      },
      hiddenZone: {
        searchActivationTargetHost:
          runtimePorts.hiddenZoneSearchActivationTargetHost,
        searchActivationHandlerHost:
          runtimePorts.hiddenZoneSearchActivationHandlerHost,
        arrangeChoiceHandlerHost:
          runtimePorts.hiddenZoneArrangeChoiceHandlerHost,
        nonSearchChoiceHandlerHost:
          runtimePorts.hiddenZoneNonSearchChoiceHandlerHost,
        corpZoneChoiceHandlerHost: runtimePorts.corpZoneChoiceHandlerHost,
      },
      callbacks: {
        startRunnerPrivateLookChoice: (
          state,
          legalAction,
          sourceCardId,
          sourceDefinitionId,
          zone,
          count,
        ) =>
          runtimePorts.startRunnerPrivateLookChoice(
            state,
            sourceCardId,
            sourceDefinitionId,
            zone,
            count,
            "ability",
            legalAction,
          ),
        exposeInstalledCorpCardTargets:
          runtimePorts.exposeInstalledCorpCardTargets,
        exposeInstalledCorpCard:
          runtimePorts.exposeInstalledCorpCardForImplementation,
        startExposeInstalledCorpCardsChoice:
          runtimePorts.startExposeInstalledCorpCardsChoice,
        exposeOutermostIceOfEachDataFort:
          runtimePorts.exposeOutermostIceOfEachDataFort,
        outermostIceExposures: runtimePorts.outermostIceExposures,
        shuffleGripTrashAndStackThenDrawForCardImplementation:
          runtimePorts.shuffleGripTrashAndStackThenDrawForCardImplementation,
      },
    };
  }
  function traceRuntimeDepsHost(): TraceRuntimeDepsHost {
    return {
      trace: {
        orchestrationHost: runtimePorts.traceOrchestrationHost,
        resolveRunnerLastTurnInstalledResourceTargetId,
      },
    };
  }

  function installRezRuntimeDepsHost(): InstallRezRuntimeDepsHost {
    return {
      cards: { definitionFor },
      install: {
        runnerInstallableProgramIdsForValuPak:
          runtimePorts.runnerInstallableProgramIdsForValuPak,
      },
      rez: {
        affordableRezzedInstalledIceIdsForRunner:
          runtimePorts.affordableRezzedInstalledIceIdsForRunner,
        unrezzedInstalledIceIds: runtimePorts.unrezzedInstalledIceIds,
        installedIceIds: (state) =>
          corpInstalledCardIds(state).filter(
            (cardId) =>
              mustInstance(state.cardInstances, cardId).zone.zone ===
              "serverIce",
          ),
        rezzedBlackIceIds: runtimePorts.rezzedBlackIceIds,
        startPayRezCostToTrashRezzedIceChoice:
          runtimePorts.startPayRezCostToTrashRezzedIceChoice,
        startTrashUnrezzedIceChoice: runtimePorts.startTrashUnrezzedIceChoice,
        startCorpChoiceRezOrTrashIceChoice:
          runtimePorts.startCorpChoiceRezOrTrashIceChoice,
        startDerezRezzedBlackIceChoice:
          runtimePorts.startDerezRezzedBlackIceChoice,
      },
      runner: { ensureTurnFlags: ensureRunnerTurnFlags },
    };
  }
  function counterLifecycleRuntimeDepsHost(): CounterLifecycleRuntimeDepsHost {
    return {
      counters: {
        cardCounter,
        addCounterToAllInstalledRunnerIcebreakers:
          runtimePorts.addCounterToAllInstalledRunnerIcebreakers,
      },
      lifecycle: {
        hasSuccessfulHqRunThisTurn,
        runnerLiberatedAgendaSubtypeThisTurn: runnerStoleAgendaSubtypeThisTurn,
        corpScoredBlackOpsAgendaLastTurn,
      },
    };
  }

  function trashTopCorpRdCards(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    amount: 2,
  ): { publicPayload: Record<string, string | number | boolean> } {
    if (amount !== 2 || state.corp.rd.length < amount)
      throw new Error("R&D enthält nicht genug Karten für diese Kosten.");
    const trashed = state.corp.rd.slice(0, amount);
    for (const cardId of trashed) {
      removeFromAllZones(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "archives" },
      };
    }
    const payload = {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "trash_top_corp_rd",
      sourceDefinitionId,
      trashedCardsCount: trashed.length,
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
    return { publicPayload: payload };
  }

  function rezInstalledIceWithLifecycleCounters(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    input: {
      counterType: Extract<CounterType, "kludge" | "term">;
      amount: number;
      amountKind:
        | "bounded_x_by_rez_cost_min_one"
        | "chosen_x_min_one"
        | "target_rez_cost";
      lifecycle:
        | "remove_one_counter_start_corp_turn_trash_on_last"
        | "rent_to_own_start_corp_turn";
    },
  ): { publicPayload: Record<string, string | number | boolean> } {
    void sourceCardId;
    const targetCardId = String(legalAction.payload?.targetCardId ?? "") as
      | CardInstanceId
      | "";
    const target = targetCardId ? state.cardInstances[targetCardId] : undefined;
    const definition = targetCardId
      ? definitionFor(state, targetCardId)
      : undefined;
    if (
      !target ||
      !definition ||
      target.controller !== "corp" ||
      target.zone.side !== "corp" ||
      target.zone.zone !== "serverIce" ||
      definition.type !== "ice" ||
      target.rezzed === true
    )
      throw new Error("Das Rez-Ziel ist nicht legal.");
    const targetRezCost = rezCostForCard(state, targetCardId);
    if (Number(legalAction.payload?.targetRezCost) !== targetRezCost)
      throw new Error("Die gebundene Rez-Kostenangabe ist nicht mehr gültig.");
    let counterAmount = Math.max(0, Math.floor(input.amount));
    if (input.counterType === "kludge") {
      counterAmount = Math.max(
        0,
        Math.floor(Number(legalAction.payload?.xValue ?? 0)),
      );
      const paidCredits = legalAction.costs.reduce(
        (sum, cost) => sum + Math.max(0, Math.floor(cost.credits ?? 0)),
        0,
      );
      const creditsBeforePayment = state.corp.credits + paidCredits;
      const upperBound =
        input.amountKind === "bounded_x_by_rez_cost_min_one"
          ? Math.min(Math.max(1, targetRezCost), creditsBeforePayment)
          : creditsBeforePayment;
      if (
        Number(legalAction.payload?.xUpperBound) !== upperBound ||
        Number(legalAction.payload?.xMinimum) !== 1 ||
        Number(legalAction.payload?.xMaximum) !== upperBound ||
        Number(legalAction.payload?.xCreditsPerUnit) !== 1 ||
        legalAction.payload?.variableCostKind !== "printed_play_cost" ||
        paidCredits !== counterAmount ||
        counterAmount < 1 ||
        counterAmount > upperBound
      )
        throw new Error("Die gewählte Counter-Anzahl ist nicht legal.");
    } else {
      counterAmount = targetRezCost;
    }
    state.cardInstances[targetCardId] = {
      ...target,
      rezzed: true,
      faceup: true,
    };
    if (counterAmount > 0)
      addCardCounter(state, targetCardId, input.counterType, counterAmount);
    const payload = {
      sourceDefinitionId,
      targetCardId,
      targetDefinitionId: definition.id,
      targetRezCost,
      freeRez: true,
      counterType: input.counterType,
      addedCounterAmount: counterAmount,
      remainingCounters: cardCounter(state, targetCardId, input.counterType),
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      targetCardId,
      "on_rez",
    );
    return { publicPayload: payload };
  }

  function doubleChosenIceStrengthUntilEndOfTurn(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    targetIceId: CardInstanceId,
    maxStrength: number,
  ): { publicPayload: Record<string, string | number | boolean> } {
    const target = mustInstance(state.cardInstances, targetIceId);
    const targetDefinition = definitionFor(state, targetIceId);
    if (
      target.controller !== "corp" ||
      target.zone.side !== "corp" ||
      target.zone.zone !== "serverIce" ||
      targetDefinition.type !== "ice" ||
      !target.rezzed
    )
      throw new Error("Sterdroid braucht ein gerezztes installiertes ICE.");
    const currentStrength = runtimePorts.iceStrengthFor(state, targetIceId);
    const amount = temporaryIceStrengthPulseBonus(currentStrength, maxStrength);
    if (amount > 0) {
      state.cardInstances[targetIceId] = {
        ...target,
        strengthModifier: target.strengthModifier + amount,
      };
      state.temporaryIceStrengthModifiersUntilEndOfTurn = [
        ...(state.temporaryIceStrengthModifiersUntilEndOfTurn ?? []),
        {
          sourceCardInstanceId: sourceCardId,
          sourceDefinitionId,
          targetIceId,
          amount,
          turnSerial: Math.max(0, Math.floor(state.turnSerial ?? 0)),
          expires: "turn_end",
        },
      ];
    }
    const payload = {
      sourceDefinitionId,
      targetCardDefinitionId: targetDefinition.id,
      iceStrengthBefore: currentStrength,
      iceStrengthAfter: currentStrength + amount,
      iceStrengthBonusApplied: amount,
      iceStrengthMaxCap: maxStrength,
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
    return { publicPayload: payload };
  }

  function revalidateLastRezzedBlackIce(
    state: GameState,
  ): NonNullable<
    NonNullable<GameState["runnerTurnFlags"]>["lastRezzedBlackIceThisTurn"]
  > {
    const target = state.runnerTurnFlags?.lastRezzedBlackIceThisTurn;
    if (!target?.cardId)
      throw new Error("In diesem Zug wurde kein Black ICE gerezzt.");
    const instance = state.cardInstances[target.cardId];
    const definition = instance
      ? definitionFor(state, target.cardId)
      : undefined;
    if (
      !instance ||
      !definition ||
      instance.controller !== "corp" ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce" ||
      instance.zone.serverId !== target.serverId ||
      instance.rezzed !== true ||
      definition.id !== target.definitionId ||
      definition.type !== "ice" ||
      !runtimePorts.cardHasSubtype(definition, "black_ice")
    )
      throw new Error("Das zuletzt gerezzte Black ICE ist nicht mehr legal.");
    return target;
  }

  function startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ): { publicPayload: Record<string, string | number | boolean> } {
    const sourceDefinition = definitionFor(state, sourceCardId);
    const target = revalidateLastRezzedBlackIce(state);
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `derez_last_rezzed_black_ice_or_bad_publicity_${state.stateVersion + 1}`,
      side: "corp",
      source: `card_implementation.derez_last_rezzed_black_ice_or_bad_publicity:${sourceCardId}:${sourceDefinition.id}:${target.cardId}:${target.definitionId}:${target.serverId}:${state.stateVersion + 1}`,
      prompt: "Black ICE derezzen oder Bad Publicity erhalten",
      presentationKey: "black_ice_or_bad_publicity",
      kind: "select_option",
      options: [
        {
          id: "derez",
          label: `${definitionFor(state, target.cardId).title} derezzen`,
          publicLabel: "Black ICE derezzen",
          value: "derez",
          metadata: { cardTitle: definitionFor(state, target.cardId).title },
        },
        {
          id: "bad_publicity",
          label: "2 Bad Publicity erhalten",
          publicLabel: "2 Bad Publicity erhalten",
          value: "bad_publicity",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "corp";
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      derezOrBadPublicityChoiceOpened: true,
      sourceDefinitionId: sourceDefinition.id,
      targetCardDefinitionId: target.definitionId,
      targetServerId: target.serverId,
    };
    return { publicPayload: legalAction.payload };
  }

  function resolveSenatorialFieldTripChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice?.source.startsWith(
        "card_implementation.derez_last_rezzed_black_ice_or_bad_publicity:",
      )
    )
      throw new Error("Es ist keine Black-ICE-Choice offen.");
    const [
      ,
      sourceCardId = "",
      sourceDefinitionIdToken = "",
      targetCardId = "",
      targetDefinitionIdToken = "",
      targetServerId = "",
    ] = choice.source.split(":");
    const sourceDefinitionId = parseCardDefinitionIdToken(
      sourceDefinitionIdToken,
    );
    const targetDefinitionId = parseCardDefinitionIdToken(
      targetDefinitionIdToken,
    );
    if (!state.runner.heap.includes(sourceCardId as CardInstanceId))
      throw new Error("Die Quelle liegt nicht mehr im Heap.");
    if (
      definitionFor(state, sourceCardId as CardInstanceId).id !==
      sourceDefinitionId
    )
      throw new Error("Die Choice passt nicht mehr zur Quelle.");
    const target = revalidateLastRezzedBlackIce(state);
    if (
      target.cardId !== targetCardId ||
      target.definitionId !== targetDefinitionId ||
      target.serverId !== targetServerId
    )
      throw new Error("Das Black-ICE-Ziel ist veraltet.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    delete state.pendingChoice;
    if (selected === "derez") {
      state.cardInstances[target.cardId] = {
        ...runtimePorts.withoutVariableIceState(
          mustInstance(state.cardInstances, target.cardId),
        ),
        faceup: false,
        rezzed: false,
      };
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        derezOrBadPublicityDecision: "derez",
        sourceDefinitionId,
        targetCardDefinitionId: target.definitionId,
        derezzedCardDefinitionId: target.definitionId,
      };
      return;
    }
    if (selected !== "bad_publicity")
      throw new Error("Die Black-ICE-Choice-Auswahl ist ungueltig.");
    const result = executeCardImplementationEffects(
      state,
      {
        sourceCardId: sourceCardId as CardInstanceId,
        sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
        sourceTitle: definitionFor(state, sourceCardId as CardInstanceId).title,
        controller: "runner",
      },
      [{ kind: "add_bad_publicity", amount: 2, visibility: "public" }],
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      derezOrBadPublicityDecision: "bad_publicity",
      sourceDefinitionId,
      targetCardDefinitionId: target.definitionId,
      ...result.publicPayload,
    };
    runtimePorts.appendResolvedEffectsToPayload(
      legalAction,
      result.resolvedEffects,
    );
  }

  function gameCardImplementationRuntimeDepsHost(): GameCardImplementationRuntimeDepsHost {
    const spendCardImplementationCredits = (
      state: GameState,
      side: Side,
      amount: number,
    ): void => {
      spendCredits(state, side, amount);
      const temporaryCredits = state.run?.corpRunTemporaryCredits;
      if (side !== "corp" || amount <= 0 || !temporaryCredits) return;
      temporaryCredits.remaining = Math.max(
        0,
        Math.floor(temporaryCredits.remaining ?? 0) - amount,
      );
    };
    return {
      cards: {
        definitionFor,
        mustInstance,
        rezzedCorpRootCardIds: runtimePorts.rezzedCorpRootCardIds,
        runnerInstalledCardIds,
      },
      credits: {
        spendClick,
        spendCredits: spendCardImplementationCredits,
        syncPendingChoiceAfterRunnerCostPenaltySupport,
        gainCredits: (state, input) => {
          const result = applyCreditGain(state, {
            side: input.side,
            baseAmount: input.amount,
            source:
              input.kind === "temporary_grant"
                ? {
                    kind: "temporary_grant",
                    sourceCardId: input.sourceCardId,
                    sourceDefinitionId: input.sourceDefinitionId,
                    reason: input.reason,
                  }
                : input.reason === "start_of_turn"
                  ? {
                      kind: "turn_effect",
                      sourceCardId: input.sourceCardId,
                      sourceDefinitionId: input.sourceDefinitionId,
                      reason: "start_of_corp_turn",
                    }
                  : {
                      kind: "card_effect",
                      sourceCardId: input.sourceCardId,
                      sourceDefinitionId: input.sourceDefinitionId,
                      gainOrdinal: input.gainOrdinal,
                      reason: input.reason,
                    },
            ...(input.destination ? { destination: input.destination } : {}),
          });
          return {
            creditedAmount: result.creditedAmount,
            creditsAfter: result.creditsAfter,
            publicPayload: creditGainPublicPayload(result),
          };
        },
      },
      actions: {
        createAction: action,
        appendResolvedEffectsToPayload:
          runtimePorts.appendResolvedEffectsToPayload,
        grantSourceBoundActions,
      },
      run: {
        effectiveIceRunSubroutines,
        startRun: (
          state,
          serverId,
          accessCount,
          options,
          pendingSuccessBonusCredits,
          legalAction,
        ) =>
          runtimePorts.startRun(
            state,
            serverId,
            pendingSuccessBonusCredits,
            accessCount,
            options,
            legalAction,
          ),
        finishRun: (state, legalAction, successful) =>
          finishRun(state, successful, legalAction),
      },
      hiddenZone: {
        runtimeDepsHost: hiddenZoneRuntimeDepsHost(),
        startCorpDiscardHqWithRetainPayment: (
          state,
          legalAction,
          sourceCardId,
          retainCostPerCard,
        ) =>
          startCorpDiscardHqWithRetainPaymentChoice(
            runtimePorts.hiddenZoneNonSearchChoiceHandlerHost(
              state,
              legalAction,
            ),
            { sourceCardId, retainCostPerCard },
          ),
      },
      install: {
        runtimeDepsHost: installRezRuntimeDepsHost(),
      },
      trace: traceRuntimeDepsHost(),
      counters: counterLifecycleRuntimeDepsHost(),
      callbacks: {
        effectAdapters: cardImplementationEffectAdapters,
        shuffleSourceIntoCorpRd: (state, sourceCardId, sourceDefinitionId) =>
          runtimePorts.shuffleCorpCardIntoRd(
            state,
            sourceCardId,
            sourceDefinitionId,
            "lifecycle",
          ),
        trashCorpInstalledCardsInSourceServer:
          runtimePorts.trashCorpInstalledCardsInScoredSourceServer,
        trashCorpInstalledCardToArchives: (
          state,
          legalAction,
          targetCardId,
        ) => {
          runtimePorts.trashCorpInstalledCardToArchives(
            state,
            targetCardId,
            legalAction,
          );
          return { publicPayload: {} };
        },
        awardRunnerEventAgendaPoint: runtimePorts.awardRunnerEventAgendaPoint,
        scoreSourceAsAgenda: scoreInstalledRunnerProgramAsAgenda,
        installedAdvanceableCorpCardTargetCount: (state) =>
          runtimePorts.advanceableInstalledCardTargets(state).length,
        moveAdvancementCounterOptionCount: (
          state,
          sourceCardId,
          source,
          maxAmount,
          minimumAmount,
        ) =>
          runtimePorts.moveAdvancementOptions(
            state,
            sourceCardId,
            source,
            maxAmount,
            minimumAmount,
          ).length,
        discardRandomCorpHqCards: (state, sourceDefinitionId, count) =>
          runtimePorts.discardRandomCorpHqCards(
            state,
            count,
            [51, sourceDefinitionId],
          ),
        startDistributeAdvancementCounters:
          runtimePorts.startCardImplementationAdvancementDistributionChoice,
        startMoveAdvancementCounters:
          runtimePorts.startCardImplementationMoveAdvancementChoice,
        revealHiddenRunnerResource: (state, sourceCardId) =>
          hiddenRunnerResourceRevealPayload(state, sourceCardId),
        addCurrentRunAccessCount: runtimePorts.addCurrentRunAccessCount,
        passCurrentEncounteredIce: runtimePorts.passCurrentEncounteredIce,
        rezInstalledIceWithLifecycleCounters,
        replaceFortCardsFromHq,
        doubleChosenIceStrengthUntilEndOfTurn,
        trashTopCorpRdCards,
        rezCostForCard,
        startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice,
        startPaidSourceReturnToGripChoice:
          runtimePorts.startPaidSourceReturnToGripChoice,
        addRunnerTagsWithPrevention,
        addCorpPurgeableRunnerVirusCounter: (
          state,
          _legalAction,
          counterType,
          amount,
          sourceDefinitionId,
        ) => {
          let added = 0;
          let prevented = 0;
          let creditsPaid = 0;
          let preventionChargesSpent = 0;
          for (let index = 0; index < amount; index += 1) {
            const prevention =
              runtimePorts.preventOneVirusCounterWithCounterPrevention(state, {
                kind: "corp_pool",
                counterType,
              });
            if (prevention.deferred) continue;
            if (prevention.prevented) {
              prevented += 1;
              creditsPaid += prevention.creditsPaid;
              preventionChargesSpent += prevention.preventionChargesSpent;
            } else {
              added += addPurgeableRunnerVirusCounter(
                state,
                { kind: "corp" },
                counterType,
                1,
              );
            }
          }
          const countersAfter = purgeableRunnerVirusCounterAmount(
            state.purgeableRunnerVirusCounters?.corp,
            counterType,
          );
          return {
            amount: added,
            counterType,
            countersAfter,
            publicPayload: {
              counterType,
              addedCounterAmount: added,
              remainingCounters: countersAfter,
              sourceDefinitionId,
              ...(prevented > 0
                ? {
                    virusCounterAvoided: prevented,
                    counterPreventionCreditsPaid: creditsPaid,
                    runnerVirusCounterPreventionChargesSpent:
                      preventionChargesSpent,
                    corpCreditsAfter: state.corp.credits,
                  }
                : {}),
            },
          };
        },
      },
    };
  }

  const cardImplementationRuntimeDeps = createGameCardImplementationRuntimeDeps(
    gameCardImplementationRuntimeDepsHost(),
  );
  return {
    cardImplementationEffectAdapters,
    hiddenZoneRuntimeDepsHost,
    traceRuntimeDepsHost,
    installRezRuntimeDepsHost,
    counterLifecycleRuntimeDepsHost,
    gameCardImplementationRuntimeDepsHost,
    cardImplementationRuntimeDeps,
    resolveFortHqReplacementChoice,
    resolveSenatorialFieldTripChoice,
  };
}
