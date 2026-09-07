import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-405-prepared-path-hazard-d293.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it("SP-296 retains affordable hazard avoidance instead of paying to lose it before the same contest", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const remote = evaluateRunnerRunTargets({ input }).find(
    (r) => r.actionId === "runner.start_run.remote_1",
  )!;
  expect(remote.routeQuote?.preRunPreparation).toBeUndefined();
  expect(remote.visibleTraceTagHazardUnavoidable).toBe(false);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.start_run.remote_1");
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    leafExecutorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    route: {
      actionId: decision.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
});
