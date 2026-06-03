#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildAiStrategyTaxonomyReport,
  deriveFunctionSignalsFromHint,
} from "./check-ai-strategy-taxonomy.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const GENERATED_AT = "2026-05-31";
const TASK_ID = "AI005";
const SCHEMA_VERSION = "ai-hint-inspector-index-v1";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";
const STRATEGIC_ROLES_PATH = "data/ai/strategic-roles-v1.json";
const FUNCTION_SIGNAL_DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const TACTIC_SIGNAL_CATALOG_PATH = "data/ai/tactic-signals-v1.json";
const MANUAL_OVERLAY_ROOT = "data/ai/hints/overlays";
const INSPECTOR_INDEX_PATH = "data/ai/ai-hint-inspector-index.json";

const MECHANICAL_FACT_FIELDS = [
  "effects",
  "conditions",
  "costProfile",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
];

const FORBIDDEN_OUTPUT_KEYS = [
  "GameState",
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "fullState",
  "stateSnapshots",
  "undoSnapshots",
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
];

export function buildAiHintInspectorIndex(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const activeHints = readJson(repoRoot, ACTIVE_HINTS_PATH);
  const compiledHints = readJson(repoRoot, COMPILED_HINTS_PATH);
  const strategyGoalsData = readJson(repoRoot, STRATEGY_GOALS_PATH);
  const strategicRolesData = readJson(repoRoot, STRATEGIC_ROLES_PATH);
  const functionDerivationData = readJson(repoRoot, FUNCTION_SIGNAL_DERIVATION_PATH);
  const tacticSignalCatalogData = readJson(repoRoot, TACTIC_SIGNAL_CATALOG_PATH);
  const { report, aliasReport } = buildAiStrategyTaxonomyReport({ repoRoot });

  const activeByCardId = new Map((activeHints.cards ?? []).map((hint) => [hint.cardId, hint]));
  const overlayByCardId = readManualOverlays(repoRoot, MANUAL_OVERLAY_ROOT);
  const strategyIds = new Set(
    (strategyGoalsData.strategyGoals ?? []).map((goal) => goal.strategyId).filter(Boolean),
  );
  const strategicRoleIds = new Set(
    (strategicRolesData.strategicRoles ?? []).map((role) => role.roleId).filter(Boolean),
  );
  const roleClassifications = valueClassificationMap(aliasReport.roles ?? []);
  const planRoleClassifications = valueClassificationMap(aliasReport.planRoles ?? []);
  const lineSupportClassifications = valueClassificationMap(aliasReport.lineSupport ?? []);
  const lineSupportTriageByCardId = groupByCardId(report.ai004Triage?.lineSupport?.entries ?? []);
  const wrongSideAnchorsByCardId = groupByCardId(
    report.sideAwareDerivation?.wrongSideAnchorMatches ?? [],
  );
  const descriptorGapTriage = report.ai004Triage?.descriptorGaps ?? [];
  const derivationRules = functionDerivationData.derivationRules ?? [];
  const tacticSignalById = new Map(
    (tacticSignalCatalogData.signals ?? []).map((signal) => [signal.signalId, signal]),
  );

  const cards = (compiledHints.cards ?? [])
    .map((hint) => {
      const activeHint = activeByCardId.get(hint.cardId) ?? {};
      const overlay = overlayByCardId.get(hint.cardId) ?? {};
      const mechanicalFactFields = MECHANICAL_FACT_FIELDS.filter((field) =>
        hasMeaningfulValue(hint[field]),
      );
      const activeMechanicalFactFields = MECHANICAL_FACT_FIELDS.filter((field) =>
        hasMeaningfulValue(activeHint[field]),
      );
      const overlayFields = Object.keys(overlay).sort();
      const generatedFactFields = MECHANICAL_FACT_FIELDS.filter((field) =>
        isCompiledGeneratedField(hint[field], activeHint[field], overlay[field]),
      );
      const functionSignals = deriveFunctionSignalsFromHint(hint, derivationRules);
      const inspectorFunctionSignals = functionSignalsForInspector({
        hint,
        functionSignals,
      });
      const rolesClassification = classifyValues(
        hint.roles ?? [],
        roleClassifications,
      );
      const planRolesClassification = classifyValues(
        hint.planRoles ?? [],
        planRoleClassifications,
      );
      const lineSupportClassification = classifyLineSupportValues(
        hint.lineSupport ?? [],
        lineSupportClassifications,
        lineSupportTriageByCardId.get(hint.cardId) ?? [],
        strategyIds,
      );
      const descriptorGaps = descriptorGapsForCard({
        descriptorGapTriage,
        values: [
          ...(hint.roles ?? []),
          ...(hint.planRoles ?? []),
          ...(hint.lineSupport ?? []),
          ...functionSignals.signals,
          ...functionSignals.anchorStrategyIds,
        ],
      });
      const wrongSideAnchorMatches = wrongSideAnchorsByCardId.get(hint.cardId) ?? [];
      const warningCategories = warningCategoriesForCard({
        hint,
        lineSupportClassification,
        rolesClassification,
        planRolesClassification,
        descriptorGaps,
        wrongSideAnchorMatches,
        mechanicalFactFields,
        generatedFactFields,
        overlayFields,
      });
      const cardLevelStrategyAnchors = strategyAnchorsFromLineSupport({
        lineSupportClassification,
        strategyIds,
      });
      const derivedPossibleStrategyAnchors = functionSignals.anchorStrategyIds;
      const reviewedStrategySupportPairs = reviewedStrategySupportPairsFromLineSupport({
        lineSupportClassification,
        strategyIds,
      });
      const supportingEvidenceOnly = supportingEvidenceOnlyForHint({
        hint,
        functionSignals,
        tacticSignalById,
      });

      return removeUndefined({
        cardId: hint.cardId,
        side: hint.side,
        cardType: hint.cardType,
        supportStatus: {
          aiSupportStatus: hint.aiSupportStatus ?? "none",
          compiledHintFound: true,
          mechanicalFactsFound: mechanicalFactFields.length > 0,
          generatedFactsFound: generatedFactFields.length > 0,
          overlayFields,
          legacyFallbackOnly:
            mechanicalFactFields.length === 0 &&
            generatedFactFields.length === 0 &&
            overlayFields.length === 0,
          warningCount: warningCategories.length,
        },
        derivedFunctionSignals: inspectorFunctionSignals,
        derivedStrategyAnchors: functionSignals.anchorStrategyIds,
        cardLevelStrategyAnchors,
        derivedPossibleStrategyAnchors,
        reviewedStrategySupportPairs,
        supportingEvidenceOnly,
        lineSupportClassification,
        rolesClassification,
        planRolesClassification,
        warningCategories,
        descriptorGaps,
        legacyStatus: {
          rolesPresent: (hint.roles ?? []).length > 0,
          planRolesPresent: (hint.planRoles ?? []).length > 0,
          legacyLineSupportPresent: lineSupportClassification.some(
            (entry) => entry.triageCategory !== "normalized_strategy_id",
          ),
          activeMechanicalFactFields,
          compiledMechanicalFactFields: mechanicalFactFields,
          generatedFactFields,
          overlayFields,
        },
        strategicRoleStatus: {
          values: hint.strategicRole ?? [],
          validValues: (hint.strategicRole ?? []).filter((role) => strategicRoleIds.has(role)),
          unknownValues: (hint.strategicRole ?? []).filter((role) => !strategicRoleIds.has(role)),
        },
      });
    })
    .sort((left, right) => left.cardId.localeCompare(right.cardId));

  const artifact = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    source: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      compiledHintsPath: COMPILED_HINTS_PATH,
      strategyGoalsPath: STRATEGY_GOALS_PATH,
      strategicRolesPath: STRATEGIC_ROLES_PATH,
      functionSignalDerivationPath: FUNCTION_SIGNAL_DERIVATION_PATH,
      tacticSignalCatalogPath: TACTIC_SIGNAL_CATALOG_PATH,
      manualOverlayRoot: MANUAL_OVERLAY_ROOT,
      mode: "read-only card-catalog inspector index; no hint migration, planner effect, LegalAction effect or runtime state input",
    },
    summary: {
      cardCount: cards.length,
      cardsWithMechanicalFacts: cards.filter((card) => card.supportStatus.mechanicalFactsFound).length,
      cardsWithGeneratedFacts: cards.filter((card) => card.supportStatus.generatedFactsFound).length,
      cardsWithOverlays: cards.filter((card) => card.supportStatus.overlayFields.length > 0).length,
      cardsWithFunctionSignals: cards.filter((card) => card.derivedFunctionSignals.length > 0).length,
      cardsWithStrategyAnchors: cards.filter((card) => card.derivedStrategyAnchors.length > 0).length,
      cardsWithWarnings: cards.filter((card) => card.warningCategories.length > 0).length,
      warningCategoryCounts: countWarningCategories(cards),
    },
    cards,
  };

  const forbiddenKeys = findForbiddenKeys(artifact);
  if (forbiddenKeys.length > 0) {
    throw new Error(`AI hint inspector index contains forbidden key(s): ${forbiddenKeys.join(", ")}`);
  }

  return artifact;
}

