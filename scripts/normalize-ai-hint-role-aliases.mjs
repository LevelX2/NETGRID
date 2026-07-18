#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ACTIVE_HINTS_PATH = path.join(
  REPO_ROOT,
  "data/ai/ai-card-hints-active.json",
);
const ROLE_ALIASES = new Map([
  ["barrier_breaker", "breaker_fracter"],
  ["code_gate_breaker", "breaker_decoder"],
  ["hq_run", "hq_pressure"],
  ["rd_run", "rd_pressure"],
  ["sentry_breaker", "breaker_killer"],
  ["tag_remove", "tag_removal"],
  ["wall_breaker", "breaker_fracter"],
]);
const PLAN_ROLE_ALIASES = new Map([["remove_tags", "clear_tags"]]);

function parseMode(argv) {
  if (argv.length !== 1 || !["--check", "--write"].includes(argv[0])) {
    throw new Error("Use --check or --write.");
  }
  return argv[0].slice(2);
}

function normalized(values, aliases) {
  return [...new Set(values.map((value) => aliases.get(value) ?? value))];
}

function formatArray(values, original, newline) {
  const compact = JSON.stringify(values);
  if (!original.includes("\n") && compact.length <= 88) return compact;
  return JSON.stringify(values, null, 2).replace(/\n/g, `${newline}      `);
}

const mode = parseMode(process.argv.slice(2));
const original = fs.readFileSync(ACTIVE_HINTS_PATH, "utf8");
const data = JSON.parse(original);
const fields = (data.cards ?? []).flatMap((card) => [
  { field: "roles", values: normalized(card.roles ?? [], ROLE_ALIASES) },
  {
    field: "planRoles",
    values: normalized(card.planRoles ?? [], PLAN_ROLE_ALIASES),
  },
]);
const newline = original.includes("\r\n") ? "\r\n" : "\n";
let fieldIndex = 0;
let changedFieldCount = 0;
const output = original.replace(
  /      "(roles|planRoles)": (\[(?:[^\]\r\n]|\r?\n)*?\]),/g,
  (match, field, arrayText) => {
    const expected = fields[fieldIndex];
    fieldIndex += 1;
    if (!expected || expected.field !== field) {
      throw new Error(`Unexpected ${field} field at index ${fieldIndex - 1}.`);
    }
    const current = JSON.parse(arrayText);
    if (JSON.stringify(current) === JSON.stringify(expected.values)) return match;
    changedFieldCount += 1;
    return `      "${field}": ${formatArray(expected.values, arrayText, newline)},`;
  },
);
if (fieldIndex !== fields.length) {
  throw new Error(`Expected ${fields.length} role fields, normalized ${fieldIndex}.`);
}

if (mode === "write") {
  fs.writeFileSync(ACTIVE_HINTS_PATH, output, "utf8");
} else if (output !== original) {
  console.error("AI hint role aliases are stale.");
  process.exitCode = 1;
}
console.log(JSON.stringify({ status: "pass", mode, changedFieldCount }));
