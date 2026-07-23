import type { Side } from "@netgrid/shared";
import type { ValidatedPlanAssessment, PriorityClass } from "./plan-assessment";
import type {
  ActionDemand,
  ActionDemandDeadline,
  ActionDemandRestriction,
} from "./action-demand";
import type { ActionCapacityRoute } from "./action-capacity-route";
import type {
  CreditDemand,
  CreditDemandDeadline,
  CreditRestriction,
} from "./credit-demand";
import type { FundingRoute } from "./funding-route";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export type PlanNeedStatus =
  | "open"
  | "provider_bound"
  | "reserved"
  | "satisfied"
  | "expired"
  | "cancelled";

export type PlanNeedUrgency = "hard" | "soft" | "forecast";

export type PlanNeedDeadline = {
  horizon:
    | "current_window"
    | "current_turn"
    | "next_own_turn"
    | "within_three_own_turns";
  stateVersion?: number;
  turnKey?: string;
  timingPoint?: string;
};

export type CreditPlanNeed = {
  resourceKind: "credits";
  quantity: number;
  acceptedRestrictions: CreditRestriction[];
};

export type ActionCapacityPlanNeed = {
  resourceKind: "action_capacity";
  quantity: number;
  acceptedRestrictions: ActionDemandRestriction[];
  requiredActionTypes: string[];
};

export type CapabilityPlanNeed = {
  resourceKind: "capability";
  quantity: 1;
  capabilityId: string;
};

export type PlanNeed = {
  needId: string;
  side: Side;
  parentPlanInstanceId: string;
  providerPlanInstanceId?: string;
  status: PlanNeedStatus;
  urgency: PlanNeedUrgency;
  deadline: PlanNeedDeadline;
  requirement:
    | CreditPlanNeed
    | ActionCapacityPlanNeed
    | CapabilityPlanNeed;
  evidenceCodes: string[];
};

export type ResourceAvailability = {
  fromStateVersion: number;
  fromTurnKey?: string;
  expiresAtStateVersion?: number;
  expiresAtTurnKey?: string;
};

export type ResourceCadence = {
  scope: "turn" | "window" | "game";
  cadenceKey: string;
  maximumClaims: number;
  claimsUsed: number;
};

export type CreditToken = {
  resourceKind: "credits";
  tokenId: string;
  side: Side;
  sourcePlanInstanceId: string;
  sourceDefinitionId?: string;
  quantity: number;
  restriction: CreditRestriction;
  reliability: "guaranteed" | "contingent";
  availability: ResourceAvailability;
  cadence?: ResourceCadence;
};

export type ActionCapacityToken = {
  resourceKind: "action_capacity";
  tokenId: string;
  side: Side;
  sourcePlanInstanceId: string;
  sourceDefinitionId?: string;
  quantity: number;
  restriction: ActionDemandRestriction;
  allowedActionTypes: string[];
  reliability: "guaranteed" | "contingent";
  availability: ResourceAvailability;
  cadence?: ResourceCadence;
};

export type ResourceToken = CreditToken | ActionCapacityToken;

export type ResourceLiability = {
  liabilityId: string;
  tokenId: string;
  planInstanceId: string;
  quantity: number;
  dueStateVersion: number;
  reasonCode: string;
};

export type ResourceClaimHardness = "hard" | "soft" | "forecast";

export type ResourceClaim = {
  claimId: string;
  planInstanceId: string;
  needId: string;
  tokenId: string;
  quantity: number;
  hardness: ResourceClaimHardness;
  stateVersion: number;
  turnKey: string;
  actionType?: string;
  status: "accepted" | "released";
};

export type PlanResourceLedger = {
  side: Side;
  stateVersion: number;
  turnKey: string;
  needs: PlanNeed[];
  tokens: ResourceToken[];
  liabilities: ResourceLiability[];
  claims: ResourceClaim[];
};

export type HardClaimAuthority = {
  executorPlanInstanceId?: string;
  activeContinuationPlanInstanceIds: string[];
};

