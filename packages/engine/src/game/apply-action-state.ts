import type { GameState } from "@netgrid/shared";

export function cloneGameStateForAction(state: GameState): GameState {
  return {
    ...structuredClone({ ...state, eventLog: [] }),
    eventLog: state.eventLog.slice(),
  };
}
