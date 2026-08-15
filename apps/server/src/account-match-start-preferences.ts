import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  AiDifficulty,
  ApiMatchCardPool,
  TraceRulesProfile,
} from "@netgrid/shared";
import {
  AccountDeckError,
  AccountDeckService,
  type AccountDeckRecord,
  type StandardDeckCatalogEntry,
} from "./account-decks";
import {
  configureSqliteConnection,
  runSqliteStorageOperation,
  SqliteMatchStorage,
} from "./storage-sqlite";

export const ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION =
  "netgrid-account-match-start-preferences-v1" as const;

export type AccountMatchStartDeckSelection =
  | Readonly<{ kind: "random_standard" }>
  | Readonly<{ kind: "standard"; standardDeckId: string }>
  | Readonly<{ kind: "account"; cloudDeckId: string }>;

export type AccountMatchStartPreferences = Readonly<{
  schemaVersion: typeof ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION;
  playMode: "human_vs_human" | "human_vs_ai" | "ai_vs_ai";
  humanSideSelection: "runner" | "corp" | "random";
  humanAiSideSelection: "runner" | "corp" | "random";
  matchFormat: "rules_match" | "two_game_side_swap";
  seriesGamesPlanned: 2 | 3 | 4 | 5 | 6;
  matchCardPool: ApiMatchCardPool;
  traceRulesProfile?: TraceRulesProfile;
  runnerDifficulty: AiDifficulty;
  corpDifficulty: AiDifficulty;
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
}>;

export type AccountMatchStartPreferencesRead = Readonly<{
  preferences: AccountMatchStartPreferences | null;
  invalidDeckSlots: Array<"runner" | "corp">;
}>;

export type AccountMatchStartPreferenceStorage = {
  loadForAccount(
    accountId: string,
  ): Promise<AccountMatchStartPreferences | undefined>;
  saveForAccount(
    accountId: string,
    preferences: AccountMatchStartPreferences,
    updatedAt: string,
  ): Promise<void>;
  deleteForAccount(accountId: string): Promise<void>;
  close?(): void;
};

export class AccountMatchStartPreferencesError extends Error {
  constructor(readonly code: "account_match_start_preferences_invalid") {
    super(code);
    this.name = "AccountMatchStartPreferencesError";
  }
}

export class InMemoryAccountMatchStartPreferenceStorage implements AccountMatchStartPreferenceStorage {
  private readonly records = new Map<string, AccountMatchStartPreferences>();

  async loadForAccount(
    accountId: string,
  ): Promise<AccountMatchStartPreferences | undefined> {
    const preferences = this.records.get(accountId);
    return preferences ? clone(preferences) : undefined;
  }

  async saveForAccount(
    accountId: string,
    preferences: AccountMatchStartPreferences,
    _updatedAt: string,
  ): Promise<void> {
    this.records.set(accountId, clone(preferences));
  }

  async deleteForAccount(accountId: string): Promise<void> {
    this.records.delete(accountId);
  }
}

export class SqliteAccountMatchStartPreferenceStorage implements AccountMatchStartPreferenceStorage {
  private readonly db: DatabaseSync;

  constructor(options: { dbPath: string; backupDir?: string }) {
    const dbPath = resolve(options.dbPath);
    mkdirSync(dirname(dbPath), { recursive: true });
    const schemaOwner = new SqliteMatchStorage({
      dbPath,
      ...(options.backupDir ? { backupDir: resolve(options.backupDir) } : {}),
    });
    schemaOwner.close();
    this.db = new DatabaseSync(dbPath);
    configureSqliteConnection(this.db);
  }

  async loadForAccount(
    accountId: string,
  ): Promise<AccountMatchStartPreferences | undefined> {
    const row = this.db
      .prepare(
        "SELECT preferences_json AS preferencesJson FROM account_match_start_preferences WHERE account_id = ?",
      )
      .get(accountId) as { preferencesJson: string } | undefined;
    if (!row) return undefined;
    try {
      return parseAccountMatchStartPreferences(JSON.parse(row.preferencesJson));
    } catch {
      return undefined;
    }
  }

