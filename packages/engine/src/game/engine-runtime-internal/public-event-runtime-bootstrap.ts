import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import * as runtimePorts from "./runtime-port-bindings";
import { type CardDefinition, type DeckDefinition, type EffectCommand, type GameState, type LegalAction, type ServerId, type Side, type ValidationResult } from "@netgrid/shared";
export { getLegalActions, legalActionsFor } from "../legal-actions";
export {
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "../events/build-event";
export { checkWinConditions } from "../win-conditions";
export { quoteCorpRezCost } from "../payment";
export { createGame, createGameAfterSetup } from "../create-game";
export { applyAction } from "../apply-action";
export { applyGameAction } from "../apply-game-action";
export { getPlayerView, playerViewFor } from "../player-view";
export { replayEvents, replayGameEvents } from "../replay";
export { redactPublicEventForSide } from "../view/public-event-view";
export { hashGameState, hashState } from "../hash";
import { validateGameState } from "../validation";
export { validateGameState, validateGameStateForDebug } from "../validation";

import { cloneState } from "./runtime-bootstrap-support";

type RunnerEventResolver = {
  name: string;
  startsRun?: boolean;
  requiresServer?: boolean;
  canPlay?: (state: GameState, definition: CardDefinition) => boolean;
  canPlayForServer?: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => boolean;
  resolve: (state: GameState, legalAction: LegalAction) => void;
};

export const RUNNER_EVENT_RESOLVERS: Record<string, RunnerEventResolver> = {};

export function validateDeckDefinition(
  deck: DeckDefinition,
  options: {
    expectedSide?: Side;
    allowedDeckIds?: string[];
    minimumAgendaPoints?: number;
  } = {},
): ValidationResult {
  const errors: string[] = [];
  if (options.allowedDeckIds && !options.allowedDeckIds.includes(deck.id))
    errors.push(`Deck ${deck.id} is not in the curated allowlist.`);
  if (options.expectedSide && deck.side !== options.expectedSide)
    errors.push(
      `Deck ${deck.id} has side ${deck.side}, expected ${options.expectedSide}.`,
    );

  const identity = CARD_DEFINITIONS_BY_ID[deck.identity];
  if (!identity)
    errors.push(
      `Deck ${deck.id} references missing identity ${deck.identity}.`,
    );
  else {
    if (identity.type !== "identity")
      errors.push(
        `Deck ${deck.id} identity ${deck.identity} is not an identity.`,
      );
    if (identity.side !== deck.side)
      errors.push(`Deck ${deck.id} identity ${deck.identity} has wrong side.`);
  }

  let agendaPointsTotal = 0;
  for (const entry of deck.cards) {
    const definition = CARD_DEFINITIONS_BY_ID[entry.id];
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0)
      errors.push(`Deck ${deck.id} has invalid quantity for ${entry.id}.`);
    if (!definition) {
      errors.push(`Deck ${deck.id} references unknown card ${entry.id}.`);
      continue;
    }
    if (
      runtimePorts.cardHasSubtype(definition, "unique") &&
      entry.quantity > 1
    ) {
      errors.push(
        `Deck ${deck.id} includes more than one copy of unique card ${entry.id}.`,
      );
    }
    if (definition.side !== deck.side)
      errors.push(`Deck ${deck.id} includes wrong-side card ${entry.id}.`);
    if (definition.implementationStatus !== "playable_mvp")
      errors.push(`Deck ${deck.id} includes non-playable card ${entry.id}.`);
    agendaPointsTotal += (definition.agendaPoints ?? 0) * entry.quantity;
  }
  if (
    deck.side === "corp" &&
    options.minimumAgendaPoints !== undefined &&
    agendaPointsTotal < options.minimumAgendaPoints
  ) {
    errors.push(
      `Deck ${deck.id} has ${agendaPointsTotal} agenda points, expected at least ${options.minimumAgendaPoints}.`,
    );
  }

  return { ok: errors.length === 0, errors };
}

export function applyEffectCommands(
  state: GameState,
  commands: EffectCommand[],
): GameState {
  const next = cloneState(state);
  runtimePorts.executeEffectCommands(next, commands);
  const validation = validateGameState(next);
  if (!validation.ok)
    throw new Error(
      validation.errors[0] ?? "Effect command left invalid state.",
    );
  return next;
}
