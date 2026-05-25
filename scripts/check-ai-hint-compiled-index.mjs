import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const OVERLAY_ROOT = "data/ai/hints/overlays";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const REVIEW_DATE = "2026-05-25";
const SCHEMA_VERSION = "ai-hint-compiled-index-pilot-v1";

const MECHANICAL_FIELDS = [
  "effects",
  "conditions",
  "costProfile",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
];
const OVERLAY_FIELDS = [
  "lineSupport",
  "quality",
  "manualNotes",
  "strategicNotes",
  "descriptorGaps",
];
const ACTIVE_BASIS_FIELDS = [
  "cardId",
  "side",
  "cardType",
  "roles",
  "planRoles",
  "aiSupportStatus",
];
const HIDDEN_INFO_FIELDS = new Set([
  "opponentDeckList",
  "corpHiddenRndOrder",
  "runnerHiddenStackOrder",
  "hiddenHqCards",
  "privatePayload",
  "fullGameState",
  "cardInstances",
  "actualDeckOrder",
  "actualStackOrder",
  "actualRndOrder",
]);
const RUNTIME_OR_LEGALITY_FIELDS = new Set([
  "legalActions",
  "playerActions",
  "runtime",
  "planner",
  "profile",
  "stateVersion",
  "stateHash",
  "actionId",
  "compiledHint",
  "consumer",
  "strategyWeights",
  "legality",
  "deck",
  "matchState",
]);
const CRYSTAL_PALACE_CARD_ID = "onr_v1_355_crystal-palace-station-grid";
const CRYSTAL_PALACE_FORBIDDEN_VALUES = new Set([
  "economy",
  "counter",
  "power_counter",
  "remote_upgrade_economy",
]);

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function toRepoRelative(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath).replaceAll(path.sep, "/");
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), stableStringify(value), "utf8");
}

function listJsonFiles(absoluteDir) {
  if (!fs.existsSync(absoluteDir)) return [];
  return fs
    .readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(absoluteDir, entry.name);
      if (entry.isDirectory()) return listJsonFiles(absolutePath);
      if (entry.isFile() && entry.name.endsWith(".json")) return [absolutePath];
      return [];
    })
    .sort((left, right) =>
      toRepoRelative(left).localeCompare(toRepoRelative(right)),
    );
}

function isMeaningful(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function sortedKeysObject(value) {
  if (Array.isArray(value)) {
    return value
      .map(sortedKeysObject)
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortedKeysObject(child)]),
  );
}

function normalizeForCompare(value) {
  if (Array.isArray(value)) {
    return value
      .map(normalizeForCompare)
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, child]) =>
          ![
            "source",
            "confidence",
            "derivationNotes",
            "needsManualOverlayReasons",
          ].includes(key) && isMeaningful(child),
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, normalizeForCompare(child)]),
  );
}

function sameSemanticValue(left, right) {
  return (
    JSON.stringify(normalizeForCompare(left)) ===
    JSON.stringify(normalizeForCompare(right))
  );
}

function sameOverlayValue(field, overlayValue, activeValue) {
  if (field === "quality") {
    if (!overlayValue || typeof overlayValue !== "object") return false;
    if (!activeValue || typeof activeValue !== "object") return false;
    return Object.entries(overlayValue).every(
      ([key, value]) => activeValue[key] === value,
    );
  }
  return sameSemanticValue(overlayValue, activeValue);
}

function collectKeyPaths(value, keySet, basePath = "$") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectKeyPaths(item, keySet, `${basePath}[${index}]`),
    );
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = `${basePath}.${key}`;
    const matches = keySet.has(key) ? [childPath] : [];
    return matches.concat(collectKeyPaths(child, keySet, childPath));
  });
}

function collectStringValues(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectStringValues);
}

function derivedMechanicalFacts(derivedFacts = {}) {
  return Object.fromEntries(
    MECHANICAL_FIELDS.flatMap((field) =>
      isMeaningful(derivedFacts[field])
        ? [[field, sortedKeysObject(derivedFacts[field])]]
        : [],
    ),
  );
}

