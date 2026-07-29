import type { AiDecisionInput, Side, VisibleCard } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  PlanningRulesContext,
  PlanningStateIdentity,
} from "./turn-planning-contracts";
import { turnPlanningFingerprint } from "./turn-planning-contracts";

export const PROJECTED_DECISION_FRAME_SCHEMA_VERSION =
  "projected-decision-frame-v1" as const;
export const TURN_PROJECTION_DELTA_SCHEMA_VERSION =
  "turn-projection-delta-v1" as const;

export type ProjectionValueRange = {
  minimum: number;
  maximum: number;
};

export type ProjectionUncertainty = {
  code: string;
  detail?: string;
};

export type ProjectedHandDisposition =
  | "current_plan_route"
  | "support_for_need"
  | "blocked_but_developable"
  | "campaign_hold"
  | "redundant"
  | "currently_dead"
  | "discard_candidate"
  | "assessment_unknown";

export type ProjectedKnownZoneState = {
  zoneId: string;
  instanceIds: string[];
};

export type ProjectedKnownBoardCard = {
  instanceId: string;
  zoneId: string;
  serverId?: string;
  advancement: number;
};

export type ProjectedResourceReservation = {
  reservationId: string;
  ownerPlanInstanceId: string;
  resourceKind: "credit" | "action" | "card" | "server_slot";
  amount: number;
};

export type ProjectedPlanProgress = {
  planInstanceId: string;
  phase: string;
  milestone: string;
  viability: string;
};

export type NeedHitProbabilityBand = {
  needId: string;
  minimumProbability: number;
  maximumProbability: number;
};

export type BoundaryResidualTurnValueBasis =
  | "remaining_capacity"
  | "open_need_hit_distribution"
  | "hand_quality_distribution"
  | "public_outcome_distribution";

export type TurnBoundaryKind =
  | "private_observation"
  | "public_random_outcome"
  | "opponent_response_window"
  | "engine_continuation"
  | "projection_not_supported"
  | "projected_plan_discovery_required";

export type BoundaryActionAssessment = {
  boundaryKind: TurnBoundaryKind;
  immediateOutcomeCodes: string[];
  remainingActionCapacityAfterBoundary: ProjectionValueRange;
  postBoundaryOptionality: ProjectionValueRange & {
    unit:
      | "usable_actions"
      | "need_hit_probability"
      | "hand_quality_band"
      | "public_outcome_band";
  };
  residualTurnValueBasis: BoundaryResidualTurnValueBasis;
  hitProbabilityBands?: NeedHitProbabilityBand[];
  uncertainty: ProjectionUncertainty[];
  assumptionIds: string[];
};

export type ProjectedDecisionFrame = {
  schemaVersion: typeof PROJECTED_DECISION_FRAME_SCHEMA_VERSION;
  side: Side;
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  turnKey: string;
  timingPointClass: string;
  actionCapacityLedger: {
    unrestricted: ProjectionValueRange;
    restrictedTokens: Array<{
      tokenId: string;
      remaining: number;
      allowedActionTypes: string[];
      expiresAt: string;
    }>;
  };
  ownCredits: ProjectionValueRange;
  ownHand: {
    count: ProjectionValueRange;
    capacity: number;
    knownInstanceIds: string[];
    dispositions: Array<{
      instanceId: string;
      disposition: ProjectedHandDisposition;
    }>;
  };
  ownKnownZones: ProjectedKnownZoneState[];
  ownKnownBoard: ProjectedKnownBoardCard[];
  usageLedger: string[];
  publicEventFacts: string[];
  visibleOpponentBoard: string[];
  serverPostures: Array<{
    serverId: string;
    ownIceCount: number;
    ownRootCount: number;
    visibleOpponentCardCount: number;
  }>;
  resourceLedger: {
    reservations: ProjectedResourceReservation[];
  };
  portfolioForecasts: ProjectedPlanProgress[];
  projectedCleanup: {
    requiredDiscardRange: ProjectionValueRange;
    dispositionCoverageComplete: boolean;
    unclassifiedInstanceIds: string[];
    discardCandidateInstanceIds: string[];
  };
  pendingBoundary?: BoundaryActionAssessment;
  uncertainty: ProjectionUncertainty[];
  projectedFrameKey: string;
};

