import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 013";
const SCHEMA_VERSION = "ai-generated-fact-batch3-diff-review-v1";
const DRY_RUN_REPORT_PATH =
  "docs/reviews/ai/aufgabe-012-generated-fact-batch3-dry-run-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-013-batch3-diff-review-report-2026-05-25.json";

const EXPECTED_WARNING_COUNTS = {
  shape_difference: 6,
  remote_role_shape_difference: 4,
  future_run_shape_difference: 3,
  board_context_required: 15,
  runpath_context_required: 10,
  descriptor_context_required: 9,
};
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

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
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

function sortByKey(items) {
  return [...items].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  );
}

function countBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function addIssue(target, kind, message, details = {}) {
  target.push({ kind, message, ...details });
}

function collectKeyPaths(value, blockedKeys, basePath = "") {
  if (!value || typeof value !== "object") return [];
  const paths = [];
  for (const [key, child] of Object.entries(value)) {
    const pathValue = basePath ? `${basePath}.${key}` : key;
    if (blockedKeys.has(key)) paths.push(pathValue);
    if (Array.isArray(child)) {
      for (const [index, item] of child.entries()) {
        paths.push(
          ...collectKeyPaths(item, blockedKeys, `${pathValue}[${index}]`),
        );
      }
    } else if (child && typeof child === "object") {
      paths.push(...collectKeyPaths(child, blockedKeys, pathValue));
    }
  }
  return paths;
}

function activeValueFor(card, fact) {
  return (
    (card.activeMechanicalFieldsInScope ?? []).find(
      (item) =>
        item.type === fact ||
        `${item.type}:${item.kind}` === fact ||
        (fact === "remoteRole" && item.type === "remoteRole"),
    ) ?? null
  );
}

function generatedValueFor(card, fact) {
  return (
    (card.generatedFactsInScope ?? []).find(
      (item) =>
        item.type === fact ||
        `${item.type}:${item.kind}` === fact ||
        (fact === "remoteRole" && item.type === "remoteRole"),
    ) ?? null
  );
}

function consumerRelevant(card, fact) {
  return (card.warnings ?? []).some(
    (warning) =>
      warning.kind === "consumer_active_for_fact_type" && warning.fact === fact,
  );
}

function contextFlags(card, fact) {
  return {
    boardContextRequired: (card.warnings ?? []).some(
      (warning) =>
        warning.kind === "board_context_required" && warning.fact === fact,
    ),
    runpathContextRequired: (card.warnings ?? []).some(
      (warning) =>
        warning.kind === "runpath_context_required" && warning.fact === fact,
    ),
    activeStateContextRequired: (card.warnings ?? []).some(
      (warning) =>
        warning.kind === "active_state_context_required" &&
        warning.fact === fact,
    ),
    descriptorContextRequired: (card.warnings ?? []).some(
      (warning) =>
        warning.kind === "descriptor_context_required" &&
        (warning.fact === fact || !warning.fact),
    ),
  };
}

function baseClassification(card, sourceWarningKind, fact, values = {}) {
  return {
    sourceWarningKind,
    cardId: card.cardId,
    title: card.title,
    fact,
    activeValue: values.activeValue ?? activeValueFor(card, fact),
    generatedValue: values.generatedValue ?? generatedValueFor(card, fact),
    compiledPreviewValue: card.compiledAfterMigrationPreview,
    manualOverlayPresent: card.manualOverlayFound,
    consumerRelevant: consumerRelevant(card, fact),
    ...contextFlags(card, fact),
    conflict: false,
  };
}

