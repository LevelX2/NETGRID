#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const GENERATED_AT = "2026-05-31";
const TASK_ID = "AI004";
const UPDATES_TASK_ID = "AI003/AI003-1";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";
const STRATEGIC_ROLES_PATH = "data/ai/strategic-roles-v1.json";
const FUNCTION_SIGNAL_DERIVATION_PATH =
  "data/ai/function-signal-derivation-v1.json";
const TACTIC_SIGNAL_CATALOG_PATH = "data/ai/tactic-signals-v1.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json";
const DEFAULT_SIDE_AWARE_REPORT_PATH =
  "docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json";
const DEFAULT_ALIAS_REPORT_PATH =
  "docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-alias-report-2026-05-31.json";

const VALID_SIDES = new Set(["runner", "corp"]);
const VALID_DETECTION_MODES = new Set([
  "payoff_anchor",
  "engine_anchor",
  "structural_density",
  "support_requirement",
]);
const VALID_SUPPORT_VALUES = new Set([
  "required",
  "recommended",
  "conditional",
  "meta_dependent",
]);
const VALID_RULE_SOURCES = new Set([
  "effects",
  "conditions",
  "breakerProfile",
  "breakerProfile.coverage",
  "breakerProfile.restrictions",
  "breakerProfile.sideEffects",
  "remoteRole",
]);
const VALID_RULE_GATE_FIELDS = new Set([
  "side",
  "cardType",
  "effectScope",
  "target",
  "controller",
  "beneficiary",
  "remoteRole",
  "remoteRoleStrategyDerivationAbsent",
  "breakerProfileCoverage",
  "breakerProfileRestrictionAbsent",
]);
const VALID_TACTIC_SIGNAL_SIDE_SCOPES = new Set([
  "runner",
  "corp",
  "neutral",
]);

const HIDDEN_INFO_RISK_FIELDS = [
  "opponentDeckList",
  "corpHiddenRndOrder",
  "runnerHiddenStackOrder",
  "hiddenHqCards",
  "privatePayload",
  "fullGameState",
  "fullState",
  "cardInstances",
  "actualDeckOrder",
  "actualStackOrder",
  "actualRndOrder",
  "actualHqCards",
  "secretCards",
  "hiddenCards",
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
];

const LINE_SUPPORT_MAPPINGS = {
  rig_first: {
    category: "alias_to_strategy_goal",
    mapsTo: ["runner.rig_first"],
    rationale: "Legacy Runner setup line.",
  },
  economy_first: {
    category: "alias_to_strategy_goal",
    mapsTo: ["runner.economy_first"],
    rationale:
      "Kept as a structural-density goal; generic economy cards remain function signals only.",
  },
  breaker_search_first: {
    category: "alias_to_strategy_goal",
    mapsTo: ["runner.search.breaker"],
    rationale: "Legacy setup/search line.",
  },
  early_rnd_pressure: {
    category: "alias_to_strategy_goal",
    mapsTo: ["runner.rnd_pressure"],
    rationale: "Early timing narrows to the normalized R&D pressure goal.",
  },
  early_hq_pressure: {
    category: "alias_to_strategy_goal",
    mapsTo: ["runner.hq_pressure"],
    rationale: "Early timing narrows to the normalized HQ pressure goal.",
  },
  remote_contest: {
    category: "exact_strategy_goal",
    mapsTo: ["runner.remote_contest"],
    rationale: "Same semantic goal with side prefix added.",
  },
  interface_pressure: {
    category: "alias_to_strategy_goal",
    mapsTo: ["runner.interface_closeout"],
    rationale: "Interface pressure is the payoff-anchor closeout package.",
  },
  closeout_pressure: {
    category: "alias_to_strategy_goal",
    mapsTo: ["runner.interface_closeout"],
    rationale:
      "Broad closeout pressure should normalize to explicit interface closeout or a narrower central pressure goal later.",
  },
  central_stabilize: {
    category: "exact_strategy_goal",
    mapsTo: ["corp.central_stabilize"],
    rationale: "Same semantic goal with side prefix added.",
  },
  remote_scoring_build: {
    category: "alias_to_strategy_goal",
    mapsTo: ["corp.remote_scoring"],
    rationale: "Build remote scoring normalizes to the remote scoring goal.",
  },
  ice_tax_glacier: {
    category: "exact_strategy_goal",
    mapsTo: ["corp.ice_tax_glacier"],
    rationale: "Same semantic goal with side prefix added.",
  },
  economy_rez_reserve: {
    category: "alias_to_strategy_goal",
    mapsTo: ["corp.economy_rez_reserve"],
    rationale:
      "Kept as a reserve-support goal; generic economy cards are not anchors by default.",
  },
  fast_advance_or_counter_ops: {
    category: "alias_to_strategy_goal",
    mapsTo: ["corp.fast_advance"],
    rationale: "Counter-operation details are support facts under fast advance.",
  },
  tag_trace_punish: {
    category: "exact_strategy_goal",
    mapsTo: ["corp.tag_trace_punish"],
    rationale: "Same semantic goal with side prefix added.",
  },
  bait_and_punish: {
    category: "should_be_removed_from_lineSupport",
    mapsTo: ["corp.ambush_bluff", "corp.tag_trace_punish"],
    rationale:
      "Too broad for future lineSupport; should split into ambush/bluff or tag-punish anchors.",
  },
  score_closeout: {
    category: "alias_to_strategy_goal",
    mapsTo: ["corp.rush_score"],
    rationale:
      "Legacy score closeout is a broad score conversion line; rush_score is the closest V1 goal.",
  },
};

const ROLE_ALIASES = {
  pressure_rnd: ["runner.rnd_pressure"],
  rd_pressure: ["runner.rnd_pressure"],
  rd_run: ["runner.rnd_pressure"],
  rd_multiaccess: ["runner.rnd_pressure"],
  pressure_hq: ["runner.hq_pressure"],
  hq_pressure: ["runner.hq_pressure"],
  hq_run: ["runner.hq_pressure"],
  multiaccess: ["runner.interface_closeout"],
  interface: ["runner.interface_closeout"],
  contest_remote: ["runner.remote_contest"],
  pressure_remote: ["runner.remote_contest"],
  trash_for_value: ["runner.remote_trash"],
  runner_access_trash_economy: ["runner.remote_trash"],
  build_rig: ["runner.rig_first"],
  runner_install_program: ["runner.rig_first"],
  recover_rig: ["runner.rig_first"],
  stack_search: ["runner.search.breaker"],
  program_search: ["runner.search.breaker"],
  recover_key_card: ["runner.search.breaker"],
  recover_cards: ["runner.search.breaker"],
  safe_probe_run: ["runner.run_event_tempo"],
  run_pressure: ["runner.run_event_tempo"],
  runner_play_event: ["runner.run_event_tempo"],
  runner_event_choice: ["runner.run_event_tempo"],
  avoid_tags: ["runner.survival_defense"],
  clear_tags: ["runner.survival_defense"],
  remove_tags: ["runner.survival_defense"],
  trace_defense: ["runner.survival_defense"],
  survive_damage: ["runner.survival_defense"],
  survive_meat_damage: ["runner.survival_defense"],
  survive_net_damage: ["runner.survival_defense"],
  survive_core_damage: ["runner.survival_defense"],
  build_scoring_remote: ["corp.remote_scoring"],
  score_now: ["corp.remote_scoring"],
  score_next_turn: ["corp.remote_scoring"],
  score_agenda: ["corp.remote_scoring"],
  corp_score_agenda: ["corp.remote_scoring"],
  scoring_remote_support: ["corp.remote_scoring"],
  remote_agenda_protection: ["corp.remote_scoring"],
  remote_asset_agenda_support: ["corp.remote_scoring"],
  remote_upgrade_agenda_support: ["corp.remote_scoring"],
  advance: ["corp.fast_advance"],
  advance_burst: ["corp.fast_advance"],
  corp_agenda_operation: ["corp.fast_advance"],
  protect_hq: ["corp.central_stabilize"],
  protect_rnd: ["corp.central_stabilize"],
  defend_server: ["corp.central_stabilize"],
  central_defense: ["corp.central_stabilize"],
  corp_install_ice: ["corp.ice_tax_glacier"],
  corp_rez_ice: ["corp.ice_tax_glacier"],
  taxing_ice: ["corp.ice_tax_glacier"],
  etr_ice: ["corp.ice_tax_glacier"],
  remote_asset_economy: ["corp.asset_economy"],
  economy_asset: ["corp.asset_economy"],
  remote_asset_pressure: ["corp.asset_economy"],
  remote_asset_control: ["corp.asset_economy"],
  bait_runner: ["corp.ambush_bluff"],
  remote_asset_trap: ["corp.ambush_bluff"],
  remote_upgrade_trap: ["corp.ambush_bluff"],
  ambush: ["corp.ambush_bluff"],
  tag_pressure: ["corp.tag_trace_punish"],
  tag_punish: ["corp.tag_trace_punish"],
  tag_punishment: ["corp.tag_trace_punish"],
  tag_punishment_operation: ["corp.tag_trace_punish"],
  punish_tagged_runner: ["corp.tag_trace_punish"],
  tag_ice: ["corp.tag_trace_punish"],
  trace_ice: ["corp.tag_trace_punish"],
  trace_pressure: ["corp.tag_trace_punish"],
  damage: ["corp.damage_kill"],
  damage_operation: ["corp.damage_kill"],
  run_start_damage: ["corp.damage_kill"],
  recover_economy: ["corp.economy_rez_reserve"],
  build_economy: ["corp.economy_rez_reserve"],
  economy_operation: ["corp.economy_rez_reserve"],
  managed_risk_economy: ["corp.economy_rez_reserve"],
  rez_expensive_ice_after_score: ["corp.economy_rez_reserve"],
};

const FUNCTION_LIKE_PATTERNS = [
  /economy/,
  /breaker/,
  /ice$/,
  /_ice/,
  /draw/,
  /memory/,
  /trace/,
  /tag/,
  /damage/,
  /prevention/,
  /access/,
  /remote/,
  /advance/,
  /install/,
  /rez/,
  /trash/,
  /search/,
  /recovery/,
  /recurring/,
  /counter/,
  /link/,
  /run_/,
  /_run/,
  /score/,
  /agenda/,
];

const LEGACY_ROLE_PATTERNS = [
  /identity/,
  /program/,
  /hardware/,
  /resource/,
  /event/,
  /operation/,
  /asset/,
  /upgrade/,
  /agenda/,
  /corp/,
  /runner/,
  /longtail/,
  /baseline/,
  /utility/,
  /setup/,
  /choice/,
  /random/,
  /unique/,
  /ai/,
  /deck/,
];

