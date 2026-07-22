import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  ActionDemand,
  ActionDemandDeadline,
  ActionDemandRestriction,
} from "./action-demand";

export const ACTION_CAPACITY_ROUTE_SCHEMA_VERSION =
  "action-capacity-route-v1" as const;

export type ActionCapacityRouteStatus =
  | "uncovered"
  | "covered_contingent"
  | "covered_guaranteed"
  | "already_sufficient"
  | "invalidated";
export type ActionCapacityRouteReliability = "guaranteed" | "contingent";
export type ActionCapacityRouteHorizon =
  | "same_turn"
  | "next_own_turn"
  | "within_three_own_turns";

export type ActionCapacityRouteStep = {
  stepId: string;
  kind: "legal_action" | "future_projection";
  actionId?: string;
  projectionId?: string;
  ownTurnOffset: 0 | 1 | 2 | 3;
  restriction: ActionDemandRestriction;
  listedActionCost: number;
  preExistingActionCost: number;
  creditCost: number;
  cardsConsumed: number;
  grossActionsGained: number;
  demandActionContribution: number;
  netCurrentTurnActionDelta: number;
  reliability: ActionCapacityRouteReliability;
  sourceCardInstanceId?: string;
  sourceDefinitionId?: string;
  sourceCounterType?: string;
  sourceCounterCost?: number;
  riskTags: string[];
  evidence: string[];
};

export type ActionCapacityRoute = {
  schemaVersion: typeof ACTION_CAPACITY_ROUTE_SCHEMA_VERSION;
  routeId: string;
  demandId: string;
  status: ActionCapacityRouteStatus;
  reliability: ActionCapacityRouteReliability;
  horizon: ActionCapacityRouteHorizon;
  startingActions: number;
  targetActions: number;
  projectedCompatibleActions: number;
  projectedActionPool: number;
  projectedGap: number;
  restrictionsUsed: ActionDemandRestriction[];
  totalPreExistingActionCost: number;
  totalCreditCost: number;
  totalCardsConsumed: number;
  totalSourceCountersConsumed: number;
  steps: ActionCapacityRouteStep[];
  invalidationReasons: string[];
  evidence: string[];
};

export type ActionCapacityActionCandidate = Pick<
  ActionSemanticCandidate,
  | "actionId"
  | "actionType"
  | "sourceDefinitionId"
  | "sourceCardInstanceId"
  | "costProfile"
  | "actionCapacityProjection"
>;

export type FutureActionCapacityProjection = {
  projectionId: string;
  actionsGained: number;
  restriction?: ActionDemandRestriction;
  earliestOwnTurnOffset: 1 | 2 | 3;
  reliability: ActionCapacityRouteReliability;
  requiredCurrentActionId?: string;
  sourceDefinitionId?: string;
  evidence?: readonly string[];
};

export type SearchActionCapacityRoutesParams = {
  demand: ActionDemand;
  candidates: readonly ActionCapacityActionCandidate[];
  remainingActions: number;
  availableCredits?: number;
  visibleSourceCounterAmounts?: Readonly<Record<string, number>>;
  futureProjections?: readonly FutureActionCapacityProjection[];
  maxSteps?: number;
  maxRoutes?: number;
};

export type ActionCapacityRouteSearchResult = {
  demand: ActionDemand;
  routes: ActionCapacityRoute[];
  bestRoute: ActionCapacityRoute;
  evidence: string[];
};

type RouteOption = {
  optionId: string;
  steps: ActionCapacityRouteStep[];
  currentActionPoolDelta: number;
  unrestrictedActionDelta: number;
  compatibleActionDelta: number;
  inlineDemandContribution: number;
  currentActivationActionCost: number;
  creditCost: number;
  cardsConsumed: number;
  reliability: ActionCapacityRouteReliability;
  maximumTurnOffset: 0 | 1 | 2 | 3;
  sourceCounterKey?: string;
  sourceCounterCost: number;
  consumedCardKey?: string;
};

