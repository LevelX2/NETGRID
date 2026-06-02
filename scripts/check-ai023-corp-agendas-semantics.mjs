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
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const STRATEGY_PATH = "data/ai/strategy-goals-v1.json";
const REPORT_PATH =
  "docs/reviews/ai/ai023-corp-agendas-semantics-review-report-2026-06-02.json";

const EXPECTED_ANCHOR_CARDS = new Map([
  ["onr_v1_189_artificial-security-directors", [{ strategyId: "corp.fast_advance", role: "enabler" }]],
  ["onr_v1_190_bioweapons-engineering", [{ strategyId: "corp.damage_kill", role: "damage_amp_anchor" }]],
  ["onr_v1_191_black-ice-quality-assurance", [{ strategyId: "corp.ice_tax_glacier", role: "ice_type_anchor" }]],
  ["onr_v1_197_data-fort-reclamation", [{ strategyId: "corp.remote_scoring", role: "remote_setup_engine" }]],
  ["onr_v1_200_encryption-breakthrough", [{ strategyId: "corp.ice_tax_glacier", role: "ice_type_anchor" }]],
  ["onr_v1_201_executive-extraction", [{ strategyId: "corp.fast_advance", role: "enabler" }]],
  ["onr_v1_202_genetics-visionary-acquisition", [{ strategyId: "corp.fast_advance", role: "enabler" }]],
  ["onr_v1_204_ice-transmutation", [{ strategyId: "corp.ice_tax_glacier", role: "ice_upgrade_payoff" }]],
  ["onr_v1_207_netwatch-operations-office", [{ strategyId: "corp.tag_trace_punish", role: "tag_source" }]],
  ["onr_v1_208_on-call-solo-team", [{ strategyId: "corp.damage_kill", role: "damage_payoff" }, { strategyId: "corp.tag_trace_punish", role: "punish_payoff" }]],
  ["onr_v1_212_priority-requisition", [{ strategyId: "corp.ice_tax_glacier", role: "tempo_payoff" }, { strategyId: "corp.remote_scoring", role: "score_window_payoff" }]],
  ["onr_v1_213_private-cybernet-police", [{ strategyId: "corp.tag_trace_punish", role: "tag_source" }]],
  ["onr_v1_215_security-net-optimization", [{ strategyId: "corp.ice_tax_glacier", role: "fort_tax_anchor" }, { strategyId: "corp.remote_scoring", role: "remote_defense_anchor" }]],
  ["onr_v1_216_security-purge", [{ strategyId: "corp.ice_tax_glacier", role: "setup_payoff" }, { strategyId: "corp.remote_scoring", role: "setup_payoff" }]],
  ["onr_v1_217_strike-force-kali", [{ strategyId: "corp.damage_kill", role: "damage_payoff" }, { strategyId: "corp.tag_trace_punish", role: "punish_payoff" }]],
  ["onr_v1_219_superior-net-barriers", [{ strategyId: "corp.ice_tax_glacier", role: "ice_type_anchor" }]],
  ["onr_v1_220_tycho-extension", []],
  ["onr_v1_222_world-domination", [{ strategyId: "corp.remote_scoring", role: "win_condition" }]],
  ["onr_proteus_003_corporate-headhunters", [{ strategyId: "corp.damage_kill", role: "damage_engine" }, { strategyId: "corp.tag_trace_punish", role: "punish_payoff" }]],
  ["onr_proteus_004_fetal-ai", [{ strategyId: "corp.damage_kill", role: "access_punish" }, { strategyId: "corp.ambush_bluff", role: "access_punish" }]],
  ["onr_proteus_005_marked-accounts", [{ strategyId: "corp.tag_trace_punish", role: "access_tag_source" }, { strategyId: "corp.ambush_bluff", role: "access_punish" }]],
  ["onr_proteus_009_viral-breeding-ground", [{ strategyId: "corp.ambush_bluff", role: "access_punish" }]],
  ["onr_proteus_010_world-domination", [{ strategyId: "corp.remote_scoring", role: "win_condition" }]],
]);

const SUPPORT_ONLY_CARDS = [
  "onr_v1_188_ai-chief-financial-officer",
  "onr_v1_192_corporate-boon",
  "onr_v1_193_corporate-coup",
  "onr_v1_194_corporate-downsizing",
  "onr_v1_195_corporate-retreat",
  "onr_v1_196_corporate-war",
  "onr_v1_198_detroit-police-contract",
  "onr_v1_199_employee-empowerment",
  "onr_v1_203_hostile-takeover",
  "onr_v1_205_main-office-relocation",
  "onr_v1_206_marine-arcology",
  "onr_v1_209_political-coup",
  "onr_v1_210_political-overthrow",
  "onr_v1_211_polymer-breakthrough",
  "onr_v1_218_subsidiary-branch",
  "onr_v1_220_tycho-extension",
  "onr_v1_214_project-babylon",
  "onr_proteus_001_ai-board-member",
  "onr_proteus_002_charity-takeover",
  "onr_proteus_006_please-dont-choke-anyone",
  "onr_proteus_007_project-venice",
  "onr_proteus_008_project-zurich",
];

