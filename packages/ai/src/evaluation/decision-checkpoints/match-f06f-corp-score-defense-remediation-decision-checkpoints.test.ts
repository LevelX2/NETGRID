import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import avoidSuperiorNetBarriersJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f06f-01-avoid-unbounded-snb-score-install-d26.json";
import completeGvaScoreJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f06f-02-complete-gva-same-turn-score-d41.json";
import avoidEncryptionBreakthroughJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f06f-03-avoid-unbounded-encryption-score-install-d52.json";
import fundExistingRdDefenseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f06f-04-fund-existing-rd-defense-before-seventh-layer-d102.json";
import unsafeCorporateWarJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-coup-selfplay-001.json";
import fundedRdLayerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-08-avoid-unfunded-rd-overstack-d110.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match f06f Corp score and defense remediation checkpoints", () => {
  it.each([
    [
      "does not expose Superior Net Barriers without a bounded score horizon",
      avoidSuperiorNetBarriersJson,
    ],
    [
      "completes Genetics-Visionary Acquisition instead of taking free credits",
      completeGvaScoreJson,
    ],
    [
      "does not expose Encryption Breakthrough as immediate Runner matchpoint",
      avoidEncryptionBreakthroughJson,
    ],
    [
      "funds existing R&D defense instead of buying an unfunded seventh layer",
      fundExistingRdDefenseJson,
    ],
  ])("passes the corrected historical behavior: %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("still starts a protected agenda line that can finish in the same turn", () => {
    const checkpoint = mutateFixture(unsafeCorporateWarJson, (value) => {
      value.engine.testOnlyGameState.corp.clicks = 4;
      value.engine.testOnlyGameState.corp.credits = 12;
      value.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_196_corporate-war",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.score_agenda"],
          acceptableCapabilities: ["install_score_agenda"],
        },
      };
    });

    expectCheckpointToPass(checkpoint);
  });

  it("still permits a funded additional R&D layer against visible multiaccess", () => {
    const checkpoint = mutateFixture(fundedRdLayerJson, (value) => {
      const state = value.engine.testOnlyGameState;
      state.corp.credits = 20;
      const interfaceId = state.runner.stack.find(
        (cardId) =>
          state.cardInstances[cardId]?.definitionId ===
          "onr_v1_139_r-and-d-interface",
      );
      if (!interfaceId) throw new Error("Missing R&D Interface control card");
      state.runner.stack = state.runner.stack.filter(
        (cardId) => cardId !== interfaceId,
      );
      state.runner.rig.hardware.push(interfaceId);
      state.cardInstances[interfaceId] = {
        ...state.cardInstances[interfaceId]!,
        zone: { side: "runner", zone: "rig" },
        faceup: true,
        rezzed: false,
      };
      value.expectation = {
        acceptableActions: [
          {
            actionId:
              "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.defend_servers"],
          acceptableCapabilities: ["allocate_server_defense"],
        },
      };
    });

    expectCheckpointToPass(checkpoint);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (checkpoint: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const checkpoint = fixture(value);
  mutation(checkpoint);
  checkpoint.source.kind = "synthetic_companion";
  checkpoint.engine.stateHash = hashGameState(
    checkpoint.engine.testOnlyGameState,
  );
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
