import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import projectBabylonCreditPoolJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-efa215-01-protect-project-babylon-with-visible-breaker-credit.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const PROJECT_BABYLON = "corp_onr_v1_214_project-babylon_1";
const TYCHO_EXTENSION = "corp_onr_v1_220_tycho-extension_1";

describe("match EFA215 Corp remote-defense credit-pool decision checkpoints", () => {
  it("preserves the exposed agenda conversion clock before adding central ICE", () => {
    const protectedRemote = fixture(projectBabylonCreditPoolJson);
    protectedRemote.expectation.acceptableActions = [
      {
        actionId: `corp.advance_card.${PROJECT_BABYLON}.${PROJECT_BABYLON}`,
      },
    ];
    protectedRemote.expectation.planExecution = {
      acceptablePlanKinds: ["corp.score_agenda"],
      acceptableCapabilities: ["advance_score_agenda"],
      requiredAssessmentEvidence: [
        "corp_exposed_agenda_progress_preserves_conversion_clock:remote_1",
      ],
    };

    expectCheckpointToPass(protectedRemote);
  });

  it("defends the urgent Archives agenda before preparing an empty remote", () => {
    const noResidentPayoff = mutateFixture(
      projectBabylonCreditPoolJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        const remote = state.corp.servers.find(
          (server) => server.id === "remote_1",
        );
        if (!remote) throw new Error("Missing Remote 1 in EFA215 counterprobe");
        remote.root = remote.root.filter(
          (cardId) => cardId !== PROJECT_BABYLON,
        );
        state.corp.archives.push(PROJECT_BABYLON);
        const project = state.cardInstances[PROJECT_BABYLON];
        if (!project)
          throw new Error("Missing Project Babylon in EFA215 counterprobe");
        project.zone = { side: "corp", zone: "archives" };
        project.faceup = true;
        checkpoint.expectation = {
          acceptableActions: [
            { type: "install_card", targetServerId: "archives" },
          ],
          forbiddenActions: [
            { type: "advance_card" },
            { type: "install_card", targetServerId: "remote_1" },
          ],
          planExecution: {
            acceptablePlanKinds: ["corp.defend_servers"],
            acceptableCapabilities: ["allocate_server_defense"],
          },
        };
      },
    );

    expectCheckpointToPass(noResidentPayoff);
  });

  it("keeps terminal R&D protection ahead of a resident score-protection sibling", () => {
    const terminalCentral = mutateFixture(
      projectBabylonCreditPoolJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        state.corp.rd = state.corp.rd.filter(
          (cardId) => cardId !== TYCHO_EXTENSION,
        );
        state.runner.scoreArea.push(TYCHO_EXTENSION);
        const tycho = state.cardInstances[TYCHO_EXTENSION];
        if (!tycho) throw new Error("Missing Tycho Extension in EFA215 probe");
        tycho.zone = { side: "runner", zone: "scoreArea" };
        tycho.faceup = true;
        tycho.rezzed = true;
        checkpoint.expectation = {
          acceptableActions: [
            {
              type: "install_card",
              targetServerId: "rd",
              sourceDefinitionId: "onr_v1_270_sleeper",
            },
          ],
          forbiddenActions: [
            { type: "install_card", targetServerId: "remote_1" },
          ],
          planExecution: {
            acceptablePlanKinds: ["corp.defend_servers"],
            acceptableCapabilities: ["allocate_server_defense"],
          },
        };
      },
    );

    expectCheckpointToPass(terminalCentral);
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
  checkpoint.engine.stateHash = hashGameState(
    checkpoint.engine.testOnlyGameState,
  );
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