function generatedFactLabels(derivedFacts = {}) {
  const labels = [];
  for (const effect of derivedFacts.effects ?? []) {
    labels.push(`effect:${effect.kind}`);
  }
  for (const condition of derivedFacts.conditions ?? []) {
    labels.push(`condition:${condition.kind}`);
  }
  if (isMeaningful(derivedFacts.breakerProfile)) labels.push("breakerProfile");
  if (isMeaningful(derivedFacts.remoteRole))
    labels.push(`remoteRole:${derivedFacts.remoteRole.kind}`);
  if (isMeaningful(derivedFacts.targetProfiles)) labels.push("targetProfiles");
  if (isMeaningful(derivedFacts.costProfile)) labels.push("costProfile");
  return [...new Set(labels)].sort();
}

function readOverlayEntries() {
  return listJsonFiles(repoPath(OVERLAY_ROOT)).flatMap(
    (absoluteOverlayPath) => {
      const overlayPath = toRepoRelative(absoluteOverlayPath);
      const file = JSON.parse(fs.readFileSync(absoluteOverlayPath, "utf8"));
      return (file.cards ?? []).map((entry) => ({
        cardId: entry.cardId,
        overlay: entry.overlay ?? {},
        overlayPath,
        scope: file.scope ?? {},
      }));
    },
  );
}

function pushIssue(collection, kind, message, context) {
  collection.push({
    kind,
    message,
    ...context,
  });
}

function overlayStrategicFields(overlay) {
  return OVERLAY_FIELDS.filter((field) => isMeaningful(overlay[field]));
}

function buildCompiledPreview(activeHint, generatedFacts, overlay) {
  const preview = {};
  for (const field of ACTIVE_BASIS_FIELDS) {
    if (isMeaningful(activeHint?.[field])) {
      preview[field] = sortedKeysObject(activeHint[field]);
    }
  }
  for (const field of MECHANICAL_FIELDS) {
    if (isMeaningful(generatedFacts[field])) {
      preview[field] = sortedKeysObject(generatedFacts[field]);
    }
  }
  for (const field of OVERLAY_FIELDS) {
    if (isMeaningful(overlay[field])) {
      preview[field] = sortedKeysObject(overlay[field]);
    }
  }
  return preview;
}

function compareFields(activeHint, generatedFacts, overlay) {
  const generatedFields = MECHANICAL_FIELDS.filter((field) =>
    isMeaningful(generatedFacts[field]),
  );
  const overlayFields = overlayStrategicFields(overlay);
  const activeFields = Object.keys(activeHint ?? {}).sort();
  const activeMonolithOnlyFields = activeFields.filter(
    (field) =>
      !["cardId", "side", "cardType"].includes(field) &&
      !generatedFields.includes(field) &&
      !overlayFields.includes(field),
  );
  const generatedOnlyFields = generatedFields.filter(
    (field) => !sameSemanticValue(generatedFacts[field], activeHint?.[field]),
  );
  const overlayOnlyFields = overlayFields.filter(
    (field) => !sameOverlayValue(field, overlay[field], activeHint?.[field]),
  );
  return {
    activeMonolithOnlyFields,
    generatedOnlyFields,
    overlayOnlyFields,
  };
}

function validateNoForbiddenOutput(compiledPreview, cardId, errors) {
  for (const fieldPath of collectKeyPaths(
    compiledPreview,
    HIDDEN_INFO_FIELDS,
  )) {
    pushIssue(
      errors,
      "compiled_hidden_info_field",
      `Compiled preview contains hidden-info field ${fieldPath}.`,
      { cardId, fieldPath },
    );
  }
  for (const fieldPath of collectKeyPaths(
    compiledPreview,
    RUNTIME_OR_LEGALITY_FIELDS,
  )) {
    pushIssue(
      errors,
      "compiled_runtime_or_legality_field",
      `Compiled preview contains runtime/legal field ${fieldPath}.`,
      { cardId, fieldPath },
    );
  }
}

