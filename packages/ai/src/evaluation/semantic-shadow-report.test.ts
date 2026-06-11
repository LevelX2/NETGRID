import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import { compareSemanticShadowToRuntime } from "./semantic-shadow-report";

describe("SemanticShadowRuntimeComparison", () => {
  it("detects agreement between runtime and semantic shadow top action", () => {
    const frame = economyFrame();
    const trace = buildSemanticShadowDecision(frame);
    const comparison = compareSemanticShadowToRuntime({
      frame,
      trace,
      runtimeDecision: decision("gain-1", "runner.semantic.basic_economy_draw"),
    });

    expect(comparison).toMatchObject({
      runtimeActionId: "gain-1",
      shadowTopActionId: "gain-1",
      agreement: true,
      runtimeReasonCode: "runner.semantic.basic_economy_draw",
    });
    expect(comparison.shadowTopScore).toBeGreaterThan(0);
    expect(comparison.observedMistakes).toEqual([]);
  });

  it("reports legal disagreement without treating it as a runtime error", () => {
    const frame = economyFrame();
    const trace = buildSemanticShadowDecision(frame);
    const comparison = compareSemanticShadowToRuntime({
      frame,
      trace,
      runtimeDecision: decision("draw-1", "runner.semantic.draw"),
    });

    expect(comparison.runtimeActionId).toBe("draw-1");
    expect(comparison.shadowTopActionId).toBe("gain-1");
    expect(comparison.agreement).toBe(false);
    expect(comparison.evidence).toEqual(
      expect.arrayContaining([
        "runtime_action_legal:true",
        "shadow_top_legal:true",
        "agreement:false",
      ]),
    );
  });

  it("includes mistake taxonomy classes from the shadow trace", () => {
    const frame = economyFrame();
    const trace: SemanticDecisionTrace = {
      schemaVersion: "semantic-decision-trace-v1",
      frameSummary: {
        side: "runner",
        stateVersion: frame.stateVersion,
        legalActionCount: frame.legalActionIds.length,
        actionCandidateCount: frame.actionCandidates.length,
        tacticalGoalCount: frame.tacticalGoals.length,
        hiddenInfoPolicy: "player_view_only",
      },
      rankedActions: [
        {
          actionId: "not-legal",
          rank: 1,
          score: 100,
          components: [],
          blockers: [],
          explanation: "bad_fixture",
        },
      ],
      rejectedActions: [],
      noRuntimeEffect: true,
    };

    const comparison = compareSemanticShadowToRuntime({
      frame,
      trace,
      runtimeDecision: decision("gain-1", "runner.semantic.basic_economy_draw"),
    });

    expect(comparison.shadowTopActionId).toBeUndefined();
    expect(comparison.observedMistakes).toContain("illegal_action");
    expect(JSON.stringify(comparison)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });

  it("redacts forbidden markers from report strings", () => {
    const frame = economyFrame();
    const trace = buildSemanticShadowDecision(frame);
    const comparison = compareSemanticShadowToRuntime({
      frame,
      trace,
      runtimeDecision: decision("gain-1", "privatePayload_bad_reason"),
    });

    expect(comparison.runtimeReasonCode).toBe("[redacted]");
    expect(JSON.stringify(comparison)).not.toContain("privatePayload");
  });
});

function economyFrame() {
  const input = inputFor("runner", [
    legalAction("gain-1", "gain_credit", "runner"),
    legalAction("draw-1", "draw_card", "runner"),
  ]);
  return buildSemanticDecisionFrame({
    input,
    actionCandidates: buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    }),
    tacticalGoals: [
      {
        goalId: "runner.build_economy_base",
        family: "economy",
        priority: 940,
        urgency: "high",
        source: "economy_posture",
        evidence: ["funding_need:true"],
      },
    ],
  });
}

function decision(actionId: string, reasonCode: string): AiDecision {
  return {
    actionId,
    reasonCode,
    explanation: reasonCode,
    consideredActionIds: [],
    fallbackUsed: false,
  };
}

function inputFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 1,
      timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
      activeSide: side,
      phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
      own: {
        identity: visibleCard(`${side}-identity`),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard(`${side}-opponent-identity`),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "seed",
    decisionId: `${side}:decision`,
    actionNumber: 1,
    profileId: `${side}:profile`,
  } as unknown as AiDecisionInput;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  side: "runner" | "corp",
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: type,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}

function visibleCard(cardId: string) {
  return {
    instanceId: `${cardId}-instance`,
    definitionId: cardId,
    title: cardId,
    side: "runner",
    type: "identity",
    zone: "identity",
    visibility: "public",
    known: true,
  };
}
