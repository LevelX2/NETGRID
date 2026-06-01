import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 009";
const SCHEMA_VERSION = "ai-generated-fact-batch2-diff-review-v1";
const DRY_RUN_REPORT_PATH =
  "docs/reviews/ai/aufgabe-008-generated-fact-batch2-dry-run-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-009-batch2-diff-review-report-2026-05-25.json";
const OVERLAY_PATHS = ["data/ai/hints/overlays/onr-v1/runner/programs.json"];

const EXPECTED_WARNING_COUNTS = {
  shape_difference: 2,
  target_profile_shape_difference: 2,
  trash_credit_target_shape_difference: 0,
  cost_profile_shape_difference: 6,
  board_context_required: 7,
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

function readOverlayByCardId() {
  const overlays = new Map();
  for (const overlayPath of OVERLAY_PATHS) {
    if (!fs.existsSync(repoPath(overlayPath))) continue;
    const overlayFile = readJson(overlayPath);
    for (const card of overlayFile.cards ?? []) {
      overlays.set(card.cardId, {
        overlayPath,
        fields: Object.keys(card.overlay ?? {}).sort(),
        value: card.overlay ?? {},
      });
    }
  }
  return overlays;
}

function warningFacts(card, kind) {
  return (card.warnings ?? [])
    .filter((warning) => warning.kind === kind)
    .map((warning) => warning.fact)
    .filter(Boolean);
}

function consumerRelevant(card, fact) {
  return (card.warnings ?? []).some(
    (warning) =>
      warning.kind === "consumer_active_for_fact_type" && warning.fact === fact,
  );
}

function boardContextRequired(card, fact) {
  return (card.warnings ?? []).some(
    (warning) =>
      warning.kind === "board_context_required" && warning.fact === fact,
  );
}

function overlaySummary(overlays, cardId) {
  return overlays.get(cardId) ?? { fields: [], value: null };
}

function classifyShapeDifference(card, difference, overlays) {
  const overlay = overlaySummary(overlays, card.cardId);
  const base = {
    sourceWarningKind: "shape_difference",
    cardId: card.cardId,
    title: card.title,
    fact: difference.fact,
    activeValue: difference.active,
    generatedValue: difference.generated,
    compiledPreviewValue: card.compiledAfterMigrationPreview,
    manualOverlay: overlay,
    consumerRelevant: consumerRelevant(card, difference.fact),
    boardContextRequired: boardContextRequired(card, difference.fact),
    conflict: false,
  };

  if (difference.fact === "breakerProfile") {
    if (card.cardId === "onr_v1_037_japanese-water-torture") {
      return {
        ...base,
        normalizedSemanticMeaning:
          "Wall breaker with free break ability, pump action debt side effect, and pump/break details that need one common breakerProfile normal form.",
        classification: "generated_more_precise_than_monolith",
        rationale:
          "Generated facts preserve forgo_actions and expose pumpCost=1; the active monolith has the same coverage/side effect but carries legacy baseStrength/pumpCost shape.",
        proposedFutureAction: "breaker_profile_shape_normalization",
        normalizationRules: ["breaker_profile_shape_normalization"],
      };
    }
    return {
      ...base,
      normalizedSemanticMeaning:
        "Universal breaker with pumpCost=2 and breakCost=2; active baseStrength=0 is equivalent default shape.",
      classification: "semantic_equivalent_shape_difference",
      rationale:
        "Krash generated and active breaker profiles agree on universal coverage and costs; active baseStrength=0 is a harmless explicit default.",
      proposedFutureAction: "breaker_profile_shape_normalization",
      normalizationRules: ["breaker_profile_shape_normalization"],
    };
  }

  if (difference.fact === "effect:install_discount") {
    return {
      ...base,
      normalizedSemanticMeaning:
        "Mystery Box has a during-run free-install effect for the selected program; generated scope=runner and active scope=installed_card describe different sides of the same effect.",
      classification: "semantic_equivalent_shape_difference",
      rationale:
        "The targetProfile confirms installCost=free, so the install_discount scope mismatch is a shape issue, not an SMC-style discount error.",
      proposedFutureAction: "target_profile_install_cost_normalization",
      normalizationRules: ["target_profile_install_cost_normalization"],
    };
  }

  if (difference.fact === "effect:trash_credit") {
    return {
      ...base,
      normalizedSemanticMeaning:
        "Dedicated trash-credit source for the card's specific trash target; active monolith carries amount/repeatable while generated currently carries the source class.",
      classification: "monolith_more_specific_than_generated",
      rationale:
        "The generated fact confirms trash_credit but does not yet encode amount/repeatable or the card-specific node/upgrade target.",
      proposedFutureAction: "trash_credit_target_normalization",
      normalizationRules: ["trash_credit_target_normalization"],
    };
  }

  return {
    ...base,
    normalizedSemanticMeaning: "Unclassified Batch-2 shape difference.",
    classification: "real_semantic_conflict",
    rationale: "No safe Batch-2 shape classification exists for this fact.",
    proposedFutureAction: "block_until_reviewed",
    conflict: true,
  };
}

function classifyTargetProfileDifference(card, difference, overlays) {
  const profile = difference.generated ?? {};
  const overlay = overlaySummary(overlays, card.cardId);
  const isSmmc = card.cardId === "onr_v1_059_self-modifying-code";
  const isMysteryBox = card.cardId === "onr_v1_043_mystery-box";
  const installCostMeaning = isSmmc
    ? "normal-cost full-stack program install; explicitly not install_discount"
    : "free top-five stack program install with show-to-Corp and once-per-run limit";

  return {
    sourceWarningKind: "target_profile_shape_difference",
    cardId: card.cardId,
    title: card.title,
    fact: difference.fact,
    activeValue: difference.active,
    generatedValue: profile,
    compiledPreviewValue: card.compiledAfterMigrationPreview,
    manualOverlay: overlay,
    normalizedSemanticMeaning: installCostMeaning,
    consumerRelevant: consumerRelevant(card, difference.fact),
    boardContextRequired: boardContextRequired(card, difference.fact),
    conflict: false,
    classification:
      isSmmc || isMysteryBox
        ? "generated_more_precise_than_monolith"
        : "real_semantic_conflict",
    rationale: isSmmc
      ? "SMC generated targetProfile carries zone=stack, targetCardType=program, installsTarget=true and installCost=normal; the active monolith has search/condition but no structured targetProfile."
      : "Mystery Box generated targetProfile carries zone=stack_top, lookCount=5, targetCardType=program, installsTarget=true, installCost=free, showToOpponent and oncePerRun; the active monolith has only older search/discount shapes.",
    proposedFutureAction: isSmmc
      ? "target_profile_install_cost_normalization"
      : "target_profile_stack_search_normalization",
    normalizationRules: [
      "target_profile_install_cost_normalization",
      "target_profile_stack_search_normalization",
    ],
  };
}

function classifyTrashCreditDifference(card, difference, overlays) {
  const expectedTarget = card.expectedTrashCreditTarget;
  return {
    sourceWarningKind: "trash_credit_target_shape_difference",
    cardId: card.cardId,
    title: card.title,
    fact: difference.fact,
    activeValue: difference.active,
    generatedValue: difference.generated,
    compiledPreviewValue: card.compiledAfterMigrationPreview,
    manualOverlay: overlaySummary(overlays, card.cardId),
    normalizedSemanticMeaning:
      expectedTarget === "node"
        ? "Poltergeist provides dedicated trash credits for nodes."
        : "Scatter Shot provides dedicated trash credits for upgrades.",
    consumerRelevant: consumerRelevant(card, difference.fact),
    boardContextRequired: false,
    conflict: false,
    classification:
      expectedTarget === "node"
        ? "target_equivalent_node_trash_credit"
        : "target_equivalent_upgrade_trash_credit",
    rationale:
      "The dry-run keeps node/upgrade targets separate via card-specific context; generated currently confirms the credit source but not the full target/amount shape.",
    proposedFutureAction: "trash_credit_target_normalization",
    normalizationRules: ["trash_credit_target_normalization"],
  };
}

function splitCostProfile(activeValue) {
  const mechanicalFields = {};
  const strategicFields = {};
  for (const [key, value] of Object.entries(activeValue ?? {})) {
    if (["clicks", "credits", "memory"].includes(key)) {
      mechanicalFields[key] = value;
    } else if (["reserveRisk", "opportunityCost"].includes(key)) {
      strategicFields[key] = value;
    }
  }
  return { mechanicalFields, strategicFields };
}

function classifyCostProfileDifference(card, difference, overlays) {
  const split = splitCostProfile(difference.active);
  return {
    sourceWarningKind: "cost_profile_shape_difference",
    cardId: card.cardId,
    title: card.title,
    fact: "costProfile",
    activeValue: difference.active,
    generatedValue: difference.generated,
    compiledPreviewValue: card.compiledAfterMigrationPreview?.costProfile,
    manualOverlay: overlaySummary(overlays, card.cardId),
    normalizedSemanticMeaning:
      "CostProfile currently mixes mechanical install/MU costs with strategic reserve/opportunity risk and should be split before migration.",
    consumerRelevant: false,
    boardContextRequired: false,
    conflict: false,
    classification: "cost_profile_requires_overlay_split",
    mechanicalCostFields: split.mechanicalFields,
    strategicCostFields: split.strategicFields,
    rationale:
      "Mechanical clicks/credits/memory can be generated later where descriptors expose them; reserveRisk/opportunityCost are strategic/diagnostic overlay fields and should not be treated as generated basic facts.",
    proposedFutureAction: "cost_profile_split_normalization",
    normalizationRules: ["cost_profile_split_normalization"],
  };
}

function classifyBoardContextWarning(card, warning, overlays) {
  let classification = "target_profile_requires_search_legalaction_context";
  if (warning.fact === "effect:install_discount") {
    classification = "install_cost_requires_engine_cost_context";
  }
  return {
    sourceWarningKind: "board_context_required",
    cardId: card.cardId,
    title: card.title,
    fact: warning.fact,
    activeValue: card.activeMechanicalFieldsInScope?.find(
      (fact) => `${fact.type}:${fact.kind}` === warning.fact,
    ),
    generatedValue: card.generatedFactsInScope?.find(
      (fact) =>
        `${fact.type}:${fact.kind}` === warning.fact ||
        (warning.fact === "targetProfile" && fact.type === "targetProfile"),
    ),
    compiledPreviewValue: card.compiledAfterMigrationPreview,
    manualOverlay: overlaySummary(overlays, card.cardId),
    normalizedSemanticMeaning:
      warning.fact === "effect:install_discount"
        ? "Free install remains an effect descriptor; actual cost handling and use legality stay Engine/LegalAction-gated."
        : "Search/target/during-run shape is mechanical, but actual playability remains Engine/LegalAction-gated.",
    consumerRelevant: consumerRelevant(card, warning.fact),
    boardContextRequired: true,
    conflict: false,
    classification,
    rationale:
      "Board-context warnings are not migration blockers; they document that generated facts must not become static playability claims.",
    proposedFutureAction: "board_context_required_classification",
    normalizationRules: ["board_context_required_classification"],
  };
}

function collectClassifications(card, overlays) {
  const shape = (card.shapeDifferences ?? []).map((difference) =>
    classifyShapeDifference(card, difference, overlays),
  );
  const targetProfiles = (card.targetProfileDifferences ?? []).map(
    (difference) => classifyTargetProfileDifference(card, difference, overlays),
  );
  const trashCredits = (card.trashCreditDifferences ?? []).map((difference) =>
    classifyTrashCreditDifference(card, difference, overlays),
  );
  const costProfiles = (card.costProfileDifferences ?? []).map((difference) =>
    classifyCostProfileDifference(card, difference, overlays),
  );
  const boardContexts = (card.warnings ?? [])
    .filter((warning) => warning.kind === "board_context_required")
    .map((warning) => classifyBoardContextWarning(card, warning, overlays));
  return sortByKey([
    ...shape,
    ...targetProfiles,
    ...trashCredits,
    ...costProfiles,
    ...boardContexts,
  ]);
}

function normalizationCandidates(classifications) {
  const rules = new Map();
  for (const classification of classifications) {
    const proposedRules = classification.normalizationRules ?? [
      classification.proposedFutureAction,
    ];
    if (proposedRules.includes("block_until_reviewed")) {
      continue;
    }
    for (const rule of proposedRules) {
      if (!rules.has(rule)) {
        rules.set(rule, {
          rule,
          appliesTo: [],
          rationale: normalizationRationale(rule),
        });
      }
      rules.get(rule).appliesTo.push({
        cardId: classification.cardId,
        title: classification.title,
        fact: classification.fact,
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

function normalizationRationale(rule) {
  return {
    target_profile_install_cost_normalization:
      "Keep SMC normal-cost target install and Mystery Box free install distinct while normalizing targetProfile/install_discount comparison shape.",
    target_profile_stack_search_normalization:
      "Represent full-stack search and top-five stack look/install as different stable targetProfile classes.",
    trash_credit_target_normalization:
      "Preserve Poltergeist=node and Scatter Shot=upgrade targets while comparing generated trash_credit to active amount/repeatable shape.",
    breaker_profile_shape_normalization:
      "Compare coverage, baseStrength defaults, pumpCost, breakCost and sideEffects in one breakerProfile normal form.",
    cost_profile_split_normalization:
      "Split mechanical install/MU costs from strategic reserveRisk/opportunityCost before future generated migration.",
    board_context_required_classification:
      "Treat search/install/during-run board context as info, not as a semantic conflict or migration blocker.",
  }[rule];
}

function buildCardReview(card, overlays) {
  const classifications = collectClassifications(card, overlays);
  const realSemanticConflicts = classifications.filter(
    (classification) =>
      classification.classification === "real_semantic_conflict",
  );
  return {
    cardId: card.cardId,
    title: card.title,
    classifications,
    normalizationCandidates: normalizationCandidates(classifications),
    remainingIssues: realSemanticConflicts.map((conflict) => conflict.fact),
    realSemanticConflicts,
    sourceWarningKinds: countBy(card.warnings ?? [], (warning) => warning.kind),
    warningFacts: {
      shape_difference: (card.shapeDifferences ?? []).map((item) => item.fact),
      target_profile_shape_difference: (
        card.targetProfileDifferences ?? []
      ).map((item) => item.fact),
      trash_credit_target_shape_difference: (
        card.trashCreditDifferences ?? []
      ).map((item) => item.fact),
      cost_profile_shape_difference: (card.costProfileDifferences ?? []).map(
        (item) => item.fact,
      ),
      board_context_required: warningFacts(card, "board_context_required"),
    },
  };
}

export function buildBatchTwoDiffReviewReport() {
  const dryRunReport = readJson(DRY_RUN_REPORT_PATH);
  const overlays = readOverlayByCardId();
  const hardErrors = [];

  if (dryRunReport.hardErrorCount !== 0) {
    addIssue(
      hardErrors,
      "source_dry_run_has_hard_errors",
      "Aufgabe-008 dry-run has hard errors and cannot be normalized safely.",
    );
  }
  if (dryRunReport.conflictCount !== 0) {
    addIssue(
      hardErrors,
      "source_dry_run_has_conflicts",
      "Aufgabe-008 dry-run has conflicts and cannot be normalized safely.",
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

  const cards = sortByKey(
    (dryRunReport.cards ?? []).map((card) => buildCardReview(card, overlays)),
  );
  const classifications = cards.flatMap((card) => card.classifications);
  const realSemanticConflicts = classifications.filter(
    (classification) =>
      classification.classification === "real_semantic_conflict",
  );
  const allNormalizationCandidates = normalizationCandidates(classifications);

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    sourceDryRunReport: DRY_RUN_REPORT_PATH,
    batch: dryRunReport.batch,
    mode: "read-only diff review; no active hint migration, no runtime compile, no planner or consumer binding",
    hardErrorCount: hardErrors.length,
    shapeDifferenceCount: dryRunReport.shapeDifferenceCount,
    targetProfileShapeDifferenceCount:
      dryRunReport.targetProfileDifferenceCount,
    trashCreditTargetShapeDifferenceCount:
      dryRunReport.trashCreditDifferenceCount,
    costProfileShapeDifferenceCount: dryRunReport.costProfileDifferenceCount,
    boardContextRequiredCount: dryRunReport.boardContextRequiredCount,
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
    normalizationRuleCandidates: allNormalizationCandidates,
    remainingIssueCount: realSemanticConflicts.length,
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
  const report = buildBatchTwoDiffReviewReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-2 diff review report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-2 diff review report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch2-diff-review.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH2_DIFF_REVIEW OK shapeDifferences=${report.shapeDifferenceCount} targetProfiles=${report.targetProfileShapeDifferenceCount} trashCredits=${report.trashCreditTargetShapeDifferenceCount} costProfiles=${report.costProfileShapeDifferenceCount} boardContext=${report.boardContextRequiredCount} conflicts=${report.realSemanticConflictCount}\n`,
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