  async saveForAccount(
    accountId: string,
    preferences: AccountMatchStartPreferences,
    updatedAt: string,
  ): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_match_start_preferences (
            account_id, preferences_json, updated_at
          ) VALUES (?, ?, ?)
          ON CONFLICT(account_id) DO UPDATE SET
            preferences_json = excluded.preferences_json,
            updated_at = excluded.updated_at`,
        )
        .run(accountId, JSON.stringify(preferences), updatedAt),
    );
  }

  async deleteForAccount(accountId: string): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          "DELETE FROM account_match_start_preferences WHERE account_id = ?",
        )
        .run(accountId),
    );
  }

  close(): void {
    this.db.close();
  }
}

export class AccountMatchStartPreferenceService {
  private readonly now: () => string;

  constructor(
    private readonly storage: AccountMatchStartPreferenceStorage,
    private readonly accountDecks: AccountDeckService,
    options: { now?: () => string } = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async load(accountId: string): Promise<AccountMatchStartPreferencesRead> {
    const preferences = await this.storage.loadForAccount(accountId);
    if (!preferences) return { preferences: null, invalidDeckSlots: [] };
    return this.withUsableDeckSelections(accountId, preferences);
  }

  async save(
    accountId: string,
    input: unknown,
  ): Promise<AccountMatchStartPreferencesRead> {
    const preferences = parseAccountMatchStartPreferences(input);
    const resolved = await this.withUsableDeckSelections(
      accountId,
      preferences,
    );
    if (!resolved.preferences)
      throw new AccountMatchStartPreferencesError(
        "account_match_start_preferences_invalid",
      );
    await this.storage.saveForAccount(
      accountId,
      resolved.preferences,
      this.now(),
    );
    return resolved;
  }

  async delete(accountId: string): Promise<void> {
    await this.storage.deleteForAccount(accountId);
  }

  close(): void {
    this.storage.close?.();
  }

  private async withUsableDeckSelections(
    accountId: string,
    preferences: AccountMatchStartPreferences,
  ): Promise<AccountMatchStartPreferencesRead> {
    const invalidDeckSlots: Array<"runner" | "corp"> = [];
    const runnerDeck = await this.usableDeckSelection(
      accountId,
      "runner",
      preferences.matchCardPool,
      preferences.runnerDeck,
    );
    const corpDeck = await this.usableDeckSelection(
      accountId,
      "corp",
      preferences.matchCardPool,
      preferences.corpDeck,
    );
    if (preferences.runnerDeck && !runnerDeck) invalidDeckSlots.push("runner");
    if (preferences.corpDeck && !corpDeck) invalidDeckSlots.push("corp");
    const {
      runnerDeck: _storedRunnerDeck,
      corpDeck: _storedCorpDeck,
      ...basePreferences
    } = preferences;
    void _storedRunnerDeck;
    void _storedCorpDeck;
    return {
      preferences: {
        ...basePreferences,
        ...(runnerDeck ? { runnerDeck } : {}),
        ...(corpDeck ? { corpDeck } : {}),
      },
      invalidDeckSlots,
    };
  }

  private async usableDeckSelection(
    accountId: string,
    side: "runner" | "corp",
    cardPool: ApiMatchCardPool,
    selection: AccountMatchStartDeckSelection | undefined,
  ): Promise<AccountMatchStartDeckSelection | undefined> {
    if (!selection || selection.kind === "random_standard") return selection;
    try {
      if (selection.kind === "standard") {
        const standard = this.accountDecks.getStandard(
          selection.standardDeckId,
        );
        return standardDeckMatches(standard, side, cardPool)
          ? selection
          : undefined;
      }
      const accountDeck = await this.accountDecks.get(
        accountId,
        selection.cloudDeckId,
      );
      return accountDeckMatches(accountDeck, side, cardPool)
        ? selection
        : undefined;
    } catch (error) {
      if (error instanceof AccountDeckError) return undefined;
      throw error;
    }
  }
}

export function parseAccountMatchStartPreferences(
  input: unknown,
): AccountMatchStartPreferences {
  const record = recordFrom(input);
  if (
    record.schemaVersion !== ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION ||
    !isPlayMode(record.playMode) ||
    !isSideSelection(record.humanSideSelection) ||
    !isSideSelection(record.humanAiSideSelection) ||
    !isMatchFormat(record.matchFormat) ||
    !isSeriesGamesPlanned(record.seriesGamesPlanned) ||
    !isMatchCardPool(record.matchCardPool) ||
    (record.traceRulesProfile !== undefined &&
      !isTraceRulesProfile(record.traceRulesProfile)) ||
    !isAiDifficulty(record.runnerDifficulty) ||
    !isAiDifficulty(record.corpDifficulty) ||
    !isAiDeckPolicy(record.aiDeckPolicy) ||
    !isCountdownSeconds(record.countdownSeconds) ||
    !isPlayerClockMode(record.playerClockMode) ||
    !isPlayerClockMinutes(record.playerClockMinutes) ||
    !isPlayerClockGraceSeconds(record.playerClockGraceSeconds)
  ) {
    throw new AccountMatchStartPreferencesError(
      "account_match_start_preferences_invalid",
    );
  }
  const runnerDeck = deckSelectionFrom(record.runnerDeck);
  const corpDeck = deckSelectionFrom(record.corpDeck);
  return {
    schemaVersion: ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
    playMode: record.playMode,
    humanSideSelection: record.humanSideSelection,
    humanAiSideSelection: record.humanAiSideSelection,
    matchFormat: record.matchFormat,
    seriesGamesPlanned: record.seriesGamesPlanned,
    matchCardPool: record.matchCardPool,
    traceRulesProfile: isTraceRulesProfile(record.traceRulesProfile)
      ? record.traceRulesProfile
      : "modern_open",
    runnerDifficulty: record.runnerDifficulty,
    corpDifficulty: record.corpDifficulty,
    aiDeckPolicy: record.aiDeckPolicy,
    countdownSeconds: record.countdownSeconds,
    playerClockMode: record.playerClockMode,
    playerClockMinutes: record.playerClockMinutes,
    playerClockGraceSeconds: record.playerClockGraceSeconds,
    ...(runnerDeck ? { runnerDeck } : {}),
    ...(corpDeck ? { corpDeck } : {}),
  };
}

function deckSelectionFrom(
  value: unknown,
): AccountMatchStartDeckSelection | undefined {
  if (value === undefined) return undefined;
  const record = recordFrom(value);
  if (record.kind === "random_standard") return { kind: "random_standard" };
  if (record.kind === "standard" && validIdentifier(record.standardDeckId))
    return { kind: "standard", standardDeckId: record.standardDeckId };
  if (record.kind === "account" && validIdentifier(record.cloudDeckId))
    return { kind: "account", cloudDeckId: record.cloudDeckId };
  throw new AccountMatchStartPreferencesError(
    "account_match_start_preferences_invalid",
  );
}

function accountDeckMatches(
  record: AccountDeckRecord,
  side: "runner" | "corp",
  cardPool: ApiMatchCardPool,
): boolean {
  return (
    record.validationStatus === "valid" &&
    record.deck.side === side &&
    deckMatchesCardPool(record.deck, cardPool)
  );
}

function standardDeckMatches(
  record: StandardDeckCatalogEntry,
  side: "runner" | "corp",
  cardPool: ApiMatchCardPool,
): boolean {
  return record.side === side && deckMatchesCardPool(record, cardPool);
}

function deckMatchesCardPool(
  deck: {
    formatProfileId: string;
    cards: readonly { cardId: string }[];
  },
  cardPool: ApiMatchCardPool,
): boolean {
  const hasClassic =
    cardPool === "originalset_classic" ||
    cardPool === "originalset_classic_proteus";
  const hasProteus =
    cardPool === "originalset_proteus" ||
    cardPool === "originalset_classic_proteus";
  if (
    deck.formatProfileId === "netgrid_private_local_classic_playtest_v1" &&
    !hasClassic
  )
    return false;
  if (
    deck.formatProfileId === "netgrid_private_local_proteus_playtest_v1" &&
    !hasProteus
  )
    return false;
  if (
    deck.formatProfileId ===
      "netgrid_private_local_classic_proteus_playtest_v1" &&
    (!hasClassic || !hasProteus)
  )
    return false;
  return deck.cards.every(
    (entry) =>
      (!entry.cardId.startsWith("onr_classic_") || hasClassic) &&
      (!entry.cardId.startsWith("onr_proteus_") || hasProteus),
  );
}

function recordFrom(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AccountMatchStartPreferencesError(
      "account_match_start_preferences_invalid",
    );
  return value as Record<string, unknown>;
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200;
}

function isPlayMode(
  value: unknown,
): value is AccountMatchStartPreferences["playMode"] {
  return (
    value === "human_vs_human" ||
    value === "human_vs_ai" ||
    value === "ai_vs_ai"
  );
}

function isTraceRulesProfile(value: unknown): value is TraceRulesProfile {
  return (
    value === "modern_open" ||
    value === "classic_blind" ||
    value === "classic_blind_corp_ties"
  );
}

function isSideSelection(
  value: unknown,
): value is AccountMatchStartPreferences["humanSideSelection"] {
  return value === "runner" || value === "corp" || value === "random";
}

function isMatchFormat(
  value: unknown,
): value is AccountMatchStartPreferences["matchFormat"] {
  return value === "rules_match" || value === "two_game_side_swap";
}

function isSeriesGamesPlanned(
  value: unknown,
): value is AccountMatchStartPreferences["seriesGamesPlanned"] {
  return (
    value === 2 || value === 3 || value === 4 || value === 5 || value === 6
  );
}

function isMatchCardPool(value: unknown): value is ApiMatchCardPool {
  return (
    value === "originalset" ||
    value === "originalset_classic" ||
    value === "originalset_proteus" ||
    value === "originalset_classic_proteus"
  );
}

function isAiDifficulty(value: unknown): value is AiDifficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

function isAiDeckPolicy(
  value: unknown,
): value is AccountMatchStartPreferences["aiDeckPolicy"] {
  return (
    value === "fixed" ||
    value === "selected" ||
    value === "seeded_random" ||
    value === "same_as_participant_a"
  );
}

function isCountdownSeconds(
  value: unknown,
): value is AccountMatchStartPreferences["countdownSeconds"] {
  return value === 3 || value === 5 || value === 10;
}

function isPlayerClockMode(
  value: unknown,
): value is AccountMatchStartPreferences["playerClockMode"] {
  return value === "none" || value === "player_clock";
}

function isPlayerClockMinutes(
  value: unknown,
): value is AccountMatchStartPreferences["playerClockMinutes"] {
  return (
    value === 5 ||
    value === 10 ||
    value === 15 ||
    value === 20 ||
    value === 30 ||
    value === 45
  );
}

function isPlayerClockGraceSeconds(
  value: unknown,
): value is AccountMatchStartPreferences["playerClockGraceSeconds"] {
  return (
    value === 0 || value === 5 || value === 10 || value === 15 || value === 30
  );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
