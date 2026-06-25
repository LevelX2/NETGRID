"use client";

import { Keyboard, Link2, RotateCcw } from "lucide-react";

import type { OpenMatchEntry } from "../../lib/client-api";
import { DeckSlotSelect } from "../decks/DeckSelectionControls";
import { formatLobbyTime, openMatchAgeLabel, shortMatchId } from "./lobby-format";

type DeckSlotSource = "snapshot" | "local";

type JoinDeckSnapshot = {
  deckSnapshotId: string;
  name: string;
};

type JoinLocalDeck = {
  deckId: string;
  name: string;
  side: "runner" | "corp";
};

export function MatchJoinConsole({
  openLanMatches,
  openLanLoading,
  openLanError,
  openLanUpdatedAt,
  joinMatchIdTrimmed,
  joinTokenTrimmed,
  joinLinkInput,
  displayName,
  runnerSnapshots,
  corpSnapshots,
  localDecks,
  participantBRunnerDeckSource,
  participantBCorpDeckSource,
  selectedParticipantBRunnerSnapshotId,
  selectedParticipantBCorpSnapshotId,
  selectedParticipantBRunnerLocalDeckId,
  selectedParticipantBCorpLocalDeckId,
  joinMatchId,
  joinToken,
  canSubmitJoin,
  onRefreshOpenLanMatches,
  onSelectOpenLanMatch,
  onJoinLinkInput,
  onDisplayName,
  onParticipantBRunnerDeckSource,
  onParticipantBCorpDeckSource,
  onSelectedParticipantBRunnerSnapshotId,
  onSelectedParticipantBCorpSnapshotId,
  onSelectedParticipantBRunnerLocalDeckId,
  onSelectedParticipantBCorpLocalDeckId,
  onJoinMatchId,
  onJoinToken,
  onJoinMatch
}: {
  openLanMatches: OpenMatchEntry[];
  openLanLoading: boolean;
  openLanError: string;
  openLanUpdatedAt: string | null;
  joinMatchIdTrimmed: string;
  joinTokenTrimmed: string;
  joinLinkInput: string;
  displayName: string;
  runnerSnapshots: JoinDeckSnapshot[];
  corpSnapshots: JoinDeckSnapshot[];
  localDecks: JoinLocalDeck[];
  participantBRunnerDeckSource: DeckSlotSource;
  participantBCorpDeckSource: DeckSlotSource;
  selectedParticipantBRunnerSnapshotId: string;
  selectedParticipantBCorpSnapshotId: string;
  selectedParticipantBRunnerLocalDeckId: string;
  selectedParticipantBCorpLocalDeckId: string;
  joinMatchId: string;
  joinToken: string;
  canSubmitJoin: boolean;
  onRefreshOpenLanMatches(): void;
  onSelectOpenLanMatch(matchId: string): void;
  onJoinLinkInput(value: string): void;
  onDisplayName(value: string): void;
  onParticipantBRunnerDeckSource(source: DeckSlotSource): void;
  onParticipantBCorpDeckSource(source: DeckSlotSource): void;
  onSelectedParticipantBRunnerSnapshotId(snapshotId: string): void;
  onSelectedParticipantBCorpSnapshotId(snapshotId: string): void;
  onSelectedParticipantBRunnerLocalDeckId(deckId: string): void;
  onSelectedParticipantBCorpLocalDeckId(deckId: string): void;
  onJoinMatchId(matchId: string): void;
  onJoinToken(token: string): void;
  onJoinMatch(): void;
}) {
  return (
    <div className="matchStartConsole joinConsole">
      <section className="openLanMatchesPanel" aria-label="Offene Spiele im LAN" data-testid="open-lan-panel">
        <div className="openLanMatchesHeader">
          <p className="eyebrow">Offene Spiele im LAN</p>
          <button className="button" onClick={onRefreshOpenLanMatches} type="button" disabled={openLanLoading} data-testid="refresh-open-lan">
            <RotateCcw size={14} />
            Aktualisieren
          </button>
        </div>
        <p className="openLanNotice" data-testid="open-lan-scope-note">
          Hier erscheinen nur private Duelle (Mensch gegen Mensch) mit aktivierter LAN-Sichtbarkeit.
        </p>
        {openLanError ? (
          <p className="notice openLanNotice" role="status">
            {openLanError}
          </p>
        ) : null}
        {openLanMatches.length === 0 ? (
          <p className="openLanEmpty">{openLanLoading ? "Lade offene Spiele ..." : "Keine offenen Spiele gefunden."}</p>
        ) : (
          <ul className="openLanList" data-testid="open-lan-list">
            {openLanMatches.map((entry) => (
              <li key={entry.matchId}>
                <button
                  className={`openLanEntry ${joinMatchIdTrimmed === entry.matchId && joinTokenTrimmed.length === 0 ? "selected" : ""}`}
                  onClick={() => onSelectOpenLanMatch(entry.matchId)}
                  type="button"
                >
                  <strong>{shortMatchId(entry.matchId)}</strong>
                  <small>
                    {entry.hostDisplayName} · Mensch vs Mensch · Status: wartend · Alter: {openMatchAgeLabel(entry.ageSeconds)}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        )}
        {openLanUpdatedAt ? <p className="openLanTimestamp">Zuletzt aktualisiert: {formatLobbyTime(openLanUpdatedAt)}</p> : null}
      </section>
      <label className="joinLinkField">
        Join-Link
        <input value={joinLinkInput} onChange={(event) => onJoinLinkInput(event.target.value)} data-testid="join-link-input" />
      </label>
      <label>
        Name
        <input value={displayName} onChange={(event) => onDisplayName(event.target.value)} />
      </label>
      <div className="deckSlotGrid">
        <DeckSlotSelect
          label="Dein Runner-Deck"
          snapshots={runnerSnapshots}
          localDecks={localDecks.filter((deck) => deck.side === "runner")}
          source={participantBRunnerDeckSource}
          selectedSnapshotId={selectedParticipantBRunnerSnapshotId}
          selectedLocalDeckId={selectedParticipantBRunnerLocalDeckId}
          onSource={onParticipantBRunnerDeckSource}
          onSnapshot={onSelectedParticipantBRunnerSnapshotId}
          onLocalDeck={onSelectedParticipantBRunnerLocalDeckId}
        />
        <DeckSlotSelect
          label="Dein Korp-Deck"
          snapshots={corpSnapshots}
          localDecks={localDecks.filter((deck) => deck.side === "corp")}
          source={participantBCorpDeckSource}
          selectedSnapshotId={selectedParticipantBCorpSnapshotId}
          selectedLocalDeckId={selectedParticipantBCorpLocalDeckId}
          onSource={onParticipantBCorpDeckSource}
          onSnapshot={onSelectedParticipantBCorpSnapshotId}
          onLocalDeck={onSelectedParticipantBCorpLocalDeckId}
        />
      </div>
      <details className="advancedMatchOptions" data-testid="manual-join-options">
        <summary>
          <Keyboard size={15} />
          Manuell eingeben
        </summary>
        <div className="formGrid advancedMatchGrid">
          <label>
            Match
            <input value={joinMatchId} onChange={(event) => onJoinMatchId(event.target.value)} />
          </label>
          <label>
            Token
            <input value={joinToken} onChange={(event) => onJoinToken(event.target.value)} />
          </label>
        </div>
      </details>
      <button className="button primary wide" onClick={onJoinMatch} disabled={!canSubmitJoin} data-testid="join-match">
        <Link2 size={16} />
        Mit Decks beitreten
      </button>
    </div>
  );
}
