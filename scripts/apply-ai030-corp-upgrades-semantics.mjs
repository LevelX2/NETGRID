#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-03";
const TASK_ID = "AI030";
const GUIDE_PATH = "docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const SIGNALS_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";
const REVIEW_MD_PATH = "docs/reviews/ai/ai030-corp-upgrades-semantics-review-2026-06-03.md";
const REVIEW_JSON_PATH = "docs/reviews/ai/ai030-corp-upgrades-semantics-review-report-2026-06-03.json";
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

const ORIGINALSET_UPGRADES = [
  "onr_v1_349_aardvark",
  "onr_v1_350_antiquated-interface-routines",
  "onr_v1_351_bizarre-encryption-scheme",
  "onr_v1_352_chester-mix",
  "onr_v1_353_chimera",
  "onr_v1_354_crybaby",
  "onr_v1_355_crystal-palace-station-grid",
  "onr_v1_356_dedicated-response-team",
  "onr_v1_357_dieter-esslin",
  "onr_v1_358_dr-dreff",
  "onr_v1_359_jenny-jett",
  "onr_v1_360_jerusalem-city-grid",
  "onr_v1_361_namatoki-plaza",
  "onr_v1_362_new-galveston-city-grid",
  "onr_v1_363_olivia-salazar",
  "onr_v1_364_omni-kismet-ph-d",
  "onr_v1_365_paris-city-grid",
  "onr_v1_366_red-herrings",
  "onr_v1_367_rio-de-janeiro-city-grid",
  "onr_v1_368_roving-submarine",
  "onr_v1_369_singapore-city-grid",
  "onr_v1_370_tesseract-fort-construction",
  "onr_v1_371_tokyo-chiba-infighting",
  "onr_v1_372_turbeau-delacroix",
  "onr_v1_373_twenty-four-hour-surveillance",
  "onr_v1_374_washington-d-c-city-grid",
];

const PROTEUS_UPGRADES = [
  "onr_proteus_060_herman-revista",
  "onr_proteus_062_lesley-major",
  "onr_proteus_063_lisa-blight",
  "onr_proteus_064_marcel-desoleil",
  "onr_proteus_065_networked-center",
  "onr_proteus_066_obfuscated-fortress",
  "onr_proteus_067_panic-button",
  "onr_proteus_069_pavit-bharat",
  "onr_proteus_070_rasmin-bridger",
  "onr_proteus_071_raymond-ellison",
  "onr_proteus_072_research-bunker",
  "onr_proteus_073_simon-francisco",
  "onr_proteus_077_weapons-depot",
];

const TEST_UPGRADES = ["simple_upgrade"];
const TARGET_CARD_IDS = [...ORIGINALSET_UPGRADES, ...PROTEUS_UPGRADES, ...TEST_UPGRADES];

const NEW_SIGNALS = {
  "access.corp_agenda_score_delay": {
    group: "ai030_corp_upgrade_access",
    description: "Corp upgrade delays agenda scoring or stealing after access from its protected fort.",
    supportOnly: false,
    anchors: ["corp.remote_scoring"],
    targetProfileRelevant: false,
  },
  "access.corp_central_access_reduction": {
    group: "ai030_corp_upgrade_access",
    description: "Corp upgrade reduces additional central accesses during the access step.",
    supportOnly: false,
    anchors: ["corp.central_stabilize"],
    targetProfileRelevant: false,
  },
  "access.corp_daemon_trash": {
    group: "ai030_corp_upgrade_access",
    description: "Corp upgrade trashes an installed daemon when accessed.",
    supportOnly: false,
    anchors: ["corp.ambush_bluff"],
    targetProfileRelevant: true,
  },
  "access.corp_installed_trash_tax": {
    group: "ai030_corp_upgrade_access",
    description: "Corp upgrade increases the Runner trash cost for installed cards in its fort.",
    supportOnly: true,
    anchors: [],
    targetProfileRelevant: false,
  },
  "advance.remote_score_window_support": {
    group: "ai030_corp_upgrade_advance",
    description: "Corp upgrade places advancement counters in a protected remote run window.",
    supportOnly: false,
    anchors: ["corp.remote_scoring"],
    targetProfileRelevant: true,
  },
  "economy.corp_unsuccessful_run_credit": {
    group: "ai030_corp_upgrade_economy",
    description: "Corp upgrade gains credits after an unsuccessful run on its fort.",
    supportOnly: true,
    anchors: [],
    targetProfileRelevant: false,
  },
  "ice.corp_hq_runpath_insert": {
    group: "ai030_corp_upgrade_ice",
    description: "Corp upgrade inserts or swaps HQ ICE into the current run path without exposing HQ contents.",
    supportOnly: false,
    anchors: ["corp.ice_tax_glacier"],
    targetProfileRelevant: true,
  },
  "ice.corp_reorder_fort": {
    group: "ai030_corp_upgrade_ice",
    description: "Corp upgrade reorders ICE protecting its fort.",
    supportOnly: true,
    anchors: [],
    targetProfileRelevant: true,
  },
  "ice.corp_subroutine_repeat": {
    group: "ai030_corp_upgrade_ice",
    description: "Corp upgrade repeats a subroutine on ICE protecting its fort for the run.",
    supportOnly: false,
    anchors: ["corp.ice_tax_glacier"],
    targetProfileRelevant: true,
  },
  "remote.agenda_difficulty_discount": {
    group: "ai030_corp_upgrade_remote",
    description: "Corp upgrade reduces agenda difficulty for agendas in its fort.",
    supportOnly: false,
    anchors: ["corp.remote_scoring"],
    targetProfileRelevant: false,
  },
  "remote.capacity_support": {
    group: "ai030_corp_upgrade_remote",
    description: "Corp upgrade expands the agenda/node capacity of a subsidiary fort.",
    supportOnly: false,
    anchors: ["corp.remote_scoring"],
    targetProfileRelevant: false,
  },
  "run.corp_pay_or_end_run": {
    group: "ai030_corp_upgrade_run",
    description: "Corp upgrade forces the Runner to pay during a run or the run ends.",
    supportOnly: false,
    anchors: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    targetProfileRelevant: false,
  },
  "run.corp_server_lock": {
    group: "ai030_corp_upgrade_run",
    description: "Corp upgrade restricts whether a subsidiary fort can be run.",
    supportOnly: false,
    anchors: ["corp.remote_scoring"],
    targetProfileRelevant: false,
  },
  "run.corp_spend_cap": {
    group: "ai030_corp_upgrade_run",
    description: "Corp upgrade caps the Runner's declared spend during a run on its fort.",
    supportOnly: false,
    anchors: ["corp.ice_tax_glacier"],
    targetProfileRelevant: false,
  },
  "run.corp_stealth_credit_lockout": {
    group: "ai030_corp_upgrade_run",
    description: "Corp upgrade prevents Runner stealth-credit spending during runs on its fort.",
    supportOnly: false,
    anchors: ["corp.ice_tax_glacier"],
    targetProfileRelevant: false,
  },
  "run.corp_worm_lockout": {
    group: "ai030_corp_upgrade_run",
    description: "Corp upgrade restricts or punishes Worm breaker use during runs on its fort.",
    supportOnly: true,
    anchors: [],
    targetProfileRelevant: true,
  },
  "risk.rnd_trash_cost": {
    group: "ai030_corp_upgrade_risk",
    description: "Corp pays for an upgrade effect by trashing cards from the top of R&D without exposing identities.",
    supportOnly: true,
    anchors: [],
    targetProfileRelevant: false,
  },
};

const TARGET_PROFILE_RELEVANT_EXISTING_SIGNALS = new Set([
  "ice.corp_install_discount",
  "ice.corp_rez_discount",
  "ice.corp_strength_support",
  "ice.corp_subroutine_support",
]);

