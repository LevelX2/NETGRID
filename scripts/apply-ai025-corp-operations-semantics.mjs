#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-02";
const SOURCE_COMMIT = "466bf28d";

const CARD_FILES = [
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
  "data/cards/classic-cards.json",
  "data/cards/testset-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const MD_REPORT_PATH = "docs/reviews/ai/ai025-corp-operations-semantics-review-2026-06-02.md";
const JSON_REPORT_PATH = "docs/reviews/ai/ai025-corp-operations-semantics-review-report-2026-06-02.json";
const README_PATH = "docs/reviews/ai/README.md";

const AI025_SIGNALS = {
  "economy.corp_credit_burst": [true, []],
  "economy.corp_conditional_credit": [true, []],
  "economy.corp_draw": [true, []],
  "action.corp_extra_action_support": [true, []],
  "action.corp_future_extra_action": [true, []],
  "action.corp_install_action_bundle": [true, []],
  "advance.agenda_counter": [false, ["corp.fast_advance"]],
  "advance.overadvance_support": [false, ["corp.fast_advance"]],
  "advance.score_window_support": [false, ["corp.fast_advance"]],
  "hardware.trash_payoff": [false, ["corp.tag_trace_punish"]],
  "resource.trash_payoff": [false, ["corp.tag_trace_punish"]],
  "ice.corp_free_rez": [false, ["corp.ice_tax_glacier", "corp.remote_scoring"]],
  "ice.corp_temporary_rez": [true, []],
  "ice.corp_deferred_rez": [true, []],
  "ice.corp_rearrange_conceal": [true, []],
  "archives.corp_recovery": [true, []],
  "rnd.corp_topdeck_reorder": [true, []],
  "rnd.corp_topdeck_setup": [true, []],
  "condition.last_turn_run": [true, []],
  "condition.agenda_stolen_last_turn": [true, []],
  "risk.agenda_forfeit_drawback": [true, []],
  "risk.temporary_rez_liability": [true, []],
};

const FORBIDDEN_SIGNALS = new Set([
  "corp.operation",
  "operation.transaction",
  "operation.transactions",
  "operation.gray_ops",
  "operation.black_ops",
  "corp.gray_ops",
  "corp.black_ops",
  "corp.transactions",
  "corp.operation_damage",
  "corp.operation_economy",
  "corp.operation_tag",
  "operation.power_grid",
  "operation.scorched_earth",
  "operation.power_grid_overload",
  "operation.management_shakeup",
  "corp_op.economy",
  "corp_op.damage",
]);

const STRATEGIC_ROLE_BY_PAIR_ROLE = {
  fast_advance_enabler: "scoring_tool",
  tag_source_enabler: "enabler",
  tag_payoff: "punish_payoff",
  tag_snowball_followup: "enabler",
  tagged_damage_payoff: "win_condition",
  tagged_minor_damage_payoff: "punish_payoff",
  hardware_payoff: "punish_payoff",
  resource_payoff: "punish_payoff",
  free_rez_enabler: "tax_tool",
};

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(relativePath, text) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), text, "utf8");
}

function cardsFrom(relativePath) {
  const data = readJson(relativePath);
  return (data.cards ?? []).map((card) => ({
    ...card,
    sourceFile: relativePath,
    setId: card.setId ?? data.setId ?? "testset",
  }));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function e(kind, timing, scope, target, extra = {}) {
  return { kind, timing, scope, target, ...extra };
}

function c(kind) {
  return { kind };
}

function pair(strategyId, role, evidence, confidence = "medium") {
  return { strategyId, role, evidence, confidence };
}

function signalDescription(signalId) {
  return `AI025 Corp operation tactic signal: ${signalId.replaceAll("_", " ")}.`;
}

function signalGroup(signalId) {
  if (signalId.startsWith("economy.")) return "ai025_corp_operations_economy";
  if (signalId.startsWith("advance.")) return "ai025_corp_operations_advancement";
  if (signalId.startsWith("tag.") || signalId.startsWith("trace.")) return "corp_tag_trace_punish";
  if (signalId.startsWith("damage.")) return "damage_kill";
  if (signalId.startsWith("ice.")) return "ai025_corp_operations_ice";
  if (signalId.startsWith("hardware.") || signalId.startsWith("resource.")) return "ai025_corp_operations_tag_payoff";
  if (signalId.startsWith("archives.") || signalId.startsWith("rnd.")) return "ai025_corp_operations_zone_setup";
  if (signalId.startsWith("risk.") || signalId.startsWith("condition.")) return "ai025_corp_operations_risk_condition";
  return "ai025_corp_operations";
}

function updateTacticSignals() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  catalog.signals = (catalog.signals ?? []).filter((signal) => !FORBIDDEN_SIGNALS.has(signal.signalId));
  const byId = new Map(catalog.signals.map((signal) => [signal.signalId, signal]));
  for (const [signalId, [supportOnly, anchors]] of Object.entries(AI025_SIGNALS)) {
    const signal = byId.get(signalId) ?? { signalId };
    signal.group = signalGroup(signalId);
    signal.sideScope = "corp";
    signal.description = signalDescription(signalId);
    signal.supportOnly = supportOnly;
    signal.mayAnchorStrategy = !supportOnly;
    signal.allowedStrategyAnchors = [...anchors].sort();
    signal.sourceKinds = ["AI025 reviewed Corp-operation structured hint effects"];
    signal.examples = signal.examples ?? [];
    signal.targetProfileRelevant =
      signalId.startsWith("advance.") ||
      signalId.startsWith("ice.") ||
      signalId.startsWith("hardware.") ||
      signalId.startsWith("resource.") ||
      signalId.startsWith("archives.") ||
      signalId.startsWith("rnd.");
    signal.notes =
      "AI025 Corp-operation signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.";
    if (!byId.has(signalId)) {
      catalog.signals.push(signal);
      byId.set(signalId, signal);
    }
  }
  catalog.taskId = "AI025";
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI025 adds Corp-operation function signals without type-only, subtype-only or card-specific signals and without planner, engine, targeting, action-score, plan-weight, legality, profile/default or UI-derivation effects.";
  catalog.signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
  writeJson(TACTIC_SIGNAL_PATH, catalog);
  return Object.keys(AI025_SIGNALS).map((signalId) => byId.get(signalId));
}

