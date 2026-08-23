import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import taxedMultiDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-245-01-confirmed-damage-taxed-multidraw-d25.json";
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

describe("selfplay cycle 245 decision checkpoints", () => {
  it("rejects a taxed multi-draw as hand buffering under confirmed damage pressure", () => {
    const capture = structuredClone(
      taxedMultiDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId:
        "runner.play_event.runner_onr_v1_097_livewires-contacts_3.runner_onr_v1_097_livewires-contacts_3.onr_v1_097_livewires-contacts:abilities_on_play_gain_credits",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:runner.economy:runner-portfolio-credit-reserve",
          leafExecutorInstanceId:
            "plan:runner.economy:runner-portfolio-credit-reserve",
          route: {
            actionType: "play_event",
            semanticActionType: "economy.gain_credit",
            capabilityId: "gain_general_liquid_credits",
          },
          dispositions: expect.arrayContaining([
            expect.objectContaining({
              actionId:
                "runner.play_event.runner_onr_v1_095_jack-n-joe_3.runner_onr_v1_095_jack-n-joe_3.onr_v1_095_jack-n-joe:abilities_on_play_draw_cards",
              disposition: "explicitly_nonproductive",
              ownerModuleId: "runner.defense_and_recovery",
              evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe",
            }),
          ]),
        },
      },
    });
  });
});