type SearchState = {
  steps: ActionCapacityRouteStep[];
  compatibleActions: number;
  inlineDemandContribution: number;
  actionPool: number;
  unrestrictedActions: number;
  credits: number;
  reliability: ActionCapacityRouteReliability;
  maximumTurnOffset: 0 | 1 | 2 | 3;
  usedOptionIds: Set<string>;
  consumedCardKeys: Set<string>;
  sourceCountersSpent: Map<string, number>;
};

export function searchActionCapacityRoutes(
  params: SearchActionCapacityRoutesParams,
): ActionCapacityRouteSearchResult {
  const initialState: SearchState = {
    steps: [],
    compatibleActions: params.demand.currentActions,
    inlineDemandContribution: 0,
    actionPool: wholeNonNegative(params.remainingActions),
    unrestrictedActions: wholeNonNegative(params.remainingActions),
    credits: wholeNonNegative(params.availableCredits ?? 0),
    reliability: "guaranteed",
    maximumTurnOffset: 0,
    usedOptionIds: new Set(),
    consumedCardKeys: new Set(),
    sourceCountersSpent: new Map(),
  };
  if (params.demand.gap === 0) {
    return result(params.demand, [routeFromState(params.demand, initialState)]);
  }

  const sameTurn =
    deadlineAllows(params.demand.deadline, 0) &&
    !deadlineRequiresFuture(params.demand.deadline);
  const currentOptions = sameTurn
    ? params.candidates
        .map((candidate) => currentActionOption(candidate, params.demand))
        .filter((option): option is RouteOption => option !== undefined)
    : [];
  const candidateFutureOptions = params.candidates
    .map((candidate) => futureCandidateOption(candidate, params.demand))
    .filter((option): option is RouteOption => option !== undefined);
  const explicitFutureOptions = (params.futureProjections ?? [])
    .map((projection) =>
      futureProjectionOption(projection, params.candidates, params.demand),
    )
    .filter((option): option is RouteOption => option !== undefined);
  const options = [
    ...currentOptions,
    ...candidateFutureOptions,
    ...explicitFutureOptions,
  ].sort(compareOptions);
  const maxSteps = Math.max(1, Math.min(8, params.maxSteps ?? 4));
  const maxRoutes = Math.max(1, Math.min(32, params.maxRoutes ?? 8));
  const queue: SearchState[] = [initialState];
  const covered: ActionCapacityRoute[] = [];
  const visited = new Set<string>();

  while (queue.length > 0 && covered.length < maxRoutes * 4) {
    const state = queue.shift()!;
    if (state.steps.length >= maxSteps) continue;
    for (const option of options) {
      if (state.usedOptionIds.has(option.optionId)) continue;
      if (option.currentActivationActionCost > state.unrestrictedActions)
        continue;
      if (option.creditCost > state.credits) continue;
      if (state.steps.length + option.steps.length > maxSteps) continue;
      if (!deadlineAllows(params.demand.deadline, option.maximumTurnOffset))
        continue;
      if (
        option.consumedCardKey &&
        state.consumedCardKeys.has(option.consumedCardKey)
      )
        continue;
      if (!sourceCounterAvailable(option, state, params)) continue;

      const next: SearchState = {
        steps: [...state.steps, ...option.steps],
        compatibleActions:
          state.compatibleActions + option.compatibleActionDelta,
        inlineDemandContribution:
          state.inlineDemandContribution + option.inlineDemandContribution,
        actionPool: state.actionPool + option.currentActionPoolDelta,
        unrestrictedActions:
          state.unrestrictedActions + option.unrestrictedActionDelta,
        credits: state.credits - option.creditCost,
        reliability:
          state.reliability === "guaranteed" &&
          option.reliability === "guaranteed"
            ? "guaranteed"
            : "contingent",
        maximumTurnOffset: Math.max(
          state.maximumTurnOffset,
          option.maximumTurnOffset,
        ) as 0 | 1 | 2 | 3,
        usedOptionIds: new Set([...state.usedOptionIds, option.optionId]),
        consumedCardKeys: new Set([
          ...state.consumedCardKeys,
          ...(option.consumedCardKey ? [option.consumedCardKey] : []),
        ]),
        sourceCountersSpent: addSourceCounterSpend(
          state.sourceCountersSpent,
          option,
        ),
      };
      const stateKey = searchStateKey(next);
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);
      if (compatibleActions(next) >= params.demand.targetActions) {
        covered.push(routeFromState(params.demand, next));
      } else {
        queue.push(next);
      }
    }
  }

  const routes = pruneDominatedActionCapacityRoutes(covered).slice(
    0,
    maxRoutes,
  );
  if (routes.length === 0) routes.push(uncoveredRoute(params.demand));
  return result(params.demand, routes);
}

