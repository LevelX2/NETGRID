import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type PlayerView,
  type PublicGameEvent,
  type Side,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "./ai-hints";
import { rolesMatch } from "./runtime/role-match";

export type BeliefKnowledgeKind = "public_fact" | "own_private_fact" | "revealed_opponent_fact" | "hypothesis" | "unknown";

export type BeliefEventFamily =
  | "install"
  | "rez"
  | "advance"
  | "score"
  | "steal"
  | "access"
  | "trash"
  | "draw"
  | "discard"
  | "shuffle"
  | "arrange"
  | "swap"
  | "move"
  | "reveal"
  | "expose"
  | "run"
  | "other";

export type BeliefEventClassification = {
  eventId: string;
  eventType: string;
  actionType: string;
  family: BeliefEventFamily;
  actor: Side | "system";
  serverId?: string;
  runTargetServerId?: string;
  accessedCardPositionKey?: string;
  accessedArea?: string;
  installPlacement?: HqInstallPlacementMemory;
  sourceEventIds: string[];
  invalidationReason?: string;
};

export type BeliefEntry = {
  key: string;
  side: Side;
  kind: BeliefKnowledgeKind;
  subject: string;
  confidence: number;
  sourceEventIds: string[];
  invalidatedBy: string[];
};

export type RndTopFreshnessMemory = {
  lastKnownAccessEventId: string;
  knownToRunner: boolean;
  freshness:
    | "fresh"
    | "fresh_after_top_removed"
    | "stale_known_same_top"
    | "invalidated";
  knownTopDefinitionId?: string;
  knownTopIsAgenda?: boolean;
  knownTopIsLowValue?: boolean;
  knownSequenceDefinitionIds?: string[];
  freshenedByRunnerAccess?: boolean;
  invalidationReasons: string[];
};

export type KnownPositionMemory = {
  zone: string;
  positionKey: string;
  definitionId: string;
  certainty: "observed";
  sourceEventId: string;
  sourceKind?: "access" | "reveal" | "expose" | "rd_top_to_hq_draw";
  invalidatedBy: string[];
};

export type KnownHqHandMemory = {
  handCount: number;
  knownDefinitions: string[];
  knownCount: number;
  allCardsKnown: boolean;
  sourceEventIds: string[];
  invalidationReasons: string[];
  ledger: HqHandLedgerMemory;
};

export type KnownDefinitionCountMemory = {
  definitionId: string;
  count: number;
};

export type HqHandSafeDefinitionMemory = {
  definitionId: string;
  count: number;
  sourceEventIds: string[];
};

export type HqHandCandidateGroupMemory = {
  groupId: string;
  reason: string;
  sourceEventId: string;
  serverId?: string;
  installPlacement?: HqInstallPlacementMemory;
  candidateDefinitions: KnownDefinitionCountMemory[];
  candidateCount: number;
  unknownCandidateCount: number;
  departureCount: number;
  basis: string[];
};

export type HqInstallPlacementMemory = "ice" | "root" | "unknown";

export type HqHandLedgerMemory = {
  safeDefinitions: HqHandSafeDefinitionMemory[];
  unknownRestCount: number;
  candidateGroups: HqHandCandidateGroupMemory[];
  sourceEventIds: string[];
  invalidationReasons: string[];
};

export type HiddenRemoteCandidateMemory = {
  serverId: string;
  candidateCount: number;
  unknownCandidateCount: number;
  agendaCandidateCount: number;
  relevantTrashCandidateCount: number;
  candidateDefinitions: KnownDefinitionCountMemory[];
  exhaustive: boolean;
  sourceEventId: string;
  installPlacement?: HqInstallPlacementMemory;
  basis: string[];
};

export type RunnerOpponentModel = {
  corpPlanEstimate: {
    scoring: number;
    economy: number;
    protection: number;
  };
  remoteCardBelief: Array<{
    serverId: string;
    hypothesis: string;
    confidence: number;
    sourceEventIds: string[];
  }>;
  unrezzedIceRiskModel: Array<{
    serverId: string;
    risk: number;
    basis: string[];
  }>;
  hqAgendaDensityEstimate: number;
  rndValueEstimate: number;
  corpCreditReserveInterpretation: "low" | "medium" | "high";
  rndTopFreshness: RndTopFreshnessMemory;
  knownPositionMemory: KnownPositionMemory[];
  hqHandMemory: KnownHqHandMemory;
  hiddenRemoteCandidateMemory: HiddenRemoteCandidateMemory[];
};

export type CorpOpponentModel = {
  runnerThreatModel: {
    hqPressure: number;
    rndPressure: number;
    remotePressure: number;
  };
  runnerAggressionMemory: {
    runEvents: number;
    remoteRuns: number;
    centralRuns: number;
  };
  breakerAvailabilityEstimate: {
    installedBreakers: number;
    confidence: number;
  };
  remoteContestProbability: number;
  hqPressureEstimate: number;
  rndPressureEstimate: number;
};

export type BeliefState = {
  side: Side;
  version: string;
  entries: BeliefEntry[];
  assumptions: string[];
  uncertainty: string[];
  invalidationLog: string[];
  eventClassifications: BeliefEventClassification[];
  runnerOpponentModel?: RunnerOpponentModel;
  corpOpponentModel?: CorpOpponentModel;
  rndTopFreshness?: RndTopFreshnessMemory;
  knownPositionMemory?: KnownPositionMemory[];
};

const BELIEF_VERSION_PREFIX = "belief-v1.4.2";
const RD_SWAP_OPERATION_DEFINITION_ID = "v098_hq_rd_swap_operation";

type KnownHqHandEntry = {
  key: string;
  definitionId: string;
  eventId: string;
};

type HqHiddenInstallDepartureMemory = {
  safeEntries: KnownHqHandEntry[];
  candidateGroup?: HqHandCandidateGroupMemory;
};

export function reconstructBeliefState(input: AiDecisionInput): BeliefState {
  const history = beliefHistory(input);
  const classifications = history.map(classifyBeliefEvent);
  const invalidationLog = deriveInvalidationLog(classifications);
  const entries = dedupeEntries(
    [
      ...ownPrivateEntries(input),
      ...publicBoardEntries(input),
      ...revealedOpponentEntries(input, classifications),
      ...unknownEntries(input),
      ...hypothesisEntries(input, classifications)
    ].map((entry) => ({
      ...entry,
      confidence: clamp01(entry.confidence)
    }))
  );

  const uncertainty = buildUncertainty(entries, input.side);
  const assumptions = buildAssumptions(input.side, entries, classifications);
  const rndTopFreshness = input.side === "runner" ? deriveRndTopFreshness(history, classifications) : undefined;
  const knownPositionMemory = input.side === "runner" ? deriveKnownPositionMemory(input.playerView, history, classifications) : [];
  const hqHandMemory = input.side === "runner" ? deriveKnownHqHandMemory(input, history, classifications) : undefined;
  const hiddenRemoteCandidateMemory = input.side === "runner" ? deriveHiddenRemoteCandidateMemory(input, history, classifications) : [];
  const runnerOpponentModel =
    input.side === "runner" ? deriveRunnerOpponentModel(input, entries, classifications, rndTopFreshness, knownPositionMemory, hqHandMemory, hiddenRemoteCandidateMemory) : undefined;
  const corpOpponentModel = input.side === "corp" ? deriveCorpOpponentModel(input, classifications) : undefined;
  const versionSeed = [
    input.side,
    String(input.playerView.stateVersion),
    history.map((event) => event.eventId).join("|"),
    history.map((event) => String(event.type)).join("|")
  ].join("::");

  return {
    side: input.side,
    version: `${BELIEF_VERSION_PREFIX}:${fnv1a(versionSeed)}`,
    entries,
    assumptions,
    uncertainty,
    invalidationLog,
    eventClassifications: classifications,
    ...(runnerOpponentModel ? { runnerOpponentModel } : {}),
    ...(corpOpponentModel ? { corpOpponentModel } : {}),
    ...(rndTopFreshness ? { rndTopFreshness } : {}),
    ...(knownPositionMemory.length > 0 ? { knownPositionMemory } : {})
  };
}

