import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CorpServer,
  type GameState,
  type ServerId,
} from "@netgrid/shared";

export function cardInstanceFor(
  state: GameState,
  id: CardInstanceId,
): CardInstance | undefined {
  return state.cardInstances[id];
}

export function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

export function definitionFor(
  state: GameState,
  id: CardInstanceId,
): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

export function serverById(
  state: GameState,
  id: string,
): CorpServer | undefined {
  return state.corp.servers.find((candidate) => candidate.id === id);
}

export function mustServer(state: GameState, id: string): CorpServer {
  const server = serverById(state, id);
  if (!server) throw new Error(`Server fehlt: ${id}`);
  return server;
}

export function mustRun(state: GameState): NonNullable<GameState["run"]> {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}

export function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
}

export function corpInstalledCardIds(state: GameState): CardInstanceId[] {
  const installed: CardInstanceId[] = [];
  for (const server of state.corp.servers)
    installed.push(...server.root, ...server.ice);
  return installed;
}

export function scoredCorpAgendaIds(state: GameState): CardInstanceId[] {
  return state.corp.scoreArea.slice();
}

export function rezzedRootCardIdOnServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  definitionId: CardDefinitionId,
): CardInstanceId | undefined {
  const server = mustServer(state, serverId);
  return server.root
    .slice()
    .sort()
    .find((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return (
        instance.rezzed && definitionFor(state, cardId).id === definitionId
      );
    });
}

export function unrezzedRootCardIdOnServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  definitionId: CardDefinitionId,
): CardInstanceId | undefined {
  const server = mustServer(state, serverId);
  return server.root
    .slice()
    .sort()
    .find((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return (
        !instance.rezzed && definitionFor(state, cardId).id === definitionId
      );
    });
}

export function corpRootAssetIdsInServer(
  state: GameState,
  server: CorpServer,
): CardInstanceId[] {
  return server.root
    .filter((id) => definitionFor(state, id).type === "asset")
    .sort();
}

export function corpRootMainCardIdsInServer(
  state: GameState,
  server: CorpServer,
): CardInstanceId[] {
  return server.root
    .filter((id) => {
      const installedType = definitionFor(state, id).type;
      return installedType === "agenda" || installedType === "asset";
    })
    .sort();
}

export function publicInstalledCorpCardIdentityKnown(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = state.cardInstances[cardId];
  return instance?.faceup === true || instance?.rezzed === true;
}
