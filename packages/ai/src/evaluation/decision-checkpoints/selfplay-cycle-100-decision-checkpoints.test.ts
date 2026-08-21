import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import freeTraceIceRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-100-01-free-trace-ice-rez-d20.json";
import visibleArchivesWinJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-100-02-visible-archives-win-d209.json";
import exactIceCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-100-03-exact-ice-cashout-d89.json";
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

describe("selfplay cycle 100 decision checkpoints", () => {
  it("rezzes free current-encounter trace damage despite an incomplete hard-ETR quote", () => {
    const capture = structuredClone(
      freeTraceIceRezJson,
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
      type: "rez_ice",
      source: "corp_onr_proteus_014_chihuahua_2",
      costs: [{ credits: 0 }],
    });
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
      route: {
        actionId: selectedAction?.actionId,
        actionType: "rez_ice",
      },
    });
  });

  it("runs visible agenda Archives instead of classifying the selected route as inactive", () => {
    const capture = structuredClone(
      visibleArchivesWinJson,
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
      type: "start_run",
      payload: { serverId: "archives" },
    });
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Aarchives",
      leafExecutorInstanceId:
        "plan:runner.pressure_central:central%3Aarchives",
      route: {
        actionId: selectedAction?.actionId,
        actionType: "start_run",
      },
    });
  });

  it("uses the exact four-credit ICE cashout under the bound score-funding leaf", () => {
    const capture = structuredClone(
      exactIceCashoutJson,
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
      type: "activated_card_ability",
      source: "corp_onr_proteus_076_syd-meyer-superstores_3",
      payload: {
        targetCardId: "corp_onr_classic_013_puzzle_2",
        gainedCredits: 4,
      },
    });
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_007_project-venice_1%3Aremote_2",
      leafExecutorInstanceId:
        "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_proteus_007_project-venice_1%3Aremote_2",
      route: {
        actionId: selectedAction?.actionId,
        actionType: "activated_card_ability",
        semanticActionType: "economy.gain_credit",
      },
    });
  });
});
