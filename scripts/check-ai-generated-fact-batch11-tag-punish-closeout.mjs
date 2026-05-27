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
const TASK_ID = "Aufgabe 022";
const SCHEMA_VERSION =
  "ai-generated-fact-batch11-tag-punish-funnel-closeout-v1";
const BATCH_ID = "batch_11_corp_tag_punish_funnel";
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
const BATCH1_ROLLUP_REPORT_PATH =
  "docs/reviews/ai/aufgabe-007-batch1-generated-facts-rollup-report-2026-05-25.json";
const BATCH7_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-018-corp-ice-longtail-closeout-report-2026-05-25.json";
const BATCH9_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-020-corp-nodes-assets-ambush-closeout-report-2026-05-25.json";
const BATCH10_CLOSEOUT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-021-runner-prevention-survival-closeout-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-022-corp-tag-punish-funnel-closeout-report-2026-05-25.json";

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
  "runnerGripCards",
  "runnerStackOrder",
  "hiddenHandCards",
]);

const RUNTIME_FIELDS = new Set([
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
]);

const NORMALIZATION_RULES = [
  "tag_source_window_normalization",
  "trace_tag_condition_normalization",
  "visible_tag_payoff_normalization",
  "agenda_steal_tag_punish_normalization",
  "ambush_tag_punish_normalization",
  "persistent_tag_pressure_normalization",
  "pay_or_take_tag_normalization",
  "tag_punish_funnel_pairing_normalization",
  "terminal_window_context_normalization",
  "runner_survival_countercontext_normalization",
  "legalaction_context_required_classification",
  "board_context_required_classification",
];

const FUNNEL_CANDIDATES = [
  ["onr_v1_207_netwatch-operations-office", "batch_1_scored_agenda_operations"],
  ["onr_v1_208_on-call-solo-team", "batch_1_scored_agenda_operations"],
  ["onr_v1_217_strike-force-kali", "batch_1_scored_agenda_operations"],
  ["onr_v1_283_audit-of-call-records", "batch_1_scored_agenda_operations"],
  ["onr_v1_284_chance-observation", "batch_1_scored_agenda_operations"],
  ["onr_v1_285_closed-accounts", "batch_1_scored_agenda_operations"],
  ["onr_v1_302_scorched-earth", "batch_1_scored_agenda_operations"],
  ["onr_v1_221_asp", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_227_cerberus", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_228_cinderella", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_236_data-raven", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_240_fang", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_241_fang-2-0", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_243_fetch-4-0-1", "batch_7_corp_ice_longtail_future_trace_damage"],
  [
    "onr_v1_246_fragmentation-storm",
    "batch_7_corp_ice_longtail_future_trace_damage",
  ],
  ["onr_v1_248_homewrecker", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_249_hunter", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_251_jack-attack", "batch_7_corp_ice_longtail_future_trace_damage"],
  ["onr_v1_255_mastiff", "batch_7_corp_ice_longtail_future_trace_damage"],
  [
    "onr_v1_260_pocket-virtual-reality",
    "batch_7_corp_ice_longtail_future_trace_damage",
  ],
  ["onr_v1_286_corporate-detective-agency", "batch_9_corp_nodes_assets"],
  ["onr_v1_287_datapool-by-zetatech", "batch_9_corp_nodes_assets"],
  ["onr_v1_293_netwatch-credit-voucher", "batch_9_corp_nodes_assets"],
  ["onr_v1_299_power-grid-overload", "batch_9_corp_nodes_assets"],
  ["onr_v1_306_trojan-horse", "batch_9_corp_nodes_assets"],
  ["onr_v1_307_urban-renewal", "batch_9_corp_nodes_assets"],
  ["onr_v1_310_blood-cat", "batch_9_corp_nodes_assets"],
  ["onr_v1_313_city-surveillance", "batch_9_corp_nodes_assets"],
  ["onr_v1_315_corprunners-shattered-remains", "batch_9_corp_nodes_assets"],
  ["onr_v1_323_experimental-ai", "batch_9_corp_nodes_assets"],
  ["onr_v1_325_hacker-tracker-central", "batch_9_corp_nodes_assets"],
  ["onr_v1_327_i-got-a-rock", "batch_9_corp_nodes_assets"],
  ["onr_v1_333_omniscience-foundation", "batch_9_corp_nodes_assets"],
  ["onr_v1_339_schlaghund", "batch_9_corp_nodes_assets"],
  ["onr_v1_340_setup", "batch_9_corp_nodes_assets"],
  ["onr_v1_342_solo-squad", "batch_9_corp_nodes_assets"],
  ["onr_v1_213_private-cybernet-police", "batch_11_new_funnel_additions"],
  ["onr_v1_301_punitive-counterstrike", "batch_11_new_funnel_additions"],
].map(([cardId, sourceBatch]) => ({ cardId, sourceBatch }));

