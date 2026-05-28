import {
  type CardInstanceId,
  type GameState,
  type SpecialZoneState,
} from "@netgrid/shared";
import {
  mustInstance,
  runnerInstalledCardIds,
} from "./card-server-lookup";
import { clearCardCounters } from "./turn-flags-counters";

export function ensureSpecialZones(state: GameState): SpecialZoneState {
  state.specialZones ??= { setAside: [], removedFromGame: [] };
  state.specialZones.setAside ??= [];
  state.specialZones.removedFromGame ??= [];
  return state.specialZones;
}

export function removeFromAllZones(state: GameState, cardId: string): void {
  const wasRunnerRigCard = runnerInstalledCardIds(state).includes(cardId);
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (id) => id !== cardId,
  );
  const specialZones = ensureSpecialZones(state);
  specialZones.setAside = specialZones.setAside.filter((id) => id !== cardId);
  specialZones.removedFromGame = specialZones.removedFromGame.filter(
    (id) => id !== cardId,
  );
  if (wasRunnerRigCard) clearCardCounters(state, cardId);
}

export function uninstallCorpInstalledCardToHq(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const instance = mustInstance(state.cardInstances, cardId);
  removeFromAllZones(state, cardId);
  state.corp.hq.unshift(cardId);
  state.cardInstances[cardId] = {
    ...instance,
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "hq" },
  };
}
