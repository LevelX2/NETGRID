import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import multiSourceDamagePreventionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-130-01-multi-source-damage-prevention-d308.json";
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

describe("selfplay cycle 130 decision checkpoints", () => {
  it("keeps the second partial Force Shield prevention in the engine window", () => {
    const capture = structuredClone<unknown>(
      multiSourceDamagePreventionJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const shield = capture.input.playerView.own.rig?.find((card) => card.definitionId === 240);
    const prevention = capture.input.playerView.pendingChoice?.options.find(
      (option) => option.value === 1 && option.id ===
        `card_implementation_damage_prevent_${shield?.instanceId}_0_1__prevent_amount_1`,
    );
    if (!prevention) throw new Error("Expected the recorded Force Shield option");
    prevention.metadata = { optionKind: "prevent_damage", amount: 1 };
    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.resolve_choice",
      selectedChoices: {
        choiceId:
          "v120_choice_v120_window_imminent_damage_306_305.c2ra.0_next_100_runner",
        selectedOptionIds: [
          "card_implementation_damage_prevent_c1hd_0_1__prevent_amount_1",
        ],
      },
    });
    expect(decision.decisionDebug?.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      lane: "engine_window",
      selectionAuthority: "engine_window",
      rootPlanInstanceId: "run:305",
      leafExecutorInstanceId: "rules.window_resolution",
      engineWindowAction: {
        actionId: "runner.resolve_choice",
        actionType: "resolve_choice",
      },
    });
  });
});
