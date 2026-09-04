import { spawn, spawnSync } from "node:child_process";
import { createServer, Socket } from "node:net";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const releaseRoot = path.join(projectRoot, "output", "windows-release");
const installerInput = path.join(
  projectRoot,
  "output",
  "windows-installer-input",
);
const scratch = mkdtempSync(path.join(tmpdir(), "netgrid-launcher-smoke-"));
const programRoot = path.join(scratch, "program");
const dataRoot = path.join(scratch, "data");
const serverPort = await freePort();
let webPort = await freePort();
while (webPort === serverPort) webPort = await freePort();
const serverUrl = `http://127.0.0.1:${serverPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;

try {
  cpSync(releaseRoot, programRoot, { recursive: true });
  copyFile(
    path.join(installerInput, "runtime", "node", "node.exe"),
    path.join(programRoot, "runtime", "node", "node.exe"),
  );
  copyFile(
    path.join(installerInput, "launcher", "NETGRID.exe"),
    path.join(programRoot, "NETGRID.exe"),
  );
  const runtimeConfig = path.join(
    installerInput,
    "runtime-config",
    "NETGRID.RuntimeConfig.exe",
  );
  const templatePath = path.join(scratch, "runtime.env.example");
  const template = readFileSync(
    path.join(releaseRoot, "config", "runtime.env.example"),
    "utf8",
  )
    .replace(/^NETGRID_SERVER_PORT=.*$/m, `NETGRID_SERVER_PORT=${serverPort}`)
    .replace(/^PORT=.*$/m, `PORT=${webPort}`)
    .replace(/^NETGRID_WEB_BASE_URL=.*$/m, `NETGRID_WEB_BASE_URL=${webUrl}`)
    .replace(
      /^NETGRID_SERVER_BASE_URL=.*$/m,
      `NETGRID_SERVER_BASE_URL=${serverUrl}`,
    )
    .replace(
      /^NETGRID_ALLOWED_ORIGINS=.*$/m,
      `NETGRID_ALLOWED_ORIGINS=${webUrl}`,
    )
    .replace(
      /^NEXT_PUBLIC_NETGRID_SERVER_URL=.*$/m,
      `NEXT_PUBLIC_NETGRID_SERVER_URL=${serverUrl}`,
    )
    .replace(
      /^NETGRID_MAINTENANCE_BASE_URL=.*$/m,
      `NETGRID_MAINTENANCE_BASE_URL=${webUrl}`,
    )
    .replace(
      /^NETGRID_MAINTENANCE_ALLOWED_ORIGINS=.*$/m,
      `NETGRID_MAINTENANCE_ALLOWED_ORIGINS=${webUrl}`,
    );
  writeFileSync(templatePath, template, "utf8");
  run(runtimeConfig, [
    "initialize",
    "--data-root",
    dataRoot,
    "--program-root",
    programRoot,
    "--template",
    templatePath,
    "--state-file",
    path.join(scratch, "install-state.json"),
  ]);

  const launcher = spawn(
    path.join(programRoot, "NETGRID.exe"),
    [
      "--headless-smoke",
      "--program-root",
      programRoot,
      "--environment-file",
      path.join(dataRoot, "config", "runtime.env"),
    ],
    {
      cwd: programRoot,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const output = await waitForExit(launcher, 300_000);
  if (output.exitCode !== 0)
    throw new Error(`launcher_smoke_failed:${output.exitCode}:${output.text}`);
  if (
    !existsSync(path.join(dataRoot, "runtime", "multiplayer", "netgrid.sqlite"))
  )
    throw new Error("launcher_smoke_sqlite_missing");
  const serverLog = readFileSync(
    path.join(dataRoot, "runtime", "logs", "launcher-server.log"),
    "utf8",
  );
  if (!serverLog.includes("server stopping (launcher)"))
    throw new Error("launcher_graceful_server_stop_missing");
  await assertPortClosed(serverPort);
  await assertPortClosed(webPort);
  process.stdout.write(
    `WINDOWS_LAUNCHER_SMOKE_OK ports=${serverPort},${webPort} recoveryAttempts=1\n`,
  );
} finally {
  grantCleanupAccess(scratch);
  rmSync(scratch, { recursive: true, force: true });
}

function copyFile(source, target) {
  if (!existsSync(source))
    throw new Error(`launcher_smoke_input_missing:${source}`);
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(source, target);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `launcher_smoke_command_failed:${result.status}:${result.stderr}`,
    );
}

function waitForExit(child, timeoutMs) {
  return new Promise((resolvePromise, reject) => {
    let text = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`launcher_smoke_timeout:${text}`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      text = `${text}${chunk}`.slice(-12_000);
    });
    child.stderr.on("data", (chunk) => {
      text = `${text}${chunk}`.slice(-12_000);
    });
    child.once("error", reject);
    child.once("exit", (exitCode) => {
      clearTimeout(timer);
      resolvePromise({ exitCode, text });
    });
  });
}

function freePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("launcher_smoke_port_resolution_failed"));
        return;
      }
      server.close((error) =>
        error ? reject(error) : resolvePromise(address.port),
      );
    });
  });
}

async function assertPortClosed(port) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const closed = await new Promise((resolvePromise) => {
      const socket = new Socket();
      socket.once("connect", () => {
        socket.destroy();
        resolvePromise(false);
      });
      socket.once("error", () => resolvePromise(true));
      socket.connect(port, "127.0.0.1");
    });
    if (closed) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`launcher_smoke_port_still_open:${port}`);
}

function grantCleanupAccess(target) {
  if (process.platform !== "win32" || !existsSync(target)) return;
  spawnSync(
    "icacls.exe",
    [target, "/grant", "*S-1-5-32-545:(OI)(CI)F", "/T", "/C"],
    {
      windowsHide: true,
      stdio: "ignore",
    },
  );
}
