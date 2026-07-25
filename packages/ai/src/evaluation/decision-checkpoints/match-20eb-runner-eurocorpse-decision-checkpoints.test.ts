import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import repeatedEarlyBankJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-01-background-bank-cadence-d39.json";
import viableRunLockReleaseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-02-viable-run-lock-release-d54.json";
import emptyEurocorpseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-03-no-empty-eurocorpse-d55.json";
import hostBeforeOverflowJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-04-host-breaker-before-overflow-d59.json";
import lateBankWithoutNeedJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-05-no-late-bank-without-need-d129.json";
import firstEarlyBankLoadJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-06-first-early-bank-load-control-d38.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const KRASH_INSTANCE_ID = "runner_onr_v1_039_krash_1";
const STREETWARE_DEFINITION_ID = "onr_proteus_150_streetware-distributor";

describe("match 20EB runner and Eurocorpse decision checkpoints", () => {
  it.each([
    [
      "lets a meaningful draw outrank a repeated background-bank load",
      repeatedEarlyBankJson,
    ],
    [
      "releases a cheap run lock when a credible funded follow-up remains",
      viableRunLockReleaseJson,
    ],
    [
      "releases the funded run lock instead of installing an empty Eurocorpse",
      emptyEurocorpseJson,
    ],
    [
      "hosts the available breaker instead of drawing beyond the hand limit",
      hostBeforeOverflowJson,
    ],
    [
      "does not load a delayed bank at opposing matchpoint without a funding need",
      lateBankWithoutNeedJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("keeps the first early background-bank load available", () => {
    expectCheckpointToPass(fixture(firstEarlyBankLoadJson));
  });

  it("does not release the run lock without a follow-up click", () => {
    const noFollowUpClick = mutateFixture(
      viableRunLockReleaseJson,
      (checkpoint) => {
        checkpoint.engine.testOnlyGameState.runner.clicks = 1;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "20EB-C02-NO-FOLLOW-UP-CLICK";
        checkpoint.expectation = {
          forbiddenActions: [{ actionId: "runner.trigger_ability" }],
        };
      },
    );

    expectCheckpointToPass(noFollowUpClick);
  });

  it("keeps a hostable Eurocorpse development below a productive P4 central-pressure run", () => {
    const hostableBreaker = mutateFixture(emptyEurocorpseJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      state.runner.stack = state.runner.stack.filter(
        (instanceId) => instanceId !== KRASH_INSTANCE_ID,
      );
      state.runner.grip.push(KRASH_INSTANCE_ID);
      state.runnerTurnFlags!.runnerRunLockCreditCost = 0;
      state.cardInstances[KRASH_INSTANCE_ID] = {
        ...state.cardInstances[KRASH_INSTANCE_ID]!,
        zone: { side: "runner", zone: "grip" },
      };
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "20EB-C03-HOSTABLE-EUROCORPSE";
      checkpoint.expectation = {
        acceptableActions: [{ actionId: "runner.start_run.rd" }],
        planExecution: {
          acceptablePlanKinds: ["runner.pressure_central"],
          acceptableCapabilities: ["pressure_rd_information"],
          requiredAssessmentEvidence: ["target:rd"],
        },
      };
    });

    expectCheckpointToPass(hostableBreaker);
  });

  it("keeps draw or a funded run-lock release available below the hand limit", () => {
    const belowHandLimit = mutateFixture(
      hostBeforeOverflowJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        const expendableId = state.runner.grip.find(
          (instanceId) => instanceId !== KRASH_INSTANCE_ID,
        );
        if (!expendableId) throw new Error("Expected an expendable grip card");
        state.runner.grip = state.runner.grip.filter(
          (instanceId) => instanceId !== expendableId,
        );
        state.runner.heap.push(expendableId);
        state.cardInstances[expendableId] = {
          ...state.cardInstances[expendableId]!,
          zone: { side: "runner", zone: "heap" },
        };
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "20EB-C04-DRAW-BELOW-HAND-LIMIT";
        checkpoint.expectation = {
          acceptableActions: [
            { actionId: "runner.draw_card" },
            { actionId: "runner.trigger_ability" },
          ],
        };
      },
    );

    expectCheckpointToPass(belowHandLimit);
  });

  it("uses direct code-gate search before another background-bank load", () => {
    const noMeaningfulAlternative = mutateFixture(
      repeatedEarlyBankJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        state.runner.maxHandSize = 1;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId =
          "20EB-C05-REPEATED-BANK-WITHOUT-MEANINGFUL-ALTERNATIVE";
        checkpoint.expectation = {
          acceptableActions: [
            {
              type: "activated_card_ability",
              sourceDefinitionId: "onr_v1_177_the-short-circuit",
            },
          ],
          forbiddenActions: [
            {
              type: "activated_card_ability",
              sourceDefinitionId: STREETWARE_DEFINITION_ID,
            },
          ],
          planExecution: {
            acceptablePlanKinds: ["runner.rig_and_coverage"],
            acceptableCapabilities: ["search_answer_breaker_code_gate"],
            requiredAssessmentEvidence: [
              "deck_strategy_open_code_gate_coverage",
            ],
          },
        };
      },
    );

    expectCheckpointToPass(noMeaningfulAlternative);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-20eb-03-no-empty-eurocorpse-d55",
      "cp-20eb-05-no-late-bank-without-need-d129",
    ],
  );
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
