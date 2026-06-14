import { afterEach, describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  ALL_PLAY_STRENGTH_PILOT_SCOPES,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  PLAY_STRENGTH_PILOT_ALL_TOKEN,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  buildLocalDefaultPilotPolicy,
  buildPilotScopeDecisionMatrix,
  parsePilotScopes,
  pilotScopeAllowsAction,
  semanticPilotChoice,
  semanticPlayStrengthPilotEnabled,
  type AiPlayStrengthPilotScope,
} from "./pilot-scope-registry";
import { SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV } from "../semantic-shadow-calibration";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import type { SemanticDecisionTrace } from "../semantic-decision-trace";
import type { SemanticRuntimeChoice } from "../../runtime/semantic-runtime-types";

describe("pilot-scope-registry", () => {
  const originalPilot = process.env[AI_PLAY_STRENGTH_PILOT_ENV];
  const originalLegacyPilot = process.env.AI_PLAY_STRENGTH_PILOT_SCOPE;
  const originalCalibration =
    process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV];

  afterEach(() => {
    if (originalPilot === undefined) {
      delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_PILOT_ENV] = originalPilot;
    }
    if (originalLegacyPilot === undefined) {
      delete process.env.AI_PLAY_STRENGTH_PILOT_SCOPE;
    } else {
      process.env.AI_PLAY_STRENGTH_PILOT_SCOPE = originalLegacyPilot;
    }
    if (originalCalibration === undefined) {
      delete process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV];
    } else {
      process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV] = originalCalibration;
    }
  });

  it("parses known pilot scopes deterministically and ignores unknown entries", () => {
    expect(
      parsePilotScopes(
        ` ${BASIC_SETUP_PILOT_MODE},unknown;${RUNNER_SAFE_ACCESS_PILOT_MODE} ${BASIC_SETUP_PILOT_MODE} `,
      ),
    ).toEqual([BASIC_SETUP_PILOT_MODE, RUNNER_SAFE_ACCESS_PILOT_MODE]);
  });

  it("keeps remote contest outside runtime pilot scopes", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = "remote_contest";

    expect(parsePilotScopes("remote_contest")).toEqual([]);
    expect(ALL_PLAY_STRENGTH_PILOT_SCOPES).not.toContain(
      "remote_contest" as AiPlayStrengthPilotScope,
    );
    expect(semanticPlayStrengthPilotEnabled()).toBe(false);
  });

  it("expands the all token without duplicating explicit scopes", () => {
    expect(parsePilotScopes(PLAY_STRENGTH_PILOT_ALL_TOKEN)).toEqual(
      ALL_PLAY_STRENGTH_PILOT_SCOPES,
    );
    expect(
      parsePilotScopes(
        `${RUNNER_SAFE_ACCESS_PILOT_MODE},${PLAY_STRENGTH_PILOT_ALL_TOKEN};${BASIC_SETUP_PILOT_MODE}`,
      ),
    ).toEqual([
      RUNNER_SAFE_ACCESS_PILOT_MODE,
      BASIC_SETUP_PILOT_MODE,
      CORP_SCORE_WINDOW_PILOT_MODE,
    ]);
  });

  it("keeps the prepared local default policy default-off", () => {
    const policy = buildLocalDefaultPilotPolicy();

    expect(policy).toMatchObject({
      version: "ai-play-strength-local-default-pilot-policy-v1",
      scope: "local_default_pilot_policy_report_only",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
      defaultEnabledScopes: [],
    });
    expect(policy.scopes.map((scope) => scope.scope)).toEqual(
      ALL_PLAY_STRENGTH_PILOT_SCOPES,
    );
    expect(policy.scopes.every((scope) => scope.enabledByDefault === false))
      .toBe(true);
    expect(policy.scopes.every((scope) => scope.envGateRequired === true))
      .toBe(true);
    expect(
      policy.scopes.find((scope) => scope.scope === CORP_SCORE_WINDOW_PILOT_MODE),
    ).toEqual(expect.objectContaining({ status: "keep_env_gated" }));
  });

  it("uses only NETGRID_AI_PLAY_STRENGTH_PILOT as the runtime env contract", () => {
    process.env.AI_PLAY_STRENGTH_PILOT_SCOPE = BASIC_SETUP_PILOT_MODE;
    delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];

    const params = {
      frame: frame(["gain-1", "draw-1"]),
      trace: trace("draw-1", 122, "setup"),
      currentChoice: choice("gain-1", "gain_credit", 100),
      choices: [
        choice("gain-1", "gain_credit", 100),
        choice("draw-1", "draw_card", 122),
      ],
    };

    expect(semanticPilotChoice(params)).toBeUndefined();

    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;

    expect(semanticPilotChoice(params)?.choice.action.actionId).toBe("draw-1");
  });

  it("allows only basic setup resource actions for the basic scope", () => {
    const allowed = pilotScopeAllowsAction({
      scope: BASIC_SETUP_PILOT_MODE,
      frame: frame(["gain-1"]),
      action: legalAction("gain-1", "gain_credit"),
      top: rankedAction("gain-1", 120, "economy"),
    });
    const blocked = pilotScopeAllowsAction({
      scope: BASIC_SETUP_PILOT_MODE,
      frame: frame(["run-1"]),
      action: legalAction("run-1", "start_run", { serverId: "hq" }),
      top: rankedAction("run-1", 140, "run_access"),
    });

    expect(allowed).toMatchObject({
      scope: BASIC_SETUP_PILOT_MODE,
      allowed: true,
      reason: "basic_setup_resource_action",
    });
    expect(allowed.evidence).toEqual(
      expect.arrayContaining([
        "pilot_scope_allowed:true",
        `pilot_scope:${BASIC_SETUP_PILOT_MODE}`,
        "action_type:gain_credit",
      ]),
    );
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("basic_setup_action_type_blocked");
  });

  it("allows only reachable central run targets for runner safe access", () => {
    const top = rankedAction("run-hq", 160, "run_access");
    const allowed = pilotScopeAllowsAction({
      scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
      frame: frame(["run-hq"], {
        runner: { runTargets: [safeCentralRunTarget("run-hq", "hq")] },
      }),
      action: legalAction("run-hq", "start_run", { serverId: "hq" }),
      top,
    });
    const remoteBlocked = pilotScopeAllowsAction({
      scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
      frame: frame(["run-remote"], {
        runner: {
          runTargets: [
            {
              ...safeCentralRunTarget("run-remote", "remote_1"),
              targetKind: "remote",
              accessTargetKind: "remote",
              scoreThreat: true,
            },
          ],
        },
      }),
      action: legalAction("run-remote", "start_run", { serverId: "remote_1" }),
      top: rankedAction("run-remote", 160, "remote_contest"),
    });

    expect(allowed).toMatchObject({
      scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
      allowed: true,
      reason: "runner_safe_access_central_reachable_allowed",
    });
    expect(allowed.evidence).toEqual(
      expect.arrayContaining(["target_kind:hq", "recommendation:run_now"]),
    );
    expect(remoteBlocked.allowed).toBe(false);
    expect(remoteBlocked.reason).toBe("runner_safe_access_non_central_target");
  });

  it("builds a decision matrix for every requested pilot scope", () => {
    const frameInput = frame(["run-hq"], {
      runner: { runTargets: [safeCentralRunTarget("run-hq", "hq")] },
    });
    const top = rankedAction("run-hq", 160, "run_access");
    const matrix = buildPilotScopeDecisionMatrix({
      frame: frameInput,
      action: legalAction("run-hq", "start_run", { serverId: "hq" }),
      top,
      scoreGap: 42,
    });

    expect(matrix).toEqual({
      topActionId: "run-hq",
      scoreGap: 42,
      scopes: [
        expect.objectContaining({
          scope: BASIC_SETUP_PILOT_MODE,
          allowed: false,
          reason: "basic_setup_action_type_blocked",
        }),
        expect.objectContaining({
          scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
          allowed: true,
          reason: "runner_safe_access_central_reachable_allowed",
          evidence: expect.arrayContaining(["target_kind:hq"]),
        }),
        expect.objectContaining({
          scope: CORP_SCORE_WINDOW_PILOT_MODE,
          allowed: false,
          reason: "corp_score_window_wrong_side",
        }),
      ],
    });
  });

  it("blocks runner safe access on risk signals from the run target", () => {
    const riskyCases = [
      {
        label: "universal pressure",
        target: {
          ...safeCentralRunTarget("run-hq", "hq"),
          riskyUniversalCoverage: true,
        },
        reason: "runner_safe_access_universal_risk_blocked",
        evidence: "risky_universal_coverage:true",
      },
      {
        label: "negative credits after run",
        target: {
          ...safeCentralRunTarget("run-hq", "hq"),
          creditsAfterRun: -1,
        },
        reason: "runner_safe_access_credit_risk_blocked",
        evidence: "credits_after_run:-1",
      },
      {
        label: "unaffordable steal or trash",
        target: {
          ...safeCentralRunTarget("run-hq", "hq"),
          stealOrTrashAffordable: false,
        },
        reason: "runner_safe_access_unaffordable_access_blocked",
        evidence: "steal_or_trash_affordable:false",
      },
    ] as const;

    for (const riskyCase of riskyCases) {
      const result = pilotScopeAllowsAction({
        scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
        frame: frame(["run-hq"], {
          runner: { runTargets: [riskyCase.target] },
        }),
        action: legalAction("run-hq", "start_run", { serverId: "hq" }),
        top: rankedAction("run-hq", 160, "run_access"),
      });

      expect(result.allowed, riskyCase.label).toBe(false);
      expect(result.reason, riskyCase.label).toBe(riskyCase.reason);
      expect(result.evidence, riskyCase.label).toEqual(
        expect.arrayContaining([riskyCase.evidence]),
      );
    }
  });

  it("allows only corp score_agenda actions with scoreline evidence", () => {
    const allowed = pilotScopeAllowsAction({
      scope: CORP_SCORE_WINDOW_PILOT_MODE,
      frame: frame(["score-1"], { side: "corp" }),
      action: legalAction("score-1", "score_agenda", undefined, "corp"),
      top: rankedAction("score-1", 160, "corp_scoreline", "corp"),
    });
    const advanceBlocked = pilotScopeAllowsAction({
      scope: CORP_SCORE_WINDOW_PILOT_MODE,
      frame: frame(["advance-1"], { side: "corp" }),
      action: legalAction("advance-1", "advance_card", undefined, "corp"),
      top: rankedAction("advance-1", 160, "corp_scoreline", "corp"),
    });

    expect(allowed).toMatchObject({
      scope: CORP_SCORE_WINDOW_PILOT_MODE,
      allowed: true,
      reason: "corp_score_window_scoreline_allowed",
    });
    expect(advanceBlocked.allowed).toBe(false);
    expect(advanceBlocked.reason).toBe("corp_score_window_action_type_blocked");
  });

  it("returns a pilot choice with scope evidence for the first allowed parsed scope", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] =
      `${RUNNER_SAFE_ACCESS_PILOT_MODE},${BASIC_SETUP_PILOT_MODE}`;
    const result = semanticPilotChoice({
      frame: frame(["gain-1", "run-hq"], {
        runner: { runTargets: [safeCentralRunTarget("run-hq", "hq")] },
      }),
      trace: trace("run-hq", 160, "run_access"),
      currentChoice: choice("gain-1", "gain_credit", 70),
      choices: [
        choice("gain-1", "gain_credit", 70),
        choice("run-hq", "start_run", 160, { serverId: "hq" }),
      ],
    });

    expect(result?.choice.action.actionId).toBe("run-hq");
    expect(result?.choice.reasonCode).toBe(
      "ai_play_strength.runner_safe_access_pilot",
    );
    expect(result?.choice.evidence).toEqual(
      expect.arrayContaining([
        "ai_play_strength_pilot:runner_safe_access",
        "pilot_scope_allowed:true",
        "target_kind:hq",
      ]),
    );
    expect(result?.evidence).toEqual(
      expect.arrayContaining([
        "ai_play_strength_pilot:runner_safe_access",
        "pilot_scope_reason:runner_safe_access_central_reachable_allowed",
        "pilot_scope_matrix:basic_setup:blocked:basic_setup_action_type_blocked",
        "pilot_scope_matrix:runner_safe_access:allowed:runner_safe_access_central_reachable_allowed",
      ]),
    );
  });

  it("falls through blocked earlier scopes in a multi-scope env", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] =
      `${BASIC_SETUP_PILOT_MODE},${RUNNER_SAFE_ACCESS_PILOT_MODE}`;
    const result = semanticPilotChoice({
      frame: frame(["gain-1", "run-hq"], {
        runner: { runTargets: [safeCentralRunTarget("run-hq", "hq")] },
      }),
      trace: trace("run-hq", 160, "run_access"),
      currentChoice: choice("gain-1", "gain_credit", 70),
      choices: [
        choice("gain-1", "gain_credit", 70),
        choice("run-hq", "start_run", 160, { serverId: "hq" }),
      ],
    });

    expect(result?.choice.action.actionId).toBe("run-hq");
    expect(result?.choice.reasonCode).toBe(
      "ai_play_strength.runner_safe_access_pilot",
    );
    expect(result?.evidence).toEqual(
      expect.arrayContaining([
        "ai_play_strength_pilot:runner_safe_access",
        "pilot_scope_reason:runner_safe_access_central_reachable_allowed",
      ]),
    );
  });

  it("takes the pilot minimum score gap from the active calibration profile", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;
    delete process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV];

    const params = {
      frame: frame(["gain-1", "draw-1"]),
      trace: trace("draw-1", 122, "setup"),
      currentChoice: choice("gain-1", "gain_credit", 100),
      choices: [
        choice("gain-1", "gain_credit", 100),
        choice("draw-1", "draw_card", 122),
      ],
    };

    expect(semanticPilotChoice(params)?.choice.action.actionId).toBe("draw-1");

    process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV] =
      "shadow_calibrated_v1";

    expect(semanticPilotChoice(params)).toBeUndefined();
  });
});

