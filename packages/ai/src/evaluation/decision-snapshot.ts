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
