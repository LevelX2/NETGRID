import { getPlayerView } from "@netgrid/engine";
import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import {
  apply,
  applyChoice,
  MECHANIC_SMOKE_GAMES,
  moveRunnerCardToGrip,
  toRunnerTurn,
} from "../../../../packages/engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  formatChronicleEffectItems,
  formatChronicleEvent,
  shouldSuppressChronicleEventItem,
  type ChronicleTranslate,
} from "../../app/chronicle";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

const messages = { de, en, fr };
const definitionId = "onr_v1_105_priority-wreck";

function priorityWreckEvents(paid: number, corpCredits: number) {
  let state = toRunnerTurn(
    MECHANIC_SMOKE_GAMES.runAccess("priority-wreck-chronicle"),
  );
  state.runner.credits = 13;
  state.corp.credits = corpCredits;
  const cardId = moveRunnerCardToGrip(state, definitionId);
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "play_event" && action.payload?.cardId === cardId,
  );
  const startId = state.eventLog.at(-1)!.eventId;
  state = applyChoice(state, "runner", `pay_${paid}`);
  const resultId = state.eventLog.at(-1)!.eventId;
  const { publicEvents } = getPlayerView(state, "corp");
  const start = publicEvents.find((event) => event.eventId === startId)!;
  const result = publicEvents.find((event) => event.eventId === resultId)!;
  result.publicPayload.aiReasonCode = "plan_first.engine_window";
  return { start, result };
}

function translator(locale: keyof typeof messages) {
  return createTranslator({
    locale,
    messages: messages[locale],
    namespace: "Chronicle",
    onError: (error) => {
      throw error;
    },
  }) as unknown as ChronicleTranslate;
}

describe("Priority Wreck chronicle", () => {
  it.each([
    ["de", "9 Credits gezahlt. Die Korp verlor 9 Credits."],
    ["en", "paid 9 credits. The Corp lost 9 credits."],
    ["fr", "paiement de 9 crédits. La Corpo a perdu 9 crédits."],
  ] as const)(
    "shows the run start once and the public outcome in %s",
    (locale, amounts) => {
      const { start, result } = priorityWreckEvents(9, 9);
      const translate = translator(locale);
      expect(start.publicPayload.resolvedEffects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "start_run" }),
        ]),
      );
      expect(shouldSuppressChronicleEventItem(start)).toBe(false);
      const startItem = formatChronicleEvent(start, "corp", { translate });
      expect(startItem.title).toContain("Priority Wreck");
      expect(startItem.title).toContain("HQ");
      expect(
        formatChronicleEffectItems(start, "corp", undefined, translate),
      ).toEqual([]);
      expect(formatChronicleEffectItems(start, "corp")).toEqual([]);

      expect(shouldSuppressChronicleEventItem(result)).toBe(false);
      const resultItem = formatChronicleEvent(result, "corp", {
        translate,
        runServerLabel: "HQ",
      });
      expect(resultItem).toMatchObject({
        category: "run",
        visibility: "public",
        cardDefinitionId: definitionId,
        cardTitle: "Priority Wreck",
        groupLabel: startItem.groupLabel,
      });
      expect(resultItem.title).toContain("Priority Wreck");
      expect(resultItem.title).toContain(amounts);
      expect(
        formatChronicleEffectItems(result, "corp", undefined, translate),
      ).toEqual([]);
    },
  );

  it.each([
    [2, 1, "2 Credits gezahlt. Die Korp verlor 1 Credit."],
    [0, 9, "0 Credits gezahlt. Die Korp verlor 0 Credits."],
  ] as const)(
    "reports the independent outcome for payment %i and %i corp credits",
    (paid, corpCredits, amounts) => {
      const { result } = priorityWreckEvents(paid, corpCredits);
      const item = formatChronicleEvent(result, "corp", {
        translate: translator("de"),
      });
      expect(item.title).toBe(
        `Die Runner-KI: Zugriff durch Priority Wreck ersetzt und ${amounts}`,
      );
    },
  );
});