export function actionDemandHardBlockerIsResolved(
  demand: ActionDemand,
  route: ActionCapacityRoute,
): boolean {
  if (demand.hardness !== "hard") return route.status !== "uncovered";
  return (
    route.status === "already_sufficient" ||
    route.status === "covered_guaranteed"
  );
}

export function revalidateActionCapacityRoute(
  route: ActionCapacityRoute,
  currentLegalActionIds: ReadonlySet<string>,
): ActionCapacityRoute {
  if (route.status === "already_sufficient" || route.status === "invalidated")
    return route;
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
      ...missing.map((actionId) => `action_route_invalidated:${actionId}`),
    ],
  };
}

export function pruneDominatedActionCapacityRoutes(
  routes: readonly ActionCapacityRoute[],
): ActionCapacityRoute[] {
  return routes
    .filter(
      (route, index) =>
        !routes.some(
          (other, otherIndex) =>
            otherIndex !== index && actionRouteDominates(other, route),
        ),
    )
    .sort(compareRoutes);
}

function currentActionOption(
  candidate: ActionCapacityActionCandidate,
  demand: ActionDemand,
): RouteOption | undefined {
  const projection = candidate.actionCapacityProjection;
  if (
    !projection ||
    !["immediate_unrestricted_gain", "immediate_restricted_gain"].includes(
      projection.kind,
    ) ||
    projection.timing !== "immediate" ||
    projection.grossActionsGained <= 0
  )
    return undefined;
  const restriction = demandRestriction(projection.restriction);
  if (
    !restriction ||
    !restrictionSupportsDemand(
      restriction,
      projection.allowedActionTypes,
      demand,
    )
  )
    return undefined;
  const inlineDemandContribution =
    projection.selfFinancing &&
    actionTypesSupportDemand(projection.allowedActionTypes, demand)
      ? projection.generatedActionsConsumedByCurrentAction
      : 0;
  const reliability =
    projection.reliability === "guaranteed" ? "guaranteed" : "contingent";
  const creditCost = wholeNonNegative(candidate.costProfile.creditCost ?? 0);
  const cardsConsumed = cardConsumption(candidate.actionType);
  const riskTags = costRiskTags(candidate);
  const effectiveReliability =
    reliability === "guaranteed" && riskTags.length === 0
      ? "guaranteed"
      : "contingent";
  const sourceCounterKey = counterKey(candidate);
  const step: ActionCapacityRouteStep = {
    stepId: `legal_action:${candidate.actionId}`,
    kind: "legal_action",
    actionId: candidate.actionId,
    ownTurnOffset: 0,
    restriction,
    listedActionCost: projection.listedActionCost,
    preExistingActionCost: projection.preExistingActionCost,
    creditCost,
    cardsConsumed,
    grossActionsGained: projection.grossActionsGained,
    demandActionContribution:
      projection.followupActionCapacity + inlineDemandContribution,
    netCurrentTurnActionDelta: projection.netCurrentTurnActionDelta,
    reliability: effectiveReliability,
    ...(candidate.sourceCardInstanceId
      ? { sourceCardInstanceId: candidate.sourceCardInstanceId }
      : {}),
    ...(candidate.sourceDefinitionId
      ? { sourceDefinitionId: candidate.sourceDefinitionId }
      : {}),
    ...(projection.sourceCounterType
      ? { sourceCounterType: projection.sourceCounterType }
      : {}),
    ...(projection.sourceCounterCost !== undefined
      ? { sourceCounterCost: projection.sourceCounterCost }
      : {}),
    riskTags,
    evidence: [
      `legal_action:${candidate.actionId}`,
      ...projection.evidence,
      ...riskTags.map((risk) => `risk:${risk}`),
    ],
  };
  return {
    optionId: `action:${candidate.actionId}`,
    steps: [step],
    currentActionPoolDelta: projection.netCurrentTurnActionDelta,
    unrestrictedActionDelta:
      -projection.preExistingActionCost +
      (restriction === "unrestricted" ? projection.followupActionCapacity : 0),
    compatibleActionDelta:
      -projection.preExistingActionCost + projection.followupActionCapacity,
    inlineDemandContribution,
    currentActivationActionCost: projection.preExistingActionCost,
    creditCost,
    cardsConsumed,
    reliability: effectiveReliability,
    maximumTurnOffset: 0,
    ...(sourceCounterKey ? { sourceCounterKey } : {}),
    sourceCounterCost: wholeNonNegative(projection.sourceCounterCost ?? 0),
    ...(cardsConsumed > 0 && candidate.sourceCardInstanceId
      ? { consumedCardKey: candidate.sourceCardInstanceId }
      : {}),
  };
}