const PATCHES = {
  "onr_v1_349_aardvark": {
    signals: ["run.corp_worm_lockout"],
    effects: [effect("run_tax", "during_run", "fort", "run.corp_worm_lockout", { resource: "worm_breaker_use" })],
    conditions: [condition("requires_during_run")],
    supporting: ["run.corp_worm_lockout"],
    targetProfiles: [target("use_target", "during_run", "program", "restrict_or_trash_worm_breaker", "public_or_controller_known_only")],
    rationale: "Worm-specific breaker hate is meaningful but too narrow for a deck-line anchor.",
  },
  "onr_v1_350_antiquated-interface-routines": {
    signals: ["ice.corp_strength_support"],
    effects: [effect("remote_protection", "persistent", "fort", "ice.corp_strength_support", { resource: "strength", amount: 1, repeatable: true })],
    remoteRole: remoteRole("ice_modifier", "medium", "fort"),
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "fort_ice_strength_support", ["ice.corp_strength_support"], "medium")],
    targetProfiles: [target("use_target", "server_setup", "fort", "buff_all_ice_on_fort", "public_or_controller_known_only")],
    rationale: "All ICE on the fort gain strength; glacier-tax support is true, generic remote-scoring is too broad.",
  },
  "onr_v1_351_bizarre-encryption-scheme": {
    signals: ["access.corp_agenda_score_delay"],
    effects: [effect("access_replacement", "on_access", "accessed_card", "access.corp_agenda_score_delay")],
    conditions: [condition("requires_accessed_card")],
    remoteRole: remoteRole("agenda_steal_tax", "medium", "fort"),
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.remote_scoring", "agenda_score_delay", ["access.corp_agenda_score_delay"], "medium")],
    rationale: "Accessed agenda scoring is delayed by a turn; this materially protects scoring remotes without becoming fast advance.",
  },
  "onr_v1_352_chester-mix": {
    signals: ["ice.corp_install_discount"],
    effects: [effect("install_discount", "persistent", "fort", "ice.corp_install_discount", { resource: "credits", amount: 2 })],
    conditions: [condition("requires_rezzed_card")],
    remoteRole: remoteRole("ice_modifier", "medium", "fort"),
    lineSupport: ["corp.economy_rez_reserve", "corp.ice_tax_glacier"],
    strategicRole: ["support_tool", "tax_tool"],
    pairs: [
      pair("corp.economy_rez_reserve", "ice_install_discount", ["ice.corp_install_discount"], "medium"),
      pair("corp.ice_tax_glacier", "ice_install_discount", ["ice.corp_install_discount"], "medium"),
    ],
    targetProfiles: [target("use_target", "install_ice", "installed_ice", "discount_ice_install_on_fort", "public_or_controller_known_only")],
    rationale: "The fort ICE install discount supports ICE-heavy glacier and rez/install reserve lines.",
  },
  "onr_v1_353_chimera": {
    signals: ["access.corp_daemon_trash", "access.punish"],
    effects: [effect("program_trash", "on_access", "runner", "access.corp_daemon_trash")],
    conditions: [condition("requires_accessed_card")],
    lineSupport: ["corp.ambush_bluff"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.ambush_bluff", "access_daemon_trash", ["access.corp_daemon_trash", "access.punish"], "medium")],
    supporting: ["access.punish"],
    targetProfiles: [target("use_target", "on_access", "program", "trash_daemon", "public_or_controller_known_only")],
    rationale: "Daemon trash on access is a real bluff/punish payload and uses only visible installed Runner cards.",
  },
  "onr_v1_354_crybaby": {
    signals: ["access.punish", "remote.ambush", "tax.runner_persistent"],
    lineSupport: ["corp.ambush_bluff"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.ambush_bluff", "access_persistent_link_tax", ["access.punish", "tax.runner_persistent"], "medium")],
    supporting: ["remote.ambush"],
    rationale: "Crying counters are persistent access punishment; no extra tag/damage anchor is implied.",
  },
  "onr_v1_355_crystal-palace-station-grid": {
    signals: ["tax.remote"],
    effects: [
      effect("run_tax", "persistent", "fort", null, { resource: "credits", amount: 1, repeatable: true }),
      effect("remote_protection", "persistent", "fort", null, { repeatable: true }),
    ],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["tax_tool"],
    pairs: [
      pair("corp.ice_tax_glacier", "breaker_subroutine_tax", ["tax.remote"], "high"),
      pair("corp.remote_scoring", "breaker_subroutine_tax", ["tax.remote"], "medium"),
    ],
    qualityConfidence: "high",
    strategyCovered: false,
    rationale: "Per-subroutine break tax protects a fort and was already covered by overlay.",
  },
  "onr_v1_356_dedicated-response-team": {
    signals: ["damage.corp_tagged_meat_payoff", "damage.payoff", "tag.payoff"],
    effects: [effect("tag_punish_payoff", "on_access", "runner", "damage.corp_tagged_meat_payoff", { amount: 3, resource: "meat_damage" })],
    conditions: [condition("requires_runner_tagged"), condition("requires_accessed_card")],
    lineSupport: ["corp.damage_kill", "corp.tag_trace_punish"],
    strategicRole: ["punish_payoff"],
    pairs: [
      pair("corp.damage_kill", "tagged_access_meat_damage", ["damage.corp_tagged_meat_payoff", "damage.payoff"], "high"),
      pair("corp.tag_trace_punish", "tagged_access_payoff", ["damage.corp_tagged_meat_payoff", "tag.payoff"], "medium"),
    ],
    supporting: ["damage.payoff", "tag.payoff"],
    rationale: "The meat damage only fires if Runner is tagged; both tag-payoff and damage-kill support are explicit.",
  },
  "onr_v1_357_dieter-esslin": {
    signals: ["access.corp_net_damage_ambush", "access.punish", "damage.payoff"],
    effects: [effect("damage", "on_access", "runner", "access.corp_net_damage_ambush", { amount: 1, resource: "net_damage" })],
    conditions: [condition("requires_accessed_card")],
    lineSupport: ["corp.ambush_bluff"],
    strategicRole: ["punish_payoff"],
    pairs: [pair("corp.ambush_bluff", "access_net_damage", ["access.corp_net_damage_ambush", "access.punish"], "medium")],
    supporting: ["damage.payoff"],
    rationale: "Access net damage is an ambush/bluff payload, not enough by itself for damage-kill.",
  },
  "onr_v1_358_dr-dreff": {
    signals: ["ice.corp_hq_runpath_insert"],
    effects: [effect("future_encounter_effect", "successful_run", "run_path", "ice.corp_hq_runpath_insert"), effect("zone_shuffle", "during_run", "hq", "ice.corp_hq_runpath_insert")],
    conditions: [condition("requires_successful_run"), condition("requires_during_run")],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["scoring_tool", "tax_tool"],
    pairs: [
      pair("corp.ice_tax_glacier", "hq_ice_surprise_encounter", ["ice.corp_hq_runpath_insert"], "medium"),
      pair("corp.remote_scoring", "hq_ice_surprise_encounter", ["ice.corp_hq_runpath_insert"], "medium"),
    ],
    targetProfiles: [target("use_target", "successful_run", "hq_ice", "choose_hq_ice_for_temporary_encounter", "corp_side_only")],
    hiddenInfoPolicy: "corp_side_only_until_revealed_by_effect",
    rationale: "Corp chooses HQ ICE for a temporary encounter; target metadata must not expose hidden HQ contents.",
  },
  "onr_v1_359_jenny-jett": {
    signals: ["ice.corp_hq_runpath_insert", "remote.scoring_protection"],
    effects: [effect("future_encounter_effect", "successful_run", "run_path", "ice.corp_hq_runpath_insert"), effect("remote_protection", "successful_run", "fort", "remote.scoring_protection")],
    conditions: [condition("requires_successful_run"), condition("requires_during_run")],
    remoteRole: remoteRole("scoring_protection", "high", "fort"),
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [
      pair("corp.ice_tax_glacier", "hq_ice_innermost_install", ["ice.corp_hq_runpath_insert"], "medium"),
      pair("corp.remote_scoring", "successful_run_ice_insert", ["ice.corp_hq_runpath_insert", "remote.scoring_protection"], "high"),
    ],
    targetProfiles: [target("use_target", "successful_run", "hq_ice", "install_hq_ice_innermost_on_fort", "corp_side_only")],
    hiddenInfoPolicy: "corp_side_only_until_installed",
    rationale: "Innermost HQ ICE install after a successful run protects the scoring fort while keeping HQ choices private.",
  },
  "onr_v1_360_jerusalem-city-grid": {
    signals: ["ice.corp_rez_discount", "ice.corp_strength_support"],
    effects: [effect("rez_discount", "persistent", "fort", "ice.corp_rez_discount", { resource: "credits", amount: 2 }), effect("remote_protection", "persistent", "fort", "ice.corp_strength_support", { resource: "strength", amount: 1 })],
    conditions: [condition("requires_rezzed_card")],
    remoteRole: remoteRole("ice_modifier", "medium", "fort"),
    lineSupport: ["corp.economy_rez_reserve", "corp.ice_tax_glacier"],
    strategicRole: ["support_tool", "tax_tool"],
    pairs: [
      pair("corp.economy_rez_reserve", "wall_rez_discount", ["ice.corp_rez_discount"], "medium"),
      pair("corp.ice_tax_glacier", "wall_strength_support", ["ice.corp_strength_support"], "medium"),
    ],
    targetProfiles: [target("use_target", "rez_ice", "wall_ice", "discount_and_buff_wall_ice_on_fort", "public_or_controller_known_only")],
    rationale: "Wall rez discount plus strength support belongs to reserve/glacier, not a generic remote-scoring tag.",
  },
  "onr_v1_361_namatoki-plaza": {
    signals: ["remote.capacity_support", "remote.scoring_protection"],
    effects: [effect("remote_protection", "persistent", "remote", "remote.capacity_support"), effect("score_acceleration", "persistent", "remote", "remote.capacity_support")],
    conditions: [condition("requires_remote_server")],
    remoteRole: remoteRole("remote_capacity", "medium", "remote"),
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.remote_scoring", "subsidiary_fort_capacity", ["remote.capacity_support", "remote.scoring_protection"], "medium")],
    rationale: "Extra agenda/node capacity is a remote-scoring support fact, not hidden targeting or fast advance.",
  },
  "onr_v1_362_new-galveston-city-grid": {
    signals: ["access.corp_installed_trash_tax"],
    effects: [effect("run_tax", "persistent", "fort", "access.corp_installed_trash_tax", { resource: "trash_cost", amount: 2 })],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    supporting: ["access.corp_installed_trash_tax"],
    rationale: "Trash-cost protection for nodes/upgrades is relevant evidence but not a standalone strategy anchor.",
  },
  "onr_v1_363_olivia-salazar": {
    signals: ["ice.corp_temporary_rez", "ice.corp_rez_discount", "remote.scoring_protection"],
    effects: [effect("rez_discount", "during_run", "ice", "ice.corp_rez_discount"), effect("remote_protection", "during_run", "fort", "remote.scoring_protection")],
    conditions: [condition("requires_during_run")],
    remoteRole: remoteRole("scoring_protection", "medium", "fort"),
    lineSupport: ["corp.economy_rez_reserve", "corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["support_tool"],
    pairs: [
      pair("corp.economy_rez_reserve", "temporary_rez_discount", ["ice.corp_rez_discount", "ice.corp_temporary_rez"], "medium"),
      pair("corp.ice_tax_glacier", "temporary_rez_discount", ["ice.corp_rez_discount", "ice.corp_temporary_rez"], "medium"),
      pair("corp.remote_scoring", "during_run_rez_defense", ["remote.scoring_protection"], "medium"),
    ],
    targetProfiles: [target("use_target", "during_run", "installed_ice", "temporarily_rez_ice_on_fort", "public_or_controller_known_only")],
    rationale: "Half-cost temporary rez during runs is both reserve/glacier support and remote protection.",
  },
  "onr_v1_364_omni-kismet-ph-d": {
    signals: ["ice.corp_hq_runpath_insert"],
    effects: [effect("zone_shuffle", "during_run", "hq", "ice.corp_hq_runpath_insert")],
    conditions: [condition("requires_during_run")],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "hq_ice_swap", ["ice.corp_hq_runpath_insert"], "medium")],
    targetProfiles: [target("use_target", "during_run", "hq_ice", "swap_unrezzed_fort_ice_with_hq_ice", "corp_side_only")],
    hiddenInfoPolicy: "corp_side_only_until_installed",
    rationale: "Hidden HQ ICE swap is an ICE-tax tool; no tag/economy role is retained from legacy roles.",
  },
  "onr_v1_365_paris-city-grid": {
    signals: ["economy.corp_trace_credit_support", "trace.corp_credit_support"],
    effects: [effect("trace_credit", "during_run", "fort", "economy.corp_trace_credit_support", { resource: "credits", amount: 3 }), effect("trace_credit", "during_run", "fort", "trace.corp_credit_support", { resource: "credits", amount: 3 })],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    lineSupport: ["corp.tag_trace_punish"],
    strategicRole: ["support_tool"],
    pairs: [pair("corp.tag_trace_punish", "server_trace_credit_pool", ["economy.corp_trace_credit_support", "trace.corp_credit_support"], "medium")],
    rationale: "Server-bound trace credits are true tag/trace support, refreshed without exposing hidden state.",
  },
  "onr_v1_366_red-herrings": {
    signals: ["remote.agenda_steal_tax"],
    effects: [
      effect("run_tax", "on_access", "accessed_card", null, { resource: "credits", amount: 5, repeatable: true }),
      effect("remote_protection", "persistent", "fort"),
    ],
    conditions: [condition("requires_accessed_card")],
    remoteRole: remoteRole("agenda_steal_tax", "high", "fort"),
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.remote_scoring", "agenda_steal_credit_tax", ["remote.agenda_steal_tax"], "high")],
    qualityConfidence: "high",
    strategyCovered: false,
    rationale: "Agenda steal tax is a direct remote-scoring support signal and already had overlay coverage.",
  },
  "onr_v1_367_rio-de-janeiro-city-grid": {
    signals: ["remote.scoring_protection"],
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.remote_scoring", "random_run_end_after_ice", ["remote.scoring_protection"], "medium")],
    rationale: "Die-roll end-the-run pressure protects the fort; no new random/planner behavior is implied.",
  },
  "onr_v1_368_roving-submarine": {
    signals: ["run.corp_server_lock"],
    effects: [effect("remote_tax", "during_run", "remote", "run.corp_server_lock")],
    conditions: [condition("requires_remote_server")],
    remoteRole: remoteRole("run_tax", "medium", "remote"),
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.remote_scoring", "remote_run_window_lock", ["run.corp_server_lock"], "high")],
    rationale: "Run eligibility restriction on a subsidiary fort is a direct remote-scoring protection fact.",
  },
  "onr_v1_369_singapore-city-grid": {
    signals: ["ice.corp_hq_runpath_insert"],
    effects: [effect("zone_shuffle", "during_run", "hq", "ice.corp_hq_runpath_insert")],
    conditions: [condition("requires_during_run")],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "hq_ice_swap_region", ["ice.corp_hq_runpath_insert"], "medium")],
    targetProfiles: [target("use_target", "during_run", "hq_ice", "swap_unrezzed_fort_ice_with_hq_ice", "corp_side_only")],
    hiddenInfoPolicy: "corp_side_only_until_installed",
    rationale: "Region version of the hidden HQ ICE swap keeps the same side-safe target semantics.",
  },
  "onr_v1_370_tesseract-fort-construction": {
    signals: ["ice.corp_subroutine_support", "remote.scoring_protection"],
    effects: [effect("future_encounter_effect", "encounter", "run_path", "ice.corp_subroutine_support"), effect("remote_protection", "persistent", "fort", "remote.scoring_protection")],
    remoteRole: remoteRole("scoring_protection", "high", "fort"),
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["engine_anchor"],
    pairs: [
      pair("corp.ice_tax_glacier", "extra_etr_subroutine_tax", ["ice.corp_subroutine_support"], "high"),
      pair("corp.remote_scoring", "extra_etr_subroutine_tax", ["remote.scoring_protection"], "high"),
    ],
    targetProfiles: [target("use_target", "ice_encounter", "installed_ice", "add_etr_subroutine_to_fort_ice", "public_or_controller_known_only")],
    rationale: "Additional ETR subroutines materially support both glacier tax and scoring fort protection.",
  },
  "onr_v1_371_tokyo-chiba-infighting": {
    signals: ["economy.corp_unsuccessful_run_credit"],
    effects: [effect("economy", "unsuccessful_run", "corp", "economy.corp_unsuccessful_run_credit", { resource: "credits", amount: 2 })],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    supporting: ["economy.corp_unsuccessful_run_credit"],
    rationale: "Credits after unsuccessful runs are useful support evidence but too conditional for an economy-reserve anchor.",
  },
  "onr_v1_372_turbeau-delacroix": {
    signals: ["tag.source", "trace.source"],
    lineSupport: ["corp.tag_trace_punish"],
    strategicRole: ["engine_anchor"],
    pairs: [pair("corp.tag_trace_punish", "access_trace_tag", ["tag.source", "trace.source"], "high")],
    rationale: "Trace 10 into a tag is a clear tag/trace source.",
  },
  "onr_v1_373_twenty-four-hour-surveillance": {
    signals: ["run.corp_stealth_credit_lockout"],
    effects: [effect("run_tax", "during_run", "fort", "run.corp_stealth_credit_lockout", { resource: "stealth_credits" })],
    conditions: [condition("requires_during_run")],
    remoteRole: remoteRole("run_tax", "medium", "fort"),
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "stealth_credit_lockout", ["run.corp_stealth_credit_lockout"], "medium")],
    rationale: "Stealth-credit denial taxes breaker plans on the protected fort without exposing private data.",
  },
  "onr_v1_374_washington-d-c-city-grid": agendaDifficultyPatch(null, "all_agendas_in_fort", "Washington reduces agenda difficulty in its fort; this is remote-scoring support, not generic fast advance."),
  "onr_proteus_060_herman-revista": {
    signals: ["ice.corp_reorder_fort"],
    effects: [effect("zone_shuffle", "start_of_run", "fort", "ice.corp_reorder_fort")],
    conditions: [condition("requires_during_run")],
    supporting: ["ice.corp_reorder_fort"],
    targetProfiles: [target("use_target", "start_of_run", "fort_ice_order", "rearrange_fort_ice", "corp_side_only")],
    hiddenInfoPolicy: "corp_side_only_until_revealed_by_run_path",
    rationale: "ICE rearrangement is a real target/choice profile but support-only without a stable strategy anchor.",
  },
  "onr_proteus_062_lesley-major": {
    signals: ["advance.remote_score_window_support", "advance.corp_counter_placement"],
    effects: [effect("advance", "during_run", "installed_card", "advance.remote_score_window_support", { amount: 2, resource: "advancement_counters" }), effect("advance", "during_run", "installed_card", "advance.corp_counter_placement", { amount: 2, resource: "advancement_counters" })],
    conditions: [condition("requires_remote_server"), condition("requires_during_run")],
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.remote_scoring", "last_ice_advancement_counter_support", ["advance.remote_score_window_support"], "high")],
    supporting: ["advance.corp_counter_placement"],
    targetProfiles: [target("use_target", "runner_passes_last_ice", "installed_card", "place_advancement_counters_in_fort", "public_or_controller_known_only")],
    rationale: "Counters placed as the Runner passes the last ICE create a remote score-window support fact.",
  },
  "onr_proteus_063_lisa-blight": {
    signals: ["ice.corp_subroutine_repeat", "risk.random_discard_cost"],
    effects: [effect("future_encounter_effect", "during_run", "run_path", "ice.corp_subroutine_repeat"), effect("zone_shuffle", "during_run", "hq", "risk.random_discard_cost")],
    conditions: [condition("requires_during_run")],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "repeat_ice_subroutine", ["ice.corp_subroutine_repeat"], "medium")],
    supporting: ["risk.random_discard_cost"],
    targetProfiles: [target("use_target", "during_run", "ice_subroutine", "repeat_subroutine_on_fort_ice", "public_or_controller_known_only")],
    hiddenInfoPolicy: "random_discard_without_ai_hidden_choice",
    rationale: "Subroutine repeat supports ICE tax; random discard is cost/risk evidence only.",
  },
  "onr_proteus_064_marcel-desoleil": {
    signals: ["ice.corp_subroutine_repeat", "risk.rnd_trash_cost"],
    effects: [effect("future_encounter_effect", "during_run", "run_path", "ice.corp_subroutine_repeat"), effect("trash_credit", "during_run", "rnd", "risk.rnd_trash_cost")],
    conditions: [condition("requires_during_run")],
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "repeat_ice_subroutine_rnd_cost", ["ice.corp_subroutine_repeat"], "medium")],
    supporting: ["risk.rnd_trash_cost"],
    targetProfiles: [target("use_target", "during_run", "ice_subroutine", "repeat_subroutine_on_fort_ice", "public_or_controller_known_only")],
    hiddenInfoPolicy: "top_rnd_trash_without_ai_hidden_choice",
    rationale: "Subroutine repeat supports ICE tax; top-R&D trash cost is support-only risk metadata.",
  },
  "onr_proteus_065_networked-center": agendaDifficultyPatch("score.gray_ops_difficulty_discount", "gray_ops_agendas_in_fort", "Gray Ops difficulty discount is a remote-scoring support signal, not a fast-advance derivation."),
  "onr_proteus_066_obfuscated-fortress": {
    signals: ["run.corp_spend_cap"],
    effects: [effect("run_tax", "start_of_run", "fort", "run.corp_spend_cap", { resource: "declared_credits" })],
    conditions: [condition("requires_during_run")],
    remoteRole: remoteRole("run_tax", "high", "fort"),
    lineSupport: ["corp.ice_tax_glacier"],
    strategicRole: ["tax_tool"],
    pairs: [pair("corp.ice_tax_glacier", "runner_spend_cap", ["run.corp_spend_cap"], "high")],
    rationale: "Declared spend cap constrains the whole run and materially supports taxing ICE plans.",
  },
  "onr_proteus_067_panic-button": {
    signals: ["draw.corp_draw"],
    effects: [effect("draw", "during_run", "corp", "draw.corp_draw", { amount: 1 })],
    conditions: [condition("requires_during_run")],
    supporting: ["draw.corp_draw"],
    rationale: "HQ-only paid draw during runs is utility evidence only and should not anchor a strategy.",
  },
  "onr_proteus_069_pavit-bharat": {
    signals: ["hq.corp_installed_card_bounce", "install.corp_uninstall_to_hq"],
    effects: [effect("zone_shuffle", "during_run", "hq", "hq.corp_installed_card_bounce"), effect("install", "during_run", "remote", "install.corp_uninstall_to_hq")],
    conditions: [condition("requires_remote_server"), condition("requires_during_run")],
    supporting: ["hq.corp_installed_card_bounce", "install.corp_uninstall_to_hq"],
    targetProfiles: [target("use_target", "runner_passes_last_ice", "hq_card", "replace_installed_fort_cards_from_hq", "corp_side_only")],
    hiddenInfoPolicy: "corp_side_only_until_installed",
    rationale: "Fort refresh from HQ is a side-safe target profile but not a stable deck-line anchor.",
  },
  "onr_proteus_070_rasmin-bridger": {
    signals: ["run.corp_pay_or_end_run"],
    effects: [effect("run_tax", "during_run", "fort", "run.corp_pay_or_end_run", { resource: "credits", amount: 1 })],
    conditions: [condition("requires_during_run")],
    remoteRole: remoteRole("scoring_protection", "high", "fort"),
    lineSupport: ["corp.ice_tax_glacier", "corp.remote_scoring"],
    strategicRole: ["tax_tool"],
    pairs: [
      pair("corp.ice_tax_glacier", "pay_after_each_ice_or_end_run", ["run.corp_pay_or_end_run"], "high"),
      pair("corp.remote_scoring", "pay_after_each_ice_or_end_run", ["run.corp_pay_or_end_run"], "high"),
    ],
    rationale: "Pay-or-end-run after each ICE directly protects scoring remotes and increases run tax.",
  },
  "onr_proteus_071_raymond-ellison": {
    signals: ["advance.corp_counter_bank", "economy.corp_run_temporary_credit", "risk.temporary_credit_drawback"],
    effects: [effect("economy", "during_run", "corp", "economy.corp_run_temporary_credit", { resource: "credits" }), effect("advance", "during_run", "installed_card", "advance.corp_counter_bank"), effect("trash_credit", "end_of_run", "corp", "risk.temporary_credit_drawback")],
    conditions: [condition("requires_remote_server"), condition("requires_during_run")],
    lineSupport: ["corp.economy_rez_reserve"],
    strategicRole: ["support_tool"],
    pairs: [pair("corp.economy_rez_reserve", "advancement_counter_run_credit_reserve", ["economy.corp_run_temporary_credit"], "medium")],
    supporting: ["advance.corp_counter_bank", "risk.temporary_credit_drawback"],
    targetProfiles: [target("use_target", "during_run", "installed_card", "remove_advancement_counters_for_temporary_credits", "public_or_controller_known_only")],
    rationale: "Temporary run credits from advancement counters are reserve support; unspent credits returning are drawback evidence.",
  },
  "onr_proteus_072_research-bunker": agendaDifficultyPatch("score.research_difficulty_discount", "research_agendas_in_fort", "Research agenda difficulty discount is remote-scoring support, not a fast-advance derivation."),
  "onr_proteus_073_simon-francisco": {
    signals: ["access.corp_central_access_reduction"],
    effects: [effect("multiaccess", "on_access", "accessed_card", "access.corp_central_access_reduction")],
    conditions: [condition("requires_accessed_card")],
    lineSupport: ["corp.central_stabilize"],
    strategicRole: ["support_tool"],
    pairs: [pair("corp.central_stabilize", "central_access_reduction", ["access.corp_central_access_reduction"], "medium")],
    rationale: "HQ/R&D access reduction is a central-stabilize support signal and has no target choice.",
  },
  "onr_proteus_077_weapons-depot": agendaDifficultyPatch("score.black_ops_difficulty_discount", "black_ops_agendas_in_fort", "Black Ops difficulty discount is remote-scoring support, not a fast-advance derivation."),
  simple_upgrade: {
    signals: [],
    effects: [],
    conditions: [],
    lineSupport: [],
    strategicRole: [],
    pairs: [],
    supporting: [],
    no_signal_reason: "Vanilla test upgrade has no active ability or tactical semantics.",
    rationale: "Kept intentionally signal-empty for the test fixture.",
  },
};