export type DelegatedPriority = {
  providerPlanInstanceId: string;
  effectiveClass: PriorityClass;
  delegatedFromPlanInstanceId?: string;
  needId?: string;
  reasonCode: "bound_parent_need" | "own_assessment";
};

export function createPlanResourceLedger(params: {
  side: Side;
  stateVersion: number;
  turnKey: string;
  needs?: readonly PlanNeed[];
  tokens?: readonly ResourceToken[];
  liabilities?: readonly ResourceLiability[];
  claims?: readonly ResourceClaim[];
}): PlanResourceLedger {
  const ledger: PlanResourceLedger = {
    side: params.side,
    stateVersion: params.stateVersion,
    turnKey: params.turnKey,
    needs: stableById(params.needs ?? [], (value) => value.needId),
    tokens: stableById(params.tokens ?? [], (value) => value.tokenId),
    liabilities: stableById(
      params.liabilities ?? [],
      (value) => value.liabilityId,
    ),
    claims: stableById(params.claims ?? [], (value) => value.claimId),
  };
  assertSupportGraphAcyclic(ledger.needs, ledger);
  assertUniqueLedgerIds(ledger);
  return ledger;
}

export function addResourceClaim(
  ledger: PlanResourceLedger,
  claim: ResourceClaim,
  authority: HardClaimAuthority,
  timingPoint: string,
): PlanResourceLedger {
  assertUniqueClaimId(ledger, claim, timingPoint);
  const need = ledger.needs.find((candidate) => candidate.needId === claim.needId);
  const token = ledger.tokens.find(
    (candidate) => candidate.tokenId === claim.tokenId,
  );
  if (!need || !token || need.side !== ledger.side || token.side !== ledger.side) {
    throw claimFailure(
      ledger,
      claim,
      timingPoint,
      "Bind every claim to a same-side resident need and typed token.",
    );
  }
  if (
    claim.planInstanceId !== need.providerPlanInstanceId &&
    claim.planInstanceId !== need.parentPlanInstanceId
  ) {
    throw claimFailure(
      ledger,
      claim,
      timingPoint,
      "Claims may be made only by the bound provider or requesting parent.",
    );
  }
  if (
    claim.hardness === "hard" &&
    claim.planInstanceId !== authority.executorPlanInstanceId &&
    !authority.activeContinuationPlanInstanceIds.includes(claim.planInstanceId)
  ) {
    throw claimFailure(
      ledger,
      claim,
      timingPoint,
      "Only the leaf executor or an active continuation may reserve hard resources.",
    );
  }
  if (
    claim.status !== "accepted" ||
    claim.quantity <= 0 ||
    !Number.isFinite(claim.quantity) ||
    claim.stateVersion !== ledger.stateVersion ||
    claim.turnKey !== ledger.turnKey ||
    !tokenSupportsNeed(token, need, claim) ||
    !tokenAvailable(token, claim, claim.hardness)
  ) {
    throw claimFailure(
      ledger,
      claim,
      timingPoint,
      "Use a currently available token with compatible restrictions, cadence, expiry and action type.",
    );
  }
  if (
    claim.hardness === "hard" &&
    hardReservedQuantity(ledger, token.tokenId, claim.stateVersion) +
      claim.quantity >
      availableTokenQuantity(ledger, token, claim.stateVersion)
  ) {
    throw claimFailure(
      ledger,
      claim,
      timingPoint,
      "Release or reduce an existing hard reservation before claiming this token.",
    );
  }

  const next = structuredClone(ledger);
  next.claims.push(structuredClone(claim));
  next.claims.sort((left, right) => left.claimId.localeCompare(right.claimId));
  const nextToken = next.tokens.find(
    (candidate) => candidate.tokenId === token.tokenId,
  );
  if (nextToken?.cadence && claim.hardness === "hard") {
    nextToken.cadence.claimsUsed += 1;
  }
  const nextNeed = next.needs.find(
    (candidate) => candidate.needId === need.needId,
  );
  if (nextNeed && claim.hardness === "hard") {
    const reservedForNeed = next.claims
      .filter(
        (candidate) =>
          candidate.needId === need.needId &&
          candidate.hardness === "hard" &&
          candidate.status === "accepted",
      )
      .reduce((sum, candidate) => sum + candidate.quantity, 0);
    nextNeed.status =
      reservedForNeed >= need.requirement.quantity ? "reserved" : nextNeed.status;
  }
  assertUniqueLedgerIds(next);
  return next;
}

