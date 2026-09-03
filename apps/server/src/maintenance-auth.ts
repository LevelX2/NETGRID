import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { resolveServerRuntimePaths } from "./runtime-paths";

export const MAINTENANCE_SESSION_COOKIE_NAME = "ng_maintenance_session";
export const MAINTENANCE_PASSWORD_MIN_LENGTH = 12;
export const MAINTENANCE_PASSWORD_MAX_LENGTH = 1024;
export const MAINTENANCE_SESSION_MAX_AGE_MINUTES = 30;
export const MAINTENANCE_REAUTH_MAX_AGE_MINUTES = 5;

export type MaintenancePasswordKdf = {
  algorithm: "scrypt";
  salt: string;
  hash: string;
  keyLength: number;
  cost: number;
  blockSize: number;
  parallelization: number;
  maxMemory: number;
};

export type MaintenanceCredentialRecord = {
  format: "netgrid_maintenance_auth";
  version: 1;
  credentialVersion: number;
  password: MaintenancePasswordKdf;
  updatedAt: string;
};

export type MaintenanceCredentialStore = {
  load(): Promise<MaintenanceCredentialRecord | undefined>;
  save(record: MaintenanceCredentialRecord): Promise<void>;
};

export type MaintenanceSessionView = {
  authenticated: true;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
  reauthenticatedUntil?: string;
};

export type CreateMaintenanceSessionResult = {
  sessionToken: string;
  csrfToken: string;
  session: MaintenanceSessionView;
};

export type MaintenanceAuthResult =
  | { ok: true; session: MaintenanceSessionView }
  | {
      ok: false;
      errorCode:
        | "maintenance_auth_required"
        | "maintenance_session_expired"
        | "maintenance_session_revoked";
    };

type MaintenanceSessionRecord = {
  sessionTokenHash: string;
  csrfTokenHash: string;
  credentialVersion: number;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
  revokedAt?: string;
  reauthenticatedUntil?: string;
};

type MaintenanceAuthOptions = {
  now?: () => string;
  sessionMaxAgeMinutes?: number;
  reauthMaxAgeMinutes?: number;
  sessionSecret?: Buffer;
  passwordKdf?: Pick<
    MaintenancePasswordKdf,
    "keyLength" | "cost" | "blockSize" | "parallelization" | "maxMemory"
  >;
};

const DEFAULT_PASSWORD_KDF: MaintenanceAuthOptions["passwordKdf"] = {
  keyLength: 64,
  cost: 65_536,
  blockSize: 8,
  parallelization: 1,
  maxMemory: 96 * 1024 * 1024,
};

export class InMemoryMaintenanceCredentialStore implements MaintenanceCredentialStore {
  private record: MaintenanceCredentialRecord | undefined;

  async load(): Promise<MaintenanceCredentialRecord | undefined> {
    return this.record ? clone(this.record) : undefined;
  }

  async save(record: MaintenanceCredentialRecord): Promise<void> {
    this.record = clone(record);
  }
}

export class JsonFileMaintenanceCredentialStore implements MaintenanceCredentialStore {
  readonly path: string;

  constructor(path = maintenanceAuthPathFromEnv()) {
    this.path = resolve(path);
  }

  async load(): Promise<MaintenanceCredentialRecord | undefined> {
    if (!existsSync(this.path)) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(this.path, "utf8"));
    } catch {
      throw new Error("maintenance_auth_storage_invalid");
    }
    if (!isCredentialRecord(parsed))
      throw new Error("maintenance_auth_storage_invalid");
    return parsed;
  }

  async save(record: MaintenanceCredentialRecord): Promise<void> {
    mkdirSync(dirname(this.path), { recursive: true });
    const tempPath = `${this.path}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    try {
      writeFileSync(tempPath, `${JSON.stringify(record, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
        flag: "wx",
      });
      try {
        chmodSync(tempPath, 0o600);
      } catch {
        // Windows may not expose POSIX modes. The runtime directory remains operator-private.
      }
      renameSync(tempPath, this.path);
      try {
        chmodSync(this.path, 0o600);
      } catch {
        // See comment above.
      }
    } finally {
      if (existsSync(tempPath)) rmSync(tempPath, { force: true });
    }
  }
}

export class MaintenanceAuthService {
  private readonly now: () => string;
  private readonly sessionMaxAgeMinutes: number;
  private readonly reauthMaxAgeMinutes: number;
  private readonly sessionSecret: Buffer;
  private readonly passwordKdf: NonNullable<
    MaintenanceAuthOptions["passwordKdf"]
  >;
  private readonly sessions = new Map<string, MaintenanceSessionRecord>();

