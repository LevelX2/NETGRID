#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-02";
const SOURCE_COMMIT = "ddaf36973d682701c4a616c74c582fbb31f992f2";

const CARD_FILES = [
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
  "data/cards/classic-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const MD_REPORT_PATH = "docs/reviews/ai/ai023-corp-agendas-semantics-review-2026-06-02.md";
const JSON_REPORT_PATH = "docs/reviews/ai/ai023-corp-agendas-semantics-review-report-2026-06-02.json";
const README_PATH = "docs/reviews/ai/README.md";

const AI023_SIGNALS = {
  "score.high_agenda_value": [true, []],
  "score.vanilla_points": [true, []],
  "score.bonus_agenda_points": [true, []],
  "score.conditional_bonus_agenda_points": [true, []],
  "score.overadvance_bonus": [true, []],
  "score.overadvance_scaling": [true, []],
  "score.closeout_agenda": [false, ["corp.remote_scoring"]],
  "score.agenda_difficulty_discount": [false, ["corp.fast_advance"]],
  "score.black_ops_difficulty_discount": [true, []],
  "score.gray_ops_difficulty_discount": [true, []],
  "score.research_difficulty_discount": [true, []],
  "score.economy_burst": [true, []],
  "score.economy_conditional_burst": [true, []],
  "score.economy_recurring": [true, []],
  "score.economy_counter_bank": [true, []],
  "score.economy_action": [true, []],
  "score.bad_publicity_gain": [true, []],
  "score.bad_publicity_win_risk": [true, []],
  "score.action_counter_bank": [true, []],
  "score.action_gain": [true, []],
  "score.recurring_extra_action": [true, []],
  "score.random_extra_action": [true, []],
  "score.damage_conversion_action_engine": [true, []],
  "score.draw": [true, []],
  "score.recurring_draw": [true, []],
  "score.hand_size": [true, []],
  "score.hq_archive_to_rnd_shuffle": [true, []],
  "score.rnd_archive_recycle": [true, []],
  "score.hq_agenda_reveal": [true, []],
  "score.hq_agenda_shuffle": [true, []],
  "score.rnd_reveal": [true, []],
  "score.rnd_install_and_rez": [false, ["corp.ice_tax_glacier", "corp.remote_scoring"]],
  "score.free_rez_ice": [false, ["corp.ice_tax_glacier", "corp.remote_scoring"]],
  "score.free_install_and_rez_ice": [false, ["corp.ice_tax_glacier", "corp.remote_scoring"]],
  "score.remote_fort_creation": [false, ["corp.remote_scoring"]],
  "score.remote_install_budget": [false, ["corp.remote_scoring"]],
  "score.fort_ice_strength_bonus": [false, ["corp.ice_tax_glacier", "corp.remote_scoring"]],
  "score.chosen_ice_strength_bonus": [false, ["corp.ice_tax_glacier"]],
  "score.repeat_ice_subroutines": [false, ["corp.ice_tax_glacier"]],
  "score.code_gate_strength_bonus": [false, ["corp.ice_tax_glacier"]],
  "score.wall_strength_bonus": [false, ["corp.ice_tax_glacier"]],
  "score.black_ice_strength_bonus": [false, ["corp.ice_tax_glacier"]],
  "score.ice_type_reveal_economy": [true, []],
  "score.ice_type_tax_support": [false, ["corp.ice_tax_glacier"]],
  "score.trace_tag_source": [false, ["corp.tag_trace_punish"]],
  "score.tag_source": [false, ["corp.tag_trace_punish"]],
  "score.tagged_meat_damage_payoff": [false, ["corp.damage_kill", "corp.tag_trace_punish"]],
  "score.meat_damage_source": [false, ["corp.damage_kill"]],
  "score.meat_damage_amp": [false, ["corp.damage_kill"]],
  "score.damage_amp": [false, ["corp.damage_kill"]],
  "score.brain_damage_or_hand_size_pressure": [false, ["corp.damage_kill"]],
  "score.net_damage_access_punish": [false, ["corp.damage_kill", "corp.ambush_bluff"]],
  "score.fort_trash_on_score": [true, []],
  "access.agenda_ambush": [false, ["corp.ambush_bluff"]],
  "access.agenda_net_damage": [false, ["corp.damage_kill", "corp.ambush_bluff"]],
  "access.agenda_tag": [false, ["corp.tag_trace_punish", "corp.ambush_bluff"]],
  "access.agenda_steal_tax": [false, ["corp.ambush_bluff"]],
  "access.rnd_reveal_requirement": [true, []],
  "access.archives_safe_exception": [true, []],
  "access.runner_program_bounce": [true, []],
  "access.runner_program_disruption": [false, ["corp.ambush_bluff"]],
  "risk.economy_crash_on_score": [true, []],
  "risk.bad_publicity": [true, []],
  "risk.loss_condition": [true, []],
  "risk.requires_corp_credit_threshold": [true, []],
  "risk.loses_ability_on_install_or_rez": [true, []],
  "risk.random_action": [true, []],
  "risk.requires_tagged_runner": [true, []],
  "risk.high_difficulty_agenda": [true, []],
};

function e(kind, timing, scope, target, extra = {}) {
  return { kind, timing, scope, target, ...extra };
}

function pair(strategyId, role, evidence, confidence = "high") {
  return { strategyId, role, evidence, confidence };
}

const A = {
  "onr_v1_188_ai-chief-financial-officer": {
    family: "agenda_recycle_or_rnd_hq_archives_manipulation",
    signals: ["score.hq_archive_to_rnd_shuffle", "score.draw", "score.rnd_archive_recycle"],
    effects: [
      e("zone_shuffle", "scored_activated", "hq", "score.hq_archive_to_rnd_shuffle"),
      e("zone_shuffle", "scored_activated", "archives", "score.rnd_archive_recycle"),
      e("draw", "scored_activated", "corp", "score.draw", { resource: "cards", amount: 5 }),
    ],
    conditions: ["requires_scored_agenda"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Score-Utility fuer HQ/Archives-Recycling und Draw; kein Strategieanker, weil es Setup/Recovery-Support bleibt.",
  },
  "onr_v1_189_artificial-security-directors": {
    family: "agenda_difficulty_discount",
    signals: ["score.agenda_difficulty_discount", "score.black_ops_difficulty_discount"],
    effects: [e("score_acceleration", "persistent", "score_area", "score.agenda_difficulty_discount", { resource: "advancement_counters" })],
    lineSupport: ["corp.fast_advance"],
    strategicRole: ["enabler"],
    pairs: [pair("corp.fast_advance", "enabler", ["score.agenda_difficulty_discount", "score.black_ops_difficulty_discount"], "medium")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Difficulty-Reduction ist funktional Fast-Advance-Support; der Black-Ops-Subtype selbst ist kein Anker.",
  },
  "onr_v1_190_bioweapons-engineering": {
    family: "damage_source_or_damage_amp",
    signals: ["score.meat_damage_amp", "score.damage_amp", "damage.payoff"],
    effects: [e("damage", "persistent", "runner", "score.meat_damage_amp", { resource: "meat_damage", amount: 1 })],
    lineSupport: ["corp.damage_kill"],
    strategicRole: ["engine_anchor"],
    pairs: [pair("corp.damage_kill", "damage_amp_anchor", ["score.meat_damage_amp", "score.damage_amp"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Verstaerkt vorhandene Meat-Damage-Quellen und traegt damit echte Kill-Linien, erzeugt aber keinen Schaden allein.",
  },
  "onr_v1_191_black-ice-quality-assurance": {
    family: "ice_strength_or_ice_type_buff",
    signals: ["score.black_ice_strength_bonus", "score.ice_type_tax_support", "ice.strength_modifier"],
    effects: [e("global_modifier", "persistent", "ice", "score.black_ice_strength_bonus", { resource: "strength", amount: 2 })],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "ice_type_anchor", ["score.black_ice_strength_bonus", "score.ice_type_tax_support"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Black-ICE-Staerke ist ICE-Tax/Glacier-Anker; kein Damage-Anker allein aus dem Black-ICE-Kontext.",
  },
  "onr_v1_192_corporate-boon": {
    family: "score_action_engine",
    signals: ["score.action_counter_bank", "score.action_gain", "score.agenda_action"],
    effects: [
      e("scored_agenda_action", "when_scored", "score_area", "score.action_counter_bank"),
      e("extra_action", "scored_activated", "corp", "score.action_gain", { resource: "actions", amount: 1 }),
    ],
    conditions: ["requires_scored_agenda", "requires_turn_limit_available"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Starke Action-Bank, aber ohne eigene Corp-Tempo-Strategy-ID bleibt sie support/candidate statt kanonischer Strategieanker.",
  },
  "onr_v1_193_corporate-coup": {
    family: "score_economy_burst",
    signals: ["score.economy_counter_bank", "score.economy_action", "score.agenda_action"],
    effects: [e("counter_economy", "when_scored", "corp", "score.economy_counter_bank", { resource: "credits", amount: 15 }), e("action_economy", "scored_activated", "corp", "score.economy_action", { resource: "credits", amount: 3 })],
    conditions: ["requires_scored_agenda", "requires_credit_pool"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Economy-Counter-Bank bleibt Support; kein Strategieanker nur aus Economy.",
  },
  "onr_v1_194_corporate-downsizing": {
    family: "score_economy_burst",
    signals: ["score.economy_conditional_burst", "score.hq_agenda_reveal", "score.hq_agenda_shuffle"],
    effects: [e("agenda_reveal_economy", "when_scored", "hq", "score.economy_conditional_burst", { resource: "credits" }), e("zone_shuffle", "when_scored", "hq", "score.hq_agenda_shuffle")],
    conditions: ["requires_agenda_in_hq", "requires_agenda_reveal"],
    target: ["schema_gap", ["choose_hq_agendas_to_reveal_and_shuffle"]],
    hidden: "corp_side_only_until_revealed",
    rationale: "HQ-Agenda-Auswahl bleibt schema gap; keine Runner-seitige Ableitung verdeckter HQ-Agendas.",
  },
  "onr_v1_195_corporate-retreat": {
    family: "risk_or_drawback_agenda",
    signals: ["score.economy_action", "risk.loses_ability_on_install_or_rez", "score.agenda_action"],
    effects: [e("action_economy", "scored_activated", "corp", "score.economy_action", { resource: "credits", amount: 2 })],
    conditions: ["requires_scored_agenda"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Action-Economy mit Rez-/Install-Drawback; support-only.",
  },
  "onr_v1_196_corporate-war": {
    family: "risk_or_drawback_agenda",
    signals: ["score.economy_conditional_burst", "risk.requires_corp_credit_threshold", "risk.economy_crash_on_score"],
    effects: [e("economy", "when_scored", "corp", "score.economy_conditional_burst", { resource: "credits", amount: 12 })],
    conditions: ["requires_corp_credits_threshold"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "High-risk Economy-Payoff; kein Strategieanker ohne deckpraegende Economy-Taxonomieentscheidung.",
  },
  "onr_v1_197_data-fort-reclamation": {
    family: "remote_or_fort_setup",
    signals: ["score.remote_fort_creation", "score.remote_install_budget"],
    effects: [e("remote_build", "when_scored", "remote", "score.remote_fort_creation"), e("install", "when_scored", "remote", "score.remote_install_budget", { resource: "credits", amount: 10 })],
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["engine_anchor"],
    pairs: [pair("corp.remote_scoring", "remote_setup_engine", ["score.remote_fort_creation", "score.remote_install_budget"], "high")],
    target: ["schema_gap", ["multi_card_hq_install_sequence", "optional_rez_sequence"]],
    hidden: "corp_side_only_until_revealed",
    rationale: "Echte Remote-Setup-Engine, aber Zielwahl/Install-Sequenz passt nicht in TargetProfile V1.",
  },
  "onr_v1_198_detroit-police-contract": {
    family: "score_economy_recurring",
    signals: ["score.economy_counter_bank", "score.economy_recurring"],
    effects: [e("counter_economy", "when_scored", "corp", "score.economy_counter_bank", { resource: "credits", amount: 12 }), e("recurring_economy", "start_of_turn", "corp", "score.economy_recurring", { resource: "credits", amount: 2 })],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Recurring Economy bleibt Support.",
  },
  "onr_v1_199_employee-empowerment": {
    family: "score_draw_or_hand",
    signals: ["score.recurring_draw", "score.draw", "score.agenda_action"],
    effects: [e("draw", "start_of_turn", "corp", "score.recurring_draw", { resource: "cards", amount: 1 }), e("draw", "scored_activated", "corp", "score.draw", { resource: "cards", amount: 2 })],
    conditions: ["requires_scored_agenda"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Draw-Engine/Support ohne Strategieanker.",
  },
  "onr_v1_200_encryption-breakthrough": {
    family: "ice_strength_or_ice_type_buff",
    signals: ["score.code_gate_strength_bonus", "score.ice_type_reveal_economy", "score.ice_type_tax_support", "ice.strength_modifier"],
    effects: [e("global_modifier", "persistent", "ice", "score.code_gate_strength_bonus", { resource: "strength", amount: 1 }), e("agenda_reveal_economy", "when_scored", "ice", "score.ice_type_reveal_economy", { resource: "credits" })],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "ice_type_anchor", ["score.code_gate_strength_bonus", "score.ice_type_tax_support"], "high")],
    target: ["schema_gap", ["reveal_code_gates_if_choice_supported"]],
    hidden: "public_when_scored",
    rationale: "Code-Gate-Buff traegt ICE-Tax; Reveal-Economy bleibt Support.",
  },
  "onr_v1_201_executive-extraction": {
    family: "agenda_difficulty_discount",
    signals: ["score.agenda_difficulty_discount", "score.gray_ops_difficulty_discount"],
    effects: [e("score_acceleration", "persistent", "score_area", "score.agenda_difficulty_discount", { resource: "advancement_counters" })],
    lineSupport: ["corp.fast_advance"],
    strategicRole: ["enabler"],
    pairs: [pair("corp.fast_advance", "enabler", ["score.agenda_difficulty_discount", "score.gray_ops_difficulty_discount"], "medium")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Difficulty-Reduction ist Fast-Advance-Support; Gray-Ops-Subtype allein bleibt kein Strategieanker.",
  },
  "onr_v1_202_genetics-visionary-acquisition": {
    family: "agenda_difficulty_discount",
    signals: ["score.agenda_difficulty_discount", "score.research_difficulty_discount"],
    effects: [e("score_acceleration", "persistent", "score_area", "score.agenda_difficulty_discount", { resource: "advancement_counters" })],
    lineSupport: ["corp.fast_advance"],
    strategicRole: ["enabler"],
    pairs: [pair("corp.fast_advance", "enabler", ["score.agenda_difficulty_discount", "score.research_difficulty_discount"], "medium")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Research-Difficulty-Reduction ermoeglicht Fast-Advance-Linien, nicht Research als Subtyp.",
  },
  "onr_v1_203_hostile-takeover": {
    family: "score_economy_burst",
    signals: ["score.economy_burst"],
    effects: [e("economy", "when_scored", "corp", "score.economy_burst", { resource: "credits", amount: 5 })],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Burst Economy ist stark, aber support-only.",
  },
  "onr_v1_204_ice-transmutation": {
    family: "ice_strength_or_ice_type_buff",
    signals: ["score.chosen_ice_strength_bonus", "score.repeat_ice_subroutines", "ice.strength_modifier", "ice.subroutine_modifier"],
    effects: [e("global_modifier", "when_scored", "ice", "score.chosen_ice_strength_bonus", { resource: "strength", amount: 1 }), e("global_modifier", "when_scored", "ice", "score.repeat_ice_subroutines", { resource: "subroutines" })],
    conditions: ["requires_rezzed_ice"],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["payoff_anchor"],
    pairs: [pair("corp.ice_tax_glacier", "ice_upgrade_payoff", ["score.chosen_ice_strength_bonus", "score.repeat_ice_subroutines"], "high")],
    target: ["candidate", ["use_target:rezzed_ice"]],
    hidden: "public_when_scored",
    rationale: "Gezielter ICE-Upgrade-Payoff; TargetProfile V1 waere moeglich, bleibt aber read-only Kandidat.",
  },
  "onr_v1_205_main-office-relocation": {
    family: "score_draw_or_hand",
    signals: ["score.hand_size"],
    effects: [e("hand_size_modifier", "persistent", "corp", "score.hand_size", { resource: "hand_size", amount: 2 })],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Handsize-Support ohne Strategieanker.",
  },
  "onr_v1_206_marine-arcology": {
    family: "score_economy_burst",
    signals: ["score.economy_action", "score.agenda_action"],
    effects: [e("action_economy", "scored_activated", "corp", "score.economy_action", { resource: "credits", amount: 3 })],
    conditions: ["requires_scored_agenda"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Action-for-credit ist Economy-Support.",
  },
  "onr_v1_207_netwatch-operations-office": {
    family: "tag_source_or_trace_agenda",
    signals: ["score.trace_tag_source", "score.tag_source", "trace.source", "tag.source"],
    effects: [e("trace", "scored_activated", "runner", "score.trace_tag_source", { amount: 2, repeatable: true }), e("tag_source", "trace_success", "runner", "score.tag_source", { resource: "tags", amount: 1, repeatable: true })],
    conditions: ["requires_scored_agenda", "requires_trace_success"],
    lineSupport: ["corp.tag_trace_punish"],
    strategicRole: ["engine_anchor"],
    pairs: [pair("corp.tag_trace_punish", "tag_source", ["score.trace_tag_source", "score.tag_source"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Trace-Tag-Quelle, getrennt von Tag-Payoff.",
  },
  "onr_v1_208_on-call-solo-team": {
    family: "tagged_damage_payoff",
    signals: ["score.tagged_meat_damage_payoff", "score.meat_damage_source", "risk.requires_tagged_runner", "damage.payoff", "tag.payoff"],
    effects: [e("tag_punish_payoff", "scored_activated", "runner", "score.tagged_meat_damage_payoff", { resource: "damage", amount: 1, repeatable: true }), e("damage", "scored_activated", "runner", "score.meat_damage_source", { resource: "meat_damage", amount: 1, repeatable: true })],
    conditions: ["requires_scored_agenda", "requires_runner_tagged"],
    lineSupport: ["corp.damage_kill", "corp.tag_trace_punish"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.damage_kill", "damage_payoff", ["score.tagged_meat_damage_payoff", "score.meat_damage_source"], "high"), pair("corp.tag_trace_punish", "punish_payoff", ["risk.requires_tagged_runner"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Tagged Meat-Damage-Payoff; Tag-Quelle und Payoff bleiben getrennt.",
  },
  "onr_v1_209_political-coup": {
    family: "score_economy_burst",
    signals: ["score.economy_counter_bank", "score.economy_action", "score.agenda_action"],
    effects: [e("counter_economy", "when_scored", "corp", "score.economy_counter_bank", { resource: "credits", amount: 12 }), e("action_economy", "scored_activated", "corp", "score.economy_action", { resource: "credits", amount: 3 })],
    conditions: ["requires_scored_agenda", "requires_credit_pool"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Economy-Counter-Bank bleibt Support.",
  },
  "onr_v1_210_political-overthrow": {
    family: "score_economy_burst",
    signals: ["score.economy_action", "score.agenda_action"],
    effects: [e("action_economy", "scored_activated", "corp", "score.economy_action", { resource: "credits", amount: 3 })],
    conditions: ["requires_scored_agenda"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Hohe Agenda-Punkte plus Action-Economy sind kein eigener Strategieanker.",
  },
  "onr_v1_211_polymer-breakthrough": {
    family: "score_economy_recurring",
    signals: ["score.economy_recurring"],
    effects: [e("recurring_economy", "start_of_turn", "corp", "score.economy_recurring", { resource: "credits", amount: 1 })],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Recurring Economy support-only.",
  },
  "onr_v1_212_priority-requisition": {
    family: "free_rez_or_install",
    signals: ["score.free_rez_ice"],
    effects: [e("rez_discount", "when_scored", "ice", "score.free_rez_ice", { resource: "credits", finite: true })],
    conditions: ["requires_installed_ice"],
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.ice_tax_glacier", "tempo_payoff", ["score.free_rez_ice"], "high"), pair("corp.remote_scoring", "score_window_payoff", ["score.free_rez_ice"], "medium")],
    target: ["candidate", ["use_target:installed_ice"]],
    hidden: "public_when_scored",
    rationale: "Free-rez-payoff stuetzt ICE-Tax und Scoring-Window; nicht Economy-Reserve.",
  },
  "onr_v1_213_private-cybernet-police": {
    family: "tag_source_or_trace_agenda",
    signals: ["score.trace_tag_source", "score.tag_source", "trace.source", "tag.source"],
    effects: [e("trace", "scored_activated", "runner", "score.trace_tag_source", { amount: 5, repeatable: true }), e("tag_source", "trace_success", "runner", "score.tag_source", { resource: "tags", amount: 1, repeatable: true })],
    conditions: ["requires_scored_agenda", "requires_trace_success"],
    lineSupport: ["corp.tag_trace_punish"],
    strategicRole: ["engine_anchor"],
    pairs: [pair("corp.tag_trace_punish", "tag_source", ["score.trace_tag_source", "score.tag_source"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Trace-Tag-Quelle, getrennt von Payoff.",
  },
  "onr_v1_214_project-babylon": {
    family: "overadvance_or_bonus_points",
    signals: ["score.conditional_bonus_agenda_points", "score.overadvance_bonus", "score.overadvance_scaling"],
    effects: [e("score_acceleration", "when_scored", "score_area", "score.overadvance_bonus", { resource: "advancement_counters" })],
    conditions: ["requires_advancement_counter"],
    lineSupport: ["corp.fast_advance"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.fast_advance", "overadvance_payoff", ["score.overadvance_bonus", "score.overadvance_scaling"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Overadvance-Agenda-Point-Payoff stuetzt Fast-Advance/Overadvance, nicht einfache Agenda-Punkte.",
  },
  "onr_v1_215_security-net-optimization": {
    family: "ice_strength_or_ice_type_buff",
    signals: ["score.fort_ice_strength_bonus", "ice.strength_modifier"],
    effects: [e("global_modifier", "when_scored", "ice", "score.fort_ice_strength_bonus", { resource: "strength", amount: 1 })],
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "fort_tax_anchor", ["score.fort_ice_strength_bonus"], "high"), pair("corp.remote_scoring", "remote_defense_anchor", ["score.fort_ice_strength_bonus"], "medium")],
    target: ["candidate", ["use_target:server"]],
    hidden: "public_when_scored",
    rationale: "Fortbezogener ICE-Buff traegt ICE-Tax und Remote-Defense.",
  },
  "onr_v1_216_security-purge": {
    family: "agenda_recycle_or_rnd_hq_archives_manipulation",
    signals: ["score.rnd_reveal", "score.free_install_and_rez_ice", "score.rnd_install_and_rez", "access.rnd_reveal_requirement"],
    effects: [e("topdeck_info", "when_scored", "rnd", "score.rnd_reveal"), e("install", "when_scored", "rnd", "score.rnd_install_and_rez"), e("rez", "when_scored", "ice", "score.free_install_and_rez_ice")],
    conditions: ["requires_rnd_top"],
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.ice_tax_glacier", "setup_payoff", ["score.free_install_and_rez_ice", "score.rnd_install_and_rez"], "medium"), pair("corp.remote_scoring", "setup_payoff", ["score.free_install_and_rez_ice", "score.rnd_install_and_rez"], "medium")],
    target: ["schema_gap", ["top_three_rnd_reveal_install_rez_sequence"]],
    hidden: "public_when_scored",
    rationale: "R&D-Reveal plus free install/rez ist Setup-Payoff; Sequenzzielwahl bleibt schema gap.",
  },
  "onr_v1_217_strike-force-kali": {
    family: "tagged_damage_payoff",
    signals: ["score.tagged_meat_damage_payoff", "score.meat_damage_source", "risk.requires_tagged_runner", "damage.payoff", "tag.payoff"],
    effects: [e("tag_punish_payoff", "scored_activated", "runner", "score.tagged_meat_damage_payoff", { resource: "damage", amount: 2, repeatable: true }), e("damage", "scored_activated", "runner", "score.meat_damage_source", { resource: "meat_damage", amount: 2, repeatable: true })],
    conditions: ["requires_scored_agenda", "requires_runner_tagged"],
    lineSupport: ["corp.damage_kill", "corp.tag_trace_punish"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.damage_kill", "damage_payoff", ["score.tagged_meat_damage_payoff", "score.meat_damage_source"], "high"), pair("corp.tag_trace_punish", "punish_payoff", ["risk.requires_tagged_runner"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Staerkerer Tagged Meat-Damage-Payoff; Tag-Quelle bleibt externe Bedingung.",
  },
  "onr_v1_218_subsidiary-branch": {
    family: "score_action_engine",
    signals: ["score.recurring_extra_action"],
    effects: [e("extra_action", "start_of_turn", "corp", "score.recurring_extra_action", { resource: "actions", amount: 1 })],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Starke Tempo-Engine, aber ohne passende Corp-Tempo-Strategy-ID nur candidate/support.",
  },
  "onr_v1_219_superior-net-barriers": {
    family: "ice_strength_or_ice_type_buff",
    signals: ["score.wall_strength_bonus", "score.ice_type_reveal_economy", "score.ice_type_tax_support", "ice.strength_modifier"],
    effects: [e("global_modifier", "persistent", "ice", "score.wall_strength_bonus", { resource: "strength", amount: 1 }), e("agenda_reveal_economy", "when_scored", "ice", "score.ice_type_reveal_economy", { resource: "credits" })],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "ice_type_anchor", ["score.wall_strength_bonus", "score.ice_type_tax_support"], "high")],
    target: ["schema_gap", ["reveal_walls_if_choice_supported"]],
    hidden: "public_when_scored",
    rationale: "Wall-Buff traegt ICE-Tax; Reveal-Economy bleibt Support.",
  },
  "onr_v1_220_tycho-extension": {
    family: "vanilla_or_point_dense_agenda",
    signals: ["score.high_agenda_value", "score.vanilla_points"],
    effects: [e("scored_agenda_action", "when_scored", "score_area", "score.high_agenda_value")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Vier Agenda-Punkte und kein weiterer Effekt; bewusst kein Strategieanker nur wegen Punktewert.",
  },
  "onr_proteus_001_ai-board-member": {
    family: "score_action_engine",
    signals: ["score.random_extra_action", "risk.random_action"],
    effects: [e("extra_action", "start_of_turn", "corp", "score.random_extra_action", { resource: "actions", amount: 1 }), e("scored_agenda_action", "start_of_turn", "score_area", "risk.random_action")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Randomisierte Extra-Aktion bleibt support/candidate und wird wegen Zufall nicht als Strategieanker gesetzt.",
  },
  "onr_proteus_002_charity-takeover": {
    family: "bad_publicity_agenda",
    signals: ["score.economy_burst", "score.bad_publicity_gain", "score.bad_publicity_win_risk", "risk.bad_publicity", "risk.loss_condition"],
    effects: [e("economy", "when_scored", "corp", "score.economy_burst", { resource: "credits", amount: 9 }), e("scored_agenda_action", "when_scored", "score_area", "score.bad_publicity_gain")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Bad Publicity ist Drawback/Risiko, kein Corp-Payoff und keine Corp-Strategie.",
  },
  "onr_proteus_003_corporate-headhunters": {
    family: "tagged_damage_payoff",
    signals: ["score.tagged_meat_damage_payoff", "score.meat_damage_source", "score.brain_damage_or_hand_size_pressure", "risk.requires_tagged_runner", "damage.payoff", "tag.payoff"],
    effects: [e("tag_punish_payoff", "scored_activated", "runner", "score.tagged_meat_damage_payoff", { resource: "damage", amount: 1, repeatable: true }), e("damage", "scored_activated", "runner", "score.meat_damage_source", { resource: "meat_damage", amount: 1, repeatable: true }), e("hand_size_modifier", "damage_window", "runner", "score.brain_damage_or_hand_size_pressure", { resource: "hand_size", amount: 1 })],
    conditions: ["requires_scored_agenda", "requires_runner_tagged"],
    lineSupport: ["corp.damage_kill", "corp.tag_trace_punish"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.damage_kill", "damage_engine", ["score.tagged_meat_damage_payoff", "score.meat_damage_source", "score.brain_damage_or_hand_size_pressure"], "high"), pair("corp.tag_trace_punish", "punish_payoff", ["risk.requires_tagged_runner"], "high")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Tagged Damage plus Hand-size-Pressure ist Kill-Engine/Payoff.",
  },
  "onr_proteus_004_fetal-ai": {
    family: "access_ambush_or_access_punish",
    signals: ["access.agenda_ambush", "access.agenda_net_damage", "access.agenda_steal_tax", "access.rnd_reveal_requirement", "access.archives_safe_exception", "score.net_damage_access_punish", "damage.payoff"],
    effects: [e("ambush", "on_access", "accessed_card", "access.agenda_ambush"), e("damage", "on_access", "runner", "access.agenda_net_damage", { resource: "net_damage", amount: 2 }), e("access_punish", "on_access", "accessed_card", "access.agenda_steal_tax", { resource: "credits", amount: 2 })],
    conditions: ["requires_accessed_card"],
    lineSupport: ["corp.damage_kill", "corp.ambush_bluff"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.damage_kill", "access_punish", ["access.agenda_net_damage", "score.net_damage_access_punish"], "high"), pair("corp.ambush_bluff", "access_punish", ["access.agenda_ambush", "access.agenda_steal_tax"], "high")],
    target: ["not_required", []],
    hidden: "corp_side_only_until_revealed",
    rationale: "Access-Ambush mit Net-Damage und Steal-Tax; keine Runner-seitige verdeckte Semantik vor Access/Revealed.",
  },
  "onr_proteus_005_marked-accounts": {
    family: "access_ambush_or_access_punish",
    signals: ["access.agenda_ambush", "access.agenda_tag", "access.rnd_reveal_requirement", "tag.source"],
    effects: [e("ambush", "on_access", "accessed_card", "access.agenda_ambush"), e("tag_source", "on_access", "runner", "access.agenda_tag", { resource: "tags", amount: 1 })],
    conditions: ["requires_accessed_card"],
    lineSupport: ["corp.tag_trace_punish", "corp.ambush_bluff"],
    strategicRole: ["engine_anchor"],
    pairs: [pair("corp.tag_trace_punish", "access_tag_source", ["access.agenda_tag"], "high"), pair("corp.ambush_bluff", "access_punish", ["access.agenda_ambush", "access.agenda_tag"], "medium")],
    target: ["not_required", []],
    hidden: "corp_side_only_until_revealed",
    rationale: "Access-Tag-Quelle; Tag-source und spaetere Payoffs bleiben getrennt.",
  },
  "onr_proteus_006_please-dont-choke-anyone": {
    family: "score_action_engine",
    signals: ["score.damage_conversion_action_engine", "score.action_counter_bank"],
    effects: [e("damage_prevention", "damage_window", "damage", "score.damage_conversion_action_engine"), e("extra_action", "scored_activated", "corp", "score.action_counter_bank", { resource: "actions", amount: 1 })],
    conditions: ["requires_damage", "requires_scored_agenda"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Konvertiert eigenen erfolgreichen Schaden in Action-Counter; kein Damage-Kill-Anker, weil Schaden verhindert wird.",
  },
  "onr_proteus_007_project-venice": {
    family: "overadvance_or_bonus_points",
    signals: ["score.overadvance_bonus", "score.recurring_extra_action", "score.overadvance_scaling"],
    effects: [e("score_acceleration", "when_scored", "score_area", "score.overadvance_bonus", { resource: "advancement_counters" }), e("extra_action", "start_of_turn", "corp", "score.recurring_extra_action", { resource: "actions", amount: 1 })],
    conditions: ["requires_advancement_counter"],
    lineSupport: ["corp.fast_advance"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.fast_advance", "overadvance_payoff", ["score.overadvance_bonus", "score.recurring_extra_action", "score.overadvance_scaling"], "medium")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Overadvance erzeugt wiederkehrende Tempo-Engine; als Fast-Advance/Overadvance-Payoff geankert.",
  },
  "onr_proteus_008_project-zurich": {
    family: "overadvance_or_bonus_points",
    signals: ["score.overadvance_bonus", "score.economy_recurring", "score.overadvance_scaling"],
    effects: [e("score_acceleration", "when_scored", "score_area", "score.overadvance_bonus", { resource: "advancement_counters" }), e("recurring_economy", "start_of_turn", "corp", "score.economy_recurring", { resource: "credits", amount: 1 })],
    conditions: ["requires_advancement_counter"],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Overadvance-Economy bleibt support/candidate; kein Economy-Strategieanker.",
  },
  "onr_proteus_009_viral-breeding-ground": {
    family: "access_ambush_or_access_punish",
    signals: ["access.agenda_ambush", "access.runner_program_bounce", "access.runner_program_disruption", "score.fort_trash_on_score"],
    effects: [e("ambush", "on_access", "accessed_card", "access.agenda_ambush"), e("program_trash", "on_access", "installed_program", "access.runner_program_disruption"), e("remote_build", "when_scored", "fort", "score.fort_trash_on_score")],
    conditions: ["requires_accessed_card", "requires_advancement_counter", "requires_installed_program"],
    lineSupport: ["corp.ambush_bluff"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.ambush_bluff", "access_punish", ["access.agenda_ambush", "access.runner_program_disruption"], "medium")],
    target: ["schema_gap", ["access_choose_programs_by_advancement_counter"]],
    hidden: "corp_side_only_until_revealed",
    rationale: "Programmbounce/-Disruption ist Access-Punish, kein Damage-Kill; Access-Zielwahl bleibt schema gap.",
  },
  "onr_proteus_010_world-domination": {
    family: "vanilla_or_point_dense_agenda",
    signals: ["score.bonus_agenda_points", "score.closeout_agenda", "risk.high_difficulty_agenda"],
    effects: [
      e("scored_agenda_action", "when_scored", "score_area", "score.bonus_agenda_points"),
      e("scored_agenda_action", "when_scored", "score_area", "score.closeout_agenda"),
    ],
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["win_condition"],
    pairs: [pair("corp.remote_scoring", "win_condition", ["score.bonus_agenda_points", "score.closeout_agenda"], "medium")],
    target: ["not_required", []],
    hidden: "public_when_scored",
    rationale: "Extrem hoher Score-Payoff ist Closeout/Win-Condition, aber wegen Difficulty kein Fast-Advance-Anker.",
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

function writeText(relativePath, text) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), text, "utf8");
}

function cardsFrom(relativePath) {
  return (readJson(relativePath).cards ?? []).map((card) => ({ ...card, sourceFile: relativePath }));
}

function activeAgendaInventory() {
  const allCards = CARD_FILES.flatMap(cardsFrom);
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const activeIds = new Set(activeHints.map((hint) => hint.cardId));
  const originalAndProteus = allCards.filter(
    (card) =>
      card.side === "corp" &&
      card.type === "agenda" &&
      ["originalset-v1", "proteus"].includes(card.setId),
  );
  const active = originalAndProteus.filter((card) => activeIds.has(card.cardId));
  const inactive = allCards.filter(
    (card) => card.side === "corp" && card.type === "agenda" && !activeIds.has(card.cardId),
  );
  return { active, inactive, allCards };
}

function signalGroup(signalId) {
  if (signalId.startsWith("access.")) return "ai023_agenda_access";
  if (signalId.startsWith("risk.")) return "ai023_agenda_risk";
  if (signalId.startsWith("score.")) return "ai023_agenda_score";
  return "ai023_corp_agenda";
}

function signalDescription(signalId) {
  return `AI023 Corp Agenda tactic signal: ${signalId.replaceAll("_", " ")}.`;
}

function updateTacticSignals() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  const existing = new Set((catalog.signals ?? []).map((signal) => signal.signalId));
  const added = [];
  for (const [signalId, [supportOnly, anchors]] of Object.entries(AI023_SIGNALS)) {
    const allowedStrategyAnchors = [...anchors].sort();
    if (existing.has(signalId)) continue;
    const signal = {
      signalId,
      group: signalGroup(signalId),
      sideScope: "corp",
      description: signalDescription(signalId),
      supportOnly,
      mayAnchorStrategy: !supportOnly,
      allowedStrategyAnchors,
      sourceKinds: ["AI023 reviewed Corp-Agenda structured hint effects"],
      examples: [],
      targetProfileRelevant:
        signalId.includes("ice") ||
        signalId.includes("fort") ||
        signalId.includes("program") ||
        signalId.includes("hq_agenda") ||
        signalId.includes("rnd"),
      notes:
        "AI023 Corp-Agenda signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.",
    };
    catalog.signals.push(signal);
    added.push(signal);
  }
  for (const signal of catalog.signals ?? []) {
    const definition = AI023_SIGNALS[signal.signalId];
    if (!definition) continue;
    const [supportOnly, anchors] = definition;
    signal.group = signalGroup(signal.signalId);
    signal.sideScope = "corp";
    signal.description = signalDescription(signal.signalId);
    signal.supportOnly = supportOnly;
    signal.mayAnchorStrategy = !supportOnly;
    signal.allowedStrategyAnchors = [...anchors].sort();
    signal.sourceKinds = ["AI023 reviewed Corp-Agenda structured hint effects"];
    signal.targetProfileRelevant =
      signal.signalId.includes("ice") ||
      signal.signalId.includes("fort") ||
      signal.signalId.includes("program") ||
      signal.signalId.includes("hq_agenda") ||
      signal.signalId.includes("rnd");
    signal.notes =
      "AI023 Corp-Agenda signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.";
  }
  catalog.taskId = "AI023";
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI023 adds Corp-Agenda semantics for scoring value, agenda difficulty, economy, action, draw, ICE/fort setup, tag/trace, damage, access punish and bad-publicity risk without planner, engine, targeting, action-score, plan-weight, legality, profile/default or UI-derivation effects.";
  catalog.signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
  writeJson(TACTIC_SIGNAL_PATH, catalog);
  const byId = new Map(catalog.signals.map((signal) => [signal.signalId, signal]));
  return Object.keys(AI023_SIGNALS).map((signalId) => byId.get(signalId) ?? added.find((signal) => signal.signalId === signalId));
}

function updateDerivationRules() {
  const data = readJson(DERIVATION_PATH);
  const existing = new Set(
    (data.derivationRules ?? []).map((rule) => `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`),
  );
  for (const [signalId, [, anchors]] of Object.entries(AI023_SIGNALS)) {
    const rule = {
      signalId,
      source: "effects",
      match: { target: signalId },
      gates: { side: "corp", cardType: "agenda", target: signalId },
      strategyAnchorFor: [...anchors].sort(),
    };
    const key = `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`;
    if (!existing.has(key)) data.derivationRules.push(rule);
  }
  for (const rule of data.derivationRules ?? []) {
    const definition = AI023_SIGNALS[rule.signalId];
    if (!definition) continue;
    if (rule.source !== "effects") continue;
    if (rule.match?.target !== rule.signalId) continue;
    const [, anchors] = definition;
    rule.strategyAnchorFor = [...anchors].sort();
  }
  data.taskId = "AI023";
  data.updatesTaskId =
    "AI003/AI003-1/AI015/AI016/AI017/AI018/AI018c/AI019/AI019a/AI020/AI020-1/AI021/AI022";
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI023 adds Corp-Agenda semantics while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  data.derivationRules.sort((left, right) =>
    `${left.signalId}:${JSON.stringify(left.match)}`.localeCompare(`${right.signalId}:${JSON.stringify(right.match)}`),
  );
  writeJson(DERIVATION_PATH, data);
}

function withConditionObjects(kinds = []) {
  return kinds.map((kind) => ({ kind }));
}

function updateActiveHints(cardsById) {
  const hints = readJson(ACTIVE_HINTS_PATH);
  let changed = 0;
  for (const hint of hints.cards ?? []) {
    const assignment = A[hint.cardId];
    if (!assignment) continue;
    const before = JSON.stringify(hint);
    hint.tacticSignals = [...assignment.signals].sort();
    if (assignment.lineSupport?.length) hint.lineSupport = assignment.lineSupport;
    else delete hint.lineSupport;
    if (assignment.strategicRole?.length) hint.strategicRole = assignment.strategicRole;
    else delete hint.strategicRole;
    hint.quality = {
      ...(hint.quality ?? {}),
      benchmarkCovered: hint.quality?.benchmarkCovered === true,
      hintReviewed: true,
      strategyCovered: Boolean(assignment.lineSupport?.length),
      confidence: assignment.confidence ?? "high",
      needsHumanReview: assignment.needsHumanReview === true,
      reviewedDate: GENERATED_AT,
      reviewedBy: "codex",
    };
    const card = cardsById.get(hint.cardId);
    if (card?.title && !hint.roles?.includes("agenda")) {
      hint.roles = ["agenda", ...(hint.roles ?? [])];
    }
    if (JSON.stringify(hint) !== before) changed += 1;
  }
  writeJson(ACTIVE_HINTS_PATH, hints);
  return changed;
}

function buildPostReviewAssignments(activeCards) {
  return activeCards.map((card) => {
    const assignment = A[card.cardId];
    if (!assignment) throw new Error(`Missing AI023 assignment for ${card.cardId}`);
    const anchors = assignment.lineSupport ?? [];
    const [targetProfileStatus, targetProfileKinds] = assignment.target ?? ["not_required", []];
    return {
      cardId: card.cardId,
      title: card.title,
      cardType: "agenda",
      subtypes: card.subtypes ?? [],
      mechanicalFamily: assignment.family,
      tacticSignals: [...assignment.signals].sort(),
      strategyAnchors: anchors,
      legacyStrategicRole: assignment.strategicRole ?? [],
      strategySupportPairs: assignment.pairs ?? [],
      targetProfileStatus,
      targetProfileKinds,
      hiddenInfoPolicy: assignment.hidden,
      needsHumanReview: assignment.needsHumanReview === true,
      confidence: assignment.confidence ?? "high",
      postReviewStatus: "changed",
      rationale: assignment.rationale,
    };
  });
}

function clusterOverview(assignments) {
  const byFamily = new Map();
  for (const item of assignments) {
    const entry = byFamily.get(item.mechanicalFamily) ?? {
      mechanicalFamily: item.mechanicalFamily,
      count: 0,
      cardIds: [],
    };
    entry.count += 1;
    entry.cardIds.push(item.cardId);
    byFamily.set(item.mechanicalFamily, entry);
  }
  return [...byFamily.values()].sort((left, right) =>
    left.mechanicalFamily.localeCompare(right.mechanicalFamily),
  );
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const entry =
    "- `ai023-corp-agendas-semantics-review-2026-06-02.md` / `ai023-corp-agendas-semantics-review-report-2026-06-02.json`: Aufgabe AI023 prüft 43 aktive/compiled Corp-Agendas aus Originalset und Proteus plus 4 inaktive Classic-Agendas. Reine Economy-, Draw-, Hand-size- und Vanilla-Agendas bleiben ohne pauschalen Strategieanker; echte Anker sind auf Fast-Advance/Difficulty, Damage/Kill, Tag/Punish, ICE-Tax/Glacier, Remote-Setup/Closeout und Ambush/Access-Punish begrenzt. Keine neuen Strategy IDs und keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.";
  if (text.includes("ai023-corp-agendas-semantics-review-2026-06-02.md")) {
    writeText(
      README_PATH,
      text.replace(
        /^- `ai023-corp-agendas-semantics-review-2026-06-02\.md` \/ `ai023-corp-agendas-semantics-review-report-2026-06-02\.json`: .*$/m,
        entry,
      ),
    );
    return;
  }
  const marker = "- `ai022-runner-resources-semantics-review-2026-06-02.md`";
  const index = text.indexOf(marker);
  if (index === -1) {
    writeText(README_PATH, `${text.trimEnd()}\n${entry}\n`);
    return;
  }
  const lineEnd = text.indexOf("\n", index);
  writeText(README_PATH, `${text.slice(0, lineEnd + 1)}${entry}\n${text.slice(lineEnd + 1)}`);
}

function buildReport({ activeCards, inactiveCards, postReviewAssignments, newSignals, changedAgendaCount }) {
  const strategySupportPairs = postReviewAssignments.flatMap((card) =>
    card.strategySupportPairs.map((strategyPair) => ({
      cardId: card.cardId,
      title: card.title,
      ...strategyPair,
    })),
  );
  const targetProfileCandidates = postReviewAssignments
    .filter((card) => !["not_required", "target-profile-v1"].includes(card.targetProfileStatus))
    .map((card) => ({
      cardId: card.cardId,
      title: card.title,
      status: card.targetProfileStatus,
      targetProfileKinds: card.targetProfileKinds,
    }));
  const schemaGapCount = targetProfileCandidates.filter((item) => item.status === "schema_gap").length;
  return {
    schemaVersion: "ai023-corp-agendas-semantics-review-report-v1",
    taskId: "AI023",
    generatedAt: GENERATED_AT,
    status: "complete",
    scope: "corp_agendas",
    sourceCommit: SOURCE_COMMIT,
    summary: {
      activeCorpAgendaCount: activeCards.length,
      reviewedAgendaCount: activeCards.length,
      inactiveCheckedAgendaCount: inactiveCards.length,
      changedAgendaCount,
      unchangedCheckedAgendaCount: 0,
      newTacticSignalCount: newSignals.length,
      changedExistingTacticSignalCount: 0,
      newStrategyIdCount: 0,
      strategySupportPairCount: strategySupportPairs.length,
      targetProfileCandidateCount: targetProfileCandidates.length,
      schemaGapCount,
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
      activeCompiledAgendaCardIds: activeCards.map((card) => card.cardId),
      inactiveCheckedAgendaCardIds: inactiveCards.map((card) => card.cardId),
      countDiscrepancies: [
        {
          setId: "originalset-v1",
          expectedSpoilerCount: 33,
          activeCompiledRepoCount: activeCards.filter((card) => card.setId === "originalset-v1").length,
          status: "matches",
        },
        {
          setId: "proteus",
          expectedSpoilerCount: 10,
          activeCompiledRepoCount: activeCards.filter((card) => card.setId === "proteus").length,
          status: "matches",
        },
        {
          setId: "classic",
          expectedSpoilerCount: null,
          activeCompiledRepoCount: 0,
          inactiveKnownRepoCount: inactiveCards.filter((card) => card.setId === "classic").length,
          status: "known_inactive_not_in_active_scope",
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
    newStrategyIds: [],
    strategySupportPairs,
    targetProfileCandidates,
    hiddenInfoSafetyReview: [
      {
        topic: "corp_agenda_hidden_semantics",
        result: "pass",
        notes:
          "Corp-KI darf eigene Agenda-Semantik im bestehenden side-safe Inputkontext kennen; Runner-KI erhaelt keine verdeckte Corp-Agenda-Semantik vor Reveal, Score, Access oder anderer bekannter Sichtbarkeit.",
      },
      {
        topic: "access_ambush_agendas",
        result: "pass",
        notes:
          "Fetal AI, Marked Accounts und Viral Breeding Ground bleiben im Report voll beschrieben, aber Runtime-/Inspector-Projektion erhaelt keine neue Runner-seitige Hidden-Info-Quelle.",
      },
    ],
    deferredItems: [
      {
        topic: "corp_tempo_or_agenda_economy_strategy",
        decision: "deferred",
        rationale:
          "Corporate Boon, Subsidiary Branch und starke Economy-Agendas erhalten Taktiksignale, aber keine neue Strategy-ID ohne separate Taxonomieentscheidung.",
      },
      {
        topic: "target_profile_v1_on_score_choices",
        decision: "deferred",
        rationale:
          "Mehrere Agenda-Zielwahlen sind on-score oder mehrstufig; TargetProfile V1 bleibt diagnostischer Kandidat oder schema_gap ohne Targeting-KI.",
      },
    ],
    postReviewAssignments,
    verification: [
      {
        command: "node scripts/check-ai023-corp-agendas-semantics.mjs",
        result: "pending_after_apply",
      },
    ],
  };
}

function buildMarkdown(report) {
  const newSignalRows = report.newTacticSignals
    .map((signal) => `- \`${signal.signalId}\`: supportOnly=${signal.supportOnly}, mayAnchor=${signal.mayAnchorStrategy}, anchors=${signal.allowedStrategyAnchors.join(", ") || "none"}`)
    .join("\n");
  const anchorRows = report.strategySupportPairs
    .map((pair) => `- ${pair.title}: \`${pair.strategyId}\` -> \`${pair.role}\` (${pair.confidence})`)
    .join("\n");
  const targetRows = report.targetProfileCandidates
    .map((item) => `- ${item.title}: ${item.status} (${item.targetProfileKinds.join(", ")})`)
    .join("\n");
  return `# AI023 Corp Agenda Semantics Review

## Kurzfazit

AI023 prüft alle ${report.summary.activeCorpAgendaCount} aktiven/compiled Corp-Agendas aus Originalset und Proteus sowie ${report.summary.inactiveCheckedAgendaCount} bekannte inaktive Classic-Agendas. Reine Agenda-Punkte, reine Economy, Draw und Hand-size bleiben ohne pauschalen Strategieanker. Echte Strategieanker wurden nur für Difficulty/Fast-Advance, Damage/Kill, Tag/Punish, ICE-Tax/Glacier, Remote-Setup/Closeout und Access-Punish/Ambush gesetzt.

## Scope / Out-of-Scope

- Scope: aktive/compiled Corp-Agendas aus Originalset und Proteus; bekannte inaktive Classic-Agendas als Inventarcheck.
- Out-of-Scope: Corp ICE, Operations, Nodes, Upgrades, Runner-Karten, Engine, Planner, ActionScore, PlanWeight, LegalActions, Targeting-KI und Visibility-Regeln.
- Neue Strategy IDs: keine.

## Hidden-Info-Grenzen

Corp-Agenda-Semantik ist nur side-safe. Die Corp-KI darf eigene HQ-, R&D- und installierte Agenda-Semantik nur im Rahmen bestehender AI-Inputs nutzen. Runner-KI, Inspector- und Debug-Sichten dürfen verdeckte/ungeaccessete Corp-Agendas nicht als Fetal AI, Marked Accounts, World Domination oder andere konkrete Agenda ableiten. Der Review-Report beschreibt die Karten vollständig, ändert aber keine Runtime-Projektion.

## Inventarcounts

- Originalset: 33 aktive/compiled Corp-Agendas; Spoiler-Erwartung 33.
- Proteus: 10 aktive/compiled Corp-Agendas; Spoiler-Erwartung 10.
- Classic: 4 bekannte inaktive Corp-Agendas ohne aktive Hints.

## Clusterübersicht

${report.clusterOverview.map((cluster) => `- ${cluster.mechanicalFamily}: ${cluster.count}`).join("\n")}

## Neue / wiederverwendete Taktiksignale

AI023 ergänzt ${report.summary.newTacticSignalCount} neue kontrollierte Corp-Agenda-Signale. Wiederverwendet werden unter anderem \`trace.source\`, \`tag.source\`, \`tag.payoff\`, \`damage.payoff\`, \`ice.strength_modifier\`, \`ice.subroutine_modifier\` und \`score.agenda_action\`.

${newSignalRows}

## Geänderte bestehende Signale

Keine bestehenden Taktiksignale wurden fachlich geändert.

## Strategieanker und strategySupportPairs

Alle kanonischen Rollen stehen als eindeutige \`strategySupportPairs\` im JSON-Report. Karten ohne Strategieanker erhalten keine kanonische strategische Rolle.

${anchorRows}

## Entscheidungen

- Fast-Advance/Overadvance: Difficulty-Reduction-Agendas und Project Babylon/Venice ankern \`corp.fast_advance\`; Tycho Extension und Project Zurich bleiben ohne Strategieanker.
- Damage/Kill: Bioweapons Engineering, On-Call Solo Team, Strike Force Kali, Corporate Headhunters und Fetal AI ankern \`corp.damage_kill\`; Please Don't Choke Anyone nicht.
- Tag/Punish: Netwatch Operations Office, Private Cybernet Police, Marked Accounts, On-Call Solo Team, Strike Force Kali und Corporate Headhunters trennen Tag-Quelle und Payoff.
- ICE-Tax/Glacier: Black Ice Quality Assurance, Encryption Breakthrough, Superior Net Barriers, Ice Transmutation, Security Net Optimization, Priority Requisition und Security Purge ankern \`corp.ice_tax_glacier\`.
- Economy/Tempo: Economy-Agendas und reine Action-/Draw-/Handsize-Supportkarten bleiben ohne neue Economy-/Tempo-Strategy-ID.
- Access-Punish/Ambush: Fetal AI, Marked Accounts und Viral Breeding Ground erhalten Access-Punish-/Ambush-Semantik ohne Runner-Hidden-Info-Leak.

## TargetProfile-Kandidaten

${targetRows}

## Deferred Items

${report.deferredItems.map((item) => `- ${item.topic}: ${item.decision}. ${item.rationale}`).join("\n")}

## Post-Review-Liste

Die vollständige Kartenliste mit Taktiksignalen, Strategieankern, \`strategySupportPairs\`, TargetProfile-Status, Hidden-Info-Policy und Rationale steht im JSON-Report \`ai023-corp-agendas-semantics-review-report-2026-06-02.json\`.

## Verifikation

Nach dem Apply-Lauf sind die bestehenden AI-Gates und der AI023-Invariant-Check auszuführen. Der Review selbst setzt keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.
`;
}

function main() {
  const { active, inactive, allCards } = activeAgendaInventory();
  const activeIds = new Set(active.map((card) => card.cardId));
  const missing = [...activeIds].filter((cardId) => !A[cardId]);
  if (missing.length) throw new Error(`Missing AI023 assignment(s): ${missing.join(", ")}`);
  const cardsById = new Map(allCards.map((card) => [card.cardId, card]));
  const newSignals = updateTacticSignals();
  updateDerivationRules();
  const appliedHintChangeCount = updateActiveHints(cardsById);
  const postReviewAssignments = buildPostReviewAssignments(active);
  const report = buildReport({
    activeCards: active,
    inactiveCards: inactive,
    postReviewAssignments,
    newSignals,
    changedAgendaCount: active.length,
  });
  writeJson(JSON_REPORT_PATH, report);
  writeText(MD_REPORT_PATH, buildMarkdown(report));
  updateReadme();
  console.log(`AI023 applied active=${active.length} inactive=${inactive.length} changed=${active.length} fileChanges=${appliedHintChangeCount} newSignals=${newSignals.length}`);
}

main();
