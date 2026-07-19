import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getPlayerView } from "@netgrid/engine";
import type {
  ApiAccountStatisticsExclusionReason,
  ApiAccountStatisticsFinishKind,
  ApiAccountStatisticsOutcome,
  ApiMatchCardPool,
  ApiMatchFormat,
  ApiMatchMode,
  ApiPlayerIdentityKind,
  ApiSeriesPlayerSlot,
  Side,
} from "@netgrid/shared";
import type { StoredMatch } from "./multiplayer";
import { SqliteMatchStorage } from "./storage-sqlite";

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
  listMatchParticipants(matchId: string): Promise<AccountMatchParticipantBinding[]>;
  recordGameResult(record: AccountGameResultRecord): Promise<void>;
  recordSeriesResult(record: AccountSeriesResultRecord): Promise<void>;
  listGameResultsForAccount(accountId: string): Promise<AccountGameResultRecord[]>;
  listSeriesResultsForAccount(accountId: string): Promise<AccountSeriesResultRecord[]>;
  statisticsSince(): Promise<string>;
  close?(): void;
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

  async bindParticipant(binding: AccountMatchParticipantBinding): Promise<void> {
    const key = bindingKey(binding.matchId, binding.participantSlot);
    const existing = this.bindings.get(key);
    if (existing && existing.accountId !== binding.accountId) throw new AccountStatisticsError("account_match_binding_conflict");
    if (!existing) this.bindings.set(key, clone(binding));
  }

  async listMatchParticipants(matchId: string): Promise<AccountMatchParticipantBinding[]> {
    return [...this.bindings.values()]
      .filter((binding) => binding.matchId === matchId)
      .sort((left, right) => left.participantSlot.localeCompare(right.participantSlot))
      .map((binding) => clone(binding));
  }

  async recordGameResult(record: AccountGameResultRecord): Promise<void> {
    recordIdempotently(this.gameResults, gameResultKey(record), record);
  }

  async recordSeriesResult(record: AccountSeriesResultRecord): Promise<void> {
    recordIdempotently(this.seriesResults, seriesResultKey(record), record);
  }

  async listGameResultsForAccount(accountId: string): Promise<AccountGameResultRecord[]> {
    return [...this.gameResults.values()].filter((record) => record.accountId === accountId).map((record) => clone(record));
  }

  async listSeriesResultsForAccount(accountId: string): Promise<AccountSeriesResultRecord[]> {
    return [...this.seriesResults.values()].filter((record) => record.accountId === accountId).map((record) => clone(record));
  }

  async statisticsSince(): Promise<string> {
    return this.since;
  }
}

export class SqliteAccountStatisticsStorage implements AccountStatisticsStorage {
  private readonly db: DatabaseSync;

  constructor(options: { dbPath: string; backupDir?: string }) {
    const dbPath = resolve(options.dbPath);
    mkdirSync(dirname(dbPath), { recursive: true });
    const schemaOwner = new SqliteMatchStorage({ dbPath, backupDir: resolve(options.backupDir ?? join(dirname(dbPath), "backups")) });
    schemaOwner.close();
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA foreign_keys = ON");
  }

  async bindParticipant(binding: AccountMatchParticipantBinding): Promise<void> {
    this.db.prepare(
      `INSERT INTO account_match_participants (match_id, participant_slot, account_id, bound_at, binding_source)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(match_id, participant_slot) DO NOTHING`,
    ).run(binding.matchId, binding.participantSlot, binding.accountId, binding.boundAt, binding.bindingSource);
    const stored = this.db.prepare(
      "SELECT account_id AS accountId FROM account_match_participants WHERE match_id = ? AND participant_slot = ?",
    ).get(binding.matchId, binding.participantSlot) as { accountId: string } | undefined;
    if (stored?.accountId !== binding.accountId) throw new AccountStatisticsError("account_match_binding_conflict");
  }

  async listMatchParticipants(matchId: string): Promise<AccountMatchParticipantBinding[]> {
    return this.db.prepare(
      `SELECT match_id AS matchId, participant_slot AS participantSlot, account_id AS accountId,
        bound_at AS boundAt, binding_source AS bindingSource
       FROM account_match_participants WHERE match_id = ? ORDER BY participant_slot ASC`,
    ).all(matchId) as AccountMatchParticipantBinding[];
  }

