import type {
  AiDecisionInput,
  PublicGameEvent,
} from "@netgrid/shared";
import type { AccessDecisionReason, AccessIntent } from "../access/access-decision-types";
import {
  accessOutcomeMemoryEvidence,
  evaluateAccessOutcomeMemoryStatus,
  type AccessOutcomeMemoryRecord,
  type AccessOutcomeMemoryStatus,
} from "../access/access-outcome-memory";
import { observedAccessOutcomeEvidence } from "../access/access-outcome-projection";

export type RemoteAccessOutcomeDecision =
  | "declined_trash"
  | "trashed"
  | "stolen"
  | Extract<AccessIntent, "access_only">;

export type RemoteAccessOutcomeReason = AccessDecisionReason;

export type RemoteAccessOutcomeMemoryEntry = {
  serverId: string;
  knownRootDefinitionId: string;
  accessDecision: RemoteAccessOutcomeDecision;
  reason: RemoteAccessOutcomeReason;
  stateVersion: number;
  expiresWhenRemoteChanges: boolean;
};

export type RemoteAccessOutcomeMemoryStatus = {
  applies: boolean;
  invalidationReason?: "remote_changed" | "credits_or_reserve_improved";
  suppressesPlanBonus: boolean;
  evidence: string[];
};

export function createRemoteAccessOutcomeMemoryEntry(params: {
  serverId: string;
  knownRootDefinitionId: string;
  accessDecision: RemoteAccessOutcomeDecision;
  reason: RemoteAccessOutcomeReason;
  stateVersion: number;
  expiresWhenRemoteChanges?: boolean;
}): RemoteAccessOutcomeMemoryEntry {
  return {
    serverId: params.serverId,
    knownRootDefinitionId: params.knownRootDefinitionId,
    accessDecision: params.accessDecision,
    reason: params.reason,
    stateVersion: params.stateVersion,
    expiresWhenRemoteChanges: params.expiresWhenRemoteChanges ?? true,
  };
}

export function remoteAccessOutcomeEvidence(
  entry: RemoteAccessOutcomeMemoryEntry,
): string[] {
  return [
    `remote_access_outcome_server:${entry.serverId}`,
    `remote_access_outcome_known_root:${entry.knownRootDefinitionId}`,
    `remote_access_outcome_decision:${entry.accessDecision}`,
    `remote_access_outcome_reason:${entry.reason}`,
    `remote_access_outcome_state_version:${entry.stateVersion}`,
    `remote_access_outcome_expires_when_remote_changes:${entry.expiresWhenRemoteChanges}`,
    ...accessOutcomeMemoryEvidence(remoteAccessOutcomeCompatibilityRecord(entry)),
    ...observedAccessOutcomeEvidence({
      serverId: entry.serverId,
      knownRootDefinitionId: entry.knownRootDefinitionId,
      observedIntent: accessOutcomeIntentForDecision(entry.accessDecision),
      reason: entry.reason,
      stateVersion: entry.stateVersion,
    }),
  ];
}

function accessOutcomeIntentForDecision(
  accessDecision: RemoteAccessOutcomeDecision,
): AccessIntent {
  switch (accessDecision) {
    case "stolen":
      return "steal";
    case "trashed":
      return "trash";
    case "declined_trash":
      return "decline";
    case "access_only":
      return "access_only";
  }
}

export function evaluateRemoteAccessOutcomeMemory(
  entry: RemoteAccessOutcomeMemoryEntry,
  context: {
    currentKnownRootDefinitionIds: readonly string[];
    creditsOrReserveImproved?: boolean;
  },
): RemoteAccessOutcomeMemoryStatus {
  const status = evaluateAccessOutcomeMemoryStatus(
    remoteAccessOutcomeCompatibilityRecord(entry),
    {
      currentRemoteFingerprint:
        entry.expiresWhenRemoteChanges &&
        !context.currentKnownRootDefinitionIds.includes(
          entry.knownRootDefinitionId,
        )
          ? "legacy_remote_changed"
          : legacyRemoteFingerprint(entry.knownRootDefinitionId),
      currentCredits: context.creditsOrReserveImproved === true ? 1 : 0,
      currentDesiredReserve: 0,
    },
  );
  if (status.invalidationReason === "remote_fingerprint_changed") {
    return {
      applies: false,
      invalidationReason: "remote_changed",
      suppressesPlanBonus: false,
      evidence: [
        ...remoteAccessOutcomeEvidence(entry),
        ...status.evidence,
        "remote_access_outcome_applies:false",
        "remote_access_outcome_invalidated:remote_changed",
      ],
    };
  }
  if (status.invalidationReason === "credits_or_reserve_improved") {
    return {
      applies: false,
      invalidationReason: "credits_or_reserve_improved",
      suppressesPlanBonus: false,
      evidence: [
        ...remoteAccessOutcomeEvidence(entry),
        ...status.evidence,
        "remote_access_outcome_applies:false",
        "remote_access_outcome_invalidated:credits_or_reserve_improved",
      ],
    };
  }
  return {
    applies: true,
    suppressesPlanBonus: status.suppressesPlanBonus,
    evidence: [
      ...remoteAccessOutcomeEvidence(entry),
      ...status.evidence,
      "remote_access_outcome_applies:true",
      `remote_access_outcome_suppresses_plan_bonus:${status.suppressesPlanBonus}`,
    ],
  };
}

