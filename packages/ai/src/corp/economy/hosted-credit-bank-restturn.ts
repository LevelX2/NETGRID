import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { corpFundedDefenseContinuationWindow } from "../defense/corp-funded-continuation-window";
import { corpHostedBankCycleDevelopment } from "./hosted-credit-bank-cycle";
import type { CorpEconomyNeedSignal } from "./economy-types";

/** Admit a quoted complete rest-turn bank alternative only for unused capacity.
 * Score/Defense/Remote keep their current conversion windows and funding children.
 * The existing Economy assessment and TurnPlanner compare admitted alternatives;
 * this discovery function neither picks an action nor changes a commitment.
 */
export function corpHostedBankRestTurnDevelopment(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  requiredNeeds: readonly CorpEconomyNeedSignal[];
  scoreProjects: CorpPlanDomain["scoreProjects"];
  defenseNeeds: CorpPlanDomain["defenseNeeds"];
  remoteProjects: CorpPlanDomain["remoteProjects"];
  ambushes: CorpPlanDomain["ambushes"];
  punishCampaigns: CorpPlanDomain["punishCampaigns"];
  centralAllocation: CorpPlanDomain["centralDefenseAllocation"];
  bankChoices: ReadonlyMap<string, { shouldCashout: boolean }>;
}) {
  if (
    params.input.playerView.own.stackOrRdCount <= 1 ||
    params.requiredNeeds.some(
      (n) => (n.kind === "parent_funding" || n.kind === "reserve") && n.gap > 0,
    ) ||
    params.scoreProjects.some((p) => p.feasible) ||
    params.defenseNeeds.length > 0 ||
    params.remoteProjects.some((p) => p.need && p.need.minimum > 0) ||
    params.ambushes.some((p) => p.actionIds.length > 0) ||
    params.punishCampaigns.some((p) => p.feasible)
  )
    return [];
  return corpHostedBankCycleDevelopment(params.input, params.candidates).filter(
    (signal) => {
      const q = signal.hostedCreditBankCycle!;
      if (
        q.headKind !== "load" ||
        q.currentHostedCredits <= 0 ||
        params.bankChoices.get(q.sourceCardInstanceId)?.shouldCashout !==
          true ||
        params.candidates.some(
          (c) =>
            c.economyProjection?.kind === "immediate_liquid" &&
            (c.economyProjection.netLiquidCreditGain ?? 0) > 0 &&
            c.actionType !== "gain_credit" &&
            !(
              c.sourceCardInstanceId === q.sourceCardInstanceId &&
              c.abilityId === q.cashoutAbilityId
            ),
        )
      )
        return false;
      const cash = params.candidates.find(
        (c) =>
          c.sourceCardInstanceId === q.sourceCardInstanceId &&
          c.abilityId === q.cashoutAbilityId,
      );
      if (
        cash?.economyProjection?.kind !== "immediate_liquid" ||
        cash.economyProjection.reliability !== "guaranteed" ||
        cash.economyProjection.netLiquidCreditGain !== q.currentHostedCredits ||
        cash.costProfile.clickCost !== 1 ||
        cash.costProfile.creditCost !== 0
      )
        return false;
      const window = corpFundedDefenseContinuationWindow({
        input: params.input,
        candidates: params.candidates,
        centralAllocation: params.centralAllocation,
        available: {
          credits: q.currentCredits + q.currentHostedCredits,
          clicks: q.currentClicks - 1,
        },
      });
      return window.actionIds.length === 0 && window.unknown.length === 0;
    },
  );
}
