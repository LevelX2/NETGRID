import { describe, expect, it } from "vitest";
import { deckAgendaStatusForEditor } from "./deck-editor-ui";

const agenda = (points: number) => ({
  type: "agenda",
  numeric: { agendaPoints: points }
});

const ice = {
  type: "ice",
  numeric: { agendaPoints: null }
};

describe("deck editor agenda status", () => {
  it("keeps the minimum-card agenda floor while a corp deck is still below minimum size", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: "hostile_takeover", quantity: 3 },
          { cardId: "ice_wall", quantity: 2 }
        ]
      },
      {
        hostile_takeover: agenda(1),
        ice_wall: ice
      }
    );

    expect(status).toMatchObject({
      agendaPoints: 3,
      minimumAgendaPoints: 7,
      missingAgendaPoints: 4,
      totalCards: 5,
      effectiveCardsForMinimum: 18,
      detailsComplete: true
    });
  });

  it("raises the displayed agenda minimum as a corp deck grows above the minimum deck size", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: "two_point_agenda", quantity: 4 },
          { cardId: "ice_wall", quantity: 19 }
        ]
      },
      {
        two_point_agenda: agenda(2),
        ice_wall: ice
      }
    );

    expect(status).toMatchObject({
      agendaPoints: 8,
      minimumAgendaPoints: 8,
      missingAgendaPoints: 0,
      totalCards: 23,
      effectiveCardsForMinimum: 23,
      detailsComplete: true
    });
  });

  it("waits for agenda card details before reporting agenda points", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: "two_point_agenda", quantity: 2 },
          { cardId: "ice_wall", quantity: 16 }
        ]
      },
      {},
      new Map([
        ["two_point_agenda", { type: "agenda" }],
        ["ice_wall", { type: "ice" }]
      ])
    );

    expect(status).toMatchObject({
      agendaPoints: null,
      minimumAgendaPoints: 7,
      missingAgendaPoints: null,
      detailsComplete: false
    });
  });

  it("does not wait for non-agenda details when catalog card types are already known", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: "two_point_agenda", quantity: 4 },
          { cardId: "ice_wall", quantity: 14 }
        ]
      },
      {
        two_point_agenda: agenda(2)
      },
      new Map([
        ["two_point_agenda", { type: "agenda" }],
        ["ice_wall", { type: "ice" }]
      ])
    );

    expect(status).toMatchObject({
      agendaPoints: 8,
      minimumAgendaPoints: 7,
      missingAgendaPoints: 0,
      detailsComplete: true
    });
  });

  it("does not show an agenda status for runner decks", () => {
    expect(
      deckAgendaStatusForEditor(
        {
          side: "runner",
          formatProfileId: "netgrid_private_local_v1",
          cards: [{ cardId: "agenda_like_runner_card", quantity: 1 }]
        },
        { agenda_like_runner_card: agenda(1) }
      )
    ).toBeNull();
  });
});