const COUNTER_CONTEXT_CARD_IDS = [
  "onr_v1_004_bakdoor",
  "onr_v1_022_emergency-self-construct",
  "onr_v1_023_evil-twin",
  "onr_v1_028_force-shield",
  "onr_v1_038_joan-of-arc",
  "onr_v1_051_rabbit",
  "onr_v1_061_shield",
  "onr_v1_063_signpost",
  "onr_v1_116_total-genetic-retrofit",
  "onr_v1_135_nasuko-cycle",
  "onr_v1_161_fall-guy",
];

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
  const labels = [
    ...(derivedFacts.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
  ];
  if (derivedFacts.remoteRole?.kind) {
    labels.push(`remoteRole:${derivedFacts.remoteRole.kind}`);
  }
  return uniqueSorted(labels);
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
  const activeRemoteRole =
    activeHint?.remoteRole?.kind && `remoteRole:${activeHint.remoteRole.kind}`;
  return labels.filter((label) => {
    if (label.startsWith("effect:")) return !activeEffectKinds.has(label);
    if (label.startsWith("condition:")) return !activeConditionKinds.has(label);
    if (label.startsWith("remoteRole:")) return label !== activeRemoteRole;
    return false;
  });
}

function timingWindows(derivedFacts) {
  const windows = [];
  for (const effect of derivedFacts.effects ?? []) {
    windows.push(
      {
        action: "corp_main",
        scored_activated: "scored_activated",
        trace_success: "trace_success",
        on_access: "on_access",
        on_agenda_steal: "on_agenda_steal",
        encounter: "encounter",
        start_of_turn: "start_of_turn",
        persistent: "persistent",
        runner_turn: "runner_turn",
      }[effect.timing],
    );
  }
  return uniqueSorted(windows);
}

function effectGroups(derivedFacts) {
  const effectKinds = new Set(
    (derivedFacts.effects ?? []).map((effect) => effect.kind),
  );
  const groups = [...effectKinds].filter((kind) =>
    [
      "tag_source",
      "tag",
      "trace",
      "damage",
      "counter_economy",
      "tag_punish_payoff",
      "resource_trash",
      "hardware_trash",
      "program_trash",
      "run_lock",
      "persistent_counter_effect",
      "ambush",
      "access_punish",
    ].includes(kind),
  );
  if (
    effectKinds.has("tag_source") &&
    (effectKinds.has("persistent_counter_effect") ||
      (derivedFacts.effects ?? []).some((effect) =>
        ["persistent", "start_of_turn", "runner_turn"].includes(effect.timing),
      ))
  ) {
    groups.push("persistent_tag_pressure");
  }
  if (effectKinds.has("ambush") || effectKinds.has("access_punish")) {
    groups.push("ambush_access_punish");
  }
  return uniqueSorted(groups);
}

function conditionKinds(derivedFacts) {
  return uniqueSorted(
    (derivedFacts.conditions ?? []).map((condition) => condition.kind),
  );
}

function payoffCategories(derivedFacts) {
  const effects = new Set(
    (derivedFacts.effects ?? []).map((effect) => effect.kind),
  );
  const categories = [];
  if (effects.has("tag_source") || effects.has("tag")) {
    categories.push("tag_only");
  }
  if (effects.has("tag_punish_payoff") && effects.has("damage")) {
    categories.push("damage_payoff");
  }
  if (
    effects.has("tag_punish_payoff") &&
    (effects.has("counter_economy") || effects.has("economy"))
  ) {
    categories.push("economic_payoff");
  }
  if (
    effects.has("resource_trash") ||
    effects.has("hardware_trash") ||
    effects.has("program_trash")
  ) {
    categories.push("trash_payoff");
  }
  if (effects.has("run_lock") || effects.has("no_jack_out")) {
    categories.push("run_lock_payoff");
  }
  if (effects.has("persistent_counter_effect")) {
    categories.push("persistent_payoff");
  }
  if (effects.has("ambush") || effects.has("access_punish")) {
    categories.push("ambush_payoff");
  }
  return uniqueSorted(categories);
}

