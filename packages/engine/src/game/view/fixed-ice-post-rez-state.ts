import type { CardInstanceId, GameState } from "@netgrid/shared";

/** Fixed rez flags only. Callers own lifecycle and variable-choice admission. */
export function projectFixedCorpIcePostRezState(
  state: GameState,
  iceId: CardInstanceId,
): GameState | undefined {
  const source = state.cardInstances[iceId];
  if (!source || source.rezzed) return undefined;
  return {
    ...state,
    cardInstances: {
      ...state.cardInstances,
      [iceId]: { ...source, faceup: true, rezzed: true },
    },
  };
}
