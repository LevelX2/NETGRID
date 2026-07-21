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