export function beliefStateInvariantSignature(beliefState: BeliefState): string {
  const entrySignature = beliefState.entries
    .slice()
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((entry) => `${entry.key}:${entry.kind}:${entry.subject}:${round(entry.confidence)}`)
    .join("|");
  const uncertaintySignature = beliefState.uncertainty.slice().sort().join("|");
  return fnv1a([beliefState.side, entrySignature, uncertaintySignature].join("::"));
}

export function beliefDebugSummary(beliefState: BeliefState): Record<string, unknown> {
  const facts = beliefState.entries
    .filter((entry) => entry.kind === "public_fact" || entry.kind === "revealed_opponent_fact" || entry.kind === "own_private_fact")
    .slice(0, 6)
    .map((entry) => `${entry.kind}:${entry.subject}`);
  const hypotheses = beliefState.entries
    .filter((entry) => entry.kind === "hypothesis")
    .slice(0, 6)
    .map((entry) => `${entry.subject}:${round(entry.confidence)}`);
  return {
    memoryVersion: beliefState.version,
    facts,
    hypotheses,
    uncertainty: beliefState.uncertainty.slice(0, 6),
    invalidations: beliefState.invalidationLog.slice(0, 6),
    ...(beliefState.rndTopFreshness ? { rndTopFreshness: beliefState.rndTopFreshness } : {}),
    ...(beliefState.knownPositionMemory ? { knownPositionMemory: beliefState.knownPositionMemory } : {}),
    ...(beliefState.runnerOpponentModel ? { runnerOpponentModel: beliefState.runnerOpponentModel } : {}),
    ...(beliefState.corpOpponentModel ? { corpOpponentModel: beliefState.corpOpponentModel } : {})
  };
}

function beliefHistory(input: AiDecisionInput): PublicGameEvent[] {
  const eventById = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    const previous = eventById.get(event.eventId);
    if (!previous || previous.stateVersionAfter <= event.stateVersionAfter) eventById.set(event.eventId, event);
  }
  return [...eventById.values()].sort((left, right) => left.stateVersionBefore - right.stateVersionBefore || left.eventId.localeCompare(right.eventId));
}

function classifyBeliefEvent(event: PublicGameEvent): BeliefEventClassification {
  const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
  const serverId = publicServerId(event);
  const runTargetServerId = publicRunTargetServerId(event, actionType);
  const actor = parseActor(event.publicPayload.actor);
  const family = eventFamily(actionType, event);
  const installPlacement = installPlacementFromEvent(event);
  const accessedCardPositionKey = stringValue(event.publicPayload.accessedCardPositionKey);
  const accessedArea = stringValue(event.publicPayload.accessedArea);
  return {
    eventId: event.eventId,
    eventType: event.type,
    actionType,
    family,
    actor,
    ...(serverId ? { serverId } : {}),
    ...(runTargetServerId ? { runTargetServerId } : {}),
    ...(accessedCardPositionKey ? { accessedCardPositionKey } : {}),
    ...(accessedArea ? { accessedArea } : {}),
    ...(installPlacement ? { installPlacement } : {}),
    sourceEventIds: [event.eventId],
    ...(invalidationReasonForEvent(family, actionType, actor, serverId, event) ? { invalidationReason: invalidationReasonForEvent(family, actionType, actor, serverId, event)! } : {})
  };
}

function ownPrivateEntries(input: AiDecisionInput): BeliefEntry[] {
  return input.playerView.own.gripOrHq.map((card, index) => ({
    key: `own-private:${card.instanceId}:${index}`,
    side: input.side,
    kind: "own_private_fact",
    subject: `own_private_card:${card.definitionId ?? "unknown"}`,
    confidence: 1,
    sourceEventIds: [],
    invalidatedBy: []
  }));
}

function publicBoardEntries(input: AiDecisionInput): BeliefEntry[] {
  const entries: BeliefEntry[] = [];
  for (const server of input.playerView.servers) {
    entries.push({
      key: `server:${server.id}:shape`,
      side: input.side,
      kind: "public_fact",
      subject: `server_shape:${server.id}:ice:${server.ice.length}:root:${server.root.length}`,
      confidence: 1,
      sourceEventIds: [],
      invalidatedBy: []
    });
    for (const card of [...server.ice, ...server.root]) {
      if (!card.known) continue;
      entries.push({
        key: `server:${server.id}:card:${card.instanceId}`,
        side: input.side,
        kind: "public_fact",
        subject: `public_card:${server.id}:${card.definitionId ?? "unknown"}`,
        confidence: 1,
        sourceEventIds: [],
        invalidatedBy: []
      });
    }
  }
  return entries;
}

function revealedOpponentEntries(input: AiDecisionInput, classifications: BeliefEventClassification[]): BeliefEntry[] {
  const entries: BeliefEntry[] = [];
  const knownOpponentCards = opponentKnownCardsFromView(input);
  for (const card of knownOpponentCards) {
    entries.push({
      key: `opponent-view:${card.instanceId}`,
      side: input.side,
      kind: "revealed_opponent_fact",
      subject: `revealed_opponent_card:${card.definitionId ?? "unknown"}`,
      confidence: 1,
      sourceEventIds: [],
      invalidatedBy: []
    });
  }

  for (const classification of classifications) {
    const event = input.playerView.publicEvents.find((candidate) => candidate.eventId === classification.eventId) ?? input.eventTail.find((candidate) => candidate.eventId === classification.eventId);
    const definitionId = event ? stringValue(event.publicPayload.cardDefinitionId) : undefined;
    if (!definitionId) continue;
    if (!["access", "reveal", "expose", "rez", "score", "steal", "trash"].includes(classification.family)) continue;
    entries.push({
      key: `opponent-event:${classification.eventId}:${definitionId}`,
      side: input.side,
      kind: "revealed_opponent_fact",
      subject: `revealed_opponent_card:${definitionId}`,
      confidence: 1,
      sourceEventIds: classification.sourceEventIds,
      invalidatedBy: []
    });
  }
  return entries;
}

function unknownEntries(input: AiDecisionInput): BeliefEntry[] {
  const entries: BeliefEntry[] = [];
  if (input.playerView.opponent.handCount > 0) {
    entries.push({
      key: `unknown:opponent_hand:${input.playerView.opponent.handCount}`,
      side: input.side,
      kind: "unknown",
      subject: `opponent_hidden_hand_cards:${input.playerView.opponent.handCount}`,
      confidence: 0,
      sourceEventIds: [],
      invalidatedBy: []
    });
  }
  const unknownRemoteRoots = input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .reduce((sum, server) => sum + server.root.filter((card) => !card.known).length, 0);
  if (unknownRemoteRoots > 0) {
    entries.push({
      key: `unknown:remote_roots:${unknownRemoteRoots}`,
      side: input.side,
      kind: "unknown",
      subject: `unknown_remote_root_cards:${unknownRemoteRoots}`,
      confidence: 0,
      sourceEventIds: [],
      invalidatedBy: []
    });
  }
  return entries;
}

function hypothesisEntries(input: AiDecisionInput, classifications: BeliefEventClassification[]): BeliefEntry[] {
  const invalidationLog = deriveInvalidationLog(classifications);
  const entries: BeliefEntry[] = [];

  for (const server of input.playerView.servers.filter((candidate) => candidate.id.startsWith("remote_"))) {
    const unknownRoots = server.root.filter((card) => !card.known);
    for (let index = 0; index < unknownRoots.length; index += 1) {
      entries.push({
        key: `hypothesis:remote_root:${server.id}:${index + 1}`,
        side: input.side,
        kind: "hypothesis",
        subject: `remote_card_hypothesis:${server.id}:unknown_root`,
        confidence: 0.42,
        sourceEventIds: [],
        invalidatedBy: invalidationLog
          .filter((entry) => invalidationEntryReferencesServer(entry, server.id))
          .slice(0, 3)
      });
    }
    const unknownUnrezzedIce = server.ice.filter((card) => card.rezzed !== true && !card.known).length;
    if (unknownUnrezzedIce > 0) {
      entries.push({
        key: `hypothesis:unrezzed_ice:${server.id}`,
        side: input.side,
        kind: "hypothesis",
        subject: `unrezzed_ice_risk:${server.id}:${unknownUnrezzedIce}`,
        confidence: clamp01(0.35 + unknownUnrezzedIce * 0.17),
        sourceEventIds: [],
        invalidatedBy: invalidationLog
          .filter((entry) => invalidationEntryReferencesServer(entry, server.id))
          .slice(0, 3)
      });
    }
  }

  return entries;
}