function main() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const signalCatalog = readJson(SIGNALS_PATH);
  const derivation = readJson(DERIVATION_PATH);

  const activeById = new Map((activeHints.cards ?? []).map((card) => [card.cardId, card]));
  const missing = TARGET_CARD_IDS.filter((cardId) => !activeById.has(cardId));
  if (missing.length > 0) {
    throw new Error(`Missing active hints for AI030 cards: ${missing.join(", ")}`);
  }

  updateSignalCatalog(signalCatalog);
  updateDerivationRules(derivation);
  applyHintPatches(activeById);

  activeHints.taskId = appendTaskId(activeHints.taskId, TASK_ID);
  activeHints.generatedAt = GENERATED_AT;
  signalCatalog.taskId = appendTaskId(signalCatalog.taskId, TASK_ID);
  signalCatalog.generatedAt = GENERATED_AT;
  signalCatalog.description =
    "Controlled V1 tactic-signal catalog. AI030 adds reviewed Corp-Upgrade semantics from Guide V3 without planner, engine, targeting, action-score, plan-weight, legality, profile/default, UI or hidden-info effects.";
  derivation.taskId = appendTaskId(derivation.taskId, TASK_ID);
  derivation.updatesTaskId = appendTaskId(derivation.updatesTaskId, TASK_ID);
  derivation.generatedAt = GENERATED_AT;
  derivation.description =
    "Read-only side-aware derivation contract for function signals from existing structured AI hint fields. AI030 syncs Corp-Upgrade active hints and inspector semantics with Guide V3 without planner, targeting-AI, action-score, plan-weight, engine, legality, profile/default, UI or hidden-info effects.";

  writeJson(ACTIVE_HINTS_PATH, activeHints);
  writeJson(SIGNALS_PATH, signalCatalog);
  writeJson(DERIVATION_PATH, derivation);

  runCorepackPnpm("build:ai-compiled-hints");
  runCorepackPnpm("build:ai-hint-inspector-index");

  const compiledHints = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const report = buildReport({ activeHints, compiledHints, inspector, signalCatalog, derivation });
  writeJson(REVIEW_JSON_PATH, report);
  writeText(REVIEW_MD_PATH, buildReviewMarkdown(report));
  updateReadme();

  process.stdout.write(
    `AI030_APPLY OK originalset=${ORIGINALSET_UPGRADES.length} proteus=${PROTEUS_UPGRADES.length} test=${TEST_UPGRADES.length} signals=${report.summary.catalogSignalsAddedOrTouched.length}\n`,
  );
}

