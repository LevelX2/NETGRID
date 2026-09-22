import { describe, expect, it } from "vitest";

import {
  DEFAULT_REPLAY_BOARD_SETTINGS,
  loadReplayBoardSettings,
} from "./replay-board-settings";

describe("replay board settings", () => {
  it("starts a fresh browser profile with image tooltips and a simple chronicle", () => {
    expect(loadReplayBoardSettings(() => null)).toMatchObject({
      cardTooltipMode: "image",
      chronicleDetailMode: "simple",
    });
  });

  it("preserves explicitly saved alternative presentation settings", () => {
    const storage = new Map([
      ["netgrid.cardTooltipSettings.v1", JSON.stringify({ mode: "enhanced" })],
      ["netgrid.chronicleDetailMode.v1", "full"],
    ]);
    expect(loadReplayBoardSettings((key) => storage.get(key) ?? null)).toMatchObject({
      cardTooltipMode: "enhanced",
      chronicleDetailMode: "full",
    });
  });

  it("uses the same persisted board presentation settings as a normal match", () => {
    const storage = new Map<string, string>([
      ["netgrid.cardDisplayMode.v1", "text-card"],
      [
        "netgrid.cardImageSkinSettings.v1",
        JSON.stringify({
          preferGermanCardImages: true,
          showSetBadges: false,
        }),
      ],
      [
        "netgrid.cardTooltipSettings.v1",
        JSON.stringify({
          hoverOpenDelayMs: 500,
          mode: "image",
          translateRulesToSelectedLanguage: true,
        }),
      ],
      ["netgrid.chronicleDetailMode.v1", "simple"],
      ["netgrid-color-scheme", "white"],
      [
        "netgrid.gameplaySettings.v1",
        JSON.stringify({
          topbarStickyEnabled: false,
          cyberspaceBackgroundEnabled: false,
          resourceStripMode: "off",
        }),
      ],
    ]);

    expect(loadReplayBoardSettings((key) => storage.get(key) ?? null)).toEqual({
      cardDisplayMode: "text-card",
      cardTooltipHoverDelayMs: 500,
      cardTooltipMode: "image",
      translateCardRulesToSelectedLanguage: true,
      chronicleDetailMode: "simple",
      colorScheme: "white",
      cyberspaceBackgroundEnabled: false,
      preferGermanCardImages: true,
      resourceStripMode: "off",
      showSetBadges: false,
      topbarStickyEnabled: false,
    });
  });

  it("falls back to normal match defaults for missing or invalid values", () => {
    const storage = new Map<string, string>([
      ["netgrid.cardImageSkinSettings.v1", "not-json"],
      ["netgrid.cardTooltipSettings.v1", JSON.stringify({ mode: "unknown" })],
      ["netgrid.gameplaySettings.v1", JSON.stringify({ resourceStripMode: 7 })],
    ]);

    expect(loadReplayBoardSettings((key) => storage.get(key) ?? null)).toEqual(
      DEFAULT_REPLAY_BOARD_SETTINGS,
    );
  });
});
