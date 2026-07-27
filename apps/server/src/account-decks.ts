import standardDeckCatalogData from "../../../data/decks/standard-deck-catalog-1.0.0.json";
import profilesData from "../../../data/decks/deck-format-profiles-0.8.json";
import profilesData130 from "../../../data/decks/deck-format-profiles-1.3.0.json";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createRuntimeCardsById } from "@netgrid/catalog";
import {
  createDeckSnapshot,
  validateEditableDeck,
  type DeckCardEntry,
  type DeckFormatProfile,
  type DeckSide,
  type DeckSnapshot,
  type DeckTableLayout,
  type DeckValidationContext,
  type EditableDeck,
} from "@netgrid/decks";
import {
  configureSqliteConnection,
  runSqliteStorageOperation,
  runSqliteTransaction,
  SqliteMatchStorage,
} from "./storage-sqlite";

export const DEFAULT_ACCOUNT_DECK_LIMIT = 50;

export type AccountDeckDraftInput = {
  name: string;
  side: DeckSide;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  cards: DeckCardEntry[];
  notes?: string;
  tableLayout?: DeckTableLayout;
};

export type AccountDeckRecord = {
  cloudDeckId: string;
  ownerAccountId: string;
  deckVersion: number;
  deck: EditableDeck;
  validationStatus: "valid" | "invalid" | "needs_revalidation";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type AccountDeckQuota = {
  limit: number;
  used: number;
  remaining: number;
};
export type AccountDeckList = {
  decks: AccountDeckRecord[];
  quota: AccountDeckQuota;
};

export type StandardDeckCatalogEntry = {
  standardDeckId: string;
  version: string;
  status: "active";
  name: string;
  side: DeckSide;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  cards: DeckCardEntry[];
};

export type AccountDeckStorage = {
  createWithinLimit(record: AccountDeckRecord, limit: number): Promise<boolean>;
  listForOwner(ownerAccountId: string): Promise<AccountDeckRecord[]>;
  loadForOwner(
    ownerAccountId: string,
    cloudDeckId: string,
  ): Promise<AccountDeckRecord | undefined>;
  updateForOwner(
    record: AccountDeckRecord,
    expectedVersion: number,
  ): Promise<boolean>;
  deleteForOwner(
    ownerAccountId: string,
    cloudDeckId: string,
    deletedAt: string,
  ): Promise<boolean>;
  deleteAllForOwner(ownerAccountId: string): Promise<number>;
  close?(): void;
};

export class AccountDeckError extends Error {
  constructor(
    readonly code:
      | "account_deck_not_found"
      | "account_deck_limit_reached"
      | "account_deck_version_conflict"
      | "account_deck_invalid"
      | "standard_deck_not_found"
      | "account_deck_input_invalid",
  ) {
    super(code);
    this.name = "AccountDeckError";
  }
}

export class InMemoryAccountDeckStorage implements AccountDeckStorage {
  private readonly records = new Map<string, AccountDeckRecord>();

  async createWithinLimit(
    record: AccountDeckRecord,
    limit: number,
  ): Promise<boolean> {
    const used = [...this.records.values()].filter(
      (candidate) =>
        candidate.ownerAccountId === record.ownerAccountId &&
        !candidate.deletedAt,
    ).length;
    if (used >= limit) return false;
    this.records.set(record.cloudDeckId, clone(record));
    return true;
  }

  async listForOwner(ownerAccountId: string): Promise<AccountDeckRecord[]> {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.ownerAccountId === ownerAccountId && !record.deletedAt,
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(clone);
  }

  async loadForOwner(
    ownerAccountId: string,
    cloudDeckId: string,
  ): Promise<AccountDeckRecord | undefined> {
    const record = this.records.get(cloudDeckId);
    return record?.ownerAccountId === ownerAccountId && !record.deletedAt
      ? clone(record)
      : undefined;
  }

  async updateForOwner(
    record: AccountDeckRecord,
    expectedVersion: number,
  ): Promise<boolean> {
    const current = this.records.get(record.cloudDeckId);
    if (
      !current ||
      current.ownerAccountId !== record.ownerAccountId ||
      current.deletedAt ||
      current.deckVersion !== expectedVersion
    )
      return false;
    this.records.set(record.cloudDeckId, clone(record));
    return true;
  }

  async deleteForOwner(
    ownerAccountId: string,
    cloudDeckId: string,
    deletedAt: string,
  ): Promise<boolean> {
    const current = this.records.get(cloudDeckId);
    if (
      !current ||
      current.ownerAccountId !== ownerAccountId ||
      current.deletedAt
    )
      return false;
    this.records.set(cloudDeckId, {
      ...current,
      deletedAt,
      updatedAt: deletedAt,
    });
    return true;
  }

  async deleteAllForOwner(ownerAccountId: string): Promise<number> {
    let deleted = 0;
    for (const [cloudDeckId, record] of this.records) {
      if (record.ownerAccountId !== ownerAccountId) continue;
      this.records.delete(cloudDeckId);
      deleted += 1;
    }
    return deleted;
  }
}

export class SqliteAccountDeckStorage implements AccountDeckStorage {
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

  async createWithinLimit(
    record: AccountDeckRecord,
    limit: number,
  ): Promise<boolean> {
    return runSqliteTransaction(this.db, () => {
      const used = Number(
        (
          this.db
            .prepare(
              "SELECT COUNT(*) AS count FROM account_decks WHERE owner_account_id = ? AND deleted_at IS NULL",
            )
            .get(record.ownerAccountId) as { count: number }
        ).count,
      );
      if (used >= limit) {
        return false;
      }
      this.insert(record);
      return true;
    });
  }

  async listForOwner(ownerAccountId: string): Promise<AccountDeckRecord[]> {
    return (
      this.db
        .prepare(
          "SELECT * FROM account_decks WHERE owner_account_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC",
        )
        .all(ownerAccountId) as AccountDeckRow[]
    ).map(accountDeckFromRow);
  }

  async loadForOwner(
    ownerAccountId: string,
    cloudDeckId: string,
  ): Promise<AccountDeckRecord | undefined> {
    const row = this.db
      .prepare(
        "SELECT * FROM account_decks WHERE cloud_deck_id = ? AND owner_account_id = ? AND deleted_at IS NULL",
      )
      .get(cloudDeckId, ownerAccountId) as AccountDeckRow | undefined;
    return row ? accountDeckFromRow(row) : undefined;
  }

  async updateForOwner(
    record: AccountDeckRecord,
    expectedVersion: number,
  ): Promise<boolean> {
    const result = runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `UPDATE account_decks SET deck_version = ?, name = ?, side = ?, identity_card_id = ?,
        card_pool_snapshot_id = ?, card_pool_version = ?, format_profile_id = ?, format_profile_version = ?,
        validation_status = ?, deck_json = ?, updated_at = ?
       WHERE cloud_deck_id = ? AND owner_account_id = ? AND deck_version = ? AND deleted_at IS NULL`,
        )
        .run(
          record.deckVersion,
          record.deck.name,
          record.deck.side,
          record.deck.identityCardId,
          record.deck.cardPoolSnapshotId,
          record.deck.cardPoolVersion ?? null,
          record.deck.formatProfileId,
          record.deck.formatProfileVersion ?? null,
          record.validationStatus,
          serializeDeck(record.deck),
          record.updatedAt,
          record.cloudDeckId,
          record.ownerAccountId,
          expectedVersion,
        ),
    );
    return Number(result.changes) === 1;
  }

  async deleteForOwner(
    ownerAccountId: string,
    cloudDeckId: string,
    deletedAt: string,
  ): Promise<boolean> {
    const result = runSqliteStorageOperation(() =>
      this.db
        .prepare(
          "UPDATE account_decks SET deleted_at = ?, updated_at = ? WHERE cloud_deck_id = ? AND owner_account_id = ? AND deleted_at IS NULL",
        )
        .run(deletedAt, deletedAt, cloudDeckId, ownerAccountId),
    );
    return Number(result.changes) === 1;
  }

  async deleteAllForOwner(ownerAccountId: string): Promise<number> {
    return Number(
      runSqliteStorageOperation(
        () =>
          this.db
            .prepare("DELETE FROM account_decks WHERE owner_account_id = ?")
            .run(ownerAccountId).changes,
      ),
    );
  }

  close(): void {
    this.db.close();
  }

  private insert(record: AccountDeckRecord): void {
    this.db
      .prepare(
        `INSERT INTO account_decks (
        cloud_deck_id, owner_account_id, deck_version, name, side, identity_card_id,
        card_pool_snapshot_id, card_pool_version, format_profile_id, format_profile_version,
        validation_status, deck_json, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.cloudDeckId,
        record.ownerAccountId,
        record.deckVersion,
        record.deck.name,
        record.deck.side,
        record.deck.identityCardId,
        record.deck.cardPoolSnapshotId,
        record.deck.cardPoolVersion ?? null,
        record.deck.formatProfileId,
        record.deck.formatProfileVersion ?? null,
        record.validationStatus,
        serializeDeck(record.deck),
        record.createdAt,
        record.updatedAt,
        record.deletedAt ?? null,
      );
  }
}

export class AccountDeckService {
  private readonly limit: number;
  private readonly now: () => string;
  private readonly standards: StandardDeckCatalogEntry[];

  constructor(
    private readonly storage: AccountDeckStorage,
    options: { limit?: number; now?: () => string } = {},
  ) {
    this.limit = validLimit(
      options.limit ??
        Number(
          process.env.NETGRID_ACCOUNT_DECK_LIMIT ?? DEFAULT_ACCOUNT_DECK_LIMIT,
        ),
    );
    this.now = options.now ?? (() => new Date().toISOString());
    this.standards = (
      standardDeckCatalogData.decks as StandardDeckCatalogEntry[]
    )
      .filter((deck) => deck.status === "active")
      .map(clone);
  }

  listStandards(): StandardDeckCatalogEntry[] {
    return this.standards.map(clone);
  }

  getStandard(standardDeckId: string): StandardDeckCatalogEntry {
    const standard = this.standards.find(
      (deck) => deck.standardDeckId === standardDeckId,
    );
    if (!standard) throw new AccountDeckError("standard_deck_not_found");
    return clone(standard);
  }

  standardSnapshot(standardDeckId: string): DeckSnapshot {
    const standard = this.getStandard(standardDeckId);
    return snapshotForDeck(
      standardAsEditable(
        standard,
        `${standardDeckCatalogData.curatedAt}T00:00:00.000Z`,
      ),
      `standard_${standard.standardDeckId}_${standard.version}`,
    );
  }

  async list(ownerAccountId: string): Promise<AccountDeckList> {
    const decks = await this.storage.listForOwner(ownerAccountId);
    return {
      decks,
      quota: {
        limit: this.limit,
        used: decks.length,
        remaining: Math.max(0, this.limit - decks.length),
      },
    };
  }

  async get(
    ownerAccountId: string,
    cloudDeckId: string,
  ): Promise<AccountDeckRecord> {
    const record = await this.storage.loadForOwner(ownerAccountId, cloudDeckId);
    if (!record) throw new AccountDeckError("account_deck_not_found");
    return record;
  }

  async create(
    ownerAccountId: string,
    input: AccountDeckDraftInput,
  ): Promise<AccountDeckRecord> {
    const now = this.now();
    const cloudDeckId = randomId("cloud_deck");
    const deck = editableFromInput(cloudDeckId, 1, input, now, now);
    const record = recordFor(ownerAccountId, cloudDeckId, 1, deck, now, now);
    if (!(await this.storage.createWithinLimit(record, this.limit)))
      throw new AccountDeckError("account_deck_limit_reached");
    return clone(record);
  }

  async copyStandard(
    ownerAccountId: string,
    standardDeckId: string,
    name?: string,
  ): Promise<AccountDeckRecord> {
    const standard = this.getStandard(standardDeckId);
    return this.create(ownerAccountId, {
      ...standard,
      name: validName(name ?? `${standard.name} – Kopie`),
    });
  }

  async update(
    ownerAccountId: string,
    cloudDeckId: string,
    expectedVersion: number,
    input: AccountDeckDraftInput,
  ): Promise<AccountDeckRecord> {
    const current = await this.get(ownerAccountId, cloudDeckId);
    if (current.deckVersion !== expectedVersion)
      throw new AccountDeckError("account_deck_version_conflict");
    const updatedAt = this.now();
    const nextVersion = expectedVersion + 1;
    const deck = editableFromInput(
      cloudDeckId,
      nextVersion,
      input,
      current.createdAt,
      updatedAt,
    );
    const record = recordFor(
      ownerAccountId,
      cloudDeckId,
      nextVersion,
      deck,
      current.createdAt,
      updatedAt,
    );
    if (!(await this.storage.updateForOwner(record, expectedVersion)))
      throw new AccountDeckError("account_deck_version_conflict");
    return clone(record);
  }

  async delete(ownerAccountId: string, cloudDeckId: string): Promise<void> {
    if (
      !(await this.storage.deleteForOwner(
        ownerAccountId,
        cloudDeckId,
        this.now(),
      ))
    )
      throw new AccountDeckError("account_deck_not_found");
  }

  async snapshot(
    ownerAccountId: string,
    cloudDeckId: string,
  ): Promise<DeckSnapshot> {
    const record = await this.get(ownerAccountId, cloudDeckId);
    return snapshotForDeck(
      record.deck,
      `${record.cloudDeckId}_snapshot_v${record.deckVersion}_${randomBytes(6).toString("hex")}`,
    );
  }

  async deleteAll(ownerAccountId: string): Promise<number> {
    return this.storage.deleteAllForOwner(ownerAccountId);
  }

  close(): void {
    this.storage.close?.();
  }
}

function editableFromInput(
  deckId: string,
  version: number,
  input: AccountDeckDraftInput,
  createdAt: string,
  updatedAt: string,
): EditableDeck {
  if (
    (input.side !== "runner" && input.side !== "corp") ||
    !Array.isArray(input.cards)
  )
    throw new AccountDeckError("account_deck_input_invalid");
  const name = validName(input.name);
  const cards = input.cards.map((entry) => ({
    cardId: String(entry.cardId),
    quantity: Number(entry.quantity),
  }));
  if (
    !input.identityCardId ||
    !input.cardPoolSnapshotId ||
    !input.formatProfileId ||
    cards.some(
      (entry) =>
        !entry.cardId ||
        !Number.isInteger(entry.quantity) ||
        entry.quantity <= 0,
    )
  ) {
    throw new AccountDeckError("account_deck_input_invalid");
  }
  return {
    deckId,
    deckVersion: String(version),
    name,
    side: input.side,
    identityCardId: input.identityCardId,
    cardPoolSnapshotId: input.cardPoolSnapshotId,
    ...(input.cardPoolVersion
      ? { cardPoolVersion: input.cardPoolVersion }
      : {}),
    formatProfileId: input.formatProfileId,
    ...(input.formatProfileVersion
      ? { formatProfileVersion: input.formatProfileVersion }
      : {}),
    cards,
    createdAt,
    updatedAt,
    ...(typeof input.notes === "string"
      ? { notes: input.notes.slice(0, 2000) }
      : {}),
    ...(input.tableLayout
      ? { tableLayout: sanitizeTableLayout(input.tableLayout) }
      : {}),
  };
}

function recordFor(
  ownerAccountId: string,
  cloudDeckId: string,
  deckVersion: number,
  deck: EditableDeck,
  createdAt: string,
  updatedAt: string,
): AccountDeckRecord {
  const validation = validateEditableDeck(
    deck,
    validationContext(deck.formatProfileId, deck.formatProfileVersion),
  );
  deck.validationStatus = validation.ok ? "valid" : "invalid";
  return {
    cloudDeckId,
    ownerAccountId,
    deckVersion,
    deck,
    validationStatus: validation.ok ? "valid" : "invalid",
    createdAt,
    updatedAt,
  };
}

function snapshotForDeck(deck: EditableDeck, snapshotId: string): DeckSnapshot {
  const context = validationContext(
    deck.formatProfileId,
    deck.formatProfileVersion,
  );
  const rulesBaselineId = context.profile.rulesBaselineIds[0];
  const snapshot = createDeckSnapshot(deck, context, {
    snapshotId,
    ...(rulesBaselineId ? { rulesBaselineId } : {}),
  });
  if (!snapshot.validation.ok)
    throw new AccountDeckError("account_deck_invalid");
  return snapshot;
}

function validationContext(
  profileId: string,
  version?: string,
): DeckValidationContext {
  const profiles = [
    ...(profilesData.profiles as DeckFormatProfile[]),
    ...(profilesData130.profiles as DeckFormatProfile[]),
  ];
  const profile = [...profiles]
    .reverse()
    .find(
      (candidate) =>
        candidate.profileId === profileId &&
        (!version || candidate.version === version),
    );
  if (!profile) throw new AccountDeckError("account_deck_input_invalid");
  return {
    cardsById: createRuntimeCardsById() as DeckValidationContext["cardsById"],
    profile,
  };
}

function standardAsEditable(
  standard: StandardDeckCatalogEntry,
  now: string,
): EditableDeck {
  return editableFromInput(standard.standardDeckId, 1, standard, now, now);
}

function validName(value: string): string {
  const name = value.trim();
  if (!name || Array.from(name).length > 80)
    throw new AccountDeckError("account_deck_input_invalid");
  return name;
}

function sanitizeTableLayout(layout: DeckTableLayout): DeckTableLayout {
  if (
    layout.schemaVersion !== "deck-table-layout-v0.1" ||
    !Array.isArray(layout.piles) ||
    layout.piles.length > 100
  )
    throw new AccountDeckError("account_deck_input_invalid");
  const allowedSortModes = new Set([
    "free",
    "name",
    "type",
    "install",
    "rez",
    "trash",
    "cost",
    "strength",
    "agenda",
  ]);
  return {
    schemaVersion: "deck-table-layout-v0.1",
    showPileNames: layout.showPileNames === true,
    piles: layout.piles.map((pile) => {
      if (
        !pile ||
        typeof pile.id !== "string" ||
        !Number.isFinite(pile.order) ||
        !Array.isArray(pile.entries) ||
        pile.entries.length > 500
      )
        throw new AccountDeckError("account_deck_input_invalid");
      return {
        id: pile.id.slice(0, 100),
        order: Math.trunc(pile.order),
        ...(typeof pile.name === "string"
          ? { name: pile.name.slice(0, 100) }
          : {}),
        ...(pile.sortMode && allowedSortModes.has(pile.sortMode)
          ? { sortMode: pile.sortMode }
          : {}),
        entries: pile.entries.map((entry) => {
          if (
            !entry ||
            typeof entry.cardId !== "string" ||
            !Number.isInteger(entry.quantity) ||
            entry.quantity <= 0 ||
            !Number.isFinite(entry.order)
          )
            throw new AccountDeckError("account_deck_input_invalid");
          return {
            cardId: entry.cardId,
            quantity: entry.quantity,
            order: Math.trunc(entry.order),
          };
        }),
      };
    }),
  };
}

function validLimit(value: number): number {
  return Number.isInteger(value) && value > 0 && value <= 500
    ? value
    : DEFAULT_ACCOUNT_DECK_LIMIT;
}

function serializeDeck(deck: EditableDeck): string {
  return JSON.stringify({ schemaVersion: "netgrid-account-deck-v1", deck });
}

function accountDeckFromRow(row: AccountDeckRow): AccountDeckRecord {
  const parsed = JSON.parse(row.deck_json) as {
    schemaVersion: string;
    deck: EditableDeck;
  };
  if (parsed.schemaVersion !== "netgrid-account-deck-v1")
    throw new Error("account_deck_schema_invalid");
  return {
    cloudDeckId: row.cloud_deck_id,
    ownerAccountId: row.owner_account_id,
    deckVersion: Number(row.deck_version),
    deck: parsed.deck,
    validationStatus: row.validation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  };
}

type AccountDeckRow = {
  cloud_deck_id: string;
  owner_account_id: string;
  deck_version: number;
  validation_status: AccountDeckRecord["validationStatus"];
  deck_json: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
function clone<T>(value: T): T {
  return structuredClone(value) as T;
}