const ROLE_PLAN_ROLE_TRIAGE = {
  action: {
    category: "function_signal_only",
    rationale:
      "Generic action economy or action use context; not a StrategyGoal source.",
  },
  bit_depot: {
    category: "function_signal_only",
    rationale: "Legacy bit/credit storage vocabulary; economy function context only.",
  },
  bit_pool: {
    category: "function_signal_only",
    rationale: "Legacy bit/credit pool vocabulary; economy function context only.",
  },
  black_ops: {
    category: "legacy_role_only",
    rationale: "Flavor/subtype-style legacy context; not a strategy anchor.",
  },
  break_walls: {
    category: "function_signal_only",
    rationale: "Breaker coverage intent; kept as function context, not a strategy anchor.",
  },
  city_grid: {
    category: "legacy_role_only",
    rationale: "Card subtype/catalog context for City Grid upgrades.",
  },
  click_for_credits_when_safe: {
    category: "function_signal_only",
    rationale: "Tactical economy action hint; not a StrategyGoal source.",
  },
  code_gate: {
    category: "function_signal_only",
    rationale: "ICE subtype or breaker coverage context only.",
  },
  connection: {
    category: "legacy_role_only",
    rationale: "Runner resource subtype/catalog context.",
  },
  credit_swing: {
    category: "function_signal_only",
    rationale: "Economy swing descriptor; not a strategy anchor.",
  },
  daemon: {
    category: "legacy_role_only",
    rationale: "Program subtype/catalog context.",
  },
  daemon_host: {
    category: "function_signal_only",
    rationale: "Hosting function context for Daemon programs.",
  },
  etr_tax: {
    category: "function_signal_only",
    rationale: "End-the-run tax descriptor; covered by ICE/tax function signals.",
  },
  expose: {
    category: "function_signal_only",
    rationale: "Expose/information function context only.",
  },
  expose_helper: {
    category: "function_signal_only",
    rationale: "Expose/information support context only.",
  },
  gray_ops: {
    category: "legacy_role_only",
    rationale: "Subtype/flavor-like legacy context; not a strategy anchor.",
  },
  handlimit: {
    category: "function_signal_only",
    rationale: "Hand-size/limit function context only.",
  },
  hidden_information_pressure: {
    category: "descriptor_gap",
    rationale:
      "Broad hidden-information pressure needs structured info descriptors before strategy use.",
  },
  hidden_zone: {
    category: "descriptor_gap",
    rationale:
      "Hidden-zone access/search/reorder needs structured descriptors, not StrategyGoal aliasing.",
  },
  hidden_zone_tool: {
    category: "descriptor_gap",
    rationale:
      "Hidden-zone tool is broad ontology context and must not feed Planner strategy directly.",
  },
  hosting: {
    category: "function_signal_only",
    rationale: "Hosting/host relationship function context only.",
  },
  ice_modifier: {
    category: "function_signal_only",
    rationale: "ICE modifier/support function context only.",
  },
  information: {
    category: "descriptor_gap",
    rationale:
      "Broad information pressure is not stable enough to map without a narrower descriptor.",
  },
  killer_support: {
    category: "function_signal_only",
    rationale: "Breaker/support function context only.",
  },
  modifier: {
    category: "function_signal_only",
    rationale: "Generic modifier context; requires structured source fields for derivation.",
  },
  noisy: {
    category: "remove_or_deprecate",
    rationale: "Low-signal legacy vocabulary; keep out of strategy derivation.",
  },
  persistent: {
    category: "legacy_role_only",
    rationale: "Persistence/lifecycle context; not a strategy anchor.",
  },
  persistent_liability: {
    category: "legacy_role_only",
    rationale: "Risk/liability context; not a StrategyGoal source.",
  },
  position: {
    category: "legacy_role_only",
    rationale: "Runner resource subtype/catalog context.",
  },
  protect_rig: {
    category: "function_signal_only",
    rationale: "Rig-defense tactical context, not a strategy anchor.",
  },
  rd_reorder: {
    category: "descriptor_gap",
    rationale:
      "R&D reorder needs a structured information descriptor before strategy use.",
  },
  rd_reveal: {
    category: "descriptor_gap",
    rationale:
      "R&D reveal needs a structured information descriptor before strategy use.",
  },
  rd_success_replacement: {
    category: "descriptor_gap",
    rationale:
      "Successful-run replacement is not precise enough for direct strategy aliasing.",
  },
  recursion: {
    category: "function_signal_only",
    rationale: "Card recovery/recursion function context only.",
  },
  recycle_zones: {
    category: "function_signal_only",
    rationale: "Zone recycle/shuffle function context only.",
  },
  region: {
    category: "legacy_role_only",
    rationale: "Region subtype/catalog context.",
  },
  rig_defense: {
    category: "function_signal_only",
    rationale: "Rig protection function context only.",
  },
  sentry: {
    category: "function_signal_only",
    rationale: "ICE subtype or breaker coverage context only.",
  },
  server_defense: {
    category: "function_signal_only",
    rationale: "Broad server protection context; use structured remote/ICE descriptors.",
  },
  server_development: {
    category: "descriptor_gap",
    rationale:
      "Remote/server development shape needs structured scoring descriptors before strategy use.",
  },
  server_tax: {
    category: "function_signal_only",
    rationale: "Server tax function context only.",
  },
  stack_reorder: {
    category: "descriptor_gap",
    rationale:
      "Stack reorder needs a structured hidden-zone descriptor before strategy use.",
  },
  start_of_turn: {
    category: "function_signal_only",
    rationale: "Timing context only.",
  },
  steal_reward: {
    category: "deferred_requires_human_review",
    rationale:
      "Steal reward can be payoff or tactical value depending on the card; defer.",
  },
  stealth: {
    category: "function_signal_only",
    rationale: "Stealth/economy support context only.",
  },
  stealth_loss: {
    category: "function_signal_only",
    rationale: "Breaker drawback/function context only.",
  },
  sysop: {
    category: "legacy_role_only",
    rationale: "Corp subtype/catalog context.",
  },
  tempo: {
    category: "function_signal_only",
    rationale: "Broad tempo function context; not a StrategyGoal source.",
  },
  transactions: {
    category: "legacy_role_only",
    rationale: "Operation subtype/catalog context.",
  },
  virus: {
    category: "function_signal_only",
    rationale: "Virus counter/card-function context only.",
  },
  worm_hate: {
    category: "function_signal_only",
    rationale: "Specific tech/function context; not a strategy anchor.",
  },
};

