import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r16-event-hand-floor.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("quotes the confirmed damage floor after consuming the run event, before paying for the known path", () => {
  const { input, runtime } = checkpoint();
  const targets = evaluateRunnerRunTargets({ input });
  const event = targets.find(
    (t) =>
      t.runActionProjection.sourceKind === "event" && t.targetServerId === "hq",
  )!;
  expect(event.pathPassability).toBe("blocked_by_visible_damage_hand_buffer");
  expect(event.evidence).toEqual(
    expect.arrayContaining([expect.stringContaining("required_floor:4")]),
  );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  expect(result.actionId).not.toBe(event.actionId);
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  expect(result.fallbackUsed).toBe(false);
});

it("keeps the basic run's independent hand count and does not invent an event cost for it", () => {
  const { input } = checkpoint();
  const basic = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
  expect(basic.pathPassability).toBe("reachable");
  expect(basic.evidence).toContain("grip_after_run_action:3");
});
