import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  CreditDemand,
  CreditDemandDeadline,
  CreditRestriction,
} from "./credit-demand";

export const FUNDING_ROUTE_SCHEMA_VERSION = "funding-route-v1" as const;

export type FundingRouteStatus =
  | "uncovered"
  | "covered_contingent"
  | "covered_guaranteed"
  | "funded"
  | "invalidated";
export type FundingRouteReliability = "guaranteed" | "contingent";
export type FundingRouteHorizon =
  | "same_turn"
  | "next_own_turn"
  | "within_three_own_turns";

export type FundingRouteStep = {
  stepId: string;
  kind: "legal_action" | "future_projection";
  actionId?: string;
  projectionId?: string;
  ownTurnOffset: 0 | 1 | 2 | 3;
  clickCost: number;
  creditCost: number;
  netLiquidCreditGain: number;
  creditRestriction: CreditRestriction;
  reliability: FundingRouteReliability;
  sourceDefinitionId?: string;
  evidence: string[];
};

export type FundingRoute = {
  schemaVersion: typeof FUNDING_ROUTE_SCHEMA_VERSION;
  routeId: string;
  demandId: string;
  status: FundingRouteStatus;
  reliability: FundingRouteReliability;
  horizon: FundingRouteHorizon;
  startingCredits: number;
  targetCredits: number;
  projectedCredits: number;
  projectedGeneralCredits: number;
  projectedGap: number;
  totalClickCost: number;
  steps: FundingRouteStep[];
  invalidationReasons: string[];
  evidence: string[];
};

export type FundingActionCandidate = Pick<
  ActionSemanticCandidate,
  | "actionId"
  | "actionType"
  | "sourceDefinitionId"
  | "sourceCardInstanceId"
  | "economyProjection"
>;

export type FutureFundingProjection = {
  projectionId: string;
  netLiquidCreditGain: number;
  clickCost: number;
  creditCost?: number;
  creditRestriction?: CreditRestriction;
  earliestOwnTurnOffset: 1 | 2 | 3;
  reliability: FundingRouteReliability;
  requiredCurrentActionId?: string;
  sourceDefinitionId?: string;
  evidence?: readonly string[];
};

export type SearchFundingRoutesParams = {
  demand: CreditDemand;
  candidates: readonly FundingActionCandidate[];
  remainingClicks: number;
  futureProjections?: readonly FutureFundingProjection[];
  maxSteps?: number;
  maxRoutes?: number;
};

export type FundingRouteSearchResult = {
  demand: CreditDemand;
  routes: FundingRoute[];
  bestRoute: FundingRoute;
  evidence: string[];
};

type RouteOption = {
  optionId: string;
  steps: FundingRouteStep[];
  currentTurnClickCost: number;
  eligibleCreditDelta: number;
  generalCreditDelta: number;
  creditCost: number;
  reliability: FundingRouteReliability;
  maximumTurnOffset: 0 | 1 | 2 | 3;
  maximumUses: number;
};

type SearchState = {
  steps: FundingRouteStep[];
  eligibleCredits: number;
  generalCredits: number;
  remainingClicks: number;
  reliability: FundingRouteReliability;
  maximumTurnOffset: 0 | 1 | 2 | 3;
  optionUseCounts: Map<string, number>;
};

