import { describe, expect, it } from "vitest";
import {
  parseMatchStartSettingsFromStorage,
  serializeMatchStartSettingsForStorage,
  type MatchStartStorageSettings,
} from "./match-start-storage";

const settings: MatchStartStorageSettings = {
  mode: "host",
  playMode: "human_vs_ai",
  humanSideSelection: "random",
  humanAiSideSelection: "corp",
  matchFormat: "two_game_side_swap",
  seriesGamesPlanned: 5,
  matchCardPool: "originalset_classic_proteus",
  traceRulesProfile: "modern_open",
  runnerDifficulty: "normal",
  corpDifficulty: "hard",
  aiDeckPolicy: "selected",
  testSetupMode: true,
  countdownSeconds: 10,
  playerClockMode: "player_clock",
  playerClockMinutes: 20,
  playerClockGraceSeconds: 15,
  runnerDeckSource: "local",
  corpDeckSource: "snapshot",
  participantBRunnerDeckSource: "random_standard",
  participantBCorpDeckSource: "local",
  selectedRunnerSnapshotId: "runner_snapshot",
  selectedCorpSnapshotId: "corp_snapshot",
  selectedParticipantBRunnerSnapshotId: "runner_snapshot_b",
  selectedParticipantBCorpSnapshotId: "corp_snapshot_b",
  selectedRunnerLocalDeckId: "runner_local",
  selectedCorpLocalDeckId: "corp_local",
  selectedParticipantBRunnerLocalDeckId: "runner_local_b",
  selectedParticipantBCorpLocalDeckId: "corp_local_b",
};

describe("match start local settings storage", () => {
  it("roundtrips persisted match start settings", () => {
    const serialized = serializeMatchStartSettingsForStorage(settings);
    const parsed = parseMatchStartSettingsFromStorage(serialized);

    expect(parsed).toEqual(settings);
  });

  it("ignores malformed or incompatible storage payloads", () => {
    expect(parseMatchStartSettingsFromStorage(null)).toBeNull();
    expect(parseMatchStartSettingsFromStorage("{not-json")).toBeNull();
    expect(
      parseMatchStartSettingsFromStorage(
        JSON.stringify({ v: 2, playMode: "human_vs_ai" }),
      ),
    ).toBeNull();
  });

  it("keeps valid fields and drops invalid values", () => {
    const parsed = parseMatchStartSettingsFromStorage(
      JSON.stringify({
        v: 1,
        mode: "join",
        playMode: "human_vs_ai",
        humanAiSideSelection: "runner",
        matchFormat: "invalid",
        seriesGamesPlanned: 8,
        matchCardPool: "originalset_classic",
        playerClockMode: "player_clock",
        playerClockMinutes: 99,
        playerClockGraceSeconds: 30,
        aiDeckPolicy: "same_as_participant_a",
        runnerDeckSource: "random_standard",
        countdownSeconds: 7,
        selectedRunnerLocalDeckId: 42,
        selectedCorpLocalDeckId: "corp_local_ok",
        joinToken: "must_not_exist_here",
      }),
    );

    expect(parsed).toEqual({
      mode: "join",
      playMode: "human_vs_ai",
      humanAiSideSelection: "runner",
      matchCardPool: "originalset_classic",
      playerClockMode: "player_clock",
      playerClockGraceSeconds: 30,
      aiDeckPolicy: "same_as_participant_a",
      runnerDeckSource: "random_standard",
      selectedCorpLocalDeckId: "corp_local_ok",
    });
  });

  it("restores the repeated fixed-pairing format", () => {
    expect(
      parseMatchStartSettingsFromStorage(
        JSON.stringify({ v: 1, matchFormat: "fixed_pairing_repeat" }),
      ),
    ).toMatchObject({ matchFormat: "fixed_pairing_repeat" });
  });

  it("stores no session or token fields in the JSON schema", () => {
    const serialized = serializeMatchStartSettingsForStorage(settings);
    expect(serialized).not.toMatch(
      /seed|sessionToken|reconnectToken|joinToken|hostSessionToken|hostReconnectToken/i,
    );
  });

  it("ignores legacy persisted seeds so a reload cannot repeat a match seed", () => {
    const parsed = parseMatchStartSettingsFromStorage(
      JSON.stringify({ v: 1, seed: "stale-seed", playMode: "human_vs_ai" }),
    );

    expect(parsed).toEqual({ playMode: "human_vs_ai" });
  });
});
