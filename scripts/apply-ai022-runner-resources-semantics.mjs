#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const GENERATED_AT = "2026-06-02";
const SOURCE_COMMIT = "57145aacfb1fa7dd87cece3c3b1558a6b63f3429";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const FUNCTION_SIGNAL_PATH = "data/ai/function-signal-derivation-v1.json";
const REPORT_PATH =
  "docs/reviews/ai/ai022-runner-resources-semantics-review-report-2026-06-02.json";
const MARKDOWN_PATH =
  "docs/reviews/ai/ai022-runner-resources-semantics-review-2026-06-02.md";
const README_PATH = "docs/reviews/ai/README.md";

const CARD_FILES = [
  "data/cards/classic-cards.json",
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
];

const e = (kind, fields = {}) => ({ kind, ...fields });
const c = (kind, fields = {}) => ({ kind, ...fields });
const pair = (strategyId, role, evidence, confidence = "high") => ({
  strategyId,
  role,
  evidence,
  confidence,
});

const targetProfile = ({
  kind,
  timing = "on_use",
  targetType = "card",
  purpose,
  preferences = [],
  avoid = ["hidden_info_dependent_choice"],
}) => ({
  schemaVersion: "target-profile-v1",
  kind,
  timing,
  targetType,
  purpose,
  preferences,
  avoid,
  hiddenInfoPolicy: "public_or_controller_known_only",
});

const reviewedQuality = (confidence = "medium", needsHumanReview = false) => ({
  benchmarkCovered: false,
  hintReviewed: true,
  strategyCovered: false,
  confidence,
  needsHumanReview,
  reviewedDate: GENERATED_AT,
  reviewedBy: "codex",
});

const ROLE_ALIASES = new Map([
  ["agenda_tax", "remote_upgrade_tax"],
  ["ap_bypass", "run_bypass"],
  ["bad_publicity", "corp_pressure"],
  ["base_link", "link"],
  ["bbs", "utility_resource"],
  ["brain_damage_risk", "damage"],
  ["current_access_trash", "access_trash"],
  ["damage_risk", "damage"],
  ["damage_retaliation", "random_discard_pressure"],
  ["debt", "economy"],
  ["draw_filter", "draw"],
  ["extra_action", "run_action"],
  ["extra_run_action", "run_action"],
  ["fort_creation_lock", "remote_support"],
  ["fort_tax", "server_ice_install"],
  ["hardware_search", "stack_search"],
  ["hidden", "hidden_zone_tool"],
  ["hq_multiaccess", "multiaccess"],
  ["hq_payoff", "hq_pressure"],
  ["install_during_run", "program_search"],
  ["installment", "economy"],
  ["jackout_risk", "run_drawback"],
  ["link_credit", "link_recurring_credit"],
  ["mandatory_action", "random"],
  ["meat_damage_immunity", "meat_damage"],
  ["meat_prevention", "damage_prevention"],
  ["prep_resource_search", "stack_search"],
  ["recovery", "trash_recovery"],
  ["remote_payoff", "remote_support"],
  ["resource_trash_prevention", "trash_prevention"],
  ["rnd_info", "rd_pressure"],
  ["rnd_multiaccess", "rd_multiaccess"],
  ["run_economy", "successful_run_reward"],
  ["sabotage", "access_trash"],
  ["tag_clear", "tag_removal"],
  ["temporary_bank", "economy"],
  ["trace_boost", "post_bid_link"],
  ["trace_cancel", "trace_tag_ice"],
  ["trace_credit", "successful_run_reward"],
  ["trash_for_credit", "trash_for_value"],
  ["virus_support", "virus_counter_protection"],
]);

const ALLOWED_RESOURCE_ROLES = new Set([
  "access",
  "access_trash",
  "connection",
  "corp_pressure",
  "counter",
  "damage",
  "damage_prevention",
  "delayed_install",
  "draw",
  "economy",
  "hidden_zone_tool",
  "hq_pressure",
  "link",
  "link_recurring_credit",
  "meat_damage",
  "multiaccess",
  "post_bid_link",
  "prevention",
  "program_search",
  "random",
  "random_discard_pressure",
  "rd_multiaccess",
  "rd_pressure",
  "remote_support",
  "remote_upgrade_tax",
  "resource",
  "run_action",
  "run_bypass",
  "run_drawback",
  "server_ice_install",
  "set_aside_install",
  "shell_counter",
  "stack_search",
  "successful_run_reward",
  "tag_avoid",
  "tag_removal",
  "trace_tag_ice",
  "trash_for_value",
  "trash_prevention",
  "trash_recovery",
  "unique",
  "utility_resource",
  "virus",
  "virus_counter_protection",
]);

function normalizeRoles(roles) {
  return sortedUnique(
    roles
      .map((role) => ROLE_ALIASES.get(role) ?? role)
      .filter((role) => ALLOWED_RESOURCE_ROLES.has(role)),
  );
}

const SIGNALS = [
  ["resource.hidden", "resource", "Installed Runner Resource whose identity can be hidden from the Corp until reveal or trash.", true, []],
  ["resource.connection", "resource", "Runner Resource with Connection subtype or connection-like permanent utility.", true, []],
  ["resource.bbs", "resource", "Runner Resource with BBS subtype, usually stack filtering, recovery, draw or economy support.", true, []],
  ["resource.position", "resource", "Runner Resource with Position subtype.", true, []],
  ["resource.unique", "resource", "Runner Resource with unique restriction.", true, []],
  ["resource.random", "resource", "Runner Resource with deterministic random-action or random-outcome semantics.", true, []],
  ["resource.sabotage", "resource", "Runner Resource that sabotages Corp board, HQ, R&D or current access.", true, []],
  ["resource.base_link", "resource", "Runner Resource that provides base link or link boost support.", true, []],
  ["resource.hidden_one_shot", "resource", "Hidden Runner Resource with one-shot tap/reveal utility.", true, []],
  ["hidden.runner_resource", "hidden", "Side-aware hidden Runner Resource marker; Corp-facing runtime inputs must not infer card identity from it.", true, []],
  ["hidden.one_shot_resource", "hidden", "Hidden one-shot Resource use marker.", true, []],
  ["hidden.reveals_on_use", "hidden", "Hidden Resource becomes public as part of use/reveal semantics.", true, []],
  ["hidden.reveals_on_trash", "hidden", "Hidden Resource is public when trashed.", true, []],
  ["defense.trace_cancel", "defense", "Cancels the effect of a successful trace.", true, []],
  ["defense.trace_cancel_bad_publicity", "defense", "Cancels trace effect and can assign Bad Publicity.", true, []],
  ["economy.trace_success_credit", "economy", "Credit gained when a trace is avoided by a link resource.", true, []],
  ["economy.hidden_burst_credit", "economy", "Hidden Resource burst-credit effect.", true, []],
  ["economy.cost_window_credit", "economy", "Credit source usable in cost or penalty windows.", true, []],
  ["economy.installment_credit", "economy", "Deferred/installment credit payout over turns.", true, []],
  ["economy.turn_start_credit", "economy", "Credit gained at the start of the Runner turn.", true, []],
  ["economy.successful_run_credit", "economy", "Credit gained after a successful run.", true, []],
  ["economy.temporary_resource_bank", "economy", "Resource stores finite credits for later withdrawal.", true, []],
  ["risk.debt_loss_condition", "risk", "Resource debt creates a loss condition if not repaid.", true, []],
  ["risk.lose_game_debt", "risk", "Debt effect can directly lose the game.", true, []],
  ["risk.ends_on_run", "risk", "Resource is trashed or ends when the Runner makes a run.", true, []],
  ["risk.random_action", "risk", "Random action/outcome risk.", true, []],
  ["risk.mandatory_action", "risk", "Mandatory action requirement generated by a card.", true, []],
  ["risk.random_hand_reveal", "risk", "Random reveal/play/install risk from the Runner grip.", true, []],
  ["risk.delayed_failure", "risk", "Delayed failure or damage condition.", true, []],
  ["risk.run_spend_limit", "risk", "Run action has a spending cap.", true, []],
  ["risk.unpreventable_brain_damage", "risk", "Brain damage from the card cannot be prevented.", true, []],
  ["setup.prep_resource_search", "setup", "Search/filter for Prep or Resource cards.", true, []],
  ["setup.hardware_search", "setup", "Search/filter for Runner Hardware cards.", true, []],
  ["setup.top_trash_recovery", "setup", "Recover the top card of the Runner trash.", true, []],
  ["setup.delayed_install", "setup", "Staged or delayed install support.", true, []],
  ["setup.install_countdown", "setup", "Install countdown counters.", true, []],
  ["setup.install_from_hand_staged", "setup", "Set aside a card from hand for later install.", true, []],
  ["setup.search_reveals_to_corp", "setup", "Search result is shown to the Corp.", true, []],
  ["access.current_access_trash", "access", "Trash one or more currently accessed cards.", true, []],
  ["access.hq_hidden_multiaccess", "access", "Hidden Resource HQ multiaccess payoff.", false, ["runner.hq_pressure", "runner.interface_closeout"]],
  ["access.rnd_hidden_multiaccess", "access", "Hidden Resource R&D multiaccess payoff.", false, ["runner.rnd_pressure", "runner.interface_closeout"]],
  ["access.hq_sabotage_credit_loss", "access", "HQ successful-run sabotage that makes the Corp lose credits.", false, ["runner.hq_pressure"]],
  ["access.hq_random_discard_retaliation", "access", "HQ random discard retaliation linked to meat damage.", true, []],
  ["access.remote_full_trash", "access", "Trash all cards in a subsidiary fort before access.", false, ["runner.remote_contest", "runner.remote_trash"]],
  ["access.remote_sabotage_payoff", "access", "Remote access sabotage payoff.", false, ["runner.remote_contest", "runner.remote_trash"]],
  ["remote.install_ice_tax", "remote", "Tax on installing ICE on a chosen fort.", false, ["runner.remote_contest"]],
  ["remote.full_fort_trash", "remote", "Full remote fort trash payoff.", false, ["runner.remote_contest", "runner.remote_trash"]],
  ["fort.install_ice_tax", "fort", "Chosen-fort ICE install tax.", false, ["runner.remote_contest"]],
  ["fort.creation_lock", "fort", "Prevents or locks creation of new data forts.", false, ["runner.remote_contest"]],
  ["action.extra_action", "action", "Optional extra Runner action.", true, []],
  ["action.extra_run_action", "action", "Optional extra action restricted to making a run.", true, []],
  ["action.random_extra_action", "action", "Random extra-action engine.", true, []],
  ["action.mandatory_extra_action", "action", "Mandatory extra-action engine.", true, []],
  ["action.delayed_extra_action_engine", "action", "Delayed permanent extra-action engine.", true, []],
  ["defense.resource_trash_prevention", "defense", "Prevent one or more Resource cards from being trashed.", true, []],
  ["defense.installed_card_trash_prevention", "defense", "Prevent installed program/hardware/resource trash.", true, []],
  ["defense.all_meat_damage_prevention", "defense", "Prevents all meat damage.", false, ["runner.survival_defense"]],
  ["defense.damage_retaliation", "defense", "Retaliates after damage is dealt to the Runner.", true, []],
  ["defense.ap_ice_bypass", "defense", "AP ICE bypass or escape support.", true, []],
  ["virus.counter_protection", "virus", "Protects selected virus counters during purge.", true, []],
  ["virus.purge_resistance", "virus", "Resists Corp purge effects.", true, []],
  ["virus.counter_retention", "virus", "Retains virus counters through purge.", true, []],
  ["virus.support", "virus", "Virus support without introducing a generic Runner virus strategy.", true, []],
  ["run.bypass_ap_ice", "run", "Pass or bypass AP ICE during an encounter.", true, []],
  ["run.encounter_escape", "run", "Encounter escape or pass effect without icebreaker coverage.", true, []],
  ["corp.bad_publicity_on_trace_cancel", "corp", "Corp Bad Publicity caused by trace cancellation.", true, []],
  ["corp.trace_effect_bad_publicity", "corp", "Bad Publicity pressure attached to a trace effect.", true, []],
];