export function buildAiStrategyTaxonomyReport(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const activeHints = readJson(repoRoot, ACTIVE_HINTS_PATH);
  const compiledHints = readJson(repoRoot, COMPILED_HINTS_PATH);
  const strategyGoalsData = readJson(repoRoot, STRATEGY_GOALS_PATH);
  const strategicRolesData = readJson(repoRoot, STRATEGIC_ROLES_PATH);
  const functionDerivationData = readJson(
    repoRoot,
    FUNCTION_SIGNAL_DERIVATION_PATH,
  );
  const tacticSignalCatalogData = readJson(repoRoot, TACTIC_SIGNAL_CATALOG_PATH);

  const hardErrors = [];
  const warnings = [];

  const strategyGoals = strategyGoalsData.strategyGoals ?? [];
  const strategicRoles = strategicRolesData.strategicRoles ?? [];
  const derivationRules = functionDerivationData.derivationRules ?? [];

  const strategyIds = new Set(
    strategyGoals.map((goal) => goal.strategyId).filter(Boolean),
  );
  const strategicRoleIds = new Set(
    strategicRoles.map((role) => role.roleId).filter(Boolean),
  );
  const functionSignalIds = new Set(
    derivationRules.map((rule) => rule.signalId).filter(Boolean),
  );
  const tacticSignalIds = new Set(
    (tacticSignalCatalogData.signals ?? [])
      .map((signal) => signal.signalId)
      .filter(Boolean),
  );

  validateStrategyGoals(strategyGoalsData, hardErrors);
  validateStrategicRoles(strategicRolesData, hardErrors);
  validateFunctionDerivation(
    functionDerivationData,
    strategyIds,
    hardErrors,
    warnings,
  );
  validateTacticSignalCatalog(
    tacticSignalCatalogData,
    derivationRules,
    strategyIds,
    hardErrors,
    warnings,
  );
  validateHiddenInfoKeys(
    strategyGoalsData,
    STRATEGY_GOALS_PATH,
    hardErrors,
  );
  validateHiddenInfoKeys(
    strategicRolesData,
    STRATEGIC_ROLES_PATH,
    hardErrors,
  );
  validateHiddenInfoKeys(
    functionDerivationData,
    FUNCTION_SIGNAL_DERIVATION_PATH,
    hardErrors,
  );
  validateHiddenInfoKeys(
    tacticSignalCatalogData,
    TACTIC_SIGNAL_CATALOG_PATH,
    hardErrors,
  );
  validateNoManualFunctionTags(
    activeHints,
    ACTIVE_HINTS_PATH,
    hardErrors,
  );
  validateNoManualFunctionTags(
    compiledHints,
    COMPILED_HINTS_PATH,
    hardErrors,
  );
  validateOpponentSignals(activeHints, ACTIVE_HINTS_PATH, hardErrors);
  validateOpponentSignals(compiledHints, COMPILED_HINTS_PATH, hardErrors);
  validateHiddenInfoKeys(activeHints, ACTIVE_HINTS_PATH, hardErrors);
  validateHiddenInfoKeys(compiledHints, COMPILED_HINTS_PATH, hardErrors);
  validateLineSupportValues(
    activeHints,
    ACTIVE_HINTS_PATH,
    strategyIds,
    hardErrors,
  );
  validateLineSupportValues(
    compiledHints,
    COMPILED_HINTS_PATH,
    strategyIds,
    hardErrors,
  );
  validateStrategicRoleIfPresent(
    activeHints,
    ACTIVE_HINTS_PATH,
    strategicRoleIds,
    hardErrors,
  );
  validateStrategicRoleIfPresent(
    compiledHints,
    COMPILED_HINTS_PATH,
    strategicRoleIds,
    hardErrors,
  );

  const activeCards = activeHints.cards ?? [];
  const compiledCards = compiledHints.cards ?? [];
  const activeCardIds = sortedUnique(activeCards.map((card) => card.cardId));
  const compiledCardIds = sortedUnique(compiledCards.map((card) => card.cardId));
  const sameCardIdSet = sameStringArray(activeCardIds, compiledCardIds);
  if (!sameCardIdSet) {
    hardErrors.push({
      kind: "active_compiled_card_id_drift",
      path: COMPILED_HINTS_PATH,
      message: "Active and compiled AI hints do not have the same card IDs.",
    });
  }

  const compiledFieldCounts = collectFieldCounts(compiledCards);
  const valueInventories = {
    roles: collectValueInventory(compiledCards, "roles"),
    planRoles: collectValueInventory(compiledCards, "planRoles"),
    lineSupport: collectValueInventory(compiledCards, "lineSupport"),
  };
  const aliasReport = buildAliasReport({
    valueInventories,
    strategyIds,
    functionSignalIds,
  });
  const functionSignalSummary = deriveFunctionSignalSummary(
    compiledCards,
    derivationRules,
  );
  const derivationSmokeTests = buildDerivationSmokeTests(derivationRules);
  const sideAwareDerivation = analyzeSideAwareDerivation(
    compiledCards,
    derivationRules,
  );
  for (const mismatch of sideAwareDerivation.wrongSideAnchorMatches) {
    hardErrors.push({
      kind: "wrong_side_strategy_anchor_match",
      path: FUNCTION_SIGNAL_DERIVATION_PATH,
      message: `Rule ${mismatch.signalId} derived ${mismatch.strategyId} for ${mismatch.cardId} (${mismatch.side}).`,
      item: mismatch,
    });
  }

  const legacyLineSupportValues = valueInventories.lineSupport
    .filter((entry) => !strategyIds.has(entry.value))
    .map((entry) => ({
      value: entry.value,
      count: entry.count,
      category: aliasReport.lineSupport.find(
        (mapped) => mapped.value === entry.value,
      )?.mappingCategory,
      mapsTo:
        aliasReport.lineSupport.find((mapped) => mapped.value === entry.value)
          ?.mapsTo ?? [],
    }));
  if (legacyLineSupportValues.length > 0) {
    warnings.push({
      kind: "legacy_lineSupport_values_warn_only",
      count: legacyLineSupportValues.length,
      occurrences: legacyLineSupportValues.reduce(
        (sum, item) => sum + item.count,
        0,
      ),
      message:
        "Existing lineSupport values are known legacy aliases and remain warn-only when allowlisted and side-correct.",
      items: legacyLineSupportValues,
    });
  }

  const rolePlanRoleValues = [...aliasReport.roles, ...aliasReport.planRoles];
  for (const warningClass of [
    {
      category: "function_signal_only",
      kind: "function_signal_only_role_or_planRole_values_warn_only",
      message:
        "Known roles or planRoles describe function/tactical context only and are not strategy anchors.",
    },
    {
      category: "legacy_role_only",
      kind: "legacy_role_or_planRole_values_warn_only",
      message:
        "Known roles or planRoles are retained as legacy/catalog context only.",
    },
    {
      category: "descriptor_gap",
      kind: "descriptor_gap_role_or_planRole_values_warn_only",
      message:
        "Known roles or planRoles point at descriptor gaps and require structured ontology work before strategy use.",
    },
    {
      category: "remove_or_deprecate",
      kind: "remove_or_deprecate_role_or_planRole_values_warn_only",
      message:
        "Known roles or planRoles are low-signal legacy vocabulary and should not be used for strategy derivation.",
    },
    {
      category: "deferred_requires_human_review",
      kind: "deferred_role_or_planRole_values_warn_only",
      message:
        "Known roles or planRoles are intentionally deferred until card-level review.",
    },
  ]) {
    const items = rolePlanRoleValues.filter(
      (entry) =>
        entry.mappingCategory === warningClass.category &&
        entry.triageSource === "ai004_explicit",
    );
    if (items.length === 0) continue;
    warnings.push({
      kind: warningClass.kind,
      count: items.length,
      occurrences: items.reduce((sum, item) => sum + item.count, 0),
      message: warningClass.message,
      items,
    });
  }

  const unknownRoleValues = rolePlanRoleValues.filter(
    (entry) => entry.mappingCategory === "unknown_unmapped",
  );
  if (unknownRoleValues.length > 0) {
    warnings.push({
      kind: "unknown_role_or_planRole_values_warn_only",
      count: unknownRoleValues.length,
      occurrences: unknownRoleValues.reduce(
        (sum, item) => sum + item.count,
        0,
      ),
      message:
        "Some existing roles or planRoles are unmapped in the AI003 contract report.",
      items: unknownRoleValues,
    });
  }

  const descriptorGaps = functionDerivationData.descriptorGaps ?? [];
  if (descriptorGaps.length > 0) {
    warnings.push({
      kind: "function_signal_descriptor_gaps_warn_only",
      count: descriptorGaps.length,
      message:
        "Some strategy-relevant functions are intentionally not derived because the structured descriptor is not stable yet.",
      items: descriptorGaps,
    });
  }

  const strategyGoalCounts = countBy(strategyGoals, (goal) => goal.side);
  const report = {
    schemaVersion: "ai-strategy-taxonomy-check-report-v1",
    taskId: TASK_ID,
    updatesTaskId: UPDATES_TASK_ID,
    generatedAt: GENERATED_AT,
    status: hardErrors.length === 0 ? "pass_with_warnings" : "fail",
    hardErrorCount: hardErrors.length,
    warningCount: warnings.reduce((sum, warning) => sum + itemCount(warning), 0),
    source: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      compiledHintsPath: COMPILED_HINTS_PATH,
      strategyGoalsPath: STRATEGY_GOALS_PATH,
      strategicRolesPath: STRATEGIC_ROLES_PATH,
      functionSignalDerivationPath: FUNCTION_SIGNAL_DERIVATION_PATH,
      tacticSignalCatalogPath: TACTIC_SIGNAL_CATALOG_PATH,
      runtimeEffect:
        "none; AI003-1 sharpens read-only function-signal derivation gates only",
    },
    hintCounts: {
      active: activeCards.length,
      compiled: compiledCards.length,
      sameCardIdSet,
      allCompiledAiSupported: compiledCards.every(
        (hint) => hint.aiSupportStatus === "ai_supported",
      ),
    },
    taxonomy: {
      strategyGoalCount: strategyGoals.length,
      runnerStrategyGoalCount: strategyGoalCounts.runner ?? 0,
      corpStrategyGoalCount: strategyGoalCounts.corp ?? 0,
      strategyIds: [...strategyIds].sort(),
      strategicRoleCount: strategicRoles.length,
      strategicRoleIds: [...strategicRoleIds].sort(),
      functionSignalRuleCount: derivationRules.length,
      functionSignalCount: functionSignalIds.size,
      functionSignalIds: [...functionSignalIds].sort(),
      tacticSignalCatalogCount: tacticSignalIds.size,
      tacticSignalCatalogIds: [...tacticSignalIds].sort(),
    },
    structuredHintInventory: {
      structuredFieldsAlreadyPresent: [
        "effects",
        "conditions",
        "costProfile",
        "breakerProfile",
        "remoteRole",
        "targetProfiles",
        "lineSupport",
        "opponentSignals",
        "quality",
        "valueHints",
        "roles",
        "planRoles",
        "requiredMechanics",
        "riskTags",
        "scenarioRefs",
      ],
      mechanicalFactFields: [
        "effects",
        "conditions",
        "costProfile",
        "breakerProfile",
        "remoteRole",
        "targetProfiles",
      ],
      strategicHintFields: [
        "lineSupport",
        "strategicRole",
        "roles",
        "planRoles",
        "strategicNotes",
        "quality.strategyCovered",
        "opponentSignals",
      ],
      runtimeEffectiveFields: [
        "roles",
        "planRoles",
        "valueHints",
        "effects",
        "conditions",
        "breakerProfile",
        "remoteRole",
        "targetProfiles",
      ],
      reviewOnlyOrLegacyContextFields: [
        "lineSupport",
        "quality",
        "manualNotes",
        "strategicNotes",
        "descriptorGaps",
        "riskTags",
        "requiredMechanics",
        "scenarioRefs",
      ],
      compiledFieldCounts,
    },
    wildGrowth: {
      roleValueCount: valueInventories.roles.length,
      planRoleValueCount: valueInventories.planRoles.length,
      lineSupportValueCount: valueInventories.lineSupport.length,
      lineSupportLegacyStatus: "legacy_warn_only_in_ai003",
    },
    functionSignals: {
      derivedSignalCounts: functionSignalSummary.signalCounts,
      derivedStrategyAnchorCounts:
        functionSignalSummary.strategyAnchorCounts,
      totalDerivedStrategyAnchors:
        functionSignalSummary.totalStrategyAnchorCount,
      cardsWithDerivedSignals: functionSignalSummary.cardsWithSignals,
      cardsWithStrategyAnchors: functionSignalSummary.cardsWithStrategyAnchors,
      descriptorGaps,
      unsafeDerivationsSkipped: [
        "valueHints",
        "roles",
        "planRoles",
        "lineSupport",
        "opponent hidden state",
      ],
    },
    sideAwareDerivation,
    derivationSmokeTests,
    aliasSummary: aliasReport.summary,
    ai004Triage: {
      lineSupport: buildLineSupportTriage(compiledCards, strategyIds),
      roles: aliasReport.roles,
      planRoles: aliasReport.planRoles,
      descriptorGaps: buildDescriptorGapTriage(descriptorGaps),
      explicitNonRuntimePolicy: {
        plannerEffect: "none",
        deckDoctrineCutover: "none",
        actionScoreChange: "none",
        planWeightChange: "none",
        profileOrDefaultSwitch: "none",
      },
    },
    hardErrors,
    warnings,
    gates: {
      invalidStrategyGoalsFail: true,
      duplicateStrategyIdsFail: true,
      sidePrefixMismatchFail: true,
      invalidStrategicRolesFail: true,
      hiddenInfoFieldsFail: true,
      manualFunctionTagsFail: true,
      hiddenInfoFieldsInHintsFail: true,
      opponentSignalsVisibleEvidenceOnlyFail: true,
      unknownLineSupportFail: true,
      lineSupportSideMismatchFail: true,
      wrongSideStrategyAnchorMatchesFail: true,
      strategyAnchorWithoutSideGateFail: true,
      unknownRuleGateFieldFail: true,
      legacyLineSupportWarnOnly: true,
      knownRolePlanRoleTriageWarnOnly: true,
      unmappedRolesWarnOnly: true,
      descriptorGapsWarnOnly: true,
      strategyAnchorWithoutEffectScopeWarn: true,
    },
    explicitNonScope: [
      "no Engine rule change",
      "no LegalAction change",
      "no planner effect",
      "no action score change",
      "no plan weight change",
      "no profile/default switch",
      "no deck change",
      "no broad hint migration",
      "no Catalog or Proteus baseline change",
    ],
  };

  return { report, aliasReport };
}