function classifyShapeDifference(card, difference) {
  const base = baseClassification(card, "shape_difference", difference.fact, {
    activeValue: difference.active,
    generatedValue: difference.generated,
  });

  if (card.cardId === "onr_v1_277_virizz") {
    return {
      ...base,
      normalizedSemanticMeaning:
        "Future-run break/run cost tax that needs remaining-run and effectiveRunQuote context; active amount/repeatable shape is more specific.",
      classification: "runpath_context_shape_difference",
      rationale:
        "Generated and active both describe run_tax during encounter on the run_path; active monolith carries amount/repeatable detail that should be normalized later, not treated as conflict.",
      proposedFutureAction: "future_run_remaining_ice_context_normalization",
      normalizationRules: [
        "future_run_remaining_ice_context_normalization",
        "effective_run_quote_priority_annotation",
      ],
    };
  }

  if (card.cardId === "onr_v1_276_viral-15") {
    return {
      ...base,
      normalizedSemanticMeaning:
        difference.fact === "effect:program_trash"
          ? "Future-run program-trash consequence that depends on unbroken subroutine and current runpath context."
          : "Future-run jack-out/run-tax consequence that depends on runpath and effectiveRunQuote context.",
      classification: "runpath_context_shape_difference",
      rationale:
        "Generated and active facts agree on the mechanical effect class; active repeatable shape is legacy specificity that must remain runpath-gated.",
      proposedFutureAction:
        difference.fact === "effect:program_trash"
          ? "future_run_program_trash_context_normalization"
          : "future_run_remaining_ice_context_normalization",
      normalizationRules:
        difference.fact === "effect:program_trash"
          ? ["future_run_program_trash_context_normalization"]
          : [
              "future_run_remaining_ice_context_normalization",
              "effective_run_quote_priority_annotation",
            ],
    };
  }

  if (card.cardId === "onr_v1_355_crystal-palace-station-grid") {
    return {
      ...base,
      normalizedSemanticMeaning:
        "Remote upgrade run_tax/break-subroutine-cost modifier for the protected fort; active repeatable=true is shape detail.",
      classification: "remote_role_equivalent_run_tax",
      rationale:
        "Generated and active both describe persistent fort-scoped run_tax; Crystal Palace is not economy, counter or agenda-steal-tax.",
      proposedFutureAction: "remote_role_run_tax_normalization",
      normalizationRules: [
        "remote_role_run_tax_normalization",
        "active_state_context_normalization",
        "effective_run_quote_priority_annotation",
      ],
    };
  }

  if (card.cardId === "onr_v1_366_red-herrings") {
    return {
      ...base,
      normalizedSemanticMeaning:
        difference.fact === "remoteRole"
          ? "Agenda-steal-tax remoteRole with serverScope shape mismatch between generated remote and active fort."
          : "Access-time agenda-steal cost represented as run_tax effect, tied to Red Herrings remoteRole agenda_steal_tax semantics.",
      classification:
        difference.fact === "remoteRole"
          ? "board_context_shape_difference"
          : "remote_role_equivalent_agenda_steal_tax",
      rationale:
        "Red Herrings remains agenda_steal_tax; the effect-level run_tax shape is the cost form, not a generic remote run tax.",
      proposedFutureAction: "remote_role_agenda_steal_tax_normalization",
      normalizationRules: [
        "remote_role_agenda_steal_tax_normalization",
        "active_state_context_normalization",
        "effective_run_quote_priority_annotation",
      ],
    };
  }

  return {
    ...base,
    normalizedSemanticMeaning: "Unclassified Batch-3 shape difference.",
    classification: "real_semantic_conflict",
    rationale: "No safe Batch-3 shape classification exists for this fact.",
    proposedFutureAction: "block_until_reviewed",
    conflict: true,
  };
}

function classifyRemoteRoleWarning(card, warning, occurrenceIndex) {
  const base = baseClassification(
    card,
    "remote_role_shape_difference",
    warning.fact,
  );
  if (card.cardId === "onr_v1_355_crystal-palace-station-grid") {
    return {
      ...base,
      normalizedSemanticMeaning:
        "Crystal Palace Station Grid is a fort-scoped run_tax/break-subroutine-cost modifier.",
      classification: "remote_role_equivalent_run_tax",
      rationale:
        "The generated class is run_tax and must stay distinct from economy, counters and agenda_steal_tax.",
      proposedFutureAction: "remote_role_run_tax_normalization",
      normalizationRules: [
        "remote_role_run_tax_normalization",
        "active_state_context_normalization",
        "effective_run_quote_priority_annotation",
      ],
    };
  }

  return {
    ...base,
    occurrenceIndex,
    normalizedSemanticMeaning:
      warning.fact === "remoteRole"
        ? "Red Herrings is agenda_steal_tax; serverScope remote vs fort is an active-state/server-context shape issue."
        : "Red Herrings uses run_tax effect shape to represent an agenda-steal access cost, not generic run taxation.",
    classification:
      warning.fact === "remoteRole"
        ? "active_state_context_required"
        : "remote_role_equivalent_agenda_steal_tax",
    rationale:
      "Red Herrings keeps agenda_steal_tax semantics and requires access/server context; no generic run_tax migration should be inferred.",
    proposedFutureAction: "remote_role_agenda_steal_tax_normalization",
    normalizationRules: [
      "remote_role_agenda_steal_tax_normalization",
      "active_state_context_normalization",
      "effective_run_quote_priority_annotation",
    ],
  };
}

