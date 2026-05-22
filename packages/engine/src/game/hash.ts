// Deterministic StateHash helpers. Hash output is part of replay stability and
// must stay bit-identical across facade moves.
import type { GameState, StateHash } from "@netgrid/shared";
import { hashStateSnapshot } from "../state-hash";

export function hashState(state: GameState): StateHash {
  return hashStateSnapshot(state);
}

export function hashGameState(state: GameState): StateHash {
  return hashState(state);
}
