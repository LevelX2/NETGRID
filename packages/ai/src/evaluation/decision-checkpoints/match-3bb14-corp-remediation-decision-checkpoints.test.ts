import { describe, expect, it } from "vitest";

import scoredOnlyTimingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-01-scored-only-tag-timing-d39.json";
import realisticScoreHorizonJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-02-realistic-score-horizon-d40.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { scoringWindowPostRezProtectionAssessment } from "../../runtime/corp-scoreline/semantic-runtime-corp-scoring-window-projection";

describe("match 3bb14 Corp remediation decision checkpoints", () => {
  it.each([
    [
      "funds exact score protection instead of exposing Strike Force Kali to the staged breaker",
      scoredOnlyTimingJson,
      [
        "plan_priority_class:P4",
        "plan_priority_delegated_from:plan:corp.score_agenda:agenda%3Acorp_onr_v1_217_strike-force-kali_1%3Aremote_1",
      ],
    ],
    [
      "funds defense for the exact Private Cybernet Police score parent",
      realisticScoreHorizonJson,
      [
        "plan_priority_class:P3",
        "plan_module:corp.score_agenda",
      ],
    ],
  ] as const)("%s", (_label, json, requiredDecisionEvidence) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    for (const evidence of requiredDecisionEvidence) {
      expect(result.decision?.evidence).toContain(evidence);
    }
  });

  it("counts a public Shell-Traders breaker when it is reachable before scoring", () => {
    const result = runAiDecisionCheckpoint(fixture(realisticScoreHorizonJson));
    const remote = result.input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remote) throw new Error("Missing captured scoring remote");

    const currentAccess = scoringWindowPostRezProtectionAssessment(
      result.input,
      remote,
    );
    const exposureAccess = scoringWindowPostRezProtectionAssessment(
      result.input,
      remote,
      3,
    );

    expect(currentAccess.runnerCanReachAccessNow).toBe(true);
    expect(currentAccess.evidence).toContain(
      "public_staged_breaker_install_credit_cost:2",
    );
    expect(exposureAccess.runnerCanReachAccessNow).toBe(true);
    expect(exposureAccess.visibleRunnerIcebreakerCount).toBe(1);
    expect(exposureAccess.evidence).toContain(
      "public_staged_breaker_used:true",
    );
    expect(exposureAccess.evidence).toContain(
      "public_staged_breaker_install_credit_cost:2",
    );

    const alreadyAtRunnerTurn = structuredClone(result.input);
    alreadyAtRunnerTurn.playerView.activeSide = "runner";
    const runnerTurnRemote = alreadyAtRunnerTurn.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    expect(
      scoringWindowPostRezProtectionAssessment(
        alreadyAtRunnerTurn,
        runnerTurnRemote,
      )
        .evidence,
    ).toContain("public_staged_breaker_install_credit_cost:3");
  });

  it("does not count the staged breaker without its visible install source", () => {
    const result = runAiDecisionCheckpoint(fixture(realisticScoreHorizonJson));
    const input = structuredClone(result.input);
    input.playerView.opponent.rig = (
      input.playerView.opponent.rig ?? []
    ).filter((card) => card.definitionId !== "onr_v1_176_the-shell-traders");
    const remote = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remote) throw new Error("Missing captured scoring remote");

    const exposureAccess = scoringWindowPostRezProtectionAssessment(
      input,
      remote,
      3,
    );

    expect(exposureAccess.runnerCanReachAccessNow).toBe(false);
    expect(exposureAccess.visibleRunnerIcebreakerCount).toBe(0);
    expect(exposureAccess.evidence).toContain(
      "public_staged_breaker_used:false",
    );
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
