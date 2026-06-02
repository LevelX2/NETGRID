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
const REPORT_PATH = "docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json";

const FORBIDDEN_SIGNALS = new Set([
  "corp.node",
  "corp.asset",
  "node.asset",
  "node.ai",
  "node.unique",
  "node.advertisement",
  "node.transactions",
  "node.gray_ops",
  "node.black_ops",
  "node.ambush",
  "node.virus",
  "node.random",
  "corp.asset_economy",
  "asset.campaign",
  "node.schlaghund",
  "asset.acme",
  "node.virus_test_site",
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

function byId(report, cardId) {
  return (report.postReviewAssignments ?? []).find((card) => card.cardId === cardId);
}

function expectSignals(errors, report, title, signals) {
  const card = byTitle(report, title);
  if (!card) {
    fail(errors, `missing checked card ${title}`);
    return;
  }
  for (const signal of signals) {
    if (!(card.tacticSignals ?? []).includes(signal)) fail(errors, `${title} missing signal ${signal}`);
  }
}

function expectAnchor(errors, report, title, strategyId) {
  const card = byTitle(report, title);
  if (!card) {
    fail(errors, `missing checked card ${title}`);
    return;
  }
  if (!(card.strategyAnchors ?? []).includes(strategyId)) fail(errors, `${title} missing strategy anchor ${strategyId}`);
}

function expectNoAnchor(errors, report, title) {
  const card = byTitle(report, title);
  if (!card) {
    fail(errors, `missing checked card ${title}`);
    return;
  }
  if ((card.strategyAnchors ?? []).length !== 0) fail(errors, `${title} should remain support-only`);
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
  const activeCompiledAssets = allCards.filter(
    (card) => card.side === "corp" && card.type === "asset" && activeIds.has(card.cardId) && compiledIds.has(card.cardId),
  );
  const inactiveAssets = allCards.filter(
    (card) => card.side === "corp" && card.type === "asset" && (!activeIds.has(card.cardId) || !compiledIds.has(card.cardId)),
  );

  if (report.schemaVersion !== "ai026-corp-nodes-assets-semantics-review-report-v1") fail(errors, "unexpected schemaVersion");
  if (report.taskId !== "AI026") fail(errors, "unexpected taskId");
  if (report.summary?.activeCorpNodeAssetCount !== 54) fail(errors, `expected 54 active Corp nodes/assets, report=${report.summary?.activeCorpNodeAssetCount}`);
  if (report.summary?.activeOriginalsetNodeAssetCount !== 41) fail(errors, "expected 41 Originalset nodes/assets");
  if (report.summary?.activeProteusNodeAssetCount !== 11) fail(errors, "expected 11 Proteus nodes/assets");
  if (report.summary?.activeTestNodeAssetCount !== 2) fail(errors, "expected 2 active test/V08 assets");
  if (report.summary?.inactiveCheckedNodeAssetCount !== inactiveAssets.length) fail(errors, "inactive node/asset inventory mismatch");
  if (activeCompiledAssets.length !== report.summary?.activeCorpNodeAssetCount) fail(errors, "active node/asset inventory mismatch");
  if ((report.postReviewAssignments ?? []).length !== activeCompiledAssets.length) fail(errors, "postReviewAssignments length mismatch");
  if (report.summary?.newStrategyIdCount !== 0 || (report.newStrategyIds ?? []).length !== 0) fail(errors, "AI026 must not introduce Strategy IDs");
  for (const flag of REPORT_FLAGS) if (report.summary?.[flag] !== false) fail(errors, `${flag} is not false`);

  for (const signal of tacticSignals) {
    if (FORBIDDEN_SIGNALS.has(signal.signalId)) fail(errors, `forbidden node/asset signal catalogued: ${signal.signalId}`);
  }

  for (const card of activeCompiledAssets) {
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
    if (reportCard.cardType !== "asset") fail(errors, `${card.cardId} report cardType is not asset`);
    if (reportCard.needsHumanReview !== false) fail(errors, `${card.cardId} still needs human review`);
    if ((reportCard.tacticSignals ?? []).length === 0) fail(errors, `${card.cardId} has no tacticSignals`);
    if (hint.quality?.hintReviewed !== true || hint.quality?.needsHumanReview !== false) fail(errors, `${card.cardId} quality review state not closed`);

    for (const signal of reportCard.tacticSignals ?? []) {
      if (!signalIds.has(signal)) fail(errors, `${card.cardId} uses uncatalogued signal ${signal}`);
      if (FORBIDDEN_SIGNALS.has(signal)) fail(errors, `${card.cardId} uses forbidden node/asset signal ${signal}`);
      if (/^(node\.|asset\.|corp\.node$|corp\.asset$|corp\.asset_economy$)/.test(signal)) {
        fail(errors, `${card.cardId} uses type/subtype-only node/asset signal ${signal}`);
      }
      if (/^node\./.test(signal) || /^asset\./.test(signal)) fail(errors, `${card.cardId} uses forbidden node/asset prefix ${signal}`);
    }

    for (const strategyId of reportCard.strategyAnchors ?? []) {
      if (!strategyIds.has(strategyId)) fail(errors, `${card.cardId} uses unknown strategy ${strategyId}`);
      if (strategyId.startsWith("runner.")) fail(errors, `${card.cardId} uses runner strategy ${strategyId}`);
      if (["corp.node", "corp.asset", "corp.ai", "corp.advertisement", "corp.transactions", "corp.ambush"].includes(strategyId)) {
        fail(errors, `${card.cardId} uses generic node/asset strategy ${strategyId}`);
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

  for (const title of ["ESA Contract", "Euromarket Consortium", "Rustbelt HQ Branch", "Disinfectant, Inc.", "Department of Misinformation"]) {
    expectNoAnchor(errors, report, title);
  }
  for (const title of ["Chicago Branch", "Pacifica Regional AI", "Vapor Ops"]) {
    expectAnchor(errors, report, title, "corp.fast_advance");
  }
  for (const title of ["BBS Whispering Campaign", "Braindance Campaign", "Holovid Campaign", "Information Laundering", "Investment Firm"]) {
    expectAnchor(errors, report, title, "corp.asset_economy");
  }
  for (const title of ["Data Masons", "Encoder, Inc.", "Fortress Architects"]) {
    expectAnchor(errors, report, title, "corp.ice_tax_glacier");
  }
  const skald = byId(report, "onr_v1_341_skalderviken-sa-beta-test-site");
  if (!(skald?.strategyAnchors ?? []).includes("corp.ice_tax_glacier")) fail(errors, "Skalderviken missing ICE Tax/Glacier anchor");
  for (const title of ["Blood Cat", "City Surveillance", "Omniscience Foundation", "LDL Traffic Analyzers"]) {
    expectAnchor(errors, report, title, "corp.tag_trace_punish");
  }
  for (const title of ["I Got a Rock", "Schlaghund", "Solo Squad"]) {
    expectAnchor(errors, report, title, "corp.damage_kill");
    expectAnchor(errors, report, title, "corp.tag_trace_punish");
  }
  for (const title of ["Setup!", "TRAP!", "Vacant Soulkiller", "Virus Test Site", "Experimental AI", "Corprunner's Shattered Remains", "Bel-Digmo Antibody", "Doppelganger Antibody", "Pattel Antibody", "Stereogram Antibody"]) {
    expectAnchor(errors, report, title, "corp.ambush_bluff");
  }

  expectSignals(errors, report, "ACME Savings and Loan", ["economy.corp_credit_burst", "risk.agenda_point_cost", "risk.loss_condition"]);
  expectSignals(errors, report, "Nevinyrral", ["action.corp_repeatable_extra_action", "risk.leaves_play_loss", "risk.loss_condition"]);
  expectSignals(errors, report, "Department of Misinformation", ["expose.corp_prevention"]);
  expectSignals(errors, report, "Siren", ["run.corp_redirect", "remote.scoring_protection"]);
  expectSignals(errors, report, "Syd Meyer Superstores", ["economy.corp_asset_cashout", "risk.temporary_rez_liability"]);
  expectSignals(errors, report, "Disinfectant, Inc.", ["virus.corp_counter_prevention"]);
  expectSignals(errors, report, "Pattel Antibody", ["access.corp_counter_punish"]);
  expectSignals(errors, report, "Bel-Digmo Antibody", ["damage.payoff", "rnd.corp_self_shuffle_access"]);

  for (const title of ["Data Masons", "Encoder, Inc."]) {
    const card = byTitle(report, title);
    for (const signal of card?.tacticSignals ?? []) {
      if (/wall|code_gate|black_ice|ai|advertisement|transactions|ambush|virus|random/.test(signal)) {
        fail(errors, `${title} mirrors a subtype/constraint as signal ${signal}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`AI026 Corp nodes/assets semantics check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `AI026 Corp nodes/assets semantics check passed active=${activeCompiledAssets.length} inactive=${inactiveAssets.length} strategyPairs=${report.summary.strategySupportPairCount} newSignals=${report.summary.newTacticSignalCount}`,
  );
}

main();
