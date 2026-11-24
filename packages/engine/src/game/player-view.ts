import type { GameState, PlayerView, Side } from "@netgrid/shared";
import { legalActionsFor } from "./legal-actions";
import { buildPlayerViewProjection } from "./view/player-view-projection";

export { buildPlayerViewProjection } from "./view/player-view-projection";

export function getPlayerView(
  state: GameState,
  side: Side,
  options: { publicEventLimit?: number } = {},
): PlayerView {
  return buildPlayerViewProjection(state, side, legalActionsFor(state, side), options);
}

export function playerViewFor(state: GameState, side: Side): PlayerView {
  return getPlayerView(state, side);
}
