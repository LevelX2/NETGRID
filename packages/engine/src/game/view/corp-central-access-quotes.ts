import type {
  CorpCentralAccessQuote,
  CorpCurrentCentralAccessQuote,
  GameState,
} from "@netgrid/shared";
import {
  accessCountModifierFactsAreComplete,
  quoteAccessCountModifiers,
  quoteCentralAccessCounterModifiers,
} from "../../ability-engine/access-count-modifiers";
import { successfulRunEffectTargetMatches } from "../run/run-server-identities";

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

/** Committed stored-card depth, without conditional bonuses that have yet to apply. */
export function quoteCorpCurrentCentralAccess(
  state: GameState,
  forecasts: readonly CorpCentralAccessQuote[] | undefined,
): CorpCurrentCentralAccessQuote | undefined {
  const run = state.run;
  if (!run) return undefined;
  const matchingTarget = successfulRunEffectTargetMatches(run);
  const serverId =
    run.breach?.serverId ??
    (matchingTarget ? run.accessServerOverride : undefined) ??
    run.attackedServerId;
  if (serverId !== "hq" && serverId !== "rd") return undefined;
  const forecast = forecasts?.find((quote) => quote.serverId === serverId);
  if (!forecast) return undefined;
  let accessCount: number;
  if (run.breach) {
    accessCount = run.breach.queue.filter(
      (entry) =>
        entry.zone === serverId &&
        (entry.status === "pending" || entry.status === "accessed"),
    ).length;
  } else if (!matchingTarget) {
    // The Engine resets a fixed-fort effect to an ordinary run after deflection.
    accessCount = forecast.effectiveAccessCount;
  } else {
    const committedCount = run.accessCount;
    if (
      committedCount === undefined ||
      !Number.isSafeInteger(committedCount) ||
      committedCount < 1
    )
      return undefined;
    // R&D's installed bonus is committed at run start. HQ's is added at breach.
    accessCount =
      committedCount +
      (serverId === "hq" ? forecast.effectiveAccessCount - 1 : 0);
  }
  if (!Number.isSafeInteger(accessCount) || accessCount < 0) return undefined;
  return {
    stateVersion: state.stateVersion,
    runId: run.runId,
    serverId,
    accessCount,
  };
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
