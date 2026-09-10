import type { CorpCentralAccessQuote, GameState } from "@netgrid/shared";
import {
  accessCountModifierFactsAreComplete,
  quoteAccessCountModifiers,
  quoteCentralAccessCounterModifiers,
} from "../../ability-engine/access-count-modifiers";

/**
 * Produces Corp-private, state-version-bound forecasts for central access.
 * It intentionally exposes only engine-derived modifier facts, never Runner
 * card instances, titles, or hidden Corp cards.
 */
export function quoteCorpCentralAccesses(
  state: GameState,
): readonly CorpCentralAccessQuote[] | undefined {
  const hq = quoteCentralAccess(state, "hq");
  const rd = quoteCentralAccess(state, "rd");
  return hq && rd ? [hq, rd] : undefined;
}

function quoteCentralAccess(
  state: GameState,
  serverId: "hq" | "rd",
): CorpCentralAccessQuote | undefined {
  if (!accessCountModifierFactsAreComplete(state, serverId)) return undefined;
  const modifiers = quoteAccessCountModifiers(state, serverId);
  if (!Number.isSafeInteger(modifiers.amount) || modifiers.amount < 0)
    return undefined;
  const counterModifiers = quoteCentralAccessCounterModifiers(state, serverId);
  if (!counterModifiers) return undefined;
  const sourceDefinitionIds = [
    ...modifiers.sourceDefinitionIds,
    ...counterModifiers.sourceDefinitionIds,
  ].sort();
  const effectiveAccessCount = 1 + modifiers.amount + counterModifiers.amount;
  if (!Number.isSafeInteger(effectiveAccessCount) || effectiveAccessCount < 1)
    return undefined;

  return {
    serverId,
    stateVersion: state.stateVersion,
    complete: true,
    effectiveAccessCount,
    isMultiaccess: effectiveAccessCount > 1,
    sourceDefinitionIds: [...new Set(sourceDefinitionIds)],
    serverBoundEffects: counterModifiers.effects,
  };
}
