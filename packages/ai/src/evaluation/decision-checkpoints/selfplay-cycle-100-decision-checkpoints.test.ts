import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import freeTraceIceRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-100-01-free-trace-ice-rez-d20.json";
import visibleArchivesWinJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-100-02-visible-archives-win-d209.json";
import exactIceCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-100-03-exact-ice-cashout-d89.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { assessCorpIceLiquidation } from "../../corp/defense/corp-ice-liquidation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

import { bindExplicitZeroPublicStealQuotes } from "./synthetic-public-steal-quotes.test-support";

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
    expect(
      capture.input.playerView.servers
        .find((server) => server.id === "rd")
        ?.ice.find(
          (ice) => ice.instanceId === "cg6",
        )?.effectivePostRezRunQuote,
    ).toMatchObject({
      complete: false,
      reason: "on_rez_lifecycle_projection_required",
    });
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    const selectedAction = capture.input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selectedAction).toMatchObject({
      type: "rez_ice",
      source: "cg6",
      costs: [{ credits: 0 }],
    });
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "penw02zfrkklof54c2nuye5att",
      leafExecutorInstanceId:
        "penw02zfrkklof54c2nuye5att",
      route: {
        actionId: selectedAction?.actionId,
        actionType: "rez_ice",
      },
    });
  });

  it("runs visible agenda Archives instead of classifying the selected route as inactive", () => {
    const capture = structuredClone<unknown>(
      visibleArchivesWinJson,
    ) as ReconstructedDecisionCapture;
    bindExplicitZeroPublicStealQuotes(capture.input, []);
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
      rootPlanInstanceId: "p22f66p721g9dgs7gsawwpf6hs",
      leafExecutorInstanceId: "p22f66p721g9dgs7gsawwpf6hs",
      route: {
        actionId: selectedAction?.actionId,
        actionType: "start_run",
      },
    });
  });

  it("keeps score funding bound without selling the last defense layer", () => {
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
    const cashout = capture.input.legalActions.find(
      (action) =>
        action.payload?.targetCardId === "c3y" &&
        action.payload?.gainedCredits === 4,
    );
    expect(cashout).toMatchObject({
      type: "activated_card_ability",
      source: "ctz",
      payload: {
        targetCardId: "c3y",
        gainedCredits: 4,
      },
    });
    expect(assessCorpIceLiquidation(capture.input, cashout!)).toEqual({
      status: "blocked",
      reason: "last_defense_layer",
    });
    expect(selectedAction).toMatchObject({
      type: "gain_credit",
      source: "basic_action",
      payload: { effectKind: "gain_credits", gainCreditsAmount: 1 },
    });
    expect(selectedAction?.actionId).not.toBe(cashout!.actionId);
    const root =
      "p7yxlodiop6lk6q584gbpqwldp";
    const executor =
      "p1uo1vyc0dph2d6kedvd58hdp0";
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: root,
      leafExecutorInstanceId: executor,
      selectedPlan: { moduleId: "corp.economy", parentInstanceId: root },
      selectedStep: { planInstanceId: executor, parentInstanceId: root },
      route: {
        actionId: selectedAction?.actionId,
        actionType: "gain_credit",
        semanticActionType: "economy.gain_credit",
      },
    });
  });
});
