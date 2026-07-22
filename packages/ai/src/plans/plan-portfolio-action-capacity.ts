import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  actionDemandHardBlockerIsResolved,
  revalidateActionCapacityRoute,
  searchActionCapacityRoutes,
  type FutureActionCapacityProjection,
} from "./action-capacity-route";
import {
  compareActionDemandPriority,
  createActionDemand,
  type ActionDemand,
} from "./action-demand";
import type { PlanPortfolioEntry } from "./plan-portfolio-types";
import { createPlanStep } from "./tactical-plan-builders";
import type { PlanStep } from "./tactical-plan-types";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";

export type AllocatePlanPortfolioActionCapacityParams = {
  input: AiDecisionInput;
  entries: readonly PlanPortfolioEntry[];
  candidates: readonly ActionSemanticCandidate[];
  availableActions: number;
  availableCredits: number;
  reservedActionIds?: readonly string[];
  futureActionCapacityProjections?: readonly FutureActionCapacityProjection[];
};

export type AllocatedPlanPortfolioActionCapacity = {
  entries: PlanPortfolioEntry[];
  unallocatedActions: number;
  unallocatedCredits: number;
  reservedActionIds: string[];
  reservedSourceCounters: Record<string, number>;
  evidence: string[];
};

export function allocatePlanPortfolioActionCapacity(
  params: AllocatePlanPortfolioActionCapacityParams,
): AllocatedPlanPortfolioActionCapacity {
  let unallocatedActions = wholeNonNegative(params.availableActions);
  let unallocatedCredits = wholeNonNegative(params.availableCredits);
  const reservedActionIds = new Set(params.reservedActionIds ?? []);
  const reservedCardIds = new Set<string>();
  const reservedSourceCounters = new Map<string, number>();
  const visibleSourceCounters = visibleSourceCounterAmounts(
    params.input,
    params.candidates,
  );
  const currentLegalActionIds = new Set(
    params.input.legalActions.map((action) => action.actionId),
  );

  const entries = params.entries.map((entry) => {
    const primaryDemand = primaryActionDemand(entry.actionDemands ?? []);
    if (!primaryDemand) return withoutActionCapacityRoute(entry);

    const allocatedDemand = createActionDemand({
      ...primaryDemand,
      currentActions: unallocatedActions,
      evidence: primaryDemand.evidence,
    });
    const previousRoute = entry.selectedActionCapacityRoute
      ? revalidateActionCapacityRoute(
          entry.selectedActionCapacityRoute,
          currentLegalActionIds,
        )
      : undefined;
    const availableCandidates = params.candidates.filter(
      (candidate) =>
        !reservedActionIds.has(candidate.actionId) &&
        (!candidate.sourceCardInstanceId ||
          !reservedCardIds.has(candidate.sourceCardInstanceId)),
    );
    const search = searchActionCapacityRoutes({
      demand: allocatedDemand,
      candidates: availableCandidates,
      remainingActions: unallocatedActions,
      availableCredits: unallocatedCredits,
      visibleSourceCounterAmounts: subtractReservedCounters(
        visibleSourceCounters,
        reservedSourceCounters,
      ),
      ...(params.futureActionCapacityProjections
        ? { futureProjections: params.futureActionCapacityProjections }
        : {}),
    });
    const selectedActionCapacityRoute = search.bestRoute;
    const hardBlockerResolved =
      allocatedDemand.hardness === "hard" &&
      actionDemandHardBlockerIsResolved(
        allocatedDemand,
        selectedActionCapacityRoute,
      );
    const routeCanReservePlan =
      selectedActionCapacityRoute.status === "already_sufficient" ||
      selectedActionCapacityRoute.status === "covered_guaranteed";
    const currentRouteSteps = selectedActionCapacityRoute.steps.filter(
      (step) => step.kind === "legal_action" && step.ownTurnOffset === 0,
    );
    const routeNetActionDelta = currentRouteSteps.reduce(
      (sum, step) => sum + step.netCurrentTurnActionDelta,
      0,
    );
    const inlineDemandContribution = currentRouteSteps.reduce(
      (sum, step) => sum + (step.inlineDemandActionContribution ?? 0),
      0,
    );
    const requestedPlanActions = routeCanReservePlan
      ? Math.max(0, allocatedDemand.targetActions - inlineDemandContribution)
      : 0;
    const projectedActionPool = Math.max(
      0,
      unallocatedActions + routeNetActionDelta,
    );
    const reservedPlanActions = Math.min(
      projectedActionPool,
      requestedPlanActions,
    );
    const actionsBeforeReservation = unallocatedActions;
    unallocatedActions = Math.max(0, projectedActionPool - reservedPlanActions);
    unallocatedCredits = Math.max(
      0,
      unallocatedCredits - selectedActionCapacityRoute.totalCreditCost,
    );

    for (const step of currentRouteSteps) {
      if (step.actionId) reservedActionIds.add(step.actionId);
      if (step.cardsConsumed > 0 && step.sourceCardInstanceId)
        reservedCardIds.add(step.sourceCardInstanceId);
      if (
        step.sourceCardInstanceId &&
        step.sourceCounterType &&
        (step.sourceCounterCost ?? 0) > 0
      ) {
        const key = `${step.sourceCardInstanceId}:${step.sourceCounterType}`;
        reservedSourceCounters.set(
          key,
          (reservedSourceCounters.get(key) ?? 0) + step.sourceCounterCost!,
        );
      }
    }

    const sourceCounters = Object.fromEntries(
      currentRouteSteps.flatMap((step) => {
        if (
          !step.sourceCardInstanceId ||
          !step.sourceCounterType ||
          !step.sourceCounterCost
        )
          return [];
        return [
          [
            `${step.sourceCardInstanceId}:${step.sourceCounterType}`,
            step.sourceCounterCost,
          ],
        ];
      }),
    );
    const sourceCardInstanceIds = [
      ...new Set(
        currentRouteSteps.flatMap((step) =>
          step.sourceCardInstanceId ? [step.sourceCardInstanceId] : [],
        ),
      ),
    ].sort();

    return {
      ...entry,
      actionDemands: (entry.actionDemands ?? []).map((demand) =>
        demand.demandId === allocatedDemand.demandId
          ? allocatedDemand
          : createActionDemand({
              ...demand,
              currentActions: 0,
              evidence: demand.evidence,
            }),
      ),
      actionCapacityRoutes: search.routes,
      selectedActionCapacityRoute,
      actionCapacityCoverageResolvesHardBlocker: hardBlockerResolved,
      resourceReservation: {
        ...entry.resourceReservation,
        clicks: Math.max(0, actionsBeforeReservation - unallocatedActions),
        requestedActions: allocatedDemand.targetActions,
        shortfallActions: selectedActionCapacityRoute.projectedGap,
        sourceCounters,
        sourceCardInstanceIds,
      },
      evidence: [
        ...entry.evidence,
        `plan_action_reservation_requested:${allocatedDemand.targetActions}`,
        `plan_action_reservation_allocated:${reservedPlanActions}`,
        `plan_action_reservation_remaining:${unallocatedActions}`,
        `plan_action_capacity_route:${selectedActionCapacityRoute.routeId}`,
        `plan_action_capacity_route_status:${selectedActionCapacityRoute.status}`,
        `plan_action_capacity_hard_blocker_resolved:${hardBlockerResolved}`,
        ...(previousRoute?.status === "invalidated"
          ? previousRoute.invalidationReasons.map(
              (reason) => `action_route_invalidated:${reason}`,
            )
          : []),
      ],
    };
  });

  return {
    entries,
    unallocatedActions,
    unallocatedCredits,
    reservedActionIds: [...reservedActionIds].sort(),
    reservedSourceCounters: Object.fromEntries(
      [...reservedSourceCounters.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    evidence: [
      `plan_action_allocation_entries:${entries.length}`,
      `plan_action_allocation_unallocated:${unallocatedActions}`,
      `plan_action_allocation_credit_remainder:${unallocatedCredits}`,
    ],
  };
}

export function planPortfolioActionCapacityStep(
  entry: PlanPortfolioEntry,
): PlanStep | undefined {
  const route = entry.selectedActionCapacityRoute;
  if (
    !route ||
    route.status === "already_sufficient" ||
    route.status === "uncovered" ||
    route.status === "invalidated"
  )
    return undefined;
  const firstLegalStep = route.steps.find(
    (step) => step.kind === "legal_action" && step.ownTurnOffset === 0,
  );
  if (!firstLegalStep?.actionId) return undefined;
  return createPlanStep({
    stepId: `action_capacity_route:${route.routeId}`,
    kind: "gain_action_capacity",
    desiredActionSemantics: ["score_conversion.gain_action_capacity"],
    actionCandidateIds: [firstLegalStep.actionId],
    rationale: [
      `action_capacity_route:${route.routeId}`,
      `action_capacity_route_status:${route.status}`,
      `action_capacity_route_demand:${route.demandId}`,
    ],
  });
}

export function actionCapacityActionIdsForEntry(
  entry: PlanPortfolioEntry,
): string[] {
  const route = entry.selectedActionCapacityRoute;
  if (!route?.status.startsWith("covered_")) return [];
  const firstLegal = route.steps.find(
    (step) => step.kind === "legal_action" && step.ownTurnOffset === 0,
  );
  return firstLegal?.actionId ? [firstLegal.actionId] : [];
}

export function planPortfolioEntryHasGuaranteedActionCapacityRoute(params: {
  entry: PlanPortfolioEntry;
  candidates: readonly ActionSemanticCandidate[];
  remainingActions: number;
  availableCredits: number;
  input?: AiDecisionInput;
  futureActionCapacityProjections?: readonly FutureActionCapacityProjection[];
}): boolean {
  if (params.entry.lifecycle !== "blocked") return false;
  const demand = primaryActionDemand(params.entry.actionDemands ?? []);
  if (!demand || demand.gap <= 0) return false;
  const search = searchActionCapacityRoutes({
    demand,
    candidates: params.candidates,
    remainingActions: params.remainingActions,
    availableCredits: params.availableCredits,
    ...(params.input
      ? {
          visibleSourceCounterAmounts: visibleSourceCounterAmounts(
            params.input,
            params.candidates,
          ),
        }
      : {}),
    ...(params.futureActionCapacityProjections
      ? { futureProjections: params.futureActionCapacityProjections }
      : {}),
  });
  return demand.hardness === "hard"
    ? actionDemandHardBlockerIsResolved(demand, search.bestRoute)
    : search.bestRoute.status === "covered_guaranteed";
}

function withoutActionCapacityRoute(
  entry: PlanPortfolioEntry,
): PlanPortfolioEntry {
  const {
    selectedActionCapacityRoute: _selectedRoute,
    actionCapacityCoverageResolvesHardBlocker: _resolvedHardBlocker,
    ...entryWithoutRoute
  } = entry;
  return {
    ...entryWithoutRoute,
    actionCapacityRoutes: [],
    resourceReservation: {
      ...entry.resourceReservation,
      clicks: 0,
      requestedActions: 0,
      shortfallActions: 0,
      sourceCounters: {},
      sourceCardInstanceIds: [],
    },
  };
}

function primaryActionDemand(
  demands: readonly ActionDemand[],
): ActionDemand | undefined {
  return [...demands].sort(compareActionDemandPriority)[0];
}

function visibleSourceCounterAmounts(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): Record<string, number> {
  const amounts: Record<string, number> = {};
  for (const candidate of candidates) {
    const sourceCardInstanceId = candidate.sourceCardInstanceId;
    const sourceCounterType =
      candidate.actionCapacityProjection?.sourceCounterType;
    if (!sourceCardInstanceId || !sourceCounterType) continue;
    const card = visibleCardByInstanceId(
      input.playerView,
      sourceCardInstanceId,
    );
    const amount =
      sourceCounterType === "advancement"
        ? (card?.advancementCounters ?? 0)
        : ((card?.counters as Record<string, number> | undefined)?.[
            sourceCounterType
          ] ?? 0);
    amounts[`${sourceCardInstanceId}:${sourceCounterType}`] =
      wholeNonNegative(amount);
  }
  return amounts;
}

function subtractReservedCounters(
  available: Readonly<Record<string, number>>,
  reserved: ReadonlyMap<string, number>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(available).map(([key, amount]) => [
      key,
      Math.max(0, amount - (reserved.get(key) ?? 0)),
    ]),
  );
}

function wholeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
