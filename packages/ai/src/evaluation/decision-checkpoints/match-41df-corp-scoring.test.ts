import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

type Replay = {
  schemaVersion: string;
  stateVersion: number;
  input: AiDecisionInput;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

function capture(index: number): Replay {
  return JSON.parse(readFileSync(new URL(
    `../../../../../data/scenarios/ai-decision-checkpoints/cp-41df-d${index}-score-replay.json`,
    import.meta.url,
  ), "utf8"));
}

function decide(index: number) {
  const replay = capture(index);
  const input = replay.input;
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, replay.runtime);
  return { input, decision: chooseAiAction(input) };
}

describe("match 41df Corp scoring", () => {
  beforeEach(() => resetResidentPlanPortfolioMemory());

  it.each([19, 89, 91, 127, 172, 176, 210])("validates actor-safe historical capture D%i", (index) => {
    const replay = capture(index);
    expect(replay.schemaVersion).toBe("netgrid-ai-decision-checkpoint-replay-v1");
    expect(Object.values(replay.validation).every(Boolean)).toBe(true);
    expect(replay.input.playerView.stateVersion).toBe(replay.stateVersion);
    expect(replay.input.side).toBe("corp");
    expect(replay.input.playerView.opponent).not.toHaveProperty("gripOrHq");
  });

  it.each([19, 89, 91, 127, 172, 176, 210])("records current legal selection at D%i", (index) => {
    const { input, decision } = decide(index);
    console.log(`D${index}`, JSON.stringify(decision).slice(0, 800));
    expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
  });
});
