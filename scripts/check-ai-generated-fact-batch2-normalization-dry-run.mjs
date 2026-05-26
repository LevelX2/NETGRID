import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 010";
const SCHEMA_VERSION = "ai-generated-fact-batch2-normalization-dry-run-v1";
const DIFF_REVIEW_REPORT_PATH =
  "docs/reviews/ai/aufgabe-009-batch2-diff-review-report-2026-05-25.json";
const DRY_RUN_REPORT_PATH =
  "docs/reviews/ai/aufgabe-008-generated-fact-batch2-dry-run-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-010-batch2-normalization-dry-run-report-2026-05-25.json";

const RULES = {
  target_profile_install_cost_normalization: {
    appliesTo: ["targetProfile", "effect:install_discount"],
    rationale:
      "SMC normal-cost target installs and Mystery Box free installs stay distinct while comparing targetProfile/install_discount shape.",
    safetyBoundary:
      "Comparator-only; does not create install legality, cost payment or an install_discount for SMC.",
  },
  target_profile_stack_search_normalization: {
    appliesTo: ["targetProfile"],
    rationale:
      "Full-stack search and top-five stack look/install are normalized as distinct target-profile classes.",
    safetyBoundary:
      "Comparator-only; does not equate stack search with top-five stack reveal/install.",
  },
  trash_credit_target_normalization: {
    appliesTo: ["effect:trash_credit"],
    rationale:
      "Poltergeist node trash credits and Scatter Shot upgrade trash credits are normalized as target-specific trash-credit sources.",
    safetyBoundary:
      "Comparator-only; does not infer payment legality or swap node/upgrade targets.",
  },
  breaker_profile_shape_normalization: {
    appliesTo: ["breakerProfile"],
    rationale:
      "Breaker coverage, baseStrength defaults, pumpCost, breakCost and sideEffects are compared through one read-only normal form.",
    safetyBoundary:
      "Comparator-only; does not create break legality or replace Engine/effectiveRunQuote cost handling.",
  },
  cost_profile_split_normalization: {
    appliesTo: ["costProfile"],
    rationale:
      "Mechanical cost fields are split from strategic reserveRisk/opportunityCost overlay fields.",
    safetyBoundary:
      "Comparator-only; does not migrate strategic cost/risk hints into generated basic facts.",
  },
  board_context_required_classification: {
    appliesTo: [
      "condition:requires_during_run",
      "effect:install_discount",
      "effect:search",
      "targetProfile",
    ],
    rationale:
      "Board-/LegalAction-context notes are downgraded to explicit safety context, not unresolved migration warnings.",
    safetyBoundary:
      "Comparator-only; does not assert current playability or action availability.",
  },
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
const EXPECTED_BATCH_CARD_COUNT = 6;

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

function orderedRuleCounts(items) {
  const counts = new Map();
  for (const item of items) {
    const rules = item.rules ?? [item.rule];
    for (const rule of rules) counts.set(rule, (counts.get(rule) ?? 0) + 1);
  }
  return Object.fromEntries(
    Object.keys(RULES).map((rule) => [rule, counts.get(rule) ?? 0]),
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

function normalizedBreakerProfile(classification) {
  const generated = classification.generatedValue ?? {};
  const active = classification.activeValue ?? {};
  return {
    kind: "breakerProfile",
    coverage: generated.coverage ?? active.coverage,
    baseStrength:
      active.baseStrength !== undefined ? active.baseStrength : "not_generated",
    pumpCost: generated.pumpCost ?? active.pumpCost,
    breakCost: generated.breakCost ?? active.breakCost,
    sideEffects: generated.sideEffects ?? active.sideEffects ?? [],
    sourcePreference: "generated_mechanical_fields_with_active_defaults",
    legalityBoundary: "encounter_legalaction_required",
  };
}

function normalizedTargetProfile(classification) {
  const generated = classification.generatedValue ?? {};
  if (classification.cardId === "onr_v1_059_self-modifying-code") {
    return {
      kind: "targetProfile",
      profileClass: "full_stack_program_search_install",
      zone: "stack",
      targetCardType: "program",
      installsTarget: true,
      installCost: "normal",
      shuffleAfter: generated.shuffleAfter === true,
      discountEffect: false,
      legalityBoundary: "search_and_install_legalaction_required",
    };
  }
  if (classification.cardId === "onr_v1_043_mystery-box") {
    return {
      kind: "targetProfile",
      profileClass: "top_five_stack_program_look_install",
      zone: "stack_top",
      lookCount: 5,
      targetCardType: "program",
      installsTarget: true,
      installCost: "free",
      showToOpponent: true,
      oncePerRun: true,
      shuffleAfter: true,
      discountEffect: true,
      legalityBoundary: "search_and_install_legalaction_required",
    };
  }
  return {
    kind: "targetProfile",
    profileClass: "unclassified_target_profile",
    legalityBoundary: "search_and_install_legalaction_required",
  };
}

function normalizedTrashCredit(classification) {
  const target =
    classification.cardId === "onr_v1_048_poltergeist" ? "node" : "upgrade";
  return {
    kind: "trash_credit",
    resource: "trash_credits",
    target,
    amount: classification.activeValue?.amount ?? "not_generated",
    repeatable: classification.activeValue?.repeatable ?? "not_generated",
    legalityBoundary: "payment_legalaction_required",
  };
}

function normalizedCostProfile(classification) {
  return {
    kind: "costProfileSplit",
    mechanicalCostFields: classification.mechanicalCostFields ?? {},
    strategicOverlayFields: classification.strategicCostFields ?? {},
    generatedMigrationBoundary:
      "mechanical_costs_only; reserveRisk/opportunityCost remain strategy overlay",
  };
}

function normalizedInstallDiscount(classification) {
  return {
    kind: "install_discount",
    profileClass: "free_install_effect",
    cardId: classification.cardId,
    installCost: "free",
    targetProfileRequired: true,
    legalityBoundary: "engine_cost_context_required",
  };
}

function normalizedFormFor(classification, rule) {
  switch (rule) {
    case "breaker_profile_shape_normalization":
      return normalizedBreakerProfile(classification);
    case "target_profile_install_cost_normalization":
    case "target_profile_stack_search_normalization":
      return classification.fact === "effect:install_discount"
        ? normalizedInstallDiscount(classification)
        : normalizedTargetProfile(classification);
    case "trash_credit_target_normalization":
      return normalizedTrashCredit(classification);
    case "cost_profile_split_normalization":
      return normalizedCostProfile(classification);
    default:
      return {
        kind: classification.fact,
        legalityBoundary: "board_context_required",
      };
  }
}

function normalizeClassification(classification) {
  const rules = classification.normalizationRules ?? [
    classification.proposedFutureAction,
  ];
  if (classification.sourceWarningKind === "board_context_required") {
    return {
      type: "boardContextInfo",
      value: {
        fact: classification.fact,
        classification: classification.classification,
        rule: "board_context_required_classification",
        normalizedForm: {
          kind: classification.fact,
          contextClass: classification.classification,
          boardContextRequired: true,
          legalityBoundary:
            classification.classification ===
            "install_cost_requires_engine_cost_context"
              ? "engine_cost_context_required"
              : "search_or_target_legalaction_required",
        },
        activeValue: classification.activeValue,
        generatedValue: classification.generatedValue,
        rationale: RULES.board_context_required_classification.rationale,
        safetyBoundary:
          RULES.board_context_required_classification.safetyBoundary,
        conflict: false,
      },
    };
  }

  if (
    classification.classification === "real_semantic_conflict" ||
    rules.includes("block_until_reviewed")
  ) {
    return {
      type: "remainingDifference",
      value: {
        fact: classification.fact,
        sourceWarningKind: classification.sourceWarningKind,
        classification: classification.classification,
        activeValue: classification.activeValue,
        generatedValue: classification.generatedValue,
        rationale: classification.rationale,
        conflict: true,
      },
    };
  }

  return {
    type: "normalizedEquivalence",
    value: {
      fact: classification.fact,
      sourceWarningKind: classification.sourceWarningKind,
      oldClassification: classification.classification,
      newClassification:
        classification.sourceWarningKind === "cost_profile_shape_difference"
          ? "normalized_cost_profile_split"
          : "normalized_equivalent",
      rules,
      normalizedForms: rules.map((rule) => ({
        rule,
        form: normalizedFormFor(classification, rule),
        rationale: RULES[rule]?.rationale,
        safetyBoundary: RULES[rule]?.safetyBoundary,
      })),
      activeValue: classification.activeValue,
      generatedValue: classification.generatedValue,
      compiledPreviewValue: classification.compiledPreviewValue,
      manualOverlay: classification.manualOverlay,
      rationale: classification.rationale,
      conflict: false,
    },
  };
}

function buildCardNormalization(card) {
  const normalizedEquivalences = [];
  const boardContextInfos = [];
  const remainingDifferences = [];
  const realSemanticConflicts = [];

  for (const classification of card.classifications ?? []) {
    const result = normalizeClassification(classification);
    if (result.type === "normalizedEquivalence") {
      normalizedEquivalences.push(result.value);
    } else if (result.type === "boardContextInfo") {
      boardContextInfos.push(result.value);
    } else {
      remainingDifferences.push(result.value);
      if (result.value.conflict) realSemanticConflicts.push(result.value);
    }
  }

  return {
    cardId: card.cardId,
    title: card.title,
    normalizedEquivalences: sortByKey(normalizedEquivalences),
    boardContextInfos: sortByKey(boardContextInfos),
    remainingDifferences: sortByKey(remainingDifferences),
    realSemanticConflicts: sortByKey(realSemanticConflicts),
  };
}

function countRemainingByKind(remainingDifferences, sourceWarningKind) {
  return remainingDifferences.filter(
    (difference) => difference.sourceWarningKind === sourceWarningKind,
  ).length;
}

export function buildBatchTwoNormalizationDryRunReport() {
  const diffReview = readJson(DIFF_REVIEW_REPORT_PATH);
  const dryRun = readJson(DRY_RUN_REPORT_PATH);
  const hardErrors = [];

  if (diffReview.hardErrorCount !== 0) {
    addIssue(
      hardErrors,
      "source_diff_review_has_hard_errors",
      "Aufgabe-009 diff review has hard errors and cannot be normalized safely.",
    );
  }
  if (diffReview.realSemanticConflictCount !== 0) {
    addIssue(
      hardErrors,
      "source_diff_review_has_conflicts",
      "Aufgabe-009 diff review has semantic conflicts and cannot be normalized safely.",
    );
  }
  if ((dryRun.cards ?? []).length !== EXPECTED_BATCH_CARD_COUNT) {
    addIssue(
      hardErrors,
      "unexpected_batch_card_count",
      `Expected ${EXPECTED_BATCH_CARD_COUNT} Batch-2 cards but found ${
        dryRun.cards?.length ?? 0
      }.`,
    );
  }
  for (const fieldPath of collectKeyPaths(diffReview, HIDDEN_INFO_FIELDS)) {
    addIssue(
      hardErrors,
      "hidden_info_field",
      `Diff review report contains hidden-info field ${fieldPath}.`,
      { fieldPath },
    );
  }

  const cards = (diffReview.cards ?? [])
    .map(buildCardNormalization)
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const normalizedEquivalences = cards.flatMap(
    (card) => card.normalizedEquivalences,
  );
  const boardContextInfos = cards.flatMap((card) => card.boardContextInfos);
  const remainingDifferences = cards.flatMap((card) =>
    card.remainingDifferences.map((difference) => ({
      cardId: card.cardId,
      title: card.title,
      ...difference,
    })),
  );
  const realSemanticConflicts = cards.flatMap((card) =>
    card.realSemanticConflicts.map((conflict) => ({
      cardId: card.cardId,
      title: card.title,
      ...conflict,
    })),
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    sourceDiffReviewReport: DIFF_REVIEW_REPORT_PATH,
    sourceDryRunReport: DRY_RUN_REPORT_PATH,
    batch: diffReview.batch,
    mode: "read-only normalization dry-run; no active hint migration, no runtime compile, no planner or consumer binding",
    hardErrorCount: hardErrors.length,
    normalizationRulesApplied: Object.entries(RULES).map(([kind, rule]) => ({
      kind,
      appliesTo: rule.appliesTo,
      rationale: rule.rationale,
      safetyBoundary: rule.safetyBoundary,
      scope:
        "read-only comparator normalization; no runtime, planner, consumer or active hint effect",
    })),
    normalizationRuleCounts: orderedRuleCounts([
      ...normalizedEquivalences,
      ...boardContextInfos,
    ]),
    normalizedDifferenceCount: normalizedEquivalences.length,
    remainingShapeDifferenceCount: countRemainingByKind(
      remainingDifferences,
      "shape_difference",
    ),
    remainingTargetProfileDifferenceCount: countRemainingByKind(
      remainingDifferences,
      "target_profile_shape_difference",
    ),
    remainingTrashCreditTargetDifferenceCount: countRemainingByKind(
      remainingDifferences,
      "trash_credit_target_shape_difference",
    ),
    remainingCostProfileDifferenceCount: countRemainingByKind(
      remainingDifferences,
      "cost_profile_shape_difference",
    ),
    boardContextInfoCount: boardContextInfos.length,
    realSemanticConflictCount: realSemanticConflicts.length,
    normalizedEquivalencesByCard: cards.map((card) => ({
      cardId: card.cardId,
      title: card.title,
      normalizedCount: card.normalizedEquivalences.length,
      boardContextInfoCount: card.boardContextInfos.length,
      remainingCount: card.remainingDifferences.length,
    })),
    remainingDifferences: sortByKey(remainingDifferences),
    realSemanticConflicts: sortByKey(realSemanticConflicts),
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
  const report = buildBatchTwoNormalizationDryRunReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-2 normalization dry-run report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-2 normalization dry-run report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch2-normalization-dry-run.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH2_NORMALIZATION_DRY_RUN OK normalized=${report.normalizedDifferenceCount} remaining=${
        report.remainingShapeDifferenceCount +
        report.remainingTargetProfileDifferenceCount +
        report.remainingTrashCreditTargetDifferenceCount +
        report.remainingCostProfileDifferenceCount
      } boardContextInfos=${report.boardContextInfoCount} conflicts=${report.realSemanticConflictCount}\n`,
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
