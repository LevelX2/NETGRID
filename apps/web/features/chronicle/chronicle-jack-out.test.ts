import { getPlayerView, replayEvents } from "@netgrid/engine";
import { createTranslator } from "use-intl/core";
import { expect, it } from "vitest";
import {
  apply,
  putCorpIceOnServer,
  toRunnerTurn,
  v181CardReleaseGame,
} from "../../../../packages/engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  formatChronicleEvent,
  shouldSuppressChronicleEventItem,
  type ChronicleTranslate,
} from "../../app/chronicle";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

const messages = { de, en, fr };

it.each([
  [
    true,
    { jackOutIcePosition: 1 },
    ["vor ICE 1", "before ICE 1", "avant la GLACE 1"],
  ],
  [
    false,
    { jackOutBeforeAccess: true },
    ["vor dem Zugriff", "before access", "avant l’accès"],
  ],
] as const)(
  "projects where the Runner jacked out with inner ICE installed = %s",
  (innerIce, location, labels) => {
    let state = toRunnerTurn(v181CardReleaseGame("chronicle-jack-out"));
    state.corp.credits = 20;
    if (innerIce) putCorpIceOnServer(state, "rd", 589);
    const outerIce = putCorpIceOnServer(state, "rd", 434);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === outerIce,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const before = state;
    state = apply(state, "runner", (action) => action.type === "jack_out");
    expect(state.run).toBeUndefined();
    const event = getPlayerView(state, "corp").publicEvents.at(-1)!;
    expect(event.publicPayload).toMatchObject({
      actionType: "jack_out",
      actor: "runner",
      serverId: "rd",
      ...location,
    });
    expect(event.publicPayload.targetIceDefinitionId).toBeUndefined();
    expect(shouldSuppressChronicleEventItem(event)).toBe(false);
    expect(
      replayEvents(before, state.eventLog.slice(before.eventLog.length)).ok,
    ).toBe(true);

    for (const [index, locale] of (["de", "en", "fr"] as const).entries()) {
      const translate = createTranslator({
        locale,
        messages: messages[locale],
        namespace: "Chronicle",
        onError: (error) => {
          throw error;
        },
      }) as unknown as ChronicleTranslate;
      const item = formatChronicleEvent(event, "corp", { translate });
      expect(item.title).toContain("R&D");
      expect(item.title).toContain(labels[index]);
    }
  },
);
