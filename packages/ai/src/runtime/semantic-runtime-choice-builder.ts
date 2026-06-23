import type {
  AiDecisionDebug,
  AiDecisionInput,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeExclusion,
} from "./semantic-runtime-types";
import {
  semanticRuntimeConfidence,
  semanticRuntimeScoreFromComponents,
} from "./semantic-runtime-score-components";
import {
  semanticRuntimeScopeForAction,
  type SemanticRuntimeScopeDependencies,
} from "./semantic-runtime-scope";

export type SemanticRuntimeChoiceBuilderDependencies = {
  scope: SemanticRuntimeScopeDependencies;
  actionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  scoreBreakdown: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    exclusion: SemanticRuntimeExclusion | undefined,
    actionSemanticCandidate: ActionSemanticCandidate | undefined,
  ) => NonNullable<AiDecisionDebug["scoreBreakdown"]>;
  actionCreditCost: (action: LegalAction) => number;
  evidence: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
  ) => string[];
  explanation: (side: Side, scopeId: string) => string;
  compareAction: (left: LegalAction, right: LegalAction) => number;
};

export function buildSemanticRuntimeChoices(
  input: AiDecisionInput,
  actionSemanticCandidates: readonly ActionSemanticCandidate[] = [],
  dependencies: SemanticRuntimeChoiceBuilderDependencies,
): SemanticRuntimeChoice[] {
  const candidatesByActionId = new Map(
    actionSemanticCandidates.map((candidate) => [
      candidate.actionId,
      candidate,
    ]),
  );
  return sortSemanticRuntimeChoices(
    input.legalActions.map((action) =>
      scoreSemanticRuntimeAction(
        input,
        action,
        candidatesByActionId.get(action.actionId),
        dependencies,
      ),
    ),
    dependencies.compareAction,
  );
}

export function sortSemanticRuntimeChoices(
  choices: readonly SemanticRuntimeChoice[],
  compareAction: (left: LegalAction, right: LegalAction) => number,
): SemanticRuntimeChoice[] {
  return choices
    .slice()
    .sort(
      (left, right) =>
        Number(Boolean(left.exclusion)) - Number(Boolean(right.exclusion)) ||
        right.score - left.score ||
        compareAction(left.action, right.action),
    );
}

function scoreSemanticRuntimeAction(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: SemanticRuntimeChoiceBuilderDependencies,
): SemanticRuntimeChoice {
  const scopeId = semanticRuntimeScopeForAction(
    input,
    action,
    actionSemanticCandidate,
    dependencies.scope,
  );
  const exclusion = dependencies.actionExclusion(input, action);
  const scoreBreakdown = dependencies.scoreBreakdown(
    input,
    action,
    scopeId,
    exclusion,
    actionSemanticCandidate,
  );
  const score = semanticRuntimeScoreFromComponents(scoreBreakdown);
  return {
    action,
    scopeId,
    ...(exclusion ? { exclusion } : {}),
    reasonCode: `${input.side}.semantic.${scopeId}`,
    explanation: dependencies.explanation(input.side, scopeId),
    score,
    evidence: [
      `action_type:${action.type}`,
      `semantic_scope:${scopeId}`,
      `semantic_score:${score}`,
      `credit_cost:${dependencies.actionCreditCost(action)}`,
      ...(actionSemanticCandidate
        ? [
            `action_semantic_candidate:${actionSemanticCandidate.semanticActionType}`,
            `action_semantic_projection:${actionSemanticCandidate.primaryProjectionStatus}`,
          ]
        : []),
      ...(exclusion
        ? [
            "semantic_excluded:true",
            `semantic_exclusion:${exclusion.key}`,
            `semantic_exclusion_reason:${exclusion.reason}`,
          ]
        : []),
      ...dependencies.evidence(input, action, scopeId),
    ],
    confidence: semanticRuntimeConfidence(scopeId, score),
  };
}
