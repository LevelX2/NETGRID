import {
  CARD_DEFINITIONS_BY_ID,
  cardImplementationForDefinitionId,
  traceBaseLinkCardImplementationQuotesForDefinition,
  visibleRunnerNextTurnPreparationCreditGain,
  visibleRunnerPreparationIncomePerClick,
} from "@netgrid/engine";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";

type TerminalOffServerTraceBudget = {
  runnerCredits: number;
  runnerMaximumTraceStrength: number;
};

/**
 * Bound the visible Runner resources before a fixed off-server run.
 * Other trace support needs its own complete next-turn quote.
 */
export function terminalOffServerTraceBudget(
  view: AiDecisionInput["playerView"],
): TerminalOffServerTraceBudget | undefined {
  const { opponent, runnerNextTurnCreditClicks } = view;
  if (
    view.side !== "corp" ||
    view.traceRulesProfile !== "modern_open" ||
    view.phase !== "corp_action_phase" ||
    view.run !== undefined ||
    !opponent.rig ||
    !isFiniteNonNegativeInteger(runnerNextTurnCreditClicks) ||
    !isFiniteNonNegativeInteger(opponent.credits)
  )
    return undefined;

  const identity = simplePublicTraceCard(opponent.identity);
  if (!identity || identity.type !== "identity") return undefined;
  let installedLink = 0;
  for (const card of opponent.rig) {
    const definition = simplePublicTraceCard(card);
    if (!definition) return undefined;
    installedLink = Math.max(installedLink, definition.baseLink ?? 0);
  }
  const runnerCredits =
    opponent.credits +
    visibleRunnerNextTurnPreparationCreditGain(
      opponent.rig,
      runnerNextTurnCreditClicks,
      visibleRunnerPreparationIncomePerClick(opponent.rig),
    ) +
    (view.runnerNextRunBadPublicityCredits ?? 0);
  const runnerMaximumTraceStrength =
    runnerCredits + (identity.baseLink ?? 0) + installedLink;
  return isFiniteNonNegativeInteger(runnerMaximumTraceStrength)
    ? { runnerCredits, runnerMaximumTraceStrength }
    : undefined;
}

function simplePublicTraceCard(card: VisibleCard | undefined) {
  if (!card?.known || !card.definitionId || card.controller !== "runner")
    return undefined;
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  if (!definition) return undefined;
  const implementation = cardImplementationForDefinitionId(definition.id);
  if (
    definition.modifiers?.some((modifier) => modifier.kind === "base_link") ||
    traceBaseLinkCardImplementationQuotesForDefinition(definition.id).length ||
    implementation?.restrictedHostedCreditSource?.usableFor.includes(
      "increase_link",
    ) ||
    (card.counters?.recurring_credit ?? 0) > 0 ||
    implementation?.abilities?.some(
      (ability) =>
        ability.kind === "activated" &&
        (ability.timing === "trace_post_bid_link_window" ||
          ability.timing === "trace_success_cancel_window"),
    )
  )
    return undefined;
  return definition;
}
