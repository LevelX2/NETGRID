import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import type {
  AccessDecisionReason,
  AccessIntent,
} from "./access-decision-types";
import { observedAccessOutcomeEvidence } from "./access-outcome-projection";

export type AccessOutcomeMemoryKey = {
  matchId: string;
  side: "runner" | "corp";
  profileId: string;
  serverId: string;
};

export type AccessOutcomeMemoryEntry = {
  remoteFingerprint: string;
  observedDecision: AccessIntent;
  reason: AccessDecisionReason;
  creditsAtOutcome: number;
  desiredReserveAtOutcome: number;
  generalTrashCost?: number;
  stateVersion: number;
};

export type AccessOutcomeMemoryRecord = AccessOutcomeMemoryKey &
  AccessOutcomeMemoryEntry;

export type AccessOutcomeMemoryInvalidationReason =
  | "remote_fingerprint_changed"
  | "credits_or_reserve_improved";

export type AccessOutcomeMemoryStatus = {
  applies: boolean;
  invalidationReason?: AccessOutcomeMemoryInvalidationReason;
  suppressesPlanBonus: boolean;
  evidence: string[];
};

export type AccessOutcomeMemoryState = {
  records: AccessOutcomeMemoryRecord[];
};

export function createAccessOutcomeMemory(): AccessOutcomeMemoryState {
  return { records: [] };
}

export function rememberAccessOutcome(
  memory: AccessOutcomeMemoryState,
  key: AccessOutcomeMemoryKey,
  entry: AccessOutcomeMemoryEntry,
): AccessOutcomeMemoryState {
  const nextRecords = memory.records.filter(
    (record) => !sameAccessOutcomeKey(record, key),
  );
  return {
    records: [...nextRecords, { ...key, ...entry }],
  };
}

export function readAccessOutcomeMemory(
  memory: AccessOutcomeMemoryState,
  key: AccessOutcomeMemoryKey,
): AccessOutcomeMemoryRecord | undefined {
  return memory.records.find((record) => sameAccessOutcomeKey(record, key));
}

export function invalidateAccessOutcomeMemory(
  memory: AccessOutcomeMemoryState,
  predicate: (record: AccessOutcomeMemoryRecord) => boolean,
): AccessOutcomeMemoryState {
  return {
    records: memory.records.filter((record) => !predicate(record)),
  };
}

export function resetAccessOutcomeMemoryForMatch(
  memory: AccessOutcomeMemoryState,
  matchId: string,
): AccessOutcomeMemoryState {
  return invalidateAccessOutcomeMemory(
    memory,
    (record) => record.matchId === matchId,
  );
}

export function accessOutcomeMemoryEvidence(
  record: AccessOutcomeMemoryRecord,
): string[] {
  return [
    `access_outcome_memory_match:${record.matchId}`,
    `access_outcome_memory_side:${record.side}`,
    `access_outcome_memory_profile:${record.profileId}`,
    `access_outcome_memory_server:${record.serverId}`,
    `access_outcome_memory_fingerprint:${record.remoteFingerprint}`,
    `access_outcome_memory_decision:${record.observedDecision}`,
    `access_outcome_memory_reason:${record.reason}`,
    `access_outcome_memory_credits:${record.creditsAtOutcome}`,
    `access_outcome_memory_reserve:${record.desiredReserveAtOutcome}`,
    ...(record.generalTrashCost !== undefined
      ? [`access_outcome_memory_general_trash_cost:${record.generalTrashCost}`]
      : []),
    `access_outcome_memory_state_version:${record.stateVersion}`,
  ];
}

