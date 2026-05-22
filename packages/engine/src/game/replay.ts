// ARCH-2 game facade: stable names for deterministic hash and replay helpers.
// Replay internals stay in index.ts until the game boundary is inverted.
import { hashState, replayEvents } from "../index";

export function hashGameState(
  ...args: Parameters<typeof hashState>
): ReturnType<typeof hashState> {
  return hashState(...args);
}

export function replayGameEvents(
  ...args: Parameters<typeof replayEvents>
): ReturnType<typeof replayEvents> {
  return replayEvents(...args);
}
