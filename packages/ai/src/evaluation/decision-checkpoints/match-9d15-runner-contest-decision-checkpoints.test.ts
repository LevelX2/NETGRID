import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import urgentRemoteInsideJobJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9d15-01-urgent-remote-inside-job.json";
import multiPointRunLockJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9d15-02-multi-point-run-lock-release.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 9D15 runner contest decision checkpoints", () => {
  it.each([
    [
      "uses the viable bypass run against the urgent single-ICE remote",
      urgentRemoteInsideJobJson,
    ],
    [
      "releases the run lock against the visible multi-point terminal remote",
      multiPointRunLockJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("does not treat bypass as coverage when a second blocking ICE remains", () => {
    const secondIce = mutateFixture(urgentRemoteInsideJobJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const rd = state.corp.servers.find((server) => server.id === "rd");
      const remote = state.corp.servers.find(
        (server) => server.id === "remote_1",
      );
      const outerIceId = rd?.ice[0];
      if (!rd || !remote || !outerIceId) {
        throw new Error("Expected R&D ICE and Remote 1");
      }
      rd.ice = rd.ice.filter((instanceId) => instanceId !== outerIceId);
      remote.ice.push(outerIceId);
      state.cardInstances[outerIceId] = {
        ...state.cardInstances[outerIceId]!,
        zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
      };
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "9D15-C01-BYPASS-LEAVES-BLOCKER";
      checkpoint.expectation = {
        forbiddenActions: [
          {
            actionId:
              "runner.play_event.runner_onr_v1_094_inside-job_2.remote_1.runner_onr_v1_094_inside-job_2",
          },
        ],
        runTargets: [
          {
            actionId:
              "runner.play_event.runner_onr_v1_094_inside-job_2.remote_1.runner_onr_v1_094_inside-job_2",
            targetServerId: "remote_1",
            pathPassability: "blocked_missing_coverage",
            recommendation: "find_breaker_first",
            requiredEvidence: [
              "run_action_projection_bypass_first_ice:true",
            ],
          },
        ],
      };
    });

    expectCheckpointToPass(secondIce);
  });

  it("does not release the run lock without a click for a follow-up run", () => {
    const noFollowUpClick = mutateFixture(
      multiPointRunLockJson,
      (checkpoint) => {
        checkpoint.engine.testOnlyGameState.runner.clicks = 1;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "9D15-C02-NO-FOLLOW-UP-CLICK";
        checkpoint.expectation = {
          forbiddenActions: [{ actionId: "runner.trigger_ability" }],
        };
      },
    );

    expectCheckpointToPass(noFollowUpClick);
  });

  it("does not release the run lock without an advanced remote threat", () => {
    const noRemoteThreat = mutateFixture(
      multiPointRunLockJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        const remote = state.corp.servers.find(
          (server) => server.id === "remote_1",
        );
        const rootId = remote?.root[0];
        if (!rootId) throw new Error("Expected Remote 1 root card");
        state.cardInstances[rootId] = {
          ...state.cardInstances[rootId]!,
          advancementCounters: 0,
        };
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "9D15-C03-NO-REMOTE-THREAT";
        checkpoint.expectation = {
          forbiddenActions: [{ actionId: "runner.trigger_ability" }],
          selectedScoreBreakdown: {
            forbiddenComponentKeys: ["runner_matchpoint_run_lock_release"],
          },
        };
      },
    );

    expectCheckpointToPass(noRemoteThreat);
  });

  it("does not release the run lock when its credit cost is unaffordable", () => {
    const unaffordable = mutateFixture(
      multiPointRunLockJson,
      (checkpoint) => {
        checkpoint.engine.testOnlyGameState.runner.credits = 1;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "9D15-C04-RUN-LOCK-UNAFFORDABLE";
        checkpoint.expectation = {
          forbiddenActions: [{ actionId: "runner.trigger_ability" }],
        };
      },
    );

    expectCheckpointToPass(unaffordable);
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