function subBatchFor(derivedFacts, sourceBatch) {
  const effects = new Set(
    (derivedFacts.effects ?? []).map((effect) => effect.kind),
  );
  const conditions = new Set(conditionKinds(derivedFacts));
  if (effects.has("ambush") || effects.has("access_punish")) {
    return "ambush_access_punish";
  }
  if (effects.has("tag_punish_payoff") && effects.has("damage")) {
    return "tag_punish_damage";
  }
  if (effects.has("tag_punish_payoff") && effects.has("counter_economy")) {
    return "tag_punish_economy";
  }
  if (
    effects.has("hardware_trash") ||
    effects.has("program_trash") ||
    effects.has("resource_trash")
  ) {
    return "tag_punish_trash";
  }
  if (effects.has("run_lock") || effects.has("no_jack_out")) {
    return "tag_punish_run_lock";
  }
  if (effects.has("persistent_counter_effect")) {
    return "persistent_tag_or_punish";
  }
  if (sourceBatch.includes("corp_ice")) return "ice_tag_sources";
  if (conditions.has("requires_scored_agenda"))
    return "scored_agenda_tag_sources";
  if (sourceBatch.includes("scored_agenda")) return "operation_tag_sources";
  if (effects.has("trace") && effects.has("tag_source")) {
    return "trace_tag_sources";
  }
  if (effects.has("tag_source")) return "direct_tag_sources";
  return "persistent_tag_or_punish";
}

function ruleForLabel(label) {
  return {
    "effect:tag_source": "tag_source_window_normalization",
    "effect:tag": "tag_source_window_normalization",
    "effect:trace": "trace_tag_condition_normalization",
    "effect:persistent_counter_effect": "persistent_tag_pressure_normalization",
    "effect:tag_punish_payoff": "visible_tag_payoff_normalization",
    "effect:damage": "visible_tag_payoff_normalization",
    "effect:counter_economy": "visible_tag_payoff_normalization",
    "effect:resource_trash": "visible_tag_payoff_normalization",
    "effect:hardware_trash": "visible_tag_payoff_normalization",
    "effect:program_trash": "visible_tag_payoff_normalization",
    "effect:run_lock": "terminal_window_context_normalization",
    "effect:no_jack_out": "terminal_window_context_normalization",
    "effect:ambush": "ambush_tag_punish_normalization",
    "effect:access_punish": "ambush_tag_punish_normalization",
    "effect:remote_tax": "pay_or_take_tag_normalization",
    "condition:requires_trace_success": "trace_tag_condition_normalization",
    "condition:requires_runner_tagged": "visible_tag_payoff_normalization",
    "condition:requires_accessed_card": "ambush_tag_punish_normalization",
    "condition:requires_successful_run":
      "terminal_window_context_normalization",
    "condition:requires_stolen_agenda_last_turn":
      "agenda_steal_tag_punish_normalization",
    "condition:requires_runner_draw": "pay_or_take_tag_normalization",
    "condition:requires_runner_pay_or_take_tag":
      "pay_or_take_tag_normalization",
    "condition:requires_scored_agenda": "tag_source_window_normalization",
    "condition:requires_encounter": "terminal_window_context_normalization",
    "condition:requires_unbroken_subroutine":
      "terminal_window_context_normalization",
    "remoteRole:ambush": "ambush_tag_punish_normalization",
    "remoteRole:tag_punish_asset": "persistent_tag_pressure_normalization",
  }[label];
}

