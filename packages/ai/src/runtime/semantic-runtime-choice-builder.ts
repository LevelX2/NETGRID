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
import { semanticRuntimeStrategicActionFitEvidence } from "./strategic-action-fit";

export type SemanticRuntimeChoiceBuilderDependencies = {
  scope: SemanticRuntimeScopeDependencies;
  actionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate: ActionSemanticCandidate | undefined,
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
  const exclusion = dependencies.actionExclusion(
    input,
    action,
    actionSemanticCandidate,
  );
  const scoreBreakdown = dependencies.scoreBreakdown(
    input,
    action,
    scopeId,
    exclusion,
    actionSemanticCandidate,
  );
  const score = semanticRuntimeScoreFromComponents(scoreBreakdown);
  const reasonCode =
    input.side === "corp" &&
    scoreBreakdown.some(
      (component) =>
        component.key === "corp_tagged_meat_damage_payoff_pressure" ||
        component.reason?.includes("corp_tagged_meat_damage_payoff:true"),
    )
      ? "corp.semantic.corp_tag_punish"
      : `${input.side}.semantic.${scopeId}`;
  return {
    action,
    scopeId,
    ...(exclusion ? { exclusion } : {}),
    reasonCode,
    explanation: dependencies.explanation(input.side, scopeId),
    score,
    evidence: [
      `action_type:${action.type}`,
      `semantic_scope:${scopeId}`,
      `semantic_score:${score}`,
      `credit_cost:${semanticRuntimeChoiceCreditCostEvidence({
        action,
        actionSemanticCandidate,
        dependencies,
      })}`,
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
      ...semanticRuntimeStrategicActionFitEvidence(
        input,
        action,
        scopeId,
        actionSemanticCandidate,
      ),
      ...dependencies.evidence(input, action, scopeId),
    ],
    confidence: semanticRuntimeConfidence(scopeId, score),
  };
}

function semanticRuntimeChoiceCreditCostEvidence(params: {
  action: LegalAction;
  actionSemanticCandidate: ActionSemanticCandidate | undefined;
  dependencies: Pick<SemanticRuntimeChoiceBuilderDependencies, "actionCreditCost">;
}): number {
  const costProfile = params.actionSemanticCandidate?.costProfile;
  if (costProfile === undefined) {
    return params.dependencies.actionCreditCost(params.action);
  }
  if (typeof costProfile.creditCost === "number") return costProfile.creditCost;
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    return 0;
  }
  return params.dependencies.actionCreditCost(params.action);
}