export type TurnProjectionDelta = {
  schemaVersion: typeof TURN_PROJECTION_DELTA_SCHEMA_VERSION;
  deltaId: string;
  expectedBaseFrameKey: string;
  certification:
    | "legal_action_semantics"
    | "engine_quote"
    | "plan_module_exact";
  actionCapacityDelta: ProjectionValueRange;
  creditDelta: ProjectionValueRange;
  handCountDelta: ProjectionValueRange;
  knownZoneMoves: Array<{
    instanceId: string;
    fromZoneId: string;
    toZoneId: string;
  }>;
  boardUpdates: Array<{
    instanceId: string;
    zoneId: string;
    serverId?: string;
    advancementDelta?: number;
  }>;
  usageAdds: string[];
  publicEventFactAdds: string[];
  reservations: ProjectedResourceReservation[];
  portfolioProgress: ProjectedPlanProgress[];
  boundary?: BoundaryActionAssessment;
  uncertainty: ProjectionUncertainty[];
};

export class TurnProjectionError extends Error {
  constructor(
    readonly code: string,
    readonly issues: string[],
  ) {
    super(`${code}:${[...new Set(issues)].sort().join(",")}`);
    this.name = "TurnProjectionError";
  }
}

export function buildProjectedDecisionFrame(params: {
  input: AiDecisionInput;
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  turnKey: string;
  handDispositions?: ReadonlyMap<string, ProjectedHandDisposition>;
  reservations?: readonly ProjectedResourceReservation[];
  portfolioForecasts?: readonly ProjectedPlanProgress[];
}): ProjectedDecisionFrame {
  if (params.input.side !== params.input.playerView.side) {
    throw new TurnProjectionError("invalid_projection_input", [
      "input_side_mismatch",
    ]);
  }
  if (
    params.stateIdentity.stateVersion !== params.input.playerView.stateVersion
  ) {
    throw new TurnProjectionError("invalid_projection_input", [
      "state_version_mismatch",
    ]);
  }
  const ownHandCards = params.input.playerView.own.gripOrHq;
  const knownInstanceIds = ownHandCards.map((card) => card.instanceId).sort();
  const dispositions = knownInstanceIds.map((instanceId) => ({
    instanceId,
    disposition:
      params.handDispositions?.get(instanceId) ?? "assessment_unknown",
  }));
  const ownKnownZones = projectedKnownZones(params.input);
  const ownKnownBoard = projectedOwnBoard(params.input);
  const visibleOpponentBoard = projectedVisibleOpponentBoard(params.input);
  const frameWithoutKey: Omit<ProjectedDecisionFrame, "projectedFrameKey"> = {
    schemaVersion: PROJECTED_DECISION_FRAME_SCHEMA_VERSION,
    side: params.input.side,
    rulesContext: structuredClone(params.rulesContext),
    stateIdentity: structuredClone(params.stateIdentity),
    turnKey: params.turnKey,
    timingPointClass: params.input.playerView.timingPoint,
    actionCapacityLedger: {
      unrestricted: exactRange(params.input.playerView.own.clicks),
      restrictedTokens: [],
    },
    ownCredits: exactRange(params.input.playerView.own.credits),
    ownHand: {
      count: exactRange(ownHandCards.length),
      capacity: params.input.playerView.own.maxHandSize,
      knownInstanceIds,
      dispositions,
    },
    ownKnownZones,
    ownKnownBoard,
    usageLedger: [],
    publicEventFacts: params.input.eventTail.map(
      (event) => `${event.eventId}:${event.type}:${event.stateVersionAfter}`,
    ),
    visibleOpponentBoard,
    serverPostures: params.input.playerView.servers
      .map((server) => ({
        serverId: server.id,
        ownIceCount: server.ice.filter(
          (card) => card.owner === params.input.side,
        ).length,
        ownRootCount: server.root.filter(
          (card) => card.owner === params.input.side,
        ).length,
        visibleOpponentCardCount: [...server.ice, ...server.root].filter(
          (card) => card.owner !== params.input.side && card.known,
        ).length,
      }))
      .sort((left, right) => left.serverId.localeCompare(right.serverId)),
    resourceLedger: {
      reservations: sortedReservations(params.reservations ?? []),
    },
    portfolioForecasts: [...(params.portfolioForecasts ?? [])].sort(
      (left, right) => left.planInstanceId.localeCompare(right.planInstanceId),
    ),
    projectedCleanup: cleanupProjection(
      exactRange(ownHandCards.length),
      params.input.playerView.own.maxHandSize,
      dispositions,
    ),
    uncertainty: [],
  };
  return withProjectedFrameKey(frameWithoutKey);
}

