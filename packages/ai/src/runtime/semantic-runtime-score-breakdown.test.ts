import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { createRunnerActionDemand } from "../plans/action-demand";
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

  it("does not subtract an immediate economy action cost after net projection", () => {
    const action = legalAction("paid-economy", "play_event", {
      costs: [{ credits: 2 }],
      payload: { gainCreditsAmount: 5 },
    });
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: 7,
    });
    if (!candidate) throw new Error("Expected economy candidate");

    const breakdown = buildSemanticRuntimeScoreBreakdown({
      input: decisionInput([action]),
      action,
      scopeId: "test_scope",
      actionSemanticCandidate: candidate,
      dependencies: {
        contextComponents: () => [],
        actionCreditCost: () => 2,
      },
    });

    expect(candidate.economyProjection?.netLiquidCreditGain).toBe(3);
    expect(
      breakdown.find(
        (component) => component.key === "semantic_credit_cost_penalty",
      ),
    ).toMatchObject({ value: 0, reason: "0" });
  });

  it("adds one action-capacity conversion component from the runtime context", () => {
    const action = legalAction("runner-overtime", "play_event", {
      costs: [{ clicks: 1 }],
      payload: {
        gainActionsAmount: 2,
        actionCapacityTiming: "immediate",
        actionCapacityRestriction: "unrestricted",
        actionCapacityReliability: "guaranteed",
      },
    });
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: 7,
    });
    if (!candidate) throw new Error("Expected action-capacity candidate");

    const breakdown = buildSemanticRuntimeScoreBreakdown({
      input: decisionInput([action]),
      action,
      scopeId: "test_scope",
      actionSemanticCandidate: candidate,
      actionCapacityContext: {
        actionDemands: [
          createRunnerActionDemand({
            demandId: "runner:run-followup",
            purpose: "current_run",
            priority: "current_foreground_plan",
            hardness: "soft",
            deadline: "end_of_current_turn",
            currentActions: 1,
            targetActions: 2,
            acceptedRestrictions: ["unrestricted", "run_only"],
            requiredActionTypes: ["start_run"],
          }),
        ],
        planActionContributions: [],
      },
      dependencies: {
        contextComponents: () => [],
        actionCreditCost: () => 0,
      },
    });

    expect(
      breakdown.filter((component) =>
        component.key.startsWith("action_capacity_"),
      ),
    ).toEqual([
      expect.objectContaining({
        key: "action_capacity_followup_conversion",
        value: expect.any(Number),
      }),
    ]);
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
