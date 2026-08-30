import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import zeroCreditRdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-01-zero-credit-rd-risk.json";
import junkyardJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-02-junkyard-not-economy.json";
import blockedInsideJobJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-03-inside-job-blocked-unpayable.json";
import knownAbortJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-04-known-unpayable-run-abort.json";
import earlyCheckRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-05-early-remote-check-run.json";
import livewireJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-06-livewire-real-economy.json";
import fundedRdTargetEvaluationJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-07-funded-known-rd-target-evaluation.json";
import reachableInsideJobJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-four-match-02-inside-job-rd.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match E8886 runner decision checkpoints", () => {
  it.each([
    ["E8886-F01 funds before a zero-credit unknown R&D path", zeroCreditRdJson],
    ["E8886-F02 does not treat empty-heap Junkyard as economy", junkyardJson],
    [
      "E8886-F03 rejects an action-specific unpayable Inside Job",
      blockedInsideJobJson,
    ],
    ["E8886-F04 jacks out of a known unpayable remaining path", knownAbortJson],
  ])("satisfies %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("keeps the early unknown-ICE check-run before breaker installation", () => {
    expectCheckpointToPass(fixture(earlyCheckRunJson));
  });

  it("classifies a fully known and exactly funded R&D path as runnable without requiring it to win central target selection", () => {
    expectCheckpointToPass(fixture(fundedRdTargetEvaluationJson));
  });

  it("keeps Livewire's Contacts as real economy", () => {
    expectCheckpointToPass(fixture(livewireJson));
  });

  it("keeps a reachable Inside Job line legal while funding its reserve", () => {
    const result = runAiDecisionCheckpoint(fixture(reachableInsideJobJson));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(
      result.input.legalActions.some(
        (action) =>
          action.type === "play_event" &&
          action.actionId.includes("onr_v1_094_inside-job") &&
          action.payload?.serverId === "rd",
      ),
    ).toBe(true);
  });

  it("keeps recovery setup available when the heap has a visible target", () => {
    const recoveryTarget = mutateFixture(junkyardJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const target = state.runner.grip.find(
        (instanceId) =>
          state.cardInstances[instanceId]?.definitionId ===
          "onr_v1_079_bodyweight-synthetic-blood",
      );
      if (!target) throw new Error("Expected Bodyweight recovery target");
      state.runner.grip = state.runner.grip.filter(
        (instanceId) => instanceId !== target,
      );
      state.runner.heap.push(target);
      state.cardInstances[target] = {
        ...state.cardInstances[target]!,
        zone: { side: "runner", zone: "heap" },
      };
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "E8886-C04-RECOVERY-TARGET";
      checkpoint.expectation = {
        acceptableActions: [{ actionId: "runner.gain_credit" }],
        planExecution: {
          acceptablePlanKinds: ["runner.economy"],
          acceptableCapabilities: ["gain_general_liquid_credits"],
          requiredAssessmentEvidence: [
            "runner_development_funding:card:runner_onr_v1_165_junkyard-bbs_1",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(recoveryTarget);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.executionOrigin
        ?.rootPlanInstanceId,
    ).toBe(
      "plan:runner.develop_board_and_hand:card%3Arunner_onr_v1_165_junkyard-bbs_1",
    );
    const portfolioItems =
      result.decision?.decisionDebug?.detailSections?.find(
        (section) => section.id === "plan_portfolio",
      )?.items ?? [];
    expect(
      portfolioItems.some(
        (item) =>
          item.includes("module:runner.develop_board_and_hand") &&
          item.includes("card%3Arunner_onr_v1_165_junkyard-bbs_1") &&
          item.includes("phase:fund") &&
          item.includes("viability:ready"),
      ),
    ).toBe(true);
  });

  it("assigns an installed Junkyard top-card recovery action to the development plan", () => {
    const installedRecovery = mutateFixture(junkyardJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const junkyard = state.runner.grip.find(
        (instanceId) =>
          state.cardInstances[instanceId]?.definitionId ===
          "onr_v1_165_junkyard-bbs",
      );
      const target = state.runner.grip.find(
        (instanceId) =>
          state.cardInstances[instanceId]?.definitionId ===
          "onr_v1_079_bodyweight-synthetic-blood",
      );
      if (!junkyard || !target)
        throw new Error("Expected Junkyard and recovery target");
      state.runner.grip = state.runner.grip.filter(
        (instanceId) => instanceId !== junkyard && instanceId !== target,
      );
      state.runner.rig.resources.push(junkyard);
      state.runner.heap.push(target);
      state.cardInstances[junkyard] = {
        ...state.cardInstances[junkyard]!,
        zone: { side: "runner", zone: "rig" },
      };
      state.cardInstances[target] = {
        ...state.cardInstances[target]!,
        zone: { side: "runner", zone: "heap" },
      };
      state.runner.credits = 9;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "E8886-C06-INSTALLED-TOP-RECOVERY";
      checkpoint.expectation = {
        forbiddenActions: [{ actionId: "runner.end_turn" }],
      };
    });

    const result = runAiDecisionCheckpoint(installedRecovery);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const portfolioItems =
      result.decision?.decisionDebug?.detailSections?.find(
        (section) => section.id === "plan_portfolio",
      )?.items ?? [];
    expect(
      portfolioItems.some(
        (item) =>
          item.includes("module:runner.develop_board_and_hand") &&
          item.includes("recovery") &&
          item.includes("viability:ready"),
      ),
    ).toBe(true);
  });

  it("continues when the same remaining known path is now affordable", () => {
    const fundedContinuation = mutateFixture(knownAbortJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.credits = 2;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "E8886-C05-FUNDED-CONTINUE";
      checkpoint.expectation = {
        acceptableActions: [{ actionId: "runner.continue_run" }],
      };
    });

    expectCheckpointToPass(fundedContinuation);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-e8886-03-inside-job-blocked-unpayable",
      "cp-four-match-02-inside-job-rd",
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
