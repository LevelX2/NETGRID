import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  assertTurnPlanningHeadCandidate,
  turnPlanningFingerprint,
  TURN_PLAN_EVALUATION_REGISTRY,
  type CampaignValueClaim,
  type CanonicalLegalActionInvocation,
  type CurrentLegalActionBinding,
  type PriorityCoverage,
  type TurnPlanningHeadCandidate,
  type TurnPlanEvaluationRegistry,
} from "./turn-planning-contracts";
import {
  applyCertifiedTurnProjectionDelta,
  type BoundaryActionAssessment,
  type ProjectedDecisionFrame,
  type ProjectedRestrictedActionToken,
  type ProjectionValueRange,
  type TurnProjectionDelta,
} from "./turn-projection";

export const TURN_REMAINDER_SEARCH_SCHEMA_VERSION =
  "turn-remainder-search-v1" as const;

export type TurnRemainderSearchBudget = {
  maximumDepth: 1 | 2 | 3 | 4;
  maximumExpandedNodes: number;
  maximumBranchesPerPartition: number;
  maximumParetoLinesPerPartition: number;
};

export type TurnRemainderSearchOffer = {
  head: TurnPlanningHeadCandidate;
  candidate: ActionSemanticCandidate;
  rootPreferenceRank?: number;
  moduleCandidatePreferenceRank?: number;
  obligationSignature: string;
  priorityCoverage: PriorityCoverage;
  dependencyCandidateIds?: string[];
  incompatibleCandidateIds?: string[];
  commutativeGroupKey?: string;
  commutativityCertified?: boolean;
  rootEligible?: boolean;
  continuationScope?: "portfolio" | "same_root";
  boundaryAfter?: BoundaryActionAssessment;
};

export type TurnRemainderSearchStep = {
  candidateId: string;
  invocation: CanonicalLegalActionInvocation;
  rootPlanInstanceId: string;
  nextMilestoneId: string;
  currentBinding?: CurrentLegalActionBinding;
};

export type TurnRemainderSearchLine = {
  lineId: string;
  partitionKey: string;
  obligationSignature: string;
  rootPlanInstanceId: string;
  nextMilestoneId: string;
  priorityClass: TurnPlanningHeadCandidate["priorityClass"];
  rootPreferenceRank?: number;
  moduleCandidatePreferenceRank?: number;
  steps: TurnRemainderSearchStep[];
  projectedFrame: ProjectedDecisionFrame;
  evaluationValues: Record<string, number>;
  priorityCoverage: PriorityCoverage;
  valueClaims: CampaignValueClaim[];
  scalarValue: number;
  upperBoundValue: number;
  stopReason:
    | "depth_limit"
    | "turn_capacity_exhausted"
    | "observation_boundary"
    | "search_complete";
  evidenceCodes: string[];
};

export type TurnRemainderSearchPruneReason =
  | "candidate_contract_invalid"
  | "candidate_binding_mismatch"
  | "partition_branch_budget"
  | "global_node_budget"
  | "dependency_unsatisfied"
  | "incompatible_candidate"
  | "source_card_already_consumed"
  | "candidate_cost_not_exact"
  | "insufficient_action_capacity"
  | "insufficient_credits"
  | "capacity_projection_not_guaranteed"
  | "priority_obligation_violated"
  | "conflicting_value_claim"
  | "duplicate_commutative_order"
  | "upper_bound_below_partition_floor"
  | "dominated_in_partition"
  | "pareto_partition_limit";

export type TurnRemainderSearchResult = {
  schemaVersion: typeof TURN_REMAINDER_SEARCH_SCHEMA_VERSION;
  budget: TurnRemainderSearchBudget;
  expandedNodeCount: number;
  protectedPartitionKeys: string[];
  conservativeBaselineLineIds: string[];
  lines: TurnRemainderSearchLine[];
  selectedLineId?: string;
  pruneEvents: Array<{
    partitionKey: string;
    candidateId: string;
    prefixLineId?: string;
    reasonCode: TurnRemainderSearchPruneReason;
  }>;
  evidenceCodes: string[];
};

type SearchState = {
  line: TurnRemainderSearchLine;
  usedCandidateIds: string[];
  consumedSourceCardInstanceIds: string[];
  incompatibleCandidateIds: string[];
  continuationRootPlanInstanceId?: string;
};

type Partition = {
  partitionKey: string;
  offers: TurnRemainderSearchOffer[];
};

type CapacityApplication =
  | {
      ok: true;
      unrestrictedDelta: number;
      restrictedAdds: ProjectedRestrictedActionToken[];
      restrictedConsumes: Array<{ tokenId: string; amount: number }>;
    }
  | {
      ok: false;
      reasonCode:
        | "insufficient_action_capacity"
        | "capacity_projection_not_guaranteed";
    };

const DEFAULT_BUDGET: TurnRemainderSearchBudget = {
  maximumDepth: 4,
  maximumExpandedNodes: 128,
  maximumBranchesPerPartition: 32,
  maximumParetoLinesPerPartition: 8,
};

