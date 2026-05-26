import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 014";
const SCHEMA_VERSION = "ai-generated-fact-batch3-closeout-v1";
const BATCH_ID = "batch_3_remote_role_future_run_ice";
const DRY_RUN_REPORT_PATH =
  "docs/reviews/ai/aufgabe-012-generated-fact-batch3-dry-run-report-2026-05-25.json";
const DIFF_REVIEW_REPORT_PATH =
  "docs/reviews/ai/aufgabe-013-batch3-diff-review-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-014-batch3-closeout-report-2026-05-25.json";

const NORMALIZATION_RULES = [
  "remote_role_run_tax_normalization",
  "remote_role_agenda_steal_tax_normalization",
  "future_run_remaining_ice_context_normalization",
  "future_run_program_trash_context_normalization",
  "active_state_context_normalization",
  "effective_run_quote_priority_annotation",
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

function factLabel(fact) {
  if (typeof fact === "string") return fact;
  if (fact.fact) return fact.fact;
  if (fact.type === "effect") return `effect:${fact.kind}`;
  if (fact.type === "condition") return `condition:${fact.kind}`;
  if (fact.type === "remoteRole") return "remoteRole";
  return fact.type ?? JSON.stringify(fact);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function factGroups(dryRunCard) {
  const labels = [
    ...dryRunCard.confirmedByGeneratedFacts.map((fact) => fact.fact),
    ...dryRunCard.generatedFactsInScope.map(factLabel),
  ];
  const groups = new Set();
  if (
    labels.some((label) =>
      [
        "remoteRole",
        "effect:run_tax",
        "condition:requires_accessed_card",
      ].includes(label),
    )
  ) {
    groups.add("remoteRole");
  }
  if (
    labels.some((label) =>
      [
        "effect:future_run_effect",
        "effect:future_encounter_effect",
        "effect:program_trash",
      ].includes(label),
    )
  ) {
    groups.add("future_run_ice");
  }
  if (labels.includes("effect:run_tax")) groups.add("run_tax");
  if (labels.includes("effect:program_trash")) groups.add("program_trash");
  return [...groups].sort();
}

function normalizationRuleCounts(classifications) {
  const counts = new Map(NORMALIZATION_RULES.map((rule) => [rule, 0]));
  for (const classification of classifications) {
    for (const rule of classification.normalizationRules ?? []) {
      if (counts.has(rule)) counts.set(rule, counts.get(rule) + 1);
    }
  }
  return Object.fromEntries(counts);
}

function normalizedDifferences(classifications) {
  return classifications
    .filter((classification) =>
      [
        "shape_difference",
        "remote_role_shape_difference",
        "future_run_shape_difference",
      ].includes(classification.sourceWarningKind),
    )
    .map((classification) => ({
      fact: classification.fact,
      sourceWarningKind: classification.sourceWarningKind,
      classification: classification.classification,
      rules: (classification.normalizationRules ?? []).filter((rule) =>
        NORMALIZATION_RULES.includes(rule),
      ),
      normalizedSemanticMeaning: classification.normalizedSemanticMeaning,
      rationale: classification.rationale,
    }));
}

function contextInfos(classifications, sourceWarningKind) {
  return classifications
    .filter(
      (classification) =>
        classification.sourceWarningKind === sourceWarningKind,
    )
    .map((classification) => ({
      fact: classification.fact,
      classification: classification.classification,
      rules: classification.normalizationRules ?? [],
      normalizedSemanticMeaning: classification.normalizedSemanticMeaning,
      rationale: classification.rationale,
    }));
}

function subBatchFor(card) {
  return card.recommendedSubBatch === "remote_upgrades_only"
    ? "remote_upgrades"
    : "future_run_ice";
}

function readinessFor(subBatch) {
  return subBatch === "remote_upgrades"
    ? "ready_read_only"
    : "ready_read_only_with_runpath_context";
}

function buildCardCloseout(diffCard, dryRunCard) {
  const classifications = diffCard.classifications ?? [];
  const subBatch = subBatchFor(diffCard);
  const normalized = normalizedDifferences(classifications);
  const boardContextInfos = contextInfos(
    classifications,
    "board_context_required",
  );
  const runpathContextInfos = contextInfos(
    classifications,
    "runpath_context_required",
  );
  const descriptorContextInfos = contextInfos(
    classifications,
    "descriptor_context_required",
  );
  const remainingIssues = diffCard.realSemanticConflicts ?? [];

  return {
    cardId: diffCard.cardId,
    title: diffCard.title,
    subBatch,
    factGroups: factGroups(dryRunCard),
    confirmedGeneratedFacts: uniqueSorted(
      dryRunCard.confirmedByGeneratedFacts.map((fact) => fact.fact),
    ),
    previewAddedFacts: uniqueSorted(
      dryRunCard.wouldAddToPreview.map(factLabel),
    ),
    normalizedDifferences: sortByKey(normalized),
    boardContextInfos: sortByKey(boardContextInfos),
    runpathContextInfos: sortByKey(runpathContextInfos),
    descriptorContextInfos: sortByKey(descriptorContextInfos),
    remainingIssues: sortByKey(remainingIssues),
    readiness:
      remainingIssues.length > 0 ? "needs_review" : readinessFor(subBatch),
  };
}

export function buildBatchThreeCloseoutReport() {
  const dryRunReport = readJson(DRY_RUN_REPORT_PATH);
  const diffReviewReport = readJson(DIFF_REVIEW_REPORT_PATH);
  const hardErrors = [];

  if (dryRunReport.hardErrorCount !== 0) {
    hardErrors.push({
      kind: "source_dry_run_has_hard_errors",
      message: "Aufgabe-012 dry-run has hard errors.",
    });
  }
  if (dryRunReport.conflictCount !== 0) {
    hardErrors.push({
      kind: "source_dry_run_has_conflicts",
      message: "Aufgabe-012 dry-run has conflicts.",
    });
  }
  if (diffReviewReport.hardErrorCount !== 0) {
    hardErrors.push({
      kind: "source_diff_review_has_hard_errors",
      message: "Aufgabe-013 diff review has hard errors.",
    });
  }
  if (diffReviewReport.realSemanticConflictCount !== 0) {
    hardErrors.push({
      kind: "source_diff_review_has_semantic_conflicts",
      message: "Aufgabe-013 diff review has semantic conflicts.",
    });
  }
  for (const fieldPath of collectKeyPaths(
    { dryRunReport, diffReviewReport },
    HIDDEN_INFO_FIELDS,
  )) {
    hardErrors.push({
      kind: "hidden_info_field",
      message: `Source report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }

  const dryById = new Map(
    dryRunReport.cards.map((card) => [card.cardId, card]),
  );
  const cards = diffReviewReport.cards
    .map((diffCard) =>
      buildCardCloseout(diffCard, dryById.get(diffCard.cardId)),
    )
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const classifications = diffReviewReport.cards.flatMap(
    (card) => card.classifications ?? [],
  );
  const normalizedDifferenceCount = cards.reduce(
    (sum, card) => sum + card.normalizedDifferences.length,
    0,
  );
  const boardContextInfoCount = cards.reduce(
    (sum, card) => sum + card.boardContextInfos.length,
    0,
  );
  const runpathContextInfoCount = cards.reduce(
    (sum, card) => sum + card.runpathContextInfos.length,
    0,
  );
  const descriptorContextInfoCount = cards.reduce(
    (sum, card) => sum + card.descriptorContextInfos.length,
    0,
  );
  const remainingIssues = cards.flatMap((card) =>
    card.remainingIssues.map((issue) => ({
      cardId: card.cardId,
      title: card.title,
      issue,
    })),
  );
  const remoteCards = cards.filter(
    (card) => card.subBatch === "remote_upgrades",
  );
  const futureCards = cards.filter(
    (card) => card.subBatch === "future_run_ice",
  );
  const remoteReady = remoteCards.every(
    (card) => card.remainingIssues.length === 0,
  );
  const futureReady = futureCards.every(
    (card) => card.remainingIssues.length === 0,
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sourceReports: [DRY_RUN_REPORT_PATH, DIFF_REVIEW_REPORT_PATH],
    mode: "read-only closeout; no active hint migration, no runtime compile, no planner or consumer binding",
    normalizationRuleCounts: normalizationRuleCounts(classifications),
    batchCardCount: cards.length,
    confirmedGeneratedFactCount: dryRunReport.confirmedFactCount,
    previewAddedFactCount: dryRunReport.previewAddedFactCount,
    hardErrorCount: hardErrors.length,
    conflictCount: dryRunReport.conflictCount,
    realSemanticConflictCount: diffReviewReport.realSemanticConflictCount,
    normalizedDifferenceCount,
    remainingDifferenceCount: remainingIssues.length,
    boardContextInfoCount,
    runpathContextInfoCount,
    descriptorContextInfoCount,
    readinessCounts: countBy(cards, (card) => card.readiness),
    splitDecision: {
      decision: "split_ready_subbatches",
      remoteUpgradesStatus: remoteReady ? "ready_read_only" : "needs_review",
      futureRunIceStatus: futureReady
        ? "ready_read_only_with_runpath_context"
        : "needs_future_run_descriptor_followup",
      rationale:
        "RemoteRole and future-run ICE can share the closeout report, but should remain logical subbatches because Future-run ICE requires stricter runpath and effectiveRunQuote context.",
      remoteUpgrades: ["Crystal Palace Station Grid", "Red Herrings"],
      futureRunIce: ["Tutor", "Virizz", "Viral 15"],
    },
    batchThreeStatus:
      hardErrors.length === 0 &&
      dryRunReport.conflictCount === 0 &&
      diffReviewReport.realSemanticConflictCount === 0 &&
      remainingIssues.length === 0
        ? "split_ready_subbatches_read_only"
        : "needs_followup",
    boardRunpathContextRules: [
      {
        kind: "remote_role",
        rule: "RemoteRole facts describe static card function; rezzed/active/same-server/fort context remains board state.",
      },
      {
        kind: "future_run_ice",
        rule: "Future-run facts describe future run consequences only; current relevance needs ongoing run, remaining ICE, later encounter and unbroken subroutine context.",
      },
      {
        kind: "effective_run_quote",
        rule: "For concrete path costs, effectiveRunQuote remains authoritative over generated static run_tax/future_run facts.",
      },
      {
        kind: "remote_protection",
        rule: "Remote protection remains strategy/overlay context, not a generated mechanical fact in this closeout.",
      },
    ],
    cards,
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 015",
      batchName: "corp_remote_upgrades_regions_longtail",
      recommendation: "Option C",
      rationale:
        "Batch 3 stabilizes RemoteRole/run-tax normalization; the next high-impact read-only pilot should extend that to Corp remote upgrades/regions because RemoteRole consumers already exist and score-conversion relevance is high.",
      candidateCards: [
        "Tesseract Fort Construction",
        "Namatoki Plaza",
        "Jenny Jett",
        "Olivia Salazar",
        "Rio de Janeiro City Grid",
        "Restrictive Net Zoning",
        "Black Ice Quality Assurance",
      ],
      riskBoundary:
        "Keep remote safety, reserve risk and strategy notes as overlay/context; generated facts may describe only mechanical RemoteRole/tax/protection descriptors.",
      fallbackBatch: {
        batchName: "breaker_icebreaker_longtail",
        rationale:
          "If Corp remote longtail proves too strategy-heavy, Breaker/Icebreaker longtail is the safer mechanical continuation after Batch 2.",
      },
    },
    remainingIssues: sortByKey(remainingIssues),
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
  const report = buildBatchThreeCloseoutReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-3 closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-3 closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch3-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH3_CLOSEOUT OK cards=${report.batchCardCount} normalized=${report.normalizedDifferenceCount} remaining=${report.remainingDifferenceCount} status=${report.batchThreeStatus}\n`,
    );
  }

  if (
    report.hardErrorCount > 0 ||
    report.realSemanticConflictCount > 0 ||
    report.remainingDifferenceCount > 0
  ) {
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