function deriveKnownPositionMemory(playerView: PlayerView, history: PublicGameEvent[], classifications: BeliefEventClassification[]): KnownPositionMemory[] {
  const eventsById = new Map(history.map((event) => [event.eventId, event]));
  const memory = new Map<string, KnownPositionMemory>();

  for (const classification of classifications) {
    if (rdTopRemovedByRunnerAccess(classification)) {
      advanceRndKnownPositionMemory(memory, classification);
      continue;
    }
    for (const key of [...memory.keys()]) {
      if (positionInvalidatesKey(key, classification)) memory.delete(key);
    }

    const event = eventsById.get(classification.eventId);
    const definitionId = event ? stringValue(event.publicPayload.cardDefinitionId) : undefined;
    const knownDefinitions = event
      ? knownDefinitionsFromEvent(event, classification, definitionId)
      : [];
    if (knownDefinitions.length === 0) continue;
    if (!["access", "reveal", "expose", "rez"].includes(classification.family)) continue;

    const zone =
      classification.serverId ??
      (event ? stringValue(event.publicPayload.privateLookZone) : undefined) ??
      (event ? stringValue(event.publicPayload.exposedServerId) : undefined) ??
      "unknown";
    if (zone === "unknown") continue;
    for (const known of knownDefinitions) {
      const positionKey = known.positionKey;
      const key = `${zone}:${positionKey}`;
      memory.set(key, {
        zone,
        positionKey,
        definitionId: known.definitionId,
        certainty: "observed",
        sourceEventId: classification.eventId,
        sourceKind: knownPositionSourceKind(classification.family),
        invalidatedBy: []
      });
    }
  }

  return normalizeKnownPositionMemory([...memory.values()])
    .filter((entry) => !positionCurrentlyKnownInView(playerView, entry))
    .sort((left, right) => `${left.zone}:${left.positionKey}`.localeCompare(`${right.zone}:${right.positionKey}`));
}

function positionCurrentlyKnownInView(
  playerView: PlayerView,
  entry: KnownPositionMemory,
): boolean {
  const server = playerView.servers.find(
    (candidate) => candidate.id === entry.zone,
  );
  if (!server) return false;
  const [area, rawIndex] = entry.positionKey.split(":");
  const index = Number(rawIndex);
  if (!Number.isInteger(index) || index < 0) return false;
  const card =
    area === "root"
      ? server.root[index]
      : area === "ice"
        ? server.ice[index]
        : undefined;
  return card?.known === true && card.definitionId === entry.definitionId;
}

function normalizeKnownPositionMemory(entries: KnownPositionMemory[]): KnownPositionMemory[] {
  const preciseRemoteDefinitions = new Set(
    entries
      .filter(
        (entry) =>
          entry.zone.startsWith("remote_") &&
          entry.positionKey !== "installed",
      )
      .map((entry) => `${entry.zone}:${entry.definitionId}`),
  );
  const byExactPosition = new Map<string, KnownPositionMemory>();
  for (const entry of entries) {
    if (
      entry.zone.startsWith("remote_") &&
      entry.positionKey === "installed" &&
      preciseRemoteDefinitions.has(`${entry.zone}:${entry.definitionId}`)
    ) {
      continue;
    }
    byExactPosition.set(
      `${entry.zone}:${entry.positionKey}:${entry.definitionId}`,
      entry,
    );
  }
  return [...byExactPosition.values()];
}

function knownPositionSourceKind(
  family: BeliefEventFamily,
): "access" | "expose" | "reveal" | "rd_top_to_hq_draw" {
  if (family === "access" || family === "expose" || family === "reveal")
    return family;
  return "reveal";
}

function advanceRndKnownPositionMemory(
  memory: Map<string, KnownPositionMemory>,
  event: BeliefEventClassification,
): void {
  const currentTop = memory.get("rd:top");
  if (currentTop) memory.delete("rd:top");
  const shifted = new Map<string, KnownPositionMemory>();
  for (const [key, entry] of memory.entries()) {
    if (!key.startsWith("rd:top:")) continue;
    const index = Number(key.slice("rd:top:".length));
    if (!Number.isInteger(index) || index < 1) continue;
    memory.delete(key);
    const nextPosition = index === 1 ? "top" : `top:${index - 1}`;
    shifted.set(`rd:${nextPosition}`, {
      ...entry,
      positionKey: nextPosition,
      invalidatedBy: [
        ...entry.invalidatedBy,
        `rd_known_top_advanced_after_access:${event.eventId}`,
      ],
    });
  }
  for (const [key, entry] of shifted) memory.set(key, entry);
}

function deriveKnownHqHandMemory(input: AiDecisionInput, history: PublicGameEvent[], classifications: BeliefEventClassification[]): KnownHqHandMemory {
  const eventsById = new Map(history.map((event) => [event.eventId, event]));
  const knownCards: KnownHqHandEntry[] = [];
  const candidateGroups: HqHandCandidateGroupMemory[] = [];
  const invalidationReasons: string[] = [];
  let knownRndTop: { definitionId: string; eventId: string } | undefined;

  for (const classification of classifications) {
    const event = eventsById.get(classification.eventId);
    const definitionId = event ? stringValue(event.publicPayload.cardDefinitionId) : undefined;
    const fullHqRevealDefinitions = event ? hqPrivateLookDefinitions(event) : [];
    const rndTopDefinition = event
      ? rndTopDefinitionFromEvent(event, classification, definitionId)
      : undefined;

    if (fullHqRevealDefinitions.length > 0) {
      knownCards.length = 0;
      candidateGroups.length = 0;
      fullHqRevealDefinitions.forEach((knownDefinitionId, index) => {
        knownCards.push({
          key: `${classification.eventId}:private_look:${index}`,
          definitionId: knownDefinitionId,
          eventId: classification.eventId
        });
      });
      continue;
    }
    if (rndTopDefinition) {
      knownRndTop = {
        definitionId: rndTopDefinition,
        eventId: classification.eventId
      };
    }
    if (isRunnerHqAccess(classification) && definitionId) {
      rememberObservedHqAccessDefinition(knownCards, classification.eventId, definitionId);
      continue;
    }
    reconcileHqCandidateGroups(
      classification,
      definitionId,
      knownCards,
      candidateGroups,
      invalidationReasons,
    );

    const adjustment = hqHandMemoryAdjustment(classification, definitionId);
    if (!adjustment) continue;

    invalidationReasons.push(`${adjustment.reason}:${classification.eventId}`);
    if (adjustment.kind === "unknown_arrival" && knownRndTop) {
      knownCards.push({
        key: `${classification.eventId}:rnd_top_draw:${knownCards.length}`,
        definitionId: knownRndTop.definitionId,
        eventId: classification.eventId
      });
      invalidationReasons.push(
        `known_rnd_top_moved_to_hq:${knownRndTop.eventId}->${classification.eventId}`
      );
      knownRndTop = undefined;
      continue;
    }
    if (adjustment.kind === "remove_known" && definitionId) {
      const removeIndex = knownCards.findIndex((card) => card.definitionId === definitionId);
      if (removeIndex >= 0) knownCards.splice(removeIndex, 1);
      continue;
    }
    if (adjustment.kind === "unknown_departure" && classification.actionType === "install_card") {
      const departure = hqHiddenInstallDepartureMemory(
        classification,
        knownCards,
        input.playerView.opponent.handCount,
      );
      knownCards.length = 0;
      knownCards.push(...departure.safeEntries);
      if (departure.candidateGroup) candidateGroups.push(departure.candidateGroup);
      continue;
    }
    if (adjustment.kind === "unknown_departure" || adjustment.kind === "hidden_zone_reordered") {
      knownCards.length = 0;
      candidateGroups.length = 0;
    }
    if (adjustment.kind === "hidden_zone_reordered") knownRndTop = undefined;
  }

  const knownEntries = knownCards
    .slice()
    .sort((left, right) => left.key.localeCompare(right.key));
  const knownDefinitionIds = knownEntries.map((entry) => entry.definitionId);
  const handCount = input.playerView.opponent.handCount;
  const ledger = deriveHqHandLedger(knownEntries, handCount, invalidationReasons, candidateGroups);
  return {
    handCount,
    knownDefinitions: knownDefinitionIds,
    knownCount: knownDefinitionIds.length,
    allCardsKnown:
      handCount > 0 &&
      knownDefinitionIds.length === handCount &&
      ledger.unknownRestCount === 0 &&
      ledger.candidateGroups.length === 0,
    sourceEventIds: ledger.sourceEventIds,
    invalidationReasons,
    ledger
  };
}

