import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  activeRunRootPlan,
  reassessActiveInformationRunParent,
} from "../../runner/run-window/run-window-origin";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};
function capture(index: number): Capture {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-28a78-d${index}-replay.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function replay(value: Capture) {
  const { input, runtime } = structuredClone(value);
  expect(Object.values(value.validation).every(Boolean)).toBe(true);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  return { input, decision };
}

describe("match 28a78 run costs and admission", () => {
  it("D88 quotes only the remaining ETR and keeps its bound executor", () => {
    const original = capture(88);
    const { input, decision } = replay(original);
    const root = activeRunRootPlan(
      original.runtime.residentPlanPortfolio,
      input,
    );
    const quote = reassessActiveInformationRunParent(input, root);
    expect(quote?.informationBoundaryReassessment).toMatchObject({
      knownPathCost: 2,
      fundingGap: 0,
      knownPathReachable: true,
    });
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("break_subroutine");
    expect(action.payload?.subroutineIndex).toBe(1);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_159",
    });
  });
  it.each([85, 90])(
    "D%i does not start an information run with a blocked reserve",
    (index) => {
      const { input, decision } = replay(capture(index));
      const target = evaluateRunnerRunTargets({ input }).find(
        (t) => t.targetServerId === "remote_1",
      )!;
      expect(target.prerunReserveQuote).toMatchObject({
        status: "blocked",
        creditGap: 11,
      });
      expect(decision.actionId).not.toBe("runner.start_run.remote_1");
      const plan = decision.decisionDebug?.planFirstDecision;
      expect(plan?.route?.actionId).toBe(decision.actionId);
      if (index === 85) {
        expect(plan?.selectedPlan).toMatchObject({
          moduleId: "runner.economy",
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          parentNeedId: "run-support:remote:remote_1",
        });
        expect(plan?.executionOrigin?.rootPlanInstanceId).toBe(
          "plan:runner.contest_remote:remote%3Aremote_1",
        );
      } else {
        expect(plan?.selectedPlan?.moduleId).toBe(
          "runner.develop_board_and_hand",
        );
      }
    },
  );
  it("allows the same remote when its full reserve is funded", () => {
    const funded = capture(90);
    funded.input.playerView.own.credits = 17;
    const { input, decision } = replay(funded);
    expect(
      evaluateRunnerRunTargets({ input }).find(
        (t) => t.targetServerId === "remote_1",
      )?.prerunReserveQuote,
    ).toMatchObject({ creditGap: 0 });
    expect(decision.actionId).toBe("runner.start_run.remote_1");
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.contest_remote");
  });
  it("fails closed when the remaining-subroutine contract is absent", () => {
    const value = capture(88);
    const action = value.input.legalActions.find(
      (a) => a.type === "continue_run",
    )!;
    delete action.payload!.encounterSubroutineIds;
    expect(() => replay(value)).toThrow("missing_action_semantics");
  });
  it("does not buy an unaffordable ETR after the first break", () => {
    const value = capture(88);
    value.input.playerView.own.credits = 1;
    value.input.legalActions = value.input.legalActions.filter(
      (a) => a.type !== "break_subroutine",
    );
    const root = activeRunRootPlan(
      value.runtime.residentPlanPortfolio,
      value.input,
    );
    expect(
      reassessActiveInformationRunParent(value.input, root)
        ?.informationBoundaryReassessment,
    ).toMatchObject({
      knownPathCost: 2,
      fundingGap: 1,
      knownPathReachable: false,
    });
  });
  it("quotes zero encounter costs when the engine reports no open subroutines", () => {
    const value = capture(88);
    const action = value.input.legalActions.find(
      (a) => a.type === "continue_run",
    )!;
    action.payload!.encounterSubroutineIds = "";
    action.payload!.unbrokenSubroutineCount = 0;
    action.payload!.encounterWillEndRun = false;
    const root = activeRunRootPlan(
      value.runtime.residentPlanPortfolio,
      value.input,
    );
    expect(
      reassessActiveInformationRunParent(value.input, root)
        ?.informationBoundaryReassessment,
    ).toMatchObject({ knownPathCost: 0, fundingGap: 0 });
  });
  it("retains the parent during a payment interruption without a continuation quote", () => {
    const value = capture(88);
    value.input.legalActions = [];
    const root = activeRunRootPlan(
      value.runtime.residentPlanPortfolio,
      value.input,
    );
    expect(reassessActiveInformationRunParent(value.input, root)).toBe(root);
  });
});
