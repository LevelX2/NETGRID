import { describe, expect, it } from "vitest";

import pumpScoreThreatJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-094-01-repeated-score-threat-pump-d187.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("selfplay cycle 094 decision checkpoints", () => {
  it("pumps Krash repeatedly before the bound score-threat ETR", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(pumpScoreThreatJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, result.message).toBe(true);
    expect(result.selectedAction?.type).toBe("pump_breaker");
    expect(result.decision?.decisionDebug?.planKind).toBe(
      "runner.convert_run_window",
    );
    expect(result.decision?.evidence).toContain(
      "plan_step_capability:convert_active_run_window",
    );
  });
});
