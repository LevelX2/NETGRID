import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import setAsideProgramTrashChoiceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-128-01-set-aside-program-trash-choice-d121.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
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

describe("selfplay cycle 128 decision checkpoints", () => {
  it("binds a set-aside ICE program-trash choice to the exact encounter quote", () => {
    const capture = structuredClone(
      setAsideProgramTrashChoiceJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    // Both targets tie on current affordable coverage. Both are canonical
    // icebreakers, so the existing install-cost tie-break selects Rent-I-Con.
    expect(AI_HINTS_BY_CARD.get(34)?.roles).toContain(
      "icebreaker",
    );
    expect(AI_HINTS_BY_CARD.get(35)?.roles).toContain(
      "icebreaker",
    );
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "cn",
      selectedChoices: {
        choiceId: "trash_installed_program_120",
        selectedOptionIds: ["card_c7t"],
      },
    });
    expect(decision.decisionDebug?.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      lane: "plan",
      selectionAuthority: "turn_plan_commitment",
      rootPlanInstanceId: "penw02zfrkklof54c2nuye5att",
      leafExecutorInstanceId:
        "penw02zfrkklof54c2nuye5att",
      selectedPlan: {
        moduleId: "corp.defend_servers",
        evidenceCodes: ["corp_program_trash_ranked_by_visible_coverage_loss"],
      },
      selectedStep: {
        planInstanceId: "penw02zfrkklof54c2nuye5att",
      },
      route: {
        actionId: "cn",
        actionType: "resolve_choice",
        stateVersion: capture.input.playerView.stateVersion,
      },
    });
  });
});
