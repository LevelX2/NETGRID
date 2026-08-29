"use client";

import { BadgeCheck, Keyboard, Link2, UserRound } from "lucide-react";
import { useTranslations } from "use-intl/react";

import {
  DeckSlotSelect,
  type DeckSlotSnapshot,
} from "../decks/DeckSelectionControls";

type DeckSlotSource = "snapshot" | "local" | "random_standard";

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
  onOpenStandardDeck,
  onJoinMatchId,
  onJoinToken,
  onJoinMatch,
}: {
  joinMatchIdTrimmed: string;
  joinTokenTrimmed: string;
  joinLinkInput: string;
  displayName: string;
  identityKind: "account" | "guest";
  runnerSnapshots: DeckSlotSnapshot[];
  corpSnapshots: DeckSlotSnapshot[];
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
  onOpenStandardDeck(standardDeckId: string): void;
  onJoinMatchId(matchId: string): void;
  onJoinToken(token: string): void;
  onJoinMatch(): void;
}) {
  const t = useTranslations("MatchStart.join");
  return (
    <div className="matchStartConsole joinConsole">
      <label className="joinLinkField">
        {t("joinLink")}
        <input
          value={joinLinkInput}
          onChange={(event) => onJoinLinkInput(event.target.value)}
          data-testid="join-link-input"
        />
      </label>
      <section
        className={`matchStartIdentity ${identityKind}`}
        aria-label={t("playerProfile")}
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
              {identityKind === "account"
                ? t("accountDisplayName")
                : t("guestName")}
            </span>
            <span className={`playerIdentityBadge ${identityKind}`}>
              {identityKind === "account" ? t("account") : t("guest")}
            </span>
          </span>
          <input
            aria-label={t("name")}
            value={displayName}
            readOnly={identityKind === "account"}
            onChange={(event) => onDisplayName(event.target.value)}
          />
          <small>
            {identityKind === "account"
              ? t("accountNameHelp")
              : t("guestNameHelp")}
          </small>
        </label>
      </section>
      <div className="deckSlotGrid">
        <DeckSlotSelect
          label={t("runnerDeck")}
          side="runner"
          snapshots={runnerSnapshots}
          localDecks={localDecks.filter((deck) => deck.side === "runner")}
          source={participantBRunnerDeckSource}
          selectedSnapshotId={selectedParticipantBRunnerSnapshotId}
          selectedLocalDeckId={selectedParticipantBRunnerLocalDeckId}
          onSource={onParticipantBRunnerDeckSource}
          onSnapshot={onSelectedParticipantBRunnerSnapshotId}
          onLocalDeck={onSelectedParticipantBRunnerLocalDeckId}
          onOpenStandardDeck={onOpenStandardDeck}
        />
        <DeckSlotSelect
          label={t("corpDeck")}
          side="corp"
          snapshots={corpSnapshots}
          localDecks={localDecks.filter((deck) => deck.side === "corp")}
          source={participantBCorpDeckSource}
          selectedSnapshotId={selectedParticipantBCorpSnapshotId}
          selectedLocalDeckId={selectedParticipantBCorpLocalDeckId}
          onSource={onParticipantBCorpDeckSource}
          onSnapshot={onSelectedParticipantBCorpSnapshotId}
          onLocalDeck={onSelectedParticipantBCorpLocalDeckId}
          onOpenStandardDeck={onOpenStandardDeck}
        />
      </div>
      <details
        className="advancedMatchOptions"
        data-testid="manual-join-options"
      >
        <summary>
          <Keyboard size={15} />
          {t("manual")}
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
        {t("joinWithDecks")}
      </button>
    </div>
  );
}
