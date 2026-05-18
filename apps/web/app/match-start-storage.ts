import type { HumanAiSideSelection, HumanSideSelection, MatchFormatSelection, PlayMode } from "./match-start";

export type MatchStartMode = "host" | "join";
export type MatchStartDeckSource = "snapshot" | "local";
export type MatchStartAiDifficulty = "easy" | "normal" | "hard";
export type MatchStartAiDeckPolicy = "fixed" | "selected" | "seeded_random";
export type MatchStartCountdownSeconds = 3 | 5 | 10;
export type MatchStartPlayerClockMode = "none" | "player_clock";
export type MatchStartPlayerClockMinutes = 5 | 10 | 15 | 20 | 30 | 45;
export type MatchStartPlayerClockGraceSeconds = 0 | 5 | 10 | 15 | 30;

export type MatchStartStorageSettings = {
  mode: MatchStartMode;
  playMode: PlayMode;
  humanSideSelection: HumanSideSelection;
  humanAiSideSelection: HumanAiSideSelection;
  matchFormat: MatchFormatSelection;
  runnerDifficulty: MatchStartAiDifficulty;
  corpDifficulty: MatchStartAiDifficulty;
  aiDeckPolicy: MatchStartAiDeckPolicy;
  testSetupMode: boolean;
  countdownSeconds: MatchStartCountdownSeconds;
  playerClockMode: MatchStartPlayerClockMode;
  playerClockMinutes: MatchStartPlayerClockMinutes;
  playerClockGraceSeconds: MatchStartPlayerClockGraceSeconds;
  seed: string;
  runnerDeckSource: MatchStartDeckSource;
  corpDeckSource: MatchStartDeckSource;
  participantBRunnerDeckSource: MatchStartDeckSource;
  participantBCorpDeckSource: MatchStartDeckSource;
  selectedRunnerSnapshotId: string;
  selectedCorpSnapshotId: string;
  selectedParticipantBRunnerSnapshotId: string;
  selectedParticipantBCorpSnapshotId: string;
  selectedRunnerLocalDeckId: string;
  selectedCorpLocalDeckId: string;
  selectedParticipantBRunnerLocalDeckId: string;
  selectedParticipantBCorpLocalDeckId: string;
};

type MatchStartStorageRecord = MatchStartStorageSettings & { v: 1 };

export function serializeMatchStartSettingsForStorage(settings: MatchStartStorageSettings): string {
  const record: MatchStartStorageRecord = {
    v: 1,
    ...settings
  };
  return JSON.stringify(record);
}

