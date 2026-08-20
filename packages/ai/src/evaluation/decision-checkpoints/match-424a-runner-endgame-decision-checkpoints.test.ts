import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import forceShieldJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-01-force-shield-vs-krash.json";
import insideJobArchivesJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-02-inside-job-archives.json";
import mramJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-03-mram-not-mu.json";
import remoteInformationJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-04-matchpoint-remote-information.json";
import blockedMatchpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-05-blocked-matchpoint-sequence.json";
import krashPathJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-06-krash-path-unpayable.json";
import fallGuyTagAvoidanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-07-fall-guy-tag-avoidance.json";
import firstDamagePreventionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-08-force-shield-damage-prevention.json";
import discardPathToolsJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-09-discard-path-tools.json";
import secondDamagePreventionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-424a-10-force-shield-damage-prevention.json";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 424A runner endgame decision checkpoints", () => {
  it.each([
    ["424A-F01 Krash before redundant Force Shield", forceShieldJson],
    [
      "424A-F02 builds the liquid reserve instead of using Inside Job on Archives",
      insideJobArchivesJson,
    ],
    [
      "424A-F04 converts the current Broker bank before the matchpoint remote",
      remoteInformationJson,
    ],
    [
      "424A-F05 converts the current Broker bank before the blocked matchpoint",
      blockedMatchpointJson,
    ],
  ])("satisfies %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("keeps corrected MRAM hand-size semantics at the historical decision", () => {
    expectCheckpointToPass(fixture(mramJson));
  });

  it("trashes Fall Guy to avoid the historical Hunter tag", () => {
    expectCheckpointToPass(fixture(fallGuyTagAvoidanceJson));
  });

  it.each([
    [
      "D51 prevents the visible Vacant Soulkiller damage",
      firstDamagePreventionJson,
    ],
    [
      "D118 prevents the visible Neural Blade damage",
      secondDamagePreventionJson,
    ],
  ])("uses Force Shield at %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("retains the unique path tools at the historical D93 discard", () => {
    expectCheckpointToPass(fixture(discardPathToolsJson));
  });

  it("classifies the installed-Krash HQ path as unpayable rather than missing wall coverage", () => {
    const result = runAiDecisionCheckpoint(fixture(krashPathJson));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);

    const hq = evaluateRunnerRunTargets({ input: result.input }).find(
      (target) => target.actionId === "runner.start_run.hq",
    );
    expect(hq).toMatchObject({
      pathPassability: "blocked_unpayable",
      pathCost: 14,
      creditsAfterRun: -2,
      recommendation: "gain_credits_first",
    });
    expect(hq?.evidence).toEqual(
      expect.arrayContaining([
        "path_passability:blocked_unpayable",
        "visible_break_cost:14",
      ]),
    );
  });

  it("keeps a real missing-Wall-coverage state distinct", () => {
    const missingCoverage = mutateFixture(krashPathJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const krash = state.runner.rig.programs.find(
        (instanceId) =>
          state.cardInstances[instanceId]?.definitionId === "onr_v1_039_krash",
      );
      if (!krash) throw new Error("Expected installed Krash control card");
      const wallBreakers = state.runner.rig.programs.filter(
        (instanceId) =>
          state.cardInstances[instanceId]?.definitionId === "onr_v1_039_krash",
      );
      state.runner.rig.programs = state.runner.rig.programs.filter(
        (instanceId) => !wallBreakers.includes(instanceId),
      );
      for (const breaker of wallBreakers) {
        state.runner.heap.push(breaker);
        state.cardInstances[breaker] = {
          ...state.cardInstances[breaker]!,
          zone: { side: "runner", zone: "heap" },
        };
      }
      const hq = state.corp.servers.find((server) => server.id === "hq");
      const neuralBlade = hq?.ice.find(
        (instanceId) =>
          state.cardInstances[instanceId]?.definitionId ===
          "onr_v1_258_neural-blade",
      );
      if (!neuralBlade)
        throw new Error("Expected rezzed Neural Blade control ICE");
      state.cardInstances[neuralBlade] = {
        ...state.cardInstances[neuralBlade]!,
        rezzed: false,
      };
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "424A-F06-MISSING-COVERAGE-CONTROL";
      delete checkpoint.expectation.runTargets;
      checkpoint.expectation = {
        acceptableActions: [
          {
            actionId:
              "runner.activated_card_ability.runner_onr_v1_165_junkyard-bbs_2.runner_onr_v1_165_junkyard-bbs_2.runner_onr_v1_039_krash_1.activated.onr_v1_165_junkyard-bbs:abilities_activated_runner_main_move_top_trash_to_grip.runner_onr_v1_039_krash_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["runner.rig_and_coverage"],
          acceptableCapabilities: ["search_answer_breaker_wall"],
          requiredAssessmentEvidence: ["target:hq"],
        },
      };
    });
    const result = runAiDecisionCheckpoint(missingCoverage);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);

    const hq = evaluateRunnerRunTargets({ input: result.input }).find(
      (target) => target.actionId === "runner.start_run.hq",
    );
    expect(hq).toMatchObject({
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
  });

  it("keeps a funded installed-Krash path reachable", () => {
    const funded = mutateFixture(krashPathJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.credits = 14;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "424A-F06-FUNDED-KRASH-CONTROL";
    });
    const result = runAiDecisionCheckpoint(funded);
    const hq = evaluateRunnerRunTargets({ input: result.input }).find(
      (target) => target.actionId === "runner.start_run.hq",
    );
    expect(hq).toMatchObject({
      pathPassability: "reachable",
      pathCost: 14,
      creditsAfterRun: 0,
    });
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