  async recordGameResult(record: AccountGameResultRecord): Promise<void> {
    this.db.prepare(
      `INSERT INTO account_game_results (
        account_game_result_id, account_id, origin_match_id, participant_slot, series_id, game_number,
        completed_at, side, outcome, finish_kind, opponent_kind, match_mode, match_format, card_pool,
        agenda_points_for, agenda_points_against, match_points, statistics_eligible, exclusion_reason, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, origin_match_id, participant_slot) DO NOTHING`,
    ).run(
      record.accountGameResultId, record.accountId, record.originMatchId, record.participantSlot,
      record.seriesId ?? null, record.gameNumber ?? null, record.completedAt, record.side, record.outcome,
      record.finishKind, record.opponentKind, record.matchMode, record.matchFormat, record.cardPool,
      record.agendaPointsFor, record.agendaPointsAgainst, record.matchPoints, record.statisticsEligible ? 1 : 0,
      record.exclusionReason ?? null, record.recordedAt,
    );
    const stored = this.gameResult(record.accountId, record.originMatchId, record.participantSlot);
    if (!stored || stableRecord(stored) !== stableRecord(record)) throw new Error("account_game_result_conflict");
  }

  async recordSeriesResult(record: AccountSeriesResultRecord): Promise<void> {
    this.db.prepare(
      `INSERT INTO account_series_results (
        account_series_result_id, account_id, series_id, participant_slot, completed_at, outcome, opponent_kind,
        games_played, wins, losses, draws, match_points_for, match_points_against,
        agenda_points_for, agenda_points_against, statistics_eligible, exclusion_reason, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, series_id, participant_slot) DO NOTHING`,
    ).run(
      record.accountSeriesResultId, record.accountId, record.seriesId, record.participantSlot, record.completedAt,
      record.outcome, record.opponentKind, record.gamesPlayed, record.wins, record.losses, record.draws,
      record.matchPointsFor, record.matchPointsAgainst, record.agendaPointsFor, record.agendaPointsAgainst,
      record.statisticsEligible ? 1 : 0, record.exclusionReason ?? null, record.recordedAt,
    );
    const stored = this.seriesResult(record.accountId, record.seriesId, record.participantSlot);
    if (!stored || stableRecord(stored) !== stableRecord(record)) throw new Error("account_series_result_conflict");
  }

  async listGameResultsForAccount(accountId: string): Promise<AccountGameResultRecord[]> {
    return (this.db.prepare(
      "SELECT * FROM account_game_results WHERE account_id = ? ORDER BY completed_at DESC, account_game_result_id DESC",
    ).all(accountId) as AccountGameResultRow[]).map(gameResultFromRow);
  }

  async listSeriesResultsForAccount(accountId: string): Promise<AccountSeriesResultRecord[]> {
    return (this.db.prepare(
      "SELECT * FROM account_series_results WHERE account_id = ? ORDER BY completed_at DESC, account_series_result_id DESC",
    ).all(accountId) as AccountSeriesResultRow[]).map(seriesResultFromRow);
  }

  async statisticsSince(): Promise<string> {
    const row = this.db.prepare("SELECT value FROM storage_meta WHERE key = 'account_statistics_since'").get() as { value?: string } | undefined;
    return row?.value ?? new Date(0).toISOString();
  }

  private gameResult(accountId: string, matchId: string, participantSlot: ApiSeriesPlayerSlot): AccountGameResultRecord | undefined {
    const row = this.db.prepare(
      "SELECT * FROM account_game_results WHERE account_id = ? AND origin_match_id = ? AND participant_slot = ?",
    ).get(accountId, matchId, participantSlot) as AccountGameResultRow | undefined;
    return row ? gameResultFromRow(row) : undefined;
  }