export function parseMatchStartSettingsFromStorage(raw: string | null): Partial<MatchStartStorageSettings> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MatchStartStorageRecord>;
    if (parsed.v !== 1) return null;
    const next: Partial<MatchStartStorageSettings> = {};
    if (isMatchStartMode(parsed.mode)) next.mode = parsed.mode;
    if (isPlayMode(parsed.playMode)) next.playMode = parsed.playMode;
    if (isHumanSideSelection(parsed.humanSideSelection)) next.humanSideSelection = parsed.humanSideSelection;
    if (isHumanAiSideSelection(parsed.humanAiSideSelection)) next.humanAiSideSelection = parsed.humanAiSideSelection;
    if (isMatchFormatSelection(parsed.matchFormat)) next.matchFormat = parsed.matchFormat;
    if (isMatchStartAiDifficulty(parsed.runnerDifficulty)) next.runnerDifficulty = parsed.runnerDifficulty;
    if (isMatchStartAiDifficulty(parsed.corpDifficulty)) next.corpDifficulty = parsed.corpDifficulty;
    if (isMatchStartAiDeckPolicy(parsed.aiDeckPolicy)) next.aiDeckPolicy = parsed.aiDeckPolicy;
    if (typeof parsed.testSetupMode === "boolean") next.testSetupMode = parsed.testSetupMode;
    if (isMatchStartCountdownSeconds(parsed.countdownSeconds)) next.countdownSeconds = parsed.countdownSeconds;
    if (isMatchStartPlayerClockMode(parsed.playerClockMode)) next.playerClockMode = parsed.playerClockMode;
    if (isMatchStartPlayerClockMinutes(parsed.playerClockMinutes)) next.playerClockMinutes = parsed.playerClockMinutes;
    if (isMatchStartPlayerClockGraceSeconds(parsed.playerClockGraceSeconds)) next.playerClockGraceSeconds = parsed.playerClockGraceSeconds;
    if (typeof parsed.seed === "string") next.seed = parsed.seed;
    if (isMatchStartDeckSource(parsed.runnerDeckSource)) next.runnerDeckSource = parsed.runnerDeckSource;
    if (isMatchStartDeckSource(parsed.corpDeckSource)) next.corpDeckSource = parsed.corpDeckSource;
    if (isMatchStartDeckSource(parsed.participantBRunnerDeckSource)) next.participantBRunnerDeckSource = parsed.participantBRunnerDeckSource;
    if (isMatchStartDeckSource(parsed.participantBCorpDeckSource)) next.participantBCorpDeckSource = parsed.participantBCorpDeckSource;
    if (typeof parsed.selectedRunnerSnapshotId === "string") next.selectedRunnerSnapshotId = parsed.selectedRunnerSnapshotId;
    if (typeof parsed.selectedCorpSnapshotId === "string") next.selectedCorpSnapshotId = parsed.selectedCorpSnapshotId;
    if (typeof parsed.selectedParticipantBRunnerSnapshotId === "string") next.selectedParticipantBRunnerSnapshotId = parsed.selectedParticipantBRunnerSnapshotId;
    if (typeof parsed.selectedParticipantBCorpSnapshotId === "string") next.selectedParticipantBCorpSnapshotId = parsed.selectedParticipantBCorpSnapshotId;
    if (typeof parsed.selectedRunnerLocalDeckId === "string") next.selectedRunnerLocalDeckId = parsed.selectedRunnerLocalDeckId;
    if (typeof parsed.selectedCorpLocalDeckId === "string") next.selectedCorpLocalDeckId = parsed.selectedCorpLocalDeckId;
    if (typeof parsed.selectedParticipantBRunnerLocalDeckId === "string") next.selectedParticipantBRunnerLocalDeckId = parsed.selectedParticipantBRunnerLocalDeckId;
    if (typeof parsed.selectedParticipantBCorpLocalDeckId === "string") next.selectedParticipantBCorpLocalDeckId = parsed.selectedParticipantBCorpLocalDeckId;
    return next;
  } catch {
    return null;
  }
}

function isPlayMode(value: unknown): value is PlayMode {
  return value === "human_vs_human" || value === "human_vs_ai" || value === "ai_vs_ai";
}

function isMatchStartMode(value: unknown): value is MatchStartMode {
  return value === "host" || value === "join";
}

function isHumanSideSelection(value: unknown): value is HumanSideSelection {
  return value === "runner" || value === "corp" || value === "random";
}

function isHumanAiSideSelection(value: unknown): value is HumanAiSideSelection {
  return value === "runner" || value === "corp" || value === "random";
}

function isMatchFormatSelection(value: unknown): value is MatchFormatSelection {
  return value === "rules_match" || value === "two_game_side_swap";
}

function isMatchStartAiDifficulty(value: unknown): value is MatchStartAiDifficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

function isMatchStartAiDeckPolicy(value: unknown): value is MatchStartAiDeckPolicy {
  return value === "fixed" || value === "selected" || value === "seeded_random";
}

function isMatchStartCountdownSeconds(value: unknown): value is MatchStartCountdownSeconds {
  return value === 3 || value === 5 || value === 10;
}

function isMatchStartPlayerClockMode(value: unknown): value is MatchStartPlayerClockMode {
  return value === "none" || value === "player_clock";
}

function isMatchStartPlayerClockMinutes(value: unknown): value is MatchStartPlayerClockMinutes {
  return value === 5 || value === 10 || value === 15 || value === 20 || value === 30 || value === 45;
}

function isMatchStartPlayerClockGraceSeconds(value: unknown): value is MatchStartPlayerClockGraceSeconds {
  return value === 0 || value === 5 || value === 10 || value === 15 || value === 30;
}

function isMatchStartDeckSource(value: unknown): value is MatchStartDeckSource {
  return value === "snapshot" || value === "local";
}