function updateSignalCatalog(catalog) {
  const byId = new Map((catalog.signals ?? []).map((signal) => [signal.signalId, signal]));
  for (const [signalId, def] of Object.entries(NEW_SIGNALS)) {
    const current = byId.get(signalId) ?? {};
    const signal = {
      signalId,
      group: def.group,
      sideScope: "corp",
      description: def.description,
      supportOnly: def.supportOnly,
      mayAnchorStrategy: !def.supportOnly && def.anchors.length > 0,
      allowedStrategyAnchors: def.anchors,
      sourceKinds: ["AI030 reviewed Corp-Upgrade structured hint effects"],
      examples: [],
      targetProfileRelevant: def.targetProfileRelevant,
      notes:
        "AI030 Corp-Upgrade signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.",
      ...current,
    };
    signal.group = def.group;
    signal.sideScope = "corp";
    signal.description = def.description;
    signal.supportOnly = def.supportOnly;
    signal.mayAnchorStrategy = !def.supportOnly && def.anchors.length > 0;
    signal.allowedStrategyAnchors = def.anchors;
    signal.sourceKinds = sortedUnique([
      ...(current.sourceKinds ?? []),
      "AI030 reviewed Corp-Upgrade structured hint effects",
    ]);
    signal.targetProfileRelevant = def.targetProfileRelevant;
    signal.notes =
      "AI030 Corp-Upgrade signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score or plan-weight behavior.";
    byId.set(signalId, signal);
  }

  for (const signalId of TARGET_PROFILE_RELEVANT_EXISTING_SIGNALS) {
    const signal = byId.get(signalId);
    if (!signal) continue;
    signal.targetProfileRelevant = true;
    signal.sourceKinds = sortedUnique([
      ...(signal.sourceKinds ?? []),
      "AI030 reviewed Corp-Upgrade structured hint effects",
    ]);
  }

  for (const signalId of [
    "score.agenda_difficulty_discount",
    "score.advance_burst",
    "ice.corp_rearrange_conceal",
    "damage.corp_tagged_meat_payoff",
    "access.corp_program_trash",
    "advance.corp_counter_placement",
    "advance.score_window_support",
    "economy.corp_run_temporary_credit",
    "economy.corp_trace_credit_support",
    "trace.corp_credit_support",
    "risk.random_discard_cost",
    "risk.temporary_credit_drawback",
  ]) {
    const signal = byId.get(signalId);
    if (!signal) continue;
    signal.sourceKinds = sortedUnique([
      ...(signal.sourceKinds ?? []),
      "AI030 reviewed Corp-Upgrade structured hint effects",
    ]);
  }

  catalog.signals = [...byId.values()].sort((left, right) => left.signalId.localeCompare(right.signalId));
}

