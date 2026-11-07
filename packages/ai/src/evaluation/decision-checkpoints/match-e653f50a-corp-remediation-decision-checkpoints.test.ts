import { describe, expect, it } from "vitest";
import { applyAction } from "@netgrid/engine";

import tychoFalseSameTurnJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-01-tycho-false-same-turn.json";
import synchronizedAttackRetainJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-02-synchronized-attack-retain-value.json";
import avoidZeroNeedArchivesIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-03-avoid-zero-need-archives-ice.json";
import validHostileSameTurnJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e653f50a-04-valid-hostile-same-turn.json";
import rdBeforeBackgroundRemoteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-06-rd-before-background-remote.json";
import rdBeforeThirdEmptyRemoteLayerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-07-rd-before-third-empty-remote-layer.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";

describe("match e653f50a Corp remediation decision checkpoints", () => {
  it.each([
    ["rejects the false Tycho same-turn conversion", tychoFalseSameTurnJson],
    [
      "retains valuable HQ cards without blindly paying for the maximum",
      synchronizedAttackRetainJson,
    ],
    [
      "does not ICE zero-need Archives and activates current global ICE support",
      avoidZeroNeedArchivesIceJson,
    ],
    [
      "keeps the real Hostile Takeover same-turn conversion",
      validHostileSameTurnJson,
    ],
    [
      "uses exact basic liquidity instead of unaffordable R&D protection or a background scoring remote",
      rdBeforeBackgroundRemoteJson,
    ],
    [
      "avoids a third empty-remote ICE layer while allowing a protected score plan",
      rdBeforeThirdEmptyRemoteLayerJson,
    ],
  ])("%s", (_label, json) => {
    const checkpoint = fixture(json);
    if (json === avoidZeroNeedArchivesIceJson) {
      checkpoint.expectation.acceptableActions = [
        {
          actionId:
            "corp.rez_card.corp_onr_v1_320_encoder-inc_1.remote_1.corp_onr_v1_320_encoder-inc_1",
        },
      ];
      checkpoint.expectation.planExecution = {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["allocate_server_defense"],
      };
    }
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    if (json === avoidZeroNeedArchivesIceJson) {
      const before = structuredClone(checkpoint.engine.testOnlyGameState);
      before.eventLog = structuredClone(checkpoint.engine.eventPrefix);
      const paid = applyAction(before, {
        matchId: before.matchId,
        side: "corp",
        actionId: result.decision!.actionId!,
        clientKnownStateVersion: before.stateVersion,
      });
      expect(paid.ok).toBe(true);
      if (!paid.ok) throw Error(JSON.stringify(paid.error));
      expect(
        paid.state.cardInstances["corp_onr_v1_320_encoder-inc_1"]!.rezzed,
      ).toBe(true);
      expect(paid.state.corp.clicks).toBe(before.corp.clicks);
      expect(paid.state.corp.servers).toEqual(before.corp.servers);
    }
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
  );
}
