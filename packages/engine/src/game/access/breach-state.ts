import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { quoteAccessCountModifiers } from "../../ability-engine/access-count-modifiers";

type ActiveRun = NonNullable<GameState["run"]>;
type ActiveBreach = NonNullable<ActiveRun["breach"]>;
type AccessQueueZone = ActiveBreach["queue"][number]["zone"];

export type BreachStateHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => CorpServer;
  };
  rng: {
    nextRandom: (purpose: string) => number;
  };
};

export type AccessQueueEntryBuild = {
  cardInstanceId: CardInstanceId;
  zone: AccessQueueZone;
};

export type AccessCountPayload = {
  baseAccessCount: number;
  installedAccessBonus: number;
  effectiveAccessCount: number;
  installedAccessBonusSourceDefinitionIds?: string;
};

export function buildBreachState(
  host: BreachStateHost,
  run: ActiveRun,
): ActiveBreach {
  const accessServerId = run.accessServerOverride ?? run.attackedServerId;
  const server = host.servers.mustServer(accessServerId);
  const accessCount = Math.max(1, run.accessCount ?? 1);
  const queue = accessQueueEntries(host, server, run, accessCount);
  return {
    breachId: `${run.runId}.breach`,
    serverId: server.id,
    accessMode: queue.length > 1 ? "multi" : "single",
    queue: queue.map((entry, index) => ({
      entryId: `${run.runId}.breach.${index}`,
      cardInstanceId: entry.cardInstanceId,
      serverId: server.id,
      zone: entry.zone,
      status: "pending",
      hiddenInfo: isBreachEntryHidden(host, entry.cardInstanceId),
    })),
    currentIndex: 0,
    completed: false,
    accessedSummaries: [],
  };
}

export function accessQueueEntries(
  host: BreachStateHost,
  server: CorpServer,
  run: ActiveRun,
  accessCount: number,
): AccessQueueEntryBuild[] {
  if (server.id === "rd")
    return host.state.corp.rd
      .slice(0, Math.min(accessCount, host.state.corp.rd.length))
      .map((cardInstanceId) => ({ cardInstanceId, zone: "rd" as const }));
  if (server.id === "hq") {
    const bonus = runnerHqAccessBonus(host);
    return [
      ...randomHqAccessQueue(host, run.runId, accessCount + bonus).map(
        (cardInstanceId) => ({ cardInstanceId, zone: "hq" as const }),
      ),
      ...server.root
        .filter(
          (cardInstanceId) =>
            host.cards.definitionFor(cardInstanceId).type === "upgrade",
        )
        .map((cardInstanceId) => ({
          cardInstanceId,
          zone: "remote_root" as const,
        })),
    ];
  }
  if (server.id === "archives")
    return host.state.corp.archives.map((cardInstanceId) => ({
      cardInstanceId,
      zone: "archives" as const,
    }));
  return server.root.map((cardInstanceId) => ({
    cardInstanceId,
    zone: "remote_root" as const,
  }));
}

export function accessCountPayloadForBreach(
  host: BreachStateHost,
  breach: ActiveBreach,
): AccessCountPayload {
  const installedAccessBonus =
    installedAccessBonusForServer(host, breach.serverId) +
    (breach.serverId === "hq" ? runnerHqAccessBonus(host) : 0);
  const installedAccessBonusSourceDefinitionIds = [
    ...installedAccessBonusSourceDefinitionIdsForServer(host, breach.serverId),
    ...(breach.serverId === "hq"
      ? quoteAccessCountModifiers(host.state, "hq").sourceDefinitionIds
      : []),
  ].sort();
  return {
    baseAccessCount: Math.max(1, breach.queue.length - installedAccessBonus),
    installedAccessBonus,
    effectiveAccessCount: breach.queue.length,
    ...(installedAccessBonusSourceDefinitionIds.length > 0
      ? {
          installedAccessBonusSourceDefinitionIds:
            installedAccessBonusSourceDefinitionIds.join(","),
        }
      : {}),
  };
}

export function installedAccessBonusForServer(
  host: BreachStateHost,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return installedAccessBonusSourceDefinitionIdsForServer(host, serverId).length;
}

export function installedAccessBonusSourceDefinitionIdsForServer(
  host: BreachStateHost,
  serverId: Exclude<ServerId, "new_remote">,
): CardDefinitionId[] {
  if (serverId !== "rd") return [];
  return quoteAccessCountModifiers(host.state, "rd").sourceDefinitionIds;
}

export function runnerHqAccessBonus(host: BreachStateHost): number {
  return quoteAccessCountModifiers(host.state, "hq").amount;
}

function isBreachEntryHidden(
  host: BreachStateHost,
  cardId: CardInstanceId,
): boolean {
  const instance = host.cards.cardInstanceFor(cardId);
  if (host.state.corp.archives.includes(cardId)) return !instance.faceup;
  return !instance.rezzed && !instance.faceup;
}

function randomHqAccessQueue(
  host: BreachStateHost,
  runId: string,
  accessCount: number,
): CardInstanceId[] {
  const available = host.state.corp.hq.slice();
  const selected: CardInstanceId[] = [];
  const limit = Math.min(accessCount, available.length);
  for (let index = 0; index < limit; index += 1) {
    const value = host.rng.nextRandom(`hq_multiaccess:${runId}:selection:${index}`);
    const selectedIndex = Math.floor(value * available.length);
    const cardId = available[selectedIndex];
    if (!cardId) throw new Error("HQ access selection missing.");
    available.splice(selectedIndex, 1);
    selected.push(cardId);
  }
  return selected;
}
