/**
 * Quotes passive additional-access modifiers from CardImplementation cards.
 *
 * This module only reads installed Runner sources for the current access
 * server. It does not start runs, access cards, or replace hidden-zone payloads.
 */
import type { CardDefinitionId, GameState, ServerId } from "@netgrid/shared";
import {
  activeCardImplementationModifiersForRunnerInstalled,
  isPublicRunnerInstalledModifier,
} from "./card-implementation-modifiers";

export type AccessCountModifierQuote = {
  amount: number;
  sourceDefinitionIds: CardDefinitionId[];
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
