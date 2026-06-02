#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CARD_FILES = [
  "data/cards/classic-cards.json",
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const STRATEGY_PATH = "data/ai/strategy-goals-v1.json";
const REPORT_PATH = "docs/reviews/ai/ai024-corp-ice-semantics-review-report-2026-06-02.json";

const FORBIDDEN_SUBTYPE_SIGNALS = new Set([
  "corp_ice.sentry",
  "corp_ice.code_gate",
  "corp_ice.wall",
  "corp_ice.ap",
  "corp_ice.black_ice",
  "corp_ice.killer",
  "corp_ice.watchdog",
  "corp_ice.pit_bull",
  "corp_ice.bloodhound",
  "corp_ice.hellhound",
  "corp_ice.hellbolt",
  "corp_ice.brainwipe",
  "corp_ice.zombie",
  "corp_ice.firestarter",
  "corp_ice.sword",
  "corp_ice.knockout",
  "corp_ice.stun",
  "corp_ice.random",
  "corp_ice.flatline",
  "corp_ice.dec_krash",
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
  return (data.cards ?? []).map((card) => ({ ...card, setId: card.setId ?? data.setId }));
}

function byTitle(report, title) {
  return (report.postReviewAssignments ?? []).find((card) => card.title === title);
}

function hintSignalsNeed(hint) {
  const roles = new Set((hint.roles ?? []).map((role) => String(role).toLowerCase()));
  const mechanics = new Set((hint.requiredMechanics ?? []).map((mechanic) => String(mechanic).toLowerCase()));
  const effects = hint.effects ?? [];
  const hasEffectKind = (kind) => effects.some((effect) => String(effect.kind).toLowerCase() === kind);
  return {
    etr:
      roles.has("etr_ice") ||
      roles.has("end_run") ||
      mechanics.has("end_the_run") ||
      hasEffectKind("etr") ||
      hasEffectKind("remote_protection"),
    damage:
      roles.has("damage") ||
      roles.has("damage_ice") ||
      roles.has("core_damage_ice") ||
      mechanics.has("damage") ||
      mechanics.has("net_damage") ||
      mechanics.has("meat_damage") ||
      mechanics.has("core_damage") ||
      hasEffectKind("damage"),
    trace: roles.has("trace") || mechanics.has("trace") || hasEffectKind("trace"),
    tag: roles.has("tag") || roles.has("tag_ice") || mechanics.has("add_tag") || hasEffectKind("tag") || hasEffectKind("tag_source"),
    programTrash:
      roles.has("program_trash_ice") ||
      mechanics.has("trash_installed_program") ||
      mechanics.has("uninstall_runner_program") ||
      hasEffectKind("program_trash"),
    hardwareTrash: roles.has("hardware_trash") || mechanics.has("trash_hardware") || hasEffectKind("hardware_trash"),
  };
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
  const activeCompiledIce = allCards.filter(
    (card) =>
      card.side === "corp" &&
      card.type === "ice" &&
      ["originalset-v1", "proteus"].includes(card.setId) &&
      activeIds.has(card.cardId) &&
      compiledIds.has(card.cardId),
  );
  const inactiveIce = allCards.filter(
    (card) => card.side === "corp" && card.type === "ice" && (!activeIds.has(card.cardId) || !compiledIds.has(card.cardId)),
  );

  if (report.schemaVersion !== "ai024-corp-ice-semantics-review-report-v1") fail(errors, "unexpected schemaVersion");
  if (report.taskId !== "AI024") fail(errors, "unexpected taskId");
  if (report.summary?.activeCorpIceCount !== 95) fail(errors, `expected 95 active Corp ICE, report=${report.summary?.activeCorpIceCount}`);
  if (report.summary?.inactiveCheckedIceCount !== 11) fail(errors, `expected 11 inactive checked Corp ICE, report=${report.summary?.inactiveCheckedIceCount}`);
  if (activeCompiledIce.length !== report.summary?.activeCorpIceCount) fail(errors, "active Corp ICE inventory mismatch");
  if (inactiveIce.length !== report.summary?.inactiveCheckedIceCount) fail(errors, "inactive Corp ICE inventory mismatch");
  if ((report.postReviewAssignments ?? []).length !== activeCompiledIce.length) fail(errors, "postReviewAssignments length mismatch");
  if (report.summary?.newStrategyIdCount !== 0 || (report.newStrategyIds ?? []).length !== 0) fail(errors, "AI024 must not introduce Strategy IDs");
  for (const flag of REPORT_FLAGS) if (report.summary?.[flag] !== false) fail(errors, `${flag} is not false`);

  for (const signal of tacticSignals) {
    if (FORBIDDEN_SUBTYPE_SIGNALS.has(signal.signalId)) fail(errors, `forbidden subtype signal catalogued: ${signal.signalId}`);
  }

  for (const card of activeCompiledIce) {
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
    if (reportCard.cardType !== "ice") fail(errors, `${card.cardId} report cardType is not ice`);
    if (reportCard.needsHumanReview !== false) fail(errors, `${card.cardId} still needs human review`);
    if (reportCard.hiddenInfoPolicy !== "corp_side_only_until_rezzed") fail(errors, `${card.cardId} hiddenInfoPolicy is not corp_side_only_until_rezzed`);
    if (reportCard.postReviewStatus !== "changed") fail(errors, `${card.cardId} postReviewStatus is not changed`);
    if ((reportCard.tacticSignals ?? []).length === 0) fail(errors, `${card.cardId} has no tacticSignals`);

    for (const signal of reportCard.tacticSignals ?? []) {
      if (!signalIds.has(signal)) fail(errors, `${card.cardId} uses uncatalogued signal ${signal}`);
      if (FORBIDDEN_SUBTYPE_SIGNALS.has(signal)) fail(errors, `${card.cardId} uses forbidden subtype signal ${signal}`);
      if (/^corp_ice\.(sentry|code_gate|wall|ap|black_ice|killer|watchdog|pit_bull|bloodhound|hellhound|hellbolt|brainwipe|zombie|firestarter|sword|knockout|stun|random|flatline|dec_krash)$/.test(signal)) {
        fail(errors, `${card.cardId} uses forbidden subtype-only signal ${signal}`);
      }
    }

    for (const strategyId of reportCard.strategyAnchors ?? []) {
      if (!strategyIds.has(strategyId)) fail(errors, `${card.cardId} uses unknown strategy ${strategyId}`);
      if (strategyId.startsWith("runner.")) fail(errors, `${card.cardId} uses runner strategy ${strategyId}`);
      if (strategyId === "corp.ice" || strategyId === "corp.sentry" || strategyId === "corp.code_gate" || strategyId === "corp.wall") {
        fail(errors, `${card.cardId} uses generic ICE strategy ${strategyId}`);
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

    const needs = hintSignalsNeed(hint);
    if (needs.etr && !(reportCard.tacticSignals ?? []).includes("corp_ice.end_run")) fail(errors, `${card.cardId} missing corp_ice.end_run`);
    if (needs.damage && !(reportCard.tacticSignals ?? []).includes("corp_ice.damage_source")) fail(errors, `${card.cardId} missing corp_ice.damage_source`);
    if (needs.trace && !(reportCard.tacticSignals ?? []).includes("corp_ice.trace_source")) fail(errors, `${card.cardId} missing corp_ice.trace_source`);
    if (needs.tag && !(reportCard.tacticSignals ?? []).includes("corp_ice.tag_source")) fail(errors, `${card.cardId} missing corp_ice.tag_source`);
    if (needs.programTrash && !(reportCard.tacticSignals ?? []).includes("corp_ice.program_trash")) fail(errors, `${card.cardId} missing corp_ice.program_trash`);
    if (needs.hardwareTrash && !(reportCard.tacticSignals ?? []).includes("corp_ice.hardware_trash")) fail(errors, `${card.cardId} missing corp_ice.hardware_trash`);
  }

  const dataRaven = byTitle(report, "Data Raven");
  if (!dataRaven?.strategySupportPairs?.some((pair) => pair.strategyId === "corp.tag_trace_punish" && pair.role === "persistent_tag_source")) {
    fail(errors, "Data Raven missing persistent tag-source strategy pair");
  }
  for (const title of ["Data Wall", "Wall of Static", "Cortical Scanner", "Quandary"]) {
    const card = byTitle(report, title);
    if ((card?.strategyAnchors ?? []).length !== 0) fail(errors, `${title} should remain simple ETR support without strategy anchor`);
  }
  for (const title of ["Caryatid", "Credit Blocks", "Galatea", "Lesser Arcana", "Sphinx 2006", "Sumo 2008"]) {
    const card = byTitle(report, title);
    if (card?.targetProfileStatus !== "schema_gap") fail(errors, `${title} should be a TargetProfile schema_gap`);
  }
  for (const title of ["Mobile Barricade", "Walking Wall"]) {
    const card = byTitle(report, title);
    if (card?.targetProfileStatus !== "schema_gap") fail(errors, `${title} should be a position schema_gap`);
  }
  for (const title of ["Too Many Doors", "Vacuum Link", "Roadblock"]) {
    const card = byTitle(report, title);
    if (!(card?.tacticSignals ?? []).includes("corp_ice.random_or_guessing")) fail(errors, `${title} missing random/guessing signal`);
  }

  if (errors.length > 0) {
    console.error(`AI024 Corp ICE semantics check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `AI024 Corp ICE semantics check passed active=${activeCompiledIce.length} inactive=${inactiveIce.length} strategyPairs=${report.summary.strategySupportPairCount} newSignals=${report.summary.newTacticSignalCount}`,
  );
}

main();
