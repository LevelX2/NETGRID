/**
 * Evaluates declarative CardImplementation ability limits.
 *
 * This module owns generic limit keys and checks, while the actual turn-flag
 * storage is supplied by the host through dependencies. It currently supports
 * only the narrow once-per-turn-per-source shape used by migrated cards.
 */
import type { CardInstanceId, GameState } from "@netgrid/shared";
import type { CardAbilityLimitImplementation } from "./definition-types";

export type CardImplementationAbilityLimitHost = {
  usedSourceIdsThisTurn: (
    state: GameState,
    limit: CardAbilityLimitImplementation,
  ) => readonly CardInstanceId[] | undefined;
  setUsedSourceIdsThisTurn: (
    state: GameState,
    limit: CardAbilityLimitImplementation,
    sourceCardIds: readonly CardInstanceId[],
  ) => void;
};

/**
 * Host binding for the current Runner-turn source-wide limit storage.
 *
 * The flag lives in GameState for replay determinism; this adapter deliberately
 * does not introduce a second limit store or Broker-specific runtime branch.
 */
export const runnerCardImplementationAbilityLimitHost: CardImplementationAbilityLimitHost =
  {
    usedSourceIdsThisTurn: (state) =>
      state.runnerTurnFlags?.brokerActionCardIdsThisTurn,
    setUsedSourceIdsThisTurn: (state, _limit, sourceCardIds) => {
      const flags = (state.runnerTurnFlags ??= {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      });
      flags.brokerActionCardIdsThisTurn = sourceCardIds.slice().sort();
    },
  };

export function cardImplementationAbilityLimitKey(
  limit: CardAbilityLimitImplementation,
): string {
  assertSupportedAbilityLimit(limit);
  return `${limit.kind}:${limit.scope}`;
}

/**
 * Checks whether the declared limit allows the source to be used right now.
 *
 * Runtime code calls this during action generation and stale-action
 * revalidation before costs are paid.
 */
export function canUseCardImplementationAbilityLimit(
  host: CardImplementationAbilityLimitHost,
  state: GameState,
  sourceCardId: CardInstanceId | undefined,
  limit: CardAbilityLimitImplementation | undefined,
): boolean {
  if (!limit) return true;
  if (!sourceCardId) return false;
  assertSupportedAbilityLimit(limit);
  return !sourceIdsUsedForLimit(host, state, limit).includes(sourceCardId);
}

export function markCardImplementationAbilityLimitUsed(
  host: CardImplementationAbilityLimitHost,
  state: GameState,
  sourceCardId: CardInstanceId,
  limit: CardAbilityLimitImplementation,
): void {
  // Marking happens only after successful resolution. The host owns persistence;
  // this helper only defines the CardImplementation-level keying contract.
  assertSupportedAbilityLimit(limit);
  const used = sourceIdsUsedForLimit(host, state, limit);
  if (used.includes(sourceCardId)) return;
  host.setUsedSourceIdsThisTurn(
    state,
    limit,
    [...used, sourceCardId].sort(),
  );
}

export function cardImplementationAbilityLimitFailureMessage(
  limit: CardAbilityLimitImplementation | undefined,
): string | undefined {
  if (!limit) return undefined;
  assertSupportedAbilityLimit(limit);
  if (limit.kind === "once_per_turn_per_source")
    return "Diese Kartenquelle wurde in diesem Zug bereits genutzt.";
  if (limit.kind === "one_base_link_card_per_trace_attempt")
    return "In diesem Trace wurde bereits eine Base-Link-Karte genutzt.";
  if (limit.kind === "once_per_trace_per_source")
    return "Diese Kartenquelle wurde in diesem Trace bereits genutzt.";
  return undefined;
}

function sourceIdsUsedForLimit(
  host: CardImplementationAbilityLimitHost,
  state: GameState,
  limit: CardAbilityLimitImplementation,
): readonly CardInstanceId[] {
  return host.usedSourceIdsThisTurn(state, limit) ?? [];
}

function assertSupportedAbilityLimit(
  limit: CardAbilityLimitImplementation,
): void {
  if (
    limit.kind === "once_per_turn_per_source" &&
    limit.scope === "any_ability_on_source"
  )
    return;
  if (
    limit.kind === "one_base_link_card_per_trace_attempt" &&
    limit.scope === "trace_attempt"
  )
    return;
  if (limit.kind === "once_per_trace_per_source" && limit.scope === "source")
    return;
  const unsupported = limit as { kind?: string; scope?: string };
  throw new Error(
    `Unsupported card implementation ability limit: ${unsupported.kind ?? "unknown"}:${unsupported.scope ?? "unknown"}`,
  );
}