export function searchDeterministicRemainderTurnPlans(params: {
  entryFrame: ProjectedDecisionFrame;
  offers: readonly TurnRemainderSearchOffer[];
  budget?: Partial<TurnRemainderSearchBudget>;
  evaluationRegistry?: TurnPlanEvaluationRegistry;
}): TurnRemainderSearchResult {
  const registry = params.evaluationRegistry ?? TURN_PLAN_EVALUATION_REGISTRY;
  const budget = normalizedBudget(params.budget);
  const pruneEvents: TurnRemainderSearchResult["pruneEvents"] = [];
  const validOffers = params.offers
    .filter((offer) => validateOffer(offer, params.entryFrame, pruneEvents))
    .sort((left, right) => compareOffers(left, right, registry));
  const partitions = buildPartitions(validOffers);
  const protectedPartitionKeys = partitions.map(
    (partition) => partition.partitionKey,
  );
  const effectiveNodeBudget = Math.min(
    256,
    Math.max(budget.maximumExpandedNodes, partitions.length),
  );
  const initialStatesByPartition = new Map<string, SearchState[]>();
  const baselineByPartition = new Map<string, TurnRemainderSearchLine>();
  const branchesByPartition = new Map<string, number>();
  let expandedNodeCount = 0;

  const maximumOffersPerPartition = Math.max(
    1,
    budget.maximumBranchesPerPartition,
  );
  for (let offerIndex = 0; ; offerIndex += 1) {
    let anyOfferAtIndex = false;
    for (const partition of partitions) {
      const offer = partition.offers[offerIndex];
      if (!offer) continue;
      anyOfferAtIndex = true;
      if (offerIndex >= maximumOffersPerPartition) {
        pruneEvents.push(
          pruneEvent(partition.partitionKey, offer, "partition_branch_budget"),
        );
        continue;
      }
      if (expandedNodeCount >= effectiveNodeBudget) {
        pruneEvents.push(
          pruneEvent(partition.partitionKey, offer, "global_node_budget"),
        );
        continue;
      }
      expandedNodeCount += 1;
      const applied = applyOffer({
        entryFrame: params.entryFrame,
        maximumDepth: budget.maximumDepth,
        offer,
        partitionKey: partition.partitionKey,
        obligationSignature: offer.obligationSignature,
        prefix: undefined,
        registry,
        remainingUpperBoundValue: bestFollowupUpperBound(
          offer,
          validOffers,
          registry,
        ),
      });
      if (!applied.ok) {
        pruneEvents.push(
          pruneEvent(partition.partitionKey, offer, applied.reasonCode),
        );
        continue;
      }
      const states = initialStatesByPartition.get(partition.partitionKey) ?? [];
      states.push(applied.state);
      initialStatesByPartition.set(partition.partitionKey, states);
      const currentBaseline = baselineByPartition.get(partition.partitionKey);
      if (
        !currentBaseline ||
        compareLines(applied.state.line, currentBaseline, registry) < 0
      ) {
        baselineByPartition.set(partition.partitionKey, applied.state.line);
      }
    }
    if (!anyOfferAtIndex) break;
  }

  const allStatesByPartition = new Map<string, SearchState[]>(
    [...initialStatesByPartition.entries()].map(([key, states]) => [
      key,
      [...states],
    ]),
  );
  let frontierByPartition = initialStatesByPartition;
  for (let depth = 2; depth <= budget.maximumDepth; depth += 1) {
    const nextFrontierByPartition = new Map<string, SearchState[]>();
    const maximumPrefixStates = Math.max(1, budget.maximumBranchesPerPartition);
    for (let prefixIndex = 0; ; prefixIndex += 1) {
      let anyPrefixAtIndex = false;
      for (const partition of partitions) {
        const prefix = frontierByPartition.get(partition.partitionKey)?.[
          prefixIndex
        ];
        if (!prefix || prefixIndex >= maximumPrefixStates) continue;
        anyPrefixAtIndex = true;
        if (prefix.line.stopReason === "observation_boundary") continue;
        const partitionFloor = baselineByPartition.get(partition.partitionKey);
        const followupOffers = [...validOffers].sort((left, right) => {
          const leftBound = dependencySatisfiedByPrefix(prefix, left);
          const rightBound = dependencySatisfiedByPrefix(prefix, right);
          return (
            Number(rightBound) - Number(leftBound) ||
            compareOffers(left, right, registry)
          );
        });
        const branchBudgetKey = `${partition.partitionKey}|depth:${depth}`;
        for (const offer of followupOffers) {
          if (expandedNodeCount >= effectiveNodeBudget) {
            pruneEvents.push(
              pruneEvent(
                partition.partitionKey,
                offer,
                "global_node_budget",
                prefix.line.lineId,
              ),
            );
            break;
          }
          if (
            (branchesByPartition.get(branchBudgetKey) ?? 0) >=
            budget.maximumBranchesPerPartition
          ) {
            pruneEvents.push(
              pruneEvent(
                partition.partitionKey,
                offer,
                "partition_branch_budget",
                prefix.line.lineId,
              ),
            );
            break;
          }
          const staticReason = secondStepStaticPruneReason(prefix, offer);
          if (staticReason) {
            pruneEvents.push(
              pruneEvent(
                partition.partitionKey,
                offer,
                staticReason,
                prefix.line.lineId,
              ),
            );
            continue;
          }
          const upperBoundValue = optimisticPotentialUpperBound(
            prefix,
            offer,
            validOffers,
            registry,
            budget.maximumDepth - depth,
          );
          if (
            partitionFloor &&
            linesHaveComparableScalarPrecedence(prefix.line, partitionFloor) &&
            coverageSignature(
              mergePriorityCoverage(
                prefix.line.priorityCoverage,
                offer.priorityCoverage,
              ),
            ) === coverageSignature(partitionFloor.priorityCoverage) &&
            upperBoundValue < partitionFloor.scalarValue
          ) {
            pruneEvents.push(
              pruneEvent(
                partition.partitionKey,
                offer,
                "upper_bound_below_partition_floor",
                prefix.line.lineId,
              ),
            );
            continue;
          }
          expandedNodeCount += 1;
          branchesByPartition.set(
            branchBudgetKey,
            (branchesByPartition.get(branchBudgetKey) ?? 0) + 1,
          );
          const applied = applyOffer({
            entryFrame: params.entryFrame,
            maximumDepth: budget.maximumDepth,
            offer,
            partitionKey: partition.partitionKey,
            obligationSignature: prefix.line.obligationSignature,
            prefix,
            registry,
            remainingUpperBoundValue:
              depth < budget.maximumDepth
                ? bestFollowupUpperBound(offer, validOffers, registry)
                : 0,
          });
          if (!applied.ok) {
            pruneEvents.push(
              pruneEvent(
                partition.partitionKey,
                offer,
                applied.reasonCode,
                prefix.line.lineId,
              ),
            );
            continue;
          }
          const states = allStatesByPartition.get(partition.partitionKey) ?? [];
          states.push(applied.state);
          allStatesByPartition.set(partition.partitionKey, states);
          const nextStates =
            nextFrontierByPartition.get(partition.partitionKey) ?? [];
          nextStates.push(applied.state);
          nextFrontierByPartition.set(partition.partitionKey, nextStates);
        }
      }
      if (!anyPrefixAtIndex) break;
    }
    if (nextFrontierByPartition.size === 0) break;
    frontierByPartition = nextFrontierByPartition;
  }

  const selectedLines: TurnRemainderSearchLine[] = [];
  for (const partition of partitions) {
    const states = allStatesByPartition.get(partition.partitionKey) ?? [];
    const front = paretoFront(
      states.map((state) => state.line),
      registry,
      partition.partitionKey,
      pruneEvents,
    );
    const limited = front.slice(0, budget.maximumParetoLinesPerPartition);
    for (const line of front.slice(budget.maximumParetoLinesPerPartition)) {
      pruneEvents.push({
        partitionKey: partition.partitionKey,
        candidateId: line.steps.at(-1)?.candidateId ?? "unknown",
        prefixLineId: line.lineId,
        reasonCode: "pareto_partition_limit",
      });
    }
    selectedLines.push(...limited);
  }
  selectedLines.sort((left, right) => compareLines(left, right, registry));
  const selected = selectedLines[0];
  const conservativeBaselineLineIds = [...baselineByPartition.values()]
    .map((line) => line.lineId)
    .sort();
  return {
    schemaVersion: TURN_REMAINDER_SEARCH_SCHEMA_VERSION,
    budget: { ...budget, maximumExpandedNodes: effectiveNodeBudget },
    expandedNodeCount,
    protectedPartitionKeys,
    conservativeBaselineLineIds,
    lines: selectedLines,
    ...(selected ? { selectedLineId: selected.lineId } : {}),
    pruneEvents: pruneEvents.sort(comparePruneEvents),
    evidenceCodes: [
      `deterministic_bounded_remainder_search_depth:${budget.maximumDepth}`,
      "fair_partition_minimum_expansion",
      "conservative_partition_baselines",
      "pareto_front_bounded",
      "beam_search_not_used",
      `protected_partition_count:${protectedPartitionKeys.length}`,
      `expanded_node_count:${expandedNodeCount}`,
    ],
  };
}

