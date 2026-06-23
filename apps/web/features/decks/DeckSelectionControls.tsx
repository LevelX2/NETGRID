"use client";

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
  snapshots,
  localDecks,
  source,
  selectedSnapshotId,
  selectedLocalDeckId,
  disabled = false,
  onSource,
  onSnapshot,
  onLocalDeck
}: {
  label: string;
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
  return (
    <label className="deckSlotSelect">
      {label}
      <select
        value={source === "local" && selectedLocalDeckId ? `local:${selectedLocalDeckId}` : selectedSnapshotId}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value.startsWith("local:")) {
            onSource("local");
            onLocalDeck(event.target.value.slice("local:".length));
          }
          else {
            onSource("snapshot");
            onSnapshot(event.target.value);
          }
        }}
      >
        {snapshots.map((snapshot) => (
          <option value={snapshot.deckSnapshotId} key={snapshot.deckSnapshotId}>
            Projekt-Snapshot · {snapshot.name}
          </option>
        ))}
        {localDecks.map((deck) => (
          <option value={`local:${deck.deckId}`} key={deck.deckId}>
            Deck-Editor · {deck.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DeckMetadataLine({ entries }: { entries: Array<{ label: string; metadata: DeckPublicMetadataSummary | undefined }> }) {
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