function updateDerivationRules(derivation) {
  const rules = derivation.derivationRules ?? [];
  for (const rule of rules) {
    if (
      rule.signalId === "score.advance_burst" &&
      rule.match?.kind === "score_acceleration" &&
      rule.match?.resource === "advancement_counters"
    ) {
      rule.gates = {
        ...rule.gates,
        cardType: ["agenda", "asset", "operation"],
      };
    }
  }

  const ruleDefs = [
    ...Object.keys(NEW_SIGNALS).map((signalId) => ({
      signalId,
      source: "effects",
      match: { target: signalId },
      gates: { side: "corp", cardType: "upgrade", target: signalId },
      strategyAnchorFor: NEW_SIGNALS[signalId].anchors,
    })),
    {
      signalId: "score.agenda_difficulty_discount",
      source: "effects",
      match: { target: "score.agenda_difficulty_discount" },
      gates: { side: "corp", cardType: "upgrade", target: "score.agenda_difficulty_discount" },
      strategyAnchorFor: [],
    },
    {
      signalId: "ice.corp_strength_support",
      source: "effects",
      match: { target: "ice.corp_strength_support" },
      gates: { side: "corp", cardType: "upgrade", target: "ice.corp_strength_support" },
      strategyAnchorFor: ["corp.ice_tax_glacier"],
    },
    {
      signalId: "ice.corp_subroutine_support",
      source: "effects",
      match: { target: "ice.corp_subroutine_support" },
      gates: { side: "corp", cardType: "upgrade", target: "ice.corp_subroutine_support" },
      strategyAnchorFor: ["corp.ice_tax_glacier"],
    },
    {
      signalId: "ice.corp_rez_discount",
      source: "effects",
      match: { target: "ice.corp_rez_discount" },
      gates: { side: "corp", cardType: "upgrade", target: "ice.corp_rez_discount" },
      strategyAnchorFor: ["corp.economy_rez_reserve", "corp.ice_tax_glacier"],
    },
    {
      signalId: "ice.corp_install_discount",
      source: "effects",
      match: { target: "ice.corp_install_discount" },
      gates: { side: "corp", cardType: "upgrade", target: "ice.corp_install_discount" },
      strategyAnchorFor: ["corp.economy_rez_reserve", "corp.ice_tax_glacier"],
    },
    {
      signalId: "ice.corp_temporary_rez",
      source: "effects",
      match: { target: "ice.corp_temporary_rez" },
      gates: { side: "corp", cardType: "upgrade", target: "ice.corp_temporary_rez" },
      strategyAnchorFor: [],
    },
    {
      signalId: "economy.corp_trace_credit_support",
      source: "effects",
      match: { target: "economy.corp_trace_credit_support" },
      gates: { side: "corp", cardType: "upgrade", target: "economy.corp_trace_credit_support" },
      strategyAnchorFor: ["corp.tag_trace_punish"],
    },
    {
      signalId: "trace.corp_credit_support",
      source: "effects",
      match: { target: "trace.corp_credit_support" },
      gates: { side: "corp", cardType: "upgrade", target: "trace.corp_credit_support" },
      strategyAnchorFor: ["corp.tag_trace_punish"],
    },
    {
      signalId: "damage.corp_tagged_meat_payoff",
      source: "effects",
      match: { target: "damage.corp_tagged_meat_payoff" },
      gates: { side: "corp", cardType: "upgrade", target: "damage.corp_tagged_meat_payoff" },
      strategyAnchorFor: ["corp.damage_kill", "corp.tag_trace_punish"],
    },
    {
      signalId: "access.corp_program_trash",
      source: "effects",
      match: { target: "access.corp_program_trash" },
      gates: { side: "corp", cardType: "upgrade", target: "access.corp_program_trash" },
      strategyAnchorFor: ["corp.ambush_bluff"],
    },
    {
      signalId: "advance.corp_counter_placement",
      source: "effects",
      match: { target: "advance.corp_counter_placement" },
      gates: { side: "corp", cardType: "upgrade", target: "advance.corp_counter_placement" },
      strategyAnchorFor: ["corp.fast_advance", "corp.remote_scoring"],
    },
    {
      signalId: "advance.score_window_support",
      source: "effects",
      match: { target: "advance.score_window_support" },
      gates: { side: "corp", cardType: "upgrade", target: "advance.score_window_support" },
      strategyAnchorFor: ["corp.fast_advance"],
    },
    {
      signalId: "economy.corp_run_temporary_credit",
      source: "effects",
      match: { target: "economy.corp_run_temporary_credit" },
      gates: { side: "corp", cardType: "upgrade", target: "economy.corp_run_temporary_credit" },
      strategyAnchorFor: ["corp.economy_rez_reserve"],
    },
    {
      signalId: "risk.random_discard_cost",
      source: "effects",
      match: { target: "risk.random_discard_cost" },
      gates: { side: "corp", cardType: "upgrade", target: "risk.random_discard_cost" },
      strategyAnchorFor: [],
    },
    {
      signalId: "risk.temporary_credit_drawback",
      source: "effects",
      match: { target: "risk.temporary_credit_drawback" },
      gates: { side: "corp", cardType: "upgrade", target: "risk.temporary_credit_drawback" },
      strategyAnchorFor: [],
    },
  ];

  const existing = new Set(rules.map((rule) => stableStringify(rule)));
  for (const ruleDef of ruleDefs) {
    const rule = {
      signalId: ruleDef.signalId,
      source: ruleDef.source,
      match: ruleDef.match,
      gates: ruleDef.gates,
      strategyAnchorFor: ruleDef.strategyAnchorFor ?? [],
    };
    const key = stableStringify(rule);
    if (!existing.has(key)) {
      rules.push(rule);
      existing.add(key);
    }
  }
  const normalizedRules = [];
  const normalizedKeys = new Set();
  for (const rule of rules) {
    const normalized = {
      ...rule,
      strategyAnchorFor: rule.strategyAnchorFor ?? [],
    };
    if (
      normalized.signalId === "ice.corp_temporary_rez" &&
      normalized.gates?.cardType === "upgrade" &&
      normalized.gates?.target === "ice.corp_temporary_rez"
    ) {
      normalized.strategyAnchorFor = [];
    }
    const key = stableStringify(normalized);
    if (normalizedKeys.has(key)) continue;
    normalizedKeys.add(key);
    normalizedRules.push(normalized);
  }
  derivation.derivationRules = normalizedRules.sort(
    (left, right) =>
      left.signalId.localeCompare(right.signalId) ||
      left.source.localeCompare(right.source) ||
      stableStringify(left.match ?? {}).localeCompare(stableStringify(right.match ?? {})),
  );
}