function buildAliasReport({ valueInventories, strategyIds, functionSignalIds }) {
  const roles = mapInventoryValues(
    "roles",
    valueInventories.roles,
    strategyIds,
    functionSignalIds,
  );
  const planRoles = mapInventoryValues(
    "planRoles",
    valueInventories.planRoles,
    strategyIds,
    functionSignalIds,
  );
  const lineSupport = mapInventoryValues(
    "lineSupport",
    valueInventories.lineSupport,
    strategyIds,
    functionSignalIds,
  );
  const all = [...roles, ...planRoles, ...lineSupport];
  const summary = {
    totals: {
      roles: roles.length,
      planRoles: planRoles.length,
      lineSupport: lineSupport.length,
      allValues: all.length,
    },
    categoryCounts: countBy(all, (entry) => entry.mappingCategory),
    mappedCounts: {
      exactStrategyGoal: all.filter(
        (entry) => entry.mappingCategory === "exact_strategy_goal",
      ).length,
      aliasToStrategyGoal: all.filter(
        (entry) => entry.mappingCategory === "alias_to_strategy_goal",
      ).length,
      functionSignalOnly: all.filter(
        (entry) => entry.mappingCategory === "function_signal_only",
      ).length,
      legacyRoleOnly: all.filter(
        (entry) => entry.mappingCategory === "legacy_role_only",
      ).length,
      unknownUnmapped: all.filter(
        (entry) => entry.mappingCategory === "unknown_unmapped",
      ).length,
      shouldBeRemovedFromLineSupport: all.filter(
        (entry) =>
          entry.mappingCategory === "should_be_removed_from_lineSupport",
      ).length,
    },
  };
  return {
    schemaVersion: "ai003-strategy-taxonomy-alias-report-v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    source: {
      compiledHintsPath: COMPILED_HINTS_PATH,
      strategyGoalsPath: STRATEGY_GOALS_PATH,
      functionSignalDerivationPath: FUNCTION_SIGNAL_DERIVATION_PATH,
      lineSupportLegacyPolicy: "warn_only_in_ai003",
    },
    summary,
    totals: summary.totals,
    categoryCounts: summary.categoryCounts,
    mappedCounts: summary.mappedCounts,
    problematicExamples: {
      lineSupportShouldBeRemoved: lineSupport
        .filter(
          (entry) =>
            entry.mappingCategory === "should_be_removed_from_lineSupport",
        )
        .slice(0, 20),
      unknownRoles: roles
        .filter((entry) => entry.mappingCategory === "unknown_unmapped")
        .slice(0, 20),
      unknownPlanRoles: planRoles
        .filter((entry) => entry.mappingCategory === "unknown_unmapped")
        .slice(0, 20),
    },
    roles,
    planRoles,
    lineSupport,
  };
}

function mapInventoryValues(field, entries, strategyIds, functionSignalIds) {
  return entries.map((entry) => {
    const mapping = classifyExistingValue(
      field,
      entry.value,
      strategyIds,
      functionSignalIds,
    );
    return {
      value: entry.value,
      count: entry.count,
      mappingCategory: mapping.category,
      triageCategory: mapping.triageCategory ?? mapping.category,
      triageSource: mapping.triageSource ?? "classifier",
      mapsTo: mapping.mapsTo,
      rationale: mapping.rationale,
      examples: entry.examples,
    };
  });
}

function classifyExistingValue(
  field,
  value,
  strategyIds,
  functionSignalIds,
) {
  if (strategyIds.has(value)) {
    return {
      category: "exact_strategy_goal",
      mapsTo: [value],
      rationale: "Already uses a normalized strategy ID.",
    };
  }

  if (field === "lineSupport" && LINE_SUPPORT_MAPPINGS[value]) {
    return withLineSupportTriageCategory(value, LINE_SUPPORT_MAPPINGS[value]);
  }

  if (ROLE_ALIASES[value]) {
    return {
      category: "alias_to_strategy_goal",
      triageCategory: "strategy_alias",
      mapsTo: ROLE_ALIASES[value],
      rationale: "Legacy role or planRole aliases to a normalized strategy.",
    };
  }

  if ((field === "roles" || field === "planRoles") && ROLE_PLAN_ROLE_TRIAGE[value]) {
    return {
      category: ROLE_PLAN_ROLE_TRIAGE[value].category,
      triageCategory: ROLE_PLAN_ROLE_TRIAGE[value].category,
      triageSource: "ai004_explicit",
      mapsTo: [],
      rationale: ROLE_PLAN_ROLE_TRIAGE[value].rationale,
    };
  }

  if (functionSignalIds.has(value) || isFunctionLikeValue(value)) {
    return {
      category: "function_signal_only",
      triageCategory: "function_signal_only",
      mapsTo: [],
      rationale:
        "Value describes a card function or tactical support signal, not a direct strategy anchor.",
    };
  }

  if (isLegacyRoleOnlyValue(value)) {
    return {
      category: "legacy_role_only",
      triageCategory: "legacy_role_only",
      mapsTo: [],
      rationale:
        "Value is retained as legacy role/catalog/review context and is not a strategy goal.",
    };
  }

  return {
    category: "unknown_unmapped",
    triageCategory: "unknown_unmapped",
    mapsTo: [],
    rationale:
      "No AI003 mapping rule matched this value; later migration should review it explicitly.",
  };
}

function withLineSupportTriageCategory(value, mapping) {
  if (mapping.triageCategory) return mapping;
  if (mapping.category === "should_be_removed_from_lineSupport") {
    return {
      ...mapping,
      triageCategory: "should_be_removed_from_lineSupport",
    };
  }
  if (
    [
      "rig_first",
      "economy_first",
      "economy_rez_reserve",
      "score_closeout",
      "remote_contest",
      "closeout_pressure",
    ].includes(value)
  ) {
    return {
      ...mapping,
      triageCategory: "structure_or_support_goal_requires_card_review",
    };
  }
  return {
    ...mapping,
    triageCategory: "safe_strategy_anchor_alias",
  };
}

function buildLineSupportTriage(cards, strategyIds) {
  const entries = [];
  for (const hint of cards) {
    for (const value of hint.lineSupport ?? []) {
      entries.push(classifyLineSupportForCard(value, hint, strategyIds));
    }
  }
  return {
    totalOccurrences: entries.length,
    legacyOccurrences: entries.filter(
      (entry) => entry.triageCategory !== "normalized_strategy_id",
    ).length,
    categoryCounts: countBy(entries, (entry) => entry.triageCategory),
    valueCounts: collectValueInventory(cards, "lineSupport").map((entry) => ({
      value: entry.value,
      count: entry.count,
    })),
    entries,
  };
}

function classifyLineSupportForCard(value, hint, strategyIds) {
  const base = {
    cardId: hint.cardId,
    side: hint.side,
    cardType: hint.cardType,
    value,
    evidence: lineSupportEvidence(hint),
  };
  if (strategyIds.has(value)) {
    return {
      ...base,
      triageCategory: "normalized_strategy_id",
      mapsTo: [value],
      rationale: "Already normalized to a side-prefixed StrategyGoal.",
    };
  }
  const mapping = LINE_SUPPORT_MAPPINGS[value];
  if (!mapping) {
    return {
      ...base,
      triageCategory: "unknown_unmapped",
      mapsTo: [],
      rationale: "Not in the known legacy lineSupport allowlist.",
    };
  }
  if (hint.quality?.needsHumanReview === true) {
    return {
      ...base,
      triageCategory: "deferred_requires_human_review",
      mapsTo: mapping.mapsTo ?? [],
      rationale: "Card is already flagged for human review; do not batch-migrate.",
    };
  }
  const effectKinds = new Set((hint.effects ?? []).map((effect) => effect.kind));
  const effectScopes = new Set((hint.effects ?? []).map((effect) => effect.scope));
  const roles = new Set([...(hint.roles ?? []), ...(hint.planRoles ?? [])]);
  if (
    value === "remote_contest" &&
    effectKinds.has("trash_credit") &&
    hint.side === "runner"
  ) {
    return {
      ...base,
      triageCategory: "safe_strategy_anchor_alias",
      mapsTo: ["runner.remote_trash"],
      rationale:
        "Runner trash-credit payoff is a remote trash anchor, not generic remote contest.",
    };
  }
  if (
    value === "remote_contest" ||
    value === "rig_first" ||
    value === "economy_first" ||
    value === "economy_rez_reserve" ||
    value === "score_closeout"
  ) {
    return {
      ...base,
      triageCategory: "structure_or_support_goal_requires_card_review",
      mapsTo: mapping.mapsTo ?? [],
      rationale:
        "Broad structural/support lineSupport value; keep legacy until card-level review.",
    };
  }
  if (
    value === "closeout_pressure" &&
    !effectKinds.has("multiaccess") &&
    !roles.has("multiaccess")
  ) {
    return {
      ...base,
      triageCategory: "should_be_removed_from_lineSupport",
      mapsTo: [],
      rationale:
        "Closeout pressure without multiaccess/interface evidence is too broad for lineSupport.",
    };
  }
  if (
    value === "early_rnd_pressure" &&
    (effectScopes.has("rnd") || roles.has("pressure_rnd") || roles.has("rd_run"))
  ) {
    return {
      ...base,
      triageCategory: "safe_strategy_anchor_alias",
      mapsTo: ["runner.rnd_pressure"],
      rationale: "R&D access/topdeck evidence supports Runner R&D pressure.",
    };
  }
  if (
    value === "early_hq_pressure" &&
    (effectScopes.has("hq") || roles.has("pressure_hq") || roles.has("hq_run"))
  ) {
    return {
      ...base,
      triageCategory: "safe_strategy_anchor_alias",
      mapsTo: ["runner.hq_pressure"],
      rationale: "HQ access evidence supports Runner HQ pressure.",
    };
  }
  if (
    value === "interface_pressure" &&
    (effectKinds.has("multiaccess") ||
      roles.has("multiaccess") ||
      hint.cardId.includes("interface"))
  ) {
    return {
      ...base,
      triageCategory: "safe_strategy_anchor_alias",
      mapsTo: ["runner.interface_closeout"],
      rationale: "Interface/multiaccess evidence supports interface closeout.",
    };
  }
  if (
    value === "tag_trace_punish" &&
    hint.side === "corp" &&
    ["tag_source", "tag_punish_payoff", "trace", "damage"].some((kind) =>
      effectKinds.has(kind),
    )
  ) {
    return {
      ...base,
      triageCategory: "safe_strategy_anchor_alias",
      mapsTo: ["corp.tag_trace_punish"],
      rationale: "Corp tag/trace/punish effects support the normalized anchor.",
    };
  }
  return {
    ...base,
    triageCategory:
      withLineSupportTriageCategory(value, mapping).triageCategory,
    mapsTo: mapping.mapsTo ?? [],
    rationale: mapping.rationale,
  };
}

function lineSupportEvidence(hint) {
  return {
    lineSupport: hint.lineSupport ?? [],
    effects: (hint.effects ?? []).map((effect) => ({
      kind: effect.kind,
      scope: effect.scope,
      timing: effect.timing,
      resource: effect.resource,
    })),
    conditions: (hint.conditions ?? []).map((condition) => condition.kind),
    breakerProfile: hint.breakerProfile,
    remoteRole: hint.remoteRole,
    targetProfiles: hint.targetProfiles,
    cardType: hint.cardType,
    side: hint.side,
    quality: hint.quality,
  };
}

function buildDescriptorGapTriage(descriptorGaps) {
  const affectedValuesByGap = {
    remote_contest_pressure_not_first_class: [
      "remote_contest",
      "contest_remote",
      "server_development",
    ],
    cheap_ice_and_rush_shape_partial: [
      "score_closeout",
      "ice_tax_glacier",
      "server_defense",
      "etr_tax",
    ],
    interface_closeout_density_requires_aggregation: [
      "interface_pressure",
      "closeout_pressure",
      "information",
      "hidden_information_pressure",
    ],
  };
  return descriptorGaps.map((gap) => ({
    gapId: gap.gapId,
    description: gap.description,
    affectedSignalsOrValues: affectedValuesByGap[gap.gapId] ?? [],
    batchMigrationDecision: "do_not_bulk_migrate_in_AI004",
    needsSchemaOrDescriptorExtension: true,
    laterDeckDoctrineAggregation:
      gap.gapId === "interface_closeout_density_requires_aggregation",
  }));
}

