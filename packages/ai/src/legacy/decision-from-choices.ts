import {
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";

import { buildLegacyBaselineDecisionDebug } from "../diagnostics/legacy-baseline-debug";
import { compareAction } from "../runtime/action-order";
import { type LegacyBaselineChoice } from "./legacy-baseline";

type LegacyDecisionFromChoicesDependencies = {
  readonly selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
  readonly scrubEvidence: (evidence: readonly string[]) => string[];
};

export function decisionFromLegacyChoices(
  input: AiDecisionInput,
  choices: LegacyBaselineChoice[],
  dependencies: LegacyDecisionFromChoicesDependencies,
): AiDecision {
  const consideredActionIds = input.legalActions
    .map((action) => action.actionId)
    .sort();
  const decisionDebug = buildLegacyBaselineDecisionDebug(input);
  const choice = choices
    .filter((candidate) => candidate.action && candidate.score > 200)
    .sort(
      (left, right) =>
        right.score - left.score || compareAction(left.action!, right.action!),
    )[0];
  if (choice?.action) {
    const selectedChoices = dependencies.selectedChoicesForDecision(
      input,
      choice.action,
    );
    return {
      actionId: choice.action.actionId,
      ...(selectedChoices ? { selectedChoices } : {}),
      reasonCode: choice.reasonCode,
      explanation: choice.explanation,
      consideredActionIds,
      fallbackUsed: false,
      evidence: dependencies.scrubEvidence(choice.evidence),
      decisionDebug,
      timeoutUsed: false,
      profileId: input.profileId,
      difficulty: input.difficulty,
      ...(choice.confidence !== undefined
        ? { confidence: choice.confidence }
        : {}),
      reason: choice.reasonCode,
    };
  }
  const fallback = input.legalActions.slice().sort(compareAction)[0];
  if (!fallback) {
    return {
      actionId: "",
      reasonCode: "fallback.no_legal_action",
      explanation: "Es ist keine legale Aktion verfügbar.",
      consideredActionIds,
      fallbackUsed: true,
      evidence: ["no_legal_actions"],
      decisionDebug,
      timeoutUsed: false,
      profileId: input.profileId,
      difficulty: input.difficulty,
      confidence: 0,
      reason: "fallback.no_legal_action",
    };
  }
  const selectedChoices = dependencies.selectedChoicesForDecision(
    input,
    fallback,
  );
  return {
    actionId: fallback.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode: "fallback.first_legal_action",
    explanation: "Die erste stabile LegalAction wird als Fallback gewählt.",
    consideredActionIds,
    fallbackUsed: true,
    evidence: ["fallback_stable_legal_action"],
    decisionDebug,
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    confidence: 0.2,
    reason: "fallback.first_legal_action",
  };
}
