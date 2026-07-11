import { describe, expect, it } from "vitest";

import { windowEventIconKindForActionCue } from "./window-event-icon-kind";

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
});
