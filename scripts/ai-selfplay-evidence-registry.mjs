#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  allocateRegistryId,
  backupEvidenceRegistry,
  exportEvidenceSnapshot,
  importLegacyArtifacts,
  importPairingBundle,
  openEvidenceRegistry,
  recordReport,
  registerJob,
  registryStatus,
  resolveDefaultEvidenceDatabasePath,
} from "./lib/ai-selfplay-evidence-registry.mjs";

function options(args) {
  const result = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function required(opts, key) {
  if (typeof opts[key] !== "string" || opts[key].length === 0) {
    throw new Error(`--${key} is required`);
  }
  return opts[key];
}

function help() {
  return `NETGRID AI selfplay evidence registry

Usage:
  node scripts/ai-selfplay-evidence-registry.mjs init [--db PATH]
  node scripts/ai-selfplay-evidence-registry.mjs status [--db PATH] [--json]
  node scripts/ai-selfplay-evidence-registry.mjs register-job --job-id ID [--worktree PATH] [--branch NAME] [--db PATH]
  node scripts/ai-selfplay-evidence-registry.mjs allocate --kind pairing|case --job-id ID [--db PATH]
  node scripts/ai-selfplay-evidence-registry.mjs upsert --input pairing.json [--db PATH]
  node scripts/ai-selfplay-evidence-registry.mjs record-report --input report.json [--db PATH]
  node scripts/ai-selfplay-evidence-registry.mjs backup --output FILE [--db PATH]
  node scripts/ai-selfplay-evidence-registry.mjs import-legacy --reviews-dir DIR --matrix FILE [--reporting-state FILE] [--reports-dir DIR] [--db PATH]
  node scripts/ai-selfplay-evidence-registry.mjs export [--pairings 031,032] [--output FILE] [--db PATH]

The default database is the primary checkout's ignored
data/local/ai-selfplay-evidence.sqlite. Override it with --db or
NETGRID_SELFPLAY_EVIDENCE_DB.`;
}

const opts = options(process.argv.slice(2));
const command = opts._[0];
if (!command || command === "help" || opts.help) {
  console.log(help());
  process.exit(0);
}

const databasePath = resolve(opts.db || resolveDefaultEvidenceDatabasePath());
const { db } = openEvidenceRegistry(databasePath);
try {
  if (command === "init") {
    console.log(
      JSON.stringify({ databasePath, ...registryStatus(db) }, null, 2),
    );
  } else if (command === "status") {
    const status = { databasePath, ...registryStatus(db) };
    console.log(
      opts.json
        ? JSON.stringify(status, null, 2)
        : Object.entries(status)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n"),
    );
  } else if (command === "register-job") {
    registerJob(db, {
      jobId: required(opts, "job-id"),
      worktreePath: opts.worktree,
      branchName: opts.branch,
    });
    console.log(JSON.stringify({ registered: opts["job-id"], databasePath }));
  } else if (command === "allocate") {
    const id = allocateRegistryId(
      db,
      required(opts, "kind"),
      required(opts, "job-id"),
    );
    console.log(JSON.stringify({ kind: opts.kind, id, databasePath }));
  } else if (command === "upsert") {
    const inputPath = resolve(required(opts, "input"));
    const pairingId = importPairingBundle(
      db,
      JSON.parse(readFileSync(inputPath, "utf8")),
    );
    console.log(
      JSON.stringify(
        { pairingId, databasePath, status: registryStatus(db) },
        null,
        2,
      ),
    );
  } else if (command === "record-report") {
    const inputPath = resolve(required(opts, "input"));
    const input = JSON.parse(readFileSync(inputPath, "utf8"));
    if (input.htmlPath && !input.htmlBody) {
      input.htmlBody = readFileSync(resolve(input.htmlPath), "utf8");
      input.outputPath ??= resolve(input.htmlPath);
    }
    const reportId = recordReport(db, input);
    console.log(
      JSON.stringify(
        { reportId, databasePath, status: registryStatus(db) },
        null,
        2,
      ),
    );
  } else if (command === "backup") {
    const outputPath = await backupEvidenceRegistry(
      db,
      resolve(required(opts, "output")),
    );
    console.log(JSON.stringify({ databasePath, outputPath }));
  } else if (command === "import-legacy") {
    const result = importLegacyArtifacts(db, {
      reviewsDir: resolve(required(opts, "reviews-dir")),
      matrixPath: resolve(required(opts, "matrix")),
      reportingStatePath: opts["reporting-state"]
        ? resolve(opts["reporting-state"])
        : null,
      reportsDir: opts["reports-dir"] ? resolve(opts["reports-dir"]) : null,
    });
    console.log(
      JSON.stringify(
        { databasePath, imported: result, status: registryStatus(db) },
        null,
        2,
      ),
    );
  } else if (command === "export") {
    const pairingIds =
      typeof opts.pairings === "string"
        ? opts.pairings
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
    const output = JSON.stringify(
      exportEvidenceSnapshot(db, pairingIds),
      null,
      2,
    );
    if (opts.output) {
      const outputPath = resolve(opts.output);
      writeFileSync(outputPath, `${output}\n`, "utf8");
      console.log(JSON.stringify({ databasePath, outputPath, pairingIds }));
    } else console.log(output);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} finally {
  db.close();
}
