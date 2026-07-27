import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AccountDeckService, SqliteAccountDeckStorage } from "./account-decks";
import {
  AccountMatchStartPreferenceService,
  ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
  SqliteAccountMatchStartPreferenceStorage,
  type AccountMatchStartPreferences,
} from "./account-match-start-preferences";
import { AccountSessionService, SqliteAccountStorage } from "./account-session";
import {
  restoreSqliteStorageBackup,
  SqliteMatchStorage,
} from "./storage-sqlite";

describe("account match-start preferences", () => {
  it("preserves and restores the private preference record through SQLite backups", async () => {
    const dir = await mkdtemp(
      join(tmpdir(), "netgrid-match-start-preferences-"),
    );
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const accounts = new SqliteAccountStorage({ dbPath, backupDir });
    const sessions = new AccountSessionService(accounts);
    const account = await sessions.createAccount({
      loginName: "preferences_backup",
      displayName: "Preferences Backup",
    });
    const accountDecks = new AccountDeckService(
      new SqliteAccountDeckStorage({ dbPath, backupDir }),
    );
    const storage = new SqliteAccountMatchStartPreferenceStorage({
      dbPath,
      backupDir,
    });
    const preferences = new AccountMatchStartPreferenceService(
      storage,
      accountDecks,
      { now: () => "2026-07-27T19:00:00.000Z" },
    );
    const matchStorage = new SqliteMatchStorage({ dbPath, backupDir });
    try {
      await preferences.save(
        account.accountId,
        preference({ countdownSeconds: 5 }),
      );
      const backup = await matchStorage.backup("manual");
      await preferences.save(
        account.accountId,
        preference({ countdownSeconds: 10 }),
      );

      preferences.close();
      accountDecks.close();
      accounts.close();
      matchStorage.close();
      restoreSqliteStorageBackup({
        backupDir: backup.backupDir,
        targetPath: dbPath,
        backupRootDir: backupDir,
      });

      const restoredDecks = new AccountDeckService(
        new SqliteAccountDeckStorage({ dbPath, backupDir }),
      );
      const restored = new AccountMatchStartPreferenceService(
        new SqliteAccountMatchStartPreferenceStorage({ dbPath, backupDir }),
        restoredDecks,
      );
      try {
        expect(await restored.load(account.accountId)).toMatchObject({
          preferences: { countdownSeconds: 5 },
          invalidDeckSlots: [],
        });
      } finally {
        restored.close();
        restoredDecks.close();
      }
    } finally {
      try {
        preferences.close();
      } catch {}
      try {
        accountDecks.close();
      } catch {}
      try {
        accounts.close();
      } catch {}
      try {
        matchStorage.close();
      } catch {}
      await rm(dir, { recursive: true, force: true });
    }
  });
});

function preference(
  overrides: Partial<AccountMatchStartPreferences> = {},
): AccountMatchStartPreferences {
  return {
    schemaVersion: ACCOUNT_MATCH_START_PREFERENCES_SCHEMA_VERSION,
    playMode: "human_vs_human",
    humanSideSelection: "random",
    humanAiSideSelection: "random",
    matchFormat: "rules_match",
    seriesGamesPlanned: 2,
    matchCardPool: "originalset",
    runnerDifficulty: "normal",
    corpDifficulty: "normal",
    aiDeckPolicy: "selected",
    countdownSeconds: 3,
    playerClockMode: "none",
    playerClockMinutes: 10,
    playerClockGraceSeconds: 10,
    ...overrides,
  };
}
