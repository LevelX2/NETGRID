import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-081-g3-terminal-reserve-consumption-d336.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  provenance: "reconstructed_from_persisted_decision_sources";
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("pairing 081 terminal contest reserve", () => {
  it("spends the urgent reserve under the existing remote-contest owner", () => {
    const capture = structuredClone<unknown>(
      captureJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).toBe("rs.r1");
    expect(decision.decisionDebug?.planKind).toBe("runner.contest_remote");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      leafExecutorInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      selectedStep: {
        planInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      },
      route: {
        actionId: "rs.r1",
        capabilityId: "contest_remote",
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P2",
        "plan_module:runner.contest_remote",
      ]),
    );
  });
});