  private seriesResult(accountId: string, seriesId: string, participantSlot: ApiSeriesPlayerSlot): AccountSeriesResultRecord | undefined {
    const row = this.db.prepare(
      "SELECT * FROM account_series_results WHERE account_id = ? AND series_id = ? AND participant_slot = ?",
    ).get(accountId, seriesId, participantSlot) as AccountSeriesResultRow | undefined;
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
    bindingSource: Extract<AccountMatchBindingSource, "authenticated_create" | "authenticated_join">;
  }): Promise<void> {
    return this.storage.bindParticipant({ ...input, boundAt: this.now() });
  }

  async inheritMatchParticipants(input: {
    sourceMatchId: string;
    targetMatchId: string;
    bindingSource: Extract<AccountMatchBindingSource, "inherited_recreate" | "inherited_series_next">;
  }): Promise<void> {
    const bindings = await this.storage.listMatchParticipants(input.sourceMatchId);
    for (const binding of bindings) {
      await this.storage.bindParticipant({
        ...binding,
        matchId: input.targetMatchId,
        boundAt: this.now(),
        bindingSource: input.bindingSource,
      });
    }
  }

  bindingsForMatch(matchId: string): Promise<AccountMatchParticipantBinding[]> {
    return this.storage.listMatchParticipants(matchId);
  }

  async recordTerminalMatch(record: StoredMatch): Promise<void> {
    if (!isStatisticsTerminal(record)) return;
    const bindings = await this.storage.listMatchParticipants(record.match.matchId);
    if (bindings.length === 0) return;
    const recordedAt = record.lifecycleResult?.occurredAt ?? record.match.updatedAt;
    const selfPlayAccounts = selfPlayAccountIds(bindings);
    for (const binding of bindings) {
      const projected = gameResultFor(record, bindings, binding, recordedAt, selfPlayAccounts.has(binding.accountId));
      if (projected) await this.storage.recordGameResult(projected);
    }
    if (record.match.series?.status !== "finished") return;
    for (const binding of bindings) {
      const projected = seriesResultFor(record, bindings, binding, recordedAt, selfPlayAccounts.has(binding.accountId));
      if (projected) await this.storage.recordSeriesResult(projected);
    }
  }

  gameResultsForAccount(accountId: string): Promise<AccountGameResultRecord[]> {
    return this.storage.listGameResultsForAccount(accountId);
  }

  seriesResultsForAccount(accountId: string): Promise<AccountSeriesResultRecord[]> {
    return this.storage.listSeriesResultsForAccount(accountId);
  }

  statisticsSince(): Promise<string> {
    return this.storage.statisticsSince();
  }

  close(): void {
    this.storage.close?.();
  }
}

function bindingKey(matchId: string, participantSlot: ApiSeriesPlayerSlot): string {
  return `${matchId}:${participantSlot}`;
}

