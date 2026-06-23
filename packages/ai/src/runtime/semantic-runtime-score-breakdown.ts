import type {
  AiDecisionDebug,
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { buildSemanticDecisionDebugScoreComponent } from "../diagnostics/decision-debug";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import { semanticRuntimeTypeTieBreakerScore } from "./semantic-runtime-score-components";

export type SemanticRuntimeScoreBreakdownDependencies = {
  contextComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
  ) => AiDecisionScoreComponent[];
  actionCreditCost: (action: LegalAction) => number;
};

export function buildSemanticRuntimeScoreBreakdown(params: {
  input: AiDecisionInput;
  action: LegalAction;
  scopeId: string;
  exclusion?: SemanticRuntimeExclusion;
  dependencies: SemanticRuntimeScoreBreakdownDependencies;
}): NonNullable<AiDecisionDebug["scoreBreakdown"]> {
  const typeTieBreaker = semanticRuntimeTypeTieBreakerScore(
    params.action.type,
  );
  const contextComponents = params.dependencies.contextComponents(
    params.input,
    params.action,
    params.scopeId,
  );
  const privateBonus =
    params.action.visibility === "private_to_actor" ? 25 : 0;
  const creditCost = params.dependencies.actionCreditCost(params.action);
  const costPenalty = -(creditCost * 35);
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
