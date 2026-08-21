import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS } from "./benchmark-deck-slots";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("Corp mixed draw score-protection coverage", () => {
  it("converts exact economy before a revalidated answer-search draw", () => {
    const slot = MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS.find(
      (candidate) =>
        candidate.slotId === "strategy_panel_fast_advance_chrome_rush",
    );
    if (!slot) throw new Error("Missing fast-advance benchmark slot");
    const resolved = resolveBenchmarkDeckSlot(slot);
    if (!resolved.ok) throw new Error(resolved.reason);

    const captures = new Map<number, AiSimulationDecisionCheckpointCapture>();
    const summary = simulateAiGame({
      ...resolved.config,
      seed: "ai-behavior-baseline-v1-05",
      maxActions: 27,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: [4, 5],
        capture: (snapshot) => {
          captures.set(snapshot.state.stateVersion, snapshot);
        },
      },
    });
    const conversionCapture = captures.get(4);
    const drawCapture = captures.get(5);
    expect(conversionCapture).toBeDefined();
    expect(drawCapture).toBeDefined();
    if (!conversionCapture || !drawCapture) {
      throw new Error("Missing stateVersion-4/5 capture");
    }
    expect(conversionCapture.state.timingPoint).toBe("corp_action.main");
    expect(drawCapture.state.timingPoint).toBe("corp_action.main");

    const efficiencyAction = conversionCapture.input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        action.source === "corp_onr_v1_290_efficiency-experts_1",
    );
    const annualReviewsAction = conversionCapture.input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        action.source === "corp_onr_v1_282_annual-reviews_1",
    );
    expect(efficiencyAction).toMatchObject({
      side: "corp",
      type: "play_operation",
      source: "corp_onr_v1_290_efficiency-experts_1",
      costs: [{ clicks: 1, credits: 0 }],
      payload: {
        cardId: "corp_onr_v1_290_efficiency-experts_1",
        gainCreditsAmount: 3,
      },
    });
    expect(annualReviewsAction).toMatchObject({
      type: "play_operation",
      payload: { drawCardsAmount: 3 },
    });

    const candidates = buildActionSemanticCandidates({
      legalActions: conversionCapture.input.legalActions,
      observerSide: "corp",
      stateVersion: conversionCapture.state.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(
          conversionCapture.input.playerView,
        ),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    expect(
      candidates.find(
        (candidate) => candidate.actionId === efficiencyAction?.actionId,
      ),
    ).toMatchObject({
      semanticActionType: "economy.gain_credit",
      sourceDefinitionId: "onr_v1_290_efficiency-experts",
      economyProjection: {
        kind: "immediate_liquid",
        netLiquidCreditGain: 3,
        cardsDrawn: 0,
        cardsConsumed: 1,
        netHandDelta: -1,
        reliability: "guaranteed",
        source: "legal_action_payload",
      },
    });

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    const conversion = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 4,
    );
    const revalidatedDraw = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 5,
    );
    expect(conversion).toMatchObject({
      selectedActionId: "corp.play_operation",
      actionType: "play_operation",
      planKind: "corp.economy",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(revalidatedDraw).toMatchObject({
      selectedActionId: "corp.draw_card",
      actionType: "draw_card",
      planKind: "corp.hand_and_agenda_management",
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(
      summary.actionSequence
        .filter((entry) => [4, 5].includes(entry.stateVersionBefore))
        .map((entry) => entry.selectedActionId),
    ).not.toContain(annualReviewsAction?.actionId);
    expect(
      drawCapture.input.playerView.own.gripOrHq.some(
        (card) => card.definitionId === "onr_v1_290_efficiency-experts",
      ),
    ).toBe(false);
  });
});
