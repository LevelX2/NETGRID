"use client";

import {
  BadgeCheck,
  Bot,
  Building2,
  Dices,
  UserPlus,
  UserRound,
  Zap,
} from "lucide-react";

import {
  type HumanAiSideSelection,
  type HumanSideSelection,
  type MatchCardPoolSelection,
  type MatchFormatSelection,
  type MatchStartSeriesGames,
  type PlayMode,
} from "../../app/match-start";
import type {
  MatchStartPlayerClockGraceSeconds,
  MatchStartPlayerClockMinutes,
  MatchStartPlayerClockMode,
} from "../../app/match-start-storage";
import type { StandardDeckCatalogState } from "../account/standard-deck-catalog-state";
import {
  DeckMetadataLine,
  DeckSlotSelect,
  type DeckSlotSnapshot,
} from "../decks/DeckSelectionControls";
import { MatchStartAdvancedOptions } from "./MatchStartAdvancedOptions";
import { MatchStartChoiceSections } from "./MatchStartChoiceSections";
import { StandardDeckCatalogStatus } from "./StandardDeckCatalogStatus";
import type { TraceRulesProfile } from "@netgrid/shared";

type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy =
  | "fixed"
  | "selected"
  | "seeded_random"
  | "same_as_participant_a";
type AiTraceStartMode = "off" | "detailed";
type DeckSlotSource = "snapshot" | "local" | "random_standard";

// Firefox restores dynamic button-disabled state before React hydrates.
// The spread keeps this Firefox-only attribute outside React's button typings.
const FIREFOX_DISABLED_STATE_RESET_PROPS = { autoComplete: "off" } as const;

type MatchStartLocalDeck = {
  deckId: string;
  name: string;
  side: "runner" | "corp";
};

