import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import politicalCoupPayoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-4d7bd0eb-01-political-coup-before-basic-credit-d57.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const POLITICAL_COUP_INSTANCE_ID = "corp_onr_v1_209_political-coup_1";

describe("match 4d7b Corp scored-card economy payout", () => {
  it("uses a guaranteed three-credit scored-card payout before Basic Credit", () => {
    expectCheckpointToPass(fixture(politicalCoupPayoutJson));
  });

  it("does not force a one-credit remainder over bound score-remote hardening", () => {
    const checkpoint = fixture(politicalCoupPayoutJson);
    const politicalCoup =
      checkpoint.engine.testOnlyGameState.cardInstances[
        POLITICAL_COUP_INSTANCE_ID
      ];
    if (!politicalCoup) throw new Error("Missing Political Coup instance");

    politicalCoup.counters = {
      ...politicalCoup.counters,
      bit: 1,
    };
    checkpoint.expectation = {
      acceptableActions: [
        {
          actionId:
            "corp.install_card.corp_onr_v1_238_data-wall-2-0_1.new_remote.corp_onr_v1_238_data-wall-2-0_1",
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["improve_remote_protection_path"],
        requiredAssessmentEvidence: [
          "corp_layered_remote_ice_staging:remote:strategic-score-remote:new_remote:corp.install_card.corp_onr_v1_238_data-wall-2-0_1.new_remote.corp_onr_v1_238_data-wall-2-0_1:layers_0:unrezzed_0:rez_gap_2",
        ],
      },
    };
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );

    expectCheckpointToPass(checkpoint);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = structuredClone(value) as AiDecisionCheckpointV1;
  checkpoint.source.kind = "synthetic_companion";
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
