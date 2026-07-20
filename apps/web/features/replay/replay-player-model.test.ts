import { describe, expect, it } from "vitest";
import {
  clampReplayFrame,
  nextReplayFrame,
  playbackDelayMs,
} from "./replay-player-model";

describe("replay player model", () => {
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
