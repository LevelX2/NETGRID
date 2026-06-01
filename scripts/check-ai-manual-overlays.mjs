import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const DEFAULT_OVERLAY_ROOT = "data/ai/hints/overlays";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai-manual-overlay-pilot-report-2026-05-25.json";
const REVIEW_DATE = "2026-05-25";
const SCHEMA_VERSION = "ai-manual-overlay-pilot-report-v1";
const OVERLAY_SCHEMA_VERSION = "ai-manual-hint-overlay-v1";
const OVERLAY_STATUS = "read_only_pilot";

const KNOWN_LINE_SUPPORT = new Set([
  "rig_first",
  "economy_first",
  "breaker_search_first",
  "early_rnd_pressure",
  "early_hq_pressure",
  "remote_contest",
  "interface_pressure",
  "closeout_pressure",
  "central_stabilize",
  "remote_scoring_build",
  "ice_tax_glacier",
  "economy_rez_reserve",
  "fast_advance_or_counter_ops",
  "tag_trace_punish",
  "bait_and_punish",
  "score_closeout",
  "runner.rig_first",
  "runner.economy_first",
  "runner.search.breaker",
  "runner.rnd_pressure",
  "runner.hq_pressure",
  "runner.remote_contest",
  "runner.remote_trash",
  "runner.interface_closeout",
  "runner.survival_defense",
  "runner.run_event_tempo",
  "corp.remote_scoring",
  "corp.fast_advance",
  "corp.ice_tax_glacier",
  "corp.central_stabilize",
  "corp.asset_economy",
  "corp.tag_trace_punish",
  "corp.damage_kill",
  "corp.ambush_bluff",
  "corp.economy_rez_reserve",
  "corp.rush_score",
]);