function applyOffer(params: {
  entryFrame: ProjectedDecisionFrame;
  maximumDepth: TurnRemainderSearchBudget["maximumDepth"];
  offer: TurnRemainderSearchOffer;
  partitionKey: string;
  obligationSignature: string;
  prefix: SearchState | undefined;
  registry: TurnPlanEvaluationRegistry;
  remainingUpperBoundValue: number;
}):
  | { ok: true; state: SearchState }
  | {
      ok: false;
      reasonCode: TurnRemainderSearchPruneReason;
    } {
  const frame = params.prefix?.line.projectedFrame ?? params.entryFrame;
  const candidate = params.offer.candidate;
  if (
    !params.prefix &&
    (params.offer.dependencyCandidateIds?.length ?? 0) > 0
  ) {
    return { ok: false, reasonCode: "dependency_unsatisfied" };
  }
  if (!candidateCostsAreExact(candidate)) {
    return { ok: false, reasonCode: "candidate_cost_not_exact" };
  }
  const sourceId = candidate.sourceCardInstanceId;
  if (
    sourceId &&
    params.prefix?.consumedSourceCardInstanceIds.includes(sourceId)
  ) {
    return { ok: false, reasonCode: "source_card_already_consumed" };
  }
  const capacity = capacityApplication(frame, candidate);
  if (!capacity.ok) return capacity;
  const currentCredits = frame.ownCredits.minimum;
  const creditDelta = exactCreditDelta(candidate);
  if (currentCredits + creditDelta < 0) {
    return { ok: false, reasonCode: "insufficient_credits" };
  }
  const mergedCoverage = mergePriorityCoverage(
    params.prefix?.line.priorityCoverage,
    params.offer.priorityCoverage,
  );
  if (mergedCoverage.violatedObligationIds.length > 0) {
    return { ok: false, reasonCode: "priority_obligation_violated" };
  }
  const mergedClaims = mergeValueClaims(
    params.prefix?.line.valueClaims ?? [],
    params.offer.head.valueClaims,
  );
  if (!mergedClaims) {
    return { ok: false, reasonCode: "conflicting_value_claim" };
  }
  const handDelta = exactHandDelta(frame, candidate);
  const consumesKnownHandCard =
    handDelta < 0 &&
    candidate.sourceCardInstanceId !== undefined &&
    frame.ownHand.knownInstanceIds.includes(candidate.sourceCardInstanceId) &&
    candidateConsumesSourceCard(candidate);
  const boundary = params.offer.boundaryAfter
    ? boundaryAtProjectedCapacity(params.offer.boundaryAfter, frame, capacity)
    : undefined;
  const delta: TurnProjectionDelta = {
    schemaVersion: "turn-projection-delta-v1",
    deltaId: turnPlanningFingerprint("turn-search-delta", {
      frame: frame.projectedFrameKey,
      invocation: params.offer.head.invocation.invocationKey,
    }),
    expectedBaseFrameKey: frame.projectedFrameKey,
    certification: "legal_action_semantics",
    actionCapacityDelta: exactRange(capacity.unrestrictedDelta),
    ...(capacity.restrictedAdds.length > 0
      ? { restrictedActionCapacityAdds: capacity.restrictedAdds }
      : {}),
    ...(capacity.restrictedConsumes.length > 0
      ? { restrictedActionCapacityConsumes: capacity.restrictedConsumes }
      : {}),
    creditDelta: exactRange(creditDelta),
    handCountDelta: exactRange(handDelta),
    knownZoneMoves: consumesKnownHandCard
      ? [
          {
            instanceId: candidate.sourceCardInstanceId!,
            fromZoneId: "own_hand",
            toZoneId: "projected_committed",
          },
        ]
      : [],
    boardUpdates: [],
    usageAdds: [
      `turn_search_invocation:${params.offer.head.invocation.invocationKey}`,
    ],
    publicEventFactAdds: [],
    reservations: [],
    portfolioProgress: [
      {
        planInstanceId: params.offer.head.rootPlanInstanceId,
        phase: params.offer.head.moduleId,
        milestone: params.offer.head.nextMilestoneId,
        viability: "projected",
      },
    ],
    ...(boundary ? { boundary } : {}),
    uncertainty: [],
  };
  const projectedFrame = applyCertifiedTurnProjectionDelta(frame, delta);
  const steps: TurnRemainderSearchStep[] = [
    ...(params.prefix?.line.steps ?? []),
    {
      candidateId: params.offer.head.candidateId,
      invocation: structuredClone(params.offer.head.invocation),
      rootPlanInstanceId: params.offer.head.rootPlanInstanceId,
      nextMilestoneId: params.offer.head.nextMilestoneId,
      ...(!params.prefix
        ? {
            currentBinding: structuredClone(params.offer.head.currentBinding),
          }
        : {}),
    },
  ];
  const evaluationValues = mergeEvaluationValues(
    params.prefix?.line.evaluationValues ?? {},
    params.offer.head.evaluationValues,
  );
  const scalarValue = scalarEvaluation(evaluationValues, params.registry);
  const upperBoundValue =
    steps.length >= params.maximumDepth || params.offer.boundaryAfter
      ? scalarValue
      : scalarValue + Math.max(0, params.remainingUpperBoundValue);
  const lineId = turnPlanningFingerprint("turn-remainder-line", {
    partitionKey: params.partitionKey,
    steps: steps.map((step) => step.invocation.invocationKey),
    projectedFrameKey: projectedFrame.projectedFrameKey,
    coverage: mergedCoverage,
  });
  const stopReason =
    params.offer.boundaryAfter !== undefined
      ? ("observation_boundary" as const)
      : steps.length >= params.maximumDepth
        ? ("depth_limit" as const)
        : projectedFrame.actionCapacityLedger.unrestricted.maximum === 0 &&
            projectedFrame.actionCapacityLedger.restrictedTokens.length === 0
          ? ("turn_capacity_exhausted" as const)
          : ("search_complete" as const);
  const line: TurnRemainderSearchLine = {
    lineId,
    partitionKey: params.partitionKey,
    obligationSignature: params.obligationSignature,
    rootPlanInstanceId:
      params.prefix?.line.rootPlanInstanceId ??
      params.offer.head.rootPlanInstanceId,
    nextMilestoneId:
      params.prefix?.line.nextMilestoneId ?? params.offer.head.nextMilestoneId,
    priorityClass:
      params.prefix?.line.priorityClass ?? params.offer.head.priorityClass,
    rootPreferenceRank:
      params.prefix?.line.rootPreferenceRank ??
      params.offer.rootPreferenceRank ??
      0,
    moduleCandidatePreferenceRank:
      params.prefix?.line.moduleCandidatePreferenceRank ??
      params.offer.moduleCandidatePreferenceRank ??
      0,
    steps,
    projectedFrame,
    evaluationValues,
    priorityCoverage: mergedCoverage,
    valueClaims: mergedClaims,
    scalarValue,
    upperBoundValue,
    stopReason,
    evidenceCodes: [
      ...(params.prefix?.line.evidenceCodes ?? []),
      ...params.offer.head.evidenceCodes,
      ...(params.offer.commutativityCertified &&
      params.offer.commutativeGroupKey
        ? [`commutative_group:${params.offer.commutativeGroupKey}`]
        : []),
      ...(boundary?.postBoundaryOptionality.unit === "usable_actions" &&
      boundary.postBoundaryOptionality.minimum ===
        boundary.postBoundaryOptionality.maximum
        ? [
            `post_boundary_optional_action_capacity:${boundary.postBoundaryOptionality.minimum}`,
          ]
        : []),
      `turn_search_depth:${steps.length}`,
      `turn_search_partition:${params.partitionKey}`,
    ],
  };
  return {
    ok: true,
    state: {
      line,
      usedCandidateIds: [
        ...(params.prefix?.usedCandidateIds ?? []),
        params.offer.head.candidateId,
      ],
      consumedSourceCardInstanceIds: [
        ...(params.prefix?.consumedSourceCardInstanceIds ?? []),
        ...(sourceId && candidateConsumesSourceCard(candidate)
          ? [sourceId]
          : []),
      ],
      incompatibleCandidateIds: sortedUnique([
        ...(params.prefix?.incompatibleCandidateIds ?? []),
        ...(params.offer.incompatibleCandidateIds ?? []),
      ]),
      ...(params.prefix?.continuationRootPlanInstanceId !== undefined ||
      params.offer.continuationScope === "same_root"
        ? {
            continuationRootPlanInstanceId:
              params.prefix?.continuationRootPlanInstanceId ??
              params.offer.head.rootPlanInstanceId,
          }
        : {}),
    },
  };
}

