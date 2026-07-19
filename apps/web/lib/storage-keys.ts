import type { Side } from "@netgrid/shared";

export const AUDIO_STORAGE_KEY = "netgrid-s01-audio";
export const ACTION_CUE_SETTINGS_STORAGE_KEY = "netgrid.actionCueSettings.v1";
export const GAMEPLAY_SETTINGS_STORAGE_KEY = "netgrid.gameplaySettings.v1";
export const CARD_TOOLTIP_SETTINGS_STORAGE_KEY = "netgrid.cardTooltipSettings.v1";
export const CARD_SIZE_SETTINGS_STORAGE_KEY = "netgrid.cardSizeSettings.v1";
export const DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY = "netgrid.deckTableViewSettings.v1";
export const CARD_DISPLAY_MODE_STORAGE_KEY = "netgrid.cardDisplayMode.v1";
export const CARD_IMAGE_SKIN_SETTINGS_STORAGE_KEY = "netgrid.cardImageSkinSettings.v1";
export const CHRONICLE_DETAIL_MODE_STORAGE_KEY = "netgrid.chronicleDetailMode.v1";
export const CARD_PREVIEW_COLLAPSED_STORAGE_PREFIX = "netgrid.cardPreviewCollapsed.v1";
export const AI_PACING_MODE_STORAGE_KEY = "netgrid.aiPacingMode.v1";
export const MATCH_START_SETTINGS_STORAGE_KEY = "netgrid.matchStartSettings.v1";
export const RUN_OVERLAY_POSITION_STORAGE_KEY = "netgrid.runOverlayPosition.v1";
export const ACTION_PANEL_OVERLAY_POSITION_STORAGE_KEY = "netgrid.actionPanelOverlayPosition.v1";
export const AI_DECISION_DEBUG_OVERLAY_POSITION_STORAGE_KEY = "netgrid.aiDecisionDebugOverlayPosition.v1";
export const COLOR_SCHEME_STORAGE_KEY = "netgrid-color-scheme";
export const DISPLAY_NAME_STORAGE_KEY = "netgrid.displayName";

export function cardPreviewCollapsedStorageKeyFor(matchId: string, side: Side): string {
  return `${CARD_PREVIEW_COLLAPSED_STORAGE_PREFIX}.${matchId}.${side}`;
}
