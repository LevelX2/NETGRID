import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import recurringEconomyTaxedDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-318-01-recurring-economy-taxed-draw-d280.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  schemaVersion: "netgrid-ai-decision-checkpoint-replay-v1";
  provenance: "reconstructed_from_persisted_decision_sources";
  actor: "runner";
  stateVersion: number;
  stateHash: string;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("pairing 318 recurring-economy draw-tax checkpoint", () => {
  it("keeps the resident economy hold while respecting observed affordable HQ damage and draw-tax risk", () => {
    const capture = structuredClone(
      recurringEconomyTaxedDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    expect(
      runnerDamageThreatAssessment(capture.input).flatlineRisk,
    ).toMatchObject({
      level: "confirmed",
      activeDamageSourceCount: 0,
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.dispositions,
    ).toContainEqual(
      expect.objectContaining({
        evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe",
      }),
    );

    expect(decision).toMatchObject({
      actionId: "runner.gain_credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:runner.develop_board_and_hand:card%3Arunner_onr_v1_079_bodyweight-synthetic-blood_1",
          leafExecutorInstanceId:
            "plan:runner.economy:development-support%3Arunner_onr_v1_079_bodyweight-synthetic-blood_1",
          route: {
            actionType: "gain_credit",
            semanticActionType: "economy.gain_credit",
            capabilityId: "gain_general_liquid_credits",
          },
        },
      },
    });
  });
});
