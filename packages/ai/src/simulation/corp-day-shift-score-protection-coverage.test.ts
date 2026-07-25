import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS } from "./benchmark-deck-slots";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("Corp mixed draw score-protection coverage", () => {
  it("keeps the rejected Day Shift draw alternative out of generic hand plans at stateVersion 59", () => {
    const slot = MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS.find(
      (candidate) =>
        candidate.slotId === "strategy_panel_fast_advance_chrome_rush",
    );
    if (!slot) throw new Error("Missing fast-advance benchmark slot");
    const resolved = resolveBenchmarkDeckSlot(slot);
    if (!resolved.ok) throw new Error(resolved.reason);

    let capture: AiSimulationDecisionCheckpointCapture | undefined;
    const summary = simulateAiGame({
      ...resolved.config,
      seed: "ai-behavior-baseline-v1-05",
      maxActions: 62,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: [59],
        capture: (snapshot) => {
          capture = snapshot;
        },
      },
    });

    expect(capture).toBeDefined();
    if (!capture) throw new Error("Missing stateVersion-59 capture");
    expect(capture.state.stateVersion).toBe(59);
    expect(capture.state.timingPoint).toBe("corp_action.main");

    const dayShiftAction = capture.input.legalActions.find(
      (action) =>
        action.actionId ===
        "corp.play_operation.corp_onr_v1_288_day-shift_1.corp_onr_v1_288_day-shift_1",
    );
    expect(dayShiftAction).toMatchObject({
      side: "corp",
      type: "play_operation",
      source: "corp_onr_v1_288_day-shift_1",
      costs: [{ clicks: 1, credits: 0 }],
      payload: {
        cardId: "corp_onr_v1_288_day-shift_1",
        drawCardsAmount: 2,
        gainCreditsAmount: 1,
      },
    });

    const candidates = buildActionSemanticCandidates({
      legalActions: capture.input.legalActions,
      observerSide: "corp",
      stateVersion: 59,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(capture.input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    expect(
      candidates.find(
        (candidate) => candidate.actionId === dayShiftAction?.actionId,
      ),
    ).toMatchObject({
      semanticActionType: "economy.gain_credit",
      sourceDefinitionId: "onr_v1_288_day-shift",
      economyProjection: {
        kind: "immediate_liquid",
        netLiquidCreditGain: 1,
        cardsDrawn: 2,
        cardsConsumed: 1,
        netHandDelta: 1,
        reliability: "guaranteed",
        source: "legal_action_payload",
      },
      actionCapacityProjection: {
        kind: "non_action_capacity",
        followupActionCapacity: 0,
      },
    });

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.actionSequence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stateVersionBefore: 59,
          selectedActionId: "corp.draw_card",
          planKind: "corp.defend_servers",
          reasonCode: "plan_first.corp.defend_servers",
          fallbackUsed: false,
        }),
      ]),
    );
    expect(summary.actionSequence).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stateVersionBefore: 59,
          selectedActionId: dayShiftAction?.actionId,
        }),
      ]),
    );
  });
});