export function evaluateAccessOutcomeMemoryStatus(
  record: AccessOutcomeMemoryRecord,
  context: {
    currentRemoteFingerprint: string;
    currentCredits: number;
    currentDesiredReserve: number;
  },
): AccessOutcomeMemoryStatus {
  if (record.remoteFingerprint !== context.currentRemoteFingerprint) {
    return {
      applies: false,
      invalidationReason: "remote_fingerprint_changed",
      suppressesPlanBonus: false,
      evidence: [
        ...accessOutcomeMemoryEvidence(record),
        "access_outcome_memory_applies:false",
        "access_outcome_memory_invalidated:remote_fingerprint_changed",
      ],
    };
  }
  if (
    record.observedDecision === "decline" &&
    context.currentCredits - context.currentDesiredReserve >
      record.creditsAtOutcome - record.desiredReserveAtOutcome
  ) {
    return {
      applies: false,
      invalidationReason: "credits_or_reserve_improved",
      suppressesPlanBonus: false,
      evidence: [
        ...accessOutcomeMemoryEvidence(record),
        "access_outcome_memory_applies:false",
        "access_outcome_memory_invalidated:credits_or_reserve_improved",
      ],
    };
  }
  return {
    applies: true,
    suppressesPlanBonus: record.observedDecision === "decline",
    evidence: [
      ...accessOutcomeMemoryEvidence(record),
      "access_outcome_memory_applies:true",
      `access_outcome_memory_suppresses_plan_bonus:${record.observedDecision === "decline"}`,
    ],
  };
}

export function accessOutcomeMemoryPlanEvidence(
  status: AccessOutcomeMemoryStatus | undefined,
): string[] {
  if (!status?.applies || !status.suppressesPlanBonus) return [];
  return [
    "access_outcome_memory_no_plan_bonus:true",
    "access_outcome_memory_applied:declined_access",
  ];
}

export function deriveObservedRemoteNoProgressAccessMemory(
  input: AiDecisionInput,
  serverId: string | undefined,
): AccessOutcomeMemoryStatus | undefined {
  if (!serverId?.startsWith("remote_")) return undefined;
  const currentKnownRootDefinitionIds = currentKnownRemoteRootDefinitionIds(
    input,
    serverId,
  );
  if (currentKnownRootDefinitionIds.length === 0) return undefined;
  if (currentKnownRemoteHasAgenda(input, serverId)) return undefined;
  const history = mergedPublicHistory(input);
  const lastRunIndex = findLastIndex(
    history,
    (event) =>
      publicActor(event) === "runner" &&
      publicActionType(event) === "start_run" &&
      eventServerId(event) === serverId,
  );
  if (lastRunIndex < 0) return undefined;
  const afterRun = history.slice(lastRunIndex + 1);
  const accessEvent = afterRun.find(
    (event) =>
      publicActor(event) === "runner" &&
      publicActionType(event) === "access_card" &&
      eventServerId(event) === serverId,
  );
  if (!accessEvent) return undefined;
  const progressEvent = afterRun.find(
    (event) =>
      publicActor(event) === "runner" &&
      (publicActionType(event) === "trash_accessed_card" ||
        publicActionType(event) === "steal_agenda") &&
      eventServerId(event) === serverId,
  );
  if (progressEvent) return undefined;
  if (remoteChangedAfterAccess(input, serverId, accessEvent)) return undefined;
  const accessedDefinitionId =
    stringPayloadValue(accessEvent, "cardDefinitionId") ??
    currentKnownRootDefinitionIds[0]!;
  const remoteFingerprint = knownRootFingerprint(accessedDefinitionId);
  const record: AccessOutcomeMemoryRecord = {
    matchId: input.decisionId,
    side: "runner",
    profileId: input.profileId,
    serverId,
    remoteFingerprint,
    observedDecision: "access_only",
    reason: "target_unavailable",
    creditsAtOutcome: input.playerView.own.credits,
    desiredReserveAtOutcome: input.playerView.own.credits,
    stateVersion: accessEvent.stateVersionAfter,
  };
  const status = evaluateAccessOutcomeMemoryStatus(record, {
    currentRemoteFingerprint: remoteFingerprint,
    currentCredits: input.playerView.own.credits,
    currentDesiredReserve: input.playerView.own.credits,
  });
  return {
    applies: status.applies,
    suppressesPlanBonus: status.applies,
    evidence: [
      "remote_access_outcome_source:observed_public_access",
      "remote_access_outcome_decision:access_only",
      "remote_access_outcome_reason:target_unavailable",
      "remote_access_outcome_no_progress:true",
      "known_remote_no_current_payoff",
      "repeated_remote_no_progress_suppressed",
      `remote_access_outcome_source_event:${accessEvent.eventId}`,
      `remote_access_outcome_server:${serverId}`,
      `remote_access_outcome_known_root:${accessedDefinitionId}`,
      ...observedAccessOutcomeEvidence({
        serverId,
        knownRootDefinitionId: accessedDefinitionId,
        observedIntent: "access_only",
        reason: "target_unavailable",
        stateVersion: accessEvent.stateVersionAfter,
      }),
      ...status.evidence,
    ],
  };
}

