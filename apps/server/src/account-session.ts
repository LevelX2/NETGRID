import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { envValue, LOCAL_DEFAULT_TOKEN_SALT } from "./internet-hardening";
import {
  configureSqliteConnection,
  runSqliteStorageOperation,
  runSqliteTransaction,
  SqliteMatchStorage,
} from "./storage-sqlite";

export const ACCOUNT_SESSION_COOKIE_NAME = "ng_account_session";
export const ACCOUNT_SESSION_MAX_AGE_DAYS = 14;

export type AccountStatus = "active" | "disabled" | "deleted";
export type AccountRole = "user" | "admin";
export type AccountAuthStrength = "password" | "passkey" | "mfa";

export type AccountRecord = {
  accountId: string;
  loginName: string;
  loginNameNormalized: string;
  displayName: string;
  status: AccountStatus;
  role: AccountRole;
  credentialVersion: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type AccountPasswordCredentialRecord = {
  accountId: string;
  algorithm: "scrypt";
  parametersVersion: number;
  salt: string;
  passwordHash: string;
  keyLength: number;
  cost: number;
  blockSize: number;
  parallelization: number;
  maxMemory: number;
  changedAt: string;
  mustChange: boolean;
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

export type AccountInviteRecord = {
  inviteId: string;
  inviteTokenHash: string;
  targetAccountId: string;
  createdByAccountId?: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
};

export type AccountResetTokenRecord = {
  resetId: string;
  resetTokenHash: string;
  targetAccountId: string;
  createdByAccountId?: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
};

export type AccountSessionRecord = {
  sessionId: string;
  accountId: string;
  sessionTokenHash: string;
  csrfTokenHash: string;
  credentialVersion: number;
  authStrength: AccountAuthStrength;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt?: string;
  deviceLabel?: string;
};

export type AccountSessionSelfView = Omit<
  AccountSessionRecord,
  "sessionTokenHash" | "csrfTokenHash"
>;

export type AccountSelfView = Pick<
  AccountRecord,
  | "accountId"
  | "loginName"
  | "displayName"
  | "status"
  | "role"
  | "createdAt"
  | "updatedAt"
>;

export type AccountSessionAuthErrorCode =
  | "invalid_session"
  | "session_revoked"
  | "session_expired"
  | "account_unavailable";

export type AccountSessionAuthResult =
  | { ok: true; account: AccountSelfView; session: AccountSessionSelfView }
  | { ok: false; errorCode: AccountSessionAuthErrorCode };

export type AccountStorage = {
  saveAccount(account: AccountRecord): Promise<void>;
  loadAccount(accountId: string): Promise<AccountRecord | undefined>;
  loadAccountByLoginNameNormalized(
    loginNameNormalized: string,
  ): Promise<AccountRecord | undefined>;
  countAccounts(): Promise<number>;
  savePasswordCredential(
    credential: AccountPasswordCredentialRecord,
  ): Promise<void>;
  loadPasswordCredential(
    accountId: string,
  ): Promise<AccountPasswordCredentialRecord | undefined>;
  saveCredential(credential: AccountCredentialRecord): Promise<void>;
  loadCredential(
    credentialId: string,
  ): Promise<AccountCredentialRecord | undefined>;
  saveSession(session: AccountSessionRecord): Promise<void>;
  loadSession(sessionId: string): Promise<AccountSessionRecord | undefined>;
  loadSessionByTokenHash(
    sessionTokenHash: string,
  ): Promise<AccountSessionRecord | undefined>;
  listSessionsForAccount(accountId: string): Promise<AccountSessionRecord[]>;
  saveInvite(invite: AccountInviteRecord): Promise<void>;
  loadInviteByTokenHash(
    inviteTokenHash: string,
  ): Promise<AccountInviteRecord | undefined>;
  claimInvite(inviteId: string, usedAt: string): Promise<boolean>;
  saveResetToken(reset: AccountResetTokenRecord): Promise<void>;
  loadResetTokenByHash(
    resetTokenHash: string,
  ): Promise<AccountResetTokenRecord | undefined>;
  claimResetToken(resetId: string, usedAt: string): Promise<boolean>;
  deleteAccountPrivateData(account: AccountRecord): Promise<void>;
  close?(): void;
};

export type CreateAccountInput = {
  accountId?: string;
  loginName?: string;
  displayName: string;
  role?: AccountRole;
  status?: AccountStatus;
};

export type CreateAccountSessionInput = {
  accountId: string;
  deviceLabel?: string;
  sessionToken?: string;
  csrfToken?: string;
  expiresAt?: string;
  authStrength?: AccountAuthStrength;
};

export type CreateAccountSessionResult = {
  sessionToken: string;
  csrfToken: string;
  session: AccountSessionSelfView;
};

export class InMemoryAccountStorage implements AccountStorage {
  private readonly accounts = new Map<string, AccountRecord>();
  private readonly passwordCredentials = new Map<
    string,
    AccountPasswordCredentialRecord
  >();
  private readonly credentials = new Map<string, AccountCredentialRecord>();
  private readonly sessions = new Map<string, AccountSessionRecord>();
  private readonly invites = new Map<string, AccountInviteRecord>();
  private readonly resetTokens = new Map<string, AccountResetTokenRecord>();

  async saveAccount(account: AccountRecord): Promise<void> {
    this.accounts.set(account.accountId, clone(account));
  }

  async loadAccount(accountId: string): Promise<AccountRecord | undefined> {
    const account = this.accounts.get(accountId);
    return account ? clone(account) : undefined;
  }

  async loadAccountByLoginNameNormalized(
    loginNameNormalized: string,
  ): Promise<AccountRecord | undefined> {
    const account = [...this.accounts.values()].find(
      (candidate) => candidate.loginNameNormalized === loginNameNormalized,
    );
    return account ? clone(account) : undefined;
  }

  async countAccounts(): Promise<number> {
    return this.accounts.size;
  }

  async savePasswordCredential(
    credential: AccountPasswordCredentialRecord,
  ): Promise<void> {
    this.passwordCredentials.set(credential.accountId, clone(credential));
  }

  async loadPasswordCredential(
    accountId: string,
  ): Promise<AccountPasswordCredentialRecord | undefined> {
    const credential = this.passwordCredentials.get(accountId);
    return credential ? clone(credential) : undefined;
  }

  async saveCredential(credential: AccountCredentialRecord): Promise<void> {
    this.credentials.set(credential.credentialId, clone(credential));
  }

  async loadCredential(
    credentialId: string,
  ): Promise<AccountCredentialRecord | undefined> {
    const credential = this.credentials.get(credentialId);
    return credential ? clone(credential) : undefined;
  }

  async saveSession(session: AccountSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, clone(session));
  }

  async loadSession(
    sessionId: string,
  ): Promise<AccountSessionRecord | undefined> {
    const session = this.sessions.get(sessionId);
    return session ? clone(session) : undefined;
  }

  async loadSessionByTokenHash(
    sessionTokenHash: string,
  ): Promise<AccountSessionRecord | undefined> {
    const session = [...this.sessions.values()].find(
      (candidate) => candidate.sessionTokenHash === sessionTokenHash,
    );
    return session ? clone(session) : undefined;
  }

  async listSessionsForAccount(
    accountId: string,
  ): Promise<AccountSessionRecord[]> {
    return [...this.sessions.values()]
      .filter((session) => session.accountId === accountId)
      .map((session) => clone(session));
  }

  async saveInvite(invite: AccountInviteRecord): Promise<void> {
    this.invites.set(invite.inviteId, clone(invite));
  }

  async loadInviteByTokenHash(
    inviteTokenHash: string,
  ): Promise<AccountInviteRecord | undefined> {
    const invite = [...this.invites.values()].find(
      (candidate) => candidate.inviteTokenHash === inviteTokenHash,
    );
    return invite ? clone(invite) : undefined;
  }

  async claimInvite(inviteId: string, usedAt: string): Promise<boolean> {
    const invite = this.invites.get(inviteId);
    if (
      !invite ||
      invite.usedAt ||
      invite.revokedAt ||
      Date.parse(invite.expiresAt) <= Date.parse(usedAt)
    )
      return false;
    this.invites.set(inviteId, { ...invite, usedAt });
    return true;
  }

  async saveResetToken(resetToken: AccountResetTokenRecord): Promise<void> {
    this.resetTokens.set(resetToken.resetId, clone(resetToken));
  }

  async loadResetTokenByHash(
    resetTokenHash: string,
  ): Promise<AccountResetTokenRecord | undefined> {
    const resetToken = [...this.resetTokens.values()].find(
      (candidate) => candidate.resetTokenHash === resetTokenHash,
    );
    return resetToken ? clone(resetToken) : undefined;
  }

  async claimResetToken(resetId: string, usedAt: string): Promise<boolean> {
    const resetToken = this.resetTokens.get(resetId);
    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.revokedAt ||
      Date.parse(resetToken.expiresAt) <= Date.parse(usedAt)
    )
      return false;
    this.resetTokens.set(resetId, { ...resetToken, usedAt });
    return true;
  }

  async deleteAccountPrivateData(account: AccountRecord): Promise<void> {
    this.passwordCredentials.delete(account.accountId);
    for (const [credentialId, credential] of this.credentials)
      if (credential.accountId === account.accountId)
        this.credentials.delete(credentialId);
    for (const [sessionId, session] of this.sessions)
      if (session.accountId === account.accountId)
        this.sessions.delete(sessionId);
    for (const [inviteId, invite] of this.invites)
      if (
        invite.targetAccountId === account.accountId ||
        invite.createdByAccountId === account.accountId
      )
        this.invites.delete(inviteId);
    for (const [resetId, resetToken] of this.resetTokens)
      if (
        resetToken.targetAccountId === account.accountId ||
        resetToken.createdByAccountId === account.accountId
      )
        this.resetTokens.delete(resetId);
    this.accounts.set(account.accountId, clone(account));
  }
}

