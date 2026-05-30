#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildDerivedFactsReport } from "./check-ai-derived-facts.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const PILOT_INVENTORY_PATH =
  "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json";
const FULL_INVENTORY_PATH =
  "data/ai/ai-derived-basic-facts-full-cards-2026-05-25.json";
const FULL_REPORT_PATH =
  "docs/reviews/ai/aufgabe-042-full-compiled-hint-coverage-report-2026-05-25.json";
const IMPLEMENTATION_ROOTS = [
  {
    setId: "originalset-v1",
    cardIdPrefix: "onr_v1_",
    path: "packages/engine/src/card-implementations/onr-v1",
  },
  {
    setId: "proteus",
    cardIdPrefix: "onr_proteus_",
    path: "packages/engine/src/card-implementations/proteus",
  },
];
const OVERLAY_ROOT = "data/ai/hints/overlays";
const GENERATED_AT = "2026-05-25";
const EXPECTED_ACTIVE_HINT_COUNT = 564;

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), stableStringify(value), "utf8");
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function toRepoRelative(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath).replaceAll(path.sep, "/");
}

function listFiles(absoluteDir, predicate) {
  if (!fs.existsSync(absoluteDir)) return [];
  return fs
    .readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(absoluteDir, entry.name);
      if (entry.isDirectory()) return listFiles(absolutePath, predicate);
      return entry.isFile() && predicate(absolutePath) ? [absolutePath] : [];
    })
    .sort((left, right) =>
      toRepoRelative(left).localeCompare(toRepoRelative(right)),
    );
}

function implementationPathByCardId() {
  const byCardId = new Map();
  for (const root of IMPLEMENTATION_ROOTS) {
    for (const absolutePath of listFiles(repoPath(root.path), (file) =>
      file.endsWith(".ts"),
    )) {
      const text = fs.readFileSync(absolutePath, "utf8");
      const match = text.match(/cardDefinitionId:\s*"([^"]+)"/);
      if (!match) continue;
      byCardId.set(match[1], toRepoRelative(absolutePath));
    }
  }
  return byCardId;
}

function overlayCardIds() {
  const ids = new Set();
  for (const absolutePath of listFiles(repoPath(OVERLAY_ROOT), (file) =>
    file.endsWith(".json"),
  )) {
    const overlayFile = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    for (const entry of overlayFile.cards ?? []) ids.add(entry.cardId);
  }
  return ids;
}

