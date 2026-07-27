import { describe, expect, it } from "vitest";

import preparedShellTradersBreakerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-0c77a1fb-01-prepared-shell-traders-breaker-score-threat.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 0c77a1fb prepared Shell Traders breaker score-threat checkpoint", () => {
  it("does not install Corporate Retreat into the remote protected only by Filter", () => {
    const result = runAiDecisionCheckpoint(
      preparedShellTradersBreakerJson as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
