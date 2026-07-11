import { describe, expect, it } from "vitest";

import {
  windowEventIconKindForActionCue,
  windowEventIconKindForChoice,
} from "./window-event-icon-kind";

describe("windowEventIconKindForActionCue", () => {
  it.each([
    ["hq", "HQ", "run-hq"],
    ["rd", "R&D", "run-rd"],
    ["archives", "Archive", "run-archives"],
    ["remote_2", "Remote 2", "run-remote"],
  ])("marks a run on %s with its target", (serverId, serverLabel, expected) => {
    expect(
      windowEventIconKindForActionCue({
        actionType: "start_run",
        ambience: null,
        serverId,
        serverLabel,
      }),
    ).toBe(expected);
  });

  it("falls back to HQ when an old run cue has no target", () => {
    expect(
      windowEventIconKindForActionCue({
        actionType: "start_run",
        ambience: null,
      }),
    ).toBe("run-hq");
  });

  it("keeps the existing icon mapping for later run events", () => {
    expect(
      windowEventIconKindForActionCue({
        actionType: "continue_run",
        ambience: "movement",
        serverId: "hq",
      }),
    ).toBe("ice-pass");
  });

  it.each([
    ["mandatory_draw", "draw-card"],
    ["gain_credit", "gain-credit"],
    ["install_card", "install-card"],
    ["play_event", "play-card"],
    ["play_operation", "play-card"],
    ["rez_ice", "rez-card"],
    ["advance_card", "advance-card"],
    ["remove_tag", "remove-tag"],
    ["purge_virus_counters", "purge"],
    ["activated_card_ability", "card-ability"],
    ["resolve_choice", "choice"],
    ["jack_out", "run-end"],
    ["end_turn", "turn-end"],
  ])("maps %s to %s", (actionType, expected) => {
    expect(
      windowEventIconKindForActionCue({ actionType, ambience: null }),
    ).toBe(expected);
  });

  it("uses a visible fallback for unknown future actions", () => {
    expect(
      windowEventIconKindForActionCue({
        actionType: "future_public_action",
        ambience: null,
      }),
    ).toBe("action");
  });

  it("distinguishes gaining tags from removing them", () => {
    expect(
      windowEventIconKindForActionCue({
        actionType: "resolve_choice",
        ambience: null,
        title: "Du hast 6 Tags erhalten.",
      }),
    ).toBe("gain-tag");
    expect(
      windowEventIconKindForActionCue({
        actionType: "remove_tag",
        ambience: null,
        title: "Du hast 1 Tag entfernt.",
      }),
    ).toBe("remove-tag");
  });

  it.each([
    ["search_stack.card", "Karten wählen", "draw-card"],
    ["temporary_program_install", "Programm installieren", "install-card"],
    ["corp_installed_economy.credit_choice", "Credits wählen", "gain-credit"],
    ["generic.source", "Ziel wählen", "choice"],
  ])("maps choice %s to %s", (source, title, expected) => {
    expect(
      windowEventIconKindForChoice({ ambience: null, source, title }),
    ).toBe(expected);
  });
});
