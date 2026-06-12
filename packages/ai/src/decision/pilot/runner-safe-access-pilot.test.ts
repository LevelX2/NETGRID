import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import type { RankedAction } from "./pilot-scope-common";
import { runnerSafeAccessDecision } from "./runner-safe-access-pilot";

describe("runner-safe-access-pilot", () => {
  it("allows structured central run alignment", () => {
    expect(
      runnerSafeAccessDecision(
        frame({
          candidate: runCandidate("run-hq", "hq", "target_context"),
        }),
        legalAction("run-hq", "hq"),
        rankedAction("run-hq"),
      ),
    ).toMatchObject({
      allowed: true,
      reason: "runner_safe_access_central_reachable_allowed",
      evidence: expect.arrayContaining([
        "candidate_server_source:target_context",
        "alignment_source:target_context",
      ]),
    });
  });

  it("blocks evidence-only central run alignment", () => {
    expect(
      runnerSafeAccessDecision(
        frame({
          candidate: runCandidate("run-hq", "hq", "evidence"),
        }),
        legalAction("run-hq", "hq"),
        rankedAction("run-hq"),
      ),
    ).toMatchObject({
      allowed: false,
      reason: "runner_safe_access_structured_alignment_required",
      evidence: expect.arrayContaining([
        "candidate_server_source:evidence",
        "alignment_source:evidence",
      ]),
    });
  });
});

function frame(params: { candidate: ActionSemanticCandidate }): SemanticDecisionFrame {
  return {
    schemaVersion: "semantic-decision-frame-v1",
    side: "runner",
    stateVersion: 1,
    profileId: "runner:test",
    legalActionIds: [params.candidate.actionId],
    actionCandidates: [params.candidate],
    tacticalGoals: [],
    runner: {
      runTargets: [
        {
          schemaVersion: "runner-run-target-evaluation-v1",
          targetServerId: "hq",
          targetKind: "hq",
          accessServerId: "hq",
          accessTargetKind: "hq",
          actionId: params.candidate.actionId,
          accessPayoff: "fresh",
          knownAccessState: "fresh",
          multiaccessAvailable: false,
          recommendation: "run_now",
          pathPassability: "reachable",
          pathCost: 0,
          creditsAfterRun: 4,
          stealOrTrashAffordable: "unknown",
          installedRunPayoff: payoff(),
          runActionPayoff: payoff(),
          runActionProjection: {
            actionId: params.candidate.actionId,
            actionType: "start_run",
            sourceKind: "basic_action",
            targetServerId: "hq",
            targetKind: "hq",
            accessServerId: "hq",
            structure: "direct_start_run",
            accessPayoffSignals: [],
            constraintSignals: [],
            riskSignals: [],
            noNoisyBreakers: false,
            bypassFirstIce: false,
            projectionStatus: "concrete_target",
            evidence: ["test_projection"],
          },
          riskyUniversalCoverage: false,
          scoreThreat: false,
          score: 100,
          evidence: ["test_run_target"],
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
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: ["test_payoff"],
  };
}

function legalAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: "Run",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: { serverId },
  };
}

function rankedAction(actionId: string): RankedAction {
  return {
    actionId,
    rank: 1,
    score: 150,
    primaryGoalId: "runner.run_access",
    components: [
      {
        component: "goal_fit",
        delta: 150,
        evidence: ["utility_family:run_access"],
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
            serverKind: "hq",
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
