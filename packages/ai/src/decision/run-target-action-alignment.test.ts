import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { SemanticDecisionFrame, TacticalGoalLike } from "./semantic-decision-frame";
import { buildSemanticShadowDecision } from "./semantic-shadow-decision";
import { alignRunTargetAction } from "./run-target-action-alignment";

describe("run target action alignment", () => {
  it("aligns side-safe target context to run targets", () => {
    expect(
      alignRunTargetAction(runCandidate("run-hq", "hq"), {
        targetServerId: "hq",
        targetKind: "hq",
      }),
    ).toMatchObject({
      actionId: "run-hq",
      serverId: "hq",
      runTargetId: "hq",
      aligned: true,
    });
  });

  it("aligns remote target context without implying pilot eligibility", () => {
    expect(
      alignRunTargetAction(runCandidate("run-remote-1", "remote_1"), {
        targetServerId: "remote_1",
        targetKind: "remote",
      }),
    ).toMatchObject({
      actionId: "run-remote-1",
      serverId: "remote_1",
      runTargetId: "remote_1",
      targetKind: "remote",
      aligned: true,
      evidence: expect.arrayContaining([
        "candidate_semantic:run.start",
        "candidate_server:remote_1",
        "run_target:remote_1",
        "aligned:true",
      ]),
    });
  });

  it("boosts HQ opportunity only for the HQ run action", () => {
    const trace = buildSemanticShadowDecision(
      frame({
        candidates: [
          runCandidate("run-hq", "hq"),
          runCandidate("run-rd", "rd"),
        ],
        goals: [goal("runner.neutral.safe_run_access", "pressure")],
        runTargets: [
          {
            targetServerId: "hq",
            targetKind: "hq",
            recommendation: "run_now",
            pathPassability: "reachable",
            accessPayoff: "fresh",
            scoreThreat: false,
            evidence: ["fixture:hq_safe"],
          },
        ],
      }),
    );

    expect(trace.rankedActions[0]?.actionId).toBe("run-hq");
    expect(trace.rankedActions[0]?.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "opportunity",
          evidence: expect.arrayContaining([
            "opportunity:safe_central_access",
            "candidate_server:hq",
            "run_target:hq",
            "aligned:true",
          ]),
        }),
      ]),
    );
    expect(
      trace.rankedActions.find((action) => action.actionId === "run-rd")?.components,
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ component: "opportunity" }),
      ]),
    );
  });

  it("boosts remote score threat only for the matching remote run", () => {
    const trace = buildSemanticShadowDecision(
      frame({
        candidates: [
          runCandidate("run-remote-1", "remote_1"),
          runCandidate("run-hq", "hq"),
        ],
        goals: [goal("runner.neutral.remote_contest_if_score_threat", "remote_contest")],
        runTargets: [
          {
            targetServerId: "remote_1",
            targetKind: "remote",
            recommendation: "run_now",
            pathPassability: "reachable",
            accessPayoff: "score_threat",
            scoreThreat: true,
            evidence: ["fixture:remote_score_threat"],
          },
        ],
      }),
    );

    expect(trace.rankedActions[0]?.actionId).toBe("run-remote-1");
    expect(JSON.stringify(trace)).not.toMatch(/hiddenRemoteIdentity/i);
  });

  it("keeps equal run actions deterministic", () => {
    const trace = buildSemanticShadowDecision(
      frame({
        candidates: [
          runCandidate("run-rd", "rd"),
          runCandidate("run-hq", "hq"),
        ],
        goals: [goal("runner.neutral.safe_run_access", "pressure")],
        runTargets: [],
      }),
    );

    expect(trace.rankedActions.map((action) => action.actionId)).toEqual([
      "run-hq",
      "run-rd",
    ]);
  });

  it("does not apply target-specific opportunity bonus without target context", () => {
    const trace = buildSemanticShadowDecision(
      frame({
        candidates: [runCandidate("run-hq")],
        goals: [goal("runner.neutral.safe_run_access", "pressure")],
        runTargets: [
          {
            targetServerId: "hq",
            targetKind: "hq",
            recommendation: "run_now",
            pathPassability: "reachable",
            accessPayoff: "fresh",
            scoreThreat: false,
            evidence: ["fixture:hq_safe"],
          },
        ],
      }),
    );

    expect(trace.rankedActions[0]?.components).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ component: "opportunity" }),
      ]),
    );
  });
});

function frame(params: {
  candidates: ActionSemanticCandidate[];
  goals: TacticalGoalLike[];
  runTargets: unknown[];
}): SemanticDecisionFrame {
  return {
    schemaVersion: "semantic-decision-frame-v1",
    side: "runner",
    stateVersion: 1,
    profileId: "runner:test",
    legalActionIds: params.candidates.map((candidate) => candidate.actionId),
    actionCandidates: params.candidates,
    tacticalGoals: params.goals,
    runner: {
      runTargets: params.runTargets as any,
    },
    evidence: ["test_frame"],
    hiddenInfoPolicy: "player_view_only",
  };
}

function goal(goalId: string, family: string): TacticalGoalLike {
  return {
    goalId,
    family,
    priority: 900,
    urgency: "high",
    source: "neutral",
    evidence: ["test_goal"],
  };
}

function runCandidate(
  actionId: string,
  serverId?: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "start_run",
    actorSide: "runner",
    observerSide: "runner",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType: "start_run",
      originalPayloadKeys: serverId ? ["serverId"] : [],
    },
    stateVersion: 1,
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    semanticActionType: "run.start",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    ...(serverId
      ? {
          targetContext: {
            selectedTargets: [
              {
                targetId: serverId,
                targetKind: "server",
                targetSide: "corp",
                visibilityScope: "actor_private",
                evidence: ["selected_target:server"],
              },
            ],
            targetKind: "server",
            targetZones: [],
            targetSide: "corp",
            hiddenInfoPolicy: "side_safe_engine_input_only",
            availableTargetsStatus: "not_available",
            targetProfileMatches: [],
            targetConstraintResults: [],
          },
        }
      : {}),
    boardContext: {
      source: "not_projected",
      sideSafe: true,
      stateVersion: 1,
      timingPoint: "runner_action.main",
      notes: ["test"],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [
      {
        gateId: "engine_legal_action",
        status: "pass",
        severity: "info",
        reason: "test",
      },
      {
        gateId: "hidden_info",
        status: "pass",
        severity: "info",
        reason: "test",
      },
    ],
    evidence: serverId ? [`run_action_projection_target:${serverId}`] : [],
  };
}
