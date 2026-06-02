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
const REPORT_PATH = "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json";

const ADDED_SIGNALS = [
  "corp_ice.encounter_paid_subroutine_add",
  "corp_ice.jackout_lock",
  "corp_ice.next_ice_break_lock",
  "corp_ice.optional_self_bounce_gain",
  "corp_ice.runner_action_loss",
  "corp_ice.runner_pay_or_program_trash",
];

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

function hasAll(hint, signals) {
  return signals.every((signal) => (hint?.tacticSignals ?? []).includes(signal));
}

function hasNone(hint, signals) {
  return signals.every((signal) => !(hint?.tacticSignals ?? []).includes(signal));
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
  const hintById = new Map(activeHints.map((hint) => [hint.cardId, hint]));
  const cardByTitle = new Map(allCards.map((card) => [card.title, card]));
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

  if (report.schemaVersion !== "ai024-1-corp-ice-semantics-polish-report-v1") fail(errors, "unexpected schemaVersion");
  if (report.taskId !== "AI024-1") fail(errors, "unexpected taskId");
  if (report.countsAfter?.activeCompiledCorpIce !== 95 || activeCompiledIce.length !== 95) fail(errors, "active Corp ICE count changed");
  if (report.countsAfter?.inactiveCheckedCorpIce !== 11 || inactiveIce.length !== 11) fail(errors, "inactive Corp ICE count changed");
  if (report.countsAfter?.newStrategyIdCount !== 0) fail(errors, "AI024-1 must not introduce Strategy IDs");
  for (const flag of REPORT_FLAGS) if (report.countsAfter?.[flag] !== false) fail(errors, `${flag} is not false`);

  for (const signalId of ADDED_SIGNALS) {
    const signal = tacticSignals.find((item) => item.signalId === signalId);
    if (!signal) fail(errors, `missing new signal ${signalId}`);
    if (signal?.sideScope !== "corp") fail(errors, `${signalId} sideScope is not corp`);
  }
  for (const signal of tacticSignals) {
    if (FORBIDDEN_SUBTYPE_SIGNALS.has(signal.signalId)) fail(errors, `forbidden subtype signal catalogued: ${signal.signalId}`);
  }
  for (const strategyId of report.newStrategyIds ?? []) {
    if (!strategyIds.has(strategyId)) fail(errors, `unknown new strategy id ${strategyId}`);
  }
  for (const pair of report.changedStrategySupportPairs ?? []) {
    if (!strategyIds.has(pair.strategyId)) fail(errors, `unknown strategy pair id ${pair.strategyId}`);
    for (const signal of pair.evidence ?? []) if (!signalIds.has(signal)) fail(errors, `pair evidence uncatalogued ${signal}`);
  }

  const hint = (title) => hintById.get(cardByTitle.get(title)?.cardId);

  if (!hasAll(hint("Zombie"), ["corp_ice.brain_damage", "corp_ice.damage_source", "corp_ice.end_run"])) fail(errors, "Zombie missing brain damage/end-run signals");
  if ((hint("Zombie")?.tacticSignals ?? []).includes("corp_ice.other_utility")) fail(errors, "Zombie still has other_utility");

  if (!hasAll(hint("Colonel Failure"), ["corp_ice.program_trash", "corp_ice.multi_end_run"])) fail(errors, "Colonel Failure missing program-trash/multi-ETR");
  if ((hint("Colonel Failure")?.tacticSignals ?? []).includes("corp_ice.self_bounce_or_maintenance_drawback")) fail(errors, "Colonel Failure still has false self-bounce drawback");

  if (!hasNone(hint("Fragmentation Storm"), ["corp_ice.net_damage", "corp_ice.damage_source", "damage.payoff"])) fail(errors, "Fragmentation Storm still has false damage signals");
  if (!hasAll(hint("Fragmentation Storm"), ["corp_ice.program_trash", "corp_ice.trace_source", "corp_ice.run_lock"])) fail(errors, "Fragmentation Storm missing trace/program-trash/run-lock signals");

  for (const title of ["Asp", "Fang", "Fang 2.0", "Rex"]) {
    if (!hasNone(hint(title), ["corp_ice.tag_source", "tag.source"])) fail(errors, `${title} still has false tag signals`);
    if (!hasAll(hint(title), ["corp_ice.trace_source", "trace.source", "corp_ice.run_lock"])) fail(errors, `${title} missing trace/run-lock signals`);
  }
  for (const title of ["Hunter", "Fetch 4.0.1"]) {
    if (!hasAll(hint(title), ["corp_ice.tag_source", "tag.source", "corp_ice.trace_source", "trace.source"])) fail(errors, `${title} missing trace tag signals`);
    if ((hint(title)?.tacticSignals ?? []).includes("corp_ice.conditional_end_run")) fail(errors, `${title} has false conditional ETR`);
  }
  if (!hasAll(hint("TKO 2.0"), ["corp_ice.runner_action_loss"])) fail(errors, "TKO 2.0 missing action-loss signal");
  if (!hasAll(hint("Shock.r"), ["corp_ice.next_ice_break_lock", "corp_ice.jackout_lock"])) fail(errors, "Shock.r missing lock signals");
  if ((hint("Shock.r")?.tacticSignals ?? []).includes("corp_ice.other_utility")) fail(errors, "Shock.r still has other_utility");
  if (!hasAll(hint("Jack Attack"), ["corp_ice.jackout_lock", "corp_ice.trace_source", "corp_ice.tag_source"])) fail(errors, "Jack Attack missing jackout-lock/trace/tag signals");
  if ((hint("Too Many Doors")?.tacticSignals ?? []).includes("corp_ice.rnd_reorder")) fail(errors, "Too Many Doors still has R&D reorder");

  if (!hasAll(hint("Chihuahua"), ["corp_ice.trace_source", "trace.source", "corp_ice.rez_economy"])) fail(errors, "Chihuahua missing trace/rez economy");
  if (!hasAll(hint("Coyote"), ["corp_ice.future_strength_buff", "corp_ice.rez_economy"])) fail(errors, "Coyote missing future strength or rez economy");
  if (!hasAll(hint("Washed-Up Solo Construct"), ["corp_ice.runner_pay_or_program_trash", "corp_ice.program_trash", "corp_ice.rez_economy"])) fail(errors, "Washed-Up Solo Construct missing pay-or-program-trash/rez economy");
  for (const title of ["Scaffolding", "Tumblers", "Death Yo-Yo"]) {
    if (!hasAll(hint(title), ["corp_ice.optional_self_bounce_gain"])) fail(errors, `${title} missing optional self-bounce gain`);
  }
  for (const title of ["Marionette", "Datacomb", "Twisty Passages"]) {
    if (!hasAll(hint(title), ["corp_ice.self_bounce_or_maintenance_drawback"])) fail(errors, `${title} missing self-bounce/maintenance drawback`);
  }
  for (const title of ["Snowbank", "Misleading Access Menus"]) {
    if (!hasAll(hint(title), ["corp_ice.runner_pay_or_end_run", "corp_ice.rez_economy"])) fail(errors, `${title} missing pay-or-ETR/rez economy`);
    if ((hint(title)?.tacticSignals ?? []).includes("corp_ice.run_lock")) fail(errors, `${title} should not use run_lock`);
  }
  for (const title of ["Riddler", "Iceberg"]) {
    if (!hasAll(hint(title), ["corp_ice.encounter_paid_subroutine_add"])) fail(errors, `${title} missing encounter-paid subroutine add`);
  }
  if (!hasAll(hint("Homing Missile"), ["corp_ice.trace_source", "corp_ice.conditional_end_run", "corp_ice.run_lock", "corp_ice.rez_paid_scaling"])) {
    fail(errors, "Homing Missile missing trace/conditional-ETR/run-lock/rez-scaling");
  }

  const multiExpected = ["Cortical Scanner", "Endless Corridor", "Reinforced Wall", "Wall of Ice", "Toughonium™ Wall", "Colonel Failure"];
  for (const title of multiExpected) {
    if (!hasAll(hint(title), ["corp_ice.multi_end_run"])) fail(errors, `${title} missing multi_end_run`);
  }
  if ((hint("Data Wall 2.0")?.tacticSignals ?? []).includes("corp_ice.multi_end_run")) fail(errors, "Data Wall 2.0 has false multi_end_run");

  for (const title of ["Banpei", "D'Arc Knight", "Data Naga", "Ice Pick Willie", "Sentinels Prime", "Triggerman", "Marionette", "Washed-Up Solo Construct", "Colonel Failure"]) {
    const h = hint(title);
    if ((h?.lineSupport ?? []).includes("corp.ice_tax_glacier")) fail(errors, `${title} simple program-trash ICE should not anchor ice_tax_glacier`);
  }
  for (const title of ["Zombie", "Wall of Ice", "Death Yo-Yo"]) {
    if (!((hint(title)?.lineSupport ?? []).includes("corp.damage_kill"))) fail(errors, `${title} missing damage_kill anchor`);
  }

  if (errors.length > 0) {
    console.error(`AI024-1 Corp ICE polish check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`AI024-1 Corp ICE polish check passed active=${activeCompiledIce.length} inactive=${inactiveIce.length} changed=${report.countsAfter.changedCardCount} addedSignals=${ADDED_SIGNALS.length}`);
}

main();
