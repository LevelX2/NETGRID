import { describe, expect, it } from "vitest";

import disgruntledArchivesJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-four-match-01-disgruntled-archives.json";
import insideJobRdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-four-match-02-inside-job-rd.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

describe("four-match card-hint decision checkpoints", () => {
  it("does not spend Disgruntled Ice Technician on the historical empty Archives run", () => {
    const result = runAiDecisionCheckpoint(fixture(disgruntledArchivesJson));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps the historical Inside Job R&D line and quotes its bypassed path as reachable", () => {
    const result = runAiDecisionCheckpoint(fixture(insideJobRdJson));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const selectedAction = result.selectedAction;
    if (!selectedAction) throw new Error("Expected selected Inside Job action");
    const scopedInput = {
      ...result.input,
      legalActions: [selectedAction],
      playerView: {
        ...result.input.playerView,
        legalActions: [selectedAction],
      },
    };
    const [evaluation] = evaluateRunnerRunTargets({ input: scopedInput });
    expect(evaluation).toMatchObject({
      pathPassability: "reachable",
      pathCost: 0,
      creditsAfterRun: 4,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_action_projection_bypass_first_ice:true",
        "run_action_projection_bypassed_first_ice:true",
        "path_passability:reachable",
      ]),
    );
    const directHqEvaluation = evaluateRunnerRunTargets({
      input: result.input,
    }).find((entry) => entry.actionId === "runner.start_run.hq");
    expect(directHqEvaluation).toMatchObject({
      targetServerId: "hq",
      accessServerId: "hq",
      pathPassability: "reachable",
      routeQuote: {
        reachability: "guaranteed_access",
        fundingGap: 0,
        unknownIceCount: 0,
      },
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(directHqEvaluation?.score).toBeLessThan(0);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-four-match-02-inside-job-rd"],
  );
}