function classifyFutureRunWarning(card, warning) {
  const base = baseClassification(
    card,
    "future_run_shape_difference",
    warning.fact,
  );
  return {
    ...base,
    normalizedSemanticMeaning:
      warning.fact === "effect:program_trash"
        ? "Future-run program-trash consequence that is not current trash legality."
        : "Future-run run-tax/cost consequence that must stay tied to remaining-run and effectiveRunQuote context.",
    classification:
      warning.fact === "effect:program_trash"
        ? "future_run_program_trash_context_required"
        : "remaining_ice_context_required",
    rationale:
      "The generated fact is mechanically useful, but Tutor/Virizz/Viral 15 style ICE must not become immediate self-safety or current LegalAction claims.",
    proposedFutureAction:
      warning.fact === "effect:program_trash"
        ? "future_run_program_trash_context_normalization"
        : "future_run_remaining_ice_context_normalization",
    normalizationRules:
      warning.fact === "effect:program_trash"
        ? ["future_run_program_trash_context_normalization"]
        : [
            "future_run_remaining_ice_context_normalization",
            "effective_run_quote_priority_annotation",
          ],
  };
}

function classifyBoardContextWarning(card, warning) {
  let classification = "future_run_requires_ongoing_run_context";
  if (card.cardId === "onr_v1_355_crystal-palace-station-grid") {
    classification =
      warning.fact === "remoteRole"
        ? "remote_role_requires_rezzed_active_state"
        : "run_tax_requires_encounter_or_run_context";
  } else if (card.cardId === "onr_v1_366_red-herrings") {
    classification = "agenda_steal_tax_requires_access_context";
  }

  return {
    ...baseClassification(card, "board_context_required", warning.fact),
    normalizedSemanticMeaning:
      "Generated fact describes static card function; actual effect depends on board, server/access or current run state.",
    classification,
    rationale:
      "Board-context warnings are safety annotations and not semantic conflicts.",
    proposedFutureAction: "active_state_context_normalization",
    normalizationRules: ["active_state_context_normalization"],
  };
}

function classifyRunpathContextWarning(card, warning) {
  let classification = "future_run_requires_current_run_path";
  if (
    ["effect:future_run_effect", "effect:remote_protection"].includes(
      warning.fact,
    )
  ) {
    classification = "future_run_requires_remaining_ice";
  } else if (warning.fact === "effect:run_tax") {
    classification = "future_run_requires_effective_run_quote_context";
  } else if (warning.fact === "effect:program_trash") {
    classification = "future_run_requires_unbroken_subroutine";
  }

  return {
    ...baseClassification(card, "runpath_context_required", warning.fact),
    normalizedSemanticMeaning:
      "Future-run ICE fact remains a static descriptor until runpath, remaining ICE, unbroken subroutines and effectiveRunQuote provide current context.",
    classification,
    rationale:
      "Runpath-context warnings are expected for Tutor/Virizz/Viral 15 and block rollup readiness until normalized.",
    proposedFutureAction:
      warning.fact === "effect:program_trash"
        ? "future_run_program_trash_context_normalization"
        : "future_run_remaining_ice_context_normalization",
    normalizationRules:
      warning.fact === "effect:program_trash"
        ? ["future_run_program_trash_context_normalization"]
        : [
            "future_run_remaining_ice_context_normalization",
            "effective_run_quote_priority_annotation",
          ],
  };
}

function classifyDescriptorContextWarning(card, warning) {
  const futureRun = card.expectedContext === "future_run_ice";
  return {
    ...baseClassification(
      card,
      "descriptor_context_required",
      warning.fact ?? warning.descriptorGap ?? warning.missingOverlay,
    ),
    normalizedSemanticMeaning: futureRun
      ? "Future-run/future-encounter descriptor is still coarse and needs a dedicated runpath descriptor follow-up."
      : "Remote protection is intentionally strategic/contextual overlay, not generated RemoteRole mechanics.",
    classification: futureRun
      ? "future_run_descriptor_followup"
      : "descriptor_context_info",
    rationale: futureRun
      ? "The derived facts are mechanically recognizable but too coarse for rollup readiness without explicit remaining-ICE/runpath descriptor context."
      : "Remote protection should stay manual/strategic until a separate overlay/descriptor slice proves a mechanical field.",
    proposedFutureAction: futureRun
      ? "future_run_remaining_ice_context_normalization"
      : "keep_remote_protection_overlay_only",
    normalizationRules: futureRun
      ? ["future_run_remaining_ice_context_normalization"]
      : ["remote_role_run_tax_normalization"],
  };
}

