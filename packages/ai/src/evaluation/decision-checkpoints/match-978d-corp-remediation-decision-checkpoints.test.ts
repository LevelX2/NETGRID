import { describe, expect, it } from "vitest";

import matchpointWallRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-978d-01-matchpoint-wall-rez-d80.json";
import noLastClickDefenseDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-978d-02-no-last-click-defense-draw-d54.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match 978d Corp remediation checkpoints", () => {
  it("rezzes exact persistent ICE before a visible matchpoint agenda despite an unfavorable first-run exchange", () => {
    const result = runAiDecisionCheckpoint(
      matchpointWallRezJson as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.defend_servers",
        "plan_step_capability:allocate_server_defense",
      ]),
    );
  });

  it("draws for materializable score protection on the last click", () => {
    const result = runAiDecisionCheckpoint(
      noLastClickDefenseDrawJson as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.defend_servers",
        "plan_step_capability:develop_score_protection",
      ]),
    );
  });
});