const KNOWN_CONFIDENCE = new Set(["low", "medium", "high"]);
const KNOWN_OVERLAY_FIELDS = new Set([
  "lineSupport",
  "quality",
  "manualNotes",
  "strategicNotes",
  "descriptorGaps",
]);
const STRATEGIC_OVERLAY_FIELDS = new Set([
  "lineSupport",
  "quality",
  "manualNotes",
  "strategicNotes",
  "descriptorGaps",
]);
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
const MECHANICAL_FACT_FIELDS = new Set([
  "effects",
  "conditions",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
  "roles",
  "planRoles",
  "requiredMechanics",
  "valueHints",
  "riskTags",
  "scenarioRefs",
  "costProfile",
  "opponentSignals",
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
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  return entries
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

function assertStringArray(value) {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function sortedStringArray(value) {
  return Array.isArray(value) ? [...value].sort() : [];
}

function sameStringArray(left, right) {
  return (
    JSON.stringify(sortedStringArray(left)) ===
    JSON.stringify(sortedStringArray(right))
  );
}

function generatedFactKeys(derivedFacts = {}) {
  const keys = [];
  for (const effect of derivedFacts.effects ?? [])
    keys.push(`effect:${effect.kind}`);
  for (const condition of derivedFacts.conditions ?? []) {
    keys.push(`condition:${condition.kind}`);
  }
  for (const coverage of derivedFacts.breakerProfile?.coverage ?? []) {
    keys.push(`breakerCoverage:${coverage}`);
  }
  for (const sideEffect of derivedFacts.breakerProfile?.sideEffects ?? []) {
    keys.push(`breakerSideEffect:${sideEffect}`);
  }
  if (derivedFacts.remoteRole?.kind)
    keys.push(`remoteRole:${derivedFacts.remoteRole.kind}`);
  if (derivedFacts.targetProfiles?.length) keys.push("targetProfiles");
  return [...new Set(keys)].sort();
}

function derivedCardMatchesScope(card, scope) {
  return (
    scope?.set === "onr-v1" &&
    card?.manualOntologySummary?.side === scope.side &&
    card?.manualOntologySummary?.cardType === scope.cardType
  );
}

function pushIssue(collection, kind, message, context) {
  collection.push({
    kind,
    message,
    ...context,
  });
}

function validateOverlayShape({
  activeHint,
  cardId,
  cardReport,
  errors,
  overlay,
  overlayPath,
  scope,
  warnings,
}) {
  const conflicts = [];
  const hiddenInfoErrors = collectKeyPaths(overlay, HIDDEN_INFO_FIELDS);
  const runtimeErrors = collectKeyPaths(overlay, RUNTIME_OR_LEGALITY_FIELDS);
  const aiSupportStatusErrors = collectKeyPaths(
    overlay,
    new Set(["aiSupportStatus"]),
  );
  const mechanicalFields = collectKeyPaths(overlay, MECHANICAL_FACT_FIELDS);
  const overlayFields = Object.keys(overlay).sort();
  const strategicOverlayFields = overlayFields.filter((field) =>
    STRATEGIC_OVERLAY_FIELDS.has(field),
  );
  const generatedFacts = generatedFactKeys(cardReport?.derivedFacts);
  const mechanicalDuplicationWarnings = mechanicalFields.map((fieldPath) => ({
    kind: "mechanical_fact_duplication",
    message: `Overlay includes mechanical field ${fieldPath}; generated basic facts should own this data.`,
    cardId,
    overlayPath,
    fieldPath,
  }));
  const generatedFactsOverlap =
    mechanicalDuplicationWarnings.length > 0 ? generatedFacts : [];

  for (const fieldPath of hiddenInfoErrors) {
    pushIssue(
      errors,
      "hidden_info_field",
      `Overlay contains hidden-info field ${fieldPath}.`,
      {
        cardId,
        overlayPath,
        fieldPath,
      },
    );
  }
  for (const fieldPath of runtimeErrors) {
    pushIssue(
      errors,
      "runtime_or_legality_field",
      `Overlay contains runtime/legal field ${fieldPath}.`,
      { cardId, overlayPath, fieldPath },
    );
  }
  for (const fieldPath of aiSupportStatusErrors) {
    pushIssue(
      errors,
      "ai_support_status_overlay",
      `Overlay attempts to change aiSupportStatus at ${fieldPath}.`,
      { cardId, overlayPath, fieldPath },
    );
  }
  for (const warning of mechanicalDuplicationWarnings) warnings.push(warning);

  for (const field of overlayFields) {
    if (
      !KNOWN_OVERLAY_FIELDS.has(field) &&
      !MECHANICAL_FACT_FIELDS.has(field)
    ) {
      pushIssue(
        warnings,
        "unknown_overlay_field",
        `Overlay field ${field} is not in the pilot schema.`,
        {
          cardId,
          overlayPath,
          field,
        },
      );
    }
  }

  if (overlay.lineSupport !== undefined) {
    if (!assertStringArray(overlay.lineSupport)) {
      pushIssue(
        errors,
        "invalid_line_support_shape",
        "Overlay lineSupport must be a string array.",
        {
          cardId,
          overlayPath,
        },
      );
    } else {
      for (const lineSupport of overlay.lineSupport) {
        if (!KNOWN_LINE_SUPPORT.has(lineSupport)) {
          pushIssue(
            errors,
            "unknown_line_support",
            `Unknown lineSupport value ${lineSupport}.`,
            {
              cardId,
              overlayPath,
              value: lineSupport,
            },
          );
        }
      }
      if (
        activeHint &&
        !sameStringArray(overlay.lineSupport, activeHint.lineSupport ?? [])
      ) {
        pushIssue(
          warnings,
          "active_line_support_differs",
          "Overlay lineSupport differs from the active monolith.",
          { cardId, overlayPath },
        );
      }
    }
  }

  if (overlay.quality !== undefined) {
    if (
      !overlay.quality ||
      typeof overlay.quality !== "object" ||
      Array.isArray(overlay.quality)
    ) {
      pushIssue(
        errors,
        "invalid_quality_shape",
        "Overlay quality must be an object.",
        {
          cardId,
          overlayPath,
        },
      );
    } else {
      const quality = overlay.quality;
      if (
        quality.confidence !== undefined &&
        !KNOWN_CONFIDENCE.has(quality.confidence)
      ) {
        pushIssue(
          errors,
          "unknown_quality_confidence",
          `Unknown confidence ${quality.confidence}.`,
          {
            cardId,
            overlayPath,
            value: quality.confidence,
          },
        );
      }
      for (const key of [
        "hintReviewed",
        "strategyCovered",
        "benchmarkCovered",
        "needsHumanReview",
      ]) {
        if (quality[key] !== undefined && typeof quality[key] !== "boolean") {
          pushIssue(
            errors,
            "invalid_quality_boolean",
            `quality.${key} must be boolean.`,
            {
              cardId,
              overlayPath,
              field: key,
            },
          );
        }
      }
      if (quality.needsHumanReview === true) {
        pushIssue(
          warnings,
          "needs_human_review",
          "Overlay card keeps needsHumanReview=true.",
          { cardId, overlayPath },
        );
      }
      for (const [key, value] of Object.entries(quality)) {
        if (
          activeHint?.quality?.[key] !== undefined &&
          activeHint.quality[key] !== value
        ) {
          pushIssue(
            warnings,
            "active_quality_differs",
            `Overlay quality.${key} differs from the active monolith.`,
            { cardId, overlayPath, field: key },
          );
        }
      }
    }
  }

  for (const noteField of ["manualNotes", "strategicNotes", "descriptorGaps"]) {
    if (
      overlay[noteField] !== undefined &&
      !assertStringArray(overlay[noteField])
    ) {
      pushIssue(
        errors,
        "invalid_note_shape",
        `Overlay ${noteField} must be a string array.`,
        {
          cardId,
          overlayPath,
          field: noteField,
        },
      );
    }
  }

  if (overlay.descriptorGaps?.length && !overlay.manualNotes?.length) {
    pushIssue(
      warnings,
      "descriptor_gap_without_rationale",
      "Overlay mentions descriptor gaps without manualNotes rationale.",
      { cardId, overlayPath },
    );
  }

  if (strategicOverlayFields.length === 0) {
    pushIssue(
      warnings,
      "overlay_without_strategic_or_quality_field",
      "Overlay contains no strategic, manual-note, descriptor-gap, or quality field.",
      { cardId, overlayPath },
    );
  }

  if (cardId === CRYSTAL_PALACE_CARD_ID) {
    const forbiddenValue = collectStringValues(overlay).find((value) =>
      CRYSTAL_PALACE_FORBIDDEN_VALUES.has(value),
    );
    if (forbiddenValue) {
      conflicts.push("crystal_palace_denylist");
      pushIssue(
        errors,
        "crystal_palace_denylist",
        `Crystal Palace overlay contains forbidden value ${forbiddenValue}.`,
        { cardId, overlayPath, value: forbiddenValue },
      );
    }
  }

  return {
    overlayFields,
    generatedFactsOverlap,
    mechanicalDuplicationWarnings,
    strategicOverlayFields,
    hiddenInfoErrors,
    conflicts,
  };
}

export function buildManualOverlayReport(options = {}) {
  const overlayRoot = options.overlayRoot ?? DEFAULT_OVERLAY_ROOT;
  const activeHints = readJson(options.activeHintsPath ?? ACTIVE_HINTS_PATH);
  const derivedReport = readJson(
    options.derivedFactsReportPath ?? DERIVED_FACTS_REPORT_PATH,
  );
  const activeHintsByCard = new Map(
    (activeHints.cards ?? []).map((hint) => [hint.cardId, hint]),
  );
  const derivedCardsByCard = new Map(
    (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const errors = [];
  const warnings = [];
  const cards = [];
  const segmentScopes = [];
  const overlayCardIds = new Set();

  const overlayFiles = listJsonFiles(repoPath(overlayRoot));
  for (const absoluteOverlayPath of overlayFiles) {
    const overlayPath = toRepoRelative(absoluteOverlayPath);
    const file = JSON.parse(fs.readFileSync(absoluteOverlayPath, "utf8"));
    const scope = file.scope ?? {};
    const fileCards = Array.isArray(file.cards) ? file.cards : [];
    segmentScopes.push({
      overlayPath,
      set: scope.set ?? null,
      side: scope.side ?? null,
      cardType: scope.cardType ?? null,
      cardCount: fileCards.length,
    });

    if (file.schemaVersion !== OVERLAY_SCHEMA_VERSION) {
      pushIssue(
        errors,
        "unknown_overlay_schema",
        "Overlay file has unknown schemaVersion.",
        {
          overlayPath,
          value: file.schemaVersion,
        },
      );
    }
    if (file.status !== OVERLAY_STATUS) {
      pushIssue(
        errors,
        "invalid_overlay_status",
        "Overlay file must stay read_only_pilot.",
        {
          overlayPath,
          value: file.status,
        },
      );
    }

    for (const entry of fileCards) {
      const cardId = entry.cardId;
      overlayCardIds.add(cardId);
      const overlay = entry.overlay ?? {};
      const activeHint = activeHintsByCard.get(cardId);
      const cardReport = derivedCardsByCard.get(cardId);
      const activeHintFound = Boolean(activeHint);
      const setMatches =
        scope.set === "onr-v1" && cardId?.startsWith("onr_v1_");
      const sideMatches = activeHintFound
        ? activeHint.side === scope.side
        : false;
      const cardTypeMatches = activeHintFound
        ? activeHint.cardType === scope.cardType
        : false;

      if (!activeHintFound) {
        pushIssue(
          errors,
          "missing_active_hint",
          "Overlay cardId is absent from active hint index.",
          {
            cardId,
            overlayPath,
          },
        );
      }
      if (!setMatches) {
        pushIssue(
          errors,
          "segment_set_mismatch",
          "Overlay cardId does not match segment set.",
          {
            cardId,
            overlayPath,
            set: scope.set,
          },
        );
      }
      if (activeHintFound && !sideMatches) {
        pushIssue(
          errors,
          "segment_side_mismatch",
          "Overlay side differs from active hint.",
          {
            cardId,
            overlayPath,
            overlaySide: scope.side,
            activeSide: activeHint.side,
          },
        );
      }
      if (activeHintFound && !cardTypeMatches) {
        pushIssue(
          errors,
          "segment_card_type_mismatch",
          "Overlay cardType differs from active hint.",
          {
            cardId,
            overlayPath,
            overlayCardType: scope.cardType,
            activeCardType: activeHint.cardType,
          },
        );
      }

      const validation = validateOverlayShape({
        activeHint,
        cardId,
        cardReport,
        errors,
        overlay,
        overlayPath,
        scope,
        warnings,
      });

      cards.push({
        cardId,
        title: cardReport?.title ?? activeHint?.title ?? cardId,
        overlayPath,
        activeHintFound,
        sideMatches,
        cardTypeMatches,
        overlayFields: validation.overlayFields,
        generatedFactsOverlap: validation.generatedFactsOverlap,
        mechanicalDuplicationWarnings: validation.mechanicalDuplicationWarnings,
        strategicOverlayFields: validation.strategicOverlayFields,
        hiddenInfoErrors: validation.hiddenInfoErrors,
        conflicts: validation.conflicts,
      });
    }
  }

  for (const card of derivedReport.cards ?? []) {
    if (!card.missingManualOverlay?.length) continue;
    const coveredByScope = segmentScopes.some((scope) =>
      derivedCardMatchesScope(card, scope),
    );
    if (coveredByScope && !overlayCardIds.has(card.cardId)) {
      pushIssue(
        warnings,
        "missing_manual_overlay_pilot_card",
        "Card is marked as needing manual overlay in a chosen pilot segment but is absent from overlay files.",
        {
          cardId: card.cardId,
          title: card.title,
        },
      );
    }
  }

  const sortedCards = cards.sort((left, right) =>
    left.cardId.localeCompare(right.cardId),
  );
  const sortedScopes = segmentScopes.sort((left, right) =>
    left.overlayPath.localeCompare(right.overlayPath),
  );
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
    overlayFileCount: overlayFiles.length,
    overlayCardCount: sortedCards.length,
    segmentScopes: sortedScopes,
    cards: sortedCards,
    hardErrorCount: sortedErrors.length,
    warningCount: sortedWarnings.length,
    errors: sortedErrors,
    warnings: sortedWarnings,
  };
}

function parseArgs(argv) {
  const options = {
    check: false,
    write: false,
    json: false,
    reportPath: DEFAULT_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--json") options.json = true;
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
  const report = buildManualOverlayReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed overlay report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated manual overlay report differs from committed ${options.reportPath}. Run node scripts/check-ai-manual-overlays.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_MANUAL_OVERLAYS OK overlayFiles=${report.overlayFileCount} overlayCards=${report.overlayCardCount} errors=${report.hardErrorCount} warnings=${report.warningCount}\n`,
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
