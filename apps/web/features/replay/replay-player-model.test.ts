import { describe, expect, it } from "vitest";
import {
  clampReplayFrame,
  nextReplayFrame,
  opponentParticipant,
  playbackDelayMs,
  replaySideForParticipant,
} from "./replay-player-model";

describe("replay player model", () => {
  it("maps participant A and B to their stored sides", () => {
    const sides = { player_a: "corp", player_b: "runner" } as const;
    expect(replaySideForParticipant(sides, "player_a")).toBe("corp");
    expect(replaySideForParticipant(sides, "player_b")).toBe("runner");
    expect(opponentParticipant("player_a")).toBe("player_b");
    expect(opponentParticipant("player_b")).toBe("player_a");
  });

  it("keeps stepping and seeking inside the available frame range", () => {
    expect(clampReplayFrame(-10, 5)).toBe(0);
    expect(clampReplayFrame(99, 5)).toBe(4);
    expect(nextReplayFrame(3, 5)).toBe(4);
    expect(nextReplayFrame(4, 5)).toBe(4);
  });

  it("converts playback speeds to stable timer delays", () => {
    expect(playbackDelayMs(0.5)).toBe(2000);
    expect(playbackDelayMs(1)).toBe(1000);
    expect(playbackDelayMs(2)).toBe(500);
  });
});
