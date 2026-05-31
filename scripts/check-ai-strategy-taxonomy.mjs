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
const TASK_ID = "AI003-1";
const UPDATES_TASK_ID = "AI003";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";
const STRATEGIC_ROLES_PATH = "data/ai/strategic-roles-v1.json";
const FUNCTION_SIGNAL_DERIVATION_PATH =
  "data/ai/function-signal-derivation-v1.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai003-strategy-taxonomy-report-2026-05-31.json";
const DEFAULT_SIDE_AWARE_REPORT_PATH =
  "docs/reviews/ai/ai003-1-side-aware-function-signal-derivation-report-2026-05-31.json";
const DEFAULT_ALIAS_REPORT_PATH =
  "docs/reviews/ai/ai003-strategy-taxonomy-alias-report-2026-05-31.json";

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
  "breakerProfile.coverage",
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
  "breakerProfileCoverage",
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
    mapsTo: ["runner.breaker_search"],
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
  stack_search: ["runner.breaker_search"],
  program_search: ["runner.breaker_search"],
  recover_key_card: ["runner.breaker_search"],
  recover_cards: ["runner.breaker_search"],
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

  validateStrategyGoals(strategyGoalsData, hardErrors);
  validateStrategicRoles(strategicRolesData, hardErrors);
  validateFunctionDerivation(
    functionDerivationData,
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
      message:
        "Existing lineSupport values are legacy AI003 inputs and are not hard-gated yet.",
      items: legacyLineSupportValues,
    });
  }

  const unknownRoleValues = [
    ...aliasReport.roles,
    ...aliasReport.planRoles,
  ].filter((entry) => entry.mappingCategory === "unknown_unmapped");
  if (unknownRoleValues.length > 0) {
    warnings.push({
      kind: "unknown_role_or_planRole_values_warn_only",
      count: unknownRoleValues.length,
      message:
        "Some existing roles or planRoles are unmapped in the AI003 contract report.",
      examples: unknownRoleValues.slice(0, 25),
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
    hardErrors,
    warnings,
    gates: {
      invalidStrategyGoalsFail: true,
      duplicateStrategyIdsFail: true,
      sidePrefixMismatchFail: true,
      invalidStrategicRolesFail: true,
      hiddenInfoFieldsFail: true,
      manualFunctionTagsFail: true,
      opponentSignalsVisibleEvidenceOnlyFail: true,
      wrongSideStrategyAnchorMatchesFail: true,
      strategyAnchorWithoutSideGateFail: true,
      unknownRuleGateFieldFail: true,
      legacyLineSupportWarnOnly: true,
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
      "no hint migration",
      "no ai-card-hints-active.json change",
      "no ai-card-hints-compiled.json change",
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
    return LINE_SUPPORT_MAPPINGS[value];
  }

  if (ROLE_ALIASES[value]) {
    return {
      category: "alias_to_strategy_goal",
      mapsTo: ROLE_ALIASES[value],
      rationale: "Legacy role or planRole aliases to a normalized strategy.",
    };
  }

  if (functionSignalIds.has(value) || isFunctionLikeValue(value)) {
    return {
      category: "function_signal_only",
      mapsTo: [],
      rationale:
        "Value describes a card function or tactical support signal, not a direct strategy anchor.",
    };
  }

  if (isLegacyRoleOnlyValue(value)) {
    return {
      category: "legacy_role_only",
      mapsTo: [],
      rationale:
        "Value is retained as legacy role/catalog/review context and is not a strategy goal.",
    };
  }

  return {
    category: "unknown_unmapped",
    mapsTo: [],
    rationale:
      "No AI003 mapping rule matched this value; later migration should review it explicitly.",
  };
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
  if (rule.source === "breakerProfile.coverage") {
    const coverage = rule.match?.coverage;
    return (
      typeof coverage === "string" &&
      Array.isArray(hint.breakerProfile?.coverage) &&
      hint.breakerProfile.coverage.includes(coverage) &&
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
  if (rule.source === "breakerProfile.coverage") {
    const coverage = rule.match?.coverage;
    return (
      typeof coverage === "string" &&
      Array.isArray(hint.breakerProfile?.coverage) &&
      hint.breakerProfile.coverage.includes(coverage)
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
    normalBreaker: {
      cardId: "ai003_smoke_normal_wall_breaker",
      side: "runner",
      breakerProfile: {
        coverage: ["wall"],
        baseStrength: 1,
        pumpCost: 1,
        breakCost: 1,
      },
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