function classifyValues(values, classificationByValue) {
  return sortedUnique(values).map((value) => {
    const classification = classificationByValue.get(value);
    return {
      value,
      category: classification?.mappingCategory ?? "unknown_unmapped",
      triageCategory: classification?.triageCategory ?? classification?.mappingCategory ?? "unknown_unmapped",
      mapsTo: classification?.mapsTo ?? [],
      rationale: classification?.rationale ?? "No stable AI004 classification exists for this value.",
    };
  });
}

function classifyLineSupportValues(values, classificationByValue, cardTriageEntries, strategyIds) {
  const triageByValue = new Map(cardTriageEntries.map((entry) => [entry.value, entry]));
  return sortedUnique(values).map((value) => {
    const cardTriage = triageByValue.get(value);
    const classification = classificationByValue.get(value);
    return {
      value,
      category:
        cardTriage?.triageCategory === "normalized_strategy_id"
          ? "exact_strategy_goal"
          : classification?.mappingCategory ?? (strategyIds.has(value) ? "exact_strategy_goal" : "unknown_unmapped"),
      triageCategory:
        cardTriage?.triageCategory ??
        classification?.triageCategory ??
        (strategyIds.has(value) ? "normalized_strategy_id" : "unknown_unmapped"),
      mapsTo:
        cardTriage?.mapsTo ??
        classification?.mapsTo ??
        (strategyIds.has(value) ? [value] : []),
      rationale:
        cardTriage?.rationale ??
        classification?.rationale ??
        "No stable AI004 lineSupport classification exists for this value.",
    };
  });
}