function collectClassifications(card) {
  const shape = (card.shapeDifferences ?? []).map((difference) =>
    classifyShapeDifference(card, difference),
  );
  const remote = (card.warnings ?? [])
    .filter((warning) => warning.kind === "remote_role_shape_difference")
    .map((warning, index) => classifyRemoteRoleWarning(card, warning, index));
  const future = (card.warnings ?? [])
    .filter((warning) => warning.kind === "future_run_shape_difference")
    .map((warning) => classifyFutureRunWarning(card, warning));
  const board = (card.warnings ?? [])
    .filter((warning) => warning.kind === "board_context_required")
    .map((warning) => classifyBoardContextWarning(card, warning));
  const runpath = (card.warnings ?? [])
    .filter((warning) => warning.kind === "runpath_context_required")
    .map((warning) => classifyRunpathContextWarning(card, warning));
  const descriptor = (card.warnings ?? [])
    .filter((warning) => warning.kind === "descriptor_context_required")
    .map((warning) => classifyDescriptorContextWarning(card, warning));
  return sortByKey([
    ...shape,
    ...remote,
    ...future,
    ...board,
    ...runpath,
    ...descriptor,
  ]);
}

function normalizationRationale(rule) {
  return {
    remote_role_run_tax_normalization:
      "Normalize Crystal Palace run_tax/break-subroutine-cost shape while preserving active/server context.",
    remote_role_agenda_steal_tax_normalization:
      "Normalize Red Herrings agenda_steal_tax and distinguish access-cost run_tax shape from generic run_tax.",
    future_run_remaining_ice_context_normalization:
      "Mark Tutor/Virizz style future-run effects as remaining-ICE/runpath-dependent, not current self-safety.",
    future_run_program_trash_context_normalization:
      "Mark Viral 15 program-trash as a future-run/runpath consequence, not current trash legality.",
    active_state_context_normalization:
      "Normalize rezzed/activeWhile/same-server/fort context as board context.",
    effective_run_quote_priority_annotation:
      "Annotate run_tax/cost-like facts so effectiveRunQuote remains authoritative for concrete path cost.",
    keep_remote_protection_overlay_only:
      "Keep remote_protection strategic/contextual until a separate descriptor slice makes it mechanically precise.",
  }[rule];
}

function normalizationCandidates(classifications) {
  const rules = new Map();
  for (const classification of classifications) {
    for (const rule of classification.normalizationRules ?? []) {
      if (rule === "block_until_reviewed") continue;
      if (!rules.has(rule)) {
        rules.set(rule, {
          rule,
          rationale: normalizationRationale(rule),
          appliesTo: [],
        });
      }
      rules.get(rule).appliesTo.push({
        cardId: classification.cardId,
        title: classification.title,
        fact: classification.fact,
        sourceWarningKind: classification.sourceWarningKind,
      });
    }
  }
  return sortByKey(
    [...rules.values()].map((rule) => ({
      ...rule,
      appliesTo: sortByKey(rule.appliesTo),
    })),
  );
}

function recommendedSubBatch(card) {
  return card.expectedContext === "remote_upgrade"
    ? "remote_upgrades_only"
    : "future_run_ice";
}

function buildCardReview(card) {
  const classifications = collectClassifications(card);
  const realSemanticConflicts = classifications.filter(
    (classification) =>
      classification.classification === "real_semantic_conflict",
  );
  return {
    cardId: card.cardId,
    title: card.title,
    recommendedSubBatch: recommendedSubBatch(card),
    classifications,
    normalizationCandidates: normalizationCandidates(classifications),
    remainingIssues: realSemanticConflicts.map((conflict) => conflict.fact),
    realSemanticConflicts,
    sourceWarningKinds: countBy(card.warnings ?? [], (warning) => warning.kind),
  };
}

