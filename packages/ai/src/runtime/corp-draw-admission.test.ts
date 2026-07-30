import { describe, expect, it } from "vitest";

import { assessCorpDrawAdmission } from "./corp-draw-admission";

describe("Corp draw admission", () => {
  it("defers a same-class draw that would fill HQ until an exact conversion releases capacity", () => {
    expect(
      assessment({
        handSize: 4,
        maximumHandSize: 5,
        currentClicks: 2,
        capacityReleaseRoutes: [
          {
            actionId: "convert-accounts",
            priorityClass: "P4",
            clickCost: 1,
            netHandDelta: -1,
            withinClassValue: 80,
          },
        ],
      }),
    ).toMatchObject({
      disposition: "defer_for_capacity_release",
      projectedHandAfterDraw: 5,
      projectedEndTurnOverflow: 0,
      exactCapacityReleaseActionIds: ["convert-accounts"],
      boundedCapacityReleaseValue: 60,
    });
  });

  it("admits the revalidated draw after the conversion has released HQ capacity", () => {
    expect(
      assessment({
        handSize: 3,
        maximumHandSize: 5,
        currentClicks: 1,
        capacityReleaseRoutes: [],
      }),
    ).toMatchObject({
      disposition: "admitted",
      projectedHandAfterDraw: 4,
      exactCapacityReleaseActionIds: [],
    });
  });

  it("does not let a lower-class conversion displace a concrete higher-class search", () => {
    expect(
      assessment({
        priorityClass: "P3",
        handSize: 4,
        maximumHandSize: 5,
        currentClicks: 2,
        capacityReleaseRoutes: [
          {
            actionId: "lower-class-conversion",
            priorityClass: "P5",
            clickCost: 1,
            netHandDelta: -1,
            withinClassValue: 100,
          },
        ],
      }),
    ).toMatchObject({
      disposition: "admitted",
      exactCapacityReleaseActionIds: [],
    });
  });

  it("preserves an exact same-turn score-defense replacement draw", () => {
    expect(
      assessment({
        purpose: "score_defense_answer_search",
        handSize: 5,
        maximumHandSize: 5,
        currentClicks: 2,
        parentProvidesExactSameTurnCapacityRelease: true,
      }),
    ).toMatchObject({
      disposition: "admitted",
      projectedEndTurnOverflow: 1,
    });
  });

  it("converts exact economy before a full-HQ P3 draw when draw and install still fit", () => {
    expect(
      assessment({
        purpose: "score_defense_answer_search",
        priorityClass: "P3",
        handSize: 5,
        maximumHandSize: 5,
        currentClicks: 3,
        parentProvidesExactSameTurnCapacityRelease: true,
        capacityReleaseRoutes: [
          {
            actionId: "convert-exact-economy",
            priorityClass: "P4",
            clickCost: 1,
            netHandDelta: -1,
            withinClassValue: 80,
          },
        ],
      }),
    ).toMatchObject({
      disposition: "defer_for_capacity_release",
      projectedEndTurnOverflow: 1,
      exactCapacityReleaseActionIds: ["convert-exact-economy"],
    });
  });

  it("admits one final-click replacement draw but blocks larger cleanup overflow", () => {
    expect(
      assessment({
        handSize: 5,
        maximumHandSize: 5,
        currentClicks: 1,
      }),
    ).toMatchObject({ disposition: "admitted" });
    expect(
      assessment({
        handSize: 5,
        maximumHandSize: 5,
        currentClicks: 1,
        drawProjection: {
          cardsDrawn: 2,
          netHandDelta: 2,
          clickCost: 1,
        },
      }),
    ).toMatchObject({ disposition: "blocked_end_turn_overflow" });
  });

  it("admits one bounded score-material draw at full HQ when a follow-up action remains", () => {
    expect(
      assessment({
        handSize: 5,
        maximumHandSize: 5,
        currentClicks: 2,
      }),
    ).toMatchObject({
      disposition: "admitted",
      projectedHandAfterDraw: 6,
      projectedEndTurnOverflow: 1,
    });
  });

  it("admits one additional overflow card only for a bounded central-defense search", () => {
    expect(
      assessment({
        purpose: "central_defense_answer_search",
        handSize: 6,
        maximumHandSize: 5,
        currentClicks: 3,
      }),
    ).toMatchObject({
      disposition: "admitted",
      projectedHandAfterDraw: 7,
      projectedEndTurnOverflow: 2,
      evidence: expect.arrayContaining([
        "corp_draw_existing_end_turn_overflow:1",
        "corp_draw_additional_end_turn_overflow:1",
      ]),
    });

    expect(
      assessment({
        purpose: "score_material_search",
        handSize: 6,
        maximumHandSize: 5,
        currentClicks: 3,
      }),
    ).toMatchObject({ disposition: "blocked_end_turn_overflow" });
  });

  it("blocks unknown projections and consumed attempt budgets", () => {
    expect(
      assessment({
        drawProjection: undefined,
      }),
    ).toMatchObject({ disposition: "blocked_unknown_projection" });
    expect(
      assessment({
        remainingAttempts: 0,
      }),
    ).toMatchObject({ disposition: "blocked_attempt_budget" });
  });
});

function assessment(
  overrides: Partial<Parameters<typeof assessCorpDrawAdmission>[0]> = {},
) {
  return assessCorpDrawAdmission({
    routeId: "draw-route",
    ownerModuleId: "corp.hand_and_agenda_management",
    actionId: "draw",
    purpose: "score_material_search",
    priorityClass: "P4",
    remainingAttempts: 1,
    handSize: 4,
    maximumHandSize: 5,
    currentClicks: 2,
    drawProjection: {
      cardsDrawn: 1,
      netHandDelta: 1,
      clickCost: 1,
    },
    capacityReleaseRoutes: [],
    parentProvidesExactSameTurnCapacityRelease: false,
    ...overrides,
  });
}
