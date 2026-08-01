import { describe, expect, it } from "vitest";

import inactiveAgendaProtectionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed02-01-inactive-agenda-protection-d181.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("baseline Seed 02 effect-activation checkpoint", () => {
  it("keeps the agenda in its score plan while defense may draw or stage exact ICE", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(inactiveAgendaProtectionJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });
});
