import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getPlayerView } from "@netgrid/engine";
import type {
  ApiAccountStatisticsExclusionReason,
  ApiAccountStatisticsFinishKind,
  ApiAccountMatchHistory,
  ApiAccountMatchHistoryEntry,
  ApiAccountSeriesStatistics,
  ApiAccountStatistics,
  ApiAccountStatisticsBucket,
  ApiAccountStatisticsOutcome,
  ApiAccountStatisticsPeriod,
  ApiMatchCardPool,
  ApiMatchFormat,
  ApiMatchMode,
  ApiPlayerIdentityKind,
  ApiSeriesPlayerSlot,
  Side,
} from "@netgrid/shared";
import type { StoredMatch } from "./multiplayer";
import {
  configureSqliteConnection,
  runSqliteStorageOperation,
  runSqliteTransaction,
  SqliteMatchStorage,
} from "./storage-sqlite";

const SERIES_WIN_MATCH_POINTS = 10;

export type AccountMatchBindingSource =
  | "authenticated_create"
  | "authenticated_join"
  | "inherited_recreate"
  | "inherited_series_next";

export type AccountMatchParticipantBinding = {
  matchId: string;
  participantSlot: ApiSeriesPlayerSlot;
  accountId: string;
  boundAt: string;
  bindingSource: AccountMatchBindingSource;
};

export type AccountGameResultRecord = {
  accountGameResultId: string;
  accountId: string;
  originMatchId: string;
  participantSlot: ApiSeriesPlayerSlot;
  seriesId?: string;
  gameNumber?: number;
  completedAt: string;
  side: Side;
  outcome: ApiAccountStatisticsOutcome;
  finishKind: ApiAccountStatisticsFinishKind;
  opponentKind: ApiPlayerIdentityKind;
  matchMode: ApiMatchMode;
  matchFormat: ApiMatchFormat;
  cardPool: ApiMatchCardPool;
  agendaPointsFor: number;
  agendaPointsAgainst: number;
  matchPoints: number;
  statisticsEligible: boolean;
  exclusionReason?: ApiAccountStatisticsExclusionReason;
  recordedAt: string;
};

export type AccountSeriesResultRecord = {
  accountSeriesResultId: string;
  accountId: string;
  seriesId: string;
  participantSlot: ApiSeriesPlayerSlot;
  completedAt: string;
  outcome: Exclude<ApiAccountStatisticsOutcome, "abandoned">;
  opponentKind: ApiPlayerIdentityKind;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  matchPointsFor: number;
  matchPointsAgainst: number;
  agendaPointsFor: number;
  agendaPointsAgainst: number;
  statisticsEligible: boolean;
  exclusionReason?: ApiAccountStatisticsExclusionReason;
  recordedAt: string;
};

export type AccountStatisticsStorage = {
  bindParticipant(binding: AccountMatchParticipantBinding): Promise<void>;
  listMatchParticipants(
    matchId: string,
  ): Promise<AccountMatchParticipantBinding[]>;
  listMatchParticipantsForAccount(
    accountId: string,
  ): Promise<AccountMatchParticipantBinding[]>;
  listMatchIdsWithMissingGameResults(): Promise<string[]>;
  listBoundMatchIds(): Promise<string[]>;
  hasMissingNextMatchParticipantBindings(
    sourceMatchId: string,
    targetMatchId: string,
  ): Promise<boolean>;
  recordGameResult(record: AccountGameResultRecord): Promise<void>;
  recordSeriesResult(record: AccountSeriesResultRecord): Promise<void>;
  listGameResultsForAccount(
    accountId: string,
  ): Promise<AccountGameResultRecord[]>;
  listSeriesResultsForAccount(
    accountId: string,
  ): Promise<AccountSeriesResultRecord[]>;
  aggregateStatisticsForAccount?(
    accountId: string,
    query: AccountStatisticsQuery,
    now: string,
  ): Promise<AccountStatisticsAggregation>;
  listGameResultsPageForAccount?(
    accountId: string,
    query: AccountMatchHistoryQuery,
    now: string,
    limit: number,
  ): Promise<{ records: AccountGameResultRecord[]; hasMore: boolean }>;
  statisticsSince(): Promise<string>;
  deleteAccountData(accountId: string): Promise<void>;
  close?(): void;
};

export type AccountStatisticsAggregation = {
  totals: ApiAccountStatisticsBucket;
  selfPlay: number;
  bySide: Record<Side, ApiAccountStatisticsBucket>;
  byOpponentKind: Record<ApiPlayerIdentityKind, ApiAccountStatisticsBucket>;
  byMode: Partial<Record<ApiMatchMode, ApiAccountStatisticsBucket>>;
  byMatchFormat: Partial<Record<ApiMatchFormat, ApiAccountStatisticsBucket>>;
  series: ApiAccountSeriesStatistics;
};

export class AccountStatisticsError extends Error {
  constructor(readonly code: "account_match_binding_conflict") {
    super(code);
    this.name = "AccountStatisticsError";
  }
}

export class InMemoryAccountStatisticsStorage implements AccountStatisticsStorage {
  private readonly bindings = new Map<string, AccountMatchParticipantBinding>();
  private readonly gameResults = new Map<string, AccountGameResultRecord>();
  private readonly seriesResults = new Map<string, AccountSeriesResultRecord>();

  constructor(private readonly since = "2026-07-19T00:00:00.000Z") {}

  async bindParticipant(
    binding: AccountMatchParticipantBinding,
  ): Promise<void> {
    const key = bindingKey(binding.matchId, binding.participantSlot);
    const existing = this.bindings.get(key);
    if (existing && existing.accountId !== binding.accountId)
      throw new AccountStatisticsError("account_match_binding_conflict");
    if (!existing) this.bindings.set(key, clone(binding));
  }

  async listMatchParticipants(
    matchId: string,
  ): Promise<AccountMatchParticipantBinding[]> {
    return [...this.bindings.values()]
      .filter((binding) => binding.matchId === matchId)
      .sort((left, right) =>
        left.participantSlot.localeCompare(right.participantSlot),
      )
      .map((binding) => clone(binding));
  }

  async listMatchParticipantsForAccount(
    accountId: string,
  ): Promise<AccountMatchParticipantBinding[]> {
    return [...this.bindings.values()]
      .filter((binding) => binding.accountId === accountId)
      .sort((left, right) => right.boundAt.localeCompare(left.boundAt))
      .map((binding) => clone(binding));
  }

