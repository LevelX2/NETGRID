import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import boundedScoreProtectionStagingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-126-01-bounded-score-protection-staging-d205.json";
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

describe("selfplay cycle 126 decision checkpoints", () => {
  it("ends score-protection backstop staging after two layers without inventing another remote", () => {
    const capture = structuredClone<unknown>(
      boundedScoreProtectionStagingJson,
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
      type: "gain_credit",
      source: "basic_action",
    });
    expect(selectedAction?.actionId).not.toBe(
      "cc.clj.r1.clj.4",
    );
    expect(selectedAction?.actionId).not.toContain(
      "c351",
    );
    expect(decision.decisionDebug?.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "p37orq2bskzwy1ftnnx6qa79pq",
      leafExecutorInstanceId:
        "p37orq2bskzwy1ftnnx6qa79pq",
      route: {
        actionId: selectedAction?.actionId,
        actionType: "gain_credit",
        capabilityId: "develop_or_convert_corp_economy",
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_non_strategic_residual_capacity_use",
      ]),
    );
  });
});
