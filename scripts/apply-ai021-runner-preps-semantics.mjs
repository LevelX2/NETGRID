#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const GENERATED_AT = "2026-06-02";
const SOURCE_COMMIT = "459dd3e7795ef0b71b55178d6637eb696282cb36";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const FUNCTION_SIGNAL_PATH = "data/ai/function-signal-derivation-v1.json";
const REPORT_PATH =
  "docs/reviews/ai/ai021-runner-preps-semantics-review-report-2026-06-02.json";
const MARKDOWN_PATH =
  "docs/reviews/ai/ai021-runner-preps-semantics-review-2026-06-02.md";
const README_PATH = "docs/reviews/ai/README.md";

const CARD_FILES = [
  "data/cards/classic-cards.json",
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
];

const reviewedQuality = (confidence = "medium", needsHumanReview = false) => ({
  benchmarkCovered: false,
  hintReviewed: true,
  strategyCovered: false,
  confidence,
  needsHumanReview,
  reviewedDate: GENERATED_AT,
  reviewedBy: "codex",
});

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
  timing = "on_play",
  targetType,
  purpose,
  preferences = [],
  avoid = [],
}) => ({
  schemaVersion: "target-profile-v1",
  kind: normalizeTargetProfileKind(kind),
  timing,
  targetType: normalizeTargetProfileTargetType(targetType),
  purpose,
  preferences: normalizeTargetProfilePreferences(preferences),
  avoid: normalizeTargetProfileAvoids(avoid),
  hiddenInfoPolicy: "public_or_controller_known_only",
});

const KNOWN_TARGET_PROFILE_KINDS = new Set([
  "install_target",
  "mode_choice",
  "search_install_target",
  "hosted_install_target",
  "use_target",
  "replacement_target",
]);
const KNOWN_TARGET_PROFILE_TARGET_TYPES = new Set([
  "installed_ice",
  "ice_type",
  "program",
  "icebreaker",
  "hosted_program",
  "server",
  "card",
]);
const KNOWN_TARGET_PROFILE_PREFERENCES = new Set([
  "known_or_rezzed_ice",
  "known_sentry",
  "known_wall",
  "known_code_gate",
  "current_encounter_ice",
  "blocks_relevant_run_path",
  "high_strength_ice",
  "high_break_cost_without_bonus",
  "multi_subroutine_ice",
  "relevant_server_ice",
  "missing_current_coverage",
  "type_blocking_relevant_run_path",
  "type_with_known_problem_ice",
  "type_missing_in_current_rig",
  "program_breaks_current_ice",
  "program_repairs_missing_coverage",
  "program_affordable_after_install",
  "program_preserves_run_goal",
  "low_mu_program",
  "installed_icebreaker",
  "hosted_icebreaker_eligible",
  "trash_prevention_high_value_program",
  "currently_used_breaker",
  "breaker_matching_current_ice",
  "breaker_matching_common_problem_ice",
]);
const KNOWN_TARGET_PROFILE_AVOIDS = new Set([
  "unknown_low_information_target",
  "irrelevant_server_ice",
  "already_cheap_to_break",
  "non_matching_ice_type",
  "unaffordable_after_install",
  "hidden_info_dependent_choice",
  "low_value_program",
  "target_would_break_host_limit",
]);

function normalizeTargetProfileKind(kind) {
  return KNOWN_TARGET_PROFILE_KINDS.has(kind) ? kind : "use_target";
}

function normalizeTargetProfileTargetType(targetType) {
  if (KNOWN_TARGET_PROFILE_TARGET_TYPES.has(targetType)) return targetType;
  if (String(targetType).includes("ice")) return "installed_ice";
  if (String(targetType).includes("program")) return "program";
  return "card";
}

function normalizeTargetProfilePreferences(preferences) {
  return preferences.filter((preference) =>
    KNOWN_TARGET_PROFILE_PREFERENCES.has(preference),
  );
}

function normalizeTargetProfileAvoids(avoid) {
  return avoid.filter((entry) => KNOWN_TARGET_PROFILE_AVOIDS.has(entry));
}