function deriveHqHandLedger(
  knownEntries: KnownHqHandEntry[],
  handCount: number,
  invalidationReasons: string[],
  candidateGroups: HqHandCandidateGroupMemory[] = []
): HqHandLedgerMemory {
  const sourceEventIdsByDefinition = new Map<string, string[]>();
  for (const entry of knownEntries) {
    sourceEventIdsByDefinition.set(entry.definitionId, [
      ...(sourceEventIdsByDefinition.get(entry.definitionId) ?? []),
      entry.eventId,
    ]);
  }
  const safeDefinitions = countKnownDefinitionEntries(knownEntries.map((entry) => entry.definitionId)).map((definition) => ({
    ...definition,
    sourceEventIds: sortedUnique(sourceEventIdsByDefinition.get(definition.definitionId) ?? []),
  }));
  const candidateRemainderCount = candidateGroups.reduce(
    (sum, group) => sum + Math.max(0, group.candidateCount - group.departureCount),
    0,
  );

  return {
    safeDefinitions,
    unknownRestCount: Math.max(0, handCount - knownEntries.length - candidateRemainderCount),
    candidateGroups: candidateGroups.slice(-6),
    sourceEventIds: sortedUnique([
      ...knownEntries.map((entry) => entry.eventId),
      ...candidateGroups.map((group) => group.sourceEventId),
    ]),
    invalidationReasons: invalidationReasons.slice(),
  };
}

function hqHiddenInstallDepartureMemory(
  event: BeliefEventClassification,
  knownCards: KnownHqHandEntry[],
  handCountAfterDeparture: number,
): HqHiddenInstallDepartureMemory {
  if (knownCards.length === 0) return { safeEntries: [] };

  const placement = event.installPlacement ?? "unknown";
  const matchingCandidateEntries =
    placement === "unknown"
      ? knownCards.slice()
      : knownCards.filter((card) =>
          hqDefinitionMatchesInstallPlacement(card.definitionId, placement),
        );
  const useAllKnownAsFallback = matchingCandidateEntries.length === 0;
  const candidateEntries = useAllKnownAsFallback
    ? knownCards.slice()
    : matchingCandidateEntries;
  const candidateKeys = new Set(candidateEntries.map((entry) => entry.key));
  const safeEntries = useAllKnownAsFallback
    ? []
    : knownCards.filter((entry) => !candidateKeys.has(entry.key));
  const candidateDefinitions = countKnownDefinitionEntries(
    candidateEntries.map((entry) => entry.definitionId),
  );
  const candidateCount = candidateDefinitions.reduce(
    (sum, candidate) => sum + candidate.count,
    0,
  );
  const handCountBeforeDeparture = Math.max(
    handCountAfterDeparture + 1,
    knownCards.length,
  );
  const unknownCandidateCount = Math.max(
    0,
    handCountBeforeDeparture - knownCards.length,
  );

  return {
    safeEntries,
    candidateGroup: {
      groupId: `${event.eventId}:hidden_install:${placement}:${event.serverId ?? "unknown"}`,
      reason: useAllKnownAsFallback
        ? "hidden_install_no_matching_known_candidates"
        : `hidden_${placement}_install_candidates`,
      sourceEventId: event.eventId,
      ...(event.serverId ? { serverId: event.serverId } : {}),
      installPlacement: placement,
      candidateDefinitions,
      candidateCount,
      unknownCandidateCount,
      departureCount: 1,
      basis: [
        `install_placement:${placement}`,
        ...(event.serverId ? [`server:${event.serverId}`] : []),
        `known_candidates:${candidateCount}`,
        `unknown_candidates:${unknownCandidateCount}`,
        ...(useAllKnownAsFallback ? ["candidate_filter_fallback:all_known"] : []),
      ],
    },
  };
}

function reconcileHqCandidateGroups(
  event: BeliefEventClassification,
  definitionId: string | undefined,
  knownCards: KnownHqHandEntry[],
  candidateGroups: HqHandCandidateGroupMemory[],
  invalidationReasons: string[],
): void {
  if (!definitionId || !event.serverId || candidateGroups.length === 0) return;
  if (!hqCandidateReconciliationEvent(event)) return;

  const groupIndex = candidateGroups.findIndex(
    (group) => group.serverId === event.serverId,
  );
  if (groupIndex < 0) return;
  const group = candidateGroups[groupIndex]!;
  const matchedCandidate = group.candidateDefinitions.find(
    (candidate) => candidate.definitionId === definitionId,
  );
  if (!matchedCandidate && group.unknownCandidateCount <= 0) {
    invalidationReasons.push(
      `hq_candidate_reveal_mismatch:${group.sourceEventId}->${event.eventId}:${definitionId}`,
    );
    return;
  }

  const remainingCandidateDefinitions = matchedCandidate
    ? subtractOneKnownDefinitionCount(group.candidateDefinitions, definitionId)
    : group.candidateDefinitions;
  rememberCandidateDefinitionsAsSafeHqEntries(
    knownCards,
    event.eventId,
    group.sourceEventId,
    remainingCandidateDefinitions,
  );
  candidateGroups.splice(groupIndex, 1);
  invalidationReasons.push(
    matchedCandidate
      ? `hq_candidate_reconciled:${group.sourceEventId}->${event.eventId}:${definitionId}`
      : `hq_candidate_reconciled_unknown_install:${group.sourceEventId}->${event.eventId}:${definitionId}`,
  );
}

function hqCandidateReconciliationEvent(event: BeliefEventClassification): boolean {
  if (
    event.family === "rez" ||
    event.family === "reveal" ||
    event.family === "expose"
  ) {
    return true;
  }
  return (
    event.family === "access" ||
    event.family === "trash" ||
    event.family === "steal" ||
    event.family === "score"
  );
}

function subtractOneKnownDefinitionCount(
  definitions: KnownDefinitionCountMemory[],
  definitionId: string,
): KnownDefinitionCountMemory[] {
  return definitions.flatMap((definition) => {
    if (definition.definitionId !== definitionId) return [definition];
    const count = definition.count - 1;
    return count > 0 ? [{ ...definition, count }] : [];
  });
}

function rememberCandidateDefinitionsAsSafeHqEntries(
  knownCards: KnownHqHandEntry[],
  eventId: string,
  candidateSourceEventId: string,
  definitions: KnownDefinitionCountMemory[],
): void {
  let index = 0;
  for (const definition of definitions) {
    for (let copy = 0; copy < definition.count; copy += 1) {
      knownCards.push({
        key: `${eventId}:candidate_reconciled:${candidateSourceEventId}:${definition.definitionId}:${index}`,
        definitionId: definition.definitionId,
        eventId,
      });
      index += 1;
    }
  }
}

