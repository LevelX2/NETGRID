import { describe, expect, it } from "vitest";

import coverEmptyRdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2f758ea1-00-cover-empty-rd-with-visible-ice-d8.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match 2f758ea1 Corp central coverage regression", () => {
  it("covers empty R&D when HQ is protected and supported ICE is visible in HQ", () => {
    const result = runAiDecisionCheckpoint(
      coverEmptyRdJson as AiDecisionCheckpointV1,
    );

    expect(result).toMatchObject({ ok: true });
  });
});
