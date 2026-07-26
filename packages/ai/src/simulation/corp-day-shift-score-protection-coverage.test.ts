import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS } from "./benchmark-deck-slots";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("Corp mixed draw score-protection coverage", () => {
  it("keeps Day Shift out of the exact defense-draw and following HQ-overflow routes", () => {
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
        actionIndices: [25, 26],
        capture: (snapshot) => {
          captures.set(snapshot.state.stateVersion, snapshot);
        },
      },
    });

    const defenseDrawCapture = captures.get(25);
    const overflowCapture = captures.get(26);
    expect(defenseDrawCapture).toBeDefined();
    expect(overflowCapture).toBeDefined();
    if (!defenseDrawCapture || !overflowCapture) {
      throw new Error("Missing stateVersion-25/26 capture");
    }
    expect(defenseDrawCapture.state.timingPoint).toBe("corp_action.main");
    expect(overflowCapture.state.timingPoint).toBe("corp_action.main");

    const dayShiftAction = defenseDrawCapture.input.legalActions.find(
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
      legalActions: defenseDrawCapture.input.legalActions,
      observerSide: "corp",
      stateVersion: defenseDrawCapture.state.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(
          defenseDrawCapture.input.playerView,
        ),
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
    const defenseDraw = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 25,
    );
    const overflowConversion = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === 26,
    );
    expect(defenseDraw).toMatchObject({
      selectedActionId: "corp.draw_card",
      actionType: "draw_card",
      planKind: "corp.defend_servers",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      evidence: expect.arrayContaining([
        "plan_priority_class:P4",
        "plan_priority_delegated_from:plan:corp.score_agenda:agenda%3Acorp_onr_v1_214_project-babylon_1%3Anew_remote",
        "plan_step_capability:develop_score_protection",
      ]),
    });
    expect(overflowConversion).toMatchObject({
      selectedActionId: "corp.install_card.rd",
      actionType: "install_card",
      targetServerId: "rd",
      planKind: "corp.hand_and_agenda_management",
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
      evidence: expect.arrayContaining([
        "plan_assessment_evidence:corp_hq_overflow_exact_conversion:1",
        "plan_step_capability:resolve_hq_overflow",
      ]),
    });
    expect(overflowConversion?.actionType).not.toBe("gain_credit");
    expect(overflowConversion?.actionType).not.toBe("draw_card");
    expect(overflowConversion?.actionType).not.toBe("end_turn");
    expect(
      summary.actionSequence
        .filter((entry) => [25, 26].includes(entry.stateVersionBefore))
        .map((entry) => entry.selectedActionId),
    ).not.toContain(dayShiftAction?.actionId);
  });
});
