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
const TASK_ID = "Aufgabe 007";
const SCHEMA_VERSION = "ai-generated-fact-batch1-rollup-v1";
const BATCH_ID = "batch_1_scored_agenda_tag_punish";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-007-batch1-generated-facts-rollup-report-2026-05-25.json";

const SOURCE_REPORTS = {
  derivedFacts: "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json",
  compiledIndex:
    "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json",
  migrationPriority:
    "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json",
  batchOneDryRun:
    "docs/reviews/ai/aufgabe-003-generated-fact-batch1-dry-run-report-2026-05-25.json",
  batchOneDiffReview:
    "docs/reviews/ai/aufgabe-004-batch1-compiler-diff-review-report-2026-05-25.json",
  batchOneNormalization:
    "docs/reviews/ai/aufgabe-005-batch1-normalization-dry-run-report-2026-05-25.json",
  taskSixReview:
    "docs/reviews/ai/aufgabe-006-employee-empowerment-start-turn-draw-deriver-2026-05-25.md",
};

const BOARD_CONTEXT_FACTS = new Set([
  "condition:requires_scored_agenda",
  "condition:requires_trace_success",
  "condition:requires_runner_tagged",
  "effect:scored_agenda_action",
  "effect:trace",
  "effect:tag_source",
  "effect:tag_punish_payoff",
]);

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

function factGroups(facts) {
  const groups = new Set();
  for (const fact of facts) {
    if (
      fact === "effect:scored_agenda_action" ||
      fact === "condition:requires_scored_agenda"
    ) {
      groups.add("scored_agenda");
    }
    if (
      fact === "effect:trace" ||
      fact === "effect:tag_source" ||
      fact === "condition:requires_trace_success"
    ) {
      groups.add("trace_tag");
    }
    if (
      fact === "effect:tag_punish_payoff" ||
      fact === "condition:requires_runner_tagged" ||
      fact === "effect:damage"
    ) {
      groups.add("tag_punish");
    }
    if (
      fact === "effect:draw" ||
      fact === "effect:economy" ||
      fact === "effect:counter_economy" ||
      fact === "effect:extra_action"
    ) {
      groups.add("draw_economy_extra_action");
    }
  }
  return [...groups].sort();
}

function activeConsumers(groups) {
  const consumers = new Set();
  if (groups.includes("scored_agenda")) {
    consumers.add("scored_agenda_action_consumer");
  }
  if (groups.includes("trace_tag") || groups.includes("tag_punish")) {
    consumers.add("tag_punish_consumer");
  }
  if (groups.includes("draw_economy_extra_action")) {
    consumers.add("economy_draw_action_hint_consumer");
  }
  return [...consumers].sort();
}

function confirmedFactLabels(card) {
  return [
    ...new Set(card.confirmedByGeneratedFacts.map((fact) => fact.fact)),
  ].sort();
}

function issueKinds(card, kind) {
  return (card.warnings ?? [])
    .filter((warning) => warning.kind === kind)
    .map((warning) => warning.fact)
    .filter(Boolean)
    .sort();
}

