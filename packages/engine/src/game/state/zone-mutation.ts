import {
  type CardInstanceId,
  type CorpServer,
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

export function hostedCardsOn(
  state: GameState,
  hostId: CardInstanceId,
): CardInstanceId[] {
  return Object.entries(state.cardInstances)
    .filter(([, instance]) => instance.hostedOn === hostId)
    .map(([cardId]) => cardId)
    .sort();
}

export function setHostedOn(
  state: GameState,
  cardId: CardInstanceId,
  hostId: CardInstanceId,
): void {
  if (cardId === hostId)
    throw new Error("Eine Karte kann nicht auf sich selbst gehostet werden.");
  if (!state.cardInstances[hostId]) throw new Error("Host-Karte fehlt.");
  let current: CardInstanceId | undefined = hostId;
  while (current) {
    if (current === cardId)
      throw new Error("Hosting-Zyklus ist nicht erlaubt.");
    current = state.cardInstances[current]?.hostedOn;
  }
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    hostedOn: hostId,
  };
}

export function hasHostingCycle(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const seen = new Set<CardInstanceId>([cardId]);
  let current = state.cardInstances[cardId]?.hostedOn;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = state.cardInstances[current]?.hostedOn;
  }
  return false;
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

export function createRemote(state: GameState): CorpServer {
  const remoteIds = state.corp.servers
    .filter((server) => server.kind === "remote")
    .map((server) => Number(server.id.replace("remote_", "")));
  const nextId = Math.max(0, ...remoteIds) + 1;
  const server: CorpServer = {
    id: `remote_${nextId}`,
    kind: "remote",
    label: `Remote ${nextId}`,
    ice: [],
    root: [],
  };
  state.corp.servers.push(server);
  return server;
}

export function cleanupEmptyRemotes(state: GameState): void {
  state.corp.servers = state.corp.servers.filter(
    (server) =>
      server.kind !== "remote" ||
      server.ice.length > 0 ||
      server.root.length > 0 ||
      state.run?.attackedServerId === server.id,
  );
}
