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
import { useTranslations } from "use-intl/react";

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
  onOpenStandardDeck,
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
  onOpenStandardDeck(standardDeckId: string): void;
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
  const t = useTranslations("MatchStart.host");
  const isAiVsAiSeries =
    gameMode === "ai_vs_ai" && matchFormat === "two_game_side_swap";
  const localizedStartSummary = [
    t(`summary.playMode.${playMode}`),
    playMode === "human_vs_human"
      ? humanSideSelection === "random"
        ? t("summary.sideRandom")
        : t("summary.startsAs", {
            side: t(`summary.side.${humanSideSelection}`),
          })
      : playMode === "human_vs_ai"
        ? humanAiSideSelection === "random"
          ? t("summary.yourSideRandom")
          : t("summary.playsAs", {
              side: t(`summary.side.${humanAiSideSelection}`),
            })
        : t("summary.aiVsAi"),
    matchFormat === "two_game_side_swap"
      ? t("summary.series", { count: seriesGamesPlanned })
      : matchFormat === "fixed_pairing_repeat"
        ? t("summary.fixedPairingRepeat", { count: seriesGamesPlanned })
        : t("summary.rulesMatch"),
    t(`summary.cardPool.${matchCardPool}`),
    playMode === "human_vs_human"
      ? testSetupMode
        ? t("summary.testSetup")
        : t("summary.joinerDecks")
      : playMode === "human_vs_ai"
        ? t(`summary.aiPolicy.${aiDeckPolicy}`)
        : t(`summary.simulationPolicy.${aiDeckPolicy}`),
  ];
  return (
    <div className="matchStartConsole">
      <section
        className={`matchStartIdentity ${identityKind}`}
        aria-label={
          gameMode === "ai_vs_ai" ? t("observerProfile") : t("playerProfile")
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
                ? t("accountDisplayName")
                : gameMode === "ai_vs_ai"
                  ? t("observerName")
                  : t("guestName")}
            </span>
            <span className={`playerIdentityBadge ${identityKind}`}>
              {identityKind === "account" ? t("account") : t("guest")}
            </span>
          </span>
          <input
            value={displayName}
            onChange={(event) => onDisplayName(event.target.value)}
            aria-label={t("name")}
            readOnly={identityKind === "account"}
            autoComplete="nickname"
            maxLength={80}
          />
          <small>
            {identityKind === "account"
              ? t("accountNameHelp")
              : gameMode === "ai_vs_ai"
                ? t("observerNameHelp")
                : t("guestNameHelp")}
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
            label={isHumanVsHuman ? t("startingSide") : t("yourSide")}
            value={isHumanVsHuman ? humanSideSelection : humanAiSideSelection}
            onChange={(selection) => {
              if (isHumanVsHuman) onHumanSideSelection(selection);
              else onHumanAiSideSelection(selection);
            }}
          />
        ) : null}
        {gameMode === "ai_vs_ai" ? (
          <label>
            {isAiVsAiSeries ? t("aiAStartsRunner") : t("runnerAi")}
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
            {isAiVsAiSeries ? t("aiBStartsCorp") : t("corpAi")}
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
                ? t("aiRunnerDeck", {
                    ai: isAiVsAiSeries ? t("aiA") : t("runnerAi"),
                  })
                : t("yourRunnerDeck")
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
            onOpenStandardDeck={onOpenStandardDeck}
          />
          <DeckSlotSelect
            label={
              gameMode === "ai_vs_ai"
                ? t("aiCorpDeck", {
                    ai: isAiVsAiSeries ? t("aiA") : t("corpAi"),
                  })
                : t("yourCorpDeck")
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
            onOpenStandardDeck={onOpenStandardDeck}
          />
          {isHumanVsHuman && !testSetupMode ? (
            <p className="deckHandshakeHint">{t("participantBDeckHelp")}</p>
          ) : null}
        </div>
      ) : null}
      <div className="matchStartSummary" data-testid="match-start-summary">
        {localizedStartSummary.map((item) => (
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
          standardDeckCatalogBlocksStart ? t("catalogBlocksStart") : undefined
        }
      >
        {gameMode === "ai_vs_ai" ? <Bot size={16} /> : <UserPlus size={16} />}
        {gameMode === "ai_vs_ai"
          ? t("watchSimulation")
          : isHumanVsHuman
            ? t("createLobby")
            : t("createMatch")}
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
        onOpenStandardDeck={onOpenStandardDeck}
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
  const t = useTranslations("MatchStart.host");
  const Icon = value === "runner" ? Zap : value === "corp" ? Building2 : Dices;
  const detail =
    value === "runner"
      ? t("startsRunner")
      : value === "corp"
        ? t("startsCorp")
        : t("sideRandomized");
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
          <option value="random">◆ {t("randomSide")}</option>
          <option value="runner">↗ Runner</option>
          <option value="corp">▣ {t("corp")}</option>
        </select>
      </span>
      <small>{detail}</small>
    </label>
  );
}
