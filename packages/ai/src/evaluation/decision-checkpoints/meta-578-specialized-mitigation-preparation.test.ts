import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta578-r2-g6-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp;
}
function decide(name: string) {
  const { input, runtime } = checkpoint(name);
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId)
      ?.expiresAtStateVersion,
  ).toBe(input.playerView.stateVersion);
  return { input, result };
}
it("prepares the native cheaper full mitigation route instead of calling Codecracker functionally dead", () => {
  const { input, result } = decide("codecracker");
  const original = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.rd",
  )!;
  expect(original).toMatchObject({
    pathCost: 18,
    pathPassability: "blocked_by_visible_damage_hand_buffer",
  });
  expect(result).toMatchObject({
    actionId:
      "runner.install_card.runner_onr_v1_014_codecracker_1.runner_onr_v1_014_codecracker_1",
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
        leafExecutorInstanceId: expect.stringContaining(
          "runner.rig_and_coverage",
        ),
        route: { actionType: "install_card", stateVersion: 219 },
      },
    },
  });
});
it("retains the native draw while the installation would consume the last required buffer card", () => {
  const { result } = decide("before-buffer");
  expect(result.actionId).toBe("runner.draw_card");
});
it("does not install a same-turn preparation after the native final click", () => {
  const { result } = decide("last-click");
  expect(result.actionId).toBe("runner.gain_credit");
});
