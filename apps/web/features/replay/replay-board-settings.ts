import {
  CARD_DISPLAY_MODE_STORAGE_KEY,
  CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY,
  CARD_TOOLTIP_SETTINGS_STORAGE_KEY,
  CHRONICLE_DETAIL_MODE_STORAGE_KEY,
  COLOR_SCHEME_STORAGE_KEY,
  GAMEPLAY_SETTINGS_STORAGE_KEY,
} from "../../lib/storage-keys";
import {
  CARD_TOOLTIP_HOVER_OPEN_DELAY_MS,
  normalizeCardDisplayMode,
  normalizeCardTooltipHoverDelayMs,
  normalizeCardTooltipMode,
  normalizeChronicleDetailMode,
  normalizeResourceStripMode,
  type CardDisplayMode,
  type CardTooltipHoverDelayMs,
  type CardTooltipMode,
  type ChronicleDetailMode,
  type ColorScheme,
  type ResourceStripMode,
} from "../settings/settings-model";

export type ReplayBoardSettings = {
  cardDisplayMode: CardDisplayMode;
  cardTooltipHoverDelayMs: CardTooltipHoverDelayMs;
  cardTooltipMode: CardTooltipMode;
  chronicleDetailMode: ChronicleDetailMode;
  colorScheme: ColorScheme;
  cyberspaceBackgroundEnabled: boolean;
  preferGermanCardImages: boolean;
  resourceStripMode: ResourceStripMode;
  showSetBadges: boolean;
  topbarStickyEnabled: boolean;
};

export const DEFAULT_REPLAY_BOARD_SETTINGS: ReplayBoardSettings = {
  cardDisplayMode: "placeholder",
  cardTooltipHoverDelayMs: CARD_TOOLTIP_HOVER_OPEN_DELAY_MS,
  cardTooltipMode: "enhanced",
  chronicleDetailMode: "full",
  colorScheme: "black",
  cyberspaceBackgroundEnabled: true,
  preferGermanCardImages: false,
  resourceStripMode: "auto",
  showSetBadges: true,
  topbarStickyEnabled: true,
};

export function loadReplayBoardSettings(
  readStorage: (key: string) => string | null,
): ReplayBoardSettings {
  const cardImageSettings = parseStoredObject(
    readStorage(CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY),
  );
  const cardTooltipSettings = parseStoredObject(
    readStorage(CARD_TOOLTIP_SETTINGS_STORAGE_KEY),
  );
  const gameplaySettings = parseStoredObject(
    readStorage(GAMEPLAY_SETTINGS_STORAGE_KEY),
  );
  const storedColorScheme = readStorage(COLOR_SCHEME_STORAGE_KEY);

  return {
    cardDisplayMode: normalizeCardDisplayMode(
      readStorage(CARD_DISPLAY_MODE_STORAGE_KEY),
    ),
    cardTooltipHoverDelayMs: normalizeCardTooltipHoverDelayMs(
      cardTooltipSettings.hoverOpenDelayMs,
    ),
    cardTooltipMode: normalizeCardTooltipMode(cardTooltipSettings.mode),
    chronicleDetailMode: normalizeChronicleDetailMode(
      readStorage(CHRONICLE_DETAIL_MODE_STORAGE_KEY),
    ),
    colorScheme:
      storedColorScheme === "white" || storedColorScheme === "black"
        ? storedColorScheme
        : DEFAULT_REPLAY_BOARD_SETTINGS.colorScheme,
    cyberspaceBackgroundEnabled: storedBoolean(
      gameplaySettings.cyberspaceBackgroundEnabled,
      DEFAULT_REPLAY_BOARD_SETTINGS.cyberspaceBackgroundEnabled,
    ),
    preferGermanCardImages: storedBoolean(
      cardImageSettings.preferGermanCardImages,
      DEFAULT_REPLAY_BOARD_SETTINGS.preferGermanCardImages,
    ),
    resourceStripMode: normalizeResourceStripMode(
      gameplaySettings.resourceStripMode,
    ),
    showSetBadges: storedBoolean(
      cardImageSettings.showSetBadges,
      DEFAULT_REPLAY_BOARD_SETTINGS.showSetBadges,
    ),
    topbarStickyEnabled: storedBoolean(
      gameplaySettings.topbarStickyEnabled,
      DEFAULT_REPLAY_BOARD_SETTINGS.topbarStickyEnabled,
    ),
  };
}

function parseStoredObject(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function storedBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
