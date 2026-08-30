import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-342-01-corp-hq-agenda-defense-d17.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("pairing 342 Corp HQ agenda-defense checkpoint", () => {
  it("keeps the global HQ allocation ahead of the locally acute R&D layer", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, result.message).toBe(true);
    expect(result.selectedAction).toMatchObject({
      type: "install_card",
      payload: {
        serverId: "hq",
        placement: "ice",
      },
    });
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
      selectedStep: {
        stepId:
          "plan:corp.defend_servers:server-defense-portfolio:allocate",
      },
    });
  });
});