export function searchFundingRoutes(
  params: SearchFundingRoutesParams,
): FundingRouteSearchResult {
  if (params.demand.gap === 0) {
    const funded = routeFromState(params.demand, {
      steps: [],
      eligibleCredits: params.demand.currentCredits,
      generalCredits: params.demand.currentCredits,
      remainingClicks: wholeNonNegative(params.remainingClicks),
      reliability: "guaranteed",
      maximumTurnOffset: 0,
      optionUseCounts: new Map(),
    });
    return result(params.demand, [funded]);
  }

  const remainingClicks = wholeNonNegative(params.remainingClicks);
  const currentOptions = params.candidates
    .map(currentFundingOption)
    .filter((option): option is RouteOption => option !== undefined)
    .filter((option) => optionSupportsDemand(option, params.demand));
  const futureOptions = (params.futureProjections ?? [])
    .map((projection) =>
      futureFundingOption(projection, params.candidates, params.demand),
    )
    .filter((option): option is RouteOption => option !== undefined);
  const options = [...currentOptions, ...futureOptions].sort(compareOptions);
  const maxSteps = Math.max(1, Math.min(8, params.maxSteps ?? 4));
  const maxRoutes = Math.max(1, Math.min(32, params.maxRoutes ?? 8));
  const queue: SearchState[] = [
    {
      steps: [],
      eligibleCredits: params.demand.currentCredits,
      generalCredits: params.demand.currentCredits,
      remainingClicks,
      reliability: "guaranteed",
      maximumTurnOffset: 0,
      optionUseCounts: new Map(),
    },
  ];
  const covered: FundingRoute[] = [];
  const visited = new Set<string>();

  while (queue.length > 0 && covered.length < maxRoutes * 4) {
    const state = queue.shift()!;
    if (state.steps.length >= maxSteps) continue;
    for (const option of options) {
      const optionUseCount = state.optionUseCounts.get(option.optionId) ?? 0;
      if (optionUseCount >= option.maximumUses) continue;
      if (option.currentTurnClickCost > state.remainingClicks) continue;
      if (option.creditCost > state.generalCredits) continue;
      if (!deadlineAllows(params.demand.deadline, option.maximumTurnOffset)) {
        continue;
      }
      if (state.steps.length + option.steps.length > maxSteps) continue;
      const next: SearchState = {
        steps: [...state.steps, ...option.steps],
        eligibleCredits: state.eligibleCredits + option.eligibleCreditDelta,
        generalCredits: state.generalCredits + option.generalCreditDelta,
        remainingClicks: state.remainingClicks - option.currentTurnClickCost,
        reliability:
          state.reliability === "guaranteed" &&
          option.reliability === "guaranteed"
            ? "guaranteed"
            : "contingent",
        maximumTurnOffset: Math.max(
          state.maximumTurnOffset,
          option.maximumTurnOffset,
        ) as 0 | 1 | 2 | 3,
        optionUseCounts: new Map(state.optionUseCounts).set(
          option.optionId,
          optionUseCount + 1,
        ),
      };
      const stateKey = searchStateKey(next);
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);
      if (next.eligibleCredits >= params.demand.targetCredits) {
        covered.push(routeFromState(params.demand, next));
      } else {
        queue.push(next);
      }
    }
  }

  const routes = pruneDominatedRoutes(covered).slice(0, maxRoutes);
  if (routes.length === 0) {
    routes.push(uncoveredRoute(params.demand));
  }
  return result(params.demand, routes);
}

export function creditDemandHardBlockerIsResolved(
  demand: CreditDemand,
  route: FundingRoute,
): boolean {
  if (demand.hardness !== "hard") return route.status !== "uncovered";
  return route.status === "funded" || route.status === "covered_guaranteed";
}

export function revalidateFundingRoute(
  route: FundingRoute,
  currentLegalActionIds: ReadonlySet<string>,
): FundingRoute {
  if (route.status === "funded" || route.status === "invalidated") {
    return route;
  }
  const missing = route.steps
    .filter(
      (step) =>
        step.kind === "legal_action" &&
        step.actionId !== undefined &&
        !currentLegalActionIds.has(step.actionId),
    )
    .map((step) => step.actionId!);
  if (missing.length === 0) return route;
  return {
    ...route,
    status: "invalidated",
    invalidationReasons: missing.map(
      (actionId) => `legal_action_unavailable:${actionId}`,
    ),
    evidence: [
      ...route.evidence,
      ...missing.map((actionId) => `route_invalidated:${actionId}`),
    ],
  };
}

export function pruneDominatedRoutes(
  routes: readonly FundingRoute[],
): FundingRoute[] {
  return routes
    .filter(
      (route, index) =>
        !routes.some(
          (other, otherIndex) =>
            otherIndex !== index && routeDominates(other, route),
        ),
    )
    .sort(compareRoutes);
}

