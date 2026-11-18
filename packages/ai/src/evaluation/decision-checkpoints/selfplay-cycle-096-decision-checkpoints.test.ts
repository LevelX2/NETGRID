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
    const capture = structuredClone<unknown>(
      payEtrAfterBreakJson,
    ) as ReconstructedDecisionCapture;
    // Both quoted subroutines are still open in this checkpoint. Supply the
    // exact remaining-ID projection required by the current Engine contract.
    const continuation = capture.input.legalActions.find(
      (action) => action.payload?.encounterContinue === true,
    )!;
    continuation.encounterSubroutineIds = ["0", "1"];
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
      rootPlanInstanceId: "pa7nez1ioecg7mf06q1uwqq57o",
      leafExecutorInstanceId: "p8ll66a5jc2dn8k8p49o2bebs8",
      executionOrigin: {
        rootPlanInstanceId: "pa7nez1ioecg7mf06q1uwqq57o",
        leafPlanInstanceId: "p8ll66a5jc2dn8k8p49o2bebs8",
      },
      selectedStep: {
        planInstanceId: "p8ll66a5jc2dn8k8p49o2bebs8",
        parentInstanceId: "pa7nez1ioecg7mf06q1uwqq57o",
      },
      route: {
        planInstanceId: "p8ll66a5jc2dn8k8p49o2bebs8",
        capabilityId: "convert_active_run_window",
        actionId: selectedAction?.actionId,
        actionType: "break_subroutine",
      },
    });
  });
});