  async listMatchIdsWithMissingGameResults(): Promise<string[]> {
    return [
      ...new Set(
        [...this.bindings.values()]
          .filter(
            (binding) =>
              !this.gameResults.has(
                gameResultKey({
                  accountId: binding.accountId,
                  originMatchId: binding.matchId,
                  participantSlot: binding.participantSlot,
                } as AccountGameResultRecord),
              ),
          )
          .map((binding) => binding.matchId),
      ),
    ];
  }

  async listBoundMatchIds(): Promise<string[]> {
    return [
      ...new Set([...this.bindings.values()].map((binding) => binding.matchId)),
    ];
  }

  async hasMissingNextMatchParticipantBindings(
    sourceMatchId: string,
    targetMatchId: string,
  ): Promise<boolean> {
    const targetBindings = new Map(
      [...this.bindings.values()]
        .filter((binding) => binding.matchId === targetMatchId)
        .map((binding) => [binding.participantSlot, binding.accountId]),
    );
    return [...this.bindings.values()]
      .filter((binding) => binding.matchId === sourceMatchId)
      .some(
        (binding) =>
          targetBindings.get(binding.participantSlot) !== binding.accountId,
      );
  }

  async recordGameResult(record: AccountGameResultRecord): Promise<void> {
    recordIdempotently(this.gameResults, gameResultKey(record), record);
  }

  async recordSeriesResult(record: AccountSeriesResultRecord): Promise<void> {
    recordIdempotently(this.seriesResults, seriesResultKey(record), record);
  }

  async listGameResultsForAccount(
    accountId: string,
  ): Promise<AccountGameResultRecord[]> {
    return [...this.gameResults.values()]
      .filter((record) => record.accountId === accountId)
      .map((record) => clone(record));
  }

  async listSeriesResultsForAccount(
    accountId: string,
  ): Promise<AccountSeriesResultRecord[]> {
    return [...this.seriesResults.values()]
      .filter((record) => record.accountId === accountId)
      .map((record) => clone(record));
  }

  async statisticsSince(): Promise<string> {
    return this.since;
  }

  async deleteAccountData(accountId: string): Promise<void> {
    for (const [key, binding] of this.bindings)
      if (binding.accountId === accountId) this.bindings.delete(key);
    for (const [key, record] of this.gameResults)
      if (record.accountId === accountId) this.gameResults.delete(key);
    for (const [key, record] of this.seriesResults)
      if (record.accountId === accountId) this.seriesResults.delete(key);
  }
}

export class SqliteAccountStatisticsStorage implements AccountStatisticsStorage {
  private readonly db: DatabaseSync;

  constructor(options: { dbPath: string; backupDir?: string }) {
    const dbPath = resolve(options.dbPath);
    mkdirSync(dirname(dbPath), { recursive: true });
    const schemaOwner = new SqliteMatchStorage({
      dbPath,
      backupDir: resolve(options.backupDir ?? join(dirname(dbPath), "backups")),
    });
    schemaOwner.close();
    this.db = new DatabaseSync(dbPath);
    configureSqliteConnection(this.db);
  }