function classificationForRule(rule) {
  return {
    tag_source_window_normalization: "tag_source_window_normalized",
    trace_tag_condition_normalization: "trace_tag_context_normalized",
    visible_tag_payoff_normalization: "visible_tag_payoff_context_normalized",
    agenda_steal_tag_punish_normalization:
      "agenda_steal_tag_context_normalized",
    ambush_tag_punish_normalization: "ambush_access_punish_normalized",
    persistent_tag_pressure_normalization: "persistent_tag_pressure_normalized",
    pay_or_take_tag_normalization: "pay_or_take_tag_context_normalized",
    tag_punish_funnel_pairing_normalization:
      "tag_punish_funnel_pairing_normalized",
    terminal_window_context_normalization: "terminal_window_context_normalized",
    runner_survival_countercontext_normalization:
      "runner_survival_countercontext_normalized",
    legalaction_context_required_classification:
      "legalaction_context_classified",
    board_context_required_classification: "board_context_classified",
  }[rule];
}

function rationaleForRule(rule) {
  return {
    tag_source_window_normalization:
      "Tag sources are grouped by timing window; generated facts do not assert that a tag survives until the next Corp decision.",
    trace_tag_condition_normalization:
      "Trace-based tags keep trace-success context visible and never become guaranteed tags.",
    visible_tag_payoff_normalization:
      "Tagged-runner payoffs keep visible Runner-tag context and do not create current playability.",
    agenda_steal_tag_punish_normalization:
      "Agenda-steal and prior-steal tag/punish facts keep their steal/access context visible.",
    ambush_tag_punish_normalization:
      "Ambush/access-punish facts describe trigger classes and never assert a guaranteed hit.",
    persistent_tag_pressure_normalization:
      "Persistent counter or tag pressure is mechanical only; current counters and tags remain Boardstate.",
    pay_or_take_tag_normalization:
      "Pay-or-take-tag effects keep payment context visible and do not assert a guaranteed tag.",
    tag_punish_funnel_pairing_normalization:
      "Source/payoff pairings are diagnostic funnel evidence only and never action recommendations.",
    terminal_window_context_normalization:
      "Terminal conversion depends on whether a tag exists at Corp decision time; generated facts describe card timing only.",
    runner_survival_countercontext_normalization:
      "Runner survival facts are countercontext only and do not assert a safe Runner state.",
    legalaction_context_required_classification:
      "Generated facts describe static card function and do not create PlayerAction legality.",
    board_context_required_classification:
      "Visible tag, counter, access and encounter state remain board-owned.",
  }[rule];
}