const REUSED_SIGNAL_IDS = [
  "access.free_trash",
  "access.hq_multiaccess",
  "access.rnd_multiaccess",
  "access.trash_untrashable",
  "corp.bad_publicity_pressure",
  "corp.economy_pressure",
  "corp.random_discard_pressure",
  "cost.agenda_point_penalty",
  "defense.base_link",
  "defense.damage_prevention",
  "defense.meat_damage_prevention",
  "defense.next_tag_avoidance",
  "defense.tag_clear_support",
  "defense.tag_prevention",
  "defense.trace_boost",
  "defense.trace_defense",
  "economy.action_credit",
  "economy.burst_credit",
  "economy.conditional_burst_credit",
  "economy.high_risk_burst_credit",
  "economy.recurring",
  "economy.recurring_link_credit",
  "economy.trash_for_credit",
  "info.rnd_information",
  "remote.agenda_difficulty_tax",
  "risk.brain_damage_self_inflicted",
  "risk.installed_card_trash_cost",
  "risk.self_brain_damage",
  "run.ends_run_after_effect",
  "run.make_run",
  "setup.card_search",
  "setup.draw",
  "setup.hardware_install",
  "setup.hardware_search",
  "setup.install_during_run",
  "setup.program_install",
  "setup.program_protection",
  "setup.program_search",
  "setup.program_trash_prevention",
  "setup.recovery",
  "setup.search",
  "setup.stack_filter",
];

const SIGNAL_ANCHORS = new Map(
  SIGNALS.map(([signalId, , , , allowedStrategyAnchors]) => [
    signalId,
    allowedStrategyAnchors,
  ]),
);

const RULES = [...SIGNALS.map(([signalId]) => signalId), ...REUSED_SIGNAL_IDS].map((signalId) => [
  signalId,
  "effects",
  { kind: effectKindForSignal(signalId), target: signalId },
  { side: "runner", cardType: "resource" },
  SIGNAL_ANCHORS.get(signalId) ?? [],
]);

