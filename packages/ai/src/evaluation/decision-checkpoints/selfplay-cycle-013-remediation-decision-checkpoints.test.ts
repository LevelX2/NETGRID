import { describe, expect, it } from "vitest";

import scoreBeforeDefenseDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-013-03-score-before-defense-draw-d483.json";
import lastDrawScoreContinuationJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-013-04-last-draw-score-continuation-d578.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("selfplay cycle 013 remediation decision checkpoints", () => {
  it("keeps the exact same-turn matchpoint score ahead of a speculative central-defense draw", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(scoreBeforeDefenseDrawJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("advance_card");
    expect(result.decision?.decisionDebug?.planKind).toBe("corp.score_agenda");
  });

  it("keeps the admitted last-draw matchpoint score project through its advance phase", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(lastDrawScoreContinuationJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("advance_card");
    expect(result.decision?.decisionDebug?.planKind).toBe("corp.score_agenda");
  });
});
