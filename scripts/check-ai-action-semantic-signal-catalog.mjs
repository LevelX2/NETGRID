#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const schemaVersion = "action-semantic-signal-catalog-gate-v1";
const generatedAt = "2026-06-12";

const activeHintsPath = "data/ai/ai-card-hints-active.json";
const compiledHintsPath = "data/ai/ai-card-hints-compiled.json";
const inspectorIndexPath = "data/ai/ai-hint-inspector-index.json";
const tacticSignalCatalogPath = "data/ai/tactic-signals-v1.json";
const jsonReportPath =
  "docs/reviews/ai/action-semantic-signal-catalog-2026-06-12.json";
const markdownReportPath =
  "docs/reviews/ai/action-semantic-signal-catalog-2026-06-12.md";

const options = parseArgs(process.argv.slice(2));
const report = buildReport();

if (options.writeReport) writeReports(report);
if (options.check) checkReports(report);
validateReport(report);

console.log(
  [
    `ACTION_SEMANTIC_SIGNAL_CATALOG OK active=${report.summary.activeCards}`,
    `covered=${report.summary.coveredCards}`,
    `deferred=${report.summary.deferredCards}`,
    `target_profile_gaps=${report.summary.targetProfileGapCards}`,
  ].join(" "),
);

function parseArgs(args) {
  const parsed = { check: false, writeReport: false };
  for (const arg of args) {
    if (arg === "--check") {
      parsed.check = true;
      continue;
    }
    if (arg === "--write-report") {
      parsed.writeReport = true;
      continue;
    }
    fail(`Unknown argument: ${arg}`);
  }
  if (!parsed.check && !parsed.writeReport) parsed.check = true;
  return parsed;
}

function buildReport() {
  const activeHints = readJson(activeHintsPath);
  const compiledHints = readJson(compiledHintsPath);
  const inspectorIndex = readJson(inspectorIndexPath);
  const tacticSignalCatalog = readJson(tacticSignalCatalogPath);

  const compiledByCardId = new Map(
    (compiledHints.cards ?? []).map((card) => [card.cardId, card]),
  );
  const inspectorByCardId = new Map(
    (inspectorIndex.cards ?? []).map((card) => [card.cardId, card]),
  );
  const signalById = new Map(
    (tacticSignalCatalog.signals ?? []).map((signal) => [
      signal.signalId,
      signal,
    ]),
  );

  const rows = (activeHints.cards ?? [])
    .map((activeCard) =>
      buildRow({
        activeCard,
        compiledCard: compiledByCardId.get(activeCard.cardId),
        inspectorCard: inspectorByCardId.get(activeCard.cardId),
        signalById,
      }),
    )
    .sort((left, right) => left.cardId.localeCompare(right.cardId));

  return {
    schemaVersion,
    generatedAt,
    source: {
      activeHintsPath,
      compiledHintsPath,
      inspectorIndexPath,
      tacticSignalCatalogPath,
      mode: "diagnostic-only signal catalog report; no runtime input, no action selection, no planner score and no legality effect",
    },
    runtimeConsumerStatus: "none",
    productiveUseAllowed: false,
    noEffectFlags: {
      runtimeBehaviorChanges: false,
      actionSelectionChanges: false,
      legalActionGeneration: false,
      plannerConsumers: false,
      scoringConsumers: false,
      hiddenInfoProjection: false,
    },
    signalPolicy: {
      tacticSignals: "functional_card_utility_only",
      subtypeOnlySignalsAllowed: false,
      targetProfilesAreSignals: false,
    },
    summary: summarizeRows(rows),
    rows,
  };
}