  constructor(
    private readonly store: MaintenanceCredentialStore = new JsonFileMaintenanceCredentialStore(),
    options: MaintenanceAuthOptions = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.sessionMaxAgeMinutes =
      options.sessionMaxAgeMinutes ?? MAINTENANCE_SESSION_MAX_AGE_MINUTES;
    this.reauthMaxAgeMinutes =
      options.reauthMaxAgeMinutes ?? MAINTENANCE_REAUTH_MAX_AGE_MINUTES;
    this.sessionSecret = options.sessionSecret ?? randomBytes(32);
    this.passwordKdf = options.passwordKdf ?? DEFAULT_PASSWORD_KDF!;
  }

  async isInitialized(): Promise<boolean> {
    return Boolean(await this.store.load());
  }

  async bootstrapPassword(password: string): Promise<void> {
    if (await this.store.load())
      throw new Error("maintenance_auth_already_initialized");
    await this.replacePassword(password, 1);
  }

  async resetPassword(password: string): Promise<void> {
    const current = await this.store.load();
    await this.replacePassword(password, (current?.credentialVersion ?? 0) + 1);
  }

  async verifyPassword(password: string): Promise<boolean> {
    const credential = await this.store.load();
    if (!credential || !isPasswordWithinInputBounds(password)) return false;
    const actual = await derivePassword(password, credential.password);
    const expected = Buffer.from(credential.password.hash, "base64url");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  async createSession(
    password: string,
  ): Promise<CreateMaintenanceSessionResult | undefined> {
    const credential = await this.store.load();
    if (!credential || !(await this.verifyPassword(password))) return undefined;
    const now = this.now();
    const sessionToken = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(32).toString("base64url");
    const record: MaintenanceSessionRecord = {
      sessionTokenHash: this.hashSecret("session", sessionToken),
      csrfTokenHash: this.hashSecret("csrf", csrfToken),
      credentialVersion: credential.credentialVersion,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: addMinutes(now, this.sessionMaxAgeMinutes),
    };
    this.sessions.set(record.sessionTokenHash, record);
    return { sessionToken, csrfToken, session: sessionView(record) };
  }

  async authenticateSession(
    sessionToken: string | undefined,
  ): Promise<MaintenanceAuthResult> {
    if (!sessionToken)
      return { ok: false, errorCode: "maintenance_auth_required" };
    const key = this.hashSecret("session", sessionToken);
    const session = this.sessions.get(key);
    if (!session) return { ok: false, errorCode: "maintenance_auth_required" };
    if (session.revokedAt)
      return { ok: false, errorCode: "maintenance_session_revoked" };
    const now = this.now();
    if (Date.parse(session.expiresAt) <= Date.parse(now)) {
      this.sessions.delete(key);
      return { ok: false, errorCode: "maintenance_session_expired" };
    }
    const credential = await this.store.load();
    if (
      !credential ||
      credential.credentialVersion !== session.credentialVersion
    ) {
      this.sessions.delete(key);
      return { ok: false, errorCode: "maintenance_session_revoked" };
    }
    session.lastSeenAt = now;
    return { ok: true, session: sessionView(session) };
  }

  async verifyCsrf(
    sessionToken: string | undefined,
    csrfToken: string | undefined,
  ): Promise<boolean> {
    if (!csrfToken) return false;
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.ok || !sessionToken) return false;
    const session = this.sessions.get(this.hashSecret("session", sessionToken));
    if (!session) return false;
    const actual = Buffer.from(this.hashSecret("csrf", csrfToken));
    const expected = Buffer.from(session.csrfTokenHash);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  async rotateCsrfToken(
    sessionToken: string | undefined,
  ): Promise<string | undefined> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.ok || !sessionToken) return undefined;
    const session = this.sessions.get(this.hashSecret("session", sessionToken));
    if (!session) return undefined;
    const csrfToken = randomBytes(32).toString("base64url");
    session.csrfTokenHash = this.hashSecret("csrf", csrfToken);
    return csrfToken;
  }

  async reauthenticateSession(
    sessionToken: string | undefined,
    password: string,
  ): Promise<MaintenanceAuthResult> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.ok || !sessionToken) return auth;
    if (!(await this.verifyPassword(password)))
      return { ok: false, errorCode: "maintenance_auth_required" };
    const session = this.sessions.get(this.hashSecret("session", sessionToken));
    if (!session) return { ok: false, errorCode: "maintenance_auth_required" };
    session.reauthenticatedUntil = addMinutes(
      this.now(),
      this.reauthMaxAgeMinutes,
    );
    return { ok: true, session: sessionView(session) };
  }

  async consumeReauthentication(
    sessionToken: string | undefined,
  ): Promise<boolean> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.ok || !sessionToken) return false;
    const session = this.sessions.get(this.hashSecret("session", sessionToken));
    if (
      !session?.reauthenticatedUntil ||
      Date.parse(session.reauthenticatedUntil) <= Date.parse(this.now())
    )
      return false;
    delete session.reauthenticatedUntil;
    return true;
  }

  async changePassword(
    sessionToken: string | undefined,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.ok || !(await this.verifyPassword(currentPassword))) return false;
    const credential = await this.store.load();
    if (!credential) return false;
    await this.replacePassword(newPassword, credential.credentialVersion + 1);
    return true;
  }

  revokeSession(sessionToken: string | undefined): boolean {
    if (!sessionToken) return false;
    const session = this.sessions.get(this.hashSecret("session", sessionToken));
    if (!session) return false;
    session.revokedAt = session.revokedAt ?? this.now();
    return true;
  }

  revokeAllSessions(): number {
    const now = this.now();
    let revoked = 0;
    for (const session of this.sessions.values()) {
      if (session.revokedAt) continue;
      session.revokedAt = now;
      revoked += 1;
    }
    return revoked;
  }

  private async replacePassword(
    password: string,
    credentialVersion: number,
  ): Promise<void> {
    validateNewPassword(password);
    const salt = randomBytes(32).toString("base64url");
    const passwordKdf: MaintenancePasswordKdf = {
      algorithm: "scrypt",
      salt,
      hash: "",
      ...this.passwordKdf,
    };
    passwordKdf.hash = (await derivePassword(password, passwordKdf)).toString(
      "base64url",
    );
    await this.store.save({
      format: "netgrid_maintenance_auth",
      version: 1,
      credentialVersion,
      password: passwordKdf,
      updatedAt: this.now(),
    });
    this.revokeAllSessions();
  }

  private hashSecret(purpose: "session" | "csrf", value: string): string {
    return createHmac("sha256", this.sessionSecret)
      .update(`maintenance-${purpose}:${value}`)
      .digest("hex");
  }
}

