import type { ApiAiPacingMode } from "@netgrid/shared";

export const CARD_TOOLTIP_HOVER_DELAY_OPTIONS = [300, 500, 750, 1000, 1250, 1500] as const;
export const CARD_TOOLTIP_HOVER_OPEN_DELAY_MS = 1000;
export const CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS = 120;
export const CARD_TOOLTIP_OUTSIDE_CARD_CLICK_CLOSE_DELAY_MS = 450;
export const CARD_TOOLTIP_PIN_EVENT = "netgrid:card-tooltip-pin";
export const CARD_SCALE_PERCENT_MIN = 50;
export const CARD_SCALE_PERCENT_MAX = 170;
export const CARD_SCALE_PERCENT_STEP = 5;
export const CARD_SCALE_DEFAULT_PERCENT = 100;

export type AiPacingMode = ApiAiPacingMode;
export type CardDisplayMode = "placeholder" | "text-card" | "compact";
export type ChronicleDetailMode = "simple" | "medium" | "full";
export type ColorScheme = "black" | "white";
export type ResourceStripMode = "auto" | "on" | "off";
export type ActionPanelMode = "docked" | "floating";
export type CueAutoDismissMs = 0 | 1500 | 2500 | 4000 | 6000;
export type CardTooltipHoverDelayMs = (typeof CARD_TOOLTIP_HOVER_DELAY_OPTIONS)[number];
export type CardTooltipMode = "simple" | "enhanced" | "image";

export type CardTooltipSettings = {
  hoverOpenDelayMs: CardTooltipHoverDelayMs;
  mode: CardTooltipMode;
};

export type CardScaleSettings = {
  tooltipPercent: number;
  handPercent: number;
  archivePercent: number;
  zonePercent: number;
  boardPercent: number;
  rigPercent: number;
};

export function normalizeCueAutoDismissMs(value: unknown): CueAutoDismissMs {
  return value === 0 || value === 1500 || value === 2500 || value === 4000 || value === 6000 ? value : 2500;
}

export function normalizeCardTooltipHoverDelayMs(value: unknown): CardTooltipHoverDelayMs {
  return CARD_TOOLTIP_HOVER_DELAY_OPTIONS.includes(value as CardTooltipHoverDelayMs) ? (value as CardTooltipHoverDelayMs) : CARD_TOOLTIP_HOVER_OPEN_DELAY_MS;
}

export function normalizeCardTooltipMode(value: unknown): CardTooltipMode {
  return value === "simple" || value === "enhanced" || value === "image" ? value : "enhanced";
}

export function normalizeCardDisplayMode(value: unknown): CardDisplayMode {
  return value === "text-card" || value === "compact" || value === "placeholder" ? value : "placeholder";
}

export function normalizeChronicleDetailMode(value: unknown): ChronicleDetailMode {
  return value === "simple" || value === "medium" || value === "full" ? value : "full";
}

export function normalizeAiPacingMode(value: unknown): AiPacingMode {
  return value === "manual" || value === "paced" || value === "fast" ? value : "paced";
}

export function normalizeResourceStripMode(value: unknown): ResourceStripMode {
  return value === "on" || value === "off" || value === "auto" ? value : "auto";
}

export function normalizeActionPanelMode(value: unknown): ActionPanelMode {
  return value === "floating" || value === "docked" ? value : "docked";
}

export function normalizeCardScalePercent(value: unknown, min = CARD_SCALE_PERCENT_MIN, max = CARD_SCALE_PERCENT_MAX): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return CARD_SCALE_DEFAULT_PERCENT;
  const clamped = Math.max(min, Math.min(max, numeric));
  const snapped = Math.round(clamped / CARD_SCALE_PERCENT_STEP) * CARD_SCALE_PERCENT_STEP;
  return Math.max(min, Math.min(max, snapped));
}