function deriveHiddenRemoteCandidateMemory(
  input: AiDecisionInput,
  history: PublicGameEvent[],
  classifications: BeliefEventClassification[]
): HiddenRemoteCandidateMemory[] {
  const eventsById = new Map(history.map((event) => [event.eventId, event]));
  const knownCards: KnownHqHandEntry[] = [];
  const memories: HiddenRemoteCandidateMemory[] = [];
  let knownRndTop: { definitionId: string; eventId: string } | undefined;

  for (const classification of classifications) {
    const event = eventsById.get(classification.eventId);
    const definitionId = event ? stringValue(event.publicPayload.cardDefinitionId) : undefined;
    const fullHqRevealDefinitions = event ? hqPrivateLookDefinitions(event) : [];
    const rndTopDefinition = event
      ? rndTopDefinitionFromEvent(event, classification, definitionId)
      : undefined;

    if (fullHqRevealDefinitions.length > 0) {
      knownCards.length = 0;
      fullHqRevealDefinitions.forEach((knownDefinitionId, index) => {
        knownCards.push({
          key: `${classification.eventId}:private_look:${index}`,
          definitionId: knownDefinitionId,
          eventId: classification.eventId
        });
      });
      continue;
    }
    if (rndTopDefinition) {
      knownRndTop = {
        definitionId: rndTopDefinition,
        eventId: classification.eventId
      };
    }
    if (isRunnerHqAccess(classification) && definitionId) {
      rememberObservedHqAccessDefinition(knownCards, classification.eventId, definitionId);
      continue;
    }
    reconcileHiddenRemoteCandidateMemories(classification, definitionId, memories);

    const adjustment = hqHandMemoryAdjustment(classification, definitionId);
    if (!adjustment) continue;

    if (adjustment.kind === "unknown_arrival" && knownRndTop) {
      knownCards.push({
        key: `${classification.eventId}:rnd_top_draw:${knownCards.length}`,
        definitionId: knownRndTop.definitionId,
        eventId: classification.eventId
      });
      knownRndTop = undefined;
      continue;
    }
    if (adjustment.kind === "remove_known" && definitionId) {
      const removeIndex = knownCards.findIndex((card) => card.definitionId === definitionId);
      if (removeIndex >= 0) knownCards.splice(removeIndex, 1);
      continue;
    }
    if (adjustment.kind === "unknown_departure") {
      const departure =
        classification.actionType === "install_card"
          ? hqHiddenInstallDepartureMemory(
              classification,
              knownCards,
              input.playerView.opponent.handCount,
            )
          : undefined;
      if (
        classification.actionType === "install_card" &&
        classification.serverId &&
        beliefRemoteServerId(classification.serverId) &&
        departure?.candidateGroup
      ) {
        const { candidateGroup } = departure;
        const candidateDefinitions = candidateGroup.candidateDefinitions;
        const knownCandidateCount = candidateDefinitions.reduce((sum, candidate) => sum + candidate.count, 0);
        const totalCandidateCount = knownCandidateCount + candidateGroup.unknownCandidateCount;
        const agendaCandidateCount = candidateDefinitions.reduce((sum, candidate) => (
          beliefDefinitionType(candidate.definitionId) === "agenda" ? sum + candidate.count : sum
        ), 0);
        const relevantTrashCandidateCount = candidateDefinitions.reduce((sum, candidate) => {
          const type = beliefDefinitionType(candidate.definitionId);
          const trashCost = beliefDefinitionTrashCost(candidate.definitionId);
          return (type === "asset" || type === "upgrade") && trashCost !== undefined && input.playerView.own.credits >= trashCost + 1
            ? sum + candidate.count
            : sum;
        }, 0);
        memories.push({
          serverId: classification.serverId,
          candidateCount: totalCandidateCount,
          unknownCandidateCount: candidateGroup.unknownCandidateCount,
          agendaCandidateCount,
          relevantTrashCandidateCount,
          candidateDefinitions,
          exhaustive: candidateGroup.unknownCandidateCount === 0 && knownCandidateCount > 0,
          sourceEventId: classification.eventId,
          ...(candidateGroup.installPlacement
            ? { installPlacement: candidateGroup.installPlacement }
            : {}),
          basis: [
            `known_hq_candidates:${knownCandidateCount}`,
            `unique_candidates:${candidateDefinitions.length}`,
            `unknown_candidates:${candidateGroup.unknownCandidateCount}`,
            ...candidateGroup.basis,
          ]
        });
      }
      knownCards.length = 0;
      if (departure) knownCards.push(...departure.safeEntries);
    }
    if (adjustment.kind === "hidden_zone_reordered") {
      knownCards.length = 0;
      knownRndTop = undefined;
    }
  }

  return memories.slice(-6);
}

function reconcileHiddenRemoteCandidateMemories(
  event: BeliefEventClassification,
  definitionId: string | undefined,
  memories: HiddenRemoteCandidateMemory[],
): void {
  if (!definitionId || !event.serverId || memories.length === 0) return;
  if (!hqCandidateReconciliationEvent(event)) return;

  const memoryIndex = memories.findIndex(
    (memory) =>
      memory.serverId === event.serverId &&
      (memory.unknownCandidateCount > 0 ||
        memory.candidateDefinitions.some(
          (candidate) => candidate.definitionId === definitionId,
        )),
  );
  if (memoryIndex >= 0) memories.splice(memoryIndex, 1);
}

function positionInvalidatesKey(key: string, event: BeliefEventClassification): boolean {
  if (event.family === "draw" && event.actor === "corp") return key.startsWith("rd:");
  if (event.family === "shuffle" || event.family === "arrange" || event.family === "swap") return true;
  if (event.family === "install" && event.serverId) return key.startsWith(`${event.serverId}:`);
  if (rdTopRemovedByRunnerAccess(event) && key.startsWith("rd:")) return false;
  if (event.family === "move" || event.family === "trash" || event.family === "steal" || event.family === "discard") {
    return event.serverId ? key.startsWith(`${event.serverId}:`) : true;
  }
  return false;
}

function rdTopRemovedByRunnerAccess(event: BeliefEventClassification): boolean {
  return (
    event.actor === "runner" &&
    event.serverId === "rd" &&
    [
      "steal_agenda",
      "trash_accessed_card",
      "move_to_removed_from_game",
      "move_to_set_aside",
    ].includes(event.actionType)
  );
}

function isRunnerHqAccess(event: BeliefEventClassification): boolean {
  return (
    event.actor === "runner" &&
    event.actionType === "access_card" &&
    event.serverId === "hq" &&
    event.accessedArea !== "root" &&
    !event.accessedCardPositionKey?.startsWith("root:")
  );
}

function rememberObservedHqAccessDefinition(
  knownCards: Array<{ key: string; definitionId: string; eventId: string }>,
  eventId: string,
  definitionId: string,
): void {
  if (knownCards.some((card) => card.definitionId === definitionId)) return;
  knownCards.push({
    key: `${eventId}:access:${knownCards.length}`,
    definitionId,
    eventId,
  });
}

function countKnownDefinitionEntries(definitionIds: string[]): KnownDefinitionCountMemory[] {
  const counts = new Map<string, number>();
  for (const definitionId of definitionIds) {
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([definitionId, count]) => ({ definitionId, count }));
}

function hqPrivateLookDefinitions(event: PublicGameEvent): string[] {
  if (
    event.publicPayload.actor !== "runner" ||
    event.publicPayload.hiddenZoneAction !== "p3_33_private_look" ||
    event.publicPayload.privateLookZone !== "hq"
  ) {
    return [];
  }
  const raw = event.publicPayload.knownHqDefinitionIds;
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === "string" && value.length > 0);
  }
  return [];
}

function rndPrivateLookDefinitions(event: PublicGameEvent): string[] {
  if (
    event.publicPayload.actor !== "runner" ||
    event.publicPayload.hiddenZoneAction !== "p3_33_private_look" ||
    event.publicPayload.privateLookZone !== "rd"
  ) {
    return [];
  }
  const raw = event.publicPayload.knownRndDefinitionIds;
  if (typeof raw === "string") {
    const definitions = raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (definitions.length > 0) return definitions;
  }
  if (Array.isArray(raw)) {
    const definitions = raw.filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    if (definitions.length > 0) return definitions;
  }
  const rawTop = event.publicPayload.knownRndTopDefinitionId;
  if (typeof rawTop === "string" && rawTop.length > 0) return [rawTop];
  return [];
}

