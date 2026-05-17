import { createHmac, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { envValue, LOCAL_DEFAULT_TOKEN_SALT } from "./internet-hardening";

export const ACCOUNT_SESSION_COOKIE_NAME = "ng_account_session";
export const ACCOUNT_SESSION_MAX_AGE_DAYS = 14;

export type AccountStatus = "active" | "disabled" | "deleted";
export type AccountRole = "user" | "admin";

export type AccountRecord = {
  accountId: string;
  displayName: string;
  status: AccountStatus;
  role: AccountRole;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  contactHash?: string;
};

export type AccountCredentialRecord = {
  credentialId: string;
  accountId: string;
  publicKey: string;
  signCount: number;
  createdAt: string;
  label?: string;
  lastUsedAt?: string;
  revokedAt?: string;
};

export type AccountSessionRecord = {
  sessionId: string;
  accountId: string;
  sessionTokenHash: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt?: string;
  deviceLabel?: string;
};

export type AccountSessionSelfView = Omit<AccountSessionRecord, "sessionTokenHash">;

export type AccountSelfView = Pick<AccountRecord, "accountId" | "displayName" | "status" | "role" | "createdAt" | "updatedAt">;

export type AccountSessionAuthErrorCode = "invalid_session" | "session_revoked" | "session_expired" | "account_unavailable";

export type AccountSessionAuthResult =
  | { ok: true; account: AccountSelfView; session: AccountSessionSelfView }
  | { ok: false; errorCode: AccountSessionAuthErrorCode };

export type AccountStorage = {
  saveAccount(account: AccountRecord): Promise<void>;
  loadAccount(accountId: string): Promise<AccountRecord | undefined>;
  saveCredential(credential: AccountCredentialRecord): Promise<void>;
  loadCredential(credentialId: string): Promise<AccountCredentialRecord | undefined>;
  saveSession(session: AccountSessionRecord): Promise<void>;
  loadSession(sessionId: string): Promise<AccountSessionRecord | undefined>;
  loadSessionByTokenHash(sessionTokenHash: string): Promise<AccountSessionRecord | undefined>;
  listSessionsForAccount(accountId: string): Promise<AccountSessionRecord[]>;
  close?(): void;
};

export type CreateAccountInput = {
  accountId?: string;
  displayName: string;
  role?: AccountRole;
  contactHash?: string;
};

export type CreateAccountSessionInput = {
  accountId: string;
  deviceLabel?: string;
  sessionToken?: string;
  expiresAt?: string;
};

export type CreateAccountSessionResult = {
  sessionToken: string;
  session: AccountSessionSelfView;
};

export class InMemoryAccountStorage implements AccountStorage {
  private readonly accounts = new Map<string, AccountRecord>();
  private readonly credentials = new Map<string, AccountCredentialRecord>();
  private readonly sessions = new Map<string, AccountSessionRecord>();

  async saveAccount(account: AccountRecord): Promise<void> {
    this.accounts.set(account.accountId, clone(account));
  }

  async loadAccount(accountId: string): Promise<AccountRecord | undefined> {
    const account = this.accounts.get(accountId);
    return account ? clone(account) : undefined;
  }

  async saveCredential(credential: AccountCredentialRecord): Promise<void> {
    this.credentials.set(credential.credentialId, clone(credential));
  }

  async loadCredential(credentialId: string): Promise<AccountCredentialRecord | undefined> {
    const credential = this.credentials.get(credentialId);
    return credential ? clone(credential) : undefined;
  }

  async saveSession(session: AccountSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, clone(session));
  }

  async loadSession(sessionId: string): Promise<AccountSessionRecord | undefined> {
    const session = this.sessions.get(sessionId);
    return session ? clone(session) : undefined;
  }

  async loadSessionByTokenHash(sessionTokenHash: string): Promise<AccountSessionRecord | undefined> {
    const session = [...this.sessions.values()].find((candidate) => candidate.sessionTokenHash === sessionTokenHash);
    return session ? clone(session) : undefined;
  }

  async listSessionsForAccount(accountId: string): Promise<AccountSessionRecord[]> {
    return [...this.sessions.values()].filter((session) => session.accountId === accountId).map((session) => clone(session));
  }
}

export class SqliteAccountStorage implements AccountStorage {
  private readonly db: DatabaseSync;

  constructor(private readonly options: { dbPath: string }) {
    mkdirSync(dirname(options.dbPath), { recursive: true });
    this.db = new DatabaseSync(options.dbPath);
    this.db.exec("PRAGMA foreign_keys = ON");
    this.ensureSchema();
  }

