import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ApiSeriesPlayerSlot } from "@netgrid/shared";
import { SqliteMatchStorage } from "./storage-sqlite";

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

export type AccountStatisticsStorage = {
  bindParticipant(binding: AccountMatchParticipantBinding): Promise<void>;
  listMatchParticipants(matchId: string): Promise<AccountMatchParticipantBinding[]>;
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

  close(): void {
    this.storage.close?.();
  }
}

function bindingKey(matchId: string, participantSlot: ApiSeriesPlayerSlot): string {
  return `${matchId}:${participantSlot}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