function applyHintPatches(activeById) {
  for (const cardId of TARGET_CARD_IDS) {
    const card = activeById.get(cardId);
    const patch = PATCHES[cardId];
    if (!patch) throw new Error(`Missing AI030 patch for ${cardId}`);
    card.tacticSignals = sortedUnique(patch.signals ?? []);
    setArrayField(card, "lineSupport", patch.lineSupport);
    setArrayField(card, "strategicRole", patch.strategicRole);
    setArrayField(card, "effects", patch.effects, false);
    setArrayField(card, "conditions", patch.conditions, false);
    setArrayField(card, "targetProfiles", patch.targetProfiles, false);
    if (patch.remoteRole) card.remoteRole = patch.remoteRole;
    else delete card.remoteRole;
    if (patch.costProfile) card.costProfile = patch.costProfile;
    else delete card.costProfile;
    if (patch.hiddenInfoPolicy) card.hiddenInfoPolicy = patch.hiddenInfoPolicy;
    else delete card.hiddenInfoPolicy;
    if (patch.no_signal_reason) card.no_signal_reason = patch.no_signal_reason;
    else delete card.no_signal_reason;
    card.manualNotes = sortedUnique([
      ...(patch.supporting ?? []).map((signalId) => `AI030 support-only/evidence signal: ${signalId}`),
      `AI030 rationale: ${patch.rationale}`,
    ]);
    card.quality = {
      ...(card.quality ?? {}),
      benchmarkCovered: card.quality?.benchmarkCovered === true,
      hintReviewed: true,
      strategyCovered: patch.strategyCovered ?? (patch.lineSupport ?? []).length > 0,
      confidence: patch.qualityConfidence ?? (cardId === "simple_upgrade" ? "high" : "medium"),
      needsHumanReview: false,
      reviewedDate: GENERATED_AT,
      reviewedBy: "codex",
    };
  }
}

