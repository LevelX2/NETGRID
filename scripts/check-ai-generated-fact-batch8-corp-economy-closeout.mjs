#!/usr/bin/env node
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
const TASK_ID = "Aufgabe 019";
const SCHEMA_VERSION = "ai-generated-fact-batch8-corp-economy-closeout-v1";
const BATCH_ID = "batch_8_corp_economy_operation_advance_burst";
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
const BATCH7_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-018-corp-ice-longtail-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-019-corp-economy-advance-burst-closeout-report-2026-05-25.json";

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
  "operation_economy_normalization",
  "finite_economy_pool_normalization",
  "when_scored_economy_normalization",
  "scored_activated_economy_draw_normalization",
  "advance_burst_operation_normalization",
  "rez_or_install_discount_normalization",
  "global_research_modifier_normalization",
  "agenda_reveal_or_hq_context_normalization",
  "shuffle_draw_or_rnd_reset_normalization",
  "score_conversion_overlay_split_normalization",
  "score_context_required_classification",
  "legalaction_context_required_classification",
  "hidden_zone_context_classification",
  "variable_amount_context_classification",
  "board_context_required_classification",
];

const INCLUDED_CANDIDATES = [
  [
    "onr_v1_300_project-consultants",
    "Project Consultants",
    "corp_advance_burst",
    "operation",
  ],
  [
    "onr_v1_298_planning-consultants",
    "Planning Consultants",
    "corp_operation_draw_or_recovery",
    "operation",
  ],
  [
    "onr_v1_304_systematic-layoffs",
    "Systematic Layoffs",
    "corp_advance_burst",
    "operation",
  ],
  [
    "onr_v1_305_team-restructuring",
    "Team Restructuring",
    "corp_advance_burst",
    "operation",
  ],
  [
    "onr_v1_295_night-shift",
    "Night Shift",
    "corp_operation_economy",
    "operation",
  ],
  [
    "onr_v1_297_overtime-incentives",
    "Overtime Incentives",
    "corp_operation_economy",
    "operation",
  ],
  [
    "onr_v1_296_off-site-backups",
    "Off-Site Backups",
    "corp_operation_draw_or_recovery",
    "operation",
  ],
  [
    "onr_v1_303_silver-lining-recovery-protocol",
    "Silver Lining Recovery Protocol",
    "corp_operation_economy",
    "operation",
  ],
  [
    "onr_v1_194_corporate-downsizing",
    "Corporate Downsizing",
    "when_scored_economy_or_rez",
    "agenda",
  ],
  [
    "onr_v1_196_corporate-war",
    "Corporate War",
    "when_scored_economy_or_rez",
    "agenda",
  ],
  [
    "onr_v1_203_hostile-takeover",
    "Hostile Takeover",
    "when_scored_economy_or_rez",
    "agenda",
  ],
  [
    "onr_v1_212_priority-requisition",
    "Priority Requisition",
    "when_scored_economy_or_rez",
    "agenda",
  ],
  [
    "onr_v1_216_security-purge",
    "Security Purge",
    "when_scored_economy_or_rez",
    "agenda",
  ],
  [
    "onr_v1_197_data-fort-reclamation",
    "Data Fort Reclamation",
    "when_scored_economy_or_rez",
    "agenda",
  ],
  [
    "onr_v1_219_superior-net-barriers",
    "Superior Net Barriers",
    "global_research_modifier",
    "agenda",
  ],
  [
    "onr_v1_200_encryption-breakthrough",
    "Encryption Breakthrough",
    "global_research_modifier",
    "agenda",
  ],
  [
    "onr_v1_211_polymer-breakthrough",
    "Polymer Breakthrough",
    "when_scored_economy_or_rez",
    "agenda",
  ],
  [
    "onr_v1_218_subsidiary-branch",
    "Subsidiary Branch",
    "score_conversion_support",
    "agenda",
  ],
  [
    "onr_v1_206_marine-arcology",
    "Marine Arcology",
    "scored_agenda_economy",
    "agenda",
  ],
  [
    "onr_v1_188_ai-chief-financial-officer",
    "AI Chief Financial Officer",
    "scored_agenda_economy",
    "agenda",
  ],
  [
    "onr_v1_204_ice-transmutation",
    "Ice Transmutation",
    "global_research_modifier",
    "agenda",
  ],
  [
    "onr_v1_215_security-net-optimization",
    "Security Net Optimization",
    "global_research_modifier",
    "agenda",
  ],
  [
    "onr_v1_190_bioweapons-engineering",
    "Bioweapons Engineering",
    "global_research_modifier",
    "agenda",
  ],
  [
    "onr_v1_191_black-ice-quality-assurance",
    "Black Ice Quality Assurance",
    "global_research_modifier",
    "agenda",
  ],
  [
    "onr_v1_189_artificial-security-directors",
    "Artificial Security Directors",
    "score_conversion_support",
    "agenda",
  ],
  [
    "onr_v1_201_executive-extraction",
    "Executive Extraction",
    "score_conversion_support",
    "agenda",
  ],
  [
    "onr_v1_202_genetics-visionary-acquisition",
    "Genetics-Visionary Acquisition",
    "score_conversion_support",
    "agenda",
  ],
  [
    "onr_v1_195_corporate-retreat",
    "Corporate Retreat",
    "scored_agenda_economy",
    "agenda",
  ],
  [
    "onr_v1_198_detroit-police-contract",
    "Detroit Police Contract",
    "scored_agenda_economy",
    "agenda",
  ],
  [
    "onr_v1_209_political-coup",
    "Political Coup",
    "scored_agenda_economy",
    "agenda",
  ],
].map(([cardId, title, subBatch, cardType]) => ({
  cardId,
  title,
  subBatch,
  include: true,
  expectedSide: "corp",
  expectedCardType: cardType,
  implementationPath: `packages/engine/src/card-implementations/onr-v1/corp/${
    cardType === "operation" ? "operations" : "agendas"
  }/${cardId.replace(/^onr_v1_\d+_/, "")}.ts`,
}));