function rndTopDefinitionFromEvent(
  event: PublicGameEvent,
  classification: BeliefEventClassification,
  definitionId: string | undefined
): string | undefined {
  const privateLookTop = rndPrivateLookDefinitions(event)[0];
  if (privateLookTop) return privateLookTop;
  if (classification.actor === "runner" && classification.actionType === "access_card" && classification.serverId === "rd") return definitionId;
  if (classification.serverId === "rd" && (classification.family === "reveal" || classification.family === "expose")) return definitionId;
  return undefined;
}

function installPlacementFromEvent(event: PublicGameEvent): HqInstallPlacementMemory | undefined {
  const placement =
    stringValue(event.publicPayload.installPlacement) ??
    stringValue(event.publicPayload.placement);
  if (placement === "ice" || placement === "root") return placement;
  const zoneLabel = stringValue(event.publicPayload.zoneLabel)?.toLowerCase();
  if (zoneLabel === "ice") return "ice";
  if (zoneLabel === "root" || zoneLabel === "remote") return "root";
  return undefined;
}

function knownDefinitionsFromEvent(
  event: PublicGameEvent,
  classification: BeliefEventClassification,
  definitionId: string | undefined
): Array<{ definitionId: string; positionKey: string }> {
  const rndPrivateLook = rndPrivateLookDefinitions(event);
  if (rndPrivateLook.length > 0) {
    return rndPrivateLook.map((knownDefinitionId, index) => ({
      definitionId: knownDefinitionId,
      positionKey: index === 0 ? "top" : `top:${index}`,
    }));
  }
  const rndTopDefinition = rndTopDefinitionFromEvent(event, classification, definitionId);
  if (rndTopDefinition) return [{ definitionId: rndTopDefinition, positionKey: "top" }];
  const exposedDefinition =
    stringValue(event.publicPayload.exposedCardDefinitionId) ??
    stringValue(event.publicPayload.publicRevealDefinitionId) ??
    definitionId;
  if (classification.family === "expose" && exposedDefinition) {
    const exposedArea = stringValue(event.publicPayload.exposedArea);
    const exposedIndex = numberValue(event.publicPayload.exposedIndex);
    const positionKey =
      exposedArea && exposedIndex !== undefined
        ? `${exposedArea}:${exposedIndex}`
        : stringValue(event.publicPayload.exposedPositionKey) ?? "installed";
    return [{ definitionId: exposedDefinition, positionKey }];
  }
  if (!definitionId) return [];
  const accessedCardPositionKey = stringValue(event.publicPayload.accessedCardPositionKey);
  if (classification.family === "access" && accessedCardPositionKey) {
    return [
      {
        definitionId,
        positionKey: accessedCardPositionKey
      }
    ];
  }
  if (classification.family === "access") {
    return [
      {
        definitionId,
        positionKey: classification.serverId === "rd" ? "top" : "accessed"
      }
    ];
  }
  return [{ definitionId, positionKey: "installed" }];
}

function hqDefinitionMatchesInstallPlacement(
  definitionId: string,
  placement: HqInstallPlacementMemory,
): boolean {
  const type = beliefDefinitionType(definitionId);
  if (placement === "ice") return type === "ice";
  if (placement === "root") {
    return type === "agenda" || type === "asset" || type === "upgrade";
  }
  return true;
}

function hqHandMemoryAdjustment(
  event: BeliefEventClassification,
  definitionId: string | undefined
): { kind: "remove_known" | "unknown_arrival" | "unknown_departure" | "hidden_zone_reordered"; reason: string } | undefined {
  if (event.actor === "corp" && (event.actionType === "mandatory_draw" || event.actionType === "draw_card")) {
    return { kind: "unknown_arrival", reason: "corp_draw_added_unknown_hq_card" };
  }
  if (event.family === "shuffle" || event.family === "arrange" || event.family === "swap") {
    return { kind: "hidden_zone_reordered", reason: `${event.family}_changed_hq_hand` };
  }
  if (event.actor === "corp" && event.actionType === "play_operation") {
    return { kind: "remove_known", reason: definitionId ? "known_hq_card_played" : "corp_played_unknown_hq_card" };
  }
  if (event.actor === "corp" && event.actionType === "install_card") {
    return definitionId ? { kind: "remove_known", reason: "known_hq_card_installed" } : { kind: "unknown_departure", reason: "corp_installed_hidden_hq_card" };
  }
  if (event.family === "discard" && event.actor === "corp") {
    return { kind: "unknown_departure", reason: "corp_discarded_hq_card" };
  }
  if ((event.family === "steal" || event.family === "trash" || event.family === "score") && event.serverId === "hq") {
    return definitionId ? { kind: "remove_known", reason: `known_hq_card_${event.family}` } : { kind: "unknown_departure", reason: `unknown_hq_card_${event.family}` };
  }
  if (event.family === "move") {
    return definitionId ? { kind: "remove_known", reason: "known_hq_card_moved" } : { kind: "unknown_departure", reason: "hidden_zone_move_changed_hq" };
  }
  return undefined;
}

function beliefRemoteServerId(serverId: string): boolean {
  if (!serverId.startsWith("remote_")) return false;
  const suffix = serverId.slice("remote_".length);
  return (
    suffix.length > 0 &&
    [...suffix].every((character) => character >= "0" && character <= "9")
  );
}

function beliefDefinitionType(definitionId: string): string | undefined {
  return DEMO_CARDS_BY_ID[definitionId]?.type ?? RUNTIME_CARDS[definitionId]?.type;
}

function beliefDefinitionTrashCost(definitionId: string): number | undefined {
  return RUNTIME_CARDS[definitionId]?.numeric.trashCost ?? DEMO_CARDS_BY_ID[definitionId]?.trashCost;
}

function deriveRunnerOpponentModel(
  input: AiDecisionInput,
  entries: BeliefEntry[],
  classifications: BeliefEventClassification[],
  rndTopFreshness: RndTopFreshnessMemory | undefined,
  knownPositionMemory: KnownPositionMemory[],
  hqHandMemory: KnownHqHandMemory | undefined,
  hiddenRemoteCandidateMemory: HiddenRemoteCandidateMemory[]
): RunnerOpponentModel {
  const corpEvents = classifications.filter((event) => event.actor === "corp");
  const scoringSignals = corpEvents.filter((event) => event.actionType === "advance_card" || event.actionType === "score_agenda").length;
  const economySignals = corpEvents.filter((event) => event.actionType === "gain_credit" || event.actionType === "draw_card" || event.actionType === "play_operation" || event.actionType === "mandatory_draw").length;
  const protectionSignals =
    corpEvents.filter((event) => (event.actionType === "install_card" && event.serverId !== undefined) || event.actionType === "rez_ice").length +
    input.playerView.servers.reduce((sum, server) => sum + server.ice.length, 0);

  const corpPlanEstimate = {
    scoring: clamp01(scoringSignals / 6),
    economy: clamp01(economySignals / 12 + input.playerView.opponent.credits / 24),
    protection: clamp01(protectionSignals / 14)
  };

  const remoteCardBelief = entries
    .filter((entry) => entry.kind === "hypothesis" && entry.subject.startsWith("remote_card_hypothesis:"))
    .map((entry) => {
      const parts = entry.subject.split(":");
      return {
        serverId: parts[1] ?? "remote_unknown",
        hypothesis: "unknown_remote_card",
        confidence: entry.confidence,
        sourceEventIds: entry.sourceEventIds
      };
    });

  const unrezzedIceRiskModel = input.playerView.servers.map((server) => {
    const unknownUnrezzedIce = server.ice.filter((card) => card.rezzed !== true && !card.known).length;
    const rezSignals = corpEvents.filter((event) => event.family === "rez" && event.serverId === server.id).length;
    const risk = clamp01(0.15 + unknownUnrezzedIce * 0.26 + rezSignals * 0.1 + Math.min(input.playerView.opponent.credits, 12) * 0.025);
    return {
      serverId: server.id,
      risk,
      basis: [`unknown_unrezzed_ice:${unknownUnrezzedIce}`, `rez_signals:${rezSignals}`, `corp_credits:${input.playerView.opponent.credits}`]
    };
  });

  const hqAgendaDensityEstimate = clamp01(0.24 + (input.playerView.opponent.handCount - 5) * 0.04 + corpPlanEstimate.scoring * 0.25 - corpPlanEstimate.economy * 0.1);
  const staleRndPenalty = rndTopFreshness?.freshness === "stale_known_same_top" ? 0.35 : 0;
  const rndValueEstimate = clamp01(0.55 + corpPlanEstimate.scoring * 0.18 - staleRndPenalty);
  const corpCreditReserveInterpretation = input.playerView.opponent.credits <= 4 ? "low" : input.playerView.opponent.credits >= 10 ? "high" : "medium";

  return {
    corpPlanEstimate,
    remoteCardBelief,
    unrezzedIceRiskModel,
    hqAgendaDensityEstimate,
    rndValueEstimate,
    corpCreditReserveInterpretation,
    rndTopFreshness:
      rndTopFreshness ??
      ({
        lastKnownAccessEventId: "none",
        knownToRunner: false,
        freshness: "invalidated",
        invalidationReasons: []
      } satisfies RndTopFreshnessMemory),
    knownPositionMemory,
    hqHandMemory:
      hqHandMemory ??
      ({
        handCount: input.playerView.opponent.handCount,
        knownDefinitions: [],
        knownCount: 0,
        allCardsKnown: false,
        sourceEventIds: [],
        invalidationReasons: [],
        ledger: deriveHqHandLedger([], input.playerView.opponent.handCount, [])
      } satisfies KnownHqHandMemory),
    hiddenRemoteCandidateMemory
  };
}

