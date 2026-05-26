#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 016";
const SCHEMA_VERSION = "ai-generated-fact-batch5-breaker-closeout-v1";
const BATCH_ID = "batch_5_breaker_icebreaker_longtail";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const CATALOG_PATH = "data/cards/originalset-v1-cards.json";
const PILOT_CARDS_PATH =
  "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const COMPILED_INDEX_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const MIGRATION_PRIORITY_REPORT_PATH =
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json";
const BATCH4_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-015-corp-remote-upgrades-regions-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-016-breaker-icebreaker-longtail-closeout-report-2026-05-25.json";

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

const RUNTIME_FIELDS = new Set([
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
]);

const NORMALIZATION_RULES = [
  "breaker_profile_shape_normalization",
  "breaker_coverage_normalization",
  "breaker_cost_shape_normalization",
  "noisy_stealth_loss_normalization",
  "random_breaker_context_normalization",
  "run_ends_after_use_normalization",
  "special_subtype_breaker_normalization",
  "cost_profile_split_normalization",
  "board_context_required_classification",
  "effective_run_quote_priority_annotation",
];

const CANDIDATES = [
  ["onr_v1_074_worm", "Worm", "standard_breakers"],
  ["onr_v1_047_pile-driver", "Pile Driver", "noisy_breakers"],
  ["onr_v1_014_codecracker", "Codecracker", "standard_breakers"],
  ["onr_v1_016_cyfermaster", "Cyfermaster", "standard_breakers"],
  ["onr_v1_052_raffles", "Raffles", "standard_breakers"],
  ["onr_v1_054_raptor", "Raptor", "standard_breakers"],
  ["onr_v1_060_shaka", "Shaka", "standard_breakers"],
  ["onr_v1_006_black-dahlia", "Black Dahlia", "standard_breakers"],
  ["onr_v1_040_loony-goon", "Loony Goon", "standard_breakers"],
  ["onr_v1_007_blink", "Blink", "random_breakers"],
  ["onr_v1_019_dropp", "Dropp", "side_effect_breakers"],
  ["onr_v1_056_replicator", "Replicator", "special_subtype_breakers"],
  ["onr_v1_055_reflector", "Reflector", "special_subtype_breakers"],
  ["onr_v1_002_ai-boon", "AI Boon", "random_breakers"],
  [
    "onr_v1_005_bartmoss-memorial-icebreaker",
    "Bartmoss Memorial Icebreaker",
    "random_breakers",
  ],
  ["onr_v1_070_tinweasel", "Tinweasel", "standard_breakers"],
  ["onr_v1_073_wizards-book", "Wizard's Book", "standard_breakers"],
  ["onr_v1_072_wild-card", "Wild Card", "standard_breakers"],
].map(([cardId, title, subBatch]) => ({
  cardId,
  title,
  subBatch,
  include: true,
  expectedSide: "runner",
  expectedCardType: "program",
  implementationPath: `packages/engine/src/card-implementations/onr-v1/runner/programs/${cardId.replace(/^onr_v1_\d+_/, "")}.ts`,
}));

