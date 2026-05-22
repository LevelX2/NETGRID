// ARCH-2 game facade: debug validation keeps delegating to the legacy engine.
// This file must stay free of gameplay mutation and card-specific exceptions.
import { validateGameState } from "../index";

export function validateGameStateForDebug(
  ...args: Parameters<typeof validateGameState>
): ReturnType<typeof validateGameState> {
  return validateGameState(...args);
}
