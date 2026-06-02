#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const REPORT_PATH = "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json";

const ADDED_SIGNALS = [
  "condition.multiple_runs_last_turn",
  "condition.node_trashed_last_turn",
  "condition.resource_installed_last_turn",
  "condition.run_this_game",
  "damage.meat_source",
  "damage.tagged_meat_payoff",
  "ice.corp_installment_rez",
  "tag.additional_tag_followup",
];

const FORBIDDEN_SIGNALS = new Set([
  "corp.operation",
  "operation.transaction",
  "operation.transactions",
  "operation.gray_ops",
  "operation.black_ops",
  "operation.scorched_earth",
  "operation.power_grid_overload",
  "corp_op.economy",
  "corp_op.damage",
]);

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

function fail(errors, message) {
  errors.push(message);
}

function hasAll(hint, signals) {
  return signals.every((signal) => (hint?.tacticSignals ?? []).includes(signal));
}

function hasNone(hint, signals) {
  return signals.every((signal) => !(hint?.tacticSignals ?? []).includes(signal));
}

function conditions(hint) {
  return (hint?.conditions ?? []).map((condition) => condition.kind ?? condition);
}

function amount(hint, kind) {
  return (hint?.effects ?? []).find((effect) => effect.kind === kind)?.amount;
}

function main() {
  const errors = [];
  const report = readJson(REPORT_PATH);
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const compiledHints = readJson(COMPILED_HINTS_PATH).cards ?? [];
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH).signals ?? [];
  const activeById = new Map(activeHints.map((hint) => [hint.cardId, hint]));
  const compiledIds = new Set(compiledHints.map((hint) => hint.cardId));
  const catalogIds = new Set(tacticSignals.map((signal) => signal.signalId));
  const reportById = new Map((report.postReviewAssignments ?? []).map((card) => [card.cardId, card]));

  if (report.schemaVersion !== "ai025-1-corp-operations-semantics-polish-report-v1") fail(errors, "unexpected schemaVersion");
  if (report.taskId !== "AI025-1") fail(errors, "unexpected taskId");
  if (report.countsAfter?.activeCompiledCorpOperations !== 40) fail(errors, "expected 40 active compiled Corp Operations");
  if (report.countsAfter?.productionOriginalsetOperations !== 27) fail(errors, "expected 27 Originalset Operations");
  if (report.countsAfter?.productionProteusOperations !== 8) fail(errors, "expected 8 Proteus Operations");
  if (report.countsAfter?.activeTestOperations !== 5) fail(errors, "expected 5 active Test/V08 Operations");
  if (report.countsAfter?.inactiveClassicOperations !== 4) fail(errors, "expected 4 inactive known/test Classic Operations");
  if (report.countsAfter?.newStrategyIdCount !== 0) fail(errors, "AI025-1 must not introduce Strategy IDs");
  if ((report.postReviewAssignments ?? []).length !== 40) fail(errors, "postReviewAssignments must include all 40 Operations");
  for (const flag of REPORT_FLAGS) if (report.countsAfter?.[flag] !== false) fail(errors, `${flag} is not false`);

  for (const signalId of ADDED_SIGNALS) {
    const signal = tacticSignals.find((item) => item.signalId === signalId);
    if (!signal) fail(errors, `missing added signal ${signalId}`);
    if (signal?.sideScope !== "corp") fail(errors, `${signalId} sideScope is not corp`);
  }
  for (const signal of tacticSignals) {
    if (FORBIDDEN_SIGNALS.has(signal.signalId)) fail(errors, `forbidden operation signal catalogued: ${signal.signalId}`);
  }

  for (const card of report.postReviewAssignments ?? []) {
    const hint = activeById.get(card.cardId);
    if (!hint) fail(errors, `missing active hint ${card.cardId}`);
    if (!compiledIds.has(card.cardId)) fail(errors, `missing compiled hint ${card.cardId}`);
    for (const signal of card.tacticSignals ?? []) {
      if (!catalogIds.has(signal)) fail(errors, `${card.title} uses uncatalogued signal ${signal}`);
      if (FORBIDDEN_SIGNALS.has(signal)) fail(errors, `${card.title} uses forbidden signal ${signal}`);
    }
  }

  const hint = (cardId) => activeById.get(cardId);
  const reportCard = (cardId) => reportById.get(cardId);

  if (!hasAll(hint("onr_v1_296_off-site-backups"), ["archives.corp_recovery"])) fail(errors, "Off-Site Backups missing Archives recovery");
  if (!hasNone(hint("onr_v1_296_off-site-backups"), ["economy.corp_draw"])) fail(errors, "Off-Site Backups still has draw");
  if (!hasAll(hint("v08_archive_planning_operation"), ["economy.corp_draw"])) fail(errors, "V08 Archive Planning Operation missing draw");
  if (!hasNone(hint("v08_archive_planning_operation"), ["archives.corp_recovery"])) fail(errors, "V08 Archive Planning Operation still has Archives recovery");

  if (!hasNone(hint("onr_v1_285_closed-accounts"), ["economy.corp_conditional_credit", "economy.corp_credit_burst"])) {
    fail(errors, "Closed Accounts still has Corp credit economy");
  }
  if (!hasAll(hint("onr_v1_285_closed-accounts"), ["tag.payoff", "risk.requires_tagged_runner"])) fail(errors, "Closed Accounts missing tagged payoff");

  if (!hasAll(hint("onr_v1_291_falsified-transactions-expert"), ["advance.corp_counter_transfer", "advance.score_window_support"])) {
    fail(errors, "Falsified-Transactions Expert missing counter-transfer");
  }
  if (!hasNone(hint("onr_v1_291_falsified-transactions-expert"), ["advance.agenda_counter"])) {
    fail(errors, "Falsified-Transactions Expert still models counter creation");
  }
  for (const cardId of ["onr_v1_292_management-shake-up", "onr_v1_300_project-consultants", "onr_v1_304_systematic-layoffs"]) {
    if (conditions(hint(cardId)).includes("requires_advancement_counter")) fail(errors, `${cardId} still requires pre-existing counters`);
  }

  if (!hasNone(hint("onr_v1_303_silver-lining-recovery-protocol"), ["advance.overadvance_support"])) {
    fail(errors, "Silver Lining Recovery Protocol still has overadvance support");
  }
  if (!hasNone(hint("onr_v1_294_new-blood"), ["condition.last_turn_run"])) fail(errors, "New Blood still has last-turn-run condition");
  if (!hasAll(hint("onr_v1_283_audit-of-call-records"), ["condition.multiple_runs_last_turn", "trace.source", "tag.source"])) {
    fail(errors, "Audit of Call Records missing multiple-runs trace/tag semantics");
  }
  if (!hasNone(hint("onr_v1_283_audit-of-call-records"), ["condition.last_turn_run"])) fail(errors, "Audit of Call Records still has generic run condition");
  if (!hasAll(hint("onr_proteus_048_data-sifters"), ["condition.node_trashed_last_turn", "tag.source"])) {
    fail(errors, "Data Sifters missing node-trash condition/tag source");
  }
  if (!hasNone(hint("onr_proteus_048_data-sifters"), ["condition.last_turn_run"])) fail(errors, "Data Sifters still has generic run condition");
  if (!hasAll(hint("onr_proteus_053_underworld-mole"), ["condition.resource_installed_last_turn", "trace.source", "tag.source", "resource.trash_payoff"])) {
    fail(errors, "Underworld Mole missing resource-installed trace/tag/resource-trash semantics");
  }
  if (reportCard("onr_proteus_053_underworld-mole")?.targetProfileStatus !== "candidate") fail(errors, "Underworld Mole target profile must be candidate");
  if (!hasAll(hint("onr_proteus_052_schlaghund-pointers"), ["condition.run_this_game", "trace.source", "tag.source"])) {
    fail(errors, "Schlaghund Pointers missing run-this-game trace/tag semantics");
  }

  for (const cardId of ["onr_v1_287_datapool-by-zetatech", "onr_v1_293_netwatch-credit-voucher"]) {
    if (!hasAll(hint(cardId), ["tag.additional_tag_followup", "tag.payoff", "risk.requires_tagged_runner"])) {
      fail(errors, `${cardId} missing additional-tag follow-up payoff`);
    }
    if (!hasNone(hint(cardId), ["tag.source"])) fail(errors, `${cardId} still modeled as initial tag source`);
  }

  const damageCards = [
    ["onr_v1_301_punitive-counterstrike", 2],
    ["onr_v1_302_scorched-earth", 4],
    ["onr_v1_307_urban-renewal", 5],
  ];
  for (const [cardId, expectedAmount] of damageCards) {
    if (!hasAll(hint(cardId), ["damage.meat_source", "damage.tagged_meat_payoff", "risk.requires_tagged_runner", "tag.payoff"])) {
      fail(errors, `${cardId} missing tagged meat damage signals`);
    }
    if (amount(hint(cardId), "damage") !== expectedAmount) fail(errors, `${cardId} meat damage amount mismatch`);
    if (!(hint(cardId)?.lineSupport ?? []).includes("corp.damage_kill")) fail(errors, `${cardId} missing Damage/Kill anchor`);
    if (!(hint(cardId)?.lineSupport ?? []).includes("corp.tag_trace_punish")) fail(errors, `${cardId} missing Tag/Punish anchor`);
  }

  if (!hasAll(hint("onr_proteus_049_emergency-rig"), ["ice.corp_free_rez", "ice.corp_temporary_rez", "risk.temporary_rez_liability"])) {
    fail(errors, "Emergency Rig missing free/temporary rez plus risk");
  }
  if (!(reportCard("onr_proteus_049_emergency-rig")?.conditions ?? []).includes("requires_x_lifetime_choice")) {
    fail(errors, "Emergency Rig report missing X lifetime condition");
  }
  if (!hasAll(hint("onr_proteus_051_rent-to-own-contract"), ["ice.corp_deferred_rez", "ice.corp_installment_rez"])) {
    fail(errors, "Rent-to-Own Contract missing deferred/installment rez");
  }
  if (!hasNone(hint("onr_proteus_051_rent-to-own-contract"), ["ice.corp_temporary_rez", "risk.temporary_rez_liability"])) {
    fail(errors, "Rent-to-Own Contract still has temporary-rez/Kludge liability semantics");
  }

  if (report.testOperationSeparation?.testStrategySupportPairsExcludedFromProductionAggregation !== true) {
    fail(errors, "test/V08 StrategySupportPair separation not documented");
  }

  if (errors.length > 0) {
    console.error(`AI025-1 Corp operations polish check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `AI025-1 Corp operations polish check passed active=${report.countsAfter.activeCompiledCorpOperations} changed=${report.countsAfter.changedCardCount} addedSignals=${ADDED_SIGNALS.length}`,
  );
}

main();
