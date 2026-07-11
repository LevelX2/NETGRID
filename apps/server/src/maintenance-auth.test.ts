import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  InMemoryMaintenanceCredentialStore,
  JsonFileMaintenanceCredentialStore,
  MaintenanceAuthService,
  type MaintenanceCredentialStore,
  validateNewPassword,
} from "./maintenance-auth";
import { runMaintenanceAuthCli } from "./maintenance-auth-cli";

const TEST_KDF = {
  keyLength: 32,
  cost: 1024,
  blockSize: 8,
  parallelization: 1,
  maxMemory: 8 * 1024 * 1024,
};
const tempDirs: string[] = [];

afterEach(() => {
  for (const path of tempDirs.splice(0))
    rmSync(path, { recursive: true, force: true });
});

function service(
  store: MaintenanceCredentialStore = new InMemoryMaintenanceCredentialStore(),
  now?: () => string,
): MaintenanceAuthService {
  return new MaintenanceAuthService(store, {
    passwordKdf: TEST_KDF,
    sessionSecret: Buffer.alloc(32, 7),
    ...(now ? { now } : {}),
  });
}

describe("MaintenanceAuthService", () => {
  it("stores only a versioned salted password derivation", async () => {
    const directory = mkdtempSync(join(tmpdir(), "netgrid-maintenance-auth-"));
    tempDirs.push(directory);
    const path = join(directory, "auth.json");
    const auth = service(new JsonFileMaintenanceCredentialStore(path));

    await auth.bootstrapPassword("eine sichere Passphrase");

    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(raw).not.toContain("eine sichere Passphrase");
    expect(parsed).toMatchObject({
      format: "netgrid_maintenance_auth",
      version: 1,
      credentialVersion: 1,
    });
    expect(parsed.password).toMatchObject({
      algorithm: "scrypt",
      cost: 1024,
      blockSize: 8,
      parallelization: 1,
    });
    await expect(auth.verifyPassword("eine sichere Passphrase")).resolves.toBe(
      true,
    );
    await expect(auth.verifyPassword("falsches Passwort")).resolves.toBe(false);
  });

  it("fails closed for malformed credential storage", async () => {
    const directory = mkdtempSync(
      join(tmpdir(), "netgrid-maintenance-auth-invalid-"),
    );
    tempDirs.push(directory);
    const path = join(directory, "auth.json");
    writeFileSync(path, JSON.stringify({ password: "plaintext" }));
    const auth = service(new JsonFileMaintenanceCredentialStore(path));

    await expect(auth.isInitialized()).rejects.toThrow(
      "maintenance_auth_storage_invalid",
    );
  });

  it("creates opaque expiring sessions and validates a separate CSRF proof", async () => {
    let now = "2026-07-11T10:00:00.000Z";
    const auth = service(new InMemoryMaintenanceCredentialStore(), () => now);
    await auth.bootstrapPassword("eine sichere Passphrase");

    const created = await auth.createSession("eine sichere Passphrase");
    expect(created?.sessionToken).toHaveLength(43);
    expect(created?.csrfToken).toHaveLength(43);
    await expect(
      auth.authenticateSession(created?.sessionToken),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      auth.verifyCsrf(created?.sessionToken, created?.csrfToken),
    ).resolves.toBe(true);
    await expect(auth.verifyCsrf(created?.sessionToken, "wrong")).resolves.toBe(
      false,
    );

    now = "2026-07-11T10:31:00.000Z";
    await expect(
      auth.authenticateSession(created?.sessionToken),
    ).resolves.toEqual({ ok: false, errorCode: "maintenance_session_expired" });
  });

  it("uses one-shot recent reauthentication for sensitive operations", async () => {
    const auth = service();
    await auth.bootstrapPassword("eine sichere Passphrase");
    const created = await auth.createSession("eine sichere Passphrase");

    await expect(
      auth.consumeReauthentication(created?.sessionToken),
    ).resolves.toBe(false);
    await expect(
      auth.reauthenticateSession(created?.sessionToken, "falsch"),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      auth.reauthenticateSession(
        created?.sessionToken,
        "eine sichere Passphrase",
      ),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      auth.consumeReauthentication(created?.sessionToken),
    ).resolves.toBe(true);
    await expect(
      auth.consumeReauthentication(created?.sessionToken),
    ).resolves.toBe(false);
  });

  it("revokes every existing session when the password changes or is reset", async () => {
    const auth = service();
    await auth.bootstrapPassword("erste sichere Passphrase");
    const first = await auth.createSession("erste sichere Passphrase");
    const second = await auth.createSession("erste sichere Passphrase");

    await expect(
      auth.changePassword(
        first?.sessionToken,
        "erste sichere Passphrase",
        "zweite sichere Passphrase",
      ),
    ).resolves.toBe(true);
    await expect(
      auth.authenticateSession(first?.sessionToken),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      auth.authenticateSession(second?.sessionToken),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      auth.createSession("erste sichere Passphrase"),
    ).resolves.toBeUndefined();
    await expect(
      auth.createSession("zweite sichere Passphrase"),
    ).resolves.toBeDefined();

    await auth.resetPassword("dritte sichere Passphrase");
    await expect(
      auth.createSession("zweite sichere Passphrase"),
    ).resolves.toBeUndefined();
    await expect(
      auth.createSession("dritte sichere Passphrase"),
    ).resolves.toBeDefined();
  });

  it("enforces the password length contract", () => {
    expect(() => validateNewPassword("zu kurz")).toThrow(
      "maintenance_password_too_short",
    );
    expect(() =>
      validateNewPassword("eine ausreichend lange Passphrase"),
    ).not.toThrow();
  });
});

describe("maintenance auth CLI", () => {
  it("does not accept a password as a command-line argument and bootstraps via stdin", async () => {
    const directory = mkdtempSync(join(tmpdir(), "netgrid-maintenance-cli-"));
    tempDirs.push(directory);
    const path = join(directory, "auth.json");
    const output: string[] = [];
    const errors: string[] = [];
    const io = {
      write: (message: string) => output.push(message),
      writeError: (message: string) => errors.push(message),
    };

    await expect(
      runMaintenanceAuthCli(
        ["bootstrap", "--password", "secret"],
        "",
        { NETGRID_MAINTENANCE_AUTH_PATH: path },
        io,
      ),
    ).resolves.toBe(2);
    expect(readFileIfPresent(path)).toBeUndefined();

    await expect(
      runMaintenanceAuthCli(
        ["bootstrap", "--password-stdin"],
        "eine sichere Passphrase\neine sichere Passphrase\n",
        { NETGRID_MAINTENANCE_AUTH_PATH: path },
        io,
      ),
    ).resolves.toBe(0);
    expect(readFileSync(path, "utf8")).not.toContain("eine sichere Passphrase");
    expect(errors.join(" ")).not.toContain("eine sichere Passphrase");
    expect(output.join(" ")).not.toContain("eine sichere Passphrase");
  });
});

function readFileIfPresent(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}
