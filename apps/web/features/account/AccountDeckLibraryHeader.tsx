"use client";

import { useMemo, useState } from "react";
import type { AccountDeckQuota, StandardDeck } from "./account-deck-client";

export function AccountDeckLibraryHeader({
  standards,
  quota,
  accountMode,
  busy,
  onUseStandard,
  onEditStandard,
}: {
  standards: StandardDeck[];
  quota: AccountDeckQuota | null;
  accountMode: boolean;
  busy: boolean;
  onUseStandard(deck: StandardDeck): void;
  onEditStandard(deck: StandardDeck): void;
}) {
  const [side, setSide] = useState<"runner" | "corp">("runner");
  const filtered = useMemo(
    () => standards.filter((deck) => deck.side === side),
    [side, standards],
  );
  const [selectedId, setSelectedId] = useState("");
  const selected =
    filtered.find((deck) => deck.standardDeckId === selectedId) ?? filtered[0];
  return (
    <section className="accountDeckLibraryHeader">
      <div>
        <p className="eyebrow">Deckbibliothek</p>
        <h2>
          {accountMode
            ? "Standard-Decks und Meine Decks"
            : "Standard-Decks und lokale Gast-Decks"}
        </h2>
        <p className="muted">
          Standards sind unveränderlich. Du kannst sie direkt spielen
          {accountMode
            ? " oder im Editor als persönliches Deck weiterführen"
            : ""}
          .
        </p>
      </div>
      <div className="accountDeckStandardControls">
        <label>
          Seite
          <select
            value={side}
            onChange={(event) => {
              setSide(event.target.value as "runner" | "corp");
              setSelectedId("");
            }}
          >
            <option value="runner">Runner</option>
            <option value="corp">Korp</option>
          </select>
        </label>
        <label>
          Standard-Deck
          <select
            value={selected?.standardDeckId ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {filtered.map((deck) => (
              <option key={deck.standardDeckId} value={deck.standardDeckId}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button primary"
          disabled={!selected || busy}
          onClick={() => selected && onUseStandard(selected)}
          type="button"
        >
          Direkt spielen
        </button>
        {accountMode ? (
          <button
            className="button"
            disabled={!selected || busy || quota?.remaining === 0}
            onClick={() => selected && onEditStandard(selected)}
            type="button"
          >
            Im Editor öffnen
          </button>
        ) : null}
      </div>
      {accountMode && quota ? (
        <p className="accountDeckQuota">
          Meine Decks: {quota.used}/{quota.limit} · noch {quota.remaining} frei
        </p>
      ) : (
        <p className="accountDeckQuota">
          Gastmodus: eigene Decks bleiben in deiner lokalen Dateiablage.
        </p>
      )}
    </section>
  );
}