function boundaryAtProjectedCapacity(
  boundary: BoundaryActionAssessment,
  frame: ProjectedDecisionFrame,
  capacity: Extract<CapacityApplication, { ok: true }>,
): BoundaryActionAssessment {
  const restrictedConsumed = new Map(
    capacity.restrictedConsumes.map((entry) => [entry.tokenId, entry.amount]),
  );
  const remainingRestrictedCapacity =
    frame.actionCapacityLedger.restrictedTokens.reduce(
      (sum, token) =>
        sum -
        Math.min(token.remaining, restrictedConsumed.get(token.tokenId) ?? 0),
      0,
    ) +
    capacity.restrictedAdds.reduce((sum, token) => sum + token.remaining, 0);
  const remainingActionCapacity = {
    minimum: Math.max(
      0,
      frame.actionCapacityLedger.unrestricted.minimum +
        capacity.unrestrictedDelta +
        remainingRestrictedCapacity,
    ),
    maximum: Math.max(
      0,
      frame.actionCapacityLedger.unrestricted.maximum +
        capacity.unrestrictedDelta +
        remainingRestrictedCapacity,
    ),
  };
  return {
    ...structuredClone(boundary),
    remainingActionCapacityAfterBoundary: remainingActionCapacity,
    postBoundaryOptionality:
      boundary.postBoundaryOptionality.unit === "usable_actions"
        ? {
            ...remainingActionCapacity,
            unit: "usable_actions",
          }
        : structuredClone(boundary.postBoundaryOptionality),
  };
}

