import type { PlayerAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS } from "./benchmark-deck-slots";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("Corp mixed draw score-protection coverage", () => {
  it("converts exact economy without inventing an agenda-search draw", () => {
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
      seed: "corp-day-shift-economy-73",
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

    const efficiency = conversionCapture.input.playerView.own.gripOrHq.find(
      (card) => card.definitionId === 502,
    );
    const annualReviews = conversionCapture.input.playerView.own.gripOrHq.find(
      (card) => card.definitionId === 494,
    );
    if (!efficiency || !annualReviews) {
      throw new Error("Missing the captured Corp economy and draw sources.");
    }
    const efficiencyAction = conversionCapture.input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        action.source === efficiency.instanceId,
    );
    const annualReviewsAction = conversionCapture.input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        action.source === annualReviews.instanceId,
    );
    expect(efficiencyAction).toMatchObject({
      side: "corp",
      type: "play_operation",
      source: efficiency.instanceId,
      costs: [{ clicks: 1, credits: 0 }],
      payload: {
        cardId: efficiency.instanceId,
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
      sourceDefinitionId: 502,
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
    const continuedEconomy = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 5,
    );
    expect(conversion).toMatchObject({
      actionType: "play_operation",
      planKind: "corp.economy",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(continuedEconomy).toMatchObject({
      actionType: "gain_credit",
      planKind: "corp.economy",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    const conversionEvent = drawCapture.state.eventLog.find(
      (event) => event.stateVersionBefore === conversionCapture.state.stateVersion,
    );
    const recordedAction = conversionEvent?.privatePayload?.corp?.action as PlayerAction | undefined;
    expect(recordedAction).toMatchObject({
      side: "corp", clientKnownStateVersion: conversionCapture.state.stateVersion,
      actionId: efficiencyAction!.actionId,
    });
    expect(recordedAction?.actionId).not.toBe(annualReviewsAction!.actionId);
    expect(
      drawCapture.input.playerView.own.gripOrHq.some(
        (card) => card.instanceId === efficiency.instanceId,
      ),
    ).toBe(false);
  });
});
