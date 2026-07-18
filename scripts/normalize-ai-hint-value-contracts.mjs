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
const RUNTIME_VALUE_KEYS = new Set([
  "damage",
  "economy",
  "installCreditGain",
  "leavePlayPayCost",
  "remoteRootValue",
  "startOfTurnCreditLoss",
]);

function parseArgs(argv) {
  const mode = argv.includes("--write") ? "write" : "check";
  for (const arg of argv) {
    if (arg !== "--write" && arg !== "--check") {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return mode;
}

function finiteValues(valueHints) {
  return Object.values(valueHints ?? {}).filter(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
}

function normalizedValueHints(card) {
  const current = card.valueHints ?? {};
  const next = Object.fromEntries(
    Object.entries(current).filter(([key, value]) =>
      RUNTIME_VALUE_KEYS.has(key) &&
      typeof value === "number" &&
      Number.isFinite(value),
    ),
  );
  if (
    card.side === "corp" &&
    (card.cardType === "asset" || card.cardType === "upgrade")
  ) {
    const values = finiteValues(current);
    if (values.length > 0) {
      next.remoteRootValue = Math.max(0, ...values);
    }
  }
  return Object.fromEntries(
    Object.entries(next).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function formatValueHints(valueHints, newline) {
  const entries = Object.entries(valueHints);
  if (entries.length === 0) return "{}";
  return [
    "{",
    ...entries.map(
      ([key, value], index) =>
        `        ${JSON.stringify(key)}: ${JSON.stringify(value)}${
          index < entries.length - 1 ? "," : ""
        }`,
    ),
    "      }",
  ].join(newline);
}

function normalize(original, data) {
  let removedAssignmentCount = 0;
  let migratedRemoteRootCount = 0;
  let changedCardCount = 0;
  const cardsWithValueHints = (data.cards ?? []).filter(
    (card) => card.valueHints !== undefined,
  );
  const normalizedByCard = cardsWithValueHints.map((card) => {
    const before = card.valueHints;
    const after = normalizedValueHints(card);
    removedAssignmentCount += Object.keys(before).filter(
      (key) => !RUNTIME_VALUE_KEYS.has(key),
    ).length;
    if (
      after.remoteRootValue !== undefined &&
      before.remoteRootValue !== after.remoteRootValue
    ) {
      migratedRemoteRootCount += 1;
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) changedCardCount += 1;
    return after;
  });
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  let valueHintIndex = 0;
  const text = original.replace(
    /      "valueHints": (?:\{\}|\{\r?\n(?:        [^\r\n]+\r?\n)*?      \}),/g,
    () => {
      const valueHints = normalizedByCard[valueHintIndex];
      valueHintIndex += 1;
      return `      "valueHints": ${formatValueHints(valueHints, newline)},`;
    },
  );
  if (valueHintIndex !== normalizedByCard.length) {
    throw new Error(
      `Expected ${normalizedByCard.length} valueHints blocks, normalized ${valueHintIndex}.`,
    );
  }
  return {
    text,
    summary: {
      changedCardCount,
      removedAssignmentCount,
      migratedRemoteRootCount,
    },
  };
}

const mode = parseArgs(process.argv.slice(2));
const original = fs.readFileSync(ACTIVE_HINTS_PATH, "utf8");
const data = JSON.parse(original);
const { text: normalized, summary } = normalize(original, data);

if (mode === "write") {
  fs.writeFileSync(ACTIVE_HINTS_PATH, normalized, "utf8");
} else if (original !== normalized) {
  console.error(JSON.stringify({ status: "fail", ...summary }, null, 2));
  process.exitCode = 1;
}

console.log(JSON.stringify({ status: "pass", mode, ...summary }, null, 2));
