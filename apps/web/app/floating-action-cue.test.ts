import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { clampCuePosition } from "../features/actions/cue-position";
import { shouldUseFloatingCue } from "../features/actions/cue-display";
import {
  normalizeCueAutoDismissMs,
  normalizeCueDisplayMode,
} from "../features/settings/settings-model";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const optionsSource = readFileSync(
  new URL("../features/settings/OptionsPanel.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("floating action cues", () => {
  it("normalizes the local display mode without changing match state", () => {
    expect(normalizeCueDisplayMode("floating")).toBe("floating");
    expect(normalizeCueDisplayMode("window")).toBe("window");
    expect(normalizeCueDisplayMode("legacy-value")).toBe("window");
    expect(pageSource).toContain("displayMode: actionCueDisplayMode");
    expect(pageSource).toContain("normalizeCueDisplayMode(parsed.displayMode)");
  });

  it("clamps and snaps the duration from one to ten seconds", () => {
    expect(normalizeCueAutoDismissMs(200)).toBe(1000);
    expect(normalizeCueAutoDismissMs(1126)).toBe(1250);
    expect(normalizeCueAutoDismissMs(9876)).toBe(10000);
    expect(normalizeCueAutoDismissMs(20000)).toBe(10000);
    expect(normalizeCueAutoDismissMs(0)).toBe(2500);
    expect(optionsSource).toContain('type="range"');
    expect(optionsSource).toContain("CUE_AUTO_DISMISS_STEP_MS");
  });

  it("uses the floating style only for purely informative cues", () => {
    expect(shouldUseFloatingCue("floating", false)).toBe(true);
    expect(shouldUseFloatingCue("floating", true)).toBe(false);
    expect(shouldUseFloatingCue("floating", false, true)).toBe(false);
    expect(shouldUseFloatingCue("window", false)).toBe(false);
  });

  it("keeps custom top-left anchors inside the rendered viewport", () => {
    expect(clampCuePosition(100, 100, 390, 844, 350, 180)).toEqual({
      kind: "custom",
      xPercent: 7.18,
      yPercent: 77.25,
    });
  });

  it("provides pointer, keyboard, lifecycle and reduced-motion behavior", () => {
    expect(optionsSource).toContain("setPointerCapture");
    expect(optionsSource).toContain('event.key === "ArrowLeft"');
    expect(optionsSource).toContain('role="slider"');
    expect(css).toContain("@keyframes floating-cue-lifecycle");
    expect(css).toContain("@keyframes floating-cue-fade-only");
    expect(css).toContain("pointer-events: none;");
  });
});