function dependencySatisfiedByPrefix(
  prefix: SearchState,
  offer: TurnRemainderSearchOffer,
): boolean {
  const dependencies = offer.dependencyCandidateIds ?? [];
  return (
    dependencies.length > 0 &&
    dependencies.every((candidateId) =>
      prefix.usedCandidateIds.includes(candidateId),
    )
  );
}

function capacityApplication(
  frame: ProjectedDecisionFrame,
  candidate: ActionSemanticCandidate,
): CapacityApplication {
  const projection = candidate.actionCapacityProjection;
  if (
    projection &&
    ["immediate_unrestricted_gain", "immediate_restricted_gain"].includes(
      projection.kind,
    ) &&
    (projection.reliability !== "guaranteed" ||
      projection.timing !== "immediate")
  ) {
    return { ok: false, reasonCode: "capacity_projection_not_guaranteed" };
  }
  const preExistingActionCost = wholeNonNegative(
    projection?.preExistingActionCost ?? candidate.costProfile.clickCost ?? 0,
  );
  const consumed = consumeActionCapacity(
    frame.actionCapacityLedger.unrestricted.minimum,
    frame.actionCapacityLedger.restrictedTokens,
    preExistingActionCost,
    candidate,
  );
  if (!consumed) {
    return { ok: false, reasonCode: "insufficient_action_capacity" };
  }
  let unrestrictedDelta = -consumed.unrestrictedConsumed;
  const restrictedAdds: ProjectedRestrictedActionToken[] = [];
  if (
    projection?.kind === "immediate_unrestricted_gain" &&
    projection.reliability === "guaranteed" &&
    projection.timing === "immediate"
  ) {
    unrestrictedDelta += wholeNonNegative(projection.followupActionCapacity);
  } else if (
    projection?.kind === "immediate_restricted_gain" &&
    projection.reliability === "guaranteed" &&
    projection.timing === "immediate" &&
    projection.followupActionCapacity > 0 &&
    projection.restriction !== "unknown"
  ) {
    restrictedAdds.push({
      tokenId: turnPlanningFingerprint("restricted-turn-capacity", {
        sourceCardInstanceId: candidate.sourceCardInstanceId,
        sourceDefinitionId: candidate.sourceDefinitionId,
        semanticActionType: candidate.semanticActionType,
        restriction: projection.restriction,
        allowedActionTypes: [...projection.allowedActionTypes].sort(),
      }),
      remaining: wholeNonNegative(projection.followupActionCapacity),
      allowedActionTypes: [...projection.allowedActionTypes].sort(),
      expiresAt: projection.expiresAt ?? "side_turn_end",
    });
  } else if (
    projection?.kind === "action_debt" &&
    projection.reliability === "guaranteed"
  ) {
    unrestrictedDelta -= wholeNonNegative(projection.actionDebt);
  }
  return {
    ok: true,
    unrestrictedDelta,
    restrictedAdds,
    restrictedConsumes: consumed.restrictedConsumes,
  };
}

function consumeActionCapacity(
  unrestricted: number,
  tokens: readonly ProjectedRestrictedActionToken[],
  amount: number,
  candidate: ActionSemanticCandidate,
):
  | {
      unrestrictedConsumed: number;
      restrictedConsumes: Array<{ tokenId: string; amount: number }>;
    }
  | undefined {
  if (amount === 0) {
    return { unrestrictedConsumed: 0, restrictedConsumes: [] };
  }
  let remaining = amount;
  const restrictedConsumes: Array<{ tokenId: string; amount: number }> = [];
  for (const token of [...tokens].sort((left, right) =>
    left.tokenId.localeCompare(right.tokenId),
  )) {
    if (!restrictedTokenSupportsCandidate(token, candidate)) continue;
    const consumed = Math.min(remaining, token.remaining);
    if (consumed > 0) {
      restrictedConsumes.push({ tokenId: token.tokenId, amount: consumed });
      remaining -= consumed;
    }
    if (remaining === 0) break;
  }
  if (remaining > unrestricted) return undefined;
  return {
    unrestrictedConsumed: remaining,
    restrictedConsumes,
  };
}

