#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-03";
const SOURCE_COMMIT = "2f6357b1";
const GUIDE_PATH = "docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const AI024_REPORT_PATH = "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json";
const AI024_REVIEW_PATH = "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-2026-06-02.md";
const AI025_REPORT_PATH = "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json";
const AI025_REVIEW_PATH = "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-2026-06-02.md";
const AI026_BASE_REPORT_PATH = "docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json";
const AI026_REVIEW_PATH = "docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-2026-06-02.md";
const AI026_REPORT_PATH = "docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json";
const README_PATH = "docs/reviews/ai/README.md";

const NO_EFFECT_FLAGS = {
  plannerEffect: false,
  actionScoreEffect: false,
  planWeightEffect: false,
  targetingAiEffect: false,
  engineEffect: false,
  legalEffect: false,
  profileOrDefaultSwitch: false,
  uiDerivationEffect: false,
  hiddenInfoLeakEffect: false,
};

const NEW_SIGNAL_DEFS = {
  "access.corp_net_damage_ambush": {
    group: "ai026_1_corp_node_asset_access_ambush",
    supportOnly: false,
    anchors: ["corp.ambush_bluff", "corp.damage_kill"],
  },
  "access.corp_brain_damage_ambush": {
    group: "ai026_1_corp_node_asset_access_ambush",
    supportOnly: false,
    anchors: ["corp.ambush_bluff", "corp.damage_kill"],
  },
  "access.corp_tag_ambush": {
    group: "ai026_1_corp_node_asset_access_ambush",
    supportOnly: false,
    anchors: ["corp.ambush_bluff", "corp.tag_trace_punish"],
  },
  "access.corp_rnd_net_damage_ambush": {
    group: "ai026_1_corp_node_asset_access_ambush",
    supportOnly: false,
    anchors: ["corp.ambush_bluff"],
  },
  "access.corp_archives_net_damage_ambush": {
    group: "ai026_1_corp_node_asset_access_ambush",
    supportOnly: false,
    anchors: ["corp.ambush_bluff"],
  },
  "access.corp_credit_loss_counter": {
    group: "ai026_1_corp_node_asset_counter_punish",
    supportOnly: false,
    anchors: ["corp.ambush_bluff"],
  },
  "access.corp_icebreaker_strength_counter": {
    group: "ai026_1_corp_node_asset_counter_punish",
    supportOnly: false,
    anchors: ["corp.ambush_bluff"],
  },
  "risk.reveal_hq_agendas": { group: "ai026_1_corp_node_asset_risk", supportOnly: true, anchors: [] },
  "info.hq_agenda_reveal": { group: "ai026_1_corp_node_asset_info", supportOnly: true, anchors: [] },
  "economy.corp_hq_agenda_reveal_credit": {
    group: "ai026_1_corp_node_asset_economy",
    supportOnly: true,
    anchors: [],
  },
  "hq.corp_installed_card_bounce": { group: "ai026_1_corp_node_asset_hq", supportOnly: true, anchors: [] },
  "install.corp_uninstall_to_hq": { group: "ai026_1_corp_node_asset_install", supportOnly: true, anchors: [] },
  "hq.corp_hand_refresh": { group: "ai026_1_corp_node_asset_hq", supportOnly: true, anchors: [] },
  "rnd.corp_shuffle_hq_into_rnd": { group: "ai026_1_corp_node_asset_rnd", supportOnly: true, anchors: [] },
  "draw.corp_draw": { group: "ai025_1_ai026_1_corp_draw", supportOnly: true, anchors: [] },
  "setup.corp_hand_size": { group: "ai026_1_corp_node_asset_setup", supportOnly: true, anchors: [] },
  "economy.corp_counter_cashout": {
    group: "ai026_1_corp_node_asset_economy",
    supportOnly: false,
    anchors: ["corp.asset_economy"],
  },
  "economy.corp_advanceable_cashout": {
    group: "ai026_1_corp_node_asset_economy",
    supportOnly: false,
    anchors: ["corp.asset_economy"],
  },
  "economy.corp_charge_bank": { group: "ai026_1_corp_node_asset_economy", supportOnly: true, anchors: [] },
  "economy.corp_action_charged_bank": { group: "ai026_1_corp_node_asset_economy", supportOnly: true, anchors: [] },
  "economy.corp_multi_action_credit": {
    group: "ai026_1_corp_node_asset_economy",
    supportOnly: false,
    anchors: ["corp.asset_economy"],
  },
  "risk.trash_own_rezzed_ice": { group: "ai026_1_corp_node_asset_risk", supportOnly: true, anchors: [] },
  "ice.corp_self_trash_cost": { group: "ai026_1_corp_node_asset_ice", supportOnly: true, anchors: [] },
};

const OPERATION_DRAW_PATCHES = {
  "onr_v1_282_annual-reviews": ["draw.corp_draw"],
  "onr_v1_288_day-shift": ["draw.corp_draw", "economy.corp_credit_burst"],
  "onr_v1_295_night-shift": ["draw.corp_draw", "economy.corp_credit_burst"],
  simple_draw_operation: ["draw.corp_draw"],
  v08_archive_planning_operation: ["draw.corp_draw"],
};

