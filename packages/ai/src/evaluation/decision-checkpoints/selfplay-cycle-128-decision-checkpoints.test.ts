import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import setAsideProgramTrashChoiceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-128-01-set-aside-program-trash-choice-d121.json";
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

describe("selfplay cycle 128 decision checkpoints", () => {
  it("binds a set-aside ICE program-trash choice to the exact encounter quote", () => {
    const capture = structuredClone(
      setAsideProgramTrashChoiceJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "corp.resolve_choice",
      selectedChoices: {
        choiceId: "trash_installed_program_120",
        selectedOptionIds: ["card_runner_onr_classic_030_psychic-friend_2"],
      },
    });
    expect(decision.decisionDebug?.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      lane: "plan",
      selectionAuthority: "turn_plan_commitment",
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
      selectedPlan: {
        moduleId: "corp.defend_servers",
        evidenceCodes: ["corp_program_trash_ranked_by_visible_coverage_loss"],
      },
      selectedStep: {
        planInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      },
      route: {
        actionId: "corp.resolve_choice",
        actionType: "resolve_choice",
        stateVersion: capture.input.playerView.stateVersion,
      },
    });
  });
});
