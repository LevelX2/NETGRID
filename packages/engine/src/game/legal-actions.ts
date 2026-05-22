// ARCH-2 game facade: expose legal action lookup under a game-oriented name.
// No timing, payment, run, or card legality logic is implemented here yet.
import { getLegalActions } from "../index";

export function legalActionsFor(
  ...args: Parameters<typeof getLegalActions>
): ReturnType<typeof getLegalActions> {
  return getLegalActions(...args);
}