function currentFundingOption(
  candidate: FundingActionCandidate,
): RouteOption | undefined {
  const projection = candidate.economyProjection;
  const netGain = projection?.netLiquidCreditGain;
  if (
    projection?.kind !== "immediate_liquid" ||
    projection.timing !== "immediate" ||
    netGain === undefined ||
    netGain <= 0
  ) {
    return undefined;
  }
  const reliability =
    projection.reliability === "guaranteed" ? "guaranteed" : "contingent";
  const restriction =
    projection.creditRestriction === "general" ? "general" : "restricted";
  return {
    optionId: `action:${candidate.actionId}`,
    steps: [
      {
        stepId: `legal_action:${candidate.actionId}`,
        kind: "legal_action",
        actionId: candidate.actionId,
        ownTurnOffset: 0,
        clickCost: projection.clickCost,
        creditCost: projection.creditCost,
        netLiquidCreditGain: netGain,
        creditRestriction: restriction,
        reliability,
        ...(candidate.sourceDefinitionId
          ? { sourceDefinitionId: candidate.sourceDefinitionId }
          : {}),
        evidence: [
          `legal_action:${candidate.actionId}`,
          ...projection.evidence,
        ],
      },
    ],
    currentTurnClickCost: projection.clickCost,
    eligibleCreditDelta: netGain,
    generalCreditDelta:
      restriction === "general" ? netGain : -projection.creditCost,
    creditCost: projection.creditCost,
    reliability,
    maximumTurnOffset: 0,
    maximumUses:
      projection.maxCurrentTurnUses ??
      (projection.repeatable === true ? Number.MAX_SAFE_INTEGER : 1),
  };
}

function futureFundingOption(
  projection: FutureFundingProjection,
  candidates: readonly FundingActionCandidate[],
  demand: CreditDemand,
): RouteOption | undefined {
  const netGain = wholeNonNegative(projection.netLiquidCreditGain);
  if (netGain <= 0) return undefined;
  const restriction = projection.creditRestriction ?? "general";
  if (!demand.acceptedCreditRestrictions.includes(restriction)) {
    return undefined;
  }
  const setupCandidate = projection.requiredCurrentActionId
    ? candidates.find(
        (candidate) =>
          candidate.actionId === projection.requiredCurrentActionId,
      )
    : undefined;
  if (projection.requiredCurrentActionId && !setupCandidate) return undefined;
  const setupProjection = setupCandidate?.economyProjection;
  const setupStep: FundingRouteStep[] = setupCandidate
    ? [
        {
          stepId: `legal_action:${setupCandidate.actionId}`,
          kind: "legal_action",
          actionId: setupCandidate.actionId,
          ownTurnOffset: 0,
          clickCost: setupProjection?.clickCost ?? 0,
          creditCost: setupProjection?.creditCost ?? 0,
          netLiquidCreditGain: 0,
          creditRestriction: "general",
          reliability:
            setupProjection?.reliability === "guaranteed"
              ? "guaranteed"
              : "contingent",
          ...(setupCandidate.sourceDefinitionId
            ? { sourceDefinitionId: setupCandidate.sourceDefinitionId }
            : {}),
          evidence: [
            `required_setup_action:${setupCandidate.actionId}`,
            ...(setupProjection?.evidence ?? []),
          ],
        },
      ]
    : [];
  const futureStep: FundingRouteStep = {
    stepId: `future_projection:${projection.projectionId}`,
    kind: "future_projection",
    projectionId: projection.projectionId,
    ownTurnOffset: projection.earliestOwnTurnOffset,
    clickCost: wholeNonNegative(projection.clickCost),
    creditCost: wholeNonNegative(projection.creditCost ?? 0),
    netLiquidCreditGain: netGain,
    creditRestriction: restriction,
    reliability: projection.reliability,
    ...(projection.sourceDefinitionId
      ? { sourceDefinitionId: projection.sourceDefinitionId }
      : {}),
    evidence: [
      `future_projection:${projection.projectionId}`,
      ...(projection.evidence ?? []),
    ],
  };
  const reliability =
    projection.reliability === "guaranteed" &&
    setupStep.every((step) => step.reliability === "guaranteed")
      ? "guaranteed"
      : "contingent";
  const setupCreditCost = setupStep.reduce(
    (sum, step) => sum + step.creditCost,
    0,
  );
  return {
    optionId: `projection:${projection.projectionId}`,
    steps: [...setupStep, futureStep],
    currentTurnClickCost: setupStep.reduce(
      (sum, step) => sum + step.clickCost,
      0,
    ),
    eligibleCreditDelta: netGain - setupCreditCost,
    generalCreditDelta:
      (restriction === "general" ? netGain : 0) - setupCreditCost,
    creditCost: setupCreditCost,
    reliability,
    maximumTurnOffset: projection.earliestOwnTurnOffset,
    maximumUses: 1,
  };
}