function frame(
  legalActionIds: string[],
  options: {
    side?: SemanticDecisionFrame["side"];
    runner?: SemanticDecisionFrame["runner"];
    candidates?: SemanticDecisionFrame["actionCandidates"];
  } = {},
): SemanticDecisionFrame {
  const side = options.side ?? "runner";
  const actionCandidates =
    options.candidates ??
    options.runner?.runTargets?.map((target) =>
      runCandidateFromTarget(target.actionId, target.targetServerId),
    ) ??
    [];
  return {
    schemaVersion: "semantic-decision-frame-v1",
    side,
    stateVersion: 1,
    profileId: `${side}:test`,
    legalActionIds,
    actionCandidates,
    tacticalGoals: [],
    ...(options.runner ? { runner: options.runner } : {}),
    evidence: ["test_frame"],
    hiddenInfoPolicy: "player_view_only",
  };
}

function runCandidateFromTarget(
  actionId: string,
  serverId: string,
): ActionSemanticCandidate {
  const serverKind =
    serverId === "hq" || serverId === "rd" || serverId === "archives"
      ? serverId
      : serverId.startsWith("remote_")
        ? "remote"
        : undefined;
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
    runProjectionSummary: {
      serverId,
      ...(serverKind ? { serverKind } : {}),
      source: "target_context",
      evidence: [`test_run_projection_summary:${serverId}`],
    },
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
    evidence: [`run_action_projection_target:${serverId}`],
  };
}

