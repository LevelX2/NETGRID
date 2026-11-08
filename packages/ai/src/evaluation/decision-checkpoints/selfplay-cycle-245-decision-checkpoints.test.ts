import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import taxedMultiDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-245-01-confirmed-damage-taxed-multidraw-d25.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { bindPublicBoardStealQuoteCompanion } from "../../public-board-steal-quotes.test-support";
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
  it("contests the remote without inventing confirmed damage from discarded Setup", () => {
    const capture = structuredClone(
      taxedMultiDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    bindPublicBoardStealQuoteCompanion(capture.input);
    const decision = chooseAiAction(capture.input as AiDecisionInput);
    expect(runnerDamageThreatAssessment(capture.input).flatlineRisk).toMatchObject({
      level: "suspected", activeDamageSourceCount: 0,
    });
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).not.toContainEqual(
      expect.objectContaining({ evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe" }),
    );

    expect(decision).toMatchObject({
      actionId: "runner.start_run.remote_2",
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:runner.contest_remote:remote%3Aremote_2",
          leafExecutorInstanceId:
            "plan:runner.contest_remote:remote%3Aremote_2",
          dispositions: expect.arrayContaining([
            expect.objectContaining({
              actionId:
                "runner.play_event.runner_onr_v1_097_livewires-contacts_3.runner_onr_v1_097_livewires-contacts_3.onr_v1_097_livewires-contacts:abilities_on_play_gain_credits",
              disposition: "explicitly_nonproductive",
              ownerModuleId: "runner.economy",
              evidenceCode:
                "runner_immediate_credit_route_has_no_bound_funding_need",
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

    bindPublicBoardStealQuoteCompanion(capture.input);
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
        ownerModuleId: "runner.develop_board_and_hand",
        evidenceCode: "runner_hand_development_rejected:no_current_need:runner_onr_v1_095_jack-n-joe_3",
      }),
    ]);
  });

  it.each([0, 4])("keeps one unsafe taxed-draw owner with active damage and public core damage, overflow %i", (overflow) => {
    // Explicit public-input companion, not a reconstruction of the old game:
    // Setup is installed, and two core damage lower the real hand maximum.
    const capture = structuredClone(taxedMultiDrawJson) as ReconstructedDecisionCapture;
    const input = capture.input;
    const archives = input.playerView.servers.find((s) => s.id === "archives")!;
    const setup = archives.root.find((c) => c.definitionId === "onr_v1_340_setup");
    if (!setup) throw new Error("Missing known Setup companion source");
    archives.root = archives.root.filter((c) => c !== setup);
    input.playerView.servers.find((s) => s.id === "remote_1")!.root.push(setup);
    input.playerView.own.coreDamage = 2;
    input.playerView.own.maxHandSize = 3;
    for (let i = 0; i < overflow; i++) input.playerView.own.gripOrHq.push({
      ...structuredClone(input.playerView.own.gripOrHq[0]!), instanceId: `active-companion-overflow-${i}`,
    });
    expect(runnerDamageThreatAssessment(input).flatlineRisk).toMatchObject({
      level: "confirmed", activeDamageSourceCount: 1, effectiveMaxHandSize: 3,
    });
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, capture.runtime);
    bindPublicBoardStealQuoteCompanion(input);
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const dispositions = decision.decisionDebug?.planFirstDecision?.dispositions ?? [];
    expect(dispositions.filter((d) => d.actionId.includes("jack-n-joe"))).toEqual([
      expect.objectContaining({
        disposition: "explicitly_nonproductive", ownerModuleId: "runner.defense_and_recovery",
        evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe",
      }),
    ]);
    expect(dispositions.filter((d) => d.actionId === "runner.draw_card")).toHaveLength(1);
  });
});