function normalizedDifferencesFor(labels, compiledWarnings) {
  const fromWarnings = (compiledWarnings ?? []).map((warning) => {
    const rule =
      ruleForLabel(warning.fact) ?? "terminal_window_context_normalization";
    return {
      field: warning.field ?? warning.fact ?? warning.kind,
      sourceWarningKind: warning.kind,
      classification: classificationForRule(rule),
      rule,
      rationale:
        "Compiled-index warning is normalized inside the read-only Batch-11 funnel comparator path; active hints and runtime behavior are unchanged.",
    };
  });
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

function contextInfosFor(derivedFacts, labels) {
  const effects = new Set(
    (derivedFacts.effects ?? []).map((effect) => effect.kind),
  );
  const conditions = new Set(conditionKinds(derivedFacts));
  const windows = timingWindows(derivedFacts);
  const infos = [];
  const add = (kind, rule) =>
    infos.push({ kind, rule, rationale: rationaleForRule(rule) });

  if (effects.has("tag_source") || effects.has("tag")) {
    add("tag_source_context_info", "tag_source_window_normalization");
  }
  if (
    effects.has("tag_punish_payoff") ||
    effects.has("damage") ||
    effects.has("counter_economy") ||
    effects.has("resource_trash") ||
    effects.has("hardware_trash") ||
    effects.has("program_trash") ||
    effects.has("run_lock") ||
    effects.has("no_jack_out")
  ) {
    add("punish_payoff_context_info", "visible_tag_payoff_normalization");
  }
  if (
    windows.length > 0 ||
    conditions.has("requires_encounter") ||
    conditions.has("requires_unbroken_subroutine")
  ) {
    add(
      "terminal_window_context_info",
      "terminal_window_context_normalization",
    );
  }
  if (effects.has("trace") || conditions.has("requires_trace_success")) {
    add("trace_success_context_info", "trace_tag_condition_normalization");
  }
  if (conditions.has("requires_runner_tagged")) {
    add("runner_tagged_context_info", "visible_tag_payoff_normalization");
  }
  if (
    conditions.has("requires_accessed_card") ||
    labels.includes("effect:ambush") ||
    labels.includes("effect:access_punish")
  ) {
    add("access_context_info", "ambush_tag_punish_normalization");
  }
  if (
    conditions.has("requires_runner_draw") ||
    conditions.has("requires_runner_pay_or_take_tag")
  ) {
    add("payment_context_info", "pay_or_take_tag_normalization");
  }
  if (
    conditions.has("requires_stolen_agenda_last_turn") ||
    windows.includes("on_agenda_steal")
  ) {
    add("agenda_steal_context_info", "agenda_steal_tag_punish_normalization");
  }
  if (effects.has("persistent_counter_effect")) {
    add(
      "persistent_counter_boardstate_info",
      "persistent_tag_pressure_normalization",
    );
  }
  add(
    "legalaction_context_info",
    "legalaction_context_required_classification",
  );
  return sortByKey(infos);
}

function buildCandidateStatus(candidate, inputs) {
  const activeHint = inputs.activeById.get(candidate.cardId);
  const catalogCard = inputs.catalogById.get(candidate.cardId);
  const pilotCard = inputs.pilotById.get(candidate.cardId);
  const derivedCard = inputs.derivedById.get(candidate.cardId);
  const compiledCard = inputs.compiledById.get(candidate.cardId);
  const priorityCard = inputs.priorityById.get(candidate.cardId);
  const implementationPath = pilotCard?.implementationPath ?? null;
  const implementationFound = Boolean(
    implementationPath && fs.existsSync(repoPath(implementationPath)),
  );
  return {
    cardId: candidate.cardId,
    title: activeHint?.title ?? catalogCard?.title ?? pilotCard?.title,
    side: activeHint?.side ?? catalogCard?.side,
    cardType: activeHint?.cardType ?? catalogCard?.type,
    activeHintFound: Boolean(activeHint),
    runtimeCatalogCardFound: Boolean(catalogCard),
    cardImplementationFound: implementationFound,
    aiSupportStatus: activeHint?.aiSupportStatus ?? null,
    pilotCardFound: Boolean(pilotCard),
    implementationPath,
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
  const derivedFacts = derivedCard?.derivedFacts ?? {};
  const labels = factLabels(derivedFacts);
  const contexts = contextInfosFor(derivedFacts, labels);
  const groups = effectGroups(derivedFacts);
  const categories = payoffCategories(derivedFacts);
  return {
    ...status,
    sourceBatch: candidate.sourceBatch,
    subBatch: subBatchFor(derivedFacts, candidate.sourceBatch),
    priority: priorityCard?.migrationPriority ?? null,
    risk: priorityCard?.migrationRisk ?? null,
    activeMechanicalFields: activeMechanicalFields(activeHint),
    generatedFactsConfirmed: labels,
    previewAdds: previewAddedFacts(labels, activeHint),
    normalizedDifferences: normalizedDifferencesFor(
      labels,
      compiledCard?.warnings ?? [],
    ),
    effectGroups: groups,
    conditions: conditionKinds(derivedFacts),
    timingWindows: timingWindows(derivedFacts),
    payoffCategories: categories,
    tagSourceInfos: contexts.filter(
      (info) => info.kind === "tag_source_context_info",
    ),
    punishPayoffInfos: contexts.filter(
      (info) => info.kind === "punish_payoff_context_info",
    ),
    terminalWindowContextInfos: contexts.filter(
      (info) => info.kind === "terminal_window_context_info",
    ),
    traceContextInfos: contexts.filter(
      (info) => info.kind === "trace_success_context_info",
    ),
    runnerTaggedContextInfos: contexts.filter(
      (info) => info.kind === "runner_tagged_context_info",
    ),
    accessContextInfos: contexts.filter(
      (info) => info.kind === "access_context_info",
    ),
    paymentContextInfos: contexts.filter(
      (info) => info.kind === "payment_context_info",
    ),
    agendaStealContextInfos: contexts.filter(
      (info) => info.kind === "agenda_steal_context_info",
    ),
    persistentCounterContextInfos: contexts.filter(
      (info) => info.kind === "persistent_counter_boardstate_info",
    ),
    legalActionContextInfos: contexts.filter(
      (info) => info.kind === "legalaction_context_info",
    ),
    descriptorFollowups: [],
    activeConsumers: [
      "tag_punish_terminal_diagnostics",
      "tag_punish_ontology_consumer_readiness",
      "runner_survival_countercontext",
    ],
    remainingIssues: [],
    readiness: "ready_read_only_with_terminal_window_context",
  };
}

function crossBatchFunnelCard(card) {
  return {
    cardId: card.cardId,
    title: card.title,
    side: card.side,
    cardType: card.cardType,
    sourceBatch: card.sourceBatch,
    subBatch: card.subBatch,
    effectGroups: card.effectGroups,
    conditions: card.conditions,
    timingWindows: card.timingWindows,
    payoffCategories: card.payoffCategories,
    readiness: card.readiness,
  };
}

function buildSourcePayoffPairings(cards) {
  const sources = cards.filter(
    (card) =>
      card.effectGroups.includes("tag_source") ||
      card.effectGroups.includes("tag"),
  );
  const payoffs = cards.filter(
    (card) =>
      card.runnerTaggedContextInfos.length > 0 &&
      card.punishPayoffInfos.length > 0,
  );
  return sortByKey(
    sources.flatMap((source) =>
      payoffs.map((payoff) => ({
        sourceCardId: source.cardId,
        sourceTitle: source.title,
        sourceWindow: source.timingWindows,
        payoffCardId: payoff.cardId,
        payoffTitle: payoff.title,
        payoffCategory: payoff.payoffCategories,
        pairingKind: "tag_source_to_visible_tag_payoff",
        actionDecisionGenerated: false,
        windowCaveat:
          "Diagnostic pairing only: a later consumer must verify that the tag still exists at Corp decision time and that a legal payoff action is visible.",
        rule: "tag_punish_funnel_pairing_normalization",
      })),
    ),
  );
}

function buildRunnerSurvivalCounterContext(inputs) {
  return COUNTER_CONTEXT_CARD_IDS.map((cardId) => {
    const activeHint = inputs.activeById.get(cardId);
    const catalogCard = inputs.catalogById.get(cardId);
    const derivedCard = inputs.derivedById.get(cardId);
    const labels = factLabels(derivedCard?.derivedFacts ?? {});
    return {
      cardId,
      title: activeHint?.title ?? catalogCard?.title ?? derivedCard?.title,
      sourceBatch: "batch_10_runner_prevention_damage_survival_tools",
      counterContextFacts: labels.filter(
        (label) =>
          label.includes("trace") ||
          label.includes("damage") ||
          label.includes("flatline") ||
          label.includes("tag") ||
          label.includes("trash_prevention") ||
          label.includes("link"),
      ),
      rule: "runner_survival_countercontext_normalization",
      generatedSafeState: false,
      rationale: rationaleForRule(
        "runner_survival_countercontext_normalization",
      ),
    };
  }).sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function normalizationRuleCounts(cards, pairings, counterContexts) {
  const counts = new Map(NORMALIZATION_RULES.map((rule) => [rule, 0]));
  const increment = (rule) => {
    if (counts.has(rule)) counts.set(rule, counts.get(rule) + 1);
  };
  for (const card of cards) {
    for (const difference of card.normalizedDifferences) {
      increment(difference.rule);
    }
    for (const context of [
      ...card.tagSourceInfos,
      ...card.punishPayoffInfos,
      ...card.terminalWindowContextInfos,
      ...card.traceContextInfos,
      ...card.runnerTaggedContextInfos,
      ...card.accessContextInfos,
      ...card.paymentContextInfos,
      ...card.agendaStealContextInfos,
      ...card.persistentCounterContextInfos,
      ...card.legalActionContextInfos,
    ]) {
      increment(context.rule);
    }
  }
  for (const pairing of pairings) increment(pairing.rule);
  for (const context of counterContexts) increment(context.rule);
  return Object.fromEntries(counts);
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
          kind: "missing_required_batch11_input",
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
      labels.has("effect:trace") &&
      labels.has("effect:tag_source") &&
      !labels.has("condition:requires_trace_success")
    ) {
      errors.push({
        kind: "trace_tag_source_without_trace_success",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:tag_punish_payoff") &&
      card.runnerTaggedContextInfos.length === 0
    ) {
      errors.push({
        kind: "tag_punish_payoff_without_runner_tagged_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      (labels.has("effect:ambush") || labels.has("effect:access_punish")) &&
      card.accessContextInfos.length === 0
    ) {
      errors.push({
        kind: "ambush_without_access_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
    if (
      labels.has("effect:persistent_counter_effect") &&
      card.persistentCounterContextInfos.length === 0
    ) {
      errors.push({
        kind: "persistent_counter_without_boardstate_context",
        cardId: card.cardId,
        title: card.title,
      });
    }
  }
  for (const pairing of report.sourcePayoffPairings) {
    if (pairing.actionDecisionGenerated !== false) {
      errors.push({
        kind: "funnel_pairing_generated_action_decision",
        sourceCardId: pairing.sourceCardId,
        payoffCardId: pairing.payoffCardId,
      });
    }
  }
  for (const fieldPath of collectKeyPaths(report, HIDDEN_INFO_FIELDS)) {
    errors.push({
      kind: "hidden_info_field",
      message: `Batch-11 closeout report contains hidden-info field ${fieldPath}.`,
      fieldPath,
    });
  }
  for (const fieldPath of collectKeyPaths(report, RUNTIME_FIELDS)) {
    errors.push({
      kind: "runtime_or_legality_field",
      message: `Batch-11 closeout report contains runtime/legal field ${fieldPath}.`,
      fieldPath,
    });
  }
  return sortByKey(errors);
}

export function buildBatchElevenTagPunishCloseoutReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const catalog = readJson(CATALOG_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const batch1Rollup = readJson(BATCH1_ROLLUP_REPORT_PATH);
  const batch7Closeout = readJson(BATCH7_CLOSEOUT_REPORT_PATH);
  const batch9Closeout = readJson(BATCH9_CLOSEOUT_REPORT_PATH);
  const batch10Closeout = readJson(BATCH10_CLOSEOUT_REPORT_PATH);
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
  const includedCards = FUNNEL_CANDIDATES.map((candidate) =>
    buildIncludedCard(candidate, inputs),
  ).sort((left, right) => left.cardId.localeCompare(right.cardId));
  const excludedCards = [];
  const crossBatchFunnelCards = includedCards.map(crossBatchFunnelCard);
  const sourcePayoffPairings = buildSourcePayoffPairings(includedCards);
  const runnerSurvivalCounterContext =
    buildRunnerSurvivalCounterContext(inputs);
  const sourceReports = [
    { path: DERIVED_FACTS_REPORT_PATH, report: derivedReport },
    { path: COMPILED_INDEX_REPORT_PATH, report: compiledReport },
    { path: MIGRATION_PRIORITY_REPORT_PATH, report: priorityReport },
    { path: BATCH1_ROLLUP_REPORT_PATH, report: batch1Rollup },
    { path: BATCH7_CLOSEOUT_REPORT_PATH, report: batch7Closeout },
    { path: BATCH9_CLOSEOUT_REPORT_PATH, report: batch9Closeout },
    { path: BATCH10_CLOSEOUT_REPORT_PATH, report: batch10Closeout },
  ];

  const tagSourceCards = includedCards.filter(
    (card) =>
      card.effectGroups.includes("tag_source") ||
      card.effectGroups.includes("tag"),
  );
  const visibleTagPayoffCards = includedCards.filter(
    (card) =>
      card.runnerTaggedContextInfos.length > 0 &&
      card.punishPayoffInfos.length > 0,
  );
  const baseReport = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sourceReports: sourceReports.map((source) => source.path),
    mode: "read-only cross-batch funnel closeout; no active hint migration, no runtime compile, no planner or consumer binding",
    candidateCardCount: FUNNEL_CANDIDATES.length,
    includedCardCount: includedCards.length,
    excludedCardCount: excludedCards.length,
    crossBatchCardCount: crossBatchFunnelCards.length,
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
    tagSourceCount: tagSourceCards.length,
    punishPayoffCount: includedCards.filter(
      (card) => card.punishPayoffInfos.length > 0,
    ).length,
    sourcePayoffPairingCount: sourcePayoffPairings.length,
    traceTagSourceCount: tagSourceCards.filter(
      (card) => card.traceContextInfos.length > 0,
    ).length,
    directTagSourceCount: tagSourceCards.filter(
      (card) => card.traceContextInfos.length === 0,
    ).length,
    runnerTurnTagSourceCount: tagSourceCards.filter((card) =>
      card.timingWindows.includes("runner_turn"),
    ).length,
    corpTurnTagSourceCount: tagSourceCards.filter((card) =>
      card.timingWindows.some((window) =>
        ["corp_main", "scored_activated"].includes(window),
      ),
    ).length,
    persistentTagPressureCount: includedCards.filter(
      (card) => card.persistentCounterContextInfos.length > 0,
    ).length,
    visibleTagPayoffCount: visibleTagPayoffCards.length,
    ambushPunishCount: includedCards.filter((card) =>
      card.payoffCategories.includes("ambush_payoff"),
    ).length,
    terminalWindowContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.terminalWindowContextInfos.length,
      0,
    ),
    traceContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.traceContextInfos.length,
      0,
    ),
    runnerTaggedContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.runnerTaggedContextInfos.length,
      0,
    ),
    accessContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.accessContextInfos.length,
      0,
    ),
    legalActionContextInfoCount: includedCards.reduce(
      (sum, card) => sum + card.legalActionContextInfos.length,
      0,
    ),
    runnerSurvivalCounterContextCount: runnerSurvivalCounterContext.length,
    descriptorFollowupCount: includedCards.reduce(
      (sum, card) => sum + card.descriptorFollowups.length,
      0,
    ),
    readiness: "ready_read_only_with_terminal_window_context",
    funnelConsumerReadiness: "ready_for_diagnostic_consumer_review",
    readinessCounts: countBy(includedCards, (card) => card.readiness),
    subBatchReadiness: countBy(includedCards, (card) => card.subBatch),
    normalizationRuleCounts: normalizationRuleCounts(
      includedCards,
      sourcePayoffPairings,
      runnerSurvivalCounterContext,
    ),
    includedCards,
    excludedCards,
    crossBatchFunnelCards,
    sourcePayoffPairings,
    runnerSurvivalCounterContext,
    contextRules: [
      "Trace-based tags keep requires_trace_success and never become guaranteed tags.",
      "Visible-tag payoffs keep requires_runner_tagged and never create current playability.",
      "Runner-turn tags, access tags and persistent tag pressure are not treated as guaranteed Corp-turn Punish state.",
      "Ambush/access-punish facts keep access context and never assert a guaranteed hit.",
      "Source/payoff pairings are diagnostic funnel evidence only; they do not emit action scores or strategy decisions.",
      "Runner survival facts are countercontext only and do not assert that the Runner is currently safe.",
    ],
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 023",
      batchName: "tag_punish_terminal_consumer_diagnostic_slice",
      recommendation: "Option A",
      rationale:
        "The cross-batch funnel now has enough read-only source, payoff, timing and countercontext facts for a diagnostic consumer slice. The next step should measure terminal conversion before any strategy fix: tag created, tag still visible at Corp decision, legal payoff available, payoff taken or skipped, and Runner cleared tag before Corp decision.",
      candidateMetrics: [
        "tag_source_created_tag_during_runner_turn",
        "runner_tag_visible_at_corp_decision",
        "legal_punish_action_available",
        "punish_action_taken",
        "punish_action_skipped",
        "runner_cleared_tag_before_corp_decision",
        "visible_payoff_in_hq_board_or_score_area",
      ],
      fallbackBatch: {
        batchName: "runner_economy_resource_hardware_longtail",
        rationale:
          "If diagnostic consumer work is deferred, Runner economy/resource/hardware remains the safest next read-only data batch.",
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
  const report = buildBatchElevenTagPunishCloseoutReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-11 Tag/Punish funnel closeout report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-11 Tag/Punish funnel closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch11-tag-punish-closeout.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH11_TAG_PUNISH_CLOSEOUT OK candidates=${report.candidateCardCount} included=${report.includedCardCount} crossBatch=${report.crossBatchCardCount} confirmed=${report.confirmedGeneratedFactCount} pairings=${report.sourcePayoffPairingCount} readiness=${report.readiness}\n`,
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
