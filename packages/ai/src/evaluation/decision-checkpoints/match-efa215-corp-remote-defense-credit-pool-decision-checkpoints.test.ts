import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import projectBabylonCreditPoolJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-efa215-01-protect-project-babylon-with-visible-breaker-credit.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const PROJECT_BABYLON = "corp_onr_v1_214_project-babylon_1";

describe("match EFA215 Corp remote-defense credit-pool decision checkpoints", () => {
  it("protects Project Babylon with an additional ICE despite a visible recurring breaker credit", () => {
    expectCheckpointToPass(fixture(projectBabylonCreditPoolJson));
  });

  it("does not turn an empty remote into a blind additional-ICE target", () => {
    const noResidentPayoff = mutateFixture(projectBabylonCreditPoolJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const remote = state.corp.servers.find((server) => server.id === "remote_1");
      if (!remote) throw new Error("Missing Remote 1 in EFA215 counterprobe");
      remote.root = remote.root.filter((cardId) => cardId !== PROJECT_BABYLON);
      state.corp.archives.push(PROJECT_BABYLON);
      const project = state.cardInstances[PROJECT_BABYLON];
      if (!project) throw new Error("Missing Project Babylon in EFA215 counterprobe");
      project.zone = { side: "corp", zone: "archives" };
      project.faceup = true;
      checkpoint.expectation = {
        forbiddenActions: [{ type: "install_card", targetServerId: "remote_1" }],
      };
    });

    expectCheckpointToPass(noResidentPayoff);
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
  checkpoint.engine.stateHash = hashGameState(checkpoint.engine.testOnlyGameState);
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
