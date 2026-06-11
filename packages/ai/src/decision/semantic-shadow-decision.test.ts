import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticDecisionFrame } from "./semantic-decision-frame";
import { buildSemanticShadowDecision } from "./semantic-shadow-decision";

describe("SemanticShadowDecision", () => {
  it("ranks only LegalAction ids from the frame", () => {
    const input = inputFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
      legalAction("draw-1", "draw_card", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
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

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions.map((action) => action.actionId).sort()).toEqual([
      "draw-1",
      "gain-1",
    ]);
    expect(
      trace.rankedActions.every((action) =>
        frame.legalActionIds.includes(action.actionId),
      ),
    ).toBe(true);
    expect(trace.selectedActionId).toBeUndefined();
    expect(trace.noRuntimeEffect).toBe(true);
  });

  it("explains blocked actions separately", () => {
    const input = inputFor("runner", [
      legalAction("choice-1", "resolve_choice", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.resolve_target",
          family: "target_resolution",
          priority: 80,
          urgency: "high",
          evidence: ["target_profile_without_legal_options"],
        },
      ],
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions).toEqual([]);
    expect(trace.rejectedActions).toContainEqual(
      expect.objectContaining({
        actionId: "choice-1",
        blockers: expect.arrayContaining([
          "target_context_missing_for_target_profile",
        ]),
      }),
    );
  });

  it("is deterministic for equivalent frames", () => {
    const frame = frameForEconomyChoice();

    const first = buildSemanticShadowDecision(frame);
    const second = buildSemanticShadowDecision(frame);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("does not serialize forbidden private payload markers", () => {
    const traceJson = JSON.stringify(buildSemanticShadowDecision(frameForEconomyChoice()));

    expect(traceJson).not.toContain("privatePayload");
    expect(traceJson).not.toContain("cardInstances");
    expect(traceJson).not.toContain("fullGameState");
  });
});

function frameForEconomyChoice() {
  const input = inputFor("runner", [
    legalAction("gain-1", "gain_credit", "runner"),
    legalAction("run-1", "start_run", "runner"),
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

function inputFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 5,
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
    actionNumber: 5,
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
    expiresAtStateVersion: 5,
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
