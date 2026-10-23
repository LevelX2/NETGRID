import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpRezHostedCreditPayoutProfile } from "../../runtime/corp-canonical-card-facts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type {
  CorpEconomyParentFundingSignal,
  CorpEconomyDevelopmentSignal,
  CorpFreeRezPayoutPreparation,
} from "./economy-types";

/** Only replace an admitted Basic Credit head with a free setup and a strictly better current payout. */
export function corpFreeRezPayoutPreparation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  signal: CorpEconomyParentFundingSignal,
  basicFundingActionId: string,
  campaigns: readonly CorpEconomyDevelopmentSignal[],
): CorpFreeRezPayoutPreparation | undefined {
  const basic = candidates.find((c) => c.actionId === basicFundingActionId);
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    input.playerView.own.clicks < 1 ||
    signal.gap <= 0 ||
    !signal.immediateDefenseConversion ||
    !signal.incrementalDefenseReserve ||
    signal.parentPlanInstanceId !==
      "plan:corp.defend_servers:server-defense-portfolio" ||
    !signal.parentNeedId ||
    basic?.actionType !== "gain_credit" ||
    basic.sourceKind !== "basic_action" ||
    basic.costProfile.clickCost !== 1 ||
    basic.economyProjection?.netLiquidCreditGain !== 1
  )
    return undefined;
  const preparations = candidates.flatMap((candidate) => {
    if (
      candidate.semanticActionType !== "corp_window.rez" ||
      !candidate.sourceCardInstanceId ||
      !candidate.sourceDefinitionId ||
      candidate.costProfile.creditCost !== 0 ||
      candidate.costProfile.clickCost !== 0
    )
      return [];
    const legal = input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    if (
      !legal ||
      legal.type !== "rez_card" ||
      legal.expiresAtStateVersion !== input.playerView.stateVersion ||
      !legal.costs.every((cost) =>
        Object.entries(cost).every(
          ([key, value]) =>
            (key === "credits" || key === "clicks") && value === 0,
        ),
      )
    )
      return [];
    const server = input.playerView.servers.find(
      (s) =>
        s.id !== "archives" &&
        s.root.some(
          (c) =>
            c.instanceId === candidate.sourceCardInstanceId &&
            c.definitionId === candidate.sourceDefinitionId &&
            c.known &&
            !c.rezzed,
        ),
    );
    const profile = corpRezHostedCreditPayoutProfile(
      candidate.sourceDefinitionId,
    );
    const campaign = campaigns.find(
      (c) =>
        c.phase === "rez" &&
        c.cadence.kind === "finite_pool" &&
        c.sourceInstanceId === candidate.sourceCardInstanceId &&
        c.sourceDefinitionId === candidate.sourceDefinitionId &&
        c.actionIds.includes(candidate.actionId) &&
        c.payback.setupCreditCost === 0,
    );
    if (!server || !profile || profile.payoutCredits <= 1 || !campaign)
      return [];
    if (!campaign.riskAdjustment)
      throw new PlanResolutionFailure("missing_plan_module_coverage", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((a) => a.type),
        unresolvedActionIds: [candidate.actionId],
        owner: "plan_module",
        removalCondition:
          "Bind the admitted free finite-pool campaign to its current payout-execution and risk quote before using it for Defense funding.",
      });
    if (campaign.riskAdjustment.projectedPayoutExecutions < 1) return [];
    return [
      {
        actionId: candidate.actionId,
        basicFundingActionId,
        campaignNeedId: campaign.needId,
        stateVersion: input.playerView.stateVersion,
        parentPlanInstanceId: signal.parentPlanInstanceId!,
        parentNeedId: signal.parentNeedId!,
        sourceInstanceId: candidate.sourceCardInstanceId,
        sourceDefinitionId: candidate.sourceDefinitionId,
        sourceServerId: server.id,
        poolCreditsOnRez: profile.poolCredits,
        payoutCredits: profile.payoutCredits,
        payoutClicks: 1 as const,
      },
    ];
  });
  return preparations.sort(
    (a, b) =>
      b.payoutCredits - a.payoutCredits || a.actionId.localeCompare(b.actionId),
  )[0];
}
