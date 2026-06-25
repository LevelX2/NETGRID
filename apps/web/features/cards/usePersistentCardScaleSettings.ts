"use client";

import { useEffect, useState } from "react";

import {
  CARD_SIZE_SETTINGS_STORAGE_KEY,
  LEGACY_CARD_SIZE_SETTINGS_STORAGE_KEY
} from "../../lib/storage-keys";
import { readLocalStorageWithLegacy, removeLocalStorageKeys } from "../../lib/local-storage";
import {
  CARD_SCALE_DEFAULT_PERCENT,
  normalizeCardScalePercent
} from "../settings/settings-model";

export function usePersistentCardScaleSettings() {
  const [cardTooltipScalePercent, setCardTooltipScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardHandScalePercent, setCardHandScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardArchiveScalePercent, setCardArchiveScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardZoneScalePercent, setCardZoneScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardBoardScalePercent, setCardBoardScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardRigScalePercent, setCardRigScalePercent] = useState(CARD_SCALE_DEFAULT_PERCENT);
  const [cardSizeSettingsLoaded, setCardSizeSettingsLoaded] = useState(false);

  useEffect(() => {
    const stored = readLocalStorageWithLegacy(CARD_SIZE_SETTINGS_STORAGE_KEY, LEGACY_CARD_SIZE_SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          tooltipPercent?: unknown;
          handPercent?: unknown;
          archivePercent?: unknown;
          zonePercent?: unknown;
          boardPercent?: unknown;
          rigPercent?: unknown;
          opponentPercent?: unknown;
        };
        setCardTooltipScalePercent(normalizeCardScalePercent(parsed.tooltipPercent));
        setCardHandScalePercent(normalizeCardScalePercent(parsed.handPercent));
        setCardArchiveScalePercent(normalizeCardScalePercent(parsed.archivePercent ?? parsed.zonePercent));
        setCardZoneScalePercent(normalizeCardScalePercent(parsed.zonePercent));
        setCardBoardScalePercent(normalizeCardScalePercent(parsed.boardPercent));
        setCardRigScalePercent(normalizeCardScalePercent(parsed.rigPercent ?? parsed.opponentPercent));
      } catch {
        removeLocalStorageKeys(CARD_SIZE_SETTINGS_STORAGE_KEY, LEGACY_CARD_SIZE_SETTINGS_STORAGE_KEY);
      }
    }
    setCardSizeSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!cardSizeSettingsLoaded) return;
    window.localStorage.setItem(
      CARD_SIZE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        tooltipPercent: cardTooltipScalePercent,
        handPercent: cardHandScalePercent,
        archivePercent: cardArchiveScalePercent,
        zonePercent: cardZoneScalePercent,
        boardPercent: cardBoardScalePercent,
        rigPercent: cardRigScalePercent
      })
    );
  }, [cardSizeSettingsLoaded, cardTooltipScalePercent, cardHandScalePercent, cardArchiveScalePercent, cardZoneScalePercent, cardBoardScalePercent, cardRigScalePercent]);

  return {
    cardTooltipScalePercent,
    cardHandScalePercent,
    cardArchiveScalePercent,
    cardZoneScalePercent,
    cardBoardScalePercent,
    cardRigScalePercent,
    setCardTooltipScalePercent,
    setCardHandScalePercent,
    setCardArchiveScalePercent,
    setCardZoneScalePercent,
    setCardBoardScalePercent,
    setCardRigScalePercent
  };
}