  async saveAccount(account: AccountRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO accounts (
          account_id, display_name, status, role, created_at, updated_at, deleted_at, contact_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(account.accountId, account.displayName, account.status, account.role, account.createdAt, account.updatedAt, account.deletedAt ?? null, account.contactHash ?? null);
  }

  async loadAccount(accountId: string): Promise<AccountRecord | undefined> {
    const row = this.db.prepare("SELECT * FROM accounts WHERE account_id = ?").get(accountId) as AccountRow | undefined;
    return row ? accountFromRow(row) : undefined;
  }

  async saveCredential(credential: AccountCredentialRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO account_credentials (
          credential_id, account_id, public_key, sign_count, label, created_at, last_used_at, revoked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        credential.credentialId,
        credential.accountId,
        credential.publicKey,
        credential.signCount,
        credential.label ?? null,
        credential.createdAt,
        credential.lastUsedAt ?? null,
        credential.revokedAt ?? null
      );
  }

  async loadCredential(credentialId: string): Promise<AccountCredentialRecord | undefined> {
    const row = this.db.prepare("SELECT * FROM account_credentials WHERE credential_id = ?").get(credentialId) as AccountCredentialRow | undefined;
    return row ? credentialFromRow(row) : undefined;
  }

  async saveSession(session: AccountSessionRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO account_sessions (
          session_id, account_id, session_token_hash, created_at, last_seen_at, expires_at, revoked_at, device_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        session.sessionId,
        session.accountId,
        session.sessionTokenHash,
        session.createdAt,
        session.lastSeenAt,
        session.expiresAt,
        session.revokedAt ?? null,
        session.deviceLabel ?? null
      );
  }

  async loadSession(sessionId: string): Promise<AccountSessionRecord | undefined> {
    const row = this.db.prepare("SELECT * FROM account_sessions WHERE session_id = ?").get(sessionId) as AccountSessionRow | undefined;
    return row ? sessionFromRow(row) : undefined;
  }

  async loadSessionByTokenHash(sessionTokenHash: string): Promise<AccountSessionRecord | undefined> {
    const row = this.db.prepare("SELECT * FROM account_sessions WHERE session_token_hash = ?").get(sessionTokenHash) as AccountSessionRow | undefined;
    return row ? sessionFromRow(row) : undefined;
  }

  async listSessionsForAccount(accountId: string): Promise<AccountSessionRecord[]> {
    return (this.db.prepare("SELECT * FROM account_sessions WHERE account_id = ? ORDER BY created_at ASC").all(accountId) as AccountSessionRow[]).map(sessionFromRow);
  }

  close(): void {
    this.db.close();
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        status TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        contact_hash TEXT
      );
      CREATE TABLE IF NOT EXISTS account_credentials (
        credential_id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        public_key TEXT NOT NULL,
        sign_count INTEGER NOT NULL,
        label TEXT,
        created_at TEXT NOT NULL,
        last_used_at TEXT,
        revoked_at TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS account_sessions (
        session_id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        session_token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        device_label TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
      );
    `);
  }
}

export class AccountSessionService {
  private readonly tokenSalt: string;
  private readonly now: () => string;
  private readonly maxSessionAgeDays: number;

  constructor(
    private readonly storage: AccountStorage = new InMemoryAccountStorage(),
    options: { tokenSalt?: string; now?: () => string; maxSessionAgeDays?: number } = {}
  ) {
    this.tokenSalt = options.tokenSalt ?? envValue(process.env, "NETGRID_ACCOUNT_TOKEN_SALT") ?? envValue(process.env, "NETGRID_TOKEN_SALT") ?? LOCAL_DEFAULT_TOKEN_SALT;
    this.now = options.now ?? (() => new Date().toISOString());
    this.maxSessionAgeDays = options.maxSessionAgeDays ?? ACCOUNT_SESSION_MAX_AGE_DAYS;
  }

  hashSessionToken(sessionToken: string): string {
    return `sha256:${createHmac("sha256", this.tokenSalt).update(`account-session:${sessionToken}`).digest("hex")}`;
  }

  async createAccount(input: CreateAccountInput): Promise<AccountSelfView> {
    const now = this.now();
    const account: AccountRecord = {
      accountId: input.accountId ?? randomId("acct"),
      displayName: input.displayName,
      status: "active",
      role: input.role ?? "user",
      createdAt: now,
      updatedAt: now,
      ...(input.contactHash ? { contactHash: input.contactHash } : {})
    };
    await this.storage.saveAccount(account);
    return accountSelfView(account);
  }

  async saveCredential(input: Omit<AccountCredentialRecord, "createdAt"> & { createdAt?: string }): Promise<AccountCredentialRecord> {
    const credential: AccountCredentialRecord = {
      credentialId: input.credentialId,
      accountId: input.accountId,
      publicKey: input.publicKey,
      signCount: input.signCount,
      createdAt: input.createdAt ?? this.now(),
      ...(input.label ? { label: input.label } : {}),
      ...(input.lastUsedAt ? { lastUsedAt: input.lastUsedAt } : {}),
      ...(input.revokedAt ? { revokedAt: input.revokedAt } : {})
    };
    await this.storage.saveCredential(credential);
    return clone(credential);
  }

  async createSession(input: CreateAccountSessionInput): Promise<CreateAccountSessionResult> {
    const account = await this.storage.loadAccount(input.accountId);
    if (!account || account.status !== "active") throw new Error("account_unavailable");
    const now = this.now();
    const sessionToken = input.sessionToken ?? randomBytes(32).toString("base64url");
    const session: AccountSessionRecord = {
      sessionId: randomId("acct_sess"),
      accountId: input.accountId,
      sessionTokenHash: this.hashSessionToken(sessionToken),
      createdAt: now,
      lastSeenAt: now,
      expiresAt: input.expiresAt ?? this.expiresAt(now),
      ...(input.deviceLabel ? { deviceLabel: input.deviceLabel } : {})
    };
    await this.storage.saveSession(session);
    return { sessionToken, session: accountSessionSelfView(session) };
  }

  async authenticateSessionToken(sessionToken: string): Promise<AccountSessionAuthResult> {
    const session = await this.storage.loadSessionByTokenHash(this.hashSessionToken(sessionToken));
    if (!session) return { ok: false, errorCode: "invalid_session" };
    if (session.revokedAt) return { ok: false, errorCode: "session_revoked" };
    const now = this.now();
    if (Date.parse(session.expiresAt) <= Date.parse(now)) return { ok: false, errorCode: "session_expired" };
    const account = await this.storage.loadAccount(session.accountId);
    if (!account || account.status !== "active") return { ok: false, errorCode: "account_unavailable" };
    const nextSession: AccountSessionRecord = { ...session, lastSeenAt: now };
    await this.storage.saveSession(nextSession);
    return { ok: true, account: accountSelfView(account), session: accountSessionSelfView(nextSession) };
  }

  async revokeSessionByToken(sessionToken: string): Promise<boolean> {
    const session = await this.storage.loadSessionByTokenHash(this.hashSessionToken(sessionToken));
    if (!session) return false;
    await this.storage.saveSession({ ...session, revokedAt: session.revokedAt ?? this.now() });
    return true;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    const session = await this.storage.loadSession(sessionId);
    if (!session) return false;
    await this.storage.saveSession({ ...session, revokedAt: session.revokedAt ?? this.now() });
    return true;
  }

  async revokeAllAccountSessions(accountId: string): Promise<number> {
    const sessions = await this.storage.listSessionsForAccount(accountId);
    let revoked = 0;
    const now = this.now();
    for (const session of sessions) {
      if (session.revokedAt) continue;
      await this.storage.saveSession({ ...session, revokedAt: now });
      revoked += 1;
    }
    return revoked;
  }

  private expiresAt(now: string): string {
    return new Date(Date.parse(now) + this.maxSessionAgeDays * 24 * 60 * 60 * 1000).toISOString();
  }
}

type AccountRow = {
  account_id: string;
  display_name: string;
  status: AccountStatus;
  role: AccountRole;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  contact_hash: string | null;
};

type AccountCredentialRow = {
  credential_id: string;
  account_id: string;
  public_key: string;
  sign_count: number;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

type AccountSessionRow = {
  session_id: string;
  account_id: string;
  session_token_hash: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
  device_label: string | null;
};

function accountFromRow(row: AccountRow): AccountRecord {
  return {
    accountId: row.account_id,
    displayName: row.display_name,
    status: row.status,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
    ...(row.contact_hash ? { contactHash: row.contact_hash } : {})
  };
}

function credentialFromRow(row: AccountCredentialRow): AccountCredentialRecord {
  return {
    credentialId: row.credential_id,
    accountId: row.account_id,
    publicKey: row.public_key,
    signCount: row.sign_count,
    createdAt: row.created_at,
    ...(row.label ? { label: row.label } : {}),
    ...(row.last_used_at ? { lastUsedAt: row.last_used_at } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {})
  };
}

function sessionFromRow(row: AccountSessionRow): AccountSessionRecord {
  return {
    sessionId: row.session_id,
    accountId: row.account_id,
    sessionTokenHash: row.session_token_hash,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
    ...(row.device_label ? { deviceLabel: row.device_label } : {})
  };
}

function accountSelfView(account: AccountRecord): AccountSelfView {
  return {
    accountId: account.accountId,
    displayName: account.displayName,
    status: account.status,
    role: account.role,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

function accountSessionSelfView(session: AccountSessionRecord): AccountSessionSelfView {
  return {
    sessionId: session.sessionId,
    accountId: session.accountId,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    ...(session.revokedAt ? { revokedAt: session.revokedAt } : {}),
    ...(session.deviceLabel ? { deviceLabel: session.deviceLabel } : {})
  };
}

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