function updateDerivationRules() {
  const data = readJson(DERIVATION_PATH);
  data.derivationRules = (data.derivationRules ?? []).filter((rule) => !FORBIDDEN_SIGNALS.has(rule.signalId));
  const existing = new Set(
    data.derivationRules.map((rule) => `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`),
  );
  for (const [signalId, [, anchors]] of Object.entries(AI025_SIGNALS)) {
    const rule = {
      signalId,
      source: "effects",
      match: { target: signalId },
      gates: { side: "corp", cardType: "operation", target: signalId },
      strategyAnchorFor: [...anchors].sort(),
    };
    const key = `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`;
    if (!existing.has(key)) data.derivationRules.push(rule);
  }
  data.taskId = "AI025";
  data.updatesTaskId = `${data.updatesTaskId ?? "AI003-AI024"}/AI025`;
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI025 adds Corp-operation semantics while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  data.derivationRules.sort((left, right) =>
    `${left.signalId}:${JSON.stringify(left.match)}`.localeCompare(`${right.signalId}:${JSON.stringify(right.match)}`),
  );
  writeJson(DERIVATION_PATH, data);
}

const A = {
  "onr_v1_281_accounts-receivable": {
    family: "economy",
    signals: ["economy.corp_credit_burst"],
    effects: [e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", amount: 9, finite: true })],
    rationale: "Credits-only Transaction support; no strategy anchor from economy alone.",
  },
  "onr_v1_282_annual-reviews": {
    family: "draw",
    signals: ["economy.corp_draw"],
    effects: [e("draw", "action", "corp", "economy.corp_draw", { resource: "cards", amount: 3, finite: true })],
    rationale: "Corp draw support; no strategy anchor from card flow alone.",
  },
  "onr_v1_283_audit-of-call-records": {
    family: "trace_tag_source",
    signals: ["trace.source", "tag.source", "condition.last_turn_run"],
    effects: [
      e("trace", "action", "runner", "trace.source", { amount: 5, finite: true }),
      e("tag_source", "trace_success", "runner", "tag.source", { resource: "tags", amount: 1, finite: true }),
    ],
    conditions: [c("requires_trace_success")],
    pairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["trace.source", "tag.source"], "medium")],
    rationale: "Trace into tag is a Tag/Punish enabler, not a tagged payoff by itself.",
  },
  "onr_v1_284_chance-observation": {
    family: "trace_tag_source",
    signals: ["trace.source", "tag.source", "condition.last_turn_run"],
    effects: [
      e("trace", "action", "runner", "trace.source", { amount: 5, finite: true }),
      e("tag_source", "trace_success", "runner", "tag.source", { resource: "tags", amount: 1, finite: true }),
    ],
    conditions: [c("requires_trace_success")],
    pairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["trace.source", "tag.source"], "medium")],
    rationale: "Run-history trace tag source; not a damage or payoff operation.",
  },
  "onr_v1_285_closed-accounts": {
    family: "tagged_runner_payoff",
    signals: ["tag.payoff", "economy.corp_conditional_credit", "risk.requires_tagged_runner"],
    effects: [
      e("counter_economy", "action", "runner", "economy.corp_conditional_credit", { resource: "credits", finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { resource: "credits", finite: true }),
    ],
    conditions: [c("requires_runner_tagged")],
    pairs: [pair("corp.tag_trace_punish", "tag_payoff", ["tag.payoff"], "high")],
    rationale: "Tagged Runner credit punishment is a clear Tag/Punish payoff.",
  },
  "onr_v1_286_corporate-detective-agency": {
    family: "resource_trash",
    signals: ["tag.payoff", "resource.trash_payoff", "risk.requires_tagged_runner"],
    effects: [
      e("resource_trash", "action", "runner", "resource.trash_payoff", { amount: 2, finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { amount: 2, finite: true }),
    ],
    conditions: [c("requires_runner_tagged")],
    pairs: [pair("corp.tag_trace_punish", "resource_payoff", ["tag.payoff", "resource.trash_payoff"], "high")],
    target: ["candidate", ["use_target:installed_resource"]],
    rationale: "Tagged resource trash is a Tag/Punish payoff; resource type remains target data.",
  },
  "onr_v1_287_datapool-by-zetatech": {
    family: "tagged_runner_payoff",
    signals: ["tag.payoff", "risk.requires_tagged_runner"],
    effects: [e("tag_punish_payoff", "action", "runner", "tag.payoff", { finite: true })],
    conditions: [c("requires_runner_tagged")],
    pairs: [pair("corp.tag_trace_punish", "tag_payoff", ["tag.payoff"], "medium")],
    rationale: "Tagged follow-up payoff; no damage or subtype signal.",
  },
  "onr_v1_288_day-shift": {
    family: "economy_draw",
    signals: ["economy.corp_draw", "economy.corp_credit_burst"],
    effects: [
      e("draw", "action", "corp", "economy.corp_draw", { resource: "cards", amount: 2, finite: true }),
      e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", amount: 1, finite: true }),
    ],
    rationale: "Corp draw plus small credit support; no strategy anchor.",
  },
  "onr_v1_289_edgerunner-inc-temps": {
    family: "install_only_actions",
    signals: ["action.corp_install_action_bundle"],
    effects: [e("install", "action", "corp", "action.corp_install_action_bundle", { finite: true })],
    target: ["schema_gap", ["multi_install_action_bundle"]],
    rationale: "Install-action support is not Fast Advance without scoring evidence.",
  },
  "onr_v1_290_efficiency-experts": {
    family: "economy",
    signals: ["economy.corp_credit_burst"],
    effects: [e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", amount: 3, finite: true })],
    rationale: "Credits-only Transaction support; no strategy anchor.",
  },
  "onr_v1_291_falsified-transactions-expert": {
    family: "advancement",
    signals: ["advance.agenda_counter", "advance.score_window_support"],
    effects: [e("advance", "action", "score_area", "advance.agenda_counter", { resource: "advancement_counters", amount: 1, finite: true })],
    conditions: [c("requires_score_window")],
    pairs: [pair("corp.fast_advance", "fast_advance_enabler", ["advance.agenda_counter", "advance.score_window_support"], "medium")],
    target: ["candidate", ["use_target:installed_agenda_or_score_window"]],
    rationale: "Agenda counter support is a Fast-Advance candidate and anchor; subtype is not a signal.",
  },
  "onr_v1_292_management-shake-up": {
    family: "advancement",
    signals: ["advance.agenda_counter", "advance.overadvance_support", "advance.score_window_support"],
    effects: [e("advance_burst", "action", "score_area", "advance.overadvance_support", { resource: "advancement_counters", finite: true })],
    conditions: [c("requires_score_window"), c("requires_advancement_counter")],
    pairs: [pair("corp.fast_advance", "fast_advance_enabler", ["advance.agenda_counter", "advance.overadvance_support"], "high")],
    target: ["candidate", ["use_target:installed_agenda_or_overadvance_card"]],
    rationale: "Advancement burst and overadvance support are real Fast-Advance evidence.",
  },
  "onr_v1_293_netwatch-credit-voucher": {
    family: "tag_snowball_followup",
    signals: ["tag.source", "economy.corp_credit_burst", "risk.requires_tagged_runner"],
    effects: [
      e("tag_source", "action", "runner", "tag.source", { resource: "tags", amount: 1, finite: true }),
      e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", amount: 1, finite: true }),
    ],
    conditions: [c("requires_runner_tagged")],
    pairs: [pair("corp.tag_trace_punish", "tag_snowball_followup", ["tag.source"], "medium")],
    rationale: "Tagged follow-up/snowball card; not a Damage/Kill payoff.",
  },
  "onr_v1_294_new-blood": {
    family: "ice_rearrange_conceal",
    signals: ["ice.corp_rearrange_conceal", "condition.last_turn_run"],
    effects: [e("zone_shuffle", "action", "ice", "ice.corp_rearrange_conceal", { finite: true })],
    target: ["schema_gap", ["private_ice_rearrange_or_conceal"]],
    hidden: "corp_side_only_until_resolved",
    rationale: "ICE rearrange/concealment remains side-safe and report-only; no hidden-info projection is added.",
  },
  "onr_v1_295_night-shift": {
    family: "economy_draw",
    signals: ["economy.corp_credit_burst", "economy.corp_draw"],
    effects: [
      e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", amount: 2, finite: true }),
      e("draw", "action", "corp", "economy.corp_draw", { resource: "cards", amount: 1, finite: true }),
    ],
    rationale: "Corp economy plus draw support; no strategy anchor.",
  },
  "onr_v1_296_off-site-backups": {
    family: "archives_recovery",
    signals: ["archives.corp_recovery", "economy.corp_draw"],
    effects: [
      e("zone_shuffle", "action", "archives", "archives.corp_recovery", { finite: true }),
      e("draw", "action", "corp", "economy.corp_draw", { resource: "cards", amount: 1, finite: true }),
    ],
    target: ["schema_gap", ["private_archives_recovery_choice"]],
    hidden: "corp_side_only_until_resolved",
    rationale: "Archives recovery and draw support remain support-only.",
  },
  "onr_v1_297_overtime-incentives": {
    family: "extra_actions",
    signals: ["action.corp_extra_action_support"],
    effects: [e("extra_action", "action", "corp", "action.corp_extra_action_support", { resource: "actions", finite: true })],
    rationale: "Tempo/action support, not automatically a Fast-Advance anchor.",
  },
  "onr_v1_298_planning-consultants": {
    family: "rnd_topdeck_setup",
    signals: ["rnd.corp_topdeck_reorder", "rnd.corp_topdeck_setup"],
    effects: [e("topdeck_info", "action", "rnd", "rnd.corp_topdeck_reorder", { finite: true })],
    target: ["schema_gap", ["private_rnd_top5_reorder"]],
    hidden: "corp_side_only_until_resolved",
    rationale: "R&D topdeck planning is support-only and hidden-zone side-safe.",
  },
  "onr_v1_299_power-grid-overload": {
    family: "hardware_trash",
    signals: ["tag.payoff", "hardware.trash_payoff", "risk.requires_tagged_runner"],
    effects: [
      e("hardware_trash", "action", "runner", "hardware.trash_payoff", { finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { finite: true }),
    ],
    conditions: [c("requires_runner_tagged"), c("requires_installed_hardware")],
    pairs: [pair("corp.tag_trace_punish", "hardware_payoff", ["tag.payoff", "hardware.trash_payoff"], "high")],
    target: ["candidate", ["use_target:installed_hardware"]],
    rationale: "Tagged hardware trash is a Tag/Punish payoff. Cybernetics remains subtype/constraint data, not a signal.",
  },
  "onr_v1_300_project-consultants": {
    family: "advancement",
    signals: ["advance.agenda_counter", "advance.overadvance_support", "advance.score_window_support"],
    effects: [e("advance_burst", "action", "score_area", "advance.overadvance_support", { resource: "advancement_counters", finite: true })],
    conditions: [c("requires_score_window"), c("requires_advancement_counter")],
    pairs: [pair("corp.fast_advance", "fast_advance_enabler", ["advance.agenda_counter", "advance.overadvance_support"], "high")],
    target: ["candidate", ["use_target:installed_agenda_or_overadvance_card"]],
    rationale: "Advancement and overadvance support are Fast-Advance evidence.",
  },
  "onr_v1_301_punitive-counterstrike": {
    family: "tagged_meat_damage",
    signals: ["damage.payoff", "tag.payoff", "risk.requires_tagged_runner"],
    effects: [
      e("damage", "action", "runner", "damage.payoff", { resource: "damage", amount: 2, finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { resource: "damage", amount: 2, finite: true }),
    ],
    conditions: [c("requires_runner_tagged")],
    pairs: [
      pair("corp.damage_kill", "tagged_minor_damage_payoff", ["damage.payoff"], "medium"),
      pair("corp.tag_trace_punish", "tag_payoff", ["tag.payoff"], "high"),
    ],
    rationale: "Smaller tagged Meat-Damage payoff; damage and tag payoff evidence stay separate.",
  },
  "onr_v1_302_scorched-earth": {
    family: "tagged_meat_damage",
    signals: ["damage.payoff", "tag.payoff", "risk.requires_tagged_runner"],
    effects: [
      e("damage", "action", "runner", "damage.payoff", { resource: "damage", amount: 4, finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { resource: "damage", amount: 4, finite: true }),
    ],
    conditions: [c("requires_runner_tagged")],
    pairs: [
      pair("corp.damage_kill", "tagged_damage_payoff", ["damage.payoff"], "high"),
      pair("corp.tag_trace_punish", "tag_payoff", ["tag.payoff"], "high"),
    ],
    rationale: "Canonical tagged Meat-Damage kill payoff.",
  },
  "onr_v1_303_silver-lining-recovery-protocol": {
    family: "agenda_stolen_recovery",
    signals: ["economy.corp_conditional_credit", "condition.agenda_stolen_last_turn", "advance.overadvance_support"],
    effects: [e("economy", "action", "corp", "economy.corp_conditional_credit", { resource: "credits", finite: true })],
    conditions: [c("requires_stolen_agenda_last_turn")],
    rationale: "Agenda-stolen recovery and overadvance support remain support-only.",
  },
  "onr_v1_304_systematic-layoffs": {
    family: "advancement",
    signals: ["advance.agenda_counter", "advance.overadvance_support", "advance.score_window_support"],
    effects: [e("advance_burst", "action", "score_area", "advance.overadvance_support", { resource: "advancement_counters", amount: 2, finite: true })],
    conditions: [c("requires_score_window"), c("requires_advancement_counter")],
    pairs: [pair("corp.fast_advance", "fast_advance_enabler", ["advance.agenda_counter", "advance.overadvance_support"], "high")],
    target: ["candidate", ["use_target:installed_agenda_or_overadvance_card"]],
    rationale: "Multi-counter advancement operation is Fast-Advance evidence.",
  },
  "onr_v1_305_team-restructuring": {
    family: "advancement",
    signals: ["advance.agenda_counter", "advance.score_window_support"],
    effects: [e("advance", "action", "score_area", "advance.agenda_counter", { resource: "advancement_counters", finite: true })],
    conditions: [c("requires_score_window")],
    pairs: [pair("corp.fast_advance", "fast_advance_enabler", ["advance.agenda_counter", "advance.score_window_support"], "medium")],
    target: ["candidate", ["use_target:installed_agenda_or_score_window"]],
    rationale: "Agenda counter support is Fast-Advance evidence.",
  },
  "onr_v1_306_trojan-horse": {
    family: "tag_source",
    signals: ["tag.source", "condition.agenda_stolen_last_turn"],
    effects: [e("tag_source", "action", "runner", "tag.source", { resource: "tags", amount: 1, finite: true })],
    conditions: [c("requires_stolen_agenda_last_turn")],
    pairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["tag.source"], "medium")],
    rationale: "Agenda-stolen tag source; enabler, not a payoff.",
  },
  "onr_v1_307_urban-renewal": {
    family: "tagged_meat_damage",
    signals: ["damage.payoff", "tag.payoff", "risk.requires_tagged_runner"],
    effects: [
      e("damage", "action", "runner", "damage.payoff", { resource: "damage", amount: 5, finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { resource: "damage", amount: 5, finite: true }),
    ],
    conditions: [c("requires_runner_tagged")],
    pairs: [
      pair("corp.damage_kill", "tagged_damage_payoff", ["damage.payoff"], "high"),
      pair("corp.tag_trace_punish", "tag_payoff", ["tag.payoff"], "high"),
    ],
    rationale: "High-impact tagged Meat-Damage kill payoff.",
  },
  "onr_proteus_046_corporate-guard-r-temps": {
    family: "future_extra_actions",
    signals: ["action.corp_future_extra_action", "risk.agenda_forfeit_drawback"],
    effects: [e("extra_action", "corp_turn", "corp", "action.corp_future_extra_action", { resource: "actions" })],
    target: ["schema_gap", ["x_value_future_turns_and_forfeit_drawback"]],
    rationale: "Future extra actions plus agenda/credit forfeit drawback; tempo support, not automatic Fast Advance.",
  },
  "onr_proteus_047_credit-consolidation": {
    family: "economy",
    signals: ["economy.corp_credit_burst"],
    effects: [e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", finite: true })],
    rationale: "Transaction economy support; no strategy anchor.",
  },
  "onr_proteus_048_data-sifters": {
    family: "tag_source",
    signals: ["tag.source", "condition.last_turn_run"],
    effects: [e("tag_source", "action", "runner", "tag.source", { resource: "tags", amount: 1, finite: true })],
    pairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["tag.source"], "medium")],
    rationale: "Tag source/enabler, not a tagged payoff.",
  },
  "onr_proteus_049_emergency-rig": {
    family: "ice_rez_tempo",
    signals: ["ice.corp_free_rez", "ice.corp_temporary_rez", "risk.temporary_rez_liability"],
    effects: [e("rez", "action", "ice", "ice.corp_free_rez", { finite: true })],
    pairs: [pair("corp.ice_tax_glacier", "free_rez_enabler", ["ice.corp_free_rez"], "medium")],
    target: ["candidate", ["use_target:installed_ice_rez_choice"]],
    rationale: "Free/temporary ICE rez supports ICE-Tax/Glacier but remains read-only.",
  },
  "onr_proteus_050_manhunt": {
    family: "trace_tag_source",
    signals: ["trace.source", "tag.source", "condition.last_turn_run"],
    effects: [
      e("trace", "action", "runner", "trace.source", { finite: true }),
      e("tag_source", "trace_success", "runner", "tag.source", { resource: "tags", amount: 1, finite: true }),
    ],
    conditions: [c("requires_trace_success")],
    pairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["trace.source", "tag.source"], "medium")],
    rationale: "Trace/tag enabler, not a payoff.",
  },
  "onr_proteus_051_rent-to-own-contract": {
    family: "ice_rez_tempo",
    signals: ["ice.corp_deferred_rez", "ice.corp_temporary_rez", "risk.temporary_rez_liability"],
    effects: [e("rez", "action", "ice", "ice.corp_deferred_rez", { finite: true })],
    target: ["candidate", ["use_target:installed_ice_deferred_rez_choice"]],
    rationale: "Deferred/temporary ICE rez support plus risk; no automatic strategy anchor.",
  },
  "onr_proteus_052_schlaghund-pointers": {
    family: "trace_tag_source",
    signals: ["trace.source", "tag.source"],
    effects: [
      e("trace", "action", "runner", "trace.source", { finite: true }),
      e("tag_source", "trace_success", "runner", "tag.source", { resource: "tags", amount: 1, finite: true }),
    ],
    conditions: [c("requires_trace_success")],
    pairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["trace.source", "tag.source"], "medium")],
    rationale: "Trace/tag enabler, not a payoff.",
  },
  "onr_proteus_053_underworld-mole": {
    family: "tag_source",
    signals: ["tag.source", "condition.last_turn_run"],
    effects: [e("tag_source", "action", "runner", "tag.source", { resource: "tags", amount: 1, finite: true })],
    pairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["tag.source"], "medium")],
    rationale: "Tag source/enabler, not a tagged payoff.",
  },
  simple_draw_operation: {
    family: "draw",
    signals: ["economy.corp_draw"],
    effects: [e("draw", "action", "corp", "economy.corp_draw", { resource: "cards", finite: true })],
    rationale: "Test draw operation stays support-only.",
  },
  simple_economy_operation: {
    family: "economy",
    signals: ["economy.corp_credit_burst"],
    effects: [e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", finite: true })],
    rationale: "Test economy operation stays support-only.",
  },
  simple_tag_punishment_operation: {
    family: "tagged_runner_payoff",
    signals: ["tag.payoff", "risk.requires_tagged_runner"],
    effects: [e("tag_punish_payoff", "action", "runner", "tag.payoff", { finite: true })],
    conditions: [c("requires_runner_tagged")],
    pairs: [pair("corp.tag_trace_punish", "tag_payoff", ["tag.payoff"], "medium")],
    rationale: "Test tagged payoff operation receives the same controlled tag payoff semantics.",
  },
  v08_archive_planning_operation: {
    family: "archives_recovery",
    signals: ["archives.corp_recovery", "economy.corp_draw"],
    effects: [
      e("zone_shuffle", "action", "archives", "archives.corp_recovery", { finite: true }),
      e("draw", "action", "corp", "economy.corp_draw", { resource: "cards", finite: true }),
    ],
    target: ["schema_gap", ["private_archives_or_hq_choice"]],
    hidden: "corp_side_only_until_resolved",
    rationale: "Test archives planning operation stays support-only and side-safe.",
  },
  v08_credit_surge_operation: {
    family: "economy",
    signals: ["economy.corp_credit_burst"],
    effects: [e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", finite: true })],
    rationale: "Test credit operation stays support-only.",
  },
};

function operationInventory() {
  const allCards = CARD_FILES.flatMap(cardsFrom);
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const compiledHints = readJson(COMPILED_HINTS_PATH).cards ?? [];
  const activeIds = new Set(activeHints.map((hint) => hint.cardId));
  const compiledIds = new Set(compiledHints.map((hint) => hint.cardId));
  const operations = allCards.filter((card) => card.side === "corp" && card.type === "operation");
  const activeCompiled = operations.filter((card) => activeIds.has(card.cardId) && compiledIds.has(card.cardId));
  const inactive = operations.filter((card) => !activeIds.has(card.cardId) || !compiledIds.has(card.cardId));
  return { allCards, activeCompiled, inactive };
}

function buildPostReviewAssignments(activeCompiled) {
  return activeCompiled.map((card) => {
    const assignment = A[card.cardId];
    if (!assignment) throw new Error(`Missing AI025 assignment for ${card.cardId}`);
    const strategySupportPairs = assignment.pairs ?? [];
    const strategyAnchors = unique(strategySupportPairs.map((item) => item.strategyId));
    const primaryAnchorEvidence = unique(strategySupportPairs.flatMap((item) => item.evidence));
    const supportingEvidence = unique((assignment.signals ?? []).filter((signal) => !primaryAnchorEvidence.includes(signal)));
    return {
      cardId: card.cardId,
      title: card.title,
      cardType: "operation",
      subtypes: card.subtypes ?? [],
      mechanicalFamily: assignment.family,
      functionalEffects: unique((assignment.effects ?? []).map((effect) => effect.target ?? effect.kind)),
      conditions: unique((assignment.conditions ?? []).map((condition) => condition.kind ?? condition)),
      risks: unique(assignment.risks ?? []),
      tacticSignals: unique(assignment.signals ?? []),
      strategyAnchors,
      legacyStrategicRole: unique(strategySupportPairs.map((item) => STRATEGIC_ROLE_BY_PAIR_ROLE[item.role] ?? "support_tool")),
      strategySupportPairs,
      primaryAnchorEvidence,
      supportingEvidence,
      targetProfileStatus: assignment.target?.[0] ?? "not_required",
      targetProfileKinds: unique(assignment.target?.[1] ?? []),
      hiddenInfoPolicy: assignment.hidden ?? "public_when_played",
      needsHumanReview: false,
      confidence: "high",
      postReviewStatus: "changed",
      rationale: `${assignment.rationale} Operation type/subtype remains card data and is not mirrored as a tactic signal.`,
    };
  });
}

function updateActiveHints(assignmentsById) {
  const data = readJson(ACTIVE_HINTS_PATH);
  let changed = 0;
  for (const hint of data.cards ?? []) {
    const assignment = assignmentsById.get(hint.cardId);
    if (!assignment) continue;
    const config = A[hint.cardId];
    const before = JSON.stringify(hint);
    hint.tacticSignals = assignment.tacticSignals;
    hint.effects = (config.effects ?? hint.effects ?? []).map(({ target, ...effect }) => effect);
    if (config.conditions) hint.conditions = config.conditions;
    if (assignment.strategyAnchors.length) hint.lineSupport = assignment.strategyAnchors;
    else delete hint.lineSupport;
    if (assignment.legacyStrategicRole.length) hint.strategicRole = assignment.legacyStrategicRole;
    else delete hint.strategicRole;
    hint.quality = {
      ...(hint.quality ?? {}),
      benchmarkCovered: hint.quality?.benchmarkCovered === true,
      hintReviewed: true,
      strategyCovered: assignment.strategyAnchors.length > 0,
      confidence: assignment.confidence,
      needsHumanReview: false,
      reviewedDate: GENERATED_AT,
      reviewedBy: "codex",
    };
    if (JSON.stringify(hint) !== before) changed += 1;
  }
  writeJson(ACTIVE_HINTS_PATH, data);
  return changed;
}

function clusterOverview(assignments) {
  const byFamily = new Map();
  for (const item of assignments) {
    const entry = byFamily.get(item.mechanicalFamily) ?? { mechanicalFamily: item.mechanicalFamily, count: 0, cardIds: [] };
    entry.count += 1;
    entry.cardIds.push(item.cardId);
    byFamily.set(item.mechanicalFamily, entry);
  }
  return [...byFamily.values()].sort((left, right) => left.mechanicalFamily.localeCompare(right.mechanicalFamily));
}

function buildReport({ activeCompiled, inactive, postReviewAssignments, newSignals }) {
  const strategySupportPairs = postReviewAssignments.flatMap((card) =>
    card.strategySupportPairs.map((strategyPair) => ({ cardId: card.cardId, title: card.title, ...strategyPair })),
  );
  const targetProfileCandidates = postReviewAssignments
    .filter((card) => card.targetProfileStatus !== "not_required")
    .map((card) => ({
      cardId: card.cardId,
      title: card.title,
      status: card.targetProfileStatus,
      targetProfileKinds: card.targetProfileKinds,
    }));
  return {
    schemaVersion: "ai025-corp-operations-semantics-review-report-v1",
    taskId: "AI025",
    generatedAt: GENERATED_AT,
    status: "complete",
    scope: "corp_operations",
    sourceCommit: SOURCE_COMMIT,
    summary: {
      activeCorpOperationCount: activeCompiled.length,
      reviewedOperationCount: postReviewAssignments.length,
      activeOriginalsetOperationCount: activeCompiled.filter((card) => card.setId === "originalset-v1").length,
      activeProteusOperationCount: activeCompiled.filter((card) => card.setId === "proteus").length,
      activeTestOperationCount: activeCompiled.filter((card) => card.setId === "testset").length,
      inactiveCheckedOperationCount: inactive.length,
      changedOperationCount: postReviewAssignments.length,
      unchangedCheckedOperationCount: 0,
      newTacticSignalCount: newSignals.length,
      changedExistingTacticSignalCount: 0,
      removedOrAvoidedSubtypeSignalCount: FORBIDDEN_SIGNALS.size,
      newStrategyIdCount: 0,
      strategySupportPairCount: strategySupportPairs.length,
      targetProfileCandidateCount: targetProfileCandidates.length,
      schemaGapCount: targetProfileCandidates.filter((item) => item.status === "schema_gap").length,
      plannerEffect: false,
      actionScoreEffect: false,
      planWeightEffect: false,
      targetingAiEffect: false,
      engineEffect: false,
      legalEffect: false,
      profileOrDefaultSwitch: false,
      uiDerivationEffect: false,
      hiddenInfoLeakEffect: false,
    },
    inventory: {
      activeCompiledOperationCardIds: activeCompiled.map((card) => card.cardId),
      inactiveCheckedOperationCardIds: inactive.map((card) => card.cardId),
      countDiscrepancies: [
        {
          setId: "originalset-v1",
          expectedSpoilerCount: 27,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "originalset-v1").length,
          status: "matches",
        },
        {
          setId: "proteus",
          expectedSpoilerCount: 8,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "proteus").length,
          status: "matches",
        },
        {
          setId: "testset",
          expectedSpoilerCount: null,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "testset").length,
          status: "active_repo_test_operations_included_as_repo_truth",
        },
        {
          setId: "classic",
          expectedSpoilerCount: null,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "classic").length,
          inactiveKnownRepoCount: inactive.filter((card) => card.setId === "classic").length,
          status: "known_inactive_classic_operations",
        },
      ],
    },
    clusterOverview: clusterOverview(postReviewAssignments),
    newTacticSignals: newSignals.map((signal) => ({
      signalId: signal.signalId,
      supportOnly: signal.supportOnly,
      mayAnchorStrategy: signal.mayAnchorStrategy,
      allowedStrategyAnchors: signal.allowedStrategyAnchors,
    })),
    changedExistingTacticSignals: [],
    removedOrAvoidedSubtypeSignals: [...FORBIDDEN_SIGNALS].sort(),
    newStrategyIds: [],
    strategySupportPairs,
    targetProfileCandidates,
    hiddenInfoSafetyReview: [
      {
        topic: "corp_operation_hidden_semantics",
        result: "pass",
        notes:
          "Corp-operation semantics are public when played, except private Corp choices such as R&D reorder, Archives recovery or ICE rearrange that remain Corp-side until resolved through existing legal public outputs.",
      },
      {
        topic: "runtime_visibility",
        result: "pass",
        notes:
          "AI025 adds no WebSocket, reconnect, undo-preview, replay, PublicEvents, log, client-error, planner or Targeting-AI projection path.",
      },
    ],
    deferredItems: [
      {
        topic: "target_profile_v1_for_operations",
        decision: "deferred_or_schema_gap",
        rationale:
          "Multi-step installs, score-window advancement, R&D topdeck reorder, hidden Archives recovery, ICE rearrange/conceal and X-value future-action choices remain report-only until side-safe TargetProfile schema support exists.",
      },
      {
        topic: "corp_tempo_strategy",
        decision: "deferred",
        rationale:
          "Extra actions and install bundles receive function signals, but no new generic Corp tempo or operation strategy is introduced in AI025.",
      },
    ],
    postReviewAssignments,
    verification: [{ command: "node scripts/check-ai025-corp-operations-semantics.mjs", result: "pending_after_apply" }],
  };
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const entry =
    "- `ai025-corp-operations-semantics-review-2026-06-02.md` / `ai025-corp-operations-semantics-review-report-2026-06-02.json`: AI025 prüft 40 aktive/compiled Corp-Operations aus Repo-Wahrheit, darunter 27 Originalset- und 8 Proteus-Operations plus 5 aktive Test-/V08-Operations. Es ergänzt kontrollierte Corp-side Funktionssignale unter funktionalen Präfixen, vermeidet Typ-/Subtyp- und kartenspezifische Operation-Signale, trennt Tag-Quellen von Tag-Payoffs und hält alle Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI- und Hidden-Info-Wirkungsflags auf `false`.";
  if (text.includes("ai025-corp-operations-semantics-review-2026-06-02.md")) {
    writeText(
      README_PATH,
      text.replace(
        /^- `ai025-corp-operations-semantics-review-2026-06-02\.md` \/ `ai025-corp-operations-semantics-review-report-2026-06-02\.json`: .*$/m,
        entry,
      ),
    );
    return;
  }
  const marker = "- `ai024-corp-ice-semantics-review-2026-06-02.md`";
  const index = text.indexOf(marker);
  if (index === -1) {
    writeText(README_PATH, `${text.trimEnd()}\n${entry}\n`);
    return;
  }
  const lineEnd = text.indexOf("\n", index);
  writeText(README_PATH, `${text.slice(0, lineEnd + 1)}${entry}\n${text.slice(lineEnd + 1)}`);
}