function deriveFunctionSignalSummary(cards, rules) {
  const signalCounts = {};
  const strategyAnchorCounts = {};
  let cardsWithSignals = 0;
  let cardsWithStrategyAnchors = 0;
  let totalStrategyAnchorCount = 0;
  for (const hint of cards) {
    const result = deriveFunctionSignalsFromHint(hint, rules);
    if (result.signals.length > 0) cardsWithSignals += 1;
    if (result.anchorStrategyIds.length > 0) cardsWithStrategyAnchors += 1;
    for (const signal of result.signals) {
      signalCounts[signal] = (signalCounts[signal] ?? 0) + 1;
    }
    for (const strategyId of result.anchorStrategyIds) {
      strategyAnchorCounts[strategyId] =
        (strategyAnchorCounts[strategyId] ?? 0) + 1;
      totalStrategyAnchorCount += 1;
    }
  }
  return {
    cardsWithSignals,
    cardsWithStrategyAnchors,
    signalCounts: sortObjectByKey(signalCounts),
    strategyAnchorCounts: sortObjectByKey(strategyAnchorCounts),
    totalStrategyAnchorCount,
  };
}

export function deriveFunctionSignalsFromHint(hint, rules) {
  const signals = new Set();
  const anchorStrategyIds = new Set();
  for (const rule of rules) {
    if (!ruleMatchesHint(rule, hint)) continue;
    signals.add(rule.signalId);
    for (const strategyId of rule.strategyAnchorFor ?? []) {
      anchorStrategyIds.add(strategyId);
    }
  }
  return {
    cardId: hint.cardId,
    signals: [...signals].sort(),
    anchorStrategyIds: [...anchorStrategyIds].sort(),
  };
}

function ruleMatchesHint(rule, hint) {
  if (rule.source === "effects") {
    return (hint.effects ?? []).some(
      (effect) =>
        matchRecord(effect, rule.match) && ruleGatesMatch(rule, hint, effect),
    );
  }
  if (rule.source === "conditions") {
    return (hint.conditions ?? []).some((condition) =>
      matchRecord(condition, rule.match) &&
      ruleGatesMatch(rule, hint, undefined),
    );
  }
  if (rule.source === "breakerProfile") {
    return matchRecord(hint.breakerProfile, rule.match) &&
      ruleGatesMatch(rule, hint, undefined);
  }
  if (rule.source === "breakerProfile.coverage") {
    const coverage = rule.match?.coverage;
    return (
      typeof coverage === "string" &&
      Array.isArray(hint.breakerProfile?.coverage) &&
      hint.breakerProfile.coverage.includes(coverage) &&
      ruleGatesMatch(rule, hint, undefined)
    );
  }
  if (rule.source === "breakerProfile.restrictions") {
    const restriction = rule.match?.restriction;
    return (
      typeof restriction === "string" &&
      Array.isArray(hint.breakerProfile?.restrictions) &&
      hint.breakerProfile.restrictions.includes(restriction) &&
      ruleGatesMatch(rule, hint, undefined)
    );
  }
  if (rule.source === "breakerProfile.sideEffects") {
    const sideEffect = rule.match?.sideEffect;
    return (
      typeof sideEffect === "string" &&
      Array.isArray(hint.breakerProfile?.sideEffects) &&
      hint.breakerProfile.sideEffects.includes(sideEffect) &&
      ruleGatesMatch(rule, hint, undefined)
    );
  }
  if (rule.source === "remoteRole") {
    return matchRecord(hint.remoteRole, rule.match) &&
      ruleGatesMatch(rule, hint, undefined);
  }
  return false;
}

function ruleBaseMatchesHint(rule, hint) {
  if (rule.source === "effects") {
    return (hint.effects ?? []).some((effect) => matchRecord(effect, rule.match));
  }
  if (rule.source === "conditions") {
    return (hint.conditions ?? []).some((condition) =>
      matchRecord(condition, rule.match),
    );
  }
  if (rule.source === "breakerProfile") {
    return matchRecord(hint.breakerProfile, rule.match);
  }
  if (rule.source === "breakerProfile.coverage") {
    const coverage = rule.match?.coverage;
    return (
      typeof coverage === "string" &&
      Array.isArray(hint.breakerProfile?.coverage) &&
      hint.breakerProfile.coverage.includes(coverage)
    );
  }
  if (rule.source === "breakerProfile.restrictions") {
    const restriction = rule.match?.restriction;
    return (
      typeof restriction === "string" &&
      Array.isArray(hint.breakerProfile?.restrictions) &&
      hint.breakerProfile.restrictions.includes(restriction)
    );
  }
  if (rule.source === "breakerProfile.sideEffects") {
    const sideEffect = rule.match?.sideEffect;
    return (
      typeof sideEffect === "string" &&
      Array.isArray(hint.breakerProfile?.sideEffects) &&
      hint.breakerProfile.sideEffects.includes(sideEffect)
    );
  }
  if (rule.source === "remoteRole") return matchRecord(hint.remoteRole, rule.match);
  return false;
}

function ruleGatesMatch(rule, hint, effect) {
  const gates = rule.gates;
  if (!isRecord(gates)) return true;
  if (!matchesGateValue(hint.side, gates.side)) return false;
  if (!matchesGateValue(hint.cardType, gates.cardType)) return false;
  if (!matchesGateValue(effect?.scope, gates.effectScope)) return false;
  if (!matchesGateValue(effect?.target, gates.target)) return false;
  if (!matchesGateValue(effect?.controller, gates.controller)) return false;
  if (!matchesGateValue(effect?.beneficiary, gates.beneficiary)) return false;
  if (!matchesGateValue(hint.remoteRole?.kind, gates.remoteRole)) return false;
  if (gates.remoteRoleStrategyDerivationAbsent !== undefined) {
    const forbidden = normalizeGateValues(gates.remoteRoleStrategyDerivationAbsent);
    if (
      forbidden.length === 0 ||
      (hint.remoteRole?.strategyDerivation !== undefined &&
        forbidden.includes(hint.remoteRole.strategyDerivation))
    ) {
      return false;
    }
  }
  if (gates.breakerProfileCoverage !== undefined) {
    const expected = normalizeGateValues(gates.breakerProfileCoverage);
    if (
      expected.length === 0 ||
      !Array.isArray(hint.breakerProfile?.coverage) ||
      !hint.breakerProfile.coverage.some((coverage) =>
        expected.includes(coverage),
      )
    ) {
      return false;
    }
  }
  if (gates.breakerProfileRestrictionAbsent !== undefined) {
    const forbidden = normalizeGateValues(gates.breakerProfileRestrictionAbsent);
    const restrictions = hint.breakerProfile?.restrictions;
    if (
      forbidden.length === 0 ||
      (Array.isArray(restrictions) &&
        restrictions.some((restriction) => forbidden.includes(restriction)))
    ) {
      return false;
    }
  }
  return true;
}

function matchesGateValue(actual, expected) {
  if (expected === undefined) return true;
  const allowed = normalizeGateValues(expected);
  if (allowed.length === 0) return false;
  return typeof actual === "string" && allowed.includes(actual);
}

function normalizeGateValues(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === "string"))
    return value;
  return [];
}

function matchRecord(value, match) {
  if (!isRecord(value) || !isRecord(match)) return false;
  for (const [key, expected] of Object.entries(match)) {
    if (value[key] !== expected) return false;
  }
  return true;
}

