import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
  loadAccountMatchStartPreferences,
  resetAccountMatchStartPreferences,
  saveAccountMatchStartPreferences,
  type AccountMatchStartPreferences,
} from "./account-match-start-preferences-client";

const preferences: AccountMatchStartPreferences = {
  schemaVersion: ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
  playMode: "human_vs_ai",
  humanSideSelection: "runner",
  humanAiSideSelection: "corp",
  matchFormat: "two_game_side_swap",
  seriesGamesPlanned: 3,
  matchCardPool: "originalset_classic",
  runnerDifficulty: "hard",
  corpDifficulty: "normal",
  aiDeckPolicy: "selected",
  countdownSeconds: 5,
  playerClockMode: "player_clock",
  playerClockMinutes: 20,
  playerClockGraceSeconds: 10,
  runnerDeck: { kind: "account", cloudDeckId: "cloud_runner" },
  corpDeck: { kind: "random_standard" },
};

describe("account match-start preferences client", () => {
  it("uses the private endpoint, cookie credentials and CSRF only for mutations", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ preferences, invalidDeckSlots: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    await loadAccountMatchStartPreferences(fetcher);
    await saveAccountMatchStartPreferences(
      preferences,
      "csrf-memory-only",
      fetcher,
    );
    await resetAccountMatchStartPreferences("csrf-memory-only", fetcher);

    const calls = (fetcher as unknown as ReturnType<typeof vi.fn>).mock
      .calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual(
      Array(3).fill(
        expect.stringContaining("/api/account/match-start-preferences"),
      ),
    );
    expect(calls.every(([, init]) => init.credentials === "include")).toBe(
      true,
    );
    expect(new Headers(calls[0]![1].headers).get("x-netgrid-csrf")).toBeNull();
    expect(new Headers(calls[1]![1].headers).get("x-netgrid-csrf")).toBe(
      "csrf-memory-only",
    );
    expect(new Headers(calls[2]![1].headers).get("x-netgrid-csrf")).toBe(
      "csrf-memory-only",
    );
    expect(String(calls[1]![1].body)).not.toMatch(
      /seed|sessionToken|participantB|testSetup|trace/i,
    );
  });
});
