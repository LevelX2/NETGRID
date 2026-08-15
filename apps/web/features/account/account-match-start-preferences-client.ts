import { accountRequest, type AccountFetch } from "./account-client";
import type { TraceRulesProfile } from "@netgrid/shared";

export const ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION =
  "netgrid-account-match-start-preferences-v1" as const;

export type AccountMatchStartDeckSelection =
  | { kind: "random_standard" }
  | { kind: "standard"; standardDeckId: string }
  | { kind: "account"; cloudDeckId: string };

export type AccountMatchStartPreferences = {
  schemaVersion: typeof ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION;
  playMode: "human_vs_human" | "human_vs_ai" | "ai_vs_ai";
  humanSideSelection: "runner" | "corp" | "random";
  humanAiSideSelection: "runner" | "corp" | "random";
  matchFormat: "rules_match" | "two_game_side_swap";
  seriesGamesPlanned: 2 | 3 | 4 | 5 | 6;
  matchCardPool:
    | "originalset"
    | "originalset_classic"
    | "originalset_proteus"
    | "originalset_classic_proteus";
  traceRulesProfile?: TraceRulesProfile;
  runnerDifficulty: "easy" | "normal" | "hard";
  corpDifficulty: "easy" | "normal" | "hard";
  aiDeckPolicy:
    | "fixed"
    | "selected"
    | "seeded_random"
    | "same_as_participant_a";
  countdownSeconds: 3 | 5 | 10;
  playerClockMode: "none" | "player_clock";
  playerClockMinutes: 5 | 10 | 15 | 20 | 30 | 45;
  playerClockGraceSeconds: 0 | 5 | 10 | 15 | 30;
  runnerDeck?: AccountMatchStartDeckSelection;
  corpDeck?: AccountMatchStartDeckSelection;
};

export type AccountMatchStartPreferencesResponse = {
  preferences: AccountMatchStartPreferences | null;
  invalidDeckSlots: Array<"runner" | "corp">;
};

export function loadAccountMatchStartPreferences(
  fetcher: AccountFetch = fetch,
): Promise<AccountMatchStartPreferencesResponse> {
  return accountRequest(fetcher, "/api/account/match-start-preferences", {
    method: "GET",
  });
}

export function saveAccountMatchStartPreferences(
  preferences: AccountMatchStartPreferences,
  csrfToken: string,
  fetcher: AccountFetch = fetch,
): Promise<AccountMatchStartPreferencesResponse> {
  return accountRequest(fetcher, "/api/account/match-start-preferences", {
    method: "PUT",
    headers: csrf(csrfToken),
    body: JSON.stringify({ preferences }),
  });
}

export function resetAccountMatchStartPreferences(
  csrfToken: string,
  fetcher: AccountFetch = fetch,
): Promise<{ ok: true }> {
  return accountRequest(fetcher, "/api/account/match-start-preferences", {
    method: "DELETE",
    headers: csrf(csrfToken),
  });
}

function csrf(csrfToken: string): HeadersInit {
  return { "x-netgrid-csrf": csrfToken };
}
