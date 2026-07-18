"use client";

import { useEffect } from "react";
import { Building2, Cable } from "lucide-react";

import { resolveDeckSlotSelection } from "./deck-slot-selection";

export type DeckSlotSide = "runner" | "corp";

type DeckSlotSnapshot = {
  deckSnapshotId: string;
  name: string;
};

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
  source: "snapshot" | "local";
  selectedSnapshotId: string;
  selectedLocalDeckId: string;
  disabled?: boolean;
  onSource(value: "snapshot" | "local"): void;
  onSnapshot(value: string): void;
  onLocalDeck(value: string): void;
}) {
  const SideIcon = side === "runner" ? Cable : Building2;
  const sideLabel = side === "runner" ? "Runner" : "Korp";
  const optionMark = side === "runner" ? "⌁" : "▦";
  const resolvedSelection = resolveDeckSlotSelection({
    source,
    selectedSnapshotId,
    selectedLocalDeckId,
    snapshots,
    localDecks,
  });

  useEffect(() => {
    if (!resolvedSelection) return;
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

  return (
    <label className={`deckSlotSelect ${side}`}>
      <span className="deckSlotHeading">
        <span className="deckSlotSideIcon" aria-hidden="true">
          <SideIcon size={17} strokeWidth={1.9} />
        </span>
        <span className="deckSlotHeadingText">
          <small>{sideLabel}-Bereich</small>
          <span>{label}</span>
        </span>
      </span>
      <span className="deckSlotControl">
        <SideIcon
          className="deckSlotControlIcon"
          size={16}
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <select
          value={
            resolvedSelection?.source === "local"
              ? `local:${resolvedSelection.localDeckId}`
              : (resolvedSelection?.snapshotId ?? "")
          }
          disabled={disabled}
          aria-label={label}
          onChange={(event) => {
            if (event.target.value.startsWith("local:")) {
              onSource("local");
              onLocalDeck(event.target.value.slice("local:".length));
            } else {
              onSource("snapshot");
              onSnapshot(event.target.value);
            }
          }}
        >
          {snapshots.map((snapshot) => (
            <option
              value={snapshot.deckSnapshotId}
              key={snapshot.deckSnapshotId}
            >
              {optionMark} {sideLabel} · Standard-Deck · {snapshot.name}
            </option>
          ))}
          {localDecks.map((deck) => (
            <option value={`local:${deck.deckId}`} key={deck.deckId}>
              {optionMark} {sideLabel} · Mein Deck · {deck.name}
            </option>
          ))}
        </select>
      </span>
    </label>
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
