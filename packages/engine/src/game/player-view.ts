// ARCH-2 game facade: expose player view projection under a game-oriented name.
// Public payload redaction remains centralized in the existing engine code.
import { getPlayerView } from "../index";

export function playerViewFor(
  ...args: Parameters<typeof getPlayerView>
): ReturnType<typeof getPlayerView> {
  return getPlayerView(...args);
}