export class SqliteAccountStorage implements AccountStorage {
  private readonly db: DatabaseSync;

  constructor(
    private readonly options: { dbPath: string; backupDir?: string },
  ) {
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

  async saveAccount(account: AccountRecord): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO accounts (
          account_id, login_name, login_name_normalized, display_name, status, role,
          credential_version, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_id) DO UPDATE SET
          login_name = excluded.login_name,
          login_name_normalized = excluded.login_name_normalized,
          display_name = excluded.display_name,
          status = excluded.status,
          role = excluded.role,
          credential_version = excluded.credential_version,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at`,
        )
        .run(
          account.accountId,
          account.loginName,
          account.loginNameNormalized,
          account.displayName,
          account.status,
          account.role,
          account.credentialVersion,
          account.createdAt,
          account.updatedAt,
          account.deletedAt ?? null,
        ),
    );
  }

  async loadAccount(accountId: string): Promise<AccountRecord | undefined> {
    const row = this.db
      .prepare("SELECT * FROM accounts WHERE account_id = ?")
      .get(accountId) as AccountRow | undefined;
    return row ? accountFromRow(row) : undefined;
  }

  async loadAccountByLoginNameNormalized(
    loginNameNormalized: string,
  ): Promise<AccountRecord | undefined> {
    const row = this.db
      .prepare("SELECT * FROM accounts WHERE login_name_normalized = ?")
      .get(loginNameNormalized) as AccountRow | undefined;
    return row ? accountFromRow(row) : undefined;
  }

  async countAccounts(): Promise<number> {
    return Number(
      (
        this.db.prepare("SELECT COUNT(*) AS count FROM accounts").get() as {
          count: number;
        }
      ).count,
    );
  }

  async savePasswordCredential(
    credential: AccountPasswordCredentialRecord,
  ): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_password_credentials (
          account_id, algorithm, parameters_version, salt, password_hash, key_length,
          cost, block_size, parallelization, max_memory, changed_at, must_change
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(account_id) DO UPDATE SET
          algorithm = excluded.algorithm,
          parameters_version = excluded.parameters_version,
          salt = excluded.salt,
          password_hash = excluded.password_hash,
          key_length = excluded.key_length,
          cost = excluded.cost,
          block_size = excluded.block_size,
          parallelization = excluded.parallelization,
          max_memory = excluded.max_memory,
          changed_at = excluded.changed_at,
          must_change = excluded.must_change`,
        )
        .run(
          credential.accountId,
          credential.algorithm,
          credential.parametersVersion,
          credential.salt,
          credential.passwordHash,
          credential.keyLength,
          credential.cost,
          credential.blockSize,
          credential.parallelization,
          credential.maxMemory,
          credential.changedAt,
          credential.mustChange ? 1 : 0,
        ),
    );
  }

  async loadPasswordCredential(
    accountId: string,
  ): Promise<AccountPasswordCredentialRecord | undefined> {
    const row = this.db
      .prepare(
        "SELECT * FROM account_password_credentials WHERE account_id = ?",
      )
      .get(accountId) as AccountPasswordCredentialRow | undefined;
    return row ? passwordCredentialFromRow(row) : undefined;
  }

  async saveCredential(credential: AccountCredentialRecord): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_credentials (
          credential_id, account_id, public_key, sign_count, label, created_at, last_used_at, revoked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(credential_id) DO UPDATE SET
          public_key = excluded.public_key,
          sign_count = excluded.sign_count,
          label = excluded.label,
          last_used_at = excluded.last_used_at,
          revoked_at = excluded.revoked_at`,
        )
        .run(
          credential.credentialId,
          credential.accountId,
          credential.publicKey,
          credential.signCount,
          credential.label ?? null,
          credential.createdAt,
          credential.lastUsedAt ?? null,
          credential.revokedAt ?? null,
        ),
    );
  }

  async loadCredential(
    credentialId: string,
  ): Promise<AccountCredentialRecord | undefined> {
    const row = this.db
      .prepare("SELECT * FROM account_credentials WHERE credential_id = ?")
      .get(credentialId) as AccountCredentialRow | undefined;
    return row ? credentialFromRow(row) : undefined;
  }

  async saveSession(session: AccountSessionRecord): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_sessions (
          session_id, account_id, session_token_hash, csrf_token_hash, credential_version,
          auth_strength, created_at, last_seen_at, expires_at, revoked_at, device_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          session_token_hash = excluded.session_token_hash,
          csrf_token_hash = excluded.csrf_token_hash,
          credential_version = excluded.credential_version,
          auth_strength = excluded.auth_strength,
          last_seen_at = excluded.last_seen_at,
          expires_at = excluded.expires_at,
          revoked_at = excluded.revoked_at,
          device_label = excluded.device_label`,
        )
        .run(
          session.sessionId,
          session.accountId,
          session.sessionTokenHash,
          session.csrfTokenHash,
          session.credentialVersion,
          session.authStrength,
          session.createdAt,
          session.lastSeenAt,
          session.expiresAt,
          session.revokedAt ?? null,
          session.deviceLabel ?? null,
        ),
    );
  }

  async loadSession(
    sessionId: string,
  ): Promise<AccountSessionRecord | undefined> {
    const row = this.db
      .prepare("SELECT * FROM account_sessions WHERE session_id = ?")
      .get(sessionId) as AccountSessionRow | undefined;
    return row ? sessionFromRow(row) : undefined;
  }

  async loadSessionByTokenHash(
    sessionTokenHash: string,
  ): Promise<AccountSessionRecord | undefined> {
    const row = this.db
      .prepare("SELECT * FROM account_sessions WHERE session_token_hash = ?")
      .get(sessionTokenHash) as AccountSessionRow | undefined;
    return row ? sessionFromRow(row) : undefined;
  }

  async listSessionsForAccount(
    accountId: string,
  ): Promise<AccountSessionRecord[]> {
    return (
      this.db
        .prepare(
          "SELECT * FROM account_sessions WHERE account_id = ? ORDER BY created_at ASC",
        )
        .all(accountId) as AccountSessionRow[]
    ).map(sessionFromRow);
  }

  async saveInvite(invite: AccountInviteRecord): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_invites (
        invite_id, invite_token_hash, target_account_id, created_by_account_id,
        created_at, expires_at, used_at, revoked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(invite_id) DO UPDATE SET
        invite_token_hash = excluded.invite_token_hash,
        expires_at = excluded.expires_at,
        used_at = excluded.used_at,
        revoked_at = excluded.revoked_at`,
        )
        .run(
          invite.inviteId,
          invite.inviteTokenHash,
          invite.targetAccountId,
          invite.createdByAccountId ?? null,
          invite.createdAt,
          invite.expiresAt,
          invite.usedAt ?? null,
          invite.revokedAt ?? null,
        ),
    );
  }

  async loadInviteByTokenHash(
    inviteTokenHash: string,
  ): Promise<AccountInviteRecord | undefined> {
    const row = this.db
      .prepare("SELECT * FROM account_invites WHERE invite_token_hash = ?")
      .get(inviteTokenHash) as AccountInviteRow | undefined;
    return row ? inviteFromRow(row) : undefined;
  }

  async claimInvite(inviteId: string, usedAt: string): Promise<boolean> {
    const result = runSqliteStorageOperation(() =>
      this.db
        .prepare(
          "UPDATE account_invites SET used_at = ? WHERE invite_id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > ?",
        )
        .run(usedAt, inviteId, usedAt),
    );
    return Number(result.changes) === 1;
  }

  async saveResetToken(resetToken: AccountResetTokenRecord): Promise<void> {
    runSqliteStorageOperation(() =>
      this.db
        .prepare(
          `INSERT INTO account_reset_tokens (
        reset_id, reset_token_hash, target_account_id, created_by_account_id,
        created_at, expires_at, used_at, revoked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(reset_id) DO UPDATE SET
        reset_token_hash = excluded.reset_token_hash,
        expires_at = excluded.expires_at,
        used_at = excluded.used_at,
        revoked_at = excluded.revoked_at`,
        )
        .run(
          resetToken.resetId,
          resetToken.resetTokenHash,
          resetToken.targetAccountId,
          resetToken.createdByAccountId ?? null,
          resetToken.createdAt,
          resetToken.expiresAt,
          resetToken.usedAt ?? null,
          resetToken.revokedAt ?? null,
        ),
    );
  }

  async loadResetTokenByHash(
    resetTokenHash: string,
  ): Promise<AccountResetTokenRecord | undefined> {
    const row = this.db
      .prepare("SELECT * FROM account_reset_tokens WHERE reset_token_hash = ?")
      .get(resetTokenHash) as AccountResetTokenRow | undefined;
    return row ? resetTokenFromRow(row) : undefined;
  }

  async claimResetToken(resetId: string, usedAt: string): Promise<boolean> {
    const result = runSqliteStorageOperation(() =>
      this.db
        .prepare(
          "UPDATE account_reset_tokens SET used_at = ? WHERE reset_id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > ?",
        )
        .run(usedAt, resetId, usedAt),
    );
    return Number(result.changes) === 1;
  }

  async deleteAccountPrivateData(account: AccountRecord): Promise<void> {
    runSqliteTransaction(this.db, () => {
      this.db
        .prepare("DELETE FROM account_series_results WHERE account_id = ?")
        .run(account.accountId);
      this.db
        .prepare("DELETE FROM account_game_results WHERE account_id = ?")
        .run(account.accountId);
      this.db
        .prepare("DELETE FROM account_match_participants WHERE account_id = ?")
        .run(account.accountId);
      this.db
        .prepare("DELETE FROM account_decks WHERE owner_account_id = ?")
        .run(account.accountId);
      this.db
        .prepare(
          "DELETE FROM account_match_start_preferences WHERE account_id = ?",
        )
        .run(account.accountId);
      this.db
        .prepare(
          "DELETE FROM account_invites WHERE target_account_id = ? OR created_by_account_id = ?",
        )
        .run(account.accountId, account.accountId);
      this.db
        .prepare(
          "DELETE FROM account_reset_tokens WHERE target_account_id = ? OR created_by_account_id = ?",
        )
        .run(account.accountId, account.accountId);
      this.db
        .prepare("DELETE FROM account_sessions WHERE account_id = ?")
        .run(account.accountId);
      this.db
        .prepare("DELETE FROM account_credentials WHERE account_id = ?")
        .run(account.accountId);
      this.db
        .prepare(
          "DELETE FROM account_password_credentials WHERE account_id = ?",
        )
        .run(account.accountId);
      this.db
        .prepare(
          `UPDATE accounts SET login_name = ?, login_name_normalized = ?, display_name = ?, status = ?,
          credential_version = ?, updated_at = ?, deleted_at = ? WHERE account_id = ?`,
        )
        .run(
          account.loginName,
          account.loginNameNormalized,
          account.displayName,
          account.status,
          account.credentialVersion,
          account.updatedAt,
          account.deletedAt ?? account.updatedAt,
          account.accountId,
        );
    });
  }

  close(): void {
    this.db.close();
  }
}

export class AccountSessionService {
  private readonly tokenSalt: string;
  private readonly now: () => string;
  private readonly maxSessionAgeDays: number;

  constructor(
    private readonly storage: AccountStorage = new InMemoryAccountStorage(),
    options: {
      tokenSalt?: string;
      now?: () => string;
      maxSessionAgeDays?: number;
    } = {},
  ) {
    this.tokenSalt =
      options.tokenSalt ??
      envValue(process.env, "NETGRID_ACCOUNT_TOKEN_SALT") ??
      envValue(process.env, "NETGRID_TOKEN_SALT") ??
      LOCAL_DEFAULT_TOKEN_SALT;
    this.now = options.now ?? (() => new Date().toISOString());
    this.maxSessionAgeDays =
      options.maxSessionAgeDays ?? ACCOUNT_SESSION_MAX_AGE_DAYS;
  }

  hashSessionToken(sessionToken: string): string {
    return this.hashSecret("session", sessionToken);
  }

  hashCsrfToken(csrfToken: string): string {
    return this.hashSecret("csrf", csrfToken);
  }

  async createAccount(input: CreateAccountInput): Promise<AccountSelfView> {
    const now = this.now();
    const accountId = input.accountId ?? randomId("acct");
    const loginName = normalizeLoginName(input.loginName ?? accountId);
    validateLoginName(loginName);
    validateDisplayName(input.displayName);
    if (await this.storage.loadAccount(accountId))
      throw new Error("account_exists");
    if (
      await this.storage.loadAccountByLoginNameNormalized(loginName.normalized)
    )
      throw new Error("login_name_unavailable");
    const account: AccountRecord = {
      accountId,
      loginName: loginName.display,
      loginNameNormalized: loginName.normalized,
      displayName: input.displayName.trim(),
      status: input.status ?? "active",
      role: input.role ?? "user",
      credentialVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.saveAccount(account);
    return accountSelfView(account);
  }

  async saveCredential(
    input: Omit<AccountCredentialRecord, "createdAt"> & { createdAt?: string },
  ): Promise<AccountCredentialRecord> {
    const credential: AccountCredentialRecord = {
      credentialId: input.credentialId,
      accountId: input.accountId,
      publicKey: input.publicKey,
      signCount: input.signCount,
      createdAt: input.createdAt ?? this.now(),
      ...(input.label ? { label: input.label } : {}),
      ...(input.lastUsedAt ? { lastUsedAt: input.lastUsedAt } : {}),
      ...(input.revokedAt ? { revokedAt: input.revokedAt } : {}),
    };
    await this.storage.saveCredential(credential);
    return clone(credential);
  }

  async createSession(
    input: CreateAccountSessionInput,
  ): Promise<CreateAccountSessionResult> {
    const account = await this.storage.loadAccount(input.accountId);
    if (!account || account.status !== "active")
      throw new Error("account_unavailable");
    const now = this.now();
    const sessionToken =
      input.sessionToken ?? randomBytes(32).toString("base64url");
    const csrfToken = input.csrfToken ?? this.csrfTokenForSession(sessionToken);
    const session: AccountSessionRecord = {
      sessionId: randomId("acct_sess"),
      accountId: input.accountId,
      sessionTokenHash: this.hashSessionToken(sessionToken),
      csrfTokenHash: this.hashCsrfToken(csrfToken),
      credentialVersion: account.credentialVersion,
      authStrength: input.authStrength ?? "password",
      createdAt: now,
      lastSeenAt: now,
      expiresAt: input.expiresAt ?? this.expiresAt(now),
      ...(input.deviceLabel ? { deviceLabel: input.deviceLabel } : {}),
    };
    await this.storage.saveSession(session);
    return {
      sessionToken,
      csrfToken,
      session: accountSessionSelfView(session),
    };
  }

  async authenticateSessionToken(
    sessionToken: string,
  ): Promise<AccountSessionAuthResult> {
    const session = await this.storage.loadSessionByTokenHash(
      this.hashSessionToken(sessionToken),
    );
    if (!session) return { ok: false, errorCode: "invalid_session" };
    if (session.revokedAt) return { ok: false, errorCode: "session_revoked" };
    const now = this.now();
    if (Date.parse(session.expiresAt) <= Date.parse(now))
      return { ok: false, errorCode: "session_expired" };
    const account = await this.storage.loadAccount(session.accountId);
    if (
      !account ||
      account.status !== "active" ||
      session.credentialVersion !== account.credentialVersion
    ) {
      return { ok: false, errorCode: "account_unavailable" };
    }
    const nextSession: AccountSessionRecord = { ...session, lastSeenAt: now };
    await this.storage.saveSession(nextSession);
    return {
      ok: true,
      account: accountSelfView(account),
      session: accountSessionSelfView(nextSession),
    };
  }

  async verifyCsrfToken(
    sessionToken: string,
    csrfToken: string,
  ): Promise<boolean> {
    const session = await this.storage.loadSessionByTokenHash(
      this.hashSessionToken(sessionToken),
    );
    if (!session || session.revokedAt) return false;
    const authenticated = await this.authenticateSessionToken(sessionToken);
    if (!authenticated.ok) return false;
    return safeEqual(session.csrfTokenHash, this.hashCsrfToken(csrfToken));
  }

  async restoreCsrfToken(sessionToken: string): Promise<string | undefined> {
    const authenticated = await this.authenticateSessionToken(sessionToken);
    if (!authenticated.ok) return undefined;
    const session = await this.storage.loadSession(
      authenticated.session.sessionId,
    );
    if (!session || session.revokedAt) return undefined;
    const csrfToken = this.csrfTokenForSession(sessionToken);
    await this.storage.saveSession({
      ...session,
      csrfTokenHash: this.hashCsrfToken(csrfToken),
      lastSeenAt: this.now(),
    });
    return csrfToken;
  }

  async revokeSessionByToken(sessionToken: string): Promise<boolean> {
    const session = await this.storage.loadSessionByTokenHash(
      this.hashSessionToken(sessionToken),
    );
    if (!session) return false;
    await this.storage.saveSession({
      ...session,
      revokedAt: session.revokedAt ?? this.now(),
    });
    return true;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    const session = await this.storage.loadSession(sessionId);
    if (!session) return false;
    await this.storage.saveSession({
      ...session,
      revokedAt: session.revokedAt ?? this.now(),
    });
    return true;
  }

  async revokeAllAccountSessions(
    accountId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const sessions = await this.storage.listSessionsForAccount(accountId);
    let revoked = 0;
    const now = this.now();
    for (const session of sessions) {
      if (session.revokedAt || session.sessionId === exceptSessionId) continue;
      await this.storage.saveSession({ ...session, revokedAt: now });
      revoked += 1;
    }
    return revoked;
  }

  async listAccountSessions(
    accountId: string,
  ): Promise<AccountSessionSelfView[]> {
    return (await this.storage.listSessionsForAccount(accountId)).map(
      accountSessionSelfView,
    );
  }

  async exportAccount(
    accountId: string,
  ): Promise<
    { account: AccountSelfView; sessions: AccountSessionSelfView[] } | undefined
  > {
    const account = await this.storage.loadAccount(accountId);
    if (!account || account.status === "deleted") return undefined;
    return {
      account: accountSelfView(account),
      sessions: await this.listAccountSessions(accountId),
    };
  }

  private hashSecret(purpose: "session" | "csrf", value: string): string {
    return `sha256:${createHmac("sha256", this.tokenSalt).update(`account-${purpose}:${value}`).digest("hex")}`;
  }

  private csrfTokenForSession(sessionToken: string): string {
    return createHmac("sha256", this.tokenSalt)
      .update(`account-csrf-token:${sessionToken}`)
      .digest("base64url");
  }

  hashOneTimeToken(purpose: "invite" | "reset", value: string): string {
    return `sha256:${createHmac("sha256", this.tokenSalt).update(`account-${purpose}:${value}`).digest("hex")}`;
  }

  private expiresAt(now: string): string {
    return new Date(
      Date.parse(now) + this.maxSessionAgeDays * 24 * 60 * 60 * 1000,
    ).toISOString();
  }
}

type AccountRow = {
  account_id: string;
  login_name: string;
  login_name_normalized: string;
  display_name: string;
  status: AccountStatus;
  role: AccountRole;
  credential_version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type AccountPasswordCredentialRow = {
  account_id: string;
  algorithm: "scrypt";
  parameters_version: number;
  salt: string;
  password_hash: string;
  key_length: number;
  cost: number;
  block_size: number;
  parallelization: number;
  max_memory: number;
  changed_at: string;
  must_change: number;
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
  csrf_token_hash: string;
  credential_version: number;
  auth_strength: AccountAuthStrength;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
  device_label: string | null;
};

type AccountInviteRow = {
  invite_id: string;
  invite_token_hash: string;
  target_account_id: string;
  created_by_account_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

type AccountResetTokenRow = {
  reset_id: string;
  reset_token_hash: string;
  target_account_id: string;
  created_by_account_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

function accountFromRow(row: AccountRow): AccountRecord {
  return {
    accountId: row.account_id,
    loginName: row.login_name,
    loginNameNormalized: row.login_name_normalized,
    displayName: row.display_name,
    status: row.status,
    role: row.role,
    credentialVersion: Number(row.credential_version),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  };
}

function passwordCredentialFromRow(
  row: AccountPasswordCredentialRow,
): AccountPasswordCredentialRecord {
  return {
    accountId: row.account_id,
    algorithm: row.algorithm,
    parametersVersion: Number(row.parameters_version),
    salt: row.salt,
    passwordHash: row.password_hash,
    keyLength: Number(row.key_length),
    cost: Number(row.cost),
    blockSize: Number(row.block_size),
    parallelization: Number(row.parallelization),
    maxMemory: Number(row.max_memory),
    changedAt: row.changed_at,
    mustChange: row.must_change === 1,
  };
}

function credentialFromRow(row: AccountCredentialRow): AccountCredentialRecord {
  return {
    credentialId: row.credential_id,
    accountId: row.account_id,
    publicKey: row.public_key,
    signCount: Number(row.sign_count),
    createdAt: row.created_at,
    ...(row.label ? { label: row.label } : {}),
    ...(row.last_used_at ? { lastUsedAt: row.last_used_at } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
  };
}

function sessionFromRow(row: AccountSessionRow): AccountSessionRecord {
  return {
    sessionId: row.session_id,
    accountId: row.account_id,
    sessionTokenHash: row.session_token_hash,
    csrfTokenHash: row.csrf_token_hash,
    credentialVersion: Number(row.credential_version),
    authStrength: row.auth_strength,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
    ...(row.device_label ? { deviceLabel: row.device_label } : {}),
  };
}

function inviteFromRow(row: AccountInviteRow): AccountInviteRecord {
  return {
    inviteId: row.invite_id,
    inviteTokenHash: row.invite_token_hash,
    targetAccountId: row.target_account_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    ...(row.created_by_account_id
      ? { createdByAccountId: row.created_by_account_id }
      : {}),
    ...(row.used_at ? { usedAt: row.used_at } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
  };
}

function resetTokenFromRow(row: AccountResetTokenRow): AccountResetTokenRecord {
  return {
    resetId: row.reset_id,
    resetTokenHash: row.reset_token_hash,
    targetAccountId: row.target_account_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    ...(row.created_by_account_id
      ? { createdByAccountId: row.created_by_account_id }
      : {}),
    ...(row.used_at ? { usedAt: row.used_at } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
  };
}

function accountSelfView(account: AccountRecord): AccountSelfView {
  return {
    accountId: account.accountId,
    loginName: account.loginName,
    displayName: account.displayName,
    status: account.status,
    role: account.role,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function accountSessionSelfView(
  session: AccountSessionRecord,
): AccountSessionSelfView {
  return {
    sessionId: session.sessionId,
    accountId: session.accountId,
    credentialVersion: session.credentialVersion,
    authStrength: session.authStrength,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    ...(session.revokedAt ? { revokedAt: session.revokedAt } : {}),
    ...(session.deviceLabel ? { deviceLabel: session.deviceLabel } : {}),
  };
}

export function normalizeLoginName(value: string): {
  display: string;
  normalized: string;
} {
  const display = value.trim().normalize("NFKC");
  return { display, normalized: display.toLocaleLowerCase("en-US") };
}

export function validateLoginName(value: {
  display: string;
  normalized: string;
}): void {
  const length = Array.from(value.display).length;
  if (length < 3 || length > 32 || !/^[\p{L}\p{N}._-]+$/u.test(value.display))
    throw new Error("login_name_invalid");
}

export function validateDisplayName(value: string): void {
  const length = Array.from(value.trim()).length;
  if (length < 1 || length > 60) throw new Error("display_name_invalid");
}

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}