function futureCandidateOption(
  candidate: ActionCapacityActionCandidate,
  demand: ActionDemand,
): RouteOption | undefined {
  const projection = candidate.actionCapacityProjection;
  if (
    projection?.kind !== "future_recurring_gain" ||
    projection.gainAmountPerTurn === undefined ||
    !deadlineAllows(demand.deadline, 1)
  )
    return undefined;
  const restriction = demandRestriction(projection.restriction);
  if (!restriction || !restrictionSupportsDemand(restriction, [], demand))
    return undefined;
  const creditCost = wholeNonNegative(candidate.costProfile.creditCost ?? 0);
  const setupStep: ActionCapacityRouteStep = {
    stepId: `legal_action:${candidate.actionId}`,
    kind: "legal_action",
    actionId: candidate.actionId,
    ownTurnOffset: 0,
    restriction: "unrestricted",
    listedActionCost: projection.listedActionCost,
    preExistingActionCost: projection.preExistingActionCost,
    creditCost,
    cardsConsumed: cardConsumption(candidate.actionType),
    grossActionsGained: 0,
    demandActionContribution: 0,
    netCurrentTurnActionDelta: -projection.listedActionCost,
    reliability: "contingent",
    ...(candidate.sourceCardInstanceId
      ? { sourceCardInstanceId: candidate.sourceCardInstanceId }
      : {}),
    ...(candidate.sourceDefinitionId
      ? { sourceDefinitionId: candidate.sourceDefinitionId }
      : {}),
    riskTags: ["future_projection"],
    evidence: [`future_action_setup:${candidate.actionId}`],
  };
  const futureStep: ActionCapacityRouteStep = {
    stepId: `future_projection:${candidate.actionId}`,
    kind: "future_projection",
    projectionId: `future:${candidate.actionId}`,
    ownTurnOffset: 1,
    restriction,
    listedActionCost: 0,
    preExistingActionCost: 0,
    creditCost: 0,
    cardsConsumed: 0,
    grossActionsGained: projection.gainAmountPerTurn,
    demandActionContribution: projection.gainAmountPerTurn,
    netCurrentTurnActionDelta: 0,
    reliability: "contingent",
    ...(candidate.sourceDefinitionId
      ? { sourceDefinitionId: candidate.sourceDefinitionId }
      : {}),
    riskTags: ["future_projection"],
    evidence: [
      `future_projection:${candidate.actionId}`,
      ...projection.evidence,
    ],
  };
  return {
    optionId: `future_action:${candidate.actionId}`,
    steps: [setupStep, futureStep],
    currentActionPoolDelta: -projection.listedActionCost,
    unrestrictedActionDelta: -projection.preExistingActionCost,
    compatibleActionDelta: projection.gainAmountPerTurn,
    inlineDemandContribution: 0,
    currentActivationActionCost: projection.preExistingActionCost,
    creditCost,
    cardsConsumed: setupStep.cardsConsumed,
    reliability: "contingent",
    maximumTurnOffset: 1,
    sourceCounterCost: 0,
    ...(setupStep.cardsConsumed > 0 && candidate.sourceCardInstanceId
      ? { consumedCardKey: candidate.sourceCardInstanceId }
      : {}),
  };
}