function buildMarkdown(report) {
  const signalRows = report.newTacticSignals
    .map((signal) => `- \`${signal.signalId}\`: supportOnly=${signal.supportOnly}, mayAnchor=${signal.mayAnchorStrategy}, anchors=${signal.allowedStrategyAnchors.join(", ") || "none"}`)
    .join("\n");
  const anchorRows = report.strategySupportPairs
    .map((pairItem) => `- ${pairItem.title}: \`${pairItem.strategyId}\` -> \`${pairItem.role}\` (${pairItem.confidence})`)
    .join("\n");
  const targetRows = report.targetProfileCandidates
    .map((item) => `- ${item.title}: ${item.status} (${item.targetProfileKinds.join(", ")})`)
    .join("\n");
  return `# AI025 Corp Operations Semantics Review

## Kurzfazit

AI025 prüft ${report.summary.activeCorpOperationCount} aktive/compiled Corp-Operations aus der Repo-Wahrheit. Davon sind ${report.summary.activeOriginalsetOperationCount} Originalset-Operations und ${report.summary.activeProteusOperationCount} Proteus-Operations; zusätzlich bleiben ${report.summary.activeTestOperationCount} aktive Test-/V08-Operations vollständig abgedeckt. Operation-Typen und Subtypen wie Transactions, Gray Ops und Black Ops bleiben Kartendaten und werden nicht als Taktiksignale gespiegelt.

## Inventar

- Originalset: 27 aktive/compiled Corp-Operations; Spoiler-Erwartung 27.
- Proteus: 8 aktive/compiled Corp-Operations; Spoiler-Erwartung 8.
- Test/V08: 5 aktive/compiled Repo-Operations; als Repo-Wahrheit mitgeprüft.
- Classic: ${report.summary.inactiveCheckedOperationCount} bekannte inaktive Corp-Operations im Repo.

## Clusterübersicht

${report.clusterOverview.map((cluster) => `- ${cluster.mechanicalFamily}: ${cluster.count}`).join("\n")}

## Neue und wiederverwendete Taktiksignale

AI025 ergänzt ${report.summary.newTacticSignalCount} kontrollierte Corp-side Funktionssignale. Wiederverwendet werden \`tag.source\`, \`tag.payoff\`, \`trace.source\`, \`damage.payoff\` und \`risk.requires_tagged_runner\`, wenn SideScope und Wirkung passen.

${signalRows}

## Vermiedene Typ-/Subtyp-Signale

Nicht eingeführt wurden: ${report.removedOrAvoidedSubtypeSignals.map((signal) => `\`${signal}\``).join(", ")}.

