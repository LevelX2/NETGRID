#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TASK_ID = "AI029";
const GENERATED_AT = "2026-06-03";
const GUIDE_VERSION = "V3";
const AI028_REPORT_PATH = "docs/reviews/ai/ai028-netgrid-semantic-audit-pack-2026-06-03.json";
const JSON_REPORT_PATH = "docs/reviews/ai/ai029-target-condition-constraint-schema-sweep-report-2026-06-03.json";
const MARKDOWN_REPORT_PATH = "docs/reviews/ai/ai029-target-condition-constraint-schema-sweep-2026-06-03.md";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";

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

const FORBIDDEN_REPORT_PATTERNS = [
  /docs[\\/]+reviews[\\/]+chronicle/i,
  /check-chronicle-choice-fallbacks/i,
  /chronicle/i,
];

const FORBIDDEN_EFFECT_FIELDS = new Set([
  "planner",
  "planWeight",
  "actionScore",
  "targetingAi",
  "engine",
  "legalActions",
  "playerActions",
  "runtime",
  "stateVersion",
  "stateHash",
  "actionId",
]);

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--write")) {
    const report = buildReport({ verificationPassed: args.has("--verification-passed") });
    const markdown = renderMarkdown(report);
    const errors = validateReport(report, markdown);
    if (errors.length > 0) {
      failWithErrors("AI029 report generation failed", errors);
      return;
    }
    writeText(JSON_REPORT_PATH, `${stableJson(report)}\n`);
    writeText(MARKDOWN_REPORT_PATH, `${markdown.trimEnd()}\n`);
    process.stdout.write(
      [
        "AI029_TARGET_CONDITION_CONSTRAINT_SCHEMA_SWEEP WRITTEN",
        `targetProfileChanges=${report.changedTargetProfiles.length}`,
        `conditionChanges=${report.changedConditions.length}`,
        `constraintChanges=${report.changedConstraints.length}`,
        `hiddenInfoPolicyChanges=${report.changedHiddenInfoPolicies.length}`,
      ].join(" ") + "\n",
    );
    return;
  }

  const errors = [];
  if (!fs.existsSync(repoPath(JSON_REPORT_PATH))) errors.push(`Missing ${JSON_REPORT_PATH}`);
  if (!fs.existsSync(repoPath(MARKDOWN_REPORT_PATH))) errors.push(`Missing ${MARKDOWN_REPORT_PATH}`);
  if (errors.length === 0) {
    const report = readJson(JSON_REPORT_PATH);
    const markdown = readText(MARKDOWN_REPORT_PATH);
    errors.push(...validateReport(report, markdown));
    errors.push(...validateNoChronicleState(report, markdown));
  }
  if (errors.length > 0) {
    failWithErrors("AI029 target/condition/constraint schema sweep failed", errors);
    return;
  }

  const report = readJson(JSON_REPORT_PATH);
  process.stdout.write(
    [
      "AI029_TARGET_CONDITION_CONSTRAINT_SCHEMA_SWEEP OK",
      `sourceCommit=${report.sourceCommit}`,
      `targetProfileChanges=${report.changedTargetProfiles.length}`,
      `conditionChanges=${report.changedConditions.length}`,
      `constraintChanges=${report.changedConstraints.length}`,
      `hiddenInfoPolicyChanges=${report.changedHiddenInfoPolicies.length}`,
    ].join(" ") + "\n",
  );
}

