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
const TASK_ID = "Aufgabe 018";
const SCHEMA_VERSION = "ai-generated-fact-batch7-corp-ice-closeout-v1";
const BATCH_ID = "batch_7_corp_ice_longtail_future_trace_damage";
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
const BATCH6_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-017-runner-info-central-pressure-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-018-corp-ice-longtail-closeout-report-2026-05-25.json";

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
  "ice_trace_tag_normalization",
  "ice_damage_normalization",
  "ice_program_trash_normalization",
  "ice_hardware_trash_normalization",
  "ice_etr_normalization",
  "future_encounter_lock_normalization",
  "run_lock_or_no_jack_out_normalization",
  "persistent_counter_effect_normalization",
  "trace_credit_source_normalization",
  "simple_ice_baseline_normalization",
  "encounter_context_required_classification",
  "trace_success_context_required_classification",
  "runpath_context_required_classification",
  "prevention_context_required_classification",
  "target_selection_context_required_classification",
  "effective_run_quote_priority_annotation",
];

const INCLUDED_CANDIDATES = [
  [
    "onr_v1_222_ball-and-chain",
    "Ball and Chain",
    "future_run_or_future_encounter_ice",
  ],
  [
    "onr_v1_225_canis-major",
    "Canis Major",
    "future_run_or_future_encounter_ice",
  ],
  [
    "onr_v1_226_canis-minor",
    "Canis Minor",
    "future_run_or_future_encounter_ice",
  ],
  [
    "onr_v1_224_bolter-cluster",
    "Bolter Cluster",
    "future_run_or_future_encounter_ice",
  ],
  [
    "onr_v1_258_neural-blade",
    "Neural Blade",
    "future_run_or_future_encounter_ice",
  ],
  ["onr_v1_268_shock-r", "Shock.r", "run_lock_or_jack_out_lock"],
  ["onr_v1_243_fetch-4-0-1", "Fetch 4.0.1", "trace_tag_ice"],
  ["onr_v1_249_hunter", "Hunter", "trace_tag_ice"],
  ["onr_v1_236_data-raven", "Data Raven", "trace_tag_ice"],
  ["onr_v1_223_banpei", "Banpei", "program_or_hardware_trash_ice"],
  ["onr_v1_228_cinderella", "Cinderella", "program_or_hardware_trash_ice"],
  ["onr_v1_231_cortical-scrub", "Cortical Scrub", "damage_ice"],
  ["onr_v1_227_cerberus", "Cerberus", "tag_damage_punish_ice"],
  ["onr_v1_235_data-naga", "Data Naga", "program_or_hardware_trash_ice"],
  [
    "onr_v1_242_fatal-attractor",
    "Fatal Attractor",
    "future_run_or_future_encounter_ice",
  ],
  ["onr_v1_251_jack-attack", "Jack Attack", "run_lock_or_jack_out_lock"],
  ["onr_v1_255_mastiff", "Mastiff", "tag_damage_punish_ice"],
  ["onr_v1_234_data-darts", "Data Darts", "future_run_or_future_encounter_ice"],
  [
    "onr_v1_260_pocket-virtual-reality",
    "Pocket Virtual Reality",
    "trace_tag_ice",
  ],
  [
    "onr_v1_246_fragmentation-storm",
    "Fragmentation Storm",
    "program_or_hardware_trash_ice",
  ],
  ["onr_v1_248_homewrecker", "Homewrecker™", "program_or_hardware_trash_ice"],
  ["onr_v1_221_asp", "Asp", "run_lock_or_jack_out_lock"],
  ["onr_v1_240_fang", "Fang", "run_lock_or_jack_out_lock"],
  ["onr_v1_241_fang-2-0", "Fang 2.0", "run_lock_or_jack_out_lock"],
].map(([cardId, title, subBatch]) => ({
  cardId,
  title,
  subBatch,
  include: true,
  expectedSide: "corp",
  expectedCardType: "ice",
  implementationPath: `packages/engine/src/card-implementations/onr-v1/corp/ice/${cardId.replace(/^onr_v1_\d+_/, "")}.ts`,
}));