  async bindParticipant(
    binding: AccountMatchParticipantBinding,
  ): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_match_participants (match_id, participant_slot, account_id, bound_at, binding_source)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(match_id, participant_slot) DO NOTHING`,
        )
        .run(
          binding.matchId,
          binding.participantSlot,
          binding.accountId,
          binding.boundAt,
          binding.bindingSource,
        ),
    );
    const stored = this.db
      .prepare(
        "SELECT account_id AS accountId FROM account_match_participants WHERE match_id = ? AND participant_slot = ?",
      )
      .get(binding.matchId, binding.participantSlot) as
      | { accountId: string }
      | undefined;
    if (stored?.accountId !== binding.accountId)
      throw new AccountStatisticsError("account_match_binding_conflict");
  }

  async listMatchParticipants(
    matchId: string,
  ): Promise<AccountMatchParticipantBinding[]> {
    return this.db
      .prepare(
        `SELECT match_id AS matchId, participant_slot AS participantSlot, account_id AS accountId,
        bound_at AS boundAt, binding_source AS bindingSource
       FROM account_match_participants WHERE match_id = ? ORDER BY participant_slot ASC`,
      )
      .all(matchId) as AccountMatchParticipantBinding[];
  }

  async listMatchParticipantsForAccount(
    accountId: string,
  ): Promise<AccountMatchParticipantBinding[]> {
    return this.db
      .prepare(
        `SELECT match_id AS matchId, participant_slot AS participantSlot, account_id AS accountId,
        bound_at AS boundAt, binding_source AS bindingSource
       FROM account_match_participants WHERE account_id = ? ORDER BY bound_at DESC`,
      )
      .all(accountId) as AccountMatchParticipantBinding[];
  }

  async listMatchIdsWithMissingGameResults(): Promise<string[]> {
    return (
      this.db
        .prepare(
          `SELECT DISTINCT participant.match_id AS matchId
             FROM account_match_participants participant
            WHERE NOT EXISTS (
              SELECT 1
                FROM account_game_results result
               WHERE result.account_id = participant.account_id
                 AND result.origin_match_id = participant.match_id
                 AND result.participant_slot = participant.participant_slot
            )
            ORDER BY participant.match_id ASC`,
        )
        .all() as Array<{ matchId: string }>
    ).map((row) => row.matchId);
  }

  async listBoundMatchIds(): Promise<string[]> {
    return (
      this.db
        .prepare(
          "SELECT DISTINCT match_id AS matchId FROM account_match_participants ORDER BY match_id ASC",
        )
        .all() as Array<{ matchId: string }>
    ).map((row) => row.matchId);
  }

  async hasMissingNextMatchParticipantBindings(
    sourceMatchId: string,
    targetMatchId: string,
  ): Promise<boolean> {
    const row = this.db
      .prepare(
        `SELECT EXISTS(
          SELECT 1
            FROM account_match_participants source
           WHERE source.match_id = ?
             AND NOT EXISTS (
               SELECT 1
                 FROM account_match_participants target
                WHERE target.match_id = ?
                  AND target.participant_slot = source.participant_slot
                  AND target.account_id = source.account_id
             )
        ) AS missing`,
      )
      .get(sourceMatchId, targetMatchId) as { missing: number };
    return row.missing === 1;
  }

  async recordGameResult(record: AccountGameResultRecord): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_game_results (
        account_game_result_id, account_id, origin_match_id, participant_slot, series_id, game_number,
        completed_at, side, outcome, finish_kind, opponent_kind, match_mode, match_format, card_pool,
        agenda_points_for, agenda_points_against, match_points, statistics_eligible, exclusion_reason, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, origin_match_id, participant_slot) DO NOTHING`,
        )
        .run(
          record.accountGameResultId,
          record.accountId,
          record.originMatchId,
          record.participantSlot,
          record.seriesId ?? null,
          record.gameNumber ?? null,
          record.completedAt,
          record.side,
          record.outcome,
          record.finishKind,
          record.opponentKind,
          record.matchMode,
          record.matchFormat,
          record.cardPool,
          record.agendaPointsFor,
          record.agendaPointsAgainst,
          record.matchPoints,
          record.statisticsEligible ? 1 : 0,
          record.exclusionReason ?? null,
          record.recordedAt,
        ),
    );
    const stored = this.gameResult(
      record.accountId,
      record.originMatchId,
      record.participantSlot,
    );
    if (!stored || stableRecord(stored) !== stableRecord(record))
      throw new Error("account_game_result_conflict");
  }

  async recordSeriesResult(record: AccountSeriesResultRecord): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_series_results (
        account_series_result_id, account_id, series_id, participant_slot, completed_at, outcome, opponent_kind,
        games_played, wins, losses, draws, match_points_for, match_points_against,
        agenda_points_for, agenda_points_against, statistics_eligible, exclusion_reason, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, series_id, participant_slot) DO NOTHING`,
        )
        .run(
          record.accountSeriesResultId,
          record.accountId,
          record.seriesId,
          record.participantSlot,
          record.completedAt,
          record.outcome,
          record.opponentKind,
          record.gamesPlayed,
          record.wins,
          record.losses,
          record.draws,
          record.matchPointsFor,
          record.matchPointsAgainst,
          record.agendaPointsFor,
          record.agendaPointsAgainst,
          record.statisticsEligible ? 1 : 0,
          record.exclusionReason ?? null,
          record.recordedAt,
        ),
    );
    const stored = this.seriesResult(
      record.accountId,
      record.seriesId,
      record.participantSlot,
    );
    if (!stored || stableRecord(stored) !== stableRecord(record))
      throw new Error("account_series_result_conflict");
  }

  async listGameResultsForAccount(
    accountId: string,
  ): Promise<AccountGameResultRecord[]> {
    return (
      this.db
        .prepare(
          "SELECT * FROM account_game_results WHERE account_id = ? ORDER BY completed_at DESC, account_game_result_id DESC",
        )
        .all(accountId) as AccountGameResultRow[]
    ).map(gameResultFromRow);
  }

  async listSeriesResultsForAccount(
    accountId: string,
  ): Promise<AccountSeriesResultRecord[]> {
    return (
      this.db
        .prepare(
          "SELECT * FROM account_series_results WHERE account_id = ? ORDER BY completed_at DESC, account_series_result_id DESC",
        )
        .all(accountId) as AccountSeriesResultRow[]
    ).map(seriesResultFromRow);
  }

  async aggregateStatisticsForAccount(
    accountId: string,
    query: AccountStatisticsQuery,
    now: string,
  ): Promise<AccountStatisticsAggregation> {
    const filter = sqliteGameFilter(accountId, query, now);
    const totals = aggregateBucket(this.db, filter);
    const bySide = aggregateBucketsBy<Side>(this.db, filter, "side");
    const byOpponentKind = aggregateBucketsBy<ApiPlayerIdentityKind>(
      this.db,
      filter,
      "opponent_kind",
    );
    const byMode = aggregateBucketsBy<ApiMatchMode>(
      this.db,
      filter,
      "match_mode",
    );
    const byMatchFormat = aggregateBucketsBy<ApiMatchFormat>(
      this.db,
      filter,
      "match_format",
    );
    const selfPlayRow = this.db
      .prepare(
        `SELECT COUNT(DISTINCT origin_match_id) AS count FROM account_game_results WHERE ${filter.where} AND exclusion_reason = 'self_play'`,
      )
      .get(...filter.params) as { count: number };
    return {
      totals,
      selfPlay: Number(selfPlayRow.count),
      bySide: {
        runner: bySide.runner ?? statisticsBucket(),
        corp: bySide.corp ?? statisticsBucket(),
      },
      byOpponentKind: {
        account: byOpponentKind.account ?? statisticsBucket(),
        guest: byOpponentKind.guest ?? statisticsBucket(),
        ai: byOpponentKind.ai ?? statisticsBucket(),
      },
      byMode,
      byMatchFormat,
      series:
        query.side || query.matchMode
          ? emptySeriesStatistics()
          : aggregateSeriesStatistics(this.db, accountId, query, now),
    };
  }

  async listGameResultsPageForAccount(
    accountId: string,
    query: AccountMatchHistoryQuery,
    now: string,
    limit: number,
  ): Promise<{ records: AccountGameResultRecord[]; hasMore: boolean }> {
    const filter = sqliteGameFilter(accountId, query, now);
    let cursorClause = "";
    const params = [...filter.params];
    if (query.cursor) {
      const cursor = this.db
        .prepare(
          `SELECT completed_at AS completedAt, account_game_result_id AS resultId FROM account_game_results WHERE ${filter.where} AND account_game_result_id = ? LIMIT 1`,
        )
        .get(...filter.params, query.cursor) as
        | { completedAt: string; resultId: string }
        | undefined;
      if (cursor) {
        cursorClause =
          " AND (completed_at < ? OR (completed_at = ? AND account_game_result_id < ?))";
        params.push(cursor.completedAt, cursor.completedAt, cursor.resultId);
      }
    }
    const rows = this.db
      .prepare(
        `SELECT * FROM account_game_results
         WHERE ${filter.where}${cursorClause}
         ORDER BY completed_at DESC, account_game_result_id DESC
         LIMIT ?`,
      )
      .all(...params, limit + 1) as AccountGameResultRow[];
    return {
      records: rows.slice(0, limit).map(gameResultFromRow),
      hasMore: rows.length > limit,
    };
  }

  async statisticsSince(): Promise<string> {
    const row = this.db
      .prepare(
        "SELECT value FROM storage_meta WHERE key = 'account_statistics_since'",
      )
      .get() as { value?: string } | undefined;
    return row?.value ?? new Date(0).toISOString();
  }

  async deleteAccountData(accountId: string): Promise<void> {
    runSqliteTransaction(this.db, () => {
      this.db
        .prepare("DELETE FROM account_series_results WHERE account_id = ?")
        .run(accountId);
      this.db
        .prepare("DELETE FROM account_game_results WHERE account_id = ?")
        .run(accountId);
      this.db
        .prepare("DELETE FROM account_match_participants WHERE account_id = ?")
        .run(accountId);
    });
  }

  private gameResult(
    accountId: string,
    matchId: string,
    participantSlot: ApiSeriesPlayerSlot,
  ): AccountGameResultRecord | undefined {
    const row = this.db
      .prepare(
        "SELECT * FROM account_game_results WHERE account_id = ? AND origin_match_id = ? AND participant_slot = ?",
      )
      .get(accountId, matchId, participantSlot) as
      | AccountGameResultRow
      | undefined;
    return row ? gameResultFromRow(row) : undefined;
  }

  private seriesResult(
    accountId: string,
    seriesId: string,
    participantSlot: ApiSeriesPlayerSlot,
  ): AccountSeriesResultRecord | undefined {
    const row = this.db
      .prepare(
        "SELECT * FROM account_series_results WHERE account_id = ? AND series_id = ? AND participant_slot = ?",
      )
      .get(accountId, seriesId, participantSlot) as
      | AccountSeriesResultRow
      | undefined;
    return row ? seriesResultFromRow(row) : undefined;
  }

  close(): void {
    this.db.close();
  }
}

export class AccountMatchStatisticsService {
  private readonly now: () => string;

  constructor(
    private readonly storage: AccountStatisticsStorage = new InMemoryAccountStatisticsStorage(),
    options: { now?: () => string } = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  bindAuthenticatedParticipant(input: {
    matchId: string;
    participantSlot: ApiSeriesPlayerSlot;
    accountId: string;
    bindingSource: Extract<
      AccountMatchBindingSource,
      "authenticated_create" | "authenticated_join"
    >;
  }): Promise<void> {
    return this.storage.bindParticipant({ ...input, boundAt: this.now() });
  }

  async inheritMatchParticipants(input: {
    sourceMatchId: string;
    targetMatchId: string;
    bindingSource: Extract<
      AccountMatchBindingSource,
      "inherited_recreate" | "inherited_series_next"
    >;
  }): Promise<void> {
    const bindings = await this.storage.listMatchParticipants(
      input.sourceMatchId,
    );
    for (const binding of bindings) {
      await this.storage.bindParticipant({
        ...binding,
        matchId: input.targetMatchId,
        boundAt: this.now(),
        bindingSource: input.bindingSource,
      });
    }
  }

  async reconcileSeriesNextParticipantBindings(
    record: StoredMatch,
  ): Promise<void> {
    const nextMatchId = record.match.series?.nextMatchId;
    if (!nextMatchId) return;
    await this.inheritMatchParticipants({
      sourceMatchId: record.match.matchId,
      targetMatchId: nextMatchId,
      bindingSource: "inherited_series_next",
    });
  }

  async startupReconciliationInput(): Promise<{
    missingGameResultMatchIds: string[];
    boundMatchIds: string[];
  }> {
    const [missingGameResultMatchIds, boundMatchIds] = await Promise.all([
      this.storage.listMatchIdsWithMissingGameResults(),
      this.storage.listBoundMatchIds(),
    ]);
    return { missingGameResultMatchIds, boundMatchIds };
  }

  hasMissingNextMatchParticipantBindings(
    sourceMatchId: string,
    targetMatchId: string,
  ): Promise<boolean> {
    return this.storage.hasMissingNextMatchParticipantBindings(
      sourceMatchId,
      targetMatchId,
    );
  }

  reconcileSeriesNextParticipantBindingsFor(
    sourceMatchId: string,
    targetMatchId: string,
  ): Promise<void> {
    return this.inheritMatchParticipants({
      sourceMatchId,
      targetMatchId,
      bindingSource: "inherited_series_next",
    });
  }

  bindingsForMatch(matchId: string): Promise<AccountMatchParticipantBinding[]> {
    return this.storage.listMatchParticipants(matchId);
  }

  bindingsForAccount(
    accountId: string,
  ): Promise<AccountMatchParticipantBinding[]> {
    return this.storage.listMatchParticipantsForAccount(accountId);
  }

  async recordTerminalMatch(record: StoredMatch): Promise<void> {
    if (!isStatisticsTerminal(record)) return;
    const bindings = await this.storage.listMatchParticipants(
      record.match.matchId,
    );
    if (bindings.length === 0) return;
    const recordedAt =
      record.lifecycleResult?.occurredAt ??
      record.resultSnapshot?.finishedAt ??
      record.match.series?.results.find(
        (result) => result.matchId === record.match.matchId,
      )?.finishedAt ??
      record.match.updatedAt;
    const selfPlayAccounts = selfPlayAccountIds(bindings);
    for (const binding of bindings) {
      const projected = gameResultFor(
        record,
        bindings,
        binding,
        recordedAt,
        selfPlayAccounts.has(binding.accountId),
      );
      if (projected) await this.storage.recordGameResult(projected);
    }
    if (record.match.series?.status !== "finished") return;
    for (const binding of bindings) {
      const projected = seriesResultFor(
        record,
        bindings,
        binding,
        recordedAt,
        selfPlayAccounts.has(binding.accountId),
      );
      if (projected) await this.storage.recordSeriesResult(projected);
    }
  }

  gameResultsForAccount(accountId: string): Promise<AccountGameResultRecord[]> {
    return this.storage.listGameResultsForAccount(accountId);
  }

  seriesResultsForAccount(
    accountId: string,
  ): Promise<AccountSeriesResultRecord[]> {
    return this.storage.listSeriesResultsForAccount(accountId);
  }

  statisticsSince(): Promise<string> {
    return this.storage.statisticsSince();
  }

  async statisticsForAccount(
    accountId: string,
    query: AccountStatisticsQuery = {},
  ): Promise<ApiAccountStatistics> {
    const period = query.period ?? "all";
    const generatedAt = this.now();
    const filters = {
      ...(query.side ? { side: query.side } : {}),
      ...(query.opponentKind ? { opponentKind: query.opponentKind } : {}),
      ...(query.matchMode ? { matchMode: query.matchMode } : {}),
    };
    const aggregation = this.storage.aggregateStatisticsForAccount
      ? await this.storage.aggregateStatisticsForAccount(
          accountId,
          query,
          generatedAt,
        )
      : await aggregateStatisticsInMemory(
          this.storage,
          accountId,
          query,
          generatedAt,
        );
    return {
      schemaVersion: "netgrid-account-statistics-v1",
      statisticsSince: await this.storage.statisticsSince(),
      generatedAt,
      period,
      filters,
      totals: { ...aggregation.totals, selfPlay: aggregation.selfPlay },
      bySide: aggregation.bySide,
      byOpponentKind: aggregation.byOpponentKind,
      byMode: aggregation.byMode,
      byMatchFormat: aggregation.byMatchFormat,
      series: aggregation.series,
    };
  }

  async matchHistoryForAccount(
    accountId: string,
    query: AccountMatchHistoryQuery = {},
  ): Promise<ApiAccountMatchHistory> {
    const limit = Math.max(1, Math.min(50, Math.floor(query.limit ?? 20)));
    const generatedAt = this.now();
    const result = this.storage.listGameResultsPageForAccount
      ? await this.storage.listGameResultsPageForAccount(
          accountId,
          query,
          generatedAt,
          limit,
        )
      : await gameResultsPageInMemory(
          this.storage,
          accountId,
          query,
          generatedAt,
          limit,
        );
    return {
      schemaVersion: "netgrid-account-match-history-v1",
      statisticsSince: await this.storage.statisticsSince(),
      generatedAt,
      entries: result.records.map(historyEntry),
      ...(result.hasMore && result.records.length > 0
        ? { nextCursor: result.records.at(-1)!.accountGameResultId }
        : {}),
    };
  }

  async exportForAccount(accountId: string): Promise<{
    schemaVersion: "netgrid-account-statistics-export-v1";
    statistics: ApiAccountStatistics;
    games: ApiAccountMatchHistoryEntry[];
    series: Array<Omit<AccountSeriesResultRecord, "accountId">>;
  }> {
    const games = await this.storage.listGameResultsForAccount(accountId);
    const series = await this.storage.listSeriesResultsForAccount(accountId);
    return {
      schemaVersion: "netgrid-account-statistics-export-v1",
      statistics: await this.statisticsForAccount(accountId),
      games: games.map(historyEntry),
      series: series.map(({ accountId: _accountId, ...record }) => record),
    };
  }

  deleteAccountData(accountId: string): Promise<void> {
    return this.storage.deleteAccountData(accountId);
  }

  close(): void {
    this.storage.close?.();
  }
}

export type AccountStatisticsQuery = {
  period?: ApiAccountStatisticsPeriod;
  side?: Side;
  opponentKind?: ApiPlayerIdentityKind;
  matchMode?: ApiMatchMode;
};

export type AccountMatchHistoryQuery = AccountStatisticsQuery & {
  cursor?: string;
  limit?: number;
};

function bindingKey(
  matchId: string,
  participantSlot: ApiSeriesPlayerSlot,
): string {
  return `${matchId}:${participantSlot}`;
}

function isStatisticsTerminal(record: StoredMatch): boolean {
  if (record.match.status === "finished")
    return Boolean(
      record.gameState?.winner ?? record.lifecycleResult?.winnerSide,
    );
  if (record.match.status === "forfeited")
    return Boolean(record.lifecycleResult?.winnerSide);
  return record.match.status === "abandoned";
}

function gameResultFor(
  record: StoredMatch,
  bindings: AccountMatchParticipantBinding[],
  binding: AccountMatchParticipantBinding,
  recordedAt: string,
  selfPlay: boolean,
): AccountGameResultRecord | undefined {
  const side = sideForPlayer(record, binding.participantSlot);
  if (!side) return undefined;
  const opponentSlot = oppositePlayer(binding.participantSlot);
  const opponentSide = oppositeSide(side);
  const winner = record.lifecycleResult?.winnerSide ?? record.gameState?.winner;
  const outcome: ApiAccountStatisticsOutcome =
    record.match.status === "abandoned"
      ? "abandoned"
      : winner === "draw"
        ? "draw"
        : winner === side
          ? "win"
          : "loss";
  const agendaPointsFor = agendaPoints(record, side);
  const agendaPointsAgainst = agendaPoints(record, opponentSide);
  const statisticsEligible = !selfPlay && outcome !== "abandoned";
  return {
    accountGameResultId: deterministicId(
      "account_game",
      binding.accountId,
      record.match.matchId,
      binding.participantSlot,
    ),
    accountId: binding.accountId,
    originMatchId: record.match.matchId,
    participantSlot: binding.participantSlot,
    ...(record.match.series
      ? {
          seriesId: record.match.series.seriesId,
          gameNumber: record.match.series.gameNumber,
        }
      : {}),
    completedAt: recordedAt,
    side,
    outcome,
    finishKind: finishKindFor(record),
    opponentKind: playerKind(record, bindings, opponentSlot),
    matchMode: record.match.mode,
    matchFormat: record.match.settings.matchFormat,
    cardPool: record.match.settings.cardPool ?? "originalset",
    agendaPointsFor,
    agendaPointsAgainst,
    matchPoints:
      winner === "draw"
        ? agendaPointsFor
        : winner === side
          ? SERIES_WIN_MATCH_POINTS
          : agendaPointsFor,
    statisticsEligible,
    ...(selfPlay ? { exclusionReason: "self_play" as const } : {}),
    recordedAt,
  };
}

function seriesResultFor(
  record: StoredMatch,
  bindings: AccountMatchParticipantBinding[],
  binding: AccountMatchParticipantBinding,
  recordedAt: string,
  selfPlay: boolean,
): AccountSeriesResultRecord | undefined {
  const series = record.match.series;
  if (!series || series.status !== "finished" || series.results.length === 0)
    return undefined;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let matchPointsFor = 0;
  let matchPointsAgainst = 0;
  let agendaPointsFor = 0;
  let agendaPointsAgainst = 0;
  for (const game of series.results) {
    const ownSide =
      game.runnerPlayer === binding.participantSlot ? "runner" : "corp";
    const ownAgenda =
      ownSide === "runner" ? game.runnerAgendaPoints : game.corpAgendaPoints;
    const opposingAgenda =
      ownSide === "runner" ? game.corpAgendaPoints : game.runnerAgendaPoints;
    const winnerPlayer =
      game.winner === "draw"
        ? "draw"
        : game.winner === "runner"
          ? game.runnerPlayer
          : game.corpPlayer;
    if (winnerPlayer === "draw") draws += 1;
    else if (winnerPlayer === binding.participantSlot) wins += 1;
    else losses += 1;
    agendaPointsFor += ownAgenda;
    agendaPointsAgainst += opposingAgenda;
    matchPointsFor +=
      winnerPlayer === binding.participantSlot
        ? SERIES_WIN_MATCH_POINTS
        : ownAgenda;
    matchPointsAgainst +=
      winnerPlayer === oppositePlayer(binding.participantSlot)
        ? SERIES_WIN_MATCH_POINTS
        : opposingAgenda;
  }
  const outcome =
    matchPointsFor > matchPointsAgainst
      ? "win"
      : matchPointsFor < matchPointsAgainst
        ? "loss"
        : "draw";
  return {
    accountSeriesResultId: deterministicId(
      "account_series",
      binding.accountId,
      series.seriesId,
      binding.participantSlot,
    ),
    accountId: binding.accountId,
    seriesId: series.seriesId,
    participantSlot: binding.participantSlot,
    completedAt: record.match.updatedAt,
    outcome,
    opponentKind: playerKind(
      record,
      bindings,
      oppositePlayer(binding.participantSlot),
    ),
    gamesPlayed: series.results.length,
    wins,
    losses,
    draws,
    matchPointsFor,
    matchPointsAgainst,
    agendaPointsFor,
    agendaPointsAgainst,
    statisticsEligible: !selfPlay,
    ...(selfPlay ? { exclusionReason: "self_play" as const } : {}),
    recordedAt,
  };
}

function sideForPlayer(
  record: StoredMatch,
  player: ApiSeriesPlayerSlot,
): Side | undefined {
  const series = record.match.series;
  if (series)
    return series.runnerPlayer === player
      ? "runner"
      : series.corpPlayer === player
        ? "corp"
        : undefined;
  const assignment =
    record.match.deckSetup.assignment ?? record.startLobby?.sideAssignment;
  if (assignment)
    return assignment.runnerPlayer === player
      ? "runner"
      : assignment.corpPlayer === player
        ? "corp"
        : undefined;
  const hostSide = record.sessions[0]?.side;
  if (!hostSide) return undefined;
  return player === "player_a" ? hostSide : oppositeSide(hostSide);
}

function playerKind(
  record: StoredMatch,
  bindings: AccountMatchParticipantBinding[],
  player: ApiSeriesPlayerSlot,
): ApiPlayerIdentityKind {
  if (bindings.some((binding) => binding.participantSlot === player))
    return "account";
  const side = sideForPlayer(record, player);
  if (side && record.match.aiControllers?.[side]?.type === "ai") return "ai";
  return record.match.participantIdentities?.[player] ?? "guest";
}

function agendaPoints(record: StoredMatch, side: Side): number {
  return record.gameState
    ? getPlayerView(record.gameState, side).own.agendaPoints
    : 0;
}

function finishKindFor(record: StoredMatch): ApiAccountStatisticsFinishKind {
  if (record.lifecycleResult?.reason === "forfeit") return "forfeit";
  if (record.lifecycleResult?.reason === "time_expired") return "time_expired";
  if (record.match.status === "abandoned")
    return record.lifecycleResult?.reason === "leave" ? "leave" : "abandon";
  return "regular";
}

function selfPlayAccountIds(
  bindings: AccountMatchParticipantBinding[],
): Set<string> {
  const byAccount = new Map<string, Set<ApiSeriesPlayerSlot>>();
  for (const binding of bindings)
    byAccount.set(
      binding.accountId,
      new Set([
        ...(byAccount.get(binding.accountId) ?? []),
        binding.participantSlot,
      ]),
    );
  return new Set(
    [...byAccount.entries()]
      .filter(([, slots]) => slots.size > 1)
      .map(([accountId]) => accountId),
  );
}

function oppositePlayer(player: ApiSeriesPlayerSlot): ApiSeriesPlayerSlot {
  return player === "player_a" ? "player_b" : "player_a";
}

function oppositeSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function deterministicId(prefix: string, ...parts: string[]): string {
  return `${prefix}_${createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 24)}`;
}

function gameResultKey(record: AccountGameResultRecord): string {
  return `${record.accountId}:${record.originMatchId}:${record.participantSlot}`;
}

function seriesResultKey(record: AccountSeriesResultRecord): string {
  return `${record.accountId}:${record.seriesId}:${record.participantSlot}`;
}

function recordIdempotently<T>(
  records: Map<string, T>,
  key: string,
  record: T,
): void {
  const existing = records.get(key);
  if (existing && stableRecord(existing) !== stableRecord(record))
    throw new Error("account_statistics_result_conflict");
  if (!existing) records.set(key, clone(record));
}

function stableRecord(value: unknown): string {
  return JSON.stringify(value);
}

type SqliteStatisticsFilter = { where: string; params: Array<string | number> };

type SqliteStatisticsBucketRow = {
  games_played: number | bigint;
  wins: number | bigint;
  losses: number | bigint;
  draws: number | bigint;
  forfeits_won: number | bigint;
  forfeits_lost: number | bigint;
  abandoned: number | bigint;
  agenda_points_for: number | bigint;
  agenda_points_against: number | bigint;
};

const SQLITE_STATISTICS_BUCKET_COLUMNS = `
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome <> 'abandoned' THEN 1 ELSE 0 END), 0) AS games_played,
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'win' THEN 1 ELSE 0 END), 0) AS wins,
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'loss' THEN 1 ELSE 0 END), 0) AS losses,
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'draw' THEN 1 ELSE 0 END), 0) AS draws,
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'win' AND finish_kind = 'forfeit' THEN 1 ELSE 0 END), 0) AS forfeits_won,
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'loss' AND finish_kind = 'forfeit' THEN 1 ELSE 0 END), 0) AS forfeits_lost,
  COALESCE(SUM(CASE WHEN outcome = 'abandoned' THEN 1 ELSE 0 END), 0) AS abandoned,
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome <> 'abandoned' THEN agenda_points_for ELSE 0 END), 0) AS agenda_points_for,
  COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome <> 'abandoned' THEN agenda_points_against ELSE 0 END), 0) AS agenda_points_against`;

function sqliteGameFilter(
  accountId: string,
  query: AccountStatisticsQuery,
  now: string,
): SqliteStatisticsFilter {
  const clauses = ["account_id = ?"];
  const params: Array<string | number> = [accountId];
  const completedSince = periodStart(query.period ?? "all", now);
  if (completedSince) {
    clauses.push("completed_at >= ?");
    params.push(completedSince);
  }
  if (query.side) {
    clauses.push("side = ?");
    params.push(query.side);
  }
  if (query.opponentKind) {
    clauses.push("opponent_kind = ?");
    params.push(query.opponentKind);
  }
  if (query.matchMode) {
    clauses.push("match_mode = ?");
    params.push(query.matchMode);
  }
  return { where: clauses.join(" AND "), params };
}

function aggregateBucket(
  db: DatabaseSync,
  filter: SqliteStatisticsFilter,
): ApiAccountStatisticsBucket {
  const row = db
    .prepare(
      `SELECT ${SQLITE_STATISTICS_BUCKET_COLUMNS} FROM account_game_results WHERE ${filter.where}`,
    )
    .get(...filter.params) as SqliteStatisticsBucketRow;
  return statisticsBucketFromRow(row);
}

function aggregateBucketsBy<Key extends string>(
  db: DatabaseSync,
  filter: SqliteStatisticsFilter,
  column: "side" | "opponent_kind" | "match_mode" | "match_format",
): Partial<Record<Key, ApiAccountStatisticsBucket>> {
  const rows = db
    .prepare(
      `SELECT ${column} AS bucket_key, ${SQLITE_STATISTICS_BUCKET_COLUMNS} FROM account_game_results WHERE ${filter.where} GROUP BY ${column}`,
    )
    .all(...filter.params) as Array<
    SqliteStatisticsBucketRow & { bucket_key: Key }
  >;
  return Object.fromEntries(
    rows.map((row) => [row.bucket_key, statisticsBucketFromRow(row)]),
  ) as Partial<Record<Key, ApiAccountStatisticsBucket>>;
}

function statisticsBucketFromRow(
  row: SqliteStatisticsBucketRow,
): ApiAccountStatisticsBucket {
  return {
    gamesPlayed: Number(row.games_played),
    wins: Number(row.wins),
    losses: Number(row.losses),
    draws: Number(row.draws),
    forfeitsWon: Number(row.forfeits_won),
    forfeitsLost: Number(row.forfeits_lost),
    abandoned: Number(row.abandoned),
    agendaPointsFor: Number(row.agenda_points_for),
    agendaPointsAgainst: Number(row.agenda_points_against),
  };
}

function aggregateSeriesStatistics(
  db: DatabaseSync,
  accountId: string,
  query: AccountStatisticsQuery,
  now: string,
): ApiAccountSeriesStatistics {
  const clauses = ["account_id = ?"];
  const params: Array<string | number> = [accountId];
  const completedSince = periodStart(query.period ?? "all", now);
  if (completedSince) {
    clauses.push("completed_at >= ?");
    params.push(completedSince);
  }
  if (query.opponentKind) {
    clauses.push("opponent_kind = ?");
    params.push(query.opponentKind);
  }
  const row = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN statistics_eligible = 1 THEN 1 ELSE 0 END), 0) AS series_played,
        COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'win' THEN 1 ELSE 0 END), 0) AS series_won,
        COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'loss' THEN 1 ELSE 0 END), 0) AS series_lost,
        COALESCE(SUM(CASE WHEN statistics_eligible = 1 AND outcome = 'draw' THEN 1 ELSE 0 END), 0) AS series_drawn,
        COALESCE(SUM(CASE WHEN statistics_eligible = 1 THEN match_points_for ELSE 0 END), 0) AS match_points_for,
        COALESCE(SUM(CASE WHEN statistics_eligible = 1 THEN match_points_against ELSE 0 END), 0) AS match_points_against
       FROM account_series_results WHERE ${clauses.join(" AND ")}`,
    )
    .get(...params) as Record<string, number | bigint>;
  return {
    seriesPlayed: Number(row.series_played),
    seriesWon: Number(row.series_won),
    seriesLost: Number(row.series_lost),
    seriesDrawn: Number(row.series_drawn),
    matchPointsFor: Number(row.match_points_for),
    matchPointsAgainst: Number(row.match_points_against),
  };
}

