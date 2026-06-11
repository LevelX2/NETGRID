import { afterEach, describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  BASIC_SETUP_PILOT_MODE,
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
});

function frame(legalActionIds: string[]): SemanticDecisionFrame {
  return {
    schemaVersion: "semantic-decision-frame-v1",
    side: "runner",
    stateVersion: 1,
    profileId: "runner:test",
    legalActionIds,
    actionCandidates: [],
    tacticalGoals: [],
    evidence: ["test_frame"],
    hiddenInfoPolicy: "player_view_only",
  };
}

function trace(
  actionId: string,
  score: number,
  primaryGoalId: string,
  utilityFamily: string,
): SemanticDecisionTrace {
  return {
    schemaVersion: "semantic-decision-trace-v1",
    frameSummary: {
      side: "runner",
      stateVersion: 1,
      profileId: "runner:test",
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
): SemanticRuntimeChoice {
  return {
    action: {
      actionId,
      side: "runner",
      type,
      label: type,
      source: "basic_action",
      timingPoint: "runner_action.main",
      costs: [],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: 1,
    },
    scopeId: "test",
    score,
    reasonCode: "test",
    explanation: "test",
    evidence: ["test_choice"],
  };
}