export function buildBatchThreeDiffReviewReport() {
  const dryRunReport = readJson(DRY_RUN_REPORT_PATH);
  const hardErrors = [];

  if (dryRunReport.hardErrorCount !== 0) {
    addIssue(
      hardErrors,
      "source_dry_run_has_hard_errors",
      "Aufgabe-012 dry-run has hard errors and cannot be normalized safely.",
    );
  }
  if (dryRunReport.conflictCount !== 0) {
    addIssue(
      hardErrors,
      "source_dry_run_has_conflicts",
      "Aufgabe-012 dry-run has conflicts and cannot be normalized safely.",
    );
  }
  for (const [kind, expectedCount] of Object.entries(EXPECTED_WARNING_COUNTS)) {
    const actualCount = dryRunReport.warningCountsByKind?.[kind] ?? 0;
    if (actualCount !== expectedCount) {
      addIssue(
        hardErrors,
        "unexpected_source_warning_count",
        `Expected ${expectedCount} ${kind} warnings but found ${actualCount}.`,
        { kind, expectedCount, actualCount },
      );
    }
  }
  for (const fieldPath of collectKeyPaths(dryRunReport, HIDDEN_INFO_FIELDS)) {
    addIssue(
      hardErrors,
      "hidden_info_field",
      `Source dry-run report contains hidden-info field ${fieldPath}.`,
      { fieldPath },
    );
  }

  const cards = sortByKey((dryRunReport.cards ?? []).map(buildCardReview));
  const classifications = cards.flatMap((card) => card.classifications);
  const realSemanticConflicts = classifications.filter(
    (classification) =>
      classification.classification === "real_semantic_conflict",
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    sourceDryRunReport: DRY_RUN_REPORT_PATH,
    batch: dryRunReport.batch,
    mode: "read-only diff review; no active hint migration, no runtime compile, no planner or consumer binding",
    hardErrorCount: hardErrors.length,
    shapeDifferenceCount: dryRunReport.shapeDifferenceCount,
    remoteRoleShapeDifferenceCount:
      dryRunReport.warningCountsByKind?.remote_role_shape_difference ?? 0,
    futureRunShapeDifferenceCount: dryRunReport.futureRunDifferenceCount,
    boardContextRequiredCount: dryRunReport.boardContextRequiredCount,
    runpathContextRequiredCount: dryRunReport.runpathContextRequiredCount,
    activeStateContextRequiredCount:
      dryRunReport.activeStateContextRequiredCount,
    descriptorContextRequiredCount:
      dryRunReport.warningCountsByKind?.descriptor_context_required ?? 0,
    realSemanticConflictCount: realSemanticConflicts.length,
    classificationCounts: countBy(
      classifications,
      (classification) => classification.classification,
    ),
    classificationCountsByWarningKind: countBy(
      classifications,
      (classification) => classification.sourceWarningKind,
    ),
    boardContextClassifications: countBy(
      classifications.filter(
        (classification) =>
          classification.sourceWarningKind === "board_context_required",
      ),
      (classification) => classification.classification,
    ),
    runpathContextClassifications: countBy(
      classifications.filter(
        (classification) =>
          classification.sourceWarningKind === "runpath_context_required",
      ),
      (classification) => classification.classification,
    ),
    descriptorContextClassifications: countBy(
      classifications.filter(
        (classification) =>
          classification.sourceWarningKind === "descriptor_context_required",
      ),
      (classification) => classification.classification,
    ),
    normalizationRuleCandidates: normalizationCandidates(classifications),
    splitRecommendation: {
      decision: "remote_upgrades_ready_future_ice_needs_followup",
      followupShape: "split_after_diff_review",
      remoteUpgrades: ["Crystal Palace Station Grid", "Red Herrings"],
      futureRunIce: ["Tutor", "Virizz", "Viral 15"],
      rationale:
        "Remote upgrades are comparatively stable after RemoteRole normalization, while future-run ICE needs stricter remaining-ICE/runpath descriptor review before rollup readiness.",
      recommendedNextSteps: [
        "Aufgabe 014A Remote-Upgrades-Normalization-Dry-Run",
        "Aufgabe 014B Future-run-ICE-Descriptor-Review",
      ],
    },
    cards,
    errors: sortByKey(hardErrors),
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
  const report = buildBatchThreeDiffReviewReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-3 diff review report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-3 diff review report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch3-diff-review.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH3_DIFF_REVIEW OK shapeDifferences=${report.shapeDifferenceCount} remoteRoles=${report.remoteRoleShapeDifferenceCount} futureRuns=${report.futureRunShapeDifferenceCount} boardContext=${report.boardContextRequiredCount} runpath=${report.runpathContextRequiredCount} descriptor=${report.descriptorContextRequiredCount} conflicts=${report.realSemanticConflictCount} split=${report.splitRecommendation.decision}\n`,
    );
  }

  if (report.hardErrorCount > 0 || report.realSemanticConflictCount > 0) {
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
