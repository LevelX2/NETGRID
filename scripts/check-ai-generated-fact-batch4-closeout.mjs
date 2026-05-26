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
const TASK_ID = "Aufgabe 015";
const SCHEMA_VERSION = "ai-generated-fact-batch4-corp-remote-closeout-v1";
const BATCH_ID = "batch_4_corp_remote_upgrades_regions_longtail";
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
const BATCH3_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-014-batch3-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-015-corp-remote-upgrades-regions-closeout-report-2026-05-25.json";

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
  "remote_capacity_normalization",
  "remote_scoring_protection_normalization",
  "sysop_or_region_active_state_normalization",
  "score_acceleration_context_normalization",
  "successful_run_or_access_context_normalization",
  "ice_modifier_context_normalization",
  "cost_profile_split_normalization",
  "active_state_context_normalization",
  "effective_run_quote_priority_annotation",
  "board_context_required_classification",
];

const CANDIDATES = [
  {
    cardId: "onr_v1_370_tesseract-fort-construction",
    title: "Tesseract Fort Construction",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/upgrades/tesseract-fort-construction.ts",
    expectedSide: "corp",
    expectedCardType: "upgrade",
    include: true,
    subBatch: "remote_upgrades",
    rationale:
      "Fort ICE additional-subroutine tax is a mechanical remote-protection/future-encounter fact.",
  },
  {
    cardId: "onr_v1_361_namatoki-plaza",
    title: "Namatoki Plaza",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/upgrades/namatoki-plaza.ts",
    expectedSide: "corp",
    expectedCardType: "upgrade",
    include: true,
    subBatch: "remote_capacity_or_remote_protection",
    rationale:
      "Additional agenda/node slot is a mechanical remote-capacity and score-support fact.",
  },
  {
    cardId: "onr_v1_359_jenny-jett",
    title: "Jenny Jett",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/upgrades/jenny-jett.ts",
    expectedSide: "corp",
    expectedCardType: "upgrade",
    include: true,
    subBatch: "remote_upgrades",
    rationale:
      "Successful-run install-and-approach ICE effect is a mechanical future-encounter class.",
  },
  {
    cardId: "onr_v1_363_olivia-salazar",
    title: "Olivia Salazar",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/upgrades/olivia-salazar.ts",
    expectedSide: "corp",
    expectedCardType: "upgrade",
    include: true,
    subBatch: "remote_upgrades",
    rationale:
      "During-run source-bound ICE rez discount is a mechanical remote-support fact.",
  },
  {
    cardId: "onr_v1_367_rio-de-janeiro-city-grid",
    title: "Rio de Janeiro City Grid",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/upgrades/rio-de-janeiro-city-grid.ts",
    expectedSide: "corp",
    expectedCardType: "upgrade",
    include: true,
    subBatch: "regions_city_grids",
    rationale:
      "Pass-rezzed-ICE deterministic-random stop pressure is a region future-encounter fact.",
  },
  {
    cardId: "onr_v1_317_data-masons",
    title: "Data Masons",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/assets/data-masons-hosting.ts",
    expectedSide: "corp",
    expectedCardType: "asset",
    include: true,
    subBatch: "global_ice_or_remote_support",
    rationale:
      "Wall rez discount and wall strength modifier are mechanical ICE-modifier facts.",
  },
  {
    cardId: "onr_v1_350_antiquated-interface-routines",
    title: "Antiquated Interface Routines",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/upgrades/antiquated-interface-routines.ts",
    expectedSide: "corp",
    expectedCardType: "upgrade",
    include: true,
    subBatch: "global_ice_or_remote_support",
    rationale:
      "Same-fort ICE strength modifier is a mechanical remote ICE-modifier fact.",
  },
  {
    cardId: "onr_v1_312_chicago-branch",
    title: "Chicago Branch",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/assets/chicago-branch.ts",
    expectedSide: "corp",
    expectedCardType: "asset",
    include: true,
    subBatch: "score_acceleration_or_fast_advance_support",
    rationale:
      "Activated advancement-counter placement is a mechanical score-acceleration fact.",
  },
  {
    cardId: "onr_v1_173_restrictive-net-zoning",
    title: "Restrictive Net Zoning",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/runner/resources/restrictive-net-zoning.ts",
    expectedSide: "runner",
    expectedCardType: "resource",
    include: false,
    subBatch: "excluded_or_out_of_scope",
    excludedReason:
      "Runner resource that taxes Corp ICE installation on a chosen fort; it belongs in a future Runner remote-contest/install-tax batch, not Corp Remote/Upgrades/Regions.",
  },
  {
    cardId: "onr_v1_191_black-ice-quality-assurance",
    title: "Black Ice Quality Assurance",
    implementationPath:
      "packages/engine/src/card-implementations/onr-v1/corp/agendas/black-ice-quality-assurance.ts",
    expectedSide: "corp",
    expectedCardType: "agenda",
    include: false,
    subBatch: "excluded_or_out_of_scope",
    excludedReason:
      "Corp agenda with global black-ICE strength modifier; mechanically useful, but outside the remote upgrade/region longtail and better suited to a Corp ICE/agenda-modifier batch.",
  },
];

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
  return uniqueSorted([
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
    ...(isMeaningful(derivedFacts.costProfile) ? ["costProfile"] : []),
    ...(derivedFacts.remoteRole
      ? [`remoteRole:${derivedFacts.remoteRole.kind}`]
      : []),
  ]);
}

