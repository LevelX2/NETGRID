import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import de from "../messages/de.json";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import corpus from "./__fixtures__/chronicle-localization-corpus.json";
import {
  formatChronicleEvent,
  formatChronicleEffectItems,
  type ChronicleContext,
  type ChronicleTranslate,
} from "./chronicle";
import type { PublicCardPresentationsById } from "./public-card-presentation";

const catalogs = corpus.catalogs as unknown as PublicCardPresentationsById[];
const locales = { de, en, fr };
type Locale = keyof typeof locales;

function render(
  id: number,
  locale: Locale,
  override?: Record<string, unknown>,
) {
  const row = corpus.cases.find((row) => row.id === id)!;
  const translate = createTranslator({
    locale,
    messages: locales[locale],
    namespace: "Chronicle",
    onError: (error) => {
      throw error;
    },
  }) as unknown as ChronicleTranslate;
  const event: PublicGameEvent = {
    eventId: `fixture-${id}`,
    type: row.payload.actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "fnv1a:fixture",
    publicPayload: {
      ...row.payload,
      ...override,
    } as PublicGameEvent["publicPayload"],
  };
  const before = structuredClone(event);
  const items =
    row.kind === "event"
      ? [
          formatChronicleEvent(
            event,
            row.side as Side,
            {
              ...row.context,
              cardPresentationsById: catalogs[row.catalog],
              translate,
            } as Omit<ChronicleContext, "side">,
          ),
        ]
      : formatChronicleEffectItems(
          event,
          row.side as Side,
          catalogs[row.catalog],
          translate,
        );
  expect(event).toEqual(before);
  return items;
}

describe.each(Object.keys(locales) as Locale[])(
  "chronicle detail corpus in %s",
  (locale) => {
    it.each(corpus.cases)("$id: $name ($kind)", ({ id }) => {
      const items = render(id, locale);
      for (const item of items) {
        if (locale !== "de")
          expect(
            [item.title, item.description, item.groupLabel, ...item.chips].join(
              " ",
            ),
          ).not.toMatch(
            /\b(?:Zug|übrig|gewürfelt|beiseitegelegt|bezahlt|verhindert|aufgelöst|getrasht|Stärke|Schaden|Auswahl|Aktionen)\b/,
          );
        expect(item.title).not.toMatch(/Chronicle\.|\[missing|undefined|NaN/);
        if (item.visibility === "redacted") {
          expect(item.cardDefinitionId).toBeUndefined();
          expect(item.cardTitle).toBeUndefined();
          expect(item.cardText).toBeUndefined();
          expect(item.cardDetailLines).toEqual([]);
        }
      }
    });

    it("retains the actual choice, rolls and remaining dice", () => {
      const item = render(144, locale)[0]!;
      expect(item.title).toContain("1");
      expect(item.title).toContain("2");
      expect(item.description).toContain("4,5");
      const partial = render(144, locale, {
        randomDiceLoopComplete: false,
        randomDiceLoopRemainingDice: 1,
      })[0]!;
      expect(partial.description).toContain("1");
      expect(partial.description).not.toBe(item.description);
    });

    it("distinguishes failed Blink, all-subroutine breaks and their run outcome", () => {
      const item = render(218, locale)[0]!;
      expect(item.title).toContain("Dropp");
      expect(item.title).toContain("Banpei");
      expect(item.title).toContain(
        ["Run beendet", "ended the run", "piratage terminé"][
          Object.keys(locales).indexOf(locale)
        ],
      );
      const failure = render(214, locale, {
        blinkBreakSuccess: false,
        blinkDieRoll: 2,
        blinkDamageAmount: 2,
        subroutineIndex: 0,
      })[0]!;
      expect(failure.title).toContain(
        ["nicht gebrochen", "failed to break", "échec de Blink"][
          Object.keys(locales).indexOf(locale)
        ],
      );
      expect(failure.description).toContain("2");
    });

    it("reports Gypsy's revealed cards and the agenda destination", () => {
      const item = render(155, locale)[0]!;
      expect(item.title).toContain("Simple Agenda");
      expect(item.title).toContain(locale === "fr" ? "QG" : "HQ");
      expect(item.description).toContain("Simple Economy Operation");
      expect(item.description).toContain("Simple Barrier ICE");
      expect(item.description).toContain("2");
    });

    it("preserves original, prevented and final subroutine damage", () => {
      const text = JSON.stringify(render(168, locale));
      for (const fact of ["3", "2", "1", "Bug Zapper"])
        expect(text).toContain(fact);
    });

    it("distinguishes a redirect, an open choice and a declined redirect", () => {
      const redirected = render(61, locale)[0]!;
      expect(redirected.title).toContain("Remote 1");
      expect(redirected.title).toContain("2");
      expect(render(63, locale)[0]!.title).not.toBe(redirected.title);
      expect(render(67, locale)[0]!.title).not.toBe(redirected.title);
    });

    it("reports performed draws even when the planned draw count is larger", () => {
      const item = render(257, locale)[0]!;
      expect(item.title).toContain("1");
      expect(item.title).not.toContain("5");
    });

    it("does not turn hidden card identities into public prose", () => {
      for (const id of [399, 400]) {
        const text = JSON.stringify(render(id, locale));
        expect(text).not.toMatch(
          /Secret Region|Runner Secret|Jackhammer|Simple Agenda|secret_region|runner_secret/,
        );
      }
      expect(JSON.stringify(render(404, locale))).not.toContain(
        "runner_grip_secret",
      );
    });

    it("preserves economy, MU, trace locks and installed-target details", () => {
      const cases: Array<[number, string[]]> = [
        [133, ["Simple Decoder", "4/4", "1"]],
        [197, ["Coyote", "HQ", "2"]],
        [215, ["0", "3", "6"]],
        [360, ["2", "1", "Hacker Tracker"]],
        [381, ["Garbage", "Highlighter", "2", "1"]],
        [421, ["2", "1", "Pattel"]],
      ];
      for (const [id, facts] of cases)
        for (const fact of facts)
          expect(
            JSON.stringify(render(id, locale)),
            `${id}: ${fact}`,
          ).toContain(fact);
    });
  },
);