const OPTIONAL_EXCLUDES = [
  ["onr_v1_254_laser-wire", "Laser Wire"],
  ["onr_v1_264_razor-wire", "Razor Wire"],
  ["onr_v1_257_nerve-labyrinth", "Nerve Labyrinth"],
  ["onr_v1_229_code-corpse", "Code Corpse"],
  ["onr_v1_253_liche", "Liche"],
  ["onr_v1_250_ice-pick-willie", "Ice Pick Willie"],
  ["onr_v1_238_darc-knight", "D'Arc Knight", "d-arc-knight.ts"],
  ["onr_v1_230_cortical-scanner", "Cortical Scanner"],
  ["onr_v1_252_keeper", "Keeper"],
  ["onr_v1_256_mazer", "Mazer"],
  ["onr_v1_263_quandary", "Quandary"],
  ["onr_v1_265_reinforced-wall", "Reinforced Wall"],
  ["onr_v1_232_crystal-wall", "Crystal Wall"],
  ["onr_v1_244_fire-wall", "Fire Wall"],
  ["onr_v1_233_data-wall", "Data Wall"],
  ["onr_v1_239_data-wall-2-0", "Data Wall 2.0"],
  ["onr_v1_281_wall-of-static", "Wall of Static"],
  ["onr_v1_280_wall-of-ice", "Wall of Ice"],
  ["onr_v1_245_filter", "Filter"],
  ["onr_v1_247_haunting-inquisition", "Haunting Inquisition"],
].map(([cardId, title, fileName]) => ({
  cardId,
  title,
  include: false,
  subBatch: "excluded_or_out_of_scope",
  expectedSide: "corp",
  expectedCardType: "ice",
  implementationPath: `packages/engine/src/card-implementations/onr-v1/corp/ice/${
    fileName ?? `${cardId.replace(/^onr_v1_\d+_/, "")}.ts`
  }`,
  excludedReason:
    "Optional ICE candidate was checked but kept outside Batch 7 to keep this bundled closeout focused on the primary Future/Trace/Damage/ETR longtail set; no silent exclude.",
}));

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
    "effect:trace": "ice_trace_tag_normalization",
    "effect:tag_source": "ice_trace_tag_normalization",
    "effect:damage": "ice_damage_normalization",
    "effect:program_trash": "ice_program_trash_normalization",
    "effect:hardware_trash": "ice_hardware_trash_normalization",
    "effect:etr": "ice_etr_normalization",
    "effect:future_run_effect": "future_encounter_lock_normalization",
    "effect:future_encounter_effect": "future_encounter_lock_normalization",
    "effect:run_lock": "run_lock_or_no_jack_out_normalization",
    "effect:no_jack_out": "run_lock_or_no_jack_out_normalization",
    "effect:persistent_counter_effect":
      "persistent_counter_effect_normalization",
    "effect:trace_credit": "trace_credit_source_normalization",
    "effect:remote_protection": "simple_ice_baseline_normalization",
    "effect:run_tax": "simple_ice_baseline_normalization",
    "condition:requires_encounter": "encounter_context_required_classification",
    "condition:requires_unbroken_subroutine":
      "encounter_context_required_classification",
    "condition:requires_trace_success":
      "trace_success_context_required_classification",
    "condition:requires_during_run": "runpath_context_required_classification",
    "condition:requires_later_encounter":
      "runpath_context_required_classification",
    "condition:requires_remaining_ice":
      "runpath_context_required_classification",
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
      "Compiled-index warning is normalized inside the read-only Batch-7 comparator path; active hints and runtime behavior are unchanged.",
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
    ice_trace_tag_normalization: "trace_tag_context_normalized",
    ice_damage_normalization: "damage_context_normalized",
    ice_program_trash_normalization: "program_trash_context_normalized",
    ice_hardware_trash_normalization: "hardware_trash_context_normalized",
    ice_etr_normalization: "etr_context_normalized",
    future_encounter_lock_normalization:
      "future_encounter_runpath_context_normalized",
    run_lock_or_no_jack_out_normalization:
      "run_lock_or_no_jack_out_context_normalized",
    persistent_counter_effect_normalization:
      "persistent_counter_context_normalized",
    trace_credit_source_normalization: "trace_credit_context_normalized",
    simple_ice_baseline_normalization: "simple_ice_baseline_normalized",
    encounter_context_required_classification: "encounter_context_classified",
    trace_success_context_required_classification:
      "trace_success_context_classified",
    runpath_context_required_classification: "runpath_context_classified",
    prevention_context_required_classification: "prevention_context_classified",
    target_selection_context_required_classification:
      "target_selection_context_classified",
    effective_run_quote_priority_annotation:
      "effective_run_quote_context_classified",
  }[rule];
}

