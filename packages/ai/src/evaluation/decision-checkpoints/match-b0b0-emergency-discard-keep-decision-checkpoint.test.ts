import { describe, expect, it } from "vitest";
import { applyAction } from "@netgrid/engine";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-b0b0-emergency-discard-keep-d65.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match B0B0 runner emergency discard checkpoint", () => {
  it("retains flatline prevention while the defense plan confirms lethal pressure", () => {
    const checkpoint = structuredClone(
      checkpointJson,
    ) as AiDecisionCheckpointV1;
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.fallbackUsed).toBe(false);
    const state = structuredClone(checkpoint.engine.testOnlyGameState);
    state.eventLog = structuredClone(checkpoint.engine.eventPrefix);
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: result.decision!.actionId!,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: result.decision!.selectedChoices!,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw new Error("Native checkpoint discard was rejected");
    expect(applied.state.runner.grip).toContain(
      "runner_onr_v1_078_arasaka-owns-you_1",
    );
    expect(applied.state.runner.coreDamage).toBe(state.runner.coreDamage);
    expect(applied.state.runner.tags).toBe(state.runner.tags);
  });
});
