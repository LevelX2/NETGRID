import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticRuntimeScoreBreakdown } from "./semantic-runtime-score-breakdown";

describe("semantic runtime score breakdown", () => {
  it("uses ActionSemanticCandidate cost profile for credit cost penalties", () => {
    const action = legalAction("paid-action", "play_event", {
      costs: [{ credits: 4 }],
    });
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: 7,
    });
    if (!candidate) throw new Error("Expected semantic candidate");

    const breakdown = buildSemanticRuntimeScoreBreakdown({
      input: decisionInput([action]),
      action,
      scopeId: "test_scope",
      actionSemanticCandidate: candidate,
      dependencies: {
        contextComponents: () => [],
        actionCreditCost: () => 99,
      },
    });

    expect(
      breakdown.find(
        (component) => component.key === "semantic_credit_cost_penalty",
      ),
    ).toMatchObject({
      value: -140,
      reason: "4",
    });
  });

  it("falls back to the runtime helper when no semantic candidate is available", () => {
    const action = legalAction("fallback-action", "play_event");
    const breakdown = buildSemanticRuntimeScoreBreakdown({
      input: decisionInput([action]),
      action,
      scopeId: "test_scope",
      dependencies: {
        contextComponents: () => [],
        actionCreditCost: () => 3,
      },
    });

    expect(
      breakdown.find(
        (component) => component.key === "semantic_credit_cost_penalty",
      ),
    ).toMatchObject({
      value: -105,
      reason: "3",
    });
  });
});

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: type === "play_event" ? actionId : "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 8,
    ...overrides,
  };
}

function decisionInput(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "score-breakdown-test",
    decisionId: "score-breakdown-test",
    actionNumber: 1,
    profileId: "test-profile",
    playerView: {
      side: "runner",
      activeSide: "runner",
      stateVersion: 7,
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: visibleCard("runner-identity", "runner_identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 0,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard("corp-identity", "corp_identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 0,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
  };
}

function visibleCard(instanceId: string, title: string) {
  return {
    instanceId,
    known: true,
    title,
  };
}
