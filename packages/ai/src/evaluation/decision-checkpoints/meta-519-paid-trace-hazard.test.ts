import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta519-g6d144.json";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
function fixture() {
  const cp = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  return { cp, input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) } };
}
afterEach(resetResidentPlanPortfolioMemory);
it("keeps the paid Asp avoidance cost but removes its prevented residual risk under the native central owner", () => {
  const { cp, input } = fixture();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const rd = evaluateRunnerRunTargets({ input }).find(
    (x) => x.actionId === "runner.start_run.rd",
  )!;
  expect(rd.routeQuote).toMatchObject({
    reachability: "guaranteed_access",
    guaranteedKnownCost: 5,
    fundingGap: 0,
  });
  expect(rd.creditsAfterRun).toBe(12);
  expect(rd.visibleIceHazardPenalty).toBe(0);
  expect(rd.score).toBeGreaterThan(0);
  const chosen = chooseAiAction(input);
  expect(chosen.actionId).toBe(
    "runner.install_card.runner_onr_v1_129_hq-interface_2.runner_onr_v1_129_hq-interface_2",
  );
  expect(chosen.fallbackUsed).toBe(false);
  expect(chosen.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
    leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ahq",
    selectedPlan: { moduleId: "runner.pressure_central" },
    route: {
      actionId: chosen.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
  expect(
    input.legalActions.some(
      (a) =>
        a.actionId === chosen.actionId &&
        a.expiresAtStateVersion === input.playerView.stateVersion,
    ),
  ).toBe(true);
});
it.each(["credits", "coverage"] as const)(
  "keeps the prevented-access guard when %s cannot fund a safe trace answer",
  (variant) => {
    const { cp, input } = fixture();
    if (variant === "credits") input.playerView.own.credits = 1;
    else {
      const { rig, memoryUsed } = input.playerView.own;
      if (rig === undefined || memoryUsed === undefined) {
        throw new Error("native_checkpoint_requires_runner_rig_and_memory");
      }
      input.playerView.own.rig = rig.filter(
        (c) => c.definitionId !== "onr_v1_040_loony-goon",
      );
      input.playerView.own.memoryUsed = memoryUsed - 1;
    }
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const rd = evaluateRunnerRunTargets({ input }).find(
      (x) => x.actionId === "runner.start_run.rd",
    )!;
    expect(rd.routeQuote?.reachability).not.toBe("guaranteed_access");
    expect(rd.visibleIceHazardPenalty).toBeGreaterThan(0);
    const chosen = chooseAiAction(input);
    expect(chosen.actionId).not.toBe("runner.start_run.rd");
    expect(chosen.fallbackUsed).toBe(false);
  },
);
