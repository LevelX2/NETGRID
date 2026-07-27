import { describe, expect, it } from "vitest";
import { accountMatchStartPreferencesFromUi } from "./account-match-start-preferences";

describe("account match-start preference projection", () => {
  it("keeps only the allowed match-start configuration and durable deck references", () => {
    const preferences = accountMatchStartPreferencesFromUi({
      playMode: "human_vs_ai",
      humanSideSelection: "random",
      humanAiSideSelection: "runner",
      matchFormat: "two_game_side_swap",
      seriesGamesPlanned: 3,
      matchCardPool: "originalset_proteus",
      runnerDifficulty: "hard",
      corpDifficulty: "normal",
      aiDeckPolicy: "selected",
      countdownSeconds: 5,
      playerClockMode: "player_clock",
      playerClockMinutes: 20,
      playerClockGraceSeconds: 10,
      runnerDeckSource: "local",
      corpDeckSource: "snapshot",
      selectedRunnerSnapshotId: "ignored",
      selectedCorpSnapshotId: "standard_corp_snapshot",
      selectedRunnerLocalDeckId: "cloud_runner",
      selectedCorpLocalDeckId: "ignored",
      runnerSnapshots: [],
      corpSnapshots: [
        {
          deckSnapshotId: "standard_corp_snapshot",
          sourceDeckId: "standard_corp",
        },
      ] as never,
    });

    expect(preferences).toMatchObject({
      runnerDeck: { kind: "account", cloudDeckId: "cloud_runner" },
      corpDeck: { kind: "standard", standardDeckId: "standard_corp" },
    });
    expect(JSON.stringify(preferences)).not.toMatch(
      /seed|participantB|sessionToken|trace|testSetup/i,
    );
  });
});
