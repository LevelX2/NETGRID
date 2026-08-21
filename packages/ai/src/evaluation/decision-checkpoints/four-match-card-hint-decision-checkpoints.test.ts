import { describe, expect, it } from "vitest";

import disgruntledArchivesJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-four-match-01-disgruntled-archives.json";
import insideJobRdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-four-match-02-inside-job-rd.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

describe("four-match card-hint decision checkpoints", () => {
  it("does not spend Disgruntled Ice Technician on the historical empty Archives run", () => {
    const result = runAiDecisionCheckpoint(fixture(disgruntledArchivesJson));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("preserves the Inside Job quote while prioritizing the reaction reserve", () => {
    const result = runAiDecisionCheckpoint(fixture(insideJobRdJson));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const selectedAction = result.selectedAction;
    if (!selectedAction) throw new Error("Expected selected reserve action");
    const decision = result.decision;
    if (!decision) throw new Error("Expected plan-owned reserve decision");
    const defensePlanInstanceId = "plan:runner.defense_and_recovery:runner";
    expect(decision).toMatchObject({
      actionId: selectedAction.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.defense_and_recovery",
        planFirstDecision: {
          selectionAuthority: "turn_plan_commitment",
          rootPlanInstanceId: defensePlanInstanceId,
          leafExecutorInstanceId: defensePlanInstanceId,
          selectedPlan: {
            instanceId: defensePlanInstanceId,
            moduleId: "runner.defense_and_recovery",
            executionState: "executor",
          },
          route: {
            planInstanceId: defensePlanInstanceId,
            stepId: `${defensePlanInstanceId}:build_reaction_reserve`,
            capabilityId: "build_damage_reaction_reserve",
            actionId: selectedAction.actionId,
            actionType: "gain_credit",
            stateVersion: result.input.playerView.stateVersion,
          },
          turnPlanning: {
            shadowComparison: {
              liveActionId: selectedAction.actionId,
              shadowActionId: selectedAction.actionId,
              shadowRootPlanInstanceId: defensePlanInstanceId,
              agreement: true,
              comparisonClass: "agreement",
            },
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:runner_damage_locked_hand_reaction_reserve",
      ]),
    );
    const insideJobAction = result.input.legalActions.find((action) =>
      action.actionId.includes("inside-job") && action.actionId.includes(".rd."),
    );
    if (!insideJobAction) throw new Error("Expected legal Inside Job R&D action");
    const scopedInput = {
      ...result.input,
      legalActions: [insideJobAction],
      playerView: {
        ...result.input.playerView,
        legalActions: [insideJobAction],
      },
    };
    const [evaluation] = evaluateRunnerRunTargets({ input: scopedInput });
    expect(evaluation).toMatchObject({
      pathPassability: "reachable",
      pathCost: 0,
      creditsAfterRun: 4,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_action_projection_bypass_first_ice:true",
        "run_action_projection_bypassed_first_ice:true",
        "path_passability:reachable",
      ]),
    );
    const directHqEvaluation = evaluateRunnerRunTargets({
      input: result.input,
    }).find((entry) => entry.actionId === "runner.start_run.hq");
    expect(directHqEvaluation).toMatchObject({
      targetServerId: "hq",
      accessServerId: "hq",
      pathPassability: "blocked_unpayable",
      pathCost: 8,
      creditsAfterRun: -2,
      routeQuote: {
        reachability: "no_access",
        fundingGap: 2,
        unknownIceCount: 0,
      },
      unavoidableVisibleIceHazardCount: 0,
    });
    expect(directHqEvaluation?.score).toBeLessThan(0);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-four-match-02-inside-job-rd"],
  );
}
