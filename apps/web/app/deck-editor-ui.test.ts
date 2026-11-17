import { describe, expect, it } from "vitest";
import { deckAgendaStatusForEditor } from "./deck-editor-ui";

const agenda = (points: number) => ({
  type: "agenda",
  numeric: { agendaPoints: points },
});

const ice = {
  type: "ice",
  numeric: { agendaPoints: null },
};

describe("deck editor agenda status", () => {
  it("keeps the minimum-card agenda floor while a corp deck is still below minimum size", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: 9129, quantity: 3 },
          { cardId: 9136, quantity: 2 },
        ],
      },
      {
        9129: agenda(1),
        9136: ice,
      },
    );

    expect(status).toMatchObject({
      agendaPoints: 3,
      minimumAgendaPoints: 7,
      missingAgendaPoints: 4,
      totalCards: 5,
      effectiveCardsForMinimum: 18,
      detailsComplete: true,
    });
  });

  it("raises the displayed agenda minimum as a corp deck grows above the minimum deck size", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: 9135, quantity: 4 },
          { cardId: 9136, quantity: 19 },
        ],
      },
      {
        9135: agenda(2),
        9136: ice,
      },
    );

    expect(status).toMatchObject({
      agendaPoints: 8,
      minimumAgendaPoints: 8,
      missingAgendaPoints: 0,
      totalCards: 23,
      effectiveCardsForMinimum: 23,
      detailsComplete: true,
    });
  });

  it("waits for agenda card details before reporting agenda points", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: 9135, quantity: 2 },
          { cardId: 9136, quantity: 16 },
        ],
      },
      {},
      new Map([
        [9135, { type: "agenda" }],
        [9136, { type: "ice" }],
      ]),
    );

    expect(status).toMatchObject({
      agendaPoints: null,
      minimumAgendaPoints: 7,
      missingAgendaPoints: null,
      detailsComplete: false,
    });
  });

  it("does not wait for non-agenda details when catalog card types are already known", () => {
    const status = deckAgendaStatusForEditor(
      {
        side: "corp",
        formatProfileId: "netgrid_private_local_v1",
        cards: [
          { cardId: 9135, quantity: 4 },
          { cardId: 9136, quantity: 14 },
        ],
      },
      {
        9135: agenda(2),
      },
      new Map([
        [9135, { type: "agenda" }],
        [9136, { type: "ice" }],
      ]),
    );

    expect(status).toMatchObject({
      agendaPoints: 8,
      minimumAgendaPoints: 7,
      missingAgendaPoints: 0,
      detailsComplete: true,
    });
  });

  it("does not show an agenda status for runner decks", () => {
    expect(
      deckAgendaStatusForEditor(
        {
          side: "runner",
          formatProfileId: "netgrid_private_local_v1",
          cards: [{ cardId: 9137, quantity: 1 }],
        },
        { 9137: agenda(1) },
      ),
    ).toBeNull();
  });
});
