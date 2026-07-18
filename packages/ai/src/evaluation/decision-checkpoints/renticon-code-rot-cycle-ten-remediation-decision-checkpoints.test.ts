import { describe, expect, it } from "vitest";

import fundExposedRemoteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c10-01-fund-exposed-remote-seed003-d117.json";
import safeLowCreditAdvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c10-02-safe-low-credit-advance-seed004-d120.json";
import safeAdvanceControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c5-01-advance-over-passive-support-seed002-d177.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Rent-I-Con versus CODE ROT cycle-ten remediation checkpoints", () => {
  it("funds before advancing an exposed remote with the last credit", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(fundExposedRemoteJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps advancing when the scoreline window is genuinely safe", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(safeAdvanceControlJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps the last-credit advance when no unrezzed remote ice needs funding", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(safeLowCreditAdvanceJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