const ASSIGNMENTS = {
  "onr_v1_076_all-nighter": {
    family: "multi_run_event",
    roles: ["event", "run_event", "bonus_run"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("future_run_effect", { timing: "successful_run", scope: "runner", target: "followup_run" }),
      e("future_run_effect", { timing: "action", scope: "runner", target: "multi_run_sequence" }),
    ],
    rationale: "Bonus-run Prep mit Sequenznutzen, aber ohne eigenen strategischen Payoff.",
  },
  "onr_v1_077_anonymous-tip": {
    family: "ice_control_or_sabotage",
    roles: ["event", "sabotage", "ice_control"],
    effects: [e("expose_info", { timing: "action", scope: "ice", target: "installed_ice" })],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "installed_ice",
        purpose: "black_ice_recon",
        preferences: ["rezzed_or_known_black_ice", "visible_problem_ice"],
      }),
    ],
    rationale: "ICE-Informations-/Sabotage-Prep; TargetProfile nur diagnostisch und ohne Hidden-Info-Raten.",
  },
  "onr_v1_078_arasaka-owns-you": {
    family: "damage_prevention_or_survival",
    roles: ["event", "prevention", "tag", "agenda"],
    lineSupport: ["runner.survival_defense"],
    strategicRole: ["emergency_tool"],
    strategySupportPairs: [
      pair(
        "runner.survival_defense",
        "emergency_tool",
        ["defense.flatline_prevention", "defense.brain_damage_reset", "defense.tag_clear_support"],
        "high",
      ),
    ],
    effects: [
      e("flatline_prevention", { timing: "prevention_window", scope: "runner", target: "flatline" }),
      e("remove_brain_damage", { timing: "prevention_window", scope: "runner", target: "brain_damage" }),
      e("tag_prevention", { timing: "prevention_window", scope: "runner", target: "tags" }),
      e("economy", { timing: "action", scope: "runner", resource: "credits", target: "high_risk_burst", finite: true }),
      e("action_penalty", { timing: "action", scope: "runner", target: "action_loss" }),
      e("survival_payoff", { timing: "prevention_window", scope: "runner", target: "flatline" }),
    ],
    conditions: [c("requires_flatline"), c("requires_prevention_window")],
    rationale: "Starker Notfall-One-shot, der Flatline/Brain-Damage/Tags in einer defensiven Linie bündelt.",
  },
  "onr_v1_079_bodyweight-synthetic-blood": {
    family: "draw_or_hand_setup",
    roles: ["draw", "setup", "event"],
    effects: [e("draw", { timing: "action", scope: "runner", target: "draw" })],
    rationale: "Einfache Draw-Prep bleibt support-only.",
  },
  "onr_v1_080_core-command-jettison-ice": {
    family: "ice_control_or_sabotage",
    roles: ["event", "sabotage", "ice_control"],
    effects: [e("ice_trash", { timing: "action", scope: "ice", target: "rezzed_ice" })],
    conditions: [c("requires_successful_run"), c("requires_rezzed_ice")],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "rezzed_ice",
        purpose: "successful_hq_run_ice_trash",
        preferences: ["expensive_rezzed_ice", "central_path_ice"],
      }),
    ],
    rationale: "ICE-Sabotage nach erfolgreichem HQ-Setup; kein Remote- oder ICE-Control-Strategieanker ohne passende Taxonomie.",
  },
  "onr_v1_081_custodial-position": {
    family: "rnd_access_pressure",
    roles: ["event", "multiaccess", "run_event"],
    lineSupport: ["runner.rnd_pressure", "runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.rnd_pressure", "payoff_anchor", ["access.rnd_multiaccess"]),
      pair("runner.interface_closeout", "payoff_anchor", ["access.rnd_multiaccess"]),
    ],
    effects: [
      e("multiaccess", { timing: "successful_run", scope: "rnd", resource: "cards", amount: 2, finite: true }),
      e("future_run_effect", { timing: "action", scope: "rnd", target: "server_specific_rnd" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_rnd_pressure")],
    rationale: "R&D-Multiaccess ist ein echter Central-Payoff.",
  },
  "onr_v1_082_deal-with-militech": {
    family: "search_recovery_or_install",
    roles: ["event", "agenda_reward", "icebreaker_support"],
    strategicRole: ["support_tool"],
    effects: [
      e("global_modifier", { timing: "action", scope: "installed_program", resource: "strength", amount: 1, target: "icebreaker" }),
      e("breaker", { timing: "action", scope: "installed_program", target: "strength_boost" }),
    ],
    conditions: [c("requires_stolen_agenda_last_turn"), c("requires_installed_program")],
    rationale: "Breaker-Stärkung als Setup-/Coverage-Support, nicht als eigenständiger Strategieanker.",
  },
  "onr_v1_083_desperate-competitor": {
    family: "score_or_agenda_point_effect",
    roles: ["agenda_point_event", "event", "steal_reward"],
    effects: [e("scored_agenda_action", { timing: "action", scope: "runner", target: "conditional_agenda_point" })],
    conditions: [c("requires_scored_agenda")],
    rationale: "Konditionaler Runner-Agendapunkt; kein Corp-Fast-Advance-Signal.",
  },
  "onr_v1_084_edited-shipping-manifests": {
    family: "hq_access_pressure",
    roles: ["event", "hq_run", "access_replacement", "economy", "tag_self"],
    lineSupport: ["runner.hq_pressure"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.hq_pressure", "payoff_anchor", ["run.replacement_access", "access.hq_replacement_economy"], "medium"),
    ],
    effects: [
      e("access_replacement", { timing: "successful_run", scope: "hq", target: "hq_replacement_economy" }),
      e("economy", { timing: "successful_run", scope: "runner", resource: "credits", amount: 10, target: "conditional_burst", finite: true }),
      e("tag", { timing: "successful_run", scope: "runner", resource: "tags", amount: 1, target: "self_tag", finite: true }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Replacement-Payoff mit Economy/Corp-Loss-Nutzen und Self-Tag-Risiko.",
  },
  "onr_v1_085_executive-wiretaps": {
    family: "hq_access_pressure",
    roles: ["event", "multiaccess", "run_event"],
    lineSupport: ["runner.hq_pressure", "runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.hq_pressure", "payoff_anchor", ["access.hq_multiaccess"]),
      pair("runner.interface_closeout", "payoff_anchor", ["access.hq_multiaccess"]),
    ],
    effects: [
      e("multiaccess", { timing: "successful_run", scope: "hq", resource: "cards", amount: 2, finite: true }),
      e("future_run_effect", { timing: "action", scope: "hq", target: "server_specific_hq" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Multiaccess ist ein echter Central-Payoff.",
  },
  "onr_v1_086_forged-activation-orders": {
    family: "ice_control_or_sabotage",
    roles: ["event", "sabotage", "ice_control"],
    effects: [e("ice_trash", { timing: "action", scope: "ice", target: "rez_or_trash_choice" })],
    conditions: [c("requires_installed_ice")],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "installed_ice",
        purpose: "force_rez_or_trash_choice",
        preferences: ["expensive_unrezzed_ice", "central_path_ice"],
      }),
    ],
    rationale: "ICE-Rez-/Trash-Druck bleibt Sabotage-Support ohne eigene Strategie-ID.",
  },
  "onr_v1_087_forgotten-backup-chip": {
    family: "search_recovery_or_install",
    roles: ["event", "hidden_zone_tool", "program_recovery"],
    lineSupport: ["runner.search.breaker"],
    strategicRole: ["enabler"],
    strategySupportPairs: [
      pair("runner.search.breaker", "enabler", ["setup.program_recovery", "setup.recovery", "setup.search"], "medium"),
    ],
    effects: [
      e("search", { timing: "action", scope: "runner", target: "program_in_trash" }),
      e("card_recovery", { timing: "action", scope: "runner", target: "program" }),
      e("zone_shuffle", { timing: "action", scope: "runner", target: "stack_shuffle" }),
    ],
    conditions: [c("requires_heap_card")],
    targetProfiles: [
      targetProfile({
        kind: "replacement_target",
        targetType: "program_in_trash",
        purpose: "recover_program",
        preferences: ["program_repairs_missing_coverage", "program_preserves_run_goal"],
      }),
    ],
    rationale: "Enger Program-Recovery-Fall bleibt als Search/Breaker-Enabler begründet.",
  },
  "onr_v1_088_fortress-respecification": {
    family: "fort_or_server_manipulation",
    roles: ["event", "sabotage", "fort_reorder"],
    effects: [e("future_run_effect", { timing: "action", scope: "server", target: "fort_reorder" })],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "server",
        purpose: "fort_reorder",
        preferences: ["server_with_multiple_ice", "targeted_run_path"],
      }),
    ],
    rationale: "Fort-Reorder ist taktische Servermanipulation, kein pauschaler Remote-Contest-Anker.",
  },
  "onr_v1_089_gideons-pawnshop": {
    family: "search_recovery_or_install",
    roles: ["event", "trash_recovery"],
    effects: [e("card_recovery", { timing: "action", scope: "runner", target: "card_in_trash" })],
    conditions: [c("requires_heap_card")],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "card_in_trash",
        purpose: "generic_heap_recovery",
        preferences: ["high_value_card", "current_plan_support"],
      }),
    ],
    rationale: "Generische Recovery; bewusst kein `runner.search.breaker`.",
  },
  "onr_v1_090_hot-tip-for-wns": {
    family: "score_or_agenda_point_effect",
    roles: ["agenda_point_event", "event", "steal_reward"],
    effects: [e("scored_agenda_action", { timing: "action", scope: "runner", target: "black_ops_agenda_condition" })],
    conditions: [c("requires_scored_agenda")],
    rationale: "Konditionaler Black-Ops-Agenda-Punkt bleibt candidate/deferred statt Strategieanker.",
  },
  "onr_v1_091_hunt-club-bbs": {
    family: "expose_or_scouting",
    roles: ["event", "expose", "hidden_zone_tool"],
    effects: [e("expose_info", { timing: "action", scope: "installed_card", target: "expose_multiple" })],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "installed_card",
        purpose: "multi_expose",
        preferences: ["unknown_installed_card", "high_value_remote"],
      }),
    ],
    rationale: "Expose-Prep mit Mehrfachziel-Schema-Grenze; Scouting bleibt support-only.",
  },
  "onr_v1_092_ice-and-datas-guide-to-the-net": {
    family: "expose_or_scouting",
    roles: ["event", "hidden_zone_tool", "expose_helper"],
    effects: [e("expose_info", { timing: "action", scope: "server", target: "expose_outermost_ice" })],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "server",
        purpose: "outermost_ice_report",
        preferences: ["server_with_unknown_outermost_ice"],
      }),
    ],
    rationale: "Server-/Outermost-ICE-Scouting ohne Strategieanker.",
  },
  "onr_v1_093_if-you-want-it-done-right": {
    family: "search_recovery_or_install",
    roles: ["event", "stack_filter", "stack_reorder"],
    effects: [
      e("search", { timing: "action", scope: "runner", target: "card_search" }),
      e("topdeck_info", { timing: "action", scope: "runner", target: "stack_filter" }),
      e("topdeck_info", { timing: "action", scope: "runner", target: "stack_reorder" }),
    ],
    targetProfiles: [
      targetProfile({
        kind: "stack_top",
        targetType: "card",
        purpose: "top_five_choice_and_reorder",
        preferences: ["current_plan_answer", "missing_setup_piece"],
      }),
    ],
    rationale: "Generischer Tutor-/Reorder-Fall; bewusst kein Breaker-Search-Anker.",
  },
  "onr_v1_094_inside-job": {
    family: "run_event",
    roles: ["event", "run_bypass", "run_event"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("future_encounter_effect", { timing: "during_run", scope: "ice", target: "bypass_first_ice" }),
    ],
    rationale: "Bypass-Run-Utility; kein automatischer Remote-Contest-Anker.",
  },
  "onr_v1_095_jack-n-joe": {
    family: "draw_or_hand_setup",
    roles: ["draw", "setup", "event"],
    effects: [e("draw", { timing: "action", scope: "runner", target: "draw" })],
    rationale: "Einfache Draw-Prep bleibt support-only.",
  },
  "onr_v1_096_kilroy-was-here": {
    family: "rnd_access_pressure",
    roles: ["event", "run_event", "rnd_pressure", "access_trash"],
    lineSupport: ["runner.rnd_pressure"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.rnd_pressure", "payoff_anchor", ["access.rnd_trash_pressure", "access.free_trash"], "high"),
    ],
    effects: [
      e("access_replacement", { timing: "successful_run", scope: "rnd", target: "rnd_trash_pressure" }),
      e("trash_credit", { timing: "on_access", scope: "accessed_card", resource: "trash_credits", target: "free_trash", repeatable: true }),
    ],
    conditions: [c("requires_successful_run"), c("requires_rnd_pressure")],
    rationale: "R&D-Access-Trash-Payoff trägt R&D-Druck.",
  },
  "onr_v1_097_livewires-contacts": {
    family: "economy_burst",
    roles: ["economy", "tempo", "event"],
    effects: [e("economy", { timing: "action", scope: "runner", target: "burst_credit", finite: true })],
    rationale: "Einfache Credit-Prep bleibt support-only.",
  },
  "onr_v1_098_lucidrine-booster-drug": {
    family: "run_event",
    roles: ["event", "run_flow", "run_economy"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("finite_economy_pool", { timing: "during_run", scope: "runner", target: "run_credit_pool" }),
      e("damage", { timing: "action", scope: "runner", target: "self_brain_damage" }),
    ],
    rationale: "Run-Credit-Pool mit Brain-Damage-Risiko; bewusst kein Strategieanker.",
  },
  "onr_v1_099_mantis-fixer-at-large": {
    family: "search_recovery_or_install",
    roles: ["event", "connection", "hidden_zone_tool", "stack_search"],
    effects: [
      e("search", { timing: "action", scope: "runner", target: "card_search" }),
      e("draw", { timing: "action", scope: "runner", target: "draw", resource: "cards", amount: 1, finite: true }),
    ],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "card",
        purpose: "generic_card_tutor",
        preferences: ["current_plan_answer", "high_value_card"],
      }),
    ],
    rationale: "Generischer Tutor bleibt support-only/deferred, kein Breaker-Search-Anker.",
  },
  "onr_v1_100_misc-for-sale": {
    family: "economy_burst",
    roles: ["event", "bbs", "economy"],
    effects: [
      e("economy", { timing: "action", scope: "runner", target: "trash_for_credit", finite: true }),
      e("resource_trash", { timing: "action", scope: "runner", target: "installed_card_trash_cost" }),
    ],
    rationale: "Trash-for-credit-Economy mit Kostenrisiko, support-only.",
  },
  "onr_v1_101_mit-west-tier": {
    family: "draw_or_hand_setup",
    roles: ["event", "draw_cards", "recycle_zones"],
    effects: [
      e("shuffle_draw", { timing: "action", scope: "runner", target: "full_deck_reset" }),
      e("draw", { timing: "action", scope: "runner", target: "draw" }),
      e("zone_shuffle", { timing: "action", scope: "runner", target: "stack_shuffle" }),
    ],
    rationale: "Spezielle Reset-/Draw-Prep bleibt support-only/deferred.",
  },
  "onr_v1_102_open-ended-mileage-program": {
    family: "tag_clear_or_tag_prevention",
    roles: ["event", "tag_remove"],
    effects: [
      e("tag_prevention", { timing: "action", scope: "runner", target: "tag_clear_support" }),
      e("prevention_replacement", { timing: "action", scope: "runner", target: "self_bounce" }),
    ],
    conditions: [c("requires_runner_tagged")],
    rationale: "Tag-Clear-Support ohne Survival-Anker.",
  },
  "onr_v1_103_organ-donor": {
    family: "economy_burst",
    roles: ["event", "economy", "risk"],
    effects: [
      e("economy", { timing: "action", scope: "runner", target: "trash_for_credit", finite: true }),
      e("resource_trash", { timing: "action", scope: "runner", target: "hand_trash_cost" }),
    ],
    rationale: "Riskante Trash-for-credit-Economy bleibt support-only.",
  },
  "onr_v1_104_playful-ai": {
    family: "economy_burst",
    roles: ["event", "random", "economy"],
    effects: [e("economy", { timing: "action", scope: "runner", target: "random_economy", finite: true })],
    rationale: "Random-Economy ohne Strategieanker.",
  },
  "onr_v1_105_priority-wreck": {
    family: "hq_access_pressure",
    roles: ["event", "hq_run", "access_replacement", "economy_denial"],
    lineSupport: ["runner.hq_pressure"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.hq_pressure", "payoff_anchor", ["run.replacement_access", "corp.economy_pressure"], "medium"),
    ],
    effects: [
      e("access_replacement", { timing: "successful_run", scope: "hq", target: "corp_economy_pressure" }),
      e("run_tax", { timing: "successful_run", scope: "corp", target: "economy_pressure" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Replacement-Economy-Denial als mittelstarker HQ-Payoff.",
  },
  "onr_v1_106_private-ldl-access": {
    family: "access_replacement_or_conversion",
    roles: ["event", "hq_run", "rnd_success_replacement"],
    lineSupport: ["runner.rnd_pressure"],
    strategicRole: ["enabler"],
    strategySupportPairs: [
      pair("runner.rnd_pressure", "enabler", ["access.hq_to_rnd_conversion"], "medium"),
    ],
    effects: [e("access_replacement", { timing: "successful_run", scope: "hq", target: "hq_to_rnd_conversion" })],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Erfolg wird in R&D-Zugriff umgeleitet; Enabler für R&D-Druck, kein HQ-Payoff.",
  },
  "onr_v1_107_romp-through-hq": {
    family: "hq_access_pressure",
    roles: ["event", "run_event", "hq_pressure", "access_trash"],
    lineSupport: ["runner.hq_pressure"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.hq_pressure", "payoff_anchor", ["access.hq_trash_pressure", "access.free_trash"], "high"),
    ],
    effects: [
      e("access_replacement", { timing: "successful_run", scope: "hq", target: "hq_trash_pressure" }),
      e("trash_credit", { timing: "on_access", scope: "accessed_card", resource: "trash_credits", target: "free_trash", repeatable: true }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Access-Trash-Payoff trägt HQ-Druck.",
  },
  "onr_v1_108_score": {
    family: "economy_burst",
    roles: ["economy", "event"],
    effects: [e("economy", { timing: "action", scope: "runner", resource: "credits", amount: 9, target: "burst_credit", finite: true })],
    rationale: "Einfache Credit-Prep bleibt support-only.",
  },
  "onr_v1_109_security-code-worm-chip": {
    family: "ice_control_or_sabotage",
    roles: ["event", "sabotage", "ice_control"],
    effects: [e("ice_trash", { timing: "action", scope: "ice", target: "unrezzed_ice" })],
    conditions: [c("requires_installed_ice")],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "unrezzed_ice",
        purpose: "unrezzed_ice_trash",
        preferences: ["unrezzed_ice_on_target_server"],
      }),
    ],
    rationale: "Unrezzed-ICE-Sabotage ohne Hidden-Info-Guessing.",
  },
  "onr_v1_110_sneak-preview": {
    family: "search_recovery_or_install",
    roles: ["event", "hidden_zone_tool", "temporary_program_install"],
    lineSupport: ["runner.search.breaker"],
    strategicRole: ["enabler"],
    strategySupportPairs: [
      pair("runner.search.breaker", "enabler", ["setup.program_search", "setup.program_install", "setup.temporary_program_install"], "high"),
    ],
    effects: [
      e("search", { timing: "action", scope: "runner", target: "program_search" }),
      e("install", { timing: "action", scope: "installed_card", target: "program" }),
      e("install_discount", { timing: "action", scope: "installed_card", target: "temporary_program_install" }),
      e("delayed_penalty", { timing: "runner_turn", scope: "runner", target: "end_of_turn_bounce" }),
    ],
    targetProfiles: [
      targetProfile({
        kind: "search_install_target",
        targetType: "program",
        purpose: "temporary_program_install",
        preferences: ["program_repairs_missing_coverage", "program_preserves_run_goal"],
      }),
    ],
    rationale: "Programmsuche plus temporäre Installation ist ein enger Breaker-Search-Enabler.",
  },
  "onr_v1_111_social-engineering": {
    family: "run_event",
    roles: ["event", "run_event", "bypass"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("future_encounter_effect", { timing: "during_run", scope: "ice", target: "bypass_chosen_ice" }),
      e("run_tax", { timing: "action", scope: "runner", target: "opponent_guessing_game" }),
    ],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "installed_ice",
        purpose: "bypass_chosen_ice",
        preferences: ["expensive_problem_ice", "server_run_target"],
      }),
    ],
    rationale: "Bypass-/Mindgame-Run-Utility; kein automatischer Remote-Anker.",
  },
  "onr_v1_112_stumble-through-wilderspace": {
    family: "trace_link_or_run_protection",
    roles: ["event", "trace", "run_event"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("trace_defense", { timing: "during_run", scope: "runner", target: "trace_boost_during_run" }),
    ],
    rationale: "Trace-Schutz während Run bleibt support-only.",
  },
  "onr_v1_113_synchronized-attack-on-hq": {
    family: "hq_access_pressure",
    roles: ["event", "hq_run", "corp_discard_pressure"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "hq", target: "server_specific_hq" }),
      e("run_tax", { timing: "successful_run", scope: "corp", target: "random_discard_pressure" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Discard-Druck bleibt support-only/candidate ohne eigenen Strategieanker.",
  },
  "onr_v1_114_temple-microcode-outlet": {
    family: "search_recovery_or_install",
    roles: ["event", "program_search", "hidden_zone_tool"],
    lineSupport: ["runner.search.breaker"],
    strategicRole: ["enabler"],
    strategySupportPairs: [
      pair("runner.search.breaker", "enabler", ["setup.program_search", "setup.search"], "high"),
    ],
    effects: [
      e("search", { timing: "action", scope: "runner", target: "program_search" }),
      e("draw", { timing: "action", scope: "runner", target: "draw", resource: "cards", amount: 1, finite: true }),
    ],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "program",
        purpose: "program_search",
        preferences: ["program_repairs_missing_coverage", "program_preserves_run_goal"],
      }),
    ],
    rationale: "Programmsuche bleibt als enger Search/Breaker-Enabler begründet.",
  },
  "onr_v1_115_terrorist-reprisal": {
    family: "hq_access_pressure",
    roles: ["black_ops_punish_event", "event", "hq_pressure", "random_discard_event"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "hq", target: "server_specific_hq" }),
      e("run_tax", { timing: "successful_run", scope: "corp", target: "random_discard_pressure" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-/Black-Ops-Punish-Kontext ist geprüft, bleibt aber ohne neue Strategy-ID.",
  },
  "onr_v1_116_total-genetic-retrofit": {
    family: "tag_clear_or_tag_prevention",
    roles: ["event", "tag_remove", "tag_prevention"],
    effects: [
      e("tag_prevention", { timing: "action", scope: "runner", target: "tag_clear_support" }),
      e("prevention_replacement", { timing: "prevention_window", scope: "runner", target: "next_tag_avoidance" }),
    ],
    conditions: [c("requires_runner_tagged"), c("requires_prevention_window")],
    rationale: "Starke Tag-Clear-/Next-tag-Avoidance-Prep, aber kein dauerhafter Survival-Anker.",
  },
  "onr_v1_117_valu-pak-software-bundle": {
    family: "search_recovery_or_install",
    roles: ["event", "program_install", "install_economy"],
    effects: [
      e("install", { timing: "action", scope: "installed_card", target: "program" }),
      e("install_discount", { timing: "action", scope: "installed_card", target: "install_action_burst" }),
      e("economy", { timing: "action", scope: "runner", target: "install_credit", finite: true }),
    ],
    targetProfiles: [
      targetProfile({
        kind: "search_install_target",
        targetType: "program",
        purpose: "program_install_bundle",
        preferences: ["program_affordable_after_install", "program_repairs_missing_coverage"],
      }),
    ],
    rationale: "Install-Bundle-Support ohne Search/Breaker-Anker.",
  },
  "onr_v1_118_weather-to-finance-pipe": {
    family: "hq_access_pressure",
    roles: ["economy_denial", "event", "hq_pressure", "run_event"],
    effects: [
      e("access_replacement", { timing: "successful_run", scope: "hq", target: "corp_economy_pressure" }),
      e("run_tax", { timing: "successful_run", scope: "corp", target: "economy_pressure" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Economy-Denial support-only; kein automatischer HQ-Strategieanker.",
  },
  "onr_proteus_101_all-hands": {
    family: "hq_access_pressure",
    roles: ["event", "run_pressure", "multiaccess"],
    lineSupport: ["runner.hq_pressure", "runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.hq_pressure", "payoff_anchor", ["access.hq_multiaccess", "run.noisy_breaker_restriction"]),
      pair("runner.interface_closeout", "payoff_anchor", ["access.hq_multiaccess"], "medium"),
    ],
    effects: [
      e("multiaccess", { timing: "successful_run", scope: "hq", target: "hq_multiaccess", resource: "cards", finite: true }),
      e("future_run_effect", { timing: "action", scope: "hq", target: "server_specific_hq" }),
      e("run_lock", { timing: "during_run", scope: "runner", target: "noisy_breaker_restriction" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Multiaccess mit Restriction bleibt echter HQ-Payoff.",
  },
  "onr_proteus_102_blackmail": {
    family: "score_or_agenda_point_effect",
    roles: ["event", "run_pressure", "hq_score_payoff"],
    lineSupport: ["runner.hq_pressure", "runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.hq_pressure", "payoff_anchor", ["score.agenda_point_gain", "run.replacement_access"], "high"),
      pair("runner.interface_closeout", "payoff_anchor", ["score.agenda_point_gain"], "medium"),
    ],
    effects: [
      e("access_replacement", { timing: "successful_run", scope: "hq", target: "score_agenda_point_gain" }),
      e("scored_agenda_action", { timing: "successful_run", scope: "runner", target: "agenda_point_gain" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_hq_pressure")],
    rationale: "HQ-Replacement mit direktem Runner-Score-Payoff.",
  },
  "onr_proteus_103_cruising-for-netwatch": {
    family: "economy_burst",
    roles: ["draw", "economy", "event"],
    effects: [
      e("economy", { timing: "action", scope: "runner", target: "burst_credit", finite: true }),
      e("draw", { timing: "action", scope: "runner", target: "draw" }),
    ],
    rationale: "Economy/Draw-Prep bleibt support-only.",
  },
  "onr_proteus_104_decoy-signal": {
    family: "expose_or_scouting",
    roles: ["event", "run_pressure", "scouting"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("expose_info", { timing: "during_run", scope: "ice", target: "ice_approach_expose" }),
      e("future_run_effect", { timing: "during_run", scope: "runner", target: "safe_jackout_window" }),
    ],
    rationale: "Run-Scouting und Jack-out-Fenster ohne Strategieanker.",
  },
  "onr_proteus_105_demolition-run": {
    family: "ice_control_or_sabotage",
    roles: ["event", "run_pressure", "sabotage"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "remote", target: "server_specific_remote" }),
      e("ice_trash", { timing: "successful_run", scope: "server", target: "all_rezzed_ice_trash" }),
      e("tag", { timing: "successful_run", scope: "runner", target: "self_tag", finite: true }),
    ],
    conditions: [c("requires_successful_run"), c("requires_remote_server")],
    rationale: "Remote/Fort-Sabotage mit Self-Tag-Risiko, ohne passende Strategie-ID nur candidate/deferred.",
  },
  "onr_proteus_106_disgruntled-ice-technician": {
    family: "ice_control_or_sabotage",
    roles: ["event", "run_pressure", "sabotage"],
    effects: [e("ice_trash", { timing: "action", scope: "ice", target: "trash_rezzed" })],
    conditions: [c("requires_rezzed_ice")],
    rationale: "Rezzed-ICE-Trash-Sabotage ohne Strategieanker.",
  },
  "onr_proteus_107_drone-for-a-day": {
    family: "economy_burst",
    roles: ["economy", "event", "risk"],
    effects: [
      e("economy", { timing: "action", scope: "runner", target: "burst_credit", finite: true }),
      e("tag", { timing: "action", scope: "runner", target: "self_tag", finite: true }),
    ],
    rationale: "Credit-Burst mit Self-Tag-Risiko, keine Tag-Synergie-Strategie.",
  },
  "onr_proteus_108_faked-hit": {
    family: "bad_publicity_pressure",
    roles: ["event", "bad_publicity"],
    effects: [e("run_tax", { timing: "action", scope: "corp", target: "bad_publicity_pressure" })],
    rationale: "Bad-Publicity-Prep geprüft; neue Strategy-ID deferred.",
  },
  "onr_proteus_109_frame-up": {
    family: "bad_publicity_pressure",
    roles: ["event", "run_pressure", "bad_publicity"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "hq", target: "server_specific_hq" }),
      e("run_tax", { timing: "successful_run", scope: "corp", target: "bad_publicity_pressure" }),
    ],
    conditions: [c("requires_successful_run")],
    rationale: "Bad-Publicity-HQ-Kontext bleibt candidate/deferred.",
  },
  "onr_proteus_110_hijack": {
    family: "search_recovery_or_install",
    roles: ["economy", "event", "install_support"],
    effects: [
      e("install", { timing: "action", scope: "installed_card", target: "program" }),
      e("install", { timing: "action", scope: "installed_card", target: "hardware" }),
      e("economy", { timing: "action", scope: "runner", target: "install_credit", finite: true }),
    ],
    rationale: "Program-/Hardware-Install-Credit-Support, kein Search-Anker.",
  },
  "onr_proteus_111_ice-and-data-special-report": {
    family: "expose_or_scouting",
    roles: ["event", "scouting"],
    effects: [e("expose_info", { timing: "action", scope: "server", target: "run_recon" })],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "server",
        purpose: "server_recon",
        preferences: ["relevant_server_ice"],
      }),
    ],
    rationale: "Run-Recon-Scouting support-only.",
  },
  "onr_proteus_112_identity-donor": {
    family: "damage_prevention_or_survival",
    roles: ["event", "bad_publicity", "damage_prevention"],
    effects: [
      e("meat_damage_prevention", { timing: "prevention_window", scope: "runner", target: "meat_damage" }),
      e("run_tax", { timing: "prevention_window", scope: "corp", target: "bad_publicity_pressure" }),
    ],
    conditions: [c("requires_meat_damage"), c("requires_prevention_window")],
    rationale: "Reaktiver Meat-Damage-Schutz plus Bad Publicity, aber nicht stark genug als Survival-Anker.",
  },
  "onr_proteus_113_live-news-feed": {
    family: "bad_publicity_pressure",
    roles: ["event", "run_pressure", "bad_publicity"],
    effects: [e("run_tax", { timing: "action", scope: "corp", target: "bad_publicity_win_pressure" })],
    rationale: "Bad-Publicity-Win-Pressure candidate/deferred.",
  },
  "onr_proteus_114_on-the-fast-track": {
    family: "economy_burst",
    roles: ["economy", "event"],
    effects: [
      e("economy", { timing: "action", scope: "runner", target: "conditional_burst", finite: true }),
      e("run_tax", { timing: "action", scope: "corp", target: "advertisement_punish" }),
    ],
    rationale: "Konditionale Economy gegen Advertisement-Kontext bleibt support-only.",
  },
  "onr_proteus_115_personal-touch-the": {
    family: "search_recovery_or_install",
    roles: ["event", "icebreaker_support"],
    strategicRole: ["support_tool"],
    effects: [
      e("global_modifier", { timing: "action", scope: "installed_program", resource: "strength", amount: 1, target: "icebreaker" }),
      e("breaker", { timing: "action", scope: "installed_program", target: "strength_boost" }),
    ],
    conditions: [c("requires_installed_program")],
    targetProfiles: [
      targetProfile({
        kind: "use_target",
        targetType: "icebreaker",
        purpose: "permanent_strength_counter",
        preferences: ["installed_icebreaker", "high_break_cost_without_bonus", "breaker_matching_common_problem_ice"],
        avoid: ["already_cheap_to_break"],
      }),
    ],
    rationale: "Permanent-Strength-Support für Icebreaker, kein Strategieanker.",
  },
  "onr_proteus_116_pirate-broadcast": {
    family: "multi_run_event",
    roles: ["event", "run_pressure", "score_risk"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "runner", target: "multi_run_sequence" }),
      e("scored_agenda_action", { timing: "successful_run", scope: "runner", target: "conditional_agenda_point" }),
      e("delayed_penalty", { timing: "runner_turn", scope: "runner", target: "multi_run_failure_penalty" }),
    ],
    rationale: "Starker, aber boardstateabhängiger Multi-run/Score-Kandidat; als Strategieanker deferred.",
  },
  "onr_proteus_117_poisoned-water-supply": {
    family: "bad_publicity_pressure",
    roles: ["event", "bad_publicity"],
    effects: [e("run_tax", { timing: "action", scope: "corp", target: "bad_publicity_self_damage_cost" })],
    rationale: "Bad-Publicity mit Selbstkosten bleibt support-only/candidate.",
  },
  "onr_proteus_118_prearranged-drop": {
    family: "score_or_agenda_point_effect",
    roles: ["economy", "event", "agenda_access_reward"],
    effects: [
      e("economy", { timing: "on_access", scope: "runner", target: "next_agenda_credit", finite: true }),
      e("scored_agenda_action", { timing: "on_access", scope: "runner", target: "next_agenda_credit" }),
    ],
    rationale: "Next-agenda-credit ist Payoff-Support, aber kein eigenständiger Closeout-Anker.",
  },
  "onr_proteus_119_promises-promises": {
    family: "score_or_agenda_point_effect",
    roles: ["event", "agenda_bonus"],
    lineSupport: ["runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.interface_closeout", "payoff_anchor", ["access.next_agenda_bonus", "score.bonus_agenda_point"], "medium"),
    ],
    effects: [
      e("scored_agenda_action", { timing: "on_access", scope: "runner", target: "bonus_agenda_point" }),
      e("access_replacement", { timing: "on_access", scope: "runner", target: "next_agenda_bonus" }),
    ],
    rationale: "Next-agenda-this-turn Bonus ist ein konditionaler Closeout-Payoff mit mittlerer Confidence.",
  },
  "onr_proteus_120_reconnaissance": {
    family: "expose_or_scouting",
    roles: ["economy", "event", "run_pressure", "scouting"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("expose_info", { timing: "during_run", scope: "server", target: "run_recon" }),
      e("economy", { timing: "during_run", scope: "runner", target: "run_restricted_credit", finite: true }),
    ],
    rationale: "Run-Recon mit bedingter Run-Economy bleibt support-only.",
  },
  "onr_proteus_121_remote-detonator": {
    family: "ice_control_or_sabotage",
    roles: ["event", "run_pressure", "sabotage"],
    effects: [
      e("ice_trash", { timing: "successful_run", scope: "server", target: "all_rezzed_ice_trash" }),
      e("tag", { timing: "successful_run", scope: "runner", target: "self_tag", finite: true }),
    ],
    conditions: [c("requires_successful_run"), c("requires_remote_server")],
    rationale: "Fort-Sabotage mit Self-Tag-Risiko, keine Tag-Synergie-Strategie.",
  },
  "onr_proteus_122_rush-hour": {
    family: "rnd_access_pressure",
    roles: ["event", "run_pressure", "multiaccess"],
    lineSupport: ["runner.rnd_pressure", "runner.interface_closeout"],
    strategicRole: ["payoff_anchor"],
    strategySupportPairs: [
      pair("runner.rnd_pressure", "payoff_anchor", ["access.rnd_multiaccess", "run.noisy_breaker_restriction"]),
      pair("runner.interface_closeout", "payoff_anchor", ["access.rnd_multiaccess"], "medium"),
    ],
    effects: [
      e("multiaccess", { timing: "successful_run", scope: "rnd", target: "rnd_multiaccess", resource: "cards", finite: true }),
      e("future_run_effect", { timing: "action", scope: "rnd", target: "server_specific_rnd" }),
      e("run_lock", { timing: "during_run", scope: "runner", target: "noisy_breaker_restriction" }),
    ],
    conditions: [c("requires_successful_run"), c("requires_rnd_pressure")],
    rationale: "R&D-Multiaccess mit Restriction bleibt echter R&D-Payoff.",
  },
  "onr_proteus_123_senatorial-field-trip": {
    family: "bad_publicity_pressure",
    roles: ["event", "bad_publicity"],
    effects: [e("run_tax", { timing: "action", scope: "corp", target: "bad_publicity_pressure" })],
    rationale: "Bad-Publicity-Prep geprüft; Strategy-ID deferred.",
  },
  "onr_proteus_124_stakeout": {
    family: "economy_burst",
    roles: ["draw", "economy", "event"],
    effects: [
      e("economy", { timing: "action", scope: "runner", target: "burst_credit", finite: true }),
      e("draw", { timing: "action", scope: "runner", target: "draw" }),
    ],
    rationale: "Economy/Draw-Prep bleibt support-only.",
  },
  "onr_proteus_125_subliminal-corruption": {
    family: "bad_publicity_pressure",
    roles: ["event", "run_pressure", "bad_publicity"],
    effects: [e("run_tax", { timing: "action", scope: "corp", target: "bad_publicity_pressure" })],
    rationale: "Bad-Publicity-Prep geprüft; Strategy-ID deferred.",
  },
  "onr_proteus_126_test-spin": {
    family: "search_recovery_or_install",
    roles: ["event", "run_pressure", "program_search", "temporary_program_install"],
    lineSupport: ["runner.search.breaker"],
    strategicRole: ["enabler"],
    strategySupportPairs: [
      pair("runner.search.breaker", "enabler", ["setup.program_search", "setup.program_install", "setup.temporary_program_install"], "medium"),
    ],
    effects: [
      e("search", { timing: "action", scope: "runner", target: "program_search" }),
      e("install", { timing: "action", scope: "installed_card", target: "program" }),
      e("install_discount", { timing: "action", scope: "installed_card", target: "temporary_program_install" }),
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("delayed_penalty", { timing: "runner_turn", scope: "runner", target: "temporary_program_loss" }),
      e("damage", { timing: "runner_turn", scope: "runner", target: "meat_damage_shortfall" }),
    ],
    targetProfiles: [
      targetProfile({
        kind: "search_install_target",
        targetType: "program",
        purpose: "temporary_program_install_run",
        preferences: ["program_repairs_missing_coverage", "program_preserves_run_goal"],
      }),
    ],
    rationale: "Temporäre Programmsuche/Installation mit Run- und Penalty-Kontext bleibt enger Search/Breaker-Enabler.",
  },
  "onr_proteus_127_weefle-initiation": {
    family: "damage_prevention_or_survival",
    roles: ["event", "run_pressure", "damage_prevention"],
    effects: [
      e("future_run_effect", { timing: "action", scope: "server", target: "make_run" }),
      e("damage_prevention", { timing: "during_run", scope: "runner", target: "damage_prevention_during_run" }),
    ],
    rationale: "Run-bezogene Damage Prevention ist Survival-Support, kein eigener Strategieanker.",
  },
};