async function aggregateStatisticsInMemory(
  storage: AccountStatisticsStorage,
  accountId: string,
  query: AccountStatisticsQuery,
  now: string,
): Promise<AccountStatisticsAggregation> {
  const games = (await storage.listGameResultsForAccount(accountId)).filter(
    (record) => gameMatchesQuery(record, query, now),
  );
  const eligibleGames = games.filter((record) => record.statisticsEligible);
  const selfPlay = new Set(
    games
      .filter((record) => record.exclusionReason === "self_play")
      .map((record) => record.originMatchId),
  ).size;
  const bySide = { runner: statisticsBucket(), corp: statisticsBucket() };
  const byOpponentKind = {
    account: statisticsBucket(),
    guest: statisticsBucket(),
    ai: statisticsBucket(),
  };
  const byMode: Partial<Record<ApiMatchMode, ApiAccountStatisticsBucket>> = {};
  const byMatchFormat: Partial<
    Record<ApiMatchFormat, ApiAccountStatisticsBucket>
  > = {};
  for (const record of eligibleGames) {
    addGameToBucket(bySide[record.side], record);
    addGameToBucket(byOpponentKind[record.opponentKind], record);
    addGameToBucket((byMode[record.matchMode] ??= statisticsBucket()), record);
    addGameToBucket(
      (byMatchFormat[record.matchFormat] ??= statisticsBucket()),
      record,
    );
  }
  const totals = statisticsBucket();
  for (const record of eligibleGames) addGameToBucket(totals, record);
  for (const record of games.filter(
    (candidate) => candidate.outcome === "abandoned",
  )) {
    totals.abandoned += 1;
    bySide[record.side].abandoned += 1;
    byOpponentKind[record.opponentKind].abandoned += 1;
    (byMode[record.matchMode] ??= statisticsBucket()).abandoned += 1;
    (byMatchFormat[record.matchFormat] ??= statisticsBucket()).abandoned += 1;
  }
  const series =
    query.side || query.matchMode
      ? emptySeriesStatistics()
      : seriesStatistics(
          (await storage.listSeriesResultsForAccount(accountId)).filter(
            (record) => seriesMatchesQuery(record, query, now),
          ),
        );
  return {
    totals,
    selfPlay,
    bySide,
    byOpponentKind,
    byMode,
    byMatchFormat,
    series,
  };
}

