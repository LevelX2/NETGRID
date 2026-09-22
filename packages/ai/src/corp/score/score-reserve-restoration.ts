import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpUnconditionalScoreCreditGain } from "../../runtime/corp-canonical-card-facts";

/** Installed agendas use their own Engine continuation quote, including every
 * remaining advance and the score itself, rather than next-turn credit needs.
 */
export function corpInstalledScoreResourceCost(
  input: AiDecisionInput,
  agenda: VisibleCard,
  serverId: string | undefined,
): CorpScoreProjectSignal["sameTurnConversionResourceCost"] {
  const quote = agenda.scoreContinuationQuote;
  if (
    !agenda.known ||
    agenda.type !== "agenda" ||
    quote?.context !== "installed_agenda" ||
    !quote.complete ||
    quote.agendaCardId !== agenda.instanceId ||
    quote.serverId !== serverId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    ![
      quote.remainingAdvancementCounters,
      quote.advancementCreditCostPerCounter,
      quote.advancementClickCostPerCounter,
      quote.scoreActionCreditCost,
      quote.scoreActionClickCost,
    ].every((n) => Number.isSafeInteger(n) && n >= 0)
  )
    return undefined;
  const credits =
    quote.remainingAdvancementCounters * quote.advancementCreditCostPerCounter +
    quote.scoreActionCreditCost;
  const clicks =
    quote.remainingAdvancementCounters * quote.advancementClickCostPerCounter +
    quote.scoreActionClickCost;
  if (!Number.isSafeInteger(credits) || !Number.isSafeInteger(clicks))
    return undefined;
  return { stateVersion: input.playerView.stateVersion, credits, clicks };
}

/** A funded ordinary score can restore liquid defense cash before any run
 * window. This is a horizon proof, never cash available to pay the route now.
 */
export function corpScoreRestoresRezReserveBeforeRunnerTurn(
  input: AiDecisionInput,
  projects: readonly CorpScoreProjectSignal[],
  targetCredits: number,
): boolean {
  if (
    input.playerView.run ||
    input.side !== "corp" ||
    input.playerView.activeSide !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    !Number.isSafeInteger(targetCredits) ||
    targetCredits <= input.playerView.own.credits
  )
    return false;
  return projects.some((project) => {
    const cost = project.sameTurnConversionResourceCost;
    const payout = corpUnconditionalScoreCreditGain(project.agendaDefinitionId);
    return (
      project.feasible &&
      project.sameTurnCloseout &&
      project.sameTurnConversionProof === "engine_quoted_path" &&
      (project.phase === "install_agenda" ||
        project.phase === "convert_agenda" ||
        project.phase === "advance_agenda" ||
        project.phase === "score_agenda") &&
      (project.fundingGap ?? 0) === 0 &&
      cost !== undefined &&
      cost.stateVersion === input.playerView.stateVersion &&
      Number.isSafeInteger(cost.credits) &&
      cost.credits >= 0 &&
      Number.isSafeInteger(cost.clicks) &&
      cost.clicks >= 0 &&
      cost.credits <= input.playerView.own.credits &&
      cost.clicks <= input.playerView.own.clicks &&
      payout !== undefined &&
      input.playerView.own.credits - cost.credits + payout >= targetCredits &&
      input.legalActions.some(
        (action) =>
          action.side === "corp" &&
          action.expiresAtStateVersion === input.playerView.stateVersion &&
          project.actionIds?.includes(action.actionId),
      )
    );
  });
}
