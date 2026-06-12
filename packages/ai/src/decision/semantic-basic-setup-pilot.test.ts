import { afterEach, describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  semanticBasicSetupPilotChoice,
} from "./semantic-basic-setup-pilot";
import type { SemanticDecisionFrame } from "./semantic-decision-frame";
import type { SemanticDecisionTrace } from "./semantic-decision-trace";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";

describe("semanticBasicSetupPilotChoice", () => {
  const originalPilot = process.env[AI_PLAY_STRENGTH_PILOT_ENV];

  afterEach(() => {
    if (originalPilot === undefined) {
      delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_PILOT_ENV] = originalPilot;
    }
  });

  it("does nothing when the pilot flag is unset", () => {
    delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];

    expect(
      semanticBasicSetupPilotChoice({
        frame: frame(["gain-1", "run-1"]),
        trace: trace("gain-1", 120, "runner.build_economy_base", "economy"),
        currentChoice: choice("run-1", "start_run", 70),
        choices: [
          choice("gain-1", "gain_credit", 120),
          choice("run-1", "start_run", 70),
        ],
      }),
    ).toBeUndefined();
  });

  it("overrides only allowed basic/setup families when the flag is set", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;

    const result = semanticBasicSetupPilotChoice({
      frame: frame(["gain-1", "run-1"]),
      trace: trace("gain-1", 120, "runner.build_economy_base", "economy"),
      currentChoice: choice("run-1", "start_run", 70),
      choices: [
        choice("gain-1", "gain_credit", 120),
        choice("run-1", "start_run", 70),
      ],
    });

    expect(result?.choice.action.actionId).toBe("gain-1");
    expect(result?.choice.reasonCode).toBe("ai_play_strength.basic_setup_pilot");
  });

  it("never uses start_run in the basic/setup pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;

    expect(
      semanticBasicSetupPilotChoice({
        frame: frame(["gain-1", "run-1"]),
        trace: trace("run-1", 160, "runner.pressure_good_central_target", "run_access"),
        currentChoice: choice("gain-1", "gain_credit", 70),
        choices: [
          choice("gain-1", "gain_credit", 70),
          choice("run-1", "start_run", 160),
        ],
      }),
    ).toBeUndefined();
  });

  it("overrides a matching safe central run only in the runner safe-access pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = RUNNER_SAFE_ACCESS_PILOT_MODE;

    const result = semanticBasicSetupPilotChoice({
      frame: frame(["gain-1", "run-hq"], {
        runner: { runTargets: [safeCentralRunTarget("run-hq", "hq")] },
      }),
      trace: trace("run-hq", 160, "runner.pressure_good_central_target", "run_access"),
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
      expect.arrayContaining(["ai_play_strength_pilot:runner_safe_access"]),
    );
  });

  it("rejects remote contests in the runner safe-access pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = RUNNER_SAFE_ACCESS_PILOT_MODE;

    expect(
      semanticBasicSetupPilotChoice({
        frame: frame(["gain-1", "run-remote"], {
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
        trace: trace("run-remote", 160, "runner.remote_contest", "remote_contest"),
        currentChoice: choice("gain-1", "gain_credit", 70),
        choices: [
          choice("gain-1", "gain_credit", 70),
          choice("run-remote", "start_run", 160, { serverId: "remote_1" }),
        ],
      }),
    ).toBeUndefined();
  });

  it("overrides only score_agenda in the corp score-window pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = CORP_SCORE_WINDOW_PILOT_MODE;

    const result = semanticBasicSetupPilotChoice({
      frame: frame(["gain-1", "score-1"], { side: "corp" }),
      trace: trace("score-1", 160, "corp.neutral.score_agenda", "corp_scoreline", "corp"),
      currentChoice: choice("gain-1", "gain_credit", 70, undefined, "corp"),
      choices: [
        choice("gain-1", "gain_credit", 70, undefined, "corp"),
        choice("score-1", "score_agenda", 160, undefined, "corp"),
      ],
    });

    expect(result?.choice.action.actionId).toBe("score-1");
    expect(result?.choice.reasonCode).toBe(
      "ai_play_strength.corp_score_window_pilot",
    );
  });

  it("does not let advance_card through the corp score-window pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = CORP_SCORE_WINDOW_PILOT_MODE;

    expect(
      semanticBasicSetupPilotChoice({
        frame: frame(["gain-1", "advance-1"], { side: "corp" }),
        trace: trace(
          "advance-1",
          160,
          "corp.neutral.score_agenda",
          "corp_scoreline",
          "corp",
        ),
        currentChoice: choice("gain-1", "gain_credit", 70, undefined, "corp"),
        choices: [
          choice("gain-1", "gain_credit", 70, undefined, "corp"),
          choice("advance-1", "advance_card", 160, undefined, "corp"),
        ],
      }),
    ).toBeUndefined();
  });

  it("does not return non-legal actions", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;

    expect(
      semanticBasicSetupPilotChoice({
        frame: frame(["gain-1"]),
        trace: trace("not-legal", 160, "runner.build_economy_base", "economy"),
        currentChoice: choice("gain-1", "gain_credit", 70),
        choices: [choice("not-legal", "draw_card", 160)],
      }),
    ).toBeUndefined();
  });

  it("preserves fallback behavior when no matching semantic choice exists", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;

    expect(
      semanticBasicSetupPilotChoice({
        frame: frame(["gain-1", "draw-1"]),
        trace: trace("draw-1", 150, "runner.draw_or_search_for_setup", "setup"),
        currentChoice: choice("gain-1", "gain_credit", 120),
        choices: [choice("gain-1", "gain_credit", 120)],
      }),
    ).toBeUndefined();
  });

  it("rejects traces with forbidden hidden-info markers", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;

    expect(
      semanticBasicSetupPilotChoice({
        frame: frame(["gain-1", "run-1"]),
        trace: {
          ...trace("gain-1", 120, "runner.build_economy_base", "economy"),
          rankedActions: [
            {
              ...trace(
                "gain-1",
                120,
                "runner.build_economy_base",
                "economy",
              ).rankedActions[0]!,
              explanation: "secretGripIds:bad",
            },
          ],
        },
        currentChoice: choice("run-1", "start_run", 70),
        choices: [
          choice("gain-1", "gain_credit", 120),
          choice("run-1", "start_run", 70),
        ],
      }),
    ).toBeUndefined();
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
  primaryGoalId: string,
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
    rankedActions: [
      {
        actionId,
        rank: 1,
        score,
        primaryGoalId,
        components: [
          {
            component: "goal_fit",
            delta: score,
            evidence: [`utility_family:${utilityFamily}`],
          },
        ],
        blockers: [],
        explanation: "test_trace",
      },
    ],
    rejectedActions: [],
    noRuntimeEffect: true,
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
    action: {
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
    },
    scopeId: "test",
    score,
    reasonCode: "test",
    explanation: "test",
    evidence: ["test_choice"],
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
