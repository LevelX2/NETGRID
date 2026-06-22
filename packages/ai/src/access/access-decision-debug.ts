import type { AccessDecisionProjection } from "./access-decision-projection";

export function accessDecisionProjectionDebugEvidence(
  projection: AccessDecisionProjection,
): string[] {
  return [
    `access_decision_debug_source:${projection.source}`,
    `access_decision_debug_server:${projection.serverId}`,
    ...(projection.knownRootDefinitionId
      ? [`access_decision_debug_known_root:${projection.knownRootDefinitionId}`]
      : []),
    `access_decision_debug_target:${projection.target}`,
    `access_decision_debug_intended_action:${projection.intendedAccessAction}`,
    `access_decision_debug_projection_count:${projection.projections.length}`,
    ...projection.projections.map(
      (entry) => `access_decision_debug_projection:${entry}`,
    ),
  ];
}
