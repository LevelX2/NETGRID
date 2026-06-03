#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
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
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";
const REPORT_PATH =
  "docs/reviews/ai/ai023-2-corp-agendas-active-hint-sync-report-2026-06-03.json";

const EXPECTED_STRATEGY_IDS = new Set([
  "corp.ambush_bluff",
  "corp.asset_economy",
  "corp.central_stabilize",
  "corp.damage_kill",
  "corp.economy_rez_reserve",
  "corp.fast_advance",
  "corp.ice_tax_glacier",
  "corp.remote_scoring",
  "corp.rush_score",
  "corp.tag_trace_punish",
  "runner.economy_first",
  "runner.hq_pressure",
  "runner.interface_closeout",
  "runner.remote_contest",
  "runner.remote_trash",
  "runner.rig_first",
  "runner.rnd_pressure",
  "runner.run_event_tempo",
  "runner.search.breaker",
  "runner.survival_defense",
]);

const REQUIRED_SIGNALS_BY_CARD = new Map([
  [
    "onr_proteus_007_project-venice",
    ["score.overadvance_bonus", "score.overadvance_scaling", "score.recurring_extra_action"],
  ],
  [
    "onr_proteus_008_project-zurich",
    ["score.economy_recurring", "score.overadvance_bonus", "score.overadvance_scaling"],
  ],
  [
    "onr_v1_214_project-babylon",
    ["score.conditional_bonus_agenda_points", "score.overadvance_bonus", "score.overadvance_scaling"],
  ],
  [
    "onr_proteus_004_fetal-ai",
    [
      "access.agenda_ambush",
      "access.agenda_net_damage",
      "access.agenda_steal_tax",
      "access.rnd_reveal_requirement",
      "access.archives_safe_exception",
      "score.net_damage_access_punish",
    ],
  ],
  ["onr_proteus_005_marked-accounts", ["access.agenda_ambush", "access.agenda_tag", "access.rnd_reveal_requirement"]],
  [
    "onr_proteus_009_viral-breeding-ground",
    [
      "access.agenda_ambush",
      "access.runner_program_bounce",
      "access.runner_program_disruption",
      "score.fort_trash_on_score",
    ],
  ],
  ["onr_v1_190_bioweapons-engineering", ["score.meat_damage_amp", "score.damage_amp"]],
  [
    "onr_proteus_003_corporate-headhunters",
    [
      "score.tagged_meat_damage_payoff",
      "score.meat_damage_source",
      "score.hand_size_pressure",
      "risk.requires_tagged_runner",
    ],
  ],
  ["onr_proteus_010_world-domination", ["score.bonus_agenda_points", "score.closeout_agenda", "risk.high_difficulty_agenda"]],
]);

const OVERADVANCE_SUPPORT_ONLY = [
  "onr_v1_214_project-babylon",
  "onr_proteus_007_project-venice",
  "onr_proteus_008_project-zurich",
];

const STATIC_SCOPE_NO_TARGET_PROFILE = [
  "onr_v1_189_artificial-security-directors",
  "onr_v1_191_black-ice-quality-assurance",
  "onr_v1_200_encryption-breakthrough",
  "onr_v1_201_executive-extraction",
  "onr_v1_202_genetics-visionary-acquisition",
  "onr_v1_219_superior-net-barriers",
];