export function certifiedTurnProjectionDeltaFromCandidate(params: {
  frame: ProjectedDecisionFrame;
  candidate: ActionSemanticCandidate;
  boundary?: BoundaryActionAssessment;
}): TurnProjectionDelta {
  const candidate = params.candidate;
  if (
    candidate.stateVersion !== params.frame.stateIdentity.stateVersion ||
    candidate.primaryProjectionStatus === "hidden_info_blocked" ||
    candidate.primaryProjectionStatus === "schema_gap" ||
    candidate.primaryProjectionStatus === "blocked"
  ) {
    throw new TurnProjectionError("candidate_not_projectable", [
      "candidate_not_current_or_side_safe",
    ]);
  }
  const capacity = candidate.actionCapacityProjection;
  const actionCapacityDelta =
    capacity?.reliability === "guaranteed" &&
    capacity.timing === "immediate" &&
    Number.isSafeInteger(capacity.netCurrentTurnActionDelta)
      ? exactRange(capacity.netCurrentTurnActionDelta)
      : candidate.costProfile.costKnownStatus === "known" &&
          Number.isSafeInteger(candidate.costProfile.clickCost)
        ? exactRange(-(candidate.costProfile.clickCost ?? 0))
        : range(0, 0);
  const economy = candidate.economyProjection;
  const exactEconomy =
    economy?.source === "legal_action_payload" &&
    economy.reliability === "guaranteed" &&
    economy.confidence === "high";
  return {
    schemaVersion: TURN_PROJECTION_DELTA_SCHEMA_VERSION,
    deltaId: `candidate:${candidate.actionId}`,
    expectedBaseFrameKey: params.frame.projectedFrameKey,
    certification: "legal_action_semantics",
    actionCapacityDelta,
    creditDelta:
      exactEconomy && Number.isSafeInteger(economy.netLiquidCreditGain)
        ? exactRange(economy.netLiquidCreditGain ?? 0)
        : exactRange(0),
    handCountDelta:
      exactEconomy && Number.isSafeInteger(economy.netHandDelta)
        ? exactRange(economy.netHandDelta)
        : exactRange(0),
    knownZoneMoves: [],
    boardUpdates: [],
    usageAdds: [],
    publicEventFactAdds: [],
    reservations: [],
    portfolioProgress: [],
    ...(params.boundary ? { boundary: structuredClone(params.boundary) } : {}),
    uncertainty: [
      ...(!exactEconomy && candidate.economyProjection
        ? [{ code: "economy_projection_not_exact" }]
        : []),
    ],
  };
}