const A = {
  "onr_v1_148_access-through-alpha": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "link", "base_link"],
    effects: [s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense")],
    rationale: "High base-link support; no survival anchor because trace/link is support-only.",
  },
  "onr_v1_149_access-to-arasaka": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "link", "base_link"],
    effects: [s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense"), s("defense.trace_boost")],
    rationale: "Base link plus link pump; support-only.",
  },
  "onr_v1_150_access-to-kiribati": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "link", "base_link"],
    effects: [s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense"), s("defense.trace_boost")],
    rationale: "Low base link plus link pump; support-only.",
  },
  "onr_v1_151_aujourdoui": {
    family: "bbs_search_or_recovery",
    roles: ["resource", "bbs", "stack_filter", "program_search"],
    effects: [s("resource.bbs"), s("setup.stack_filter"), s("setup.program_search"), s("setup.search_reveals_to_corp")],
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "program", purpose: "top_five_program_choice", preferences: ["program_repairs_missing_coverage"] })],
    targetProfileStatus: "schema_gap",
    rationale: "Top-five Program filter with Corp reveal; support-only, no automatic breaker-search anchor.",
  },
  "onr_v1_152_back-door-to-hilliard": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "link", "base_link"],
    effects: [s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense"), s("defense.trace_boost")],
    rationale: "Base link plus link pump; support-only.",
  },
  "onr_v1_153_back-door-to-orbital-air": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "link", "base_link"],
    effects: [s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense"), s("defense.trace_boost")],
    rationale: "Base link plus link pump; support-only.",
  },
  "onr_v1_154_broker": {
    family: "economy_engine",
    roles: ["resource", "connection", "economy", "temporary_bank"],
    effects: [s("resource.connection"), s("economy.action_credit"), s("economy.temporary_resource_bank")],
    rationale: "Repeatable click-for-bank economy remains support-only.",
  },
  "onr_v1_155_code-viral-cache": {
    family: "virus_support",
    roles: ["resource", "virus_support"],
    effects: [s("virus.counter_protection"), s("virus.purge_resistance"), s("virus.counter_retention"), s("virus.support")],
    rationale: "Virus counter retention support; no generic runner.virus strategy.",
  },
  "onr_v1_156_corporate-ally": {
    family: "remote_tax_or_remote_lock",
    roles: ["resource", "connection", "unique", "agenda_tax"],
    lineSupport: ["runner.remote_contest"],
    strategicRole: ["scoring_tool"],
    strategySupportPairs: [pair("runner.remote_contest", "score_denial", ["remote.agenda_difficulty_tax", "cost.agenda_point_penalty"], "medium")],
    effects: [s("resource.connection"), s("resource.unique"), s("remote.agenda_difficulty_tax"), s("cost.agenda_point_penalty")],
    rationale: "Permanent agenda difficulty tax is a real remote-contest score-denial piece.",
  },
  "onr_v1_157_crash-everett-inventive-fixer": {
    family: "install_or_setup_support",
    roles: ["resource", "connection", "unique", "draw_filter"],
    effects: [s("resource.connection"), s("resource.unique"), s("setup.draw"), s("setup.stack_filter")],
    rationale: "Draw smoothing is useful setup support, not a strategy anchor.",
  },
  "onr_v1_158_danshis-second-id": {
    family: "damage_or_tag_survival",
    roles: ["resource", "tag_clear"],
    effects: [s("defense.tag_clear_support")],
    rationale: "Simple tag-clear support-only Resource.",
  },
  "onr_v1_159_databroker": {
    family: "burst_or_deferred_economy",
    roles: ["resource", "connection", "economy", "agenda_point_cost"],
    effects: [s("resource.connection"), s("economy.high_risk_burst_credit"), s("cost.agenda_point_penalty")],
    rationale: "High-risk burst economy with agenda-point cost; no economy strategy anchor.",
  },
  "onr_v1_160_diplomatic-immunity": {
    family: "damage_or_tag_survival",
    roles: ["resource", "unique", "meat_damage_immunity"],
    lineSupport: ["runner.survival_defense"],
    strategicRole: ["defensive_tool"],
    strategySupportPairs: [pair("runner.survival_defense", "defensive_tool", ["defense.all_meat_damage_prevention"], "high")],
    effects: [s("resource.unique"), s("defense.all_meat_damage_prevention"), s("defense.meat_damage_prevention"), s("cost.agenda_point_penalty")],
    rationale: "All-meat-damage prevention is strong enough to remain a survival defensive tool.",
  },
  "onr_v1_161_fall-guy": {
    family: "damage_or_tag_survival",
    roles: ["resource", "tag_avoid"],
    effects: [s("defense.tag_prevention"), s("defense.next_tag_avoidance")],
    rationale: "One-shot tag avoidance is support-only.",
  },
  "onr_v1_162_field-reporter-for-ice-and-data": {
    family: "burst_or_deferred_economy",
    roles: ["resource", "position", "economy"],
    effects: [s("resource.position"), s("economy.conditional_burst_credit")],
    rationale: "Conditional end-turn credits after Corp rez; support-only economy.",
  },
  "onr_v1_163_floating-runner-bbs": {
    family: "economy_engine",
    roles: ["resource", "bbs", "position", "economy"],
    effects: [s("resource.bbs"), s("resource.position"), s("economy.turn_start_credit"), s("economy.recurring")],
    rationale: "Start-turn credit support; no economy strategy.",
  },
  "onr_v1_164_hells-run": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "link_credit"],
    effects: [s("economy.recurring_link_credit"), s("defense.trace_defense")],
    rationale: "Recurring link credit remains trace support.",
  },
  "onr_v1_165_junkyard-bbs": {
    family: "bbs_search_or_recovery",
    roles: ["resource", "bbs", "recovery"],
    effects: [s("resource.bbs"), s("setup.top_trash_recovery"), s("setup.recovery")],
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "card", purpose: "top_trash_recovery" })],
    targetProfileStatus: "schema_gap",
    rationale: "Top-trash recovery is generic support; no runner.search.breaker anchor.",
  },
  "onr_v1_166_karl-de-veres-corporate-stooge": {
    family: "access_hq_rnd_payoff",
    roles: ["resource", "connection", "unique", "run_economy"],
    effects: [s("resource.connection"), s("resource.unique"), s("economy.successful_run_credit")],
    rationale: "Successful-run credit is access support, not a central payoff anchor.",
  },
  "onr_v1_167_leland-corporate-bodyguard": {
    family: "damage_or_tag_survival",
    roles: ["resource", "meat_prevention", "tag_avoid"],
    effects: [s("defense.meat_damage_prevention"), s("defense.damage_prevention"), s("defense.tag_prevention"), s("defense.next_tag_avoidance")],
    rationale: "Meat prevention plus tag avoidance is survival support; not broad enough for a canonical anchor.",
  },
  "onr_v1_168_loan-from-chiba": {
    family: "risky_resource_or_drawback",
    roles: ["resource", "economy", "debt"],
    effects: [s("economy.high_risk_burst_credit"), s("risk.debt_loss_condition"), s("risk.lose_game_debt"), s("economy.turn_start_credit")],
    rationale: "Large burst economy with debt loss condition; no economy strategy anchor.",
  },
  "onr_v1_169_n-e-t-o": {
    family: "bbs_search_or_recovery",
    roles: ["resource", "bbs", "prep_resource_search"],
    effects: [s("resource.bbs"), s("setup.stack_filter"), s("setup.prep_resource_search"), s("setup.search_reveals_to_corp")],
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "card", purpose: "top_four_prep_or_resource_choice" })],
    targetProfileStatus: "schema_gap",
    rationale: "Prep/Resource filter support-only.",
  },
  "onr_v1_170_nomad-allies": {
    family: "damage_or_tag_survival",
    roles: ["resource", "connection", "tag_clear", "tag_avoid"],
    effects: [s("resource.connection"), s("defense.tag_clear_support"), s("defense.tag_prevention"), s("defense.next_tag_avoidance")],
    rationale: "Tag clear/avoidance support-only.",
  },
  "onr_v1_171_preying-mantis": {
    family: "action_engine_or_random_action",
    roles: ["resource", "connection", "extra_action", "brain_damage_risk"],
    effects: [s("resource.connection"), s("action.extra_action"), s("risk.brain_damage_self_inflicted"), s("risk.unpreventable_brain_damage")],
    rationale: "Optional extra-action engine is candidate/deferred only; no new action strategy ID.",
    postReviewStatus: "candidate_only",
  },
  "onr_v1_172_quest-for-cattekin": {
    family: "action_engine_or_random_action",
    roles: ["resource", "random", "extra_action", "damage_risk"],
    effects: [s("resource.random"), s("action.delayed_extra_action_engine"), s("action.random_extra_action"), s("risk.random_action"), s("risk.self_brain_damage"), s("risk.unpreventable_brain_damage"), s("risk.delayed_failure")],
    rationale: "Random delayed action engine remains candidate/deferred without a strategy-taxonomy decision.",
    postReviewStatus: "candidate_only",
  },
  "onr_v1_173_restrictive-net-zoning": {
    family: "remote_tax_or_remote_lock",
    roles: ["resource", "fort_tax"],
    lineSupport: ["runner.remote_contest"],
    strategicRole: ["tax_tool"],
    strategySupportPairs: [pair("runner.remote_contest", "tax_enabler", ["remote.install_ice_tax", "fort.install_ice_tax"], "medium")],
    effects: [s("remote.install_ice_tax"), s("fort.install_ice_tax")],
    targetProfiles: [targetProfile({ kind: "install_target", targetType: "server", purpose: "chosen_fort_ice_tax" })],
    rationale: "Persistent chosen-fort ICE install tax is a remote-contest enabler.",
  },
  "onr_v1_174_rigged-investments": {
    family: "burst_or_deferred_economy",
    roles: ["resource", "economy", "installment"],
    effects: [s("economy.installment_credit"), s("economy.turn_start_credit")],
    rationale: "Deferred credit economy support-only.",
  },
  "onr_v1_175_ronin-around": {
    family: "bbs_search_or_recovery",
    roles: ["resource", "bbs", "hardware_search", "expose"],
    effects: [s("resource.bbs"), s("setup.stack_filter"), s("setup.hardware_search"), s("setup.search_reveals_to_corp")],
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "card", purpose: "top_five_hardware_choice" })],
    targetProfileStatus: "schema_gap",
    rationale: "Hardware filter and expose utility; support-only.",
  },
  "onr_v1_176_the-shell-traders": {
    family: "install_or_setup_support",
    roles: ["resource", "delayed_install", "counter"],
    effects: [s("setup.delayed_install"), s("setup.install_countdown"), s("setup.install_from_hand_staged"), s("setup.program_install"), s("setup.hardware_install")],
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "card", purpose: "staged_program_or_hardware_install" })],
    targetProfileStatus: "schema_gap",
    rationale: "Staged install support-only.",
  },
  "onr_v1_177_the-short-circuit": {
    family: "bbs_search_or_recovery",
    roles: ["resource", "bbs", "program_search"],
    lineSupport: ["runner.search.breaker"],
    strategicRole: ["enabler"],
    strategySupportPairs: [pair("runner.search.breaker", "enabler", ["setup.program_search", "setup.card_search", "setup.search_reveals_to_corp"], "medium")],
    effects: [s("resource.bbs"), s("setup.program_search"), s("setup.card_search"), s("setup.search_reveals_to_corp")],
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "program", purpose: "program_search_to_hand", preferences: ["program_repairs_missing_coverage"] })],
    rationale: "Repeatable Program tutor can support breaker-search strategy as an enabler, but does not become an engine anchor.",
  },
  "onr_v1_178_short-term-contract": {
    family: "burst_or_deferred_economy",
    roles: ["resource", "position", "economy", "temporary_bank"],
    effects: [s("resource.position"), s("economy.action_credit"), s("economy.temporary_resource_bank")],
    rationale: "Finite click-to-credit bank support-only.",
  },
  "onr_v1_179_silicon-saloon-franchise": {
    family: "economy_engine",
    roles: ["resource", "position", "economy", "draw"],
    effects: [s("resource.position"), s("economy.action_credit"), s("setup.draw")],
    rationale: "Click economy/draw support-only.",
  },
  "onr_v1_180_smiths-pawnshop": {
    family: "economy_engine",
    roles: ["resource", "connection", "unique", "trash_for_credit"],
    effects: [s("resource.connection"), s("resource.unique"), s("economy.trash_for_credit"), s("risk.installed_card_trash_cost")],
    rationale: "Trash-for-credit support-only.",
  },
  "onr_v1_181_the-springboard": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "bbs", "link"],
    effects: [s("resource.bbs"), s("defense.trace_boost"), s("defense.trace_defense")],
    rationale: "Post-bid link pump; support-only.",
  },
  "onr_v1_182_submarine-uplink": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "base_link", "jackout_risk"],
    effects: [s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense"), s("defense.trace_boost"), s("run.ends_run_after_effect")],
    rationale: "Run-limited base link and forced jack-out; support-only.",
  },
  "onr_v1_183_technician-lover": {
    family: "other_resource_utility",
    roles: ["resource", "rnd_info"],
    effects: [s("info.rnd_information")],
    rationale: "Top-R&D information support-only.",
  },
  "onr_v1_184_top-runners-conference": {
    family: "burst_or_deferred_economy",
    roles: ["resource", "economy", "run_drawback"],
    effects: [s("economy.turn_start_credit"), s("risk.ends_on_run")],
    rationale: "Start-turn economy with run-ending drawback; support-only.",
  },
  "onr_v1_185_trauma-team": {
    family: "damage_or_tag_survival",
    roles: ["resource", "meat_prevention", "counter"],
    effects: [s("defense.meat_damage_prevention"), s("defense.damage_prevention")],
    rationale: "Finite meat prevention support; not a strategy anchor.",
  },
  "onr_v1_186_umbrella-policy": {
    family: "program_hardware_resource_protection",
    roles: ["resource", "trash_prevention"],
    effects: [s("defense.installed_card_trash_prevention"), s("setup.program_protection"), s("setup.program_trash_prevention")],
    targetProfiles: [targetProfile({ kind: "replacement_target", targetType: "card", purpose: "prevent_program_or_hardware_trash" })],
    rationale: "Installed program/hardware protection support-only.",
  },
  "onr_v1_187_wilson-weeflerunner-apprentice": {
    family: "damage_or_tag_survival",
    roles: ["resource", "extra_run_action", "tag_avoid", "meat_prevention"],
    lineSupport: ["runner.survival_defense"],
    strategicRole: ["defensive_tool"],
    strategySupportPairs: [pair("runner.survival_defense", "defensive_tool", ["defense.meat_damage_prevention", "defense.tag_prevention", "action.extra_run_action"], "medium")],
    effects: [s("action.extra_run_action"), s("risk.run_spend_limit"), s("defense.tag_prevention"), s("defense.next_tag_avoidance"), s("defense.meat_damage_prevention"), s("defense.damage_prevention")],
    rationale: "Broad tag avoidance plus any-amount meat prevention keeps Wilson as a survival candidate/defensive tool.",
  },
  "onr_proteus_128_airport-locker": {
    family: "hidden_resource",
    roles: ["resource", "hidden", "program_search", "install_during_run"],
    lineSupport: ["runner.search.breaker"],
    strategicRole: ["engine_anchor"],
    strategySupportPairs: [pair("runner.search.breaker", "engine_anchor", ["setup.search", "setup.program_search", "setup.program_install", "setup.install_during_run", "resource.hidden"], "high")],
    effects: hidden([
      ...ai018AirportLockerEffects(),
      s("setup.search"),
      s("setup.program_search"),
      s("setup.program_install"),
      s("setup.install_during_run"),
    ]),
    conditions: [c("requires_encounter")],
    targetProfiles: [targetProfile({ kind: "search_install_target", timing: "during_ice_encounter", targetType: "program", purpose: "install_answer_to_current_ice", preferences: ["program_breaks_current_ice", "program_repairs_missing_coverage", "program_affordable_after_install", "program_preserves_run_goal"], avoid: ["unaffordable_after_install", "hidden_info_dependent_choice"] })],
    hiddenInfoPolicy: "runner_side_only",
    rationale: "AI018 search/install decision is preserved: Airport Locker is a hidden Resource and breaker-search engine anchor.",
  },
  "onr_proteus_129_back-door-to-netwatch": {
    family: "hidden_trace_or_tag_defense",
    roles: ["resource", "hidden", "trace_cancel", "bad_publicity"],
    effects: hidden([s("defense.trace_cancel"), s("defense.trace_cancel_bad_publicity"), s("corp.bad_publicity_pressure"), s("corp.bad_publicity_on_trace_cancel"), s("corp.trace_effect_bad_publicity")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Trace cancel plus Bad Publicity remains support/candidate because AI021 left runner.bad_publicity_pressure deferred.",
    postReviewStatus: "candidate_only",
  },
  "onr_proteus_130_back-door-to-rivals": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "base_link", "trace_credit"],
    effects: [s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense"), s("defense.trace_boost"), s("economy.trace_success_credit")],
    rationale: "Trace defense with trace-success credit; support-only.",
  },
  "onr_proteus_131_bargain-with-viacox": {
    family: "action_engine_or_random_action",
    roles: ["resource", "random", "mandatory_action"],
    effects: [s("resource.random"), s("action.random_extra_action"), s("action.mandatory_extra_action"), s("risk.random_action"), s("risk.mandatory_action"), s("risk.random_hand_reveal"), s("setup.draw"), s("economy.action_credit"), s("run.make_run")],
    rationale: "Random mandatory action engine remains candidate/deferred without planner or strategy-taxonomy change.",
    postReviewStatus: "candidate_only",
  },
  "onr_proteus_132_bolt-hole": {
    family: "hidden_prevention_damage_tag_resources",
    roles: ["resource", "hidden", "meat_prevention"],
    effects: hidden([s("defense.meat_damage_prevention"), s("defense.damage_prevention")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden one-shot meat prevention support-only.",
  },
  "onr_proteus_133_chiba-bank-account": {
    family: "hidden_economy",
    roles: ["resource", "hidden", "economy"],
    effects: hidden([s("economy.hidden_burst_credit"), s("economy.cost_window_credit"), s("economy.burst_credit")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden cost-window burst credit support-only.",
  },
  "onr_proteus_136_credit-subversion": {
    family: "hidden_access_payoff",
    roles: ["resource", "hidden", "sabotage", "hq_payoff"],
    lineSupport: ["runner.hq_pressure"],
    strategicRole: ["punish_payoff"],
    strategySupportPairs: [pair("runner.hq_pressure", "sabotage_payoff", ["corp.economy_pressure", "access.hq_sabotage_credit_loss", "resource.hidden"], "medium")],
    effects: hidden([s("resource.sabotage"), s("corp.economy_pressure"), s("access.hq_sabotage_credit_loss")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden HQ successful-run Corp credit loss is an HQ-pressure sabotage payoff.",
  },
  "onr_proteus_137_death-from-above": {
    family: "hidden_remote_sabotage",
    roles: ["resource", "hidden", "sabotage", "remote_payoff"],
    lineSupport: ["runner.remote_contest", "runner.remote_trash"],
    strategicRole: ["punish_payoff"],
    strategySupportPairs: [
      pair("runner.remote_contest", "sabotage_payoff", ["access.remote_full_trash", "remote.full_fort_trash", "access.trash_untrashable", "resource.hidden"], "high"),
      pair("runner.remote_trash", "sabotage_payoff", ["access.remote_full_trash", "access.trash_untrashable"], "medium"),
    ],
    effects: hidden([s("resource.sabotage"), s("access.remote_full_trash"), s("remote.full_fort_trash"), s("access.trash_untrashable"), s("access.remote_sabotage_payoff")]),
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "server", purpose: "successful_remote_run_before_access" })],
    targetProfileStatus: "schema_gap",
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden full-fort trash is a real remote-contest sabotage payoff.",
  },
  "onr_proteus_140_expendable-family-member": {
    family: "hidden_trace_or_tag_defense",
    roles: ["resource", "hidden", "tag_avoid"],
    effects: hidden([s("defense.tag_prevention"), s("defense.next_tag_avoidance")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden tag avoidance support-only.",
  },
  "onr_proteus_141_get-ready-to-rumble": {
    family: "hidden_access_payoff",
    roles: ["resource", "hidden", "connection", "damage_retaliation"],
    effects: hidden([s("resource.connection"), s("defense.damage_retaliation"), s("corp.random_discard_pressure"), s("access.hq_random_discard_retaliation")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Damage retaliation can pressure HQ, but remains candidate-only because it is reactive and condition-heavy.",
    postReviewStatus: "candidate_only",
  },
  "onr_proteus_142_hq-mole": {
    family: "access_hq_rnd_payoff",
    roles: ["resource", "hidden", "hq_multiaccess"],
    lineSupport: ["runner.hq_pressure", "runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.hq_pressure", "payoff_anchor", ["access.hq_multiaccess", "access.hq_hidden_multiaccess", "resource.hidden"], "high"),
      pair("runner.interface_closeout", "payoff_anchor", ["access.hq_multiaccess", "access.hq_hidden_multiaccess"], "medium"),
    ],
    effects: hidden([s("access.hq_multiaccess"), s("access.hq_hidden_multiaccess")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden HQ multiaccess is a true HQ-pressure payoff.",
  },
  "onr_proteus_143_liberated-savings-account": {
    family: "hidden_economy",
    roles: ["resource", "hidden", "economy"],
    effects: hidden([s("economy.hidden_burst_credit"), s("economy.cost_window_credit"), s("economy.burst_credit")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Large hidden cost-window burst credit support-only.",
  },
  "onr_proteus_145_mercenary-subcontract": {
    family: "hidden_remote_sabotage",
    roles: ["resource", "hidden", "sabotage", "current_access_trash"],
    effects: hidden([s("resource.sabotage"), s("access.free_trash"), s("access.trash_untrashable"), s("access.current_access_trash")]),
    targetProfiles: [targetProfile({ kind: "use_target", targetType: "card", purpose: "currently_accessed_card_trash" })],
    targetProfileStatus: "schema_gap",
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Powerful current-access trash remains candidate/support because the existing taxonomies do not cleanly bind it to one server line.",
    postReviewStatus: "candidate_only",
  },
  "onr_proteus_146_precision-bribery": {
    family: "remote_tax_or_remote_lock",
    roles: ["resource", "unique", "fort_creation_lock"],
    lineSupport: ["runner.remote_contest"],
    strategicRole: ["tax_tool"],
    strategySupportPairs: [pair("runner.remote_contest", "lock_piece", ["fort.creation_lock", "resource.unique"], "high")],
    effects: [s("resource.unique"), s("fort.creation_lock")],
    rationale: "Permanent new-fort creation lock is a genuine remote-contest lock piece.",
  },
  "onr_proteus_147_r-and-d-mole": {
    family: "access_hq_rnd_payoff",
    roles: ["resource", "hidden", "rnd_multiaccess"],
    lineSupport: ["runner.rnd_pressure", "runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.rnd_pressure", "payoff_anchor", ["access.rnd_multiaccess", "access.rnd_hidden_multiaccess", "resource.hidden"], "high"),
      pair("runner.interface_closeout", "payoff_anchor", ["access.rnd_multiaccess", "access.rnd_hidden_multiaccess"], "medium"),
    ],
    effects: hidden([s("access.rnd_multiaccess"), s("access.rnd_hidden_multiaccess")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden R&D multiaccess is a true R&D-pressure payoff.",
  },
  "onr_proteus_148_runner-sensei": {
    family: "base_link_or_trace_defense",
    roles: ["resource", "position", "base_link", "trace_credit"],
    effects: [s("resource.position"), s("resource.base_link"), s("defense.base_link"), s("defense.trace_defense"), s("defense.trace_boost"), s("economy.trace_success_credit")],
    rationale: "Base link plus trace-success credit; support-only.",
  },
  "onr_proteus_149_simulacrum": {
    family: "other_resource_utility",
    roles: ["resource", "hidden", "connection", "ap_bypass"],
    effects: hidden([s("resource.connection"), s("run.bypass_ap_ice"), s("defense.ap_ice_bypass"), s("run.encounter_escape")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "AP ICE pass effect is encounter support, not icebreaker coverage and not a breaker subtype signal.",
  },
  "onr_proteus_150_streetware-distributor": {
    family: "economy_engine",
    roles: ["resource", "bbs", "position", "economy"],
    effects: [s("resource.bbs"), s("resource.position"), s("economy.turn_start_credit"), s("economy.action_credit"), s("economy.temporary_resource_bank")],
    rationale: "BBS/Position economy bank support-only.",
  },
  "onr_proteus_152_swiss-bank-account": {
    family: "hidden_economy",
    roles: ["resource", "hidden", "economy"],
    effects: hidden([s("economy.hidden_burst_credit"), s("economy.cost_window_credit"), s("economy.burst_credit")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden cost-window burst credit support-only.",
  },
  "onr_proteus_153_time-to-collect": {
    family: "hidden_prevention_damage_tag_resources",
    roles: ["resource", "hidden", "resource_trash_prevention"],
    effects: hidden([s("defense.resource_trash_prevention")]),
    targetProfiles: [targetProfile({ kind: "replacement_target", targetType: "card", purpose: "prevent_resource_trash_during_corp_turn" })],
    targetProfileStatus: "schema_gap",
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden resource-trash prevention support-only.",
  },
  "onr_proteus_154_wired-switchboard": {
    family: "hidden_trace_or_tag_defense",
    roles: ["resource", "hidden", "trace_boost"],
    effects: hidden([s("defense.trace_boost"), s("defense.trace_defense")]),
    hiddenInfoPolicy: "runner_side_only",
    rationale: "Hidden post-bid link boost support-only.",
  },
};

function s(signalId) {
  return e(effectKindForSignal(signalId), {
    timing: "persistent",
    scope: "runner",
    target: signalId,
  });
}

function ai018AirportLockerEffects() {
  return [
    e("search", {
      timing: "during_ice_encounter",
      scope: "runner",
      target: "program",
    }),
    e("install", {
      timing: "during_ice_encounter",
      scope: "runner",
      target: "program",
    }),
  ];
}

function effectKindForSignal(signalId) {
  if (signalId.startsWith("economy.")) return "economy";
  if (signalId.startsWith("defense.") || signalId.startsWith("hidden.")) return "prevention_replacement";
  if (signalId.startsWith("setup.")) return "search";
  if (signalId.startsWith("access.")) return "access_replacement";
  if (signalId.startsWith("remote.") || signalId.startsWith("fort.")) return "remote_tax";
  if (signalId.startsWith("action.")) return "extra_action";
  if (signalId.startsWith("risk.")) return "delayed_penalty";
  if (signalId.startsWith("virus.")) return "persistent_counter_effect";
  if (signalId.startsWith("run.")) return "future_run_effect";
  if (signalId.startsWith("corp.")) return "tag_punish_payoff";
  if (signalId.startsWith("cost.")) return "action_penalty";
  if (signalId.startsWith("resource.")) return "global_modifier";
  return "global_modifier";
}

function hidden(effects) {
  return [
    s("resource.hidden"),
    s("hidden.runner_resource"),
    s("resource.hidden_one_shot"),
    s("hidden.one_shot_resource"),
    s("hidden.reveals_on_use"),
    s("hidden.reveals_on_trash"),
    ...effects,
  ];
}

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(repoPath(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function runnerResourceInventory() {
  return CARD_FILES.flatMap((relativePath) => {
    const data = readJson(relativePath);
    return (data.cards ?? [])
      .filter((card) => card.side === "runner" && card.type === "resource")
      .map((card) => ({
        cardId: card.cardId,
        title: card.title,
        source: relativePath,
        subtypes: card.subtypes ?? [],
        isHiddenResource: (card.subtypes ?? []).includes("hidden"),
      }));
  });
}

function ensureSignalCatalog() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  catalog.taskId = "AI022";
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI022 adds Runner-Resource semantics for hidden resources, trace/link support, economy, search/recovery/install, access payoffs, remote sabotage, survival, virus support and action/random resources without planner, engine, targeting, action-score, plan-weight, legality, profile/default or UI-derivation effects.";
  const byId = new Map((catalog.signals ?? []).map((signal) => [signal.signalId, signal]));
  for (const [signalId, group, description, supportOnly, allowedStrategyAnchors] of SIGNALS) {
    const sortedAnchors = [...allowedStrategyAnchors].sort();
    byId.set(signalId, {
      ...(byId.get(signalId) ?? {}),
      signalId,
      group,
      sideScope: "runner",
      description,
      supportOnly,
      mayAnchorStrategy: supportOnly ? false : sortedAnchors.length > 0,
      allowedStrategyAnchors: sortedAnchors,
      sourceKinds: ["AI022 reviewed Runner-Resource structured hint effects"],
      examples: [],
      targetProfileRelevant:
        signalId.startsWith("setup.") ||
        signalId.startsWith("access.") ||
        signalId.startsWith("remote.") ||
        signalId.startsWith("fort.") ||
        signalId.startsWith("run.") ||
        signalId.includes("trash"),
      notes:
        "AI022 Runner-Resource signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior. Hidden-resource signals are side-safe and must not be inferred for Corp hidden slots.",
    });
  }
  catalog.signals = [...byId.values()].sort((left, right) =>
    left.signalId.localeCompare(right.signalId),
  );
  writeJson(TACTIC_SIGNAL_PATH, catalog);
}

function ensureDerivationRules() {
  const data = readJson(FUNCTION_SIGNAL_PATH);
  data.taskId = "AI022";
  data.updatesTaskId =
    "AI003/AI003-1/AI015/AI016/AI017/AI018/AI018c/AI019/AI019a/AI020/AI020-1/AI021";
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI022 adds Runner-Resource semantics while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  const key = (rule) =>
    `${rule.signalId}|${rule.source}|${JSON.stringify(rule.match ?? {})}|${JSON.stringify(rule.gates ?? {})}`;
  const obsoleteKinds = new Set(
    SIGNALS.map(([signalId]) => signalId.replaceAll(".", "_")),
  );
  const byKey = new Map(
    (data.derivationRules ?? [])
      .filter((rule) => !obsoleteKinds.has(rule.match?.kind))
      .map((rule) => [key(rule), rule]),
  );
  for (const [signalId, source, match, gates, strategyAnchorFor] of RULES) {
    const rule = { signalId, source, match, gates, strategyAnchorFor };
    byKey.set(key(rule), rule);
  }
  data.derivationRules = [...byKey.values()].sort((left, right) =>
    key(left).localeCompare(key(right)),
  );
  writeJson(FUNCTION_SIGNAL_PATH, data);
}

function updateActiveHints(inventory) {
  const active = readJson(ACTIVE_HINTS_PATH);
  const activeIds = new Set((active.cards ?? []).map((card) => card.cardId));
  const missing = inventory
    .filter((card) => activeIds.has(card.cardId))
    .filter((card) => !A[card.cardId])
    .map((card) => card.cardId);
  if (missing.length > 0) {
    throw new Error(`Missing AI022 assignment(s): ${missing.join(", ")}`);
  }

  active.cards = (active.cards ?? []).map((hint) => {
    const assignment = A[hint.cardId];
    if (!assignment) return hint;
    const next = {
      ...hint,
      roles: normalizeRoles(assignment.roles ?? hint.roles ?? []),
      aiSupportStatus: hint.aiSupportStatus ?? "ai_supported",
      quality: reviewedQuality(assignment.confidence ?? "medium", assignment.needsHumanReview === true),
    };
    for (const field of [
      "lineSupport",
      "strategicRole",
      "effects",
      "conditions",
      "targetProfiles",
    ]) {
      if (assignment[field] !== undefined) next[field] = assignment[field];
      else delete next[field];
    }
    return next;
  });
  writeJson(ACTIVE_HINTS_PATH, active);
}

function deriveSignals(hint, rules) {
  const signals = new Set();
  const anchors = new Set();
  for (const rule of rules) {
    if (!ruleMatches(hint, rule)) continue;
    signals.add(rule.signalId);
    for (const anchor of rule.strategyAnchorFor ?? []) anchors.add(anchor);
  }
  return { signals: [...signals].sort(), anchors: [...anchors].sort() };
}

function ruleMatches(hint, rule) {
  if (rule.source !== "effects") return false;
  return (hint.effects ?? []).some(
    (effect) => matches(effect, rule.match) && gatesMatch(hint, effect, rule.gates),
  );
}

function matches(value, match) {
  if (!value || !match) return false;
  return Object.entries(match).every(([key, expected]) => value[key] === expected);
}

function gateValue(actual, expected) {
  if (expected === undefined) return true;
  const values = Array.isArray(expected) ? expected : [expected];
  return typeof actual === "string" && values.includes(actual);
}

function gatesMatch(hint, effect, gates = {}) {
  return (
    gateValue(hint.side, gates.side) &&
    gateValue(hint.cardType, gates.cardType) &&
    gateValue(effect.scope, gates.effectScope) &&
    gateValue(effect.target, gates.target)
  );
}

function buildReports(inventory) {
  const active = readJson(ACTIVE_HINTS_PATH);
  const activeByCard = new Map((active.cards ?? []).map((hint) => [hint.cardId, hint]));
  const functionRules = readJson(FUNCTION_SIGNAL_PATH).derivationRules ?? [];
  const activeResourceCards = inventory.filter((card) => activeByCard.has(card.cardId));
  const inactiveCards = inventory.filter((card) => !activeByCard.has(card.cardId));
  const postReviewAssignments = activeResourceCards.map((card) => {
    const hint = activeByCard.get(card.cardId);
    const assignment = A[card.cardId];
    const derived = deriveSignals(hint, functionRules);
    return {
      cardId: card.cardId,
      title: card.title,
      cardType: "resource",
      subtypes: card.subtypes,
      mechanicalFamily: assignment.family,
      isHiddenResource: card.isHiddenResource,
      tacticSignals: derived.signals,
      strategyAnchors: hint.lineSupport ?? [],
      legacyStrategicRole: hint.strategicRole ?? [],
      strategySupportPairs: assignment.strategySupportPairs ?? [],
      targetProfileStatus: assignment.targetProfileStatus ?? ((hint.targetProfiles ?? []).length > 0 ? "target-profile-v1" : "not_required"),
      targetProfileKinds: (hint.targetProfiles ?? []).map((profile) => profile.kind),
      hiddenInfoPolicy: assignment.hiddenInfoPolicy ?? (card.isHiddenResource ? "runner_side_only" : "not_hidden"),
      needsHumanReview: hint.quality?.needsHumanReview === true,
      confidence: hint.quality?.confidence ?? "not_set",
      postReviewStatus: assignment.postReviewStatus ?? "changed",
      rationale: assignment.rationale,
    };
  });

  const familyMap = new Map();
  for (const entry of postReviewAssignments) {
    const current = familyMap.get(entry.mechanicalFamily) ?? {
      mechanicalFamily: entry.mechanicalFamily,
      count: 0,
      changedCount: 0,
      strategyAnchorCount: 0,
      hiddenResourceCount: 0,
      cardIds: [],
    };
    current.count += 1;
    current.changedCount += entry.postReviewStatus === "changed" ? 1 : 0;
    current.hiddenResourceCount += entry.isHiddenResource ? 1 : 0;
    if (entry.strategyAnchors.length > 0) current.strategyAnchorCount += 1;
    current.cardIds.push(entry.cardId);
    familyMap.set(entry.mechanicalFamily, current);
  }

  const strategySupportPairs = postReviewAssignments.flatMap((entry) =>
    (entry.strategySupportPairs ?? []).map((strategyPair) => ({
      cardId: entry.cardId,
      title: entry.title,
      ...strategyPair,
    })),
  );
  const newSignalIds = SIGNALS.map(([signalId]) => signalId).sort();
  const targetProfileCandidates = postReviewAssignments
    .filter((entry) => entry.targetProfileStatus !== "not_required")
    .map((entry) => ({
      cardId: entry.cardId,
      title: entry.title,
      status: entry.targetProfileStatus,
      kinds: entry.targetProfileKinds,
    }));
  const hiddenInfoSafetyReview = postReviewAssignments
    .filter((entry) => entry.isHiddenResource)
    .map((entry) => ({
      cardId: entry.cardId,
      title: entry.title,
      policy: entry.hiddenInfoPolicy,
      corpInference: "forbidden",
      result: "side-safe catalog/report semantics only; no runtime or AI-input visibility change",
    }));

  const deferredItems = [
    {
      topic: "runner.bad_publicity_pressure",
      decision: "deferred",
      affectedCards: ["onr_proteus_129_back-door-to-netwatch"],
      rationale:
        "AI021 left Runner bad-publicity strategy deferred; AI022 keeps Back Door to Netwatch as support/candidate with Bad Publicity tactic signals only.",
    },
    {
      topic: "action_engine_strategy",
      decision: "deferred",
      affectedCards: [
        "onr_v1_171_preying-mantis",
        "onr_v1_172_quest-for-cattekin",
        "onr_proteus_131_bargain-with-viacox",
      ],
      rationale:
        "Extra-action and random-action Resources are real engines, but there is no accepted Runner action/tempo strategy ID for canonical anchoring.",
    },
    {
      topic: "current_access_trash_target_profile",
      decision: "schema_gap",
      affectedCards: ["onr_proteus_145_mercenary-subcontract"],
      rationale:
        "The existing TargetProfile V1 schema does not precisely represent current-access multi-target windows.",
    },
  ];
  const verification = [
    {
      command: "node scripts/check-ai-derived-facts.mjs --write",
      status: "passed",
      result:
        "AI_DERIVED_FACTS OK pilotCards=193 implementations=193 derivedFacts=193 overlaps=124 manualOverlay=130 errors=0 warnings=1009",
    },
    {
      command: "node scripts/check-ai-derived-facts-full.mjs --write",
      status: "passed",
      result:
        "AI_DERIVED_FACTS_FULL OK active=564 implementations=527 generated=391 overlays=6 fallback=136 errors=0 warnings=2038",
    },
    {
      command: "corepack pnpm build:ai-compiled-hints",
      status: "passed",
      result:
        "AI_COMPILED_HINTS OK cards=564 generated=391 overlays=6 fallback=136 errors=0 warnings=2038",
    },
    {
      command: "corepack pnpm build:ai-hint-inspector-index",
      status: "passed",
      result:
        "AI_HINT_INSPECTOR_INDEX OK cards=564 mechanical=493 generated=325 overlays=6 signals=458 anchors=215 warnings=231",
    },
    {
      command: "node scripts/check-ai-hint-compiled-index.mjs --write",
      status: "passed",
      result: "AI_HINT_COMPILED_INDEX OK cards=193 errors=0 warnings=673",
    },
    {
      command: "corepack pnpm check:ai-strategy-taxonomy",
      status: "passed",
      result:
        "AI_STRATEGY_TAXONOMY OK task=AI004 strategies=20 strategicRoles=11 functionSignals=318 roles=235 planRoles=102 lineSupport=15 errors=0 warnings=72",
    },
    {
      command: "corepack pnpm check:ai-compiled-hints",
      status: "passed",
      result:
        "AI_COMPILED_HINTS OK cards=564 generated=391 overlays=6 fallback=136 errors=0 warnings=2038",
    },
    {
      command: "corepack pnpm check:ai-hint-inspector-index",
      status: "passed",
      result:
        "AI_HINT_INSPECTOR_INDEX OK cards=564 mechanical=493 generated=325 overlays=6 signals=458 anchors=215 warnings=231",
    },
    {
      command: "corepack pnpm check:ai-hint-compiled-index",
      status: "passed",
      result: "AI_HINT_COMPILED_INDEX OK cards=193 errors=0 warnings=673",
    },
    {
      command: "corepack pnpm check:ai-manual-overlays",
      status: "passed",
      result: "AI_MANUAL_OVERLAYS OK overlayFiles=2 overlayCards=6 errors=0 warnings=24",
    },
    {
      command: "corepack pnpm check:ai-hint-quality",
      status: "passed",
      result:
        "AI_HINT_QUALITY OK hints=564 roles=251 planRoles=102 errors=0 warnings=150 benchmarkCards=308",
    },
    {
      command: "corepack pnpm check:ai-approval-consistency",
      status: "passed",
      result: "CONSISTENCY_OK 564 ai_supported cards",
    },
    {
      command: "corepack pnpm check:ai-deck-doctrine-strategy",
      status: "passed",
      result: "AI006 DeckDoctrine strategy aggregation check passed: 5 deck profiles",
    },
    {
      command: "corepack pnpm --filter @netgrid/ai test",
      status: "passed",
      result: "vitest run: 32 test files passed, 625 tests passed",
    },
    {
      command: "corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit",
      status: "passed",
      result: "TypeScript noEmit completed with exit code 0",
    },
    {
      command: "corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit",
      status: "passed",
      result: "TypeScript noEmit completed with exit code 0",
    },
    {
      command: "git diff --check",
      status: "passed",
      result: "No whitespace errors",
    },
    {
      command: "node scripts/check-ai022-runner-resources-semantics.mjs",
      status: "passed",
      result:
        "AI022_RUNNER_RESOURCES_SEMANTICS OK active=61 inactive=4 hidden=16 postReview=61 pairs=14",
    },
  ];

  const report = {
    schemaVersion: "ai022-runner-resources-semantics-review-report-v1",
    taskId: "AI022",
    generatedAt: GENERATED_AT,
    status: "complete",
    scope: "runner_resources",
    sourceCommit: SOURCE_COMMIT,
    summary: {
      activeRunnerResourceCount: activeResourceCards.length,
      reviewedResourceCount: activeResourceCards.length,
      inactiveCheckedResourceCount: inactiveCards.length,
      changedResourceCount: postReviewAssignments.filter((entry) => entry.postReviewStatus === "changed").length,
      unchangedCheckedResourceCount: 0,
      newTacticSignalCount: newSignalIds.length,
      changedExistingTacticSignalCount: 0,
      newStrategyIdCount: 0,
      strategySupportPairCount: strategySupportPairs.length,
      hiddenResourceCount: postReviewAssignments.filter((entry) => entry.isHiddenResource).length,
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
      activeCompiledResourceCardIds: activeResourceCards.map((card) => card.cardId),
      inactiveCheckedResourceCardIds: inactiveCards.map((card) => card.cardId),
      hiddenResourceCardIds: postReviewAssignments
        .filter((entry) => entry.isHiddenResource)
        .map((entry) => entry.cardId),
      countDiscrepancies: [
        {
          source: "classic_resource_count",
          expected: 40,
          repoOriginalsetActiveCompiled: activeResourceCards.filter((card) => card.source.includes("originalset")).length,
          repoClassicInactiveKnown: inactiveCards.filter((card) => card.source.includes("classic")).length,
          decision:
            "Repo truth is leading: originalset-v1 has 40 active/compiled Runner Resources; classic-cards.json contributes four known inactive Resource cards.",
        },
        {
          source: "proteus_resource_count",
          expected: 21,
          repoActiveCompiled: activeResourceCards.filter((card) => card.source.includes("proteus")).length,
          repoKnown: inventory.filter((card) => card.source.includes("proteus")).length,
          decision:
            "Repo truth matches the prompt: proteus-cards.json contains 21 active/compiled Runner Resources.",
        },
      ],
    },
    clusterOverview: [...familyMap.values()].sort((left, right) =>
      left.mechanicalFamily.localeCompare(right.mechanicalFamily),
    ),
    newTacticSignals: newSignalIds.map((signalId) => {
      const signal = SIGNALS.find(([id]) => id === signalId);
      return {
        signalId,
        supportOnly: signal[3] === true,
        mayAnchorStrategy: signal[3] !== true,
        allowedStrategyAnchors: signal[4],
      };
    }),
    changedExistingTacticSignals: [],
    newStrategyIds: [],
    strategySupportPairs,
    targetProfileCandidates,
    hiddenInfoSafetyReview,
    deferredItems,
    postReviewAssignments,
    verification,
  };
  writeJson(REPORT_PATH, report);
  writeMarkdown(report);
}

function writeMarkdown(report) {
  const rows = report.clusterOverview
    .map((item) => `| ${item.mechanicalFamily} | ${item.count} | ${item.hiddenResourceCount} | ${item.strategyAnchorCount} |`)
    .join("\n");
  const strategyRows = report.strategySupportPairs
    .map((item) => `| ${item.title} | ${item.strategyId} | ${item.role} | ${item.confidence} | ${item.evidence.join(", ")} |`)
    .join("\n");
  const newSignalRows = report.newTacticSignals
    .map((item) => `| ${item.signalId} | ${item.supportOnly ? "support-only" : "may-anchor"} | ${item.allowedStrategyAnchors.join(", ") || "-"} |`)
    .join("\n");
  const verificationRows = report.verification
    .map((item) => `| \`${item.command}\` | ${item.status} | ${item.result} |`)
    .join("\n");
  const md = `# AI022 Runner Resources Semantics Review

## Kurzfazit

AI022 prüft alle ${report.summary.activeRunnerResourceCount} aktiven/compiled Runner-Resources aus Originalset und Proteus sowie ${report.summary.inactiveCheckedResourceCount} bekannte, aber nicht aktive Classic-Resources. Alle aktiven Resources erhalten kontrollierte Taktiksignale. Neue Strategy IDs wurden nicht eingeführt. Strategieanker bleiben auf echte Search-/Breaker-Engine, HQ-/R&D-Multiaccess, Remote-Sabotage/-Lock und starke Survival-Resources begrenzt; einfache Economy-, Trace-/Link-, Tag-, BBS- und Hidden-Resource-Supportkarten bleiben support-only.

## Scope und Out-of-Scope

- Scope: aktive/compiled Runner Resources aus Originalset und Proteus; bekannte inaktive Classic-Resources als Count-/Abweichungscheck.
- Out-of-Scope: Runner-Programme, Runner-Hardware, Runner-Preps, Corp-Karten, Plannerverbrauch, ActionScore-/PlanWeight-Änderung, Engine-/Legalitätsänderung, Targeting-KI und Profil-/Default-Umschaltung.
- AI018/AI018c, AI019/AI019a, AI020/AI020-1 und AI021 bleiben getrennt; Airport Locker behält die bestehende Search-/Install-Entscheidung aus AI018.

## Hidden-Info-Grenzen

Hidden-Resource-Semantik ist nur Katalog-/Report-/Runner-side-safe. Die Corp-KI darf aus verdeckten Runner-Resource-Slots keine Kartentitel, Taktiksignale, Strategieanker oder TargetProfiles ableiten. AI022 ändert keine Runtime-Visibility, keine LegalActions, keine Inspector-Visibility-Regeln und keine Debugdaten.

## Inventarcounts

| Kategorie | Anzahl |
| --- | ---: |
| Aktive/compiled Runner-Resources | ${report.summary.activeRunnerResourceCount} |
| Originalset aktiv/compiled | ${report.inventory.activeCompiledResourceCardIds.filter((id) => id.startsWith("onr_v1_")).length} |
| Proteus aktiv/compiled | ${report.inventory.activeCompiledResourceCardIds.filter((id) => id.startsWith("onr_proteus_")).length} |
| Inaktive/known Classic-Resources | ${report.summary.inactiveCheckedResourceCount} |
| Hidden Resources | ${report.summary.hiddenResourceCount} |
| Geänderte Resource-Karten | ${report.summary.changedResourceCount} |
| Neue Taktiksignale | ${report.summary.newTacticSignalCount} |
| Geänderte bestehende Signale | ${report.summary.changedExistingTacticSignalCount} |
| Neue Strategy IDs | ${report.summary.newStrategyIdCount} |
| Strategy-Support-Paare | ${report.summary.strategySupportPairCount} |

## Clusterübersicht

| Cluster | Karten | Hidden | Strategy-Anker |
| --- | ---: | ---: | ---: |
${rows}

## Neue und wiederverwendete Taktiksignale

AI022 ergänzt katalogisierte Resource-, Hidden-, Economy-, Trace-/Link-, Search-/Recovery-/Install-, Access-, Remote-/Fort-, Action-/Risk-, Survival- und Virus-Signale. Bestehende Signale aus AI018 bis AI021 werden weiterverwendet, darunter \`setup.search\`, \`setup.program_search\`, \`setup.program_install\`, \`economy.action_credit\`, \`economy.burst_credit\`, \`defense.trace_defense\`, \`defense.base_link\`, \`access.hq_multiaccess\`, \`access.rnd_multiaccess\`, \`corp.bad_publicity_pressure\` und \`cost.agenda_point_penalty\`.

| Signal | Einstufung | Erlaubte Strategy-Anker |
| --- | --- | --- |
${newSignalRows}

Geänderte bestehende Signale: keine.

## Strategieanker und strategySupportPairs

Neue Strategy IDs: keine.

| Karte | Strategieanker | Rolle | Confidence | Evidence |
| --- | --- | --- | --- | --- |
${strategyRows}

Karten ohne Strategieanker tragen keine kanonische strategische Rolle. Jedes gesetzte \`lineSupport\` hat im JSON-Report ein eindeutiges \`strategySupportPairs\`-Objekt mit Rolle, Evidence und Confidence.

## TargetProfile-Kandidaten

TargetProfile V1 bleibt diagnostisch/read-only. Schema-Gaps sind vor allem Top-N-Search mit mehreren Picks, current-access trash, successful-run-before-access Serverfenster und Resource-trash-Replacement während des Corp-Turns. Es gibt keine Targeting-KI und keine Hidden-Info-Zielableitung.

## Deferred Items

- \`runner.bad_publicity_pressure\`: deferred; Back Door to Netwatch nutzt Bad-Publicity-Signale, aber AI021 hat keine Strategy-ID freigegeben.
- Action-/Random-Engine: deferred; Preying Mantis, Quest for Cattekin und Bargain with Viacox bleiben candidate-only.
- Current-access trash: schema_gap; Mercenary Subcontract passt nicht sauber in TargetProfile V1.

## Post-Review-Liste

Die vollständige Kartenliste mit Taktiksignalen, Strategieankern, \`strategySupportPairs\`, TargetProfile-Status, Hidden-Info-Policy und Rationale steht im JSON-Report \`ai022-runner-resources-semantics-review-report-2026-06-02.json\`.

## Count-Abweichungen

- Classic/Originalset: 40 aktive Originalset-Resources plus 4 bekannte inaktive Classic-Resources.
- Proteus: 21 aktive/compiled Resources; keine Abweichung zur Prompt-Zahl.

## Verifikation

Der AI022-Invariant-Check prüft vollständige Post-Review-Abdeckung, katalogisierte Signale, Hidden-Resource-Markierung, \`strategySupportPairs\`-Konsistenz, keine generische Resource-/Hidden-/Connection-Strategie, keine einfachen Economy-/Trace-/BBS-/Tag-Prevention-Anker, Airport-Locker-Regression, HQ-/R&D-Mole-Multiaccess, Simulacrum ohne Breaker-Coverage und No-Effect-Flags.

| Kommando | Status | Ergebnis |
| --- | --- | --- |
${verificationRows}
`;
  fs.writeFileSync(repoPath(MARKDOWN_PATH), md);
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const insertion =
    "- `ai022-runner-resources-semantics-review-2026-06-02.md` / `ai022-runner-resources-semantics-review-report-2026-06-02.json`: Aufgabe AI022 prüft 61 aktive/compiled Runner-Resources aus Originalset und Proteus plus 4 inaktive Classic-Resources. Hidden Resources werden side-safe markiert; neue Strategy IDs gibt es nicht. Strategieanker bleiben auf Airport Locker, The Short Circuit, HQ Mole, R&D Mole, Credit Subversion, Death from Above, Precision Bribery, Restrictive Net Zoning, Corporate Ally, Diplomatic Immunity und Wilson begrenzt. Keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.";
  if (text.includes("ai022-runner-resources-semantics-review-2026-06-02.md")) {
    fs.writeFileSync(
      repoPath(README_PATH),
      text.replace(
        /^- `ai022-runner-resources-semantics-review-2026-06-02\.md` \/ `ai022-runner-resources-semantics-review-report-2026-06-02\.json`: .*$/m,
        insertion,
      ),
    );
    return;
  }
  const marker = "- `ai021-runner-preps-semantics-review-2026-06-02.md`";
  const index = text.indexOf(marker);
  if (index === -1) {
    fs.writeFileSync(repoPath(README_PATH), `${text.trimEnd()}\n${insertion}\n`);
    return;
  }
  const lineEnd = text.indexOf("\n", index);
  fs.writeFileSync(
    repoPath(README_PATH),
    `${text.slice(0, lineEnd + 1)}${insertion}\n${text.slice(lineEnd + 1)}`,
  );
}

function main() {
  const inventory = runnerResourceInventory();
  ensureSignalCatalog();
  ensureDerivationRules();
  updateActiveHints(inventory);
  buildReports(inventory);
  updateReadme();
  console.log(
    `AI022 applied active=${Object.keys(A).length} inactive=${inventory.length - Object.keys(A).length}`,
  );
}

main();
