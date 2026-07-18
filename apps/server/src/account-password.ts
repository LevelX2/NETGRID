import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type {
  AccountInviteRecord,
  AccountPasswordCredentialRecord,
  AccountResetTokenRecord,
  AccountRole,
  AccountSelfView,
  AccountSessionAuthResult,
  AccountStorage,
  CreateAccountSessionResult,
} from "./account-session";
import { AccountSessionService, normalizeLoginName, validateLoginName } from "./account-session";

export const ACCOUNT_PASSWORD_MIN_LENGTH = 15;
export const ACCOUNT_PASSWORD_MAX_LENGTH = 256;
export const ACCOUNT_PASSWORD_PARAMETERS_VERSION = 1;

export type AccountPasswordKdfParameters = {
  keyLength: number;
  cost: number;
  blockSize: number;
  parallelization: number;
  maxMemory: number;
};

export const DEFAULT_ACCOUNT_PASSWORD_KDF: AccountPasswordKdfParameters = {
  keyLength: 64,
  cost: 131_072,
  blockSize: 8,
  parallelization: 1,
  maxMemory: 192 * 1024 * 1024,
};

export const TEST_ACCOUNT_PASSWORD_KDF: AccountPasswordKdfParameters = {
  keyLength: 32,
  cost: 1_024,
  blockSize: 8,
  parallelization: 1,
  maxMemory: 4 * 1024 * 1024,
};

export type AccountPasswordLoginResult =
  | { ok: true; account: AccountSelfView; session: CreateAccountSessionResult }
  | { ok: false; errorCode: "invalid_credentials" };

export type AccountInvitePublicView = {
  loginName: string;
  displayName: string;
  expiresAt: string;
};

export class AccountAuthService {
  readonly sessions: AccountSessionService;
  private readonly now: () => string;
  private readonly passwordKdf: AccountPasswordKdfParameters;

  constructor(
    private readonly storage: AccountStorage,
    options: {
      tokenSalt?: string;
      now?: () => string;
      maxSessionAgeDays?: number;
      passwordKdf?: AccountPasswordKdfParameters;
    } = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.passwordKdf = options.passwordKdf ?? DEFAULT_ACCOUNT_PASSWORD_KDF;
    this.sessions = new AccountSessionService(storage, {
      ...(options.tokenSalt ? { tokenSalt: options.tokenSalt } : {}),
      now: this.now,
      ...(options.maxSessionAgeDays ? { maxSessionAgeDays: options.maxSessionAgeDays } : {}),
    });
  }

  async bootstrapAdmin(input: { loginName: string; displayName: string; password: string; deviceLabel?: string }): Promise<{
    account: AccountSelfView;
    session: CreateAccountSessionResult;
  }> {
    if ((await this.storage.countAccounts()) !== 0) throw new Error("account_bootstrap_closed");
    return this.createAccountWithPassword({ ...input, role: "admin" });
  }

  async createAccountWithPassword(input: {
    accountId?: string;
    loginName: string;
    displayName: string;
    password: string;
    role?: AccountRole;
    mustChange?: boolean;
    deviceLabel?: string;
  }): Promise<{ account: AccountSelfView; session: CreateAccountSessionResult }> {
    validateNewAccountPassword(input.password, input.loginName);
    const account = await this.sessions.createAccount({
      ...(input.accountId ? { accountId: input.accountId } : {}),
      loginName: input.loginName,
      displayName: input.displayName,
      role: input.role ?? "user",
    });
    const credential = await createPasswordCredential({
      accountId: account.accountId,
      password: input.password,
      changedAt: this.now(),
      parameters: this.passwordKdf,
      mustChange: input.mustChange === true,
    });
    await this.storage.savePasswordCredential(credential);
    const session = await this.sessions.createSession({
      accountId: account.accountId,
      ...(input.deviceLabel ? { deviceLabel: input.deviceLabel } : {}),
    });
    return { account, session };
  }

