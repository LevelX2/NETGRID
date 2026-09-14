import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpUnconditionalScoreCreditGain } from "../../runtime/corp-canonical-card-facts";

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
