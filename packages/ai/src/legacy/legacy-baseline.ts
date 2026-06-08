import type {
  AiDecision,
  AiDecisionInput,
  LegalAction,
  Side,
} from "@netgrid/shared";

export type LegacyBaselineChoice = {
  action: LegalAction | undefined;
  reasonCode: string;
  explanation: string;
  score: number;
  evidence: string[];
  confidence?: number;
};

export type LegacyBaselineDependencies = {
  scoreActions: (
    input: AiDecisionInput,
    side: Side,
  ) => LegacyBaselineChoice[];
  decisionFromChoices: (
    input: AiDecisionInput,
    choices: LegacyBaselineChoice[],
  ) => AiDecision;
};

export function chooseCorpLegacyBaselineAction(
  input: AiDecisionInput,
  dependencies: LegacyBaselineDependencies,
): AiDecision {
  return chooseLegacyBaselineAction(input, "corp", dependencies);
}

export function chooseRunnerLegacyBaselineAction(
  input: AiDecisionInput,
  dependencies: LegacyBaselineDependencies,
): AiDecision {
  return chooseLegacyBaselineAction(input, "runner", dependencies);
}

function chooseLegacyBaselineAction(
  input: AiDecisionInput,
  side: Side,
  dependencies: LegacyBaselineDependencies,
): AiDecision {
  return dependencies.decisionFromChoices(
    input,
    dependencies.scoreActions(input, side),
  );
}
