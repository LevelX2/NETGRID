import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import { createGameAfterSetup, getPlayerView } from "@netgrid/engine";
import type { PublicGameEvent } from "@netgrid/shared";
import {
  apply,
  MECHANIC_SMOKE_DECKS,
  putCorpIceOnServer,
  toRunnerTurn,
} from "../../../../packages/engine/src/test-fixtures/mechanic-smoke-fixtures";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import {
  chronicleItemBelongsToSystemSetup,
  formatChronicleEffectItems,
  type ChronicleTranslate,
} from "../../app/chronicle";

const messages = { de, en, fr };
const definitionId = "onr_v1_247_haunting-inquisition";

function hauntingEncounterEvent(): PublicGameEvent {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed: "haunting-chronicle-run-lock",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        cards: [
          { id: definitionId, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 20;
  const iceId = putCorpIceOnServer(state, "rd", definitionId);
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(
    state,
    "corp",
    (action) => action.type === "rez_ice" && action.source === iceId,
  );
  state = apply(state, "runner", (action) => action.type === "continue_run");
  expect(state.run).toBeUndefined();
  expect(state.runnerTurnFlags?.runLockActionsPending).toBe(6);
  const eventId = state.eventLog.at(-1)!.eventId;
  const view = getPlayerView(state, "corp");
  const event = view.publicEvents.find((entry) => entry.eventId === eventId);
  if (!event)
    throw new Error("Missing public Haunting Inquisition encounter event");
  return event;
}

function items(event: PublicGameEvent, locale: keyof typeof messages) {
  const translate = createTranslator({
    locale,
    messages: messages[locale],
    namespace: "Chronicle",
  }) as unknown as ChronicleTranslate;
  return formatChronicleEffectItems(event, "corp", undefined, translate);
}

describe("run-lock subroutine chronicle", () => {
  it.each([
    [
      "de",
      "Haunting Inquisition: Subroutine 1 – der Runner kann während seiner nächsten 6 Aktionen keinen weiteren Run starten.",
    ],
    [
      "en",
      "Haunting Inquisition: Subroutine 1 – the Runner cannot start another run during their next 6 actions.",
    ],
    [
      "fr",
      "Haunting Inquisition : Sous-programme 1 – le Runner ne peut pas lancer un autre piratage pendant ses 6 prochaines actions.",
    ],
  ] as const)(
    "renders the real engine effect and separate end-run effect in %s",
    (locale, title) => {
      const result = items(hauntingEncounterEvent(), locale);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        title,
        category: "run",
        visibility: "public",
        cardDefinitionId: definitionId,
      });
      expect(result[1]?.title).toMatch(
        /(?:Subroutine|subroutine|sous-programme) 2/,
      );
      for (const item of result) {
        expect(chronicleItemBelongsToSystemSetup(item)).toBe(false);
        expect(item.category).toBe("run");
        expect(item.title).not.toMatch(
          /automatischer Effekt|automatic effect|effet automatique/,
        );
      }
      expect(result[0]?.groupLabel).toBe(result[1]?.groupLabel);
    },
  );

  it("uses the effect amount and diagnoses missing duration instead of assuming six actions", () => {
    const event = hauntingEncounterEvent();
    const effect = event.publicPayload.resolvedEffects![0]!;
    event.publicPayload.resolvedEffects = [{ ...effect, amount: 1 }];
    expect(items(event, "en")[0]?.title).toContain("during their next action.");
    const withoutAmount = { ...effect };
    delete withoutAmount.amount;
    event.publicPayload.resolvedEffects = [withoutAmount];
    expect(items(event, "en")[0]?.title).toContain(
      "missing the run lock duration",
    );
  });

  it("does not expose private effect details to the other side", () => {
    const event = hauntingEncounterEvent();
    const effect = event.publicPayload.resolvedEffects![0]!;
    event.publicPayload.resolvedEffects = [
      {
        ...effect,
        side: "runner",
        visibility: "private_to_side",
        sourceTitle: "Private source",
        sourceDefinitionId: "private_source",
      },
    ];
    const result = items(event, "en");
    expect(result[0]?.visibility).toBe("redacted");
    expect(JSON.stringify(result)).not.toMatch(
      /Private source|private_source|next 6 actions/,
    );
  });
});
