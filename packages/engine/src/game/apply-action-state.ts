import type { GameState } from "@netgrid/shared";

export function cloneGameStateForAction(state: GameState): GameState {
  return {
    ...cloneState({ ...state, eventLog: [] }),
    eventLog: state.eventLog.slice(),
  };
}

function cloneState<T>(state: T): T {
  return structuredClone(state) as T;
}
