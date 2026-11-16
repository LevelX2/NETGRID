import { getPlayerView } from "@netgrid/engine";
import { createTranslator } from "use-intl/core";
import { expect, it } from "vitest";
import {
  apply,
  moveRunnerCardToGrip,
  putCorpCardOnTopOfRd,
  toRunnerTurn,
  v192CardReleaseGame,
} from "../../../../packages/engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  formatChronicleEffectItems,
  formatChronicleEvent,
} from "../../app/chronicle";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

const messages = { de, en, fr };
const definitionId = "onr_v1_076_all-nighter";

it.each([
  ["de", "auf den Bonus-Run verzichtet."],
  ["en", "declined the bonus run."],
  ["fr", "a renoncé au piratage bonus."],
] as const)(
  "shows All-Nighter and its declined bonus run in %s",
  (locale, declineText) => {
    let state = toRunnerTurn(v192CardReleaseGame("all-nighter-chronicle"));
    const cardId = moveRunnerCardToGrip(state, definitionId);
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === cardId &&
        action.payload.serverId === "rd",
    );
    const playId = state.eventLog.at(-1)!.eventId;
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) =>
        action.payload?.runnerAbility === "decline_optional_bonus_run",
    );
    const declineId = state.eventLog.at(-1)!.eventId;
    const { publicEvents } = getPlayerView(state, "corp");
    const play = publicEvents.find((event) => event.eventId === playId)!;
    const decline = publicEvents.find((event) => event.eventId === declineId)!;
    const translate = createTranslator({
      locale,
      messages: messages[locale],
      namespace: "Chronicle",
      onError: (error) => {
        throw error;
      },
    });

    expect(play.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({ kind: "start_run", serverId: "rd" }),
    );
    const playItem = formatChronicleEvent(play, "corp", { translate });
    expect(playItem).toMatchObject({
      category: "run",
      cardDefinitionId: definitionId,
    });
    expect(playItem.title).toContain("All-Nighter");
    expect(playItem.title).toContain("R&D");
    expect(
      formatChronicleEffectItems(play, "corp", undefined, translate),
    ).toEqual([]);
    expect(formatChronicleEffectItems(play, "corp")).toEqual([]);

    const declineItem = formatChronicleEvent(decline, "corp", {
      translate,
      runServerLabel: "R&D",
    });
    expect(declineItem.title).toContain(declineText);
    expect(declineItem.cardTitle).toBeUndefined();
    expect(declineItem.groupLabel).toBe(playItem.groupLabel);
    expect(formatChronicleEvent(decline, "corp").title).toContain(
      "auf den Bonus-Run verzichtet",
    );
  },
);