function buildReport({ activeHints, compiledHints, inspector, signalCatalog, derivation }) {
  const activeById = new Map((activeHints.cards ?? []).map((card) => [card.cardId, card]));
  const compiledById = new Map((compiledHints.cards ?? []).map((card) => [card.cardId, card]));
  const inspectorById = new Map((inspector.cards ?? []).map((card) => [card.cardId, card]));
  const signalById = new Map((signalCatalog.signals ?? []).map((signal) => [signal.signalId, signal]));
  const rulesBySignal = groupBy(derivation.derivationRules ?? [], (rule) => rule.signalId);
  const cards = TARGET_CARD_IDS.map((cardId) => {
    const active = activeById.get(cardId);
    const compiled = compiledById.get(cardId);
    const inspected = inspectorById.get(cardId);
    const patch = PATCHES[cardId];
    return {
      cardId,
      title: active?.title,
      releaseBucket: ORIGINALSET_UPGRADES.includes(cardId)
        ? "originalset_v1"
        : PROTEUS_UPGRADES.includes(cardId)
          ? "proteus"
          : "test_fixture",
      tacticSignals: active?.tacticSignals ?? [],
      compiledFunctionSignals: inspected?.derivedFunctionSignals ?? [],
      lineSupport: active?.lineSupport ?? [],
      cardLevelStrategyAnchors: inspected?.cardLevelStrategyAnchors ?? [],
      derivedPossibleStrategyAnchors: inspected?.derivedPossibleStrategyAnchors ?? [],
      reviewedStrategySupportPairs: inspected?.reviewedStrategySupportPairs ?? [],
      supportingEvidenceOnly: inspected?.supportingEvidenceOnly ?? [],
      targetProfiles: active?.targetProfiles ?? [],
      hiddenInfoPolicy: active?.hiddenInfoPolicy,
      no_signal_reason: active?.no_signal_reason,
      quality: active?.quality,
      warnings: inspected?.warningCategories ?? [],
      activeCompiledInspectorSync: {
        activeFound: Boolean(active),
        compiledFound: Boolean(compiled),
        inspectorFound: Boolean(inspected),
        tacticSignalsVisibleInInspector: (active?.tacticSignals ?? []).every((signalId) =>
          (inspected?.derivedFunctionSignals ?? []).includes(signalId),
        ),
      },
      reviewedDecision: patch.rationale,
    };
  });

  const allTouchedSignals = sortedUnique(
    cards.flatMap((card) => [
      ...card.tacticSignals,
      ...card.compiledFunctionSignals.filter((signalId) => signalById.has(signalId)),
    ]),
  );
  return {
    schemaVersion: "ai030-corp-upgrades-semantics-review-v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    source: {
      guidePath: GUIDE_PATH,
      activeHintsPath: ACTIVE_HINTS_PATH,
      compiledHintsPath: COMPILED_HINTS_PATH,
      inspectorPath: INSPECTOR_PATH,
      signalCatalogPath: SIGNALS_PATH,
      derivationPath: DERIVATION_PATH,
      mode: "semantics-only read model; no planner, LegalAction, engine, action-score, targeting-AI, profile/default or UI behavior change",
    },
    noEffectFlags: NO_EFFECT_FLAGS,
    summary: {
      originalsetUpgradeCount: ORIGINALSET_UPGRADES.length,
      proteusUpgradeCount: PROTEUS_UPGRADES.length,
      testFixtureCount: TEST_UPGRADES.length,
      reviewedCardCount: cards.length,
      signalEmptyFixtureCount: cards.filter((card) => card.no_signal_reason).length,
      cardsWithTargets: cards.filter((card) => card.targetProfiles.length > 0).length,
      catalogSignalsAddedOrTouched: Object.keys(NEW_SIGNALS).sort(),
      allTouchedSignalCount: allTouchedSignals.length,
      derivationRuleCount: derivation.derivationRules?.length ?? 0,
      strategyIdsIntroduced: [],
    },
    signalAudit: allTouchedSignals.map((signalId) => {
      const signal = signalById.get(signalId);
      return {
        signalId,
        sideScope: signal?.sideScope,
        supportOnly: signal?.supportOnly === true,
        mayAnchorStrategy: signal?.mayAnchorStrategy === true,
        allowedStrategyAnchors: signal?.allowedStrategyAnchors ?? [],
        targetProfileRelevant: signal?.targetProfileRelevant === true,
        derivationRules: (rulesBySignal.get(signalId) ?? []).map((rule) => ({
          source: rule.source,
          match: rule.match,
          gates: rule.gates,
          strategyAnchorFor: rule.strategyAnchorFor ?? [],
        })),
      };
    }),
    cards,
    verification: {
      status: "pending",
      commands: [],
    },
  };
}

