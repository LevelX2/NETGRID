import { describe, expect, it } from "vitest";

import subtypeCoverageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-176-morphing-tool-subtype-coverage-d157.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("selfplay 176 Runner subtype coverage decision checkpoint", () => {
  it("uses the exact bound Morphing Tool wall change", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(subtypeCoverageJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision).toMatchObject({
      actionId:
        "runner.trigger_ability.runner_onr_proteus_092_morphing-tool_1.wall.runner_onr_proteus_092_morphing-tool_1.change_icebreaker_subtype",
      reasonCode: "plan_first.runner.rig_and_coverage",
      decisionDebug: {
        planKind: "runner.rig_and_coverage",
      },
    });
  });
});