function deriveCorpOpponentModel(input: AiDecisionInput, classifications: BeliefEventClassification[]): CorpOpponentModel {
  const runnerRuns = classifications.filter((event) => event.actor === "runner" && (event.actionType === "start_run" || event.actionType === "access_card"));
  const hqRuns = runnerRuns.filter((event) => runPressureServerId(event) === "hq").length;
  const rndRuns = runnerRuns.filter((event) => runPressureServerId(event) === "rd").length;
  const remoteRuns = runnerRuns.filter((event) => runPressureServerId(event)?.startsWith("remote_")).length;
  const runEvents = runnerRuns.length;
  const centralRuns = hqRuns + rndRuns;
  const remoteContestProbability = runEvents > 0 ? remoteRuns / runEvents : 0;
  const installedBreakers = (input.playerView.opponent.rig ?? []).filter((card) => hasBreakerSubtype(card)).length;
  const hqPressureEstimate = clamp01(hqRuns / 4 + (input.playerView.opponent.credits >= 6 ? 0.08 : 0));
  const rndPressureEstimate = clamp01(rndRuns / 4 + (input.playerView.opponent.credits >= 6 ? 0.1 : 0));

  return {
    runnerThreatModel: {
      hqPressure: hqPressureEstimate,
      rndPressure: rndPressureEstimate,
      remotePressure: clamp01(remoteRuns / 4 + installedBreakers * 0.07)
    },
    runnerAggressionMemory: {
      runEvents,
      remoteRuns,
      centralRuns
    },
    breakerAvailabilityEstimate: {
      installedBreakers,
      confidence: clamp01(0.35 + installedBreakers * 0.22)
    },
    remoteContestProbability: clamp01(remoteContestProbability),
    hqPressureEstimate,
    rndPressureEstimate
  };
}

function runPressureServerId(event: BeliefEventClassification): string | undefined {
  return event.runTargetServerId ?? event.serverId;
}

function deriveRndTopFreshness(
  history: PublicGameEvent[],
  classifications: BeliefEventClassification[],
): RndTopFreshnessMemory {
  const eventsById = new Map(history.map((event) => [event.eventId, event]));
  let lastKnownAccessEventId: string | undefined;
  let freshness: RndTopFreshnessMemory["freshness"] = "invalidated";
  let knownSequenceDefinitionIds: string[] = [];
  let freshenedByRunnerAccess = false;
  const invalidationReasons: string[] = [];

  for (const event of classifications) {
    const publicEvent = eventsById.get(event.eventId);
    const definitionId = publicEvent
      ? stringValue(publicEvent.publicPayload.cardDefinitionId)
      : undefined;
    const privateLookDefinitions = publicEvent
      ? rndPrivateLookDefinitions(publicEvent)
      : [];
    if (privateLookDefinitions.length > 0) {
      lastKnownAccessEventId = event.eventId;
      freshness = "stale_known_same_top";
      freshenedByRunnerAccess = false;
      knownSequenceDefinitionIds = privateLookDefinitions.slice();
      invalidationReasons.length = 0;
      continue;
    }
    if (isRunnerRdAccess(event)) {
      lastKnownAccessEventId = event.eventId;
      freshness = "fresh";
      freshenedByRunnerAccess = false;
      knownSequenceDefinitionIds = definitionId ? [definitionId] : [];
      invalidationReasons.length = 0;
      continue;
    }
    if (lastKnownAccessEventId && rdTopRemovedByRunnerAccess(event)) {
      knownSequenceDefinitionIds =
        knownSequenceDefinitionIds.length > 1
          ? knownSequenceDefinitionIds.slice(1)
          : [];
      freshness = "fresh_after_top_removed";
      freshenedByRunnerAccess = true;
      invalidationReasons.push(`rd_access_removed_top_card:${event.eventId}`);
      if (knownSequenceDefinitionIds.length > 0)
        invalidationReasons.push(`rd_known_top_sequence_advanced:${event.eventId}`);
      continue;
    }
    if (!lastKnownAccessEventId) continue;
    const reason = rndInvalidationReason(event);
    if (!reason) continue;
    freshness = "invalidated";
    invalidationReasons.push(`${reason}:${event.eventId}`);
    lastKnownAccessEventId = undefined;
    freshenedByRunnerAccess = false;
    knownSequenceDefinitionIds = [];
  }

  if (lastKnownAccessEventId && freshness === "fresh") freshness = "stale_known_same_top";
  const knownTopDefinitionId = knownSequenceDefinitionIds[0];

  return {
    lastKnownAccessEventId: lastKnownAccessEventId ?? "none",
    knownToRunner: knownSequenceDefinitionIds.length > 0 || Boolean(lastKnownAccessEventId),
    freshness,
    ...(knownTopDefinitionId ? { knownTopDefinitionId } : {}),
    ...(knownTopDefinitionId
      ? { knownTopIsAgenda: definitionLooksAgenda(knownTopDefinitionId) }
      : {}),
    ...(knownTopDefinitionId
      ? { knownTopIsLowValue: definitionLooksLowValueRndAccess(knownTopDefinitionId) }
      : {}),
    ...(knownSequenceDefinitionIds.length > 0
      ? { knownSequenceDefinitionIds }
      : {}),
    ...(freshenedByRunnerAccess ? { freshenedByRunnerAccess } : {}),
    invalidationReasons
  };
}

function isRunnerRdAccess(event: BeliefEventClassification): boolean {
  return event.actor === "runner" && event.actionType === "access_card" && event.serverId === "rd";
}

function rndInvalidationReason(event: BeliefEventClassification): string | undefined {
  if (event.actor === "corp" && (event.actionType === "mandatory_draw" || event.actionType === "draw_card")) return "corp_draw_from_rd";
  if (event.family === "shuffle") return "shuffle_changed_rd_top";
  if (event.family === "arrange") return "arrange_changed_rd_top";
  if (event.family === "swap") return "swap_changed_rd_top";
  if (event.serverId === "rd" && ["steal_agenda", "trash_accessed_card", "move_to_removed_from_game", "move_to_set_aside", "return_from_set_aside"].includes(event.actionType)) {
    return "rd_access_moved_card";
  }
  return undefined;
}

function definitionLooksAgenda(definitionId: string): boolean {
  return DEMO_CARDS_BY_ID[definitionId]?.type === "agenda";
}

function definitionLooksLowValueRndAccess(definitionId: string): boolean {
  const definition = DEMO_CARDS_BY_ID[definitionId];
  if (!definition) return false;
  return definition.type !== "agenda" && definition.type !== "asset" && definition.type !== "upgrade";
}