function isStatisticsTerminal(record: StoredMatch): boolean {
  if (record.match.status === "finished") return Boolean(record.gameState?.winner ?? record.lifecycleResult?.winnerSide);
  if (record.match.status === "forfeited") return Boolean(record.lifecycleResult?.winnerSide);
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
  const outcome: ApiAccountStatisticsOutcome = record.match.status === "abandoned"
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
    accountGameResultId: deterministicId("account_game", binding.accountId, record.match.matchId, binding.participantSlot),
    accountId: binding.accountId,
    originMatchId: record.match.matchId,
    participantSlot: binding.participantSlot,
    ...(record.match.series ? { seriesId: record.match.series.seriesId, gameNumber: record.match.series.gameNumber } : {}),
    completedAt: record.lifecycleResult?.occurredAt ?? record.match.updatedAt,
    side,
    outcome,
    finishKind: finishKindFor(record),
    opponentKind: playerKind(record, bindings, opponentSlot),
    matchMode: record.match.mode,
    matchFormat: record.match.settings.matchFormat,
    cardPool: record.match.settings.cardPool ?? "originalset",
    agendaPointsFor,
    agendaPointsAgainst,
    matchPoints: winner === "draw" ? agendaPointsFor : winner === side ? SERIES_WIN_MATCH_POINTS : agendaPointsFor,
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
  if (!series || series.status !== "finished" || series.results.length === 0) return undefined;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let matchPointsFor = 0;
  let matchPointsAgainst = 0;
  let agendaPointsFor = 0;
  let agendaPointsAgainst = 0;
  for (const game of series.results) {
    const ownSide = game.runnerPlayer === binding.participantSlot ? "runner" : "corp";
    const ownAgenda = ownSide === "runner" ? game.runnerAgendaPoints : game.corpAgendaPoints;
    const opposingAgenda = ownSide === "runner" ? game.corpAgendaPoints : game.runnerAgendaPoints;
    const winnerPlayer = game.winner === "draw" ? "draw" : game.winner === "runner" ? game.runnerPlayer : game.corpPlayer;
    if (winnerPlayer === "draw") draws += 1;
    else if (winnerPlayer === binding.participantSlot) wins += 1;
    else losses += 1;
    agendaPointsFor += ownAgenda;
    agendaPointsAgainst += opposingAgenda;
    matchPointsFor += winnerPlayer === binding.participantSlot ? SERIES_WIN_MATCH_POINTS : ownAgenda;
    matchPointsAgainst += winnerPlayer === oppositePlayer(binding.participantSlot) ? SERIES_WIN_MATCH_POINTS : opposingAgenda;
  }
  const outcome = matchPointsFor > matchPointsAgainst ? "win" : matchPointsFor < matchPointsAgainst ? "loss" : "draw";
  return {
    accountSeriesResultId: deterministicId("account_series", binding.accountId, series.seriesId, binding.participantSlot),
    accountId: binding.accountId,
    seriesId: series.seriesId,
    participantSlot: binding.participantSlot,
    completedAt: record.match.updatedAt,
    outcome,
    opponentKind: playerKind(record, bindings, oppositePlayer(binding.participantSlot)),
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

function sideForPlayer(record: StoredMatch, player: ApiSeriesPlayerSlot): Side | undefined {
  const series = record.match.series;
  if (series) return series.runnerPlayer === player ? "runner" : series.corpPlayer === player ? "corp" : undefined;
  const assignment = record.match.deckSetup.assignment ?? record.startLobby?.sideAssignment;
  if (assignment) return assignment.runnerPlayer === player ? "runner" : assignment.corpPlayer === player ? "corp" : undefined;
  const hostSide = record.sessions[0]?.side;
  if (!hostSide) return undefined;
  return player === "player_a" ? hostSide : oppositeSide(hostSide);
}

function playerKind(record: StoredMatch, bindings: AccountMatchParticipantBinding[], player: ApiSeriesPlayerSlot): ApiPlayerIdentityKind {
  if (bindings.some((binding) => binding.participantSlot === player)) return "account";
  const side = sideForPlayer(record, player);
  if (side && record.match.aiControllers?.[side]?.type === "ai") return "ai";
  return record.match.participantIdentities?.[player] ?? "guest";
}

function agendaPoints(record: StoredMatch, side: Side): number {
  return record.gameState ? getPlayerView(record.gameState, side).own.agendaPoints : 0;
}

function finishKindFor(record: StoredMatch): ApiAccountStatisticsFinishKind {
  if (record.lifecycleResult?.reason === "forfeit") return "forfeit";
  if (record.lifecycleResult?.reason === "time_expired") return "time_expired";
  if (record.match.status === "abandoned") return record.lifecycleResult?.reason === "leave" ? "leave" : "abandon";
  return "regular";
}

function selfPlayAccountIds(bindings: AccountMatchParticipantBinding[]): Set<string> {
  const byAccount = new Map<string, Set<ApiSeriesPlayerSlot>>();
  for (const binding of bindings) byAccount.set(binding.accountId, new Set([...(byAccount.get(binding.accountId) ?? []), binding.participantSlot]));
  return new Set([...byAccount.entries()].filter(([, slots]) => slots.size > 1).map(([accountId]) => accountId));
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

function recordIdempotently<T>(records: Map<string, T>, key: string, record: T): void {
  const existing = records.get(key);
  if (existing && stableRecord(existing) !== stableRecord(record)) throw new Error("account_statistics_result_conflict");
  if (!existing) records.set(key, clone(record));
}

function stableRecord(value: unknown): string {
  return JSON.stringify(value);
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

function seriesResultFromRow(row: AccountSeriesResultRow): AccountSeriesResultRecord {
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