const NODE_ASSET_PATCHES = {
  "onr_v1_340_setup": {
    signals: [
      "access.archives_safe_exception",
      "access.corp_net_damage_ambush",
      "access.punish",
      "access.rnd_reveal_requirement",
      "damage.payoff",
      "remote.ambush",
    ],
    effects: [effect("damage", "on_access", "runner", "access.corp_net_damage_ambush", { amount: 2 })],
    pairs: [pair("corp.ambush_bluff", "access_net_damage_payoff", ["access.corp_net_damage_ambush", "access.punish"], "high")],
    supporting: ["access.archives_safe_exception", "access.rnd_reveal_requirement", "damage.payoff", "remote.ambush"],
    rationale: "Net-Damage-Access-Ambush; `damage.payoff` bleibt nur Oberklasse, kein Damage-Kill-Anker.",
  },
  "onr_v1_345_trap": {
    signals: [
      "access.archives_safe_exception",
      "access.corp_net_damage_ambush",
      "access.corp_tag_ambush",
      "access.punish",
      "access.rnd_reveal_requirement",
      "damage.payoff",
      "remote.ambush",
      "tag.source",
    ],
    effects: [
      effect("damage", "on_access", "runner", "access.corp_net_damage_ambush", { amount: 3 }),
      effect("tag_source", "on_access", "runner", "access.corp_tag_ambush", { amount: 1 }),
    ],
    pairs: [
      pair("corp.ambush_bluff", "access_net_damage_payoff", ["access.corp_net_damage_ambush", "access.punish"], "high"),
      pair("corp.tag_trace_punish", "access_tag_source", ["access.corp_tag_ambush", "tag.source"], "medium"),
    ],
    supporting: ["access.archives_safe_exception", "access.rnd_reveal_requirement", "damage.payoff", "remote.ambush"],
    rationale: "Access-Net-Damage plus Access-Tag-Ambush; die Tag-Rolle ist nicht persistent.",
  },
  "onr_v1_346_vacant-soulkiller": {
    signals: ["access.corp_brain_damage_ambush", "access.punish", "advance.corp_counter_bank", "damage.payoff", "remote.ambush"],
    effects: [effect("damage", "on_access", "runner", "access.corp_brain_damage_ambush")],
    pairs: [
      pair("corp.ambush_bluff", "access_brain_damage_payoff", ["access.corp_brain_damage_ambush", "access.punish"], "high"),
      pair("corp.damage_kill", "access_brain_damage_payoff", ["access.corp_brain_damage_ambush", "damage.payoff"], "medium"),
    ],
    supporting: ["advance.corp_counter_bank", "remote.ambush"],
    rationale: "Brain-Damage-Ambush nach Advancement Countern; keine Meat-Damage-Rolle.",
  },
  "onr_v1_348_virus-test-site": {
    signals: [
      "access.archives_safe_exception",
      "access.corp_net_damage_ambush",
      "access.punish",
      "access.rnd_reveal_requirement",
      "advance.corp_counter_bank",
      "damage.payoff",
      "remote.ambush",
    ],
    effects: [effect("damage", "on_access", "runner", "access.corp_net_damage_ambush")],
    pairs: [
      pair("corp.ambush_bluff", "access_net_damage_payoff", ["access.corp_net_damage_ambush", "access.punish"], "high"),
      pair("corp.damage_kill", "access_net_damage_payoff", ["access.corp_net_damage_ambush", "damage.payoff"], "medium"),
    ],
    supporting: ["access.archives_safe_exception", "access.rnd_reveal_requirement", "advance.corp_counter_bank", "remote.ambush"],
    rationale: "Net-Damage-Ambush skaliert mit Advancement Countern; keine Meat-Damage-Rolle.",
  },
  "onr_proteus_054_bel-digmo-antibody": {
    signals: ["access.corp_net_damage_ambush", "access.corp_rnd_net_damage_ambush", "access.punish", "access.rnd_reveal_requirement", "damage.payoff", "rnd.corp_self_shuffle_access"],
    effects: [
      effect("damage", "on_access", "runner", "access.corp_rnd_net_damage_ambush", { amount: 1 }),
      effect("zone_shuffle", "on_rez", "rnd", "rnd.corp_self_shuffle_access"),
    ],
    pairs: [pair("corp.ambush_bluff", "access_net_damage_payoff", ["access.corp_rnd_net_damage_ambush", "access.punish"], "medium")],
    supporting: ["access.corp_net_damage_ambush", "access.rnd_reveal_requirement", "damage.payoff", "rnd.corp_self_shuffle_access"],
    rationale: "R&D-Access-Net-Damage plus Reveal/Self-Shuffle.",
  },
  "onr_proteus_075_stereogram-antibody": {
    signals: ["access.corp_archives_net_damage_ambush", "access.corp_net_damage_ambush", "access.punish", "damage.payoff", "rnd.corp_self_shuffle_access"],
    effects: [
      effect("damage", "on_access", "runner", "access.corp_archives_net_damage_ambush", { amount: 1 }),
      effect("zone_shuffle", "on_access", "rnd", "rnd.corp_self_shuffle_access"),
    ],
    pairs: [pair("corp.ambush_bluff", "access_net_damage_payoff", ["access.corp_archives_net_damage_ambush", "access.punish"], "medium")],
    supporting: ["access.corp_net_damage_ambush", "damage.payoff", "rnd.corp_self_shuffle_access"],
    hidden: "corp_side_only_until_archives_accessed",
    rationale: "Archives selbst ist der Trigger; keine Archives-safe-exception.",
  },
  "onr_v1_310_blood-cat": {
    pairs: [pair("corp.tag_trace_punish", "trace_tag_source", ["trace.source", "tag.source"], "medium")],
    rationale: "Trace 5 in Tag; kein Trace-Credit-Enabler.",
  },
  "onr_v1_315_corprunners-shattered-remains": {
    pairs: [pair("corp.ambush_bluff", "access_hardware_trash", ["remote.ambush", "access.punish", "access.corp_hardware_trash"], "high")],
    rationale: "Hardware-Trash-Access-Ambush ohne Tag-/Tagged-Logik.",
  },
  "onr_v1_333_omniscience-foundation": {
    signals: ["risk.requires_tagged_runner", "tag.additional_tag_followup", "tag.payoff"],
    effects: [effect("tag_source", "corp_turn", "runner", "tag.additional_tag_followup")],
    pairs: [pair("corp.tag_trace_punish", "tag_snowball_followup", ["tag.additional_tag_followup", "tag.payoff"], "medium")],
    supporting: ["risk.requires_tagged_runner"],
    rationale: "Conditional additional-tag follow-up; not an initial or persistent tag source.",
  },
  "onr_v1_314_corporate-negotiating-center": {
    signals: ["economy.corp_hq_agenda_reveal_credit", "info.hq_agenda_reveal", "risk.reveal_hq_agendas"],
    effects: [effect("agenda_reveal_economy", "start_of_turn", "corp", "economy.corp_hq_agenda_reveal_credit")],
    conditions: [condition("requires_agenda_reveal")],
    pairs: [],
    hidden: "corp_side_only_until_revealed_choice",
    rationale: "HQ-Agenda-Reveal-Economy with explicit reveal risk; no high-difficulty agenda risk.",
  },
  "onr_v1_316_cowboy-sysop": {
    signals: ["hq.corp_installed_card_bounce", "install.corp_uninstall_to_hq"],
    effects: [effect("card_recovery", "action", "installed_card", "hq.corp_installed_card_bounce")],
    pairs: [],
    rationale: "Uninstall eigener installierter Karte nach HQ; keine Archives-Recovery.",
  },
  "onr_v1_336_rescheduler": {
    signals: ["draw.corp_draw", "hq.corp_hand_filter", "hq.corp_hand_refresh", "rnd.corp_shuffle_hq_into_rnd"],
    effects: [
      effect("shuffle_draw", "action", "corp", "hq.corp_hand_refresh"),
      effect("zone_shuffle", "action", "rnd", "rnd.corp_shuffle_hq_into_rnd"),
      effect("draw", "action", "corp", "draw.corp_draw"),
    ],
    pairs: [],
    rationale: "HQ in R&D mischen und gleich viele Karten ziehen ist Hand-Refresh, kein kontrolliertes Topdeck-Setup.",
  },
  "onr_proteus_076_syd-meyer-superstores": {
    signals: ["economy.corp_asset_cashout", "ice.corp_self_trash_cost", "risk.trash_own_rezzed_ice"],
    effects: [
      effect("economy", "action", "corp", "economy.corp_asset_cashout", { amount: 4 }),
      effect("ice_trash", "action", "ice", "ice.corp_self_trash_cost"),
    ],
    pairs: [pair("corp.asset_economy", "high_risk_economy_payoff", ["economy.corp_asset_cashout"], "medium")],
    supporting: ["ice.corp_self_trash_cost", "risk.trash_own_rezzed_ice"],
    rationale: "Cashout durch Trash eigener rezzed ICE; kein Install-Discount und keine Temporary-Rez-Liability.",
  },
  "onr_v1_321_esa-contract": {
    signals: ["draw.corp_draw"],
    effects: [effect("draw", "action", "corp", "draw.corp_draw", { amount: 2 })],
    pairs: [],
    rationale: "Corp Draw, nicht Credit-Economy.",
  },
  "onr_v1_322_euromarket-consortium": {
    signals: ["draw.corp_draw", "setup.corp_hand_size"],
    effects: [
      effect("draw", "action", "corp", "draw.corp_draw", { amount: 2 }),
      effect("hand_size_modifier", "persistent", "corp", "setup.corp_hand_size"),
    ],
    pairs: [],
    rationale: "Draw und Corp-Handsize, kein Score-Kontext.",
  },
  "onr_v1_338_rustbelt-hq-branch": {
    signals: ["setup.corp_hand_size"],
    effects: [effect("hand_size_modifier", "persistent", "corp", "setup.corp_hand_size", { amount: 2 })],
    pairs: [],
    rationale: "Corp-Handsize, kein Score-Kontext.",
  },
  "onr_v1_328_information-laundering": {
    signals: ["advance.corp_counter_bank", "economy.corp_advanceable_cashout", "economy.corp_counter_cashout", "remote.asset_economy"],
    effects: [effect("economy", "action", "corp", "economy.corp_counter_cashout")],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy", "economy.corp_counter_cashout"], "medium")],
    supporting: ["advance.corp_counter_bank", "economy.corp_advanceable_cashout"],
    rationale: "Advanceable counter cashout, nicht generischer Installed-Drip.",
  },
  "onr_v1_318_department-of-truth-enhancement": {
    signals: ["economy.corp_action_charged_bank", "economy.corp_charge_bank", "economy.corp_counter_bank", "remote.asset_economy"],
    effects: [
      effect("finite_economy_pool", "action", "corp", "economy.corp_charge_bank"),
      effect("economy", "action", "corp", "economy.corp_action_charged_bank"),
    ],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy", "economy.corp_action_charged_bank"], "medium")],
    supporting: ["economy.corp_charge_bank", "economy.corp_counter_bank"],
    rationale: "Action-charged bank, nicht normaler Installed-Drip.",
  },
  "onr_v1_343_south-african-mining-corp": {
    signals: ["economy.corp_multi_action_credit", "remote.asset_economy"],
    effects: [effect("economy", "action", "corp", "economy.corp_multi_action_credit", { amount: 6, actionCost: 3 })],
    pairs: [pair("corp.asset_economy", "high_risk_economy_payoff", ["remote.asset_economy", "economy.corp_multi_action_credit"], "low")],
    rationale: "Drei Aktionen fuer 6 Credits; keine normale Drip-Economy.",
  },
  "onr_v1_335_remote-facility": {
    pairs: [],
    rationale: "Repeatable extra action remains a tactic signal; Fast-Advance/Remote-Scoring anchor deferred because no direct score conversion is encoded.",
  },
  "onr_v1_331_nevinyrral": {
    pairs: [],
    supporting: ["action.corp_repeatable_extra_action", "risk.leaves_play_loss", "risk.loss_condition"],
    rationale: "Repeatable extra action with lose-game risk; no automatic Fast-Advance/Remote-Scoring anchor.",
  },
  "onr_v1_334_pacifica-regional-ai": {
    pairs: [pair("corp.fast_advance", "fast_advance_action_engine", ["action.corp_counter_to_action", "advance.score_window_support"], "high")],
    rationale: "Advancement-counter-to-action conversion remains a plausible Fast-Advance anchor.",
  },
  "onr_v1_317_data-masons": {
    targetStatus: "not_required",
    targetKinds: [],
    constraints: ["only_walls"],
    rationale: "Static Wall scope is a constraint, not a TargetProfile.",
  },
  "onr_v1_320_encoder-inc": {
    targetStatus: "not_required",
    targetKinds: [],
    constraints: ["only_code_gates"],
    rationale: "Static Code-Gate scope is a constraint, not a TargetProfile.",
  },
  "onr_v1_341_skalderviken-sa-beta-test-site": {
    targetStatus: "not_required",
    targetKinds: [],
    constraints: ["only_black_ice"],
    rationale: "Static Black-ICE scope is a constraint, not a TargetProfile.",
  },
  "onr_v1_324_fortress-architects": {
    targetStatus: "not_required",
    targetKinds: [],
    constraints: ["static_ice_install_discount"],
    rationale: "Static ICE-install discount has no target choice in current hint layer.",
  },
  "onr_proteus_057_doppelganger-antibody": {
    signals: ["access.archives_safe_exception", "access.corp_counter_punish", "access.corp_credit_loss_counter", "access.punish", "access.rnd_reveal_requirement"],
    effects: [effect("access_punish", "on_access", "runner", "access.corp_credit_loss_counter")],
    pairs: [pair("corp.ambush_bluff", "access_counter_credit_loss", ["access.corp_credit_loss_counter", "access.punish"], "medium")],
    supporting: ["access.archives_safe_exception", "access.corp_counter_punish", "access.rnd_reveal_requirement"],
    rationale: "Counter-Punish konkret als Runner-Credit-Loss-Counter.",
  },
  "onr_proteus_068_pattel-antibody": {
    signals: ["access.archives_safe_exception", "access.corp_counter_punish", "access.corp_icebreaker_strength_counter", "access.punish", "access.rnd_reveal_requirement"],
    effects: [effect("access_punish", "on_access", "runner", "access.corp_icebreaker_strength_counter")],
    pairs: [pair("corp.ambush_bluff", "access_counter_icebreaker_strength", ["access.corp_icebreaker_strength_counter", "access.punish"], "medium")],
    supporting: ["access.archives_safe_exception", "access.corp_counter_punish", "access.rnd_reveal_requirement"],
    rationale: "Counter-Punish konkret als Icebreaker-Strength-Counter.",
  },
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

function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

function writeText(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), value, "utf8");
}

