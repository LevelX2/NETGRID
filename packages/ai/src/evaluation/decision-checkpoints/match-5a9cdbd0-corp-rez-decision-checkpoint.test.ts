import { describe, expect, it } from "vitest";

import rezFreeVisibleIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5a9cdbd0-00-rez-free-visible-ice-d58.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match 5a9cdbd0 Corp rez regression", () => {
  it("rezzes free visible ICE on the active central run despite unrelated restricted credit pools", () => {
    const result = runAiDecisionCheckpoint(
      rezFreeVisibleIceJson as AiDecisionCheckpointV1,
    );

    expect(result).toMatchObject({ ok: true });
  });
});
