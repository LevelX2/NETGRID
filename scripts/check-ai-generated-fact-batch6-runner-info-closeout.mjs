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
const TASK_ID = "Aufgabe 017";
const SCHEMA_VERSION = "ai-generated-fact-batch6-runner-info-closeout-v1";
const BATCH_ID = "batch_6_runner_info_central_pressure_access_replacement";
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
const BATCH5_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-016-breaker-icebreaker-longtail-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-017-runner-info-central-pressure-closeout-report-2026-05-25.json";

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
  "rd_topdeck_info_normalization",
  "hq_info_normalization",
  "central_access_replacement_normalization",
  "central_multiaccess_or_interface_normalization",
  "successful_run_context_normalization",
  "access_context_normalization",
  "expose_or_remote_info_context_normalization",
  "zone_shuffle_or_topdeck_manipulation_normalization",
  "central_pressure_overlay_split_normalization",
  "board_context_required_classification",
  "hidden_zone_context_classification",
];

const CANDIDATES = [
  [
    "onr_v1_050_r-and-d-protocol-files",
    "R&D-Protocol Files",
    "rd_topdeck_info",
    "programs",
  ],
  ["onr_v1_017_deep-thought", "Deep Thought", "rd_topdeck_info", "programs"],
  [
    "onr_v1_041_microtech-ai-interface",
    "Microtech AI Interface",
    "rd_topdeck_info",
    "programs",
  ],
  [
    "onr_v1_085_executive-wiretaps",
    "Executive Wiretaps",
    "central_multiaccess_or_interface",
    "preps",
  ],
  [
    "onr_v1_084_edited-shipping-manifests",
    "Edited Shipping Manifests",
    "central_access_replacement",
    "preps",
  ],
  [
    "onr_v1_081_custodial-position",
    "Custodial Position",
    "central_multiaccess_or_interface",
    "preps",
  ],
  [
    "onr_v1_024_expert-schedule-analyzer",
    "Expert Schedule Analyzer",
    "hq_info",
    "programs",
  ],
  ["onr_v1_008_boardwalk", "Boardwalk", "hq_info", "programs"],
  [
    "onr_v1_062_shredder-uplink-protocol",
    "Shredder Uplink Protocol",
    "central_access_replacement",
    "programs",
  ],
  ["onr_v1_032_i-spy", "I Spy", "expose_or_remote_info", "programs"],
  ["onr_v1_042_mouse", "Mouse", "expose_or_remote_info", "programs"],
  ["onr_v1_058_seeya", "SeeYa", "expose_or_remote_info", "programs"],
  ["onr_v1_065_smarteye", "Smarteye", "expose_or_remote_info", "programs"],
].map(([cardId, title, subBatch, folder]) => ({
  cardId,
  title,
  subBatch,
  include: true,
  expectedSide: "runner",
  expectedCardType: folder === "preps" ? "event" : "program",
  implementationPath:
    cardId === "onr_v1_050_r-and-d-protocol-files"
      ? "packages/engine/src/card-implementations/onr-v1/runner/programs/r-d-protocol-files.ts"
      : `packages/engine/src/card-implementations/onr-v1/runner/${folder}/${cardId.replace(/^onr_v1_\d+_/, "")}.ts`,
}));