const NO_EFFECT_FLAGS = [
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

function main() {
  const errors = [];
  const catalog = buildCardCatalog();
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const compiledHints = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const strategies = readJson(STRATEGY_GOALS_PATH);
  const report = readJson(REPORT_PATH);

  const activeById = new Map((activeHints.cards ?? []).map((card) => [card.cardId, card]));
  const compiledById = new Map((compiledHints.cards ?? []).map((card) => [card.cardId, card]));
  const inspectorById = new Map((inspector.cards ?? []).map((card) => [card.cardId, card]));
  const strategyIds = new Set((strategies.strategyGoals ?? []).map((strategy) => strategy.strategyId));

  expectStrategyIds(errors, strategyIds);
  expectReportShape(errors, report);

  const agendaInventory = catalog.cards.filter((card) => card.side === "corp" && card.cardType === "agenda");
  const productionAgendas = agendaInventory.filter((card) =>
    ["originalset-v1", "proteus"].includes(card.setId),
  );
  const activeProductionAgendas = productionAgendas.filter((card) =>
    activeById.has(card.cardId) && compiledById.has(card.cardId),
  );
  const activeTestAgendas = agendaInventory.filter((card) =>
    card.setId === "testset" && activeById.has(card.cardId) && compiledById.has(card.cardId),
  );
  const inactiveClassicAgendas = agendaInventory.filter((card) =>
    card.setId === "classic" && !activeById.has(card.cardId) && !compiledById.has(card.cardId),
  );

  expectEqual(errors, activeProductionAgendas.length, 43, "production active/compiled Corp Agenda count");
  expectEqual(
    errors,
    activeProductionAgendas.filter((card) => card.setId === "originalset-v1").length,
    33,
    "production Originalset Agenda count",
  );
  expectEqual(
    errors,
    activeProductionAgendas.filter((card) => card.setId === "proteus").length,
    10,
    "production Proteus Agenda count",
  );
  expectEqual(errors, activeTestAgendas.length, 3, "active Test/V08 Agenda count");
  expectEqual(errors, inactiveClassicAgendas.length, 4, "inactive Classic Agenda count");

  for (const card of activeProductionAgendas) {
    const active = activeById.get(card.cardId);
    const compiled = compiledById.get(card.cardId);
    const inspectorCard = inspectorById.get(card.cardId);
    if (!active) fail(errors, `${card.cardId} missing active hint`);
    if (!compiled) fail(errors, `${card.cardId} missing compiled hint`);
    if (!inspectorCard) fail(errors, `${card.cardId} missing inspector entry`);
    if (!active || !compiled || !inspectorCard) continue;

    expectArrayEqual(
      errors,
      active.tacticSignals ?? [],
      compiled.tacticSignals ?? [],
      `${card.cardId} active/compiled tacticSignals`,
    );

    for (const signal of active.tacticSignals ?? []) {
      if (!(inspectorCard.derivedFunctionSignals ?? []).includes(signal)) {
        fail(errors, `${card.cardId} inspector missing tactic signal ${signal}`);
      }
    }
  }

  for (const [cardId, requiredSignals] of REQUIRED_SIGNALS_BY_CARD) {
    expectSignals(errors, activeById, cardId, requiredSignals, "active");
    expectSignals(errors, compiledById, cardId, requiredSignals, "compiled");
    expectInspectorSignals(errors, inspectorById, cardId, requiredSignals);
  }

  for (const cardId of OVERADVANCE_SUPPORT_ONLY) {
    const active = activeById.get(cardId);
    const compiled = compiledById.get(cardId);
    const inspectorCard = inspectorById.get(cardId);
    expectNoStrategy(errors, active, cardId, "corp.fast_advance", "active lineSupport");
    expectNoStrategy(errors, compiled, cardId, "corp.fast_advance", "compiled lineSupport");
    expectNoStrategy(errors, inspectorCard, cardId, "corp.fast_advance", "inspector cardLevelStrategyAnchors", "cardLevelStrategyAnchors");
    expectNoStrategy(errors, inspectorCard, cardId, "corp.fast_advance", "inspector derivedPossibleStrategyAnchors", "derivedPossibleStrategyAnchors");
    if ((inspectorCard?.reviewedStrategySupportPairs ?? []).some((pair) => pair.strategyId === "corp.fast_advance")) {
      fail(errors, `${cardId} must not have corp.fast_advance reviewedStrategySupportPair`);
    }
  }

  const fetal = activeById.get("onr_proteus_004_fetal-ai");
  expectNoSignal(errors, fetal, "score.meat_damage_source", "Fetal AI must not be Meat Damage");
  expectNoSignal(errors, fetal, "access.agenda_meat_damage", "Fetal AI must not use a Meat Damage access signal");

  const marked = activeById.get("onr_proteus_005_marked-accounts");
  expectNoSignal(errors, marked, "tag.corp_persistent_source", "Marked Accounts must not be persistent tag source");

  const viral = activeById.get("onr_proteus_009_viral-breeding-ground");
  if (!(viral?.tacticSignals ?? []).includes("score.fort_trash_on_score") || !(viral?.tacticSignals ?? []).includes("access.runner_program_bounce")) {
    fail(errors, "Viral Breeding Ground must separate score fort trash and access program bounce");
  }

  const bioweapons = activeById.get("onr_v1_190_bioweapons-engineering");
  expectNoSignal(errors, bioweapons, "damage.payoff", "Bioweapons Engineering must not use broad damage.payoff");
  expectNoSignal(errors, bioweapons, "score.meat_damage_source", "Bioweapons Engineering must not be a direct Meat Damage source");

  const headhunters = activeById.get("onr_proteus_003_corporate-headhunters");
  expectNoSignal(errors, headhunters, "score.brain_damage_or_hand_size_pressure", "Corporate Headhunters must not use a Brain Damage mixed signal");
  expectNoSignal(errors, headhunters, "score.brain_damage_source", "Corporate Headhunters must not be Brain Damage");

  for (const cardId of ["onr_v1_199_employee-empowerment", "onr_v1_205_main-office-relocation", "onr_v1_188_ai-chief-financial-officer"]) {
    const card = activeById.get(cardId);
    for (const signal of card?.tacticSignals ?? []) {
      if (signal.startsWith("score.economy") || signal.startsWith("economy.")) {
        fail(errors, `${cardId} draw/hand-size Agenda must not be credit economy (${signal})`);
      }
    }
  }

  for (const cardId of STATIC_SCOPE_NO_TARGET_PROFILE) {
    const active = activeById.get(cardId);
    const compiled = compiledById.get(cardId);
    if ((active?.targetProfiles ?? []).length > 0) fail(errors, `${cardId} static scope Agenda has active TargetProfile`);
    if ((compiled?.targetProfiles ?? []).length > 0) fail(errors, `${cardId} static scope Agenda has compiled TargetProfile`);
  }

  for (const cardId of [
    "onr_proteus_004_fetal-ai",
    "onr_proteus_005_marked-accounts",
    "onr_proteus_009_viral-breeding-ground",
  ]) {
    const card = activeById.get(cardId);
    if (!(card?.riskTags ?? []).includes("hidden_until_score_or_access")) {
      fail(errors, `${cardId} missing hidden_until_score_or_access risk tag`);
    }
  }

  const productionReportCount = report.countsAfter?.productionOriginalsetAgendaCount + report.countsAfter?.productionProteusAgendaCount;
  expectEqual(errors, productionReportCount, 43, "report production agenda count");
  expectEqual(errors, report.fixedMissingSignalCards?.length, 43, "report fixedMissingSignalCards count");
  for (const flag of NO_EFFECT_FLAGS) {
    if (report.noEffectFlags?.[flag] !== false) fail(errors, `report noEffectFlags.${flag} must be false`);
  }

  if (errors.length > 0) {
    console.error(`AI023-2 Corp Agenda active-hint sync failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    [
      "AI023_2_CORP_AGENDAS_ACTIVE_HINT_SYNC OK",
      "productionAgendas=43",
      "originalset=33",
      "proteus=10",
      `test=${activeTestAgendas.length}`,
      `inactiveClassic=${inactiveClassicAgendas.length}`,
      `fixed=${report.fixedMissingSignalCards.length}`,
    ].join(" "),
  );
}

function buildCardCatalog() {
  const cards = [];
  for (const relativePath of CARD_FILES) {
    if (!fs.existsSync(repoPath(relativePath))) continue;
    const data = readJson(relativePath);
    const setId = data.setId ?? setIdFromPath(relativePath);
    for (const card of data.cards ?? []) {
      cards.push({
        cardId: card.cardId,
        title: card.title,
        side: card.side,
        cardType: card.type,
        setId: card.setId ?? setId,
      });
    }
  }
  return { cards };
}

function expectReportShape(errors, report) {
  if (report.taskId !== "AI023-2") fail(errors, "report taskId must be AI023-2");
  if (report.guideVersion !== "V3") fail(errors, "report guideVersion must be V3");
  if (report.scope !== "corp_agendas_active_hint_sync") fail(errors, "report scope mismatch");
  if (!Array.isArray(report.changedCards)) fail(errors, "report changedCards must be an array");
  if (!Array.isArray(report.fixedMissingSignalCards)) fail(errors, "report fixedMissingSignalCards must be an array");
  if (report.compiledHintSync?.status !== "synced") fail(errors, "report compiledHintSync.status must be synced");
  if (report.inspectorSync?.status !== "synced") fail(errors, "report inspectorSync.status must be synced");
}

function expectStrategyIds(errors, strategyIds) {
  expectEqual(errors, strategyIds.size, EXPECTED_STRATEGY_IDS.size, "Strategy ID count");
  for (const expected of EXPECTED_STRATEGY_IDS) {
    if (!strategyIds.has(expected)) fail(errors, `missing expected Strategy ID ${expected}`);
  }
  for (const actual of strategyIds) {
    if (!EXPECTED_STRATEGY_IDS.has(actual)) fail(errors, `unexpected Strategy ID ${actual}`);
  }
}

function expectSignals(errors, hintById, cardId, requiredSignals, label) {
  const card = hintById.get(cardId);
  if (!card) {
    fail(errors, `${cardId} missing ${label} hint`);
    return;
  }
  for (const signal of requiredSignals) {
    if (!(card.tacticSignals ?? []).includes(signal)) {
      fail(errors, `${cardId} missing ${label} tactic signal ${signal}`);
    }
  }
}

function expectInspectorSignals(errors, inspectorById, cardId, requiredSignals) {
  const card = inspectorById.get(cardId);
  if (!card) {
    fail(errors, `${cardId} missing inspector entry`);
    return;
  }
  for (const signal of requiredSignals) {
    if (!(card.derivedFunctionSignals ?? []).includes(signal)) {
      fail(errors, `${cardId} missing inspector function signal ${signal}`);
    }
  }
}

function expectNoSignal(errors, card, signal, message) {
  if ((card?.tacticSignals ?? []).includes(signal)) fail(errors, message);
}

function expectNoStrategy(errors, card, cardId, strategyId, label, field = "lineSupport") {
  if ((card?.[field] ?? []).includes(strategyId)) fail(errors, `${cardId} must not include ${strategyId} in ${label}`);
}

function expectArrayEqual(errors, actual, expected, label) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    fail(errors, `${label} mismatch expected=${JSON.stringify(right)} actual=${JSON.stringify(left)}`);
  }
}

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) fail(errors, `${label} expected=${expected} actual=${actual}`);
}

function fail(errors, message) {
  errors.push(message);
}

function setIdFromPath(relativePath) {
  if (relativePath.includes("originalset")) return "originalset-v1";
  if (relativePath.includes("proteus")) return "proteus";
  if (relativePath.includes("classic")) return "classic";
  if (relativePath.includes("testset")) return "testset";
  return "unknown";
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

main();