async function gameResultsPageInMemory(
  storage: AccountStatisticsStorage,
  accountId: string,
  query: AccountMatchHistoryQuery,
  now: string,
  limit: number,
): Promise<{ records: AccountGameResultRecord[]; hasMore: boolean }> {
  const all = (await storage.listGameResultsForAccount(accountId))
    .filter((record) => gameMatchesQuery(record, query, now))
    .sort(
      (left, right) =>
        right.completedAt.localeCompare(left.completedAt) ||
        right.accountGameResultId.localeCompare(left.accountGameResultId),
    );
  const cursorIndex = query.cursor
    ? all.findIndex((record) => record.accountGameResultId === query.cursor)
    : -1;
  const start = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  return {
    records: all.slice(start, start + limit),
    hasMore: all.length > start + limit,
  };
}

function periodStart(
  period: ApiAccountStatisticsPeriod,
  now: string,
): string | undefined {
  if (period === "all") return undefined;
  const days = period === "30d" ? 30 : 90;
  return new Date(Date.parse(now) - days * 24 * 60 * 60 * 1000).toISOString();
}

function statisticsBucket(): ApiAccountStatisticsBucket {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    forfeitsWon: 0,
    forfeitsLost: 0,
    abandoned: 0,
    agendaPointsFor: 0,
    agendaPointsAgainst: 0,
  };
}