function optionSupportsDemand(
  option: RouteOption,
  demand: CreditDemand,
): boolean {
  return option.steps
    .filter((step) => step.netLiquidCreditGain > 0)
    .every((step) =>
      demand.acceptedCreditRestrictions.includes(step.creditRestriction),
    );
}

function routeFromState(
  demand: CreditDemand,
  state: SearchState,
): FundingRoute {
  const projectedGap = Math.max(
    0,
    demand.targetCredits - state.eligibleCredits,
  );
  const status: FundingRouteStatus =
    state.steps.length === 0
      ? "funded"
      : state.reliability === "guaranteed"
        ? "covered_guaranteed"
        : "covered_contingent";
  const signature =
    state.steps.map((step) => step.stepId).join("+") || "funded";
  return {
    schemaVersion: FUNDING_ROUTE_SCHEMA_VERSION,
    routeId: `${demand.demandId}:${signature}`,
    demandId: demand.demandId,
    status,
    reliability: state.reliability,
    horizon: horizonForOffset(state.maximumTurnOffset),
    startingCredits: demand.currentCredits,
    targetCredits: demand.targetCredits,
    projectedCredits: state.eligibleCredits,
    projectedGeneralCredits: state.generalCredits,
    projectedGap,
    totalClickCost: state.steps.reduce((sum, step) => sum + step.clickCost, 0),
    steps: state.steps,
    invalidationReasons: [],
    evidence: [
      `funding_route_status:${status}`,
      `funding_route_reliability:${state.reliability}`,
      `funding_route_horizon:${horizonForOffset(state.maximumTurnOffset)}`,
      `funding_route_projected_credits:${state.eligibleCredits}`,
      `funding_route_projected_general_credits:${state.generalCredits}`,
      `funding_route_projected_gap:${projectedGap}`,
    ],
  };
}

function uncoveredRoute(demand: CreditDemand): FundingRoute {
  return {
    schemaVersion: FUNDING_ROUTE_SCHEMA_VERSION,
    routeId: `${demand.demandId}:uncovered`,
    demandId: demand.demandId,
    status: "uncovered",
    reliability: "contingent",
    horizon: "same_turn",
    startingCredits: demand.currentCredits,
    targetCredits: demand.targetCredits,
    projectedCredits: demand.currentCredits,
    projectedGeneralCredits: demand.currentCredits,
    projectedGap: demand.gap,
    totalClickCost: 0,
    steps: [],
    invalidationReasons: [],
    evidence: [
      "funding_route_status:uncovered",
      `funding_route_projected_gap:${demand.gap}`,
    ],
  };
}

function result(
  demand: CreditDemand,
  routes: FundingRoute[],
): FundingRouteSearchResult {
  const sorted = [...routes].sort(compareRoutes);
  return {
    demand,
    routes: sorted,
    bestRoute: sorted[0]!,
    evidence: [
      `funding_route_count:${sorted.length}`,
      `funding_route_best_status:${sorted[0]!.status}`,
      `funding_route_best_id:${sorted[0]!.routeId}`,
    ],
  };
}