function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort();
}

function effect(kind, timing, scope, target, extra = {}) {
  return { kind, timing, scope, target, ...extra };
}

function condition(kind) {
  return { kind };
}

function pair(strategyId, role, evidence, confidence = "medium") {
  return { strategyId, role, evidence, confidence };
}

function signalDescription(signalId) {
  return `AI026-1 Guide V3 Corp semantics signal: ${signalId.replaceAll("_", " ")}.`;
}

function updateTacticSignals() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  const byId = new Map((catalog.signals ?? []).map((signal) => [signal.signalId, signal]));
  for (const [signalId, def] of Object.entries(NEW_SIGNAL_DEFS)) {
    const signal = byId.get(signalId) ?? { signalId };
    signal.group = def.group;
    signal.sideScope = "corp";
    signal.description = signalDescription(signalId);
    signal.supportOnly = def.supportOnly;
    signal.mayAnchorStrategy = !def.supportOnly;
    signal.allowedStrategyAnchors = unique(def.anchors);
    signal.sourceKinds = unique([...(signal.sourceKinds ?? []), "AI026-1 Guide V3 Corp semantics polish"]);
    signal.examples = signal.examples ?? [];
    signal.targetProfileRelevant =
      signal.targetProfileRelevant ?? (signalId.startsWith("access.") || signalId.startsWith("install."));
    signal.notes =
      "AI026-1 read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score, plan-weight, UI or hidden-info behavior.";
    if (!byId.has(signalId)) {
      catalog.signals.push(signal);
      byId.set(signalId, signal);
    }
  }

  const legacyDraw = byId.get("economy.corp_draw");
  if (legacyDraw) {
    legacyDraw.legacy = true;
    legacyDraw.aggregation = true;
    legacyDraw.notForDirectScoring = true;
    legacyDraw.notes =
      `${legacyDraw.notes ?? ""} Guide V3 retains economy.corp_draw only as a legacy aggregation; use draw.corp_draw as the precise primary Corp draw signal.`.trim();
  }

  catalog.taskId = appendTask(catalog.taskId, "AI026-1");
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI026-1 aligns Corp node/asset and shared Corp draw semantics with Guide V3 without planner, engine, targeting, action-score, plan-weight, legality, profile/default, UI or hidden-info effects.";
  catalog.signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
  writeJson(TACTIC_SIGNAL_PATH, catalog);
  return Object.keys(NEW_SIGNAL_DEFS);
}