function titleFromHint(hint) {
  if (typeof hint.title === "string" && hint.title.length > 0) {
    return hint.title;
  }
  return hint.cardId
    .replace(/^onr_v1_\d+_/, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function expectedKindsByCardId() {
  if (!fs.existsSync(repoPath(PILOT_INVENTORY_PATH))) return new Map();
  return new Map(
    (readJson(PILOT_INVENTORY_PATH).cards ?? []).map((card) => [
      card.cardId,
      {
        expectedDerivableKinds: card.expectedDerivableKinds ?? [],
        expectedManualOverlayNeeded: Boolean(card.expectedManualOverlayNeeded),
        rationale: card.rationale,
      },
    ]),
  );
}

export function buildFullCoverageInventory() {
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const implementations = implementationPathByCardId();
  const expectedByCard = expectedKindsByCardId();
  const cards = activeHints.map((hint) => {
    const expected = expectedByCard.get(hint.cardId);
    const implementationPath =
      implementations.get(hint.cardId) ??
      `${implementationFallbackRoot(hint.cardId)}/__missing__/${hint.cardId}.ts`;
    return {
      cardId: hint.cardId,
      title: titleFromHint(hint),
      side: hint.side,
      cardType: hint.cardType,
      implementationPath,
      implementationFound: Boolean(implementationPath),
      fullCoverageScope: true,
      expectedDerivableKinds: expected?.expectedDerivableKinds ?? [],
      expectedManualOverlayNeeded:
        expected?.expectedManualOverlayNeeded ??
        Boolean(hint.quality?.needsHumanReview),
      coverageClass: implementationPath
        ? "legacy_fallback_only"
        : "blocked_missing_implementation",
      rationale:
        expected?.rationale ??
        "Full-coverage inventory entry generated from active AI hint and CardImplementation scan; final coverage class is assigned by the Aufgabe 042 full gate.",
    };
  });
  return {
    schemaVersion: "ai-derived-basic-facts-full-cards-v1",
    taskId: "Aufgabe 042",
    generatedAt: GENERATED_AT,
    source: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      implementationRoots: IMPLEMENTATION_ROOTS.map((root) => root.path),
      pilotInventoryPath: PILOT_INVENTORY_PATH,
      mode: "all active AI-supported hints; read-only CardImplementation scan; no LegalAction or runtime legality derivation",
    },
    cards,
  };
}

function implementationFallbackRoot(cardId) {
  return (
    IMPLEMENTATION_ROOTS.find((root) => cardId.startsWith(root.cardIdPrefix))
      ?.path ?? IMPLEMENTATION_ROOTS[0].path
  );
}

function derivedKindSet(derivedFacts = {}) {
  return new Set([
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
    ...(derivedFacts.breakerProfile?.coverage ?? []).map(
      (coverage) => `breakerCoverage:${coverage}`,
    ),
    ...(derivedFacts.breakerProfile?.sideEffects ?? []).map(
      (sideEffect) => `breakerSideEffect:${sideEffect}`,
    ),
    ...(derivedFacts.remoteRole
      ? [`remoteRole:${derivedFacts.remoteRole.kind}`]
      : []),
    ...(derivedFacts.targetProfiles?.length ? ["targetProfiles"] : []),
  ]);
}

function classifyCard(card, overlayIds) {
  if (!card.implementationFound) return "blocked_missing_implementation";
  const derivedKinds = derivedKindSet(card.derivedFacts);
  if (derivedKinds.size === 0) {
    return overlayIds.has(card.cardId)
      ? "manual_overlay_required"
      : "legacy_fallback_only";
  }
  if (overlayIds.has(card.cardId)) return "generated_plus_overlay";
  if ((card.descriptorGaps ?? []).length > 0) return "descriptor_or_schema_gap";
  if ((card.missingManualOverlay ?? []).length > 0) {
    return "manual_overlay_required";
  }
  return "generated_mechanical_clean";
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildWarnings(cards) {
  return cards.flatMap((card) => {
    const warnings = [];
    if (card.coverageClass === "legacy_fallback_only") {
      warnings.push({
        kind: "legacy_fallback_only",
        cardId: card.cardId,
        message:
          "No structured mechanical fact was derived in the current full-coverage scope; active legacy hint remains the runtime fallback.",
      });
    }
    if (card.coverageClass === "manual_overlay_required") {
      warnings.push({
        kind: "manual_overlay_required",
        cardId: card.cardId,
        message:
          "Card needs strategic/manual overlay context beyond generated mechanical facts.",
      });
    }
    if (card.coverageClass === "descriptor_or_schema_gap") {
      warnings.push({
        kind: "descriptor_or_schema_gap",
        cardId: card.cardId,
        message:
          "Implementation produced facts, but descriptor/schema comparison still has gaps.",
      });
    }
    if (
      (card.warnings ?? []).some(
        (warning) => warning.kind === "text_pattern_derivation",
      )
    ) {
      warnings.push({
        kind: "text_pattern_derivation",
        cardId: card.cardId,
        message:
          "Derived facts use read-only text/descriptor pattern scans rather than imported TS descriptors.",
      });
    }
    for (const item of card.overlap?.generatedOnly ?? []) {
      warnings.push({
        kind: "generated_fact_absent_from_active_monolith",
        cardId: card.cardId,
        message: `Generated ${item} is absent from the active monolith.`,
      });
    }
    for (const item of card.overlap?.manualOnly ?? []) {
      warnings.push({
        kind: "monolith_mechanical_duplication_candidate",
        cardId: card.cardId,
        message: `Active monolith has ${item} that the current deriver does not reproduce.`,
      });
    }
    return warnings;
  });
}

export function buildFullCoverageReport() {
  const inventory = buildFullCoverageInventory();
  const committedInventoryPath = repoPath(FULL_INVENTORY_PATH);
  const inventoryForDeriver = fs.existsSync(committedInventoryPath)
    ? readJson(FULL_INVENTORY_PATH)
    : inventory;
  if (!fs.existsSync(committedInventoryPath)) {
    writeJson(FULL_INVENTORY_PATH, inventory);
  }
  const derived = buildDerivedFactsReport({
    pilotCardsPath: FULL_INVENTORY_PATH,
    allowMissingImplementation: true,
  });
  const overlays = overlayCardIds();
  const cards = (derived.cards ?? []).map((card) => ({
    ...card,
    fullCoverageScope: true,
    coverageClass: classifyCard(card, overlays),
    expectedDerivableKinds:
      inventoryForDeriver.cards.find((entry) => entry.cardId === card.cardId)
        ?.expectedDerivableKinds ?? [],
    expectedManualOverlayNeeded:
      inventoryForDeriver.cards.find((entry) => entry.cardId === card.cardId)
        ?.expectedManualOverlayNeeded ?? false,
  }));
  const hardErrors = [...(derived.hardErrors ?? [])];
  const activeCount = inventory.cards.length;
  if (activeCount !== EXPECTED_ACTIVE_HINT_COUNT) {
    hardErrors.push({
      kind: "active_hint_count_mismatch",
      message: `Expected ${EXPECTED_ACTIVE_HINT_COUNT} active hints, got ${activeCount}.`,
    });
  }
  if (stableStringify(inventory) !== stableStringify(inventoryForDeriver)) {
    hardErrors.push({
      kind: "stale_full_coverage_inventory",
      message: `Generated inventory differs from ${FULL_INVENTORY_PATH}. Run corepack pnpm check:ai-derived-facts-full --write.`,
    });
  }
  for (const card of cards) {
    if (
      !card.implementationFound &&
      card.coverageClass === "generated_mechanical_clean"
    ) {
      hardErrors.push({
        kind: "missing_implementation_generated_clean",
        cardId: card.cardId,
        message:
          "CardImplementation is absent but card was classified as generated_mechanical_clean.",
      });
    }
  }
  const warnings = buildWarnings(cards).sort(compareIssues);
  const generatedFactCards = cards.filter(
    (card) => derivedKindSet(card.derivedFacts).size > 0,
  );
  return {
    schemaVersion: "aufgabe-042-full-compiled-hint-coverage-report-v1",
    taskId: "Aufgabe 042",
    generatedAt: GENERATED_AT,
    source: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      fullInventoryPath: FULL_INVENTORY_PATH,
      manualOverlayRoot: OVERLAY_ROOT,
      derivationMode:
        "read-only CardImplementation text/descriptor scan over all active AI-supported hints; no runtime legality, LegalAction, hidden-zone identity, or profile/default changes",
    },
    activeHintCount: activeCount,
    compiledTargetHintCount: activeCount,
    implementationFoundCount: cards.filter((card) => card.implementationFound)
      .length,
    generatedFactsCardCount: generatedFactCards.length,
    manualOverlayCardCount: overlays.size,
    legacyFallbackOnlyCount: cards.filter(
      (card) => card.coverageClass === "legacy_fallback_only",
    ).length,
    descriptorOrSchemaGapCount: cards.filter(
      (card) => card.coverageClass === "descriptor_or_schema_gap",
    ).length,
    manualOverlayRequiredCount: cards.filter(
      (card) => card.coverageClass === "manual_overlay_required",
    ).length,
    blockedMissingImplementationCount: cards.filter(
      (card) => card.coverageClass === "blocked_missing_implementation",
    ).length,
    coverageClassCounts: countBy(cards, (card) => card.coverageClass),
    coverageBySideCardType: countBy(
      cards,
      (card) =>
        `${card.manualOntologySummary.side}:${card.manualOntologySummary.cardType}`,
    ),
    effectKindCounts: derived.effectKindCounts,
    conditionKindCounts: derived.conditionKindCounts,
    hardErrorCount: hardErrors.length,
    hardErrors: hardErrors.sort(compareIssues),
    warningCount: warnings.length,
    warnings,
    cards: cards.sort((left, right) => left.cardId.localeCompare(right.cardId)),
  };
}

function compareIssues(left, right) {
  return `${left.cardId ?? ""}:${left.kind ?? ""}:${left.message ?? ""}`.localeCompare(
    `${right.cardId ?? ""}:${right.kind ?? ""}:${right.message ?? ""}`,
  );
}

function parseArgs(argv) {
  const options = { check: false, write: false, json: false };
  for (const arg of argv) {
    if (arg === "--check") options.check = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--json") options.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.check && !options.write && !options.json) options.check = true;
  return options;
}

export function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const inventory = buildFullCoverageInventory();
  if (options.write) writeJson(FULL_INVENTORY_PATH, inventory);
  const report = buildFullCoverageReport();
  const serializedReport = stableStringify(report);
  const serializedInventory = stableStringify(inventory);

  if (options.write) writeJson(FULL_REPORT_PATH, report);
  if (options.check) {
    if (!fs.existsSync(repoPath(FULL_INVENTORY_PATH))) {
      throw new Error(`Full inventory is missing: ${FULL_INVENTORY_PATH}`);
    }
    if (!fs.existsSync(repoPath(FULL_REPORT_PATH))) {
      throw new Error(`Full report is missing: ${FULL_REPORT_PATH}`);
    }
    if (
      fs.readFileSync(repoPath(FULL_INVENTORY_PATH), "utf8") !==
      serializedInventory
    ) {
      throw new Error(
        `Generated full inventory differs from committed ${FULL_INVENTORY_PATH}. Run corepack pnpm check:ai-derived-facts-full --write.`,
      );
    }
    if (
      fs.readFileSync(repoPath(FULL_REPORT_PATH), "utf8") !== serializedReport
    ) {
      throw new Error(
        `Generated full coverage report differs from committed ${FULL_REPORT_PATH}. Run corepack pnpm check:ai-derived-facts-full --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_DERIVED_FACTS_FULL ${report.hardErrorCount === 0 ? "OK" : "FAIL"} active=${report.activeHintCount} implementations=${report.implementationFoundCount} generated=${report.generatedFactsCardCount} overlays=${report.manualOverlayCardCount} fallback=${report.legacyFallbackOnlyCount} errors=${report.hardErrorCount} warnings=${report.warningCount}\n`,
    );
  }
  if (report.hardErrorCount > 0) process.exitCode = 1;
  return { inventory, report, serializedReport };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
