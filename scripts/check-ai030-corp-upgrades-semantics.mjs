#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";
const SIGNALS_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const STRATEGY_GOALS_PATH = "data/ai/strategy-goals-v1.json";
const REPORT_PATH = "docs/reviews/ai/ai030-corp-upgrades-semantics-review-report-2026-06-03.json";

const ORIGINALSET_UPGRADES = [
  "onr_v1_349_aardvark",
  "onr_v1_350_antiquated-interface-routines",
  "onr_v1_351_bizarre-encryption-scheme",
  "onr_v1_352_chester-mix",
  "onr_v1_353_chimera",
  "onr_v1_354_crybaby",
  "onr_v1_355_crystal-palace-station-grid",
  "onr_v1_356_dedicated-response-team",
  "onr_v1_357_dieter-esslin",
  "onr_v1_358_dr-dreff",
  "onr_v1_359_jenny-jett",
  "onr_v1_360_jerusalem-city-grid",
  "onr_v1_361_namatoki-plaza",
  "onr_v1_362_new-galveston-city-grid",
  "onr_v1_363_olivia-salazar",
  "onr_v1_364_omni-kismet-ph-d",
  "onr_v1_365_paris-city-grid",
  "onr_v1_366_red-herrings",
  "onr_v1_367_rio-de-janeiro-city-grid",
  "onr_v1_368_roving-submarine",
  "onr_v1_369_singapore-city-grid",
  "onr_v1_370_tesseract-fort-construction",
  "onr_v1_371_tokyo-chiba-infighting",
  "onr_v1_372_turbeau-delacroix",
  "onr_v1_373_twenty-four-hour-surveillance",
  "onr_v1_374_washington-d-c-city-grid",
];

const PROTEUS_UPGRADES = [
  "onr_proteus_060_herman-revista",
  "onr_proteus_062_lesley-major",
  "onr_proteus_063_lisa-blight",
  "onr_proteus_064_marcel-desoleil",
  "onr_proteus_065_networked-center",
  "onr_proteus_066_obfuscated-fortress",
  "onr_proteus_067_panic-button",
  "onr_proteus_069_pavit-bharat",
  "onr_proteus_070_rasmin-bridger",
  "onr_proteus_071_raymond-ellison",
  "onr_proteus_072_research-bunker",
  "onr_proteus_073_simon-francisco",
  "onr_proteus_077_weapons-depot",
];

