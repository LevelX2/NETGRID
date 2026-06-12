import type { LegalAction } from "@netgrid/shared";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import type { SemanticDecisionFrame } from "./semantic-decision-frame";
import type { SemanticDecisionTrace } from "./semantic-decision-trace";

export const AI_PLAY_STRENGTH_PILOT_ENV = "NETGRID_AI_PLAY_STRENGTH_PILOT";
export const BASIC_SETUP_PILOT_MODE = "basic_setup";
const MINIMUM_PILOT_SCORE_GAP = 20;

export type SemanticBasicSetupPilotResult = {
  choice: SemanticRuntimeChoice;
  evidence: string[];
};

export function semanticBasicSetupPilotEnabled(): boolean {
  return process.env[AI_PLAY_STRENGTH_PILOT_ENV] === BASIC_SETUP_PILOT_MODE;
}

export function semanticBasicSetupPilotChoice(params: {
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
  currentChoice: SemanticRuntimeChoice;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticBasicSetupPilotResult | undefined {
  if (!semanticBasicSetupPilotEnabled()) return undefined;
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
  if (!actionAllowedInBasicSetupPilot(matchingChoice.action, top)) {
    return undefined;
  }
  if (!traceIsHiddenInfoSafe(params.trace)) return undefined;
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

function traceIsHiddenInfoSafe(trace: SemanticDecisionTrace): boolean {
  return !containsForbiddenSemanticMarker(trace);
}
