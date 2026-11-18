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
    (t) => t.actionId === "rs.rd",
  )!;
  expect(original).toMatchObject({
    pathCost: 18,
    pathPassability: "blocked_by_visible_damage_hand_buffer",
  });
  expect(result).toMatchObject({
    actionId: "rc.c1e9.c1e9",
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "pa90fufw9vc5bkshp96ztlryxl",
        selectedPlan: {
          moduleId: "runner.rig_and_coverage",
          parentInstanceId: "pa90fufw9vc5bkshp96ztlryxl",
        },
        route: { actionType: "install_card", stateVersion: 219 },
      },
    },
  });
  const selected = result.decisionDebug!.planFirstDecision!;
  expect(selected.leafExecutorInstanceId).toBe(
    selected.selectedPlan!.instanceId,
  );
});
it("retains the native draw while the installation would consume the last required buffer card", () => {
  const { result } = decide("before-buffer");
  expect(result.actionId).toBe("r8");
});
it("does not install a same-turn preparation after the native final click", () => {
  const { result } = decide("last-click");
  expect(result.actionId).toBe("rb");
});
