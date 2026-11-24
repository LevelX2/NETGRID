import {
  type CardDefinitionId,
  type CardInstanceId,
  type CounterType,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { corpInstalledCardIds, definitionFor, mustInstance } from "../state/card-server-lookup";
import { addCardCounter, cardCounter, spendCardCounter } from "../state/turn-flags-counters";
import {
  createDamageImminentEvent,
  openDamageResolutionWindow,
  resolveDamageImminentEvent,
  setDamagePayload,
} from "../damage/damage-core";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import type {
  CardRemainingReplacementLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardUniqueDirectLongtailImplementation,
} from "../../ability-engine/definition-types";
import type {
  RunnerTraceCounterEffectRuntime,
  RuntimeDeps,
} from "./runtime-shared";

export function createDamageTraceRuntimeHosts(
  deps: RuntimeDeps,
): import("./damage-trace-runtime-port").DamageTraceRuntimePort {
  function runnerTraceCounterEffectDefinitions(): RunnerTraceCounterEffectRuntime[] {
    return CARD_IMPLEMENTATIONS.flatMap((implementation) =>
      (implementation.runnerCounterEffects ?? []).map((counterEffect) => ({
        ...counterEffect,
        sourceDefinitionId: implementation.cardDefinitionId,
      })),
    );
  }

  function runnerCounterDisplayName(counterType: CounterType): string {
    if (counterType === "trace_tag_counter") return "Data-Raven-Counter";
    if (counterType === "baskerville") return "Baskerville-Counter";
    if (counterType === "cerberus") return "Cerberus-Counter";
    if (counterType === "mastiff") return "Mastiff-Counter";
    if (counterType === "doppelganger") return "Doppelganger-Counter";
    return "Counter";
  }

  function traceCounterEffectDefinitionFor(
    counterType: unknown,
  ): RunnerTraceCounterEffectRuntime | undefined {
    return runnerTraceCounterEffectDefinitions().find(
      (effect) => effect.counterType === counterType,
    );
  }

  function runnerUtilityLongtailKindForDefinition(
    definitionId: CardDefinitionId,
  ): CardRunnerUtilityLongtailImplementation["kind"] | undefined {
    return cardImplementationForDefinitionId(definitionId)
      ?.runnerUtilityLongtail?.kind;
  }

  function runnerUtilityLongtailKindForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardRunnerUtilityLongtailImplementation["kind"] | undefined {
    return runnerUtilityLongtailKindForDefinition(
      definitionFor(state, cardId).id,
    );
  }

  function runnerUtilityLongtailImplementationForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardRunnerUtilityLongtailImplementation | undefined {
    return cardImplementationForDefinitionId(definitionFor(state, cardId).id)
      ?.runnerUtilityLongtail;
  }

  function uniqueDirectLongtailImplementationForDefinition(
    definitionId: CardDefinitionId,
  ): CardUniqueDirectLongtailImplementation | undefined {
    return cardImplementationForDefinitionId(definitionId)
      ?.uniqueDirectLongtail;
  }

  function uniqueDirectLongtailKindForDefinition(
    definitionId: CardDefinitionId,
  ): CardUniqueDirectLongtailImplementation["kind"] | undefined {
    return uniqueDirectLongtailImplementationForDefinition(definitionId)?.kind;
  }

  function uniqueDirectLongtailImplementationForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardUniqueDirectLongtailImplementation | undefined {
    return uniqueDirectLongtailImplementationForDefinition(
      definitionFor(state, cardId).id,
    );
  }

  function uniqueDirectLongtailKindForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardUniqueDirectLongtailImplementation["kind"] | undefined {
    return uniqueDirectLongtailImplementationForCard(state, cardId)?.kind;
  }

  function remainingReplacementLongtailImplementationForDefinition(
    definitionId: CardDefinitionId,
  ): CardRemainingReplacementLongtailImplementation | undefined {
    return cardImplementationForDefinitionId(definitionId)
      ?.remainingReplacementLongtail;
  }

  function remainingReplacementLongtailKindForDefinition(
    definitionId: CardDefinitionId,
  ): CardRemainingReplacementLongtailImplementation["kind"] | undefined {
    return remainingReplacementLongtailImplementationForDefinition(definitionId)
      ?.kind;
  }

  function remainingReplacementLongtailImplementationForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardRemainingReplacementLongtailImplementation | undefined {
    return remainingReplacementLongtailImplementationForDefinition(
      definitionFor(state, cardId).id,
    );
  }

  function remainingReplacementLongtailKindForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardRemainingReplacementLongtailImplementation["kind"] | undefined {
    return remainingReplacementLongtailImplementationForCard(state, cardId)
      ?.kind;
  }

  function isObligationDebtDefinition(definitionId: CardDefinitionId): boolean {
    return (
      remainingReplacementLongtailKindForDefinition(definitionId) ===
      "obligation_debt"
    );
  }

  function isDrawTaxSourceDefinition(
    state: GameState,
    cardId: CardInstanceId,
  ): boolean {
    return (
      remainingReplacementLongtailKindForCard(state, cardId) ===
      "runner_draw_tax_tag"
    );
  }

  function isCorpInstalledEconomyCreditSource(
    state: GameState,
    cardId: CardInstanceId,
  ): boolean {
    return (
      remainingReplacementLongtailKindForCard(state, cardId) ===
      "basic_credit_diversion_to_recurring_credits"
    );
  }

  function isCorpTraceCounterPoolSource(
    state: GameState,
    cardId: CardInstanceId,
  ): boolean {
    return (
      remainingReplacementLongtailKindForCard(state, cardId) ===
      "trace_bit_counter_pool_asset"
    );
  }

  function applyRunnerTraceCounterRunStartEffects(
    state: GameState,
    legalAction?: LegalAction,
  ): boolean {
    return resolveRunnerTraceCounterRunStartEffects(state, legalAction, 0, 0, {
      totalDamageAmount: 0,
      totalCardsTrashed: 0,
    });
  }

  function resumeRunnerTraceCounterRunStartEffects(
    state: GameState,
    legalAction: LegalAction,
  ): boolean {
    const continuation = state.pendingRunStartDamageContinuation;
    if (!continuation)
      throw new Error("Es ist keine Run-Start-Damage-Fortsetzung offen.");
    if (state.pendingChoice || state.eventModificationWindow)
      throw new Error(
        "Das Run-Start-Damage-Fenster ist noch nicht abgeschlossen.",
      );
    if (state.run?.runId !== continuation.runId)
      throw new Error("Die Run-Start-Damage-Fortsetzung ist veraltet.");
    const currentDamage = Math.max(
      0,
      Number(legalAction.payload?.damageAmount ?? 0),
    );
    const currentCardsTrashed = Math.max(
      0,
      Number(legalAction.payload?.cardsTrashed ?? 0),
    );
    delete state.pendingRunStartDamageContinuation;
    return resolveRunnerTraceCounterRunStartEffects(
      state,
      legalAction,
      continuation.counterEffectIndex,
      continuation.nextCounterOrdinal,
      {
        totalDamageAmount: continuation.totalDamageAmount + currentDamage,
        totalCardsTrashed: continuation.totalCardsTrashed + currentCardsTrashed,
      },
    );
  }

  function resolveRunnerTraceCounterRunStartEffects(
    state: GameState,
    legalAction: LegalAction | undefined,
    startEffectIndex: number,
    startCounterOrdinal: number,
    aggregate: { totalDamageAmount: number; totalCardsTrashed: number },
  ): boolean {
    const counterEffects = runnerTraceCounterEffectDefinitions();
    for (
      let counterEffectIndex = startEffectIndex;
      counterEffectIndex < counterEffects.length;
      counterEffectIndex += 1
    ) {
      const counterEffect = counterEffects[counterEffectIndex]!;
      if (!counterEffect.runStart) continue;
      const counterCount = cardCounter(
        state,
        state.runner.identity,
        counterEffect.counterType,
      );
      if (counterCount <= 0) continue;
      const damageType =
        counterEffect.runStart.damageType === "brain" ? "core" : "net";
      const firstCounterOrdinal =
        counterEffectIndex === startEffectIndex ? startCounterOrdinal : 0;
      for (
        let counterOrdinal = firstCounterOrdinal;
        counterOrdinal < counterCount;
        counterOrdinal += 1
      ) {
        if (!legalAction)
          throw new Error("Run-Start-Damage benötigt eine LegalAction.");
        const event = createDamageImminentEvent(state, {
          damageId: `${state.run?.runId ?? state.stateVersion + 1}.${counterEffect.counterType}_counter_${counterOrdinal + 1}_start_damage`,
          damageType,
          amount: counterEffect.runStart.amountPerCounter,
          source: `counter:${counterEffect.sourceDefinitionId}`,
          randomSource: ["c", counterEffect.sourceDefinitionId],
        });
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          sourceDefinitionId: counterEffect.sourceDefinitionId,
          counterType: counterEffect.counterType,
          counterCount,
          [`${counterEffect.counterType}CounterCount`]: counterCount,
          damageSourceOrdinal: counterOrdinal + 1,
          damageSourceCount: counterCount,
        };
        if (openDamageResolutionWindow(state, event, legalAction)) {
          const runId = state.run?.runId;
          if (!runId)
            throw new Error("Run-Start-Damage hat keinen aktiven Run.");
          state.pendingRunStartDamageContinuation = {
            runId,
            counterEffectIndex,
            nextCounterOrdinal: counterOrdinal + 1,
            counterCount,
            sourceDefinitionId: counterEffect.sourceDefinitionId,
            counterType: counterEffect.counterType,
            damageType,
            amountPerCounter: counterEffect.runStart.amountPerCounter,
            totalDamageAmount: aggregate.totalDamageAmount,
            totalCardsTrashed: aggregate.totalCardsTrashed,
          };
          return true;
        }
        const summary = resolveDamageImminentEvent(state, event);
        aggregate.totalDamageAmount += summary.amount;
        aggregate.totalCardsTrashed += summary.cardsTrashed;
        setDamagePayload(legalAction, summary);
        if (state.winner) return false;
      }
    }
    if (legalAction && aggregate.totalDamageAmount >= 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        damageResolved: true,
        damageAmount: aggregate.totalDamageAmount,
        cardsTrashed: aggregate.totalCardsTrashed,
      };
    }
    return false;
  }

  function corpTraceCounterPoolSourceIds(state: GameState): CardInstanceId[] {
    return corpInstalledCardIds(state)
      .filter((cardId) => {
        const instance = state.cardInstances[cardId];
        return (
          instance?.rezzed === true &&
          isCorpTraceCounterPoolSource(state, cardId)
        );
      })
      .sort();
  }

  function corpTraceCounterPoolCounterType(
    state: GameState,
    cardId: CardInstanceId,
  ): "bit" | "power" {
    return remainingReplacementLongtailImplementationForCard(state, cardId)
      ?.kind === "trace_bit_counter_pool_asset"
      ? "bit"
      : "power";
  }

  function corpTraceCounterPoolTotal(state: GameState): number {
    return corpTraceCounterPoolSourceIds(state).reduce(
      (sum, cardId) =>
        sum +
        cardCounter(
          state,
          cardId,
          corpTraceCounterPoolCounterType(state, cardId),
        ),
      0,
    );
  }

  function spendCorpTraceCounterPoolCounters(
    state: GameState,
    amount: number,
  ): number {
    let remaining = Math.max(0, Math.floor(amount));
    let spent = 0;
    for (const cardId of corpTraceCounterPoolSourceIds(state)) {
      if (remaining <= 0) break;
      const counterType = corpTraceCounterPoolCounterType(state, cardId);
      const available = cardCounter(state, cardId, counterType);
      const cardSpent = Math.min(available, remaining);
      if (cardSpent <= 0) continue;
      spendCardCounter(state, cardId, counterType, cardSpent);
      remaining -= cardSpent;
      spent += cardSpent;
    }
    return spent;
  }

  function addCorpTraceCounterPoolCounters(state: GameState): number {
    let added = 0;
    for (const cardId of corpTraceCounterPoolSourceIds(state)) {
      addCardCounter(
        state,
        cardId,
        corpTraceCounterPoolCounterType(state, cardId),
        1,
      );
      added += 1;
    }
    return added;
  }

  function rabbitTraceLimitReductionForIceTrace(state: GameState): number {
    const reductions = state.runner.rig.programs.map((cardId) => {
      const implementation = runnerUtilityLongtailImplementationForCard(
        state,
        cardId,
      );
      if (
        implementation?.kind === "rabbit_ice_trace_limit_reduction" &&
        mustInstance(state.cardInstances, cardId).rezzed
      )
        return implementation.amount;
      return 0;
    });
    return Math.max(0, ...reductions);
  }

  return {
    runnerTraceCounterEffectDefinitions,
    runnerCounterDisplayName,
    traceCounterEffectDefinitionFor,
    runnerUtilityLongtailKindForDefinition,
    runnerUtilityLongtailKindForCard,
    runnerUtilityLongtailImplementationForCard,
    uniqueDirectLongtailImplementationForDefinition,
    uniqueDirectLongtailKindForDefinition,
    uniqueDirectLongtailImplementationForCard,
    uniqueDirectLongtailKindForCard,
    remainingReplacementLongtailImplementationForDefinition,
    remainingReplacementLongtailKindForDefinition,
    remainingReplacementLongtailImplementationForCard,
    remainingReplacementLongtailKindForCard,
    isObligationDebtDefinition,
    isDrawTaxSourceDefinition,
    isCorpInstalledEconomyCreditSource,
    isCorpTraceCounterPoolSource,
    applyRunnerTraceCounterRunStartEffects,
    resumeRunnerTraceCounterRunStartEffects,
    corpTraceCounterPoolSourceIds,
    corpTraceCounterPoolCounterType,
    corpTraceCounterPoolTotal,
    spendCorpTraceCounterPoolCounters,
    addCorpTraceCounterPoolCounters,
    rabbitTraceLimitReductionForIceTrace,
  };
}