function opponentKnownCardsFromView(input: AiDecisionInput): VisibleCard[] {
  if (input.side === "runner") {
    return input.playerView.servers.flatMap((server) => [...server.ice, ...server.root]).filter((card) => card.known);
  }
  return input.playerView.opponent.rig?.filter((card) => card.known) ?? [];
}

function buildUncertainty(entries: BeliefEntry[], side: Side): string[] {
  const uncertainty: string[] = [];
  if (entries.some((entry) => entry.kind === "unknown")) uncertainty.push("unknown_opponent_hand_or_hidden_zones");
  if (entries.some((entry) => entry.subject.startsWith("remote_card_hypothesis:"))) uncertainty.push("unknown_remote_cards_remain_hypotheses");
  if (side === "runner" && entries.some((entry) => entry.subject.startsWith("unrezzed_ice_risk:"))) uncertainty.push("unrezzed_ice_titles_remain_unknown");
  if (uncertainty.length === 0) uncertainty.push("known_projection_only");
  return sortedUnique(uncertainty);
}

function buildAssumptions(side: Side, entries: BeliefEntry[], classifications: BeliefEventClassification[]): string[] {
  const assumptions = [
    "hidden_corp_information_not_used",
    "hidden_runner_information_not_used",
    "belief_state_reconstructed_from_side_safe_history"
  ];
  if (side === "runner" && entries.some((entry) => entry.subject.startsWith("remote_card_hypothesis:"))) assumptions.push("unknown_remote_cards_modeled_as_hypotheses");
  if (classifications.some((classification) => classification.invalidationReason)) assumptions.push("hypotheses_invalidated_by_classified_events");
  return sortedUnique(assumptions);
}

function deriveInvalidationLog(classifications: BeliefEventClassification[]): string[] {
  return classifications
    .filter((event) => event.invalidationReason)
    .map((event) => `${event.invalidationReason}:${event.eventId}${event.serverId ? `:${event.serverId}` : ""}`);
}

function invalidationEntryReferencesServer(entry: string, serverId: string): boolean {
  return entry
    .toLowerCase()
    .split(/[.:-]+/)
    .some((segment) => segment === serverId);
}

function invalidationReasonForEvent(
  family: BeliefEventFamily,
  actionType: string,
  actor: Side | "system",
  serverId: string | undefined,
  event: PublicGameEvent
): string | undefined {
  if (actor === "corp" && (actionType === "mandatory_draw" || actionType === "draw_card")) return "corp_draw_event";
  if (family === "shuffle") return "shuffle_event";
  if (family === "arrange") return "arrange_event";
  if (family === "swap") return "swap_event";
  if (family === "move") return "move_event";
  if (family === "score" || family === "steal" || family === "trash") return "card_resolution_event";
  if (family === "reveal" || family === "expose") return "reveal_expose_event";
  if (serverId?.startsWith("remote_") && (family === "install" || family === "advance")) return "remote_state_changed";
  if (stringValue(event.publicPayload.cardDefinitionId) === RD_SWAP_OPERATION_DEFINITION_ID) return "rd_swap_operation";
  return undefined;
}

function eventFamily(actionType: string, event: PublicGameEvent): BeliefEventFamily {
  const hiddenZoneAction = stringValue(event.publicPayload.hiddenZoneAction);
  const hiddenZoneFamily = hiddenZoneActionEventFamily(hiddenZoneAction);
  if (hiddenZoneFamily) return hiddenZoneFamily;
  if (actionType === "install_card") return "install";
  if (actionType === "rez_ice") return "rez";
  if (actionType === "advance_card") return "advance";
  if (actionType === "score_agenda") return "score";
  if (actionType === "steal_agenda") return "steal";
  if (actionType === "access_card") return "access";
  if (actionType === "trash_accessed_card" || actionType === "trash_resource") return "trash";
  if (actionType === "mandatory_draw" || actionType === "draw_card") return "draw";
  if (actionType === "start_run" || actionType === "jack_out" || actionType === "continue_run") return "run";
  if (actionType === "move_to_set_aside" || actionType === "move_to_removed_from_game" || actionType === "return_from_set_aside" || actionType === "change_card_control") return "move";

  if (actionType === "resolve_choice") {
    if (event.publicPayload.discardResolved === true) return "discard";
    if (revealKind(event) === "expose") return "expose";
    if (revealKind(event) === "reveal") return "reveal";
  }

  if (actionType === "play_operation" && stringValue(event.publicPayload.cardDefinitionId) === RD_SWAP_OPERATION_DEFINITION_ID) return "swap";
  if (revealKind(event) === "reveal") return "reveal";
  if (revealKind(event) === "expose") return "expose";
  return "other";
}

export function hiddenZoneActionEventFamily(
  hiddenZoneAction: string | undefined,
): BeliefEventFamily | undefined {
  if (!hiddenZoneAction) return undefined;
  if (rolesMatch([hiddenZoneAction], ["shuffle"])) return "shuffle";
  if (rolesMatch([hiddenZoneAction], ["arrange", "reorder", "conceal"]))
    return "arrange";
  if (rolesMatch([hiddenZoneAction], ["private_look"])) return "reveal";
  return undefined;
}

function publicServerId(event: PublicGameEvent): string | undefined {
  const raw =
    stringValue(event.publicPayload.serverId) ??
    stringValue(event.publicPayload.attackedServerId) ??
    stringValue(event.publicPayload.targetServerId) ??
    stringValue(event.publicPayload.server);
  if (raw) return canonicalStructuredServerId(raw);
  const exposedServerId = stringValue(event.publicPayload.exposedServerId);
  if (exposedServerId) return canonicalStructuredServerId(exposedServerId);
  return undefined;
}

function publicRunTargetServerId(
  event: PublicGameEvent,
  actionType: string,
): string | undefined {
  if (actionType !== "start_run" && actionType !== "access_card")
    return undefined;
  return (
    publicServerId(event) ??
    visibleServerLabelId(stringValue(event.publicPayload.serverLabel)) ??
    visibleServerLabelId(stringValue(event.publicPayload.serverName))
  );
}

function visibleServerLabelId(label: string | undefined): string | undefined {
  const normalized = label?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "hq") return "hq";
  if (normalized === "r&d" || normalized === "rd") return "rd";
  if (normalized === "archives") return "archives";
  const remoteMatch = /^remote[\s_-]+(\d+)$/.exec(normalized);
  if (remoteMatch) return `remote_${Number.parseInt(remoteMatch[1], 10)}`;
  return undefined;
}

function canonicalStructuredServerId(serverId: string): string {
  if (serverId === "hq" || serverId === "rd" || serverId === "archives") return serverId;
  if (serverId.startsWith("remote_")) return serverId;
  return serverId;
}

function revealKind(event: PublicGameEvent): "reveal" | "expose" | undefined {
  const revealKindValue = stringValue(event.publicPayload.revealKind);
  if (revealKindValue === "expose") return "expose";
  if (revealKindValue === "reveal") return "reveal";
  return undefined;
}

function parseActor(actor: unknown): Side | "system" {
  if (actor === "runner" || actor === "corp") return actor;
  return "system";
}

function hasBreakerSubtype(card: VisibleCard): boolean {
  return card.subtypes?.some((subtype) => subtype === "fracter" || subtype === "decoder" || subtype === "killer") ?? false;
}

function dedupeEntries(entries: BeliefEntry[]): BeliefEntry[] {
  const merged = new Map<string, BeliefEntry>();
  for (const entry of entries) {
    const existing = merged.get(entry.key);
    if (!existing) {
      merged.set(entry.key, {
        ...entry,
        sourceEventIds: sortedUnique(entry.sourceEventIds),
        invalidatedBy: sortedUnique(entry.invalidatedBy)
      });
      continue;
    }
    merged.set(entry.key, {
      ...existing,
      confidence: Math.max(existing.confidence, entry.confidence),
      sourceEventIds: sortedUnique([...existing.sourceEventIds, ...entry.sourceEventIds]),
      invalidatedBy: sortedUnique([...existing.invalidatedBy, ...entry.invalidatedBy])
    });
  }
  return [...merged.values()].sort((left, right) => left.key.localeCompare(right.key));
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, round(value)));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