function buildDerivationSmokeTests(rules) {
  const fixtures = {
    runnerEconomy: {
      cardId: "ai003_smoke_runner_economy",
      side: "runner",
      effects: [
        {
          kind: "economy",
          timing: "action",
          scope: "runner",
          resource: "credits",
          amount: 3,
        },
      ],
    },
    rndMultiaccess: {
      cardId: "ai003_smoke_rnd_multiaccess",
      side: "runner",
      cardType: "event",
      effects: [
        {
          kind: "multiaccess",
          timing: "successful_run",
          scope: "rnd",
          resource: "cards",
          amount: 1,
        },
      ],
    },
    hqMultiaccess: {
      cardId: "ai004_smoke_hq_multiaccess",
      side: "runner",
      cardType: "event",
      effects: [
        {
          kind: "multiaccess",
          timing: "successful_run",
          scope: "hq",
          resource: "cards",
          amount: 1,
        },
      ],
    },
    normalBreaker: {
      cardId: "ai003_smoke_normal_wall_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["wall"],
        baseStrength: 1,
        pumpCost: 1,
        breakCost: 1,
      },
    },
    runnerRiskyBreaker: {
      cardId: "ai017_smoke_risky_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["universal"],
        sideEffects: ["random_failure", "program_trash_risk"],
      },
    },
    runnerConfigurableBreaker: {
      cardId: "ai017_smoke_configurable_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["unknown_special"],
        configurableCoverage: true,
        reconfigurableType: true,
      },
    },
    runnerTargetedBreaker: {
      cardId: "ai017_smoke_targeted_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["sentry"],
        targetedIceBonus: true,
        strengthBonusVsChosenIce: true,
      },
    },
    runnerGeneralApBreaker: {
      cardId: "ai018c_smoke_general_ap_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["ap"],
      },
    },
    runnerSubtypeLimitedApBreaker: {
      cardId: "ai018c_smoke_ap_subtype_limited_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["ap"],
        restrictions: ["stun_hellbolt_knockout_only"],
      },
    },
    runnerSubtypeLimitedSentryBreaker: {
      cardId: "ai018c_smoke_sentry_subtype_limited_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["watchdog"],
        restrictions: ["pit_bull_hellhound_bloodhound_watchdog_only"],
      },
    },
    runnerDelayedActionCostBreaker: {
      cardId: "ai018_smoke_delayed_action_cost_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["wall"],
        sideEffects: ["forgo_actions"],
      },
    },
    runnerEndRunBreaker: {
      cardId: "ai018_smoke_end_run_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["universal"],
        sideEffects: ["ends_run_after_use"],
      },
    },
    runnerMultiSubroutineBreaker: {
      cardId: "ai018_smoke_multi_subroutine_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["sentry"],
        multiSubroutineBreak: true,
        maxSubroutinesPerBreak: 5,
      },
    },
    runnerOneTimeModeBreaker: {
      cardId: "ai018_smoke_one_time_mode_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        configurableCoverage: true,
        oneTimeModeChoice: true,
        coverageCandidates: ["code_gate", "sentry", "wall"],
      },
    },
    runnerIceStrengthReduction: {
      cardId: "ai017_smoke_ice_strength_reduction",
      side: "runner",
      cardType: "program",
      effects: [
        {
          kind: "remote_protection",
          timing: "persistent",
          scope: "ice",
          resource: "strength",
        },
      ],
    },
    runnerScalingStrengthBreaker: {
      cardId: "ai018_smoke_scaling_strength_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["sentry"],
        scalingStrength: true,
      },
    },
    runnerStealthLossBreaker: {
      cardId: "ai018_smoke_stealth_loss_breaker",
      side: "runner",
      cardType: "program",
      breakerProfile: {
        coverage: ["wall"],
        sideEffects: ["stealth_loss"],
      },
    },
    runnerRecurringBreakerCredit: {
      cardId: "ai018_smoke_recurring_breaker_credit",
      side: "runner",
      cardType: "hardware",
      effects: [
        {
          kind: "recurring_economy",
          timing: "persistent",
          scope: "runner",
          resource: "credits",
          amount: 2,
          repeatable: true,
          target: "icebreaker",
        },
      ],
    },
    runnerMemorySetup: {
      cardId: "ai018_smoke_memory_setup",
      side: "runner",
      cardType: "hardware",
      effects: [
        {
          kind: "global_modifier",
          timing: "persistent",
          scope: "runner",
          resource: "memory",
          amount: 2,
        },
      ],
    },
    runnerHandSizeSetup: {
      cardId: "ai018_smoke_hand_size_setup",
      side: "runner",
      cardType: "hardware",
      effects: [
        {
          kind: "hand_size_modifier",
          timing: "persistent",
          scope: "runner",
          resource: "hand_size",
          amount: 2,
        },
      ],
    },
    runnerProgramHost: {
      cardId: "ai018_smoke_program_host",
      side: "runner",
      cardType: "program",
      effects: [
        {
          kind: "program_host",
          timing: "persistent",
          scope: "runner",
          resource: "memory",
          amount: 3,
          target: "program",
        },
      ],
    },
    runnerInstalledBreakerStrengthSupport: {
      cardId: "ai018_smoke_installed_breaker_strength_support",
      side: "runner",
      cardType: "event",
      effects: [
        {
          kind: "global_modifier",
          timing: "action",
          scope: "installed_program",
          resource: "strength",
          target: "icebreaker",
        },
      ],
    },
    runnerVirusIceStrengthReduction: {
      cardId: "ai018_smoke_virus_ice_strength_reduction",
      side: "runner",
      cardType: "program",
      effects: [
        {
          kind: "global_modifier",
          timing: "successful_run",
          scope: "ice",
          resource: "strength",
        },
      ],
    },
    runnerEncounterSearchInstall: {
      cardId: "ai017_smoke_encounter_search_install",
      side: "runner",
      cardType: "resource",
      effects: [
        {
          kind: "search",
          timing: "during_ice_encounter",
          scope: "runner",
          target: "program",
        },
        {
          kind: "install",
          timing: "during_ice_encounter",
          scope: "runner",
          target: "program",
        },
      ],
    },
    corpTagPunishPayoff: {
      cardId: "ai003_smoke_tag_punish_payoff",
      side: "corp",
      cardType: "operation",
      effects: [
        {
          kind: "tag_punish_payoff",
          timing: "action",
          scope: "runner",
          resource: "damage",
          amount: 4,
        },
      ],
      conditions: [{ kind: "requires_runner_tagged" }],
    },
    corpCreditTagPunishPayoff: {
      cardId: "ai016_smoke_credit_tag_punish_payoff",
      side: "corp",
      cardType: "operation",
      effects: [
        {
          kind: "counter_economy",
          timing: "action",
          scope: "runner",
          resource: "credits",
        },
        {
          kind: "tag_punish_payoff",
          timing: "action",
          scope: "runner",
          resource: "credits",
        },
      ],
      conditions: [{ kind: "requires_runner_tagged" }],
    },
    corpDamagePayoff: {
      cardId: "ai003_1_smoke_corp_damage_payoff",
      side: "corp",
      cardType: "operation",
      effects: [
        {
          kind: "damage",
          timing: "action",
          scope: "runner",
          resource: "damage",
          amount: 4,
        },
      ],
    },
    corpScoredAgendaUtility: {
      cardId: "ai016_smoke_scored_agenda_utility",
      side: "corp",
      cardType: "agenda",
      effects: [
        {
          kind: "scored_agenda_action",
          timing: "scored_activated",
          scope: "score_area",
        },
      ],
    },
    corpScoreAcceleration: {
      cardId: "ai016_smoke_score_acceleration",
      side: "corp",
      cardType: "upgrade",
      effects: [
        {
          kind: "score_acceleration",
          timing: "persistent",
          scope: "corp",
          resource: "advancement_counters",
        },
      ],
    },
    corpIceStrengthModifier: {
      cardId: "ai016_smoke_ice_strength_modifier",
      side: "corp",
      cardType: "agenda",
      effects: [
        {
          kind: "global_modifier",
          timing: "persistent",
          scope: "ice",
          resource: "strength",
        },
      ],
    },
    corpIceSubroutineModifier: {
      cardId: "ai016_smoke_ice_subroutine_modifier",
      side: "corp",
      cardType: "agenda",
      effects: [
        {
          kind: "global_modifier",
          timing: "when_scored",
          scope: "ice",
          resource: "subroutines",
        },
      ],
    },
    corpRunPathIceTax: {
      cardId: "ai016_smoke_run_path_ice_tax",
      side: "corp",
      cardType: "ice",
      effects: [
        {
          kind: "run_tax",
          timing: "encounter",
          scope: "run_path",
          resource: "credits",
        },
      ],
    },
    corpPersistentAccessPunish: {
      cardId: "ai016_smoke_persistent_access_punish",
      side: "corp",
      cardType: "asset",
      effects: [
        {
          kind: "persistent_counter_effect",
          timing: "on_access",
          scope: "runner",
          resource: "counters",
        },
      ],
      conditions: [{ kind: "requires_accessed_card" }],
    },
    corpExtraAction: {
      cardId: "ai003_1_smoke_corp_extra_action",
      side: "corp",
      cardType: "agenda",
      effects: [
        {
          kind: "extra_action",
          timing: "scored_activated",
          scope: "corp",
          resource: "actions",
          amount: 1,
        },
      ],
    },
    corpIceFutureRunEffect: {
      cardId: "ai003_1_smoke_corp_ice_future_run_effect",
      side: "corp",
      cardType: "ice",
      effects: [
        {
          kind: "future_run_effect",
          timing: "encounter",
          scope: "run_path",
        },
      ],
    },
    corpTopdeckInfo: {
      cardId: "ai003_1_smoke_corp_topdeck_info",
      side: "corp",
      cardType: "operation",
      effects: [
        {
          kind: "topdeck_info",
          timing: "action",
          scope: "rnd",
          resource: "cards",
          amount: 5,
        },
      ],
    },
    runnerTagSource: {
      cardId: "ai003_1_smoke_runner_tag_source",
      side: "runner",
      cardType: "event",
      effects: [
        {
          kind: "tag_source",
          timing: "action",
          scope: "runner",
          resource: "tags",
          amount: 1,
        },
      ],
    },
    runnerDamage: {
      cardId: "ai003_1_smoke_runner_damage",
      side: "runner",
      cardType: "event",
      effects: [
        {
          kind: "damage",
          timing: "action",
          scope: "runner",
          resource: "damage",
          amount: 1,
        },
      ],
    },
  };

  return Object.fromEntries(
    Object.entries(fixtures).map(([key, hint]) => [
      key,
      deriveFunctionSignalsFromHint(hint, rules),
    ]),
  );
}

function analyzeSideAwareDerivation(cards, rules) {
  const preventedWrongSideAnchors = [];
  const wrongSideAnchorMatches = [];
  for (const hint of cards) {
    for (const rule of rules) {
      const anchorStrategyIds = rule.strategyAnchorFor ?? [];
      if (anchorStrategyIds.length === 0) continue;
      const mismatchedAnchors = anchorStrategyIds.filter(
        (strategyId) => strategySide(strategyId) !== hint.side,
      );
      if (mismatchedAnchors.length === 0) continue;
      const baseMatches = ruleBaseMatchesHint(rule, hint);
      if (!baseMatches) continue;
      const gatedMatches = ruleMatchesHint(rule, hint);
      for (const strategyId of mismatchedAnchors) {
        const item = {
          cardId: hint.cardId,
          side: hint.side,
          cardType: hint.cardType,
          signalId: rule.signalId,
          strategyId,
        };
        if (gatedMatches) wrongSideAnchorMatches.push(item);
        else preventedWrongSideAnchors.push(item);
      }
    }
  }
  return {
    preventedWrongSideAnchorCount: preventedWrongSideAnchors.length,
    preventedWrongSideAnchorExamples: preventedWrongSideAnchors.slice(0, 50),
    wrongSideAnchorMatchCount: wrongSideAnchorMatches.length,
    wrongSideAnchorMatches,
  };
}

function validateTacticSignalCatalog(
  data,
  derivationRules,
  strategyIds,
  errors,
  warnings,
) {
  if (data.schemaVersion !== "ai-tactic-signals-v1") {
    errors.push({
      kind: "invalid_tactic_signal_schema",
      path: TACTIC_SIGNAL_CATALOG_PATH,
      message: "Expected schemaVersion ai-tactic-signals-v1.",
    });
  }
  if (!Array.isArray(data.signals)) {
    errors.push({
      kind: "invalid_tactic_signal_shape",
      path: `${TACTIC_SIGNAL_CATALOG_PATH}.signals`,
      message: "signals must be an array.",
    });
    return;
  }

  const ids = new Set();
  const anchorsBySignal = strategyAnchorsBySignalId(derivationRules);
  for (const [index, signal] of data.signals.entries()) {
    const basePath = `${TACTIC_SIGNAL_CATALOG_PATH}.signals[${index}]`;
    if (!isRecord(signal)) {
      errors.push({
        kind: "invalid_tactic_signal_entry",
        path: basePath,
        message: "Each tactic signal entry must be an object.",
      });
      continue;
    }
    if (
      typeof signal.signalId !== "string" ||
      !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(signal.signalId)
    ) {
      errors.push({
        kind: "invalid_tactic_signal_id",
        path: `${basePath}.signalId`,
        message: "signalId must be a dotted lower_snake_case string.",
      });
    } else if (signal.signalId.startsWith("anti.ice.")) {
      errors.push({
        kind: "forbidden_static_anti_ice_signal",
        path: `${basePath}.signalId`,
        message: "anti.ice.* is too broad and must not be a static tactic signal.",
      });
    } else if (ids.has(signal.signalId)) {
      errors.push({
        kind: "duplicate_tactic_signal_id",
        path: `${basePath}.signalId`,
        message: `Duplicate tactic signal ${signal.signalId}.`,
      });
    } else {
      ids.add(signal.signalId);
    }

    for (const field of ["group", "description", "notes"]) {
      if (typeof signal[field] !== "string" || signal[field].trim() === "") {
        errors.push({
          kind: "invalid_tactic_signal_text_field",
          path: `${basePath}.${field}`,
          message: `${field} must be a non-empty string.`,
        });
      }
    }
    if (!VALID_TACTIC_SIGNAL_SIDE_SCOPES.has(signal.sideScope)) {
      errors.push({
        kind: "invalid_tactic_signal_side_scope",
        path: `${basePath}.sideScope`,
        message: "sideScope must be runner, corp or neutral.",
      });
    }
    for (const field of ["supportOnly", "mayAnchorStrategy", "targetProfileRelevant"]) {
      if (typeof signal[field] !== "boolean") {
        errors.push({
          kind: "invalid_tactic_signal_boolean",
          path: `${basePath}.${field}`,
          message: `${field} must be boolean.`,
        });
      }
    }
    for (const field of ["allowedStrategyAnchors", "sourceKinds", "examples"]) {
      if (!isStringArray(signal[field])) {
        errors.push({
          kind: "invalid_tactic_signal_array",
          path: `${basePath}.${field}`,
          message: `${field} must be a string array.`,
        });
      }
    }
    for (const strategyId of signal.allowedStrategyAnchors ?? []) {
      if (!strategyIds.has(strategyId)) {
        errors.push({
          kind: "unknown_tactic_signal_strategy_anchor",
          path: `${basePath}.allowedStrategyAnchors`,
          message: `Unknown strategy anchor ${strategyId}.`,
        });
      }
    }
    if (signal.supportOnly === true) {
      if (signal.mayAnchorStrategy !== false) {
        errors.push({
          kind: "support_only_signal_may_anchor",
          path: `${basePath}.mayAnchorStrategy`,
          message: "supportOnly signals must not be marked mayAnchorStrategy.",
        });
      }
      if ((signal.allowedStrategyAnchors ?? []).length > 0) {
        errors.push({
          kind: "support_only_signal_has_anchor",
          path: `${basePath}.allowedStrategyAnchors`,
          message: "supportOnly signals must not list allowed strategy anchors.",
        });
      }
    }

    const derivedAnchors = anchorsBySignal.get(signal.signalId) ?? [];
    if (!sameStringArray(derivedAnchors, signal.allowedStrategyAnchors ?? [])) {
      errors.push({
        kind: "tactic_signal_anchor_contract_mismatch",
        path: `${basePath}.allowedStrategyAnchors`,
        message: `Catalog anchors for ${signal.signalId} must match derivation rules.`,
        expected: derivedAnchors,
        actual: signal.allowedStrategyAnchors ?? [],
      });
    }
  }

  const missingCatalogSignals = [...anchorsBySignal.keys()].filter(
    (signalId) => !ids.has(signalId),
  );
  if (missingCatalogSignals.length > 0) {
    errors.push({
      kind: "function_signal_missing_from_tactic_catalog",
      path: TACTIC_SIGNAL_CATALOG_PATH,
      message: "Every derivable function signal must be cataloged.",
      items: missingCatalogSignals.sort(),
    });
  }

  const dormantSignals = [...ids].filter((signalId) => !anchorsBySignal.has(signalId));
  if (dormantSignals.length > 0) {
    warnings.push({
      kind: "dormant_tactic_signals_warn_only",
      count: dormantSignals.length,
      message:
        "Some cataloged tactic signals are reserved for controlled future descriptors and have no derivation rule yet.",
      items: dormantSignals.sort(),
    });
  }
}