function descriptorGapsForCard({ descriptorGapTriage, values }) {
  const valueSet = new Set(values);
  return descriptorGapTriage
    .filter((gap) => (gap.affectedSignalsOrValues ?? []).some((value) => valueSet.has(value)))
    .map((gap) => ({
      gapId: gap.gapId,
      description: gap.description,
      affectedSignalsOrValues: gap.affectedSignalsOrValues ?? [],
      batchMigrationDecision: gap.batchMigrationDecision,
      needsSchemaOrDescriptorExtension: gap.needsSchemaOrDescriptorExtension === true,
    }));
}

function strategyAnchorsFromLineSupport({ lineSupportClassification, strategyIds }) {
  return sortedUnique(
    lineSupportClassification.flatMap((entry) =>
      (entry.mapsTo ?? []).filter((strategyId) => strategyIds.has(strategyId)),
    ),
  );
}

function reviewedStrategySupportPairsFromLineSupport({
  lineSupportClassification,
  strategyIds,
}) {
  return lineSupportClassification
    .flatMap((entry) =>
      (entry.mapsTo ?? [])
        .filter((strategyId) => strategyIds.has(strategyId))
        .map((strategyId) => ({
          strategyId,
          sourceField: "lineSupport",
          sourceValue: entry.value,
          triageCategory: entry.triageCategory,
          rationale: entry.rationale,
        })),
    )
    .sort(
      (left, right) =>
        left.strategyId.localeCompare(right.strategyId) ||
        left.sourceValue.localeCompare(right.sourceValue),
    );
}

function functionSignalsForInspector({ hint, functionSignals }) {
  const derivedSignals = functionSignals.signals ?? [];
  if (hint.side !== "corp" || hint.cardType !== "agenda") return derivedSignals;
  return sortedUnique([
    ...derivedSignals,
    ...(hint.tacticSignals ?? []),
  ]);
}

function supportingEvidenceOnlyForHint({ hint, functionSignals, tacticSignalById }) {
  const signalIds = sortedUnique([
    ...(hint.tacticSignals ?? []),
    ...(functionSignals.signals ?? []),
  ]);
  return signalIds.filter((signalId) => {
    const signal = tacticSignalById.get(signalId);
    if (!signal) return false;
    return (
      signal.supportOnly === true ||
      signal.mayAnchorStrategy === false ||
      (signal.allowedStrategyAnchors ?? []).length === 0 ||
      signal.legacy === true ||
      signal.aggregation === true ||
      signal.notForDirectScoring === true
    );
  });
}

function warningCategoriesForCard({
  hint,
  lineSupportClassification,
  rolesClassification,
  planRolesClassification,
  descriptorGaps,
  wrongSideAnchorMatches,
  mechanicalFactFields,
  generatedFactFields,
  overlayFields,
}) {
  const warnings = [];
  const allClassifications = [
    ...lineSupportClassification,
    ...rolesClassification,
    ...planRolesClassification,
  ];
  if (
    lineSupportClassification.some(
      (entry) => entry.triageCategory !== "normalized_strategy_id",
    )
  ) {
    warnings.push("legacy_lineSupport");
  }
  if (allClassifications.some((entry) => entry.category === "unknown_unmapped")) {
    warnings.push("unknown_unmapped");
  }
  if (allClassifications.some((entry) => entry.category === "descriptor_gap")) {
    warnings.push("descriptor_gap");
  }
  if (descriptorGaps.length > 0) warnings.push("function_signal_descriptor_gap");
  if (
    hint.quality?.needsHumanReview === true ||
    allClassifications.some((entry) => entry.category === "deferred_requires_human_review")
  ) {
    warnings.push("deferred_requires_human_review");
  }
  if (wrongSideAnchorMatches.length > 0) warnings.push("wrong_side_anchor");
  if (mechanicalFactFields.length === 0 && generatedFactFields.length === 0 && overlayFields.length === 0) {
    warnings.push("legacy_fallback_only");
  }
  return sortedUnique(warnings);
}

