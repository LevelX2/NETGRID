import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptsRoot, "..");
const policyPath = resolve(scriptsRoot, "release-product-boundary.json");

export function normalizePath(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}

export function wildcardPattern(pattern) {
  const normalized = normalizePath(pattern);
  let expression = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const next = normalized[index + 1];
    if (character === "*" && next === "*") {
      expression += ".*";
      index += 1;
    } else if (character === "*") {
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${expression}$`);
}

export function matchesPattern(file, pattern) {
  return wildcardPattern(pattern).test(normalizePath(file));
}

export function classifyPath(file, policy) {
  const normalized = normalizePath(file);
  for (const classification of policy.classifications) {
    if ((classification.paths ?? []).includes(normalized)) {
      return classification.id;
    }
  }
  for (const classification of policy.classifications) {
    if (
      (classification.patterns ?? []).some((pattern) =>
        matchesPattern(normalized, pattern),
      )
    ) {
      return classification.id;
    }
  }
  return undefined;
}

export function auditTrackedFiles(files, policy) {
  const findings = [];
  const counts = new Map();

  for (const file of files.map(normalizePath)) {
    const trackedException = (policy.allowedTrackedExceptions ?? []).includes(
      file,
    );
    const forbidden = trackedException
      ? undefined
      : policy.forbiddenTrackedPatterns.find((pattern) =>
          matchesPattern(file, pattern),
        );
    if (forbidden) {
      findings.push(`${file}: versionierte Datei verletzt ${forbidden}`);
    }

    if (file.startsWith("data/")) {
      const classification = classifyPath(file, policy);
      if (!classification) {
        findings.push(`${file}: keine Releaseklassifikation`);
      } else {
        counts.set(classification, (counts.get(classification) ?? 0) + 1);
      }
    }
  }

  return {
    findings,
    counts: Object.fromEntries([...counts.entries()].sort()),
  };
}

function loadPolicy() {
  const policy = JSON.parse(readFileSync(policyPath, "utf8"));
  if (policy.schemaVersion !== "netgrid-release-product-boundary-v1") {
    throw new Error("Unbekannte Releasegrenzen-Schemaversion.");
  }
  return policy;
}

function trackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  return output.split("\0").filter(Boolean);
}

function runSelfTest() {
  const policy = loadPolicy();
  const expected = new Map([
    ["data/ai/card-set-ai-readiness-v1.json", "product_runtime"],
    ["data/scenarios/ai-vs-ai-smoke-replay.json", "development_gate"],
    ["data/local/example.json", "local_runtime"],
    ["data/local-assets/private/source.png", "private_asset"],
  ]);

  for (const [file, classification] of expected) {
    const actual = classifyPath(file, policy);
    if (actual !== classification) {
      throw new Error(
        `Selftest: ${file} wurde als ${actual ?? "unbekannt"} statt ${classification} klassifiziert.`,
      );
    }
  }

  const negative = auditTrackedFiles(
    ["data/runtime/multiplayer/netgrid.sqlite", "data/unknown/file.json"],
    policy,
  );
  if (negative.findings.length !== 2) {
    throw new Error(
      `Selftest: zwei Findings erwartet, ${negative.findings.length} erhalten.`,
    );
  }

  process.stdout.write("RELEASE_PRODUCT_BOUNDARY_SELFTEST_OK\n");
}

function runAudit() {
  const policy = loadPolicy();
  const result = auditTrackedFiles(trackedFiles(), policy);
  if (result.findings.length > 0) {
    process.stderr.write(`${result.findings.join("\n")}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `RELEASE_PRODUCT_BOUNDARY_OK ${JSON.stringify(result.counts)}\n`,
  );
}

if (process.argv.includes("--self-test")) runSelfTest();
else runAudit();