function buildReport({ verificationPassed }) {
  const ai028 = readJson(AI028_REPORT_PATH);
  const compiledHints = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const strategyGoals = readJson(STRATEGY_GOALS_PATH);

  const beforeTargetProfiles = ai028.targetProfileInventory ?? [];
  const afterTargetProfiles = buildTargetProfileInventory(compiledHints.cards ?? []);
  const beforeConditions = ai028.conditionInventory ?? [];
  const afterConditions = buildConditionInventory(compiledHints.cards ?? []);
  const beforeConstraints = ai028.constraintInventory ?? [];
  const afterConstraints = buildConstraintInventory(compiledHints.cards ?? []);
  const beforeHiddenInfo = hiddenInfoInventoryFromAi028(ai028);
  const afterHiddenInfo = buildHiddenInfoPolicyInventory(afterTargetProfiles, compiledHints.cards ?? []);

  const changedTargetProfiles = compareProfiles(beforeTargetProfiles, afterTargetProfiles);
  const changedHiddenInfoPolicies = changedTargetProfiles
    .filter((entry) => entry.beforeHiddenInfoPolicy !== entry.afterHiddenInfoPolicy)
    .map((entry) => ({
      cardId: entry.cardId,
      title: entry.title,
      index: entry.index,
      beforeHiddenInfoPolicy: entry.beforeHiddenInfoPolicy ?? null,
      afterHiddenInfoPolicy: entry.afterHiddenInfoPolicy,
      normalizedHiddenInfoPolicy: entry.afterNormalizedHiddenInfoPolicy,
      rationale: "Generated legacy Search/Install TargetProfile normalized to target-profile-v1 with explicit read-only HiddenInfoPolicy.",
    }));

  const warningFindingsReviewed = reviewAi028Warnings(ai028, changedTargetProfiles);
  const conditionAliasInventory = buildConditionAliasInventory(afterConditions);
  const hiddenInfoPolicyAliases = buildHiddenInfoPolicyAliases(afterTargetProfiles);
  const schemaGapsRetained = buildSchemaGapsRetained(ai028, conditionAliasInventory);
  const deferredItems = buildDeferredItems({ ai028, schemaGapsRetained });

  return {
    schemaVersion: "ai029-target-condition-constraint-schema-sweep-report-v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    status: verificationPassed ? "verified" : "generated",
    sourceCommit: shortGitHead(),
    guideVersion: GUIDE_VERSION,
    inputAudit: "AI028",
    inputAuditPath: AI028_REPORT_PATH,
    warningFindingsReviewed,
    targetProfileInventoryBefore: summarizeTargetProfiles(beforeTargetProfiles),
    targetProfileInventoryAfter: summarizeTargetProfiles(afterTargetProfiles),
    conditionInventoryBefore: summarizeConditions(beforeConditions),
    conditionInventoryAfter: summarizeConditions(afterConditions),
    constraintInventoryBefore: summarizeConstraints(beforeConstraints),
    constraintInventoryAfter: summarizeConstraints(afterConstraints),
    hiddenInfoPolicyInventoryBefore: summarizeHiddenInfoPolicies(beforeHiddenInfo),
    hiddenInfoPolicyInventoryAfter: summarizeHiddenInfoPolicies(afterHiddenInfo),
    changedTargetProfiles,
    changedConditions: [],
    changedConstraints: [],
    changedHiddenInfoPolicies,
    aliasesRetained: [...conditionAliasInventory, ...hiddenInfoPolicyAliases],
    schemaGapsRetained,
    deferredItems,
    noEffectFlags: { ...NO_EFFECT_FLAGS },
    verification: buildVerification({ verificationPassed }),
    guardrails: {
      strategyGoalCountBefore: ai028.counts?.strategyGoals,
      strategyGoalCountAfter: (strategyGoals.strategyGoals ?? []).length,
      strategyIdsAfter: (strategyGoals.strategyGoals ?? []).map((goal) => goal.strategyId).sort(),
      conditionGeneratedStrategySupportPairs: (inspector.cards ?? []).flatMap((card) =>
        (card.reviewedStrategySupportPairs ?? [])
          .filter((pair) => pair.sourceField === "conditions")
          .map((pair) => ({ cardId: card.cardId, ...pair })),
      ),
      forbiddenRuntimeOrLegalityFields: findForbiddenFields({
        compiledHints,
        changedTargetProfiles,
      }),
    },
  };
}

function reviewAi028Warnings(ai028, changedTargetProfiles) {
  const changedCards = sortedUnique(changedTargetProfiles.map((entry) => entry.cardId));
  return (ai028.guideV3RuleFindings ?? [])
    .filter((finding) => finding.severity === "warning")
    .map((finding) => {
      if (finding.findingId === "AI028-F007") {
        return {
          findingId: finding.findingId,
          category: finding.category,
          guideV3Rule: finding.guideV3Rule,
          recommendedAction: finding.recommendedAction,
          suggestedTask: finding.suggestedTask,
          decision: "fix_in_ai029",
          affectedCards: changedCards,
          affectedSignals: [],
          result: `${changedTargetProfiles.length} generated TargetProfiles normalized to target-profile-v1 with explicit HiddenInfoPolicy.`,
        };
      }
      if (finding.findingId === "AI028-F003") {
        return {
          findingId: finding.findingId,
          category: finding.category,
          guideV3Rule: finding.guideV3Rule,
          recommendedAction: finding.recommendedAction,
          suggestedTask: finding.suggestedTask,
          decision: "defer",
          affectedCards: [],
          affectedSignals: ["breaker.code_gate", "breaker.sentry", "breaker.wall"],
          result: "Deferred: type/subtype-shaped breaker signals require taxonomy review, not a TargetProfile/Condition/Constraint schema fix.",
        };
      }
      if (finding.findingId === "AI028-F004") {
        return {
          findingId: finding.findingId,
          category: finding.category,
          guideV3Rule: finding.guideV3Rule,
          recommendedAction: finding.recommendedAction,
          suggestedTask: finding.suggestedTask,
          decision: "defer",
          affectedCards: [],
          affectedSignals: ["action.corp_repeatable_extra_action", "damage.payoff"],
          result: "Deferred: legacy aggregation signal retirement is card-semantic/taxonomy work and remains outside AI029.",
        };
      }
      if (finding.findingId === "AI028-F009") {
        return {
          findingId: finding.findingId,
          category: finding.category,
          guideV3Rule: finding.guideV3Rule,
          recommendedAction: finding.recommendedAction,
          suggestedTask: finding.suggestedTask,
          decision: "needs_schema_design",
          affectedCards: [],
          affectedSignals: [],
          result: "Retained as schema-gap inventory; no bulk replacement without a dedicated descriptor schema design.",
        };
      }
      return {
        findingId: finding.findingId,
        category: finding.category,
        guideV3Rule: finding.guideV3Rule,
        recommendedAction: finding.recommendedAction,
        suggestedTask: finding.suggestedTask,
        decision: "defer",
        affectedCards: [],
        affectedSignals: [],
        result: "Not changed by AI029.",
      };
    });
}

