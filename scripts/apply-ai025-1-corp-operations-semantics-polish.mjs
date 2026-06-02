#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_AT = "2026-06-02";
const TASK_ID = "AI025-1";
const CORRECTS_COMMIT = "feea9709";
const SOURCE_COMMIT = "ae855f2c";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const BASE_REPORT_PATH = "docs/reviews/ai/ai025-corp-operations-semantics-review-report-2026-06-02.json";
const JSON_REPORT_PATH = "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json";
const MD_REPORT_PATH = "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-2026-06-02.md";
const README_PATH = "docs/reviews/ai/README.md";

const ADDED_SIGNALS = {
  "condition.multiple_runs_last_turn": [true, []],
  "condition.node_trashed_last_turn": [true, []],
  "condition.run_this_game": [true, []],
  "condition.resource_installed_last_turn": [true, []],
  "damage.meat_source": [false, ["corp.damage_kill"]],
  "damage.tagged_meat_payoff": [false, ["corp.damage_kill", "corp.tag_trace_punish"]],
  "ice.corp_installment_rez": [true, []],
  "tag.additional_tag_followup": [false, ["corp.tag_trace_punish"]],
};

const REPORT_FLAGS = [
  "plannerEffect",
  "actionScoreEffect",
  "planWeightEffect",
  "targetingAiEffect",
  "engineEffect",
  "legalEffect",
  "profileOrDefaultSwitch",
  "uiDerivationEffect",
  "hiddenInfoLeakEffect",
];

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

