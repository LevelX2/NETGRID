export type RemoteAccessOutcomeDecision =
  | "declined_trash"
  | "trashed"
  | "stolen"
  | "access_only";

export type RemoteAccessOutcomeReason =
  | "reserve_would_break"
  | "low_value_target"
  | "finite_pool_depleted"
  | "agenda_payoff"
  | "trash_affordable"
  | "unknown";

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
  ];
}

export function evaluateRemoteAccessOutcomeMemory(
  entry: RemoteAccessOutcomeMemoryEntry,
  context: {
    currentKnownRootDefinitionIds: readonly string[];
    creditsOrReserveImproved?: boolean;
  },
): RemoteAccessOutcomeMemoryStatus {
  if (
    entry.expiresWhenRemoteChanges &&
    !context.currentKnownRootDefinitionIds.includes(entry.knownRootDefinitionId)
  ) {
    return {
      applies: false,
      invalidationReason: "remote_changed",
      suppressesPlanBonus: false,
      evidence: [
        ...remoteAccessOutcomeEvidence(entry),
        "remote_access_outcome_applies:false",
        "remote_access_outcome_invalidated:remote_changed",
      ],
    };
  }
  if (
    entry.accessDecision === "declined_trash" &&
    context.creditsOrReserveImproved === true
  ) {
    return {
      applies: false,
      invalidationReason: "credits_or_reserve_improved",
      suppressesPlanBonus: false,
      evidence: [
        ...remoteAccessOutcomeEvidence(entry),
        "remote_access_outcome_applies:false",
        "remote_access_outcome_invalidated:credits_or_reserve_improved",
      ],
    };
  }
  const suppressesPlanBonus = entry.accessDecision === "declined_trash";
  return {
    applies: true,
    suppressesPlanBonus,
    evidence: [
      ...remoteAccessOutcomeEvidence(entry),
      "remote_access_outcome_applies:true",
      `remote_access_outcome_suppresses_plan_bonus:${suppressesPlanBonus}`,
    ],
  };
}

export function declinedTrashOutcomePlanEvidence(
  payoffEvidence: readonly string[],
): string[] {
  if (!payoffEvidence.includes("remote_access_outcome_decision:declined_trash")) {
    return [];
  }
  return [
    "remote_access_outcome_no_plan_bonus:true",
    "remote_access_outcome_memory_applied:declined_trash",
  ];
}