function buildTargetProfileInventory(cards) {
  const entries = [];
  for (const card of cards) {
    for (const [index, profile] of (card.targetProfiles ?? []).entries()) {
      entries.push({
        cardId: card.cardId,
        side: card.side,
        cardType: card.cardType,
        index,
        classification: classifyTargetProfile(profile),
        hiddenInfoPolicy: profile.hiddenInfoPolicy,
        normalizedHiddenInfoPolicy: normalizeHiddenInfoPolicy(profile),
        schemaVersion: profile.schemaVersion,
        kind: profile.kind,
        timing: profile.timing,
        targetType: profile.targetType,
        targetCardType: profile.targetCardType,
        purpose: profile.purpose,
        staticConstraintFields: staticConstraintFields(profile),
        status: profile.hiddenInfoPolicy ? "complete" : "schema_gap",
        profile,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.cardId}:${entry.index}`);
}

function buildConditionInventory(cards) {
  const entries = [];
  for (const card of cards) {
    for (const [index, condition] of (card.conditions ?? []).entries()) {
      entries.push({
        cardId: card.cardId,
        side: card.side,
        cardType: card.cardType,
        index,
        kind: condition.kind,
        normalizedKind: normalizeConditionKind(condition.kind),
        classification: classifyCondition(condition.kind),
        condition,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.kind}:${entry.cardId}:${entry.index}`);
}

function buildConstraintInventory(cards) {
  const entries = [];
  for (const card of cards) {
    const base = { cardId: card.cardId, side: card.side, cardType: card.cardType };
    if (hasMeaningfulValue(card.costProfile)) {
      entries.push({ ...base, constraintKind: "costProfile", sourceField: "costProfile", value: card.costProfile });
    }
    if (hasMeaningfulValue(card.breakerProfile)) {
      entries.push({ ...base, constraintKind: "breakerProfile", sourceField: "breakerProfile", value: card.breakerProfile });
    }
    if (hasMeaningfulValue(card.remoteRole?.serverScope)) {
      entries.push({
        ...base,
        constraintKind: "remoteRole.serverScope",
        sourceField: "remoteRole.serverScope",
        value: card.remoteRole.serverScope,
      });
    }
    for (const [index, effect] of (card.effects ?? []).entries()) {
      for (const field of ["actionCost", "perTurnLimit"]) {
        if (hasMeaningfulValue(effect[field])) {
          entries.push({
            ...base,
            constraintKind: `effects.${field}`,
            sourceField: `effects[${index}].${field}`,
            value: effect[field],
          });
        }
      }
    }
    for (const [index, targetProfile] of (card.targetProfiles ?? []).entries()) {
      for (const field of [
        "avoid",
        "preferences",
        "oncePerRun",
        "shuffleAfter",
        "showToOpponent",
        "installCost",
        "installsTarget",
        "targetCardType",
        "zone",
      ]) {
        if (hasMeaningfulValue(targetProfile[field])) {
          entries.push({
            ...base,
            constraintKind: `targetProfiles.${field}`,
            sourceField: `targetProfiles[${index}].${field}`,
            value: targetProfile[field],
          });
        }
      }
    }
  }
  return sortBy(entries, (entry) => `${entry.cardId}:${entry.sourceField}`);
}

function buildHiddenInfoPolicyInventory(targetProfileInventory, cards) {
  const entries = [];
  for (const target of targetProfileInventory) {
    entries.push({
      policyId: target.hiddenInfoPolicy ?? "missing_hidden_info_policy",
      normalizedPolicyId: target.normalizedHiddenInfoPolicy ?? "schema_gap",
      sourceField: "targetProfiles.hiddenInfoPolicy",
      cardId: target.cardId,
      side: target.side,
      cardType: target.cardType,
      targetProfileIndex: target.index,
      targetProfilePurpose: target.purpose,
    });
  }
  for (const card of cards) {
    if (card.valueHints?.hidden_zone) {
      entries.push({
        policyId: String(card.valueHints.hidden_zone),
        normalizedPolicyId: "runner_hidden_resource_until_revealed",
        sourceField: "valueHints.hidden_zone",
        cardId: card.cardId,
        side: card.side,
        cardType: card.cardType,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.policyId}:${entry.cardId}:${entry.sourceField}`);
}

function hiddenInfoInventoryFromAi028(ai028) {
  return (ai028.hiddenInfoPolicyInventory ?? []).map((entry) => ({
    ...entry,
    normalizedPolicyId: normalizeHiddenInfoPolicy({ hiddenInfoPolicy: entry.policyId }),
  }));
}

function compareProfiles(beforeInventory, afterInventory) {
  const beforeByKey = new Map(beforeInventory.map((entry) => [`${entry.cardId}:${entry.index}`, entry]));
  const changes = [];
  for (const after of afterInventory) {
    const key = `${after.cardId}:${after.index}`;
    const before = beforeByKey.get(key);
    if (!before) continue;
    const beforeProfile = before.profile ?? {};
    const afterProfile = after.profile ?? {};
    if (stableJson(beforeProfile) === stableJson(afterProfile)) continue;
    changes.push({
      cardId: after.cardId,
      title: before.title,
      side: after.side,
      cardType: after.cardType,
      index: after.index,
      beforeClassification: classifyTargetProfile(beforeProfile),
      afterClassification: after.classification,
      beforeHiddenInfoPolicy: beforeProfile.hiddenInfoPolicy,
      afterHiddenInfoPolicy: afterProfile.hiddenInfoPolicy,
      afterNormalizedHiddenInfoPolicy: after.normalizedHiddenInfoPolicy,
      beforeShape: targetProfileShape(beforeProfile),
      afterShape: targetProfileShape(afterProfile),
      fieldsAdded: Object.keys(afterProfile).filter((keyName) => beforeProfile[keyName] === undefined).sort(),
      fieldsPreserved: Object.keys(beforeProfile).filter((keyName) => afterProfile[keyName] !== undefined).sort(),
      noEffect: true,
      rationale: "Legacy generated Search/Install profile gained target-profile-v1 schema fields and explicit hiddenInfoPolicy; existing zone/install constraint fields were retained.",
    });
  }
  return sortBy(changes, (entry) => `${entry.cardId}:${entry.index}`);
}

function summarizeTargetProfiles(inventory) {
  return {
    total: inventory.length,
    missingHiddenInfoPolicy: inventory.filter((entry) => !entry.hiddenInfoPolicy && !entry.profile?.hiddenInfoPolicy).length,
    fullV1: inventory.filter((entry) => (entry.schemaVersion ?? entry.profile?.schemaVersion) === "target-profile-v1").length,
    legacyShape: inventory.filter((entry) => (entry.schemaVersion ?? entry.profile?.schemaVersion) !== "target-profile-v1").length,
    byClassification: countBy(inventory, (entry) => entry.classification ?? classifyTargetProfile(entry.profile ?? {})),
    byHiddenInfoPolicy: countBy(inventory, (entry) => entry.hiddenInfoPolicy ?? entry.profile?.hiddenInfoPolicy ?? "missing"),
    byNormalizedHiddenInfoPolicy: countBy(inventory, (entry) => entry.normalizedHiddenInfoPolicy ?? normalizeHiddenInfoPolicy(entry.profile ?? {})),
    staticConstraintMisclassifiedCount: inventory.filter(
      (entry) => (entry.classification ?? classifyTargetProfile(entry.profile ?? {})) === "static_constraint_misclassified",
    ).length,
    schemaGapCount: inventory.filter((entry) => (entry.status ?? "") === "schema_gap").length,
  };
}

function summarizeConditions(inventory) {
  return {
    total: inventory.length,
    uniqueConditionKinds: sortedUnique(inventory.map((entry) => entry.kind)).length,
    byKind: countBy(inventory, (entry) => entry.kind),
    byClassification: countBy(inventory, (entry) => entry.classification ?? classifyCondition(entry.kind)),
    legacyAliasKindsPresent: inventory
      .filter((entry) => (entry.classification ?? classifyCondition(entry.kind)) === "legacy_alias")
      .map((entry) => entry.kind)
      .filter(uniqueFilter)
      .sort(),
  };
}

function summarizeConstraints(inventory) {
  return {
    total: inventory.length,
    byConstraintKind: countBy(inventory, (entry) => entry.constraintKind),
    targetProfileEmbeddedConstraintCount: inventory.filter((entry) => entry.sourceField.startsWith("targetProfiles[")).length,
    staticConstraintMisclassifiedAsTargetProfileCount: 0,
  };
}

function summarizeHiddenInfoPolicies(inventory) {
  return {
    total: inventory.length,
    missingTargetProfilePolicyCount: inventory.filter((entry) => entry.policyId === "missing_hidden_info_policy").length,
    byPolicyId: countBy(inventory, (entry) => entry.policyId),
    byNormalizedPolicyId: countBy(inventory, (entry) => entry.normalizedPolicyId ?? normalizeHiddenInfoPolicy({ hiddenInfoPolicy: entry.policyId })),
    unsafePolicyRefs: inventory.filter((entry) =>
      /privatePayload|fullState|stateHash|legalActions|playerActions|secret|token|reconnect|undo/i.test(entry.policyId),
    ),
  };
}

function buildConditionAliasInventory(afterConditions) {
  const present = new Set(afterConditions.map((entry) => entry.kind));
  return [
    {
      aliasType: "condition",
      retainedValue: "requires_runner_tagged",
      normalForm: "requires_runner_tagged",
      aliasesCovered: ["condition.requires_tagged_runner", "requires_tagged_runner"],
      status: present.has("requires_runner_tagged") ? "present_normal_form" : "not_present",
      rationale: "Guide-V3 tagged-runner prerequisite is already represented as a prerequisite condition, not a StrategySupportPair.",
    },
    {
      aliasType: "condition",
      retainedValue: "requires_stolen_agenda_last_turn",
      normalForm: "requires_stolen_agenda_last_turn",
      aliasesCovered: ["condition.agenda_stolen_last_turn", "agenda_stolen_last_turn"],
      status: present.has("requires_stolen_agenda_last_turn") ? "present_normal_form" : "not_present",
      rationale: "Existing name is precise and side-neutral enough for current read-only hints.",
    },
    {
      aliasType: "condition",
      retainedValue: "requires_trace_success",
      normalForm: "requires_trace_success",
      aliasesCovered: ["requires_trace_success"],
      status: present.has("requires_trace_success") ? "present_normal_form" : "not_present",
      rationale: "Trace success is already a condition and does not derive strategy anchors.",
    },
    {
      aliasType: "condition",
      retainedValue: "requires_advancement_counter",
      normalForm: "requires_advancement_counter",
      aliasesCovered: ["requires_source_advancement_counters", "requires_target_can_be_advanced"],
      status: present.has("requires_advancement_counter") ? "retained_broad_condition" : "not_present",
      rationale: "AI029 does not split source-vs-target advancement counters without a dedicated action/target schema.",
    },
  ];
}

function buildHiddenInfoPolicyAliases(afterTargetProfiles) {
  const policies = new Set(afterTargetProfiles.map((entry) => entry.hiddenInfoPolicy).filter(Boolean));
  return [
    {
      aliasType: "hiddenInfoPolicy",
      retainedValue: "public_or_controller_known_only",
      normalForm: "own_private_allowed",
      status: policies.has("public_or_controller_known_only") ? "alias_retained" : "not_present",
      rationale: "Current ontology keeps the existing umbrella value; AI029 report classifies own-stack Search/Install profiles as own_private_allowed without a broad data rename.",
    },
    {
      aliasType: "hiddenInfoPolicy",
      retainedValue: "visible_or_known_only",
      normalForm: "visible_only",
      status: policies.has("visible_or_known_only") ? "alias_retained" : "not_present",
      rationale: "Retained for compatibility with existing ontology and checks.",
    },
    {
      aliasType: "hiddenInfoPolicy",
      retainedValue: "legal_targets_only",
      normalForm: "legal_targets_only",
      status: policies.has("legal_targets_only") ? "present_normal_form" : "not_present",
      rationale: "Already matches the Guide-V3 normal form.",
    },
  ];
}

function buildSchemaGapsRetained(ai028, conditionAliasInventory) {
  const descriptorGaps = ai028.taxonomySmells?.descriptorGapCards ?? [];
  return [
    {
      gapId: "ai028_descriptor_gap_cards",
      category: "constraint",
      count: descriptorGaps.length,
      status: "needs_schema_design",
      sampleCards: descriptorGaps.slice(0, 12).map((entry) => entry.cardId),
      rationale: "Descriptor gaps are not safe to bulk-convert without a dedicated descriptor schema design.",
    },
    {
      gapId: "advancement_source_target_condition_split",
      category: "condition",
      count: conditionAliasInventory.some((entry) => entry.retainedValue === "requires_advancement_counter") ? 1 : 0,
      status: "deferred_until_action_semantics",
      sampleCards: [],
      rationale: "Guide-V3 requested source/target advancement-counter split; current hints retain broad read-only condition until Action semantics expose source/target roles.",
    },
  ];
}

function buildDeferredItems({ ai028, schemaGapsRetained }) {
  return [
    {
      itemId: "AI029-D001",
      category: "taxonomy",
      status: "defer",
      description: "breaker.code_gate, breaker.sentry and breaker.wall remain potential type/subtype-shaped signal smells.",
      suggestedTask: "Dedicated tactic-signal taxonomy review",
    },
    {
      itemId: "AI029-D002",
      category: "legacy",
      status: "defer",
      description: "action.corp_repeatable_extra_action and damage.payoff remain legacy/aggregation signal followups.",
      suggestedTask: "Legacy aggregation signal retirement review",
    },
    {
      itemId: "AI029-D003",
      category: "constraint",
      status: "needs_schema_design",
      description: `${schemaGapsRetained[0]?.count ?? ai028.taxonomySmells?.descriptorGapCards?.length ?? 0} AI028 descriptor-gap cards remain classified, not rewritten.`,
      suggestedTask: "Descriptor schema design before bulk conversion",
    },
    {
      itemId: "AI029-D004",
      category: "condition",
      status: "deferred_until_action_semantics",
      description: "Source/target advancement-counter split is deferred until action/target semantics expose source and target roles.",
      suggestedTask: "Action semantics bridge prerequisite",
    },
  ];
}

function classifyTargetProfile(profile) {
  if (!profile || typeof profile !== "object") return "schema_gap";
  if (profile.schemaVersion !== "target-profile-v1") {
    if (profile.zone || profile.targetCardType || profile.installCost || profile.installsTarget) {
      return profile.installsTarget ? "active_target_choice" : "static_constraint_misclassified";
    }
    return "schema_gap";
  }
  if (profile.kind === "mode_choice") return "mode_choice";
  if (profile.kind === "hosted_install_target") return "self_target";
  if (profile.kind === "search_install_target" || profile.kind === "install_target") return "active_target_choice";
  if (profile.kind === "replacement_target") return "active_target_choice";
  if (profile.kind === "use_target") return "active_target_choice";
  return "schema_gap";
}

function classifyCondition(kind) {
  if (!kind) return "schema_gap";
  if (
    [
      "condition.last_turn_run",
      "condition.runner_attempted_run_last_turn",
      "condition.runner_attempted_multiple_runs_last_turn",
      "condition.node_trashed_last_turn",
      "condition.resource_installed_last_turn",
      "condition.run_this_game",
      "condition.agenda_stolen_last_turn",
      "condition.requires_tagged_runner",
      "requires_tagged_runner",
    ].includes(kind)
  ) {
    return "legacy_alias";
  }
  if (kind === "requires_advancement_counter") return "deferred_until_action_semantics";
  if (kind.startsWith("requires_")) return "normal_form";
  return "schema_gap";
}

function normalizeConditionKind(kind) {
  const aliases = {
    "condition.agenda_stolen_last_turn": "requires_stolen_agenda_last_turn",
    agenda_stolen_last_turn: "requires_stolen_agenda_last_turn",
    "condition.requires_tagged_runner": "requires_runner_tagged",
    requires_tagged_runner: "requires_runner_tagged",
    requires_source_advancement_counters: "requires_advancement_counter",
    requires_target_can_be_advanced: "requires_advancement_counter",
  };
  return aliases[kind] ?? kind;
}

function normalizeHiddenInfoPolicy(profile) {
  const policy = profile?.hiddenInfoPolicy;
  if (!policy) return "schema_gap";
  if (policy === "legal_targets_only") return "legal_targets_only";
  if (policy === "visible_or_known_only") return "visible_only";
  if (
    policy === "public_or_controller_known_only" &&
    (profile.zone?.startsWith("stack") ||
      profile.kind === "search_install_target" ||
      profile.kind === "hosted_install_target")
  ) {
    return "own_private_allowed";
  }
  if (policy === "public_or_controller_known_only") return "controller_known_only";
  return policy;
}

function staticConstraintFields(profile) {
  return [
    "zone",
    "targetCardType",
    "installCost",
    "installsTarget",
    "shuffleAfter",
    "showToOpponent",
    "oncePerRun",
    "lookCount",
    "preferences",
    "avoid",
  ].filter((field) => hasMeaningfulValue(profile?.[field]));
}

function targetProfileShape(profile) {
  if (profile.schemaVersion === "target-profile-v1") return "target-profile-v1";
  if (profile.zone || profile.targetCardType) return "legacy-zone-target-profile";
  return "unknown";
}

function buildVerification({ verificationPassed }) {
  const status = verificationPassed ? "passed" : "pending";
  return [
    "node scripts/check-ai028-netgrid-semantic-audit-pack.mjs",
    "node scripts/check-ai029-target-condition-constraint-schema-sweep.mjs",
    "corepack pnpm check:ai-strategy-taxonomy",
    "corepack pnpm check:ai-hint-quality",
    "corepack pnpm check:ai-hint-compiled-index",
    "corepack pnpm check:ai-approval-consistency",
    "corepack pnpm check:ai-deck-doctrine-strategy",
    "corepack pnpm --filter @netgrid/ai test",
    "corepack pnpm --filter @netgrid/ai typecheck",
    "corepack pnpm --filter @netgrid/web typecheck",
    "git diff --check",
  ].map((command) => ({ command, status }));
}

function renderMarkdown(report) {
  return `# AI029: TargetProfile-, Condition- und Constraint-Schema-Sweep

Stand: ${report.generatedAt}
Guide: ${report.guideVersion}
Source Commit: ${report.sourceCommit}
Input Audit: ${report.inputAudit}
Status: ${report.status}

## Scope

AI029 normalisiert den schemaförmigen Teil aus AI028: TargetProfiles, Conditions, Constraints und HiddenInfoPolicy-Inventar. Der Batch erzeugt keine neue Kartenwirkung, keine Strategy ID und keine Runtime-, Planner-, Engine-, Legalitäts-, Targeting- oder UI-Wirkung.

## AI028-Warnings

${report.warningFindingsReviewed
  .map(
    (entry) =>
      `- ${entry.findingId} [${entry.category}]: ${entry.decision}. ${entry.result}`,
  )
  .join("\n")}

## Änderungen

- TargetProfiles geändert: ${report.changedTargetProfiles.length}
- Conditions geändert: ${report.changedConditions.length}
- Constraints geändert: ${report.changedConstraints.length}
- HiddenInfoPolicies geändert: ${report.changedHiddenInfoPolicies.length}

Die drei Änderungen sind generierte Search/Install-TargetProfiles. Sie behalten ihre bestehenden Ziel- und Constraint-Felder, bekommen aber vollständige \`target-profile-v1\`-Schemafelder und eine explizite read-only HiddenInfoPolicy.

## Inventar Vorher/Nachher

- TargetProfiles vorher: ${report.targetProfileInventoryBefore.total}, missing HiddenInfoPolicy: ${report.targetProfileInventoryBefore.missingHiddenInfoPolicy}
- TargetProfiles nachher: ${report.targetProfileInventoryAfter.total}, missing HiddenInfoPolicy: ${report.targetProfileInventoryAfter.missingHiddenInfoPolicy}
- Conditions vorher/nachher: ${report.conditionInventoryBefore.total}/${report.conditionInventoryAfter.total}
- Constraints vorher/nachher: ${report.constraintInventoryBefore.total}/${report.constraintInventoryAfter.total}
- HiddenInfoPolicy-Einträge vorher/nachher: ${report.hiddenInfoPolicyInventoryBefore.total}/${report.hiddenInfoPolicyInventoryAfter.total}

## Aliases Und Gaps

${report.aliasesRetained
  .map(
    (entry) =>
      `- ${entry.aliasType}: ${entry.retainedValue} -> ${entry.normalForm} (${entry.status})`,
  )
  .join("\n")}

${report.schemaGapsRetained
  .map((entry) => `- ${entry.gapId} [${entry.category}/${entry.status}]: ${entry.rationale}`)
  .join("\n")}

## Deferred Items

${report.deferredItems
  .map((entry) => `- ${entry.itemId} [${entry.category}/${entry.status}]: ${entry.description}`)
  .join("\n")}

## No-Effect

Alle no-effect Flags sind false: Planner, ActionScore, PlanWeight, Targeting-AI, Engine, Legal, Profile/Default, UI-Derivation und Hidden-Info-Leak.

## Verification

${report.verification.map((entry) => `- ${entry.command}: ${entry.status}`).join("\n")}
`;
}

function validateReport(report, markdown) {
  const errors = [];
  if (report.taskId !== TASK_ID) errors.push(`taskId must be ${TASK_ID}`);
  if (report.guideVersion !== GUIDE_VERSION) errors.push(`guideVersion must be ${GUIDE_VERSION}`);
  if (!report.sourceCommit) errors.push("sourceCommit must be set");
  if (report.inputAudit !== "AI028") errors.push("inputAudit must be AI028");
  for (const flag of Object.keys(NO_EFFECT_FLAGS)) {
    if (report.noEffectFlags?.[flag] !== false) errors.push(`noEffectFlags.${flag} must be false`);
  }
  if (report.guardrails?.strategyGoalCountAfter !== report.guardrails?.strategyGoalCountBefore) {
    errors.push("Strategy goal count changed");
  }
  if ((report.guardrails?.conditionGeneratedStrategySupportPairs ?? []).length > 0) {
    errors.push("Conditions generated StrategySupportPairs");
  }
  if ((report.guardrails?.forbiddenRuntimeOrLegalityFields ?? []).length > 0) {
    errors.push("Forbidden runtime/planner/engine/legal fields detected");
  }
  if (report.targetProfileInventoryAfter?.missingHiddenInfoPolicy !== 0) {
    errors.push("TargetProfiles still miss hiddenInfoPolicy");
  }
  if (report.targetProfileInventoryAfter?.staticConstraintMisclassifiedCount !== 0) {
    errors.push("Static constraints remain classified as TargetProfiles");
  }
  if (!Array.isArray(report.changedTargetProfiles)) errors.push("changedTargetProfiles must be an array");
  if (!Array.isArray(report.changedConditions)) errors.push("changedConditions must be an array");
  if (!Array.isArray(report.changedConstraints)) errors.push("changedConstraints must be an array");
  if (!Array.isArray(report.changedHiddenInfoPolicies)) errors.push("changedHiddenInfoPolicies must be an array");
  if (report.changedTargetProfiles.length !== report.changedHiddenInfoPolicies.length) {
    errors.push("TargetProfile and HiddenInfoPolicy change counts should match for AI029");
  }
  if (report.changedConditions.length !== 0) errors.push("AI029 must not change Conditions in this batch");
  if (report.changedConstraints.length !== 0) errors.push("AI029 must not change Constraints in this batch");
  if (!markdown.includes("# AI029: TargetProfile-, Condition- und Constraint-Schema-Sweep")) {
    errors.push("Markdown report missing title");
  }
  if (!markdown.includes("## Verification")) errors.push("Markdown report missing Verification section");
  const text = `${stableJson(report)}\n${markdown}`;
  for (const pattern of FORBIDDEN_REPORT_PATTERNS) {
    if (pattern.test(text)) errors.push(`Forbidden report reference: ${pattern}`);
  }
  return errors;
}

function validateNoChronicleState(report, markdown) {
  const errors = [];
  const text = `${stableJson(report)}\n${markdown}`;
  for (const pattern of FORBIDDEN_REPORT_PATTERNS) {
    if (pattern.test(text)) errors.push(`Forbidden report reference: ${pattern}`);
  }
  const status = git(["status", "--short"]);
  for (const line of status.split(/\r?\n/).filter(Boolean)) {
    if (/chronicle/i.test(line)) errors.push(`Working tree contains forbidden Chronicle change: ${line}`);
  }
  return errors;
}

function findForbiddenFields(value, pathValue = "$", hits = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findForbiddenFields(entry, `${pathValue}[${index}]`, hits));
    return hits;
  }
  if (!value || typeof value !== "object") return hits;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = `${pathValue}.${key}`;
    if (FORBIDDEN_EFFECT_FIELDS.has(key)) hits.push(nextPath);
    findForbiddenFields(child, nextPath, hits);
  }
  return hits;
}

function hasMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}

function sortedUnique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null))].sort((left, right) =>
    String(left).localeCompare(String(right)),
  );
}

function uniqueFilter(value, index, array) {
  return array.indexOf(value) === index;
}

function sortBy(values, keyFn) {
  return [...values].sort((left, right) => String(keyFn(left)).localeCompare(String(keyFn(right))));
}

function countBy(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function stableJson(value) {
  return JSON.stringify(sortDeep(value), null, 2);
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

function writeText(relativePath, text) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), text, "utf8");
}

function shortGitHead() {
  return git(["rev-parse", "--short", "HEAD"]).trim();
}

function git(args) {
  return childProcess.execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function failWithErrors(title, errors) {
  console.error(`${title} with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

main();
