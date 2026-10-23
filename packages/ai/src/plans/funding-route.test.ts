import { describe, expect, it } from "vitest";

import type { ActionEconomyProjection } from "../action-semantic-candidate-types";
import {
  createCorpCreditDemand,
  createRunnerCreditDemand,
} from "./credit-demand";
import {
  creditDemandHardBlockerIsResolved,
  revalidateFundingRoute,
  searchFundingRoutes,
  type FundingActionCandidate,
} from "./funding-route";

describe("funding routes", () => {
  it("compares the owner's equal-cost collateral before limiting routes", () => {
    const result = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 0, targetCredits: 1 }),
      candidates: [
        liquidCandidate("a-credit", 1),
        liquidCandidate("z-credit-draw", 1),
      ],
      remainingClicks: 1,
      maxRoutes: 1,
      compareEquivalentRoutes: (left, right) =>
        right.routeId.localeCompare(left.routeId),
    });
    expect(result.routes).toHaveLength(1);
    expect(result.bestRoute.steps[0]?.actionId).toBe("z-credit-draw");
  });

  it("preserves greater cash and faster coverage ahead of collateral", () => {
    const slower = liquidCandidate("z-slower", 1);
    slower.economyProjection!.clickCost = 2;
    for (const competitor of [liquidCandidate("z-smaller", 1), slower]) {
      const result = searchFundingRoutes({
        demand: runnerDemand({ currentCredits: 0, targetCredits: 1 }),
        candidates: [liquidCandidate("a-larger", 2), competitor],
        remainingClicks: 2,
        compareEquivalentRoutes: (left, right) =>
          right.routeId.localeCompare(left.routeId),
      });
      expect(result.bestRoute.steps[0]?.actionId).toBe("a-larger");
    }
  });

  it("does not call equal-cost collateral for different upfront costs", () => {
    let comparisons = 0;
    const result = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 1, targetCredits: 2 }),
      candidates: [
        liquidCandidate("a-credit", 1),
        liquidCandidate("z-credit-draw", 2, { creditCost: 1 }),
      ],
      remainingClicks: 1,
      compareEquivalentRoutes: (left, right) => {
        comparisons += 1;
        return right.routeId.localeCompare(left.routeId);
      },
    });
    expect(comparisons).toBe(0);
    expect(result.bestRoute.steps[0]?.actionId).toBe("a-credit");
  });

  it("continues past credit coverage when the bound consumer still needs a quoted draw-tax reserve", () => {
    const result = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 0, targetCredits: 4 }),
      candidates: [
        liquidCandidate("funding-event", 4),
        liquidCandidate("basic-credit", 1, { repeatable: true }),
      ],
      remainingClicks: 2,
      acceptRoute: (route) => route.projectedGeneralCredits >= 5,
    });
    expect(result.bestRoute).toMatchObject({
      status: "covered_guaranteed",
      projectedCredits: 5,
      totalClickCost: 2,
    });
    expect(result.bestRoute.steps.map((step) => step.actionId)).toEqual([
      "funding-event",
      "basic-credit",
    ]);
  });

  it("recognizes an already funded demand without adding actions", () => {
    const result = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 5, targetCredits: 4 }),
      candidates: [],
      remainingClicks: 3,
    });

    expect(result.bestRoute).toMatchObject({
      status: "funded",
      reliability: "guaranteed",
      steps: [],
      projectedGap: 0,
    });
  });

  it("repeats the legal basic credit action within the same-turn click bound", () => {
    const result = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 0, targetCredits: 3 }),
      candidates: [liquidCandidate("basic-credit", 1, { repeatable: true })],
      remainingClicks: 3,
    });

    expect(result.bestRoute).toMatchObject({
      status: "covered_guaranteed",
      horizon: "same_turn",
      projectedCredits: 3,
      totalClickCost: 3,
    });
    expect(result.bestRoute.steps.map((step) => step.actionId)).toEqual([
      "basic-credit",
      "basic-credit",
      "basic-credit",
    ]);
  });

  it("repeats a finite cashout only up to its structured current-turn limit", () => {
    const candidates = [
      liquidCandidate("short-term-contract-cashout", 2, {
        maxCurrentTurnUses: 2,
        repeatable: true,
      }),
    ];
    const covered = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 0, targetCredits: 4 }),
      candidates,
      remainingClicks: 3,
    });
    const uncovered = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 0, targetCredits: 6 }),
      candidates,
      remainingClicks: 3,
    });

    expect(covered.bestRoute).toMatchObject({
      status: "covered_guaranteed",
      projectedCredits: 4,
      totalClickCost: 2,
    });
    expect(covered.bestRoute.steps.map((step) => step.actionId)).toEqual([
      "short-term-contract-cashout",
      "short-term-contract-cashout",
    ]);
    expect(uncovered.bestRoute.status).toBe("uncovered");
  });

  it("prefers Corporate Coup +3 over longer BBS +2 and basic +1 routes", () => {
    const result = searchFundingRoutes({
      demand: corpDemand({ currentCredits: 0, targetCredits: 3 }),
      candidates: [
        liquidCandidate("basic-credit", 1, { repeatable: true }),
        liquidCandidate("bbs-credit", 2, {
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
        }),
        liquidCandidate("corporate-coup-credit", 3, {
          sourceDefinitionId: "onr_v1_193_corporate-coup",
        }),
      ],
      remainingClicks: 3,
    });

    expect(result.bestRoute.steps).toHaveLength(1);
    expect(result.bestRoute.steps[0]).toMatchObject({
      actionId: "corporate-coup-credit",
      netLiquidCreditGain: 3,
    });
  });

  it("front-loads the larger exact gain when equal routes use the same actions", () => {
    const result = searchFundingRoutes({
      demand: corpDemand({ currentCredits: 0, targetCredits: 3 }),
      candidates: [
        liquidCandidate("a-basic-credit", 1, { repeatable: true }),
        liquidCandidate("z-card-conversion", 2),
      ],
      remainingClicks: 3,
    });

    expect(result.bestRoute.steps.map((step) => step.actionId)).toEqual([
      "z-card-conversion",
      "a-basic-credit",
    ]);
  });

  it("uses the net gain of a currently legal burst and charges its cost once", () => {
    const result = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 2, targetCredits: 6 }),
      candidates: [
        liquidCandidate("burst", 6, {
          creditCost: 2,
          netGain: 4,
          actionType: "play_event",
        }),
      ],
      remainingClicks: 1,
    });

    expect(result.bestRoute).toMatchObject({
      status: "covered_guaranteed",
      startingCredits: 2,
      projectedCredits: 6,
    });
    expect(result.bestRoute.steps[0]).toMatchObject({
      creditCost: 2,
      netLiquidCreditGain: 4,
    });
  });

  it("keeps Broker setup plus future cashout contingent", () => {
    const demand = createRunnerCreditDemand({
      demandId: "runner:breaker-next-turn",
      purpose: "breaker_for_current_plan",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "start_of_next_own_turn",
      currentCredits: 1,
      targetCredits: 4,
    });
    const result = searchFundingRoutes({
      demand,
      candidates: [storedCreditCandidate("broker-load", 3)],
      remainingClicks: 1,
      futureProjections: [
        {
          projectionId: "broker-cashout-next-turn",
          netLiquidCreditGain: 3,
          clickCost: 1,
          earliestOwnTurnOffset: 1,
          reliability: "contingent",
          requiredCurrentActionId: "broker-load",
          sourceDefinitionId: "onr_v1_154_broker",
        },
      ],
    });

    expect(result.bestRoute).toMatchObject({
      status: "covered_contingent",
      horizon: "next_own_turn",
    });
    expect(result.bestRoute.steps.map((step) => step.kind)).toEqual([
      "legal_action",
      "future_projection",
    ]);
    expect(creditDemandHardBlockerIsResolved(demand, result.bestRoute)).toBe(
      false,
    );
  });

  it("allows a guaranteed route to cover a hard blocker", () => {
    const demand = runnerDemand({ currentCredits: 0, targetCredits: 2 });
    const result = searchFundingRoutes({
      demand,
      candidates: [liquidCandidate("bbs-credit", 2)],
      remainingClicks: 1,
    });

    expect(creditDemandHardBlockerIsResolved(demand, result.bestRoute)).toBe(
      true,
    );
  });

  it("can recommend a materially shorter contingent route without resolving the hard blocker", () => {
    const demand = runnerDemand({ currentCredits: 0, targetCredits: 3 });
    const result = searchFundingRoutes({
      demand,
      candidates: [
        liquidCandidate("contingent-burst", 3, {
          reliability: "conditional",
        }),
        liquidCandidate("basic-credit", 1, { repeatable: true }),
      ],
      remainingClicks: 3,
    });

    expect(result.bestRoute).toMatchObject({
      status: "covered_contingent",
      totalClickCost: 1,
    });
    expect(result.bestRoute.steps[0]?.actionId).toBe("contingent-burst");
    expect(
      result.routes.some((route) => route.status === "covered_guaranteed"),
    ).toBe(true);
    expect(creditDemandHardBlockerIsResolved(demand, result.bestRoute)).toBe(
      false,
    );
  });

  it("does not use restricted credits for a general reserve", () => {
    const general = searchFundingRoutes({
      demand: runnerDemand({ currentCredits: 0, targetCredits: 2 }),
      candidates: [
        liquidCandidate("restricted", 2, {
          creditRestriction: "restricted",
        }),
      ],
      remainingClicks: 1,
    });
    const run = searchFundingRoutes({
      demand: createRunnerCreditDemand({
        demandId: "runner:run",
        purpose: "current_run",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "before_current_plan_action",
        currentCredits: 0,
        targetCredits: 2,
        acceptedCreditRestrictions: ["general", "restricted"],
      }),
      candidates: [
        liquidCandidate("restricted", 2, {
          creditRestriction: "restricted",
        }),
      ],
      remainingClicks: 1,
    });

    expect(general.bestRoute.status).toBe("uncovered");
    expect(run.bestRoute).toMatchObject({
      status: "covered_guaranteed",
      projectedCredits: 2,
      projectedGeneralCredits: 0,
    });
  });

  it("invalidates a selected route when its legal source disappears", () => {
    const route = searchFundingRoutes({
      demand: corpDemand({ currentCredits: 0, targetCredits: 2 }),
      candidates: [liquidCandidate("bbs-credit", 2)],
      remainingClicks: 1,
    }).bestRoute;

    expect(revalidateFundingRoute(route, new Set())).toMatchObject({
      status: "invalidated",
      invalidationReasons: ["legal_action_unavailable:bbs-credit"],
    });
  });
});