  async createInvite(input: {
    loginName: string;
    displayName: string;
    createdByAccountId?: string;
    expiresInHours?: number;
  }): Promise<{ inviteToken: string; invite: AccountInvitePublicView }> {
    const account = await this.sessions.createAccount({
      loginName: input.loginName,
      displayName: input.displayName,
      role: "user",
      status: "disabled",
    });
    const now = this.now();
    const inviteToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.parse(now) + clampHours(input.expiresInHours, 72) * 60 * 60 * 1000).toISOString();
    const invite: AccountInviteRecord = {
      inviteId: randomId("acct_inv"),
      inviteTokenHash: this.sessions.hashOneTimeToken("invite", inviteToken),
      targetAccountId: account.accountId,
      createdAt: now,
      expiresAt,
      ...(input.createdByAccountId ? { createdByAccountId: input.createdByAccountId } : {}),
    };
    await this.storage.saveInvite(invite);
    return { inviteToken, invite: { loginName: account.loginName, displayName: account.displayName, expiresAt } };
  }

  async inspectInvite(inviteToken: string): Promise<AccountInvitePublicView | undefined> {
    const invite = await this.storage.loadInviteByTokenHash(this.sessions.hashOneTimeToken("invite", inviteToken));
    if (!invite || !isOneTimeTokenUsable(invite, this.now())) return undefined;
    const account = await this.storage.loadAccount(invite.targetAccountId);
    if (!account || account.status !== "disabled") return undefined;
    return { loginName: account.loginName, displayName: account.displayName, expiresAt: invite.expiresAt };
  }

  async acceptInvite(input: { inviteToken: string; password: string; deviceLabel?: string }): Promise<{
    account: AccountSelfView;
    session: CreateAccountSessionResult;
  } | undefined> {
    const invite = await this.storage.loadInviteByTokenHash(this.sessions.hashOneTimeToken("invite", input.inviteToken));
    const now = this.now();
    if (!invite || !isOneTimeTokenUsable(invite, now)) return undefined;
    const account = await this.storage.loadAccount(invite.targetAccountId);
    if (!account || account.status !== "disabled") return undefined;
    validateNewAccountPassword(input.password, account.loginName);
    const credential = await createPasswordCredential({
      accountId: account.accountId,
      password: input.password,
      changedAt: now,
      parameters: this.passwordKdf,
    });
    if (!(await this.storage.claimInvite(invite.inviteId, now))) return undefined;
    const activeAccount = { ...account, status: "active" as const, updatedAt: now };
    await this.storage.savePasswordCredential(credential);
    await this.storage.saveAccount(activeAccount);
    const session = await this.sessions.createSession({
      accountId: activeAccount.accountId,
      ...(input.deviceLabel ? { deviceLabel: input.deviceLabel } : {}),
    });
    return { account: accountSelfView(activeAccount), session };
  }

  async createResetToken(input: {
    loginName: string;
    createdByAccountId?: string;
    expiresInHours?: number;
  }): Promise<{ resetToken: string; expiresAt: string } | undefined> {
    const account = await this.storage.loadAccountByLoginNameNormalized(normalizeLoginName(input.loginName).normalized);
    if (!account || account.status === "deleted") return undefined;
    const now = this.now();
    const resetToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.parse(now) + clampHours(input.expiresInHours, 2) * 60 * 60 * 1000).toISOString();
    const record: AccountResetTokenRecord = {
      resetId: randomId("acct_reset"),
      resetTokenHash: this.sessions.hashOneTimeToken("reset", resetToken),
      targetAccountId: account.accountId,
      createdAt: now,
      expiresAt,
      ...(input.createdByAccountId ? { createdByAccountId: input.createdByAccountId } : {}),
    };
    await this.storage.saveResetToken(record);
    return { resetToken, expiresAt };
  }

  async acceptReset(input: { resetToken: string; newPassword: string }): Promise<boolean> {
    const resetToken = await this.storage.loadResetTokenByHash(this.sessions.hashOneTimeToken("reset", input.resetToken));
    const now = this.now();
    if (!resetToken || !isOneTimeTokenUsable(resetToken, now)) return false;
    const account = await this.storage.loadAccount(resetToken.targetAccountId);
    if (!account || account.status === "deleted") return false;
    validateNewAccountPassword(input.newPassword, account.loginName);
    const credential = await createPasswordCredential({
      accountId: account.accountId,
      password: input.newPassword,
      changedAt: now,
      parameters: this.passwordKdf,
    });
    if (!(await this.storage.claimResetToken(resetToken.resetId, now))) return false;
    await this.storage.savePasswordCredential(credential);
    await this.storage.saveAccount({ ...account, status: "active", credentialVersion: account.credentialVersion + 1, updatedAt: now });
    await this.sessions.revokeAllAccountSessions(account.accountId);
    return true;
  }

  async login(input: { loginName: string; password: string; deviceLabel?: string }): Promise<AccountPasswordLoginResult> {
    const normalized = normalizeLoginName(input.loginName);
    const account = await this.storage.loadAccountByLoginNameNormalized(normalized.normalized);
    const credential = account ? await this.storage.loadPasswordCredential(account.accountId) : undefined;
    const verification = await verifyPasswordCredential(input.password, credential ?? dummyCredential(this.passwordKdf));
    if (!account || account.status !== "active" || !credential || !verification.ok) return { ok: false, errorCode: "invalid_credentials" };

    if (verification.needsRehash) {
      await this.storage.savePasswordCredential(
        await createPasswordCredential({
          accountId: account.accountId,
          password: input.password,
          changedAt: this.now(),
          parameters: this.passwordKdf,
          mustChange: credential.mustChange,
        }),
      );
    }
    const session = await this.sessions.createSession({
      accountId: account.accountId,
      ...(input.deviceLabel ? { deviceLabel: input.deviceLabel } : {}),
    });
    return { ok: true, account: accountSelfView(account), session };
  }

  async changePassword(input: { accountId: string; currentPassword: string; newPassword: string }): Promise<boolean> {
    const account = await this.storage.loadAccount(input.accountId);
    const credential = account ? await this.storage.loadPasswordCredential(account.accountId) : undefined;
    if (!account || account.status !== "active" || !credential || !(await verifyPasswordCredential(input.currentPassword, credential)).ok) return false;
    validateNewAccountPassword(input.newPassword, account.loginName);
    const nextAccount = { ...account, credentialVersion: account.credentialVersion + 1, updatedAt: this.now() };
    await this.storage.savePasswordCredential(
      await createPasswordCredential({
        accountId: account.accountId,
        password: input.newPassword,
        changedAt: this.now(),
        parameters: this.passwordKdf,
        mustChange: false,
      }),
    );
    await this.storage.saveAccount(nextAccount);
    await this.sessions.revokeAllAccountSessions(account.accountId);
    return true;
  }

  async replacePassword(input: { accountId: string; newPassword: string; mustChange?: boolean }): Promise<boolean> {
    const account = await this.storage.loadAccount(input.accountId);
    if (!account || account.status === "deleted") return false;
    validateNewAccountPassword(input.newPassword, account.loginName);
    const now = this.now();
    await this.storage.savePasswordCredential(
      await createPasswordCredential({
        accountId: account.accountId,
        password: input.newPassword,
        changedAt: now,
        parameters: this.passwordKdf,
        mustChange: input.mustChange === true,
      }),
    );
    await this.storage.saveAccount({ ...account, credentialVersion: account.credentialVersion + 1, updatedAt: now });
    await this.sessions.revokeAllAccountSessions(account.accountId);
    return true;
  }

  async authenticateSession(sessionToken: string): Promise<AccountSessionAuthResult> {
    return this.sessions.authenticateSessionToken(sessionToken);
  }

  async verifyCsrf(sessionToken: string, csrfToken: string): Promise<boolean> {
    return this.sessions.verifyCsrfToken(sessionToken, csrfToken);
  }

  close(): void {
    this.storage.close?.();
  }
}