function restrictedTokenSupportsCandidate(
  token: ProjectedRestrictedActionToken,
  candidate: ActionSemanticCandidate,
): boolean {
  if (token.allowedActionTypes.length === 0) return false;
  return token.allowedActionTypes.some(
    (allowed) =>
      allowed === candidate.actionType ||
      allowed === candidate.semanticActionType ||
      (allowed === "install_card" &&
        candidate.semanticActionType.startsWith("install.")) ||
      (allowed === "start_run" &&
        candidate.semanticActionType.startsWith("run.")),
  );
}

function secondStepStaticPruneReason(
  prefix: SearchState,
  offer: TurnRemainderSearchOffer,
): TurnRemainderSearchPruneReason | undefined {
  if (
    prefix.continuationRootPlanInstanceId !== undefined &&
    offer.head.rootPlanInstanceId !== prefix.continuationRootPlanInstanceId
  ) {
    return "incompatible_candidate";
  }
  if (prefix.usedCandidateIds.includes(offer.head.candidateId)) {
    return "incompatible_candidate";
  }
  if (
    (offer.dependencyCandidateIds ?? []).some(
      (candidateId) => !prefix.usedCandidateIds.includes(candidateId),
    )
  ) {
    return "dependency_unsatisfied";
  }
  const lastCandidateId = prefix.usedCandidateIds.at(-1)!;
  if (
    prefix.incompatibleCandidateIds.includes(offer.head.candidateId) ||
    (offer.incompatibleCandidateIds ?? []).includes(lastCandidateId) ||
    prefix.usedCandidateIds.some((candidateId) =>
      (offer.incompatibleCandidateIds ?? []).includes(candidateId),
    )
  ) {
    return "incompatible_candidate";
  }
  const firstStep = prefix.line.steps[0];
  if (
    firstStep &&
    offer.commutativityCertified === true &&
    offer.commutativeGroupKey !== undefined &&
    prefix.line.evidenceCodes.includes(
      `commutative_group:${offer.commutativeGroupKey}`,
    ) &&
    offer.head.rootPlanInstanceId === prefix.line.rootPlanInstanceId &&
    offer.head.nextMilestoneId === prefix.line.nextMilestoneId &&
    offer.head.candidateId < firstStep.candidateId
  ) {
    return "duplicate_commutative_order";
  }
  return undefined;
}

function validateOffer(
  offer: TurnRemainderSearchOffer,
  frame: ProjectedDecisionFrame,
  pruneEvents: TurnRemainderSearchResult["pruneEvents"],
): boolean {
  const partitionKey = partitionKeyFor(offer);
  try {
    assertTurnPlanningHeadCandidate(offer.head, frame.stateIdentity);
  } catch {
    pruneEvents.push(
      pruneEvent(partitionKey, offer, "candidate_contract_invalid"),
    );
    return false;
  }
  if (
    offer.head.currentBinding.actionId !== offer.candidate.actionId ||
    offer.candidate.stateVersion !== frame.stateIdentity.stateVersion ||
    offer.head.currentBinding.stateVersion !== frame.stateIdentity.stateVersion
  ) {
    pruneEvents.push(
      pruneEvent(partitionKey, offer, "candidate_binding_mismatch"),
    );
    return false;
  }
  return true;
}

function buildPartitions(
  offers: readonly TurnRemainderSearchOffer[],
): Partition[] {
  const byKey = new Map<string, TurnRemainderSearchOffer[]>();
  for (const offer of offers.filter(
    (candidate) => candidate.rootEligible !== false,
  )) {
    const key = partitionKeyFor(offer);
    byKey.set(key, [...(byKey.get(key) ?? []), offer]);
  }
  return [...byKey.entries()]
    .map(([partitionKey, partitionOffers]) => ({
      partitionKey,
      offers: [...partitionOffers],
    }))
    .sort((left, right) => left.partitionKey.localeCompare(right.partitionKey));
}

function partitionKeyFor(offer: TurnRemainderSearchOffer): string {
  return [
    offer.obligationSignature,
    offer.head.rootPlanInstanceId,
    offer.head.nextMilestoneId,
  ].join("|");
}

function paretoFront(
  lines: readonly TurnRemainderSearchLine[],
  registry: TurnPlanEvaluationRegistry,
  partitionKey: string,
  pruneEvents: TurnRemainderSearchResult["pruneEvents"],
): TurnRemainderSearchLine[] {
  const unique = new Map(lines.map((line) => [line.lineId, line]));
  const values = [...unique.values()];
  const front = values.filter((line, index) => {
    const dominator = values.find(
      (other, otherIndex) =>
        index !== otherIndex && lineDominates(other, line, registry),
    );
    if (!dominator) return true;
    pruneEvents.push({
      partitionKey,
      candidateId: line.steps.at(-1)?.candidateId ?? "unknown",
      prefixLineId: line.lineId,
      reasonCode: "dominated_in_partition",
    });
    return false;
  });
  return front.sort((left, right) => compareLines(left, right, registry));
}

function lineDominates(
  left: TurnRemainderSearchLine,
  right: TurnRemainderSearchLine,
  registry: TurnPlanEvaluationRegistry,
): boolean {
  if (
    coverageSignature(left.priorityCoverage) !==
    coverageSignature(right.priorityCoverage)
  ) {
    return false;
  }
  let strictlyBetter = false;
  for (const dimension of registry.dimensions) {
    const leftValue = left.evaluationValues[dimension.dimensionId] ?? 0;
    const rightValue = right.evaluationValues[dimension.dimensionId] ?? 0;
    if (dimension.direction === "maximize") {
      if (leftValue < rightValue) return false;
      if (leftValue > rightValue) strictlyBetter = true;
    } else {
      if (leftValue > rightValue) return false;
      if (leftValue < rightValue) strictlyBetter = true;
    }
  }
  if (
    left.projectedFrame.ownCredits.minimum <
      right.projectedFrame.ownCredits.minimum ||
    left.projectedFrame.actionCapacityLedger.unrestricted.minimum <
      right.projectedFrame.actionCapacityLedger.unrestricted.minimum
  ) {
    return false;
  }
  if (
    left.projectedFrame.ownCredits.minimum >
      right.projectedFrame.ownCredits.minimum ||
    left.projectedFrame.actionCapacityLedger.unrestricted.minimum >
      right.projectedFrame.actionCapacityLedger.unrestricted.minimum
  ) {
    strictlyBetter = true;
  }
  return strictlyBetter;
}

