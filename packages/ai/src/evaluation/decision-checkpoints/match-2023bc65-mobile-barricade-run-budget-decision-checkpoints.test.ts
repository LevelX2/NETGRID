import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import fundedRemoteContestJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2023bc65-01-funded-remote-contest-d72.json";
import allowNonlethalDamageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2023bc65-02-allow-nonlethal-damage-d73.json";
import doNotBreakDoomedDamageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-2023bc65-03-do-not-break-doomed-damage-d76.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const KRASH_INSTANCE_ID = "runner_onr_v1_039_krash_1";
const SPIN_CHIP_INSTANCE_ID =
  "runner_onr_proteus_139_eurocorpse-tm-spin-chip_1";

describe("match 2023BC65 Mobile Barricade run-budget checkpoints", () => {
  it("does not start the historical underfunded remote contest", () => {
    expectCheckpointToPass(fixture(fundedRemoteContestJson));
  });

  it("keeps a funded score contest available at one visible Corp credit", () => {
    const lowCorpCredits = mutateFixture(
      fundedRemoteContestJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        state.runner.credits = 10;
        state.corp.credits = 0;
        state.cardInstances[SPIN_CHIP_INSTANCE_ID]!.counters = { bit: 0 };
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "2023BC65-C01-LOW-CORP-REZ-CAPACITY";
        checkpoint.expectation = {
          acceptableActions: [{ actionId: "runner.start_run.remote_1" }],
        };
      },
    );

    expectCheckpointToPass(lowCorpCredits);
  });

  it("waits when the same known route leaves no reserve against a rich Corp", () => {
    const highCorpCredits = mutateFixture(
      fundedRemoteContestJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        state.runner.credits = 10;
        state.corp.credits = 7;
        state.cardInstances[SPIN_CHIP_INSTANCE_ID]!.counters = { bit: 0 };
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "2023BC65-C02-HIGH-CORP-REZ-CAPACITY";
        checkpoint.expectation = {
          acceptableActions: [{ type: "gain_credit" }],
          forbiddenActions: [{ actionId: "runner.start_run.remote_1" }],
        };
      },
    );

    expectCheckpointToPass(highCorpCredits);
  });

  it("does not count an unhosted Spin Chip for Krash even against a broke Corp", () => {
    const unhosted = mutateFixture(fundedRemoteContestJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.corp.credits = 0;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "2023BC65-C03-UNHOSTED-SPIN-CHIP";
      checkpoint.expectation = {
        forbiddenActions: [{ actionId: "runner.start_run.remote_1" }],
      };
    });

    expectCheckpointToPass(unhosted);
  });

  it("counts Spin Chip credits when Krash is actually hosted on it", () => {
    const hosted = mutateFixture(fundedRemoteContestJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      state.corp.credits = 1;
      state.cardInstances[KRASH_INSTANCE_ID]!.hostedOn = SPIN_CHIP_INSTANCE_ID;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "2023BC65-C04-HOSTED-SPIN-CHIP";
      checkpoint.expectation = {
        acceptableActions: [{ actionId: "runner.start_run.remote_1" }],
      };
    });

    expectCheckpointToPass(hosted);
  });

  it("accepts Mobile Barricades nonlethal net damage instead of pumping", () => {
    expectCheckpointToPass(fixture(allowNonlethalDamageJson));
  });

  it("does not break Mobile Barricades damage after access is already lost", () => {
    expectCheckpointToPass(fixture(doNotBreakDoomedDamageJson));
  });

  it("still starts the safety sequence when Mobile Barricades damage would flatline", () => {
    const lethalDamage = mutateFixture(
      allowNonlethalDamageJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        for (const cardId of state.runner.grip) {
          state.runner.heap.push(cardId);
          state.cardInstances[cardId] = {
            ...state.cardInstances[cardId]!,
            zone: { side: "runner", zone: "heap" },
          };
        }
        state.runner.grip = [];
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "2023BC65-C05-LETHAL-NET-DAMAGE";
        checkpoint.expectation = {
          acceptableActions: [{ type: "pump_breaker" }],
          forbiddenActions: [{ type: "continue_run" }],
        };
      },
    );

    expectCheckpointToPass(lethalDamage);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
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
