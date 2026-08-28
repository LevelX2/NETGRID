import { describe, expect, it } from "vitest";

import harmfulNonEtrBreakJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5285-140-harmful-non-etr-break.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5285 runner harmful non-ETR break decision checkpoint", () => {
  it("keeps terminal remote contest ownership despite the visible damage-buffer warning", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(harmfulNonEtrBreakJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      selectedStep: {
        planInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      },
    });
  });
});