const TEST_UPGRADES = ["simple_upgrade"];
const TARGET_CARD_IDS = [...ORIGINALSET_UPGRADES, ...PROTEUS_UPGRADES, ...TEST_UPGRADES];
const SIGNAL_EMPTY_ALLOWED = new Set(TEST_UPGRADES);
const NO_EFFECT_FLAG_KEYS = [
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
const FORBIDDEN_KEYS = [
  "cardInstances",
  "privatePayload",
  "fullState",
  "stateHash",
  "actionId",
  "legalActions",
  "playerActions",
  "stateVersion",
];
const SAFE_TARGET_POLICIES = new Set([
  "corp_side_only",
  "corp_side_only_until_installed",
  "corp_side_only_until_revealed_by_effect",
  "corp_side_only_until_revealed_by_run_path",
  "legal_targets_only",
  "public_or_controller_known_only",
  "random_discard_without_ai_hidden_choice",
  "top_rnd_trash_without_ai_hidden_choice",
]);
const AI030_NEW_SIGNALS = new Set([
  "access.corp_agenda_score_delay",
  "access.corp_central_access_reduction",
  "access.corp_daemon_trash",
  "access.corp_installed_trash_tax",
  "advance.remote_score_window_support",
  "economy.corp_unsuccessful_run_credit",
  "ice.corp_hq_runpath_insert",
  "ice.corp_reorder_fort",
  "ice.corp_subroutine_repeat",
  "remote.agenda_difficulty_discount",
  "remote.capacity_support",
  "run.corp_pay_or_end_run",
  "run.corp_server_lock",
  "run.corp_spend_cap",
  "run.corp_stealth_credit_lockout",
  "run.corp_worm_lockout",
  "risk.rnd_trash_cost",
]);
const AGENDA_DIFFICULTY_UPGRADES = new Set([
  "onr_v1_374_washington-d-c-city-grid",
  "onr_proteus_065_networked-center",
  "onr_proteus_072_research-bunker",
  "onr_proteus_077_weapons-depot",
]);

function main() {
  const errors = [];
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const compiledHints = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const signalCatalog = readJson(SIGNALS_PATH);
  const derivation = readJson(DERIVATION_PATH);
  const strategyGoals = readJson(STRATEGY_GOALS_PATH);
  const report = readJson(REPORT_PATH);

  const activeById = mapCards(activeHints.cards);
  const compiledById = mapCards(compiledHints.cards);
  const inspectorById = mapCards(inspector.cards);
  const signalById = new Map((signalCatalog.signals ?? []).map((signal) => [signal.signalId, signal]));
  const strategyIds = new Set((strategyGoals.strategyGoals ?? []).map((goal) => goal.strategyId));
  const derivationRules = derivation.derivationRules ?? [];

  expectEqual(errors, ORIGINALSET_UPGRADES.length, 26, "Originalset upgrade count must stay 26");
  expectEqual(errors, PROTEUS_UPGRADES.length, 13, "Proteus upgrade count must stay 13");
  expectEqual(errors, TEST_UPGRADES.length, 1, "Test fixture upgrade count must stay 1");
  expectEqual(errors, strategyIds.size, 20, "AI030 must not introduce strategy IDs");
  for (const forbidden of ["corp.upgrade", "corp.upgrade_lock", "corp.upgrade_tax"]) {
    if (strategyIds.has(forbidden)) fail(errors, `Forbidden/new strategy ID present: ${forbidden}`);
  }

  for (const key of NO_EFFECT_FLAG_KEYS) {
    if (report.noEffectFlags?.[key] !== false) {
      fail(errors, `Report noEffectFlags.${key} must be false`);
    }
  }
  for (const key of findForbiddenKeys(report)) {
    fail(errors, `AI030 report contains forbidden runtime/private key ${key}`);
  }

  for (const signalId of AI030_NEW_SIGNALS) {
    const signal = signalById.get(signalId);
    if (!signal) {
      fail(errors, `Missing AI030 signal ${signalId}`);
      continue;
    }
    expectEqual(errors, signal.sideScope, "corp", `${signalId} must be sideScope=corp`);
    const rules = derivationRules.filter((rule) => rule.signalId === signalId);
    if (rules.length === 0) fail(errors, `${signalId} must have at least one derivation rule`);
    for (const rule of rules) {
      expectEqual(errors, rule.gates?.side, "corp", `${signalId} rule must be Corp-gated`);
      expectEqual(errors, rule.gates?.cardType, "upgrade", `${signalId} rule must be upgrade-gated`);
      expectEqual(errors, rule.gates?.target, signalId, `${signalId} rule must be target-gated`);
    }
    if (signal.supportOnly === true) {
      expectEqual(errors, signal.mayAnchorStrategy, false, `${signalId} supportOnly cannot anchor`);
      expectArrayEqual(errors, signal.allowedStrategyAnchors ?? [], [], `${signalId} supportOnly anchors`);
    }
  }

  for (const rule of derivationRules.filter(
    (rule) => rule.signalId === "score.advance_burst" && rule.match?.kind === "score_acceleration",
  )) {
    const cardTypes = Array.isArray(rule.gates?.cardType) ? rule.gates.cardType : [rule.gates?.cardType];
    if (cardTypes.includes("upgrade")) {
      fail(errors, "score.advance_burst score_acceleration rule must not include cardType=upgrade");
    }
  }

  for (const cardId of TARGET_CARD_IDS) {
    const active = activeById.get(cardId);
    const compiled = compiledById.get(cardId);
    const inspected = inspectorById.get(cardId);
    if (!active) {
      fail(errors, `Missing active hint ${cardId}`);
      continue;
    }
    if (!compiled) fail(errors, `Missing compiled hint ${cardId}`);
    if (!inspected) {
      fail(errors, `Missing inspector card ${cardId}`);
      continue;
    }
    expectEqual(errors, active.side, "corp", `${cardId} active side`);
    expectEqual(errors, active.cardType, "upgrade", `${cardId} active cardType`);
    expectEqual(errors, compiled?.side, "corp", `${cardId} compiled side`);
    expectEqual(errors, compiled?.cardType, "upgrade", `${cardId} compiled cardType`);

    const activeSignals = active.tacticSignals ?? [];
    if (SIGNAL_EMPTY_ALLOWED.has(cardId)) {
      expectArrayEqual(errors, activeSignals, [], `${cardId} must remain signal-empty`);
      if (!active.no_signal_reason) fail(errors, `${cardId} requires no_signal_reason`);
    } else if (activeSignals.length === 0) {
      fail(errors, `${cardId} has no tacticSignals after AI030`);
    }

    for (const signalId of activeSignals) {
      if (!signalById.has(signalId)) fail(errors, `${cardId} references unknown signal ${signalId}`);
      if (!(inspected.derivedFunctionSignals ?? []).includes(signalId)) {
        fail(errors, `${cardId} active tacticSignal ${signalId} missing from Inspector derivedFunctionSignals`);
      }
    }

    if (active.quality?.hintReviewed !== true) fail(errors, `${cardId} must be hintReviewed`);
    if (active.quality?.needsHumanReview !== false) fail(errors, `${cardId} must clear needsHumanReview`);
    if (!SIGNAL_EMPTY_ALLOWED.has(cardId)) {
      if ((inspected.warningCategories ?? []).includes("legacy_fallback_only")) {
        fail(errors, `${cardId} must not be legacy_fallback_only`);
      }
      if ((inspected.warningCategories ?? []).includes("deferred_requires_human_review")) {
        fail(errors, `${cardId} must not be deferred_requires_human_review`);
      }
    }

    for (const targetProfile of active.targetProfiles ?? []) {
      if (!SAFE_TARGET_POLICIES.has(targetProfile.hiddenInfoPolicy)) {
        fail(errors, `${cardId} targetProfile has unsafe hiddenInfoPolicy ${targetProfile.hiddenInfoPolicy}`);
      }
      if (JSON.stringify(targetProfile).match(/actualHq|hiddenHq|actualRnd|cardInstances|privatePayload/i)) {
        fail(errors, `${cardId} targetProfile contains hidden/private state wording`);
      }
    }

    for (const signalId of inspected.supportingEvidenceOnly ?? []) {
      const signal = signalById.get(signalId);
      if (!signal) continue;
      if (signal.supportOnly === true && (inspected.derivedStrategyAnchors ?? []).some((anchor) => (signal.allowedStrategyAnchors ?? []).includes(anchor))) {
        fail(errors, `${cardId} support-only signal ${signalId} appears to anchor a strategy`);
      }
    }
  }

  for (const cardId of AGENDA_DIFFICULTY_UPGRADES) {
    const inspected = inspectorById.get(cardId);
    const active = activeById.get(cardId);
    if (!(active?.tacticSignals ?? []).includes("score.agenda_difficulty_discount")) {
      fail(errors, `${cardId} must carry score.agenda_difficulty_discount`);
    }
    if (!(active?.tacticSignals ?? []).includes("remote.agenda_difficulty_discount")) {
      fail(errors, `${cardId} must carry remote.agenda_difficulty_discount`);
    }
    if ((inspected?.derivedFunctionSignals ?? []).includes("score.advance_burst")) {
      fail(errors, `${cardId} must not expose score.advance_burst after AI030`);
    }
    if ((inspected?.derivedStrategyAnchors ?? []).includes("corp.fast_advance")) {
      fail(errors, `${cardId} must not derive corp.fast_advance after AI030`);
    }
    if (!(inspected?.cardLevelStrategyAnchors ?? []).includes("corp.remote_scoring")) {
      fail(errors, `${cardId} must retain card-level corp.remote_scoring`);
    }
  }

  const reportById = mapCards(report.cards);
  for (const cardId of TARGET_CARD_IDS) {
    const entry = reportById.get(cardId);
    if (!entry) fail(errors, `AI030 report missing ${cardId}`);
    else if (!entry.activeCompiledInspectorSync?.tacticSignalsVisibleInInspector) {
      fail(errors, `${cardId} report sync flag is false`);
    }
  }

  if (errors.length > 0) {
    console.error(`AI030 corp-upgrade semantics check failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    [
      "AI030_CORP_UPGRADES_SEMANTICS OK",
      `originalset=${ORIGINALSET_UPGRADES.length}`,
      `proteus=${PROTEUS_UPGRADES.length}`,
      `test=${TEST_UPGRADES.length}`,
      `signals=${AI030_NEW_SIGNALS.size}`,
      `inspectorCards=${TARGET_CARD_IDS.length}`,
    ].join(" ") + "\n",
  );
}

function mapCards(cards = []) {
  return new Map(cards.map((card) => [card.cardId, card]));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8"));
}

function fail(errors, message) {
  errors.push(message);
}

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) fail(errors, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function expectArrayEqual(errors, actual, expected, label) {
  const normalizedActual = [...(actual ?? [])].sort();
  const normalizedExpected = [...(expected ?? [])].sort();
  if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) {
    fail(errors, `${label}: expected ${JSON.stringify(normalizedExpected)}, got ${JSON.stringify(normalizedActual)}`);
  }
}

function findForbiddenKeys(value, found = new Set()) {
  if (value === null || typeof value !== "object") return [...found].sort();
  if (Array.isArray(value)) {
    for (const item of value) findForbiddenKeys(item, found);
    return [...found].sort();
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.includes(key)) found.add(key);
    findForbiddenKeys(child, found);
  }
  return [...found].sort();
}

main();
