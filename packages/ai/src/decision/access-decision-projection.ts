export type AccessDecisionProjectionSource =
  | "pre_run"
  | "access_window"
  | "plan_memory";

export type AccessDecisionProjectionAction =
  | "steal"
  | "trash"
  | "access_only"
  | "decline";

export type AccessDecisionProjectionTarget =
  | "agenda"
  | "asset"
  | "node"
  | "upgrade"
  | "unknown";

export type AccessDecisionProjectionKind =
  | "agenda_steal"
  | "asset_trash"
  | "node_trash"
  | "upgrade_trash"
  | "decline_trash"
  | "free_trash"
  | "trash_cost_waiver"
  | "reserve_would_break"
  | "finite_pool_value_remaining"
  | "access_only";

export type AccessDecisionProjection = {
  source: AccessDecisionProjectionSource;
  serverId: string;
  knownRootDefinitionId?: string;
  target: AccessDecisionProjectionTarget;
  intendedAccessAction: AccessDecisionProjectionAction;
  projections: AccessDecisionProjectionKind[];
  evidence: string[];
};

export function projectAccessDecision(params: {
  source: AccessDecisionProjectionSource;
  serverId: string;
  knownRootDefinitionId?: string;
  target: AccessDecisionProjectionTarget;
  intendedAccessAction: AccessDecisionProjectionAction;
  trashCost?: number;
  generalTrashCost?: number;
  dedicatedTrashCredits?: number;
  reserveWouldBreak?: boolean;
  finitePoolValueRemaining?: number;
}): AccessDecisionProjection {
  const projections = new Set<AccessDecisionProjectionKind>();
  if (params.target === "agenda" && params.intendedAccessAction === "steal") {
    projections.add("agenda_steal");
  }
  if (params.intendedAccessAction === "trash") {
    if (params.target === "asset") projections.add("asset_trash");
    if (params.target === "node") projections.add("node_trash");
    if (params.target === "upgrade") projections.add("upgrade_trash");
  }
  if (params.intendedAccessAction === "decline") {
    projections.add("decline_trash");
  }
  if (
    params.trashCost !== undefined &&
    params.trashCost > 0 &&
    params.generalTrashCost === 0 &&
    params.intendedAccessAction === "trash"
  ) {
    projections.add("free_trash");
  }
  if (
    params.trashCost !== undefined &&
    params.generalTrashCost !== undefined &&
    params.generalTrashCost < params.trashCost
  ) {
    projections.add("trash_cost_waiver");
  }
  if (params.reserveWouldBreak) projections.add("reserve_would_break");
  if (
    params.finitePoolValueRemaining !== undefined &&
    params.finitePoolValueRemaining > 0
  ) {
    projections.add("finite_pool_value_remaining");
  }
  if (projections.size === 0) projections.add("access_only");
  const projectionList = [...projections].sort();
  return {
    source: params.source,
    serverId: params.serverId,
    ...(params.knownRootDefinitionId
      ? { knownRootDefinitionId: params.knownRootDefinitionId }
      : {}),
    target: params.target,
    intendedAccessAction: params.intendedAccessAction,
    projections: projectionList,
    evidence: [
      `access_decision_projection_source:${params.source}`,
      `access_decision_projection_server:${params.serverId}`,
      ...(params.knownRootDefinitionId
        ? [`access_decision_projection_known_root:${params.knownRootDefinitionId}`]
        : []),
      `access_decision_projection_target:${params.target}`,
      `access_decision_projection_intended_action:${params.intendedAccessAction}`,
      ...projectionList.map(
        (projection) => `access_decision_projection:${projection}`,
      ),
      ...(params.trashCost !== undefined
        ? [`access_decision_projection_trash_cost:${params.trashCost}`]
        : []),
      ...(params.generalTrashCost !== undefined
        ? [
            `access_decision_projection_general_trash_cost:${params.generalTrashCost}`,
          ]
        : []),
      ...(params.dedicatedTrashCredits !== undefined
        ? [
            `access_decision_projection_dedicated_trash_credits:${params.dedicatedTrashCredits}`,
          ]
        : []),
      ...(params.finitePoolValueRemaining !== undefined
        ? [
            `access_decision_projection_finite_pool_value_remaining:${params.finitePoolValueRemaining}`,
          ]
        : []),
    ],
  };
}