function compareOffers(
  left: TurnRemainderSearchOffer,
  right: TurnRemainderSearchOffer,
  registry: TurnPlanEvaluationRegistry,
): number {
  return (
    priorityRank(left.head.priorityClass) -
      priorityRank(right.head.priorityClass) ||
    scalarOfferValue(right, registry) - scalarOfferValue(left, registry) ||
    (right.moduleCandidatePreferenceRank ?? 0) -
      (left.moduleCandidatePreferenceRank ?? 0) ||
    left.head.candidateId.localeCompare(right.head.candidateId)
  );
}

function compareLines(
  left: TurnRemainderSearchLine,
  right: TurnRemainderSearchLine,
  registry: TurnPlanEvaluationRegistry,
): number {
  const sameRootPreference =
    left.rootPlanInstanceId === right.rootPlanInstanceId
      ? (right.rootPreferenceRank ?? 0) - (left.rootPreferenceRank ?? 0)
      : 0;
  return (
    left.priorityCoverage.violatedObligationIds.length -
      right.priorityCoverage.violatedObligationIds.length ||
    right.priorityCoverage.satisfiedObligationIds.length -
      left.priorityCoverage.satisfiedObligationIds.length ||
    priorityRank(left.priorityClass) - priorityRank(right.priorityClass) ||
    sameRootPreference ||
    scalarEvaluation(right.evaluationValues, registry) -
      scalarEvaluation(left.evaluationValues, registry) ||
    (right.moduleCandidatePreferenceRank ?? 0) -
      (left.moduleCandidatePreferenceRank ?? 0) ||
    right.projectedFrame.actionCapacityLedger.unrestricted.minimum -
      left.projectedFrame.actionCapacityLedger.unrestricted.minimum ||
    right.projectedFrame.ownCredits.minimum -
      left.projectedFrame.ownCredits.minimum ||
    left.steps.length - right.steps.length ||
    left.lineId.localeCompare(right.lineId)
  );
}

function scalarOfferValue(
  offer: TurnRemainderSearchOffer,
  registry: TurnPlanEvaluationRegistry,
): number {
  return scalarEvaluation(offer.head.evaluationValues, registry);
}

function scalarEvaluation(
  values: Readonly<Record<string, number>>,
  registry: TurnPlanEvaluationRegistry,
): number {
  return registry.dimensions.reduce((sum, dimension) => {
    const value = values[dimension.dimensionId] ?? 0;
    return sum + (dimension.direction === "maximize" ? value : -value);
  }, 0);
}

function optimisticPotentialUpperBound(
  prefix: SearchState,
  offer: TurnRemainderSearchOffer,
  offers: readonly TurnRemainderSearchOffer[],
  registry: TurnPlanEvaluationRegistry,
  remainingStepCount: number,
): number {
  const unavailableCandidateIds = new Set([
    ...prefix.usedCandidateIds,
    offer.head.candidateId,
  ]);
  const optimisticRemainingValue = offers
    .filter(
      (candidate) => !unavailableCandidateIds.has(candidate.head.candidateId),
    )
    .map((candidate) => Math.max(0, scalarOfferValue(candidate, registry)))
    .sort((left, right) => right - left)
    .slice(0, Math.max(0, remainingStepCount))
    .reduce((sum, value) => sum + value, 0);
  return (
    prefix.line.scalarValue +
    Math.max(0, scalarOfferValue(offer, registry)) +
    optimisticRemainingValue
  );
}

function linesHaveComparableScalarPrecedence(
  left: TurnRemainderSearchLine,
  right: TurnRemainderSearchLine,
): boolean {
  return (
    left.priorityClass === right.priorityClass &&
    (left.rootPreferenceRank ?? 0) === (right.rootPreferenceRank ?? 0)
  );
}

function bestFollowupUpperBound(
  current: TurnRemainderSearchOffer,
  offers: readonly TurnRemainderSearchOffer[],
  registry: TurnPlanEvaluationRegistry,
): number {
  return Math.max(
    0,
    ...offers
      .filter(
        (offer) =>
          offer.head.candidateId !== current.head.candidateId &&
          !(current.incompatibleCandidateIds ?? []).includes(
            offer.head.candidateId,
          ) &&
          !(offer.incompatibleCandidateIds ?? []).includes(
            current.head.candidateId,
          ),
      )
      .map((offer) => scalarOfferValue(offer, registry)),
  );
}