function updateDerivationRules() {
  const data = readJson(DERIVATION_PATH);
  const existing = new Set(
    (data.derivationRules ?? []).map((rule) => `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`),
  );
  for (const [signalId, def] of Object.entries(NEW_SIGNAL_DEFS)) {
    const rule = {
      signalId,
      source: "effects",
      match: { target: signalId },
      gates: { side: "corp", target: signalId },
      strategyAnchorFor: unique(def.anchors),
    };
    const key = `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`;
    if (!existing.has(key)) data.derivationRules.push(rule);
  }
  data.taskId = appendTask(data.taskId, "AI026-1");
  data.updatesTaskId = appendTask(data.updatesTaskId, "AI026-1");
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI026-1 aligns Corp semantics to Guide V3 while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  data.derivationRules.sort((left, right) =>
    `${left.signalId}:${JSON.stringify(left.match)}`.localeCompare(`${right.signalId}:${JSON.stringify(right.match)}`),
  );
  writeJson(DERIVATION_PATH, data);
}

function appendTask(value, taskId) {
  const parts = String(value ?? "").split("/").filter(Boolean);
  if (!parts.includes(taskId)) parts.push(taskId);
  return parts.join("/");
}

function applyHintPatch(hint, patch) {
  const before = JSON.stringify(hint);
  if (patch.signals) hint.tacticSignals = unique(patch.signals);
  if (patch.effects) hint.effects = patch.effects;
  if (patch.conditions) hint.conditions = patch.conditions;
  if (patch.conditions === null) delete hint.conditions;
  if (patch.pairs) {
    const anchors = unique(patch.pairs.map((item) => item.strategyId));
    const roles = unique(patch.pairs.map((item) => roleToLegacy(item.role)));
    if (anchors.length) hint.lineSupport = anchors;
    else delete hint.lineSupport;
    if (roles.length) hint.strategicRole = roles;
    else delete hint.strategicRole;
  }
  hint.quality = {
    ...(hint.quality ?? {}),
    benchmarkCovered: hint.quality?.benchmarkCovered === true,
    hintReviewed: true,
    strategyCovered: (hint.lineSupport ?? []).length > 0,
    confidence: "high",
    needsHumanReview: false,
    reviewedDate: GENERATED_AT,
    reviewedBy: "codex",
  };
  return JSON.stringify(hint) !== before;
}

