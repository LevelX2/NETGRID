import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import payEtrAfterBreakJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-096-01-pay-etr-after-hard-break-d69.json";
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

describe("selfplay cycle 096 decision checkpoints", () => {
  it("breaks the hard ETR when the remaining conditional ETR is payable", () => {
    const capture = structuredClone(
      payEtrAfterBreakJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    const selectedAction = capture.input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selectedAction).toMatchObject({
      type: "break_subroutine",
      payload: { subroutineIndex: 0 },
    });
    expect(decision.decisionDebug?.planKind).toBe("runner.convert_run_window");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      selectionAuthority: "turn_plan_commitment",
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_68",
      executionOrigin: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafPlanInstanceId: "plan:runner.convert_run_window:run%3Arun_68",
      },
      selectedStep: {
        planInstanceId: "plan:runner.convert_run_window:run%3Arun_68",
        parentInstanceId: "plan:runner.pressure_central:central%3Ahq",
      },
      route: {
        planInstanceId: "plan:runner.convert_run_window:run%3Arun_68",
        capabilityId: "convert_active_run_window",
        actionId: selectedAction?.actionId,
        actionType: "break_subroutine",
      },
    });
  });
});
