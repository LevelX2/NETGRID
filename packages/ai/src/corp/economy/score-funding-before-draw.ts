import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import type { CorpScoreProtectionDrawSignal } from "../../plans/corp-defense-contracts";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import type {
  CorpEconomyFundingRouteAssessment,
  CorpEconomyNeedSignal,
} from "./economy-types";

export function compareCorpScoreProtectionDrawWithCurrentPool({
  input,
  project,
  draw,
  route,
  economyOffers,
}: {
  input: AiDecisionInput;
  project: CorpScoreProjectSignal;
  draw: CorpScoreProtectionDrawSignal;
  route: CorpEconomyFundingRouteAssessment;
  economyOffers: readonly CorpEconomyNeedSignal[];
}): CorpEconomyFundingRouteAssessment["scoreProtectionDrawDeferral"] {
  const milestone = project.fundingMilestone;
  const protection = project.protectionNeed;
  const stateVersion = input.playerView.stateVersion;
  const action = input.legalActions.find(
    (item) => item.actionId === route.headActionId,
  );
  if (
    milestone?.deadline !== "multi_turn" ||
    !protection ||
    protection.needId !== draw.parentNeedId ||
    protection.targetServerId !== draw.serverId ||
    protection.observedAtStateVersion !== stateVersion ||
    protection.baseline.knowledge !== "known" ||
    route.status !== "covered_guaranteed" ||
    route.reliability !== "guaranteed" ||
    !actionMatchesCurrentDecision(input, action)
  ) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (entry) =>
      entry.id === draw.serverId &&
      entry.root.some(
        (card) => card.known && card.instanceId === action.source,
      ),
  );
  if (!server) return undefined;

  const preparation = route.freeRezPayoutPreparation;
  const rezCampaign =
    preparation &&
    economyOffers.find(
      (offer) =>
        offer.kind === "develop_campaign" &&
        offer.needId === preparation.campaignNeedId,
    );
  const withdrawal = economyOffers.find(
    (offer) =>
      offer.kind === "convert_visible_card_payout" &&
      offer.actionIds.includes(action.actionId),
  );
  const availableClicks =
    input.playerView.own.clicks - protection.scoreReserve.hardClickReserve;
  const fromFreeRez =
    action.type === "rez_card" &&
    preparation?.setupClicks === 0 &&
    preparation.sourceInstanceId === action.source &&
    preparation.sourceServerId === server.id &&
    preparation.stateVersion === stateVersion &&
    rezCampaign?.kind === "develop_campaign"
      ? {
          amount: preparation.payoutCredits,
          pool: preparation.poolCreditsOnRez,
          executions: preparation.currentPayoutExecutions,
          horizon: rezCampaign.riskAdjustment?.riskAdjustedHorizonTurns,
        }
      : undefined;
  const fromLegalPayout =
    withdrawal?.kind === "convert_visible_card_payout" &&
    withdrawal.sourceInstanceId === action.source &&
    withdrawal.sourceZone === "installed_root" &&
    withdrawal.conversion.clickCost === 1 &&
    withdrawal.conversion.creditCost === 0 &&
    withdrawal.conversion.hostedCreditTakeMode ===
      "up_to_amount_if_available" &&
    withdrawal.withdrawalCampaign
      ? {
          amount: withdrawal.conversion.netLiquidCreditGain,
          pool: withdrawal.withdrawalCampaign.remainingPoolCredits,
          executions: withdrawal.withdrawalCampaign.projectedPayoutExecutions,
          horizon: withdrawal.withdrawalCampaign.horizonTurns,
        }
      : undefined;
  const payout = fromFreeRez ?? fromLegalPayout;
  if (!payout || payout.amount <= 1 || availableClicks < 1) return undefined;

  const creditsWithClicks = (clicks: number) =>
    Math.min(payout.pool, payout.amount * Math.min(payout.executions, clicks));
  const beforeDraw = creditsWithClicks(availableClicks);
  const afterDraw = creditsWithClicks(availableClicks - 1);
  const bank = input.playerView.own.credits;
  const financesThreshold = [
    protection.baseline.minimumSatisfyingRezCost,
    milestone.targetCredits,
  ].some(
    (target) =>
      target !== undefined &&
      bank + afterDraw < target &&
      bank + beforeDraw >= target,
  );
  // A one-turn payback quote caps the comparison at income available now.
  if (beforeDraw <= afterDraw || (!financesThreshold && payout.horizon !== 1))
    return undefined;

  return {
    defenseId: draw.defenseId,
    stateVersion,
    projectedCurrentCredits: beforeDraw,
  };
}