function factGroups(labels) {
  const groups = new Set();
  if (
    labels.some((label) =>
      [
        "effect:future_encounter_effect",
        "effect:remote_protection",
        "remoteRole:scoring_protection",
      ].includes(label),
    )
  ) {
    groups.add("remote_protection");
  }
  if (labels.includes("remoteRole:remote_capacity"))
    groups.add("remote_capacity");
  if (labels.includes("remoteRole:ice_modifier")) groups.add("ice_modifier");
  if (labels.includes("effect:rez_discount")) groups.add("rez_discount");
  if (labels.includes("effect:score_acceleration"))
    groups.add("score_acceleration");
  if (labels.includes("costProfile")) groups.add("costProfile");
  return [...groups].sort();
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
    if (label.startsWith("condition:")) return !activeFields.has("conditions");
    if (label.startsWith("remoteRole:")) return !activeFields.has("remoteRole");
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
        "Generated cost facts contain mechanical clicks/credits only; active monolith also carries reserve/opportunity risk that remains strategic overlay context.",
    };
  }
  if (card.cardId === "onr_v1_312_chicago-branch") {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "score_acceleration_shape_normalized",
      rule: "score_acceleration_context_normalization",
      rationale:
        "Generated advancement-counter effect is mechanically equivalent; score timing and target legality remain LegalAction context.",
    };
  }
  if (
    [
      "onr_v1_317_data-masons",
      "onr_v1_350_antiquated-interface-routines",
    ].includes(card.cardId)
  ) {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "ice_modifier_shape_normalized",
      rule: "ice_modifier_context_normalization",
      rationale:
        "Generated ICE modifier is more structured than the legacy monolith shape; concrete run-path impact remains effectiveRunQuote context.",
    };
  }
  return {
    field: warning.field,
    sourceWarningKind: warning.kind,
    classification: "remote_scoring_protection_shape_normalized",
    rule: "remote_scoring_protection_normalization",
    rationale:
      "Generated remote protection/future encounter shape is semantically compatible with the active monolith and remains board-state scoped.",
  };
}