export function applyCertifiedTurnProjectionDelta(
  frame: ProjectedDecisionFrame,
  delta: TurnProjectionDelta,
): ProjectedDecisionFrame {
  const issues = validateProjectionDelta(frame, delta);
  if (issues.length > 0) {
    throw new TurnProjectionError("invalid_projection_delta", issues);
  }
  const zones = new Map(
    frame.ownKnownZones.map((zone) => [zone.zoneId, [...zone.instanceIds]]),
  );
  for (const move of delta.knownZoneMoves) {
    zones.set(
      move.fromZoneId,
      (zones.get(move.fromZoneId) ?? []).filter(
        (instanceId) => instanceId !== move.instanceId,
      ),
    );
    zones.set(move.toZoneId, [
      ...new Set([...(zones.get(move.toZoneId) ?? []), move.instanceId]),
    ]);
  }
  const board = new Map(
    frame.ownKnownBoard.map((card) => [card.instanceId, structuredClone(card)]),
  );
  for (const update of delta.boardUpdates) {
    const current = board.get(update.instanceId);
    board.set(update.instanceId, {
      instanceId: update.instanceId,
      zoneId: update.zoneId,
      ...(update.serverId ? { serverId: update.serverId } : {}),
      advancement: Math.max(
        0,
        (current?.advancement ?? 0) + (update.advancementDelta ?? 0),
      ),
    });
  }
  const ownHandCount = addRanges(frame.ownHand.count, delta.handCountDelta);
  const dispositions = frame.ownHand.dispositions.filter((entry) =>
    zones.get("own_hand")?.includes(entry.instanceId),
  );
  const nextWithoutKey: Omit<ProjectedDecisionFrame, "projectedFrameKey"> = {
    ...structuredClone(frame),
    actionCapacityLedger: {
      ...structuredClone(frame.actionCapacityLedger),
      unrestricted: nonNegativeRange(
        addRanges(
          frame.actionCapacityLedger.unrestricted,
          delta.actionCapacityDelta,
        ),
      ),
    },
    ownCredits: nonNegativeRange(
      addRanges(frame.ownCredits, delta.creditDelta),
    ),
    ownHand: {
      ...structuredClone(frame.ownHand),
      count: nonNegativeRange(ownHandCount),
      knownInstanceIds: [...(zones.get("own_hand") ?? [])].sort(),
      dispositions,
    },
    ownKnownZones: [...zones.entries()]
      .map(([zoneId, instanceIds]) => ({
        zoneId,
        instanceIds: [...new Set(instanceIds)].sort(),
      }))
      .sort((left, right) => left.zoneId.localeCompare(right.zoneId)),
    ownKnownBoard: [...board.values()].sort((left, right) =>
      left.instanceId.localeCompare(right.instanceId),
    ),
    usageLedger: sortedUnique([...frame.usageLedger, ...delta.usageAdds]),
    publicEventFacts: sortedUnique([
      ...frame.publicEventFacts,
      ...delta.publicEventFactAdds,
    ]),
    resourceLedger: {
      reservations: sortedReservations([
        ...frame.resourceLedger.reservations,
        ...delta.reservations,
      ]),
    },
    portfolioForecasts: mergedPortfolioForecasts(
      frame.portfolioForecasts,
      delta.portfolioProgress,
    ),
    projectedCleanup: cleanupProjection(
      nonNegativeRange(ownHandCount),
      frame.ownHand.capacity,
      dispositions,
    ),
    ...(delta.boundary
      ? { pendingBoundary: structuredClone(delta.boundary) }
      : {}),
    uncertainty: [...frame.uncertainty, ...delta.uncertainty],
  };
  delete (nextWithoutKey as Partial<ProjectedDecisionFrame>).projectedFrameKey;
  return withProjectedFrameKey(nextWithoutKey);
}

export function assessTurnObservationBoundary(params: {
  boundaryKind: TurnBoundaryKind;
  remainingActionCapacity: ProjectionValueRange;
  residualTurnValueBasis: BoundaryResidualTurnValueBasis;
  immediateOutcomeCodes: string[];
  hitProbabilityBands?: NeedHitProbabilityBand[];
  uncertainty?: ProjectionUncertainty[];
  assumptionIds?: string[];
}): BoundaryActionAssessment {
  validateRange(params.remainingActionCapacity, "remaining_action_capacity");
  const hitProbabilityBands = params.hitProbabilityBands?.map((band) => {
    if (
      !Number.isFinite(band.minimumProbability) ||
      !Number.isFinite(band.maximumProbability) ||
      band.minimumProbability < 0 ||
      band.maximumProbability > 1 ||
      band.minimumProbability > band.maximumProbability
    ) {
      throw new TurnProjectionError("invalid_boundary_assessment", [
        "invalid_need_hit_probability",
      ]);
    }
    return structuredClone(band);
  });
  const postBoundaryOptionality =
    params.residualTurnValueBasis === "remaining_capacity"
      ? {
          ...structuredClone(params.remainingActionCapacity),
          unit: "usable_actions" as const,
        }
      : params.residualTurnValueBasis === "open_need_hit_distribution"
        ? {
            minimum: Math.min(
              1,
              ...(hitProbabilityBands ?? []).map(
                (band) => band.minimumProbability,
              ),
            ),
            maximum: Math.max(
              0,
              ...(hitProbabilityBands ?? []).map(
                (band) => band.maximumProbability,
              ),
            ),
            unit: "need_hit_probability" as const,
          }
        : params.residualTurnValueBasis === "hand_quality_distribution"
          ? {
              minimum: 0,
              maximum: params.remainingActionCapacity.maximum > 0 ? 1 : 0,
              unit: "hand_quality_band" as const,
            }
          : {
              minimum: 0,
              maximum: 1,
              unit: "public_outcome_band" as const,
            };
  return {
    boundaryKind: params.boundaryKind,
    immediateOutcomeCodes: [...params.immediateOutcomeCodes],
    remainingActionCapacityAfterBoundary: structuredClone(
      params.remainingActionCapacity,
    ),
    postBoundaryOptionality,
    residualTurnValueBasis: params.residualTurnValueBasis,
    ...(hitProbabilityBands ? { hitProbabilityBands } : {}),
    uncertainty: [...(params.uncertainty ?? [])],
    assumptionIds: [...(params.assumptionIds ?? [])],
  };
}

