import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { currentRemoteReserveFixture } from "./current-remote-reserve.test-support";
import {
  restoreAiRuntimeCheckpoint,
} from "./runtime-checkpoint";

describe("match b244055277fb21bd terminal remote contest", () => {
  it("does not admit a fresh native contest with a blocked unknown-ICE reserve", () => {
    resetResidentPlanPortfolioMemory();
    const capture = currentRemoteReserveFixture(3, false);
    restoreAiRuntimeCheckpoint(
      capture.input,
      capture.input.ownDeckSnapshot!.deckSnapshotId,
      capture.runtime,
    );
    const target = evaluateRunnerRunTargets({ input: capture.input }).find(
      (t) => t.targetServerId === "remote_1",
    );
    expect(target?.prerunReserveQuote).toMatchObject({
      status: "blocked",
    });
    expect(target?.prerunReserveQuote?.creditGap).toBeGreaterThan(0);
    const decision = chooseAiAction(capture.input);
    expect(decision.actionId).not.toBe("runner.start_run.remote_1");
    expect(
      capture.input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
  });
  it("takes the terminal contest when the unknown-ICE reserve is funded", () => {
    resetResidentPlanPortfolioMemory();
    const capture = currentRemoteReserveFixture(31, false);
    expect(
      evaluateRunnerRunTargets({ input: capture.input }).find(
        (t) => t.targetServerId === "remote_1",
      )?.prerunReserveQuote?.creditGap,
    ).toBe(0);
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).toBe("runner.start_run.remote_1");
    expect(decision.decisionDebug?.planKind).toBe("runner.contest_remote");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:contest_remote",
        "plan_assessment_evidence:runner_terminal_remote_contest_mandatory:remote_1:runner.start_run.remote_1",
      ]),
    );
    expect(decision.evidence).not.toEqual(
      expect.arrayContaining(["plan_root_module:runner.credit_bank"]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      instanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      moduleId: "runner.contest_remote",
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine?.phases.at(
        0,
      ),
    ).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      rootModuleId: "runner.contest_remote",
      nodes: [{ semanticActionType: "run.start" }],
    });
  });
});