function futureProjectionOption(
  projection: FutureActionCapacityProjection,
  candidates: readonly ActionCapacityActionCandidate[],
  demand: ActionDemand,
): RouteOption | undefined {
  const actionsGained = wholeNonNegative(projection.actionsGained);
  const restriction = projection.restriction ?? "unrestricted";
  if (
    actionsGained <= 0 ||
    !deadlineAllows(demand.deadline, projection.earliestOwnTurnOffset) ||
    !restrictionSupportsDemand(restriction, [], demand)
  )
    return undefined;
  const setupCandidate = projection.requiredCurrentActionId
    ? candidates.find(
        (candidate) =>
          candidate.actionId === projection.requiredCurrentActionId,
      )
    : undefined;
  if (projection.requiredCurrentActionId && !setupCandidate) return undefined;
  const setup = setupCandidate?.actionCapacityProjection;
  const setupListedActionCost = wholeNonNegative(
    setup?.listedActionCost ?? setupCandidate?.costProfile.clickCost ?? 0,
  );
  const setupPreExistingActionCost = wholeNonNegative(
    setup?.preExistingActionCost ?? setupCandidate?.costProfile.clickCost ?? 0,
  );
  const setupCreditCost = wholeNonNegative(
    setupCandidate?.costProfile.creditCost ?? 0,
  );
  const setupCardsConsumed = setupCandidate
    ? cardConsumption(setupCandidate.actionType)
    : 0;
  const setupSteps: ActionCapacityRouteStep[] = setupCandidate
    ? [
        {
          stepId: `legal_action:${setupCandidate.actionId}`,
          kind: "legal_action",
          actionId: setupCandidate.actionId,
          ownTurnOffset: 0,
          restriction: "unrestricted",
          listedActionCost: setupListedActionCost,
          preExistingActionCost: setupPreExistingActionCost,
          creditCost: setupCreditCost,
          cardsConsumed: setupCardsConsumed,
          grossActionsGained: 0,
          demandActionContribution: 0,
          netCurrentTurnActionDelta: -setupListedActionCost,
          reliability: "contingent",
          ...(setupCandidate.sourceCardInstanceId
            ? { sourceCardInstanceId: setupCandidate.sourceCardInstanceId }
            : {}),
          ...(setupCandidate.sourceDefinitionId
            ? { sourceDefinitionId: setupCandidate.sourceDefinitionId }
            : {}),
          riskTags: ["future_projection"],
          evidence: [`future_projection_setup:${setupCandidate.actionId}`],
        },
      ]
    : [];
  const futureStep: ActionCapacityRouteStep = {
    stepId: `future_projection:${projection.projectionId}`,
    kind: "future_projection",
    projectionId: projection.projectionId,
    ownTurnOffset: projection.earliestOwnTurnOffset,
    restriction,
    listedActionCost: 0,
    preExistingActionCost: 0,
    creditCost: 0,
    cardsConsumed: 0,
    grossActionsGained: actionsGained,
    demandActionContribution: actionsGained,
    netCurrentTurnActionDelta: 0,
    reliability: "contingent",
    ...(projection.sourceDefinitionId
      ? { sourceDefinitionId: projection.sourceDefinitionId }
      : {}),
    riskTags: ["future_projection"],
    evidence: [
      `future_projection:${projection.projectionId}`,
      ...(projection.evidence ?? []),
    ],
  };
  return {
    optionId: `projection:${projection.projectionId}`,
    steps: [...setupSteps, futureStep],
    currentActionPoolDelta: -setupListedActionCost,
    unrestrictedActionDelta: -setupPreExistingActionCost,
    compatibleActionDelta: actionsGained,
    inlineDemandContribution: 0,
    currentActivationActionCost: setupPreExistingActionCost,
    creditCost: setupCreditCost,
    cardsConsumed: setupCardsConsumed,
    reliability: "contingent",
    maximumTurnOffset: projection.earliestOwnTurnOffset,
    sourceCounterCost: 0,
    ...(setupCardsConsumed > 0 && setupCandidate?.sourceCardInstanceId
      ? { consumedCardKey: setupCandidate.sourceCardInstanceId }
      : {}),
  };
}