function addGameToBucket(
  bucket: ApiAccountStatisticsBucket,
  record: AccountGameResultRecord,
): void {
  if (record.outcome === "abandoned") return;
  bucket.gamesPlayed += 1;
  if (record.outcome === "win") bucket.wins += 1;
  else if (record.outcome === "loss") bucket.losses += 1;
  else bucket.draws += 1;
  if (record.finishKind === "forfeit" && record.outcome === "win")
    bucket.forfeitsWon += 1;
  if (record.finishKind === "forfeit" && record.outcome === "loss")
    bucket.forfeitsLost += 1;
  bucket.agendaPointsFor += record.agendaPointsFor;
  bucket.agendaPointsAgainst += record.agendaPointsAgainst;
}

function emptySeriesStatistics(): ApiAccountSeriesStatistics {
  return {
    seriesPlayed: 0,
    seriesWon: 0,
    seriesLost: 0,
    seriesDrawn: 0,
    matchPointsFor: 0,
    matchPointsAgainst: 0,
  };
}

function seriesStatistics(
  records: AccountSeriesResultRecord[],
): ApiAccountSeriesStatistics {
  const result = emptySeriesStatistics();
  for (const record of records.filter(
    (candidate) => candidate.statisticsEligible,
  )) {
    result.seriesPlayed += 1;
    if (record.outcome === "win") result.seriesWon += 1;
    else if (record.outcome === "loss") result.seriesLost += 1;
    else result.seriesDrawn += 1;
    result.matchPointsFor += record.matchPointsFor;
    result.matchPointsAgainst += record.matchPointsAgainst;
  }
  return result;
}

