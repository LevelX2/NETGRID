"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BookOpen, Building2, Cable } from "lucide-react";
import { useTranslations } from "use-intl/react";

import {
  RANDOM_STANDARD_DECK_SOURCE,
  resolveDeckSlotSelection,
  type DeckSlotSource,
} from "./deck-slot-selection";
import { StandardDeckGuideDialog } from "./StandardDeckGuideDialog";
import {
  standardDeckGuideControlState,
  type DeckSlotSnapshot,
} from "./standard-deck-guide-ui";

export type { DeckSlotSnapshot } from "./standard-deck-guide-ui";

export type DeckSlotSide = "runner" | "corp";

type DeckSlotLocalDeck = {
  deckId: string;
  name: string;
};

type DeckPublicMetadataSummary = {
  deckName: string;
};

export function DeckSlotSelect({
  label,
  side,
  snapshots,
  localDecks,
  source,
  selectedSnapshotId,
  selectedLocalDeckId,
  disabled = false,
  onSource,
  onSnapshot,
  onLocalDeck,
}: {
  label: string;
  side: DeckSlotSide;
  snapshots: DeckSlotSnapshot[];
  localDecks: DeckSlotLocalDeck[];
  source: DeckSlotSource;
  selectedSnapshotId: string;
  selectedLocalDeckId: string;
  disabled?: boolean;
  onSource(value: DeckSlotSource): void;
  onSnapshot(value: string): void;
  onLocalDeck(value: string): void;
}) {
  const t = useTranslations("Decks.selection");
  const SideIcon = side === "runner" ? Cable : Building2;
  const sideLabel = t(`side.${side}`);
  const optionMark = side === "runner" ? "⌁" : "▦";
  const selectId = useId();
  const guideButtonRef = useRef<HTMLButtonElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const resolvedSelection = resolveDeckSlotSelection({
    source,
    selectedSnapshotId,
    selectedLocalDeckId,
    snapshots,
    localDecks,
  });
  const selectedStandardSnapshot =
    resolvedSelection?.source === "snapshot"
      ? snapshots.find(
          (snapshot) =>
            snapshot.deckSnapshotId === resolvedSelection.snapshotId,
        )
      : undefined;
  const guideControl = standardDeckGuideControlState({
    source: resolvedSelection?.source ?? source,
    ...(selectedStandardSnapshot
      ? { snapshot: selectedStandardSnapshot }
      : {}),
  });
  const dismissGuide = useCallback(() => {
    setGuideOpen(false);
    window.setTimeout(() => guideButtonRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!resolvedSelection) return;
    if (resolvedSelection.source === RANDOM_STANDARD_DECK_SOURCE) return;
    if (resolvedSelection.source === "snapshot") {
      if (source !== "snapshot") onSource("snapshot");
      if (selectedSnapshotId !== resolvedSelection.snapshotId)
        onSnapshot(resolvedSelection.snapshotId);
      return;
    }
    if (source !== "local") onSource("local");
    if (selectedLocalDeckId !== resolvedSelection.localDeckId)
      onLocalDeck(resolvedSelection.localDeckId);
  }, [
    onLocalDeck,
    onSnapshot,
    onSource,
    resolvedSelection,
    selectedLocalDeckId,
    selectedSnapshotId,
    source,
  ]);

  useEffect(() => {
    setGuideOpen(false);
  }, [
    resolvedSelection?.source,
    resolvedSelection?.source === "snapshot"
      ? resolvedSelection.snapshotId
      : undefined,
  ]);

  return (
    <div className={`deckSlotSelect ${side}`}>
      <label className="deckSlotHeading" htmlFor={selectId}>
        <span className="deckSlotSideIcon" aria-hidden="true">
          <SideIcon size={17} strokeWidth={1.9} />
        </span>
        <span className="deckSlotHeadingText">
          <small>{t("sideArea", {side: sideLabel})}</small>
          <span>{label}</span>
        </span>
      </label>
      <div className="deckSlotControlRow">
        <span className="deckSlotControl">
          <SideIcon
            className="deckSlotControlIcon"
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <select
            id={selectId}
            value={
              resolvedSelection?.source === RANDOM_STANDARD_DECK_SOURCE
                ? "random:standard"
                : resolvedSelection?.source === "local"
                  ? `local:${resolvedSelection.localDeckId}`
                  : (resolvedSelection?.snapshotId ?? "")
            }
            disabled={disabled}
            aria-label={label}
            onChange={(event) => {
              if (event.target.value === "random:standard") {
                onSource(RANDOM_STANDARD_DECK_SOURCE);
              } else if (event.target.value.startsWith("local:")) {
                onSource("local");
                onLocalDeck(event.target.value.slice("local:".length));
              } else {
                onSource("snapshot");
                onSnapshot(event.target.value);
              }
            }}
          >
            <option value="random:standard">
              🎲 {t("randomStandard", {side: sideLabel})}
            </option>
            {snapshots.map((snapshot) => (
              <option
                value={snapshot.deckSnapshotId}
                key={snapshot.deckSnapshotId}
              >
                {optionMark} {t("standard", {side: sideLabel, name: snapshot.name})}
              </option>
            ))}
            {localDecks.map((deck) => (
              <option value={`local:${deck.deckId}`} key={deck.deckId}>
                {optionMark} {t("personal", {side: sideLabel, name: deck.name})}
              </option>
            ))}
          </select>
        </span>
        {guideControl ? (
          <button
            ref={guideButtonRef}
            className={`button deckGuideButton status-${guideControl.status}`}
            type="button"
            disabled={disabled || guideControl.disabled}
            title={t(`guide.${guideControl.status}`)}
            onClick={() => setGuideOpen(true)}
          >
            <BookOpen size={15} aria-hidden="true" />
            {t(`guide.${guideControl.status}`)}
          </button>
        ) : null}
      </div>
      {guideOpen && guideControl?.guide && selectedStandardSnapshot ? (
        <StandardDeckGuideDialog
          deckName={selectedStandardSnapshot.name}
          side={side}
          guide={guideControl.guide}
          onDismiss={dismissGuide}
        />
      ) : null}
    </div>
  );
}

export function DeckMetadataLine({
  entries,
}: {
  entries: Array<{
    label: string;
    metadata: DeckPublicMetadataSummary | undefined;
  }>;
}) {
  const visible = entries.filter((entry) => entry.metadata);
  if (visible.length === 0) return null;
  return (
    <div className="deckMetadataLine">
      {visible.map((entry) => (
        <span key={entry.label}>
          {entry.label}: {entry.metadata!.deckName}
        </span>
      ))}
    </div>
  );
}
