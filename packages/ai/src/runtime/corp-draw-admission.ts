export const CORP_DRAW_ADMISSION_SCHEMA_VERSION =
  "corp-draw-admission-v1" as const;

export type CorpDrawAdmissionPriority = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";

export type CorpDrawAdmissionPurpose =
  | "score_defense_answer_search"
  | "central_defense_answer_search"
  | "score_material_search";

export type CorpDrawCapacityReleaseRoute = {
  actionId: string;
  priorityClass: CorpDrawAdmissionPriority;
  clickCost: number;
  netHandDelta: number;
  withinClassValue: number;
};

export type CorpDrawAdmissionAssessment = {
  schemaVersion: typeof CORP_DRAW_ADMISSION_SCHEMA_VERSION;
  routeId: string;
  ownerModuleId: "corp.defend_servers" | "corp.hand_and_agenda_management";
  actionId: string;
  purpose: CorpDrawAdmissionPurpose;
  priorityClass: CorpDrawAdmissionPriority;
  remainingAttempts: 0 | 1;
  cardsDrawn: number;
  netHandDelta: number;
  clickCost: number;
  projectedHandAfterDraw: number;
  projectedEndTurnOverflow: number;
  exactCapacityReleaseActionIds: string[];
  boundedCapacityReleaseValue: number;
  disposition:
    | "admitted"
    | "defer_for_capacity_release"
    | "blocked_attempt_budget"
    | "blocked_unknown_projection"
    | "blocked_end_turn_overflow";
  evidence: string[];
};