function routeDominates(left: FundingRoute, right: FundingRoute): boolean {
  const noWorse =
    statusRank(left.status) >= statusRank(right.status) &&
    reliabilityRank(left.reliability) >= reliabilityRank(right.reliability) &&
    horizonRank(left.horizon) <= horizonRank(right.horizon) &&
    left.totalClickCost <= right.totalClickCost &&
    left.steps.length <= right.steps.length &&
    left.projectedCredits >= right.projectedCredits;
  const strictlyBetter =
    statusRank(left.status) > statusRank(right.status) ||
    reliabilityRank(left.reliability) > reliabilityRank(right.reliability) ||
    horizonRank(left.horizon) < horizonRank(right.horizon) ||
    left.totalClickCost < right.totalClickCost ||
    left.steps.length < right.steps.length ||
    left.projectedCredits > right.projectedCredits;
  return noWorse && strictlyBetter;
}

function compareRoutes(left: FundingRoute, right: FundingRoute): number {
  return (
    coverageRank(right.status) - coverageRank(left.status) ||
    horizonRank(left.horizon) - horizonRank(right.horizon) ||
    left.totalClickCost - right.totalClickCost ||
    left.steps.length - right.steps.length ||
    reliabilityRank(right.reliability) - reliabilityRank(left.reliability) ||
    right.projectedCredits - left.projectedCredits ||
    compareFrontLoadedLiquidGain(left, right) ||
    left.routeId.localeCompare(right.routeId)
  );
}

function compareFrontLoadedLiquidGain(
  left: FundingRoute,
  right: FundingRoute,
): number {
  const sharedLength = Math.min(left.steps.length, right.steps.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const gainDifference =
      right.steps[index]!.netLiquidCreditGain -
      left.steps[index]!.netLiquidCreditGain;
    if (gainDifference !== 0) return gainDifference;
  }
  return 0;
}

function compareOptions(left: RouteOption, right: RouteOption): number {
  return (
    reliabilityRank(right.reliability) - reliabilityRank(left.reliability) ||
    left.maximumTurnOffset - right.maximumTurnOffset ||
    right.eligibleCreditDelta - left.eligibleCreditDelta ||
    left.currentTurnClickCost - right.currentTurnClickCost ||
    left.optionId.localeCompare(right.optionId)
  );
}

function searchStateKey(state: SearchState): string {
  return [
    state.eligibleCredits,
    state.generalCredits,
    state.remainingClicks,
    state.reliability,
    state.maximumTurnOffset,
    [...state.optionUseCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([optionId, count]) => `${optionId}:${count}`)
      .join(","),
    state.steps.map((step) => step.stepId).join(","),
  ].join("|");
}

function deadlineAllows(
  deadline: CreditDemandDeadline,
  turnOffset: 0 | 1 | 2 | 3,
): boolean {
  switch (deadline) {
    case "before_current_plan_action":
    case "end_of_current_turn":
      return turnOffset === 0;
    case "start_of_next_own_turn":
      return turnOffset <= 1;
    case "within_three_own_turns":
      return turnOffset <= 3;
  }
}

function horizonForOffset(turnOffset: 0 | 1 | 2 | 3): FundingRouteHorizon {
  if (turnOffset === 0) return "same_turn";
  if (turnOffset === 1) return "next_own_turn";
  return "within_three_own_turns";
}

function statusRank(status: FundingRouteStatus): number {
  switch (status) {
    case "funded":
      return 4;
    case "covered_guaranteed":
      return 3;
    case "covered_contingent":
      return 2;
    case "uncovered":
      return 1;
    case "invalidated":
      return 0;
  }
}

function coverageRank(status: FundingRouteStatus): number {
  switch (status) {
    case "funded":
      return 3;
    case "covered_guaranteed":
    case "covered_contingent":
      return 2;
    case "uncovered":
      return 1;
    case "invalidated":
      return 0;
  }
}

function reliabilityRank(reliability: FundingRouteReliability): number {
  return reliability === "guaranteed" ? 1 : 0;
}

function horizonRank(horizon: FundingRouteHorizon): number {
  switch (horizon) {
    case "same_turn":
      return 0;
    case "next_own_turn":
      return 1;
    case "within_three_own_turns":
      return 2;
  }
}

function wholeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
