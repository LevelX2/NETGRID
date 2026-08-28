import { describe, expect, it } from "vitest";

import { assessCorpDrawAdmission } from "./corp-draw-admission";

describe("Corp draw admission turn-coherence red contract", () => {
  it("blocks a non-urgent last-click draw that guarantees cleanup overflow", () => {
    expect(
      assessCorpDrawAdmission({
        routeId: "red-last-click-overflow",
        ownerModuleId: "corp.hand_and_agenda_management",
        actionId: "corp.draw_card",
        purpose: "score_material_search",
        priorityClass: "P4",
        remainingAttempts: 1,
        handSize: 5,
        maximumHandSize: 5,
        currentClicks: 1,
        drawProjection: {
          cardsDrawn: 1,
          netDeckConsumption: 1,
          netHandDelta: 1,
          clickCost: 1,
        },
        capacityReleaseRoutes: [],
        parentProvidesExactSameTurnCapacityRelease: false,
        consequenceFacts: {
          knownAgendaCount: 4,
          safeDiscardCandidateCount: 0,
          remainingDeckCardsBeforeDraw: 20,
          terminalNeedBeforeMandatoryDraw: false,
        },
      }),
    ).toMatchObject({
      disposition: "blocked_cleanup_exposure",
      projectedHandAfterDraw: 6,
      projectedEndTurnOverflow: 1,
    });
  });
});