const OPTIONAL_EXCLUDES = [
  [
    "onr_v1_013_cockroach",
    "Cockroach",
    "programs",
    "Cockroach is HQ-centered pressure, but its mechanical output is random HQ discard pressure rather than Runner info, access replacement or expose; defer to a virus/random-discard pressure batch.",
  ],
  [
    "onr_v1_026_false-echo",
    "False Echo",
    "programs",
    "False Echo is a successful-run force-rez disruption card, not central information or access replacement; defer to a runpath/install-rez disruption batch.",
  ],
  [
    "onr_v1_067_speed-trap",
    "Speed Trap",
    "programs",
    "Speed Trap is a runner survival/jack-out prevention tool, not central information or access replacement; defer to Runner Prevention / Damage / Survival Tools.",
  ],
  [
    "onr_v1_068_startup-immolator",
    "Startup Immolator",
    "programs",
    "Startup Immolator is ICE trash after fully breaking subroutines. It is relevant, but better handled in the Corp ICE disruption batch because the active monolith currently models it with program_trash-like legacy shape.",
  ],
].map(([cardId, title, folder, excludedReason]) => ({
  cardId,
  title,
  include: false,
  subBatch: "excluded_or_out_of_scope",
  expectedSide: "runner",
  expectedCardType: "program",
  implementationPath: `packages/engine/src/card-implementations/onr-v1/runner/${folder}/${cardId.replace(/^onr_v1_\d+_/, "")}.ts`,
  excludedReason,
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
  return uniqueSorted([
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
  ]);
}

function activeMechanicalFields(activeHint) {
  return ["effects", "conditions", "costProfile", "targetProfiles"].filter(
    (field) => isMeaningful(activeHint?.[field]),
  );
}

function previewAddedFacts(labels, activeHint) {
  const activeFields = new Set(activeMechanicalFields(activeHint));
  return labels.filter((label) => {
    if (label.startsWith("effect:")) return !activeFields.has("effects");
    if (label.startsWith("condition:")) return !activeFields.has("conditions");
    return !activeFields.has(label);
  });
}

function normalizationForWarning(card, warning) {
  if (
    ![
      "generated_fact_missing_from_active_monolith",
      "active_monolith_mechanical_duplication",
    ].includes(warning.kind)
  ) {
    return undefined;
  }
  return normalizationForLabels(card, warning);
}

function normalizationForLabels(card, warning) {
  const labels = new Set(card.generatedFactsConfirmed ?? []);
  if (labels.has("effect:zone_shuffle")) {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "zone_shuffle_topdeck_context_normalized",
      rule: "zone_shuffle_or_topdeck_manipulation_normalization",
      rationale:
        "R&D top manipulation is normalized as hidden-zone context only; the report never contains actual hidden card order.",
    };
  }
  if (labels.has("effect:hq_info")) {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "hq_info_context_normalized",
      rule: "hq_info_normalization",
      rationale:
        "HQ information effects are normalized as legal access/start-turn context, not static knowledge of the Corp hand.",
    };
  }
  if (labels.has("effect:expose_info")) {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "expose_info_context_normalized",
      rule: "expose_or_remote_info_context_normalization",
      rationale:
        "Expose effects are normalized as legal installed-card information effects and do not reveal hidden cards before the effect resolves.",
    };
  }
  if (labels.has("effect:multiaccess")) {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "central_multiaccess_context_normalized",
      rule: "central_multiaccess_or_interface_normalization",
      rationale:
        "Multiaccess count is normalized as a successful-run mechanical fact; actual access legality and value stay engine/board context.",
    };
  }
  if (labels.has("effect:access_replacement")) {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "central_access_replacement_context_normalized",
      rule: "central_access_replacement_normalization",
      rationale:
        "Access replacement is normalized as a distinct mechanical fact and is not treated as normal access or automatic steal/trash value.",
    };
  }
  if (labels.has("effect:topdeck_info")) {
    return {
      field: warning.field,
      sourceWarningKind: warning.kind,
      classification: "rd_topdeck_info_context_normalized",
      rule: "rd_topdeck_info_normalization",
      rationale:
        "R&D topdeck information is normalized as trigger-gated information; generated facts do not expose hidden R&D identities.",
    };
  }
  return {
    field: warning.field,
    sourceWarningKind: warning.kind,
    classification: "central_pressure_overlay_split_normalized",
    rule: "central_pressure_overlay_split_normalization",
    rationale:
      "Strategic central-pressure valuation remains overlay/consumer logic; generated facts record only mechanical information/access classes.",
  };
}