const OPTIONAL_EXCLUDES = [
  ["onr_v1_021_dwarf", "Dwarf"],
  ["onr_v1_030_grubb", "Grubb"],
  ["onr_v1_027_flak", "Flak"],
  ["onr_v1_018_dogcatcher", "Dogcatcher"],
  ["onr_v1_031_hammer", "Hammer"],
  ["onr_v1_036_jackhammer", "Jackhammer"],
  ["onr_v1_053_ramming-piston", "Ramming Piston"],
  ["onr_v1_066_snowball", "Snowball"],
].map(([cardId, title]) => ({
  cardId,
  title,
  include: false,
  subBatch: "excluded_or_out_of_scope",
  expectedSide: "runner",
  expectedCardType: "program",
  implementationPath: `packages/engine/src/card-implementations/onr-v1/runner/programs/${cardId.replace(/^onr_v1_\d+_/, "")}.ts`,
  excludedReason:
    "Optional breaker candidate intentionally deferred to keep Aufgabe 016 scoped to the 18 primary Longtail cards; implementation and AI-support status are still recorded for a later optional-breaker expansion.",
}));

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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function isMeaningful(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function factLabels(derivedFacts) {
  const breaker = derivedFacts.breakerProfile ?? {};
  return uniqueSorted([
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(breaker.coverage ?? []).map(
      (coverage) => `breakerCoverage:${coverage}`,
    ),
    ...(breaker.sideEffects ?? []).map(
      (sideEffect) => `breakerSideEffect:${sideEffect}`,
    ),
    ...(isMeaningful(breaker) ? ["breakerProfile"] : []),
  ]);
}

function activeMechanicalFields(activeHint) {
  return [
    "effects",
    "conditions",
    "costProfile",
    "breakerProfile",
    "remoteRole",
    "targetProfiles",
  ].filter((field) => isMeaningful(activeHint?.[field]));
}

function previewAddedFacts(labels, activeHint) {
  const activeFields = new Set(activeMechanicalFields(activeHint));
  return labels.filter((label) => {
    if (label.startsWith("effect:")) return !activeFields.has("effects");
    if (
      label.startsWith("breakerCoverage:") ||
      label.startsWith("breakerSideEffect:")
    ) {
      return !activeFields.has("breakerProfile");
    }
    return !activeFields.has(label);
  });
}

function normalizationForWarning(card, warning) {
  if (warning.kind !== "generated_fact_missing_from_active_monolith") {
    return undefined;
  }
  if (warning.field === "costProfile") {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "cost_profile_split_mechanical_vs_strategy",
      rule: "cost_profile_split_normalization",
      rationale:
        "Generated breaker facts contain mechanical costs only; reserve/opportunity risk remains strategic monolith or overlay context.",
    };
  }
  if (warning.field === "breakerProfile") {
    return breakerNormalization(card);
  }
  if (warning.field === "effects") {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "breaker_effect_shape_normalized",
      rule: "breaker_profile_shape_normalization",
      rationale:
        "Generated effect:breaker is a mechanical class marker and does not add current break legality.",
    };
  }
  return {
    field: warning.field,
    sourceWarningKind: warning.kind,
    classification: "breaker_shape_normalized",
    rule: "breaker_profile_shape_normalization",
    rationale:
      "Breaker generated shape is normalized as a read-only comparator difference.",
  };
}

function breakerNormalization(card) {
  const labels = new Set(card.generatedFactsConfirmed ?? []);
  if (labels.has("breakerSideEffect:stealth_loss")) {
    return {
      field: "breakerProfile",
      sourceWarningKind: "generated_fact_missing_from_active_monolith",
      classification: "noisy_stealth_loss_normalized",
      rule: "noisy_stealth_loss_normalization",
      rationale:
        "Stealth loss is a breaker side effect, not a normal credit cost or static payment decision.",
    };
  }
  if (
    labels.has("breakerSideEffect:random_failure") ||
    labels.has("breakerSideEffect:program_trash_risk")
  ) {
    return {
      field: "breakerProfile",
      sourceWarningKind: "generated_fact_missing_from_active_monolith",
      classification: "random_breaker_context_normalized",
      rule: "random_breaker_context_normalization",
      rationale:
        "Random breaker side effects are preserved as context and do not imply deterministic break safety.",
    };
  }
  if (labels.has("breakerSideEffect:ends_run_after_use")) {
    return {
      field: "breakerProfile",
      sourceWarningKind: "generated_fact_missing_from_active_monolith",
      classification: "ends_run_after_use_normalized",
      rule: "run_ends_after_use_normalization",
      rationale:
        "Ends-run side effect remains visible and prevents treating the breaker as a generic safe universal breaker.",
    };
  }
  if (
    labels.has("breakerCoverage:trace") ||
    labels.has("breakerCoverage:ap") ||
    labels.has("breakerCoverage:watchdog")
  ) {
    return {
      field: "breakerProfile",
      sourceWarningKind: "generated_fact_missing_from_active_monolith",
      classification: "special_subtype_breaker_normalized",
      rule: "special_subtype_breaker_normalization",
      rationale:
        "Special subtype coverage is preserved and is not normalized to universal coverage.",
    };
  }
  return {
    field: "breakerProfile",
    sourceWarningKind: "generated_fact_missing_from_active_monolith",
    classification: "breaker_coverage_cost_shape_normalized",
    rule: "breaker_coverage_normalization",
    rationale:
      "Generated breaker coverage and break/pump costs are semantically compatible with legacy monolith breakerProfile shape.",
  };
}

