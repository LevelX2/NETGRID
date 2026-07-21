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
import { compareEconomyActionDominance } from "../economy/economy-action-score";
import type { CreditDemand } from "../plans/credit-demand";

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
    creditDemands?: readonly CreditDemand[],
  ) => NonNullable<AiDecisionDebug["scoreBreakdown"]>;
  actionCreditCost: (action: LegalAction) => number;
  evidence: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate: ActionSemanticCandidate | undefined,
  ) => string[];
  explanation: (side: Side, scopeId: string) => string;
  compareAction: (left: LegalAction, right: LegalAction) => number;
};

export function buildSemanticRuntimeChoices(
  input: AiDecisionInput,
  actionSemanticCandidates: readonly ActionSemanticCandidate[] = [],
  dependencies: SemanticRuntimeChoiceBuilderDependencies,
  creditDemands: readonly CreditDemand[] = [],
): SemanticRuntimeChoice[] {
  const candidatesByActionId = new Map(
    actionSemanticCandidates.map((candidate) => [
      candidate.actionId,
      candidate,
    ]),
  );
  const economyDominanceExclusions = buildEconomyDominanceExclusions(
    actionSemanticCandidates,
  );
  return sortSemanticRuntimeChoices(
    input.legalActions.map((action) =>
      scoreSemanticRuntimeAction(
        input,
        action,
        candidatesByActionId.get(action.actionId),
        economyDominanceExclusions.get(action.actionId),
        dependencies,
        creditDemands,
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
  economyDominanceExclusion: SemanticRuntimeExclusion | undefined,
  dependencies: SemanticRuntimeChoiceBuilderDependencies,
  creditDemands: readonly CreditDemand[],
): SemanticRuntimeChoice {
  const scopeId = semanticRuntimeScopeForAction(
    input,
    action,
    actionSemanticCandidate,
    dependencies.scope,
  );
  const exclusion =
    dependencies.actionExclusion(input, action, actionSemanticCandidate) ??
    economyDominanceExclusion;
  const scoreBreakdown = dependencies.scoreBreakdown(
    input,
    action,
    scopeId,
    exclusion,
    actionSemanticCandidate,
    creditDemands,
  );
  const score = semanticRuntimeScoreFromComponents(scoreBreakdown);
  const reasonCode =
    input.side === "corp" &&
    scoreBreakdown.some(
      (component) =>
        component.key === "corp_tagged_meat_damage_payoff_pressure",
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
    scoreBreakdown,
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
      ...semanticRuntimeScoreComponentEvidence(scoreBreakdown),
      ...dependencies.evidence(input, action, scopeId, actionSemanticCandidate),
    ],
    confidence: semanticRuntimeConfidence(scopeId, score),
  };
}

function buildEconomyDominanceExclusions(
  candidates: readonly ActionSemanticCandidate[],
): Map<string, SemanticRuntimeExclusion> {
  const strongestDominance = new Map<
    string,
    ReturnType<typeof compareEconomyActionDominance>
  >();
  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < candidates.length;
      rightIndex += 1
    ) {
      const dominance = compareEconomyActionDominance(
        candidates[leftIndex]!,
        candidates[rightIndex]!,
      );
      if (!dominance) continue;
      const previous = strongestDominance.get(dominance.dominatedActionId);
      if (!previous || previous.creditAdvantage < dominance.creditAdvantage) {
        strongestDominance.set(dominance.dominatedActionId, dominance);
      }
    }
  }
  return new Map(
    [...strongestDominance].map(([actionId, dominance]) => [
      actionId,
      {
        key: "economy_action_dominated",
        label: "Vergleichbare Credit-Aktion dominiert",
        reason: dominance
          ? dominance.evidence.join("|")
          : "economy_dominance_unavailable",
      },
    ]),
  );
}

function semanticRuntimeChoiceCreditCostEvidence(params: {
  action: LegalAction;
  actionSemanticCandidate: ActionSemanticCandidate | undefined;
  dependencies: Pick<
    SemanticRuntimeChoiceBuilderDependencies,
    "actionCreditCost"
  >;
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

function semanticRuntimeScoreComponentEvidence(
  scoreBreakdown: NonNullable<AiDecisionDebug["scoreBreakdown"]>,
): string[] {
  return scoreBreakdown
    .filter((component) =>
      SEMANTIC_RUNTIME_CHOICE_SCORE_COMPONENT_EVIDENCE_KEYS.has(component.key),
    )
    .map((component) => `semantic_score_component:${component.key}`);
}

const SEMANTIC_RUNTIME_CHOICE_SCORE_COMPONENT_EVIDENCE_KEYS = new Set([
  "corp_board_triage_alignment",
  "corp_board_triage_mismatch",
  "runner_bank_cashout_gate",
  "runner_bank_investment_commitment",
  "runner_no_run_economy_setup_hold",
  "runner_damage_locked_hand_reaction_reserve",
  "runner_activated_agenda_score",
  "runner_terminal_remote_tool",
]);