function mergeEvaluationValues(
  current: Readonly<Record<string, number>>,
  additions: Readonly<Record<string, number>>,
): Record<string, number> {
  const merged = { ...current };
  for (const [dimensionId, value] of Object.entries(additions)) {
    merged[dimensionId] = (merged[dimensionId] ?? 0) + value;
  }
  return Object.fromEntries(
    Object.entries(merged).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function mergePriorityCoverage(
  current: PriorityCoverage | undefined,
  addition: PriorityCoverage,
): PriorityCoverage {
  return {
    requiredObligationIds: sortedUnique([
      ...(current?.requiredObligationIds ?? []),
      ...addition.requiredObligationIds,
    ]),
    satisfiedObligationIds: sortedUnique([
      ...(current?.satisfiedObligationIds ?? []),
      ...addition.satisfiedObligationIds,
    ]),
    violatedObligationIds: sortedUnique([
      ...(current?.violatedObligationIds ?? []),
      ...addition.violatedObligationIds,
    ]),
    deferredObligationIds: sortedUnique([
      ...(current?.deferredObligationIds ?? []),
      ...addition.deferredObligationIds,
    ]),
  };
}

function mergeValueClaims(
  current: readonly CampaignValueClaim[],
  additions: readonly CampaignValueClaim[],
): CampaignValueClaim[] | undefined {
  const byId = new Map(current.map((claim) => [claim.claimId, claim]));
  for (const claim of additions) {
    if (byId.has(claim.claimId)) continue;
    const conflicts = [...byId.values()].some(
      (existing) =>
        (claim.aggregationMode === "exclusive" ||
          existing.aggregationMode === "exclusive") &&
        claim.conflictKeys.some((key) => existing.conflictKeys.includes(key)),
    );
    if (conflicts) return undefined;
    byId.set(claim.claimId, claim);
  }
  return [...byId.values()].sort((left, right) =>
    left.claimId.localeCompare(right.claimId),
  );
}

function candidateConsumesSourceCard(
  candidate: ActionSemanticCandidate,
): boolean {
  return ["install_card", "play_operation", "play_event", "play_card"].includes(
    candidate.actionType,
  );
}

function candidateCostsAreExact(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    Number.isSafeInteger(candidate.costProfile.clickCost ?? 0) &&
    Number.isSafeInteger(candidate.costProfile.creditCost ?? 0) &&
    (candidate.costProfile.clickCost ?? 0) >= 0 &&
    (candidate.costProfile.creditCost ?? 0) >= 0
  );
}

function exactCreditDelta(candidate: ActionSemanticCandidate): number {
  if (
    economyProjectionIsExact(candidate) &&
    Number.isSafeInteger(candidate.economyProjection.netLiquidCreditGain)
  ) {
    return candidate.economyProjection.netLiquidCreditGain ?? 0;
  }
  return -wholeNonNegative(candidate.costProfile.creditCost ?? 0);
}

function exactHandDelta(
  frame: ProjectedDecisionFrame,
  candidate: ActionSemanticCandidate,
): number {
  if (
    economyProjectionIsExact(candidate) &&
    Number.isSafeInteger(candidate.economyProjection.netHandDelta)
  ) {
    return candidate.economyProjection.netHandDelta;
  }
  return candidate.sourceCardInstanceId &&
    frame.ownHand.knownInstanceIds.includes(candidate.sourceCardInstanceId) &&
    candidateConsumesSourceCard(candidate)
    ? -1
    : 0;
}

function economyProjectionIsExact(
  candidate: ActionSemanticCandidate,
): candidate is ActionSemanticCandidate & {
  economyProjection: NonNullable<ActionSemanticCandidate["economyProjection"]>;
} {
  const economy = candidate.economyProjection;
  return (
    economy?.kind === "immediate_liquid" &&
    economy.timing === "immediate" &&
    economy.creditRestriction === "general" &&
    economy.reliability === "guaranteed" &&
    ((economy.source === "legal_action_payload" &&
      economy.confidence === "high") ||
      (economy.source === "basic_action_contract" &&
        economy.confidence === "medium" &&
        candidate.actionType === "gain_credit" &&
        candidate.semanticActionType === "economy.gain_credit"))
  );
}

function normalizedBudget(
  requested: Partial<TurnRemainderSearchBudget> | undefined,
): TurnRemainderSearchBudget {
  return {
    maximumDepth: boundedWhole(
      requested?.maximumDepth,
      DEFAULT_BUDGET.maximumDepth,
      1,
      4,
    ) as TurnRemainderSearchBudget["maximumDepth"],
    maximumExpandedNodes: boundedWhole(
      requested?.maximumExpandedNodes,
      DEFAULT_BUDGET.maximumExpandedNodes,
      1,
      256,
    ),
    maximumBranchesPerPartition: boundedWhole(
      requested?.maximumBranchesPerPartition,
      DEFAULT_BUDGET.maximumBranchesPerPartition,
      1,
      64,
    ),
    maximumParetoLinesPerPartition: boundedWhole(
      requested?.maximumParetoLinesPerPartition,
      DEFAULT_BUDGET.maximumParetoLinesPerPartition,
      1,
      8,
    ),
  };
}

function priorityRank(
  priorityClass: TurnPlanningHeadCandidate["priorityClass"],
): number {
  return Number(priorityClass.slice(1));
}

function coverageSignature(coverage: PriorityCoverage): string {
  return JSON.stringify({
    required: [...coverage.requiredObligationIds].sort(),
    satisfied: [...coverage.satisfiedObligationIds].sort(),
    violated: [...coverage.violatedObligationIds].sort(),
    deferred: [...coverage.deferredObligationIds].sort(),
  });
}

function pruneEvent(
  partitionKey: string,
  offer: TurnRemainderSearchOffer,
  reasonCode: TurnRemainderSearchPruneReason,
  prefixLineId?: string,
): TurnRemainderSearchResult["pruneEvents"][number] {
  return {
    partitionKey,
    candidateId: offer.head.candidateId,
    ...(prefixLineId ? { prefixLineId } : {}),
    reasonCode,
  };
}

function comparePruneEvents(
  left: TurnRemainderSearchResult["pruneEvents"][number],
  right: TurnRemainderSearchResult["pruneEvents"][number],
): number {
  return (
    left.partitionKey.localeCompare(right.partitionKey) ||
    (left.prefixLineId ?? "").localeCompare(right.prefixLineId ?? "") ||
    left.candidateId.localeCompare(right.candidateId) ||
    left.reasonCode.localeCompare(right.reasonCode)
  );
}

function exactRange(value: number): ProjectionValueRange {
  return { minimum: value, maximum: value };
}

function wholeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function boundedWhole(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.floor(value!)));
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
