import type { AiDecisionInput, Side } from "@netgrid/shared";
import type { SemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { TacticalGoalUtilityFamily } from "../decision/tactical-goal-utility";
import type { AiMistakeClass } from "./mistake-taxonomy";

export type DecisionSnapshot = {
  snapshotId: string;
  side: Side;
  description: string;
  inputBuilder: () => AiDecisionInput;
  frameBuilder?: (input: AiDecisionInput) => SemanticDecisionFrame;
  expectedProperties: {
    mustChooseFromLegalActions: true;
    forbiddenMistakes: AiMistakeClass[];
    preferredGoalFamilies?: TacticalGoalUtilityFamily[];
  };
};

export type ShadowLeagueFollowupCandidate = {
  scenarioId: string;
  issueClass:
    | "expectation_mismatch"
    | "forbidden_mistake"
    | "pilot_blocked"
    | "target_choice_gap"
    | "doctrine_goal_conflict";
  suggestedPackage: string;
  evidence: string[];
};