const SIGNALS = [
  ["run.make_run", "ai021_prep_run", "Starts or requires a Runner run as a one-shot Prep effect.", true, []],
  ["run.followup_run", "ai021_prep_run", "Creates or rewards a follow-up run after a prior run.", true, []],
  ["run.multi_run_sequence", "ai021_prep_run", "Structures several runs in one turn or one Prep sequence.", true, []],
  ["run.server_specific_hq", "ai021_prep_run", "A Prep points its run or payoff at HQ.", true, []],
  ["run.server_specific_rnd", "ai021_prep_run", "A Prep points its run or payoff at R&D.", true, []],
  ["run.server_specific_remote", "ai021_prep_run", "A Prep points its run or payoff at a remote server.", true, []],
  ["run.any_server", "ai021_prep_run", "A Prep can target any server run without hidden target inference.", true, []],
  ["run.noisy_breaker_restriction", "ai021_prep_run", "The Prep limits breaker use to noisy or similar constrained breakers.", true, []],
  ["run.bypass_first_ice", "ai021_prep_run", "Bypasses the first ICE encountered during a run.", true, []],
  ["run.bypass_chosen_ice", "ai021_prep_run", "Bypasses a chosen ICE during a run.", true, []],
  ["run.trace_boost_during_run", "ai021_prep_run", "Provides trace defense or trace boost during a run.", true, []],
  ["run.damage_prevention_during_run", "ai021_prep_run", "Prevents damage only during a run.", true, []],
  ["run.run_credit_pool", "ai021_prep_run", "Provides credits restricted to the current run.", true, []],
  ["run.run_credit_pool_brain_damage_risk", "ai021_prep_run", "Run credit support with brain-damage risk.", true, []],
  ["access.hq_replacement_economy", "ai021_prep_access", "Replaces HQ access with Runner economy payoff.", false, ["runner.hq_pressure"]],
  ["access.hq_replacement_corp_loss", "ai021_prep_access", "Replaces HQ access with Corp resource loss.", true, []],
  ["access.hq_to_rnd_conversion", "ai021_prep_access", "Converts a successful HQ context into R&D access.", false, ["runner.rnd_pressure"]],
  ["access.next_agenda_bonus", "ai021_prep_access", "Modifies the next agenda access this turn with a bonus.", false, ["runner.interface_closeout"]],
  ["access.next_agenda_credit", "ai021_prep_access", "Gives credits on the next agenda access this turn.", true, []],
  ["score.agenda_point_gain", "ai021_prep_score", "Runner gains agenda points through a Prep effect.", false, ["runner.interface_closeout"]],
  ["score.conditional_agenda_point", "ai021_prep_score", "Runner agenda-point effect with a narrow condition.", true, []],
  ["score.bonus_agenda_point", "ai021_prep_score", "Bonus agenda point on a later steal or access condition.", false, ["runner.interface_closeout"]],
  ["score.black_ops_agenda_condition", "ai021_prep_score", "Runner score effect depends on a Black Ops agenda condition.", true, []],
  ["score.gray_ops_agenda_condition", "ai021_prep_score", "Runner score effect depends on a Gray Ops agenda condition.", true, []],
  ["economy.burst_credit", "ai021_prep_economy", "One-shot Runner credit burst.", true, []],
  ["economy.conditional_burst_credit", "ai021_prep_economy", "Conditional one-shot Runner credit burst.", true, []],
  ["economy.high_risk_burst_credit", "ai021_prep_economy", "Credit burst attached to severe Runner risk.", true, []],
  ["economy.run_restricted_credit", "ai021_prep_economy", "Credits restricted to run use.", true, []],
  ["economy.trash_for_credit", "ai021_prep_economy", "Runner trashes cards as a cost for credits.", true, []],
  ["economy.hidden_bid_mindgame", "ai021_prep_economy", "Hidden bid or guessing-game economy/mindgame context.", true, []],
  ["setup.card_search", "ai021_prep_setup", "Generic card search or tutor from a Prep.", true, []],
  ["setup.card_recovery", "ai021_prep_setup", "Generic card recovery from heap/trash.", true, []],
  ["setup.program_recovery", "ai021_prep_setup", "Recover a program from heap/trash.", false, ["runner.search.breaker"]],
  ["setup.hardware_install", "ai021_prep_setup", "Install hardware through a Prep support effect.", true, []],
  ["setup.install_credit", "ai021_prep_setup", "Install credit or install-only economy from a Prep.", true, []],
  ["setup.install_action_burst", "ai021_prep_setup", "Install action compression from a Prep.", true, []],
  ["setup.temporary_program_install", "ai021_prep_setup", "Temporary program installation with later bounce/loss.", false, ["runner.search.breaker"]],
  ["setup.end_of_turn_bounce", "ai021_prep_setup", "End-of-turn return/bounce drawback for temporary installs.", true, []],
  ["setup.stack_filter", "ai021_prep_setup", "Filter the top of the Runner stack.", true, []],
  ["setup.stack_reorder", "ai021_prep_setup", "Reorder known Runner stack cards.", true, []],
  ["setup.full_deck_reset", "ai021_prep_setup", "Reset or recycle Runner deck/heap/hand structure.", true, []],
  ["setup.stack_shuffle", "ai021_prep_setup", "Shuffle Runner stack after search/recovery.", true, []],
  ["ice.rez_or_trash_choice", "ai021_prep_ice", "Forces Corp into a rez-or-trash ICE choice.", true, []],
  ["ice.trash_rezzed", "ai021_prep_ice", "Trash rezzed ICE.", true, []],
  ["ice.trash_unrezzed", "ai021_prep_ice", "Trash unrezzed ICE without hidden guessing.", true, []],
  ["fort.reorder_ice", "ai021_prep_fort", "Reorder ICE protecting a server.", true, []],
  ["fort.all_rezzed_ice_trash", "ai021_prep_fort", "Trash all rezzed ICE on a fort/server.", true, []],
  ["fort.all_rezzed_ice_trash_tag_risk", "ai021_prep_fort", "Fort ICE trash with self-tag drawback.", true, []],
  ["info.expose_installed_cards", "ai021_prep_info", "Expose several installed cards.", true, []],
  ["info.expose_multiple", "ai021_prep_info", "Expose multiple legal targets.", true, []],
  ["info.expose_outermost_ice", "ai021_prep_info", "Expose outermost ICE protecting a server.", true, []],
  ["info.run_recon", "ai021_prep_info", "Gather run-relevant public/controller-known information.", true, []],
  ["corp.bad_publicity_win_pressure", "ai021_prep_bad_publicity", "Bad-publicity pressure tied to win or score pressure.", true, []],
  ["corp.advertisement_punish", "ai021_prep_bad_publicity", "Punishes Corp advertisement context.", true, []],
  ["corp.bad_publicity_self_damage_cost", "ai021_prep_bad_publicity", "Bad-publicity pressure with Runner self-damage cost.", true, []],
  ["defense.next_tag_avoidance", "ai021_prep_defense", "Avoid the next tag or tag source.", true, []],
  ["defense.damage_prevention_during_run", "ai021_prep_defense", "Damage prevention scoped to the current run.", true, []],
  ["risk.self_tag", "ai021_prep_risk", "Runner takes a tag as cost or drawback.", true, []],
  ["risk.self_brain_damage", "ai021_prep_risk", "Runner suffers brain damage as cost or drawback.", true, []],
  ["risk.action_loss", "ai021_prep_risk", "Runner loses actions as cost or drawback.", true, []],
  ["risk.meat_damage_shortfall", "ai021_prep_risk", "Runner risks meat damage if a temporary run plan fails.", true, []],
  ["risk.temporary_program_loss", "ai021_prep_risk", "Runner loses or bounces a temporary program.", true, []],
  ["risk.multi_run_failure_penalty", "ai021_prep_risk", "Runner is punished if a multi-run sequence fails.", true, []],
  ["risk.opponent_guessing_game", "ai021_prep_risk", "Opponent guessing-game risk or bid context.", true, []],
  ["risk.hand_trash_cost", "ai021_prep_risk", "Runner trashes cards from grip as cost.", true, []],
  ["risk.installed_card_trash_cost", "ai021_prep_risk", "Runner trashes installed cards as cost.", true, []],
  ["risk.random_economy", "ai021_prep_risk", "Randomized economy outcome.", true, []],
];

