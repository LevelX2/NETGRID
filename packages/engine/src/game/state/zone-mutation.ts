import {
  type CardInstanceId,
  type CorpServer,
  type GameState,
  type SpecialZoneState,
} from "@netgrid/shared";
import { mustInstance, runnerInstalledCardIds } from "./card-server-lookup";
import { nextCanonicalRemoteServerId } from "./remote-server-id";
import { clearCardCounters } from "./turn-flags-counters";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

export function ensureSpecialZones(state: GameState): SpecialZoneState {
  state.specialZones ??= { setAside: [], removedFromGame: [] };
  state.specialZones.setAside ??= [];
  state.specialZones.removedFromGame ??= [];
  return state.specialZones;
}

export function removeFromAllZones(state: GameState, cardId: string): void {
  const instanceBeforeMove = state.cardInstances[cardId];
  const wasInstalledCard =
    runnerInstalledCardIds(state).includes(cardId) ||
    state.corp.servers.some(
      (server) => server.ice.includes(cardId) || server.root.includes(cardId),
    );
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
  if (wasInstalledCard) clearCardCounters(state, cardId);
  if (wasInstalledCard && state.actionEconomy?.grants) {
    let revokedCorpActions = 0;
    let revokedRunnerActions = 0;
    for (const grant of state.actionEconomy.grants) {
      if (
        grant.sourceCardInstanceId !== cardId ||
        grant.restriction !== "any_action" ||
        grant.remaining <= 0
      )
        continue;
      if (grant.side === "corp") revokedCorpActions += grant.remaining;
      else revokedRunnerActions += grant.remaining;
      grant.remaining = 0;
    }
    state.corp.clicks = Math.max(0, state.corp.clicks - revokedCorpActions);
    state.runner.clicks = Math.max(
      0,
      state.runner.clicks - revokedRunnerActions,
    );
  }
  if (
    wasInstalledCard &&
    instanceBeforeMove?.owner === "corp" &&
    instanceBeforeMove.rezzed === true &&
    cardImplementationForDefinitionId(instanceBeforeMove.definitionId)
      ?.uniqueDirectLongtail?.kind === "rezzed_leave_action_gain_asset"
  ) {
    state.winner = "runner";
    state.gameEndReason = "nevinyrral_left_play";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.activeSide = "runner";
  }
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
  mustInstance(state.cardInstances, cardId);
  removeFromAllZones(state, cardId);
  const instance = mustInstance(state.cardInstances, cardId);
  state.corp.hq.unshift(cardId);
  state.cardInstances[cardId] = {
    ...instance,
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "hq" },
  };
}

export function createRemote(state: GameState): CorpServer {
  const id = nextCanonicalRemoteServerId(state.corp.servers);
  if (!id)
    throw new Error(
      "Neue Remote-ID kann aus nichtkanonischem Serverzustand nicht abgeleitet werden.",
    );
  const nextId = Number(id.slice("remote_".length));
  const server: CorpServer = {
    id,
    kind: "remote",
    label: `Remote ${nextId}`,
    ice: [],
    root: [],
  };
  state.corp.servers.push(server);
  return server;
}

export function cleanupEmptyRemotes(state: GameState): void {
  const previousServerIds = new Set(
    state.corp.servers.map((server) => server.id),
  );
  state.corp.servers = state.corp.servers.filter(
    (server) =>
      server.kind !== "remote" ||
      server.ice.length > 0 ||
      server.root.length > 0 ||
      state.run?.attackedServerId === server.id,
  );
  const remainingServerIds = new Set(
    state.corp.servers.map((server) => server.id),
  );
  const collapsedServerIds = [...previousServerIds].filter(
    (serverId) => !remainingServerIds.has(serverId),
  );
  if (state.spyCountersByServer && collapsedServerIds.length > 0) {
    const nextSpyCounters = { ...state.spyCountersByServer };
    for (const serverId of collapsedServerIds) delete nextSpyCounters[serverId];
    state.spyCountersByServer = nextSpyCounters;
  }
  if (state.corpTurnFlags?.fortActivityServerIdsSinceCorpTurnStart) {
    state.corpTurnFlags.fortActivityServerIdsSinceCorpTurnStart =
      state.corpTurnFlags.fortActivityServerIdsSinceCorpTurnStart.filter(
        (serverId) => remainingServerIds.has(serverId),
      );
  }
}