const REQUIRED_SIGNALS_BY_CARD = new Map([
  ["onr_v1_220_tycho-extension", ["score.high_agenda_value", "score.vanilla_points"]],
  ["onr_proteus_004_fetal-ai", ["access.agenda_ambush", "access.agenda_net_damage", "access.agenda_steal_tax", "score.net_damage_access_punish"]],
  ["onr_proteus_005_marked-accounts", ["access.agenda_ambush", "access.agenda_tag"]],
  ["onr_proteus_009_viral-breeding-ground", ["access.agenda_ambush", "access.runner_program_disruption", "score.fort_trash_on_score"]],
  ["onr_v1_207_netwatch-operations-office", ["score.trace_tag_source", "score.tag_source", "trace.source", "tag.source"]],
  ["onr_v1_213_private-cybernet-police", ["score.trace_tag_source", "score.tag_source", "trace.source", "tag.source"]],
  ["onr_v1_208_on-call-solo-team", ["score.tagged_meat_damage_payoff", "score.meat_damage_source", "risk.requires_tagged_runner"]],
  ["onr_v1_217_strike-force-kali", ["score.tagged_meat_damage_payoff", "score.meat_damage_source", "risk.requires_tagged_runner"]],
  ["onr_proteus_003_corporate-headhunters", ["score.tagged_meat_damage_payoff", "score.hand_size_pressure", "risk.requires_tagged_runner"]],
  ["onr_v1_212_priority-requisition", ["score.free_rez_ice"]],
  ["onr_v1_216_security-purge", ["score.free_install_and_rez_ice", "score.rnd_install_and_rez"]],
  ["onr_v1_197_data-fort-reclamation", ["score.remote_fort_creation", "score.remote_install_budget"]],
  ["onr_v1_191_black-ice-quality-assurance", ["score.black_ice_strength_bonus", "score.ice_type_tax_support"]],
  ["onr_v1_200_encryption-breakthrough", ["score.code_gate_strength_bonus", "score.ice_type_tax_support"]],
  ["onr_v1_219_superior-net-barriers", ["score.wall_strength_bonus", "score.ice_type_tax_support"]],
  ["onr_v1_215_security-net-optimization", ["score.fort_ice_strength_bonus"]],
  ["onr_v1_204_ice-transmutation", ["score.chosen_ice_strength_bonus", "score.repeat_ice_subroutines"]],
  ["onr_proteus_010_world-domination", ["score.bonus_agenda_points", "score.closeout_agenda", "risk.high_difficulty_agenda"]],
]);