function validateProjectionDelta(
  frame: ProjectedDecisionFrame,
  delta: TurnProjectionDelta,
): string[] {
  const issues: string[] = [];
  if (delta.schemaVersion !== TURN_PROJECTION_DELTA_SCHEMA_VERSION) {
    issues.push("delta_schema_mismatch");
  }
  if (delta.expectedBaseFrameKey !== frame.projectedFrameKey) {
    issues.push("base_frame_mismatch");
  }
  if (delta.deltaId.trim().length === 0) issues.push("blank_delta_id");
  for (const [label, value] of [
    ["action_capacity_delta", delta.actionCapacityDelta],
    ["credit_delta", delta.creditDelta],
    ["hand_delta", delta.handCountDelta],
  ] as const) {
    try {
      validateRange(value, label);
    } catch (error) {
      if (error instanceof TurnProjectionError) issues.push(...error.issues);
      else throw error;
    }
  }
  const zoneInstances = new Map(
    frame.ownKnownZones.map((zone) => [zone.zoneId, new Set(zone.instanceIds)]),
  );
  for (const move of delta.knownZoneMoves) {
    if (!zoneInstances.get(move.fromZoneId)?.has(move.instanceId)) {
      issues.push("known_zone_move_source_mismatch");
    }
  }
  if (delta.boundary && delta.boundary.boundaryKind === "engine_continuation") {
    if (delta.boundary.residualTurnValueBasis !== "remaining_capacity") {
      issues.push("engine_continuation_with_speculative_value");
    }
  }
  return issues;
}

function projectedKnownZones(
  input: AiDecisionInput,
): ProjectedKnownZoneState[] {
  const zones: ProjectedKnownZoneState[] = [
    {
      zoneId: "own_hand",
      instanceIds: input.playerView.own.gripOrHq.map((card) => card.instanceId),
    },
    {
      zoneId: "own_discard",
      instanceIds: input.playerView.own.heapOrArchives.map(
        (card) => card.instanceId,
      ),
    },
    {
      zoneId: "own_scored",
      instanceIds: input.playerView.own.scoreArea.map(
        (card) => card.instanceId,
      ),
    },
    {
      zoneId: "own_rig",
      instanceIds: (input.playerView.own.rig ?? []).map(
        (card) => card.instanceId,
      ),
    },
  ];
  for (const server of input.playerView.servers) {
    zones.push({
      zoneId: `server:${server.id}:ice`,
      instanceIds: server.ice
        .filter((card) => card.owner === input.side)
        .map((card) => card.instanceId),
    });
    zones.push({
      zoneId: `server:${server.id}:root`,
      instanceIds: server.root
        .filter((card) => card.owner === input.side)
        .map((card) => card.instanceId),
    });
  }
  return zones
    .map((zone) => ({
      ...zone,
      instanceIds: sortedUnique(zone.instanceIds),
    }))
    .sort((left, right) => left.zoneId.localeCompare(right.zoneId));
}

function projectedOwnBoard(input: AiDecisionInput): ProjectedKnownBoardCard[] {
  const cards: ProjectedKnownBoardCard[] = [];
  for (const card of input.playerView.own.rig ?? []) {
    cards.push(boardCard(card, "own_rig"));
  }
  for (const server of input.playerView.servers) {
    for (const card of server.ice) {
      if (card.owner === input.side) {
        cards.push(boardCard(card, `server:${server.id}:ice`, server.id));
      }
    }
    for (const card of server.root) {
      if (card.owner === input.side) {
        cards.push(boardCard(card, `server:${server.id}:root`, server.id));
      }
    }
  }
  return cards.sort((left, right) =>
    left.instanceId.localeCompare(right.instanceId),
  );
}

