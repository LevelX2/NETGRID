import {
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";
import {
  resolveEndTurnTagSequence,
  resumeEndTurnTagSequence,
  type EndTurnTagContinuationHost,
} from "../turn/end-turn-tag-continuation";
import { definitionFor } from "../state/card-server-lookup";
import { credits } from "../state/economy-mutation";
import {
  cardInstanceWithoutCounters,
  ensureCorpTurnFlags,
  ensureRunnerTurnFlags,
} from "../state/turn-flags-counters";
import { removeFromAllZones } from "../state/zone-mutation";
import { addRunnerTagsWithPrevention, doDamage } from "../damage/damage-core";
import { maxHandSize } from "../../ability-engine/effective-values";
import { resolveCardImplementationEndOfRunnerTurnAction } from "../../ability-engine/card-implementation-runtime";
import type { AutomaticEffectCollector, RuntimeDeps } from "./runtime-shared";
import { currentTurnSerial } from "./turn-action-economy-runtime";

type TurnRuntimePort = import("./turn-runtime-port").TurnRuntimePort;
type TurnEndRuntimeResolvers = Pick<
  TurnRuntimePort,
  | "resolveEndTurnTagIfRunnerReceivedTag"
  | "resolveFieldReporterEndOfRunnerTurn"
  | "resolveDelayedEndTurnDamageEffects"
  | "endTurn"
  | "resumeEndTurnAfterTagPrevention"
  | "resolveTemporaryProgramInstallReturns"
  | "resolveCorpObligationEndOfTurn"
  | "startDiscardPhase"
  | "processDiscardStep"
  | "completeDiscardPhase"
>;

/**
 * Owns end-of-turn, discard and temporary-lifecycle sequencing. Cross-domain
 * links are read only when a resolver runs, after the aggregate turn runtime
 * has been composed.
 */
export function createTurnEndRuntimeResolvers(
  deps: RuntimeDeps,
  links: TurnRuntimePort,
): TurnEndRuntimeResolvers {
  function resolveEndTurnTagIfRunnerReceivedTag(
    state: GameState,
    legalAction: LegalAction,
  ): boolean {
    return resolveEndTurnTagSequence(
      endTurnTagContinuationHost(state),
      legalAction,
    );
  }

  function resolveFieldReporterEndOfRunnerTurn(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const sourceIds = state.runner.rig.resources
      .slice()
      .sort()
      .filter(
        (cardId) =>
          deps.runnerUtilityLongtailKindForCard(state, cardId) ===
          "field_reporter_end_turn_rezzed_ice_payout",
      );
    if (sourceIds.length === 0) return;
    const rezzedIceCount = Math.max(
      0,
      Math.floor(ensureRunnerTurnFlags(state).corpRezzedIceThisTurn ?? 0),
    );
    if (rezzedIceCount <= 0) return;
    let gained = 0;
    for (const sourceId of sourceIds) {
      const implementation = deps.runnerUtilityLongtailImplementationForCard(
        state,
        sourceId,
      );
      if (implementation?.kind !== "field_reporter_end_turn_rezzed_ice_payout")
        continue;
      gained += rezzedIceCount * implementation.amountPerRezzedIce;
    }
    if (gained <= 0) return;
    const sourceDefinitionIds = sourceIds.map(
      (sourceId) => definitionFor(state, sourceId).id,
    );
    const gain = credits(state, "runner", gained, {
      kind: "turn_effect",
      sourceDefinitionIds,
      reason: "field_reporter_end_turn_payout",
    });
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerUtilityAbility: "field_reporter_end_turn_rezzed_ice_payout",
      corpRezzedIceThisTurnCount: rezzedIceCount,
      gainedCredits: gain.creditedAmount,
      runnerCreditsAfter: gain.creditsAfter,
      sourceDefinitionId: sourceDefinitionIds[0]!,
      sourceCount: sourceIds.length,
    };
  }

  function resolveDelayedEndTurnDamageEffects(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const flags = ensureRunnerTurnFlags(state);
    const dueEffects = (flags.delayedEndTurnEffects ?? []).filter(
      (effect) => effect.kind === "damage",
    );
    if (dueEffects.length === 0) return;
    if (!dueEffects.every((effect) => effect.preventable === false))
      throw new Error(
        "Verhinderbarer verzögerter Schaden ist nicht implementiert.",
      );
    const damageSummaries = dueEffects.map((effect, index) => ({
      effect,
      summary: doDamage(state, {
        damageId: `runner.end.delayed_damage.${state.stateVersion}.${index}.${effect.sourceCardInstanceId}`,
        damageType: effect.damageType,
        amount: effect.amount,
        source: `runner_end:${effect.sourceDefinitionId}:${effect.sourceCardInstanceId}`,
      }),
    }));
    const totalDamage = damageSummaries.reduce(
      (sum, entry) => sum + entry.summary.amount,
      0,
    );
    const totalCardsTrashed = damageSummaries.reduce(
      (sum, entry) => sum + entry.summary.cardsTrashed,
      0,
    );
    const finalSummary = damageSummaries.at(-1)!.summary;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerUtilityAbility: "delayed_end_turn_damage",
      damageCannotBePrevented: true,
      damageResolved: true,
      damageType: finalSummary.damageType,
      damageAmount: totalDamage,
      cardsTrashed: totalCardsTrashed,
      flatline: damageSummaries.some((entry) => entry.summary.flatline),
      sourceDefinitionId: dueEffects[0]!.sourceDefinitionId,
      sourceCount: dueEffects.length,
      sourceCardInstanceIds: dueEffects
        .map((effect) => effect.sourceCardInstanceId)
        .sort()
        .join(","),
      delayedDamageResolutionCount: damageSummaries.length,
      ...(finalSummary.coreDamageAfter !== undefined
        ? { coreDamageAfter: finalSummary.coreDamageAfter }
        : {}),
    };
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      ...damageSummaries.map(({ effect, summary }, index) => ({
        effectId: `runner.end.delayed_damage.${state.stateVersion}.${index}.${effect.sourceCardInstanceId}`,
        kind: "damage" as const,
        visibility: "public" as const,
        side: "runner" as const,
        amount: summary.amount,
        reason: "end_of_turn",
        sourceDefinitionId: effect.sourceDefinitionId,
        damageType: summary.damageType,
        damageCannotBePrevented: true,
        cardsTrashed: summary.cardsTrashed,
        flatline: summary.flatline,
        ...(summary.coreDamageAfter !== undefined
          ? { coreDamageAfter: summary.coreDamageAfter }
          : {}),
      })),
    ];
    flags.delayedEndTurnEffects = (flags.delayedEndTurnEffects ?? []).filter(
      (effect) => effect.kind !== "damage",
    );
  }

  function resolveDelayedCorpInstalledTrashAtEndOfRunnerTurn(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const flags = ensureRunnerTurnFlags(state);
    const pendingIds = [
      ...new Set(flags.delayedCorpInstalledCardTrashAtTurnEndIds ?? []),
    ].sort();
    if (pendingIds.length === 0) return;
    delete flags.delayedCorpInstalledCardTrashAtTurnEndIds;
    const trashedDefinitionIds: CardDefinitionId[] = [];
    for (const cardId of pendingIds) {
      const instance = state.cardInstances[cardId];
      if (!instance || instance.zone.side !== "corp") continue;
      if (
        instance.zone.zone !== "serverIce" &&
        instance.zone.zone !== "serverRoot"
      )
        continue;
      trashedDefinitionIds.push(definitionFor(state, cardId).id);
      deps.trashCorpInstalledCardToArchives(state, cardId, legalAction);
    }
    if (trashedDefinitionIds.length === 0) return;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      corpInstalledCardsTrashedAtTurnEnd: trashedDefinitionIds.length,
      corpInstalledCardTrashAtTurnEndDefinitionIds: trashedDefinitionIds
        .sort()
        .join(","),
    };
  }

  function endTurn(
    state: GameState,
    side: Side,
    legalAction: LegalAction,
  ): void {
    if (side === "runner") {
      const resolvedOptionalSource =
        resolveCardImplementationEndOfRunnerTurnAction(
          deps.cardImplementationRuntimeDeps,
          state,
          legalAction,
        );
      if (state.winner) return;
      // Optional card sources resolve one at a time while the Runner action
      // window remains open. A later plain end_turn action closes the window
      // and starts automatic end-of-turn processing.
      if (resolvedOptionalSource) return;
      resolveFieldReporterEndOfRunnerTurn(state, legalAction);
      resolveDelayedEndTurnDamageEffects(state, legalAction);
      resolveDelayedCorpInstalledTrashAtEndOfRunnerTurn(state, legalAction);
      if (resolveEndTurnTagIfRunnerReceivedTag(state, legalAction)) return;
      resolveTemporaryProgramInstallReturns(state, legalAction);
      finishEndTurnAfterTagPrevention(state, side, legalAction);
      return;
    }
    if (resolveEndTurnTagIfRunnerReceivedTag(state, legalAction)) return;
    finishEndTurnAfterTagPrevention(state, side, legalAction);
  }

  function finishEndTurnAfterTagPrevention(
    state: GameState,
    side: Side,
    legalAction: LegalAction,
  ): void {
    if (side === "runner") {
      const flags = ensureRunnerTurnFlags(state);
      flags.stoleAgendaLastTurn = flags.stoleAgendaThisTurn;
      flags.stolenAgendaAdvancementCountersLastTurn =
        flags.stolenAgendaAdvancementCountersThisTurn ?? 0;
      flags.stoleAgendaThisTurn = false;
      flags.stolenAgendaIdsThisTurn = [];
      flags.stolenAgendaAdvancementCountersThisTurn = 0;
      flags.runnerReceivedTagThisTurn = false;
      flags.stoleResearchAgendaThisTurn = false;
      flags.stoleGrayOpsAgendaThisTurn = false;
      flags.stoleBlackOpsAgendaThisTurn = false;
      flags.runAttemptsLastTurn = flags.runAttemptsThisTurn ?? 0;
      flags.runAttemptsThisTurn = 0;
      flags.trashedNodeLastTurn = flags.trashedNodeThisTurn === true;
      flags.trashedNodeThisTurn = false;
      flags.trashedAdvertisementThisTurn = false;
      flags.trashedTransactionsThisTurn = false;
      delete state.runnerDelayedEffectInstances;
      flags.installedResourceIdsLastTurn = (
        flags.installedResourceIdsThisTurn ?? []
      ).slice();
      flags.installedResourceIdsThisTurn = [];
      flags.successfulHqRunThisTurn = false;
      flags.successfulRunThisTurn = false;
      delete flags.lastSuccessfulRunServerId;
      delete flags.currentRunnerActionOrdinal;
    } else {
      const corpFlags = ensureCorpTurnFlags(state);
      corpFlags.scoredBlackOpsAgendaLastTurn =
        corpFlags.scoredBlackOpsAgendaThisTurn;
      corpFlags.scoredBlackOpsAgendaThisTurn = false;
      resolveCorpObligationEndOfTurn(state, legalAction);
      if (state.winner) return;
      ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = false;
    }
    clearTemporaryIceStrengthModifiersUntilEndOfTurn(state, legalAction);
    clearTemporaryBreakerStrengthModifiersUntilEndOfTurn(state, legalAction);
    clearTemporaryRunnerMemoryLimitModifiersUntilEndOfTurn(state, legalAction);
    delete state.cancelledDamagePreventionSourceIdsUntilEndOfTurn;
    startDiscardPhase(state, side, legalAction);
  }

  function resumeEndTurnAfterTagPrevention(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    resumeEndTurnTagSequence(endTurnTagContinuationHost(state), legalAction);
  }

  function endTurnTagContinuationHost(
    state: GameState,
  ): EndTurnTagContinuationHost {
    return {
      state,
      sources: {
        activeSourceIds: () =>
          deps
            .rezzedCorpRootCardIds(state)
            .filter((cardId: CardInstanceId) =>
              deps.hasCorpUtilityKind(
                state,
                cardId,
                "end_turn_tag_if_runner_received_tag",
              ),
            )
            .sort(),
        definitionId: (cardId) => definitionFor(state, cardId).id,
      },
      tags: {
        addRunnerTagsWithPrevention: (
          legalAction,
          amount,
          sourceDefinitionId,
        ) =>
          addRunnerTagsWithPrevention(
            state,
            legalAction,
            amount,
            sourceDefinitionId,
          ),
      },
      finishEndTurn: (side, legalAction) => {
        if (side === "runner")
          resolveTemporaryProgramInstallReturns(state, legalAction);
        finishEndTurnAfterTagPrevention(state, side, legalAction);
      },
    };
  }

  function clearTemporaryIceStrengthModifiersUntilEndOfTurn(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const modifiers = state.temporaryIceStrengthModifiersUntilEndOfTurn ?? [];
    if (modifiers.length === 0) return;
    const currentSerial = currentTurnSerial(state);
    const remaining = [];
    let removedAmount = 0;
    const affectedDefinitionIds: CardDefinitionId[] = [];
    for (const modifier of modifiers) {
      if (modifier.turnSerial > currentSerial) {
        remaining.push(modifier);
        continue;
      }
      const instance = state.cardInstances[modifier.targetIceId];
      if (instance) {
        state.cardInstances[modifier.targetIceId] = {
          ...instance,
          strengthModifier: Math.max(
            0,
            Math.floor(instance.strengthModifier ?? 0) - modifier.amount,
          ),
        };
        affectedDefinitionIds.push(
          definitionFor(state, modifier.targetIceId).id,
        );
      }
      removedAmount += modifier.amount;
    }
    if (remaining.length > 0)
      state.temporaryIceStrengthModifiersUntilEndOfTurn = remaining;
    else delete state.temporaryIceStrengthModifiersUntilEndOfTurn;
    if (removedAmount <= 0) return;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      temporaryIceStrengthRemoved: removedAmount,
      temporaryIceStrengthTargetDefinitionIds: affectedDefinitionIds
        .sort()
        .join(","),
    };
  }

  function clearTemporaryBreakerStrengthModifiersUntilEndOfTurn(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const modifiers =
      state.temporaryBreakerStrengthModifiersUntilEndOfTurn ?? [];
    if (modifiers.length === 0) return;
    const currentSerial = currentTurnSerial(state);
    const remaining = modifiers.filter(
      (modifier) => modifier.turnSerial > currentSerial,
    );
    const expired = modifiers.filter(
      (modifier) => modifier.turnSerial <= currentSerial,
    );
    if (remaining.length > 0)
      state.temporaryBreakerStrengthModifiersUntilEndOfTurn = remaining;
    else delete state.temporaryBreakerStrengthModifiersUntilEndOfTurn;
    if (expired.length === 0) return;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      turnBreakerStrengthModifiersExpired: expired.length,
      turnBreakerStrengthBonusExpiredAmount: expired.reduce(
        (sum, modifier) => sum + modifier.amount,
        0,
      ),
    };
  }

  function clearTemporaryRunnerMemoryLimitModifiersUntilEndOfTurn(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const modifiers =
      state.temporaryRunnerMemoryLimitModifiersUntilEndOfTurn ?? [];
    if (modifiers.length === 0) return;
    const currentSerial = currentTurnSerial(state);
    const remaining = modifiers.filter(
      (modifier) => modifier.turnSerial > currentSerial,
    );
    const removedAmount = modifiers
      .filter((modifier) => modifier.turnSerial <= currentSerial)
      .reduce(
        (sum, modifier) => sum + Math.max(0, Math.floor(modifier.amount)),
        0,
      );
    if (remaining.length > 0)
      state.temporaryRunnerMemoryLimitModifiersUntilEndOfTurn = remaining;
    else delete state.temporaryRunnerMemoryLimitModifiersUntilEndOfTurn;
    if (removedAmount <= 0) return;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      temporaryRunnerMemoryLimitReductionRemoved: removedAmount,
    };
  }

  function resolveTemporaryProgramInstallReturns(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const pending = state.temporaryProgramInstallReturns ?? [];
    if (pending.length === 0) return;
    const returnedDefinitionIds: string[] = [];
    for (const entry of pending) {
      const cardId = entry.cardId;
      const instance = state.cardInstances[cardId];
      if (
        instance &&
        state.runner.rig.programs.includes(cardId) &&
        instance.zone.side === "runner" &&
        instance.zone.zone === "rig"
      ) {
        const definition = definitionFor(state, cardId);
        removeFromAllZones(state, cardId);
        state.runner.grip.push(cardId);
        if (deps.runnerProgramUsesMemory(state, cardId)) {
          state.runner.memoryUsed = Math.max(
            0,
            state.runner.memoryUsed - (definition.memoryCost ?? 0),
          );
        }
        state.cardInstances[cardId] = {
          ...cardInstanceWithoutCounters(instance),
          faceup: true,
          rezzed: true,
          zone: { side: "runner", zone: "grip" },
        };
        returnedDefinitionIds.push(definition.id);
      }
    }
    state.temporaryProgramInstallReturns = [];
    if (returnedDefinitionIds.length > 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "temporary_program_install_end_turn_return",
        returnedCount: returnedDefinitionIds.length,
        returnedCardDefinitionIds: returnedDefinitionIds.join(","),
      };
    }
  }

  function resolveCorpObligationEndOfTurn(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const obligations = deps.activeObligationCount(state);
    if (obligations <= 0) return;
    const creditsBefore = state.corp.credits;
    if (creditsBefore < obligations) {
      state.winner = "runner";
      state.gameEndReason = "obligation_debt_unpaid";
      state.phase = "game_over";
      state.timingPoint = "game.checkpoint";
      delete state.pendingChoice;
      delete state.run;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        obligationDebtAbility: "end_of_turn_payment",
        activeObligationDebtCount: obligations,
        obligationDebtPaymentDue: obligations,
        obligationDebtPaymentPaid: 0,
        obligationDebtPaymentFailed: true,
        corpCreditsBefore: creditsBefore,
        corpCreditsAfter: state.corp.credits,
      };
      return;
    }
    state.corp.credits -= obligations;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      obligationDebtAbility: "end_of_turn_payment",
      activeObligationDebtCount: obligations,
      obligationDebtPaymentDue: obligations,
      obligationDebtPaymentPaid: obligations,
      corpCreditsBefore: creditsBefore,
      corpCreditsAfter: state.corp.credits,
    };
  }

  function startDiscardPhase(
    state: GameState,
    side: Side,
    legalAction?: LegalAction,
  ): void {
    state.activeSide = side;
    if (side === "runner") {
      state.phase = "runner_discard_phase";
      state.timingPoint = "runner_discard.flatline_check";
      if (maxHandSize(state, "runner") < 0) {
        state.winner = "corp";
        state.gameEndReason = "flatline";
        state.phase = "game_over";
        state.timingPoint = "game.checkpoint";
        delete state.pendingChoice;
        delete state.run;
        return;
      }
      processDiscardStep(state, "runner", legalAction);
      return;
    }

    state.phase = "corp_discard_phase";
    state.timingPoint = "corp_discard.select_cards";
    processDiscardStep(state, "corp", legalAction);
  }

  function processDiscardStep(
    state: GameState,
    side: Side,
    legalAction?: LegalAction,
  ): void {
    const hand = deps.handForSide(state, side);
    const requiredDiscardCount = hand.length - maxHandSize(state, side);
    if (requiredDiscardCount <= 0) {
      completeDiscardPhase(state, side, legalAction);
      return;
    }
    state.timingPoint =
      side === "corp"
        ? "corp_discard.select_cards"
        : "runner_discard.select_cards";
    state.pendingChoice = deps.discardChoice(
      state,
      side,
      requiredDiscardCount,
      state.stateVersion + 1,
    );
  }

  function completeDiscardPhase(
    state: GameState,
    side: Side,
    legalAction?: LegalAction,
  ): void {
    const effects: AutomaticEffectCollector = [];
    if (side === "runner") {
      links.startCorpTurn(state, effects, legalAction);
      links.appendResolvedEffectsToPayload(legalAction, effects);
      return;
    }
    links.startRunnerTurn(state, effects, legalAction);
    links.appendResolvedEffectsToPayload(legalAction, effects);
  }

  return {
    resolveEndTurnTagIfRunnerReceivedTag,
    resolveFieldReporterEndOfRunnerTurn,
    resolveDelayedEndTurnDamageEffects,
    endTurn,
    resumeEndTurnAfterTagPrevention,
    resolveTemporaryProgramInstallReturns,
    resolveCorpObligationEndOfTurn,
    startDiscardPhase,
    processDiscardStep,
    completeDiscardPhase,
  };
}
