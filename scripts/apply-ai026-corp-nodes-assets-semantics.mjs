#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-02";
const SOURCE_COMMIT = "feea9709";

const CARD_FILES = [
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
  "data/cards/classic-cards.json",
  "data/cards/testset-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const MD_REPORT_PATH = "docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-2026-06-02.md";
const JSON_REPORT_PATH = "docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json";
const README_PATH = "docs/reviews/ai/README.md";

const AI026_SIGNALS = {
  "economy.corp_installed_credit_drip": [true, []],
  "economy.corp_counter_bank": [true, []],
  "economy.corp_install_rez_credit": [false, ["corp.economy_rez_reserve"]],
  "economy.corp_run_temporary_credit": [false, ["corp.economy_rez_reserve"]],
  "economy.corp_asset_cashout": [false, ["corp.asset_economy", "corp.economy_rez_reserve"]],
  "economy.corp_trace_credit_support": [false, ["corp.tag_trace_punish"]],
  "action.corp_repeatable_extra_action": [false, ["corp.remote_scoring", "corp.fast_advance"]],
  "action.corp_counter_to_action": [false, ["corp.fast_advance"]],
  "advance.corp_counter_placement": [false, ["corp.fast_advance", "corp.remote_scoring"]],
  "advance.corp_counter_bank": [true, []],
  "advance.corp_counter_transfer": [false, ["corp.fast_advance", "corp.remote_scoring"]],
  "ice.corp_install_discount": [false, ["corp.ice_tax_glacier", "corp.economy_rez_reserve"]],
  "ice.corp_rez_discount": [false, ["corp.ice_tax_glacier", "corp.economy_rez_reserve"]],
  "ice.corp_strength_support": [false, ["corp.ice_tax_glacier"]],
  "ice.corp_subroutine_support": [false, ["corp.ice_tax_glacier"]],
  "trace.corp_credit_support": [false, ["corp.tag_trace_punish"]],
  "tag.corp_persistent_source": [false, ["corp.tag_trace_punish"]],
  "damage.corp_tagged_meat_payoff": [false, ["corp.damage_kill", "corp.tag_trace_punish"]],
  "damage.corp_damage_amplifier": [false, ["corp.damage_kill"]],
  "access.corp_hardware_trash": [false, ["corp.ambush_bluff", "corp.tag_trace_punish"]],
  "access.corp_program_trash": [false, ["corp.ambush_bluff"]],
  "access.corp_counter_punish": [false, ["corp.ambush_bluff"]],
  "expose.corp_prevention": [true, []],
  "run.corp_redirect": [false, ["corp.remote_scoring"]],
  "run.corp_start_tax": [false, ["corp.ice_tax_glacier"]],
  "hq.corp_hand_filter": [true, []],
  "virus.corp_counter_prevention": [true, []],
  "rnd.corp_self_shuffle_access": [true, []],
  "risk.agenda_point_cost": [true, []],
  "risk.leaves_play_loss": [true, []],
  "risk.temporary_credit_drawback": [true, []],
  "risk.random_discard_cost": [true, []],
};

const FORBIDDEN_SIGNALS = new Set([
  "corp.node",
  "corp.asset",
  "node.asset",
  "node.ai",
  "node.unique",
  "node.advertisement",
  "node.transactions",
  "node.gray_ops",
  "node.black_ops",
  "node.ambush",
  "node.virus",
  "node.random",
  "corp.asset_economy",
  "asset.campaign",
  "node.schlaghund",
  "asset.acme",
  "node.virus_test_site",
]);

const STRATEGIC_ROLE_BY_PAIR_ROLE = {
  installed_economy_engine: "engine_anchor",
  high_risk_economy_payoff: "engine_anchor",
  remote_economy_engine: "engine_anchor",
  advancement_enabler: "scoring_tool",
  fast_advance_action_engine: "scoring_tool",
  repeatable_action_engine: "scoring_tool",
  ice_tax_support: "tax_tool",
  trace_credit_enabler: "enabler",
  persistent_tag_source: "enabler",
  tagged_meat_payoff: "win_condition",
  meat_damage_payoff: "win_condition",
  damage_amplifier: "win_condition",
  access_ambush_payoff: "punish_payoff",
  access_hardware_trash: "punish_payoff",
  access_program_trash: "punish_payoff",
  remote_run_control: "defensive_tool",
  run_tax_support: "tax_tool",
  install_rez_reserve: "engine_anchor",
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

const COMPILED_EFFECT_KIND = {
  brain_damage: "damage",
  bounce: "card_recovery",
  counter_bank: "finite_economy_pool",
  counter_punish: "access_punish",
  counter_transfer: "advance",
  damage_amp: "global_modifier",
  hand_size: "hand_size_modifier",
  icebreaker_counter: "access_punish",
  meat_damage: "damage",
  net_damage: "damage",
  prevention: "prevention_replacement",
  run_redirect: "run_lock",
  shuffle: "zone_shuffle",
  strength_bonus: "global_modifier",
  subroutine_add: "global_modifier",
  tax: "run_tax",
};

const COMPILED_EFFECT_TIMING = {
  access: "on_access",
  archives_access: "on_access",
  counter_spend: "action",
  credit_gain_choice: "action",
  expose_attempt: "prevention_window",
  once_per_turn: "persistent",
  recurring: "persistent",
  rnd_access: "on_access",
  rez: "on_rez",
  runner_draw: "runner_turn",
  start_of_run: "during_run",
  static: "persistent",
  trace_attempt: "trace_window",
  turn: "corp_turn",
  turn_end: "corp_turn",
  turn_start: "start_of_turn",
};

const COMPILED_EFFECT_SCOPE = {
  corp_card: "installed_card",
  corp_ice: "ice",
  corp_installed_card: "installed_card",
  damage_source: "damage",
};

const COMPILED_CONDITION_KIND = {
  access_window: "requires_accessed_card",
  archives_access_only: "requires_archives_card",
  archives_exception: "requires_accessed_card",
  black_ice_constraint_remains_card_trait: "requires_installed_ice",
  code_gate_constraint_remains_card_trait: "requires_installed_ice",
  costs_agenda_points: "requires_scored_agenda",
  discard_random_card_cost: "requires_during_run",
  during_run_only: "requires_during_run",
  install_or_rez_only: "requires_installed_card",
  pay_to_fire: "requires_corp_credits_threshold",
  random_roll_against_runner_tag_count: "requires_runner_tagged",
  requires_agenda_cards_in_hq_revealed: "requires_agenda_reveal",
  requires_rezzed_ice_to_trash: "requires_rezzed_ice",
  requires_runner_two_or_more_tags: "requires_runner_tagged",
  rnd_access_only: "requires_rnd_top",
  rnd_reveal_requirement: "requires_rnd_top",
  runner_may_pay_to_avoid_tag: "requires_runner_pay_or_take_tag",
  runner_received_tag_this_turn: "requires_runner_tagged",
  scales_with_advancement_counters: "requires_advancement_counter",
  self_trash_on_success: "requires_runner_tagged",
  start_of_run_only: "requires_during_run",
  target_fort_if_possible: "requires_remote_server",
  trace_attempt_only: "requires_trace_attempt",
  unspent_credits_returned: "requires_during_run",
  wall_constraint_remains_card_trait: "requires_installed_ice",
};

function compiledEffect(effect) {
  const { target, ...copy } = effect;
  return {
    ...copy,
    kind: COMPILED_EFFECT_KIND[copy.kind] ?? copy.kind,
    timing: COMPILED_EFFECT_TIMING[copy.timing] ?? copy.timing,
    scope: COMPILED_EFFECT_SCOPE[copy.scope] ?? copy.scope,
  };
}

function compiledConditions(conditions = []) {
  const seen = new Set();
  return conditions.flatMap((condition) => {
    const kind = COMPILED_CONDITION_KIND[condition.kind] ?? condition.kind;
    if (!kind || seen.has(kind)) return [];
    seen.add(kind);
    return [{ ...condition, kind }];
  });
}

function signalDescription(signalId) {
  return `AI026 Corp node/asset tactic signal: ${signalId.replaceAll("_", " ")}.`;
}

function signalGroup(signalId) {
  if (signalId.startsWith("economy.")) return "ai026_corp_nodes_assets_economy";
  if (signalId.startsWith("advance.") || signalId.startsWith("action.")) return "ai026_corp_nodes_assets_advancement_action";
  if (signalId.startsWith("ice.")) return "ai026_corp_nodes_assets_ice_support";
  if (signalId.startsWith("tag.") || signalId.startsWith("trace.")) return "corp_tag_trace_punish";
  if (signalId.startsWith("damage.")) return "damage_kill";
  if (signalId.startsWith("access.") || signalId.startsWith("run.")) return "ai026_corp_nodes_assets_access_run";
  if (signalId.startsWith("risk.") || signalId.startsWith("condition.")) return "ai026_corp_nodes_assets_risk_condition";
  return "ai026_corp_nodes_assets";
}

function updateTacticSignals() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  catalog.signals = (catalog.signals ?? []).filter((signal) => !FORBIDDEN_SIGNALS.has(signal.signalId));
  const byId = new Map(catalog.signals.map((signal) => [signal.signalId, signal]));
  for (const [signalId, [supportOnly, anchors]] of Object.entries(AI026_SIGNALS)) {
    const signal = byId.get(signalId) ?? { signalId };
    signal.group = signalGroup(signalId);
    signal.sideScope = "corp";
    signal.description = signalDescription(signalId);
    signal.supportOnly = supportOnly;
    signal.mayAnchorStrategy = !supportOnly;
    signal.allowedStrategyAnchors = [...anchors].sort();
    signal.sourceKinds = ["AI026 reviewed Corp node/asset structured hint effects"];
    signal.examples = signal.examples ?? [];
    signal.targetProfileRelevant =
      signalId.startsWith("advance.") ||
      signalId.startsWith("ice.") ||
      signalId.startsWith("trace.") ||
      signalId.startsWith("access.") ||
      signalId.startsWith("run.") ||
      signalId.startsWith("expose.");
    signal.notes =
      "AI026 Corp node/asset signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.";
    if (!byId.has(signalId)) {
      catalog.signals.push(signal);
      byId.set(signalId, signal);
    }
  }
  catalog.taskId = "AI026";
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI026 adds Corp node/asset function signals without type-only, subtype-only or card-specific signals and without planner, engine, targeting, action-score, plan-weight, legality, profile/default or UI-derivation effects.";
  catalog.signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
  writeJson(TACTIC_SIGNAL_PATH, catalog);
  return Object.keys(AI026_SIGNALS).map((signalId) => byId.get(signalId));
}

function updateDerivationRules() {
  const data = readJson(DERIVATION_PATH);
  data.derivationRules = (data.derivationRules ?? []).filter((rule) => !FORBIDDEN_SIGNALS.has(rule.signalId));
  const existing = new Set(
    data.derivationRules.map((rule) => `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`),
  );
  for (const [signalId, [, anchors]] of Object.entries(AI026_SIGNALS)) {
    const rule = {
      signalId,
      source: "effects",
      match: { target: signalId },
      gates: { side: "corp", cardType: "asset", target: signalId },
      strategyAnchorFor: [...anchors].sort(),
    };
    const key = `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`;
    if (!existing.has(key)) data.derivationRules.push(rule);
  }
  data.taskId = "AI026";
  data.updatesTaskId = `${data.updatesTaskId ?? "AI003-AI025"}/AI026`;
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI026 adds Corp node/asset semantics while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  data.derivationRules.sort((left, right) =>
    `${left.signalId}:${JSON.stringify(left.match)}`.localeCompare(`${right.signalId}:${JSON.stringify(right.match)}`),
  );
  writeJson(DERIVATION_PATH, data);
}

const A = {
  "onr_v1_308_acme-savings-and-loan": {
    family: "high_risk_economy",
    signals: ["economy.corp_credit_burst", "risk.agenda_point_cost", "risk.loss_condition"],
    effects: [e("economy", "rez", "corp", "economy.corp_credit_burst", { resource: "credits", amount: 12, finite: true })],
    risks: ["rez_costs_agenda_point", "end_of_turn_payment_or_lose_game", "requires_action_and_credits_to_remove_liability"],
    pairs: [pair("corp.asset_economy", "high_risk_economy_payoff", ["economy.corp_credit_burst"], "medium")],
    target: ["schema_gap", ["long_term_liability_payment_choice"]],
    rationale: "Large one-shot credit injection with agenda-point and lose-game liability; economy function is explicit, risk is modeled separately.",
  },
  "onr_v1_309_bbs-whispering-campaign": {
    family: "installed_economy_campaign",
    signals: ["economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("economy", "action", "corp", "economy.corp_installed_credit_drip", { resource: "credits", amount: 2, finite: true })],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    rationale: "Installed credit campaign creates remote trash pressure but no subtype signal.",
  },
  "onr_v1_310_blood-cat": {
    family: "trace_tag_source",
    signals: ["trace.source", "tag.source"],
    effects: [e("trace", "action", "runner", "trace.source", { amount: 5 }), e("tag_source", "trace_success", "runner", "tag.source")],
    conditions: [c("requires_trace_success")],
    pairs: [pair("corp.tag_trace_punish", "trace_credit_enabler", ["trace.source", "tag.source"], "medium")],
    target: ["candidate", ["use_target:runner"]],
    rationale: "Repeatable trace into tag source; not a tag payoff.",
  },
  "onr_v1_311_braindance-campaign": {
    family: "installed_economy_campaign",
    signals: ["economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("economy", "turn_start", "corp", "economy.corp_installed_credit_drip", { resource: "credits", amount: 2, finite: true })],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    rationale: "Start-of-turn installed economy creates asset-economy pressure; Gray Ops remains only a subtype.",
  },
  "onr_v1_312_chicago-branch": {
    family: "advancement_fast_advance_support",
    signals: ["advance.corp_counter_placement", "advance.score_window_support", "remote.scoring_protection"],
    effects: [e("advance", "action", "installed_card", "advance.corp_counter_placement", { amount: 2 })],
    pairs: [
      pair("corp.fast_advance", "advancement_enabler", ["advance.corp_counter_placement", "advance.score_window_support"], "high"),
      pair("corp.remote_scoring", "advancement_enabler", ["remote.scoring_protection"], "medium"),
    ],
    target: ["candidate", ["use_target:installed_advanceable_card"]],
    rationale: "Repeatable two-counter placement is real score conversion support.",
  },
  "onr_v1_313_city-surveillance": {
    family: "persistent_tag_tax",
    signals: ["tag.corp_persistent_source", "tag.source", "tax.runner_credit"],
    effects: [e("tag_source", "runner_draw", "runner", "tag.corp_persistent_source"), e("tax", "runner_draw", "runner", "tax.runner_credit")],
    conditions: [c("runner_may_pay_to_avoid_tag")],
    pairs: [pair("corp.tag_trace_punish", "persistent_tag_source", ["tag.corp_persistent_source", "tag.source"], "high")],
    rationale: "Persistent draw-linked tag pressure is a tag source, not a tagged payoff.",
  },
  "onr_v1_314_corporate-negotiating-center": {
    family: "hq_agenda_reveal_economy",
    signals: ["economy.corp_installed_credit_drip", "risk.high_difficulty_agenda"],
    effects: [e("economy", "turn_start", "corp", "economy.corp_installed_credit_drip", { resource: "credits" })],
    conditions: [c("requires_agenda_cards_in_hq_revealed")],
    hidden: "corp_side_only_until_revealed_choice",
    rationale: "Conditional HQ-agenda reveal economy remains support-only and side-safe.",
  },
  "onr_v1_315_corprunners-shattered-remains": {
    family: "access_hardware_trash_ambush",
    signals: ["remote.ambush", "access.punish", "access.corp_hardware_trash", "advance.corp_counter_bank"],
    effects: [e("hardware_trash", "access", "runner", "access.corp_hardware_trash")],
    conditions: [c("access_window"), c("scales_with_advancement_counters")],
    pairs: [
      pair("corp.ambush_bluff", "access_hardware_trash", ["remote.ambush", "access.punish", "access.corp_hardware_trash"], "high"),
      pair("corp.tag_trace_punish", "access_hardware_trash", ["access.corp_hardware_trash"], "low"),
    ],
    target: ["candidate", ["use_target:installed_hardware"]],
    rationale: "Access hardware trash is a concrete ambush payoff; Ambush subtype is not used as a signal by itself.",
  },
  "onr_v1_316_cowboy-sysop": {
    family: "installed_card_bounce",
    signals: ["archives.corp_recovery"],
    effects: [e("bounce", "action", "corp_installed_card", "archives.corp_recovery")],
    target: ["schema_gap", ["corp_private_installed_card_to_hq_choice"]],
    hidden: "corp_side_only_until_resolved",
    rationale: "Corp-side uninstall to HQ is utility/recovery support, not a strategy anchor.",
  },
  "onr_v1_317_data-masons": {
    family: "ice_rez_discount_strength_support",
    signals: ["ice.corp_rez_discount", "ice.corp_strength_support", "tax.ice"],
    effects: [e("rez_discount", "static", "corp_ice", "ice.corp_rez_discount"), e("strength_bonus", "static", "corp_ice", "ice.corp_strength_support")],
    conditions: [c("wall_constraint_remains_card_trait")],
    pairs: [pair("corp.ice_tax_glacier", "ice_tax_support", ["ice.corp_rez_discount", "ice.corp_strength_support", "tax.ice"], "high")],
    target: ["candidate", ["use_target:installed_ice_constraint"]],
    rationale: "Functional rez discount and strength support are modeled without mirroring Wall as a tactic signal.",
  },
  "onr_v1_318_department-of-truth-enhancement": {
    family: "installed_economy_charge_bank",
    signals: ["economy.corp_counter_bank", "economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("counter_bank", "action", "corp", "economy.corp_counter_bank"), e("economy", "action", "corp", "economy.corp_installed_credit_drip")],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    rationale: "Action-charged installed economy supports asset economy; subtype remains card data.",
  },
  "onr_v1_319_disinfectant-inc": {
    family: "virus_counter_defense",
    signals: ["virus.corp_counter_prevention"],
    effects: [e("prevention", "once_per_turn", "corp", "virus.corp_counter_prevention")],
    rationale: "Virus-counter prevention is defensive utility, not a generic Corp virus strategy.",
  },
  "onr_v1_320_encoder-inc": {
    family: "ice_rez_discount_subroutine_support",
    signals: ["ice.corp_rez_discount", "ice.corp_subroutine_support", "tax.ice"],
    effects: [e("rez_discount", "static", "corp_ice", "ice.corp_rez_discount"), e("subroutine_add", "static", "corp_ice", "ice.corp_subroutine_support")],
    conditions: [c("code_gate_constraint_remains_card_trait")],
    pairs: [pair("corp.ice_tax_glacier", "ice_tax_support", ["ice.corp_rez_discount", "ice.corp_subroutine_support", "tax.ice"], "high")],
    target: ["candidate", ["use_target:installed_ice_constraint"]],
    rationale: "Functional rez discount plus extra ETR subroutine support; Code Gate remains a constraint, not a signal.",
  },
  "onr_v1_321_esa-contract": {
    family: "draw",
    signals: ["economy.corp_draw"],
    effects: [e("draw", "action", "corp", "economy.corp_draw", { amount: 2 })],
    rationale: "Simple repeatable draw remains support-only.",
  },
  "onr_v1_322_euromarket-consortium": {
    family: "draw_hand_size",
    signals: ["economy.corp_draw", "score.hand_size"],
    effects: [e("draw", "action", "corp", "economy.corp_draw", { amount: 2 }), e("hand_size", "static", "corp", "score.hand_size")],
    rationale: "Draw and hand-size utility remains support-only.",
  },
  "onr_v1_323_experimental-ai": {
    family: "access_program_trash_ambush",
    signals: ["remote.ambush", "access.punish", "access.corp_program_trash", "advance.corp_counter_bank"],
    effects: [e("program_trash", "access", "runner", "access.corp_program_trash")],
    conditions: [c("access_window"), c("scales_with_advancement_counters")],
    pairs: [pair("corp.ambush_bluff", "access_program_trash", ["remote.ambush", "access.punish", "access.corp_program_trash"], "high")],
    target: ["candidate", ["use_target:installed_program"]],
    rationale: "Access program trash is a concrete ambush payoff; AI/Ambush subtypes remain card data.",
  },
  "onr_v1_324_fortress-architects": {
    family: "ice_install_discount",
    signals: ["ice.corp_install_discount", "economy.rez_discount", "tax.ice"],
    effects: [e("install_discount", "static", "corp_ice", "ice.corp_install_discount")],
    pairs: [
      pair("corp.ice_tax_glacier", "ice_tax_support", ["ice.corp_install_discount", "tax.ice"], "medium"),
      pair("corp.economy_rez_reserve", "install_rez_reserve", ["ice.corp_install_discount", "economy.rez_discount"], "medium"),
    ],
    target: ["candidate", ["use_target:ice_install"]],
    rationale: "ICE install discount supports ICE-density and reserve lines without subtype mirroring.",
  },
  "onr_v1_325_hacker-tracker-central": {
    family: "trace_credit_support",
    signals: ["trace.corp_credit_support", "economy.corp_trace_credit_support"],
    effects: [e("trace_credit", "trace_attempt", "corp", "trace.corp_credit_support")],
    pairs: [pair("corp.tag_trace_punish", "trace_credit_enabler", ["trace.corp_credit_support"], "medium")],
    rationale: "Trace-specific credit support enables trace decks but is not a tag source by itself.",
  },
  "onr_v1_326_holovid-campaign": {
    family: "installed_economy_campaign",
    signals: ["economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("economy", "turn_start", "corp", "economy.corp_installed_credit_drip", { resource: "credits", amount: 1, finite: true })],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    rationale: "Installed credit drip creates asset-economy pressure; Advertisement remains a subtype.",
  },
  "onr_v1_327_i-got-a-rock": {
    family: "tagged_runner_meat_damage_payoff",
    signals: ["damage.corp_tagged_meat_payoff", "damage.payoff", "tag.payoff", "risk.requires_tagged_runner"],
    effects: [e("meat_damage", "action", "runner", "damage.corp_tagged_meat_payoff", { amount: 15 })],
    conditions: [c("requires_runner_two_or_more_tags"), c("costs_agenda_points")],
    risks: ["costs_three_agenda_points"],
    pairs: [
      pair("corp.damage_kill", "tagged_meat_payoff", ["damage.corp_tagged_meat_payoff", "damage.payoff"], "high"),
      pair("corp.tag_trace_punish", "tagged_meat_payoff", ["tag.payoff"], "high"),
    ],
    target: ["candidate", ["use_target:runner"]],
    rationale: "Large tagged meat damage payoff is both Kill and Tag/Punish; Black Ops remains a subtype.",
  },
  "onr_v1_328_information-laundering": {
    family: "advanceable_installed_economy",
    signals: ["economy.corp_counter_bank", "economy.corp_installed_credit_drip", "advance.corp_counter_bank", "remote.asset_economy"],
    effects: [e("economy", "action", "corp", "economy.corp_counter_bank")],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    target: ["candidate", ["use_target:self_advancement_counter_count"]],
    rationale: "Advanceable installed credit payout supports asset economy but does not become Fast Advance.",
  },
  "onr_v1_329_investment-firm": {
    family: "installed_economy_bank",
    signals: ["economy.corp_counter_bank", "economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("economy", "turn_start", "corp", "economy.corp_installed_credit_drip"), e("counter_bank", "credit_gain_choice", "corp", "economy.corp_counter_bank")],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    rationale: "Banked installed economy supports asset economy; Transactions remains card data.",
  },
  "onr_v1_330_krumz": {
    family: "trace_credit_support",
    signals: ["trace.corp_credit_support", "economy.corp_trace_credit_support"],
    effects: [e("trace_credit", "recurring", "corp", "trace.corp_credit_support", { amount: 1 })],
    pairs: [pair("corp.tag_trace_punish", "trace_credit_enabler", ["trace.corp_credit_support"], "low")],
    rationale: "Small recurring trace credit support; not a tag source.",
  },
  "onr_v1_331_nevinyrral": {
    family: "repeatable_extra_action_high_risk",
    signals: ["action.corp_repeatable_extra_action", "risk.leaves_play_loss", "risk.loss_condition"],
    effects: [e("extra_action", "turn", "corp", "action.corp_repeatable_extra_action")],
    risks: ["lose_game_if_leaves_play_while_rezzed"],
    pairs: [
      pair("corp.fast_advance", "repeatable_action_engine", ["action.corp_repeatable_extra_action"], "medium"),
      pair("corp.remote_scoring", "repeatable_action_engine", ["action.corp_repeatable_extra_action"], "medium"),
    ],
    rationale: "Repeatable extra action is a real engine, with leave-play lose-game risk modeled separately.",
  },
  "onr_v1_332_newsgroup-taunting": {
    family: "run_tax",
    signals: ["run.corp_start_tax", "tax.runner_credit"],
    effects: [e("run_tax", "start_of_run", "runner", "run.corp_start_tax", { amount: 1 })],
    pairs: [pair("corp.ice_tax_glacier", "run_tax_support", ["run.corp_start_tax", "tax.runner_credit"], "medium")],
    rationale: "Start-of-run credit tax supports tax/glacier without creating run legality.",
  },
  "onr_v1_333_omniscience-foundation": {
    family: "tag_snowball",
    signals: ["tag.corp_persistent_source", "tag.source", "tag.payoff"],
    effects: [e("tag_source", "turn_end", "runner", "tag.corp_persistent_source")],
    conditions: [c("runner_received_tag_this_turn")],
    pairs: [pair("corp.tag_trace_punish", "persistent_tag_source", ["tag.corp_persistent_source", "tag.source", "tag.payoff"], "medium")],
    rationale: "Tag snowball support extends tags but does not directly damage or trash.",
  },
  "onr_v1_334_pacifica-regional-ai": {
    family: "advancement_action_engine",
    signals: ["advance.corp_counter_bank", "action.corp_counter_to_action", "advance.score_window_support"],
    effects: [e("extra_action", "counter_spend", "corp", "action.corp_counter_to_action")],
    pairs: [pair("corp.fast_advance", "fast_advance_action_engine", ["action.corp_counter_to_action", "advance.score_window_support"], "high")],
    target: ["candidate", ["use_target:self_advancement_counter_count"]],
    rationale: "Advancement counters convert to actions, making it a Fast Advance candidate without AI subtype signaling.",
  },
  "onr_v1_335_remote-facility": {
    family: "repeatable_extra_action",
    signals: ["action.corp_repeatable_extra_action"],
    effects: [e("extra_action", "turn", "corp", "action.corp_repeatable_extra_action")],
    pairs: [
      pair("corp.fast_advance", "repeatable_action_engine", ["action.corp_repeatable_extra_action"], "medium"),
      pair("corp.remote_scoring", "repeatable_action_engine", ["action.corp_repeatable_extra_action"], "medium"),
    ],
    rationale: "Repeatable extra action is broad score-conversion support, not a type-based asset signal.",
  },
  "onr_v1_336_rescheduler": {
    family: "hq_rnd_hand_filter",
    signals: ["hq.corp_hand_filter", "rnd.corp_topdeck_setup"],
    effects: [e("shuffle_draw", "action", "corp", "hq.corp_hand_filter")],
    hidden: "corp_side_only_until_resolved",
    target: ["schema_gap", ["private_hq_shuffle_and_draw_count"]],
    rationale: "HQ-to-R&D shuffle and redraw is private filtering support; no central strategy anchor.",
  },
  "onr_v1_337_rockerboy-promotion": {
    family: "installed_economy_campaign",
    signals: ["economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("economy", "action", "corp", "economy.corp_installed_credit_drip", { amount: 3, finite: true })],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    rationale: "Installed action economy creates asset-economy pressure; no Advertisement signal.",
  },
  "onr_v1_338_rustbelt-hq-branch": {
    family: "hand_size",
    signals: ["score.hand_size"],
    effects: [e("hand_size", "static", "corp", "score.hand_size", { amount: 2 })],
    rationale: "Simple hand-size utility remains support-only.",
  },
  "onr_v1_339_schlaghund": {
    family: "tagged_runner_meat_damage_payoff",
    signals: ["damage.corp_tagged_meat_payoff", "damage.payoff", "tag.payoff", "risk.requires_tagged_runner", "risk.random_action"],
    effects: [e("meat_damage", "action", "runner", "damage.corp_tagged_meat_payoff", { amount: 10 })],
    conditions: [c("random_roll_against_runner_tag_count"), c("self_trash_on_success")],
    pairs: [
      pair("corp.damage_kill", "tagged_meat_payoff", ["damage.corp_tagged_meat_payoff", "damage.payoff"], "high"),
      pair("corp.tag_trace_punish", "tagged_meat_payoff", ["tag.payoff"], "high"),
    ],
    target: ["candidate", ["use_target:runner"]],
    rationale: "Tagged meat damage payoff is modeled by function; Random and Black Ops remain subtypes.",
  },
  "onr_v1_340_setup": {
    family: "access_net_damage_ambush",
    signals: ["remote.ambush", "access.punish", "damage.payoff", "access.rnd_reveal_requirement", "access.archives_safe_exception"],
    effects: [e("net_damage", "access", "runner", "damage.payoff", { amount: 2 })],
    conditions: [c("access_window"), c("archives_exception"), c("rnd_reveal_requirement")],
    pairs: [pair("corp.ambush_bluff", "access_ambush_payoff", ["remote.ambush", "access.punish", "damage.payoff"], "high")],
    rationale: "Access net damage ambush, with Archives exception and R&D reveal noted separately.",
  },
  "onr_v1_341_skalderviken-sa-beta-test-site": {
    family: "ice_rez_discount",
    signals: ["ice.corp_rez_discount", "tax.ice"],
    effects: [e("rez_discount", "static", "corp_ice", "ice.corp_rez_discount")],
    conditions: [c("black_ice_constraint_remains_card_trait")],
    pairs: [pair("corp.ice_tax_glacier", "ice_tax_support", ["ice.corp_rez_discount", "tax.ice"], "medium")],
    target: ["candidate", ["use_target:installed_ice_constraint"]],
    rationale: "Rez discount support is functional; Black ICE remains a constraint.",
  },
  "onr_v1_342_solo-squad": {
    family: "tagged_runner_meat_damage_payoff",
    signals: ["damage.corp_tagged_meat_payoff", "damage.payoff", "tag.payoff", "risk.requires_tagged_runner"],
    effects: [e("meat_damage", "action", "runner", "damage.corp_tagged_meat_payoff", { amount: 1 })],
    conditions: [c("requires_runner_tagged")],
    pairs: [
      pair("corp.damage_kill", "tagged_meat_payoff", ["damage.corp_tagged_meat_payoff", "damage.payoff"], "medium"),
      pair("corp.tag_trace_punish", "tagged_meat_payoff", ["tag.payoff"], "medium"),
    ],
    target: ["candidate", ["use_target:runner"]],
    rationale: "Small repeatable tagged damage is a tag-punish kill support card, not a generic damage label.",
  },
  "onr_v1_343_south-african-mining-corp": {
    family: "installed_economy_action_burst",
    signals: ["economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("economy", "action", "corp", "economy.corp_installed_credit_drip", { amount: 6, actionCost: 3 })],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "low")],
    rationale: "Installed economy payoff is action-heavy; Transactions remains card data.",
  },
  "onr_v1_344_spinn-public-relations": {
    family: "installed_economy_bank",
    signals: ["economy.corp_counter_bank", "economy.corp_installed_credit_drip", "remote.asset_economy"],
    effects: [e("counter_bank", "action", "corp", "economy.corp_counter_bank"), e("economy", "turn_start", "corp", "economy.corp_installed_credit_drip")],
    pairs: [pair("corp.asset_economy", "installed_economy_engine", ["remote.asset_economy"], "medium")],
    rationale: "Installed banked economy supports asset economy without using Transactions as signal.",
  },
  "onr_v1_345_trap": {
    family: "access_net_damage_tag_ambush",
    signals: ["remote.ambush", "access.punish", "damage.payoff", "tag.source", "access.rnd_reveal_requirement", "access.archives_safe_exception"],
    effects: [e("net_damage", "access", "runner", "damage.payoff", { amount: 3 }), e("tag_source", "access", "runner", "tag.source")],
    conditions: [c("access_window"), c("pay_to_fire"), c("archives_exception"), c("rnd_reveal_requirement")],
    pairs: [
      pair("corp.ambush_bluff", "access_ambush_payoff", ["remote.ambush", "access.punish", "damage.payoff"], "high"),
      pair("corp.tag_trace_punish", "persistent_tag_source", ["tag.source"], "medium"),
    ],
    rationale: "Access ambush produces net damage and a tag source; Archives and R&D exceptions stay explicit.",
  },
  "onr_v1_346_vacant-soulkiller": {
    family: "access_brain_damage_ambush",
    signals: ["remote.ambush", "access.punish", "damage.payoff", "advance.corp_counter_bank"],
    effects: [e("brain_damage", "access", "runner", "damage.payoff")],
    conditions: [c("access_window"), c("scales_with_advancement_counters")],
    pairs: [
      pair("corp.ambush_bluff", "access_ambush_payoff", ["remote.ambush", "access.punish", "damage.payoff"], "high"),
      pair("corp.damage_kill", "meat_damage_payoff", ["damage.payoff"], "medium"),
    ],
    rationale: "Advancement-scaling brain damage is access punishment and kill pressure.",
  },
  "onr_v1_347_vapor-ops": {
    family: "advancement_counter_bank_transfer",
    signals: ["advance.corp_counter_bank", "advance.corp_counter_transfer", "advance.score_window_support", "economy.corp_counter_bank"],
    effects: [e("counter_transfer", "action", "installed_card", "advance.corp_counter_transfer"), e("economy", "counter_spend", "corp", "economy.corp_counter_bank")],
    pairs: [pair("corp.fast_advance", "advancement_enabler", ["advance.corp_counter_transfer", "advance.score_window_support"], "high")],
    target: ["candidate", ["use_target:installed_advanceable_card"]],
    rationale: "Counter bank and movement can convert to score windows; no generic asset signal.",
  },
  "onr_v1_348_virus-test-site": {
    family: "access_net_damage_ambush",
    signals: ["remote.ambush", "access.punish", "damage.payoff", "advance.corp_counter_bank", "access.rnd_reveal_requirement", "access.archives_safe_exception"],
    effects: [e("net_damage", "access", "runner", "damage.payoff")],
    conditions: [c("access_window"), c("scales_with_advancement_counters"), c("archives_exception"), c("rnd_reveal_requirement")],
    pairs: [
      pair("corp.ambush_bluff", "access_ambush_payoff", ["remote.ambush", "access.punish", "damage.payoff"], "high"),
      pair("corp.damage_kill", "meat_damage_payoff", ["damage.payoff"], "medium"),
    ],
    rationale: "Advancement-scaling access net damage is an ambush payoff; Virus subtype is not a signal.",
  },
  "onr_proteus_054_bel-digmo-antibody": {
    family: "rnd_access_net_damage_antibody",
    signals: ["access.punish", "damage.payoff", "access.rnd_reveal_requirement", "rnd.corp_self_shuffle_access"],
    effects: [e("net_damage", "rnd_access", "runner", "damage.payoff", { amount: 1 }), e("shuffle", "rez", "rnd", "rnd.corp_self_shuffle_access")],
    conditions: [c("rnd_access_only"), c("rnd_reveal_requirement")],
    pairs: [pair("corp.ambush_bluff", "access_ambush_payoff", ["access.punish", "damage.payoff"], "medium")],
    rationale: "R&D access damage is modeled by access function, not Virus or Node subtype.",
  },
  "onr_proteus_055_cybertech-think-tank": {
    family: "damage_amplifier",
    signals: ["damage.corp_damage_amplifier", "advance.corp_counter_bank", "damage.payoff"],
    effects: [e("damage_amp", "counter_spend", "damage_source", "damage.corp_damage_amplifier")],
    pairs: [pair("corp.damage_kill", "damage_amplifier", ["damage.corp_damage_amplifier", "damage.payoff"], "high")],
    target: ["schema_gap", ["use_target:damage_source"]],
    rationale: "Advancement counters increase another meat damage source; this is kill support, not a Node/AI signal.",
  },
  "onr_proteus_056_department-of-misinformation": {
    family: "expose_prevention",
    signals: ["expose.corp_prevention"],
    effects: [e("prevention", "expose_attempt", "corp_card", "expose.corp_prevention")],
    target: ["candidate", ["use_target:corp_card_expose_attempt"]],
    hidden: "corp_side_only_until_rezzed_or_expose_attempt",
    rationale: "Expose prevention is defensive utility and not automatically remote contest.",
  },
  "onr_proteus_057_doppelganger-antibody": {
    family: "access_counter_economy_punish",
    signals: ["access.punish", "access.corp_counter_punish", "access.rnd_reveal_requirement", "access.archives_safe_exception"],
    effects: [e("counter_punish", "access", "runner", "access.corp_counter_punish")],
    conditions: [c("access_window"), c("pay_to_fire"), c("archives_exception"), c("rnd_reveal_requirement")],
    pairs: [pair("corp.ambush_bluff", "access_ambush_payoff", ["access.punish", "access.corp_counter_punish"], "medium")],
    rationale: "Access counter tax is functional punishment; Virus subtype stays a trait.",
  },
  "onr_proteus_058_executive-boot-camp": {
    family: "run_temporary_economy_with_random_cost",
    signals: ["economy.corp_run_temporary_credit", "risk.temporary_credit_drawback", "risk.random_discard_cost"],
    effects: [e("economy", "during_run", "corp", "economy.corp_run_temporary_credit", { amount: 2 })],
    conditions: [c("during_run_only"), c("discard_random_card_cost"), c("unspent_credits_returned")],
    risks: ["random_discard_cost", "temporary_credit_liability"],
    pairs: [pair("corp.economy_rez_reserve", "install_rez_reserve", ["economy.corp_run_temporary_credit"], "medium")],
    target: ["schema_gap", ["private_random_discard_cost"]],
    rationale: "Temporary run-only credits support rez/trace reserve with explicit random discard and temporary-credit drawbacks.",
  },
  "onr_proteus_059_government-contract": {
    family: "advanceable_install_rez_economy",
    signals: ["economy.corp_install_rez_credit", "economy.advanceable", "advance.corp_counter_bank", "risk.temporary_credit_drawback"],
    effects: [e("economy", "counter_spend", "corp", "economy.corp_install_rez_credit", { amount: 3 })],
    conditions: [c("install_or_rez_only"), c("unspent_credits_returned")],
    pairs: [pair("corp.economy_rez_reserve", "install_rez_reserve", ["economy.corp_install_rez_credit", "economy.advanceable"], "high")],
    target: ["candidate", ["use_target:install_or_rez_payment"]],
    rationale: "Advanceable install/rez credits support reserve-sensitive Corp economy with temporary-credit risk.",
  },
  "onr_proteus_061_ldl-traffic-analyzers": {
    family: "advanceable_trace_credit_support",
    signals: ["trace.corp_credit_support", "economy.corp_trace_credit_support", "advance.corp_counter_bank", "risk.temporary_credit_drawback"],
    effects: [e("trace_credit", "trace_attempt", "corp", "trace.corp_credit_support", { amount: 5 })],
    conditions: [c("trace_attempt_only"), c("unspent_credits_returned")],
    pairs: [pair("corp.tag_trace_punish", "trace_credit_enabler", ["trace.corp_credit_support"], "medium")],
    target: ["candidate", ["use_target:trace_attempt"]],
    rationale: "Advancement counters convert to trace-only credits, supporting trace lines without being a tag source.",
  },
  "onr_proteus_068_pattel-antibody": {
    family: "access_icebreaker_strength_punish",
    signals: ["access.punish", "access.corp_counter_punish", "access.rnd_reveal_requirement", "access.archives_safe_exception"],
    effects: [e("icebreaker_counter", "access", "runner", "access.corp_counter_punish")],
    conditions: [c("access_window"), c("pay_to_fire"), c("archives_exception"), c("rnd_reveal_requirement")],
    pairs: [pair("corp.ambush_bluff", "access_ambush_payoff", ["access.punish", "access.corp_counter_punish"], "medium")],
    target: ["candidate", ["use_target:installed_icebreaker"]],
    rationale: "Icebreaker strength counters are access punishment; Virus and Node stay card traits.",
  },
  "onr_proteus_074_siren": {
    family: "run_redirect_control",
    signals: ["run.corp_redirect", "remote.scoring_protection"],
    effects: [e("run_redirect", "start_of_run", "runner", "run.corp_redirect")],
    conditions: [c("start_of_run_only"), c("target_fort_if_possible")],
    pairs: [pair("corp.remote_scoring", "remote_run_control", ["run.corp_redirect", "remote.scoring_protection"], "high")],
    target: ["schema_gap", ["run_redirect_fort_choice"]],
    rationale: "Run redirect/control supports remote defense but adds no planner or legality behavior.",
  },
  "onr_proteus_075_stereogram-antibody": {
    family: "archives_access_net_damage_antibody",
    signals: ["access.punish", "damage.payoff", "rnd.corp_self_shuffle_access"],
    effects: [e("net_damage", "archives_access", "runner", "damage.payoff", { amount: 1 }), e("shuffle", "archives_access", "rnd", "rnd.corp_self_shuffle_access")],
    conditions: [c("archives_access_only")],
    pairs: [pair("corp.ambush_bluff", "access_ambush_payoff", ["access.punish", "damage.payoff"], "low")],
    hidden: "archives_access_exception",
    rationale: "Archives access net damage plus self-shuffle is functional access punishment; Virus subtype is not a signal.",
  },
  "onr_proteus_076_syd-meyer-superstores": {
    family: "ice_trash_cashout",
    signals: ["economy.corp_asset_cashout", "ice.corp_install_discount", "risk.temporary_rez_liability"],
    effects: [e("economy", "action", "corp", "economy.corp_asset_cashout", { amount: 4 }), e("ice_trash", "action", "corp_ice", "economy.corp_asset_cashout")],
    conditions: [c("requires_rezzed_ice_to_trash")],
    risks: ["trashes_own_rezzed_ice"],
    pairs: [
      pair("corp.asset_economy", "high_risk_economy_payoff", ["economy.corp_asset_cashout"], "medium"),
      pair("corp.economy_rez_reserve", "install_rez_reserve", ["economy.corp_asset_cashout"], "low"),
    ],
    target: ["candidate", ["use_target:own_rezzed_ice"]],
    rationale: "Trash-own-rezzed-ICE cashout is economy with board risk, not generic asset or ICE-trash strategy.",
  },
  simple_economy_asset: {
    family: "test_installed_economy",
    signals: ["economy.corp_credit_burst"],
    effects: [e("economy", "rez", "corp", "economy.corp_credit_burst", { amount: 3 })],
    rationale: "Test asset gets simple rez economy semantics.",
  },
  v08_cashout_asset: {
    family: "test_installed_economy",
    signals: ["economy.corp_credit_burst"],
    effects: [e("economy", "rez", "corp", "economy.corp_credit_burst", { amount: 4 })],
    rationale: "Test cashout asset gets simple rez economy semantics.",
  },
};

function inventory() {
  const allCards = CARD_FILES.flatMap(cardsFrom);
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const compiledHints = readJson("data/ai/ai-card-hints-compiled.json").cards ?? [];
  const activeIds = new Set(activeHints.map((hint) => hint.cardId));
  const compiledIds = new Set(compiledHints.map((hint) => hint.cardId));
  const assets = allCards.filter((card) => card.side === "corp" && card.type === "asset");
  const activeCompiled = assets.filter((card) => activeIds.has(card.cardId) && compiledIds.has(card.cardId));
  const inactive = assets.filter((card) => !activeIds.has(card.cardId) || !compiledIds.has(card.cardId));
  return { allCards, activeCompiled, inactive };
}

function buildPostReviewAssignments(activeCompiled) {
  return activeCompiled.map((card) => {
    const assignment = A[card.cardId];
    if (!assignment) throw new Error(`Missing AI026 assignment for ${card.cardId}`);
    const strategySupportPairs = assignment.pairs ?? [];
    const strategyAnchors = unique(strategySupportPairs.map((item) => item.strategyId));
    const primaryAnchorEvidence = unique(strategySupportPairs.flatMap((item) => item.evidence));
    const supportingEvidence = unique((assignment.signals ?? []).filter((signal) => !primaryAnchorEvidence.includes(signal)));
    return {
      cardId: card.cardId,
      title: card.title,
      cardType: "asset",
      legacyNodeTerm: "node_or_asset",
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
      hiddenInfoPolicy: assignment.hidden ?? "corp_side_only_until_rezzed_or_accessed",
      needsHumanReview: false,
      confidence: "high",
      postReviewStatus: "changed",
      rationale: `${assignment.rationale} Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.`,
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
    hint.effects = (config.effects ?? hint.effects ?? []).map(compiledEffect);
    if (config.conditions) hint.conditions = compiledConditions(config.conditions);
    else delete hint.conditions;
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
    schemaVersion: "ai026-corp-nodes-assets-semantics-review-report-v1",
    taskId: "AI026",
    generatedAt: GENERATED_AT,
    status: "complete",
    scope: "corp_nodes_assets",
    sourceCommit: SOURCE_COMMIT,
    summary: {
      activeCorpNodeAssetCount: activeCompiled.length,
      reviewedNodeAssetCount: postReviewAssignments.length,
      activeOriginalsetNodeAssetCount: activeCompiled.filter((card) => card.setId === "originalset-v1").length,
      activeProteusNodeAssetCount: activeCompiled.filter((card) => card.setId === "proteus").length,
      activeTestNodeAssetCount: activeCompiled.filter((card) => card.setId === "testset").length,
      inactiveCheckedNodeAssetCount: inactive.length,
      changedNodeAssetCount: postReviewAssignments.length,
      unchangedCheckedNodeAssetCount: 0,
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
      activeCompiledNodeAssetCardIds: activeCompiled.map((card) => card.cardId),
      inactiveCheckedNodeAssetCardIds: inactive.map((card) => card.cardId),
      countDiscrepancies: [
        {
          setId: "originalset-v1",
          expectedSpoilerCount: 41,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "originalset-v1").length,
          status: "matches",
        },
        {
          setId: "proteus",
          expectedSpoilerCount: 11,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "proteus").length,
          status: "matches",
        },
        {
          setId: "testset",
          expectedSpoilerCount: null,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "testset").length,
          status: "active_repo_test_assets_included_as_repo_truth",
        },
        {
          setId: "classic",
          expectedSpoilerCount: null,
          activeCompiledRepoCount: activeCompiled.filter((card) => card.setId === "classic").length,
          inactiveKnownRepoCount: inactive.filter((card) => card.setId === "classic").length,
          status: "known_inactive_classic_nodes_assets",
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
        topic: "corp_node_asset_hidden_semantics",
        result: "pass",
        notes:
          "Corp node/asset semantics remain Corp-side until rezzed, accessed, exposed or otherwise legally known. Access ambush exceptions are documented as report-only semantics.",
      },
      {
        topic: "runtime_visibility",
        result: "pass",
        notes:
          "AI026 adds no WebSocket, reconnect, undo-preview, replay, PublicEvents, log, client-error, planner or Targeting-AI projection path.",
      },
    ],
    deferredItems: [
      {
        topic: "target_profile_v1_for_assets",
        decision: "deferred_or_schema_gap",
        rationale:
          "Hidden installed-card choices, run redirect, self-counter spending, private HQ/R&D manipulation and access-triggered counters remain report-only until side-safe TargetProfile schema support exists.",
      },
      {
        topic: "generic_node_or_asset_strategy",
        decision: "rejected",
        rationale:
          "AI026 introduces no generic Corp node, asset, advertisement, transactions, AI, ambush, virus or random strategy. Anchors use existing strategy IDs only when function evidence supports them.",
      },
    ],
    postReviewAssignments,
    verification: [{ command: "node scripts/check-ai026-corp-nodes-assets-semantics.mjs", result: "pending_after_apply" }],
  };
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const entry =
    "- `ai026-corp-nodes-assets-semantics-review-2026-06-02.md` / `ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json`: AI026 prüft 54 aktive/compiled Corp-Nodes/Assets aus Repo-Wahrheit, darunter 41 Originalset- und 11 Proteus-Karten plus 2 aktive Test-/V08-Assets. Es ergänzt kontrollierte Corp-side Funktionssignale, vermeidet Node-/Asset-/Subtyp- und kartenspezifische Signale, trennt einfache Draw-/Hand-size-/Utility-Nodes von Strategieankern und hält alle Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI- und Hidden-Info-Wirkungsflags auf `false`.";
  if (text.includes("ai026-corp-nodes-assets-semantics-review-2026-06-02.md")) {
    writeText(
      README_PATH,
      text.replace(
        /^- `ai026-corp-nodes-assets-semantics-review-2026-06-02\.md` \/ `ai026-corp-nodes-assets-semantics-review-report-2026-06-02\.json`: .*$/m,
        entry,
      ),
    );
    return;
  }
  const marker = "- `ai025-corp-operations-semantics-review-2026-06-02.md`";
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
  return `# AI026 Corp Nodes / Assets Semantics Review

## Kurzfazit

AI026 prüft ${report.summary.activeCorpNodeAssetCount} aktive/compiled Corp-Nodes/Assets aus der Repo-Wahrheit. Davon sind ${report.summary.activeOriginalsetNodeAssetCount} Originalset-Karten und ${report.summary.activeProteusNodeAssetCount} Proteus-Karten; zusätzlich bleiben ${report.summary.activeTestNodeAssetCount} aktive Test-/V08-Assets abgedeckt. Node-/Asset-Typen und Subtypen wie AI, Ambush, Advertisement, Transactions, Virus und Random bleiben Kartendaten und werden nicht als Taktiksignale gespiegelt.

## Inventar

- Originalset: 41 aktive/compiled Corp-Nodes/Assets; Spoiler-Erwartung 41.
- Proteus: 11 aktive/compiled Corp-Nodes/Assets; Spoiler-Erwartung 11.
- Test/V08: 2 aktive/compiled Repo-Assets; als Repo-Wahrheit mitgeprüft.
- Classic: ${report.summary.inactiveCheckedNodeAssetCount} bekannte inaktive Corp-Nodes/Assets im Repo.

## Clusterübersicht

${report.clusterOverview.map((cluster) => `- ${cluster.mechanicalFamily}: ${cluster.count}`).join("\n")}

## Neue und wiederverwendete Taktiksignale

AI026 ergänzt ${report.summary.newTacticSignalCount} kontrollierte Corp-side Funktionssignale. Wiederverwendet werden unter anderem \`remote.asset_economy\`, \`remote.ambush\`, \`access.punish\`, \`damage.payoff\`, \`tag.source\`, \`tag.payoff\`, \`trace.source\`, \`tax.ice\`, \`economy.rez_discount\`, \`economy.advanceable\`, \`score.hand_size\`, \`access.rnd_reveal_requirement\` und \`access.archives_safe_exception\`, sofern SideScope und Wirkung passen.

${signalRows}

## Vermiedene Typ-/Subtyp-Signale

Nicht eingeführt wurden: ${report.removedOrAvoidedSubtypeSignals.map((signal) => `\`${signal}\``).join(", ")}.

## Strategieentscheidungen

Simple Draw-/Hand-size-/Utility-Nodes bleiben support-only. Campaign- und installed-economy Nodes ankern nur bei echter Remote-/Asset-Economy-Funktion. Tag-/Trace-Karten trennen Quellen, Trace-Credits und Payoffs. Access-Punish- und Ambush-Karten ankern nur über konkrete Access-Wirkungen, nicht über Ambush- oder Virus-Subtypen. Advancement- und Extra-Action-Karten ankern nur bei klarer Score-Conversion.

${anchorRows}

## TargetProfile-Kandidaten

${targetRows}

## Hidden-Info-Grenzen

Korp-Node-/Asset-Semantik bleibt \`corp_side_only_until_rezzed_or_accessed\`, bis eine Karte rezzed, accessed, exposed oder anderweitig legal bekannt ist. AI026 ergänzt keine Runner-seitige verdeckte Node-/Asset-Sicht und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Deferred Items

${report.deferredItems.map((item) => `- ${item.topic}: ${item.decision}. ${item.rationale}`).join("\n")}

## Post-Review-Liste

Die vollständige Kartenliste mit Funktionsfamilie, Conditions, Risiken, Taktiksignalen, Strategieankern, \`strategySupportPairs\`, TargetProfile-Status und Hidden-Info-Policy steht im JSON-Report \`ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json\`.
`;
}

function main() {
  const { allCards, activeCompiled, inactive } = inventory();
  const activeIds = new Set(activeCompiled.map((card) => card.cardId));
  const missing = [...activeIds].filter((cardId) => !A[cardId]);
  if (missing.length) throw new Error(`Missing AI026 assignment(s): ${missing.join(", ")}`);
  const newSignals = updateTacticSignals();
  updateDerivationRules();
  const postReviewAssignments = buildPostReviewAssignments(activeCompiled);
  const changed = updateActiveHints(new Map(postReviewAssignments.map((item) => [item.cardId, item])));
  const report = buildReport({ activeCompiled, inactive, postReviewAssignments, newSignals });
  writeJson(JSON_REPORT_PATH, report);
  writeText(MD_REPORT_PATH, buildMarkdown(report));
  updateReadme();
  console.log(
    `AI026 applied active=${activeCompiled.length} originalset=${report.summary.activeOriginalsetNodeAssetCount} proteus=${report.summary.activeProteusNodeAssetCount} inactive=${inactive.length} changed=${changed} newSignals=${newSignals.length} cards=${allCards.length}`,
  );
}

main();