export function delegatedProviderPriority(
  providerPlanInstanceId: string,
  needs: readonly PlanNeed[],
  assessments: readonly ValidatedPlanAssessment[],
): DelegatedPriority | undefined {
  const own = assessments.find(
    (assessment) => assessment.instanceId === providerPlanInstanceId,
  );
  const bound = needs
    .filter(
      (need) =>
        need.providerPlanInstanceId === providerPlanInstanceId &&
        (need.status === "provider_bound" ||
          need.status === "open" ||
          need.status === "reserved"),
    )
    .map((need) => ({
      need,
      parent: assessments.find(
        (assessment) => assessment.instanceId === need.parentPlanInstanceId,
      ),
    }))
    .filter(
      (
        value,
      ): value is {
        need: PlanNeed;
        parent: ValidatedPlanAssessment;
      } => value.parent !== undefined,
    )
    .sort(
      (left, right) =>
        priorityRank(left.parent.priorityValidation.effectiveClass) -
          priorityRank(right.parent.priorityValidation.effectiveClass) ||
        left.need.needId.localeCompare(right.need.needId),
    )[0];
  if (
    bound &&
    (!own ||
      priorityRank(bound.parent.priorityValidation.effectiveClass) <
        priorityRank(own.priorityValidation.effectiveClass))
  ) {
    return {
      providerPlanInstanceId,
      effectiveClass: bound.parent.priorityValidation.effectiveClass,
      delegatedFromPlanInstanceId: bound.parent.instanceId,
      needId: bound.need.needId,
      reasonCode: "bound_parent_need",
    };
  }
  return own
    ? {
        providerPlanInstanceId,
        effectiveClass: own.priorityValidation.effectiveClass,
        reasonCode: "own_assessment",
      }
    : undefined;
}

