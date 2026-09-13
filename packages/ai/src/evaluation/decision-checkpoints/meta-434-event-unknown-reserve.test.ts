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
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r17-event-unknown-reserve.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("excludes the event whose own hand cost already violates its unknown-ICE reserve", () => {
  const { input, runtime } = checkpoint();
  const targets = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  });
  const event = targets.find(
    (t) =>
      t.targetServerId === "hq" && t.runActionProjection.sourceKind === "event",
  )!;
  const basic = targets.find((t) => t.actionId === "runner.start_run.hq")!;
  expect(event.prerunReserveQuote).toMatchObject({
    status: "blocked",
    requiredHandBuffer: 3,
    handBufferGap: 1,
  });
  expect(basic.prerunReserveQuote).toMatchObject({
    status: "satisfied",
    handBufferGap: 0,
  });
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
  expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: input.playerView.stateVersion,
  });
});

it("admits the same event reserve when one additional hand card survives the cost", () => {
  const { input } = checkpoint();
  input.playerView.own.gripOrHq.push({
    ...input.playerView.own.gripOrHq[0]!,
    instanceId: "boundary-extra-hand-card",
  });
  const event = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find(
    (t) =>
      t.targetServerId === "hq" && t.runActionProjection.sourceKind === "event",
  )!;
  expect(event.prerunReserveQuote).toMatchObject({
    status: "satisfied",
    requiredHandBuffer: 3,
    handBufferGap: 0,
  });
});