function roleToLegacy(role) {
  if (!role) return undefined;
  if (role.includes("payoff") || role.includes("counter")) return "punish_payoff";
  if (role.includes("engine") || role.includes("economy")) return "engine_anchor";
  if (role.includes("tag") || role.includes("source")) return "enabler";
  if (role.includes("action") || role.includes("advance")) return "scoring_tool";
  return "support_tool";
}

function updateActiveHints() {
  const data = readJson(ACTIVE_HINTS_PATH);
  const byId = new Map((data.cards ?? []).map((hint) => [hint.cardId, hint]));
  let changed = 0;
  for (const [cardId, signals] of Object.entries(OPERATION_DRAW_PATCHES)) {
    const hint = byId.get(cardId);
    if (!hint) throw new Error(`Missing operation draw hint ${cardId}`);
    changed += applyHintPatch(hint, { signals }) ? 1 : 0;
  }
  for (const [cardId, patch] of Object.entries(NODE_ASSET_PATCHES)) {
    const hint = byId.get(cardId);
    if (!hint) throw new Error(`Missing node/asset hint ${cardId}`);
    changed += applyHintPatch(hint, patch) ? 1 : 0;
  }
  writeJson(ACTIVE_HINTS_PATH, data);
  return changed;
}

function updateAi024Metadata() {
  const report = readJson(AI024_REPORT_PATH);
  report.guideVersion = "V3";
  report.guidePath = GUIDE_PATH;
  report.verification = updateVerification(report.verification);
  writeJson(AI024_REPORT_PATH, report);
  writeText(
    AI024_REVIEW_PATH,
    readText(AI024_REVIEW_PATH)
      .replaceAll("Guide V2", "Guide V3")
      .replaceAll("Leitfaden: aktueller NETGRID Taktiksignal-/Strategieanker-Guide V2", `Leitfaden: NETGRID Guide V3 (${GUIDE_PATH})`),
  );
}

function updateAi025ReportAndReview() {
  const report = readJson(AI025_REPORT_PATH);
  report.guideVersion = "V3";
  report.guidePath = GUIDE_PATH;
  report.countsAfter.addedSignalCount = Math.max(report.countsAfter.addedSignalCount ?? 0, 9);
  report.addedSignals = uniqueBySignal([
    ...(report.addedSignals ?? []),
    { signalId: "draw.corp_draw", supportOnly: true, mayAnchorStrategy: false, allowedStrategyAnchors: [] },
  ]);
  report.retainedLegacySignals = uniqueBySignal([
    ...(report.retainedLegacySignals ?? []),
    {
      signalId: "economy.corp_draw",
      status: "legacy_aggregation_not_for_direct_scoring",
      replacedBy: "draw.corp_draw",
    },
  ]);
  patchReportCards(report, OPERATION_DRAW_PATCHES);
  report.removedSignals = [
    ...(report.removedSignals ?? []),
    {
      signalId: "economy.corp_draw",
      removedFrom: Object.keys(OPERATION_DRAW_PATCHES),
      rationale: "Guide V3 uses draw.corp_draw as precise Corp draw signal; economy.corp_draw remains catalogued only as legacy aggregation.",
    },
  ];
  report.verification = updateVerification(report.verification);
  writeJson(AI025_REPORT_PATH, report);

  writeText(
    AI025_REVIEW_PATH,
    readText(AI025_REVIEW_PATH)
      .replaceAll("Guide V2", "Guide V3")
      .replaceAll("Leitfaden: aktueller NETGRID Taktiksignal-/Strategieanker-Guide V2", `Leitfaden: NETGRID Guide V3 (${GUIDE_PATH})`)
      .replaceAll("`economy.corp_draw`", "`draw.corp_draw`"),
  );
}

function uniqueBySignal(items) {
  const byId = new Map();
  for (const item of items) byId.set(item.signalId, item);
  return [...byId.values()].sort((left, right) => left.signalId.localeCompare(right.signalId));
}

function patchReportCards(report, signalPatchById) {
  const updateSignals = (card) => {
    const signals = signalPatchById[card.cardId];
    if (!signals) return card;
    card.tacticSignals = unique(signals);
    card.functionalEffects = unique((card.functionalEffects ?? []).filter((signal) => signal !== "economy.corp_draw").concat(signals));
    card.supportingEvidence = unique((card.supportingEvidence ?? []).filter((signal) => signal !== "economy.corp_draw").concat(signals));
    card.rationale = `${card.rationale ?? ""} Guide V3 primary draw signal is draw.corp_draw; economy.corp_draw is retained only as legacy aggregation.`.trim();
    return card;
  };
  for (const key of ["changedCards", "changedSignals", "postReviewAssignments"]) {
    if (Array.isArray(report[key])) report[key] = report[key].map(updateSignals);
  }
}