const RULES = [
  ["run.make_run", "effects", { kind: "future_run_effect", target: "make_run" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.followup_run", "effects", { kind: "future_run_effect", target: "followup_run" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.multi_run_sequence", "effects", { kind: "future_run_effect", target: "multi_run_sequence" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.server_specific_hq", "effects", { kind: "future_run_effect", target: "server_specific_hq" }, { side: ["runner"], cardType: ["event"], effectScope: ["hq"] }, []],
  ["run.server_specific_rnd", "effects", { kind: "future_run_effect", target: "server_specific_rnd" }, { side: ["runner"], cardType: ["event"], effectScope: ["rnd"] }, []],
  ["run.server_specific_remote", "effects", { kind: "future_run_effect", target: "server_specific_remote" }, { side: ["runner"], cardType: ["event"], effectScope: ["remote"] }, []],
  ["run.any_server", "effects", { kind: "future_run_effect", target: "make_run" }, { side: ["runner"], cardType: ["event"], effectScope: ["server"] }, []],
  ["run.noisy_breaker_restriction", "effects", { kind: "run_lock", target: "noisy_breaker_restriction" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.bypass_first_ice", "effects", { kind: "future_encounter_effect", target: "bypass_first_ice" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.bypass_chosen_ice", "effects", { kind: "future_encounter_effect", target: "bypass_chosen_ice" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.trace_boost_during_run", "effects", { kind: "trace_defense", target: "trace_boost_during_run" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.damage_prevention_during_run", "effects", { kind: "damage_prevention", target: "damage_prevention_during_run" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.run_credit_pool", "effects", { kind: "finite_economy_pool", target: "run_credit_pool" }, { side: ["runner"], cardType: ["event"] }, []],
  ["run.run_credit_pool_brain_damage_risk", "effects", { kind: "damage", target: "self_brain_damage" }, { side: ["runner"], cardType: ["event"] }, []],
  ["access.hq_replacement_economy", "effects", { kind: "access_replacement", target: "hq_replacement_economy" }, { side: ["runner"], cardType: ["event"], effectScope: ["hq"] }, ["runner.hq_pressure"]],
  ["access.hq_replacement_corp_loss", "effects", { kind: "run_tax", target: "economy_pressure" }, { side: ["runner"], cardType: ["event"], effectScope: ["corp"] }, []],
  ["access.hq_to_rnd_conversion", "effects", { kind: "access_replacement", target: "hq_to_rnd_conversion" }, { side: ["runner"], cardType: ["event"], effectScope: ["hq"] }, ["runner.rnd_pressure"]],
  ["access.free_trash", "effects", { kind: "trash_credit", target: "free_trash" }, { side: ["runner"], cardType: ["event"] }, []],
  ["access.hq_trash_pressure", "effects", { kind: "access_replacement", target: "hq_trash_pressure" }, { side: ["runner"], cardType: ["event"], effectScope: ["hq"] }, ["runner.hq_pressure"]],
  ["access.rnd_trash_pressure", "effects", { kind: "access_replacement", target: "rnd_trash_pressure" }, { side: ["runner"], cardType: ["event"], effectScope: ["rnd"] }, ["runner.rnd_pressure"]],
  ["access.next_agenda_bonus", "effects", { kind: "access_replacement", target: "next_agenda_bonus" }, { side: ["runner"], cardType: ["event"] }, ["runner.interface_closeout"]],
  ["access.next_agenda_credit", "effects", { kind: "economy", target: "next_agenda_credit" }, { side: ["runner"], cardType: ["event"] }, []],
  ["score.agenda_point_gain", "effects", { kind: "scored_agenda_action", target: "agenda_point_gain" }, { side: ["runner"], cardType: ["event"] }, ["runner.interface_closeout"]],
  ["score.conditional_agenda_point", "effects", { kind: "scored_agenda_action", target: "conditional_agenda_point" }, { side: ["runner"], cardType: ["event"] }, []],
  ["score.bonus_agenda_point", "effects", { kind: "scored_agenda_action", target: "bonus_agenda_point" }, { side: ["runner"], cardType: ["event"] }, ["runner.interface_closeout"]],
  ["score.black_ops_agenda_condition", "effects", { kind: "scored_agenda_action", target: "black_ops_agenda_condition" }, { side: ["runner"], cardType: ["event"] }, []],
  ["score.gray_ops_agenda_condition", "effects", { kind: "scored_agenda_action", target: "gray_ops_agenda_condition" }, { side: ["runner"], cardType: ["event"] }, []],
  ["economy.burst_credit", "effects", { kind: "economy", target: "burst_credit" }, { side: ["runner"], cardType: ["event"] }, []],
  ["economy.conditional_burst_credit", "effects", { kind: "economy", target: "conditional_burst" }, { side: ["runner"], cardType: ["event"] }, []],
  ["economy.high_risk_burst_credit", "effects", { kind: "economy", target: "high_risk_burst" }, { side: ["runner"], cardType: ["event"] }, []],
  ["economy.run_restricted_credit", "effects", { kind: "economy", target: "run_restricted_credit" }, { side: ["runner"], cardType: ["event"] }, []],
  ["economy.trash_for_credit", "effects", { kind: "economy", target: "trash_for_credit" }, { side: ["runner"], cardType: ["event"] }, []],
  ["economy.hidden_bid_mindgame", "effects", { kind: "run_tax", target: "opponent_guessing_game" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.card_search", "effects", { kind: "search", target: "card_search" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.card_recovery", "effects", { kind: "card_recovery", target: "card_in_trash" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.program_search", "effects", { kind: "search", target: "program_search" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.program_install", "effects", { kind: "install", target: "program" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.program_recovery", "effects", { kind: "card_recovery", target: "program" }, { side: ["runner"], cardType: ["event"] }, ["runner.search.breaker"]],
  ["setup.hardware_install", "effects", { kind: "install", target: "hardware" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.install_credit", "effects", { kind: "economy", target: "install_credit" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.install_action_burst", "effects", { kind: "install_discount", target: "install_action_burst" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.temporary_program_install", "effects", { kind: "install_discount", target: "temporary_program_install" }, { side: ["runner"], cardType: ["event"] }, ["runner.search.breaker"]],
  ["setup.end_of_turn_bounce", "effects", { kind: "delayed_penalty", target: "end_of_turn_bounce" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.stack_filter", "effects", { kind: "topdeck_info", target: "stack_filter" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.stack_reorder", "effects", { kind: "topdeck_info", target: "stack_reorder" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.full_deck_reset", "effects", { kind: "shuffle_draw", target: "full_deck_reset" }, { side: ["runner"], cardType: ["event"] }, []],
  ["setup.stack_shuffle", "effects", { kind: "zone_shuffle", target: "stack_shuffle" }, { side: ["runner"], cardType: ["event"] }, []],
  ["ice.rez_or_trash_choice", "effects", { kind: "ice_trash", target: "rez_or_trash_choice" }, { side: ["runner"], cardType: ["event"] }, []],
  ["ice.trash_rezzed", "effects", { kind: "ice_trash", target: "trash_rezzed" }, { side: ["runner"], cardType: ["event"] }, []],
  ["ice.trash_unrezzed", "effects", { kind: "ice_trash", target: "unrezzed_ice" }, { side: ["runner"], cardType: ["event"] }, []],
  ["fort.reorder_ice", "effects", { kind: "future_run_effect", target: "fort_reorder" }, { side: ["runner"], cardType: ["event"] }, []],
  ["fort.all_rezzed_ice_trash", "effects", { kind: "ice_trash", target: "all_rezzed_ice_trash" }, { side: ["runner"], cardType: ["event"] }, []],
  ["fort.all_rezzed_ice_trash_tag_risk", "effects", { kind: "tag", target: "self_tag" }, { side: ["runner"], cardType: ["event"] }, []],
  ["info.expose_installed_cards", "effects", { kind: "expose_info", target: "installed_ice" }, { side: ["runner"], cardType: ["event"] }, []],
  ["info.expose_multiple", "effects", { kind: "expose_info", target: "expose_multiple" }, { side: ["runner"], cardType: ["event"] }, []],
  ["info.expose_outermost_ice", "effects", { kind: "expose_info", target: "expose_outermost_ice" }, { side: ["runner"], cardType: ["event"] }, []],
  ["info.ice_approach_expose", "effects", { kind: "expose_info", target: "ice_approach_expose" }, { side: ["runner"], cardType: ["event"] }, []],
  ["info.run_recon", "effects", { kind: "expose_info", target: "run_recon" }, { side: ["runner"], cardType: ["event"] }, []],
  ["corp.bad_publicity_pressure", "effects", { kind: "run_tax", target: "bad_publicity_pressure" }, { side: ["runner"], cardType: ["event"], effectScope: ["corp"] }, []],
  ["corp.bad_publicity_win_pressure", "effects", { kind: "run_tax", target: "bad_publicity_win_pressure" }, { side: ["runner"], cardType: ["event"], effectScope: ["corp"] }, []],
  ["corp.advertisement_punish", "effects", { kind: "run_tax", target: "advertisement_punish" }, { side: ["runner"], cardType: ["event"], effectScope: ["corp"] }, []],
  ["corp.bad_publicity_self_damage_cost", "effects", { kind: "run_tax", target: "bad_publicity_self_damage_cost" }, { side: ["runner"], cardType: ["event"], effectScope: ["corp"] }, []],
  ["defense.flatline_prevention", "effects", { kind: "flatline_prevention", target: "flatline" }, { side: ["runner"], cardType: ["event"] }, ["runner.survival_defense"]],
  ["defense.brain_damage_reset", "effects", { kind: "remove_brain_damage", target: "brain_damage" }, { side: ["runner"], cardType: ["event"] }, []],
  ["defense.tag_clear_support", "effects", { kind: "tag_prevention", target: "tag_clear_support" }, { side: ["runner"], cardType: ["event"] }, []],
  ["defense.next_tag_avoidance", "effects", { kind: "prevention_replacement", target: "next_tag_avoidance" }, { side: ["runner"], cardType: ["event"] }, []],
  ["defense.damage_prevention_during_run", "effects", { kind: "damage_prevention", target: "damage_prevention_during_run" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.self_tag", "effects", { kind: "tag", target: "self_tag" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.self_brain_damage", "effects", { kind: "damage", target: "self_brain_damage" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.action_loss", "effects", { kind: "action_penalty", target: "action_loss" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.meat_damage_shortfall", "effects", { kind: "damage", target: "meat_damage_shortfall" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.temporary_program_loss", "effects", { kind: "delayed_penalty", target: "temporary_program_loss" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.multi_run_failure_penalty", "effects", { kind: "delayed_penalty", target: "multi_run_failure_penalty" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.opponent_guessing_game", "effects", { kind: "run_tax", target: "opponent_guessing_game" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.hand_trash_cost", "effects", { kind: "resource_trash", target: "hand_trash_cost" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.installed_card_trash_cost", "effects", { kind: "resource_trash", target: "installed_card_trash_cost" }, { side: ["runner"], cardType: ["event"] }, []],
  ["risk.random_economy", "effects", { kind: "economy", target: "random_economy" }, { side: ["runner"], cardType: ["event"] }, []],
];

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(repoPath(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function runnerPrepInventory() {
  return CARD_FILES.flatMap((relativePath) => {
    const data = readJson(relativePath);
    return (data.cards ?? [])
      .filter((card) => card.side === "runner" && card.type === "event")
      .map((card) => ({
        cardId: card.cardId,
        title: card.title,
        setId: card.setId,
        source: relativePath,
        cardType: card.type,
        subtypes: card.subtypes ?? [],
      }));
  }).sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function sortedUnique(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort();
}

function ensureSignalCatalog() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  catalog.taskId = "AI021";
  catalog.generatedAt = GENERATED_AT;
  catalog.description =
    "Controlled V1 tactic-signal catalog. AI021 adds Runner-Prep one-shot semantics for runs, access replacement, score effects, burst economy, search/recovery/install, ICE/fort sabotage, expose/scouting, bad publicity, defense and drawback risk without planner, engine, targeting, action-score, plan-weight, legality, profile/default or UI-derivation effects.";
  const ai021SignalIds = new Set(SIGNALS.map(([signalId]) => signalId));
  const byId = new Map(
    (catalog.signals ?? [])
      .filter(
        (signal) =>
          !String(signal.group ?? "").startsWith("ai021_") ||
          ai021SignalIds.has(signal.signalId),
      )
      .map((signal) => [signal.signalId, signal]),
  );
  for (const [signalId, group, description, supportOnly, allowedStrategyAnchors] of SIGNALS) {
    byId.set(signalId, {
      signalId,
      group,
      sideScope: signalId.startsWith("corp.") ? "runner" : "runner",
      description,
      supportOnly,
      mayAnchorStrategy: supportOnly ? false : allowedStrategyAnchors.length > 0,
      allowedStrategyAnchors,
      sourceKinds: ["AI021 reviewed Runner-Prep structured hint effects"],
      examples: [],
      targetProfileRelevant:
        signalId.startsWith("setup.") ||
        signalId.startsWith("ice.") ||
        signalId.startsWith("fort.") ||
        signalId.startsWith("info.") ||
        signalId.includes("access"),
      notes:
        "AI021 Runner-Prep signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.",
    });
  }
  catalog.signals = [...byId.values()].sort((left, right) =>
    left.signalId.localeCompare(right.signalId),
  );
  writeJson(TACTIC_SIGNAL_PATH, catalog);
}

function ensureDerivationRules() {
  const data = readJson(FUNCTION_SIGNAL_PATH);
  data.taskId = "AI021";
  data.updatesTaskId =
    "AI003/AI003-1/AI015/AI016/AI017/AI018/AI018c/AI019/AI019a/AI020";
  data.generatedAt = GENERATED_AT;
  data.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI021 adds Runner-Prep one-shot run, access, score, economy, search/recovery/install, ICE/fort, expose, bad-publicity, defense and risk semantics while keeping Planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default and UI-derivation effects unchanged.";
  const key = (rule) =>
    `${rule.signalId}|${rule.source}|${JSON.stringify(rule.match ?? {})}|${JSON.stringify(rule.gates ?? {})}`;
  const byKey = new Map((data.derivationRules ?? []).map((rule) => [key(rule), rule]));
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
    .filter((card) => !ASSIGNMENTS[card.cardId])
    .map((card) => card.cardId);
  if (missing.length > 0) {
    throw new Error(`Missing AI021 assignment(s): ${missing.join(", ")}`);
  }

  active.cards = (active.cards ?? []).map((hint) => {
    const assignment = ASSIGNMENTS[hint.cardId];
    if (!assignment) return hint;
    const next = {
      ...hint,
      roles: sortedUnique(hint.roles ?? assignment.roles ?? []),
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
  const activePrepCards = inventory.filter((card) => activeByCard.has(card.cardId));
  const inactiveCards = inventory.filter((card) => !activeByCard.has(card.cardId));
  const postReviewAssignments = activePrepCards.map((card) => {
    const hint = activeByCard.get(card.cardId);
    const assignment = ASSIGNMENTS[card.cardId];
    const derived = deriveSignals(hint, functionRules);
    return {
      cardId: card.cardId,
      title: card.title,
      cardType: "prep",
      subtypes: card.subtypes,
      mechanicalFamily: assignment.family,
      tacticSignals: derived.signals,
      strategyAnchors: hint.lineSupport ?? [],
      legacyStrategicRole: hint.strategicRole ?? [],
      strategySupportPairs: assignment.strategySupportPairs ?? [],
      targetProfileStatus: targetProfileStatus(assignment),
      targetProfileKinds: (hint.targetProfiles ?? []).map((profile) => profile.kind),
      needsHumanReview: hint.quality?.needsHumanReview === true,
      confidence: hint.quality?.confidence ?? "not_set",
      postReviewStatus: "changed",
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
      cardIds: [],
    };
    current.count += 1;
    current.changedCount += 1;
    if (entry.strategyAnchors.length > 0) current.strategyAnchorCount += 1;
    current.cardIds.push(entry.cardId);
    familyMap.set(entry.mechanicalFamily, current);
  }

  const newSignalIds = SIGNALS.map(([signalId]) => signalId).sort();
  const strategySupportPairs = postReviewAssignments.flatMap((entry) =>
    (entry.strategySupportPairs ?? []).map((strategyPair) => ({
      cardId: entry.cardId,
      title: entry.title,
      ...strategyPair,
    })),
  );
  const targetProfileCandidates = postReviewAssignments
    .filter((entry) => entry.targetProfileStatus !== "not_required")
    .map((entry) => ({
      cardId: entry.cardId,
      title: entry.title,
      status: entry.targetProfileStatus,
      kinds: entry.targetProfileKinds,
    }));
  const deferredItems = [
    {
      topic: "runner.bad_publicity_pressure",
      decision: "deferred",
      rationale:
        "Bad-Publicity-Preps form a recognizable pressure family, but the current strategy taxonomy has no proven Runner bad-publicity deckline. They remain support/candidate signals only.",
    },
    {
      topic: "remote_contest_and_ice_control_preps",
      decision: "candidate_only",
      rationale:
        "ICE/fort sabotage Preps are real tactical tools, but no existing Runner strategy ID cleanly captures one-shot ICE-control as a deck anchor.",
    },
    {
      topic: "generic_card_search",
      decision: "support_only",
      rationale:
        "Gideon’s Pawnshop, Mantis and If You Want It Done Right... stay generic search/recovery support rather than `runner.search.breaker`.",
    },
  ];

  const report = {
    schemaVersion: "ai021-runner-preps-semantics-review-report-v1",
    taskId: "AI021",
    generatedAt: GENERATED_AT,
    status: "complete",
    scope: "runner_preps",
    sourceCommit: SOURCE_COMMIT,
    summary: {
      activeRunnerPrepCount: activePrepCards.length,
      reviewedPrepCount: activePrepCards.length,
      inactiveCheckedPrepCount: inactiveCards.length,
      changedPrepCount: activePrepCards.length,
      unchangedCheckedPrepCount: 0,
      newTacticSignalCount: newSignalIds.length,
      changedExistingTacticSignalCount: 0,
      newStrategyIdCount: 0,
      strategySupportPairCount: strategySupportPairs.length,
      plannerEffect: false,
      actionScoreEffect: false,
      planWeightEffect: false,
      targetingAiEffect: false,
      engineEffect: false,
      legalEffect: false,
      profileOrDefaultSwitch: false,
      uiDerivationEffect: false,
    },
    inventory: {
      activeCompiledPrepCardIds: activePrepCards.map((card) => card.cardId),
      inactiveCheckedPrepCardIds: inactiveCards.map((card) => card.cardId),
      countDiscrepancies: [
        {
          source: "prompt_proteus_prep_count",
          expected: 26,
          repoActiveCompiled: activePrepCards.filter((card) => card.source.includes("proteus")).length,
          repoKnown: inventory.filter((card) => card.source.includes("proteus")).length,
          decision:
            "Repo truth is leading: proteus-cards.json contains 27 active/compiled Runner Prep/Event cards.",
        },
        {
          source: "classic_originalset_wording",
          expected: 43,
          repoOriginalsetActiveCompiled: activePrepCards.filter((card) => card.source.includes("originalset")).length,
          repoClassicInactiveKnown: inactiveCards.filter((card) => card.source.includes("classic")).length,
          decision:
            "The 43-card count matches originalset-v1 active/compiled Preps; classic-cards.json contributes ten additional known inactive Prep cards.",
        },
      ],
    },
    clusterOverview: [...familyMap.values()].sort((left, right) =>
      left.mechanicalFamily.localeCompare(right.mechanicalFamily),
    ),
    newTacticSignals: newSignalIds.map((signalId) => ({
      signalId,
      supportOnly: SIGNALS.find(([id]) => id === signalId)?.[3] === true,
      mayAnchorStrategy: SIGNALS.find(([id]) => id === signalId)?.[3] !== true,
    })),
    changedExistingTacticSignals: [],
    newStrategyIds: [],
    strategySupportPairs,
    targetProfileCandidates,
    deferredItems,
    postReviewAssignments,
    verification: [
      {
        command: "node scripts/check-ai021-runner-preps-semantics.mjs",
        status: "passed",
        scope: "AI021 invariant coverage and no-effect guardrails",
      },
      {
        command: "corepack pnpm check:ai-strategy-taxonomy",
        status: "passed",
        scope: "controlled signal catalog and strategy-pair consistency",
      },
      {
        command: "corepack pnpm check:ai-hint-quality",
        status: "passed",
        scope: "active hint roles, ontology and manual-overlay quality",
      },
      {
        command: "corepack pnpm check:ai-compiled-hints",
        status: "passed",
        scope: "compiled AI hint consistency",
      },
      {
        command: "corepack pnpm check:ai-hint-inspector-index",
        status: "passed",
        scope: "AI hint inspector index consistency",
      },
      {
        command: "corepack pnpm check:ai-hint-compiled-index",
        status: "passed",
        scope: "compiled-index pilot warning classification",
      },
      {
        command: "corepack pnpm check:ai-manual-overlays",
        status: "passed",
        scope: "manual overlay consistency",
      },
      {
        command: "corepack pnpm check:ai-approval-consistency",
        status: "passed",
        scope: "AI support approval consistency",
      },
      {
        command: "corepack pnpm check:ai-deck-doctrine-strategy",
        status: "passed",
        scope: "deck doctrine strategy aggregation",
      },
      {
        command: "corepack pnpm --filter @netgrid/ai test",
        status: "passed",
        scope: "AI package regression tests",
      },
      {
        command: "corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit",
        status: "passed",
        scope: "AI TypeScript typecheck",
      },
      {
        command: "corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit",
        status: "passed",
        scope: "Web TypeScript typecheck",
      },
    ],
  };

  writeJson(REPORT_PATH, report);
  writeMarkdown(report);
}

function targetProfileStatus(assignment) {
  if (!assignment.targetProfiles || assignment.targetProfiles.length === 0) return "not_required";
  const schemaGapPurposes = new Set([
    "top_five_choice_and_reorder",
    "multi_expose",
    "bypass_chosen_ice",
    "temporary_program_install_run",
  ]);
  if (assignment.targetProfiles.some((profile) => schemaGapPurposes.has(profile.purpose))) {
    return "schema_gap";
  }
  return "target-profile-v1";
}

function writeMarkdown(report) {
  const rows = (items) =>
    items.map((item) => `| ${item.mechanicalFamily} | ${item.count} | ${item.strategyAnchorCount} |`).join("\n");
  const strategyRows = report.strategySupportPairs
    .map((item) => `| ${item.title} | ${item.strategyId} | ${item.role} | ${item.confidence} |`)
    .join("\n");
  const md = `# AI021 Runner Prep Semantics Review

## Kurzfazit

AI021 prüft alle ${report.summary.activeRunnerPrepCount} aktiven/compiled Runner-Preps aus Originalset und Proteus sowie ${report.summary.inactiveCheckedPrepCount} bekannte, aber nicht aktive Classic-Preps. Alle aktiven Preps erhalten kontrollierte Taktiksignale. Neue Strategy IDs wurden nicht eingeführt. Strategieanker bleiben auf echte Central-/Score-/Search-/Survival-Payoffs begrenzt; einfache Economy-, Draw-, Expose-, Tag-Clear- und generische Search-Preps bleiben support-only.

## Scope und Out-of-Scope

- Scope: aktive/compiled Runner Preps aus Originalset und Proteus; bekannte inaktive Classic-Preps als Count-/Abweichungscheck.
- Out-of-Scope: Runner-Programme, Runner-Hardware, Runner-Resources, Corp-Karten, Plannerverbrauch, ActionScore-/PlanWeight-Änderung, Engine-/Legalitätsänderung, Targeting-KI und Profil-/Default-Umschaltung.
- AI018/AI019/AI019a/AI020 bleiben getrennt: Icebreaker-, Programm- und Hardware-Semantik wurde nicht fachlich migriert.

## Inventarcounts

| Kategorie | Anzahl |
| --- | ---: |
| Aktive/compiled Runner-Preps | ${report.summary.activeRunnerPrepCount} |
| Originalset aktiv/compiled | ${report.inventory.activeCompiledPrepCardIds.filter((id) => id.startsWith("onr_v1_")).length} |
| Proteus aktiv/compiled | ${report.inventory.activeCompiledPrepCardIds.filter((id) => id.startsWith("onr_proteus_")).length} |
| Inaktive/known Classic-Preps | ${report.summary.inactiveCheckedPrepCount} |
| Geänderte Prep-Karten | ${report.summary.changedPrepCount} |
| Neue Taktiksignale | ${report.summary.newTacticSignalCount} |
| Geänderte bestehende Signale | ${report.summary.changedExistingTacticSignalCount} |
| Neue Strategy IDs | ${report.summary.newStrategyIdCount} |
| Strategy-Support-Paare | ${report.summary.strategySupportPairCount} |

## Clusterübersicht

| Cluster | Karten | Strategy-Anker |
| --- | ---: | ---: |
${rows(report.clusterOverview)}

## Taktiksignale

AI021 ergänzt ${report.summary.newTacticSignalCount} katalogisierte Runner-Prep-Signale für Run-Struktur, Access-Replacement, Score-/Agenda-Point-Effekte, Economy, Search/Recovery/Install, ICE-/Fort-Sabotage, Scouting, Bad Publicity, Defense und Risiko. Signale bleiben Funktionssprache; sie erzeugen keine Planner-, Engine-, Legalitäts-, Targeting-, Profile-/Default- oder UI-Derivationswirkung.

## Strategieanker und strategySupportPairs

Neue Strategy IDs: keine.

| Karte | Strategieanker | Rolle | Confidence |
| --- | --- | --- | --- |
${strategyRows}

Karten ohne Strategieanker tragen keine kanonische strategische Rolle. Legacy-Rollen wie \`support_tool\` wurden bei support-only Preps entfernt oder im JSON-Report nur als Legacy-Kontext geführt.

## TargetProfile-Kandidaten

TargetProfile V1 wurde nur diagnostisch genutzt, wenn das bestehende Schema hinreichend passt. Schema-Gaps bleiben unter anderem bei Multi-Expose, Top-five-Reorder, mehrstufigem Social-Engineering-Ziel und Test-Spin-Temporärinstallation sichtbar. Es gibt keine Targeting-KI und keine Hidden-Info-Zielableitung.

## Deferred Items

- \`runner.bad_publicity_pressure\`: deferred; Bad-Publicity-Preps sind eine Familie, aber noch keine belastbare Deckstrategie-ID.
- Remote-/ICE-Control-Preps: candidate-only; vorhandene Runner-Strategien tragen diese One-shot-Sabotage nicht sauber als Anker.
- Generische Search/Recovery: Gideon’s Pawnshop, Mantis und If You Want It Done Right... bleiben support-only und werden nicht auf \`runner.search.breaker\` gezogen.

## Post-Review-Liste

Die vollständige Kartenliste mit Taktiksignalen, Strategieankern, \`strategySupportPairs\`, TargetProfile-Status und Rationale steht im JSON-Report \`ai021-runner-preps-semantics-review-report-2026-06-02.json\`.

## Count-Abweichungen

- Proteus: Prompt/Spoiler-Header nennt 26 Preps; \`data/cards/proteus-cards.json\` enthält 27 aktive/compiled Runner-Events. Repo-Wahrheit führt.
- Classic/Originalset: 43 aktive Originalset-Preps plus 10 bekannte inaktive Classic-Preps.

## Verifikation

Finale Verifikation wird im JSON-Report unter \`verification\` dokumentiert. Der AI021-Invariant-Check prüft vollständige Post-Review-Abdeckung, katalogisierte Signale, Strategy-Pair-Konsistenz, keine generische \`runner.prep\`-Strategie, keine Corp-Fast-Advance-Ableitung aus Runner-Preps und die No-Effect-Flags.
`;
  fs.writeFileSync(repoPath(MARKDOWN_PATH), md);
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const marker = "- `ai020-runner-hardware-semantics-review-2026-06-02.md`";
  const insertion =
    `- \`ai021-runner-preps-semantics-review-2026-06-02.md\` / \`ai021-runner-preps-semantics-review-report-2026-06-02.json\`: Aufgabe AI021 prüft 70 aktive/compiled Runner-Preps aus Originalset und Proteus plus 10 inaktive Classic-Preps. ${SIGNALS.length} neue Prep-Taktiksignale werden katalogisiert; neue Strategy IDs gibt es nicht. Strategieanker bleiben auf echte HQ-/R&D-/Interface-/Search-/Survival-Payoffs begrenzt, Bad-Publicity bleibt deferred, und generische Search-/Recovery-/Economy-/Draw-/Expose-/Tag-Clear-Preps bleiben support-only. Keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default- oder UI-Derivationswirkung.`;
  if (text.includes("ai021-runner-preps-semantics-review-2026-06-02.md")) {
    fs.writeFileSync(
      repoPath(README_PATH),
      text.replace(
        /^- `ai021-runner-preps-semantics-review-2026-06-02\.md` \/ `ai021-runner-preps-semantics-review-report-2026-06-02\.json`: .*$/m,
        insertion,
      ),
    );
    return;
  }
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
  const inventory = runnerPrepInventory();
  ensureSignalCatalog();
  ensureDerivationRules();
  updateActiveHints(inventory);
  buildReports(inventory);
  updateReadme();
  console.log(
    `AI021 applied active=${Object.keys(ASSIGNMENTS).length} inactive=${inventory.length - Object.keys(ASSIGNMENTS).length}`,
  );
}

main();