function boardContextInfos(card, derivedFacts) {
  const infos = [];
  const effects = derivedFacts.effects ?? [];
  if (derivedFacts.remoteRole) {
    infos.push({
      kind: "remote_role_requires_board_context",
      rule: "board_context_required_classification",
      rationale:
        "RemoteRole describes static card function; active/rezzed/server placement stays board state.",
    });
  }
  if (effects.some((effect) => effect.kind === "future_encounter_effect")) {
    infos.push({
      kind: "future_encounter_requires_runpath_context",
      rule: "effective_run_quote_priority_annotation",
      rationale:
        "Future encounter pressure needs current run path, encounter timing and effectiveRunQuote before it can affect play decisions.",
    });
  }
  if (effects.some((effect) => effect.kind === "remote_protection")) {
    infos.push({
      kind: "remote_protection_requires_server_context",
      rule: "active_state_context_normalization",
      rationale:
        "Remote protection is only live in the correct server/root/active-state context and is not static score safety.",
    });
  }
  if (effects.some((effect) => effect.kind === "score_acceleration")) {
    infos.push({
      kind: "score_acceleration_requires_legalaction_context",
      rule: "score_acceleration_context_normalization",
      rationale:
        "Advancement/score support describes card function; actual score legality remains Engine/LegalAction context.",
    });
  }
  if (card.cardId === "onr_v1_359_jenny-jett") {
    infos.push({
      kind: "successful_run_requires_access_context",
      rule: "successful_run_or_access_context_normalization",
      rationale:
        "Jenny Jett only matters after a successful run on this fort and must not expose hidden HQ choices.",
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
  const previewAdds = previewAddedFacts(labels, activeHint);
  const normalizedDifferences = sortByKey(
    (compiledCard?.warnings ?? [])
      .map((warning) => normalizationForWarning(candidate, warning))
      .filter(Boolean),
  );
  const contextInfos = boardContextInfos(
    candidate,
    derivedCard?.derivedFacts ?? {},
  );
  const descriptorFollowups = (derivedCard?.descriptorGaps ?? []).filter(
    (gap) => !String(gap).startsWith("Intentionally manual strategic overlay"),
  );
  const remainingIssues = [];

  return {
    ...status,
    subBatch: candidate.subBatch,
    includedReason: candidate.rationale,
    priority: priorityCard?.migrationPriority ?? null,
    risk: priorityCard?.migrationRisk ?? null,
    factGroups: factGroups(labels),
    generatedFactsConfirmed: labels,
    previewAdds,
    normalizedDifferences,
    boardContextInfos: contextInfos,
    descriptorFollowups,
    activeConsumers: activeConsumersFor(labels),
    remainingIssues,
    readiness:
      remainingIssues.length === 0 && descriptorFollowups.length === 0
        ? "ready_read_only_with_board_context"
        : "needs_descriptor_followup",
  };
}

function activeConsumersFor(labels) {
  const consumers = new Set();
  if (labels.some((label) => label.startsWith("remoteRole:"))) {
    consumers.add("remote_role_consumer");
  }
  if (
    labels.some((label) =>
      ["effect:remote_protection", "effect:future_encounter_effect"].includes(
        label,
      ),
    )
  ) {
    consumers.add("remote_safety_diagnostics");
  }
  if (labels.includes("effect:score_acceleration")) {
    consumers.add("score_conversion_diagnostics");
  }
  if (labels.includes("effect:rez_discount")) {
    consumers.add("rez_cost_context_diagnostics");
  }
  return [...consumers].sort();
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
          kind: "missing_required_batch4_input",
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
    if (card.generatedFactsConfirmed.includes("effect:economy")) {
      errors.push({
        kind: "remote_role_misclassified_as_economy",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      card.generatedFactsConfirmed.includes("remoteRole:remote_capacity") &&
      card.boardContextInfos.length === 0
    ) {
      errors.push({
        kind: "remote_capacity_without_board_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  if (report.excludedCards.some((card) => !card.excludedReason)) {
    errors.push({
      kind: "silent_batch4_exclude",
      message: "Every excluded candidate must carry an exclusion reason.",
    });
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-4 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-4 closeout report contains runtime/legal field ${fieldPath}.`,
      fieldPath,
    });
  }
  return sortByKey(errors);
}

function normalizationRuleCounts(cards) {
  const counts = new Map(NORMALIZATION_RULES.map((rule) => [rule, 0]));
  for (const card of cards) {
    for (const difference of card.normalizedDifferences) {
      counts.set(difference.rule, (counts.get(difference.rule) ?? 0) + 1);
    }
    for (const context of card.boardContextInfos) {
      counts.set(context.rule, (counts.get(context.rule) ?? 0) + 1);
    }
  }
  return Object.fromEntries(counts);
}

export function buildBatchFourCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch3Closeout = readJson(BATCH3_CLOSEOUT_REPORT_PATH);
  const inputs = {
    activeById: new Map(
      (activeHints.cards ?? []).map((card) => [card.cardId, card]),
    ),
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

  const includedCards = CANDIDATES.filter((card) => card.include)
    .map((candidate) => buildIncludedCard(candidate, inputs))
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const excludedCards = CANDIDATES.filter((card) => !card.include)
    .map((candidate) => buildExcludedCard(candidate, inputs))
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const sourceReports = [
    { path: DERIVED_FACTS_REPORT_PATH, report: derivedReport },
    { path: COMPILED_INDEX_REPORT_PATH, report: compiledReport },
    { path: MIGRATION_PRIORITY_REPORT_PATH, report: priorityReport },
    { path: BATCH3_CLOSEOUT_REPORT_PATH, report: batch3Closeout },
  ];

  const baseReport = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sourceReports: sourceReports.map((source) => source.path),
    mode: "read-only closeout; no active hint migration, no runtime compile, no planner or consumer binding",
    candidateCardCount: CANDIDATES.length,
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
    boardContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.boardContextInfos.length,
      0,
    ),
    descriptorFollowupCount: includedCards.reduce(
      (sum, card) => sum + card.descriptorFollowups.length,
      0,
    ),
    readiness: "ready_read_only_split_subbatches",
    subBatchReadiness: countBy(includedCards, (card) => card.subBatch),
    readinessCounts: countBy(includedCards, (card) => card.readiness),
    normalizationRuleCounts: normalizationRuleCounts(includedCards),
    includedCards,
    excludedCards,
    boardContextRules: [
      "RemoteRole and remote_protection describe static card function only; active/rezzed/server/root context remains board state.",
      "Future-encounter and run-tax-like facts do not create current run legality; effectiveRunQuote remains authoritative for concrete path cost.",
      "Score acceleration describes advancement-counter support only; score legality remains Engine/LegalAction context.",
      "Successful-run/access-window facts must not expose hidden HQ/R&D identity or imply static remote safety.",
      "Strategic reserve, opportunity and remote-safety valuation stay in manual hints or consumers, not generated basic facts.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 016",
      batchName: "breaker_icebreaker_longtail",
      recommendation: "Option A",
      rationale:
        "Breaker/Icebreaker longtail is the most stable larger continuation: Batch 2 already validated BreakerProfile normalization, active consumers exist, and the mechanics are less strategy-heavy than central-pressure or broad ICE future/damage batches.",
      candidateCards: [
        "Worm",
        "Pile Driver",
        "Blink",
        "Dropp",
        "Replicator",
        "Reflector",
        "Codecracker",
        "Cyfermaster",
        "Raffles",
        "Raptor",
        "Shaka",
      ],
      riskBoundary:
        "Special breaker restrictions and side effects should be read-only facts with LegalAction/effectiveRunQuote retaining concrete run legality and costs.",
      fallbackBatch: {
        batchName: "runner_info_central_pressure_access_replacement",
        rationale:
          "If breaker longtail data is thinner than expected, central pressure/access replacement is the next smaller strategic-information batch.",
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
  const report = buildBatchFourCloseoutReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-4 closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-4 closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch4-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH4_CORP_REMOTE_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} excluded=${report.excludedCardCount} confirmed=${report.confirmedGeneratedFactCount} normalized=${report.normalizedDifferenceCount} readiness=${report.readiness}\n`,
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
