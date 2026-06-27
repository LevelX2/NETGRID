import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import { runnerSemanticGoalFitScoreComponent } from "./runner-goal-fit-score";

describe("runnerSemanticGoalFitScoreComponent", () => {
  it("scores start-run actions that match active runner tactical goals", () => {
    const action = {
      actionId: "run-rd",
      side: "runner",
      type: "start_run",
      payload: { serverId: "rd" },
    } as unknown as LegalAction;
    const input = {
      side: "runner",
      playerView: { own: { tags: 0 } },
      ownRunnerTacticalGoals: [
        {
          schemaVersion: "runner-tactical-goal-v1",
          goalId: "runner.pressure_good_central_target",
          family: "pressure",
          priority: 980,
          urgency: "high",
          targetServerId: "rd",
          source: "run_target_evaluation",
          evidence: ["test_goal"],
        } satisfies RunnerTacticalGoal,
      ],
    } as unknown as AiDecisionInput;
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
      {
        sourceCardAnswerRole: () => undefined,
        runActionSpendingCapAssessment: () => ({
          ok: true,
          reason: "test",
          visibleBreakCost: 0,
        }),
        runTargetEvaluationForAction: () => evaluation,
      },
    );

    expect(component).toMatchObject({
      key: "runner_goal_fit_tactical_goal_run_target",
      value: 980,
    });
    expect(component?.reason).toContain(
      "goal:runner.pressure_good_central_target",
    );
  });
});