function rationaleForRule(rule) {
  return {
    ice_trace_tag_normalization:
      "Trace/tag facts remain conditioned on trace success; generated facts never guarantee tags.",
    ice_damage_normalization:
      "Damage facts describe subroutine mechanics only; prevention, prevention impossibility and flatline resolution remain engine context.",
    ice_program_trash_normalization:
      "Program trash facts describe possible subroutine effects only; target choice and trash legality remain encounter context.",
    ice_hardware_trash_normalization:
      "Hardware trash facts preserve trace-success context; target choice remains engine-owned.",
    ice_etr_normalization:
      "ETR facts describe printed subroutines only and do not create static remote safety.",
    future_encounter_lock_normalization:
      "Future encounter effects require later-encounter/remaining-ICE runpath context and are not current self-ETR.",
    run_lock_or_no_jack_out_normalization:
      "Run-lock and no-jack-out facts describe restrictions only and do not create PlayerAction legality.",
    persistent_counter_effect_normalization:
      "Persistent counter effects describe card mechanics only; generated facts do not assert current counter state.",
    trace_credit_source_normalization:
      "Trace-only credits are mechanical credit sources; trace bidding remains LegalAction/engine context.",
    simple_ice_baseline_normalization:
      "Simple ICE baseline facts stay mechanical and legacy roles remain compatibility fields.",
    encounter_context_required_classification:
      "Encounter and unbroken-subroutine requirements remain LegalAction/engine context.",
    trace_success_context_required_classification:
      "Trace success is a condition, not a guaranteed payoff.",
    runpath_context_required_classification:
      "Runpath and later-ICE facts remain effectiveRunQuote and board-context guarded.",
    prevention_context_required_classification:
      "Prevention notes stay context; no kill certainty is generated.",
    target_selection_context_required_classification:
      "Trash effects do not generate concrete target selection.",
    effective_run_quote_priority_annotation:
      "Concrete path costs and safety remain effectiveRunQuote-owned.",
  }[rule];
}