function buildRow({ activeCard, compiledCard, inspectorCard, signalById }) {
  const derivedFunctionSignals = sortedUnique(
    inspectorCard?.derivedFunctionSignals ?? [],
  );
  const activeTacticSignals = sortedUnique(activeCard.tacticSignals ?? []);
  const signalIds = sortedUnique([
    ...derivedFunctionSignals,
    ...activeTacticSignals,
  ]);
  const unknownSignals = signalIds.filter(
    (signalId) => !signalById.has(signalId),
  );
  const structuralOnlySignals = signalIds.filter((signalId) =>
    pureStructuralSignal(signalId, signalIds),
  );
  const targetProfileExpectedBySignals = derivedFunctionSignals.filter(
    (signalId) => signalById.get(signalId)?.targetProfileRelevant === true,
  );
  const targetProfileCount =
    arrayLength(activeCard.targetProfiles) +
    arrayLength(compiledCard?.targetProfiles);
  const warningCategories = sortedUnique(
    inspectorCard?.warningCategories ?? [],
  );
  const deferred =
    warningCategories.includes("deferred_requires_human_review") ||
    activeCard.quality?.needsHumanReview === true;
  const covered =
    derivedFunctionSignals.length > 0 &&
    unknownSignals.length === 0 &&
    structuralOnlySignals.length === 0;
  const targetProfileGap =
    targetProfileExpectedBySignals.length > 0 && targetProfileCount === 0;

  return {
    cardId: activeCard.cardId,
    side: activeCard.side,
    cardType: activeCard.cardType,
    aiSupportStatus: activeCard.aiSupportStatus ?? "unknown",
    covered,
    deferred,
    no_signal_reason: noSignalReason({
      activeCard,
      inspectorCard,
      warningCategories,
      derivedFunctionSignals,
    }),
    target_profile_gap: targetProfileGap,
    signalCount: derivedFunctionSignals.length,
    targetProfileCount,
    derivedFunctionSignals,
    activeTacticSignals,
    unknownSignals,
    structuralOnlySignals,
    targetProfileExpectedBySignals,
    warningCategories,
  };
}

function noSignalReason({
  activeCard,
  inspectorCard,
  warningCategories,
  derivedFunctionSignals,
}) {
  if (derivedFunctionSignals.length > 0) return "none";
  if (!inspectorCard) return "inspector_missing";
  if (warningCategories.includes("legacy_fallback_only"))
    return "legacy_fallback_only";
  if (warningCategories.includes("deferred_requires_human_review"))
    return "deferred_requires_human_review";
  if (activeCard.cardType === "identity") return "identity_no_function_signal";
  if (
    activeCard.aiSupportStatus &&
    activeCard.aiSupportStatus !== "ai_supported"
  ) {
    return "not_ai_supported";
  }
  return "no_function_signal";
}

function summarizeRows(rows) {
  const structuralSignalViolations = rows.filter(
    (row) => row.structuralOnlySignals.length > 0,
  );
  const unknownSignalRows = rows.filter((row) => row.unknownSignals.length > 0);
  return {
    activeCards: rows.length,
    coveredCards: rows.filter((row) => row.covered).length,
    deferredCards: rows.filter((row) => row.deferred).length,
    noSignalCards: rows.filter((row) => row.no_signal_reason !== "none").length,
    targetProfileGapCards: rows.filter((row) => row.target_profile_gap).length,
    structuralSignalViolationCards: structuralSignalViolations.length,
    unknownSignalCards: unknownSignalRows.length,
    byNoSignalReason: countBy(rows, (row) => row.no_signal_reason),
    bySide: countBy(rows, (row) => row.side),
    byCardType: countBy(rows, (row) => row.cardType),
    targetProfileGapCardIds: rows
      .filter((row) => row.target_profile_gap)
      .map((row) => row.cardId),
    structuralSignalViolations: structuralSignalViolations.map((row) => ({
      cardId: row.cardId,
      signals: row.structuralOnlySignals,
    })),
    unknownSignalRows: unknownSignalRows.map((row) => ({
      cardId: row.cardId,
      signals: row.unknownSignals,
    })),
  };
}

function writeReports(reportToWrite) {
  writeText(jsonReportPath, `${JSON.stringify(reportToWrite, null, 2)}\n`);
  writeText(markdownReportPath, renderMarkdownReport(reportToWrite));
  formatWithPrettier([jsonReportPath, markdownReportPath]);
}

function checkReports(expectedReport) {
  const actualReport = readJson(jsonReportPath);
  if (stableJson(actualReport) !== stableJson(expectedReport)) {
    fail(
      `${jsonReportPath} is stale. Run node scripts/check-ai-action-semantic-signal-catalog.mjs --write-report`,
    );
  }
  const markdown = readText(markdownReportPath);
  const markdownLower = markdown.toLowerCase();
  for (const requiredText of [
    "covered",
    "deferred",
    "no_signal_reason",
    "target_profile_gap",
    "keine Runtime-Anbindung",
    "keine Action-Auswahl",
    "kein Scoring",
  ]) {
    if (!markdownLower.includes(requiredText.toLowerCase())) {
      fail(`${markdownReportPath} missing required text: ${requiredText}`);
    }
  }
}

