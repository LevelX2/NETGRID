import { describe, expect, it } from "vitest";

import subtypeCoverageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-176-morphing-tool-subtype-coverage-d157.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("selfplay 176 Runner subtype coverage decision checkpoint", () => {
  it("rejects both unbound Morphing Tool changes and develops the credit bank", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(subtypeCoverageJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision).toMatchObject({
      actionId:
        "runner.activated_card_ability.runner_onr_v1_154_broker_2.runner_onr_v1_154_broker_2.activated.onr_v1_154_broker:store_credits",
      reasonCode: "plan_first.runner.credit_bank",
      decisionDebug: {
        planKind: "runner.credit_bank",
      },
    });
  });
});
