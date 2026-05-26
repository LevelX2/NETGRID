import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 005";
const SCHEMA_VERSION = "ai-generated-fact-batch1-normalization-dry-run-v1";
const DIFF_REVIEW_REPORT_PATH =
  "docs/reviews/ai/aufgabe-004-batch1-compiler-diff-review-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-005-batch1-normalization-dry-run-report-2026-05-25.json";

const RULES = {
  trace_actor_target_scope: {
    appliesTo: "effect:trace",
    rationale:
      "Trace scope differences are normalized as actor=corp and target=runner when timing is compatible.",
  },
  tag_source_trace_success: {
    appliesTo: "effect:tag_source",
    rationale:
      "Tag-source timing differences are normalized to trigger=trace_success only for trace-success tag payoffs.",
  },
  tag_punish_payoff_amount_from_pair: {
    appliesTo: "effect:tag_punish_payoff",
    rationale:
      "Tag-punish payoff amount differences are normalized by inheriting the paired payload amount.",
  },
};

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

function orderedRuleCounts(normalizedEquivalences) {
  const counts = new Map();
  for (const equivalence of normalizedEquivalences) {
    counts.set(equivalence.rule, (counts.get(equivalence.rule) ?? 0) + 1);
  }
  return Object.fromEntries(
    Object.keys(RULES).map((rule) => [rule, counts.get(rule) ?? 0]),
  );
}

function normalizeShapeDifference(shapeDifference) {
  if (
    shapeDifference.fact === "effect:trace" &&
    shapeDifference.activeValue?.kind === "trace" &&
    shapeDifference.generatedValue?.kind === "trace" &&
    shapeDifference.activeValue?.timing ===
      shapeDifference.generatedValue?.timing
  ) {
    return {
      rule: "trace_actor_target_scope",
      normalizedForm: {
        kind: "trace",
        actor: "corp",
        target: "runner",
        timing: shapeDifference.generatedValue.timing,
        scope: "runner",
        boardContextRequired: true,
      },
      rationale: RULES.trace_actor_target_scope.rationale,
    };
  }

  if (
    shapeDifference.fact === "effect:tag_source" &&
    shapeDifference.activeValue?.kind === "tag_source" &&
    shapeDifference.generatedValue?.kind === "tag_source" &&
    shapeDifference.activeValue?.resource === "tags" &&
    shapeDifference.generatedValue?.resource === "tags" &&
    shapeDifference.activeValue?.amount ===
      shapeDifference.generatedValue?.amount
  ) {
    return {
      rule: "tag_source_trace_success",
      normalizedForm: {
        kind: "tag_source",
        trigger: "trace_success",
        actor: "corp",
        target: "runner",
        resource: "tags",
        amount: shapeDifference.generatedValue.amount,
        boardContextRequired: true,
      },
      rationale: RULES.tag_source_trace_success.rationale,
    };
  }

  if (
    shapeDifference.fact === "effect:tag_punish_payoff" &&
    shapeDifference.activeValue?.kind === "tag_punish_payoff" &&
    shapeDifference.generatedValue?.kind === "tag_punish_payoff" &&
    shapeDifference.activeValue?.resource ===
      shapeDifference.generatedValue?.resource &&
    shapeDifference.activeValue?.amount !== undefined
  ) {
    return {
      rule: "tag_punish_payoff_amount_from_pair",
      normalizedForm: {
        kind: "tag_punish_payoff",
        resource: shapeDifference.generatedValue.resource,
        amount: shapeDifference.activeValue.amount,
        requires: ["requires_runner_tagged"],
        boardContextRequired: true,
      },
      rationale: RULES.tag_punish_payoff_amount_from_pair.rationale,
    };
  }

  return undefined;
}

function buildCardNormalization(card) {
  const normalizedEquivalences = [];
  const remainingDifferences = [];
  for (const shapeDifference of card.shapeDifferences ?? []) {
    const normalization = normalizeShapeDifference(shapeDifference);
    if (!normalization) {
      remainingDifferences.push(shapeDifference);
      continue;
    }
    normalizedEquivalences.push({
      fact: shapeDifference.fact,
      rule: normalization.rule,
      oldClassification: shapeDifference.classification,
      newClassification: "normalized_equivalent",
      normalizedForm: normalization.normalizedForm,
      activeValue: shapeDifference.activeValue,
      generatedValue: shapeDifference.generatedValue,
      rationale: normalization.rationale,
      safetyBoundary:
        "Comparator-only normalization; does not assert current legal action or runtime trace success.",
      conflict: false,
    });
  }
  return {
    cardId: card.cardId,
    title: card.title,
    normalizedEquivalences: sortByKey(normalizedEquivalences),
    remainingDifferences: sortByKey(remainingDifferences),
    deriverFollowups: card.monolithOnlyMechanicalFacts ?? [],
  };
}

export function buildBatchOneNormalizationDryRunReport() {
  const diffReview = readJson(DIFF_REVIEW_REPORT_PATH);
  const cards = (diffReview.cards ?? [])
    .map(buildCardNormalization)
    .filter(
      (card) =>
        card.normalizedEquivalences.length > 0 ||
        card.remainingDifferences.length > 0 ||
        card.deriverFollowups.length > 0,
    )
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const normalizedEquivalences = cards.flatMap(
    (card) => card.normalizedEquivalences,
  );
  const remainingUnnormalizedDifferences = cards.flatMap((card) =>
    card.remainingDifferences.map((difference) => ({
      cardId: card.cardId,
      title: card.title,
      ...difference,
    })),
  );
  const deriverFollowupCandidates = cards.flatMap((card) =>
    card.deriverFollowups.map((followup) => ({
      cardId: card.cardId,
      title: card.title,
      ...followup,
    })),
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    sourceDiffReviewReport: DIFF_REVIEW_REPORT_PATH,
    normalizationRulesApplied: Object.entries(RULES).map(([kind, rule]) => ({
      kind,
      appliesTo: rule.appliesTo,
      rationale: rule.rationale,
      scope:
        "read-only comparator normalization; no runtime, planner, consumer or active hint effect",
    })),
    normalizationRuleCounts: orderedRuleCounts(normalizedEquivalences),
    normalizedShapeDifferenceCount: normalizedEquivalences.length,
    remainingShapeDifferenceCount: remainingUnnormalizedDifferences.length,
    realSemanticConflictCount: diffReview.realSemanticConflictCount,
    normalizedEquivalencesByCard: cards.map((card) => ({
      cardId: card.cardId,
      title: card.title,
      normalizedCount: card.normalizedEquivalences.length,
      remainingCount: card.remainingDifferences.length,
    })),
    remainingUnnormalizedDifferences: sortByKey(
      remainingUnnormalizedDifferences,
    ),
    deriverFollowupCandidates: sortByKey(deriverFollowupCandidates),
    cards,
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
  const report = buildBatchOneNormalizationDryRunReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed batch-one normalization dry-run report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated batch-one normalization dry-run report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch1-normalization-dry-run.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH1_NORMALIZATION_DRY_RUN OK normalized=${report.normalizedShapeDifferenceCount} remaining=${report.remainingShapeDifferenceCount} conflicts=${report.realSemanticConflictCount}\n`,
    );
  }

  if (report.realSemanticConflictCount > 0) process.exitCode = 1;
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