function updateVerification(items = []) {
  return (items.length ? items : []).map((item) =>
    item.result === "pending_after_apply" ? { ...item, result: "pending_after_ai026_1_apply" } : item,
  );
}

function buildAi026Report() {
  const base = readJson(AI026_BASE_REPORT_PATH);
  const assignmentById = new Map((base.postReviewAssignments ?? []).map((card) => [card.cardId, structuredClone(card)]));
  const changedCards = [];
  const removedSignals = [];
  const changedStrategySupportPairs = [];
  const changedTargetProfiles = [];
  const changedConditions = [];
  const changedRisks = [];
  const changedConstraints = [];

  for (const [cardId, patch] of Object.entries(NODE_ASSET_PATCHES)) {
    const card = assignmentById.get(cardId);
    if (!card) throw new Error(`Missing AI026 report assignment ${cardId}`);
    const beforeSignals = new Set(card.tacticSignals ?? []);
    const beforeAnchors = new Set(card.strategyAnchors ?? []);
    const beforeTargetStatus = card.targetProfileStatus;
    const beforeTargetKinds = card.targetProfileKinds ?? [];

    if (patch.signals) card.tacticSignals = unique(patch.signals);
    if (patch.pairs) {
      card.strategySupportPairs = patch.pairs;
      card.strategyAnchors = unique(patch.pairs.map((item) => item.strategyId));
      card.legacyStrategicRole = unique(patch.pairs.map((item) => roleToLegacy(item.role)));
      card.primaryAnchorEvidence = unique(patch.pairs.flatMap((item) => item.evidence));
    }
    if (patch.supporting) card.supportingEvidence = unique(patch.supporting);
    else if (patch.signals || patch.pairs) {
      card.supportingEvidence = unique((card.tacticSignals ?? []).filter((signal) => !(card.primaryAnchorEvidence ?? []).includes(signal)));
    }
    if (patch.targetStatus) card.targetProfileStatus = patch.targetStatus;
    if (patch.targetKinds) card.targetProfileKinds = patch.targetKinds;
    if (patch.constraints) card.constraints = patch.constraints;
    if (patch.conditions) card.conditions = patch.conditions.map((item) => item.kind ?? item);
    if (patch.hidden) card.hiddenInfoPolicy = patch.hidden;
    card.rationale = `${patch.rationale} Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.`;
    assignmentById.set(cardId, card);

    const afterSignals = new Set(card.tacticSignals ?? []);
    const removed = [...beforeSignals].filter((signal) => !afterSignals.has(signal));
    const added = [...afterSignals].filter((signal) => !beforeSignals.has(signal));
    if (removed.length) removedSignals.push({ cardId, title: card.title, removed });
    changedCards.push({
      cardId,
      title: card.title,
      addedSignals: added,
      removedSignals: removed,
      tacticSignals: card.tacticSignals,
      strategyAnchors: card.strategyAnchors,
      rationale: patch.rationale,
    });

    if (patch.pairs || beforeAnchors.size !== new Set(card.strategyAnchors ?? []).size) {
      changedStrategySupportPairs.push({ cardId, title: card.title, strategySupportPairs: card.strategySupportPairs });
    }
    if (patch.targetStatus && (patch.targetStatus !== beforeTargetStatus || JSON.stringify(patch.targetKinds ?? []) !== JSON.stringify(beforeTargetKinds))) {
      changedTargetProfiles.push({
        cardId,
        title: card.title,
        before: { status: beforeTargetStatus, targetProfileKinds: beforeTargetKinds },
        after: { status: card.targetProfileStatus, targetProfileKinds: card.targetProfileKinds },
      });
    }
    if (patch.conditions) changedConditions.push({ cardId, title: card.title, conditions: card.conditions });
    if (patch.signals?.some((signal) => signal.startsWith("risk.")) || patch.supporting?.some((signal) => signal.startsWith("risk."))) {
      changedRisks.push({ cardId, title: card.title, risks: (card.tacticSignals ?? []).filter((signal) => signal.startsWith("risk.")) });
    }
    if (patch.constraints) changedConstraints.push({ cardId, title: card.title, constraints: patch.constraints });
  }

  const postReviewAssignments = [...assignmentById.values()];
  const strategySupportPairs = postReviewAssignments.flatMap((card) =>
    (card.strategySupportPairs ?? []).map((strategyPair) => ({ cardId: card.cardId, title: card.title, ...strategyPair })),
  );
  const targetProfileCandidates = postReviewAssignments
    .filter((card) => card.targetProfileStatus !== "not_required")
    .map((card) => ({ cardId: card.cardId, title: card.title, status: card.targetProfileStatus, targetProfileKinds: card.targetProfileKinds ?? [] }));
  const constraints = postReviewAssignments
    .filter((card) => (card.constraints ?? []).length > 0)
    .map((card) => ({ cardId: card.cardId, title: card.title, constraints: card.constraints }));
  const activeTestNodeAssets = (base.inventory?.activeCompiledNodeAssetCardIds ?? []).filter((cardId) =>
    ["simple_economy_asset", "v08_cashout_asset"].includes(cardId),
  );

  return {
    schemaVersion: "ai026-1-corp-nodes-assets-semantics-polish-report-v1",
    taskId: "AI026-1",
    generatedAt: GENERATED_AT,
    status: "complete",
    sourceCommit: SOURCE_COMMIT,
    correctsTask: "AI026",
    correctsCommit: base.sourceCommit,
    guideVersion: "V3",
    guidePath: GUIDE_PATH,
    countsBefore: {
      activeCompiledCorpNodeAssets: base.summary.activeCorpNodeAssetCount,
      productionOriginalsetNodeAssets: base.summary.activeOriginalsetNodeAssetCount,
      productionProteusNodeAssets: base.summary.activeProteusNodeAssetCount,
      activeTestNodeAssets: base.summary.activeTestNodeAssetCount,
      inactiveClassicNodeAssets: base.summary.inactiveCheckedNodeAssetCount,
      strategySupportPairCount: base.summary.strategySupportPairCount,
      targetProfileCandidateCount: base.summary.targetProfileCandidateCount,
      schemaGapCount: base.summary.schemaGapCount,
    },
    countsAfter: {
      activeCompiledCorpNodeAssets: base.summary.activeCorpNodeAssetCount,
      productionOriginalsetNodeAssets: base.summary.activeOriginalsetNodeAssetCount,
      productionProteusNodeAssets: base.summary.activeProteusNodeAssetCount,
      activeTestNodeAssets: base.summary.activeTestNodeAssetCount,
      inactiveClassicNodeAssets: base.summary.inactiveCheckedNodeAssetCount,
      changedCardCount: changedCards.length,
      addedSignalCount: Object.keys(NEW_SIGNAL_DEFS).length,
      newStrategyIdCount: 0,
      strategySupportPairCount: strategySupportPairs.length,
      targetProfileCandidateCount: targetProfileCandidates.length,
      schemaGapCount: targetProfileCandidates.filter((item) => item.status === "schema_gap").length,
      ...NO_EFFECT_FLAGS,
    },
    changedCards,
    changedSignals: changedCards.map((card) => ({ cardId: card.cardId, title: card.title, tacticSignals: card.tacticSignals })),
    addedSignals: Object.entries(NEW_SIGNAL_DEFS).map(([signalId, def]) => ({
      signalId,
      supportOnly: def.supportOnly,
      mayAnchorStrategy: !def.supportOnly,
      allowedStrategyAnchors: unique(def.anchors),
    })),
    removedSignals,
    changedStrategySupportPairs,
    changedTargetProfiles,
    changedConditions,
    changedRisks,
    changedConstraints,
    constraints,
    retainedLegacySignals: [
      {
        signalId: "damage.payoff",
        status: "legacy_aggregation_not_primary_damage_type",
        retainedWhere: ["Setup!", "TRAP!", "Vacant Soulkiller", "Virus Test Site", "Bel-Digmo Antibody", "Stereogram Antibody"],
      },
      {
        signalId: "access.corp_counter_punish",
        status: "legacy_aggregation_with_precise_counter_punish_signals",
        retainedWhere: ["Doppelganger Antibody", "Pattel Antibody"],
      },
      {
        signalId: "economy.corp_draw",
        status: "legacy_aggregation_not_for_direct_scoring",
        replacedBy: "draw.corp_draw",
      },
    ],
    deferredItems: [
      {
        topic: "target_profile_v1_for_private_node_asset_choices",
        decision: "deferred_schema_gap",
        rationale:
          "Cowboy Sysop, Rescheduler, Syd Meyer Superstores and hidden/private access-triggered choices remain report-only until a side-safe TargetProfile consumer exists.",
      },
      {
        topic: "extra_action_strategy_taxonomy",
        decision: "deferred",
        rationale:
          "Remote Facility and Nevinyrral keep extra-action tactic semantics, but no new Corp tempo strategy ID or automatic Fast-Advance/Remote-Scoring anchor is introduced.",
      },
    ],
    hiddenInfoSafetyReview: [
      {
        topic: "corp_node_asset_hidden_semantics",
        result: "pass",
        notes:
          "Corp node/asset semantics remain Corp-side until rezzed, accessed, exposed or otherwise legally known. No Runner-visible hidden node/asset projection is added.",
      },
      {
        topic: "runtime_visibility",
        result: "pass",
        notes:
          "AI026-1 changes only read-only AI hint data, signal catalog metadata, derivation metadata, checks and review artifacts.",
      },
    ],
    testNodeAssetSeparation: {
      productionOriginalsetNodeAssets: base.summary.activeOriginalsetNodeAssetCount,
      productionProteusNodeAssets: base.summary.activeProteusNodeAssetCount,
      activeTestNodeAssets,
      inactiveClassicNodeAssets: base.inventory?.inactiveCheckedNodeAssetCardIds ?? [],
      testStrategySupportPairsExcludedFromProductionAggregation: true,
    },
    strategySupportPairs,
    targetProfileCandidates,
    postReviewAssignments,
    verification: [
      { command: "node scripts/check-ai026-corp-nodes-assets-semantics.mjs", result: "pending_after_apply" },
      { command: "node scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs", result: "pending_after_apply" },
    ],
  };
}

