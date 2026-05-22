// ARCH-2 game facade: wiring only, no gameplay or card logic lives here yet.
// Later ARCH steps can move rule families behind this stable import edge.
export { createGame, createGameAfterSetup } from "./create-game";
export { applyGameAction } from "./apply-game-action";
export { legalActionsFor } from "./legal-actions";
export { buildPlayerViewProjection, playerViewFor } from "./player-view";
export { hashGameState, hashState } from "./hash";
export { replayGameEvents } from "./replay";
export { validateGameState, validateGameStateForDebug } from "./validation";
