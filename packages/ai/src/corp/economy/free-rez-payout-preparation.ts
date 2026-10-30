import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpRezHostedCreditPayoutProfile } from "../../runtime/corp-canonical-card-facts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { corpImmediateEconomyGainFromHint } from "../../runtime/corp-canonical-card-facts";
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
  const clicks = input.playerView.own.clicks;
  const scoreFunding =
    signal.parentPlanInstanceId?.startsWith("plan:corp.score_agenda:") ===
      true &&
    signal.parentNeedId === signal.needId &&
    signal.delegatedPriorityClass === "P4" &&
    signal.scoreFundingMilestone?.deadline === "multi_turn" &&
    signal.scoreFundingMilestone.observedCredits ===
      input.playerView.own.credits &&
    signal.scoreFundingMilestone.remainingGap === signal.gap &&
    signal.scoreFundingMilestone.targetCredits ===
      input.playerView.own.credits + signal.gap &&
    signal.gap >= clicks;
  const defenseFunding =
    signal.immediateDefenseConversion &&
    signal.incrementalDefenseReserve &&
    signal.parentPlanInstanceId ===
      "plan:corp.defend_servers:server-defense-portfolio";
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    input.playerView.own.clicks < 1 ||
    signal.gap <= 0 ||
    (!scoreFunding && !defenseFunding) ||
    !signal.parentNeedId ||
    basic?.actionType !== "gain_credit" ||
    basic.sourceKind !== "basic_action" ||
    basic.costProfile.clickCost !== 1 ||
    basic.economyProjection?.netLiquidCreditGain !== 1
  )
    return undefined;
  const preparations = candidates.flatMap((candidate) => {
    const install = candidate.actionType === "install_card";
    const setupClicks = install ? (1 as const) : (0 as const);
    if (
      (install
        ? !scoreFunding ||
          clicks < 2 ||
          candidate.semanticActionType !== "install.card" ||
          hasUncomparedCurrentFunding(input, candidates)
        : candidate.semanticActionType !== "corp_window.rez") ||
      !candidate.sourceCardInstanceId ||
      !candidate.sourceDefinitionId ||
      candidate.costProfile.creditCost !== 0 ||
      candidate.costProfile.clickCost !== setupClicks
    )
      return [];
    const legal = input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    if (
      !legal ||
      legal.type !== (install ? "install_card" : "rez_card") ||
      (install && legal.payload?.serverId !== "new_remote") ||
      legal.expiresAtStateVersion !== input.playerView.stateVersion ||
      !legal.costs.every((cost) =>
        Object.entries(cost).every(
          ([key, value]) =>
            (key === "credits" && value === 0) ||
            (key === "clicks" && value === setupClicks),
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
      install,
    );
    const campaign = campaigns.find(
      (c) =>
        c.phase === (install ? "install" : "rez") &&
        c.cadence.kind === "finite_pool" &&
        c.sourceInstanceId === candidate.sourceCardInstanceId &&
        c.sourceDefinitionId === candidate.sourceDefinitionId &&
        c.actionIds.includes(candidate.actionId) &&
        c.payback.setupCreditCost === 0,
    );
    if (
      (!install && !server) ||
      !profile ||
      profile.payoutCredits <= 1 ||
      !campaign
    )
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
          "Bind the admitted free finite-pool campaign to its current payout-execution and risk quote before using it for parent funding.",
      });
    const currentPayoutExecutions = scoreFunding ? clicks - setupClicks : 1;
    const projectedCurrentCredits = Math.min(
      profile.poolCredits,
      currentPayoutExecutions * profile.payoutCredits,
    );
    if (
      campaign.riskAdjustment.projectedPayoutExecutions <
        currentPayoutExecutions ||
      projectedCurrentCredits <= (scoreFunding ? clicks : 1)
    )
      return [];
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
        sourceServerId: install ? "new_remote" : server!.id,
        poolCreditsOnRez: profile.poolCredits,
        payoutCredits: profile.payoutCredits,
        payoutClicks: 1 as const,
        setupClicks,
        currentPayoutExecutions,
        projectedCurrentCredits,
      },
    ];
  });
  return preparations.sort(
    (a, b) =>
      b.payoutCredits - a.payoutCredits || a.actionId.localeCompare(b.actionId),
  )[0];
}

/** Setup is not certified while another known current-turn income route
 * remains uncompared. In particular preserve Basic -> Basic -> burst paths
 * whose operation is not legal yet at the current credit balance.
 */
function hasUncomparedCurrentFunding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): boolean {
  if (
    candidates.some(
      (c) =>
        c.actionType !== "gain_credit" &&
        c.economyProjection?.kind === "immediate_liquid" &&
        (c.economyProjection.netLiquidCreditGain === undefined ||
          c.economyProjection.netLiquidCreditGain > 0),
    )
  )
    return true;
  return input.playerView.own.gripOrHq.some((card) => {
    if (!card.known || !card.definitionId) return false;
    const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    return (
      definition?.type === "operation" &&
      Number.isSafeInteger(definition.cost) &&
      definition.cost! <=
        input.playerView.own.credits + input.playerView.own.clicks - 1 &&
      hint?.quality?.hintReviewed === true &&
      hint.planRoles?.includes("recover_economy") === true &&
      (corpImmediateEconomyGainFromHint(hint) ?? 0) > 1
    );
  });
}
