import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runnerRunLockReleaseProjection } from "../../runtime/runner-run-lock-release-score";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("releases the funded Run-parent route at original R5 G4 D191 after realized recurring income", () => {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r5-g4-d191.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = checkpoint.input;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint.runtime,
  );
  const release = input.legalActions.find(
    (a) =>
      a.type === "trigger_ability" &&
      a.payload?.abilityId === "pay_to_remove_run_lock",
  )!;
  expect(input.playerView.own.credits).toBe(42);
  expect(input.playerView.own.clicks).toBe(4);
  expect(runnerRunLockReleaseProjection(input, release)).toMatchObject({
    status: "ready",
    fundingGap: 0,
  });
  const before = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(decision.actionId).toBe(release.actionId);
  expect(decision.reasonCode).toBe("plan_first.runner.pressure_central");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.evidence).toContain(
    "plan_step_capability:pressure_hq_access",
  );
  expect(JSON.stringify(input)).toBe(before);
});
