import { describe, expect, it } from "vitest";
import { createRuntimeCardsById } from "@netgrid/catalog";
import profilesData from "../../../data/decks/deck-format-profiles-1.3.0.json";
import {
  validateEditableDeck,
  type DeckFormatProfile,
  type EditableDeck,
} from "./index";

const cardsById = createRuntimeCardsById();
const agenda = Object.values(cardsById).find(
  (card) =>
    card.side === "corp" && card.type === "agenda" && card.statuses.deck_legal,
)!;
const filler = Object.values(cardsById).find(
  (card) =>
    card.side === "corp" && card.type === "ice" && card.statuses.deck_legal,
)!;
const profile: DeckFormatProfile = {
  ...(profilesData.profiles[0] as DeckFormatProfile),
  copyLimit: { defaultLimit: 100 },
  minimumDeckCards: { corp: 18, runner: 12 },
};
delete profile.influence;
delete profile.identityRules;
const context = {
  profile,
  cardsById: {
    ...cardsById,
    range_agenda: {
      ...agenda,
      numeric: { ...agenda.numeric, agendaPoints: 1 },
    },
    range_filler: {
      ...filler,
      numeric: { ...filler.numeric, agendaPoints: null },
    },
  },
};
function deck(size: number, points: number): EditableDeck {
  return {
    deckId: "range-probe",
    deckVersion: "test",
    name: "Range probe",
    side: "corp",
    identityCardId: "corp_identity_001",
    cardPoolSnapshotId: profile.cardPoolSnapshotId,
    formatProfileId: profile.profileId,
    cards: [
      { cardId: "range_agenda", quantity: points },
      { cardId: "range_filler", quantity: size - points },
    ],
    createdAt: "2026-09-13T00:00:00Z",
    updatedAt: "2026-09-13T00:00:00Z",
  };
}

describe("official Corp agenda point range", () => {
  it.each([
    [40, 18, 19],
    [44, 18, 19],
    [45, 20, 21],
    [49, 20, 21],
    [50, 22, 23],
    [54, 22, 23],
    [55, 24, 25],
    [59, 24, 25],
    [60, 26, 27],
    [100, 42, 43],
  ])(
    "validates %s cards against %s–%s points through the common validator",
    (size, minimum, maximum) => {
      for (const points of [minimum, maximum])
        expect(
          validateEditableDeck(deck(size!, points!), context),
        ).toMatchObject({ ok: true, errors: [], agendaPoints: points });
      expect(
        validateEditableDeck(deck(size!, minimum! - 1), context).errorCodes,
      ).toEqual(["agenda_points_too_low"]);
      expect(
        validateEditableDeck(deck(size!, maximum! + 1), context).errorCodes,
      ).toEqual(["agenda_points_too_high"]);
    },
  );
  it("requires at least 40 cards even when an enabled profile has a lower static minimum", () => {
    expect(validateEditableDeck(deck(39, 18), context).errorCodes).toEqual([
      "minimum_deck_size",
    ]);
  });
  it("keeps a deliberately permissive fixture profile on its declared point minimum", () => {
    const fixtureContext = {
      ...context,
      profile: {
        ...profile,
        agenda: {
          policy: "points_minimum" as const,
          missingDataPolicy: "block" as const,
        },
      },
    };
    expect(validateEditableDeck(deck(45, 7), fixtureContext).ok).toBe(true);
    expect(validateEditableDeck(deck(45, 30), fixtureContext).ok).toBe(true);
    expect(
      validateEditableDeck(deck(45, 6), fixtureContext).errorCodes,
    ).toEqual(["minimum_agenda_points"]);
  });
  it("does not apply Corp size or point bounds to Runner decks", () => {
    const runner = {
      ...deck(20, 7),
      side: "runner" as const,
      identityCardId: "runner_identity_001",
      cards: [{ cardId: "runner_filler", quantity: 20 }],
    };
    const runnerContext = {
      ...context,
      cardsById: {
        ...context.cardsById,
        runner_filler: {
          ...filler,
          side: "runner" as const,
          type: "program" as const,
          numeric: { ...filler.numeric, agendaPoints: null },
        },
      },
    };
    expect(validateEditableDeck(runner, runnerContext)).toMatchObject({
      ok: true,
      errors: [],
      agendaPoints: null,
    });
  });
});
