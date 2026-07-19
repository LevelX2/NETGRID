import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { AccountSessionService, SqliteAccountStorage } from "./account-session";
import { InMemoryMatchStorage, MultiplayerService } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";
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
    expect(await service.bindingsForMatch("match_b")).toEqual([
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
});