function gameMatchesQuery(
  record: AccountGameResultRecord,
  query: AccountStatisticsQuery,
  now: string,
): boolean {
  if (!withinPeriod(record.completedAt, query.period ?? "all", now))
    return false;
  if (query.side && record.side !== query.side) return false;
  if (query.opponentKind && record.opponentKind !== query.opponentKind)
    return false;
  return !query.matchMode || record.matchMode === query.matchMode;
}

function seriesMatchesQuery(
  record: AccountSeriesResultRecord,
  query: AccountStatisticsQuery,
  now: string,
): boolean {
  if (!withinPeriod(record.completedAt, query.period ?? "all", now))
    return false;
  return !query.opponentKind || record.opponentKind === query.opponentKind;
}

function withinPeriod(
  completedAt: string,
  period: ApiAccountStatisticsPeriod,
  now: string,
): boolean {
  if (period === "all") return true;
  const days = period === "30d" ? 30 : 90;
  return (
    Date.parse(completedAt) >= Date.parse(now) - days * 24 * 60 * 60 * 1000
  );
}

function historyEntry(
  record: AccountGameResultRecord,
): ApiAccountMatchHistoryEntry {
  return {
    resultId: record.accountGameResultId,
    matchId: record.originMatchId,
    completedAt: record.completedAt,
    side: record.side,
    outcome: record.outcome,
    finishKind: record.finishKind,
    opponentKind: record.opponentKind,
    matchMode: record.matchMode,
    matchFormat: record.matchFormat,
    cardPool: record.cardPool,
    agendaPointsFor: record.agendaPointsFor,
    agendaPointsAgainst: record.agendaPointsAgainst,
    matchPoints: record.matchPoints,
    statisticsEligible: record.statisticsEligible,
    ...(record.exclusionReason
      ? { exclusionReason: record.exclusionReason }
      : {}),
    ...(record.seriesId && record.gameNumber
      ? { series: { seriesId: record.seriesId, gameNumber: record.gameNumber } }
      : {}),
  };
}

