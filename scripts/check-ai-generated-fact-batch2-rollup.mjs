import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import prettier from "prettier";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 011";
const SCHEMA_VERSION = "ai-generated-fact-batch2-rollup-v1";
const BATCH_ID = "batch_2_breaker_target_trash_credit";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-011-batch2-generated-facts-rollup-report-2026-05-25.json";

const SOURCE_REPORTS = {
  derivedFacts: "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json",
  compiledIndex:
    "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json",
  migrationPriority:
    "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json",
  batchOneRollup:
    "docs/reviews/ai/aufgabe-007-batch1-generated-facts-rollup-report-2026-05-25.json",
  batchTwoDryRun:
    "docs/reviews/ai/aufgabe-008-generated-fact-batch2-dry-run-report-2026-05-25.json",
  batchTwoDiffReview:
    "docs/reviews/ai/aufgabe-009-batch2-diff-review-report-2026-05-25.json",
  batchTwoNormalization:
    "docs/reviews/ai/aufgabe-010-batch2-normalization-dry-run-report-2026-05-25.json",
};

const EXPECTED_BATCH_CARD_IDS = [
  "onr_v1_037_japanese-water-torture",
  "onr_v1_039_krash",
  "onr_v1_043_mystery-box",
  "onr_v1_048_poltergeist",
  "onr_v1_057_scatter-shot",
  "onr_v1_059_self-modifying-code",
];

const CARD_GUARDRAILS = {
  "onr_v1_037_japanese-water-torture": [
    "forgo_actions_side_effect_retained",
    "breaker_profile_does_not_create_break_legality",
  ],
  onr_v1_039_krash: [
    "universal_breaker_coverage_retained",
    "universal_coverage_not_reduced_to_single_ice_type",
  ],
  "onr_v1_043_mystery-box": [
    "free_install_cost_retained",
    "install_discount_retained",
    "top_five_stack_target_profile_not_full_stack",
  ],
  onr_v1_048_poltergeist: [
    "node_trash_credit_target_retained",
    "trash_credit_payment_legality_not_inferred",
  ],
  "onr_v1_057_scatter-shot": [
    "upgrade_trash_credit_target_retained",
    "trash_credit_payment_legality_not_inferred",
  ],
  "onr_v1_059_self-modifying-code": [
    "normal_install_cost_retained",
    "install_discount_not_generated",
    "full_stack_program_search_not_free_install",
  ],
};

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

async function stableStringify(value) {
  return prettier.format(JSON.stringify(value, null, 2), { parser: "json" });
}

async function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(
    repoPath(relativePath),
    await stableStringify(value),
    "utf8",
  );
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

