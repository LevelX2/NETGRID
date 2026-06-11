import { describe, expect, it } from "vitest";
import type { TacticalGoalLike } from "./semantic-decision-frame";
import {
  buildTacticalGoalUtilities,
  normalizeTacticalGoalUtility,
} from "./tactical-goal-utility";

describe("TacticalGoalUtility", () => {
  it("maps low-credit runner goals to high economy utility", () => {
    const [utility] = buildTacticalGoalUtilities([
      goal({
        goalId: "runner.build_economy_base",
        family: "economy",
        priority: 940,
        urgency: "high",
        source: "economy_posture",
        evidence: ["runner_credits:1", "funding_need:true"],
      }),
    ]);

    expect(utility?.family).toBe("economy");
    expect(utility?.priority).toBe(94);
    expect(utility?.urgency).toBe("high");
    expect(utility?.requiredActionSignals).toContain("economy.gain_credit");
  });

  it("maps missing breaker coverage to coverage utility without action ids", () => {
    const utility = normalizeTacticalGoalUtility(
      goal({
        goalId: "runner.find_or_install_primary_breaker",
        family: "setup",
        priority: 970,
        urgency: "high",
        source: "strategic_intent",
        evidence: ["missing_breaker_coverage:visible_etr_ice"],
      }),
    );

    expect(utility.family).toBe("coverage");
    expect(utility.urgency).toBe("critical");
    expect(utility.blockers).toContain(
      "evidence:missing_breaker_coverage:visible_etr_ice",
    );
    expect(JSON.stringify(utility.requiredActionSignals)).not.toContain(
      "actionId:",
    );
  });

  it("keeps critical survival goals above normal setup goals", () => {
    const utilities = buildTacticalGoalUtilities([
      goal({
        goalId: "runner.draw_or_search_for_setup",
        family: "setup",
        priority: 820,
        urgency: "medium",
        source: "strategic_intent",
      }),
      goal({
        goalId: "runner.avoid_low_value_risk_runs",
        family: "risk_control",
        priority: 1000,
        urgency: "critical",
        source: "boardstate",
        evidence: ["damage_risk:lethal"],
      }),
    ]);

    expect(utilities[0]?.family).toBe("survival");
    expect(utilities[0]?.urgency).toBe("critical");
    expect(utilities[1]?.family).toBe("setup");
  });

  it("maps corp score and rez-reserve goals to separate utility families", () => {
    const utilities = buildTacticalGoalUtilities([
      goal({
        goalId: "corp.score_agenda",
        family: "corp_scoreline",
        priority: 930,
        urgency: "high",
        source: "boardstate",
      }),
      goal({
        goalId: "corp.low_rez_reserve",
        family: "corp_ice_defense",
        priority: 760,
        urgency: "medium",
        source: "boardstate",
        evidence: ["missing_credits:rez_outer_ice"],
      }),
    ]);

    expect(utilities.map((utility) => utility.family)).toEqual([
      "corp_scoreline",
      "corp_ice_defense",
    ]);
    expect(utilities[0]?.requiredActionSignals).toContain("score.agenda");
    expect(utilities[1]?.requiredActionSignals).toContain("corp_window.rez");
  });

  it("rejects hidden-info markers in utility evidence", () => {
    expect(() =>
      normalizeTacticalGoalUtility(
        goal({
          goalId: "runner.survive",
          family: "risk_control",
          priority: 100,
          urgency: "critical",
          evidence: ["fullGameState:opponent_hand"],
        }),
      ),
    ).toThrow(/forbidden hidden-info marker/);
  });
});

function goal(params: {
  goalId: string;
  family: string;
  priority: number;
  urgency: TacticalGoalLike["urgency"];
  source?: TacticalGoalLike["source"];
  evidence?: string[];
}): TacticalGoalLike {
  return {
    goalId: params.goalId,
    family: params.family,
    priority: params.priority,
    ...(params.urgency ? { urgency: params.urgency } : {}),
    ...(params.source ? { source: params.source } : {}),
    evidence: params.evidence ?? [],
  };
}