function validateReport(reportToValidate) {
  if (reportToValidate.runtimeConsumerStatus !== "none") {
    fail("runtimeConsumerStatus must be none");
  }
  if (reportToValidate.productiveUseAllowed !== false) {
    fail("productiveUseAllowed must be false");
  }
  for (const [flag, value] of Object.entries(
    reportToValidate.noEffectFlags ?? {},
  )) {
    if (value !== false) fail(`No-effect flag must be false: ${flag}`);
  }
  if (reportToValidate.summary.structuralSignalViolationCards !== 0) {
    fail("subtype/type/name-only tactic signals are not allowed");
  }
  if (reportToValidate.summary.unknownSignalCards !== 0) {
    fail("all derived function signals must be present in tactic-signals-v1");
  }
}

function renderMarkdownReport(reportToRender) {
  const summary = reportToRender.summary;
  const noSignalRows = Object.entries(summary.byNoSignalReason).map(
    ([reason, count]) => `| \`${reason}\` | ${count} |`,
  );
  const targetGapRows = reportToRender.rows
    .filter((row) => row.target_profile_gap)
    .slice(0, 30)
    .map(
      (row) =>
        `| \`${row.cardId}\` | ${row.side} | ${row.cardType} | ${row.targetProfileExpectedBySignals.map((signal) => `\`${signal}\``).join(", ")} |`,
    );

  return [
    "# Action Semantic Signal Catalog Gate 2026-06-12",
    "",
    "Diagnosebericht fuer aktive Karten. Der Bericht nutzt Active Hints, Compiled Hints, den Hint-Inspector-Index und den Tactic-Signal-Katalog.",
    "",
    "Keine Runtime-Anbindung, keine Action-Auswahl, kein Scoring und keine Hidden-Info-Projektion.",
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Active cards | ${summary.activeCards} |`,
    `| covered | ${summary.coveredCards} |`,
    `| deferred | ${summary.deferredCards} |`,
    `| no_signal_reason != none | ${summary.noSignalCards} |`,
    `| target_profile_gap | ${summary.targetProfileGapCards} |`,
    `| structural signal violations | ${summary.structuralSignalViolationCards} |`,
    `| unknown signals | ${summary.unknownSignalCards} |`,
    "",
    "## No Signal Reasons",
    "",
    "| no_signal_reason | Cards |",
    "| --- | ---: |",
    ...noSignalRows,
    "",
    "## Target Profile Gaps",
    "",
    "| Card | Side | Type | Signals expecting targets |",
    "| --- | --- | --- | --- |",
    ...(targetGapRows.length > 0 ? targetGapRows : ["| none | - | - | - |"]),
    "",
    "## Row Contract",
    "",
    "Every JSON row contains `covered`, `deferred`, `no_signal_reason` and `target_profile_gap`.",
    "",
  ].join("\n");
}

function pureStructuralSignal(signal, rowSignals) {
  const normalized = signal.trim().toLowerCase();
  if (normalized.startsWith("breaker.subtype.")) {
    return !rowSignals.some((rowSignal) =>
      rowSignal.toLowerCase().endsWith("_subtype_limited"),
    );
  }
  return (
    /(^|[.:-])(type|subtype|name)[.:-]/.test(normalized) ||
    /(^|[_-])(type|subtype|name)_only([_-]|$)/.test(normalized) ||
    /^(card|own)[_-](type|subtype|name)([_-]|$)/.test(normalized)
  );
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function readText(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function writeText(filePath, contents) {
  const absolutePath = path.join(repoRoot, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

function formatWithPrettier(filePaths) {
  const localCli = path.join(
    repoRoot,
    "node_modules",
    "prettier",
    "bin",
    "prettier.cjs",
  );
  const command = fs.existsSync(localCli) ? process.execPath : "prettier";
  const args = fs.existsSync(localCli)
    ? [localCli, "--write", ...filePaths]
    : ["--write", ...filePaths];
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.status === 0) return;
  if (result.stderr.trim()) console.error(result.stderr.trim());
  fail("prettier failed for signal catalog reports");
}

function countBy(values, keyFor) {
  const counts = {};
  for (const value of values) {
    const key = keyFor(value) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(
      ([leftKey, leftCount], [rightKey, rightCount]) =>
        rightCount - leftCount || leftKey.localeCompare(rightKey),
    ),
  );
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

function sortedUnique(values) {
  return [
    ...new Set(values.filter((value) => typeof value === "string")),
  ].sort();
}

function stableJson(value) {
  return JSON.stringify(value);
}

function fail(message) {
  console.error(`ACTION_SEMANTIC_SIGNAL_CATALOG failed: ${message}`);
  process.exit(1);
}
