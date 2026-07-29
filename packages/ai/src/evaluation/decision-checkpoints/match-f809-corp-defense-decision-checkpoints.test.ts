import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import fundedLastClickD10Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-01-rd-funded-last-click-d10.json";
import rezSupportD13Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-02-rd-rez-support-route-d13.json";
import retainDefenseD30Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-03-retain-rd-defense-package-d30.json";
import fundedLastClickD34Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-04-rd-funded-last-click-d34.json";
import stagedLastClickD45Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-05-rd-staged-bluff-last-click-d45.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match f809 Corp defense decision checkpoints", () => {
  it.each([
    [
      "uses the last click for funded R&D defense after the first access",
      fundedLastClickD10Json,
    ],
    [
      "starts the R&D defense route while rez support is available",
      rezSupportD13Json,
    ],
    [
      "uses the last click for funded R&D defense after repeated accesses",
      fundedLastClickD34Json,
    ],
    [
      "stages R&D ICE when installation and delayed funding reach the same rez horizon",
      stagedLastClickD45Json,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("retains an executable R&D defense package during the HQ payment choice", () => {
    expectCheckpointToPass(fixture(retainDefenseD30Json));
  });

  it("revalidates the underfunded R&D rez-support follow-up after installation", () => {
    const checkpoint = derivedRezSupportFixture(3);
    checkpoint.expectation = {
      acceptableActions: [
        {
          type: "play_operation",
          sourceDefinitionId: "onr_proteus_051_rent-to-own-contract",
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["allocate_server_defense"],
        requiredAssessmentEvidence: [
          "corp_revalidated_ice_rez_support:rd:installment:duration_6:direct_gap_3:action_cost_0",
        ],
      },
    };
    expectCheckpointToPass(checkpoint);
  });

  it("does not spend a rez-support operation when direct rez is funded", () => {
    const checkpoint = derivedRezSupportFixture(6);
    checkpoint.expectation = {
      forbiddenActions: ICE_REZ_SUPPORT_OPERATIONS.map(
        (sourceDefinitionId) => ({
          type: "play_operation" as const,
          sourceDefinitionId,
        }),
      ),
    };
    expectCheckpointToPass(checkpoint);
  });

  it("does not spend a rez-support operation without recent central pressure", () => {
    const checkpoint = derivedRezSupportFixture(3);
    checkpoint.engine.eventPrefix = [];
    checkpoint.engine.testOnlyGameState.eventLog = [];
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      forbiddenActions: ICE_REZ_SUPPORT_OPERATIONS.map(
        (sourceDefinitionId) => ({
          type: "play_operation" as const,
          sourceDefinitionId,
        }),
      ),
    };
    expectCheckpointToPass(checkpoint);
  });
});

const ICE_REZ_SUPPORT_OPERATIONS = [
  "onr_proteus_049_emergency-rig",
  "onr_proteus_051_rent-to-own-contract",
] as const;

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function derivedRezSupportFixture(credits: number): AiDecisionCheckpointV1 {
  const checkpoint = fixture(rezSupportD13Json);
  const state = structuredClone(checkpoint.engine.testOnlyGameState);
  const installAction = getLegalActions(state, "corp").find(
    (action) =>
      action.type === "install_card" &&
      action.payload?.serverId === "rd" &&
      action.payload.cardId === "corp_onr_proteus_017_credit-blocks_2",
  );
  if (!installAction) throw new Error("Missing historical R&D install action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: installAction.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `match-f809-rez-support:${credits}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  const nextState = result.state;
  nextState.corp.credits = credits;
  nextState.corp.clicks = 2;
  nextState.eventLog = structuredClone(checkpoint.engine.eventPrefix);
  checkpoint.checkpointId = `cp-f809-derived-rez-support-${credits}`;
  checkpoint.source.kind = "synthetic_companion";
  checkpoint.source.findingId = "match-f809-revalidated-rez-support";
  checkpoint.source.stateVersion = nextState.stateVersion;
  checkpoint.engine.stateVersion = nextState.stateVersion;
  checkpoint.engine.testOnlyGameState = nextState;
  checkpoint.engine.stateHash = hashGameState(nextState);
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