export function deriveObservedRemoteNoProgressAccessMemory(
  input: AiDecisionInput,
  serverId: string | undefined,
): AccessOutcomeMemoryStatus | undefined {
  if (!serverId?.startsWith("remote_")) return undefined;
  const currentKnownRootDefinitionIds =
    currentKnownRemoteRootDefinitionIds(input, serverId);
  if (currentKnownRootDefinitionIds.length === 0) return undefined;
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
  const entry = createRemoteAccessOutcomeMemoryEntry({
    serverId,
    knownRootDefinitionId: accessedDefinitionId,
    accessDecision: "access_only",
    reason: "target_unavailable",
    stateVersion: accessEvent.stateVersionAfter,
  });
  const status = evaluateRemoteAccessOutcomeMemory(entry, {
    currentKnownRootDefinitionIds,
  });
  return {
    applies: status.applies,
    suppressesPlanBonus: status.applies,
    ...(status.invalidationReason === "credits_or_reserve_improved"
      ? { invalidationReason: status.invalidationReason }
      : {}),
    evidence: [
      "remote_access_outcome_source:observed_public_access",
      "remote_access_outcome_decision:access_only",
      "remote_access_outcome_no_progress:true",
      "known_remote_no_current_payoff",
      "repeated_remote_no_progress_suppressed",
      `remote_access_outcome_source_event:${accessEvent.eventId}`,
      `remote_access_outcome_server:${serverId}`,
      ...status.evidence,
    ],
  };
}

/**
 * @deprecated Compatibility bridge for old payoff evidence arrays. New callers
 * should use RemoteAccessOutcomeMemoryStatus plus
 * remoteAccessOutcomePlanEvidence, or the access/access-outcome-memory helpers.
 */
export function declinedTrashOutcomePlanEvidence(
  payoffEvidence: readonly string[],
): string[] {
  const applies = payoffEvidence.includes("remote_access_outcome_applies:true");
  const suppressesPlanBonus = payoffEvidence.includes(
    "remote_access_outcome_suppresses_plan_bonus:true",
  );
  return remoteAccessOutcomePlanEvidence({
    applies,
    suppressesPlanBonus,
  });
}

export function remoteAccessOutcomePlanEvidence(
  status:
    | Pick<RemoteAccessOutcomeMemoryStatus, "applies" | "suppressesPlanBonus">
    | undefined,
): string[] {
  if (!status?.applies || !status.suppressesPlanBonus) return [];
  return [
    "remote_access_outcome_no_plan_bonus:true",
    "remote_access_outcome_memory_applied:declined_trash",
  ];
}

function remoteAccessOutcomeCompatibilityRecord(
  entry: RemoteAccessOutcomeMemoryEntry,
): AccessOutcomeMemoryRecord {
  return {
    matchId: "legacy_remote_access_outcome",
    side: "runner",
    profileId: "legacy",
    serverId: entry.serverId,
    remoteFingerprint: legacyRemoteFingerprint(entry.knownRootDefinitionId),
    observedDecision: accessOutcomeIntentForDecision(entry.accessDecision),
    reason: entry.reason,
    creditsAtOutcome: 0,
    desiredReserveAtOutcome: 0,
    stateVersion: entry.stateVersion,
  };
}

function legacyRemoteFingerprint(knownRootDefinitionId: string): string {
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
  return (
    stringPayloadValue(event, "serverId") ??
    stringPayloadValue(event, "attackedServerId") ??
    stringPayloadValue(event, "targetServerId") ??
    stringPayloadValue(event, "server")
  );
}

function stringPayloadValue(
  event: PublicGameEvent,
  key: string,
): string | undefined {
  const value = event.publicPayload[key];
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
