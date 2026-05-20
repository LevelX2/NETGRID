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
  throw new Error(
    `Unsupported card implementation ability limit: ${limit.kind}:${limit.scope}`,
  );
}