export function assessCorpDrawAdmission(params: {
  routeId: string;
  ownerModuleId: CorpDrawAdmissionAssessment["ownerModuleId"];
  actionId: string;
  purpose: CorpDrawAdmissionPurpose;
  priorityClass: CorpDrawAdmissionPriority;
  remainingAttempts: 0 | 1;
  handSize: number;
  maximumHandSize: number;
  currentClicks: number;
  drawProjection:
    | {
        cardsDrawn: number;
        netHandDelta: number;
        clickCost: number;
      }
    | undefined;
  capacityReleaseRoutes: readonly CorpDrawCapacityReleaseRoute[];
  parentProvidesExactSameTurnCapacityRelease: boolean;
}): CorpDrawAdmissionAssessment {
  const projection = params.drawProjection;
  const validProjection =
    projection !== undefined &&
    positiveSafeInteger(projection.cardsDrawn) &&
    nonNegativeSafeInteger(projection.netHandDelta) &&
    positiveSafeInteger(projection.clickCost) &&
    nonNegativeSafeInteger(params.handSize) &&
    nonNegativeSafeInteger(params.maximumHandSize) &&
    nonNegativeSafeInteger(params.currentClicks);
  const cardsDrawn = validProjection ? projection.cardsDrawn : 0;
  const netHandDelta = validProjection ? projection.netHandDelta : 0;
  const clickCost = validProjection ? projection.clickCost : 0;
  const projectedHandAfterDraw = validProjection
    ? params.handSize + netHandDelta
    : params.handSize;
  const projectedEndTurnOverflow = validProjection
    ? Math.max(0, projectedHandAfterDraw - params.maximumHandSize)
    : 0;
  const existingEndTurnOverflow = validProjection
    ? Math.max(0, params.handSize - params.maximumHandSize)
    : 0;
  const additionalEndTurnOverflow = Math.max(
    0,
    projectedEndTurnOverflow - existingEndTurnOverflow,
  );
  const exactCapacityReleaseRoutes = validProjection
    ? params.capacityReleaseRoutes
        .filter(
          (route) =>
            capacityReleaseCanSequenceBeforeDraw({
              drawPriorityClass: params.priorityClass,
              drawPurpose: params.purpose,
              drawClickCost: clickCost,
              currentClicks: params.currentClicks,
              projectedEndTurnOverflow,
              parentProvidesExactSameTurnCapacityRelease:
                params.parentProvidesExactSameTurnCapacityRelease,
              route,
            }) &&
            positiveSafeInteger(route.clickCost) &&
            Number.isSafeInteger(route.netHandDelta) &&
            route.netHandDelta < 0 &&
            route.actionId !== params.actionId &&
            params.handSize + route.netHandDelta + netHandDelta <=
              params.maximumHandSize,
        )
        .sort(
          (left, right) =>
            left.netHandDelta - right.netHandDelta ||
            right.withinClassValue - left.withinClassValue ||
            left.actionId.localeCompare(right.actionId),
        )
    : [];
  const boundedCapacityReleaseValue = Math.min(
    120,
    exactCapacityReleaseRoutes.reduce(
      (value, route) =>
        value +
        Math.min(60, Math.max(1, -route.netHandDelta) * 20) +
        Math.min(40, Math.max(0, route.withinClassValue)),
      0,
    ),
  );
  let disposition: CorpDrawAdmissionAssessment["disposition"];
  if (params.remainingAttempts !== 1) {
    disposition = "blocked_attempt_budget";
  } else if (!validProjection) {
    disposition = "blocked_unknown_projection";
  } else if (
    projectedEndTurnOverflow > 0 &&
    exactCapacityReleaseRoutes.length > 0
  ) {
    disposition = "defer_for_capacity_release";
  } else if (
    params.parentProvidesExactSameTurnCapacityRelease &&
    clickCost + 1 <= params.currentClicks
  ) {
    disposition = "admitted";
  } else if (projectedEndTurnOverflow > 0) {
    disposition =
      exactCapacityReleaseRoutes.length > 0
        ? "defer_for_capacity_release"
        : params.purpose === "central_defense_answer_search" &&
            existingEndTurnOverflow <= 1 &&
            additionalEndTurnOverflow === 1
          ? "admitted"
        : params.purpose === "score_material_search" &&
              existingEndTurnOverflow === 0 &&
              additionalEndTurnOverflow === 1 &&
              netHandDelta === 1 &&
              clickCost <= params.currentClicks
            ? "admitted"
            : "blocked_end_turn_overflow";
  } else if (
    netHandDelta > 0 &&
    projectedHandAfterDraw >= params.maximumHandSize &&
    exactCapacityReleaseRoutes.length > 0
  ) {
    disposition = "defer_for_capacity_release";
  } else {
    disposition = "admitted";
  }
  return {
    schemaVersion: CORP_DRAW_ADMISSION_SCHEMA_VERSION,
    routeId: params.routeId,
    ownerModuleId: params.ownerModuleId,
    actionId: params.actionId,
    purpose: params.purpose,
    priorityClass: params.priorityClass,
    remainingAttempts: params.remainingAttempts,
    cardsDrawn,
    netHandDelta,
    clickCost,
    projectedHandAfterDraw,
    projectedEndTurnOverflow,
    exactCapacityReleaseActionIds: exactCapacityReleaseRoutes.map(
      (route) => route.actionId,
    ),
    boundedCapacityReleaseValue,
    disposition,
    evidence: [
      `corp_draw_parent_purpose:${params.purpose}`,
      `corp_draw_priority_class:${params.priorityClass}`,
      `corp_draw_attempts_remaining:${params.remainingAttempts}`,
      `corp_draw_projection_known:${validProjection}`,
      `corp_draw_cards_drawn:${cardsDrawn}`,
      `corp_draw_net_hand_delta:${netHandDelta}`,
      `corp_draw_projected_hand:${projectedHandAfterDraw}`,
      `corp_draw_existing_end_turn_overflow:${existingEndTurnOverflow}`,
      `corp_draw_projected_end_turn_overflow:${projectedEndTurnOverflow}`,
      `corp_draw_additional_end_turn_overflow:${additionalEndTurnOverflow}`,
      `corp_draw_capacity_release_actions:${
        exactCapacityReleaseRoutes.map((route) => route.actionId).join(",") ||
        "none"
      }`,
      `corp_draw_capacity_release_value:${boundedCapacityReleaseValue}`,
      `corp_draw_admission:${disposition}`,
    ],
  };
}

function capacityReleaseCanSequenceBeforeDraw(params: {
  drawPriorityClass: CorpDrawAdmissionPriority;
  drawPurpose: CorpDrawAdmissionPurpose;
  drawClickCost: number;
  currentClicks: number;
  projectedEndTurnOverflow: number;
  parentProvidesExactSameTurnCapacityRelease: boolean;
  route: CorpDrawCapacityReleaseRoute;
}): boolean {
  const {
    drawPriorityClass,
    drawPurpose,
    drawClickCost,
    currentClicks,
    projectedEndTurnOverflow,
    parentProvidesExactSameTurnCapacityRelease,
    route,
  } = params;
  if (route.priorityClass === drawPriorityClass) {
    return route.clickCost + drawClickCost <= currentClicks;
  }
  return (
    drawPriorityClass === "P3" &&
    route.priorityClass === "P4" &&
    route.withinClassValue > 0 &&
    projectedEndTurnOverflow > 0 &&
    drawPurpose === "score_defense_answer_search" &&
    parentProvidesExactSameTurnCapacityRelease &&
    route.clickCost + drawClickCost + 1 <= currentClicks
  );
}

function positiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
