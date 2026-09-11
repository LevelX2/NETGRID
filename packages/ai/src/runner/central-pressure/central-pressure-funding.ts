import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { type RunnerCorePlanDomain } from "../../plans/runner-core-plan-contracts";
import { type RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";
import { runnerExactFundingRouteContract } from "../../runtime/runner-exact-funding-routes";
export function buildRunnerCentralPressureFunding({
  input,
  candidates,
  accessPayoffCampaignSignals,
  currentCredits,
  remainingClicks,
}: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  accessPayoffCampaignSignals: RunnerPlanDomain["centralPressure"];
  currentCredits: number;
  remainingClicks: number;
}): {
  accessPayoffFundingNeeds: RunnerCorePlanDomain["fundingNeeds"];
  effectiveAccessPayoffCampaignSignals: RunnerPlanDomain["centralPressure"];
} {
  const accessPayoffFundingNeeds: RunnerCorePlanDomain["fundingNeeds"] =
    accessPayoffCampaignSignals.flatMap((signal) => {
      const campaign = signal.accessPayoffCampaign;
      if (!campaign || !signal.supportNeedId || campaign.fundingGap <= 0) {
        return [];
      }
      const parentPlanInstanceId = planInstanceIdForProposal({
        moduleId: "runner.pressure_central",
        dedupeKey: signal.pressureId,
      });
      const fundingRoute = runnerExactFundingRouteContract(input, candidates, {
        demandId: signal.supportNeedId,
        sourcePlanId: parentPlanInstanceId,
        purpose: "foreground_plan",
        priority: "next_own_turn",
        hardness: "soft",
        deadline: "within_three_own_turns",
        targetCredits: campaign.fundingTargetCredits,
        remainingClicks,
        allowIncrementalProgress: true,
        allowStrategicExchange: false,
        evidence: campaign.evidenceCodes,
      });
      if (
        campaign.reserveFundingOptional &&
        fundingRoute.routeActionIds.length === 0
      ) {
        return [];
      }
      return [
        {
          kind: "parent_plan_support" as const,
          needId: signal.supportNeedId,
          parentPlanInstanceId,
          driver: {
            kind: "run" as const,
            targetId: signal.serverId,
            reasonCode: "fund_bound_access_payoff_install",
          },
          targetCredits: campaign.fundingTargetCredits,
          currentCreditsAtRevalidation: currentCredits,
          gap: campaign.fundingGap,
          priorityClass: "P4" as const,
          revalidation: {
            stateVersion: input.playerView.stateVersion,
            status: "material_parent_open" as const,
          },
          ...fundingRoute,
          evidenceCode: `runner_access_payoff_campaign_funding:${signal.serverId}`,
        },
      ];
    });
  const materialAccessPayoffSupportNeedIds = new Set(
    accessPayoffFundingNeeds.map((need) => need.needId),
  );
  const effectiveAccessPayoffCampaignSignals = accessPayoffCampaignSignals.map(
    (signal) => {
      if (
        !signal.accessPayoffCampaign?.reserveFundingOptional ||
        signal.supportNeedId === undefined ||
        materialAccessPayoffSupportNeedIds.has(signal.supportNeedId)
      ) {
        return signal;
      }
      const { supportNeedId: _unusedSupportNeedId, ...withoutSupport } = signal;
      return {
        ...withoutSupport,
        reachable: (signal.preparationActionIds?.length ?? 0) > 0,
      };
    },
  );
  return { accessPayoffFundingNeeds, effectiveAccessPayoffCampaignSignals };
}
