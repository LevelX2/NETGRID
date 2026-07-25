import { describe, expect, it } from "vitest";

import scoredOnlyTimingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-01-scored-only-tag-timing-d39.json";
import realisticScoreHorizonJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-02-realistic-score-horizon-d40.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { scoringWindowAccessAssessment } from "../../runtime/corp-scoreline/semantic-runtime-corp-scoring-window-projection";

describe("match 3bb14 Corp remediation decision checkpoints", () => {
  it.each([
    [
      "uses the admitted ambush route while unknown score protection blocks agenda installation",
      scoredOnlyTimingJson,
    ],
    [
      "uses the admitted ambush route while the remote scoreline is not provably protected",
      realisticScoreHorizonJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("counts a public Shell-Traders breaker when it is reachable before scoring", () => {
    const result = runAiDecisionCheckpoint(fixture(realisticScoreHorizonJson));
    const remote = result.input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remote) throw new Error("Missing captured scoring remote");

    const currentAccess = scoringWindowAccessAssessment(
      result.input,
      remote,
    );
    const exposureAccess = scoringWindowAccessAssessment(
      result.input,
      remote,
      3,
    );

    expect(currentAccess.runnerCanReachAccessNow).toBe(true);
    expect(currentAccess.evidence).toContain(
      "public_staged_breaker_install_credit_cost:3",
    );
    expect(exposureAccess.runnerCanReachAccessNow).toBe(true);
    expect(exposureAccess.visibleRunnerIcebreakerCount).toBe(1);
    expect(exposureAccess.evidence).toContain("public_staged_breaker_used:true");
    expect(exposureAccess.evidence).toContain(
      "public_staged_breaker_install_credit_cost:2",
    );
  });

  it("does not count the staged breaker without its visible install source", () => {
    const result = runAiDecisionCheckpoint(fixture(realisticScoreHorizonJson));
    const input = structuredClone(result.input);
    input.playerView.opponent.rig = (
      input.playerView.opponent.rig ?? []
    ).filter(
      (card) => card.definitionId !== "onr_v1_176_the-shell-traders",
    );
    const remote = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remote) throw new Error("Missing captured scoring remote");

    const exposureAccess = scoringWindowAccessAssessment(input, remote, 3);

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
