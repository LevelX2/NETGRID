import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { corpConditionalScoreCreditProfile } from "../corp-canonical-card-facts";
import { visibleSourceCardForAction } from "./semantic-runtime-corp-score-action-economy";

const CONDITIONAL_SCORE_ECONOMY_VALUE_PER_CREDIT = 60;

export function corpConditionalScoreEconomyComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "score_agenda") return undefined;
  const source = visibleSourceCardForAction(input, action);
  if (!source?.definitionId) return undefined;
  const profile = corpConditionalScoreCreditProfile(source.definitionId);
  if (!profile) return undefined;
  const { threshold, gainAmount } = profile;
  const credits = input.playerView.own.credits;
  const thresholdMet = credits >= threshold;
  const economyDelta = thresholdMet ? gainAmount : -credits;
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