export function assertSupportGraphAcyclic(
  needs: readonly PlanNeed[],
  context: Pick<PlanResourceLedger, "side" | "stateVersion" | "turnKey">,
): void {
  const edges = new Map<string, string[]>();
  for (const need of needs) {
    if (!need.providerPlanInstanceId) continue;
    if (need.providerPlanInstanceId === need.parentPlanInstanceId) continue;
    const targets = edges.get(need.parentPlanInstanceId) ?? [];
    targets.push(need.providerPlanInstanceId);
    edges.set(need.parentPlanInstanceId, targets);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const child of edges.get(node) ?? []) {
      if (visit(child)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  if (![...edges.keys()].some(visit)) return;
  throw new PlanResolutionFailure("invalid_support_graph", {
    side: context.side,
    stateVersion: context.stateVersion,
    timingPoint: context.turnKey,
    legalActionTypes: [],
    owner: "support_graph",
    removalCondition:
      "Remove cyclic parent-provider bindings from the plan need graph.",
    candidateCount: needs.length,
  });
}

export function creditDemandToPlanNeed(
  demand: CreditDemand,
  parentPlanInstanceId: string,
  providerPlanInstanceId?: string,
): PlanNeed {
  return {
    needId: demand.demandId,
    side: demand.side,
    parentPlanInstanceId,
    ...(providerPlanInstanceId ? { providerPlanInstanceId } : {}),
    status: providerPlanInstanceId ? "provider_bound" : "open",
    urgency: demand.hardness,
    deadline: creditDeadline(demand.deadline),
    requirement: {
      resourceKind: "credits",
      quantity: demand.gap,
      acceptedRestrictions: [...demand.acceptedCreditRestrictions],
    },
    evidenceCodes: [...demand.evidence],
  };
}

export function actionDemandToPlanNeed(
  demand: ActionDemand,
  parentPlanInstanceId: string,
  providerPlanInstanceId?: string,
): PlanNeed {
  return {
    needId: demand.demandId,
    side: demand.side,
    parentPlanInstanceId,
    ...(providerPlanInstanceId ? { providerPlanInstanceId } : {}),
    status: providerPlanInstanceId ? "provider_bound" : "open",
    urgency: demand.hardness,
    deadline: actionDeadline(demand.deadline),
    requirement: {
      resourceKind: "action_capacity",
      quantity: demand.gap,
      acceptedRestrictions: [...demand.acceptedRestrictions],
      requiredActionTypes: [...demand.requiredActionTypes],
    },
    evidenceCodes: [...demand.evidence],
  };
}

export function fundingRouteToCreditToken(params: {
  route: FundingRoute;
  side: Side;
  sourcePlanInstanceId: string;
  stateVersion: number;
  turnKey: string;
}): CreditToken | undefined {
  if (
    params.route.status === "uncovered" ||
    params.route.status === "invalidated" ||
    params.route.projectedGap > 0
  ) {
    return undefined;
  }
  const maximumOffset = Math.max(
    0,
    ...params.route.steps.map((step) => step.ownTurnOffset),
  );
  return {
    resourceKind: "credits",
    tokenId: `funding:${params.route.routeId}`,
    side: params.side,
    sourcePlanInstanceId: params.sourcePlanInstanceId,
    quantity: Math.max(
      0,
      params.route.projectedGeneralCredits - params.route.startingCredits,
    ),
    restriction: "general",
    reliability:
      params.route.reliability === "guaranteed"
        ? "guaranteed"
        : "contingent",
    availability: {
      fromStateVersion:
        maximumOffset === 0 ? params.stateVersion : params.stateVersion + 1,
      ...(maximumOffset === 0 ? { fromTurnKey: params.turnKey } : {}),
    },
  };
}

export function actionCapacityRouteToToken(params: {
  route: ActionCapacityRoute;
  side: Side;
  sourcePlanInstanceId: string;
  stateVersion: number;
  turnKey: string;
}): ActionCapacityToken | undefined {
  if (
    params.route.status === "uncovered" ||
    params.route.status === "invalidated" ||
    params.route.projectedGap > 0
  ) {
    return undefined;
  }
  const restriction =
    params.route.restrictionsUsed.length === 1
      ? params.route.restrictionsUsed[0]!
      : "unrestricted";
  return {
    resourceKind: "action_capacity",
    tokenId: `action-capacity:${params.route.routeId}`,
    side: params.side,
    sourcePlanInstanceId: params.sourcePlanInstanceId,
    quantity: Math.max(
      0,
      params.route.projectedCompatibleActions - params.route.startingActions,
    ),
    restriction,
    allowedActionTypes: [],
    reliability:
      params.route.reliability === "guaranteed"
        ? "guaranteed"
        : "contingent",
    availability: {
      fromStateVersion:
        params.route.horizon === "same_turn"
          ? params.stateVersion
          : params.stateVersion + 1,
      ...(params.route.horizon === "same_turn"
        ? { fromTurnKey: params.turnKey }
        : {}),
    },
  };
}

function tokenSupportsNeed(
  token: ResourceToken,
  need: PlanNeed,
  claim: ResourceClaim,
): boolean {
  if (token.resourceKind !== need.requirement.resourceKind) return false;
  if (token.resourceKind === "credits" && need.requirement.resourceKind === "credits") {
    return need.requirement.acceptedRestrictions.includes(token.restriction);
  }
  if (
    token.resourceKind === "action_capacity" &&
    need.requirement.resourceKind === "action_capacity"
  ) {
    return (
      need.requirement.acceptedRestrictions.includes(token.restriction) &&
      (need.requirement.requiredActionTypes.length === 0 ||
        (claim.actionType !== undefined &&
          need.requirement.requiredActionTypes.includes(claim.actionType))) &&
      (token.allowedActionTypes.length === 0 ||
        (claim.actionType !== undefined &&
          token.allowedActionTypes.includes(claim.actionType)))
    );
  }
  return false;
}

function tokenAvailable(
  token: ResourceToken,
  claim: ResourceClaim,
  hardness: ResourceClaimHardness,
): boolean {
  if (
    hardness !== "forecast" &&
    token.availability.fromStateVersion > claim.stateVersion
  ) {
    return false;
  }
  if (
    token.availability.expiresAtStateVersion !== undefined &&
    token.availability.expiresAtStateVersion < claim.stateVersion
  ) {
    return false;
  }
  if (
    token.availability.fromTurnKey !== undefined &&
    token.availability.fromTurnKey !== claim.turnKey &&
    hardness !== "forecast"
  ) {
    return false;
  }
  if (
    token.availability.expiresAtTurnKey !== undefined &&
    token.availability.expiresAtTurnKey !== claim.turnKey
  ) {
    return false;
  }
  return (
    token.cadence === undefined ||
    token.cadence.claimsUsed < token.cadence.maximumClaims
  );
}

function hardReservedQuantity(
  ledger: PlanResourceLedger,
  tokenId: string,
  stateVersion: number,
): number {
  return ledger.claims
    .filter(
      (claim) =>
        claim.tokenId === tokenId &&
        claim.hardness === "hard" &&
        claim.status === "accepted" &&
        claim.stateVersion <= stateVersion,
    )
    .reduce((sum, claim) => sum + claim.quantity, 0);
}

function availableTokenQuantity(
  ledger: PlanResourceLedger,
  token: ResourceToken,
  stateVersion: number,
): number {
  const liabilities = ledger.liabilities
    .filter(
      (liability) =>
        liability.tokenId === token.tokenId &&
        liability.dueStateVersion <= stateVersion,
    )
    .reduce((sum, liability) => sum + liability.quantity, 0);
  return Math.max(0, token.quantity - liabilities);
}

function creditDeadline(deadline: CreditDemandDeadline): PlanNeedDeadline {
  return { horizon: demandDeadlineHorizon(deadline) };
}

function actionDeadline(deadline: ActionDemandDeadline): PlanNeedDeadline {
  return { horizon: demandDeadlineHorizon(deadline) };
}

function demandDeadlineHorizon(
  deadline: CreditDemandDeadline | ActionDemandDeadline,
): PlanNeedDeadline["horizon"] {
  switch (deadline) {
    case "before_current_plan_action":
      return "current_window";
    case "end_of_current_turn":
      return "current_turn";
    case "start_of_next_own_turn":
      return "next_own_turn";
    case "within_three_own_turns":
      return "within_three_own_turns";
  }
}

function priorityRank(priority: PriorityClass): number {
  return Number(priority.slice(1));
}

function assertUniqueLedgerIds(ledger: PlanResourceLedger): void {
  const groups = [
    ledger.needs.map((value) => value.needId),
    ledger.tokens.map((value) => value.tokenId),
    ledger.liabilities.map((value) => value.liabilityId),
    ledger.claims.map((value) => value.claimId),
  ];
  if (groups.every((ids) => new Set(ids).size === ids.length)) return;
  throw new PlanResolutionFailure("resource_claim_conflict", {
    side: ledger.side,
    stateVersion: ledger.stateVersion,
    timingPoint: ledger.turnKey,
    legalActionTypes: [],
    owner: "resource_ledger",
    removalCondition: "Use stable unique ids for needs, tokens, liabilities and claims.",
  });
}

function assertUniqueClaimId(
  ledger: PlanResourceLedger,
  claim: ResourceClaim,
  timingPoint: string,
): void {
  if (!ledger.claims.some((candidate) => candidate.claimId === claim.claimId))
    return;
  throw claimFailure(
    ledger,
    claim,
    timingPoint,
    "Use a unique stable claim id.",
  );
}

function claimFailure(
  ledger: PlanResourceLedger,
  claim: ResourceClaim,
  timingPoint: string,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("resource_claim_conflict", {
    side: ledger.side,
    stateVersion: ledger.stateVersion,
    timingPoint,
    legalActionTypes: [],
    owner: "resource_ledger",
    removalCondition,
    planInstanceId: claim.planInstanceId,
    candidateCount: ledger.tokens.length,
  });
}

function stableById<T>(
  values: readonly T[],
  id: (value: T) => string,
): T[] {
  return [...values]
    .map((value) => structuredClone(value))
    .sort((left, right) => id(left).localeCompare(id(right)));
}
