import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/corp-highlighter-purge-pressure.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("corp Highlighter purge pressure checkpoint", () => {
  it("keeps exact score-defense draw above noncritical virus pressure", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result).toMatchObject({
      ok: true,
      decision: {
        actionId: "corp.draw_card",
        reasonCode: "plan_first.corp.defend_servers",
      },
    });
    expect(result.decision?.decisionDebug?.visibleReasons).toContain(
      "plan_priority_class:P4",
    );
  });
});