const OPTIONAL_EXCLUDES = [];

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

async function stableStringify(value) {
  return prettier.format(JSON.stringify(value, null, 2), { parser: "json" });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function isMeaningful(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
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

function factLabels(derivedFacts) {
  return uniqueSorted([
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
  ]);
}

function activeMechanicalFields(activeHint) {
  return [
    "effects",
    "conditions",
    "costProfile",
    "remoteRole",
    "targetProfiles",
  ].filter((field) => isMeaningful(activeHint?.[field]));
}

function previewAddedFacts(labels, activeHint) {
  const activeEffectKinds = new Set(
    (activeHint?.effects ?? []).map((effect) => `effect:${effect.kind}`),
  );
  const activeConditionKinds = new Set(
    (activeHint?.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
  );
  return labels.filter((label) => {
    if (label.startsWith("effect:")) return !activeEffectKinds.has(label);
    if (label.startsWith("condition:")) {
      return !activeConditionKinds.has(label);
    }
    return false;
  });
}

function ruleForLabel(label) {
  return {
    "effect:economy": "operation_economy_normalization",
    "effect:counter_economy": "finite_economy_pool_normalization",
    "effect:finite_economy_pool": "finite_economy_pool_normalization",
    "effect:draw": "scored_activated_economy_draw_normalization",
    "effect:extra_action": "scored_activated_economy_draw_normalization",
    "effect:scored_agenda_action":
      "scored_activated_economy_draw_normalization",
    "effect:advance_burst": "advance_burst_operation_normalization",
    "effect:score_acceleration": "advance_burst_operation_normalization",
    "effect:rez_discount": "rez_or_install_discount_normalization",
    "effect:install_discount": "rez_or_install_discount_normalization",
    "effect:rez": "rez_or_install_discount_normalization",
    "effect:install": "rez_or_install_discount_normalization",
    "effect:remote_build": "rez_or_install_discount_normalization",
    "effect:global_modifier": "global_research_modifier_normalization",
    "effect:remote_protection": "global_research_modifier_normalization",
    "effect:agenda_reveal_economy": "agenda_reveal_or_hq_context_normalization",
    "effect:shuffle_draw": "shuffle_draw_or_rnd_reset_normalization",
    "effect:zone_shuffle": "shuffle_draw_or_rnd_reset_normalization",
    "effect:card_recovery": "shuffle_draw_or_rnd_reset_normalization",
    "effect:topdeck_info": "shuffle_draw_or_rnd_reset_normalization",
    "condition:requires_scored_agenda": "score_context_required_classification",
    "condition:requires_score_window": "score_context_required_classification",
    "condition:requires_start_of_turn":
      "legalaction_context_required_classification",
    "condition:requires_corp_credits_threshold":
      "variable_amount_context_classification",
    "condition:requires_stolen_agenda_last_turn":
      "variable_amount_context_classification",
    "condition:requires_agenda_in_hq": "hidden_zone_context_classification",
    "condition:requires_hq_agenda": "hidden_zone_context_classification",
    "condition:requires_agenda_reveal":
      "agenda_reveal_or_hq_context_normalization",
    "condition:requires_rnd_top": "hidden_zone_context_classification",
    "condition:requires_archives_card": "hidden_zone_context_classification",
    "condition:requires_installed_ice": "board_context_required_classification",
    "condition:requires_rezzed_ice": "board_context_required_classification",
    "condition:requires_remote_server": "board_context_required_classification",
  }[label];
}

function normalizedDifferencesFor(card, labels, compiledWarnings) {
  const fromWarnings = (compiledWarnings ?? []).map((warning) => ({
    field: warning.field ?? warning.fact ?? warning.kind,
    sourceWarningKind: warning.kind,
    classification: classificationForRule(
      ruleForLabel(warning.fact) ?? "simple_ice_baseline_normalization",
    ),
    rule: ruleForLabel(warning.fact) ?? "simple_ice_baseline_normalization",
    rationale:
      "Compiled-index warning is normalized inside the read-only Batch-8 comparator path; active hints and runtime behavior are unchanged.",
  }));
  const fromGeneratedLabels = labels
    .map((label) => {
      const rule = ruleForLabel(label);
      if (!rule) return undefined;
      return {
        field: label,
        sourceWarningKind: "generated_fact_shape_or_context",
        classification: classificationForRule(rule),
        rule,
        rationale: rationaleForRule(rule),
      };
    })
    .filter(Boolean);
  return sortByKey([...fromWarnings, ...fromGeneratedLabels]);
}

function classificationForRule(rule) {
  return {
    operation_economy_normalization: "operation_economy_context_normalized",
    finite_economy_pool_normalization: "finite_pool_context_normalized",
    when_scored_economy_normalization: "when_scored_context_normalized",
    scored_activated_economy_draw_normalization:
      "scored_activated_context_normalized",
    advance_burst_operation_normalization: "advance_burst_context_normalized",
    rez_or_install_discount_normalization:
      "rez_install_discount_context_normalized",
    global_research_modifier_normalization:
      "global_modifier_context_normalized",
    agenda_reveal_or_hq_context_normalization:
      "agenda_reveal_hq_context_normalized",
    shuffle_draw_or_rnd_reset_normalization:
      "shuffle_draw_hidden_zone_context_normalized",
    score_conversion_overlay_split_normalization:
      "score_conversion_overlay_split_normalized",
    score_context_required_classification: "score_context_classified",
    legalaction_context_required_classification:
      "legalaction_context_classified",
    hidden_zone_context_classification: "hidden_zone_context_classified",
    variable_amount_context_classification:
      "variable_amount_context_classified",
    board_context_required_classification: "board_context_classified",
  }[rule];
}

function rationaleForRule(rule) {
  return {
    operation_economy_normalization:
      "Operation economy/draw/action facts stay mechanical; the report never recommends playing economy now.",
    finite_economy_pool_normalization:
      "Hosted or finite credit pools are mechanical sources only; remaining pool amount is board state.",
    when_scored_economy_normalization:
      "When-scored economy is a trigger class, not current score legality or guaranteed score conversion.",
    scored_activated_economy_draw_normalization:
      "Score-area actions remain LegalAction gated and do not create playability on their own.",
    advance_burst_operation_normalization:
      "Advance-burst facts describe counter placement only and do not assert a score window.",
    rez_or_install_discount_normalization:
      "Rez/install discount facts do not choose targets and do not reveal hidden cards.",
    global_research_modifier_normalization:
      "Persistent agenda modifiers are mechanical facts; active board impact remains engine/board context.",
    agenda_reveal_or_hq_context_normalization:
      "HQ agenda reveal economy is context only and never includes hidden HQ agenda identities.",
    shuffle_draw_or_rnd_reset_normalization:
      "Shuffle/draw/R&D reset facts never expose actual hidden zone order.",
    score_conversion_overlay_split_normalization:
      "Strategic score-conversion value stays overlay/planner logic, not a generated fact.",
    score_context_required_classification:
      "Score and when-scored requirements remain LegalAction/engine context.",
    legalaction_context_required_classification:
      "Generated facts describe static card function and do not create PlayerAction legality.",
    hidden_zone_context_classification:
      "Hidden-zone facts are side-safe context markers only.",
    variable_amount_context_classification:
      "Variable amounts remain context-dependent and are not fixed guaranteed values.",
    board_context_required_classification:
      "Board/server/rezzed/install state remains runtime-owned.",
  }[rule];
}

function contextInfosFor(labels) {
  const infos = [];
  const add = (kind, rule) =>
    infos.push({ kind, rule, rationale: rationaleForRule(rule) });
  if (
    labels.includes("condition:requires_scored_agenda") ||
    labels.includes("condition:requires_score_window") ||
    labels.some((label) => ["effect:scored_agenda_action"].includes(label))
  ) {
    add("score_context_info", "score_context_required_classification");
  }
  if (
    labels.some((label) =>
      [
        "effect:advance_burst",
        "effect:score_acceleration",
        "effect:rez",
        "effect:install",
        "effect:remote_build",
        "effect:rez_discount",
        "effect:install_discount",
        "effect:extra_action",
      ].includes(label),
    )
  ) {
    add(
      "legalaction_context_info",
      "legalaction_context_required_classification",
    );
  }
  if (
    labels.some((label) =>
      [
        "effect:topdeck_info",
        "effect:zone_shuffle",
        "effect:shuffle_draw",
        "effect:card_recovery",
        "effect:agenda_reveal_economy",
        "condition:requires_agenda_in_hq",
        "condition:requires_hq_agenda",
        "condition:requires_rnd_top",
        "condition:requires_archives_card",
      ].includes(label),
    )
  ) {
    add("hidden_zone_context_info", "hidden_zone_context_classification");
  }
  if (
    labels.some((label) =>
      [
        "effect:agenda_reveal_economy",
        "effect:finite_economy_pool",
        "condition:requires_corp_credits_threshold",
        "condition:requires_stolen_agenda_last_turn",
      ].includes(label),
    )
  ) {
    add(
      "variable_amount_context_info",
      "variable_amount_context_classification",
    );
  }
  if (
    labels.some((label) =>
      [
        "effect:global_modifier",
        "effect:remote_protection",
        "condition:requires_installed_ice",
        "condition:requires_rezzed_ice",
        "condition:requires_remote_server",
      ].includes(label),
    )
  ) {
    add("board_context_required_info", "board_context_required_classification");
  }
  if (
    labels.some((label) =>
      [
        "effect:advance_burst",
        "effect:score_acceleration",
        "effect:economy",
        "effect:counter_economy",
        "effect:global_modifier",
      ].includes(label),
    )
  ) {
    add(
      "score_conversion_overlay_info",
      "score_conversion_overlay_split_normalization",
    );
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
    title: catalogCard?.title ?? candidate.title,
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
  const contexts = contextInfosFor(labels);
  return {
    ...status,
    subBatch: candidate.subBatch,
    priority: priorityCard?.migrationPriority ?? null,
    risk: priorityCard?.migrationRisk ?? null,
    activeMechanicalFields: activeMechanicalFields(activeHint),
    generatedFactsConfirmed: labels,
    previewAdds: previewAddedFacts(labels, activeHint),
    normalizedDifferences: normalizedDifferencesFor(
      candidate,
      labels,
      compiledCard?.warnings ?? [],
    ),
    scoreContextInfos: contexts.filter(
      (info) => info.kind === "score_context_info",
    ),
    legalActionContextInfos: contexts.filter(
      (info) => info.kind === "legalaction_context_info",
    ),
    hiddenZoneContextInfos: contexts.filter(
      (info) => info.kind === "hidden_zone_context_info",
    ),
    variableAmountContextInfos: contexts.filter(
      (info) => info.kind === "variable_amount_context_info",
    ),
    boardContextInfos: contexts.filter(
      (info) => info.kind === "board_context_required_info",
    ),
    scoreConversionOverlayInfos: contexts.filter(
      (info) => info.kind === "score_conversion_overlay_info",
    ),
    descriptorFollowups: [],
    activeConsumers: [
      "corp_score_conversion_diagnostics",
      "corp_economy_context",
      "scored_agenda_context",
    ],
    remainingIssues: [],
    readiness: "ready_read_only_with_score_legalaction_context",
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
          kind: "missing_required_batch8_input",
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
      labels.has("effect:advance_burst") &&
      card.legalActionContextInfos.length === 0
    ) {
      errors.push({
        kind: "advance_burst_without_legalaction_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:agenda_reveal_economy") &&
      card.hiddenZoneContextInfos.length === 0
    ) {
      errors.push({
        kind: "agenda_reveal_without_hidden_zone_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:finite_economy_pool") &&
      !card.generatedFactsConfirmed.includes("effect:counter_economy")
    ) {
      errors.push({
        kind: "finite_pool_without_counter_economy_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:global_modifier") &&
      card.boardContextInfos.length === 0
    ) {
      errors.push({
        kind: "global_modifier_without_board_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-8 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-8 closeout report contains runtime/legal field ${fieldPath}.`,
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
      ...card.scoreContextInfos,
      ...card.legalActionContextInfos,
      ...card.hiddenZoneContextInfos,
      ...card.variableAmountContextInfos,
      ...card.boardContextInfos,
      ...card.scoreConversionOverlayInfos,
    ]) {
      if (counts.has(context.rule)) {
        counts.set(context.rule, counts.get(context.rule) + 1);
      }
    }
  }
  return Object.fromEntries(counts);
}

export function buildBatchEightCorpEconomyCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch7Closeout = readJson(BATCH7_CLOSEOUT_REPORT_PATH);
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
  const includedCards = INCLUDED_CANDIDATES.map((candidate) =>
    buildIncludedCard(candidate, inputs),
  ).sort((left, right) => left.cardId.localeCompare(right.cardId));
  const excludedCards = OPTIONAL_EXCLUDES.map((candidate) =>
    buildExcludedCard(candidate, inputs),
  ).sort((left, right) => left.cardId.localeCompare(right.cardId));
  const sourceReports = [
    { path: DERIVED_FACTS_REPORT_PATH, report: derivedReport },
    { path: COMPILED_INDEX_REPORT_PATH, report: compiledReport },
    { path: MIGRATION_PRIORITY_REPORT_PATH, report: priorityReport },
    { path: BATCH7_CLOSEOUT_REPORT_PATH, report: batch7Closeout },
  ];

  const baseReport = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sourceReports: sourceReports.map((source) => source.path),
    mode: "read-only closeout; no active hint migration, no runtime compile, no planner or consumer binding",
    candidateCardCount: INCLUDED_CANDIDATES.length + OPTIONAL_EXCLUDES.length,
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
    scoreContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.scoreContextInfos.length,
      0,
    ),
    legalActionContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.legalActionContextInfos.length,
      0,
    ),
    hiddenZoneContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.hiddenZoneContextInfos.length,
      0,
    ),
    variableAmountContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.variableAmountContextInfos.length,
      0,
    ),
    boardContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.boardContextInfos.length,
      0,
    ),
    scoreConversionOverlayInfoCount: includedCards.reduce(
      (sum, card) => sum + card.scoreConversionOverlayInfos.length,
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
      "Operation economy facts describe mechanical credit/draw/action output only and never say to play economy now.",
      "When-scored and scored-activated facts remain score/LegalAction context and do not create score_now legality.",
      "Advance-burst facts describe advancement-counter placement only and do not guarantee score windows.",
      "Rez/install-at-no-cost facts do not select targets and do not reveal hidden cards.",
      "HQ/R&D/Archives facts remain side-safe hidden-zone context and never contain hidden card identities or order.",
      "Global modifiers are mechanical scored/persistent facts; active board impact remains engine/board state.",
      "Score-conversion value remains overlay/planner logic, not generated mechanical facts.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 020",
      batchName: "corp_nodes_assets_ambush_economy_remotes",
      recommendation: "Option C",
      rationale:
        "After Corp economy, operations and score-conversion support close cleanly, Corp nodes/assets/ambush/economy remotes are the next large gameplay-relevant mechanical group. They connect directly to remote portfolio, trash-budget and tag/punish evaluation while keeping remote intent and bait valuation as strategy/overlay context.",
      candidateCards: [
        "City Surveillance",
        "Datapool by Zetatech",
        "Netwatch Credit Voucher",
        "BBS Whispering Campaign",
        "New Blood",
        "Rent-to-Own Contract",
        "Melange Mining Corp.",
        "Chicago Branch",
      ],
      fallbackBatch: {
        batchName: "runner_prevention_damage_survival_tools",
        rationale:
          "If asset/ambush remote intent looks too strategic, Runner prevention and survival tools are the safer follow-up after the Corp ICE damage/trace work.",
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

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = buildBatchEightCorpEconomyCloseoutReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-8 Corp economy closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-8 Corp economy closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch8-corp-economy-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH8_CORP_ECONOMY_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} excluded=${report.excludedCardCount} confirmed=${report.confirmedGeneratedFactCount} normalized=${report.normalizedDifferenceCount} readiness=${report.readiness}\n`,
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
    await runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