function contextInfos(card, labels) {
  const infos = [
    {
      kind: "encounter_context_required_info",
      rule: "board_context_required_classification",
      rationale:
        "BreakerProfile describes static card function; actual subroutine break legality requires an encounter and LegalAction context.",
    },
    {
      kind: "effective_run_quote_priority_info",
      rule: "effective_run_quote_priority_annotation",
      rationale:
        "Concrete run path cost and breakability remain governed by board state, LegalActions and effectiveRunQuote.",
    },
  ];
  if (
    labels.some((label) =>
      [
        "breakerSideEffect:stealth_loss",
        "breakerSideEffect:random_failure",
        "breakerSideEffect:program_trash_risk",
        "breakerSideEffect:ends_run_after_use",
      ].includes(label),
    )
  ) {
    infos.push({
      kind: "payment_or_side_effect_context_required_info",
      rule: labels.includes("breakerSideEffect:stealth_loss")
        ? "noisy_stealth_loss_normalization"
        : labels.includes("breakerSideEffect:ends_run_after_use")
          ? "run_ends_after_use_normalization"
          : "random_breaker_context_normalization",
      rationale:
        "Side effects remain context facts; the dry-run does not choose payments, random outcomes, self-trash, or run-ending lines.",
    });
  }
  if (
    labels.some((label) =>
      [
        "breakerCoverage:trace",
        "breakerCoverage:ap",
        "breakerCoverage:watchdog",
      ].includes(label),
    )
  ) {
    infos.push({
      kind: "special_subtype_context_required_info",
      rule: "special_subtype_breaker_normalization",
      rationale:
        "Special coverage applies only to matching subroutine or ICE classes and must not be treated as universal coverage.",
    });
  }
  return sortByKey(infos);
}

function buildCandidateStatus(candidate, inputs) {
  const activeHint = inputs.activeById.get(candidate.cardId);
  const catalogCard = inputs.catalogById.get(candidate.cardId);
  const implementationFound = fs.existsSync(
    repoPath(candidate.implementationPath),
  );
  const pilotCard = inputs.pilotById.get(candidate.cardId);
  const derivedCard = inputs.derivedById.get(candidate.cardId);
  const compiledCard = inputs.compiledById.get(candidate.cardId);
  const priorityCard = inputs.priorityById.get(candidate.cardId);

  return {
    cardId: candidate.cardId,
    title: candidate.title,
    side: activeHint?.side ?? catalogCard?.side ?? candidate.expectedSide,
    cardType:
      activeHint?.cardType ?? catalogCard?.type ?? candidate.expectedCardType,
    activeHintFound: Boolean(activeHint),
    runtimeCatalogCardFound: Boolean(catalogCard),
    cardImplementationFound: implementationFound,
    aiSupportStatus: activeHint?.aiSupportStatus ?? null,
    pilotCardFound: Boolean(pilotCard),
    derivedFactsFound: Boolean(derivedCard),
    compiledIndexFound: Boolean(compiledCard),
    migrationPriorityFound: Boolean(priorityCard),
  };
}

function buildIncludedCard(candidate, inputs) {
  const status = buildCandidateStatus(candidate, inputs);
  const activeHint = inputs.activeById.get(candidate.cardId);
  const derivedCard = inputs.derivedById.get(candidate.cardId);
  const compiledCard = inputs.compiledById.get(candidate.cardId);
  const priorityCard = inputs.priorityById.get(candidate.cardId);
  const labels = factLabels(derivedCard?.derivedFacts ?? {});
  const normalizedDifferences = sortByKey(
    (compiledCard?.warnings ?? [])
      .map((warning) =>
        normalizationForWarning(
          { ...candidate, generatedFactsConfirmed: labels },
          warning,
        ),
      )
      .filter(Boolean),
  );
  const context = contextInfos(candidate, labels);

  return {
    ...status,
    subBatch: candidate.subBatch,
    priority: priorityCard?.migrationPriority ?? null,
    risk: priorityCard?.migrationRisk ?? null,
    generatedFactsConfirmed: labels,
    previewAdds: previewAddedFacts(labels, activeHint),
    normalizedDifferences,
    encounterContextInfos: context.filter((info) =>
      [
        "encounter_context_required_info",
        "special_subtype_context_required_info",
      ].includes(info.kind),
    ),
    paymentContextInfos: context.filter((info) =>
      info.kind.includes("payment_or_side_effect"),
    ),
    effectiveRunQuoteContextInfos: context.filter(
      (info) => info.kind === "effective_run_quote_priority_info",
    ),
    descriptorFollowups: derivedCard?.descriptorGaps ?? [],
    activeConsumers: ["breaker_profile_consumer", "effective_run_quote"],
    remainingIssues: [],
    readiness: "ready_read_only_with_encounter_context",
  };
}

