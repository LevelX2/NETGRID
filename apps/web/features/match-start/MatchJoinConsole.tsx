"use client";

import { BadgeCheck, Keyboard, Link2, UserRound } from "lucide-react";

import { DeckSlotSelect } from "../decks/DeckSelectionControls";

type DeckSlotSource = "snapshot" | "local" | "random_standard";

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
  joinMatchIdTrimmed,
  joinTokenTrimmed,
  joinLinkInput,
  displayName,
  identityKind,
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
  onJoinMatch,
}: {
  joinMatchIdTrimmed: string;
  joinTokenTrimmed: string;
  joinLinkInput: string;
  displayName: string;
  identityKind: "account" | "guest";
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
      <label className="joinLinkField">
        Join-Link
        <input
          value={joinLinkInput}
          onChange={(event) => onJoinLinkInput(event.target.value)}
          data-testid="join-link-input"
        />
      </label>
      <section
        className={`matchStartIdentity ${identityKind}`}
        aria-label="Spielerprofil"
      >
        <div className="matchStartIdentityIcon" aria-hidden="true">
          {identityKind === "account" ? (
            <BadgeCheck size={22} />
          ) : (
            <UserRound size={22} />
          )}
        </div>
        <label>
          <span className="matchStartIdentityLabel">
            <span>
              {identityKind === "account" ? "Account-Anzeigename" : "Gastname"}
            </span>
            <span className={`playerIdentityBadge ${identityKind}`}>
              {identityKind === "account" ? "Account" : "Gast"}
            </span>
          </span>
          <input
            aria-label="Name"
            value={displayName}
            readOnly={identityKind === "account"}
            onChange={(event) => onDisplayName(event.target.value)}
          />
          <small>
            {identityKind === "account"
              ? "Der Anzeigename deines Accounts wird für dieses Spiel verwendet."
              : "Der frei gewählte Gastname wird für dieses Spiel verwendet."}
          </small>
        </label>
      </section>
      <div className="deckSlotGrid">
        <DeckSlotSelect
          label="Dein Runner-Deck"
          side="runner"
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
          side="corp"
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
      <details
        className="advancedMatchOptions"
        data-testid="manual-join-options"
      >
        <summary>
          <Keyboard size={15} />
          Manuell eingeben
        </summary>
        <div className="formGrid advancedMatchGrid">
          <label>
            Match
            <input
              value={joinMatchId}
              onChange={(event) => onJoinMatchId(event.target.value)}
            />
          </label>
          <label>
            Token
            <input
              value={joinToken}
              onChange={(event) => onJoinToken(event.target.value)}
            />
          </label>
        </div>
      </details>
      <button
        className="button primary wide"
        onClick={onJoinMatch}
        disabled={!canSubmitJoin}
        data-testid="join-match"
      >
        <Link2 size={16} />
        Mit Decks beitreten
      </button>
    </div>
  );
}
