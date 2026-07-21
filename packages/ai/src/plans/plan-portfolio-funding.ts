import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  compareCreditDemandPriority,
  createCreditDemand,
  type CreditDemand,
} from "./credit-demand";
import {
  creditDemandHardBlockerIsResolved,
  revalidateFundingRoute,
  searchFundingRoutes,
  type FutureFundingProjection,
} from "./funding-route";
import type { PlanPortfolioEntry } from "./plan-portfolio-types";
import { createPlanStep } from "./tactical-plan-builders";
import type { PlanStep } from "./tactical-plan-types";

export type AllocatePlanPortfolioFundingParams = {
  input: AiDecisionInput;
  entries: readonly PlanPortfolioEntry[];
  candidates: readonly ActionSemanticCandidate[];
  futureFundingProjections?: readonly FutureFundingProjection[];
};

export type AllocatedPlanPortfolioFunding = {
  entries: PlanPortfolioEntry[];
  unallocatedCredits: number;
  unallocatedClicks: number;
  evidence: string[];
};

export function allocatePlanPortfolioFunding(
  params: AllocatePlanPortfolioFundingParams,
): AllocatedPlanPortfolioFunding {
  let unallocatedCredits = Math.max(
    0,
    Math.floor(params.input.playerView.own.credits),
  );
  let unallocatedClicks = Math.max(
    0,
    Math.floor(params.input.playerView.own.clicks),
  );
  const usedNonrepeatableActionIds = new Set<string>();
  const currentLegalActionIds = new Set(
    params.input.legalActions.map((action) => action.actionId),
  );
  const entries = params.entries.map((entry) => {
    const primaryDemand = primaryCreditDemand(entry.creditDemands ?? []);
    if (!primaryDemand) {
      const {
        selectedFundingRoute: _selectedRoute,
        fundingCoverageResolvesHardBlocker: _resolvedHardBlocker,
        ...entryWithoutRoute
      } = entry;
      return {
        ...entryWithoutRoute,
        fundingRoutes: [],
        resourceReservation: {
          ...entry.resourceReservation,
          credits: 0,
          requestedCredits: 0,
          shortfallCredits: 0,
        },
      };
    }
    const requestedCredits = primaryDemand.targetCredits;
    const allocatedCredits = Math.min(unallocatedCredits, requestedCredits);
    unallocatedCredits -= allocatedCredits;
    const allocatedDemand = demandWithCurrentCredits(
      primaryDemand,
      allocatedCredits,
    );
    const previousRoute = entry.selectedFundingRoute
      ? revalidateFundingRoute(
          entry.selectedFundingRoute,
          currentLegalActionIds,
        )
      : undefined;
    const availableCandidates = params.candidates.filter(
      (candidate) => !usedNonrepeatableActionIds.has(candidate.actionId),
    );
    const search = searchFundingRoutes({
      demand: allocatedDemand,
      candidates: availableCandidates,
      remainingClicks: unallocatedClicks,
      ...(params.futureFundingProjections
        ? { futureProjections: params.futureFundingProjections }
        : {}),
    });
    const selectedFundingRoute = search.bestRoute;
    const hardBlockerResolved =
      allocatedDemand.hardness === "hard" &&
      creditDemandHardBlockerIsResolved(allocatedDemand, selectedFundingRoute);
    const currentRouteSteps = selectedFundingRoute.steps.filter(
      (step) => step.kind === "legal_action" && step.ownTurnOffset === 0,
    );
    unallocatedClicks = Math.max(
      0,
      unallocatedClicks -
        currentRouteSteps.reduce((sum, step) => sum + step.clickCost, 0),
    );
    for (const step of currentRouteSteps) {
      if (!step.actionId) continue;
      const candidate = params.candidates.find(
        (item) => item.actionId === step.actionId,
      );
      if (candidate?.economyProjection?.repeatable !== true) {
        usedNonrepeatableActionIds.add(step.actionId);
      }
    }
    return {
      ...entry,
      creditDemands: (entry.creditDemands ?? []).map((demand) =>
        demand.demandId === allocatedDemand.demandId
          ? allocatedDemand
          : demandWithCurrentCredits(demand, 0),
      ),
      fundingRoutes: search.routes,
      selectedFundingRoute,
      fundingCoverageResolvesHardBlocker: hardBlockerResolved,
      resourceReservation: {
        ...entry.resourceReservation,
        credits: allocatedCredits,
        requestedCredits,
        shortfallCredits: Math.max(0, requestedCredits - allocatedCredits),
      },
      evidence: [
        ...entry.evidence,
        `plan_credit_reservation_requested:${requestedCredits}`,
        `plan_credit_reservation_allocated:${allocatedCredits}`,
        `plan_credit_reservation_shortfall:${Math.max(0, requestedCredits - allocatedCredits)}`,
        `plan_funding_route:${selectedFundingRoute.routeId}`,
        `plan_funding_route_status:${selectedFundingRoute.status}`,
        `plan_funding_hard_blocker_resolved:${hardBlockerResolved}`,
        ...(previousRoute?.status === "invalidated"
          ? previousRoute.evidence.filter((item) =>
              item.startsWith("route_invalidated:"),
            )
          : []),
      ],
    };
  });
  return {
    entries,
    unallocatedCredits,
    unallocatedClicks,
    evidence: [
      `plan_credit_allocation_entries:${entries.length}`,
      `plan_credit_allocation_unallocated:${unallocatedCredits}`,
      `plan_click_allocation_unallocated:${unallocatedClicks}`,
    ],
  };
}

export function planPortfolioFundingStep(
  entry: PlanPortfolioEntry,
  candidates: readonly ActionSemanticCandidate[],
): PlanStep | undefined {
  const route = entry.selectedFundingRoute;
  if (
    !route ||
    route.status === "funded" ||
    route.status === "uncovered" ||
    route.status === "invalidated"
  ) {
    return undefined;
  }
  const firstLegalStep = route.steps.find(
    (step) => step.kind === "legal_action" && step.ownTurnOffset === 0,
  );
  if (!firstLegalStep?.actionId) return undefined;
  const candidate = candidates.find(
    (item) => item.actionId === firstLegalStep.actionId,
  );
  const stepKind =
    candidate?.economyProjection?.kind === "stored_credit_build"
      ? "build_bank_counter"
      : "gain_credits";
  return createPlanStep({
    stepId: `funding_route:${route.routeId}`,
    kind: stepKind,
    desiredActionSemantics: ["economy.funding_route"],
    actionCandidateIds: [firstLegalStep.actionId],
    rationale: [
      `funding_route:${route.routeId}`,
      `funding_route_status:${route.status}`,
      `funding_route_demand:${route.demandId}`,
    ],
  });
}

export function fundingActionIdsForEntry(entry: PlanPortfolioEntry): string[] {
  const route = entry.selectedFundingRoute;
  if (!route || !route.status.startsWith("covered_")) return [];
  const firstLegal = route.steps.find(
    (step) => step.kind === "legal_action" && step.ownTurnOffset === 0,
  );
  return firstLegal?.actionId ? [firstLegal.actionId] : [];
}

function primaryCreditDemand(
  demands: readonly CreditDemand[],
): CreditDemand | undefined {
  return [...demands].sort(compareCreditDemandPriority)[0];
}

function demandWithCurrentCredits(
  demand: CreditDemand,
  currentCredits: number,
): CreditDemand {
  return createCreditDemand({
    ...demand,
    currentCredits,
    evidence: demand.evidence,
  });
}