function factLabel(fact) {
  if (typeof fact === "string") return fact;
  if (fact.fact) return fact.fact;
  if (fact.type === "effect") return `effect:${fact.kind}`;
  if (fact.type === "condition") return `condition:${fact.kind}`;
  if (fact.type === "targetProfile") return "targetProfile";
  if (fact.type === "breakerProfile") return "breakerProfile";
  if (fact.type === "costProfile") return "costProfile";
  return JSON.stringify(fact);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function factGroups(card) {
  const labels = [
    ...card.confirmedByGeneratedFacts.map((fact) => fact.fact),
    ...card.wouldAddToPreview.map(factLabel),
    ...card.generatedFactsInScope.map(factLabel),
    ...card.activeMechanicalFieldsInScope.map(factLabel),
  ];
  const groups = new Set();

  if (
    labels.some(
      (label) => label === "breakerProfile" || label === "effect:breaker",
    )
  ) {
    groups.add("breakerProfile");
  }
  if (
    labels.some(
      (label) =>
        label === "targetProfile" ||
        label === "effect:search" ||
        label === "effect:topdeck_info" ||
        label === "effect:install_discount" ||
        label === "condition:requires_during_run",
    )
  ) {
    groups.add("targetProfile");
  }
  if (labels.includes("effect:trash_credit")) {
    groups.add("trash_credit");
  }
  if (labels.includes("costProfile")) {
    groups.add("costProfile");
  }
  return [...groups].sort();
}

function activeConsumers(groups) {
  const consumers = new Set();
  if (groups.includes("breakerProfile")) {
    consumers.add("breaker_profile_consumer");
  }
  if (groups.includes("targetProfile")) {
    consumers.add("target_profile_diagnostic_consumer");
  }
  if (groups.includes("trash_credit")) {
    consumers.add("trash_credit_consumer");
  }
  if (groups.includes("costProfile")) {
    consumers.add("cost_profile_diagnostic_consumer");
  }
  return [...consumers].sort();
}

function warningFacts(card, kind) {
  return uniqueSorted(
    (card.warnings ?? [])
      .filter((warning) => warning.kind === kind)
      .map((warning) => warning.fact),
  );
}

function descriptorGapRemainingCount(derivedReport, batchCardIds) {
  return (derivedReport.cards ?? [])
    .filter((card) => batchCardIds.has(card.cardId))
    .reduce(
      (sum, card) =>
        sum +
        (card.descriptorGaps?.length ?? 0) +
        (card.missingManualOverlay?.length ?? 0),
      0,
    );
}

function normalizedCardById(normalizationReport, cardId) {
  return normalizationReport.cards.find((card) => card.cardId === cardId);
}

function buildCardRollup(dryRunCard, normalizationReport) {
  const normalizedCard = normalizedCardById(
    normalizationReport,
    dryRunCard.cardId,
  );
  const confirmedGeneratedFacts = uniqueSorted(
    dryRunCard.confirmedByGeneratedFacts.map((fact) => fact.fact),
  );
  const previewAddedFacts = uniqueSorted(
    dryRunCard.wouldAddToPreview.map(factLabel),
  );
  const groups = factGroups(dryRunCard);
  const boardContextRequired = uniqueSorted(
    (normalizedCard?.boardContextInfos ?? []).map((info) => info.fact),
  );
  const normalizedDifferences = sortByKey(
    (normalizedCard?.normalizedEquivalences ?? []).map((difference) => ({
      fact: difference.fact,
      sourceWarningKind: difference.sourceWarningKind,
      rules: difference.rules,
      classification: difference.newClassification,
    })),
  );
  const remainingIssues = [
    ...(normalizedCard?.remainingDifferences ?? []),
    ...(normalizedCard?.realSemanticConflicts ?? []),
  ];

  return {
    cardId: dryRunCard.cardId,
    title: dryRunCard.title,
    factGroups: groups,
    priority: dryRunCard.priority,
    risk: dryRunCard.risk,
    confirmedGeneratedFacts,
    previewAddedFacts,
    generatedFactsAlreadyPresent: warningFacts(
      dryRunCard,
      "generated_fact_already_present",
    ),
    boardContextRequired,
    normalizedDifferences,
    activeConsumers: activeConsumers(groups),
    manualOverlayPresent: dryRunCard.manualOverlayFound,
    guardrails: CARD_GUARDRAILS[dryRunCard.cardId] ?? [],
    remainingIssues,
    futureMigrationReady: remainingIssues.length === 0,
    readiness:
      remainingIssues.length > 0
        ? "needs_review"
        : boardContextRequired.length > 0
          ? "ready_but_board_context_required"
          : "ready_for_future_generated_migration",
  };
}

function assertExpectedBatchCards(report, hardErrors) {
  const actual = [...(report.batchCardIds ?? [])].sort();
  const expected = [...EXPECTED_BATCH_CARD_IDS].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    hardErrors.push({
      kind: "unexpected_batch_card_ids",
      message:
        "Batch-2 dry-run card ids do not match the expected rollup scope.",
      expected,
      actual,
    });
  }
}