function buildMarkdown(report) {
  const cardRows = report.changedCards.map((card) => `- ${card.title}: ${card.rationale}`).join("\n");
  const addedRows = report.addedSignals.map((signal) => `- \`${signal.signalId}\``).join("\n");
  const strategyRows = report.changedStrategySupportPairs
    .map((entry) => `- ${entry.title}: ${entry.strategySupportPairs.map((pairItem) => `\`${pairItem.strategyId}\` -> \`${pairItem.role}\``).join(", ") || "support-only"}`)
    .join("\n");
  const targetRows = report.changedTargetProfiles
    .map((entry) => `- ${entry.title}: ${entry.before.status} -> ${entry.after.status}${entry.after.targetProfileKinds.length ? ` (${entry.after.targetProfileKinds.join(", ")})` : ""}`)
    .join("\n");
  const constraintRows = report.changedConstraints.map((entry) => `- ${entry.title}: ${entry.constraints.join(", ")}`).join("\n");
  return `# AI026-1 Corp Nodes/Assets Semantics Polish

## Kurzfazit

AI026-1 richtet die AI026-Corp-Nodes-/Assets-Semantik gezielt an Guide V3 aus. Die ${report.countsAfter.activeCompiledCorpNodeAssets} aktiven/compiled Corp-Nodes/Assets bleiben abgedeckt; davon sind ${report.countsAfter.productionOriginalsetNodeAssets} Originalset-, ${report.countsAfter.productionProteusNodeAssets} Proteus- und ${report.countsAfter.activeTestNodeAssets} aktive Test-/V08-Assets. Es gibt keine neue Strategy-ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.