function unique(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort();
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

function signalGroup(signalId) {
  if (signalId.startsWith("condition.")) return "ai025_1_corp_operations_conditions";
  if (signalId.startsWith("damage.")) return "ai025_1_corp_operations_damage";
  if (signalId.startsWith("ice.")) return "ai025_1_corp_operations_ice";
  if (signalId.startsWith("tag.")) return "ai025_1_corp_operations_tag_snowball";
  return "ai025_1_corp_operations";
}

function signalDescription(signalId) {
  return `AI025-1 Corp operation polish signal: ${signalId.replaceAll("_", " ")}.`;
}

function updateTacticSignals() {
  const catalog = readJson(TACTIC_SIGNAL_PATH);
  const byId = new Map((catalog.signals ?? []).map((signal) => [signal.signalId, signal]));
  for (const [signalId, [supportOnly, anchors]] of Object.entries(ADDED_SIGNALS)) {
    const existed = byId.has(signalId);
    const signal = byId.get(signalId) ?? { signalId };
    signal.group = signalGroup(signalId);
    signal.sideScope = "corp";
    signal.description = signalDescription(signalId);
    signal.supportOnly = supportOnly;
    signal.mayAnchorStrategy = !supportOnly;
    signal.allowedStrategyAnchors = [...anchors].sort();
    signal.sourceKinds = unique([...(signal.sourceKinds ?? []), "AI025-1 reviewed Corp-operation structured hint effects"]);
    signal.examples = signal.examples ?? [];
    signal.targetProfileRelevant =
      signalId.startsWith("condition.") || signalId === "ice.corp_installment_rez";
    signal.notes =
      "AI025-1 Corp-operation polish signal; read-only semantics only. It does not create planner, engine, legality, targeting, profile/default, action-score, plan-weight, UI or hidden-info behavior.";
    if (!existed) {
      catalog.signals.push(signal);
      byId.set(signalId, signal);
    }
  }
  const transfer = byId.get("advance.corp_counter_transfer");
  if (transfer) {
    transfer.sourceKinds = unique([...(transfer.sourceKinds ?? []), "AI025-1 Corp-operation counter-transfer reuse"]);
    transfer.notes =
      "Read-only counter-transfer signal reused by AI025-1 for Falsified-Transactions Expert; it does not create planner, engine, legality, targeting, profile/default, action-score, plan-weight, UI or hidden-info behavior.";
  }
  catalog.taskId = `${catalog.taskId ?? "AI"}/AI025-1`;
  catalog.generatedAt = GENERATED_AT;
  catalog.signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
  writeJson(TACTIC_SIGNAL_PATH, catalog);
  return Object.keys(ADDED_SIGNALS).map((signalId) => byId.get(signalId));
}

function updateDerivationRules() {
  const data = readJson(DERIVATION_PATH);
  const existing = new Set(
    (data.derivationRules ?? []).map((rule) => `${rule.signalId}:${JSON.stringify(rule.match)}:${JSON.stringify(rule.gates)}`),
  );
  for (const [signalId, [, anchors]] of Object.entries(ADDED_SIGNALS)) {
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
  data.taskId = `${data.taskId ?? "AI"}/AI025-1`;
  data.updatesTaskId = `${data.updatesTaskId ?? "AI003-AI025"}/AI025-1`;
  data.generatedAt = GENERATED_AT;
  data.derivationRules.sort((left, right) =>
    `${left.signalId}:${JSON.stringify(left.match)}`.localeCompare(`${right.signalId}:${JSON.stringify(right.match)}`),
  );
  writeJson(DERIVATION_PATH, data);
}

const UPDATES = {
  "onr_v1_283_audit-of-call-records": {
    mechanicalFamily: "trace_tag_source",
    tacticSignals: ["condition.multiple_runs_last_turn", "tag.source", "trace.source"],
    functionalEffects: ["tag.source", "trace.source"],
    conditions: ["requires_multiple_runs_last_turn", "requires_trace_success"],
    hintEffects: [
      e("trace", "action", "runner", "trace.source", { amount: 5, finite: true }),
      e("tag_source", "trace_success", "runner", "tag.source", { resource: "tags", amount: 1, finite: true }),
    ],
    hintConditions: [c("requires_runner_action"), c("requires_trace_success")],
    rationale: "Requires two or more runs during the Runner's last turn, then trace-success tag. The prior generic run-last-turn condition was too broad.",
  },
  "onr_v1_285_closed-accounts": {
    mechanicalFamily: "tagged_runner_credit_loss",
    tacticSignals: ["risk.requires_tagged_runner", "tag.payoff"],
    functionalEffects: ["tag.payoff"],
    hintEffects: [e("tag_punish_payoff", "action", "runner", "tag.payoff", { resource: "credits", finite: true })],
    conditions: ["requires_runner_tagged"],
    hintConditions: [c("requires_runner_tagged")],
    strategySupportPairs: [pair("corp.tag_trace_punish", "tag_payoff", ["tag.payoff"], "high")],
    rationale: "Runner loses all bits while tagged; this is not Corp credit gain or conditional Corp economy.",
  },
  "onr_v1_287_datapool-by-zetatech": {
    mechanicalFamily: "tag_snowball_followup",
    tacticSignals: ["risk.requires_tagged_runner", "tag.additional_tag_followup", "tag.payoff"],
    functionalEffects: ["tag.additional_tag_followup", "tag.payoff"],
    hintEffects: [
      e("tag_source", "action", "runner", "tag.additional_tag_followup", { resource: "tags", amount: 2, finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { resource: "tags", amount: 2, finite: true }),
    ],
    conditions: ["requires_runner_tagged"],
    hintConditions: [c("requires_runner_tagged")],
    strategySupportPairs: [pair("corp.tag_trace_punish", "tag_snowball_followup", ["tag.additional_tag_followup", "tag.payoff"], "high")],
    rationale: "Adds more tags only to an already tagged Runner; modeled as tag snowball/follow-up rather than an initial tag source.",
  },
  "onr_v1_291_falsified-transactions-expert": {
    mechanicalFamily: "advancement_counter_transfer",
    tacticSignals: ["advance.corp_counter_transfer", "advance.score_window_support"],
    functionalEffects: ["advance.corp_counter_transfer"],
    hintEffects: [e("advance", "action", "installed_card", "advance.corp_counter_transfer", { resource: "advancement_counters", amount: 3, finite: true })],
    conditions: ["requires_source_advancement_counters", "requires_target_can_be_advanced"],
    hintConditions: [c("requires_advancement_counter"), c("requires_installed_card")],
    strategySupportPairs: [pair("corp.fast_advance", "fast_advance_enabler", ["advance.corp_counter_transfer", "advance.score_window_support"], "medium")],
    targetProfileStatus: "candidate",
    targetProfileKinds: ["use_target:advancement_counter_reallocation"],
    rationale: "Moves counters between installed cards; it reallocates existing advancement counters and does not create new counters.",
  },
  "onr_v1_292_management-shake-up": {
    conditions: ["requires_target_can_be_advanced"],
    hintConditions: [c("requires_installed_card")],
    rationale: "Adds new advancement counters to installed advanceable cards and does not require pre-existing counters.",
  },
  "onr_v1_293_netwatch-credit-voucher": {
    mechanicalFamily: "tag_snowball_followup",
    tacticSignals: ["economy.corp_credit_burst", "risk.requires_tagged_runner", "tag.additional_tag_followup", "tag.payoff"],
    functionalEffects: ["economy.corp_credit_burst", "tag.additional_tag_followup", "tag.payoff"],
    hintEffects: [
      e("tag_source", "action", "runner", "tag.additional_tag_followup", { resource: "tags", amount: 1, finite: true }),
      e("tag_punish_payoff", "action", "runner", "tag.payoff", { resource: "tags", amount: 1, finite: true }),
      e("economy", "action", "corp", "economy.corp_credit_burst", { resource: "credits", amount: 1, finite: true }),
    ],
    conditions: ["requires_runner_tagged"],
    hintConditions: [c("requires_runner_tagged")],
    strategySupportPairs: [pair("corp.tag_trace_punish", "tag_snowball_followup", ["tag.additional_tag_followup", "tag.payoff"], "medium")],
    rationale: "Adds an extra tag only after the Runner is already tagged, plus a small Corp credit burst.",
  },
  "onr_v1_294_new-blood": {
    tacticSignals: ["ice.corp_rearrange_conceal"],
    functionalEffects: ["ice.corp_rearrange_conceal"],
    conditions: [],
    hintConditions: [],
    rationale: "Conceal/rearrange operation has no run-last-turn play condition in the repo card text.",
  },
  "onr_v1_296_off-site-backups": {
    mechanicalFamily: "archives_recovery",
    tacticSignals: ["archives.corp_recovery"],
    functionalEffects: ["archives.corp_recovery"],
    hintEffects: [e("card_recovery", "action", "archives", "archives.corp_recovery", { finite: true })],
    targetProfileStatus: "schema_gap",
    targetProfileKinds: ["private_archives_recovery_choice"],
    hiddenInfoPolicy: "corp_side_only_until_resolved",
    rationale: "Returns a card from Archives to HQ; no draw occurs.",
  },
  "onr_v1_300_project-consultants": {
    conditions: ["requires_target_can_be_advanced"],
    hintConditions: [c("requires_installed_card")],
    rationale: "Adds new advancement counters to installed advanceable cards and does not require pre-existing counters.",
  },
  "onr_v1_301_punitive-counterstrike": {
    mechanicalFamily: "tagged_meat_damage",
    tacticSignals: ["damage.meat_source", "damage.tagged_meat_payoff", "risk.requires_tagged_runner", "tag.payoff"],
    functionalEffects: ["damage.meat_source", "damage.tagged_meat_payoff", "tag.payoff"],
    hintEffects: [
      e("damage", "action", "runner", "damage.meat_source", { resource: "damage", amount: 2, finite: true }),
      e("tag_punish_payoff", "action", "runner", "damage.tagged_meat_payoff", { resource: "damage", amount: 2, finite: true }),
    ],
    conditions: ["requires_runner_tagged"],
    hintConditions: [c("requires_runner_tagged")],
    strategySupportPairs: [
      pair("corp.damage_kill", "tagged_minor_damage_payoff", ["damage.tagged_meat_payoff", "damage.meat_source"], "medium"),
      pair("corp.tag_trace_punish", "tagged_damage_payoff", ["damage.tagged_meat_payoff", "tag.payoff"], "high"),
    ],
    rationale: "Tagged Runner payoff dealing 2 meat damage; precise damage type is carried separately from generic tag payoff.",
  },
  "onr_v1_302_scorched-earth": {
    mechanicalFamily: "tagged_meat_damage",
    tacticSignals: ["damage.meat_source", "damage.tagged_meat_payoff", "risk.requires_tagged_runner", "tag.payoff"],
    functionalEffects: ["damage.meat_source", "damage.tagged_meat_payoff", "tag.payoff"],
    hintEffects: [
      e("damage", "action", "runner", "damage.meat_source", { resource: "damage", amount: 4, finite: true }),
      e("tag_punish_payoff", "action", "runner", "damage.tagged_meat_payoff", { resource: "damage", amount: 4, finite: true }),
    ],
    conditions: ["requires_runner_tagged"],
    hintConditions: [c("requires_runner_tagged")],
    strategySupportPairs: [
      pair("corp.damage_kill", "tagged_damage_payoff", ["damage.tagged_meat_payoff", "damage.meat_source"], "high"),
      pair("corp.tag_trace_punish", "tagged_damage_payoff", ["damage.tagged_meat_payoff", "tag.payoff"], "high"),
    ],
    rationale: "Tagged Runner payoff dealing 4 meat damage; a kill-capable meat-damage payoff.",
  },
  "onr_v1_303_silver-lining-recovery-protocol": {
    tacticSignals: ["condition.agenda_stolen_last_turn", "economy.corp_conditional_credit"],
    functionalEffects: ["economy.corp_conditional_credit"],
    rationale: "Conditional agenda-stolen credit recovery; no active overadvance-support signal is warranted.",
  },
  "onr_v1_304_systematic-layoffs": {
    conditions: ["requires_target_can_be_advanced"],
    hintConditions: [c("requires_installed_card")],
    rationale: "Adds new advancement counters to installed advanceable cards and does not require pre-existing counters.",
  },
  "onr_v1_307_urban-renewal": {
    mechanicalFamily: "tagged_meat_damage",
    tacticSignals: ["damage.meat_source", "damage.tagged_meat_payoff", "risk.requires_tagged_runner", "tag.payoff"],
    functionalEffects: ["damage.meat_source", "damage.tagged_meat_payoff", "tag.payoff"],
    hintEffects: [
      e("damage", "action", "runner", "damage.meat_source", { resource: "damage", amount: 5, finite: true }),
      e("tag_punish_payoff", "action", "runner", "damage.tagged_meat_payoff", { resource: "damage", amount: 5, finite: true }),
    ],
    conditions: ["requires_runner_tagged"],
    hintConditions: [c("requires_runner_tagged")],
    strategySupportPairs: [
      pair("corp.damage_kill", "tagged_damage_payoff", ["damage.tagged_meat_payoff", "damage.meat_source"], "high"),
      pair("corp.tag_trace_punish", "tagged_damage_payoff", ["damage.tagged_meat_payoff", "tag.payoff"], "high"),
    ],
    rationale: "Tagged Runner payoff dealing 5 meat damage; a kill-capable meat-damage payoff.",
  },
  "onr_proteus_048_data-sifters": {
    tacticSignals: ["condition.node_trashed_last_turn", "tag.source"],
    functionalEffects: ["tag.source"],
    conditions: ["requires_node_trashed_last_turn"],
    hintConditions: [c("requires_installed_card")],
    rationale: "Requires Runner trashed a node last turn; not a generic run-last-turn condition.",
  },
  "onr_proteus_049_emergency-rig": {
    functionalEffects: ["ice.corp_free_rez", "ice.corp_temporary_rez", "risk.temporary_rez_liability"],
    conditions: ["requires_x_lifetime_choice"],
    hintConditions: [c("requires_installed_ice")],
    targetProfileStatus: "candidate",
    targetProfileKinds: ["use_target:installed_ice_rez_choice", "use_target:x_kludge_lifetime_choice"],
    rationale: "Free rez with explicit Kludge lifetime and trash liability; target candidate records ICE choice and X lifetime schema need.",
  },
  "onr_proteus_051_rent-to-own-contract": {
    tacticSignals: ["ice.corp_deferred_rez", "ice.corp_installment_rez"],
    functionalEffects: ["ice.corp_deferred_rez", "ice.corp_installment_rez"],
    hintEffects: [
      e("rez", "action", "ice", "ice.corp_deferred_rez", { finite: true }),
      e("rez", "corp_turn", "ice", "ice.corp_installment_rez", { finite: false }),
    ],
    conditions: ["requires_installed_ice_choice"],
    hintConditions: [c("requires_installed_ice")],
    targetProfileStatus: "candidate",
    targetProfileKinds: ["use_target:installed_ice_deferred_rez_choice"],
    rationale: "Deferred/installment rez with term counters and payment risk; not temporary rez and not a Kludge-style lifetime.",
  },
  "onr_proteus_052_schlaghund-pointers": {
    tacticSignals: ["condition.run_this_game", "tag.source", "trace.source"],
    functionalEffects: ["tag.source", "trace.source"],
    conditions: ["requires_run_this_game", "requires_trace_success"],
    risks: ["trace_cost_scales_above_zero"],
    hintConditions: [c("requires_runner_action"), c("requires_trace_success")],
    rationale: "Requires a run this game and has trace-cost scaling above base trace; not a last-turn run condition.",
  },
  "onr_proteus_053_underworld-mole": {
    mechanicalFamily: "trace_tag_resource_trash",
    tacticSignals: ["condition.resource_installed_last_turn", "resource.trash_payoff", "tag.source", "trace.source"],
    functionalEffects: ["resource.trash_payoff", "tag.source", "trace.source"],
    hintEffects: [
      e("trace", "action", "runner", "trace.source", { amount: 4, finite: true }),
      e("resource_trash", "trace_success", "runner", "resource.trash_payoff", { finite: true }),
      e("tag_source", "trace_success", "runner", "tag.source", { resource: "tags", amount: 1, finite: true }),
    ],
    conditions: ["requires_resource_installed_last_turn", "requires_trace_success"],
    hintConditions: [c("requires_installed_resource"), c("requires_trace_success")],
    strategySupportPairs: [pair("corp.tag_trace_punish", "tag_source_enabler", ["trace.source", "tag.source"], "medium")],
    targetProfileStatus: "candidate",
    targetProfileKinds: ["use_target:recently_installed_resource"],
    rationale: "Trace-success trashes a recently installed resource and gives a tag; condition is resource-installed-last-turn, not generic run-last-turn.",
  },
  v08_archive_planning_operation: {
    mechanicalFamily: "draw",
    tacticSignals: ["economy.corp_draw"],
    functionalEffects: ["economy.corp_draw"],
    hintEffects: [e("draw", "action", "corp", "economy.corp_draw", { resource: "cards", amount: 3, finite: true })],
    targetProfileStatus: "not_required",
    targetProfileKinds: [],
    hiddenInfoPolicy: "public_when_played",
    rationale: "The active V08 test operation text says draw 3 cards; it is not Archives recovery.",
  },
};

function strategicRoleFor(role) {
  return (
    {
      fast_advance_enabler: "scoring_tool",
      tag_source_enabler: "enabler",
      tag_snowball_followup: "enabler",
      tag_payoff: "punish_payoff",
      tagged_damage_payoff: "win_condition",
      tagged_minor_damage_payoff: "punish_payoff",
      resource_payoff: "punish_payoff",
      hardware_payoff: "punish_payoff",
      free_rez_enabler: "tax_tool",
    }[role] ?? "support_tool"
  );
}

function patchAssignment(card, update) {
  const next = structuredClone(card);
  for (const key of [
    "mechanicalFamily",
    "tacticSignals",
    "functionalEffects",
    "conditions",
    "risks",
    "targetProfileStatus",
    "targetProfileKinds",
    "hiddenInfoPolicy",
  ]) {
    if (Object.hasOwn(update, key)) next[key] = Array.isArray(update[key]) ? unique(update[key]) : update[key];
  }
  if (Object.hasOwn(update, "strategySupportPairs")) {
    next.strategySupportPairs = update.strategySupportPairs;
    next.strategyAnchors = unique(update.strategySupportPairs.map((item) => item.strategyId));
    next.legacyStrategicRole = unique(update.strategySupportPairs.map((item) => strategicRoleFor(item.role)));
    next.primaryAnchorEvidence = unique(update.strategySupportPairs.flatMap((item) => item.evidence));
  }
  if (Object.hasOwn(update, "tacticSignals")) {
    next.supportingEvidence = unique(next.tacticSignals.filter((signal) => !(next.primaryAnchorEvidence ?? []).includes(signal)));
  }
  if (update.rationale) {
    next.rationale = `${update.rationale} Operation type/subtype remains card data and is not mirrored as a tactic signal.`;
  }
  next.postReviewStatus = "changed";
  next.needsHumanReview = false;
  next.confidence = "high";
  return next;
}

function updateActiveHints(assignmentsById) {
  const data = readJson(ACTIVE_HINTS_PATH);
  let changed = 0;
  for (const hint of data.cards ?? []) {
    const patched = assignmentsById.get(hint.cardId);
    if (!patched) continue;
    const update = UPDATES[hint.cardId];
    const before = JSON.stringify(hint);
    hint.tacticSignals = patched.tacticSignals;
    if (update.hintEffects) hint.effects = update.hintEffects.map(({ target, ...effect }) => effect);
    if (Object.hasOwn(update, "hintConditions")) {
      if (update.hintConditions.length) hint.conditions = update.hintConditions;
      else delete hint.conditions;
    }
    if (patched.strategyAnchors.length) hint.lineSupport = patched.strategyAnchors;
    else delete hint.lineSupport;
    if (patched.legacyStrategicRole.length) hint.strategicRole = patched.legacyStrategicRole;
    else delete hint.strategicRole;
    hint.quality = {
      ...(hint.quality ?? {}),
      benchmarkCovered: hint.quality?.benchmarkCovered === true,
      hintReviewed: true,
      strategyCovered: patched.strategyAnchors.length > 0,
      confidence: patched.confidence,
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

function buildReport(baseReport, patchedAssignments, addedSignals, changedAssignments) {
  const strategySupportPairs = patchedAssignments.flatMap((card) =>
    card.strategySupportPairs.map((strategyPair) => ({ cardId: card.cardId, title: card.title, ...strategyPair })),
  );
  const targetProfileCandidates = patchedAssignments
    .filter((card) => card.targetProfileStatus !== "not_required")
    .map((card) => ({
      cardId: card.cardId,
      title: card.title,
      status: card.targetProfileStatus,
      targetProfileKinds: card.targetProfileKinds,
    }));
  const changedTargetProfiles = changedAssignments
    .filter((card) => card.targetProfileStatus !== "not_required")
    .map((card) => ({
      cardId: card.cardId,
      title: card.title,
      status: card.targetProfileStatus,
      targetProfileKinds: card.targetProfileKinds,
    }));
  return {
    schemaVersion: "ai025-1-corp-operations-semantics-polish-report-v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    status: "complete",
    scope: "corp_operations_polish",
    sourceCommit: SOURCE_COMMIT,
    correctsCommit: CORRECTS_COMMIT,
    countsBefore: {
      activeCompiledCorpOperations: baseReport.summary.activeCorpOperationCount,
      productionOriginalsetOperations: baseReport.summary.activeOriginalsetOperationCount,
      productionProteusOperations: baseReport.summary.activeProteusOperationCount,
      activeTestOperations: baseReport.summary.activeTestOperationCount,
      inactiveClassicOperations: baseReport.summary.inactiveCheckedOperationCount,
      strategySupportPairCount: baseReport.summary.strategySupportPairCount,
      targetProfileCandidateCount: baseReport.summary.targetProfileCandidateCount,
    },
    countsAfter: {
      activeCompiledCorpOperations: baseReport.summary.activeCorpOperationCount,
      productionOriginalsetOperations: baseReport.summary.activeOriginalsetOperationCount,
      productionProteusOperations: baseReport.summary.activeProteusOperationCount,
      activeTestOperations: baseReport.summary.activeTestOperationCount,
      inactiveClassicOperations: baseReport.summary.inactiveCheckedOperationCount,
      changedCardCount: changedAssignments.length,
      addedSignalCount: addedSignals.length,
      newStrategyIdCount: 0,
      strategySupportPairCount: strategySupportPairs.length,
      targetProfileCandidateCount: targetProfileCandidates.length,
      testOnlyStrategySupportPairCount: strategySupportPairs.filter((item) => item.cardId.startsWith("simple_") || item.cardId.startsWith("v08_")).length,
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
    changedCards: changedAssignments.map((card) => ({
      cardId: card.cardId,
      title: card.title,
      tacticSignals: card.tacticSignals,
      conditions: card.conditions,
      strategyAnchors: card.strategyAnchors,
      targetProfileStatus: card.targetProfileStatus,
      rationale: card.rationale,
    })),
    addedSignals: addedSignals.map((signal) => ({
      signalId: signal.signalId,
      supportOnly: signal.supportOnly,
      mayAnchorStrategy: signal.mayAnchorStrategy,
      allowedStrategyAnchors: signal.allowedStrategyAnchors,
    })),
    changedSignals: [{ signalId: "advance.corp_counter_transfer", change: "reused_for_operation_counter_transfer" }],
    removedSignals: [
      { cardId: "onr_v1_296_off-site-backups", removed: ["economy.corp_draw"] },
      { cardId: "onr_v1_294_new-blood", removed: ["condition.last_turn_run"] },
      { cardId: "onr_v1_303_silver-lining-recovery-protocol", removed: ["advance.overadvance_support"] },
      { cardId: "onr_proteus_051_rent-to-own-contract", removed: ["ice.corp_temporary_rez", "risk.temporary_rez_liability"] },
    ],
    changedStrategySupportPairs: strategySupportPairs,
    changedTargetProfiles,
    testOperationSeparation: {
      productionOriginalsetOperations: baseReport.summary.activeOriginalsetOperationCount,
      productionProteusOperations: baseReport.summary.activeProteusOperationCount,
      activeTestOperations: baseReport.summary.activeTestOperationCount,
      testStrategySupportPairsExcludedFromProductionAggregation: true,
    },
    retainedDeferredItems: [
      {
        topic: "target_profile_v1_for_private_operation_choices",
        decision: "retained_schema_gap_or_candidate_only",
        rationale:
          "Archives recovery, ICE rearrange/conceal, counter reallocation, X lifetime and installment-rez choices remain report-only candidates or schema gaps.",
      },
      {
        topic: "prefix_compatibility",
        decision: "no_renaming",
        rationale:
          "AI025-1 adds precise condition, tag-snowball and damage signals but does not rename legacy `economy.corp_draw` or existing AI025 signals.",
      },
    ],
    hiddenInfoSafetyReview: [
      {
        topic: "operation_visibility",
        result: "pass",
        notes:
          "Operations remain public when played; private choices such as Archives recovery, ICE rearrange or target selection stay side-safe and report-only until resolved by existing rules.",
      },
      {
        topic: "runtime_consumption",
        result: "pass",
        notes:
          "AI025-1 updates only AI hint data, signal catalog, derivation metadata and review artifacts. It adds no planner, action-score, plan-weight, targeting-AI, engine, legal, UI or hidden-info projection path.",
      },
    ],
    verification: [{ command: "node scripts/check-ai025-1-corp-operations-semantics-polish.mjs", result: "pending_after_apply" }],
    postReviewAssignments: patchedAssignments,
  };
}

function buildMarkdown(report) {
  return `# AI025-1 Corp Operations Semantics Polish

## Kurzfazit

AI025-1 schärft AI025 als gezielte Nachkorrektur. Die ${report.countsAfter.activeCompiledCorpOperations} aktiven/compiled Corp-Operations bleiben abgedeckt; davon sind ${report.countsAfter.productionOriginalsetOperations} Originalset-, ${report.countsAfter.productionProteusOperations} Proteus- und ${report.countsAfter.activeTestOperations} aktive Test-/V08-Operations. ${report.countsAfter.changedCardCount} Operation-Hints wurden korrigiert und ${report.countsAfter.addedSignalCount} read-only Funktionssignale ergänzt.

## Korrekturen

- Draw, Economy und Recovery wurden getrennt: Off-Site Backups ist Archives-Recovery ohne Draw; V08 Archive Planning Operation ist Draw ohne Archives-Recovery; Closed Accounts ist Runner-Credit-Loss-Payoff, kein Corp-Credit-Gain.
- Falsified-Transactions Expert nutzt \`advance.corp_counter_transfer\` statt Counter-Erzeugung. Advancement-Burst-Operations verlangen keine vorhandenen Advancement-Counter.
- Conditions wurden präzisiert: mehrere Runs, Node-Trash-last-turn, Run-this-game und Resource-installed-last-turn sind eigene read-only Signale.
- Datapool by Zetatech und Netwatch Credit Voucher sind Tag-Snowball/Additional-Tag-Follow-up statt normale initiale Tag-Quellen.
- Punitive Counterstrike, Scorched Earth und Urban Renewal tragen präzise Meat-Damage-/Tagged-Meat-Damage-Semantik mit Amount-Evidence.
- Rent-to-Own Contract ist Deferred-/Installment-Rez und kein Temporary-Rez; Emergency Rig bleibt Free-/Temporary-Rez mit Kludge-Lifetime-Kandidat.

## Neue Signale

${report.addedSignals.map((signal) => `- \`${signal.signalId}\`: supportOnly=${signal.supportOnly}, anchors=${signal.allowedStrategyAnchors.join(", ") || "none"}`).join("\n")}

## Hidden-Info und Wirkung

Alle Planner-, ActionScore-, PlanWeight-, Targeting-AI-, Engine-, Legalitäts-, Profil-/Default-, UI- und Hidden-Info-Wirkungsflags bleiben \`false\`. Private Corp-Entscheidungen bleiben side-safe und werden nur als Report-Kandidaten oder Schema-Gaps dokumentiert.

## Test-/V08-Trennung

Reports trennen weiterhin ${report.countsAfter.productionOriginalsetOperations} Originalset-, ${report.countsAfter.productionProteusOperations} Proteus-, ${report.countsAfter.activeTestOperations} aktive Test-/V08- und ${report.countsAfter.inactiveClassicOperations} inaktive Classic-Operations. Test-only StrategySupportPairs werden nicht als Produktionsaggregation gezählt.
`;
}

function updateReadme() {
  if (!fs.existsSync(repoPath(README_PATH))) return;
  const text = fs.readFileSync(repoPath(README_PATH), "utf8");
  const entry =
    "- `ai025-1-corp-operations-semantics-polish-2026-06-02.md` / `ai025-1-corp-operations-semantics-polish-report-2026-06-02.json`: AI025-1 schaerft Corp-Operations-Semantik gezielt nach: Draw/Recovery, Counter-Transfer, Conditions, Tag-Snowball, Tagged-Meat-Damage, ICE-Rez-Lifetime und Test-/V08-Trennung bleiben read-only und ohne Planner-, Engine-, Targeting-, UI- oder Hidden-Info-Wirkung.";
  if (text.includes("ai025-1-corp-operations-semantics-polish-2026-06-02.md")) return;
  writeText(README_PATH, `${text.trimEnd()}\n${entry}\n`);
}

function main() {
  const baseReport = readJson(BASE_REPORT_PATH);
  const addedSignals = updateTacticSignals();
  updateDerivationRules();

  const patchedAssignments = baseReport.postReviewAssignments.map((card) => {
    const update = UPDATES[card.cardId];
    return update ? patchAssignment(card, update) : structuredClone(card);
  });
  const changedAssignments = patchedAssignments.filter((card) => UPDATES[card.cardId]);
  const changedHintCount = updateActiveHints(new Map(changedAssignments.map((card) => [card.cardId, card])));
  const report = buildReport(baseReport, patchedAssignments, addedSignals, changedAssignments);
  writeJson(JSON_REPORT_PATH, report);
  writeText(MD_REPORT_PATH, buildMarkdown(report));
  updateReadme();
  console.log(
    `AI025-1 applied changed=${changedHintCount} reportCards=${changedAssignments.length} addedSignals=${addedSignals.length}`,
  );
}

main();
