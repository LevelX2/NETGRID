import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const SCHEMA_VERSION = "ai-generated-fact-batch1-dry-run-v1";
const TASK_ID = "Aufgabe 003";
const BATCH_ID = "batch_1_scored_agenda_tag_punish";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const MIGRATION_PRIORITY_REPORT_PATH =
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-003-generated-fact-batch1-dry-run-report-2026-05-25.json";

const BATCH_NUMBER = 1;
const KNOWN_BATCHES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const IN_SCOPE_EFFECT_KINDS = new Set([
  "scored_agenda_action",
  "economy",
  "counter_economy",
  "draw",
  "extra_action",
  "trace",
  "tag_source",
  "damage",
  "tag_punish_payoff",
]);
const IN_SCOPE_CONDITION_KINDS = new Set([
  "requires_scored_agenda",
  "requires_trace_success",
  "requires_runner_tagged",
]);
const KNOWN_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);
const KNOWN_RISKS = new Set(["low", "medium", "high"]);
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
const FORBIDDEN_PREVIEW_FIELDS = new Set([
  "aiSupportStatus",
  "roles",
  "planRoles",
  "lineSupport",
  "quality",
  "manualNotes",
  "strategicNotes",
  "descriptorGaps",
  "opponentSignals",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
  "costProfile",
]);
const BOARD_CONTEXT_KINDS = new Set([
  "scored_agenda_action",
  "trace",
  "tag_source",
  "tag_punish_payoff",
  "requires_scored_agenda",
  "requires_trace_success",
  "requires_runner_tagged",
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

function countByKind(items) {
  return Object.fromEntries(
    [
      ...items
        .reduce(
          (counts, item) =>
            counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1),
          new Map(),
        )
        .entries(),
    ].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function normalizeEffect(effect) {
  return {
    kind: effect.kind,
    timing: effect.timing,
    scope: effect.scope,
    resource: effect.resource,
    amount: effect.amount,
  };
}

function normalizeCondition(condition) {
  return {
    kind: condition.kind,
  };
}

function factKey(fact) {
  return [
    fact.type,
    fact.kind,
    fact.timing ?? "",
    fact.scope ?? "",
    fact.resource ?? "",
    fact.amount ?? "",
  ].join(":");
}

function semanticFactKey(fact) {
  if (fact.type === "effect" && fact.kind === "tag_source") {
    return [fact.type, fact.kind, fact.resource ?? "", fact.amount ?? ""].join(
      ":",
    );
  }
  if (fact.type === "effect" && fact.kind === "tag_punish_payoff") {
    return [fact.type, fact.kind, fact.resource ?? ""].join(":");
  }
  return [fact.type, fact.kind, fact.timing ?? "", fact.resource ?? ""].join(
    ":",
  );
}

function factLabel(fact) {
  return fact.type === "condition"
    ? `condition:${fact.kind}`
    : `effect:${fact.kind}`;
}

function generatedFactsInScope(derivedCard) {
  const effects = (derivedCard?.derivedFacts?.effects ?? [])
    .filter((effect) => IN_SCOPE_EFFECT_KINDS.has(effect.kind))
    .map((effect) => ({
      type: "effect",
      ...normalizeEffect(effect),
      source: effect.source,
    }));
  const conditions = (derivedCard?.derivedFacts?.conditions ?? [])
    .filter((condition) => IN_SCOPE_CONDITION_KINDS.has(condition.kind))
    .map((condition) => ({
      type: "condition",
      ...normalizeCondition(condition),
      source: condition.source,
    }));
  return sortByKey([...effects, ...conditions]);
}

function activeFactsInScope(activeHint) {
  const effects = (activeHint?.effects ?? [])
    .filter((effect) => IN_SCOPE_EFFECT_KINDS.has(effect.kind))
    .map((effect) => ({
      type: "effect",
      ...normalizeEffect(effect),
      repeatable: effect.repeatable,
      finite: effect.finite,
    }));
  const conditions = (activeHint?.conditions ?? [])
    .filter((condition) => IN_SCOPE_CONDITION_KINDS.has(condition.kind))
    .map((condition) => ({
      type: "condition",
      ...normalizeCondition(condition),
    }));
  return sortByKey([...effects, ...conditions]);
}

function previewFromActive(activeHint, activeFacts, additions) {
  const effects = [...activeFacts, ...additions]
    .filter((fact) => fact.type === "effect")
    .map(({ type, source, ...effect }) => effect);
  const conditions = [...activeFacts, ...additions]
    .filter((fact) => fact.type === "condition")
    .map(({ type, source, ...condition }) => condition);
  return {
    cardId: activeHint.cardId,
    side: activeHint.side,
    cardType: activeHint.cardType,
    effects: sortByKey(effects),
    conditions: sortByKey(conditions),
  };
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

function addIssue(target, kind, message, details = {}) {
  target.push({ kind, message, ...details });
}

function compareGeneratedToActive(generatedFacts, activeFacts) {
  const exactActive = new Map(activeFacts.map((fact) => [factKey(fact), fact]));
  const semanticActive = new Map(
    activeFacts.map((fact) => [semanticFactKey(fact), fact]),
  );
  const confirmedByGeneratedFacts = [];
  const wouldAddToPreview = [];
  const shapeDifferences = [];
  const warnings = [];
  const infos = [];

  for (const generated of generatedFacts) {
    const exact = exactActive.get(factKey(generated));
    const semantic = semanticActive.get(semanticFactKey(generated));
    if (exact) {
      confirmedByGeneratedFacts.push({
        relation: "exact",
        fact: factLabel(generated),
        generated,
        active: exact,
      });
      addIssue(
        warnings,
        "generated_fact_already_present",
        `Generated ${factLabel(generated)} is already present in active monolith.`,
        { fact: factLabel(generated) },
      );
    } else if (semantic) {
      confirmedByGeneratedFacts.push({
        relation: "equivalent_shape_difference",
        fact: factLabel(generated),
        generated,
        active: semantic,
      });
      shapeDifferences.push({
        fact: factLabel(generated),
        generated,
        active: semantic,
      });
      addIssue(
        warnings,
        "shape_difference",
        `Generated ${factLabel(generated)} matches active monolith semantically but has a different shape.`,
        { fact: factLabel(generated) },
      );
    } else {
      wouldAddToPreview.push(generated);
      addIssue(
        warnings,
        "generated_fact_added_in_preview",
        `Generated ${factLabel(generated)} would be added to the preview.`,
        { fact: factLabel(generated) },
      );
    }

    if (BOARD_CONTEXT_KINDS.has(generated.kind)) {
      addIssue(
        warnings,
        "board_context_required",
        `Generated ${factLabel(generated)} must remain gated by board state or LegalActions.`,
        { fact: factLabel(generated) },
      );
    }
    addIssue(
      warnings,
      "consumer_active_for_fact_type",
      `Generated ${factLabel(generated)} belongs to the Batch-1 consumer-relevant fact set.`,
      { fact: factLabel(generated) },
    );
  }

  for (const active of activeFacts) {
    if (!semanticActive.has(semanticFactKey(active))) continue;
    if (
      !generatedFacts.some(
        (fact) => semanticFactKey(fact) === semanticFactKey(active),
      )
    ) {
      addIssue(
        warnings,
        "monolith_only_mechanical_fact",
        `Active monolith ${factLabel(active)} is in Batch-1 scope but not generated.`,
        { fact: factLabel(active) },
      );
    }
  }

  if (wouldAddToPreview.length === 0)
    addIssue(
      infos,
      "no_change_needed",
      "Dry-run preview adds no new Batch-1 fact.",
    );
  addIssue(
    infos,
    "preview_only",
    "Dry-run does not write ai-card-hints-active.json.",
  );
  addIssue(
    infos,
    "legacy_keep_for_compat",
    "roles, planRoles and aiSupportStatus remain active monolith fields.",
  );

  return {
    confirmedByGeneratedFacts: sortByKey(confirmedByGeneratedFacts),
    wouldAddToPreview: sortByKey(wouldAddToPreview),
    shapeDifferences: sortByKey(shapeDifferences),
    warnings: sortByKey(warnings),
    infos: sortByKey(infos),
  };
}

export function buildGeneratedFactMigrationDryRunReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const activeById = new Map(
    (activeHints.cards ?? []).map((card) => [card.cardId, card]),
  );
  const derivedById = new Map(
    (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const priorityById = new Map(
    (priorityReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const hardErrors = [];

  for (const card of priorityReport.cards ?? []) {
    if (!KNOWN_BATCHES.has(card.recommendedMigrationBatch)) {
      addIssue(
        hardErrors,
        "unknown_migration_batch",
        `Unknown migration batch ${card.recommendedMigrationBatch}.`,
        { cardId: card.cardId },
      );
    }
  }

  const batchCards = (priorityReport.cards ?? [])
    .filter((card) => card.recommendedMigrationBatch === BATCH_NUMBER)
    .sort((left, right) => left.cardId.localeCompare(right.cardId));

  const cards = batchCards.map((priorityCard) => {
    const activeHint = activeById.get(priorityCard.cardId);
    const derivedCard = derivedById.get(priorityCard.cardId);
    const priorityFound = priorityById.has(priorityCard.cardId);
    const activeHintFound = Boolean(activeHint);
    const derivedFactsFound = Boolean(derivedCard);
    if (!activeHintFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_active_hint",
        "Batch-1 card is missing from active monolith.",
        { cardId: priorityCard.cardId },
      );
    }
    if (!derivedFactsFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_derived_facts",
        "Batch-1 card is missing from derived facts report.",
        { cardId: priorityCard.cardId },
      );
    }
    if (!priorityFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_priority",
        "Batch-1 card is missing from migration priority report.",
        { cardId: priorityCard.cardId },
      );
    }
    if (!KNOWN_PRIORITIES.has(priorityCard.migrationPriority)) {
      addIssue(
        hardErrors,
        "unknown_migration_priority",
        `Unknown migration priority ${priorityCard.migrationPriority}.`,
        { cardId: priorityCard.cardId },
      );
    }
    if (!KNOWN_RISKS.has(priorityCard.migrationRisk)) {
      addIssue(
        hardErrors,
        "unknown_migration_risk",
        `Unknown migration risk ${priorityCard.migrationRisk}.`,
        { cardId: priorityCard.cardId },
      );
    }

    const generatedFacts = generatedFactsInScope(derivedCard);
    const activeFacts = activeFactsInScope(activeHint);
    for (const fieldPath of collectKeyPaths(
      generatedFacts,
      HIDDEN_INFO_FIELDS,
    )) {
      addIssue(
        hardErrors,
        "generated_hidden_info_field",
        `Generated facts contain hidden-info field ${fieldPath}.`,
        { cardId: priorityCard.cardId, fieldPath },
      );
    }

    const comparison = compareGeneratedToActive(generatedFacts, activeFacts);
    const compiledAfterMigrationPreview = previewFromActive(
      activeHint,
      activeFacts,
      comparison.wouldAddToPreview,
    );
    for (const fieldPath of collectKeyPaths(
      compiledAfterMigrationPreview,
      FORBIDDEN_PREVIEW_FIELDS,
    )) {
      addIssue(
        hardErrors,
        "forbidden_preview_field",
        `Dry-run preview contains forbidden field ${fieldPath}.`,
        { cardId: priorityCard.cardId, fieldPath },
      );
    }

    return {
      cardId: priorityCard.cardId,
      title: priorityCard.title,
      priority: priorityCard.migrationPriority,
      risk: priorityCard.migrationRisk,
      batchIncluded: true,
      activeHintFound,
      derivedFactsFound,
      migrationPriorityFound: priorityFound,
      generatedFactsInScope: generatedFacts,
      activeMechanicalFieldsInScope: activeFacts,
      compiledAfterMigrationPreview,
      confirmedByGeneratedFacts: comparison.confirmedByGeneratedFacts,
      wouldAddToPreview: comparison.wouldAddToPreview,
      wouldRemoveFromManualFuture: sortByKey(activeFacts),
      shapeDifferences: comparison.shapeDifferences,
      conflicts: [],
      warnings: comparison.warnings,
      infos: comparison.infos,
    };
  });

  const warnings = sortByKey(
    cards.flatMap((card) =>
      card.warnings.map((warning) => ({ cardId: card.cardId, ...warning })),
    ),
  );
  const infos = sortByKey(
    cards.flatMap((card) =>
      card.infos.map((info) => ({ cardId: card.cardId, ...info })),
    ),
  );
  const previewChangedCards = cards.filter(
    (card) => card.wouldAddToPreview.length > 0,
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sources: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      derivedFactsReportPath: DERIVED_FACTS_REPORT_PATH,
      migrationPriorityReportPath: MIGRATION_PRIORITY_REPORT_PATH,
    },
    mode: "read-only dry-run; does not write ai-card-hints-active.json and has no runtime, planner or consumer binding",
    hardErrorCount: hardErrors.length,
    warningCount: warnings.length,
    infoCount: infos.length,
    warningCountsByKind: countByKind(warnings),
    infoCountsByKind: countByKind(infos),
    batchCardCount: cards.length,
    previewChangedCardCount: previewChangedCards.length,
    confirmedFactCount: cards.reduce(
      (sum, card) => sum + card.confirmedByGeneratedFacts.length,
      0,
    ),
    previewAddedFactCount: cards.reduce(
      (sum, card) => sum + card.wouldAddToPreview.length,
      0,
    ),
    conflictCount: 0,
    batchCardIds: cards.map((card) => card.cardId),
    cards,
    errors: sortByKey(hardErrors),
    warnings,
    infos,
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
  const report = buildGeneratedFactMigrationDryRunReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed generated-fact dry-run report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated dry-run report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-migration-dry-run.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_MIGRATION_DRY_RUN OK batchCards=${report.batchCardCount} errors=${report.hardErrorCount} warnings=${report.warningCount} previewAddedFacts=${report.previewAddedFactCount}\n`,
    );
  }

  if (report.hardErrorCount > 0) process.exitCode = 1;
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