function strategyAnchorsBySignalId(rules) {
  const bySignal = new Map();
  for (const rule of rules) {
    if (typeof rule.signalId !== "string") continue;
    const anchors = bySignal.get(rule.signalId) ?? new Set();
    for (const strategyId of rule.strategyAnchorFor ?? []) {
      anchors.add(strategyId);
    }
    bySignal.set(rule.signalId, anchors);
  }
  return new Map(
    [...bySignal.entries()].map(([signalId, anchors]) => [
      signalId,
      [...anchors].sort(),
    ]),
  );
}

function validateStrategyGoals(data, errors) {
  if (data.schemaVersion !== "ai-strategy-goals-v1") {
    errors.push({
      kind: "invalid_strategy_goals_schema",
      path: STRATEGY_GOALS_PATH,
      message: "Expected schemaVersion ai-strategy-goals-v1.",
    });
  }
  if (!Array.isArray(data.strategyGoals)) {
    errors.push({
      kind: "invalid_strategy_goals_shape",
      path: `${STRATEGY_GOALS_PATH}.strategyGoals`,
      message: "strategyGoals must be an array.",
    });
    return;
  }
  const ids = new Set();
  for (const [index, goal] of data.strategyGoals.entries()) {
    const basePath = `${STRATEGY_GOALS_PATH}.strategyGoals[${index}]`;
    if (!isRecord(goal)) {
      errors.push({
        kind: "invalid_strategy_goal_shape",
        path: basePath,
        message: "Strategy goal must be an object.",
      });
      continue;
    }
    if (typeof goal.strategyId !== "string") {
      errors.push({
        kind: "invalid_strategy_id",
        path: `${basePath}.strategyId`,
        message: "strategyId must be a string.",
      });
    } else if (ids.has(goal.strategyId)) {
      errors.push({
        kind: "duplicate_strategy_id",
        path: `${basePath}.strategyId`,
        message: `Duplicate strategyId ${goal.strategyId}.`,
      });
    } else {
      ids.add(goal.strategyId);
    }
    if (!VALID_SIDES.has(goal.side)) {
      errors.push({
        kind: "invalid_strategy_side",
        path: `${basePath}.side`,
        message: "side must be runner or corp.",
      });
    }
    if (
      typeof goal.strategyId === "string" &&
      typeof goal.side === "string" &&
      !goal.strategyId.startsWith(`${goal.side}.`)
    ) {
      errors.push({
        kind: "strategy_id_side_prefix_mismatch",
        path: `${basePath}.strategyId`,
        message: "strategyId must be side-prefixed.",
      });
    }
    if (!VALID_DETECTION_MODES.has(goal.detectionMode)) {
      errors.push({
        kind: "invalid_detection_mode",
        path: `${basePath}.detectionMode`,
        message: "Unknown detectionMode.",
      });
    }
    if (!isStringArray(goal.anchorSignals)) {
      errors.push({
        kind: "invalid_anchor_signals",
        path: `${basePath}.anchorSignals`,
        message: "anchorSignals must be a string array.",
      });
    }
    validateSupportMap(goal.requiredSupport, `${basePath}.requiredSupport`, errors);
    validateWeightMap(goal.supportWeights, `${basePath}.supportWeights`, errors);
    if (!isStringArray(goal.tacticalGoalHints)) {
      errors.push({
        kind: "invalid_tactical_goal_hints",
        path: `${basePath}.tacticalGoalHints`,
        message: "tacticalGoalHints must be a string array.",
      });
    }
  }
}

function validateStrategicRoles(data, errors) {
  if (data.schemaVersion !== "ai-strategic-roles-v1") {
    errors.push({
      kind: "invalid_strategic_roles_schema",
      path: STRATEGIC_ROLES_PATH,
      message: "Expected schemaVersion ai-strategic-roles-v1.",
    });
  }
  if (!Array.isArray(data.strategicRoles)) {
    errors.push({
      kind: "invalid_strategic_roles_shape",
      path: `${STRATEGIC_ROLES_PATH}.strategicRoles`,
      message: "strategicRoles must be an array.",
    });
    return;
  }
  const ids = new Set();
  for (const [index, role] of data.strategicRoles.entries()) {
    const basePath = `${STRATEGIC_ROLES_PATH}.strategicRoles[${index}]`;
    if (!isRecord(role) || typeof role.roleId !== "string") {
      errors.push({
        kind: "invalid_strategic_role",
        path: basePath,
        message: "Each strategic role must have a string roleId.",
      });
      continue;
    }
    if (ids.has(role.roleId)) {
      errors.push({
        kind: "duplicate_strategic_role",
        path: `${basePath}.roleId`,
        message: `Duplicate strategic role ${role.roleId}.`,
      });
    }
    ids.add(role.roleId);
  }
}

function validateFunctionDerivation(data, strategyIds, errors, warnings) {
  if (data.schemaVersion !== "ai-function-signal-derivation-v1") {
    errors.push({
      kind: "invalid_function_signal_schema",
      path: FUNCTION_SIGNAL_DERIVATION_PATH,
      message: "Expected schemaVersion ai-function-signal-derivation-v1.",
    });
  }
  if (!Array.isArray(data.derivationRules)) {
    errors.push({
      kind: "invalid_function_derivation_shape",
      path: `${FUNCTION_SIGNAL_DERIVATION_PATH}.derivationRules`,
      message: "derivationRules must be an array.",
    });
    return;
  }
  for (const [index, rule] of data.derivationRules.entries()) {
    const basePath = `${FUNCTION_SIGNAL_DERIVATION_PATH}.derivationRules[${index}]`;
    if (!isRecord(rule)) {
      errors.push({
        kind: "invalid_function_rule_shape",
        path: basePath,
        message: "Derivation rule must be an object.",
      });
      continue;
    }
    if (typeof rule.signalId !== "string" || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(rule.signalId)) {
      errors.push({
        kind: "invalid_function_signal_id",
        path: `${basePath}.signalId`,
        message: "signalId must be a dotted lower_snake_case string.",
      });
    }
    if (!VALID_RULE_SOURCES.has(rule.source)) {
      errors.push({
        kind: "invalid_function_rule_source",
        path: `${basePath}.source`,
        message: "Unknown derivation rule source.",
      });
    }
    if (!isRecord(rule.match)) {
      errors.push({
        kind: "invalid_function_rule_match",
        path: `${basePath}.match`,
        message: "match must be an object.",
      });
    }
    validateRuleGates(rule, basePath, errors);
    if (!isStringArray(rule.strategyAnchorFor)) {
      errors.push({
        kind: "invalid_strategy_anchor_for",
        path: `${basePath}.strategyAnchorFor`,
        message: "strategyAnchorFor must be a string array.",
      });
    } else {
      for (const strategyId of rule.strategyAnchorFor) {
        if (!strategyIds.has(strategyId)) {
          errors.push({
            kind: "unknown_strategy_anchor_reference",
            path: `${basePath}.strategyAnchorFor`,
            message: `Unknown strategy anchor reference ${strategyId}.`,
          });
        }
      }
      validateStrategyAnchorGates(rule, basePath, errors, warnings);
    }
  }
}

function validateRuleGates(rule, basePath, errors) {
  if (rule.gates === undefined) return;
  if (!isRecord(rule.gates)) {
    errors.push({
      kind: "invalid_rule_gates",
      path: `${basePath}.gates`,
      message: "gates must be an object when present.",
    });
    return;
  }
  for (const [gateField, gateValue] of Object.entries(rule.gates)) {
    if (!VALID_RULE_GATE_FIELDS.has(gateField)) {
      errors.push({
        kind: "unknown_rule_gate_field",
        path: `${basePath}.gates.${gateField}`,
        message: `Unknown rule gate field ${gateField}.`,
      });
    }
    if (normalizeGateValues(gateValue).length === 0) {
      errors.push({
        kind: "invalid_rule_gate_value",
        path: `${basePath}.gates.${gateField}`,
        message: "Rule gate values must be a string or string array.",
      });
    }
  }
}

