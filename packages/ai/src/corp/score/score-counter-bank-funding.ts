import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpScorePriorityClass } from "./corp-score-priority";
import { corpCounterBankInvestmentSourceIds } from "./corp-counter-bank-score-plan";

/** Score owns counter allocation; economy may consume only released resources. */
export function scoreFundingPreservesCounterBanks(
  input: AiDecisionInput,
  parent: CorpScoreProjectSignal,
  projects: readonly CorpScoreProjectSignal[],
  actionIds: readonly string[],
): string[] {
  const investmentSources = corpCounterBankInvestmentSourceIds(input);
  return actionIds.filter((actionId) => {
    const action = input.legalActions.find((a) => a.actionId === actionId);
    if (!action) return false;
    const counterCost =
      action.payload?.cardImplementationAdvancementCounterCost;
    if (typeof counterCost !== "number" || counterCost <= 0) return true;
    if (
      action.source !== undefined &&
      investmentSources.has(action.source) &&
      !(parent.feasible && parent.sameTurnCloseout)
    )
      return false;
    const claims = projects.filter(
      (project) =>
        project.counterBank?.sourceCardInstanceId === action.source &&
        project.counterBank.quoteStateVersion ===
          input.playerView.stateVersion &&
        project.counterBank.counterTarget > 0 &&
        project.phase !== "liquidate_counter_bank" &&
        project.phase !== "rez_counter_bank_for_liquidation",
    );
    return claims.every((claim) => {
      // A proved, higher-priority current conversion can release an investment,
      // but cannot pay with counters that its own conversion also requires.
      return (
        parent.counterBank?.sourceCardInstanceId !== action.source &&
        parent.feasible &&
        parent.sameTurnCloseout &&
        corpScorePriorityClass(parent) < corpScorePriorityClass(claim)
      );
    });
  });
}