function routeFromState(
  demand: ActionDemand,
  state: SearchState,
): ActionCapacityRoute {
  const projectedCompatibleActions = compatibleActions(state);
  const projectedGap = Math.max(
    0,
    demand.targetActions - projectedCompatibleActions,
  );
  const status: ActionCapacityRouteStatus =
    state.steps.length === 0
      ? "already_sufficient"
      : state.reliability === "guaranteed"
        ? "covered_guaranteed"
        : "covered_contingent";
  const signature =
    state.steps.map((step) => step.stepId).join("+") || "already_sufficient";
  const totalPreExistingActionCost = state.steps.reduce(
    (sum, step) => sum + step.preExistingActionCost,
    0,
  );
  const totalCreditCost = state.steps.reduce(
    (sum, step) => sum + step.creditCost,
    0,
  );
  const totalCardsConsumed = state.steps.reduce(
    (sum, step) => sum + step.cardsConsumed,
    0,
  );
  const totalSourceCountersConsumed = state.steps.reduce(
    (sum, step) => sum + (step.sourceCounterCost ?? 0),
    0,
  );
  const restrictionsUsed = uniqueRestrictions(
    state.steps
      .filter((step) => step.grossActionsGained > 0)
      .map((step) => step.restriction),
  );
  return {
    schemaVersion: ACTION_CAPACITY_ROUTE_SCHEMA_VERSION,
    routeId: `${demand.demandId}:${signature}`,
    demandId: demand.demandId,
    status,
    reliability: state.reliability,
    horizon: horizonForOffset(state.maximumTurnOffset),
    startingActions: demand.currentActions,
    targetActions: demand.targetActions,
    projectedCompatibleActions,
    projectedActionPool: state.actionPool,
    projectedGap,
    restrictionsUsed,
    totalPreExistingActionCost,
    totalCreditCost,
    totalCardsConsumed,
    totalSourceCountersConsumed,
    steps: state.steps,
    invalidationReasons: [],
    evidence: [
      `action_route_status:${status}`,
      `action_route_reliability:${state.reliability}`,
      `action_route_horizon:${horizonForOffset(state.maximumTurnOffset)}`,
      `action_route_projected_compatible:${projectedCompatibleActions}`,
      `action_route_projected_pool:${state.actionPool}`,
      `action_route_projected_gap:${projectedGap}`,
    ],
  };
}

function uncoveredRoute(demand: ActionDemand): ActionCapacityRoute {
  return {
    schemaVersion: ACTION_CAPACITY_ROUTE_SCHEMA_VERSION,
    routeId: `${demand.demandId}:uncovered`,
    demandId: demand.demandId,
    status: "uncovered",
    reliability: "contingent",
    horizon: horizonForDeadline(demand.deadline),
    startingActions: demand.currentActions,
    targetActions: demand.targetActions,
    projectedCompatibleActions: demand.currentActions,
    projectedActionPool: demand.currentActions,
    projectedGap: demand.gap,
    restrictionsUsed: [],
    totalPreExistingActionCost: 0,
    totalCreditCost: 0,
    totalCardsConsumed: 0,
    totalSourceCountersConsumed: 0,
    steps: [],
    invalidationReasons: [],
    evidence: [
      "action_route_status:uncovered",
      `action_route_projected_gap:${demand.gap}`,
    ],
  };
}

