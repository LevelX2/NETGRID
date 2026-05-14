import type { AiDecisionInput, PublicGameEvent, Side, VisibleCard } from "@netgrid/shared";

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
  freshness: "fresh" | "stale_known_same_top" | "invalidated";
  invalidationReasons: string[];
};

export type KnownPositionMemory = {
  zone: string;
  positionKey: string;
  definitionId: string;
  certainty: "observed";
  sourceEventId: string;
  invalidatedBy: string[];
};

export type KnownHqHandMemory = {
  handCount: number;
  knownDefinitions: string[];
  knownCount: number;
  allCardsKnown: boolean;
  sourceEventIds: string[];
  invalidationReasons: string[];
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
  const rndTopFreshness = input.side === "runner" ? deriveRndTopFreshness(classifications) : undefined;
  const knownPositionMemory = input.side === "runner" ? deriveKnownPositionMemory(history, classifications) : [];
  const hqHandMemory = input.side === "runner" ? deriveKnownHqHandMemory(input, history, classifications) : undefined;
  const runnerOpponentModel =
    input.side === "runner" ? deriveRunnerOpponentModel(input, entries, classifications, rndTopFreshness, knownPositionMemory, hqHandMemory) : undefined;
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
  const actor = parseActor(event.publicPayload.actor);
  const family = eventFamily(actionType, event);
  return {
    eventId: event.eventId,
    eventType: event.type,
    actionType,
    family,
    actor,
    ...(serverId ? { serverId } : {}),
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
        invalidatedBy: invalidationLog.filter((entry) => entry.includes(server.id)).slice(0, 3)
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
        invalidatedBy: invalidationLog.filter((entry) => entry.includes(server.id)).slice(0, 3)
      });
    }
  }

  return entries;
}

function deriveKnownPositionMemory(history: PublicGameEvent[], classifications: BeliefEventClassification[]): KnownPositionMemory[] {
  const eventsById = new Map(history.map((event) => [event.eventId, event]));
  const memory = new Map<string, KnownPositionMemory>();

  for (const classification of classifications) {
    for (const key of [...memory.keys()]) {
      if (positionInvalidatesKey(key, classification)) memory.delete(key);
    }

    const event = eventsById.get(classification.eventId);
    const definitionId = event ? stringValue(event.publicPayload.cardDefinitionId) : undefined;
    if (!definitionId) continue;
    if (!["access", "reveal", "expose", "rez"].includes(classification.family)) continue;

    const zone = classification.serverId ?? "unknown";
    if (zone === "unknown") continue;
    const positionKey = classification.family === "access" && zone === "rd" ? "top" : classification.family === "access" ? "accessed" : "installed";
    const key = `${zone}:${positionKey}`;
    memory.set(key, {
      zone,
      positionKey,
      definitionId,
      certainty: "observed",
      sourceEventId: classification.eventId,
      invalidatedBy: []
    });
  }

  return [...memory.values()].sort((left, right) => `${left.zone}:${left.positionKey}`.localeCompare(`${right.zone}:${right.positionKey}`));
}

function deriveKnownHqHandMemory(input: AiDecisionInput, history: PublicGameEvent[], classifications: BeliefEventClassification[]): KnownHqHandMemory {
  const eventsById = new Map(history.map((event) => [event.eventId, event]));
  const knownDefinitions = new Map<string, string>();
  const invalidationReasons: string[] = [];

  for (const classification of classifications) {
    const event = eventsById.get(classification.eventId);
    const definitionId = event ? stringValue(event.publicPayload.cardDefinitionId) : undefined;

    if (isRunnerHqAccess(classification) && definitionId) {
      if (!knownDefinitions.has(definitionId)) knownDefinitions.set(definitionId, classification.eventId);
      continue;
    }

    const adjustment = hqHandMemoryAdjustment(classification, definitionId);
    if (!adjustment) continue;

    invalidationReasons.push(`${adjustment.reason}:${classification.eventId}`);
    if (adjustment.kind === "remove_known" && definitionId && knownDefinitions.has(definitionId)) {
      knownDefinitions.delete(definitionId);
      continue;
    }
    if (adjustment.kind === "unknown_departure" || adjustment.kind === "hidden_zone_reordered") {
      knownDefinitions.clear();
    }
  }

  const knownEntries = [...knownDefinitions.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  const knownDefinitionIds = knownEntries.map(([definitionId]) => definitionId);
  const handCount = input.playerView.opponent.handCount;
  return {
    handCount,
    knownDefinitions: knownDefinitionIds,
    knownCount: knownDefinitionIds.length,
    allCardsKnown: handCount > 0 && knownDefinitionIds.length === handCount,
    sourceEventIds: knownEntries.map(([, eventId]) => eventId),
    invalidationReasons
  };
}

function positionInvalidatesKey(key: string, event: BeliefEventClassification): boolean {
  if (event.family === "draw" && event.actor === "corp") return key.startsWith("rd:");
  if (event.family === "shuffle" || event.family === "arrange" || event.family === "swap") return true;
  if (event.family === "move" || event.family === "trash" || event.family === "steal" || event.family === "discard") {
    return event.serverId ? key.startsWith(`${event.serverId}:`) : true;
  }
  return false;
}

function isRunnerHqAccess(event: BeliefEventClassification): boolean {
  return event.actor === "runner" && event.actionType === "access_card" && event.serverId === "hq";
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

function deriveRunnerOpponentModel(
  input: AiDecisionInput,
  entries: BeliefEntry[],
  classifications: BeliefEventClassification[],
  rndTopFreshness: RndTopFreshnessMemory | undefined,
  knownPositionMemory: KnownPositionMemory[],
  hqHandMemory: KnownHqHandMemory | undefined
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
        invalidationReasons: []
      } satisfies KnownHqHandMemory)
  };
}