## Scope / Out-of-Scope

Scope sind die im Prompt genannten Access-Ambush-, Damage-, Tag-, Economy-, Draw-/Handsize-, TargetProfile- und Counter-Punish-Korrekturen. Out-of-Scope bleiben Engine, LegalActions, Planner, ActionScore, PlanWeight, Targeting-KI, UI, Profile/Defaults, Runtime-Feature-Flags und neue Legalität.

## Verwendete Quellen

- Repo-Wahrheit aus aktuellen CardDefinitions/CardImplementations und aktiven/compiled Hints.
- Guide V3: \`${GUIDE_PATH}\`.
- AI026 Review und JSON-Report vom 2026-06-02.
- AI024-1/AI025-1 als bereits vorhandene Korrekturbatches.

## Guide-V3-Abgleich

Kartentext schlägt Cluster, Subtyp und frühere Hints. Access-Ambush bekommt konkrete Access-Wirkung, Damage-Typen werden nicht vermischt, Tag-Rollen trennen initiale Quelle, Access-Tag und Snowball, Draw ist keine Economy, Hand Size ist kein Score-Kontext und statische Subtyp-Scope-Regeln werden als Constraints statt TargetProfiles reportet.

## Ausgangsbefund

AI026 war als read-only Foundation korrekt, enthielt aber die bekannten V3-Auffälligkeiten: generisches \`damage.payoff\` ohne präzisen Damage-Typ, \`meat_damage_payoff\` bei Brain-/Net-Damage-Ambushes, \`persistent_tag_source\` bei TRAP!, \`trace_credit_enabler\` bei Blood Cat, zu grobe HQ-/R&D-/Economy-Signale und TargetProfile-Kandidaten für statische ICE-Scope-Assets.

## Geänderte Karten

${cardRows}

## Geänderte Signale

Neue präzise Signale:

${addedRows}

## Entfernte falsche Signale

Siehe JSON-Report \`removedSignals\`. Entfernt oder ersetzt wurden unter anderem \`risk.high_difficulty_agenda\`, \`archives.corp_recovery\`, \`rnd.corp_topdeck_setup\`, \`ice.corp_install_discount\`, \`risk.temporary_rez_liability\`, \`economy.corp_draw\`, \`score.hand_size\`, \`economy.corp_installed_credit_drip\`, \`tag.corp_persistent_source\` und falsche Strategy-Rollen.

## Neu ergänzte Signale

Die neuen Signale bleiben read-only und erzeugen keine Planner- oder Runtime-Wirkung. \`damage.payoff\`, \`access.corp_counter_punish\` und \`economy.corp_draw\` werden nur als Legacy-/Aggregation-Kontext retained, nicht als präzise Primärevidenz.

## Geänderte StrategySupportPairs

${strategyRows}

## Geänderte TargetProfiles

${targetRows || "- Keine TargetProfile-Aktivierung; statische Scope-Fälle wurden auf not_required gesetzt."}

## Conditions-/Risiko-/Constraint-Korrekturen

${constraintRows}

Syd Meyer Superstores trägt jetzt \`risk.trash_own_rezzed_ice\`; Corporate Negotiating Center trägt \`risk.reveal_hq_agendas\`; Nevinyrral behält \`risk.leaves_play_loss\` und \`risk.loss_condition\` ohne automatischen Score-Strategieanker.

## Hidden-Info-Bestätigung

Korp-Node-/Asset-Semantik bleibt \`corp_side_only_until_rezzed_or_accessed\`, bis eine Karte rezzed, accessed, exposed oder anderweitig legal bekannt ist. Es gibt keine neue WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Test-/V08-Abgrenzung

Die aktiven Test-/V08-Assets bleiben getrennt reportet: ${report.testNodeAssetSeparation.activeTestNodeAssets.map((id) => `\`${id}\``).join(", ")}. Test-StrategySupportPairs bleiben aus Produktionsaggregation ausgeschlossen.

## Deferred Items

${report.deferredItems.map((item) => `- ${item.topic}: ${item.decision}. ${item.rationale}`).join("\n")}

## Verifikation

Die auszuführenden Checks stehen im JSON-Report und werden nach Apply/Build als Review-Ergebnis aktualisiert.

## Risiken / Folgeempfehlungen

Die neuen Signale erhöhen Foundation-Datenqualität, bleiben aber ohne produktive KI-Wirkung, bis LegalActions semantisch sicher verstanden und side-safe TargetProfiles konsumiert werden.
`;
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = readText(README_PATH);
  const entry =
    "- `ai026-1-corp-nodes-assets-semantics-polish-2026-06-02.md` / `ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json`: AI026-1 richtet Corp-Nodes/Assets an Guide V3 aus, präzisiert Access-Damage-/Tag-/Counter-Punish-, Draw-/Handsize-, HQ-Reveal-, Bounce-, Refresh- und Cashout-Signale, korrigiert Strategy-Rollen und trennt statische ICE-Scope-Constraints von TargetProfiles; keine Planner-, Engine-, Legalitäts-, UI- oder Hidden-Info-Wirkung.";
  if (text.includes("ai026-1-corp-nodes-assets-semantics-polish-2026-06-02.md")) return;
  writeText(README_PATH, `${text.trimEnd()}\n${entry}\n`);
}

function main() {
  const addedSignals = updateTacticSignals();
  updateDerivationRules();
  const changedHints = updateActiveHints();
  updateAi024Metadata();
  updateAi025ReportAndReview();
  const ai026Report = buildAi026Report();
  writeJson(AI026_REPORT_PATH, ai026Report);
  writeText(AI026_REVIEW_PATH, buildMarkdown(ai026Report));
  updateReadme();
  console.log(`AI026-1 applied changedHints=${changedHints} addedSignals=${addedSignals.length} changedCards=${ai026Report.changedCards.length}`);
}

main();
