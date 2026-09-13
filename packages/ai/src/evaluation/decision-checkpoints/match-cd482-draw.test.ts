import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("D26 preserves the concrete Sentry-answer draw despite its cleanup trade-off", () => {
  const { input, runtime, validation } = captureAt(26);
  expect(Object.values(validation).every(Boolean)).toBe(true);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.payload?.drawCardsAmount).toBe(5);
  expect(input.playerView.own.gripOrHq.length - 1 + 5).toBeGreaterThan(
    input.playerView.own.maxHandSize,
  );
  expect(decision.reasonCode).toBe("plan_first.runner.rig_and_coverage");
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId:
      "plan:runner.rig_and_coverage:coverage%3Abreaker_sentry",
    selectedStep: { stepId: expect.stringContaining("find:breaker_sentry") },
    route: {
      actionId: action.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
});

function captureAt(index: number) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-cd482-d${index}-replay.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}

it("D29 does not create an unbound second draw plan after the coverage draw with eight cards and one click", () => {
  const capture = captureAt(29);
  expect(Object.values(capture.validation).every(Boolean)).toBe(true);
  const { input, runtime } = capture;
  expect(input.playerView.own.gripOrHq).toHaveLength(8);
  expect(input.playerView.own.clicks).toBe(1);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  const draw = input.legalActions.find(
    (a) => a.type === "play_event" && a.payload?.drawCardsAmount === 5,
  )!;
  expect(draw).toBeDefined();
  expect(decision.actionId).not.toBe(draw.actionId);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.decisionDebug?.planFirstDecision?.route?.actionId).toBe(
    decision.actionId,
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.dispositions,
  ).toContainEqual(
    expect.objectContaining({
      actionId: draw.actionId,
      ownerModuleId: "runner.develop_board_and_hand",
      evidenceCode: expect.stringContaining("no_current_need"),
    }),
  );
});
