import type { AccessDecisionReason, AccessIntent } from "./access-decision-types";

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
