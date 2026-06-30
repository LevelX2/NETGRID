"use client";

import { Bot, UserPlus } from "lucide-react";

import {
  humanAiSideLabel,
  type HumanAiSideSelection,
  type HumanSideSelection,
  type MatchCardPoolSelection,
  type MatchFormatSelection,
  type PlayMode
} from "../../app/match-start";
import type {
  MatchStartPlayerClockGraceSeconds,
  MatchStartPlayerClockMinutes,
  MatchStartPlayerClockMode
} from "../../app/match-start-storage";
import { DeckMetadataLine, DeckSlotSelect } from "../decks/DeckSelectionControls";
import { SimulationResult, type AiSimulationSummary } from "../results/SimulationResult";
import { MatchStartAdvancedOptions } from "./MatchStartAdvancedOptions";
import { MatchStartChoiceSections } from "./MatchStartChoiceSections";

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

export function MatchHostConsole({
  playMode,
  matchFormat,
  matchCardPool,
  displayName,
  isHumanVsAi,
  humanAiSideSelection,
  gameMode,
  runnerDifficulty,
  corpDifficulty,
  aiDeckPolicyUsesPrimaryDeckSlots,
  runnerSnapshots,
  corpSnapshots,
  localDecks,
  runnerDeckSource,
  corpDeckSource,
  selectedRunnerSnapshotId,
  selectedCorpSnapshotId,
  selectedRunnerLocalDeckId,
  selectedCorpLocalDeckId,
  isHumanVsHuman,
  testSetupMode,
  startSummary,
  simulationPending,
  simulationStatusText,
  hasAiOpponent,
  humanSideSelection,
  countdownSeconds,
  discoverableInLan,
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
  simulation,
  onPlayMode,
  onMatchFormat,
  onMatchCardPool,
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
  onCreateMatch,
  onHumanSideSelection,
  onCountdownSeconds,
  onDiscoverableInLan,
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
  onSelectedParticipantBCorpLocalDeckId
}: {
  playMode: PlayMode;
  matchFormat: MatchFormatSelection;
  matchCardPool: MatchCardPoolSelection;
  displayName: string;
  isHumanVsAi: boolean;
  humanAiSideSelection: HumanAiSideSelection;
  gameMode: string;
  runnerDifficulty: AiDifficulty;
  corpDifficulty: AiDifficulty;
  aiDeckPolicyUsesPrimaryDeckSlots: boolean;
  runnerSnapshots: MatchStartDeckSnapshot[];
  corpSnapshots: MatchStartDeckSnapshot[];
  localDecks: MatchStartLocalDeck[];
  runnerDeckSource: DeckSlotSource;
  corpDeckSource: DeckSlotSource;
  selectedRunnerSnapshotId: string;
  selectedCorpSnapshotId: string;
  selectedRunnerLocalDeckId: string;
  selectedCorpLocalDeckId: string;
  isHumanVsHuman: boolean;
  testSetupMode: boolean;
  startSummary: string[];
  simulationPending: boolean;
  simulationStatusText: string;
  hasAiOpponent: boolean;
  humanSideSelection: HumanSideSelection;
  countdownSeconds: 3 | 5 | 10;
  discoverableInLan: boolean;
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
  visibleDeckMetadataEntries: Array<{ label: string; metadata: { deckName: string } | undefined }>;
  simulation: AiSimulationSummary | null;
  onPlayMode(mode: PlayMode): void;
  onMatchFormat(format: MatchFormatSelection): void;
  onMatchCardPool(cardPool: MatchCardPoolSelection): void;
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
  onCreateMatch(): void;
  onHumanSideSelection(selection: HumanSideSelection): void;
  onCountdownSeconds(seconds: 3 | 5 | 10): void;
  onDiscoverableInLan(discoverable: boolean): void;
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
  return (
    <div className="matchStartConsole">
      <MatchStartChoiceSections
        playMode={playMode}
        matchFormat={matchFormat}
        matchCardPool={matchCardPool}
        onPlayMode={onPlayMode}
        onMatchFormat={onMatchFormat}
        onMatchCardPool={onMatchCardPool}
      />
      <div className="formGrid primaryStartGrid">
        <label>
          Name
          <input value={displayName} onChange={(event) => onDisplayName(event.target.value)} />
        </label>
        {isHumanVsAi ? (
          <label>
            Deine Seite
            <select value={humanAiSideSelection} onChange={(event) => onHumanAiSideSelection(event.target.value as HumanAiSideSelection)}>
              <option value="random">{humanAiSideLabel("random")}</option>
              <option value="runner">{humanAiSideLabel("runner")}</option>
              <option value="corp">{humanAiSideLabel("corp")}</option>
            </select>
          </label>
        ) : null}
        {gameMode === "ai_vs_ai" ? (
          <label>
            Runner-KI
            <select value={runnerDifficulty} onChange={(event) => onRunnerDifficulty(event.target.value as AiDifficulty)}>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
        {gameMode === "ai_vs_ai" ? (
          <label>
            Korp-KI
            <select value={corpDifficulty} onChange={(event) => onCorpDifficulty(event.target.value as AiDifficulty)}>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
      </div>
      {gameMode !== "ai_vs_ai" || aiDeckPolicyUsesPrimaryDeckSlots ? (
        <div className="deckSlotGrid">
          <DeckSlotSelect
            label={gameMode === "ai_vs_ai" ? "Runner-KI · Runner-Deck" : "Teilnehmer A · Runner-Deck"}
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
            label={gameMode === "ai_vs_ai" ? "Korp-KI · Korp-Deck" : "Teilnehmer A · Korp-Deck"}
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
            <p className="deckHandshakeHint">Teilnehmer B wählt eigene Decks beim Beitritt.</p>
          ) : null}
        </div>
      ) : null}
      <div className="matchStartSummary" data-testid="match-start-summary">
        {startSummary.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <button className="button primary wide" onClick={onCreateMatch} data-testid="create-match" disabled={simulationPending}>
        {gameMode === "ai_vs_ai" ? <Bot size={16} /> : <UserPlus size={16} />}
        {gameMode === "ai_vs_ai" ? (simulationPending ? "Simulation läuft" : "Simulation starten") : isHumanVsHuman ? "Lobby erstellen" : "Match erstellen"}
      </button>
      {simulationStatusText ? (
        <p className="notice startFeedback" role="status" aria-live="polite">
          {simulationStatusText}
        </p>
      ) : null}
      <MatchStartAdvancedOptions
        isHumanVsHuman={isHumanVsHuman}
        isHumanVsAi={isHumanVsAi}
        hasAiOpponent={hasAiOpponent}
        humanSideSelection={humanSideSelection}
        humanAiSideSelection={humanAiSideSelection}
        countdownSeconds={countdownSeconds}
        discoverableInLan={discoverableInLan}
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
        selectedParticipantBRunnerSnapshotId={selectedParticipantBRunnerSnapshotId}
        selectedParticipantBCorpSnapshotId={selectedParticipantBCorpSnapshotId}
        selectedParticipantBRunnerLocalDeckId={selectedParticipantBRunnerLocalDeckId}
        selectedParticipantBCorpLocalDeckId={selectedParticipantBCorpLocalDeckId}
        aiSlotDisabled={aiSlotDisabled}
        onHumanSideSelection={onHumanSideSelection}
        onCountdownSeconds={onCountdownSeconds}
        onDiscoverableInLan={onDiscoverableInLan}
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
        onSelectedParticipantBRunnerSnapshotId={onSelectedParticipantBRunnerSnapshotId}
        onSelectedParticipantBCorpSnapshotId={onSelectedParticipantBCorpSnapshotId}
        onSelectedParticipantBRunnerLocalDeckId={onSelectedParticipantBRunnerLocalDeckId}
        onSelectedParticipantBCorpLocalDeckId={onSelectedParticipantBCorpLocalDeckId}
      />
      <DeckMetadataLine entries={visibleDeckMetadataEntries} />
      {simulation ? <SimulationResult summary={simulation} /> : null}
    </div>
  );
}
