// Replay stays a wrapper until applyAction is moved behind the game boundary.
// Importing replay internals here now would create an index.ts cycle.
import { replayEvents } from "../index";

export function replayGameEvents(
  ...args: Parameters<typeof replayEvents>
): ReturnType<typeof replayEvents> {
  return replayEvents(...args);
}
