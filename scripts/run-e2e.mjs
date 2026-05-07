import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const corepack = "corepack";
const useShell = process.platform === "win32";
const started = [];

const serverPort = await freePort();
const webPort = await freePort();
const serverUrl = `http://127.0.0.1:${serverPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;
const runtimeDir = path.join(root, "tmp", `e2e-runtime-${Date.now()}`);
const runtimePath = path.join(runtimeDir, "netrunner.sqlite");
const backupDir = path.join(runtimeDir, "backups");

await rm(runtimeDir, { recursive: true, force: true });
await mkdir(runtimeDir, { recursive: true });

try {
  start("server", ["pnpm", "--filter", "@netrunner/server", "exec", "tsx", "src/index.ts"], {
    PORT: String(serverPort),
    HOST: "127.0.0.1",
    NETRUNNER_STORAGE_KIND: "sqlite",
    NETRUNNER_SQLITE_STORAGE_PATH: runtimePath,
    NETRUNNER_STORAGE_BACKUP_DIR: backupDir,
    NETRUNNER_LEGACY_MATCH_STORAGE_PATH: path.join(runtimeDir, "legacy-matches.json"),
    NETRUNNER_TOKEN_SALT: "v1-0-7-e2e-token-salt",
    NETRUNNER_DEPLOYMENT_PROFILE: "local",
    NETRUNNER_WEB_BASE_URL: webUrl,
    NETRUNNER_SERVER_BASE_URL: serverUrl,
    NETRUNNER_ALLOWED_ORIGINS: webUrl,
    NETRUNNER_RATE_LIMIT_PROFILE: "local"
  });
  await waitForUrl(`${serverUrl}/health`, "server");

  start("web", ["pnpm", "--filter", "@netrunner/web", "exec", "next", "dev", "--hostname", "127.0.0.1", "--port", String(webPort)], {
    NEXT_PUBLIC_NETRUNNER_SERVER_URL: serverUrl
  });
  await waitForUrl(webUrl, "web");

  const result = await run(corepack, ["pnpm", "exec", "playwright", "test"], {
    PLAYWRIGHT_BASE_URL: webUrl,
    NETRUNNER_E2E_SERVER_URL: serverUrl,
    NETRUNNER_E2E_RUNTIME_PATH: runtimePath
  });
  process.exitCode = result;
} finally {
  await Promise.allSettled(started.reverse().map((child) => stopProcessTree(child)));
}

function start(label, args, env) {
  const child = spawn(corepack, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: useShell
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[${label}] ${redactLogChunk(chunk)}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${label}] ${redactLogChunk(chunk)}`));
  child.on("exit", (code, signal) => {
    if (process.exitCode === undefined && code !== null && code !== 0) {
      process.stderr.write(`[${label}] exited with code ${code}${signal ? ` (${signal})` : ""}\n`);
      process.exitCode = code;
    }
  });
  started.push(child);
  return child;
}

function redactLogChunk(chunk) {
  return String(chunk)
    .replace(/(joinToken=)[A-Za-z0-9_-]+/g, "$1[redacted]")
    .replace(/("(?:hostSessionToken|hostReconnectToken|sessionToken|reconnectToken|joinToken|tokenHash)"\s*:\s*")[^"]+(")/g, "$1[redacted]$2")
    .replace(/sha256:[a-f0-9]{64}/gi, "sha256:[redacted]")
    .replace(/privateDeckSnapshots|privatePayload|cardInstances|decklist/gi, "[redacted-field]");
}

function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
      shell: useShell
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function waitForUrl(url, label) {
  const deadline = Date.now() + 60_000;
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // keep polling
      }
      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for ${label} at ${url}`));
        return;
      }
      setTimeout(poll, 500);
    };
    void poll();
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") resolve(address.port);
        else reject(new Error("Could not allocate local port"));
      });
    });
  });
}

function stopProcessTree(child) {
  return new Promise((resolve) => {
    if (!child.pid || child.killed) {
      resolve();
      return;
    }
    if (process.platform === "win32") {
      const killer = spawn("taskkill.exe", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
      return;
    }
    child.kill("SIGTERM");
    setTimeout(() => {
      if (!child.killed) child.kill("SIGKILL");
      resolve();
    }, 1_500);
  });
}
