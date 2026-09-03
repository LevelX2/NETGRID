import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsRoot, "..");
const smokeOutput = path.join(
  repositoryRoot,
  "output",
  "windows-release-smoke",
);
const smokeRoot = mkdtempSync(path.join(tmpdir(), "netgrid-release-smoke-"));
const dataRoot = path.join(smokeRoot, "data");
const serverPort = await freePort();
let webPort = await freePort();
while (webPort === serverPort) webPort = await freePort();
const serverUrl = `http://127.0.0.1:${serverPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;
const children = [];

try {
  await runNode(
    path.join(scriptsRoot, "build-windows-release-output.mjs"),
    ["--output", "output/windows-release-smoke"],
    {
      ...process.env,
      NEXT_PUBLIC_NETGRID_SERVER_URL: serverUrl,
    },
  );
  await runNode(
    path.join(scriptsRoot, "check-windows-release-output.mjs"),
    ["--artifact", "output/windows-release-smoke"],
    process.env,
  );

  const commonEnvironment = {
    ...process.env,
    NODE_ENV: "production",
    NETGRID_RUNTIME_PROFILE: "release",
    NETGRID_DATA_ROOT: dataRoot,
    NETGRID_DEPLOYMENT_PROFILE: "local",
    NETGRID_WEB_BASE_URL: webUrl,
    NETGRID_SERVER_BASE_URL: serverUrl,
    NETGRID_ALLOWED_ORIGINS: webUrl,
    NETGRID_TOKEN_SALT: "netgrid-release-smoke-token-salt-v1",
    NETGRID_RATE_LIMIT_PROFILE: "local",
    NETGRID_CONNECTION_AUDIT_LOG: "off",
    NETGRID_TRUST_PROXY_HEADERS: "false",
    NETGRID_HEALTH_DETAIL: "safe",
    NETGRID_MAINTENANCE_ENABLED: "false",
    NETGRID_MAINTENANCE_BASE_URL: webUrl,
    NETGRID_MAINTENANCE_ALLOWED_ORIGINS: webUrl,
  };
  const applicationRoot = path.join(smokeOutput, "app");
  const server = startNode(
    path.join(applicationRoot, "server.mjs"),
    applicationRoot,
    {
      ...commonEnvironment,
      NETGRID_SERVER_HOST: "127.0.0.1",
      NETGRID_SERVER_PORT: String(serverPort),
    },
  );
  children.push(server);
  const web = startNode(
    path.join(applicationRoot, "apps", "web", "server.js"),
    path.join(applicationRoot, "apps", "web"),
    {
      ...commonEnvironment,
      HOSTNAME: "127.0.0.1",
      PORT: String(webPort),
    },
  );
  children.push(web);

  const health = await waitForJson(`${serverUrl}/health`, server);
  if (health.ok !== true || health.storage?.kind !== "sqlite")
    throw new Error(`release_server_health_invalid:${JSON.stringify(health)}`);
  const rootResponse = await waitForResponse(webUrl, web);
  if (!rootResponse.ok)
    throw new Error(`release_web_root_failed:${rootResponse.status}`);

  const catalog = await fetchJson(`${webUrl}/api/cards/catalog`);
  if (
    !Array.isArray(catalog.cards) ||
    catalog.cards.some((card) => card?.setId === "testset")
  )
    throw new Error("release_catalog_contains_testset");
  const snapshots = await fetchJson(`${webUrl}/api/decks/snapshots`);
  if (
    !Array.isArray(snapshots.snapshots) ||
    snapshots.snapshots.some((snapshot) =>
      String(snapshot?.deckSnapshotId ?? "").startsWith("demo_"),
    )
  )
    throw new Error("release_snapshots_contain_demo_content");
  const tutorial = await fetch(`${webUrl}/tutorial`);
  if (tutorial.status !== 404)
    throw new Error(`release_tutorial_must_be_unavailable:${tutorial.status}`);

  const simulationResponse = await fetch(
    `${serverUrl}/api/simulations/ai-vs-ai`,
    {
      method: "POST",
      headers: { "content-type": "application/json", origin: webUrl },
      body: JSON.stringify({ seed: "release-product-smoke", maxActions: 12 }),
    },
  );
  const simulation = await simulationResponse.json();
  if (
    !simulationResponse.ok ||
    simulation.mode !== "ai_vs_ai" ||
    !String(simulation.summary?.finalStateHash ?? "").startsWith("fnv1a:")
  )
    throw new Error(
      `release_product_simulation_failed:${JSON.stringify(simulation)}`,
    );

  const sqlitePath = path.join(
    dataRoot,
    "runtime",
    "multiplayer",
    "netgrid.sqlite",
  );
  if (!existsSync(sqlitePath) || statSync(sqlitePath).size === 0)
    throw new Error("release_isolated_sqlite_missing");
  process.stdout.write(
    `WINDOWS_RELEASE_SMOKE_OK ports=${serverPort},${webPort} dataRoot=${dataRoot}\n`,
  );
} finally {
  for (const child of children.reverse()) {
    if (!child.killed) child.kill();
    await waitForExit(child);
  }
  rmSync(smokeOutput, { recursive: true, force: true });
  rmSync(smokeRoot, { recursive: true, force: true });
}

function startNode(entrypoint, cwd, env, arguments_ = []) {
  const child = spawn(process.execPath, [entrypoint, ...arguments_], {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.output = "";
  child.stdout.on("data", (chunk) => {
    child.output = `${child.output}${chunk}`.slice(-12_000);
  });
  child.stderr.on("data", (chunk) => {
    child.output = `${child.output}${chunk}`.slice(-12_000);
  });
  child.on("error", (error) => {
    child.output = `${child.output}${error.stack ?? error.message}`.slice(
      -12_000,
    );
  });
  return child;
}

async function runNode(entrypoint, arguments_, env) {
  const child = startNode(entrypoint, repositoryRoot, env, arguments_);
  const exitCode = await waitForExit(child);
  if (exitCode !== 0)
    throw new Error(
      `release_smoke_command_failed:${exitCode}\n${child.output}`,
    );
}

async function waitForJson(url, child) {
  const response = await waitForResponse(url, child);
  return response.json();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`release_smoke_http_failed:${url}:${response.status}`);
  return response.json();
}

async function waitForResponse(url, child) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(
        `release_process_exited:${child.exitCode}\n${child.output}`,
      );
    try {
      return await fetch(url);
    } catch {
      await delay(250);
    }
  }
  throw new Error(`release_process_timeout:${url}\n${child.output}`);
}

function freePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("free_port_resolution_failed"));
        return;
      }
      server.close((error) =>
        error ? reject(error) : resolvePromise(address.port),
      );
    });
  });
}

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolvePromise) => {
    child.once("exit", (code) => resolvePromise(code));
    child.once("error", () => resolvePromise(-1));
  });
}

function delay(milliseconds) {
  return new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds),
  );
}