function validateStrategyAnchorGates(rule, basePath, errors, warnings) {
  const strategyAnchorFor = rule.strategyAnchorFor ?? [];
  if (strategyAnchorFor.length === 0) return;
  const gateSides = normalizeGateValues(rule.gates?.side);
  if (gateSides.length === 0) {
    errors.push({
      kind: "strategy_anchor_without_side_gate",
      path: `${basePath}.gates.side`,
      message: "Rules with strategyAnchorFor must declare a side gate.",
    });
  }
  const anchorSides = sortedUnique(strategyAnchorFor.map(strategySide));
  for (const anchorSide of anchorSides) {
    if (!gateSides.includes(anchorSide)) {
      errors.push({
        kind: "strategy_anchor_side_gate_mismatch",
        path: `${basePath}.gates.side`,
        message: `strategyAnchorFor contains ${anchorSide} strategy but side gate is ${gateSides.join(",") || "missing"}.`,
      });
    }
  }
  const matchHasScope = isRecord(rule.match) && typeof rule.match.scope === "string";
  const gatesHaveEffectScope =
    normalizeGateValues(rule.gates?.effectScope).length > 0;
  if (rule.source === "effects" && !matchHasScope && !gatesHaveEffectScope) {
    warnings.push({
      kind: "strategy_anchor_without_effect_scope_warn_only",
      count: 1,
      path: `${basePath}.gates.effectScope`,
      message:
        "Effect-derived strategy anchors should gate on effect scope or match.scope.",
      signalId: rule.signalId,
      strategyAnchorFor,
    });
  }
}

function validateSupportMap(value, pathLabel, errors) {
  if (!isRecord(value)) {
    errors.push({
      kind: "invalid_required_support",
      path: pathLabel,
      message: "requiredSupport must be an object.",
    });
    return;
  }
  for (const [key, supportValue] of Object.entries(value)) {
    if (!VALID_SUPPORT_VALUES.has(supportValue)) {
      errors.push({
        kind: "invalid_required_support_value",
        path: `${pathLabel}.${key}`,
        message: `Unknown requiredSupport value ${String(supportValue)}.`,
      });
    }
  }
}

function validateWeightMap(value, pathLabel, errors) {
  if (!isRecord(value)) {
    errors.push({
      kind: "invalid_support_weights",
      path: pathLabel,
      message: "supportWeights must be an object.",
    });
    return;
  }
  const total = Object.values(value).reduce((sum, weight) => {
    return sum + (typeof weight === "number" ? weight : 0);
  }, 0);
  for (const [key, weight] of Object.entries(value)) {
    if (typeof weight !== "number" || weight < 0 || weight > 1) {
      errors.push({
        kind: "invalid_support_weight_value",
        path: `${pathLabel}.${key}`,
        message: "supportWeights values must be numbers in the 0..1 range.",
      });
    }
  }
  if (Math.abs(total - 1) > 0.001) {
    errors.push({
      kind: "invalid_support_weight_total",
      path: pathLabel,
      message: `supportWeights must sum to 1.0; got ${total.toFixed(3)}.`,
    });
  }
}

function validateHiddenInfoKeys(value, sourcePath, errors) {
  visit(value, sourcePath);

  function visit(node, pathLabel) {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${pathLabel}[${index}]`));
      return;
    }
    if (!isRecord(node)) return;
    for (const [key, child] of Object.entries(node)) {
      if (isHiddenInfoRiskField(key)) {
        errors.push({
          kind: "hidden_info_field_in_taxonomy",
          path: `${pathLabel}.${key}`,
          message: `Hidden-info or runtime action field ${key} is not allowed in AI003 taxonomy definitions.`,
        });
      }
      visit(child, `${pathLabel}.${key}`);
    }
  }
}

function validateNoManualFunctionTags(value, sourcePath, errors) {
  visit(value, sourcePath);

  function visit(node, pathLabel) {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${pathLabel}[${index}]`));
      return;
    }
    if (!isRecord(node)) return;
    for (const [key, child] of Object.entries(node)) {
      if (key === "functionTags") {
        errors.push({
          kind: "manual_functionTags_field",
          path: `${pathLabel}.${key}`,
          message:
            "AI003 forbids manual functionTags in active or compiled hints.",
        });
      }
      visit(child, `${pathLabel}.${key}`);
    }
  }
}

function validateOpponentSignals(data, sourcePath, errors) {
  for (const [cardIndex, hint] of (data.cards ?? []).entries()) {
    if (!Array.isArray(hint.opponentSignals)) continue;
    for (const [signalIndex, signal] of hint.opponentSignals.entries()) {
      if (!isRecord(signal) || signal.visibleEvidenceOnly !== true) {
        errors.push({
          kind: "opponent_signal_without_visible_evidence_only",
          path: `${sourcePath}.cards[${cardIndex}].opponentSignals[${signalIndex}]`,
          message: "opponentSignals must set visibleEvidenceOnly: true.",
        });
      }
    }
  }
}

function validateLineSupportValues(data, sourcePath, strategyIds, errors) {
  for (const [cardIndex, hint] of (data.cards ?? []).entries()) {
    if (hint.lineSupport === undefined) continue;
    if (!isStringArray(hint.lineSupport)) {
      errors.push({
        kind: "invalid_lineSupport_shape",
        path: `${sourcePath}.cards[${cardIndex}].lineSupport`,
        message: "lineSupport must be a string array when present.",
      });
      continue;
    }
    for (const value of hint.lineSupport) {
      const isNormalizedStrategy = strategyIds.has(value);
      const legacyMapping = LINE_SUPPORT_MAPPINGS[value];
      if (!isNormalizedStrategy && legacyMapping === undefined) {
        errors.push({
          kind: "unknown_lineSupport_value",
          path: `${sourcePath}.cards[${cardIndex}].lineSupport`,
          cardId: hint.cardId,
          message: `Unknown lineSupport value ${value}.`,
        });
        continue;
      }
      const mappedStrategyIds = isNormalizedStrategy
        ? [value]
        : legacyMapping.mapsTo ?? [];
      const mappedSides = sortedUnique(mappedStrategyIds.map(strategySide));
      if (
        mappedSides.length > 0 &&
        typeof hint.side === "string" &&
        !mappedSides.includes(hint.side)
      ) {
        errors.push({
          kind: "lineSupport_side_mismatch",
          path: `${sourcePath}.cards[${cardIndex}].lineSupport`,
          cardId: hint.cardId,
          message: `lineSupport value ${value} maps to ${mappedSides.join(",")} but card side is ${hint.side}.`,
        });
      }
    }
  }
}

function validateStrategicRoleIfPresent(data, sourcePath, strategicRoleIds, errors) {
  for (const [cardIndex, hint] of (data.cards ?? []).entries()) {
    if (hint.strategicRole === undefined) continue;
    if (!isStringArray(hint.strategicRole)) {
      errors.push({
        kind: "invalid_strategicRole_shape",
        path: `${sourcePath}.cards[${cardIndex}].strategicRole`,
        message: "strategicRole must be a string array when present.",
      });
      continue;
    }
    for (const role of hint.strategicRole) {
      if (!strategicRoleIds.has(role)) {
        errors.push({
          kind: "unknown_strategicRole_value",
          path: `${sourcePath}.cards[${cardIndex}].strategicRole`,
          message: `Unknown strategicRole value ${role}.`,
        });
      }
    }
  }
}

function collectFieldCounts(cards) {
  const counts = {};
  for (const card of cards) collect(card, "");
  return sortObjectByKey(counts);

  function collect(value, prefix) {
    if (Array.isArray(value)) {
      for (const item of value) collect(item, `${prefix}[]`);
      return;
    }
    if (!isRecord(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      counts[fieldPath] = (counts[fieldPath] ?? 0) + 1;
      collect(child, fieldPath);
    }
  }
}

function collectValueInventory(cards, field) {
  const entries = new Map();
  for (const hint of cards) {
    for (const value of hint[field] ?? []) {
      const entry =
        entries.get(value) ??
        {
          value,
          count: 0,
          examples: [],
        };
      entry.count += 1;
      if (entry.examples.length < 8) entry.examples.push(hint.cardId);
      entries.set(value, entry);
    }
  }
  return [...entries.values()].sort(
    (left, right) => right.count - left.count || left.value.localeCompare(right.value),
  );
}

function isHiddenInfoRiskField(key) {
  const normalized = key.toLowerCase();
  return HIDDEN_INFO_RISK_FIELDS.some(
    (field) => field.toLowerCase() === normalized,
  );
}

function isFunctionLikeValue(value) {
  return FUNCTION_LIKE_PATTERNS.some((pattern) => pattern.test(value));
}

function isLegacyRoleOnlyValue(value) {
  return LEGACY_ROLE_PATTERNS.some((pattern) => pattern.test(value));
}

function itemCount(entry) {
  if (typeof entry.count === "number") return entry.count;
  if (Array.isArray(entry.items)) return entry.items.length;
  if (Array.isArray(entry.examples)) return entry.examples.length;
  return 1;
}

function countBy(values, selector) {
  const counts = {};
  for (const value of values) {
    const key = selector(value);
    if (typeof key !== "string" || key.length === 0) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return sortObjectByKey(counts);
}

function strategySide(strategyId) {
  if (typeof strategyId !== "string") return undefined;
  if (strategyId.startsWith("runner.")) return "runner";
  if (strategyId.startsWith("corp.")) return "corp";
  return undefined;
}

function readJson(repoRoot, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function writeJson(repoRoot, relativePath, value) {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sortObjectByKey(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function sortedUnique(values) {
  return [...new Set(values.filter((value) => typeof value === "string"))].sort();
}

function sameStringArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseArgs(argv) {
  const args = {
    json: false,
    writeReports: false,
    reportPath: DEFAULT_REPORT_PATH,
    sideAwareReportPath: DEFAULT_SIDE_AWARE_REPORT_PATH,
    aliasReportPath: DEFAULT_ALIAS_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") args.json = true;
    else if (arg === "--write-reports") args.writeReports = true;
    else if (arg === "--report") args.reportPath = argv[++index];
    else if (arg === "--side-aware-report")
      args.sideAwareReportPath = argv[++index];
    else if (arg === "--alias-report") args.aliasReportPath = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const { report, aliasReport } = buildAiStrategyTaxonomyReport();
  if (args.writeReports) {
    writeJson(REPO_ROOT, args.reportPath, report);
    writeJson(REPO_ROOT, args.sideAwareReportPath, report);
    writeJson(REPO_ROOT, args.aliasReportPath, aliasReport);
  }
  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(
      [
        `AI_STRATEGY_TAXONOMY ${report.hardErrorCount === 0 ? "OK" : "FAIL"}`,
        `task=${TASK_ID}`,
        `strategies=${report.taxonomy.strategyGoalCount}`,
        `strategicRoles=${report.taxonomy.strategicRoleCount}`,
        `functionSignals=${report.taxonomy.functionSignalCount}`,
        `roles=${report.wildGrowth.roleValueCount}`,
        `planRoles=${report.wildGrowth.planRoleValueCount}`,
        `lineSupport=${report.wildGrowth.lineSupportValueCount}`,
        `errors=${report.hardErrorCount}`,
        `warnings=${report.warningCount}`,
      ].join(" ") + "\n",
    );
    for (const error of report.hardErrors) {
      process.stdout.write(`ERROR ${error.kind} ${error.path}\n`);
    }
    for (const warning of report.warnings) {
      process.stdout.write(`WARN ${warning.kind} ${itemCount(warning)}\n`);
    }
  }
  if (report.hardErrorCount > 0) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
