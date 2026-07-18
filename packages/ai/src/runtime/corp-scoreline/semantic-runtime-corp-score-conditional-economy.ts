import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { createAiHintsByCard, type AiCardHint } from "../../ai-hints";
import { visibleSourceCardForAction } from "./semantic-runtime-corp-score-action-economy";

const AI_HINTS_BY_CARD = createAiHintsByCard();
const CONDITIONAL_SCORE_ECONOMY_VALUE_PER_CREDIT = 60;

type ConditionalScoreEconomyHint = AiCardHint & {
  tacticSignals?: string[];
};

export function corpConditionalScoreEconomyComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "score_agenda") return undefined;
  const source = visibleSourceCardForAction(input, action);
  if (!source?.definitionId) return undefined;
  const hint = AI_HINTS_BY_CARD.get(source.definitionId) as
    | ConditionalScoreEconomyHint
    | undefined;
  if (
    !hint?.tacticSignals?.includes("risk.requires_corp_credit_threshold") ||
    !hint.tacticSignals.includes("risk.economy_crash_on_score")
  ) {
    return undefined;
  }
  const thresholdEffect = hint.effects?.find(
    (effect) =>
      effect.kind === "economy" &&
      effect.timing === "when_scored" &&
      effect.scope === "corp" &&
      effect.resource === "credits" &&
      typeof effect.amount === "number" &&
      effect.amount > 0,
  );
  const threshold = thresholdEffect?.amount;
  if (threshold === undefined) return undefined;
  const credits = input.playerView.own.credits;
  const thresholdMet = credits >= threshold;
  const economyDelta = thresholdMet ? threshold : -credits;
  return {
    key: "corp_conditional_score_economy",
    label: "Bedingte Score-Ökonomie",
    value: economyDelta * CONDITIONAL_SCORE_ECONOMY_VALUE_PER_CREDIT,
    reason: [
      `credit_threshold:${threshold}`,
      `credits_before_score:${credits}`,
      `threshold_met:${thresholdMet}`,
      `expected_credit_delta:${economyDelta}`,
      `value_per_credit:${CONDITIONAL_SCORE_ECONOMY_VALUE_PER_CREDIT}`,
    ].join("|"),
  };
}