function buildCardRollup(dryRunCard) {
  const confirmedGeneratedFacts = confirmedFactLabels(dryRunCard);
  const groups = factGroups(confirmedGeneratedFacts);
  const remainingIssues = [
    ...new Set(
      (dryRunCard.warnings ?? [])
        .filter(
          (warning) =>
            ![
              "board_context_required",
              "consumer_active_for_fact_type",
              "generated_fact_already_present",
              "shape_difference",
            ].includes(warning.kind),
        )
        .map((warning) => warning.kind),
    ),
  ].sort();
  const boardContextRequired = confirmedGeneratedFacts.filter((fact) =>
    BOARD_CONTEXT_FACTS.has(fact),
  );

  return {
    cardId: dryRunCard.cardId,
    title: dryRunCard.title,
    factGroups: groups,
    confirmedGeneratedFacts,
    generatedFactsAlreadyPresent: issueKinds(
      dryRunCard,
      "generated_fact_already_present",
    ),
    boardContextRequired,
    activeConsumers: activeConsumers(groups),
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

export function buildBatchOneRollupReport() {
  const derivedReport = readJson(SOURCE_REPORTS.derivedFacts);
  const compiledReport = readJson(SOURCE_REPORTS.compiledIndex);
  const priorityReport = readJson(SOURCE_REPORTS.migrationPriority);
  const dryRunReport = readJson(SOURCE_REPORTS.batchOneDryRun);
  const diffReviewReport = readJson(SOURCE_REPORTS.batchOneDiffReview);
  const normalizationReport = readJson(SOURCE_REPORTS.batchOneNormalization);
  const batchCardIds = new Set(dryRunReport.batchCardIds ?? []);
  const cards = dryRunReport.cards.map(buildCardRollup);
  const readinessCounts = countBy(cards, (card) => card.readiness);
  const descriptorGaps = descriptorGapRemainingCount(
    derivedReport,
    batchCardIds,
  );
  const humanReviewCandidateCount = (
    compiledReport.reviewCandidates ?? []
  ).filter((candidate) => batchCardIds.has(candidate.cardId)).length;
  const legacyKeepForCompatCount =
    dryRunReport.infoCountsByKind?.legacy_keep_for_compat ?? 0;
  const boardContextRequiredCount =
    dryRunReport.warningCountsByKind?.board_context_required ?? 0;
  const consumerActiveForFactTypeCount =
    dryRunReport.warningCountsByKind?.consumer_active_for_fact_type ?? 0;

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
    hardErrorCount:
      derivedReport.hardErrorCount +
      compiledReport.hardErrorCount +
      dryRunReport.hardErrorCount,
    conflictCount: dryRunReport.conflictCount,
    realSemanticConflictCount: diffReviewReport.realSemanticConflictCount,
    shapeDifferenceCount: diffReviewReport.shapeDifferenceCount,
    normalizedShapeDifferenceCount:
      normalizationReport.normalizedShapeDifferenceCount,
    remainingShapeDifferenceCount:
      normalizationReport.remainingShapeDifferenceCount,
    monolithOnlyMechanicalFactCount:
      diffReviewReport.monolithOnlyMechanicalFactCount,
    deriverFollowupCandidateCount:
      normalizationReport.deriverFollowupCandidates.length,
    descriptorGapRemainingCount: descriptorGaps,
    humanReviewCandidateCount,
    boardContextRequiredCount,
    consumerActiveForFactTypeCount,
    legacyKeepForCompatCount,
    futureMigrationReadyCardCount: cards.filter(
      (card) => card.futureMigrationReady,
    ).length,
    readinessCounts,
    batchOneStatus:
      dryRunReport.hardErrorCount === 0 &&
      dryRunReport.conflictCount === 0 &&
      diffReviewReport.realSemanticConflictCount === 0 &&
      normalizationReport.remainingShapeDifferenceCount === 0 &&
      diffReviewReport.monolithOnlyMechanicalFactCount === 0 &&
      normalizationReport.deriverFollowupCandidates.length === 0 &&
      descriptorGaps === 0 &&
      humanReviewCandidateCount === 0
        ? "future_migration_ready_read_only"
        : "needs_followup",
    boardContextRules: [
      {
        kind: "scored_agenda",
        rule: "Generated facts describe card function; actual use remains gated by scored status and Engine LegalActions.",
        appliesTo: [
          "effect:scored_agenda_action",
          "condition:requires_scored_agenda",
        ],
      },
      {
        kind: "trace_tag",
        rule: "Trace and tag-source facts describe the action path; tags only happen after runtime trace success.",
        appliesTo: [
          "effect:trace",
          "effect:tag_source",
          "condition:requires_trace_success",
        ],
      },
      {
        kind: "tag_punish",
        rule: "Tag-punish facts require visible Runner tag state and must not be scored without LegalAction context.",
        appliesTo: [
          "effect:tag_punish_payoff",
          "condition:requires_runner_tagged",
        ],
      },
      {
        kind: "start_of_turn_draw",
        rule: "Start-of-turn draw describes passive/triggered card function only; it is not an action legality signal.",
        appliesTo: ["effect:draw"],
      },
    ],
    cards,
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 008",
      batchName: "batch_2_breaker_target_trash_credit",
      recommendation: "Option A",
      rationale:
        "BreakerProfile, TargetProfiles and dedicated trash-credit facts are more mechanically stable than future-run ICE, already have relevant diagnostic/consumer value, and bridge generated facts toward Runner setup and cost/trash planning without needing runtime migration.",
      candidateCards: [
        "onr_v1_037_japanese-water-torture",
        "onr_v1_039_krash",
        "onr_v1_043_mystery-box",
        "onr_v1_048_poltergeist",
        "onr_v1_057_scatter-shot",
        "onr_v1_059_self-modifying-code",
      ],
      deferredCandidateCards: [
        {
          cardId: "onr_v1_050_r-and-d-protocol-files",
          reason:
            "Topdeck/access-replacement pressure is useful but fits the later information/pressure longtail better than the breaker/target/trash-credit batch.",
        },
      ],
      alternatives: [
        {
          option: "Option B",
          batchName: "remote_role_future_run_ice",
          reasonToDefer:
            "Future-run and remote-role semantics are more board/runpath-context-sensitive and should follow after the lower-risk breaker/target batch.",
        },
        {
          option: "Option C",
          batchName: "runner_information_pressure",
          reasonToDefer:
            "R&D/topdeck pressure is smaller and more strategy-overlay-heavy than the mechanically focused Batch 2A candidate.",
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
      batchOneDryRun: {
        warningCount: dryRunReport.warningCount,
        warningCountsByKind: dryRunReport.warningCountsByKind,
        infoCountsByKind: dryRunReport.infoCountsByKind,
      },
    },
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
  const report = buildBatchOneRollupReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed batch-one rollup report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated batch-one rollup report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch1-rollup.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH1_ROLLUP OK cards=${report.batchCardCount} confirmed=${report.confirmedGeneratedFactCount} status=${report.batchOneStatus}\n`,
    );
  }

  if (
    report.hardErrorCount > 0 ||
    report.batchOneStatus !== "future_migration_ready_read_only"
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
