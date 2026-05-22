// ARCH-2 game facade: expose a game-named action entrypoint.
// The action pipeline remains in index.ts until later rule-family extraction.
import { applyAction } from "../index";

export function applyGameAction(
  ...args: Parameters<typeof applyAction>
): ReturnType<typeof applyAction> {
  return applyAction(...args);
}
