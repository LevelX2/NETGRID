import type { LegalAction } from "@netgrid/shared";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import type { SemanticDecisionFrame } from "./semantic-decision-frame";
import type { SemanticDecisionTrace } from "./semantic-decision-trace";

export const AI_PLAY_STRENGTH_PILOT_ENV = "NETGRID_AI_PLAY_STRENGTH_PILOT";
export const BASIC_SETUP_PILOT_MODE = "basic_setup";
export const RUNNER_SAFE_ACCESS_PILOT_MODE = "runner_safe_access";
const MINIMUM_PILOT_SCORE_GAP = 20;

export type SemanticBasicSetupPilotResult = {
  choice: SemanticRuntimeChoice;
  evidence: string[];
};

export function semanticBasicSetupPilotEnabled(): boolean {
  return process.env[AI_PLAY_STRENGTH_PILOT_ENV] === BASIC_SETUP_PILOT_MODE;
}

export function semanticPlayStrengthPilotEnabled(): boolean {
  return (
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] === BASIC_SETUP_PILOT_MODE ||
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] === RUNNER_SAFE_ACCESS_PILOT_MODE
  );
}

export function semanticBasicSetupPilotChoice(params: {
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
  currentChoice: SemanticRuntimeChoice;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticBasicSetupPilotResult | undefined {
  if (!semanticPlayStrengthPilotEnabled()) return undefined;
  const top = params.trace.rankedActions[0];
  if (!top) return undefined;
  if (!params.frame.legalActionIds.includes(top.actionId)) return undefined;
  if (top.blockers.length > 0) return undefined;
  if (top.score - params.currentChoice.score < MINIMUM_PILOT_SCORE_GAP) {
    return undefined;
  }
  const matchingChoice = params.choices.find(
    (choice) => !choice.exclusion && choice.action.actionId === top.actionId,
  );
  if (!matchingChoice) return undefined;
  const mode = process.env[AI_PLAY_STRENGTH_PILOT_ENV];
  if (
    mode === BASIC_SETUP_PILOT_MODE &&
    !actionAllowedInBasicSetupPilot(matchingChoice.action, top)
  ) {
    return undefined;
  }
  if (
    mode === RUNNER_SAFE_ACCESS_PILOT_MODE &&
    !actionAllowedInRunnerSafeAccessPilot(params.frame, matchingChoice.action, top)
  ) {
    return undefined;
  }
  if (mode !== BASIC_SETUP_PILOT_MODE && mode !== RUNNER_SAFE_ACCESS_PILOT_MODE) {
    return undefined;
  }
  if (!traceIsHiddenInfoSafe(params.trace)) return undefined;
  if (mode === RUNNER_SAFE_ACCESS_PILOT_MODE) {
    return {
      choice: {
        ...matchingChoice,
        reasonCode: "ai_play_strength.runner_safe_access_pilot",
        explanation: `Runner safe-access pilot selected ${matchingChoice.action.type} from semantic shadow ranking.`,
        evidence: [
          ...matchingChoice.evidence,
          "ai_play_strength_pilot:runner_safe_access",
          `ai_play_strength_pilot_score:${top.score}`,
          `ai_play_strength_pilot_score_gap:${top.score - params.currentChoice.score}`,
          `ai_play_strength_pilot_goal:${top.primaryGoalId ?? "unknown"}`,
        ],
      },
      evidence: [
        "ai_play_strength_pilot:runner_safe_access",
        `top_action:${top.actionId}`,
        `score_gap:${top.score - params.currentChoice.score}`,
      ],
    };
  }
  return {
    choice: {
      ...matchingChoice,
      reasonCode: "ai_play_strength.basic_setup_pilot",
      explanation: `Basic/setup pilot selected ${matchingChoice.action.type} from semantic shadow ranking.`,
      evidence: [
        ...matchingChoice.evidence,
        "ai_play_strength_pilot:basic_setup",
        `ai_play_strength_pilot_score:${top.score}`,
        `ai_play_strength_pilot_score_gap:${top.score - params.currentChoice.score}`,
        `ai_play_strength_pilot_goal:${top.primaryGoalId ?? "unknown"}`,
      ],
    },
    evidence: [
      "ai_play_strength_pilot:basic_setup",
      `top_action:${top.actionId}`,
      `score_gap:${top.score - params.currentChoice.score}`,
    ],
  };
}

function actionAllowedInBasicSetupPilot(
  action: LegalAction,
  top: SemanticDecisionTrace["rankedActions"][number],
): boolean {
  switch (action.type) {
    case "gain_credit":
    case "draw_card":
      return true;
    case "install_card":
      return top.components.some(
        (component) =>
          component.component === "goal_fit" &&
          component.evidence.some(
            (entry) =>
              entry === "utility_family:setup" ||
              entry === "utility_family:coverage",
          ),
      );
    case "remove_tag":
      return top.components.some(
        (component) =>
          component.component === "goal_fit" &&
          component.evidence.some(
            (entry) =>
              entry === "utility_family:survival" ||
              entry === "utility_family:cleanup",
          ),
      );
    case "end_turn":
      return top.score >= 80;
    default:
      return false;
  }
}

function actionAllowedInRunnerSafeAccessPilot(
  frame: SemanticDecisionFrame,
  action: LegalAction,
  top: SemanticDecisionTrace["rankedActions"][number],
): boolean {
  if (frame.side !== "runner") return false;
  if (action.type !== "start_run") return false;
  const targetServerId = action.payload?.serverId;
  if (typeof targetServerId !== "string") return false;
  const matchingRunTarget = frame.runner?.runTargets?.find(
    (target) =>
      target.actionId === top.actionId &&
      target.targetServerId === targetServerId,
  );
  if (!matchingRunTarget) return false;
  return (
    (matchingRunTarget.targetKind === "hq" ||
      matchingRunTarget.targetKind === "rd") &&
    matchingRunTarget.recommendation === "run_now" &&
    matchingRunTarget.pathPassability === "reachable" &&
    matchingRunTarget.scoreThreat === false
  );
}

function traceIsHiddenInfoSafe(trace: SemanticDecisionTrace): boolean {
  return !containsForbiddenSemanticMarker(trace);
}
