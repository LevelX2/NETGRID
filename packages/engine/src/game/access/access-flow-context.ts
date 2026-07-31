import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
  SpecialZoneState,
} from "@netgrid/shared";
import type { BreachStateHost } from "./breach-state";
import type { RunnerAccessActionHost } from "./access-actions";

export type ActiveRun = NonNullable<GameState["run"]>;

export type ActiveBreach = NonNullable<ActiveRun["breach"]>;

export type BreachEntryStatus = ActiveBreach["queue"][number]["status"];

export type AccessQueueZone = ActiveBreach["queue"][number]["zone"];

export type AccessFlowHost = {
  state: GameState;
  accessActions: RunnerAccessActionHost;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    runnerProgramUsesMemory: (cardId: CardInstanceId) => boolean;
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => CorpServer;
    randomHqAccess: () => CardInstanceId | undefined;
  };
  effects: {
    executeAccessEffects: (
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    archivesAccessRequiresDecisionOrEffect: (cardId: CardInstanceId) => boolean;
  };
  runner: {
    ensureTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    trashRunnerInstalledCardToHeap: (cardId: CardInstanceId) => void;
    ensureSpecialZones: () => SpecialZoneState;
  };
  payment: {
    spendRunnerCredits: (amount: number) => void;
    spendRunnerAccessTrashCredits: (
      amount: number,
      accessedCardId: CardInstanceId,
    ) => { recurringSpent: number; runnerCreditsSpent: number };
  };
  steal: {
    agendaPointsForScoredCard: (cardId: CardInstanceId) => number;
    snapshotPersistentStealCostModifiersForSource: (
      cardId: CardInstanceId,
      serverId: Exclude<ServerId, "new_remote">,
      legalAction?: LegalAction,
    ) => void;
  };
  trash: {
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  run: {
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    startPostAccessInstalledProgramChoice: (
      run: ActiveRun,
      legalAction?: LegalAction,
    ) => boolean;
  };
  access: {
    installedRevealHelperCount: () => number;
  };
};

export type AccessExecutionResult = {
  handled: boolean;
  accessedCardId?: CardInstanceId;
  serverId?: Exclude<ServerId, "new_remote">;
  breachQueueAdvanced?: boolean;
  accessFinished?: boolean;
  runFinished?: boolean;
  stolenAgendaId?: CardInstanceId;
  trashedCardId?: CardInstanceId;
  paidCredits?: number;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
  stateChanged?: boolean;
};

export function accessFlowBreachStateHost(
  host: AccessFlowHost,
): BreachStateHost {
  return {
    state: host.state,
    cards: {
      definitionFor: host.cards.definitionFor,
      cardInstanceFor: host.cards.cardInstanceFor,
    },
    servers: {
      mustServer: host.servers.mustServer,
    },
    rng: {
      nextRandom: () => 0,
    },
  };
}

export function publicAccessOrigin(
  serverId: Exclude<ServerId, "new_remote">,
  zone: AccessQueueZone,
): "central_root" | AccessQueueZone {
  return zone === "remote_root" &&
    (serverId === "hq" || serverId === "rd" || serverId === "archives")
    ? "central_root"
    : zone;
}

export function isBreachEntryHidden(
  host: AccessFlowHost,
  cardId: CardInstanceId,
): boolean {
  const instance = host.cards.cardInstanceFor(cardId);
  if (host.state.corp.archives.includes(cardId)) return !instance.faceup;
  return !instance.rezzed && !instance.faceup;
}

export function accessQueueZone(
  serverId: Exclude<ServerId, "new_remote">,
): AccessQueueZone {
  if (serverId === "rd") return "rd";
  if (serverId === "hq") return "hq";
  if (serverId === "archives") return "archives";
  return "remote_root";
}

export function revealAccessedCard(
  host: AccessFlowHost,
  cardId: CardInstanceId,
): void {
  // Archives cards remain public after they have been accessed. Cards in HQ,
  // R&D, or an installed root are only visible to the Runner through the
  // current access/breach projection and must not become permanently faceup.
  if (!host.state.corp.archives.includes(cardId)) return;
  const instance = host.cards.cardInstanceFor(cardId);
  host.state.cardInstances[cardId] = { ...instance, faceup: true };
}

export function recordArchivesAutoAccess(
  legalAction: LegalAction | undefined,
  count: number,
): void {
  if (!legalAction || count <= 0) return;
  const previousCount =
    typeof legalAction.payload?.archivesAutoAccessedCount === "number"
      ? legalAction.payload.archivesAutoAccessedCount
      : 0;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    archivesAutoAccessedCount: previousCount + count,
  };
}

export function resolvedPayloadFor(
  legalAction: LegalAction | undefined,
): Pick<AccessExecutionResult, "resolvedPayload"> {
  return legalAction?.payload ? { resolvedPayload: legalAction.payload } : {};
}

export function mustRun(host: AccessFlowHost): ActiveRun {
  if (!host.state.run) throw new Error("Es laeuft kein Run.");
  return host.state.run;
}
