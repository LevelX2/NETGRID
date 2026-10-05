import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
afterEach(resetResidentPlanPortfolioMemory);
it("removes the native G4D13 parentless ready Spinal economy producer while retaining current plan authority", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta-ten-repairs/507-g4-d13.json", import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  expect(input.playerView.own.rig).toHaveLength(0);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const pf = result.decisionDebug!.planFirstDecision!;
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: cp.stateVersion,
    planInstanceId: pf.selectedStep!.planInstanceId,
    stepId: pf.selectedStep!.stepId,
  });
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId)
      ?.expiresAtStateVersion,
  ).toBe(cp.stateVersion);
  const source = input.playerView.own.gripOrHq.find(
    (c) => c.definitionId === "onr_classic_048_omnitech-spinal-tap-cybermodem",
  )!;
  expect(source).toBeDefined();
  expect(
    residentPlanPortfolioSnapshot(input)!.instances.filter(
      (i) =>
        i.moduleId === "runner.develop_board_and_hand" &&
        i.instanceId.includes(encodeURIComponent(source.instanceId)) &&
        i.viability === "ready",
    ),
  ).toHaveLength(0);
});