export function maintenanceAuthPathFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return resolveServerRuntimePaths({ env }).maintenanceAuthPath;
}

export function validateNewPassword(password: string): void {
  const length = Array.from(password).length;
  if (length < MAINTENANCE_PASSWORD_MIN_LENGTH)
    throw new Error("maintenance_password_too_short");
  if (length > MAINTENANCE_PASSWORD_MAX_LENGTH)
    throw new Error("maintenance_password_too_long");
}

function isPasswordWithinInputBounds(password: string): boolean {
  const length = Array.from(password).length;
  return length >= 1 && length <= MAINTENANCE_PASSWORD_MAX_LENGTH;
}

function derivePassword(
  password: string,
  parameters: MaintenancePasswordKdf,
): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    scrypt(
      password,
      Buffer.from(parameters.salt, "base64url"),
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

function isCredentialRecord(
  value: unknown,
): value is MaintenanceCredentialRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<MaintenanceCredentialRecord>;
  const password = record.password as
    | Partial<MaintenancePasswordKdf>
    | undefined;
  return (
    record.format === "netgrid_maintenance_auth" &&
    record.version === 1 &&
    Number.isInteger(record.credentialVersion) &&
    (record.credentialVersion ?? 0) > 0 &&
    typeof record.updatedAt === "string" &&
    password?.algorithm === "scrypt" &&
    typeof password.salt === "string" &&
    password.salt.length > 0 &&
    typeof password.hash === "string" &&
    password.hash.length > 0 &&
    isPositiveInteger(password.keyLength) &&
    isPositiveInteger(password.cost) &&
    isPositiveInteger(password.blockSize) &&
    isPositiveInteger(password.parallelization) &&
    isPositiveInteger(password.maxMemory)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}

function sessionView(
  session: MaintenanceSessionRecord,
): MaintenanceSessionView {
  return {
    authenticated: true,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    lastSeenAt: session.lastSeenAt,
    ...(session.reauthenticatedUntil
      ? { reauthenticatedUntil: session.reauthenticatedUntil }
      : {}),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
