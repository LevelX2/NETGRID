import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { AccountSessionService, SqliteAccountStorage } from "./account-session";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { restoreSqliteStorageBackup, SqliteMatchStorage } from "./storage-sqlite";
import {
  AccountMatchStatisticsService,
  InMemoryAccountStatisticsStorage,
  SqliteAccountStatisticsStorage,
} from "./account-statistics";

describe("AccountMatchStatisticsService participant binding", () => {
  it("binds authenticated slots idempotently, rejects conflicting accounts and inherits bindings", async () => {
    const service = new AccountMatchStatisticsService(new InMemoryAccountStatisticsStorage(), { now: () => "2026-07-19T01:00:00.000Z" });
    await service.bindAuthenticatedParticipant({ matchId: "match_a", participantSlot: "player_a", accountId: "account_a", bindingSource: "authenticated_create" });
    await service.bindAuthenticatedParticipant({ matchId: "match_a", participantSlot: "player_a", accountId: "account_a", bindingSource: "authenticated_create" });
    await service.bindAuthenticatedParticipant({ matchId: "match_a", participantSlot: "player_b", accountId: "account_a", bindingSource: "authenticated_join" });

    await expect(service.bindAuthenticatedParticipant({
      matchId: "match_a",
      participantSlot: "player_a",
      accountId: "account_b",
      bindingSource: "authenticated_create",
    })).rejects.toMatchObject({ code: "account_match_binding_conflict" });

    await service.inheritMatchParticipants({ sourceMatchId: "match_a", targetMatchId: "match_b", bindingSource: "inherited_series_next" });
    await service.reconcileSeriesNextParticipantBindings({
      match: {
        matchId: "match_a",
        series: { nextMatchId: "match_c" },
      },
    } as never);
    expect(await service.bindingsForMatch("match_b")).toEqual([
      expect.objectContaining({ participantSlot: "player_a", accountId: "account_a", bindingSource: "inherited_series_next" }),
      expect.objectContaining({ participantSlot: "player_b", accountId: "account_a", bindingSource: "inherited_series_next" }),
    ]);
    expect(await service.bindingsForMatch("match_c")).toEqual([
      expect.objectContaining({ participantSlot: "player_a", accountId: "account_a", bindingSource: "inherited_series_next" }),
      expect.objectContaining({ participantSlot: "player_b", accountId: "account_a", bindingSource: "inherited_series_next" }),
    ]);
  });

  it("records a terminal account game exactly once from persisted match transitions", async () => {
    const matchStorage = new InMemoryMatchStorage();
    const matches = new MultiplayerService(matchStorage, { tokenSalt: "account-statistics-ledger" });
    const statistics = new AccountMatchStatisticsService(new InMemoryAccountStatisticsStorage(), { now: () => "2026-07-19T03:00:00.000Z" });
    matches.addPersistenceObserver((record) => statistics.recordTerminalMatch(record));
    const created = await matches.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      displayName: "Account Runner",
      identityKind: "account",
      seed: "account-statistics-forfeit",
    });
    await statistics.bindAuthenticatedParticipant({
      matchId: created.matchId,
      participantSlot: "player_a",
      accountId: "account_runner",
      bindingSource: "authenticated_create",
    });

    const forfeited = await matches.forfeitMatch({ matchId: created.matchId, side: "runner", sessionToken: created.hostSessionToken });
    expect(forfeited.ok).toBe(true);
    const stored = await matchStorage.load(created.matchId);
    expect(stored).toBeDefined();
    await statistics.recordTerminalMatch(stored!);

    expect(await statistics.gameResultsForAccount("account_runner")).toEqual([
      expect.objectContaining({
        originMatchId: created.matchId,
        participantSlot: "player_a",
        side: "runner",
        outcome: "loss",
        finishKind: "forfeit",
        opponentKind: "ai",
        statisticsEligible: true,
      }),
    ]);
  });

  it("repairs a missed terminal projection through reconciliation", async () => {
    const matchStorage = new InMemoryMatchStorage();
    const matches = new MultiplayerService(matchStorage, { tokenSalt: "account-statistics-reconcile" });
    const statistics = new AccountMatchStatisticsService(new InMemoryAccountStatisticsStorage());
    const created = await matches.createMatch({ hostSide: "runner", playMode: "human_vs_ai", humanSide: "runner", identityKind: "account", seed: "statistics-reconcile" });
    await statistics.bindAuthenticatedParticipant({ matchId: created.matchId, participantSlot: "player_a", accountId: "account_reconcile", bindingSource: "authenticated_create" });
    await matches.forfeitMatch({ matchId: created.matchId, side: "runner", sessionToken: created.hostSessionToken });
    expect(await statistics.gameResultsForAccount("account_reconcile")).toEqual([]);

    expect(await matches.reconcilePersistedMatches((record) => statistics.recordTerminalMatch(record))).toBe(1);
    expect(await statistics.gameResultsForAccount("account_reconcile")).toHaveLength(1);
  });

  it("keeps a terminal result idempotent when a later series transition updates the match timestamp", async () => {
    const matchStorage = new InMemoryMatchStorage();
    const matches = new MultiplayerService(matchStorage, {
      tokenSalt: "account-statistics-stable-finished-at",
    });
    const statistics = new AccountMatchStatisticsService(
      new InMemoryAccountStatisticsStorage(),
    );
    const created = await matches.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      identityKind: "account",
      seed: "statistics-stable-finished-at",
    });
    await statistics.bindAuthenticatedParticipant({
      matchId: created.matchId,
      participantSlot: "player_a",
      accountId: "account_stable_finished_at",
      bindingSource: "authenticated_create",
    });
    const stored = (await matchStorage.load(created.matchId))!;
    stored.match.status = "finished";
    stored.gameState.winner = "runner";
    stored.match.updatedAt = "2026-08-01T08:00:00.000Z";
    stored.resultSnapshot = {
      finishedAt: "2026-08-01T08:00:00.000Z",
    } as never;

    await statistics.recordTerminalMatch(stored);
    stored.match.updatedAt = "2026-08-01T08:01:00.000Z";
    await expect(statistics.recordTerminalMatch(stored)).resolves.toBeUndefined();
    expect(
      await statistics.gameResultsForAccount("account_stable_finished_at"),
    ).toEqual([
      expect.objectContaining({
        completedAt: "2026-08-01T08:00:00.000Z",
        recordedAt: "2026-08-01T08:00:00.000Z",
      }),
    ]);
  });

  it("aggregates owner-scoped filters and paginates the private history", async () => {
    const storage = new InMemoryAccountStatisticsStorage("2026-07-01T00:00:00.000Z");
    const statistics = new AccountMatchStatisticsService(storage, { now: () => "2026-07-19T12:00:00.000Z" });
    await storage.recordGameResult(gameRecord({ accountGameResultId: "result_3", originMatchId: "match_3", completedAt: "2026-07-18T12:00:00.000Z", side: "runner", outcome: "win", opponentKind: "ai", agendaPointsFor: 7, matchPoints: 10 }));
    await storage.recordGameResult(gameRecord({ accountGameResultId: "result_2", originMatchId: "match_2", completedAt: "2026-07-10T12:00:00.000Z", side: "corp", outcome: "loss", opponentKind: "account", finishKind: "forfeit", agendaPointsAgainst: 7 }));
    await storage.recordGameResult(gameRecord({ accountGameResultId: "result_1", originMatchId: "match_1", completedAt: "2026-01-01T12:00:00.000Z", side: "runner", outcome: "draw", opponentKind: "guest" }));
    await storage.recordGameResult(gameRecord({ accountGameResultId: "other", accountId: "other_account", originMatchId: "other_match", completedAt: "2026-07-18T12:00:00.000Z", outcome: "win" }));

    expect(await statistics.statisticsForAccount("account_owner", { period: "30d" })).toMatchObject({
      totals: { gamesPlayed: 2, wins: 1, losses: 1, draws: 0, forfeitsLost: 1 },
      bySide: { runner: { gamesPlayed: 1, wins: 1 }, corp: { gamesPlayed: 1, losses: 1 } },
      byOpponentKind: { ai: { gamesPlayed: 1 }, account: { gamesPlayed: 1 }, guest: { gamesPlayed: 0 } },
    });
    expect((await statistics.statisticsForAccount("account_owner", { side: "runner", opponentKind: "ai" })).totals.gamesPlayed).toBe(1);

    const first = await statistics.matchHistoryForAccount("account_owner", { limit: 1 });
    expect(first.entries.map((entry) => entry.resultId)).toEqual(["result_3"]);
    expect(first.nextCursor).toBe("result_3");
    const second = await statistics.matchHistoryForAccount("account_owner", { limit: 1, cursor: first.nextCursor! });
    expect(second.entries.map((entry) => entry.resultId)).toEqual(["result_2"]);
  });

  it("aggregates and keyset-paginates a large SQLite ledger without loading the full account history", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-statistics-query-"));
    const dbPath = join(dir, "accounts.sqlite");
    const backupDir = join(dir, "backups");
    const accounts = new SqliteAccountStorage({ dbPath, backupDir });
    const sessions = new AccountSessionService(accounts);
    const owner = await sessions.createAccount({ loginName: "query_owner", displayName: "Query Owner" });
    const other = await sessions.createAccount({ loginName: "query_other", displayName: "Query Other" });
    const sqliteStorage = new SqliteAccountStatisticsStorage({ dbPath, backupDir });
    const memoryStorage = new InMemoryAccountStatisticsStorage();
    const now = "2026-07-19T12:00:00.000Z";
    try {
      for (let index = 0; index < 240; index += 1) {
        const abandoned = index % 19 === 0;
        const selfPlay = !abandoned && index % 23 === 0;
        const draft = gameRecord({
          accountGameResultId: `result_${String(index).padStart(4, "0")}`,
          accountId: owner.accountId,
          originMatchId: `match_${String(index).padStart(4, "0")}`,
          completedAt: new Date(Date.parse(now) - index * 6 * 60 * 60 * 1000).toISOString(),
          side: index % 2 === 0 ? "runner" : "corp",
          outcome: abandoned ? "abandoned" : index % 3 === 0 ? "win" : index % 3 === 1 ? "loss" : "draw",
          finishKind: index % 11 === 0 ? "forfeit" : "regular",
          opponentKind: index % 3 === 0 ? "ai" : index % 3 === 1 ? "account" : "guest",
          matchMode: index % 2 === 0 ? "human_runner_vs_corp_ai" : "human_vs_human",
          agendaPointsFor: index % 8,
          agendaPointsAgainst: (index + 3) % 8,
          statisticsEligible: !abandoned && !selfPlay,
          ...(selfPlay ? { exclusionReason: "self_play" as const } : {}),
        });
        const record = selfPlay
          ? (({ recordedAt, ...fields }) => ({ ...fields, exclusionReason: "self_play" as const, recordedAt }))(draft)
          : draft;
        await sqliteStorage.recordGameResult(record);
        await memoryStorage.recordGameResult(record);
      }
      await sqliteStorage.recordGameResult(gameRecord({
        accountGameResultId: "other_result",
        accountId: other.accountId,
        originMatchId: "other_match",
        completedAt: now,
        outcome: "win",
      }));

      sqliteStorage.listGameResultsForAccount = async () => {
        throw new Error("full_account_game_ledger_must_not_be_loaded");
      };
      sqliteStorage.listSeriesResultsForAccount = async () => {
        throw new Error("full_account_series_ledger_must_not_be_loaded");
      };
      const sqliteService = new AccountMatchStatisticsService(sqliteStorage, { now: () => now });
      const memoryService = new AccountMatchStatisticsService(memoryStorage, { now: () => now });
      const query = { period: "30d" as const, side: "runner" as const, opponentKind: "ai" as const };
      const sqliteStatistics = await sqliteService.statisticsForAccount(owner.accountId, query);
      const memoryStatistics = await memoryService.statisticsForAccount(owner.accountId, query);
      expect({ ...sqliteStatistics, statisticsSince: undefined }).toEqual({ ...memoryStatistics, statisticsSince: undefined });

      const firstSqlitePage = await sqliteService.matchHistoryForAccount(owner.accountId, { ...query, limit: 7 });
      const firstMemoryPage = await memoryService.matchHistoryForAccount(owner.accountId, { ...query, limit: 7 });
      expect({ ...firstSqlitePage, statisticsSince: undefined }).toEqual({ ...firstMemoryPage, statisticsSince: undefined });
      expect(firstSqlitePage.entries).toHaveLength(7);
      expect(firstSqlitePage.nextCursor).toBeTruthy();
      if (!firstSqlitePage.nextCursor || !firstMemoryPage.nextCursor) throw new Error("Missing keyset cursor");

      const secondSqlitePage = await sqliteService.matchHistoryForAccount(owner.accountId, { ...query, limit: 7, cursor: firstSqlitePage.nextCursor });
      const secondMemoryPage = await memoryService.matchHistoryForAccount(owner.accountId, { ...query, limit: 7, cursor: firstMemoryPage.nextCursor });
      expect({ ...secondSqlitePage, statisticsSince: undefined }).toEqual({ ...secondMemoryPage, statisticsSince: undefined });
      expect(new Set([...firstSqlitePage.entries, ...secondSqlitePage.entries].map((entry) => entry.resultId)).size).toBe(14);

      const queryDb = new DatabaseSync(dbPath, { readOnly: true });
      try {
        const plan = (queryDb
          .prepare("EXPLAIN QUERY PLAN SELECT account_game_result_id FROM account_game_results WHERE account_id = ? ORDER BY completed_at DESC, account_game_result_id DESC LIMIT 8")
          .all(owner.accountId) as Array<{ detail: string }>).map((row) => row.detail).join("\n");
        expect(plan).toContain("idx_account_game_results_account_completed");
      } finally {
        queryDb.close();
      }
    } finally {
      try { sqliteStorage.close(); } catch {}
      try { accounts.close(); } catch {}
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("marks same-account two-slot games as self-play and writes a finished series once", async () => {
    const matchStorage = new InMemoryMatchStorage();
    const matches = new MultiplayerService(matchStorage, { tokenSalt: "account-statistics-series" });
    const statistics = new AccountMatchStatisticsService(new InMemoryAccountStatisticsStorage());
    const created = await matches.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      displayName: "Account Runner",
      identityKind: "account",
      seed: "account-statistics-series",
    });
    await statistics.bindAuthenticatedParticipant({ matchId: created.matchId, participantSlot: "player_a", accountId: "account_self", bindingSource: "authenticated_create" });
    await statistics.bindAuthenticatedParticipant({ matchId: created.matchId, participantSlot: "player_b", accountId: "account_self", bindingSource: "authenticated_join" });
    await matches.forfeitMatch({ matchId: created.matchId, side: "runner", sessionToken: created.hostSessionToken });
    const stored = (await matchStorage.load(created.matchId))!;
    stored.match.status = "forfeited";
    stored.match.series = {
      seriesId: "series_self",
      mode: "two_game_side_swap",
      status: "finished",
      gameNumber: 1,
      gamesPlanned: 1,
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
      results: [{
        matchId: created.matchId,
        gameNumber: 1,
        runnerPlayer: "player_a",
        corpPlayer: "player_b",
        winner: "corp",
        reason: "forfeit",
        runnerAgendaPoints: 0,
        corpAgendaPoints: 0,
        finalStateHash: stored.lifecycleResult?.finalEngineStateHash ?? "hash",
        finishedAt: stored.match.updatedAt,
      }],
    };

    await statistics.recordTerminalMatch(stored);
    await statistics.recordTerminalMatch(stored);

    expect(await statistics.gameResultsForAccount("account_self")).toHaveLength(2);
    expect(await statistics.gameResultsForAccount("account_self")).toEqual(expect.arrayContaining([
      expect.objectContaining({ participantSlot: "player_a", statisticsEligible: false, exclusionReason: "self_play" }),
      expect.objectContaining({ participantSlot: "player_b", statisticsEligible: false, exclusionReason: "self_play" }),
    ]));
    expect(await statistics.seriesResultsForAccount("account_self")).toEqual(expect.arrayContaining([
      expect.objectContaining({ participantSlot: "player_a", outcome: "loss", statisticsEligible: false }),
      expect.objectContaining({ participantSlot: "player_b", outcome: "win", statisticsEligible: false }),
    ]));
  });

  it("persists bindings in a separate account database without copying them into matches", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-statistics-binding-"));
    const dbPath = join(dir, "accounts.sqlite");
    const backupDir = join(dir, "backups");
    const accounts = new SqliteAccountStorage({ dbPath, backupDir });
    const sessions = new AccountSessionService(accounts);
    const statisticsStorage = new SqliteAccountStatisticsStorage({ dbPath, backupDir });
    const statistics = new AccountMatchStatisticsService(statisticsStorage, { now: () => "2026-07-19T02:00:00.000Z" });
    try {
      const account = await sessions.createAccount({ loginName: "runner", displayName: "Runner" });
      await statistics.bindAuthenticatedParticipant({
        matchId: "match_in_other_database",
        participantSlot: "player_a",
        accountId: account.accountId,
        bindingSource: "authenticated_create",
      });
      expect(await statistics.bindingsForMatch("match_in_other_database")).toEqual([
        expect.objectContaining({ accountId: account.accountId, participantSlot: "player_a" }),
      ]);
    } finally {
      statistics.close();
      accounts.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("keeps the durable result ledger after raw match retention removes the match", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-statistics-retention-"));
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const accounts = new SqliteAccountStorage({ dbPath, backupDir });
    const sessions = new AccountSessionService(accounts);
    const account = await sessions.createAccount({ loginName: "retained", displayName: "Retained" });
    const statisticsStorage = new SqliteAccountStatisticsStorage({ dbPath, backupDir });
    const statistics = new AccountMatchStatisticsService(statisticsStorage);
    const matchStorage = new SqliteMatchStorage({ dbPath, backupDir });
    const matches = new MultiplayerService(matchStorage, { tokenSalt: "account-statistics-retention" });
    matches.addPersistenceObserver((record) => statistics.recordTerminalMatch(record));
    try {
      const created = await matches.createMatch({ hostSide: "runner", playMode: "human_vs_ai", humanSide: "runner", identityKind: "account", seed: "statistics-retention" });
      await statistics.bindAuthenticatedParticipant({ matchId: created.matchId, participantSlot: "player_a", accountId: account.accountId, bindingSource: "authenticated_create" });
      await matches.forfeitMatch({ matchId: created.matchId, side: "runner", sessionToken: created.hostSessionToken });
      expect(await statistics.gameResultsForAccount(account.accountId)).toHaveLength(1);
      expect((await matchStorage.maintenanceSummary()).tableSizes).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: "account_match_participants", rowCount: 1 }),
        expect.objectContaining({ key: "account_game_results", rowCount: 1 }),
      ]));

      statistics.close();
      accounts.close();
      matches.closeStorage();
      const maintenanceDb = new DatabaseSync(dbPath);
      maintenanceDb.exec("PRAGMA foreign_keys = ON");
      maintenanceDb.prepare("DELETE FROM matches WHERE match_id = ?").run(created.matchId);
      maintenanceDb.close();

      const reopened = new AccountMatchStatisticsService(new SqliteAccountStatisticsStorage({ dbPath, backupDir }));
      try {
        expect(await reopened.gameResultsForAccount(account.accountId)).toEqual([
          expect.objectContaining({ originMatchId: created.matchId, outcome: "loss", opponentKind: "ai" }),
        ]);
      } finally {
        reopened.close();
      }
    } finally {
      try { statistics.close(); } catch {}
      try { accounts.close(); } catch {}
      try { matches.closeStorage(); } catch {}
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("preserves and restores the account statistics ledger through SQLite backups", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-account-statistics-backup-"));
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const accounts = new SqliteAccountStorage({ dbPath, backupDir });
    const sessions = new AccountSessionService(accounts);
    const account = await sessions.createAccount({ loginName: "backup_stats", displayName: "Backup Stats" });
    const statisticsStorage = new SqliteAccountStatisticsStorage({ dbPath, backupDir });
    const matchStorage = new SqliteMatchStorage({ dbPath, backupDir });
    try {
      await statisticsStorage.recordGameResult(gameRecord({
        accountGameResultId: "result_before_backup",
        accountId: account.accountId,
        originMatchId: "match_before_backup",
      }));
      const backup = await matchStorage.backup("manual");
      await statisticsStorage.recordGameResult(gameRecord({
        accountGameResultId: "result_after_backup",
        accountId: account.accountId,
        originMatchId: "match_after_backup",
      }));

      statisticsStorage.close();
      accounts.close();
      matchStorage.close();
      restoreSqliteStorageBackup({ backupDir: backup.backupDir, targetPath: dbPath, backupRootDir: backupDir });

      const restored = new AccountMatchStatisticsService(new SqliteAccountStatisticsStorage({ dbPath, backupDir }));
      try {
        expect(await restored.gameResultsForAccount(account.accountId)).toEqual([
          expect.objectContaining({ accountGameResultId: "result_before_backup", originMatchId: "match_before_backup" }),
        ]);
      } finally {
        restored.close();
      }
    } finally {
      try { statisticsStorage.close(); } catch {}
      try { accounts.close(); } catch {}
      try { matchStorage.close(); } catch {}
      await rm(dir, { recursive: true, force: true });
    }
  });
});

function gameRecord(overrides: Partial<import("./account-statistics").AccountGameResultRecord> = {}): import("./account-statistics").AccountGameResultRecord {
  return {
    accountGameResultId: "result_default",
    accountId: "account_owner",
    originMatchId: "match_default",
    participantSlot: "player_a",
    completedAt: "2026-07-19T00:00:00.000Z",
    side: "runner",
    outcome: "loss",
    finishKind: "regular",
    opponentKind: "ai",
    matchMode: "human_runner_vs_corp_ai",
    matchFormat: "rules_match",
    cardPool: "originalset",
    agendaPointsFor: 0,
    agendaPointsAgainst: 0,
    matchPoints: 0,
    statisticsEligible: true,
    recordedAt: "2026-07-19T00:00:00.000Z",
    ...overrides,
  };
}