function buildReviewMarkdown(report) {
  const noSignal = report.cards.filter((card) => card.no_signal_reason).map((card) => card.cardId);
  const targetCards = report.cards.filter((card) => card.targetProfiles.length > 0);
  const lineCards = report.cards.filter((card) => card.lineSupport.length > 0);
  const warnings = report.cards.filter((card) => card.warnings.length > 0);
  return `# AI030 Corp-Upgrades Semantics Review (${GENERATED_AT})

Guide: \`${GUIDE_PATH}\`

## Scope

- Originalset V1 Corp-Upgrades reviewed: ${report.summary.originalsetUpgradeCount}
- Proteus Corp-Upgrades reviewed: ${report.summary.proteusUpgradeCount}
- Test fixture reviewed: ${report.summary.testFixtureCount}
- No new strategy IDs introduced.
- No planner, engine, LegalAction, action-score, plan-weight, targeting-AI, profile/default, UI or hidden-info behavior was changed.

## Outcome

Active hints, compiled hints and the Inspector index now expose reviewed Corp-Upgrade function signals. Corp-Upgrade manual \`tacticSignals\` are visible in the Inspector like Corp-Agenda signals, while strategy support remains separated into card-level \`lineSupport\` / \`reviewedStrategySupportPairs\`.

Agenda-difficulty Upgrades use \`score.agenda_difficulty_discount\` plus \`remote.agenda_difficulty_discount\` as remote-scoring support evidence. Static fort difficulty discounts no longer derive \`score.advance_burst\` / \`corp.fast_advance\` solely because generated facts contain \`score_acceleration\`.

## Signal-Empty Fixture

${noSignal.map((cardId) => `- \`${cardId}\`: ${report.cards.find((card) => card.cardId === cardId)?.no_signal_reason}`).join("\n")}

## Target Profiles

${targetCards.map((card) => `- \`${card.cardId}\`: ${card.targetProfiles.map((targetProfile) => `${targetProfile.targetType}/${targetProfile.purpose}/${targetProfile.hiddenInfoPolicy}`).join(", ")}`).join("\n")}

## Strategy Support Pairs

${lineCards.map((card) => `- \`${card.cardId}\`: ${card.reviewedStrategySupportPairs.map((pair) => `${pair.strategyId} (${pair.sourceValue})`).join(", ")}`).join("\n")}

## Warnings

${warnings.length === 0 ? "- None for AI030 target cards." : warnings.map((card) => `- \`${card.cardId}\`: ${card.warnings.join(", ")}`).join("\n")}

## Verification

Pending in JSON report until \`scripts/check-ai030-corp-upgrades-semantics.mjs\` and the existing AI gates are run.
`;
}

function updateReadme() {
  const absolutePath = repoPath(README_PATH);
  let content = fs.readFileSync(absolutePath, "utf8");
  const entry =
    "- 2026-06-03: [AI030 Corp-Upgrades Semantics Review](ai030-corp-upgrades-semantics-review-2026-06-03.md) / [JSON](ai030-corp-upgrades-semantics-review-report-2026-06-03.json) - Active/Compiled/Inspector sync for Originalset V1 and Proteus Corp-Upgrades after Guide V3.\n";
  if (content.includes("AI030 Corp-Upgrades Semantics Review")) return;
  const marker = "## Reviews\n";
  if (content.includes(marker)) content = content.replace(marker, `${marker}${entry}`);
  else content = `${content.trimEnd()}\n\n${entry}`;
  fs.writeFileSync(absolutePath, content, "utf8");
}

function runCorepackPnpm(scriptName) {
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `corepack pnpm ${scriptName}`], {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
    return;
  }
  execFileSync("corepack", ["pnpm", scriptName], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}

function agendaDifficultyPatch(subtypeSignal, purpose, rationale) {
  return {
    signals: ["remote.agenda_difficulty_discount", "score.agenda_difficulty_discount", subtypeSignal].filter(Boolean),
    effects: [
      effect("score_acceleration", "persistent", "remote", "score.agenda_difficulty_discount", { resource: "advancement_counters", amount: 1 }),
      effect("remote_protection", "persistent", "remote", "remote.agenda_difficulty_discount"),
    ],
    conditions: [condition("requires_remote_server")],
    remoteRole: remoteRole("scoring_protection", "medium", "remote"),
    lineSupport: ["corp.remote_scoring"],
    strategicRole: ["scoring_tool"],
    pairs: [pair("corp.remote_scoring", purpose, ["remote.agenda_difficulty_discount", "score.agenda_difficulty_discount"], "medium")],
    supporting: [subtypeSignal].filter(Boolean),
    rationale,
  };
}

function effect(kind, timing, scope, targetValue, extra = {}) {
  const normalizedExtra = { ...extra };
  const resourceAliases = {
    declared_credits: "credits",
    stealth_credits: "credits",
    trash_cost: "credits",
    worm_breaker_use: undefined,
  };
  if (normalizedExtra.resource && Object.hasOwn(resourceAliases, normalizedExtra.resource)) {
    const normalizedResource = resourceAliases[normalizedExtra.resource];
    if (normalizedResource) normalizedExtra.resource = normalizedResource;
    else delete normalizedExtra.resource;
  }
  return {
    kind,
    timing:
      {
        end_of_run: "during_run",
        start_of_run: "during_run",
        unsuccessful_run: "during_run",
      }[timing] ?? timing,
    scope,
    ...(targetValue ? { target: targetValue } : {}),
    ...normalizedExtra,
  };
}

function condition(kind, extra = {}) {
  return { kind, ...extra };
}

function remoteRole(kind, threatLevel, serverScope) {
  return { kind, threatLevel, serverScope };
}

function target(kind, timing, targetType, purpose, hiddenInfoPolicy) {
  const timingAliases = {
    during_run: "on_use",
    ice_encounter: "during_ice_encounter",
    install_ice: "on_use",
    on_access: "on_use",
    rez_ice: "on_use",
    runner_passes_last_ice: "on_use",
    server_setup: "on_use",
    start_of_run: "on_use",
    successful_run: "after_successful_run",
  };
  const targetTypeAliases = {
    fort: "server",
    fort_ice_order: "server",
    hq_card: "card",
    hq_ice: "card",
    ice_subroutine: "installed_ice",
    installed_card: "card",
    wall_ice: "installed_ice",
  };
  const hiddenInfoPolicyAliases = {
    corp_side_only: "public_or_controller_known_only",
    corp_side_only_until_installed: "public_or_controller_known_only",
    corp_side_only_until_revealed_by_effect: "public_or_controller_known_only",
    corp_side_only_until_revealed_by_run_path: "public_or_controller_known_only",
    random_discard_without_ai_hidden_choice: "public_or_controller_known_only",
    top_rnd_trash_without_ai_hidden_choice: "public_or_controller_known_only",
  };
  return {
    schemaVersion: "target-profile-v1",
    kind,
    timing: timingAliases[timing] ?? timing,
    targetType: targetTypeAliases[targetType] ?? targetType,
    purpose,
    hiddenInfoPolicy: hiddenInfoPolicyAliases[hiddenInfoPolicy] ?? hiddenInfoPolicy,
    preferences: [],
    avoid: ["hidden_info_dependent_choice"],
  };
}

function pair(strategyId, role, signals, confidence) {
  return { strategyId, role, signals: sortedUnique(signals), confidence };
}

function setArrayField(card, field, value, sort = true) {
  if (!value || value.length === 0) {
    delete card[field];
    return;
  }
  card[field] = sort ? sortedUnique(value) : value;
}

function appendTaskId(current, taskId) {
  const parts = String(current ?? "")
    .split("/")
    .filter(Boolean);
  if (!parts.includes(taskId)) parts.push(taskId);
  return parts.join("/");
}

function sortedUnique(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)));
}

function groupBy(values, keyFn) {
  const grouped = new Map();
  for (const value of values) {
    const key = keyFn(value);
    const group = grouped.get(key) ?? [];
    group.push(value);
    grouped.set(key, group);
  }
  return grouped;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

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

function writeText(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), value, "utf8");
}

main();