export function validateNewAccountPassword(password: string, loginName?: string): string {
  const normalizedPassword = password.normalize("NFC");
  const length = Array.from(normalizedPassword).length;
  if (length < ACCOUNT_PASSWORD_MIN_LENGTH) throw new Error("account_password_too_short");
  if (length > ACCOUNT_PASSWORD_MAX_LENGTH) throw new Error("account_password_too_long");
  const comparison = normalizedPassword.toLocaleLowerCase("en-US");
  const loginComparison = loginName ? normalizeLoginName(loginName).normalized : undefined;
  if (COMMON_PASSWORD_BLOCKLIST.has(comparison) || comparison.includes("netgrid") || (loginComparison && comparison === loginComparison)) {
    throw new Error("account_password_blocked");
  }
  return normalizedPassword;
}

export async function createPasswordCredential(input: {
  accountId: string;
  password: string;
  changedAt: string;
  parameters?: AccountPasswordKdfParameters;
  mustChange?: boolean;
}): Promise<AccountPasswordCredentialRecord> {
  const parameters = input.parameters ?? DEFAULT_ACCOUNT_PASSWORD_KDF;
  const password = input.password.normalize("NFC");
  const salt = randomBytes(32).toString("base64url");
  const passwordHash = (await derivePassword(password, salt, parameters)).toString("base64url");
  return {
    accountId: input.accountId,
    algorithm: "scrypt",
    parametersVersion: ACCOUNT_PASSWORD_PARAMETERS_VERSION,
    salt,
    passwordHash,
    ...parameters,
    changedAt: input.changedAt,
    mustChange: input.mustChange === true,
  };
}