const FORBIDDEN_SIGNALS = new Set([
  "corp.agenda",
  "corp.black_ops",
  "corp.gray_ops",
  "corp.research",
  "agenda.fetal_ai",
  "agenda.marked_accounts",
  "agenda.viral_breeding_ground",
  "agenda.world_domination",
  "score.brain_damage_or_hand_size_pressure",
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

function corpAgendaInventory() {
  return CARD_FILES.flatMap((relativePath) => {
    const data = readJson(relativePath);
    const setId = data.setId ?? path.basename(relativePath, ".json");
    return (data.cards ?? [])
      .filter((card) => card.side === "corp" && card.type === "agenda")
      .map((card) => ({
        cardId: card.cardId,
        title: card.title,
        setId,
        subtypes: card.subtypes ?? [],
      }));
  });
}

function fail(errors, message) {
  errors.push(message);
}

function assertSignals(errors, card, requiredSignals) {
  const signals = new Set(card.tacticSignals ?? []);
  for (const signal of requiredSignals) {
    if (!signals.has(signal)) fail(errors, `${card.cardId} missing tactic signal ${signal}`);
  }
}

function main() {
  const errors = [];
  const inventory = corpAgendaInventory();
  const active = readJson(ACTIVE_HINTS_PATH);
  const compiled = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH);
  const strategies = readJson(STRATEGY_PATH);
  const report = readJson(REPORT_PATH);

  const activeIds = new Set((active.cards ?? []).map((card) => card.cardId));
  const compiledIds = new Set((compiled.cards ?? []).map((card) => card.cardId));
  const activeCompiledAgendas = inventory.filter(
    (card) => activeIds.has(card.cardId) && compiledIds.has(card.cardId),
  );
  const inactiveAgendas = inventory.filter(
    (card) => !activeIds.has(card.cardId) || !compiledIds.has(card.cardId),
  );
  const signalIds = new Set((tacticSignals.signals ?? []).map((signal) => signal.signalId));
  const strategyIds = new Set((strategies.strategyGoals ?? []).map((strategy) => strategy.strategyId));
  const inspectorByCard = new Map((inspector.cards ?? []).map((card) => [card.cardId, card]));
  const reportByCard = new Map(
    (report.postReviewAssignments ?? []).map((card) => [card.cardId, card]),
  );

  if (report.schemaVersion !== "ai023-corp-agendas-semantics-review-report-v1") {
    fail(errors, "unexpected report schemaVersion");
  }
  if (report.taskId !== "AI023") fail(errors, "unexpected taskId");
  if (report.summary?.activeCorpAgendaCount !== 43) {
    fail(errors, `expected 43 active Corp Agendas, report=${report.summary?.activeCorpAgendaCount}`);
  }
  if (activeCompiledAgendas.length !== report.summary?.activeCorpAgendaCount) {
    fail(errors, `activeCorpAgendaCount mismatch inventory=${activeCompiledAgendas.length} report=${report.summary?.activeCorpAgendaCount}`);
  }
  if ((report.postReviewAssignments ?? []).length !== activeCompiledAgendas.length) {
    fail(errors, "postReviewAssignments length does not match active Corp Agenda count");
  }
  if (inactiveAgendas.length !== report.summary?.inactiveCheckedAgendaCount) {
    fail(errors, `inactiveCheckedAgendaCount mismatch inventory=${inactiveAgendas.length} report=${report.summary?.inactiveCheckedAgendaCount}`);
  }
  if (report.summary?.inactiveCheckedAgendaCount !== 4) {
    fail(errors, `expected 4 inactive checked Corp Agendas, report=${report.summary?.inactiveCheckedAgendaCount}`);
  }
  if (report.summary?.newStrategyIdCount !== 0 || (report.newStrategyIds ?? []).length !== 0) {
    fail(errors, "AI023 must not introduce a new Strategy ID");
  }

  for (const flag of REPORT_FLAGS) {
    if (report.summary?.[flag] !== false) fail(errors, `${flag} is not false`);
  }

  const activeBySet = new Map();
  for (const card of activeCompiledAgendas) {
    activeBySet.set(card.setId, (activeBySet.get(card.setId) ?? 0) + 1);
  }
  if (activeBySet.get("originalset-v1") !== 33) {
    fail(errors, `originalset-v1 active count expected=33 got=${activeBySet.get("originalset-v1") ?? 0}`);
  }
  if (activeBySet.get("proteus") !== 10) {
    fail(errors, `proteus active count expected=10 got=${activeBySet.get("proteus") ?? 0}`);
  }

  for (const signal of report.newTacticSignals ?? []) {
    if (!signalIds.has(signal.signalId)) fail(errors, `new signal not catalogued ${signal.signalId}`);
  }

  for (const card of activeCompiledAgendas) {
    const reportCard = reportByCard.get(card.cardId);
    const inspectorCard = inspectorByCard.get(card.cardId);
    if (!reportCard) {
      fail(errors, `missing post-review assignment ${card.cardId}`);
      continue;
    }
    if (!inspectorCard) fail(errors, `missing inspector card ${card.cardId}`);
    if (reportCard.cardType !== "agenda") fail(errors, `${card.cardId} report cardType is not agenda`);
    if (reportCard.needsHumanReview !== false) fail(errors, `${card.cardId} still needs human review`);
    if (reportCard.postReviewStatus !== "changed") fail(errors, `${card.cardId} postReviewStatus is not changed`);
    if (!reportCard.hiddenInfoPolicy) fail(errors, `${card.cardId} missing hiddenInfoPolicy`);

    for (const signal of reportCard.tacticSignals ?? []) {
      if (!signalIds.has(signal)) fail(errors, `uncataloged tactic signal ${signal} on ${card.cardId}`);
      if (FORBIDDEN_SIGNALS.has(signal)) fail(errors, `forbidden generic/card-specific Agenda signal ${signal} on ${card.cardId}`);
    }
    for (const signal of inspectorCard?.derivedFunctionSignals ?? []) {
      if (FORBIDDEN_SIGNALS.has(signal)) fail(errors, `forbidden inspector Agenda signal ${signal} on ${card.cardId}`);
    }

    for (const strategyId of reportCard.strategyAnchors ?? []) {
      if (!strategyIds.has(strategyId)) fail(errors, `${card.cardId} uses unknown strategy anchor ${strategyId}`);
      if (strategyId.startsWith("runner.")) fail(errors, `${card.cardId} uses runner strategy anchor ${strategyId}`);
    }

    const anchorSet = new Set(reportCard.strategyAnchors ?? []);
    const pairs = reportCard.strategySupportPairs ?? [];
    const primaryAnchorEvidence = reportCard.primaryAnchorEvidence ?? [];
    const supportingEvidence = reportCard.supportingEvidence ?? [];
    const pairEvidence = [...new Set(pairs.flatMap((pair) => pair.evidence ?? []))].sort();
    if (JSON.stringify(primaryAnchorEvidence) !== JSON.stringify(pairEvidence)) {
      fail(errors, `${card.cardId} primaryAnchorEvidence does not match strategySupportPair evidence`);
    }
    for (const signal of [...primaryAnchorEvidence, ...supportingEvidence]) {
      if (!(reportCard.tacticSignals ?? []).includes(signal)) {
        fail(errors, `${card.cardId} evidence signal ${signal} is not in tacticSignals`);
      }
    }
    for (const signal of reportCard.tacticSignals ?? []) {
      if (!primaryAnchorEvidence.includes(signal) && !supportingEvidence.includes(signal)) {
        fail(errors, `${card.cardId} tactic signal ${signal} is neither primary nor supporting evidence`);
      }
    }
    if (anchorSet.size === 0) {
      if ((reportCard.legacyStrategicRole ?? []).length !== 0) {
        fail(errors, `${card.cardId} has legacyStrategicRole without strategy anchor`);
      }
      if (pairs.length !== 0) {
        fail(errors, `${card.cardId} has strategySupportPairs without strategy anchor`);
      }
    }
    for (const pair of pairs) {
      if (!pair.strategyId || !pair.role || !(pair.evidence ?? []).length || !pair.confidence) {
        fail(errors, `${card.cardId} has incomplete strategySupportPair`);
      }
      if (!anchorSet.has(pair.strategyId)) {
        fail(errors, `${card.cardId} pair ${pair.strategyId} missing from strategyAnchors`);
      }
      if (!strategyIds.has(pair.strategyId)) {
        fail(errors, `${card.cardId} pair uses unknown strategy ${pair.strategyId}`);
      }
      if (pair.strategyId.startsWith("runner.")) {
        fail(errors, `${card.cardId} pair uses runner strategy ${pair.strategyId}`);
      }
    }

    const expectedPairs = EXPECTED_ANCHOR_CARDS.get(card.cardId);
    if (expectedPairs) {
      const actualKeys = new Set(pairs.map((pair) => `${pair.strategyId}:${pair.role}`));
      for (const expected of expectedPairs) {
        const key = `${expected.strategyId}:${expected.role}`;
        if (!actualKeys.has(key)) fail(errors, `${card.cardId} missing expected pair ${key}`);
      }
      if (expectedPairs.length === 0 && pairs.length !== 0) {
        fail(errors, `${card.cardId} expected support-only but has ${pairs.length} pairs`);
      }
    }

    const requiredSignals = REQUIRED_SIGNALS_BY_CARD.get(card.cardId);
    if (requiredSignals) assertSignals(errors, reportCard, requiredSignals);
  }

  for (const cardId of SUPPORT_ONLY_CARDS) {
    const card = reportByCard.get(cardId);
    if (!card) {
      fail(errors, `support-only card missing from report ${cardId}`);
      continue;
    }
    if ((card.strategyAnchors ?? []).length !== 0) {
      fail(errors, `support-only card has strategy anchors ${cardId}: ${card.strategyAnchors.join(", ")}`);
    }
    if ((card.strategySupportPairs ?? []).length !== 0) {
      fail(errors, `support-only card has strategySupportPairs ${cardId}`);
    }
  }

  const fetalAi = reportByCard.get("onr_proteus_004_fetal-ai");
  if (fetalAi?.hiddenInfoPolicy !== "corp_side_only_until_revealed") {
    fail(errors, "Proteus Fetal AI hiddenInfoPolicy must be corp_side_only_until_revealed");
  }
  const markedAccounts = reportByCard.get("onr_proteus_005_marked-accounts");
  if (markedAccounts?.hiddenInfoPolicy !== "corp_side_only_until_revealed") {
    fail(errors, "Marked Accounts hiddenInfoPolicy must be corp_side_only_until_revealed");
  }
  const viral = reportByCard.get("onr_proteus_009_viral-breeding-ground");
  if ((viral?.strategyAnchors ?? []).includes("corp.damage_kill")) {
    fail(errors, "Viral Breeding Ground must not anchor corp.damage_kill");
  }

  if (errors.length > 0) {
    console.error(`AI023 Corp Agenda semantics check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `AI023 Corp Agenda semantics check passed active=${activeCompiledAgendas.length} inactive=${inactiveAgendas.length} strategyPairs=${report.summary.strategySupportPairCount} newSignals=${report.summary.newTacticSignalCount}`,
  );
}

main();
