// ARCH-2 game facade: wiring only, no gameplay or card logic lives here yet.
// Later ARCH steps can move rule families behind this stable import edge.
export { createGame, createGameAfterSetup } from "./create-game";
export { applyGameAction } from "./apply-game-action";
export { legalActionsFor } from "./legal-actions";
export { playerViewFor } from "./player-view";
export { hashGameState, replayGameEvents } from "./replay";
export { validateGameStateForDebug } from "./validation";
