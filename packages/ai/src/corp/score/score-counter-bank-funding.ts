import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
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
    if (counterCost === undefined) return true;
    const source = action.source;
    if (
      typeof counterCost !== "number" ||
      !Number.isSafeInteger(counterCost) ||
      counterCost < 0 ||
      typeof source !== "string" ||
      source.trim().length === 0 ||
      action.payload?.cardId !== source ||
      action.side !== "corp" ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
      action.timingPoint !== input.playerView.timingPoint
    ) {
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((entry) => entry.type),
        unresolvedActionIds: [action.actionId],
        owner: "rules_contract",
        removalCondition:
          "Publish a nonnegative integer advancement-counter cost on the current LegalAction with its exact Corp source binding.",
      });
    }
    if (counterCost === 0) return true;
    if (
      investmentSources.has(source) &&
      !(parent.feasible && parent.sameTurnCloseout)
    )
      return false;
    const claims = projects.filter((project) => {
      const bank = project.counterBank;
      return (
        bank !== undefined &&
        bank.sourceCardInstanceId === source &&
        bank.quoteStateVersion === input.playerView.stateVersion &&
        bank.counterTarget > 0 &&
        project.phase !== "liquidate_counter_bank" &&
        project.phase !== "rez_counter_bank_for_liquidation"
      );
    });
    return claims.every((claim) => {
      // A proved, higher-priority current conversion can release an investment,
      // but cannot pay with counters that its own conversion also requires.
      return (
        parent.counterBank?.sourceCardInstanceId !== source &&
        parent.feasible &&
        parent.sameTurnCloseout &&
        corpScorePriorityClass(parent) < corpScorePriorityClass(claim)
      );
    });
  });
}
