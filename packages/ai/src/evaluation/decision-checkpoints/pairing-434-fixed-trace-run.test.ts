import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r12-fixed-trace-run-g25.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint() {
  return structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("funds the central parent when even the base trace prevents access", () => {
  const { input, runtime } = checkpoint();
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  );
  expect(target).toMatchObject({
    pathPassability: "blocked_unpayable",
    recommendation: "gain_credits_first",
    routeQuote: {
      reachability: "no_access",
      noAccessReason: "unaffordable_visible_trace_access_prevention",
      fundingGap: 7,
    },
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe("runner.start_run.hq");
  expect(decision.fallbackUsed).toBe(false);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.dispositions,
  ).toContainEqual(
    expect.objectContaining({
      actionId: "runner.start_run.hq",
      ownerModuleId: "runner.pressure_central",
      disposition: "explicitly_nonproductive",
    }),
  );
});

it.each([
  { credits: 6, reachability: "conditional_access" },
  { credits: 10, reachability: "guaranteed_access" },
])(
  "preserves $reachability when the base trace is payable",
  ({ credits, reachability }) => {
    const { input } = checkpoint();
    input.playerView.own.credits = credits;
    const target = evaluateRunnerRunTargets({ input }).find(
      (t) => t.actionId === "runner.start_run.hq",
    );
    expect(target?.routeQuote.reachability).toBe(reachability);
    expect(target?.routeQuote.noAccessReason).toBeUndefined();
  },
);
