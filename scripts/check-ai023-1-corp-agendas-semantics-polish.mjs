#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AI023_REPORT_PATH = "docs/reviews/ai/ai023-corp-agendas-semantics-review-report-2026-06-02.json";
const POLISH_REPORT_PATH = "docs/reviews/ai/ai023-1-corp-agendas-semantics-polish-report-2026-06-02.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function fail(errors, message) {
  errors.push(message);
}

function cardByTitle(report, title) {
  return (report.postReviewAssignments ?? []).find((card) => card.title === title);
}

function assertNoAnchor(errors, card, strategyId) {
  if ((card.strategyAnchors ?? []).includes(strategyId)) {
    fail(errors, `${card.title} unexpectedly anchors ${strategyId}`);
  }
  for (const pair of card.strategySupportPairs ?? []) {
    if (pair.strategyId === strategyId) {
      fail(errors, `${card.title} unexpectedly has ${strategyId} strategySupportPair`);
    }
  }
}

function assertSignal(errors, card, signalId) {
  if (!(card.tacticSignals ?? []).includes(signalId)) {
    fail(errors, `${card.title} missing ${signalId}`);
  }
}

function main() {
  const errors = [];
  const report = readJson(AI023_REPORT_PATH);
  const polish = readJson(POLISH_REPORT_PATH);
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH);
  const signalIds = new Set((tacticSignals.signals ?? []).map((signal) => signal.signalId));

  if (polish.schemaVersion !== "ai023-1-corp-agendas-semantics-polish-report-v1") {
    fail(errors, "unexpected AI023-1 schemaVersion");
  }
  if (polish.taskId !== "AI023-1") fail(errors, "unexpected AI023-1 taskId");
  if (polish.correctsCommit !== "f6fb69f8") fail(errors, "unexpected correctsCommit");
  if (report.summary?.activeCorpAgendaCount !== 43) fail(errors, "AI023 active agenda count changed");
  if (polish.summary?.newStrategyIdCount !== 0) fail(errors, "AI023-1 introduced a Strategy ID");

  for (const flag of [
    "plannerEffect",
    "actionScoreEffect",
    "planWeightEffect",
    "targetingAiEffect",
    "engineEffect",
    "legalEffect",
    "profileOrDefaultSwitch",
    "uiDerivationEffect",
    "hiddenInfoLeakEffect",
  ]) {
    if (polish.summary?.[flag] !== false) fail(errors, `${flag} is not false`);
  }

  const babylon = cardByTitle(report, "Project Babylon");
  const venice = cardByTitle(report, "Project Venice");
  const zurich = cardByTitle(report, "Project Zurich");
  const worldDomination = cardByTitle(report, "World Domination");
  const bioweapons = cardByTitle(report, "Bioweapons Engineering");
  const headhunters = cardByTitle(report, "Corporate Headhunters");
  const fetalAi = cardByTitle(report, "Fetal AI");
  const markedAccounts = cardByTitle(report, "Marked Accounts");
  const viralBreedingGround = cardByTitle(report, "Viral Breeding Ground");

  for (const card of [babylon, venice, zurich, worldDomination, bioweapons, headhunters, fetalAi, markedAccounts, viralBreedingGround]) {
    if (!card) fail(errors, "missing checked card in AI023 report");
  }
  if (errors.length === 0) {
    for (const card of [babylon, venice, zurich]) {
      assertSignal(errors, card, "score.overadvance_bonus");
      assertSignal(errors, card, "score.overadvance_scaling");
      assertNoAnchor(errors, card, "corp.fast_advance");
    }

    if (!(worldDomination.strategySupportPairs ?? []).some((pair) => pair.strategyId === "corp.remote_scoring" && pair.role === "win_condition")) {
      fail(errors, "World Domination no longer has remote_scoring win_condition support pair");
    }
    assertNoAnchor(errors, worldDomination, "corp.fast_advance");

    assertSignal(errors, bioweapons, "score.meat_damage_amp");
    assertSignal(errors, bioweapons, "score.damage_amp");
    if ((bioweapons.tacticSignals ?? []).includes("damage.payoff")) {
      fail(errors, "Bioweapons Engineering still carries broad damage.payoff");
    }

    assertSignal(errors, headhunters, "score.hand_size_pressure");
    if (!signalIds.has("score.hand_size_pressure")) fail(errors, "score.hand_size_pressure is not catalogued");
    if ((headhunters.tacticSignals ?? []).includes("score.brain_damage_or_hand_size_pressure")) {
      fail(errors, "Corporate Headhunters still carries the Brain Damage mixed signal");
    }
    if ((tacticSignals.signals ?? []).some((signal) => signal.signalId === "score.brain_damage_or_hand_size_pressure")) {
      fail(errors, "obsolete Brain Damage mixed signal still exists in tactic-signal catalog");
    }

    for (const card of [fetalAi, markedAccounts, viralBreedingGround]) {
      if (card.hiddenInfoPolicy !== "corp_side_only_until_revealed") {
        fail(errors, `${card.title} hiddenInfoPolicy is not corp_side_only_until_revealed`);
      }
    }
  }

  const changedCards = new Set((polish.changedCards ?? []).map((card) => card.title));
  for (const title of ["Project Babylon", "Project Venice", "Project Zurich", "Bioweapons Engineering", "Corporate Headhunters", "World Domination"]) {
    if (!changedCards.has(title)) fail(errors, `AI023-1 report missing changed/retained card ${title}`);
  }
  if (!(polish.retainedDeferredItems ?? []).some((item) => item.topic === "overadvance_closeout_or_corp_tempo_line")) {
    fail(errors, "AI023-1 report missing overadvance deferred item");
  }
  if (!(polish.primaryAndSupportingEvidenceReview ?? []).every((item) => Array.isArray(item.primaryAnchorEvidence) && Array.isArray(item.supportingEvidence))) {
    fail(errors, "AI023-1 report does not expose primary/supporting evidence split");
  }

  if (errors.length > 0) {
    console.error(`AI023-1 Corp Agenda semantics polish check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(
    `AI023-1 Corp Agenda semantics polish check passed active=${report.summary.activeCorpAgendaCount} changedCards=${polish.summary.changedCardCount}`,
  );
}

main();
