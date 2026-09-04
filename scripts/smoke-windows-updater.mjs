import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const launcher = required("--launcher");
const updater = required("--updater");
const scratch = mkdtempSync(path.join(tmpdir(), "netgrid-updater-smoke-"));
const setupBody = Buffer.from("verified NETGRID setup fixture\n");
const setupHash = createHash("sha256").update(setupBody).digest("hex");

const server = createServer((request, response) => {
  const base = `http://127.0.0.1:${server.address().port}`;
  if (request.url?.startsWith("/setup/"))
    return send(response, 200, setupBody, "application/octet-stream");
  if (request.url?.startsWith("/sums/")) {
    const version = request.url.split("/").at(-1);
    return send(response, 200, `${setupHash}  ${setupName(version)}\n`);
  }
  if (request.url?.startsWith("/bad-sums/")) {
    const version = request.url.split("/").at(-1);
    return send(response, 200, `${"0".repeat(64)}  ${setupName(version)}\n`);
  }
  if (request.url?.startsWith("/metadata/")) {
    const version = request.url.split("/").at(-1);
    return json(response, 200, {
      schemaVersion: "netgrid-windows-installer-release-v1",
      product: { installerVersion: version },
      artifacts: [{ name: setupName(version), sha256: setupHash }],
    });
  }
  if (request.url === "/offline")
    return json(response, 503, { error: "offline" });
  const tampered = request.url === "/tampered";
  const releases = [
    release("v1.0.4", true, true, base, false),
    release("v1.0.3", false, true, base, tampered),
    release("v1.0.2", false, false, base, false),
  ];
  return json(response, 200, releases);
});

try {
  await new Promise((resolve, reject) =>
    server.once("error", reject).listen(0, "127.0.0.1", resolve),
  );
  const base = `http://127.0.0.1:${server.address().port}`;
  const stableOutput = path.join(scratch, "stable.json");
  assert(
    (
      await run(launcher, [
        "--check-update-api",
        `${base}/releases`,
        "--check-update-output",
        stableOutput,
        "--current-version",
        "1.0.1",
      ])
    ).code === 0,
    "stable_check_failed",
  );
  const stable = JSON.parse(readFileSync(stableOutput, "utf8"));
  assert(
    stable.Version === "1.0.2" && stable.Prerelease === false,
    "stable_filter_invalid",
  );

  const prereleaseOutput = path.join(scratch, "prerelease.json");
  assert(
    (
      await run(launcher, [
        "--check-update-api",
        `${base}/releases`,
        "--check-update-output",
        prereleaseOutput,
        "--current-version",
        "1.0.1",
        "--allow-prerelease",
      ])
    ).code === 0,
    "prerelease_check_failed",
  );
  const prerelease = JSON.parse(readFileSync(prereleaseOutput, "utf8"));
  assert(
    prerelease.Version === "1.0.3" && prerelease.Prerelease === true,
    "prerelease_filter_invalid",
  );

  const tamperedOutput = path.join(scratch, "tampered.json");
  assert(
    (
      await run(launcher, [
        "--check-update-api",
        `${base}/tampered`,
        "--check-update-output",
        tamperedOutput,
        "--current-version",
        "1.0.1",
        "--allow-prerelease",
      ])
    ).code === 2,
    "tamper_not_rejected",
  );
  assert(
    JSON.parse(readFileSync(tamperedOutput, "utf8")).error ===
      "update_integrity_sources_disagree",
    "tamper_reason_invalid",
  );

  const offlineOutput = path.join(scratch, "offline.json");
  assert(
    (
      await run(launcher, [
        "--check-update-api",
        `${base}/offline`,
        "--check-update-output",
        offlineOutput,
        "--current-version",
        "1.0.1",
      ])
    ).code === 2,
    "offline_not_reported",
  );

  const artifact = path.join(scratch, setupName("1.0.3"));
  writeFileSync(artifact, setupBody);
  assert(
    (await run(updater, ["--verify-artifact", artifact, setupHash])).code === 0,
    "artifact_verification_failed",
  );
  assert(
    (await run(updater, ["--verify-artifact", artifact, "f".repeat(64)]))
      .code === 2,
    "artifact_tamper_not_rejected",
  );
  const auditPath = path.join(scratch, "audit.json");
  assert(
    (await run(updater, ["--audit-contract", auditPath])).code === 0,
    "audit_failed",
  );
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  assert(
    audit.source === "github-releases-only" &&
      audit.stages.includes("program-and-data-rollback") &&
      audit.reverifiesSetupAfterLauncherExit === true &&
      audit.failureState === "safely-stopped",
    "transaction_contract_invalid",
  );
  process.stdout.write(
    "WINDOWS_UPDATER_SMOKE_OK stable=1.0.2 prerelease=1.0.3 tamper=rejected offline=nonfatal-contract rollback=bound\n",
  );
} finally {
  server.close();
  rmSync(scratch, { recursive: true, force: true });
}

function release(tag, draft, prerelease, base, tampered) {
  const version = tag.replace(/^v/, "");
  return {
    tag_name: tag,
    name: `NETGRID ${tag}`,
    body: "Änderungshinweise",
    draft,
    prerelease,
    assets: [
      {
        name: setupName(version),
        browser_download_url: `${base}/setup/${version}`,
      },
      {
        name: "SHA256SUMS.txt",
        browser_download_url: `${base}/${tampered ? "bad-sums" : "sums"}/${version}`,
      },
      {
        name: "release-metadata.json",
        browser_download_url: `${base}/metadata/${version}`,
      },
    ],
  };
}

function setupName(version) {
  return `NETGRID-Setup-${version}-x64.exe`;
}

function send(response, status, body, contentType = "text/plain") {
  response.writeHead(status, { "content-type": contentType });
  response.end(body);
}
function json(response, status, body) {
  send(response, status, JSON.stringify(body), "application/json");
}
function required(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`missing:${name}`);
  return path.resolve(process.argv[index + 1]);
}
function assert(value, code) {
  if (!value) throw new Error(code);
}
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code, stderr }));
  });
}
