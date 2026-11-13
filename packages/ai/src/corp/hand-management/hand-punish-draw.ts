import type { AiDecisionInput } from "@netgrid/shared";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import type { CorpPunishCampaignSignal } from "../punish/punish-types";
import type { CorpHandManagementSignal } from "./hand-management-types";

export function corpPunishHandDrawSignals(
  input: AiDecisionInput,
  campaigns: readonly CorpPunishCampaignSignal[],
): CorpHandManagementSignal[] {
  const own = input.playerView.own;
  return campaigns.flatMap((campaign) => {
    const need = campaign.developmentDrawNeed;
    if (!need || need.stateVersion !== input.playerView.stateVersion) return [];
    return [
      {
        handPlanId: `punish-component:${need.turnKey}`,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.punish_campaign",
          dedupeKey: campaign.campaignId,
        }),
        parentNeedId: need.needId,
        punishDrawNeed: need,
        phase: "draw_for_plan",
        actionIds: [need.actionId],
        exactActionRoute: true,
        agendaCount: own.gripOrHq.filter(
          (card) => card.known && card.type === "agenda",
        ).length,
        handSize: own.gripOrHq.length,
        maximumHandSize: own.maxHandSize,
        concretePurposeCode:
          "Draw once for a missing punish component and replan after observing the card.",
        priorityClass: "P5",
        drawAttemptState: {
          turnKey: need.turnKey,
          remainingAttempts: need.remainingAttempts,
        },
        uncertainty: {
          kind: "draw_then_observe",
          unknownOutcome: "drawn_card_identity",
          revalidateAfterCurrentHead: true,
        },
        value: campaign.value,
        evidenceCode: "corp_hand_draw_for_punish_component",
      },
    ];
  });
}