function gameResultFromRow(row: AccountGameResultRow): AccountGameResultRecord {
  return {
    accountGameResultId: row.account_game_result_id,
    accountId: row.account_id,
    originMatchId: row.origin_match_id,
    participantSlot: row.participant_slot,
    ...(row.series_id ? { seriesId: row.series_id } : {}),
    ...(row.game_number !== null ? { gameNumber: row.game_number } : {}),
    completedAt: row.completed_at,
    side: row.side,
    outcome: row.outcome,
    finishKind: row.finish_kind,
    opponentKind: row.opponent_kind,
    matchMode: row.match_mode,
    matchFormat: row.match_format,
    cardPool: row.card_pool,
    agendaPointsFor: row.agenda_points_for,
    agendaPointsAgainst: row.agenda_points_against,
    matchPoints: row.match_points,
    statisticsEligible: row.statistics_eligible === 1,
    ...(row.exclusion_reason ? { exclusionReason: row.exclusion_reason } : {}),
    recordedAt: row.recorded_at,
  };
}

function seriesResultFromRow(
  row: AccountSeriesResultRow,
): AccountSeriesResultRecord {
  return {
    accountSeriesResultId: row.account_series_result_id,
    accountId: row.account_id,
    seriesId: row.series_id,
    participantSlot: row.participant_slot,
    completedAt: row.completed_at,
    outcome: row.outcome,
    opponentKind: row.opponent_kind,
    gamesPlayed: row.games_played,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    matchPointsFor: row.match_points_for,
    matchPointsAgainst: row.match_points_against,
    agendaPointsFor: row.agenda_points_for,
    agendaPointsAgainst: row.agenda_points_against,
    statisticsEligible: row.statistics_eligible === 1,
    ...(row.exclusion_reason ? { exclusionReason: row.exclusion_reason } : {}),
    recordedAt: row.recorded_at,
  };
}

type AccountGameResultRow = {
  account_game_result_id: string;
  account_id: string;
  origin_match_id: string;
  participant_slot: ApiSeriesPlayerSlot;
  series_id: string | null;
  game_number: number | null;
  completed_at: string;
  side: Side;
  outcome: ApiAccountStatisticsOutcome;
  finish_kind: ApiAccountStatisticsFinishKind;
  opponent_kind: ApiPlayerIdentityKind;
  match_mode: ApiMatchMode;
  match_format: ApiMatchFormat;
  card_pool: ApiMatchCardPool;
  agenda_points_for: number;
  agenda_points_against: number;
  match_points: number;
  statistics_eligible: number;
  exclusion_reason: ApiAccountStatisticsExclusionReason | null;
  recorded_at: string;
};

type AccountSeriesResultRow = {
  account_series_result_id: string;
  account_id: string;
  series_id: string;
  participant_slot: ApiSeriesPlayerSlot;
  completed_at: string;
  outcome: Exclude<ApiAccountStatisticsOutcome, "abandoned">;
  opponent_kind: ApiPlayerIdentityKind;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  match_points_for: number;
  match_points_against: number;
  agenda_points_for: number;
  agenda_points_against: number;
  statistics_eligible: number;
  exclusion_reason: ApiAccountStatisticsExclusionReason | null;
  recorded_at: string;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
