import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { corpFundedDefenseContinuationWindow } from "../defense/corp-funded-continuation-window";
import { corpHostedBankCycleDevelopment } from "./hosted-credit-bank-cycle";
import { corpExactCurrentBasicLiquidCreditCandidate } from "./economy-domain-signals";
import type {
  CorpEconomyDevelopmentSignal,
  CorpEconomyNeedSignal,
  CorpEconomyVisibleCardWithdrawalSignal,
  EconomyState,
} from "./economy-types";

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
  bankChoices: ReadonlyMap<
    string,
    { shouldCashout: boolean; development?: CorpEconomyDevelopmentSignal }
  >;
}) {
  if (
    params.input.playerView.own.stackOrRdCount <= 1 ||
    params.requiredNeeds.some(
      (n) => (n.kind === "parent_funding" || n.kind === "reserve") && n.gap > 0,
    ) ||
    params.scoreProjects.some((p) => p.feasible) ||
    params.defenseNeeds.length > 0 ||
    params.remoteProjects.some(
      (p) => p.need?.capability === "credits" && p.need.minimum > 0,
    ) ||
    params.ambushes.some((p) => p.actionIds.length > 0) ||
    params.punishCampaigns.some((p) => p.feasible)
  )
    return [];
  return corpHostedBankCycleDevelopment(params.input, params.candidates).filter(
    (signal) => {
      const q = signal.hostedCreditBankCycle!;
      const bankChoice = params.bankChoices.get(q.sourceCardInstanceId);
      if (
        q.headKind !== "load" ||
        !bankChoice ||
        (bankChoice.development?.hostedCreditBankInvestment !== undefined &&
          q.currentCredits + q.netLiquidCreditGain <
            bankChoice.development.hostedCreditBankInvestment.targetCredits) ||
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
      let alternativeCredits: number;
      if (q.currentHostedCredits > 0) {
        const cash = params.candidates.find(
          (c) =>
            c.sourceCardInstanceId === q.sourceCardInstanceId &&
            c.abilityId === q.cashoutAbilityId,
        );
        if (
          cash?.economyProjection?.kind !== "immediate_liquid" ||
          cash.economyProjection.reliability !== "guaranteed" ||
          cash.economyProjection.netLiquidCreditGain !==
            q.currentHostedCredits ||
          cash.costProfile.clickCost !== 1 ||
          cash.costProfile.creditCost !== 0
        )
          return false;
        alternativeCredits = q.currentHostedCredits;
      } else {
        const basic = params.candidates.find((c) =>
          corpExactCurrentBasicLiquidCreditCandidate(params.input, c),
        );
        if (
          basic?.economyProjection?.kind !== "immediate_liquid" ||
          basic.economyProjection.reliability !== "guaranteed" ||
          basic.economyProjection.netLiquidCreditGain !== 1
        )
          return false;
        alternativeCredits = 1;
      }
      const window = corpFundedDefenseContinuationWindow({
        input: params.input,
        candidates: params.candidates,
        centralAllocation: params.centralAllocation,
        remoteProjects: params.remoteProjects,
        scoreProjects: params.scoreProjects,
        available: {
          credits: q.currentCredits + alternativeCredits,
          clicks: q.currentClicks - 1,
        },
      });
      return window.actionIds.length === 0 && window.unknown.length === 0;
    },
  );
}

/** Admit the current native payoff of the immediately preceding quoted load.
 * This continues only that source's last rest-turn step, even if its liquidity
 * target was already funded. Current higher-priority plans still arbitrate it.
 */
export function corpHostedBankRestTurnPayoutContinuation(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  previous: ResidentPlanPortfolio | undefined;
  signal: CorpEconomyVisibleCardWithdrawalSignal;
}): boolean {
  const { input, previous, signal } = params;
  const last = previous?.instances.find(
    (p) => p.instanceId === previous.executorInstanceId,
  );
  if (
    !last ||
    last.moduleId !== "corp.economy" ||
    last.parentInstanceId ||
    previous!.stateVersion + 1 !== input.playerView.stateVersion ||
    input.side !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    input.playerView.run ||
    input.playerView.own.clicks !== 1
  )
    return false;
  const state = last.moduleState as EconomyState;
  const q =
    state.kind === "economy" && state.signal.kind === "develop_campaign"
      ? state.signal.hostedCreditBankCycle
      : undefined;
  if (
    !q ||
    q.headKind !== "load" ||
    q.stateVersion !== previous!.stateVersion ||
    q.currentClicks !== 2 ||
    q.currentCredits !== input.playerView.own.credits ||
    q.sourceCardInstanceId !== signal.sourceInstanceId ||
    q.sourceDefinitionId !== signal.sourceDefinitionId ||
    q.cashoutCredits !== q.currentHostedCredits + q.loadCredits
  )
    return false;
  const bank = input.playerView.servers
    .find((s) => s.id === q.sourceServerId)
    ?.root.find((c) => c.instanceId === q.sourceCardInstanceId);
  const candidate = params.candidates.find(
    (c) => c.actionId === signal.actionIds[0],
  );
  const action = input.legalActions.find(
    (a) => a.actionId === candidate?.actionId,
  );
  return (
    bank?.known === true &&
    bank.rezzed === true &&
    bank.owner === "corp" &&
    bank.controller === "corp" &&
    bank.definitionId === q.sourceDefinitionId &&
    bank.counters?.bit === q.cashoutCredits &&
    action?.side === "corp" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    candidate?.sourceCardInstanceId === q.sourceCardInstanceId &&
    candidate.abilityId === q.cashoutAbilityId &&
    candidate.economyProjection?.kind === "immediate_liquid" &&
    candidate.economyProjection.reliability === "guaranteed" &&
    candidate.economyProjection.netLiquidCreditGain === q.cashoutCredits &&
    candidate.costProfile.clickCost === 1 &&
    candidate.costProfile.creditCost === 0 &&
    signal.conversion.payoutMode === "all_available" &&
    signal.conversion.netLiquidCreditGain === q.cashoutCredits
  );
}
