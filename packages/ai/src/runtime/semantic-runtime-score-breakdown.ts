import type {
  AiDecisionDebug,
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { buildSemanticDecisionDebugScoreComponent } from "../diagnostics/decision-debug";
import { semanticRuntimeStrategicActionFitScoreComponents } from "./strategic-action-fit";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import { semanticRuntimeTypeTieBreakerScore } from "./semantic-runtime-score-components";
import { economyProjectionAccountsForCreditCost } from "./economy-score-components";
import type { CreditDemand } from "../plans/credit-demand";

export type SemanticRuntimeScoreBreakdownDependencies = {
  contextComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands?: readonly CreditDemand[],
  ) => AiDecisionScoreComponent[];
  actionCreditCost: (action: LegalAction) => number;
};

export type SemanticRuntimeScoreBreakdownContextDependencies = {
  runnerComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands?: readonly CreditDemand[],
  ) => AiDecisionScoreComponent[];
  corpComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands?: readonly CreditDemand[],
  ) => AiDecisionScoreComponent[];
  actionCreditCost: (action: LegalAction) => number;
};

export type SemanticRuntimeScoreBreakdownContext = {
  semanticRuntimeScoreBreakdown: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    exclusion?: SemanticRuntimeExclusion,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands?: readonly CreditDemand[],
  ) => NonNullable<AiDecisionDebug["scoreBreakdown"]>;
};

export function createSemanticRuntimeScoreBreakdownContext(
  dependencies: SemanticRuntimeScoreBreakdownContextDependencies,
): SemanticRuntimeScoreBreakdownContext {
  function semanticRuntimeScoreBreakdown(
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    exclusion?: SemanticRuntimeExclusion,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands: readonly CreditDemand[] = [],
  ): NonNullable<AiDecisionDebug["scoreBreakdown"]> {
    return buildSemanticRuntimeScoreBreakdown({
      input,
      action,
      scopeId,
      ...(exclusion ? { exclusion } : {}),
      ...(actionSemanticCandidate ? { actionSemanticCandidate } : {}),
      dependencies: {
        contextComponents: (
          componentInput,
          componentAction,
          componentScopeId,
          componentActionSemanticCandidate,
          componentCreditDemands,
        ) =>
          componentInput.side === "runner"
            ? dependencies.runnerComponents(
                componentInput,
                componentAction,
                componentScopeId,
                componentActionSemanticCandidate,
                componentCreditDemands,
              )
            : dependencies.corpComponents(
                componentInput,
                componentAction,
                componentScopeId,
                componentActionSemanticCandidate,
                componentCreditDemands,
              ),
        actionCreditCost: dependencies.actionCreditCost,
      },
      creditDemands,
    });
  }

  return { semanticRuntimeScoreBreakdown };
}

export function buildSemanticRuntimeScoreBreakdown(params: {
  input: AiDecisionInput;
  action: LegalAction;
  scopeId: string;
  exclusion?: SemanticRuntimeExclusion;
  actionSemanticCandidate?: ActionSemanticCandidate;
  creditDemands?: readonly CreditDemand[];
  dependencies: SemanticRuntimeScoreBreakdownDependencies;
}): NonNullable<AiDecisionDebug["scoreBreakdown"]> {
  const typeTieBreaker = semanticRuntimeTypeTieBreakerScore(params.action.type);
  const contextComponents = params.dependencies.contextComponents(
    params.input,
    params.action,
    params.scopeId,
    params.actionSemanticCandidate,
    params.creditDemands,
  );
  const privateBonus = params.action.visibility === "private_to_actor" ? 25 : 0;
  const creditCost = semanticRuntimeCreditCostForPenalty(params);
  const costPenalty = creditCost === 0 ? 0 : -(creditCost * 35);
  return [
    buildSemanticDecisionDebugScoreComponent({
      key: "semantic_type_tie_breaker",
      label: "Action-Typ-Tiebreaker",
      value: typeTieBreaker,
      reason: params.action.type,
    }),
    ...(params.exclusion
      ? [
          buildSemanticDecisionDebugScoreComponent({
            key: "semantic_action_excluded",
            label: `Ausgeschlossen: ${params.exclusion.label}`,
            value: 0,
            reason: params.exclusion.reason,
          }),
        ]
      : []),
    ...contextComponents,
    ...semanticRuntimeStrategicActionFitScoreComponents(
      params.input,
      params.action,
      params.scopeId,
      params.actionSemanticCandidate,
    ),
    ...(privateBonus !== 0
      ? [
          buildSemanticDecisionDebugScoreComponent({
            key: "semantic_private_actor_bonus",
            label: "Akteur-private Action",
            value: privateBonus,
            reason: "private_to_actor",
          }),
        ]
      : []),
    buildSemanticDecisionDebugScoreComponent({
      key: "semantic_credit_cost_penalty",
      label: "Credit-Kosten",
      value: costPenalty,
      reason: String(creditCost),
    }),
  ];
}

function semanticRuntimeCreditCostForPenalty(params: {
  action: LegalAction;
  actionSemanticCandidate?: ActionSemanticCandidate;
  dependencies: Pick<
    SemanticRuntimeScoreBreakdownDependencies,
    "actionCreditCost"
  >;
}): number {
  if (economyProjectionAccountsForCreditCost(params.actionSemanticCandidate)) {
    return 0;
  }
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