function contextInfos(card, labels) {
  const infos = [];
  if (labels.includes("condition:requires_successful_run")) {
    infos.push({
      kind: "successful_run_context_info",
      rule: "successful_run_context_normalization",
      rationale:
        "Successful-run requirements remain LegalAction/engine context; generated facts do not assert that a run will succeed.",
    });
  }
  if (
    labels.includes("condition:requires_accessed_card") ||
    labels.includes("effect:access_replacement") ||
    labels.includes("effect:multiaccess")
  ) {
    infos.push({
      kind: "access_context_info",
      rule: "access_context_normalization",
      rationale:
        "Access and access-replacement facts describe card mechanics only; actual access legality and breach queues remain runtime context.",
    });
  }
  if (
    labels.includes("effect:topdeck_info") ||
    labels.includes("effect:hq_info") ||
    labels.includes("effect:zone_shuffle") ||
    labels.includes("effect:expose_info")
  ) {
    infos.push({
      kind: "hidden_zone_context_info",
      rule: "hidden_zone_context_classification",
      rationale:
        "Information effects are side-safe context markers only; no hidden card identities or actual hidden order are stored in the report.",
    });
  }
  if (
    labels.includes("effect:access_replacement") ||
    labels.includes("effect:multiaccess") ||
    labels.includes("effect:topdeck_info") ||
    labels.includes("effect:hq_info")
  ) {
    infos.push({
      kind: "central_pressure_overlay_info",
      rule: "central_pressure_overlay_split_normalization",
      rationale:
        "Central pressure value remains strategy/consumer context and is not generated as a mechanical fact.",
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
    successfulRunContextInfos: context.filter(
      (info) => info.kind === "successful_run_context_info",
    ),
    accessContextInfos: context.filter(
      (info) => info.kind === "access_context_info",
    ),
    hiddenZoneContextInfos: context.filter(
      (info) => info.kind === "hidden_zone_context_info",
    ),
    centralPressureInfos: context.filter(
      (info) => info.kind === "central_pressure_overlay_info",
    ),
    descriptorFollowups: [],
    activeConsumers: ["central_pressure_diagnostics", "hidden_zone_context"],
    remainingIssues: [],
    readiness: "ready_read_only_with_access_context",
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
          kind: "missing_required_batch6_input",
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
    if (
      labels.has("effect:access_replacement") &&
      labels.has("effect:multiaccess")
    ) {
      errors.push({
        kind: "access_replacement_and_multiaccess_conflated",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      card.title === "Microtech AI Interface" &&
      !labels.has("effect:zone_shuffle")
    ) {
      errors.push({
        kind: "microtech_missing_zone_shuffle",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-6 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-6 closeout report contains runtime/legal field ${fieldPath}.`,
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
      ...card.successfulRunContextInfos,
      ...card.accessContextInfos,
      ...card.hiddenZoneContextInfos,
      ...card.centralPressureInfos,
    ]) {
      if (counts.has(context.rule)) {
        counts.set(context.rule, counts.get(context.rule) + 1);
      }
    }
  }
  return Object.fromEntries(counts);
}

export function buildBatchSixRunnerInfoCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch5Closeout = readJson(BATCH5_CLOSEOUT_REPORT_PATH);
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
  const sourceReports = [
    { path: DERIVED_FACTS_REPORT_PATH, report: derivedReport },
    { path: COMPILED_INDEX_REPORT_PATH, report: compiledReport },
    { path: MIGRATION_PRIORITY_REPORT_PATH, report: priorityReport },
    { path: BATCH5_CLOSEOUT_REPORT_PATH, report: batch5Closeout },
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
    successfulRunContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.successfulRunContextInfos.length,
      0,
    ),
    accessContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.accessContextInfos.length,
      0,
    ),
    hiddenZoneContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.hiddenZoneContextInfos.length,
      0,
    ),
    centralPressureOverlayInfoCount: includedCards.reduce(
      (sum, card) => sum + card.centralPressureInfos.length,
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
    includedCards,
    excludedCards,
    contextRules: [
      "R&D and HQ information facts describe legal information effects only; reports never contain hidden card identities or actual hidden order.",
      "Access-replacement facts are not normal access and do not imply automatic steal, trash or central-run value.",
      "Multiaccess facts describe a successful-run access count; actual breach queues and access legality remain engine context.",
      "Expose facts are legal installed-card information effects and do not reveal hidden information before the effect resolves.",
      "Strategic central pressure stays overlay/consumer logic and is not generated as a mechanical fact.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 018",
      batchName: "corp_ice_longtail_future_trace_damage",
      recommendation: "Option A",
      rationale:
        "Runner info/access facts are now closed read-only; Corp ICE Longtail is the next high-impact block because breaker, tag/punish, remoteRole and runpath context guardrails are already established.",
      candidateCards: [
        "Ball and Chain",
        "Canis Major",
        "Canis Minor",
        "Bolter Cluster",
        "Neural Blade",
        "Hunter",
        "Data Raven",
        "Fetch 4.0.1",
        "Cinderella",
        "Cerberus",
        "Banpei",
        "Data Naga",
        "Jack Attack",
        "Fatal Attractor",
        "Data Darts",
        "Mastiff",
      ],
      riskBoundary:
        "Generated ICE facts may classify trace, damage, ETR, future-run and run-tax mechanics only; current runpath legality and cost still belong to engine, LegalActions and effectiveRunQuote.",
      fallbackBatch: {
        batchName: "runner_prevention_damage_survival_tools",
        rationale:
          "Runner prevention/survival tools are smaller and safer if the ICE longtail is judged too broad for one bundled pass.",
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
  const report = buildBatchSixRunnerInfoCloseoutReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-6 runner-info closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-6 runner-info closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch6-runner-info-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH6_RUNNER_INFO_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} excluded=${report.excludedCardCount} confirmed=${report.confirmedGeneratedFactCount} normalized=${report.normalizedDifferenceCount} readiness=${report.readiness}\n`,
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
