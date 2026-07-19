import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AccountSessionService, SqliteAccountStorage } from "./account-session";
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
});