function contextInfosFor(labels) {
  const infos = [];
  const add = (kind, rule) =>
    infos.push({ kind, rule, rationale: rationaleForRule(rule) });
  if (
    labels.includes("condition:requires_encounter") ||
    labels.includes("condition:requires_unbroken_subroutine") ||
    labels.includes("effect:etr")
  ) {
    add(
      "encounter_context_required_info",
      "encounter_context_required_classification",
    );
  }
  if (
    labels.includes("condition:requires_trace_success") ||
    labels.includes("effect:trace") ||
    labels.includes("effect:tag_source") ||
    labels.includes("effect:trace_credit")
  ) {
    add(
      "trace_success_context_info",
      "trace_success_context_required_classification",
    );
  }
  if (
    labels.includes("effect:future_run_effect") ||
    labels.includes("effect:future_encounter_effect") ||
    labels.includes("condition:requires_later_encounter") ||
    labels.includes("condition:requires_remaining_ice") ||
    labels.includes("condition:requires_during_run")
  ) {
    add(
      "runpath_context_required_info",
      "runpath_context_required_classification",
    );
  }
  if (labels.includes("effect:damage")) {
    add(
      "prevention_context_info",
      "prevention_context_required_classification",
    );
  }
  if (
    labels.includes("effect:program_trash") ||
    labels.includes("effect:hardware_trash")
  ) {
    add(
      "target_selection_context_info",
      "target_selection_context_required_classification",
    );
  }
  if (
    labels.some((label) =>
      [
        "effect:etr",
        "effect:run_tax",
        "effect:future_run_effect",
        "effect:future_encounter_effect",
      ].includes(label),
    )
  ) {
    add(
      "effective_run_quote_priority_info",
      "effective_run_quote_priority_annotation",
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
    encounterContextInfos: contexts.filter(
      (info) => info.kind === "encounter_context_required_info",
    ),
    traceSuccessContextInfos: contexts.filter(
      (info) => info.kind === "trace_success_context_info",
    ),
    runpathContextInfos: contexts.filter(
      (info) => info.kind === "runpath_context_required_info",
    ),
    preventionContextInfos: contexts.filter(
      (info) => info.kind === "prevention_context_info",
    ),
    targetSelectionContextInfos: contexts.filter(
      (info) => info.kind === "target_selection_context_info",
    ),
    effectiveRunQuoteContextInfos: contexts.filter(
      (info) => info.kind === "effective_run_quote_priority_info",
    ),
    descriptorFollowups: [],
    activeConsumers: [
      "tag_punish_diagnostics",
      "remote_safety_diagnostics",
      "effective_run_quote_context",
    ],
    remainingIssues: [],
    readiness: "ready_read_only_with_encounter_trace_runpath_context",
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
          kind: "missing_required_batch7_input",
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
      (labels.has("effect:tag_source") ||
        labels.has("effect:hardware_trash") ||
        ["Cinderella", "Homewrecker™"].includes(card.title)) &&
      !labels.has("condition:requires_trace_success")
    ) {
      errors.push({
        kind: "trace_payoff_without_trace_success_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      (labels.has("effect:future_run_effect") ||
        labels.has("effect:future_encounter_effect")) &&
      card.runpathContextInfos.length === 0
    ) {
      errors.push({
        kind: "future_effect_without_runpath_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:persistent_counter_effect") &&
      card.generatedFactsConfirmed.some((label) =>
        ["effect:current_counter_state", "effect:counter_state"].includes(
          label,
        ),
      )
    ) {
      errors.push({
        kind: "persistent_counter_current_state_leak",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-7 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-7 closeout report contains runtime/legal field ${fieldPath}.`,
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
      ...card.traceSuccessContextInfos,
      ...card.runpathContextInfos,
      ...card.preventionContextInfos,
      ...card.targetSelectionContextInfos,
      ...card.effectiveRunQuoteContextInfos,
    ]) {
      if (counts.has(context.rule)) {
        counts.set(context.rule, counts.get(context.rule) + 1);
      }
    }
  }
  return Object.fromEntries(counts);
}

export function buildBatchSevenCorpIceCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch6Closeout = readJson(BATCH6_CLOSEOUT_REPORT_PATH);
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
    { path: BATCH6_CLOSEOUT_REPORT_PATH, report: batch6Closeout },
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
    encounterContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.encounterContextInfos.length,
      0,
    ),
    traceSuccessContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.traceSuccessContextInfos.length,
      0,
    ),
    runpathContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.runpathContextInfos.length,
      0,
    ),
    preventionContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.preventionContextInfos.length,
      0,
    ),
    targetSelectionContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.targetSelectionContextInfos.length,
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
    includedCards,
    excludedCards,
    contextRules: [
      "Trace payoffs remain requires_trace_success facts and are never guaranteed tags, damage or trash.",
      "Damage facts describe subroutine mechanics only; prevention, unpreventable damage handling and flatline resolution remain engine context.",
      "Program and hardware trash facts do not choose targets and do not create immediate trash legality.",
      "Future-run and future-encounter facts require runpath, remaining-ICE and later-encounter context and are not current self-ETR safety.",
      "ETR facts describe printed subroutines only; concrete remote safety still depends on board, encounter, breakers and effectiveRunQuote.",
      "Persistent counter effects describe card mechanics only and do not assert current counter state.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 019",
      batchName: "corp_economy_operation_advance_burst_longtail",
      recommendation: "Option C",
      rationale:
        "After Corp ICE trace/damage/ETR closes cleanly, Corp economy and advance-burst operations are the next direct score-conversion lever. Their mechanical economy/advance outputs are tractable, while board/history conditions can remain explicit context.",
      candidateCards: [
        "Project Consultants",
        "Systematic Layoffs",
        "Team Restructuring",
        "Night Shift",
        "Overtime Incentives",
        "Planning Consultants",
        "Off-Site Backups",
        "Silver Lining Recovery Protocol",
        "Corporate Downsizing",
      ],
      fallbackBatch: {
        batchName: "corp_agenda_global_research_effects_longtail",
        rationale:
          "If operation history context looks too broad, scored/global agenda effects are the cleaner continuation from existing agenda closeouts.",
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
  const report = buildBatchSevenCorpIceCloseoutReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-7 Corp ICE closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-7 Corp ICE closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch7-corp-ice-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH7_CORP_ICE_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} excluded=${report.excludedCardCount} confirmed=${report.confirmedGeneratedFactCount} normalized=${report.normalizedDifferenceCount} readiness=${report.readiness}\n`,
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
