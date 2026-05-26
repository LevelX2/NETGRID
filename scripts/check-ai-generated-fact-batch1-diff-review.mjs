import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 004";
const SCHEMA_VERSION = "ai-generated-fact-batch1-diff-review-v1";
const DRY_RUN_REPORT_PATH =
  "docs/reviews/ai/aufgabe-003-generated-fact-batch1-dry-run-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-004-batch1-compiler-diff-review-report-2026-05-25.json";

const SHAPE_CLASSIFICATIONS = {
  "onr_v1_207_netwatch-operations-office|effect:tag_source":
    "board_context_shape_difference",
  "onr_v1_207_netwatch-operations-office|effect:trace":
    "monolith_more_specific_than_generated",
  "onr_v1_208_on-call-solo-team|effect:tag_punish_payoff":
    "monolith_more_specific_than_generated",
  "onr_v1_217_strike-force-kali|effect:tag_punish_payoff":
    "monolith_more_specific_than_generated",
  "onr_v1_283_audit-of-call-records|effect:trace":
    "monolith_more_specific_than_generated",
  "onr_v1_284_chance-observation|effect:trace":
    "monolith_more_specific_than_generated",
  "onr_v1_302_scorched-earth|effect:tag_punish_payoff":
    "monolith_more_specific_than_generated",
};

const SHAPE_RATIONALES = {
  board_context_shape_difference:
    "Generated and monolith describe the same nested board event at different levels of the trigger chain.",
  monolith_more_specific_than_generated:
    "The active monolith carries target/amount details that the generated fact does not yet encode.",
};

const FUTURE_ACTION_BY_CLASSIFICATION = {
  board_context_shape_difference: "normalization_rule_candidate",
  monolith_more_specific_than_generated: "deriver_followup_candidate",
};

