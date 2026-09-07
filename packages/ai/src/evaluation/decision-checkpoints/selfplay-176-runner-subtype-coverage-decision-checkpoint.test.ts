import { describe, expect, it } from "vitest";

import subtypeCoverageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-176-morphing-tool-subtype-coverage-d157.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("selfplay 176 Runner subtype coverage decision checkpoint", () => {
  it("retains affordable Fetch avoidance instead of buying an unnecessary wall change", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(subtypeCoverageJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    // The known HQ ICE is Fetch, not a wall. The old expectation paid one
    // credit to make its three-credit trace response unaffordable, then
    // mistook the missing avoidance cost for an improved prepared path.
    const hq = evaluateRunnerRunTargets({ input: result.input! }).find(
      (target) => target.actionId === "runner.start_run.hq",
    )!;
    expect(hq.routeQuote?.preRunPreparation).toBeUndefined();
    expect(hq.routeQuote?.knownCost).toBe(3);
    expect(hq.visibleTraceTagHazardUnavoidable).toBe(false);
  });
});
