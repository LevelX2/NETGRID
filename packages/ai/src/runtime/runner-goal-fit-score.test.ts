import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import { runnerSemanticGoalFitScoreComponent } from "./runner-goal-fit-score";

describe("runnerSemanticGoalFitScoreComponent", () => {
  it("scores gain-credit actions that match runner economy tactical goals", () => {
    const action = {
      actionId: "gain-credit",
      side: "runner",
      type: "gain_credit",
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([
      {
        schemaVersion: "runner-tactical-goal-v1",
        goalId: "runner.build_economy_base",
        family: "economy",
        priority: 940,
        urgency: "high",
        source: "economy_posture",
        evidence: ["test_goal"],
      },
    ]);

    const component = runnerSemanticGoalFitScoreComponent(
      input,
      action,
      "basic_economy_draw",
      undefined,
      testDependencies(),
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_tactical_goal_economy",
      value: 940,
    });
    expect(component?.reason).toContain("goal:runner.build_economy_base");
  });

  it("scores draw actions that match runner setup tactical goals", () => {
    const action = {
      actionId: "draw-card",
      side: "runner",
      type: "draw_card",
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([
      {
        schemaVersion: "runner-tactical-goal-v1",
        goalId: "runner.draw_or_search_for_setup",
        family: "setup",
        priority: 820,
        urgency: "medium",
        source: "strategic_intent",
        evidence: ["test_goal"],
      },
    ]);

    const component = runnerSemanticGoalFitScoreComponent(
      input,
      action,
      "basic_economy_draw",
      undefined,
      testDependencies(),
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_tactical_goal_setup",
      value: 820,
    });
    expect(component?.reason).toContain(
      "goal:runner.draw_or_search_for_setup",
    );
  });

  it("scores start-run actions that match active runner tactical goals", () => {
    const action = {
      actionId: "run-rd",
      side: "runner",
      type: "start_run",
      payload: { serverId: "rd" },
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([
      {
        schemaVersion: "runner-tactical-goal-v1",
        goalId: "runner.pressure_good_central_target",
        family: "pressure",
        priority: 980,
        urgency: "high",
        targetServerId: "rd",
        source: "run_target_evaluation",
        evidence: ["test_goal"],
      },
    ]);
    const evaluation = {
      targetServerId: "rd",
      recommendation: "run_now",
      pathPassability: "reachable",
      accessPayoff: "fresh",
    } as unknown as RunnerRunTargetEvaluation;

    const component = runnerSemanticGoalFitScoreComponent(
      input,
      action,
      "start_run",
      undefined,
      testDependencies({ evaluation }),
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_tactical_goal_run_target",
      value: 980,
    });
    expect(component?.reason).toContain(
      "goal:runner.pressure_good_central_target",
    );
  });

  it("scores bypass run actions for high-value access tactical goals", () => {
    const action = {
      actionId: "inside-run",
      side: "runner",
      type: "start_run",
      payload: { serverId: "rd", bypassFirstIce: true },
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([
      {
        schemaVersion: "runner-tactical-goal-v1",
        goalId: "runner.use_bypass_for_high_value_access",
        family: "pressure",
        priority: 760,
        urgency: "medium",
        source: "strategic_intent",
        evidence: ["test_goal"],
      },
    ]);
    const evaluation = {
      targetServerId: "rd",
      recommendation: "run_now",
      pathPassability: "reachable",
      accessPayoff: "fresh",
    } as unknown as RunnerRunTargetEvaluation;

    const component = runnerSemanticGoalFitScoreComponent(
      input,
      action,
      "simple_hq_or_rnd_pressure",
      undefined,
      testDependencies({ evaluation }),
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_tactical_goal_bypass_access",
      value: 760,
    });
    expect(component?.reason).toContain(
      "goal:runner.use_bypass_for_high_value_access",
    );
    expect(component?.reason).toContain("bypass:true");
  });

  it("penalizes low-value runs when runner risk-control tactical goals are active", () => {
    const action = {
      actionId: "run-remote",
      side: "runner",
      type: "start_run",
      payload: { serverId: "remote_1" },
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([
      {
        schemaVersion: "runner-tactical-goal-v1",
        goalId: "runner.avoid_low_value_risk_runs",
        family: "risk_control",
        priority: 960,
        urgency: "high",
        source: "run_target_evaluation",
        evidence: ["test_goal"],
      },
    ]);
    const evaluation = {
      targetServerId: "remote_1",
      recommendation: "do_not_run_now",
      pathPassability: "reachable",
      accessPayoff: "low_value",
    } as unknown as RunnerRunTargetEvaluation;

    const component = runnerSemanticGoalFitScoreComponent(
      input,
      action,
      "remote_contest",
      undefined,
      testDependencies({ evaluation }),
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_tactical_goal_risk_control",
      value: -960,
    });
    expect(component?.reason).toContain(
      "goal:runner.avoid_low_value_risk_runs",
    );
  });

  it("does not score run-if-free unknown probes as generic goal fit", () => {
    const action = {
      actionId: "run-archives",
      side: "runner",
      type: "start_run",
      payload: { serverId: "archives" },
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([]);
    const evaluation = {
      targetServerId: "archives",
      recommendation: "run_if_free",
      pathPassability: "reachable",
      accessPayoff: "unknown",
    } as unknown as RunnerRunTargetEvaluation;

    expect(
      runnerSemanticGoalFitScoreComponent(
        input,
        action,
        "simple_run_choice",
        undefined,
        testDependencies({ evaluation }),
      ),
    ).toBeUndefined();
  });

  it("does not score gain-credits-first runs as generic goal fit", () => {
    const action = {
      actionId: "run-hq",
      side: "runner",
      type: "start_run",
      payload: { serverId: "hq" },
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([]);
    const evaluation = {
      targetServerId: "hq",
      recommendation: "gain_credits_first",
      pathPassability: "reachable",
      accessPayoff: "unknown",
    } as unknown as RunnerRunTargetEvaluation;

    expect(
      runnerSemanticGoalFitScoreComponent(
        input,
        action,
        "simple_run_choice",
        undefined,
        testDependencies({ evaluation }),
      ),
    ).toBeUndefined();
  });

  it("penalizes coverage search when a visible hand breaker already answers the need", () => {
    const action = {
      actionId: "program-search",
      side: "runner",
      type: "activated_card_ability",
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([], {
      playerView: {
        own: {
          tags: 0,
          credits: 4,
          gripOrHq: [
            {
              instanceId: "ap-breaker",
              definitionId: "ap-breaker",
              title: "AP Breaker",
              type: "program",
              known: true,
              subtypes: ["Icebreaker", "AP"],
            },
          ],
          rig: [],
        },
        servers: [
          {
            id: "rd",
            label: "R&D",
            root: [],
            ice: [
              {
                instanceId: "ap-ice",
                definitionId: "ap-ice",
                title: "AP ICE",
                type: "ice",
                known: true,
                rezzed: true,
                subtypes: ["AP"],
              },
            ],
          },
        ],
      },
    });

    const component = runnerSemanticGoalFitScoreComponent(
      input,
      action,
      "coverage_search",
      undefined,
      testDependencies({ sourceRole: "search" }),
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_coverage_search_saturated",
      value: -1200,
    });
    expect(component?.reason).toContain("required:breaker_ap");
    expect(component?.reason).toContain("hand_answer:ap-breaker");
  });

  it("keeps coverage-search bonus when no visible hand answer exists", () => {
    const action = {
      actionId: "program-search",
      side: "runner",
      type: "activated_card_ability",
    } as unknown as LegalAction;
    const input = runnerInputWithGoals([], {
      playerView: {
        own: {
          tags: 0,
          credits: 4,
          gripOrHq: [],
          rig: [],
        },
        servers: [
          {
            id: "rd",
            label: "R&D",
            root: [],
            ice: [
              {
                instanceId: "ap-ice",
                definitionId: "ap-ice",
                title: "AP ICE",
                type: "ice",
                known: true,
                rezzed: true,
                subtypes: ["AP"],
              },
            ],
          },
        ],
      },
    });

    const component = runnerSemanticGoalFitScoreComponent(
      input,
      action,
      "coverage_search",
      undefined,
      testDependencies({ sourceRole: "search" }),
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_coverage_search",
      value: 1400,
    });
  });
});

function runnerInputWithGoals(
  goals: readonly RunnerTacticalGoal[],
  overrides: Record<string, unknown> = {},
): AiDecisionInput {
  return {
    side: "runner",
    playerView: { own: { tags: 0 }, servers: [] },
    ownRunnerTacticalGoals: goals,
    ...overrides,
  } as unknown as AiDecisionInput;
}

function testDependencies(params: {
  evaluation?: RunnerRunTargetEvaluation;
  sourceRole?: "search" | "draw";
} = {}) {
  return {
    sourceCardAnswerRole: () => params.sourceRole,
    runActionSpendingCapAssessment: () => ({
      ok: true,
      reason: "test",
      visibleBreakCost: 0,
    }),
    runTargetEvaluationForAction: () => params.evaluation,
    rolesForCardId: () => [],
  };
}