function deriveCorpOpponentModel(input: AiDecisionInput, classifications: BeliefEventClassification[]): CorpOpponentModel {
  const runnerRuns = classifications.filter((event) => event.actor === "runner" && (event.actionType === "start_run" || event.actionType === "access_card"));
  const hqRuns = runnerRuns.filter((event) => event.serverId === "hq").length;
  const rndRuns = runnerRuns.filter((event) => event.serverId === "rd").length;
  const remoteRuns = runnerRuns.filter((event) => event.serverId?.startsWith("remote_")).length;
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

function deriveRndTopFreshness(classifications: BeliefEventClassification[]): RndTopFreshnessMemory {
  let lastKnownAccessEventId: string | undefined;
  let freshness: RndTopFreshnessMemory["freshness"] = "invalidated";
  const invalidationReasons: string[] = [];

  for (const event of classifications) {
    if (isRunnerRdAccess(event)) {
      lastKnownAccessEventId = event.eventId;
      freshness = "fresh";
      invalidationReasons.length = 0;
      continue;
    }
    if (!lastKnownAccessEventId) continue;
    const reason = rndInvalidationReason(event);
    if (!reason) continue;
    freshness = "invalidated";
    invalidationReasons.push(`${reason}:${event.eventId}`);
    lastKnownAccessEventId = undefined;
  }

  if (lastKnownAccessEventId && freshness === "fresh") freshness = "stale_known_same_top";

  return {
    lastKnownAccessEventId: lastKnownAccessEventId ?? "none",
    knownToRunner: Boolean(lastKnownAccessEventId),
    freshness,
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
    const hiddenZoneAction = stringValue(event.publicPayload.hiddenZoneAction);
    if (event.publicPayload.discardResolved === true) return "discard";
    if (hiddenZoneAction?.includes("shuffle")) return "shuffle";
    if (hiddenZoneAction?.includes("arrange")) return "arrange";
  }

  if (actionType === "play_operation" && stringValue(event.publicPayload.cardDefinitionId) === RD_SWAP_OPERATION_DEFINITION_ID) return "swap";
  if (actionType === "play_event" && revealKind(event) === "reveal") return "reveal";
  if (actionType === "play_event" && revealKind(event) === "expose") return "expose";
  return "other";
}

function publicServerId(event: PublicGameEvent): string | undefined {
  const raw =
    stringValue(event.publicPayload.serverId) ??
    stringValue(event.publicPayload.attackedServerId) ??
    stringValue(event.publicPayload.targetServerId) ??
    stringValue(event.publicPayload.server);
  if (raw) return normalizeServerId(raw);
  const label = stringValue(event.publicPayload.serverLabel);
  if (!label) return undefined;
  return serverIdFromLabel(label);
}

function normalizeServerId(serverId: string): string {
  if (serverId === "hq" || serverId === "rd" || serverId === "archives") return serverId;
  if (serverId.startsWith("remote_")) return serverId;
  return serverIdFromLabel(serverId) ?? serverId;
}

function serverIdFromLabel(label: string): string | undefined {
  const normalized = label.toLowerCase();
  if (normalized === "hq") return "hq";
  if (normalized === "r&d" || normalized === "f&e (r&d)" || normalized === "f&e") return "rd";
  if (normalized === "archives" || normalized === "archive") return "archives";
  const remoteMatch = /^remote\s+(\d+)$/i.exec(label.trim());
  if (remoteMatch) return `remote_${remoteMatch[1]}`;
  return undefined;
}

function revealKind(event: PublicGameEvent): "reveal" | "expose" | undefined {
  const revealKindValue = stringValue(event.publicPayload.revealKind);
  if (revealKindValue?.includes("expose")) return "expose";
  if (revealKindValue) return "reveal";
  const definitionId = stringValue(event.publicPayload.cardDefinitionId);
  if (!definitionId) return undefined;
  if (definitionId.includes("expose")) return "expose";
  if (definitionId.includes("reveal")) return "reveal";
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