export function buildBatchTwoRollupReport() {
  const derivedReport = readJson(SOURCE_REPORTS.derivedFacts);
  const compiledReport = readJson(SOURCE_REPORTS.compiledIndex);
  const priorityReport = readJson(SOURCE_REPORTS.migrationPriority);
  const batchOneRollup = readJson(SOURCE_REPORTS.batchOneRollup);
  const dryRunReport = readJson(SOURCE_REPORTS.batchTwoDryRun);
  const diffReviewReport = readJson(SOURCE_REPORTS.batchTwoDiffReview);
  const normalizationReport = readJson(SOURCE_REPORTS.batchTwoNormalization);
  const hardErrors = [];

  assertExpectedBatchCards(dryRunReport, hardErrors);
  const batchCardIds = new Set(dryRunReport.batchCardIds ?? []);
  const cards = dryRunReport.cards
    .map((card) => buildCardRollup(card, normalizationReport))
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const readinessCounts = countBy(cards, (card) => card.readiness);
  const descriptorGaps = descriptorGapRemainingCount(
    derivedReport,
    batchCardIds,
  );
  const humanReviewCandidateCount = (
    compiledReport.reviewCandidates ?? []
  ).filter((candidate) => batchCardIds.has(candidate.cardId)).length;
  const deriverFollowupCandidateCount =
    normalizationReport.deriverFollowupCandidates?.length ?? 0;
  const monolithOnlyMechanicalFactCount =
    dryRunReport.warningCountsByKind?.monolith_only_mechanical_fact ?? 0;
  const remainingDifferenceCount =
    normalizationReport.remainingShapeDifferenceCount +
    normalizationReport.remainingTargetProfileDifferenceCount +
    normalizationReport.remainingTrashCreditTargetDifferenceCount +
    normalizationReport.remainingCostProfileDifferenceCount;
  const totalHardErrorCount =
    hardErrors.length +
    derivedReport.hardErrorCount +
    compiledReport.hardErrorCount +
    dryRunReport.hardErrorCount +
    normalizationReport.hardErrorCount;
  const futureMigrationReady =
    totalHardErrorCount === 0 &&
    dryRunReport.conflictCount === 0 &&
    diffReviewReport.realSemanticConflictCount === 0 &&
    normalizationReport.realSemanticConflictCount === 0 &&
    remainingDifferenceCount === 0 &&
    monolithOnlyMechanicalFactCount === 0 &&
    deriverFollowupCandidateCount === 0 &&
    descriptorGaps === 0 &&
    humanReviewCandidateCount === 0 &&
    cards.every((card) => card.futureMigrationReady);

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    sourceReports: Object.values(SOURCE_REPORTS),
    batch: BATCH_ID,
    mode: "read-only rollup; no active hint migration, no runtime compile, no planner or consumer binding",
    batchCardCount: dryRunReport.batchCardCount,
    confirmedGeneratedFactCount: dryRunReport.confirmedFactCount,
    previewAddedFactCount: dryRunReport.previewAddedFactCount,
    previewChangedCardCount: dryRunReport.previewChangedCardCount,
    hardErrorCount: totalHardErrorCount,
    conflictCount: dryRunReport.conflictCount,
    realSemanticConflictCount:
      diffReviewReport.realSemanticConflictCount +
      normalizationReport.realSemanticConflictCount,
    shapeDifferenceCount: dryRunReport.shapeDifferenceCount,
    normalizedDifferenceCount: normalizationReport.normalizedDifferenceCount,
    remainingShapeDifferenceCount:
      normalizationReport.remainingShapeDifferenceCount,
    remainingTargetProfileDifferenceCount:
      normalizationReport.remainingTargetProfileDifferenceCount,
    remainingTrashCreditTargetDifferenceCount:
      normalizationReport.remainingTrashCreditTargetDifferenceCount,
    remainingCostProfileDifferenceCount:
      normalizationReport.remainingCostProfileDifferenceCount,
    boardContextInfoCount: normalizationReport.boardContextInfoCount,
    monolithOnlyMechanicalFactCount,
    deriverFollowupCandidateCount,
    descriptorGapRemainingCount: descriptorGaps,
    humanReviewCandidateCount,
    consumerActiveForFactTypeCount:
      dryRunReport.warningCountsByKind?.consumer_active_for_fact_type ?? 0,
    legacyKeepForCompatCount:
      dryRunReport.infoCountsByKind?.legacy_keep_for_compat ?? 0,
    futureMigrationReadyCardCount: cards.filter(
      (card) => card.futureMigrationReady,
    ).length,
    readinessCounts,
    batchTwoStatus: futureMigrationReady
      ? "future_migration_ready_read_only"
      : "needs_followup",
    normalizationRuleCounts: normalizationReport.normalizationRuleCounts,
    boardContextRules: [
      {
        kind: "breakerProfile",
        rule: "Generated BreakerProfile describes static card function only; actual breaking remains Encounter, LegalAction, Engine and effectiveRunQuote state.",
        appliesTo: ["breakerProfile", "effect:breaker"],
      },
      {
        kind: "targetProfiles",
        rule: "Generated TargetProfiles describe search/install target shape; actual search and install legality remain Engine/LegalAction state.",
        appliesTo: [
          "condition:requires_during_run",
          "effect:search",
          "effect:install_discount",
          "targetProfile",
        ],
      },
      {
        kind: "trashCredits",
        rule: "Generated trash-credit facts describe dedicated credit sources only; actual use and payment remain Cost/LegalAction-gated and card-specific targets must not be swapped.",
        appliesTo: ["effect:trash_credit"],
      },
      {
        kind: "costProfile",
        rule: "Mechanical costs can be generated later, but reserveRisk and opportunityCost remain strategy/overlay fields until an active migration explicitly splits them.",
        appliesTo: ["costProfile"],
      },
      {
        kind: "legacyCompatibility",
        rule: "roles, planRoles, aiSupportStatus, lineSupport and quality remain active monolith/overlay fields and are not changed by this rollup.",
        appliesTo: [
          "roles",
          "planRoles",
          "aiSupportStatus",
          "lineSupport",
          "quality",
        ],
      },
    ],
    cards,
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 012",
      batchName: "batch_3_remote_role_future_run_ice",
      recommendation: "Option A",
      rationale:
        "RemoteRole and future-run ICE are the next important mechanical category after the conflict-free Batch 1 and Batch 2 paths. RemoteRole facts already have diagnostic/consumer value, while future-run and future-encounter effects need explicit board/runpath context in the same read-only style.",
      candidateCards: [
        "onr_v1_274_tutor",
        "onr_v1_277_virizz",
        "onr_v1_276_viral-15",
        "onr_v1_355_crystal-palace-station-grid",
        "onr_v1_366_red-herrings",
      ],
      riskMitigation:
        "Keep RemoteRole/run_tax/agenda_steal_tax separate from future_run/future_encounter facts, and classify board/runpath context before any rollup readiness claim.",
      fallbackOption: {
        recommendedTaskId: "Aufgabe 012A",
        batchName: "batch_3_remote_upgrades_only",
        rationale:
          "If the future-run ICE slice looks too broad, Crystal Palace Station Grid and Red Herrings form a smaller RemoteRole-only batch with clearer run_tax/agenda_steal_tax boundaries.",
        candidateCards: [
          "onr_v1_355_crystal-palace-station-grid",
          "onr_v1_366_red-herrings",
        ],
      },
      deferredAlternatives: [
        {
          option: "Option B",
          batchName: "runner_information_central_pressure",
          reasonToDefer:
            "R&D-Protocol Files and Deep Thought are useful but smaller and more strategy-overlay-heavy than RemoteRole/future-run mechanics.",
        },
      ],
    },
    sourceSummary: {
      derivedFacts: {
        hardErrorCount: derivedReport.hardErrorCount,
        warningCount: derivedReport.warningCount,
        cardsNeedingManualOverlay: derivedReport.cardsNeedingManualOverlay,
      },
      compiledIndex: {
        hardErrorCount: compiledReport.hardErrorCount,
        warningCount: compiledReport.warningCount,
        reviewCandidates: compiledReport.reviewCandidates.length,
      },
      migrationPriority: {
        candidateCount: priorityReport.candidateCount,
        priorityCounts: priorityReport.priorityCounts,
        riskCounts: priorityReport.riskCounts,
      },
      batchOneRollup: {
        batchOneStatus: batchOneRollup.batchOneStatus,
        confirmedGeneratedFactCount: batchOneRollup.confirmedGeneratedFactCount,
      },
      batchTwoDryRun: {
        warningCount: dryRunReport.warningCount,
        warningCountsByKind: dryRunReport.warningCountsByKind,
        infoCountsByKind: dryRunReport.infoCountsByKind,
      },
      batchTwoDiffReview: {
        realSemanticConflictCount: diffReviewReport.realSemanticConflictCount,
        classificationCounts: diffReviewReport.classificationCounts,
      },
      batchTwoNormalization: {
        normalizedDifferenceCount:
          normalizationReport.normalizedDifferenceCount,
        boardContextInfoCount: normalizationReport.boardContextInfoCount,
        remainingDifferenceCount,
      },
    },
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

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = buildBatchTwoRollupReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-2 rollup report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-2 rollup report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch2-rollup.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH2_ROLLUP OK cards=${report.batchCardCount} confirmed=${report.confirmedGeneratedFactCount} previewAdds=${report.previewAddedFactCount} status=${report.batchTwoStatus}\n`,
    );
  }

  if (
    report.hardErrorCount > 0 ||
    report.batchTwoStatus !== "future_migration_ready_read_only"
  ) {
    process.exitCode = 1;
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