export function MatchHostConsole({
  playMode,
  matchFormat,
  seriesGamesPlanned,
  matchCardPool,
  traceRulesProfile,
  displayName,
  identityKind,
  isHumanVsAi,
  humanAiSideSelection,
  gameMode,
  runnerDifficulty,
  corpDifficulty,
  aiDeckPolicyUsesPrimaryDeckSlots,
  runnerSnapshots,
  corpSnapshots,
  localDecks,
  standardDeckCatalogState,
  standardDeckCatalogBlocksStart,
  runnerDeckSource,
  corpDeckSource,
  selectedRunnerSnapshotId,
  selectedCorpSnapshotId,
  selectedRunnerLocalDeckId,
  selectedCorpLocalDeckId,
  isHumanVsHuman,
  testSetupMode,
  startSummary,
  hasAiOpponent,
  humanSideSelection,
  countdownSeconds,
  isPublic,
  playerClockMode,
  playerClockMinutes,
  playerClockGraceSeconds,
  playerClockDetailControlsDisabled,
  seed,
  aiTraceStartMode,
  aiDeckPolicy,
  participantBRunnerDeckSource,
  participantBCorpDeckSource,
  selectedParticipantBRunnerSnapshotId,
  selectedParticipantBCorpSnapshotId,
  selectedParticipantBRunnerLocalDeckId,
  selectedParticipantBCorpLocalDeckId,
  aiSlotDisabled,
  visibleDeckMetadataEntries,
  onPlayMode,
  onMatchFormat,
  onSeriesGamesPlanned,
  onMatchCardPool,
  onTraceRulesProfile,
  onDisplayName,
  onHumanAiSideSelection,
  onRunnerDifficulty,
  onCorpDifficulty,
  onRunnerDeckSource,
  onCorpDeckSource,
  onSelectedRunnerSnapshotId,
  onSelectedCorpSnapshotId,
  onSelectedRunnerLocalDeckId,
  onSelectedCorpLocalDeckId,
  onReloadStandardDeckCatalog,
  onCreateMatch,
  onHumanSideSelection,
  onCountdownSeconds,
  onIsPublic,
  onPlayerClockMode,
  onPlayerClockMinutes,
  onPlayerClockGraceSeconds,
  onSeed,
  onAiTraceStartMode,
  onTestSetupMode,
  onAiDeckPolicy,
  onParticipantBRunnerDeckSource,
  onParticipantBCorpDeckSource,
  onSelectedParticipantBRunnerSnapshotId,
  onSelectedParticipantBCorpSnapshotId,
  onSelectedParticipantBRunnerLocalDeckId,
  onSelectedParticipantBCorpLocalDeckId,
}: {
  playMode: PlayMode;
  matchFormat: MatchFormatSelection;
  seriesGamesPlanned: MatchStartSeriesGames;
  matchCardPool: MatchCardPoolSelection;
  traceRulesProfile: TraceRulesProfile;
  displayName: string;
  identityKind: "account" | "guest";
  isHumanVsAi: boolean;
  humanAiSideSelection: HumanAiSideSelection;
  gameMode: string;
  runnerDifficulty: AiDifficulty;
  corpDifficulty: AiDifficulty;
  aiDeckPolicyUsesPrimaryDeckSlots: boolean;
  runnerSnapshots: DeckSlotSnapshot[];
  corpSnapshots: DeckSlotSnapshot[];
  localDecks: MatchStartLocalDeck[];
  standardDeckCatalogState: StandardDeckCatalogState;
  standardDeckCatalogBlocksStart: boolean;
  runnerDeckSource: DeckSlotSource;
  corpDeckSource: DeckSlotSource;
  selectedRunnerSnapshotId: string;
  selectedCorpSnapshotId: string;
  selectedRunnerLocalDeckId: string;
  selectedCorpLocalDeckId: string;
  isHumanVsHuman: boolean;
  testSetupMode: boolean;
  startSummary: string[];
  hasAiOpponent: boolean;
  humanSideSelection: HumanSideSelection;
  countdownSeconds: 3 | 5 | 10;
  isPublic: boolean;
  playerClockMode: MatchStartPlayerClockMode;
  playerClockMinutes: MatchStartPlayerClockMinutes;
  playerClockGraceSeconds: MatchStartPlayerClockGraceSeconds;
  playerClockDetailControlsDisabled: boolean;
  seed: string;
  aiTraceStartMode: AiTraceStartMode;
  aiDeckPolicy: AiDeckPolicy;
  participantBRunnerDeckSource: DeckSlotSource;
  participantBCorpDeckSource: DeckSlotSource;
  selectedParticipantBRunnerSnapshotId: string;
  selectedParticipantBCorpSnapshotId: string;
  selectedParticipantBRunnerLocalDeckId: string;
  selectedParticipantBCorpLocalDeckId: string;
  aiSlotDisabled: boolean;
  visibleDeckMetadataEntries: Array<{
    label: string;
    metadata: { deckName: string } | undefined;
  }>;
  onPlayMode(mode: PlayMode): void;
  onMatchFormat(format: MatchFormatSelection): void;
  onSeriesGamesPlanned(games: MatchStartSeriesGames): void;
  onMatchCardPool(cardPool: MatchCardPoolSelection): void;
  onTraceRulesProfile(profile: TraceRulesProfile): void;
  onDisplayName(value: string): void;
  onHumanAiSideSelection(selection: HumanAiSideSelection): void;
  onRunnerDifficulty(difficulty: AiDifficulty): void;
  onCorpDifficulty(difficulty: AiDifficulty): void;
  onRunnerDeckSource(source: DeckSlotSource): void;
  onCorpDeckSource(source: DeckSlotSource): void;
  onSelectedRunnerSnapshotId(snapshotId: string): void;
  onSelectedCorpSnapshotId(snapshotId: string): void;
  onSelectedRunnerLocalDeckId(deckId: string): void;
  onSelectedCorpLocalDeckId(deckId: string): void;
  onReloadStandardDeckCatalog(): void;
  onCreateMatch(): void;
  onHumanSideSelection(selection: HumanSideSelection): void;
  onCountdownSeconds(seconds: 3 | 5 | 10): void;
  onIsPublic(isPublic: boolean): void;
  onPlayerClockMode(mode: MatchStartPlayerClockMode): void;
  onPlayerClockMinutes(minutes: MatchStartPlayerClockMinutes): void;
  onPlayerClockGraceSeconds(seconds: MatchStartPlayerClockGraceSeconds): void;
  onSeed(seed: string): void;
  onAiTraceStartMode(mode: AiTraceStartMode): void;
  onTestSetupMode(enabled: boolean): void;
  onAiDeckPolicy(policy: AiDeckPolicy): void;
  onParticipantBRunnerDeckSource(source: DeckSlotSource): void;
  onParticipantBCorpDeckSource(source: DeckSlotSource): void;
  onSelectedParticipantBRunnerSnapshotId(snapshotId: string): void;
  onSelectedParticipantBCorpSnapshotId(snapshotId: string): void;
  onSelectedParticipantBRunnerLocalDeckId(deckId: string): void;
  onSelectedParticipantBCorpLocalDeckId(deckId: string): void;
}) {
  const isAiVsAiSeries =
    gameMode === "ai_vs_ai" && matchFormat === "two_game_side_swap";
  return (
    <div className="matchStartConsole">
      <section
        className={`matchStartIdentity ${identityKind}`}
        aria-label={
          gameMode === "ai_vs_ai" ? "Beobachterprofil" : "Spielerprofil"
        }
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
                ? "Account-Anzeigename"
                : gameMode === "ai_vs_ai"
                  ? "Beobachtername"
                  : "Gastname"}
            </span>
            <span className={`playerIdentityBadge ${identityKind}`}>
              {identityKind === "account" ? "Account" : "Gast"}
            </span>
          </span>
          <input
            value={displayName}
            onChange={(event) => onDisplayName(event.target.value)}
            aria-label="Name"
            readOnly={identityKind === "account"}
            autoComplete="nickname"
            maxLength={80}
          />
          <small>
            {identityKind === "account"
              ? "Der Anzeigename deines angemeldeten Accounts wird für Lobby, Spiel und Ergebnis verwendet."
              : gameMode === "ai_vs_ai"
                ? "Kennzeichnet deine lokale Beobachtersitzung."
                : "Der frei gewählte Gastname erscheint in Lobby, Spiel und Ergebnis."}
          </small>
        </label>
      </section>
      <MatchStartChoiceSections
        playMode={playMode}
        matchFormat={matchFormat}
        seriesGamesPlanned={seriesGamesPlanned}
        matchCardPool={matchCardPool}
        onPlayMode={onPlayMode}
        onMatchFormat={onMatchFormat}
        onSeriesGamesPlanned={onSeriesGamesPlanned}
        onMatchCardPool={onMatchCardPool}
      />
      <div className="formGrid primaryStartGrid">
        {isHumanVsHuman || isHumanVsAi ? (
          <SideSelectionField
            label={isHumanVsHuman ? "Deine Startseite" : "Deine Seite"}
            value={isHumanVsHuman ? humanSideSelection : humanAiSideSelection}
            onChange={(selection) => {
              if (isHumanVsHuman) onHumanSideSelection(selection);
              else onHumanAiSideSelection(selection);
            }}
          />
        ) : null}
        {gameMode === "ai_vs_ai" ? (
          <label>
            {isAiVsAiSeries ? "KI A · startet als Runner" : "Runner-KI"}
            <select
              value={runnerDifficulty}
              onChange={(event) =>
                onRunnerDifficulty(event.target.value as AiDifficulty)
              }
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
        {gameMode === "ai_vs_ai" ? (
          <label>
            {isAiVsAiSeries ? "KI B · startet als Korp" : "Korp-KI"}
            <select
              value={corpDifficulty}
              onChange={(event) =>
                onCorpDifficulty(event.target.value as AiDifficulty)
              }
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
      </div>
      {gameMode !== "ai_vs_ai" || aiDeckPolicyUsesPrimaryDeckSlots ? (
        <div className="deckSlotGrid">
          <StandardDeckCatalogStatus
            state={standardDeckCatalogState}
            onRetry={onReloadStandardDeckCatalog}
          />
          <DeckSlotSelect
            label={
              gameMode === "ai_vs_ai"
                ? `${isAiVsAiSeries ? "KI A" : "Runner-KI"} · Runner-Deck`
                : "Dein Runner-Deck"
            }
            side="runner"
            snapshots={runnerSnapshots}
            localDecks={localDecks.filter((deck) => deck.side === "runner")}
            source={runnerDeckSource}
            selectedSnapshotId={selectedRunnerSnapshotId}
            selectedLocalDeckId={selectedRunnerLocalDeckId}
            onSource={onRunnerDeckSource}
            onSnapshot={onSelectedRunnerSnapshotId}
            onLocalDeck={onSelectedRunnerLocalDeckId}
          />
          <DeckSlotSelect
            label={
              gameMode === "ai_vs_ai"
                ? `${isAiVsAiSeries ? "KI A" : "Korp-KI"} · Korp-Deck`
                : "Dein Korp-Deck"
            }
            side="corp"
            snapshots={corpSnapshots}
            localDecks={localDecks.filter((deck) => deck.side === "corp")}
            source={corpDeckSource}
            selectedSnapshotId={selectedCorpSnapshotId}
            selectedLocalDeckId={selectedCorpLocalDeckId}
            onSource={onCorpDeckSource}
            onSnapshot={onSelectedCorpSnapshotId}
            onLocalDeck={onSelectedCorpLocalDeckId}
          />
          {isHumanVsHuman && !testSetupMode ? (
            <p className="deckHandshakeHint">
              Teilnehmer B wählt eigene Decks beim Beitritt.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="matchStartSummary" data-testid="match-start-summary">
        {startSummary.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <button
        className="button primary wide"
        onClick={onCreateMatch}
        data-testid="create-match"
        {...FIREFOX_DISABLED_STATE_RESET_PROPS}
        disabled={standardDeckCatalogBlocksStart}
        title={
          standardDeckCatalogBlocksStart
            ? "Standarddecks konnten nicht geladen werden. Wähle zwei persönliche Decks oder lade den Katalog erneut."
            : undefined
        }
      >
        {gameMode === "ai_vs_ai" ? <Bot size={16} /> : <UserPlus size={16} />}
        {gameMode === "ai_vs_ai"
          ? "Simulation beobachten"
          : isHumanVsHuman
            ? "Lobby erstellen"
            : "Match erstellen"}
      </button>
      <MatchStartAdvancedOptions
        isHumanVsHuman={isHumanVsHuman}
        isHumanVsAi={isHumanVsAi}
        isAiVsAi={gameMode === "ai_vs_ai"}
        isAiVsAiSeries={isAiVsAiSeries}
        hasAiOpponent={hasAiOpponent}
        matchCardPool={matchCardPool}
        traceRulesProfile={traceRulesProfile}
        humanAiSideSelection={humanAiSideSelection}
        countdownSeconds={countdownSeconds}
        isPublic={isPublic}
        playerClockMode={playerClockMode}
        playerClockMinutes={playerClockMinutes}
        playerClockGraceSeconds={playerClockGraceSeconds}
        playerClockDetailControlsDisabled={playerClockDetailControlsDisabled}
        seed={seed}
        aiTraceStartMode={aiTraceStartMode}
        testSetupMode={testSetupMode}
        runnerDifficulty={runnerDifficulty}
        corpDifficulty={corpDifficulty}
        aiDeckPolicy={aiDeckPolicy}
        runnerSnapshots={runnerSnapshots}
        corpSnapshots={corpSnapshots}
        localDecks={localDecks}
        participantBRunnerDeckSource={participantBRunnerDeckSource}
        participantBCorpDeckSource={participantBCorpDeckSource}
        selectedParticipantBRunnerSnapshotId={
          selectedParticipantBRunnerSnapshotId
        }
        selectedParticipantBCorpSnapshotId={selectedParticipantBCorpSnapshotId}
        selectedParticipantBRunnerLocalDeckId={
          selectedParticipantBRunnerLocalDeckId
        }
        selectedParticipantBCorpLocalDeckId={
          selectedParticipantBCorpLocalDeckId
        }
        aiSlotDisabled={aiSlotDisabled}
        onCountdownSeconds={onCountdownSeconds}
        onIsPublic={onIsPublic}
        onTraceRulesProfile={onTraceRulesProfile}
        onPlayerClockMode={onPlayerClockMode}
        onPlayerClockMinutes={onPlayerClockMinutes}
        onPlayerClockGraceSeconds={onPlayerClockGraceSeconds}
        onSeed={onSeed}
        onAiTraceStartMode={onAiTraceStartMode}
        onTestSetupMode={onTestSetupMode}
        onRunnerDifficulty={onRunnerDifficulty}
        onCorpDifficulty={onCorpDifficulty}
        onAiDeckPolicy={onAiDeckPolicy}
        onParticipantBRunnerDeckSource={onParticipantBRunnerDeckSource}
        onParticipantBCorpDeckSource={onParticipantBCorpDeckSource}
        onSelectedParticipantBRunnerSnapshotId={
          onSelectedParticipantBRunnerSnapshotId
        }
        onSelectedParticipantBCorpSnapshotId={
          onSelectedParticipantBCorpSnapshotId
        }
        onSelectedParticipantBRunnerLocalDeckId={
          onSelectedParticipantBRunnerLocalDeckId
        }
        onSelectedParticipantBCorpLocalDeckId={
          onSelectedParticipantBCorpLocalDeckId
        }
      />
      <DeckMetadataLine entries={visibleDeckMetadataEntries} />
    </div>
  );
}

function SideSelectionField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HumanSideSelection;
  onChange(selection: HumanSideSelection): void;
}) {
  const Icon = value === "runner" ? Zap : value === "corp" ? Building2 : Dices;
  const detail =
    value === "runner"
      ? "Du beginnst als Runner."
      : value === "corp"
        ? "Du beginnst als Korp."
        : "Die erste Seite wird beim Start ausgelost.";
  return (
    <label className={`sideSelectionField side-${value}`}>
      <span>{label}</span>
      <span className="sideSelectionControl">
        <span className="sideSelectionIcon" aria-hidden="true">
          <Icon size={19} />
        </span>
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value as HumanSideSelection)
          }
          aria-label={label}
        >
          <option value="random">◆ Zufällig auslosen</option>
          <option value="runner">↗ Runner</option>
          <option value="corp">▣ Korp</option>
        </select>
      </span>
      <small>{detail}</small>
    </label>
  );
}