function runnerDemand(params: {
  currentCredits: number;
  targetCredits: number;
}) {
  return createRunnerCreditDemand({
    demandId: `runner:demand:${params.currentCredits}:${params.targetCredits}`,
    purpose: "breaker_for_current_plan",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "end_of_current_turn",
    ...params,
  });
}

function corpDemand(params: { currentCredits: number; targetCredits: number }) {
  return createCorpCreditDemand({
    demandId: `corp:demand:${params.currentCredits}:${params.targetCredits}`,
    purpose: "current_score_window",
    priority: "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    ...params,
  });
}

function liquidCandidate(
  actionId: string,
  grossGain: number,
  options: {
    actionType?: string;
    creditCost?: number;
    creditRestriction?: "general" | "restricted";
    netGain?: number;
    maxCurrentTurnUses?: number;
    reliability?: "guaranteed" | "conditional" | "unknown";
    repeatable?: boolean;
    sourceDefinitionId?: string;
  } = {},
): FundingActionCandidate {
  const creditCost = options.creditCost ?? 0;
  return {
    actionId,
    actionType: options.actionType ?? "activated_card_ability",
    ...(options.sourceDefinitionId
      ? { sourceDefinitionId: options.sourceDefinitionId }
      : {}),
    economyProjection: projection({
      kind: "immediate_liquid",
      timing: "immediate",
      grossLiquidCreditGain: grossGain,
      netLiquidCreditGain: options.netGain ?? grossGain - creditCost,
      creditCost,
      creditRestriction: options.creditRestriction ?? "general",
      ...(options.maxCurrentTurnUses !== undefined
        ? { maxCurrentTurnUses: options.maxCurrentTurnUses }
        : {}),
      repeatable: options.repeatable ?? false,
      reliability: options.reliability ?? "guaranteed",
    }),
  };
}

function storedCreditCandidate(
  actionId: string,
  amount: number,
): FundingActionCandidate {
  return {
    actionId,
    actionType: "activated_card_ability",
    sourceDefinitionId: "onr_v1_154_broker",
    economyProjection: projection({
      kind: "stored_credit_build",
      timing: "setup",
      storedCreditsAdded: amount,
      repeatable: false,
    }),
  };
}

function projection(
  overrides: Partial<ActionEconomyProjection>,
): ActionEconomyProjection {
  return {
    schemaVersion: "action-economy-projection-v1",
    kind: "non_economy",
    timing: "unknown",
    creditRestriction: "general",
    clickCost: 1,
    creditCost: 0,
    cardsDrawn: 0,
    cardsConsumed: 0,
    netHandDelta: 0,
    repeatable: false,
    reliability: "guaranteed",
    source: "legal_action_payload",
    confidence: "high",
    evidence: [],
    ...overrides,
  };
}
