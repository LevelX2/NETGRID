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
});

function runnerInputWithGoals(
  goals: readonly RunnerTacticalGoal[],
): AiDecisionInput {
  return {
    side: "runner",
    playerView: { own: { tags: 0 } },
    ownRunnerTacticalGoals: goals,
  } as unknown as AiDecisionInput;
}

function testDependencies(params: {
  evaluation?: RunnerRunTargetEvaluation;
} = {}) {
  return {
    sourceCardAnswerRole: () => undefined,
    runActionSpendingCapAssessment: () => ({
      ok: true,
      reason: "test",
      visibleBreakCost: 0,
    }),
    runTargetEvaluationForAction: () => params.evaluation,
  };
}
