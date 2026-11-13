import { describe, expect, it } from "vitest";
import type { PublicGameEvent, ResolvedGameEffect } from "@netgrid/shared";

import { publicEventsAfter, resourceEffectSounds } from "./local-action-sounds";

describe("confirmed resource effect sounds", () => {
  it.each([
    ["runner", "play_event"],
    ["corp", "play_operation"],
  ] as const)("plays one coin cluster for a %s credit card", (actor, type) => {
    const confirmed = event(type, [effect("gain_credits", 9)]);
    confirmed.publicPayload.actor = actor;

    expect(resourceEffectSounds(confirmed)).toEqual([
      { sound: "credit", soundCount: 1 },
    ]);
  });

  it("uses the actual drawn count instead of the requested amount", () => {
    const confirmed = event("play_event", [effect("draw_cards", 3)]);
    confirmed.publicPayload.amount = 5;

    expect(resourceEffectSounds(confirmed)).toEqual([
      { sound: "draw", soundCount: 3 },
    ]);
  });

  it("keeps both sounds for a card that draws and grants credits", () => {
    expect(
      resourceEffectSounds(
        event("play_operation", [
          effect("draw_cards", 2),
          effect("gain_credits", 1),
        ]),
      ),
    ).toEqual([
      { sound: "draw", soundCount: 2 },
      { sound: "credit", soundCount: 1 },
    ]);
  });

  it("also sounds effects that resolve after a choice", () => {
    expect(
      resourceEffectSounds(
        event("resolve_choice", [
          effect("gain_credits", 4),
          effect("draw_cards", 1),
        ]),
      ),
    ).toEqual([
      { sound: "credit", soundCount: 1 },
      { sound: "draw", soundCount: 1 },
    ]);
  });

  it("groups repeated effects and bounds a large draw to five snaps", () => {
    expect(
      resourceEffectSounds(
        event("play_event", [
          effect("draw_cards", 3),
          effect("gain_credits", 2),
          effect("draw_cards", 4),
          effect("gain_credits", 4),
        ]),
      ),
    ).toEqual([
      { sound: "draw", soundCount: 5 },
      { sound: "credit", soundCount: 1 },
    ]);
  });

  it.each([
    ["gain_credit", "gain_credits"],
    ["draw_card", "draw_cards"],
    ["mandatory_draw", "draw_cards"],
  ] as const)("does not double the primary %s sound", (type, kind) => {
    expect(resourceEffectSounds(event(type, [effect(kind, 1)]))).toEqual([]);
  });

  it("preserves additional draw effects on a credit action", () => {
    expect(
      resourceEffectSounds(
        event("gain_credit", [
          effect("gain_credits", 2),
          effect("draw_cards", 2),
        ]),
      ),
    ).toEqual([{ sound: "draw", soundCount: 2 }]);
  });

  it("keeps hidden, empty, invalid and unrelated effects silent", () => {
    expect(
      resourceEffectSounds(
        event("play_event", [
          { ...effect("draw_cards", 3), visibility: "private_to_side" },
          { ...effect("gain_credits", 4), visibility: "hidden_info_barrier" },
          { ...effect("gain_credits", 4), visibility: "replay_only" },
          effect("draw_cards", 0),
          effect("gain_credits", -2),
          effect("draw_cards", 1.5),
          effect("draw_cards", Number.NaN),
          effect("gain_credits", Infinity),
          effect("draw_cards"),
          effect("lose_credits", 3),
        ]),
      ),
    ).toEqual([]);
  });

  it("does not infer effects from quotes, labels or resource totals", () => {
    const unresolved = event("play_event");
    unresolved.publicPayload = {
      actionType: "play_event",
      label: "Gain 9 credits and draw 3 cards",
      gainedCredits: 9,
      drawnCards: 3,
      amounts: { credits: 9, cards: 3 },
    };
    expect(resourceEffectSounds(unresolved)).toEqual([]);
  });

  it("only sounds newly received events, including when an older cursor disappeared", () => {
    const old = event("play_event", [effect("gain_credits", 9)]);
    const next = {
      ...event("play_operation", [effect("draw_cards", 2)]),
      eventId: "evt_3",
    };
    const events = [old, next];
    expect(
      publicEventsAfter(events, old.eventId).flatMap(resourceEffectSounds),
    ).toEqual([{ sound: "draw", soundCount: 2 }]);
    expect(
      publicEventsAfter(events, next.eventId).flatMap(resourceEffectSounds),
    ).toEqual([]);
    expect(
      publicEventsAfter(events, "evicted_event").flatMap(resourceEffectSounds),
    ).toEqual([]);
  });
});

function effect(
  kind: ResolvedGameEffect["kind"],
  amount?: number,
): ResolvedGameEffect {
  return {
    effectId: `test.${kind}`,
    kind,
    ...(amount !== undefined ? { amount } : {}),
    visibility: "public",
  };
}

function event(
  type: string,
  resolvedEffects?: ResolvedGameEffect[],
): PublicGameEvent {
  return {
    eventId: "evt_2",
    type,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "fnv1a:test",
    publicPayload: {
      actionType: type,
      ...(resolvedEffects ? { resolvedEffects } : {}),
    },
  };
}
