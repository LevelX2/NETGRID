import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import type { SemanticRankedAction } from "../semantic-decision-trace";
import { evaluateRemoteContestCandidate } from "./remote-contest-candidate";

describe("remote-contest-candidate", () => {
  it("marks a structured remote score-threat run as eligible", () => {
    expect(
      evaluateRemoteContestCandidate({
        frame: frame(runCandidate("run-remote", "remote_1", "target_context")),
        top: rankedAction("run-remote"),
        topActionType: "start_run",
        scoreGap: 30,
        scoreGapThreshold: 20,
      }),
    ).toMatchObject({
      actionId: "run-remote",
      targetServerId: "remote_1",
      targetKind: "remote",
      recommendation: "run_now",
      pathPassability: "reachable",
      scoreThreat: true,
      structuredAlignment: true,
      scoreGap: 30,
      scoreGapThreshold: 20,
      candidateStatus: "eligible",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      evidence: expect.arrayContaining([
        "remote_contest_candidate:report_only",
        "remote_contest_candidate_status:eligible",
        "alignment_source:target_context",
      ]),
    });
  });

  it("blocks evidence-only remote contest alignment", () => {
    expect(
      evaluateRemoteContestCandidate({
        frame: frame(runCandidate("run-remote", "remote_1", "evidence")),
        top: rankedAction("run-remote"),
        topActionType: "start_run",
        scoreGap: 30,
      }),
    ).toMatchObject({
      candidateStatus: "blocked",
      blockedReason: "remote_contest_structured_alignment_required",
      structuredAlignment: false,
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
    });
  });

  it("blocks remote contest below the score gap threshold", () => {
    expect(
      evaluateRemoteContestCandidate({
        frame: frame(runCandidate("run-remote", "remote_1", "target_context")),
        top: rankedAction("run-remote"),
        topActionType: "start_run",
        scoreGap: 4,
        scoreGapThreshold: 20,
      }),
    ).toMatchObject({
      candidateStatus: "blocked",
      blockedReason: "remote_contest_score_gap_below_threshold",
      structuredAlignment: true,
    });
  });
});

function frame(candidate: ActionSemanticCandidate): SemanticDecisionFrame {
  return {
    schemaVersion: "semantic-decision-frame-v1",
    side: "runner",
    stateVersion: 1,
    profileId: "runner:test",
    legalActionIds: [candidate.actionId],
    actionCandidates: [candidate],
    tacticalGoals: [],
    runner: {
      runTargets: [
        {
          schemaVersion: "runner-run-target-evaluation-v1",
          targetServerId: "remote_1",
          targetKind: "remote",
          accessServerId: "remote_1",
          accessTargetKind: "remote",
          actionId: candidate.actionId,
          accessPayoff: "score_threat",
          knownAccessState: "known_payoff",
          multiaccessAvailable: false,
          recommendation: "run_now",
          pathPassability: "reachable",
          pathCost: 0,
          creditsAfterRun: 4,
          stealOrTrashAffordable: "unknown",
          installedRunPayoff: payoff(),
          runActionPayoff: payoff(),
          runActionProjection: {
            actionId: candidate.actionId,
            actionType: "start_run",
            sourceKind: "basic_action",
            targetServerId: "remote_1",
            targetKind: "remote",
            accessServerId: "remote_1",
            structure: "direct_start_run",
            accessPayoffSignals: ["score_threat"],
            constraintSignals: [],
            riskSignals: [],
            noNoisyBreakers: false,
            bypassFirstIce: false,
            projectionStatus: "concrete_target",
            evidence: ["test_projection"],
          },
          riskyUniversalCoverage: false,
          scoreThreat: true,
          score: 100,
          evidence: ["test_remote_threat"],
        },
      ],
    },
    evidence: ["test_frame"],
    hiddenInfoPolicy: "player_view_only",
  };
}

function payoff() {
  return {
    immediateAccessValue: 20,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 50,
    multiaccessAvailable: false,
    evidence: ["test_payoff"],
  };
}

function rankedAction(actionId: string): SemanticRankedAction {
  return {
    actionId,
    rank: 1,
    score: 150,
    primaryGoalId: "runner.remote_contest",
    components: [
      {
        component: "goal_fit",
        delta: 150,
        evidence: ["utility_family:remote_contest"],
      },
    ],
    blockers: [],
    explanation: "test",
  };
}

function runCandidate(
  actionId: string,
  serverId: string,
  source: "target_context" | "evidence",
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
      originalPayloadKeys: ["serverId"],
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
    ...(source === "target_context"
      ? {
          runProjectionSummary: {
            serverId,
            serverKind: "remote" as const,
            source: "target_context" as const,
            evidence: [`summary:${serverId}`],
          },
          targetContext: {
            selectedTargets: [
              {
                targetId: serverId,
                targetKind: "server" as const,
                targetSide: "corp" as const,
                visibilityScope: "actor_private" as const,
                evidence: ["selected_target:server"],
              },
            ],
            targetKind: "server" as const,
            targetZones: [],
            targetSide: "corp" as const,
            hiddenInfoPolicy: "side_safe_engine_input_only",
            availableTargetsStatus: "not_available" as const,
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
    hardGates: [],
    evidence: source === "evidence" ? [`run_action_projection_target:${serverId}`] : [],
  };
}
