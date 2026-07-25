/**
 * Quotes passive additional-access modifiers from CardImplementation cards.
 *
 * This module only reads installed Runner sources for the current access
 * server. It does not start runs, access cards, or replace hidden-zone payloads.
 */
import type {
  CardDefinitionId,
  CorpCentralAccessQuote,
  GameState,
  PurgeableRunnerVirusCounterType,
  ServerId,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForRunnerInstalled,
  isPublicRunnerInstalledModifier,
} from "./card-implementation-modifiers";
import { CARD_IMPLEMENTATIONS } from "../card-implementations/registry";

export type AccessCountModifierQuote = {
  amount: number;
  sourceDefinitionIds: CardDefinitionId[];
};

export type CentralAccessCounterModifierQuote = {
  amount: number;
  sourceDefinitionIds: CardDefinitionId[];
  effects: CorpCentralAccessQuote["serverBoundEffects"];
};

export function quoteAccessCountModifiers(
  state: GameState,
  serverId: Extract<ServerId, "hq" | "rd">,
): AccessCountModifierQuote {
  const sourceDefinitionIds: CardDefinitionId[] = [];
  let amount = 0;
  for (const active of activeCardImplementationModifiersForRunnerInstalled(
    state,
    "access_count",
  )) {
    if (!isPublicRunnerInstalledModifier(active.modifier)) continue;
    if (active.modifier.server !== serverId) continue;
    if (
      !Number.isInteger(active.modifier.amount) ||
      active.modifier.amount <= 0
    )
      continue;
    amount += active.modifier.amount;
    for (let index = 0; index < active.modifier.amount; index += 1)
      sourceDefinitionIds.push(active.sourceDefinitionId);
  }
  return {
    amount,
    sourceDefinitionIds: sourceDefinitionIds.sort(),
  };
}

/**
 * A complete quote must not turn malformed active modifier state into a
 * silently smaller access count.  Kept alongside the quote so consumers use
 * exactly the same active-source and visibility boundary.
 */
export function accessCountModifierFactsAreComplete(
  state: GameState,
  serverId: Extract<ServerId, "hq" | "rd">,
): boolean {
  for (const active of activeCardImplementationModifiersForRunnerInstalled(
    state,
    "access_count",
  )) {
    if (!isPublicRunnerInstalledModifier(active.modifier)) continue;
    if (active.modifier.server !== serverId) continue;
    if (
      !Number.isSafeInteger(active.modifier.amount) ||
      active.modifier.amount <= 0 ||
      !active.sourceDefinitionId
    )
      return false;
  }
  return true;
}

/**
 * Quotes public central-access modifiers backed by Corp-hosted purgeable
 * Runner counters. Card-specific formulas live only in CardImplementation
 * declarations; this generic evaluator has no card-id or counter-name branch.
 */
export function quoteCentralAccessCounterModifiers(
  state: GameState,
  serverId: Extract<ServerId, "hq" | "rd">,
): CentralAccessCounterModifierQuote | undefined {
  const effects: CorpCentralAccessQuote["serverBoundEffects"] = [];
  const sourceDefinitionIds: CardDefinitionId[] = [];
  const seenCounterKinds = new Set<PurgeableRunnerVirusCounterType>();
  let amount = 0;

  for (const implementation of CARD_IMPLEMENTATIONS) {
    const virusCounter = implementation.virusCounter;
    const modifier = virusCounter?.centralAccessCountModifier;
    if (!virusCounter || !modifier || modifier.server !== serverId) continue;
    if (
      modifier.visibility !== "public" ||
      virusCounter.addOnSuccessfulRun?.target !==
        "corp_purgeable_runner_virus_counter" ||
      virusCounter.addOnSuccessfulRun.server !== serverId
    )
      return undefined;

    if (
      modifier.source !== "corp_purgeable_runner_virus_counter" ||
      modifier.counterKind !== virusCounter.counterKind
    )
      return undefined;
    const counterKind = modifier.counterKind;
    if (seenCounterKinds.has(counterKind)) return undefined;
    seenCounterKinds.add(counterKind);

    const raw = state.purgeableRunnerVirusCounters?.corp?.[counterKind] ?? 0;
    if (!Number.isSafeInteger(raw) || raw < 0) return undefined;
    if (raw === 0) continue;

    const additionalAccessCount =
      modifier.formula === "per_counter"
        ? raw
        : modifier.formula === "per_counter_after_first"
          ? Math.max(0, raw - 1)
          : undefined;
    if (
      additionalAccessCount === undefined ||
      !Number.isSafeInteger(additionalAccessCount)
    )
      return undefined;
    amount += additionalAccessCount;
    if (!Number.isSafeInteger(amount)) return undefined;

    sourceDefinitionIds.push(implementation.cardDefinitionId);
    effects.push({
      id: `corp:${counterKind}`,
      kind: "purgeable_runner_virus_counter_access_modifier",
      serverId,
      counterKind,
      formula: modifier.formula,
      sourceDefinitionId: implementation.cardDefinitionId,
      counterCount: raw,
      additionalAccessCount,
    });
  }

  return {
    amount,
    sourceDefinitionIds: sourceDefinitionIds.sort(),
    effects: effects.sort((left, right) => left.id.localeCompare(right.id)),
  };
}
