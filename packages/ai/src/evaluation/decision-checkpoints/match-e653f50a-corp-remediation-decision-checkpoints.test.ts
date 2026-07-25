import { describe, expect, it } from "vitest";

import tychoFalseSameTurnJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-01-tycho-false-same-turn.json";
import synchronizedAttackRetainJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-02-synchronized-attack-retain-value.json";
import avoidZeroNeedArchivesIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-03-avoid-zero-need-archives-ice.json";
import validHostileSameTurnJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-04-valid-hostile-same-turn.json";
import rdBeforeBackgroundRemoteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-06-rd-before-background-remote.json";
import rdBeforeThirdEmptyRemoteLayerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-07-rd-before-third-empty-remote-layer.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match e653f50a Corp remediation decision checkpoints", () => {
  it.each([
    ["rejects the false Tycho same-turn conversion", tychoFalseSameTurnJson],
    [
      "retains valuable HQ cards without blindly paying for the maximum",
      synchronizedAttackRetainJson,
    ],
    [
      "does not ICE zero-need Archives over economy recovery",
      avoidZeroNeedArchivesIceJson,
    ],
    [
      "keeps the real Hostile Takeover same-turn conversion",
      validHostileSameTurnJson,
    ],
    [
      "protects R&D before starting a background scoring remote",
      rdBeforeBackgroundRemoteJson,
    ],
    [
      "avoids a third empty-remote ICE layer while allowing a protected score plan",
      rdBeforeThirdEmptyRemoteLayerJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