function trace(
  actionId: string,
  score: number,
  utilityFamily: string,
  side: "runner" | "corp" = "runner",
): SemanticDecisionTrace {
  return {
    schemaVersion: "semantic-decision-trace-v1",
    frameSummary: {
      side,
      stateVersion: 1,
      profileId: `${side}:test`,
      legalActionCount: 2,
      actionCandidateCount: 2,
      tacticalGoalCount: 1,
      hiddenInfoPolicy: "player_view_only",
    },
    rankedActions: [rankedAction(actionId, score, utilityFamily)],
    rejectedActions: [],
    noRuntimeEffect: true,
  };
}

function rankedAction(
  actionId: string,
  score: number,
  utilityFamily: string,
  side: "runner" | "corp" = "runner",
): SemanticDecisionTrace["rankedActions"][number] {
  return {
    actionId,
    rank: 1,
    score,
    primaryGoalId: `${side}.${utilityFamily}`,
    components: [
      {
        component: "goal_fit",
        delta: score,
        evidence: [`utility_family:${utilityFamily}`],
      },
    ],
    blockers: [],
    explanation: "test_trace",
  };
}

function choice(
  actionId: string,
  type: LegalAction["type"],
  score: number,
  payload?: LegalAction["payload"],
  side: "runner" | "corp" = "runner",
): SemanticRuntimeChoice {
  return {
    action: legalAction(actionId, type, payload, side),
    scopeId: "test",
    score,
    reasonCode: "test",
    explanation: "test",
    evidence: ["test_choice"],
  };
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  payload?: LegalAction["payload"],
  side: "runner" | "corp" = "runner",
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
    ...(payload ? { payload } : {}),
  };
}

function safeCentralRunTarget(
  actionId: string,
  targetServerId: string,
): NonNullable<
  NonNullable<SemanticDecisionFrame["runner"]>["runTargets"]
>[number] {
  const targetKind =
    targetServerId === "rd" ? "rd" : targetServerId === "hq" ? "hq" : "remote";
  const payoff = {
    immediateAccessValue: 20,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: ["test_payoff"],
  };
  return {
    schemaVersion: "runner-run-target-evaluation-v1",
    targetServerId,
    targetKind,
    accessServerId: targetServerId,
    accessTargetKind: targetKind,
    actionId,
    accessPayoff: "fresh",
    knownAccessState: "fresh",
    multiaccessAvailable: false,
    pathPassability: "reachable",
    pathCost: 0,
    creditsAfterRun: 4,
    stealOrTrashAffordable: "unknown",
    installedRunPayoff: payoff,
    runActionPayoff: payoff,
    runActionProjection: {
      actionId,
      actionType: "start_run",
      sourceKind: "basic_action",
      targetServerId,
      targetKind,
      accessServerId: targetServerId,
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
    recommendation: "run_now",
    score: 100,
    evidence: ["test_safe_access"],
  };
}