function validateOverlayForCompiler({ cardId, overlay, overlayPath, errors }) {
  for (const fieldPath of collectKeyPaths(overlay, HIDDEN_INFO_FIELDS)) {
    pushIssue(
      errors,
      "overlay_hidden_info_field",
      `Overlay contains hidden-info field ${fieldPath}.`,
      { cardId, overlayPath, fieldPath },
    );
  }
  for (const fieldPath of collectKeyPaths(
    overlay,
    RUNTIME_OR_LEGALITY_FIELDS,
  )) {
    pushIssue(
      errors,
      "overlay_runtime_or_legality_field",
      `Overlay contains runtime/legal field ${fieldPath}.`,
      { cardId, overlayPath, fieldPath },
    );
  }
  for (const fieldPath of collectKeyPaths(
    overlay,
    new Set(["aiSupportStatus"]),
  )) {
    pushIssue(
      errors,
      "overlay_ai_support_status",
      `Overlay attempts to set aiSupportStatus at ${fieldPath}.`,
      { cardId, overlayPath, fieldPath },
    );
  }
  for (const field of [
    "effects",
    "conditions",
    "breakerProfile",
    "remoteRole",
    "targetProfiles",
  ]) {
    if (isMeaningful(overlay[field])) {
      pushIssue(
        errors,
        "overlay_mechanical_fact_field",
        `Overlay duplicates generated mechanical field ${field}.`,
        { cardId, overlayPath, field },
      );
    }
  }
  if (cardId === CRYSTAL_PALACE_CARD_ID) {
    const forbiddenValue = collectStringValues(overlay).find((value) =>
      CRYSTAL_PALACE_FORBIDDEN_VALUES.has(value),
    );
    if (forbiddenValue) {
      pushIssue(
        errors,
        "crystal_palace_denylist",
        `Crystal Palace overlay contains forbidden value ${forbiddenValue}.`,
        { cardId, overlayPath, value: forbiddenValue },
      );
    }
  }
}

