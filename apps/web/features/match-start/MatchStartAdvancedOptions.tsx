"use client";

import { SlidersHorizontal } from "lucide-react";

import {
  humanAiSideLabel,
  sideSelectionLabel,
  type HumanAiSideSelection,
  type HumanSideSelection
} from "../../app/match-start";
import type {
  MatchStartPlayerClockGraceSeconds,
  MatchStartPlayerClockMinutes,
  MatchStartPlayerClockMode
} from "../../app/match-start-storage";
import { DeckSlotSelect } from "../decks/DeckSelectionControls";

type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy = "fixed" | "selected" | "seeded_random" | "same_as_participant_a";
type AiTraceStartMode = "off" | "detailed";
type DeckSlotSource = "snapshot" | "local";

type MatchStartDeckSnapshot = {
  deckSnapshotId: string;
  name: string;
};

type MatchStartLocalDeck = {
  deckId: string;
  name: string;
  side: "runner" | "corp";
};

export function MatchStartAdvancedOptions({
  isHumanVsHuman,
  isHumanVsAi,
  hasAiOpponent,
  humanSideSelection,
  humanAiSideSelection,
  countdownSeconds,
  discoverableInLan,
  playerClockMode,
  playerClockMinutes,
  playerClockGraceSeconds,
  playerClockDetailControlsDisabled,
  seed,
  aiTraceStartMode,
  testSetupMode,
  runnerDifficulty,
  corpDifficulty,
  aiDeckPolicy,
  runnerSnapshots,
  corpSnapshots,
  localDecks,
  participantBRunnerDeckSource,
  participantBCorpDeckSource,
  selectedParticipantBRunnerSnapshotId,
  selectedParticipantBCorpSnapshotId,
  selectedParticipantBRunnerLocalDeckId,
  selectedParticipantBCorpLocalDeckId,
  aiSlotDisabled,
  onHumanSideSelection,
  onCountdownSeconds,
  onDiscoverableInLan,
  onPlayerClockMode,
  onPlayerClockMinutes,
  onPlayerClockGraceSeconds,
  onSeed,
  onAiTraceStartMode,
  onTestSetupMode,
  onRunnerDifficulty,
  onCorpDifficulty,
  onAiDeckPolicy,
  onParticipantBRunnerDeckSource,
  onParticipantBCorpDeckSource,
  onSelectedParticipantBRunnerSnapshotId,
  onSelectedParticipantBCorpSnapshotId,
  onSelectedParticipantBRunnerLocalDeckId,
  onSelectedParticipantBCorpLocalDeckId
}: {
  isHumanVsHuman: boolean;
  isHumanVsAi: boolean;
  hasAiOpponent: boolean;
  humanSideSelection: HumanSideSelection;
  humanAiSideSelection: HumanAiSideSelection;
  countdownSeconds: 3 | 5 | 10;
  discoverableInLan: boolean;
  playerClockMode: MatchStartPlayerClockMode;
  playerClockMinutes: MatchStartPlayerClockMinutes;
  playerClockGraceSeconds: MatchStartPlayerClockGraceSeconds;
  playerClockDetailControlsDisabled: boolean;
  seed: string;
  aiTraceStartMode: AiTraceStartMode;
  testSetupMode: boolean;
  runnerDifficulty: AiDifficulty;
  corpDifficulty: AiDifficulty;
  aiDeckPolicy: AiDeckPolicy;
  runnerSnapshots: MatchStartDeckSnapshot[];
  corpSnapshots: MatchStartDeckSnapshot[];
  localDecks: MatchStartLocalDeck[];
  participantBRunnerDeckSource: DeckSlotSource;
  participantBCorpDeckSource: DeckSlotSource;
  selectedParticipantBRunnerSnapshotId: string;
  selectedParticipantBCorpSnapshotId: string;
  selectedParticipantBRunnerLocalDeckId: string;
  selectedParticipantBCorpLocalDeckId: string;
  aiSlotDisabled: boolean;
  onHumanSideSelection(selection: HumanSideSelection): void;
  onCountdownSeconds(seconds: 3 | 5 | 10): void;
  onDiscoverableInLan(discoverable: boolean): void;
  onPlayerClockMode(mode: MatchStartPlayerClockMode): void;
  onPlayerClockMinutes(minutes: MatchStartPlayerClockMinutes): void;
  onPlayerClockGraceSeconds(seconds: MatchStartPlayerClockGraceSeconds): void;
  onSeed(seed: string): void;
  onAiTraceStartMode(mode: AiTraceStartMode): void;
  onTestSetupMode(enabled: boolean): void;
  onRunnerDifficulty(difficulty: AiDifficulty): void;
  onCorpDifficulty(difficulty: AiDifficulty): void;
  onAiDeckPolicy(policy: AiDeckPolicy): void;
  onParticipantBRunnerDeckSource(source: DeckSlotSource): void;
  onParticipantBCorpDeckSource(source: DeckSlotSource): void;
  onSelectedParticipantBRunnerSnapshotId(snapshotId: string): void;
  onSelectedParticipantBCorpSnapshotId(snapshotId: string): void;
  onSelectedParticipantBRunnerLocalDeckId(deckId: string): void;
  onSelectedParticipantBCorpLocalDeckId(deckId: string): void;
}) {
  return (
    <details className="advancedMatchOptions" data-testid="advanced-match-options">
      <summary>
        <SlidersHorizontal size={15} />
        Erweiterte Optionen
      </summary>
      <div className="formGrid advancedMatchGrid">
        {isHumanVsHuman ? (
          <label>
            Seitenzuteilung
            <select value={humanSideSelection} onChange={(event) => onHumanSideSelection(event.target.value as HumanSideSelection)}>
              <option value="random">{sideSelectionLabel("random")}</option>
              <option value="runner">{sideSelectionLabel("runner")}</option>
              <option value="corp">{sideSelectionLabel("corp")}</option>
            </select>
          </label>
        ) : null}
        {isHumanVsHuman ? (
          <label>
            Countdown
            <select value={countdownSeconds} onChange={(event) => onCountdownSeconds(Number(event.target.value) as 3 | 5 | 10)}>
              <option value={3}>3 Sekunden</option>
              <option value={5}>5 Sekunden</option>
              <option value={10}>10 Sekunden</option>
            </select>
          </label>
        ) : null}
        {isHumanVsHuman ? (
          <label className={`deckBuilderToggle ${discoverableInLan ? "checked" : ""}`}>
            <input checked={discoverableInLan} onChange={(event) => onDiscoverableInLan(event.target.checked)} type="checkbox" />
            In LAN-Liste sichtbar
          </label>
        ) : null}
        <label>
          Spielerzeit
          <select value={playerClockMode} onChange={(event) => onPlayerClockMode(event.target.value as MatchStartPlayerClockMode)}>
            <option value="none">Keine Zeitbegrenzung</option>
            <option value="player_clock">Zeitbegrenzung aktiv</option>
          </select>
        </label>
        <label>
          Zeit pro Seite
          <select value={playerClockMinutes} onChange={(event) => onPlayerClockMinutes(Number(event.target.value) as MatchStartPlayerClockMinutes)} disabled={playerClockDetailControlsDisabled}>
            <option value={5}>5 Minuten</option>
            <option value={10}>10 Minuten</option>
            <option value={15}>15 Minuten</option>
            <option value={20}>20 Minuten</option>
            <option value={30}>30 Minuten</option>
            <option value={45}>45 Minuten</option>
          </select>
        </label>
        <label>
          Kulanz je Entscheidung
          <select value={playerClockGraceSeconds} onChange={(event) => onPlayerClockGraceSeconds(Number(event.target.value) as MatchStartPlayerClockGraceSeconds)} disabled={playerClockDetailControlsDisabled}>
            <option value={0}>0 Sekunden</option>
            <option value={5}>5 Sekunden</option>
            <option value={10}>10 Sekunden</option>
            <option value={15}>15 Sekunden</option>
            <option value={30}>30 Sekunden</option>
          </select>
        </label>
        <label>
          Seed
          <input value={seed} onChange={(event) => onSeed(event.target.value)} />
        </label>
        {isHumanVsAi ? (
          <label className={`deckBuilderToggle matchStartTraceToggle ${aiTraceStartMode !== "off" ? "checked" : ""}`}>
            <input
              data-testid="match-start-ai-trace-toggle"
              checked={aiTraceStartMode !== "off"}
              onChange={(event) => onAiTraceStartMode(event.target.checked ? "detailed" : "off")}
              type="checkbox"
            />
            KI-Trace speichern
          </label>
        ) : null}
        {isHumanVsHuman ? (
          <label className={`deckBuilderToggle ${testSetupMode ? "checked" : ""}`}>
            <input checked={testSetupMode} onChange={(event) => onTestSetupMode(event.target.checked)} type="checkbox" />
            Testkonstellation · beide Teilnehmer festlegen
          </label>
        ) : null}
        {isHumanVsAi && humanAiSideSelection !== "runner" ? (
          <label>
            Runner-KI
            <select value={runnerDifficulty} onChange={(event) => onRunnerDifficulty(event.target.value as AiDifficulty)}>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
        {isHumanVsAi && humanAiSideSelection !== "corp" ? (
          <label>
            Korp-KI
            <select value={corpDifficulty} onChange={(event) => onCorpDifficulty(event.target.value as AiDifficulty)}>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
        {hasAiOpponent ? (
          <label>
            KI-Decks
            <select value={aiDeckPolicy} onChange={(event) => onAiDeckPolicy(event.target.value as AiDeckPolicy)}>
              <option value="selected">Explizit gewählte KI-Decks</option>
              <option value="same_as_participant_a">Gleiche Decks wie Teilnehmer A</option>
              <option value="fixed">Feste Standard-Decks</option>
              <option value="seeded_random">Deterministisch zufällig</option>
            </select>
          </label>
        ) : null}
      </div>
      {(isHumanVsHuman && testSetupMode) || (isHumanVsAi && aiDeckPolicy === "selected") ? (
        <div className="deckSlotGrid advancedDeckSlots">
          <>
            <DeckSlotSelect
              label={hasAiOpponent ? "KI · Runner-Deck" : "Teilnehmer B · Runner-Deck"}
              snapshots={runnerSnapshots}
              localDecks={localDecks.filter((deck) => deck.side === "runner")}
              source={participantBRunnerDeckSource}
              selectedSnapshotId={selectedParticipantBRunnerSnapshotId}
              selectedLocalDeckId={selectedParticipantBRunnerLocalDeckId}
              disabled={aiSlotDisabled}
              onSource={onParticipantBRunnerDeckSource}
              onSnapshot={onSelectedParticipantBRunnerSnapshotId}
              onLocalDeck={onSelectedParticipantBRunnerLocalDeckId}
            />
            <DeckSlotSelect
              label={hasAiOpponent ? "KI · Korp-Deck" : "Teilnehmer B · Korp-Deck"}
              snapshots={corpSnapshots}
              localDecks={localDecks.filter((deck) => deck.side === "corp")}
              source={participantBCorpDeckSource}
              selectedSnapshotId={selectedParticipantBCorpSnapshotId}
              selectedLocalDeckId={selectedParticipantBCorpLocalDeckId}
              disabled={aiSlotDisabled}
              onSource={onParticipantBCorpDeckSource}
              onSnapshot={onSelectedParticipantBCorpSnapshotId}
              onLocalDeck={onSelectedParticipantBCorpLocalDeckId}
            />
          </>
        </div>
      ) : null}
    </details>
  );
}
