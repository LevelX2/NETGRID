import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import brainDrainInformationBudgetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-164-01-brain-drain-information-budget-d201.json";
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

describe("selfplay cycle 164 decision checkpoints", () => {
  it("keeps visible random core damage mitigation above an information-probe spend limit", () => {
    const capture = structuredClone(
      brainDrainInformationBudgetJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId:
        "runner.pump_breaker.runner_onr_v1_054_raptor_1.runner_onr_v1_054_raptor_1.runner_onr_v1_054_raptor_1.corp_onr_classic_007_brain-drain_1.onr_v1_054_raptor:icebreaker_abilities_increase_strength",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:runner.contest_remote:remote%3Aremote_1",
          leafExecutorInstanceId:
            "plan:runner.convert_run_window:run%3Arun_196",
          route: {
            actionType: "pump_breaker",
            capabilityId: "convert_active_run_window",
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:runner_visible_encounter_requires_mitigation:onr_classic_007_brain-drain",
      ]),
    );
  });
});
