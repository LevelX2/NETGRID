import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type CounterType,
  type LegalAction,
  type ResolvedGameEffect,
  type Side,
} from "@netgrid/shared";
import type { AutomaticEffectCollector, RuntimeDeps } from "./runtime-shared";

type TurnRuntimePort = import("./turn-runtime-port").TurnRuntimePort;
type TurnEffectRuntimeResolvers = Pick<
  TurnRuntimePort,
  | "appendResolvedEffectsToPayload"
  | "automaticGainCreditsEffect"
  | "automaticLoseCreditsEffect"
  | "automaticDrawCardsEffect"
  | "automaticTagEffect"
  | "automaticTrashCardEffect"
  | "automaticCounterChangeEffect"
  | "automaticStealAgendaEffect"
  | "publicCardTitle"
>;

/**
 * Owns automatic turn-effect collection and public effect metadata.
 * Cross-domain links are read only when a resolver runs, after the aggregate
 * turn runtime has been composed.
 */
export function createTurnEffectRuntimeResolvers(
  deps: RuntimeDeps,
  links: TurnRuntimePort,
): TurnEffectRuntimeResolvers {
  function appendResolvedEffectsToPayload(
    legalAction: LegalAction | undefined,
    effects: AutomaticEffectCollector,
  ): void {
    if (!legalAction || effects.length === 0) return;
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      ...effects,
    ];
  }

  function automaticGainCreditsEffect(
    effectId: string,
    side: Side,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ): ResolvedGameEffect {
    return {
      effectId,
      kind: "gain_credits",
      visibility: "public",
      side,
      amount,
      reason: "start_of_turn",
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
    };
  }

  function automaticLoseCreditsEffect(
    effectId: string,
    side: Side,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ): ResolvedGameEffect {
    return {
      effectId,
      kind: "lose_credits",
      visibility: "public",
      side,
      amount,
      reason: "start_of_turn",
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
    };
  }

  function automaticDrawCardsEffect(
    effectId: string,
    side: Side,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ): ResolvedGameEffect {
    return {
      effectId,
      kind: "draw_cards",
      visibility: "public",
      side,
      amount,
      reason: "start_of_turn",
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
    };
  }

  function automaticTagEffect(
    effectId: string,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ): ResolvedGameEffect {
    return {
      effectId,
      kind: "add_tags",
      visibility: "public",
      side: "runner",
      amount,
      reason: "start_of_turn",
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
    };
  }

  function automaticTrashCardEffect(
    effectId: string,
    side: Side,
    cardDefinitionId: CardDefinitionId,
    sourceDefinitionId: CardDefinitionId,
  ): ResolvedGameEffect {
    return {
      effectId,
      kind: "trash_card",
      visibility: "public",
      side,
      reason: "start_of_turn",
      cardDefinitionId,
      cardTitle: publicCardTitle(cardDefinitionId),
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
    };
  }

  function automaticCounterChangeEffect(
    effectId: string,
    side: Side,
    sourceDefinitionId: CardDefinitionId,
    counterType: CounterType,
    remainingCounters: number,
    addedCounterAmount: number,
  ): ResolvedGameEffect {
    return {
      effectId,
      kind: "counter_change",
      visibility: "public",
      side,
      amount: remainingCounters,
      reason: "start_of_turn",
      counterType,
      remainingCounters,
      addedCounterAmount,
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
    };
  }

  function automaticStealAgendaEffect(
    effectId: string,
    cardDefinitionId: CardDefinitionId,
    sourceDefinitionId: CardDefinitionId,
    amount: number,
  ): ResolvedGameEffect {
    return {
      effectId,
      kind: "steal_agenda",
      visibility: "public",
      side: "runner",
      amount,
      reason: "start_of_turn",
      cardDefinitionId,
      cardTitle: publicCardTitle(cardDefinitionId),
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
    };
  }

  function publicCardTitle(definitionId: CardDefinitionId): string {
    return CARD_DEFINITIONS_BY_ID[definitionId]?.title ?? definitionId;
  }

  return {
    appendResolvedEffectsToPayload,
    automaticGainCreditsEffect,
    automaticLoseCreditsEffect,
    automaticDrawCardsEffect,
    automaticTagEffect,
    automaticTrashCardEffect,
    automaticCounterChangeEffect,
    automaticStealAgendaEffect,
    publicCardTitle,
  };
}
