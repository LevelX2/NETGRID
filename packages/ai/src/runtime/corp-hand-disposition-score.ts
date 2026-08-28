import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import type { DiscardChoiceKeepScore } from "./discard-choice-selection";
import {
  corpHandDuplicateCount,
  corpHandPressureAssessment,
} from "./corp-hand-inventory-facts";

export type CorpHandDispositionDestination =
  | "archives"
  | "rd_bottom"
  | "rd_shuffle";

export type CorpHandDispositionScore = DiscardChoiceKeepScore & {
  readonly destination: CorpHandDispositionDestination;
  readonly destinationAdjustment: number;
  readonly evidence: readonly string[];
};

/**
 * Adjusts the common strategic keep value for the exact destination selected
 * by the owning Corp hand plan. The result remains a keep score: the lowest
 * total is the best card to move out of HQ.
 */
export function corpHandDispositionScore(params: {
  input: AiDecisionInput;
  card: VisibleCard;
  destination: CorpHandDispositionDestination;
  baseKeepScore: DiscardChoiceKeepScore & {
    readonly evidence?: readonly string[];
  };
}): CorpHandDispositionScore {
  const { input, card, destination, baseKeepScore } = params;
  if (input.side !== "corp" || destination === "archives") {
    return {
      ...baseKeepScore,
      destination,
      destinationAdjustment: 0,
      evidence: [
        ...(baseKeepScore.evidence ?? []),
        `corp_hand_destination:${destination}`,
      ],
    };
  }
  const definition = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
  const type = card.type ?? definition?.type;
  if (type !== "agenda") {
    return {
      ...baseKeepScore,
      destination,
      destinationAdjustment: 0,
      evidence: [
        ...(baseKeepScore.evidence ?? []),
        `corp_hand_destination:${destination}`,
      ],
    };
  }

  const pressure = corpHandPressureAssessment(input);
  const agendaCount = pressure.agendaCount;
  const duplicateCount = card.definitionId
    ? corpHandDuplicateCount(input, card.definitionId)
    : 1;
  const agendaPoints = card.agendaPoints ?? definition?.agendaPoints ?? 0;
  const advancementRequirement = definition?.advancementRequirement;
  const matchpoint =
    agendaPoints > 0 &&
    input.playerView.own.agendaPoints + agendaPoints >=
      input.playerView.agendaPointsToWin;
  const currentPlanProtected =
    baseKeepScore.planDisposition === "current_plan_route" ||
    baseKeepScore.planDisposition === "support_for_need" ||
    baseKeepScore.planDisposition === "campaign_hold";
  const hqProtection = centralProtectionValue(input, "hq");
  const rdProtection = centralProtectionValue(input, "rd");
  const hqExposureRelief = Math.max(0, rdProtection - hqProtection) * 70;
  const rdExposurePenalty = Math.max(0, hqProtection - rdProtection) * 70;
  const floodRelief =
    agendaCount >= 3
      ? 480 + (agendaCount - 3) * 120
      : agendaCount === 2
        ? 180
        : 0;
  const duplicateRelief = Math.max(0, duplicateCount - 1) * 220;
  const scoreEfficiencyProtection =
    typeof advancementRequirement === "number" && agendaPoints > 0
      ? Math.max(0, agendaPoints * 55 - advancementRequirement * 18)
      : 0;
  const destinationRiskPenalty =
    destination === "rd_shuffle"
      ? rdExposurePenalty + 80
      : Math.floor(rdExposurePenalty / 3);
  const destinationAdjustment =
    -floodRelief -
    duplicateRelief -
    hqExposureRelief +
    destinationRiskPenalty +
    scoreEfficiencyProtection +
    (matchpoint ? 900 : 0) +
    (currentPlanProtected ? 700 : 0);

  return {
    ...baseKeepScore,
    total: baseKeepScore.total + destinationAdjustment,
    destination,
    destinationAdjustment,
    evidence: [
      ...(baseKeepScore.evidence ?? []),
      `corp_hand_destination:${destination}`,
      `corp_hand_destination_agenda_count:${agendaCount}`,
      `corp_hand_destination_duplicate_count:${duplicateCount}`,
      `corp_hand_destination_hq_protection:${hqProtection}`,
      `corp_hand_destination_rd_protection:${rdProtection}`,
      ...(floodRelief > 0 ? ["corp_hand_destination_agenda_flood_relief"] : []),
      ...(duplicateRelief > 0
        ? ["corp_hand_destination_duplicate_agenda_relief"]
        : []),
      ...(hqExposureRelief > 0
        ? ["corp_hand_destination_hq_exposure_relief"]
        : []),
      ...(destinationRiskPenalty > 0
        ? ["corp_hand_destination_rd_exposure_risk"]
        : []),
      ...(matchpoint ? ["corp_hand_destination_matchpoint_protected"] : []),
      ...(currentPlanProtected
        ? ["corp_hand_destination_current_plan_protected"]
        : []),
    ],
  };
}

function centralProtectionValue(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return 0;
  return server.ice.reduce(
    (value, ice) => value + (ice.rezzed === true ? 2 : 1),
    0,
  );
}
