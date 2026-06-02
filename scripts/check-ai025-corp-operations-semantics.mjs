#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CARD_FILES = [
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
  "data/cards/classic-cards.json",
  "data/cards/testset-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const STRATEGY_PATH = "data/ai/strategy-goals-v1.json";
const REPORT_PATH = "docs/reviews/ai/ai025-corp-operations-semantics-review-report-2026-06-02.json";

const FORBIDDEN_SIGNALS = new Set([
  "corp.operation",
  "operation.transaction",
  "operation.transactions",
  "operation.gray_ops",
  "operation.black_ops",
  "corp.gray_ops",
  "corp.black_ops",
  "corp.transactions",
  "corp.operation_damage",
  "corp.operation_economy",
  "corp.operation_tag",
  "operation.power_grid",
  "operation.scorched_earth",
  "operation.power_grid_overload",
  "operation.management_shakeup",
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

function cardsFrom(relativePath) {
  const data = readJson(relativePath);
  return (data.cards ?? []).map((card) => ({ ...card, setId: card.setId ?? data.setId ?? "testset" }));
}

function byTitle(report, title) {
  return (report.postReviewAssignments ?? []).find((card) => card.title === title);
}

function main() {
  const errors = [];
  const report = readJson(REPORT_PATH);
  const activeHints = readJson(ACTIVE_HINTS_PATH).cards ?? [];
  const compiledHints = readJson(COMPILED_HINTS_PATH).cards ?? [];
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH).signals ?? [];
  const strategies = readJson(STRATEGY_PATH).strategyGoals ?? [];
  const allCards = CARD_FILES.flatMap(cardsFrom);
  const activeIds = new Set(activeHints.map((hint) => hint.cardId));
  const compiledIds = new Set(compiledHints.map((hint) => hint.cardId));
  const signalIds = new Set(tacticSignals.map((signal) => signal.signalId));
  const strategyIds = new Set(strategies.map((strategy) => strategy.strategyId));
  const reportById = new Map((report.postReviewAssignments ?? []).map((card) => [card.cardId, card]));
  const hintById = new Map(activeHints.map((hint) => [hint.cardId, hint]));
  const activeCompiledOperations = allCards.filter(
    (card) => card.side === "corp" && card.type === "operation" && activeIds.has(card.cardId) && compiledIds.has(card.cardId),
  );
  const inactiveOperations = allCards.filter(
    (card) => card.side === "corp" && card.type === "operation" && (!activeIds.has(card.cardId) || !compiledIds.has(card.cardId)),
  );

  if (report.schemaVersion !== "ai025-corp-operations-semantics-review-report-v1") fail(errors, "unexpected schemaVersion");
  if (report.taskId !== "AI025") fail(errors, "unexpected taskId");
  if (report.summary?.activeCorpOperationCount !== 40) fail(errors, `expected 40 active Corp operations, report=${report.summary?.activeCorpOperationCount}`);
  if (report.summary?.activeOriginalsetOperationCount !== 27) fail(errors, "expected 27 Originalset operations");
  if (report.summary?.activeProteusOperationCount !== 8) fail(errors, "expected 8 Proteus operations");
  if (report.summary?.activeTestOperationCount !== 5) fail(errors, "expected 5 active test/V08 operations");
  if (report.summary?.inactiveCheckedOperationCount !== inactiveOperations.length) fail(errors, "inactive operation inventory mismatch");
  if (activeCompiledOperations.length !== report.summary?.activeCorpOperationCount) fail(errors, "active operation inventory mismatch");
  if ((report.postReviewAssignments ?? []).length !== activeCompiledOperations.length) fail(errors, "postReviewAssignments length mismatch");
  if (report.summary?.newStrategyIdCount !== 0 || (report.newStrategyIds ?? []).length !== 0) fail(errors, "AI025 must not introduce Strategy IDs");
  for (const flag of REPORT_FLAGS) if (report.summary?.[flag] !== false) fail(errors, `${flag} is not false`);

  for (const signal of tacticSignals) {
    if (FORBIDDEN_SIGNALS.has(signal.signalId)) fail(errors, `forbidden operation signal catalogued: ${signal.signalId}`);
  }

  for (const card of activeCompiledOperations) {
    const reportCard = reportById.get(card.cardId);
    const hint = hintById.get(card.cardId);
    if (!reportCard) {
      fail(errors, `missing report assignment ${card.cardId}`);
      continue;
    }
    if (!hint) {
      fail(errors, `missing active hint ${card.cardId}`);
      continue;
    }
    if (reportCard.cardType !== "operation") fail(errors, `${card.cardId} report cardType is not operation`);
    if (reportCard.needsHumanReview !== false) fail(errors, `${card.cardId} still needs human review`);
    if ((reportCard.tacticSignals ?? []).length === 0) fail(errors, `${card.cardId} has no tacticSignals`);
    if (hint.quality?.hintReviewed !== true || hint.quality?.needsHumanReview !== false) fail(errors, `${card.cardId} quality review state not closed`);

    for (const subtype of card.subtypes ?? []) {
      const normalized = String(subtype).toLowerCase().replaceAll(" ", "_");
      for (const signal of reportCard.tacticSignals ?? []) {
        if (signal.includes(normalized)) fail(errors, `${card.cardId} mirrors subtype ${subtype} as signal ${signal}`);
      }
    }

    for (const signal of reportCard.tacticSignals ?? []) {
      if (!signalIds.has(signal)) fail(errors, `${card.cardId} uses uncatalogued signal ${signal}`);
      if (FORBIDDEN_SIGNALS.has(signal)) fail(errors, `${card.cardId} uses forbidden operation signal ${signal}`);
      if (/^(operation\.|corp_op\.|corp\.operation|corp\.transactions|corp\.gray_ops|corp\.black_ops)/.test(signal)) {
        fail(errors, `${card.cardId} uses type/subtype-only operation signal ${signal}`);
      }
    }

    for (const strategyId of reportCard.strategyAnchors ?? []) {
      if (!strategyIds.has(strategyId)) fail(errors, `${card.cardId} uses unknown strategy ${strategyId}`);
      if (strategyId.startsWith("runner.")) fail(errors, `${card.cardId} uses runner strategy ${strategyId}`);
      if (["corp.operation", "corp.transactions", "corp.gray_ops", "corp.black_ops"].includes(strategyId)) {
        fail(errors, `${card.cardId} uses generic operation strategy ${strategyId}`);
      }
    }

    const anchorSet = new Set(reportCard.strategyAnchors ?? []);
    const pairs = reportCard.strategySupportPairs ?? [];
    if (anchorSet.size === 0) {
      if ((reportCard.legacyStrategicRole ?? []).length !== 0) fail(errors, `${card.cardId} has role without anchor`);
      if (pairs.length !== 0) fail(errors, `${card.cardId} has strategySupportPairs without anchor`);
    }
    for (const pair of pairs) {
      if (!pair.strategyId || !pair.role || !(pair.evidence ?? []).length || !pair.confidence) {
        fail(errors, `${card.cardId} has incomplete strategySupportPair`);
      }
      if (!anchorSet.has(pair.strategyId)) fail(errors, `${card.cardId} pair ${pair.strategyId} missing from anchors`);
      for (const signal of pair.evidence ?? []) {
        if (!(reportCard.tacticSignals ?? []).includes(signal)) fail(errors, `${card.cardId} pair evidence ${signal} not in tacticSignals`);
      }
    }
  }

  for (const title of ["Accounts Receivable", "Annual Reviews", "Day Shift", "Night Shift", "Planning Consultants", "Off-Site Backups"]) {
    const card = byTitle(report, title);
    if ((card?.strategyAnchors ?? []).length !== 0) fail(errors, `${title} should remain support-only`);
  }
  for (const title of ["Management Shake-Up", "Project Consultants", "Systematic Layoffs", "Team Restructuring", "Falsified-Transactions Expert"]) {
    const card = byTitle(report, title);
    if (!(card?.strategyAnchors ?? []).includes("corp.fast_advance")) fail(errors, `${title} missing Fast Advance anchor`);
  }
  for (const title of ["Scorched Earth", "Urban Renewal"]) {
    const card = byTitle(report, title);
    if (!(card?.strategyAnchors ?? []).includes("corp.damage_kill")) fail(errors, `${title} missing Damage/Kill anchor`);
    if (!(card?.strategyAnchors ?? []).includes("corp.tag_trace_punish")) fail(errors, `${title} missing Tag/Punish anchor`);
  }
  const punitive = byTitle(report, "Punitive Counterstrike");
  if (!(punitive?.strategyAnchors ?? []).includes("corp.damage_kill")) fail(errors, "Punitive Counterstrike missing smaller Damage/Kill payoff anchor");
  for (const title of ["Closed Accounts", "Corporate Detective Agency", "Power Grid Overload", "Datapool by Zetatech"]) {
    const card = byTitle(report, title);
    if (!(card?.strategyAnchors ?? []).includes("corp.tag_trace_punish")) fail(errors, `${title} missing Tag/Punish payoff anchor`);
    if ((card?.strategyAnchors ?? []).includes("corp.damage_kill")) fail(errors, `${title} must not be Damage/Kill`);
  }
  for (const title of ["Audit of Call Records", "Chance Observation", "Manhunt", "Schlaghund Pointers", "Trojan Horse", "Data Sifters", "Underworld Mole"]) {
    const card = byTitle(report, title);
    if (!(card?.tacticSignals ?? []).includes("tag.source")) fail(errors, `${title} missing tag source`);
    if ((card?.tacticSignals ?? []).includes("tag.payoff")) fail(errors, `${title} must not be tag payoff`);
  }
  for (const title of ["New Blood", "Planning Consultants", "Corporate Guard(R) Temps"]) {
    const card = byTitle(report, title);
    if (card?.targetProfileStatus !== "schema_gap") fail(errors, `${title} should remain TargetProfile schema_gap`);
  }
  for (const title of ["Emergency Rig", "Rent-to-Own Contract", "Power Grid Overload", "Corporate Detective Agency"]) {
    const card = byTitle(report, title);
    if (card?.targetProfileStatus !== "candidate") fail(errors, `${title} should be a TargetProfile candidate`);
  }

  if (errors.length > 0) {
    console.error(`AI025 Corp operations semantics check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `AI025 Corp operations semantics check passed active=${activeCompiledOperations.length} inactive=${inactiveOperations.length} strategyPairs=${report.summary.strategySupportPairCount} newSignals=${report.summary.newTacticSignalCount}`,
  );
}

main();