function result(
  demand: ActionDemand,
  routes: ActionCapacityRoute[],
): ActionCapacityRouteSearchResult {
  const sorted = [...routes].sort(compareRoutes);
  return {
    demand,
    routes: sorted,
    bestRoute: sorted[0]!,
    evidence: [
      `action_route_count:${sorted.length}`,
      `action_route_best_status:${sorted[0]!.status}`,
      `action_route_best_id:${sorted[0]!.routeId}`,
    ],
  };
}

function sourceCounterAvailable(
  option: RouteOption,
  state: SearchState,
  params: SearchActionCapacityRoutesParams,
): boolean {
  if (!option.sourceCounterKey || option.sourceCounterCost <= 0) return true;
  const spent = state.sourceCountersSpent.get(option.sourceCounterKey) ?? 0;
  const available = wholeNonNegative(
    params.visibleSourceCounterAmounts?.[option.sourceCounterKey] ??
      option.sourceCounterCost,
  );
  return spent + option.sourceCounterCost <= available;
}

function addSourceCounterSpend(
  current: ReadonlyMap<string, number>,
  option: RouteOption,
): Map<string, number> {
  const next = new Map(current);
  if (option.sourceCounterKey && option.sourceCounterCost > 0)
    next.set(
      option.sourceCounterKey,
      (next.get(option.sourceCounterKey) ?? 0) + option.sourceCounterCost,
    );
  return next;
}

function counterKey(
  candidate: ActionCapacityActionCandidate,
): string | undefined {
  const projection = candidate.actionCapacityProjection;
  if (
    !candidate.sourceCardInstanceId ||
    !projection?.sourceCounterType ||
    !projection.sourceCounterCost
  )
    return undefined;
  return `${candidate.sourceCardInstanceId}:${projection.sourceCounterType}`;
}

function costRiskTags(candidate: ActionCapacityActionCandidate): string[] {
  const risks: string[] = [];
  if ((candidate.costProfile.selfDamage?.length ?? 0) > 0)
    risks.push("self_damage");
  if ((candidate.costProfile.selfTag ?? 0) > 0) risks.push("self_tag");
  if (candidate.costProfile.forfeitAgenda === true)
    risks.push("forfeit_agenda");
  if (candidate.costProfile.variableCost) risks.push("variable_cost");
  return risks;
}

function cardConsumption(actionType: string): number {
  return actionType === "play_operation" || actionType === "play_event" ? 1 : 0;
}

function demandRestriction(
  restriction: string,
): ActionDemandRestriction | undefined {
  if (
    restriction === "unrestricted" ||
    restriction === "install_only" ||
    restriction === "program_install_only" ||
    restriction === "run_only"
  )
    return restriction;
  return undefined;
}

function restrictionSupportsDemand(
  restriction: ActionDemandRestriction,
  allowedActionTypes: readonly string[],
  demand: ActionDemand,
): boolean {
  return (
    demand.acceptedRestrictions.includes(restriction) &&
    actionTypesSupportDemand(allowedActionTypes, demand)
  );
}

function actionTypesSupportDemand(
  allowedActionTypes: readonly string[],
  demand: ActionDemand,
): boolean {
  if (
    demand.requiredActionTypes.length === 0 ||
    allowedActionTypes.length === 0
  )
    return true;
  return allowedActionTypes.some((actionType) =>
    demand.requiredActionTypes.includes(actionType),
  );
}

function compatibleActions(state: SearchState): number {
  return Math.max(0, state.compatibleActions + state.inlineDemandContribution);
}

