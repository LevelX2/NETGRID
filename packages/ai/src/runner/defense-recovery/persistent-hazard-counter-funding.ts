import type { AiDecisionInput } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import type { AiHintStructuredEffect } from "../../hint-ontology";
import { isRemovableRunnerHazardCounterType } from "../../actions/runner-hazard-counter-semantics";

/** Own public counters identify the need; canonical Engine-derived metadata
 * quotes its cost even when the removal LegalAction is not affordable yet. */
export function runnerPersistentHazardCounterFundingQuotes(
  input: AiDecisionInput,
  hints: Iterable<{ effects?: readonly AiHintStructuredEffect[] }> = AI_HINTS_BY_CARD.values(),
): { counterType: string; observedAmount: number; credits: number }[] {
  const counters = new Map<string, number>();
  for (const display of input.playerView.own.identity.counterDisplays ?? []) {
    if (typeof display.counterType !== "string" ||
      !isRemovableRunnerHazardCounterType(display.counterType)) continue;
    if (!Number.isSafeInteger(display.amount) || display.amount < 0)
      throw counterFundingError("invalid_observed_amount", display.counterType);
    if (display.amount === 0) continue;
    if (counters.has(display.counterType))
      throw counterFundingError("duplicate_observed_counter", display.counterType);
    counters.set(display.counterType, display.amount);
  }
  if (counters.size === 0) return [];
  const effects = [...hints].flatMap(hint => hint.effects ?? []);
  return [...counters].map(([counterType, observedAmount]) => {
    const quotes = effects.flatMap(effect =>
      effect.counterRemoval?.counterType === counterType ? [effect.counterRemoval] : []);
    if (quotes.length === 0) throw counterFundingError("missing_canonical_removal_quote", counterType);
    const credits = quotes[0]!.credits;
    if (quotes.some(quote => !Number.isSafeInteger(quote.credits) || quote.credits < 0 ||
      quote.credits !== credits || quote.clicks !== 1 || quote.amount !== 1))
      throw counterFundingError("conflicting_canonical_removal_quote", counterType);
    return { counterType, observedAmount, credits };
  });
}

function counterFundingError(code: string, counterType: string): Error {
  return Object.assign(new Error(`runner_persistent_hazard_counter_funding:${code}:${counterType}`), {
    code, counterType, owner: "runner.defense_and_recovery",
  });
}
