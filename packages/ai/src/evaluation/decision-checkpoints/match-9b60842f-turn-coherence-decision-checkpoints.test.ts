import { describe, expect, it } from "vitest";

import continueDefenseD4Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9b60842f-01-continue-central-defense-d4.json";
import noOvercapacityDrawD5Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9b60842f-02-no-overcapacity-draw-d5.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match 9b60842f Corp turn-coherence checkpoints", () => {
  it("already continues the financed central-defense parent on current code", () => {
    const result = runAiDecisionCheckpoint(fixture(continueDefenseD4Json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("install_card");
    expect(result.decision?.decisionDebug?.planKind).toBe(
      "corp.defend_servers",
    );
  });

  it("already avoids the historical full-HQ score-material draw on current code", () => {
    const result = runAiDecisionCheckpoint(fixture(noOvercapacityDrawD5Json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("install_card");
    expect(result.decision?.decisionDebug?.planKind).toBe(
      "corp.defend_servers",
    );
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