function actionRouteDominates(
  left: ActionCapacityRoute,
  right: ActionCapacityRoute,
): boolean {
  if (left.restrictionsUsed.join(",") !== right.restrictionsUsed.join(","))
    return false;
  const noWorse =
    statusRank(left.status) >= statusRank(right.status) &&
    reliabilityRank(left.reliability) >= reliabilityRank(right.reliability) &&
    horizonRank(left.horizon) <= horizonRank(right.horizon) &&
    left.totalPreExistingActionCost <= right.totalPreExistingActionCost &&
    left.totalCreditCost <= right.totalCreditCost &&
    left.totalCardsConsumed <= right.totalCardsConsumed &&
    left.totalSourceCountersConsumed <= right.totalSourceCountersConsumed &&
    left.steps.length <= right.steps.length &&
    left.projectedCompatibleActions >= right.projectedCompatibleActions;
  const strictlyBetter =
    statusRank(left.status) > statusRank(right.status) ||
    reliabilityRank(left.reliability) > reliabilityRank(right.reliability) ||
    horizonRank(left.horizon) < horizonRank(right.horizon) ||
    left.totalPreExistingActionCost < right.totalPreExistingActionCost ||
    left.totalCreditCost < right.totalCreditCost ||
    left.totalCardsConsumed < right.totalCardsConsumed ||
    left.totalSourceCountersConsumed < right.totalSourceCountersConsumed ||
    left.steps.length < right.steps.length ||
    left.projectedCompatibleActions > right.projectedCompatibleActions;
  return noWorse && strictlyBetter;
}

function compareRoutes(
  left: ActionCapacityRoute,
  right: ActionCapacityRoute,
): number {
  return (
    coverageRank(right.status) - coverageRank(left.status) ||
    reliabilityRank(right.reliability) - reliabilityRank(left.reliability) ||
    horizonRank(left.horizon) - horizonRank(right.horizon) ||
    left.totalPreExistingActionCost - right.totalPreExistingActionCost ||
    left.totalCreditCost - right.totalCreditCost ||
    left.totalCardsConsumed - right.totalCardsConsumed ||
    left.steps.length - right.steps.length ||
    right.projectedCompatibleActions - left.projectedCompatibleActions ||
    left.routeId.localeCompare(right.routeId)
  );
}

function compareOptions(left: RouteOption, right: RouteOption): number {
  return (
    reliabilityRank(right.reliability) - reliabilityRank(left.reliability) ||
    left.maximumTurnOffset - right.maximumTurnOffset ||
    right.compatibleActionDelta +
      right.inlineDemandContribution -
      (left.compatibleActionDelta + left.inlineDemandContribution) ||
    left.currentActivationActionCost - right.currentActivationActionCost ||
    left.creditCost - right.creditCost ||
    left.optionId.localeCompare(right.optionId)
  );
}

function searchStateKey(state: SearchState): string {
  return [
    state.compatibleActions,
    state.inlineDemandContribution,
    state.actionPool,
    state.unrestrictedActions,
    state.credits,
    state.reliability,
    state.maximumTurnOffset,
    [...state.usedOptionIds].sort().join(","),
    [...state.consumedCardKeys].sort().join(","),
    [...state.sourceCountersSpent.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, amount]) => `${key}:${amount}`)
      .join(","),
  ].join("|");
}

function deadlineRequiresFuture(deadline: ActionDemandDeadline): boolean {
  return (
    deadline === "start_of_next_own_turn" ||
    deadline === "within_three_own_turns"
  );
}

function deadlineAllows(
  deadline: ActionDemandDeadline,
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

function horizonForDeadline(
  deadline: ActionDemandDeadline,
): ActionCapacityRouteHorizon {
  if (deadline === "start_of_next_own_turn") return "next_own_turn";
  if (deadline === "within_three_own_turns") return "within_three_own_turns";
  return "same_turn";
}

function horizonForOffset(
  turnOffset: 0 | 1 | 2 | 3,
): ActionCapacityRouteHorizon {
  if (turnOffset === 0) return "same_turn";
  if (turnOffset === 1) return "next_own_turn";
  return "within_three_own_turns";
}

function statusRank(status: ActionCapacityRouteStatus): number {
  switch (status) {
    case "already_sufficient":
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

function coverageRank(status: ActionCapacityRouteStatus): number {
  switch (status) {
    case "already_sufficient":
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

function reliabilityRank(reliability: ActionCapacityRouteReliability): number {
  return reliability === "guaranteed" ? 1 : 0;
}

function horizonRank(horizon: ActionCapacityRouteHorizon): number {
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

function uniqueRestrictions(
  restrictions: readonly ActionDemandRestriction[],
): ActionDemandRestriction[] {
  return [...new Set(restrictions)].sort();
}
