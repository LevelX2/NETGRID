import type {
  AccessDecisionReason,
  AccessIntent,
} from "./access-decision-types";

export type ProjectedAccessOutcome = {
  kind: "projected_access_outcome";
  serverId: string;
  knownRootDefinitionId: number;
  projectedIntent: AccessIntent;
  reason: AccessDecisionReason;
  stateVersion: number;
  evidence: string[];
};

export function createProjectedAccessOutcome(params: {
  serverId: string;
  knownRootDefinitionId: number;
  projectedIntent: AccessIntent;
  reason: AccessDecisionReason;
  stateVersion: number;
}): ProjectedAccessOutcome {
  return {
    kind: "projected_access_outcome",
    ...params,
    evidence: projectedAccessOutcomeEvidence(params),
  };
}

export function projectedAccessOutcomeEvidence(params: {
  serverId: string;
  knownRootDefinitionId: number;
  projectedIntent: AccessIntent;
  reason: AccessDecisionReason;
  stateVersion: number;
}): string[] {
  return [
    `projected_access_outcome_server:${params.serverId}`,
    `projected_access_outcome_known_root:${params.knownRootDefinitionId}`,
    `projected_access_outcome_intent:${params.projectedIntent}`,
    `projected_access_outcome_reason:${params.reason}`,
    `projected_access_outcome_state_version:${params.stateVersion}`,
  ];
}

export function observedAccessOutcomeEvidence(params: {
  serverId: string;
  knownRootDefinitionId: number;
  observedIntent: AccessIntent;
  reason: AccessDecisionReason;
  stateVersion: number;
}): string[] {
  return [
    `observed_access_outcome_server:${params.serverId}`,
    `observed_access_outcome_known_root:${params.knownRootDefinitionId}`,
    `observed_access_outcome_intent:${params.observedIntent}`,
    `observed_access_outcome_reason:${params.reason}`,
    `observed_access_outcome_state_version:${params.stateVersion}`,
  ];
}
