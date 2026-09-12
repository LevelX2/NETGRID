import { expect, it } from "vitest";
import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-432-priority-wreck-d306.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

it("keeps the central executor and actual access instead of consuming a zero-yield denial run", () => {
  const capture = structuredClone(captureJson) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(capture.input);
  expect(decision).toMatchObject({
    actionId: "runner.start_run.hq",
    fallbackUsed: false,
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
    leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ahq",
  });
});

it.each([0, 8])(
  "quotes only the actual denial payoff at %i visible Corp credits",
  (credits) => {
    const input = structuredClone(
      captureJson.input,
    ) as AiDecisionInputWithDeckCapabilities;
    input.playerView.opponent.credits = credits;
    const evaluations = evaluateRunnerRunTargets({ input });
    const denial = evaluations.find((x) =>
      x.actionId.includes("priority-wreck"),
    )!;
    const basic = evaluations.find(
      (x) => x.actionId === "runner.start_run.hq",
    )!;
    expect(denial.runActionProjection.accessReplacement).toBe(
      "runner_spend_corp_lose_credits",
    );
    expect(denial.evidence).toContain("runner_matchpoint_central_access:false");
    expect(basic.evidence).toContain("runner_matchpoint_central_access:true");
    expect(denial.accessFacts).toEqual({
      knownTargetDefinitionIds: [],
      trashBudget: "not_applicable",
    });
    if (credits === 0) {
      expect(denial.knownAccessState).toBe("known_no_current_payoff");
      expect(denial.score).toBeLessThan(basic.score);
      expect(denial.consumableRunOpportunityQuote?.immediatePayoffRelief).toBe(
        0,
      );
    } else {
      expect(denial.knownAccessState).toBe("known_payoff");
    }
  },
);