export async function verifyPasswordCredential(
  password: string,
  credential: AccountPasswordCredentialRecord,
): Promise<{ ok: boolean; needsRehash: boolean }> {
  const actual = await derivePassword(password.normalize("NFC"), credential.salt, credential);
  const expected = Buffer.from(credential.passwordHash, "base64url");
  const ok = actual.length === expected.length && timingSafeEqual(actual, expected);
  return { ok, needsRehash: credential.parametersVersion < ACCOUNT_PASSWORD_PARAMETERS_VERSION };
}

function derivePassword(password: string, salt: string, parameters: AccountPasswordKdfParameters): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    scrypt(
      password,
      Buffer.from(salt, "base64url"),
      parameters.keyLength,
      {
        N: parameters.cost,
        r: parameters.blockSize,
        p: parameters.parallelization,
        maxmem: parameters.maxMemory,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolvePromise(derivedKey);
      },
    );
  });
}

function dummyCredential(parameters: AccountPasswordKdfParameters): AccountPasswordCredentialRecord {
  return {
    accountId: "dummy",
    algorithm: "scrypt",
    parametersVersion: ACCOUNT_PASSWORD_PARAMETERS_VERSION,
    salt: Buffer.alloc(32, 7).toString("base64url"),
    passwordHash: Buffer.alloc(parameters.keyLength, 11).toString("base64url"),
    ...parameters,
    changedAt: "1970-01-01T00:00:00.000Z",
    mustChange: false,
  };
}

function accountSelfView(account: {
  accountId: string;
  loginName: string;
  displayName: string;
  status: "active" | "disabled" | "deleted";
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}): AccountSelfView {
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

const COMMON_PASSWORD_BLOCKLIST = new Set([
  "123456789012345",
  "correcthorsebatterystaple",
  "letmeinletmeinletmein",
  "passwordpassword",
  "password123456789",
  "qwertyuiopasdfgh",
  "welcome123456789",
]);

export function validateAccountLoginName(loginName: string): void {
  validateLoginName(normalizeLoginName(loginName));
}

function isOneTimeTokenUsable(record: { usedAt?: string; revokedAt?: string; expiresAt: string }, now: string): boolean {
  return !record.usedAt && !record.revokedAt && Date.parse(record.expiresAt) > Date.parse(now);
}

function clampHours(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(168, Math.max(1, Math.floor(value ?? fallback)));
}

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
