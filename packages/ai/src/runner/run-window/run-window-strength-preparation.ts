import type { AiDecisionInput } from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { currentEncounteredIceCard } from "../../runtime/current-encounter";
import { pumpStrengthAmountForAction } from "../../runtime/encounter-action";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import { runnerRunRemainderStrengthBoostAction } from "./run-window-action-facts";

/** Proven displacement of ordinary pumps in this encounter, not future cash. */
export function runnerRunStrengthCurrentPumpSavings(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): number | undefined {
  const action = runnerRunRemainderStrengthBoostAction(input, candidate);
  if (!action || !candidate.sourceDefinitionId) return undefined;
  const boost = cardSpecPlanningCardByDefinitionId(candidate.sourceDefinitionId)
    ?.planning.engine.runnerRunStrengthBoost;
  const breaker = input.playerView.own.rig?.find(
    (card) => card.known && card.instanceId === action.payload?.targetCardId,
  );
  const ice = currentEncounteredIceCard(input);
  if (
    !boost ||
    boost.amount <= 0 ||
    !breaker?.definitionId ||
    typeof breaker.strength !== "number" ||
    !ice?.effectiveRunQuote
  )
    return undefined;
  const gap = Math.max(
    0,
    ice.effectiveRunQuote.effectiveStrength - breaker.strength,
  );
  if (gap === 0) return undefined;
  const pumps = input.legalActions
    .filter(
      (entry) =>
        entry.type === "pump_breaker" && entry.source === breaker.instanceId,
    )
    .flatMap((pump) => {
      const gain = pumpStrengthAmountForAction(pump, breaker.definitionId!);
      if (!gain || gain <= 0) return [];
      const cost = legalActionCreditCost(pump);
      return [
        {
          gain,
          before: Math.ceil(gap / gain) * cost,
          after: Math.ceil(Math.max(0, gap - boost.amount) / gain) * cost,
        },
      ];
    });
  // Mixed pump sizes need a combined payment quote; individual repetitions
  // alone cannot prove the saving over the cheapest mixed sequence.
  if (pumps.length === 0 || new Set(pumps.map((pump) => pump.gain)).size > 1)
    return undefined;
  const saved =
    Math.min(...pumps.map((pump) => pump.before)) -
    Math.min(...pumps.map((pump) => pump.after)) -
    legalActionCreditCost(action);
  return saved > 0 ? saved : undefined;
}