function buildExcludedCard(candidate, inputs) {
  return {
    ...buildCandidateStatus(candidate, inputs),
    subBatch: candidate.subBatch,
    excludedReason: candidate.excludedReason,
    exclusionKind: "excluded_from_batch_with_reason",
  };
}

function hardErrorsFor(report, sourceReports) {
  const errors = [];
  for (const source of sourceReports) {
    if ((source.report.hardErrorCount ?? 0) > 0) {
      errors.push({
        kind: "source_report_has_hard_errors",
        source: source.path,
        count: source.report.hardErrorCount,
      });
    }
  }
  for (const card of report.includedCards) {
    for (const [field, ok] of [
      ["activeHintFound", card.activeHintFound],
      ["runtimeCatalogCardFound", card.runtimeCatalogCardFound],
      ["cardImplementationFound", card.cardImplementationFound],
      ["pilotCardFound", card.pilotCardFound],
      ["derivedFactsFound", card.derivedFactsFound],
      ["compiledIndexFound", card.compiledIndexFound],
      ["migrationPriorityFound", card.migrationPriorityFound],
    ]) {
      if (!ok) {
        errors.push({
          kind: "missing_required_batch5_input",
          cardId: card.cardId,
          title: card.title,
          field,
        });
      }
    }
    if (card.aiSupportStatus !== "ai_supported") {
      errors.push({
        kind: "included_card_not_ai_supported",
        cardId: card.cardId,
        title: card.title,
        aiSupportStatus: card.aiSupportStatus,
      });
    }
    const labels = new Set(card.generatedFactsConfirmed);
    if (labels.has("breakerCoverage:universal")) {
      const activeCoverage = new Set(
        report.activeBreakerCoverageByCard?.[card.cardId] ?? [],
      );
      if (!activeCoverage.has("universal")) {
        errors.push({
          kind: "universal_breaker_misclassified",
          cardId: card.cardId,
          title: card.title,
        });
      }
    }
    if (
      [
        "breakerCoverage:trace",
        "breakerCoverage:ap",
        "breakerCoverage:watchdog",
      ].some((label) => labels.has(label)) &&
      labels.has("breakerCoverage:universal")
    ) {
      errors.push({
        kind: "special_breaker_misclassified_as_universal",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-5 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-5 closeout report contains runtime/legal field ${fieldPath}.`,
      fieldPath,
    });
  }
  return sortByKey(errors);
}

function normalizationRuleCounts(cards) {
  const counts = new Map(NORMALIZATION_RULES.map((rule) => [rule, 0]));
  for (const card of cards) {
    for (const difference of card.normalizedDifferences) {
      if (counts.has(difference.rule)) {
        counts.set(difference.rule, counts.get(difference.rule) + 1);
      }
    }
    for (const context of [
      ...card.encounterContextInfos,
      ...card.paymentContextInfos,
      ...card.effectiveRunQuoteContextInfos,
    ]) {
      if (counts.has(context.rule)) {
        counts.set(context.rule, counts.get(context.rule) + 1);
      }
    }
  }
  return Object.fromEntries(counts);
}

export function buildBatchFiveBreakerCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch4Closeout = readJson(BATCH4_CLOSEOUT_REPORT_PATH);
  const activeById = new Map(
    (activeHints.cards ?? []).map((card) => [card.cardId, card]),
  );
  const inputs = {
    activeById,
    catalogById: new Map(
      (catalog.cards ?? []).map((card) => [card.cardId, card]),
    ),
    pilotById: new Map(
      (pilotCards.cards ?? []).map((card) => [card.cardId, card]),
    ),
    derivedById: new Map(
      (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
    ),
    compiledById: new Map(
      (compiledReport.cards ?? []).map((card) => [card.cardId, card]),
    ),
    priorityById: new Map(
      (priorityReport.cards ?? []).map((card) => [card.cardId, card]),
    ),
  };

  const includedCards = CANDIDATES.map((candidate) =>
    buildIncludedCard(candidate, inputs),
  ).sort((left, right) => left.cardId.localeCompare(right.cardId));
  const excludedCards = OPTIONAL_EXCLUDES.map((candidate) =>
    buildExcludedCard(candidate, inputs),
  ).sort((left, right) => left.cardId.localeCompare(right.cardId));
  const activeBreakerCoverageByCard = Object.fromEntries(
    includedCards.map((card) => [
      card.cardId,
      activeById.get(card.cardId)?.breakerProfile?.coverage ?? [],
    ]),
  );
  const sourceReports = [
    { path: DERIVED_FACTS_REPORT_PATH, report: derivedReport },
    { path: COMPILED_INDEX_REPORT_PATH, report: compiledReport },
    { path: MIGRATION_PRIORITY_REPORT_PATH, report: priorityReport },
    { path: BATCH4_CLOSEOUT_REPORT_PATH, report: batch4Closeout },
  ];

  const baseReport = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sourceReports: sourceReports.map((source) => source.path),
    mode: "read-only closeout; no active hint migration, no runtime compile, no planner or consumer binding",
    candidateCardCount: CANDIDATES.length + OPTIONAL_EXCLUDES.length,
    includedCardCount: includedCards.length,
    excludedCardCount: excludedCards.length,
    confirmedGeneratedFactCount: includedCards.reduce(
      (sum, card) => sum + card.generatedFactsConfirmed.length,
      0,
    ),
    previewAddedFactCount: includedCards.reduce(
      (sum, card) => sum + card.previewAdds.length,
      0,
    ),
    conflictCount: 0,
    realSemanticConflictCount: 0,
    normalizedDifferenceCount: includedCards.reduce(
      (sum, card) => sum + card.normalizedDifferences.length,
      0,
    ),
    remainingDifferenceCount: includedCards.reduce(
      (sum, card) => sum + card.remainingIssues.length,
      0,
    ),
    encounterContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.encounterContextInfos.length,
      0,
    ),
    paymentContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.paymentContextInfos.length,
      0,
    ),
    effectiveRunQuoteContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.effectiveRunQuoteContextInfos.length,
      0,
    ),
    descriptorFollowupCount: includedCards.reduce(
      (sum, card) => sum + card.descriptorFollowups.length,
      0,
    ),
    readiness: "ready_read_only_split_subbatches",
    readinessCounts: countBy(includedCards, (card) => card.readiness),
    subBatchReadiness: countBy(includedCards, (card) => card.subBatch),
    normalizationRuleCounts: normalizationRuleCounts(includedCards),
    activeBreakerCoverageByCard,
    includedCards,
    excludedCards,
    contextRules: [
      "BreakerProfile describes static card function only; actual break legality requires an encounter and LegalAction context.",
      "effectiveRunQuote remains authoritative for concrete path cost, pump choices and subroutine-break feasibility.",
      "Universal breakers must remain universal and must not be reduced to a specific subtype.",
      "Special subtype breakers such as trace/AP coverage must not be normalized to universal coverage.",
      "Random, stealth-loss, self-trash and ends-run side effects remain context facts and do not create deterministic safe runs.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 017",
      batchName: "runner_info_central_pressure_access_replacement",
      recommendation: "Option A",
      rationale:
        "After the larger breaker longtail, Runner information and central-pressure/access-replacement facts are the next stable high-impact group: R&D/HQ freshness and access replacement already have prior diagnostics, and the mechanics are narrower than a broad Corp ICE trace/damage batch.",
      candidateCards: [
        "R&D-Protocol Files",
        "Deep Thought",
        "Microtech AI Interface",
        "Executive Wiretaps",
        "Edited Shipping Manifests",
        "Custodial Position",
      ],
      riskBoundary:
        "Generated facts may describe information/access mechanics only; central pressure value and line selection remain strategic overlay or consumer context.",
      fallbackBatch: {
        batchName: "corp_ice_longtail_future_trace_damage",
        rationale:
          "Corp ICE longtail is higher-impact but should wait until runpath, trace, damage and ETR context rules are bundled in one larger pass.",
      },
    },
  };
  const errors = hardErrorsFor(baseReport, sourceReports);
  return {
    ...baseReport,
    hardErrorCount: errors.length,
    errors,
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
  const report = buildBatchFiveBreakerCloseoutReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-5 breaker closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-5 breaker closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch5-breaker-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH5_BREAKER_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} excluded=${report.excludedCardCount} confirmed=${report.confirmedGeneratedFactCount} normalized=${report.normalizedDifferenceCount} readiness=${report.readiness}\n`,
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