export function buildCompiledIndexReport(options = {}) {
  const activeHintsPath = options.activeHintsPath ?? ACTIVE_HINTS_PATH;
  const derivedFactsReportPath =
    options.derivedFactsReportPath ?? DERIVED_FACTS_REPORT_PATH;
  const activeHints = readJson(activeHintsPath);
  const derivedReport = readJson(derivedFactsReportPath);
  const overlayEntries = readOverlayEntries();
  const activeHintsByCard = new Map(
    (activeHints.cards ?? []).map((hint) => [hint.cardId, hint]),
  );
  const derivedCardsByCard = new Map(
    (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const errors = [];
  const warnings = [];
  const cards = [];
  const overlayPaths = [
    ...new Set(overlayEntries.map((entry) => entry.overlayPath)),
  ].sort();

  if ((derivedReport.hardErrorCount ?? 0) > 0) {
    pushIssue(
      errors,
      "derived_facts_gate_has_errors",
      "Derived facts source report has hard errors and cannot be compiled.",
      { hardErrorCount: derivedReport.hardErrorCount },
    );
  }

  for (const entry of overlayEntries.sort((left, right) =>
    left.cardId.localeCompare(right.cardId),
  )) {
    const { cardId, overlay, overlayPath } = entry;
    const activeHint = activeHintsByCard.get(cardId);
    const derivedCard = derivedCardsByCard.get(cardId);
    const derivedFacts = derivedCard?.derivedFacts ?? {};
    const generatedFacts = derivedMechanicalFacts(derivedFacts);
    const manualOverlayFound = Boolean(overlay);
    const conflicts = [];
    const cardWarnings = [];

    if (!activeHint) {
      pushIssue(
        errors,
        "missing_active_hint",
        "Overlay card is absent from active monolith.",
        { cardId, overlayPath },
      );
    }
    if (!derivedCard && isMeaningful(overlay.descriptorGaps)) {
      pushIssue(
        errors,
        "missing_derived_facts_for_descriptor_gap",
        "Overlay references descriptor gaps but the card is absent from derived facts report.",
        { cardId, overlayPath },
      );
    }
    for (const fieldPath of collectKeyPaths(derivedFacts, HIDDEN_INFO_FIELDS)) {
      pushIssue(
        errors,
        "generated_hidden_info_field",
        `Generated facts contain hidden-info field ${fieldPath}.`,
        { cardId, fieldPath },
      );
    }

    validateOverlayForCompiler({ cardId, overlay, overlayPath, errors });

    const compiledPreview = buildCompiledPreview(
      activeHint,
      generatedFacts,
      overlay,
    );
    validateNoForbiddenOutput(compiledPreview, cardId, errors);
    const comparison = compareFields(activeHint, generatedFacts, overlay);
    const generatedFields = Object.keys(generatedFacts).sort();
    const overlayFields = overlayStrategicFields(overlay);

    for (const field of generatedFields.filter((field) =>
      isMeaningful(activeHint?.[field]),
    )) {
      const warning = {
        kind: "active_mechanical_field_should_be_generated",
        message: `Active monolith already carries mechanical field ${field}; long-term source should be generated facts.`,
        cardId,
        field,
      };
      warnings.push(warning);
      cardWarnings.push(warning);
    }

    for (const field of comparison.generatedOnlyFields) {
      const warning = {
        kind: "generated_fact_missing_or_differs_in_active",
        message: `Generated mechanical field ${field} is absent from or differs from active monolith.`,
        cardId,
        field,
      };
      warnings.push(warning);
      cardWarnings.push(warning);
    }

    for (const field of comparison.overlayOnlyFields) {
      const warning = {
        kind: "overlay_field_missing_or_differs_in_active",
        message: `Overlay field ${field} is absent from or differs from active monolith.`,
        cardId,
        field,
      };
      warnings.push(warning);
      cardWarnings.push(warning);
    }

    if (overlay.quality?.needsHumanReview === true) {
      const warning = {
        kind: "needs_human_review",
        message: "Manual overlay keeps needsHumanReview=true.",
        cardId,
      };
      warnings.push(warning);
      cardWarnings.push(warning);
    }
    if (isMeaningful(overlay.descriptorGaps)) {
      const warning = {
        kind: "descriptor_gap_remaining",
        message: "Manual overlay keeps an open descriptor gap.",
        cardId,
      };
      warnings.push(warning);
      cardWarnings.push(warning);
      if (!isMeaningful(overlay.manualNotes)) {
        const missingNoteWarning = {
          kind: "descriptor_gap_without_manual_note",
          message:
            "Pilot card has descriptorGap without manualNotes rationale.",
          cardId,
        };
        warnings.push(missingNoteWarning);
        cardWarnings.push(missingNoteWarning);
      }
    }
    if (overlayFields.length > 0 && generatedFields.length === 0) {
      const warning = {
        kind: "strategic_overlay_without_generated_facts",
        message: "Card has strategic overlay but no generated facts.",
        cardId,
      };
      warnings.push(warning);
      cardWarnings.push(warning);
    }

    cards.push({
      cardId,
      title: derivedCard?.title ?? activeHint?.title ?? cardId,
      side: activeHint?.side ?? null,
      cardType: activeHint?.cardType ?? null,
      activeHintFound: Boolean(activeHint),
      derivedFactsFound: Boolean(derivedCard),
      manualOverlayFound,
      compiledPreview,
      mechanicalFactsFromGenerated: generatedFactLabels(derivedFacts),
      strategyFieldsFromOverlay: overlayFields,
      activeMonolithOnlyFields: comparison.activeMonolithOnlyFields,
      generatedOnlyFields: comparison.generatedOnlyFields,
      overlayOnlyFields: comparison.overlayOnlyFields,
      conflicts,
      warnings: cardWarnings.sort((left, right) =>
        `${left.kind}:${left.field ?? ""}`.localeCompare(
          `${right.kind}:${right.field ?? ""}`,
        ),
      ),
    });
  }

  const sortedErrors = errors.sort((left, right) =>
    `${left.cardId ?? ""}:${left.kind}:${left.message}`.localeCompare(
      `${right.cardId ?? ""}:${right.kind}:${right.message}`,
    ),
  );
  const sortedWarnings = warnings.sort((left, right) =>
    `${left.cardId ?? ""}:${left.kind}:${left.message}`.localeCompare(
      `${right.cardId ?? ""}:${right.kind}:${right.message}`,
    ),
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    source: {
      activeHintsPath,
      derivedFactsReportPath,
      overlayPaths,
      mode: "read-only comparison index; does not replace ai-card-hints-active.json",
    },
    compiledCardCount: cards.length,
    hardErrorCount: sortedErrors.length,
    warningCount: sortedWarnings.length,
    cards,
    errors: sortedErrors,
    warnings: sortedWarnings,
  };
}

function parseArgs(argv) {
  const options = {
    check: false,
    write: false,
    json: false,
    pilotOnly: false,
    reportPath: DEFAULT_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--pilot-only") options.pilotOnly = true;
    else if (arg === "--report") {
      index += 1;
      if (!argv[index]) throw new Error("--report requires a path");
      options.reportPath = argv[index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.check && !options.write && !options.json) options.check = true;
  return options;
}

export function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = buildCompiledIndexReport({ pilotOnly: options.pilotOnly });
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed compiled-index report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated compiled-index report differs from committed ${options.reportPath}. Run node scripts/check-ai-hint-compiled-index.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_HINT_COMPILED_INDEX OK cards=${report.compiledCardCount} errors=${report.hardErrorCount} warnings=${report.warningCount}\n`,
    );
  }

  if (report.hardErrorCount > 0) {
    process.exitCode = 1;
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
