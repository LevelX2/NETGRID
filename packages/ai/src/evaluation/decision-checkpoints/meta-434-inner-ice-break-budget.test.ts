import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function decide(credits = 4) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r16-inner-ice-break-budget.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  cp.input.playerView.own.credits = credits;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(cp.input);
  return {
    input: cp.input,
    result,
    action: cp.input.legalActions.find((a) => a.actionId === result.actionId),
  };
}

it("reserves both remaining end-the-run breaks on the innermost ICE before optional damage prevention", () => {
  const { input, result, action } = decide();
  expect(action?.type).toBe("break_subroutine");
  expect([2, 3]).toContain(action?.payload?.subroutineIndex);
  expect(result).toMatchObject({
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        selectedStep: {
          planInstanceId: "plan:runner.convert_run_window:run%3Arun_243",
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        },
        route: {
          actionId: result.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("still prevents optional damage when all remaining mandatory breaks are funded", () => {
  const { action } = decide(6);
  expect(action).toMatchObject({
    type: "break_subroutine",
    payload: { subroutineIndex: 1 },
  });
});