function sameAccessOutcomeKey(
  record: AccessOutcomeMemoryKey,
  key: AccessOutcomeMemoryKey,
): boolean {
  return (
    record.matchId === key.matchId &&
    record.side === key.side &&
    record.profileId === key.profileId &&
    record.serverId === key.serverId
  );
}

function knownRootFingerprint(knownRootDefinitionId: string): string {
  return `known_root:${knownRootDefinitionId}`;
}

function currentKnownRemoteRootDefinitionIds(
  input: AiDecisionInput,
  serverId: string,
): string[] {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return [];
  return server.root
    .filter((card) => card.known && card.definitionId)
    .map((card) => card.definitionId!)
    .sort();
}

function currentKnownRemoteHasAgenda(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server?.root.some((card) => card.known && card.type === "agenda") ?? false
  );
}

function mergedPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(
    (left, right) => left.stateVersionAfter - right.stateVersionAfter,
  );
}

function remoteChangedAfterAccess(
  input: AiDecisionInput,
  serverId: string,
  accessEvent: PublicGameEvent,
): boolean {
  return mergedPublicHistory(input).some(
    (event) =>
      event.stateVersionAfter > accessEvent.stateVersionAfter &&
      eventServerId(event) === serverId &&
      remoteChangeActionTypes.has(publicActionType(event)),
  );
}

const remoteChangeActionTypes = new Set([
  "install_card",
  "install_ice",
  "trash_accessed_card",
  "steal_agenda",
  "score_agenda",
  "rez_card",
  "rez_ice",
  "advance_card",
]);

function publicActionType(event: PublicGameEvent): string {
  return stringPayloadValue(event, "actionType") ?? event.type;
}

function publicActor(event: PublicGameEvent): string | undefined {
  return stringPayloadValue(event, "actor");
}

function eventServerId(event: PublicGameEvent): string | undefined {
  const raw =
    stringPayloadValue(event, "serverId") ??
    stringPayloadValue(event, "attackedServerId") ??
    stringPayloadValue(event, "targetServerId") ??
    stringPayloadValue(event, "server");
  if (raw) return canonicalServerId(raw);
  return (
    visibleServerLabelId(stringPayloadValue(event, "serverLabel")) ??
    visibleServerLabelId(stringPayloadValue(event, "serverName")) ??
    visibleServerLabelId(
      nestedStringPayloadValue(event, "targets", "serverLabel"),
    ) ??
    visibleServerLabelId(
      nestedStringPayloadValue(event, "targets", "serverName"),
    )
  );
}

function canonicalServerId(serverId: string): string {
  const normalized = serverId.trim().toLowerCase();
  if (normalized === "hq") return "hq";
  if (normalized === "rd" || normalized === "rnd" || normalized === "r&d")
    return "rd";
  if (normalized === "archives") return "archives";
  if (normalized.startsWith("remote_")) return normalized;
  const remoteMatch = /^remote[\s_-]+(\d+)$/.exec(normalized);
  const remoteIndex = remoteMatch?.[1];
  if (remoteIndex) return `remote_${Number.parseInt(remoteIndex, 10)}`;
  return serverId;
}

function visibleServerLabelId(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const canonical = canonicalServerId(label);
  if (
    canonical === "hq" ||
    canonical === "rd" ||
    canonical === "archives" ||
    canonical.startsWith("remote_")
  ) {
    return canonical;
  }
  return undefined;
}

function stringPayloadValue(
  event: PublicGameEvent,
  key: string,
): string | undefined {
  const value = event.publicPayload[key];
  return typeof value === "string" ? value : undefined;
}

function nestedStringPayloadValue(
  event: PublicGameEvent,
  parentKey: string,
  childKey: string,
): string | undefined {
  const parent = event.publicPayload[parentKey];
  if (!parent || typeof parent !== "object" || Array.isArray(parent))
    return undefined;
  const value = (parent as Record<string, unknown>)[childKey];
  return typeof value === "string" ? value : undefined;
}

function findLastIndex<T>(
  values: readonly T[],
  predicate: (value: T) => boolean,
): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index]!)) return index;
  }
  return -1;
}
