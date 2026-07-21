import type { AiDecisionScoreComponent } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { scoreEconomyAction } from "../economy/economy-action-score";
import type { CreditDemand } from "../plans/credit-demand";

const ECONOMY_COMPONENT_LABELS = {
  credit_base: "Credit-Grundwert",
  credit_demand: "Credit-Bedarf",
  net_hand_delta: "Netto-Handdelta",
} as const;

export function economyRuntimeScoreComponents(
  candidate: ActionSemanticCandidate | undefined,
  demands: readonly CreditDemand[] = [],
): AiDecisionScoreComponent[] {
  if (!candidate?.economyProjection) return [];
  const score = scoreEconomyAction(candidate, demands);
  if (score.mode === "non_economy") return [];
  return score.components.map((component) => ({
    key: `economy_${component.key}`,
    label: ECONOMY_COMPONENT_LABELS[component.key],
    value: component.value,
    reason: [
      `economy_action:${score.actionId}`,
      `economy_mode:${score.mode}`,
      `economy_net_liquid_gain:${score.netLiquidCreditGain}`,
      ...component.evidence,
    ].join("|"),
  }));
}

export function economyProjectionAccountsForCreditCost(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  const projection = candidate?.economyProjection;
  return (
    projection?.timing === "immediate" &&
    projection.netLiquidCreditGain !== undefined
  );
}
