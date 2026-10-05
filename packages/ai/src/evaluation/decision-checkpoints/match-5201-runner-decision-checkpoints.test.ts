import { describe, expect, it } from "vitest";
import { applyAction } from "@netgrid/engine";

import preserveWallBreakerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-02-preserve-wall-breaker-d98.json";
import initialHqInformationRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5201-01-no-repeat-hq-run-d118.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5201 runner decision checkpoints", () => {
  it("builds the required wall-breaker coverage before another run", () => {
    expectCheckpointToPass(fixture(initialHqInformationRunJson));
  });

  it("preserves the only visible wall breaker against self-inflicted core damage", () => {
    const checkpoint = fixture(preserveWallBreakerJson);
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.fallbackUsed).toBe(false);
    const state = structuredClone(checkpoint.engine.testOnlyGameState);
    state.eventLog = structuredClone(checkpoint.engine.eventPrefix);
    expect(state.runner).toMatchObject({ credits: 0, clicks: 2, tags: 2 });
    expect(state.runner.grip).toHaveLength(3);
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: result.decision!.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw new Error("Native checkpoint draw was rejected");
    expect(applied.state.runner.grip).toHaveLength(4);
    expect(applied.state.runner.grip).toContain("runner_onr_classic_027_early-worm_2");
    expect(applied.state.runner.coreDamage).toBe(state.runner.coreDamage);
    expect(applied.state.runner.rig).toEqual(state.runner.rig);
    expect(applied.state.runner.tags).toBe(2);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
