import { afterEach, describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  ALL_PLAY_STRENGTH_PILOT_SCOPES,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  PLAY_STRENGTH_PILOT_ALL_TOKEN,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  parsePilotScopes,
  pilotScopeAllowsAction,
  semanticPilotChoice,
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
  } = {},
): SemanticDecisionFrame {
  const side = options.side ?? "runner";
  return {
    schemaVersion: "semantic-decision-frame-v1",
    side,
    stateVersion: 1,
    profileId: `${side}:test`,
    legalActionIds,
    actionCandidates: [],
    tacticalGoals: [],
    ...(options.runner ? { runner: options.runner } : {}),
    evidence: ["test_frame"],
    hiddenInfoPolicy: "player_view_only",
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
