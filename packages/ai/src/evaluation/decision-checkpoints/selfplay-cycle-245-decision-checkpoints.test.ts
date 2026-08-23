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

  it("keeps an over-capacity taxed draw under exactly one disposition owner", () => {
    const capture = structuredClone(
      taxedMultiDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    const overflowTemplate = capture.input.playerView.own.gripOrHq[0];
    expect(overflowTemplate).toBeDefined();
    for (let index = 0; index < 4; index += 1) {
      capture.input.playerView.own.gripOrHq.push({
        ...structuredClone(overflowTemplate!),
        instanceId: `${overflowTemplate!.instanceId}-overflow-${index}`,
      });
    }
    expect(capture.input.playerView.own.gripOrHq.length).toBeGreaterThan(
      capture.input.playerView.own.maxHandSize,
    );
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    const dispositions =
      decision.decisionDebug?.planFirstDecision?.dispositions ?? [];

    expect(decision).toMatchObject({
      actionId: "runner.start_run.remote_2",
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
    expect(
      dispositions.filter((entry) => entry.actionId === "runner.draw_card"),
    ).toEqual([
      expect.objectContaining({
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.develop_board_and_hand",
        evidenceCode: "runner_option_development_draw_bound_reached",
      }),
    ]);
    expect(
      dispositions.filter((entry) => entry.actionId.includes("jack-n-joe")),
    ).toEqual([
      expect.objectContaining({
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.defense_and_recovery",
        evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe",
      }),
    ]);
  });
});
