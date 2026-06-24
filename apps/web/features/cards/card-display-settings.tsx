import { createContext, useContext } from "react";

import { localCardImageUrl } from "./card-image-service";
import {
  CARD_SCALE_DEFAULT_PERCENT,
  CARD_TOOLTIP_HOVER_OPEN_DELAY_MS,
  type CardScaleSettings,
  type CardTooltipSettings
} from "../settings/settings-model";

export type CardImagePreferenceSettings = {
  preferGermanCardImages: boolean;
  showSetBadges: boolean;
};

export const CardTooltipSettingsContext = createContext<CardTooltipSettings>({
  hoverOpenDelayMs: CARD_TOOLTIP_HOVER_OPEN_DELAY_MS,
  mode: "enhanced"
});

export const CardScaleSettingsContext = createContext<CardScaleSettings>({
  tooltipPercent: CARD_SCALE_DEFAULT_PERCENT,
  handPercent: CARD_SCALE_DEFAULT_PERCENT,
  archivePercent: CARD_SCALE_DEFAULT_PERCENT,
  zonePercent: CARD_SCALE_DEFAULT_PERCENT,
  boardPercent: CARD_SCALE_DEFAULT_PERCENT,
  rigPercent: CARD_SCALE_DEFAULT_PERCENT
});

export const CardImagePreferenceContext = createContext<CardImagePreferenceSettings>({
  preferGermanCardImages: false,
  showSetBadges: true
});

export function useCardTooltipSettings(): CardTooltipSettings {
  return useContext(CardTooltipSettingsContext);
}

export function useCardScaleSettings(): CardScaleSettings {
  return useContext(CardScaleSettingsContext);
}

export function useCardImagePreference(): CardImagePreferenceSettings {
  return useContext(CardImagePreferenceContext);
}

export function usePreferredCardImageSource(cardId: string | undefined | null): { src: string | undefined; fallbackSrc: string | undefined } {
  const { preferGermanCardImages } = useCardImagePreference();
  const src = localCardImageUrl(cardId, { preferGerman: preferGermanCardImages });
  const originalSrc = preferGermanCardImages ? localCardImageUrl(cardId) : undefined;
  return {
    src,
    fallbackSrc: originalSrc && originalSrc !== src ? originalSrc : undefined
  };
}
