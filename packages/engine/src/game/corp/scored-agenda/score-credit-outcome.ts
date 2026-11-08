import {
  CORP_SCORE_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type CorpScoreCreditOutcomeQuote,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../../card-implementations/registry";

export function scoreCreditSwingOutcome(
  creditsBefore: number,
  profile: { threshold: number; gainAmount: number },
) {
  if (
    ![creditsBefore, profile.threshold, profile.gainAmount].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    )
  ) {
    throw new Error("invalid_score_credit_swing_inputs");
  }
  const thresholdMet = creditsBefore >= profile.threshold;
  const creditsAfter = thresholdMet ? creditsBefore + profile.gainAmount : 0;
  if (!Number.isSafeInteger(creditsAfter))
    throw new Error("invalid_score_credit_swing_outcome");
  return {
    thresholdMet,
    creditsAfter,
    netCreditDelta: creditsAfter - creditsBefore,
  };
}

export function corpScoreCreditOutcomeQuotePayload(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
): NonNullable<LegalAction["payload"]> {
  const instance = state.cardInstances[sourceCardInstanceId];
  if (!instance) throw new Error("score_credit_outcome_source_missing");
  const implementation = cardImplementationForDefinitionId(
    instance.definitionId,
  );
  const profile = implementation?.scoredAgenda;
  const creditsBefore = state.corp.credits;
  const creditsAfter =
    profile?.kind === "score_credit_swing_if_corp_credit_threshold_met"
      ? scoreCreditSwingOutcome(creditsBefore, profile).creditsAfter
      : profile?.kind === "gain_credits_on_score" &&
          profile.recipient === "corp"
        ? creditsBefore + profile.amount
        : undefined;
  if (creditsAfter === undefined) return {};
  // The direct effect executes before on-score lifecycle effects. A compound
  // lifecycle must not silently turn this exact end balance into a partial one.
  if (
    (implementation?.lifecycle?.on_score ?? []).some(
      (effect) => effect.kind !== "add_bad_publicity",
    )
  ) {
    throw Object.assign(new Error("score_credit_outcome_compound_lifecycle"), {
      code: "score_credit_outcome_compound_lifecycle",
      sourceCardInstanceId,
      stateVersion: state.stateVersion,
      owner: "corp/scored-agenda/score-credit-outcome",
    });
  }
  if (
    !Number.isSafeInteger(creditsBefore) ||
    creditsBefore < 0 ||
    !Number.isSafeInteger(creditsAfter) ||
    creditsAfter < 0
  ) {
    throw new Error("invalid_score_credit_outcome");
  }
  const quote: CorpScoreCreditOutcomeQuote = {
    schemaVersion: CORP_SCORE_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION,
    sourceCardInstanceId,
    stateVersion: state.stateVersion,
    creditsBefore,
    creditsAfter,
    netCreditDelta: creditsAfter - creditsBefore,
  };
  return {
    corpScoreCreditOutcomeQuoteSchemaVersion: quote.schemaVersion,
    corpScoreCreditOutcomeQuoteSourceCardId: quote.sourceCardInstanceId,
    corpScoreCreditOutcomeQuoteStateVersion: quote.stateVersion,
    corpScoreCreditOutcomeQuoteCreditsBefore: quote.creditsBefore,
    corpScoreCreditOutcomeQuoteCreditsAfter: quote.creditsAfter,
    corpScoreCreditOutcomeQuoteNetCreditDelta: quote.netCreditDelta,
  };
}
