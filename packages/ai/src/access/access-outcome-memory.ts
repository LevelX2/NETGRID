import { isRemoteServerId } from "@netgrid/shared";
import type { MatchEventId } from "@netgrid/shared";
import { cardDefinitionIdValue } from "../card-definition-id-input";
import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import { reconstructBeliefState } from "../belief-state";
import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import {
  findLastHistoryIndex,
  mergedPublicHistory,
} from "../public-event-history";
import { observedAccessOutcomeEvidence } from "./access-outcome-projection";

export type AccessOutcomeMemoryStatus = {
  applies: boolean;
  invalidationReason?:
    | "remote_fingerprint_changed"
    | "credits_or_reserve_improved";
  suppressesPlanBonus: boolean;
  suppressUntilInvalidated?: boolean;
  evidence: string[];
};

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
  if (
    input.side !== "runner" ||
    typeof input.matchId !== "string" ||
    input.matchId.trim().length === 0
  ) {
    return undefined;
  }
  if (!isRemoteServerId(serverId)) return undefined;
  const currentKnownRoots = currentKnownRemoteRoots(input, serverId);
  if (currentKnownRoots.length === 0) return undefined;
  if (
    currentKnownRoots.some(
      ({ definitionId }) =>
        planningCardFactsByDefinitionId(definitionId)?.type === "agenda",
    )
  )
    return undefined;
  const history = mergedPublicHistory(input);
  const lastAccessIndex = findLastHistoryIndex(
    history,
    (event) =>
      publicActor(event) === "runner" &&
      publicActionType(event) === "access_card" &&
      eventServerId(event) === serverId &&
      currentKnownRoots.some((root) =>
        root.sourceEventId
          ? root.sourceEventId === event.eventId
          : root.definitionId === cardDefinitionIdValue(event.publicPayload.cardDefinitionId),
      ),
  );
  if (lastAccessIndex < 0) return undefined;
  const accessEvent = history[lastAccessIndex]!;
  const afterAccess = history.slice(lastAccessIndex + 1);
  const progressEvent = afterAccess.find(
    (event) =>
      publicActor(event) === "runner" &&
      (publicActionType(event) === "trash_accessed_card" ||
        publicActionType(event) === "steal_agenda") &&
      eventServerId(event) === serverId &&
      !removesIdentifiedSibling(event, accessEvent),
  );
  if (progressEvent) return undefined;
  if (remoteChangedAfterAccess(input, serverId, accessEvent)) return undefined;
  const nextAccessIndex = afterAccess.findIndex(
    (event) =>
      publicActionType(event) === "access_card" &&
      eventServerId(event) === serverId,
  );
  const thisAccessOutcome =
    nextAccessIndex < 0 ? afterAccess : afterAccess.slice(0, nextAccessIndex);
  const declineEvent = thisAccessOutcome.find(
    (event) =>
      event.stateVersionAfter > accessEvent.stateVersionAfter &&
      publicActor(event) === "runner" &&
      publicActionType(event) === "decline_trash" &&
      eventServerId(event) === serverId,
  );
  const observedDecision = declineEvent ? "decline" : "access_only";
  const reason = declineEvent ? "unknown" : "target_unavailable";
  const accessedDefinitionId =
    cardDefinitionIdValue(accessEvent.publicPayload.cardDefinitionId) ??
    currentKnownRoots[0]!.definitionId;
  return {
    applies: true,
    suppressesPlanBonus: true,
    ...(declineEvent ? { suppressUntilInvalidated: true } : {}),
    evidence: [
      "remote_access_outcome_source:observed_public_access",
      `remote_access_outcome_decision:${observedDecision}`,
      `remote_access_outcome_reason:${reason}`,
      "remote_access_outcome_no_progress:true",
      "known_remote_no_current_payoff",
      "repeated_remote_no_progress_suppressed",
      `remote_access_outcome_source_event:${accessEvent.eventId}`,
      ...(declineEvent
        ? [`remote_access_outcome_decline_event:${declineEvent.eventId}`]
        : []),
      `remote_access_outcome_server:${serverId}`,
      `remote_access_outcome_known_root:${accessedDefinitionId}`,
      ...observedAccessOutcomeEvidence({
        serverId,
        knownRootDefinitionId: accessedDefinitionId,
        observedIntent: observedDecision,
        reason,
        stateVersion: accessEvent.stateVersionAfter,
      }),
      `access_outcome_memory_match:${input.matchId}`,
      `access_outcome_memory_profile:${input.profileId}`,
      `access_outcome_memory_server:${serverId}`,
      `access_outcome_memory_state_version:${accessEvent.stateVersionAfter}`,
    ],
  };
}

function currentKnownRemoteRoots(
  input: AiDecisionInput,
  serverId: string,
): Array<{ definitionId: number; sourceEventId?: MatchEventId }> {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.root.length === 0) return [];
  const rememberedRoots = new Map(
    reconstructBeliefState(input)
      .runnerOpponentModel?.knownPositionMemory.filter(
        (entry) => entry.zone === serverId && entry.invalidatedBy.length === 0,
      )
      .map((entry) => [entry.positionKey, entry]),
  );
  const definitions: Array<{ definitionId: number; sourceEventId?: MatchEventId }> =
    [];
  for (const [index, card] of server.root.entries()) {
    const remembered = rememberedRoots.get(`root:${index}`);
    const definitionId = card.known
      ? card.definitionId
      : remembered?.definitionId;
    // A remembered declined card does not answer a different unknown position.
    if (!definitionId) return [];
    definitions.push({
      definitionId,
      ...(!card.known && remembered
        ? { sourceEventId: remembered.sourceEventId }
        : {}),
    });
  }
  return definitions;
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
      remoteChangeActionTypes.has(publicActionType(event)) &&
      !removesIdentifiedSibling(event, accessEvent),
  );
}

function removesIdentifiedSibling(
  event: PublicGameEvent,
  accessEvent: PublicGameEvent,
): boolean {
  if (
    !["trash_accessed_card", "steal_agenda", "score_agenda"].includes(
      publicActionType(event),
    )
  )
    return false;
  const accessed = stringPayloadValue(accessEvent, "installedPositionKey");
  const removed = stringPayloadValue(event, "installedPositionKey");
  return Boolean(accessed && removed && accessed !== removed);
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
  if (isRemoteServerId(normalized)) return normalized;
  const remoteMatch = /^remote[\s_-]+(\d+)$/.exec(normalized);
  const remoteIndex = remoteMatch?.[1];
  if (remoteIndex) return `r${Number.parseInt(remoteIndex, 10)}`;
  return serverId;
}

function visibleServerLabelId(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const canonical = canonicalServerId(label);
  if (
    canonical === "hq" ||
    canonical === "rd" ||
    canonical === "archives" ||
    isRemoteServerId(canonical)
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