function projectedVisibleOpponentBoard(input: AiDecisionInput): string[] {
  const ids = [
    ...(input.playerView.opponent.rig ?? []).map((card) => card.instanceId),
    ...input.playerView.servers.flatMap((server) =>
      [...server.ice, ...server.root]
        .filter((card) => card.owner !== input.side && card.known)
        .map((card) => card.instanceId),
    ),
  ];
  return sortedUnique(ids);
}

function boardCard(
  card: VisibleCard,
  zoneId: string,
  serverId?: string,
): ProjectedKnownBoardCard {
  return {
    instanceId: card.instanceId,
    zoneId,
    ...(serverId ? { serverId } : {}),
    advancement: card.advancementCounters ?? 0,
  };
}

function cleanupProjection(
  handCount: ProjectionValueRange,
  capacity: number,
  dispositions: ProjectedDecisionFrame["ownHand"]["dispositions"],
): ProjectedDecisionFrame["projectedCleanup"] {
  const knownDispositionIds = new Set(
    dispositions
      .filter((entry) => entry.disposition !== "assessment_unknown")
      .map((entry) => entry.instanceId),
  );
  const allDispositionIds = dispositions.map((entry) => entry.instanceId);
  return {
    requiredDiscardRange: {
      minimum: Math.max(0, handCount.minimum - capacity),
      maximum: Math.max(0, handCount.maximum - capacity),
    },
    dispositionCoverageComplete:
      allDispositionIds.length === knownDispositionIds.size,
    unclassifiedInstanceIds: allDispositionIds
      .filter((instanceId) => !knownDispositionIds.has(instanceId))
      .sort(),
    discardCandidateInstanceIds: dispositions
      .filter((entry) =>
        ["redundant", "currently_dead", "discard_candidate"].includes(
          entry.disposition,
        ),
      )
      .map((entry) => entry.instanceId)
      .sort(),
  };
}

function withProjectedFrameKey(
  frame: Omit<ProjectedDecisionFrame, "projectedFrameKey">,
): ProjectedDecisionFrame {
  return {
    ...frame,
    projectedFrameKey: turnPlanningFingerprint("projected-frame", frame),
  };
}

function mergedPortfolioForecasts(
  current: readonly ProjectedPlanProgress[],
  updates: readonly ProjectedPlanProgress[],
): ProjectedPlanProgress[] {
  const byId = new Map(
    current.map((entry) => [entry.planInstanceId, structuredClone(entry)]),
  );
  for (const update of updates) {
    byId.set(update.planInstanceId, structuredClone(update));
  }
  return [...byId.values()].sort((left, right) =>
    left.planInstanceId.localeCompare(right.planInstanceId),
  );
}

function sortedReservations(
  reservations: readonly ProjectedResourceReservation[],
): ProjectedResourceReservation[] {
  return [...reservations]
    .map((reservation) => structuredClone(reservation))
    .sort((left, right) =>
      left.reservationId.localeCompare(right.reservationId),
    );
}

function exactRange(value: number): ProjectionValueRange {
  return { minimum: value, maximum: value };
}

function range(minimum: number, maximum: number): ProjectionValueRange {
  return { minimum, maximum };
}

function addRanges(
  left: ProjectionValueRange,
  right: ProjectionValueRange,
): ProjectionValueRange {
  return {
    minimum: left.minimum + right.minimum,
    maximum: left.maximum + right.maximum,
  };
}

function nonNegativeRange(value: ProjectionValueRange): ProjectionValueRange {
  return {
    minimum: Math.max(0, value.minimum),
    maximum: Math.max(0, value.maximum),
  };
}

function validateRange(value: ProjectionValueRange, label: string): void {
  if (
    !Number.isFinite(value.minimum) ||
    !Number.isFinite(value.maximum) ||
    value.minimum > value.maximum
  ) {
    throw new TurnProjectionError("invalid_projection_range", [
      `invalid_range:${label}`,
    ]);
  }
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
