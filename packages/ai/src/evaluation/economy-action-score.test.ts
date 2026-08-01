import { describe, expect, it } from "vitest";

import type {
  ActionEconomyProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";
import { createCorpCreditDemand } from "../plans/credit-demand";
import {
  compareEconomyActionDominance,
  dominatedEconomyActionIds,
  ECONOMY_CREDIT_DEMAND_BONUS,
  economyActionMode,
  economyCreditBaseValue,
  scoreEconomyAction,
} from "../economy/economy-action-score";

describe("common economy action score", () => {
  it("uses the monotone base curve and +25 after six credits", () => {
    expect(
      Array.from({ length: 10 }, (_, index) =>
        economyCreditBaseValue(index + 1),
      ),
    ).toEqual([100, 150, 200, 240, 275, 305, 330, 355, 380, 405]);
  });

  it("applies the highest compatible demand bonus exactly once to every liquid source", () => {
    const acute = demand("acute", "acute_hard_plan_blocker", 5);
    const reserve = demand("reserve", "phase_reserve", 8);
    const basic = candidate("basic", 1);
    const bbs = candidate("bbs", 2, {
      sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
    });
    const coup = candidate("coup", 3, {
      sourceDefinitionId: "onr_v1_193_corporate-coup",
    });

    expect(
      [basic, bbs, coup].map(
        (item) => scoreEconomyAction(item, [reserve, acute]).total,
      ),
    ).toEqual([700, 750, 800]);
    for (const item of [basic, bbs, coup]) {
      const result = scoreEconomyAction(item, [reserve, acute]);
      expect(
        result.components.filter(
          (component) => component.key === "credit_demand",
        ),
      ).toHaveLength(1);
      expect(
        result.components.find((component) => component.key === "credit_demand")
          ?.value,
      ).toBe(ECONOMY_CREDIT_DEMAND_BONUS.acute_hard_plan_blocker);
    }
  });

  it("uses net hand delta for mixed economy actions", () => {
    const playedOperation = candidate("operation", 2, {
      cardsDrawn: 1,
      cardsConsumed: 1,
      netHandDelta: 0,
    });
    const installedAbility = candidate("installed", 2, {
      cardsDrawn: 1,
      cardsConsumed: 0,
      netHandDelta: 1,
    });

    expect(scoreEconomyAction(playedOperation).total).toBe(150);
    expect(scoreEconomyAction(installedAbility).total).toBe(190);
  });

  it("does not subtract a credit cost a second time", () => {
    const burst = candidate("burst", 5, {
      grossLiquidCreditGain: 5,
      creditCost: 2,
      netLiquidCreditGain: 3,
    });

    const result = scoreEconomyAction(burst);
    expect(result.netLiquidCreditGain).toBe(3);
    expect(result.total).toBe(200);
    expect(result.evidence).toContain(
      "economy_credit_cost_accounted_in_net_gain_once:true",
    );
  });

  it("keeps Broker setup outside immediate credit value and fixed-pool dominance", () => {
    const setup = candidate("broker-load", 0, {
      kind: "stored_credit_build",
      timing: "setup",
      storedCreditsAdded: 3,
      sourceDefinitionId: "onr_v1_154_broker",
    });
    const cashout = candidate("broker-cashout", 6, {
      payoutMode: "all_available",
      sourceDefinitionId: "onr_v1_154_broker",
      effectTargets: ["economy.bank_cashout_all"],
    });
    const coup = candidate("coup", 3, {
      sourceDefinitionId: "onr_v1_193_corporate-coup",
    });

    expect(
      scoreEconomyAction(setup, [demand("need", "current_foreground_plan", 3)]),
    ).toMatchObject({
      mode: "strategic_bank_setup",
      total: 0,
    });
    expect(economyActionMode(cashout)).toBe("strategic_bank_cashout");
    expect(compareEconomyActionDominance(cashout, coup)).toBeUndefined();
  });

  it("only applies restricted credits to a compatible demand", () => {
    const restricted = candidate("run-credits", 2, {
      kind: "restricted_credit",
      creditRestriction: "restricted",
    });
    const generalReserve = demand("general", "phase_reserve", 2);
    const runNeed = createCorpCreditDemand({
      demandId: "run",
      purpose: "current_run",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentCredits: 0,
      targetCredits: 2,
      acceptedCreditRestrictions: ["general", "restricted"],
    });

    expect(scoreEconomyAction(restricted, [generalReserve]).total).toBe(150);
    expect(scoreEconomyAction(restricted, [runNeed]).total).toBe(550);
  });

  it("marks +1 and +2 pure payouts dominated by a comparable +3 payout", () => {
    const basic = candidate("basic", 1);
    const bbs = candidate("bbs", 2, {
      sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
    });
    const coup = candidate("coup", 3, {
      sourceDefinitionId: "onr_v1_193_corporate-coup",
    });

    expect(dominatedEconomyActionIds([basic, bbs, coup])).toEqual(
      new Set(["basic", "bbs"]),
    );
    expect(compareEconomyActionDominance(coup, basic)).toMatchObject({
      dominantActionId: "coup",
      dominatedActionId: "basic",
      creditAdvantage: 2,
    });
  });

  it("classifies a finite source pool from action semantics instead of card id", () => {
    const finite = candidate("generic-finite-pool", 2, {
      sourceDefinitionId: "unseen-future-card",
      sourcePool: "finite",
    });
    const ordinary = candidate("ordinary-payout", 2, {
      sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
    });

    expect(economyActionMode(finite)).toBe("fixed_pool_payout");
    expect(economyActionMode(ordinary)).toBe("standard_liquid");
  });

  it("compares draw-and-consume payouts by their net hand delta", () => {
    const pure = candidate("pure", 2);
    const drawAndConsume = candidate("draw-and-consume", 3, {
      cardsDrawn: 1,
      cardsConsumed: 1,
      netHandDelta: 0,
    });

    expect(compareEconomyActionDominance(drawAndConsume, pure)).toMatchObject({
      dominantActionId: "draw-and-consume",
      dominatedActionId: "pure",
      creditAdvantage: 1,
    });
  });

  it("does not claim dominance when net hand effects differ", () => {
    const pure = candidate("pure", 2);
    const consuming = candidate("consuming", 3, {
      cardsConsumed: 1,
      netHandDelta: -1,
    });

    expect(compareEconomyActionDominance(consuming, pure)).toBeUndefined();
  });
});

function demand(
  demandId: string,
  priority: Parameters<typeof createCorpCreditDemand>[0]["priority"],
  targetCredits: number,
) {
  return createCorpCreditDemand({
    demandId,
    purpose: priority === "phase_reserve" ? "phase_reserve" : "foreground_plan",
    priority,
    hardness: priority === "acute_hard_plan_blocker" ? "hard" : "soft",
    deadline:
      priority === "phase_reserve"
        ? "within_three_own_turns"
        : "end_of_current_turn",
    currentCredits: 0,
    targetCredits,
  });
}

function candidate(
  actionId: string,
  gain: number,
  overrides: Partial<ActionEconomyProjection> & {
    sourceDefinitionId?: string;
    effectTargets?: string[];
  } = {},
): ActionSemanticCandidate {
  const { sourceDefinitionId, effectTargets, ...projectionOverrides } =
    overrides;
  return {
    actionId,
    actionType: "activated_card_ability",
    actorSide: "corp",
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    ...(effectTargets ? { effectTargets } : {}),
    economyProjection: {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: gain,
      netLiquidCreditGain: gain,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      payoutMode: "fixed",
      repeatable: false,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
      evidence: [],
      ...projectionOverrides,
    },
  } as ActionSemanticCandidate;
}
