#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SIGNALS_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";

const TARGET_CARDS = {
  setup: "onr_v1_340_setup",
  vacantSoulkiller: "onr_v1_346_vacant-soulkiller",
  virusTestSite: "onr_v1_348_virus-test-site",
  remoteFacility: "onr_v1_335_remote-facility",
  nevinyrral: "onr_v1_331_nevinyrral",
  shatteredRemains: "onr_v1_315_corprunners-shattered-remains",
  esaContract: "onr_v1_321_esa-contract",
  euromarket: "onr_v1_322_euromarket-consortium",
  rustbelt: "onr_v1_338_rustbelt-hq-branch",
  pacifica: "onr_v1_334_pacifica-regional-ai",
};

function main() {
  const errors = [];
  const signalData = readJson(SIGNALS_PATH);
  const derivationData = readJson(DERIVATION_PATH);
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const compiledHints = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const strategyGoals = readJson(STRATEGY_GOALS_PATH);

  const signalById = new Map((signalData.signals ?? []).map((signal) => [signal.signalId, signal]));
  const rulesById = groupRulesById(derivationData.derivationRules ?? []);
  const activeById = new Map((activeHints.cards ?? []).map((card) => [card.cardId, card]));
  const compiledById = new Map((compiledHints.cards ?? []).map((card) => [card.cardId, card]));
  const inspectorById = new Map((inspector.cards ?? []).map((card) => [card.cardId, card]));
  const strategyIds = new Set((strategyGoals.strategyGoals ?? []).map((goal) => goal.strategyId));

  expectSignal(errors, signalById, "damage.payoff", {
    supportOnly: true,
    mayAnchorStrategy: false,
    allowedStrategyAnchors: [],
    legacy: true,
    aggregation: true,
    notForDirectScoring: true,
  });
  expectRuleAnchors(errors, rulesById, "damage.payoff", []);

  expectSignal(errors, signalById, "action.corp_repeatable_extra_action", {
    supportOnly: true,
    mayAnchorStrategy: false,
    allowedStrategyAnchors: [],
    notForDirectScoring: true,
  });
  expectRuleAnchors(errors, rulesById, "action.corp_repeatable_extra_action", []);
  expectRuleAnchors(errors, rulesById, "action.corp_counter_to_action", ["corp.fast_advance"]);

  expectSignal(errors, signalById, "access.corp_hardware_trash", {
    allowedStrategyAnchors: ["corp.ambush_bluff"],
  });
  expectRuleAnchors(errors, rulesById, "access.corp_hardware_trash", ["corp.ambush_bluff"]);
  expectRuleAnchors(errors, rulesById, "access.corp_net_damage_ambush", ["corp.ambush_bluff"]);

  expectSignal(errors, signalById, "draw.corp_draw", {
    supportOnly: true,
    mayAnchorStrategy: false,
    allowedStrategyAnchors: [],
  });
  expectSignal(errors, signalById, "economy.corp_draw", {
    supportOnly: true,
    mayAnchorStrategy: false,
    allowedStrategyAnchors: [],
    legacy: true,
    aggregation: true,
    notForDirectScoring: true,
  });

  const remoteEconomyRules = rulesById.get("remote.asset_economy") ?? [];
  if (remoteEconomyRules.length === 0) fail(errors, "remote.asset_economy derivation rule missing");
  else {
    for (const remoteEconomyRule of remoteEconomyRules) {
      expectArrayEqual(
        errors,
        remoteEconomyRule.gates?.remoteRoleStrategyDerivationAbsent ?? [],
        ["legacy_only", "not_for_strategy_derivation"],
        "remote.asset_economy must skip not-for-strategy legacy remoteRole entries",
      );
    }
  }

  expectNoDerivedAnchor(errors, inspectorById, TARGET_CARDS.setup, "corp.damage_kill");
  expectCardLevelAnchor(errors, inspectorById, TARGET_CARDS.setup, "corp.ambush_bluff");
  expectCardLevelAnchor(errors, inspectorById, TARGET_CARDS.vacantSoulkiller, "corp.damage_kill");
  expectCardLevelAnchor(errors, inspectorById, TARGET_CARDS.virusTestSite, "corp.damage_kill");

  for (const cardId of [TARGET_CARDS.remoteFacility, TARGET_CARDS.nevinyrral]) {
    expectNoDerivedAnchor(errors, inspectorById, cardId, "corp.fast_advance");
    expectNoDerivedAnchor(errors, inspectorById, cardId, "corp.remote_scoring");
    expectSupportingEvidence(errors, inspectorById, cardId, "action.corp_repeatable_extra_action");
  }

  expectNoDerivedAnchor(errors, inspectorById, TARGET_CARDS.shatteredRemains, "corp.tag_trace_punish");
  expectCardLevelAnchor(errors, inspectorById, TARGET_CARDS.shatteredRemains, "corp.ambush_bluff");

  for (const cardId of [TARGET_CARDS.esaContract, TARGET_CARDS.euromarket, TARGET_CARDS.rustbelt]) {
    expectNoDerivedAnchor(errors, inspectorById, cardId, "corp.asset_economy");
    expectNoDerivedFunctionSignal(errors, inspectorById, cardId, "remote.asset_economy");
    expectRemoteRoleNotForStrategy(errors, activeById, cardId);
    expectRemoteRoleNotForStrategy(errors, compiledById, cardId);
  }
  expectNoDerivedAnchor(errors, inspectorById, TARGET_CARDS.pacifica, "corp.asset_economy");
  expectCardLevelAnchor(errors, inspectorById, TARGET_CARDS.pacifica, "corp.fast_advance");
  expectRemoteRoleNotForStrategy(errors, activeById, TARGET_CARDS.pacifica);
  expectRemoteRoleNotForStrategy(errors, compiledById, TARGET_CARDS.pacifica);

  expectSupportingEvidence(errors, inspectorById, TARGET_CARDS.esaContract, "draw.corp_draw");
  expectSupportingEvidence(errors, inspectorById, TARGET_CARDS.euromarket, "draw.corp_draw");
  expectSupportingEvidence(errors, inspectorById, TARGET_CARDS.euromarket, "setup.corp_hand_size");
  expectSupportingEvidence(errors, inspectorById, TARGET_CARDS.rustbelt, "setup.corp_hand_size");

  for (const hint of [...(activeHints.cards ?? []), ...(compiledHints.cards ?? [])]) {
    if ((hint.tacticSignals ?? []).includes("economy.corp_draw")) {
      fail(errors, `${hint.cardId} still uses legacy economy.corp_draw directly`);
    }
  }

  if (strategyIds.size !== 20) {
    fail(errors, `Expected 20 existing strategy IDs; found ${strategyIds.size}`);
  }
  if ([...strategyIds].some((strategyId) => strategyId.includes("ai027"))) {
    fail(errors, "AI027 must not introduce a strategy ID");
  }

  for (const cardId of Object.values(TARGET_CARDS)) {
    const card = inspectorById.get(cardId);
    if (!card) {
      fail(errors, `Missing inspector card ${cardId}`);
      continue;
    }
    for (const field of [
      "cardLevelStrategyAnchors",
      "derivedPossibleStrategyAnchors",
      "reviewedStrategySupportPairs",
      "supportingEvidenceOnly",
    ]) {
      if (!Array.isArray(card[field])) fail(errors, `${cardId} missing inspector field ${field}`);
    }
  }

  if (errors.length > 0) {
    console.error(`AI027 derivation/inspector alignment failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    [
      "AI027_DERIVATION_INSPECTOR_GUIDE_V3_ALIGNMENT OK",
      `signals=${signalData.signals.length}`,
      `rules=${derivationData.derivationRules.length}`,
      `inspectorCards=${inspector.cards.length}`,
      `strategyIds=${strategyIds.size}`,
    ].join(" ") + "\n",
  );
}

function expectSignal(errors, signalById, signalId, expected) {
  const signal = signalById.get(signalId);
  if (!signal) {
    fail(errors, `Missing tactic signal ${signalId}`);
    return;
  }
  for (const [key, value] of Object.entries(expected)) {
    if (Array.isArray(value)) {
      expectArrayEqual(errors, signal[key] ?? [], value, `${signalId}.${key}`);
    } else if (signal[key] !== value) {
      fail(errors, `${signalId}.${key} expected ${String(value)} but found ${String(signal[key])}`);
    }
  }
}

function expectRuleAnchors(errors, rulesById, signalId, expectedAnchors) {
  const rules = rulesById.get(signalId) ?? [];
  if (rules.length === 0) {
    fail(errors, `Missing derivation rule ${signalId}`);
    return;
  }
  for (const [index, rule] of rules.entries()) {
    expectArrayEqual(
      errors,
      rule.strategyAnchorFor ?? [],
      expectedAnchors,
      `${signalId}.strategyAnchorFor[${index}]`,
    );
  }
}

function expectNoDerivedAnchor(errors, inspectorById, cardId, strategyId) {
  const card = inspectorById.get(cardId);
  if (!card) {
    fail(errors, `Missing inspector card ${cardId}`);
    return;
  }
  if ((card.derivedPossibleStrategyAnchors ?? card.derivedStrategyAnchors ?? []).includes(strategyId)) {
    fail(errors, `${cardId} still has derived possible anchor ${strategyId}`);
  }
}

function expectCardLevelAnchor(errors, inspectorById, cardId, strategyId) {
  const card = inspectorById.get(cardId);
  if (!card) {
    fail(errors, `Missing inspector card ${cardId}`);
    return;
  }
  if (!(card.cardLevelStrategyAnchors ?? []).includes(strategyId)) {
    fail(errors, `${cardId} missing card-level strategy anchor ${strategyId}`);
  }
}

function expectNoDerivedFunctionSignal(errors, inspectorById, cardId, signalId) {
  const card = inspectorById.get(cardId);
  if (!card) {
    fail(errors, `Missing inspector card ${cardId}`);
    return;
  }
  if ((card.derivedFunctionSignals ?? []).includes(signalId)) {
    fail(errors, `${cardId} still has derived function signal ${signalId}`);
  }
}

function expectSupportingEvidence(errors, inspectorById, cardId, signalId) {
  const card = inspectorById.get(cardId);
  if (!card) {
    fail(errors, `Missing inspector card ${cardId}`);
    return;
  }
  if (!(card.supportingEvidenceOnly ?? []).includes(signalId)) {
    fail(errors, `${cardId} missing supporting evidence ${signalId}`);
  }
}

function expectRemoteRoleNotForStrategy(errors, hintById, cardId) {
  const card = hintById.get(cardId);
  if (!card) {
    fail(errors, `Missing hint ${cardId}`);
    return;
  }
  if (card.remoteRole?.strategyDerivation !== "not_for_strategy_derivation") {
    fail(errors, `${cardId} remoteRole is not marked not_for_strategy_derivation`);
  }
}

function expectArrayEqual(errors, actual, expected, label) {
  const normalizedActual = [...actual].sort();
  const normalizedExpected = [...expected].sort();
  if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) {
    fail(errors, `${label} expected ${JSON.stringify(normalizedExpected)} but found ${JSON.stringify(normalizedActual)}`);
  }
}

function fail(errors, message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8"));
}

function groupRulesById(rules) {
  const grouped = new Map();
  for (const rule of rules) {
    const current = grouped.get(rule.signalId) ?? [];
    current.push(rule);
    grouped.set(rule.signalId, current);
  }
  return grouped;
}

main();