const NORMALIZED_MEANING = {
  "onr_v1_207_netwatch-operations-office|effect:tag_source":
    "One tag is applied to the Runner after the scored-agenda trace succeeds.",
  "onr_v1_207_netwatch-operations-office|effect:trace":
    "Corp initiates a scored-agenda trace against the Runner.",
  "onr_v1_208_on-call-solo-team|effect:tag_punish_payoff":
    "If the Runner is tagged, the scored-agenda action deals one damage.",
  "onr_v1_217_strike-force-kali|effect:tag_punish_payoff":
    "If the Runner is tagged, the scored-agenda action deals two damage.",
  "onr_v1_283_audit-of-call-records|effect:trace":
    "Corp operation initiates a trace against the Runner.",
  "onr_v1_284_chance-observation|effect:trace":
    "Corp operation initiates a trace against the Runner.",
  "onr_v1_302_scorched-earth|effect:tag_punish_payoff":
    "If the Runner is tagged, the operation deals four damage.",
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

function orderedCounts(values, knownValues) {
  const counts = [...values].reduce(
    (map, value) => map.set(value, (map.get(value) ?? 0) + 1),
    new Map(),
  );
  return Object.fromEntries(
    knownValues.map((value) => [value, counts.get(value) ?? 0]),
  );
}

function shapeKey(cardId, shapeDifference) {
  return `${cardId}|${shapeDifference.fact}`;
}

function boardContextRequired(shapeDifference) {
  return [
    "effect:trace",
    "effect:tag_source",
    "effect:tag_punish_payoff",
  ].includes(shapeDifference.fact);
}

function buildShapeReview(card, shapeDifference) {
  const key = shapeKey(card.cardId, shapeDifference);
  const classification = SHAPE_CLASSIFICATIONS[key];
  if (!classification) {
    throw new Error(`Missing shape classification for ${key}`);
  }
  return {
    fact: shapeDifference.fact,
    effectKind: shapeDifference.generated?.kind ?? shapeDifference.active?.kind,
    timing: {
      active: shapeDifference.active?.timing,
      generated: shapeDifference.generated?.timing,
    },
    scope: {
      active: shapeDifference.active?.scope,
      generated: shapeDifference.generated?.scope,
    },
    resource: {
      active: shapeDifference.active?.resource,
      generated: shapeDifference.generated?.resource,
    },
    activeValue: shapeDifference.active,
    generatedValue: shapeDifference.generated,
    normalizedSemanticMeaning: NORMALIZED_MEANING[key],
    consumerRelevant: true,
    boardContextRequired: boardContextRequired(shapeDifference),
    conflict: false,
    classification,
    rationale: SHAPE_RATIONALES[classification],
    futureAction: FUTURE_ACTION_BY_CLASSIFICATION[classification],
  };
}

function activeMonolithOnlyFact(card) {
  if (card.cardId !== "onr_v1_199_employee-empowerment") return undefined;
  if (
    !(card.warnings ?? []).some(
      (warning) =>
        warning.kind === "monolith_only_mechanical_fact" &&
        warning.fact === "effect:draw",
    )
  ) {
    return undefined;
  }
  return card.activeMechanicalFieldsInScope.find(
    (fact) =>
      fact.type === "effect" &&
      fact.kind === "draw" &&
      fact.timing === "start_of_turn",
  );
}

function buildMonolithOnlyReview(card) {
  const activeValue = activeMonolithOnlyFact(card);
  if (!activeValue) return [];
  return [
    {
      fact: "effect:draw",
      activeValue,
      classification: "generated_deriver_gap",
      rationale:
        "Employee Empowerment has a mechanical start-of-turn draw in legacy scored-agenda flow, but the CardImplementation descriptor only exposes the activated draw-two ability.",
      futureAction: "descriptor_or_deriver_followup",
      mechanical: true,
      strategic: false,
      cleanupCandidate: false,
      overlayCandidate: false,
    },
  ];
}

function collectCards(dryRunReport) {
  return dryRunReport.cards
    .map((card) => {
      const shapeDifferences = (card.shapeDifferences ?? []).map((shape) =>
        buildShapeReview(card, shape),
      );
      const monolithOnlyMechanicalFacts = buildMonolithOnlyReview(card);
      if (
        shapeDifferences.length === 0 &&
        monolithOnlyMechanicalFacts.length === 0
      ) {
        return undefined;
      }
      return {
        cardId: card.cardId,
        title: card.title,
        shapeDifferences,
        monolithOnlyMechanicalFacts,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
}

export function buildBatchOneDiffReviewReport() {
  const dryRunReport = readJson(DRY_RUN_REPORT_PATH);
  const cards = collectCards(dryRunReport);
  const shapeDifferences = cards.flatMap((card) => card.shapeDifferences);
  const monolithOnly = cards.flatMap(
    (card) => card.monolithOnlyMechanicalFacts,
  );
  const realSemanticConflictCount = shapeDifferences.filter(
    (shape) => shape.classification === "real_semantic_conflict",
  ).length;
  const normalizationRuleCandidates = sortByKey([
    {
      kind: "trace_scope_participant_normalization",
      rationale:
        "Generated trace scope currently marks the Corp as trace initiator while the monolith marks Runner as target.",
      appliesTo: ["effect:trace"],
    },
    {
      kind: "nested_trace_success_timing_normalization",
      rationale:
        "Generated tag_source can be attached to the scored action while the monolith attaches it to trace_success.",
      appliesTo: ["effect:tag_source"],
    },
    {
      kind: "tag_punish_payoff_amount_from_payload",
      rationale:
        "Generated tag_punish_payoff can inherit amount from the paired damage/counter-economy payload.",
      appliesTo: ["effect:tag_punish_payoff"],
    },
  ]);
  const deriverFollowupCandidates = sortByKey([
    ...monolithOnly.map((fact) => ({
      cardId: "onr_v1_199_employee-empowerment",
      title: "Employee Empowerment",
      fact: fact.fact,
      rationale:
        "Add a descriptor/deriver source for the mechanical start-of-turn draw that currently lives in scored-agenda flow.",
    })),
    {
      cardId: "batch_1_trace_cards",
      title: "Trace cards",
      fact: "effect:trace",
      rationale:
        "Derive trace target/base amount where available instead of only deriving trace class.",
    },
    {
      cardId: "batch_1_tag_punish_cards",
      title: "Tag punish cards",
      fact: "effect:tag_punish_payoff",
      rationale:
        "Propagate payoff amount from paired damage or counter-economy generated facts.",
    },
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    sourceDryRunReport: DRY_RUN_REPORT_PATH,
    shapeDifferenceCount: shapeDifferences.length,
    monolithOnlyMechanicalFactCount: monolithOnly.length,
    realSemanticConflictCount,
    shapeDifferenceClassifications: orderedCounts(
      shapeDifferences.map((shape) => shape.classification),
      [
        "semantic_equivalent_shape_difference",
        "generated_more_precise_than_monolith",
        "monolith_more_specific_than_generated",
        "board_context_shape_difference",
        "needs_future_normalization_rule",
        "real_semantic_conflict",
      ],
    ),
    monolithOnlyClassifications: orderedCounts(
      monolithOnly.map((fact) => fact.classification),
      [
        "legacy_keep_for_compat",
        "manual_strategy_not_generated",
        "generated_deriver_gap",
        "monolith_mechanical_duplication_candidate",
        "potential_hint_cleanup_candidate",
      ],
    ),
    normalizationRuleCandidates,
    deriverFollowupCandidates,
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
  const report = buildBatchOneDiffReviewReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed batch-one diff review report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated batch-one diff review report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch1-diff-review.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH1_DIFF_REVIEW OK shapeDifferences=${report.shapeDifferenceCount} monolithOnly=${report.monolithOnlyMechanicalFactCount} conflicts=${report.realSemanticConflictCount}\n`,
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
