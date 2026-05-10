import { describe, expect, it } from "vitest";
import { parseMatchStartSettingsFromStorage, serializeMatchStartSettingsForStorage, type MatchStartStorageSettings } from "./match-start-storage";

const settings: MatchStartStorageSettings = {
  mode: "host",
  playMode: "human_vs_ai",
  humanSideSelection: "random",
  humanAiSideSelection: "corp",
  matchFormat: "two_game_side_swap",
  runnerDifficulty: "normal",
  corpDifficulty: "hard",
  aiDeckPolicy: "selected",
  testSetupMode: true,
  countdownSeconds: 10,
  seed: "seed-v1",
  runnerDeckSource: "local",
  corpDeckSource: "snapshot",
  participantBRunnerDeckSource: "snapshot",
  participantBCorpDeckSource: "local",
  selectedRunnerSnapshotId: "runner_snapshot",
  selectedCorpSnapshotId: "corp_snapshot",
  selectedParticipantBRunnerSnapshotId: "runner_snapshot_b",
  selectedParticipantBCorpSnapshotId: "corp_snapshot_b",
  selectedRunnerLocalDeckId: "runner_local",
  selectedCorpLocalDeckId: "corp_local",
  selectedParticipantBRunnerLocalDeckId: "runner_local_b",
  selectedParticipantBCorpLocalDeckId: "corp_local_b"
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
    expect(parseMatchStartSettingsFromStorage(JSON.stringify({ v: 2, playMode: "human_vs_ai" }))).toBeNull();
  });

  it("keeps valid fields and drops invalid values", () => {
    const parsed = parseMatchStartSettingsFromStorage(
      JSON.stringify({
        v: 1,
        mode: "join",
        playMode: "human_vs_ai",
        humanAiSideSelection: "runner",
        matchFormat: "invalid",
        aiDeckPolicy: "seeded_random",
        countdownSeconds: 7,
        selectedRunnerLocalDeckId: 42,
        selectedCorpLocalDeckId: "corp_local_ok",
        joinToken: "must_not_exist_here"
      })
    );

    expect(parsed).toEqual({
      mode: "join",
      playMode: "human_vs_ai",
      humanAiSideSelection: "runner",
      aiDeckPolicy: "seeded_random",
      selectedCorpLocalDeckId: "corp_local_ok"
    });
  });

  it("stores no session or token fields in the JSON schema", () => {
    const serialized = serializeMatchStartSettingsForStorage(settings);
    expect(serialized).not.toMatch(/sessionToken|reconnectToken|joinToken|hostSessionToken|hostReconnectToken/i);
  });
});
