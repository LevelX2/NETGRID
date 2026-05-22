// ARCH-2 game facade: delegate creation to the current engine entrypoint.
// Keep this file free of card logic until create/setup internals are extracted.
import {
  createGame as createEngineGame,
  createGameAfterSetup as createEngineGameAfterSetup,
} from "../index";

export function createGame(
  ...args: Parameters<typeof createEngineGame>
): ReturnType<typeof createEngineGame> {
  return createEngineGame(...args);
}

export function createGameAfterSetup(
  ...args: Parameters<typeof createEngineGameAfterSetup>
): ReturnType<typeof createEngineGameAfterSetup> {
  return createEngineGameAfterSetup(...args);
}
