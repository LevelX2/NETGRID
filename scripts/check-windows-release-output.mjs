import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { matchesPattern } from "./check-release-product-boundary.mjs";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsRoot, "..");
const policy = JSON.parse(
  readFileSync(path.join(scriptsRoot, "release-product-boundary.json"), "utf8"),
);

if (process.argv.includes("--self-test")) runSelfTest();
else {
  const artifactRoot = path.resolve(
    repositoryRoot,
    optionValue("--artifact") ?? "output/windows-release",
  );
  const findings = auditArtifact(artifactRoot, policy);
  if (findings.length > 0) {
    process.stderr.write(
      `WINDOWS_RELEASE_OUTPUT_FAIL\n${findings.map((entry) => `- ${entry}`).join("\n")}\n`,
    );
    process.exitCode = 1;
  } else process.stdout.write("WINDOWS_RELEASE_OUTPUT_CHECK_OK\n");
}

export function auditArtifact(root, releasePolicy) {
  const findings = [];
  const entries = collectEntries(root);
  const files = entries.filter((entry) => !entry.directory);
  for (const entry of entries) {
    if (entry.symbolicLink)
      findings.push(`${entry.path}: symbolischer Link ist nicht eigenständig`);
    if (entry.directory) continue;
    if (
      !(releasePolicy.artifactAllowedPatterns ?? []).some((pattern) =>
        matchesPattern(entry.path, pattern),
      )
    )
      findings.push(`${entry.path}: nicht im positiven Artefaktvertrag`);
    const forbidden = (releasePolicy.forbiddenArtifactPatterns ?? []).find(
      (pattern) => matchesPattern(entry.path, pattern),
    );
    if (forbidden)
      findings.push(`${entry.path}: verletzt Artefaktverbot ${forbidden}`);
  }

  const allowedData = new Set(
    releasePolicy.classifications
      .filter((entry) =>
        ["product_runtime", "product_optional"].includes(entry.id),
      )
      .flatMap((entry) => entry.paths ?? [])
      .map((entry) => `app/${entry}`),
  );
  const optionalDataPatterns = releasePolicy.classifications
    .filter((entry) => entry.id === "product_optional")
    .flatMap((entry) => entry.patterns ?? [])
    .map((entry) => `app/${entry}`);
  for (const file of files.filter((entry) =>
    entry.path.startsWith("app/data/"),
  ))
    if (
      !allowedData.has(file.path) &&
      !optionalDataPatterns.some((pattern) =>
        matchesPattern(file.path, pattern),
      )
    )
      findings.push(`${file.path}: Datendatei ist nicht positiv freigegeben`);

  const requiredFiles = [
    "app/apps/web/server.js",
    "app/server.mjs",
    "app/node_modules/sharp/package.json",
    "app/node_modules/@img/sharp-win32-x64/package.json",
    "config/runtime.env.example",
    "product-layout.json",
    "product-manifest.json",
  ];
  const filePaths = new Set(files.map((entry) => entry.path));
  for (const required of requiredFiles)
    if (!filePaths.has(required))
      findings.push(`${required}: Pflichtdatei fehlt`);

  const manifestPath = path.join(root, "product-manifest.json");
  if (filePaths.has("product-manifest.json")) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.schemaVersion !== "netgrid-product-manifest-v1")
      findings.push("product-manifest.json: unbekannte Schemaversion");
    const expectedByPath = new Map(
      manifest.files.map((entry) => [entry.path, entry]),
    );
    const actual = files.filter(
      (entry) => entry.path !== "product-manifest.json",
    );
    if (
      expectedByPath.size !== actual.length ||
      actual.some((entry) => {
        const expected = expectedByPath.get(entry.path);
        return (
          !expected ||
          expected.bytes !== entry.bytes ||
          expected.sha256 !== sha256(entry.absolute)
        );
      })
    )
      findings.push("product-manifest.json: Inventar oder Hashes weichen ab");
  }

  const runtimeExample = path.join(root, "config", "runtime.env.example");
  if (filePaths.has("config/runtime.env.example")) {
    const source = readFileSync(runtimeExample, "utf8");
    if (!source.includes("NETGRID_RUNTIME_PROFILE=release"))
      findings.push("runtime.env.example: Releaseprofil fehlt");
    if (!source.includes("NETGRID_DATA_ROOT="))
      findings.push("runtime.env.example: externer Datenroot fehlt");
  }
  return findings;
}

function collectEntries(root) {
  const result = [];
  visit(root);
  return result.sort((left, right) => left.path.localeCompare(right.path));

  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = slash(path.relative(root, absolute));
      const stats = lstatSync(absolute);
      result.push({
        absolute,
        path: relative,
        directory: stats.isDirectory(),
        symbolicLink: stats.isSymbolicLink(),
        bytes: stats.isFile() ? stats.size : undefined,
      });
      if (stats.isDirectory()) visit(absolute);
    }
  }
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function runSelfTest() {
  const root = mkdtempSync(path.join(tmpdir(), "netgrid-release-audit-"));
  try {
    const minimalFiles = {
      "app/apps/web/server.js": "web\n",
      "app/server.mjs": "server\n",
      "app/node_modules/sharp/package.json": "{}\n",
      "app/node_modules/@img/sharp-win32-x64/package.json": "{}\n",
      "config/runtime.env.example":
        "NETGRID_RUNTIME_PROFILE=release\nNETGRID_DATA_ROOT=C:\\\\ProgramData\\\\NETGRID\n",
      "product-layout.json": "{}\n",
    };
    for (const [relative, content] of Object.entries(minimalFiles)) {
      const target = path.join(root, relative);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, content, "utf8");
    }
    const files = Object.keys(minimalFiles)
      .sort((left, right) => left.localeCompare(right))
      .map((relative) => {
        const absolute = path.join(root, relative);
        return {
          path: relative,
          bytes: readFileSync(absolute).byteLength,
          sha256: sha256(absolute),
        };
      });
    writeFileSync(
      path.join(root, "product-manifest.json"),
      JSON.stringify({
        schemaVersion: "netgrid-product-manifest-v1",
        hashAlgorithm: "sha256",
        files,
      }),
      "utf8",
    );
    if (auditArtifact(root, policy).length !== 0)
      throw new Error("release_output_selftest_positive_failed");
    const forbidden = path.join(root, "app", "data", "runtime", "test.sqlite");
    mkdirSync(path.dirname(forbidden), { recursive: true });
    writeFileSync(forbidden, "sqlite", "utf8");
    if (auditArtifact(root, policy).length === 0)
      throw new Error("release_output_selftest_negative_failed");
    process.stdout.write("WINDOWS_RELEASE_OUTPUT_SELFTEST_OK\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function slash(value) {
  return value.replaceAll(path.sep, "/");
}
