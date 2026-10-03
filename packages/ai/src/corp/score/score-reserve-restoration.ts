import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpUnconditionalScoreCreditGain } from "../../runtime/corp-canonical-card-facts";
import { corpFundedCentralProtectionReserve } from "../defense/corp-server-protection-reserve";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

/** Score admits a complete route against Defense's current funded claim.
 * Apply after reconciliation so a direct sibling cannot erase the rejection.
 */
export function withCorpSameTurnScoreDefenseReserve(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
): CorpScoreProjectSignal {
  if (
    !project.feasible ||
    !project.sameTurnCloseout ||
    project.sameTurnConversionProof !== "engine_quoted_path" ||
    project.terminalScore
  )
    return project;
  const reserve = corpFundedCentralProtectionReserve(
    input,
    project.agendaInstanceId,
    project.preventsTerminalSteal ? project.agendaPoints : undefined,
  );
  if (reserve === 0) return project;
  const horizon = project.sameTurnConversionCreditHorizon;
  const cost = project.sameTurnConversionResourceCost;
  const creditsBeforePayout = horizon
    ? horizon.creditsBeforeScorePayout
    : cost
      ? input.playerView.own.credits - cost.credits
      : undefined;
  if (
    creditsBeforePayout === undefined ||
    !Number.isSafeInteger(creditsBeforePayout) ||
    creditsBeforePayout < 0 ||
    (horizon ? horizon.stateVersion : cost?.stateVersion) !==
      input.playerView.stateVersion
  )
    throw new PlanResolutionFailure("resource_claim_conflict", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: project.actionIds ?? [],
      owner: "plan_module",
      removalCondition:
        "Bind every funded same-turn score admission to its complete current Engine-quoted liquid credit horizon.",
    });
  const payout =
    corpUnconditionalScoreCreditGain(project.agendaDefinitionId) ?? 0;
  if (creditsBeforePayout + payout >= reserve) return project;
  return {
    ...project,
    feasible: false,
    routeAssessment: "corp_same_turn_score_consumes_funded_defense_reserve",
    evidenceCode: `corp_same_turn_score_consumes_funded_defense_reserve:${creditsBeforePayout}:${payout}:${reserve}`,
  };
}

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

/** A funded fixed-cost score can restore liquid defense cash before any run
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