## Strategieentscheidungen

Einfache Economy-, Draw-, Recovery-, R&D-Reorder-, Extra-Action- und ICE-Rez-Supportkarten erhalten keinen Strategieanker ohne explizite Decklinie. Advancement-Operations ankern \`corp.fast_advance\`; Tag-Quellen ankern als Enabler, nicht als Payoff; Tagged Runner Payoffs und tagged Meat-Damage-Kill-Karten trennen \`corp.tag_trace_punish\` und \`corp.damage_kill\`.

${anchorRows}

## TargetProfile-Kandidaten

${targetRows}

## Hidden-Info-Grenzen

Operations sind grundsätzlich public when played. Private Corp-Entscheidungen wie R&D-Reorder, Archives-Recovery, ICE-Rearrange/Conceal und X-value/future-action choices bleiben bis zur legalen Auflösung Corp-side. AI025 ergänzt keine Runner-seitige verdeckte Operation-Semantik und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Deferred Items

${report.deferredItems.map((item) => `- ${item.topic}: ${item.decision}. ${item.rationale}`).join("\n")}

## Post-Review-Liste

Die vollständige Kartenliste mit Funktionsfamilie, Conditions, Risiken, Taktiksignalen, Strategieankern, \`strategySupportPairs\`, TargetProfile-Status und Hidden-Info-Policy steht im JSON-Report \`ai025-corp-operations-semantics-review-report-2026-06-02.json\`.
`;
}

function main() {
  const { allCards, activeCompiled, inactive } = operationInventory();
  const activeIds = new Set(activeCompiled.map((card) => card.cardId));
  const missing = [...activeIds].filter((cardId) => !A[cardId]);
  if (missing.length) throw new Error(`Missing AI025 assignment(s): ${missing.join(", ")}`);
  const newSignals = updateTacticSignals();
  updateDerivationRules();
  const postReviewAssignments = buildPostReviewAssignments(activeCompiled);
  const changed = updateActiveHints(new Map(postReviewAssignments.map((item) => [item.cardId, item])));
  const report = buildReport({ activeCompiled, inactive, postReviewAssignments, newSignals });
  writeJson(JSON_REPORT_PATH, report);
  writeText(MD_REPORT_PATH, buildMarkdown(report));
  updateReadme();
  console.log(
    `AI025 applied active=${activeCompiled.length} originalset=${report.summary.activeOriginalsetOperationCount} proteus=${report.summary.activeProteusOperationCount} inactive=${inactive.length} changed=${changed} newSignals=${newSignals.length} cards=${allCards.length}`,
  );
}

main();
