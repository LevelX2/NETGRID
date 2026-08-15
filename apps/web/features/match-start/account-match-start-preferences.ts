import type { DeckSnapshot } from "../decks/deck-api-types";
import type { DeckSlotSource } from "../decks/deck-slot-selection";
import {
  ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
  type AccountMatchStartDeckSelection,
  type AccountMatchStartPreferences,
} from "../account/account-match-start-preferences-client";
import type {
  HumanAiSideSelection,
  HumanSideSelection,
  MatchCardPoolSelection,
  MatchFormatSelection,
  MatchStartSeriesGames,
  PlayMode,
} from "../../app/match-start";
import type {
  MatchStartPlayerClockGraceSeconds,
  MatchStartPlayerClockMinutes,
  MatchStartPlayerClockMode,
} from "../../app/match-start-storage";
import type { TraceRulesProfile } from "@netgrid/shared";

export function accountMatchStartPreferencesFromUi(input: {
  playMode: PlayMode;
  humanSideSelection: HumanSideSelection;
  humanAiSideSelection: HumanAiSideSelection;
  matchFormat: MatchFormatSelection;
  seriesGamesPlanned: MatchStartSeriesGames;
  matchCardPool: MatchCardPoolSelection;
  traceRulesProfile: TraceRulesProfile;
  runnerDifficulty: "easy" | "normal" | "hard";
  corpDifficulty: "easy" | "normal" | "hard";
  aiDeckPolicy:
    | "fixed"
    | "selected"
    | "seeded_random"
    | "same_as_participant_a";
  countdownSeconds: 3 | 5 | 10;
  playerClockMode: MatchStartPlayerClockMode;
  playerClockMinutes: MatchStartPlayerClockMinutes;
  playerClockGraceSeconds: MatchStartPlayerClockGraceSeconds;
  runnerDeckSource: DeckSlotSource;
  corpDeckSource: DeckSlotSource;
  selectedRunnerSnapshotId: string;
  selectedCorpSnapshotId: string;
  selectedRunnerLocalDeckId: string;
  selectedCorpLocalDeckId: string;
  runnerSnapshots: readonly DeckSnapshot[];
  corpSnapshots: readonly DeckSnapshot[];
}): AccountMatchStartPreferences {
  const runnerDeck = deckSelection({
    source: input.runnerDeckSource,
    selectedSnapshotId: input.selectedRunnerSnapshotId,
    selectedLocalDeckId: input.selectedRunnerLocalDeckId,
    snapshots: input.runnerSnapshots,
  });
  const corpDeck = deckSelection({
    source: input.corpDeckSource,
    selectedSnapshotId: input.selectedCorpSnapshotId,
    selectedLocalDeckId: input.selectedCorpLocalDeckId,
    snapshots: input.corpSnapshots,
  });
  return {
    schemaVersion: ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
    playMode: input.playMode,
    humanSideSelection: input.humanSideSelection,
    humanAiSideSelection: input.humanAiSideSelection,
    matchFormat: input.matchFormat,
    seriesGamesPlanned: input.seriesGamesPlanned,
    matchCardPool: input.matchCardPool,
    traceRulesProfile: input.traceRulesProfile,
    runnerDifficulty: input.runnerDifficulty,
    corpDifficulty: input.corpDifficulty,
    aiDeckPolicy: input.aiDeckPolicy,
    countdownSeconds: input.countdownSeconds,
    playerClockMode: input.playerClockMode,
    playerClockMinutes: input.playerClockMinutes,
    playerClockGraceSeconds: input.playerClockGraceSeconds,
    ...(runnerDeck ? { runnerDeck } : {}),
    ...(corpDeck ? { corpDeck } : {}),
  };
}

function deckSelection(input: {
  source: DeckSlotSource;
  selectedSnapshotId: string;
  selectedLocalDeckId: string;
  snapshots: readonly DeckSnapshot[];
}): AccountMatchStartDeckSelection | undefined {
  if (input.source === "random_standard") return { kind: "random_standard" };
  if (input.source === "local" && input.selectedLocalDeckId)
    return { kind: "account", cloudDeckId: input.selectedLocalDeckId };
  const standard = input.snapshots.find(
    (snapshot) => snapshot.deckSnapshotId === input.selectedSnapshotId,
  );
  return standard
    ? { kind: "standard", standardDeckId: standard.sourceDeckId }
    : undefined;
}