function readManualOverlays(repoRoot, rootPath) {
  const absoluteRoot = path.join(repoRoot, rootPath);
  const overlays = new Map();
  if (!fs.existsSync(absoluteRoot)) return overlays;
  for (const filePath of listJsonFiles(absoluteRoot)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    for (const card of data.cards ?? []) {
      if (!card.cardId || !isRecord(card.overlay)) continue;
      const current = overlays.get(card.cardId) ?? {};
      overlays.set(card.cardId, { ...current, ...card.overlay });
    }
  }
  return overlays;
}

function listJsonFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...listJsonFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(entryPath);
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function isCompiledGeneratedField(compiledValue, activeValue, overlayValue) {
  if (!hasMeaningfulValue(compiledValue)) return false;
  if (hasMeaningfulValue(activeValue) && stableStringify(compiledValue) === stableStringify(activeValue)) {
    return false;
  }
  if (hasMeaningfulValue(overlayValue) && stableStringify(compiledValue) === stableStringify(overlayValue)) {
    return false;
  }
  return true;
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function valueClassificationMap(entries) {
  return new Map(entries.map((entry) => [entry.value, entry]));
}

function groupByCardId(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!entry.cardId) continue;
    const group = groups.get(entry.cardId) ?? [];
    group.push(entry);
    groups.set(entry.cardId, group);
  }
  return groups;
}

function countWarningCategories(cards) {
  const counts = {};
  for (const card of cards) {
    for (const warning of card.warningCategories) {
      counts[warning] = (counts[warning] ?? 0) + 1;
    }
  }
  return sortObjectByKey(counts);
}

function findForbiddenKeys(value, found = new Set()) {
  if (value === null || typeof value !== "object") return [...found].sort();
  if (Array.isArray(value)) {
    for (const item of value) findForbiddenKeys(item, found);
    return [...found].sort();
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_OUTPUT_KEYS.includes(key)) found.add(key);
    findForbiddenKeys(child, found);
  }
  return [...found].sort();
}

function removeUndefined(value) {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, removeUndefined(entryValue)]),
  );
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sortedUnique(values) {
  return [...new Set(values.filter((value) => typeof value === "string"))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function sortObjectByKey(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function readJson(repoRoot, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function writeJson(repoRoot, relativePath, value) {
  fs.writeFileSync(
    path.join(repoRoot, relativePath),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function parseArgs(argv) {
  return {
    write: argv.includes("--write"),
    check: argv.includes("--check"),
    json: argv.includes("--json"),
  };
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const artifact = buildAiHintInspectorIndex();
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  if (args.write) writeJson(REPO_ROOT, INSPECTOR_INDEX_PATH, artifact);
  if (args.check) {
    if (!fs.existsSync(path.join(REPO_ROOT, INSPECTOR_INDEX_PATH))) {
      throw new Error(`Committed inspector index is missing: ${INSPECTOR_INDEX_PATH}`);
    }
    const committed = fs.readFileSync(path.join(REPO_ROOT, INSPECTOR_INDEX_PATH), "utf8");
    if (committed !== serialized) {
      throw new Error(
        `Generated inspector index differs from committed ${INSPECTOR_INDEX_PATH}. Run corepack pnpm build:ai-hint-inspector-index.`,
      );
    }
  }
  if (args.json) {
    process.stdout.write(serialized);
  } else {
    process.stdout.write(
      [
        "AI_HINT_INSPECTOR_INDEX OK",
        `cards=${artifact.summary.cardCount}`,
        `mechanical=${artifact.summary.cardsWithMechanicalFacts}`,
        `generated=${artifact.summary.cardsWithGeneratedFacts}`,
        `overlays=${artifact.summary.cardsWithOverlays}`,
        `signals=${artifact.summary.cardsWithFunctionSignals}`,
        `anchors=${artifact.summary.cardsWithStrategyAnchors}`,
        `warnings=${artifact.summary.cardsWithWarnings}`,
      ].join(" ") + "\n",
    );
  }
  return artifact;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
