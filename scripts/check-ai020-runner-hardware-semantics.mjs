#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const CARD_FILES = [
  "data/cards/classic-cards.json",
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
];
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";
const TACTIC_SIGNAL_PATH = "data/ai/tactic-signals-v1.json";
const FUNCTION_DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const REPORT_PATH =
  "docs/reviews/ai/ai020-1-runner-hardware-tactic-signal-cleanup-report-2026-06-02.json";

const EXPECTED_ANCHOR_CARDS = new Map([
  [
    "onr_v1_127_full-body-conversion",
    [{ strategyId: "runner.survival_defense", role: "defensive_tool" }],
  ],
  [
    "onr_v1_129_hq-interface",
    [
      { strategyId: "runner.hq_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_v1_139_r-and-d-interface",
    [
      { strategyId: "runner.rnd_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
]);

const REQUIRED_SIGNALS = [
  "setup.deck_exclusive",
  "economy.recurring_non_noisy_breaker_credit",
  "economy.recurring_killer_credit",
  "economy.recurring_link_credit",
  "economy.recurring_tag_clear_credit",
  "defense.tag_clear_support",
  "defense.finite_damage_prevention",
  "defense.pay_through_prevention",
  "defense.damage_recovery_draw",
  "setup.program_backup",
  "setup.program_recovery",
  "setup.program_trash_replacement",
  "setup.stored_program_reclaim",
  "run.extra_run_after_success",
  "action.recurring_extra_action",
  "risk.brain_damage_self_inflicted",
  "run.break_cost_penalty",
  "defense.ap_damage_mitigation",
  "defense.ap_subroutine_mitigation",
  "run.archives_replacement_access",
  "access.rnd_topdeck_setup",
  "corp.archives_to_rnd_pressure",
  "cost.agenda_point_penalty",
];

const FORBIDDEN_DESCRIPTIVE_SIGNALS = [
  "setup.cybernetics",
  "setup.memory_chip",
  "setup.vehicle",
  "hardware.chip",
  "hardware.cybernetics",
  "hardware.deck",
  "hardware.vehicle",
];

const FORBIDDEN_HARDWARE_TRAIT_TARGETS = [
  "cybernetics",
  "memory_chip",
  "vehicle",
];

const EXPECTED_CARD_SIGNALS = new Map([
  ["onr_v1_120_armadillo-armored-road-home", [
    "defense.meat_damage_prevention",
    "defense.tag_clear_support",
    "economy.recurring_tag_clear_credit",
  ]],
  ["onr_v1_126_drifter-mobile-environment", [
    "defense.tag_clear_support",
    "economy.recurring_tag_clear_credit",
  ]],
  ["onr_v1_135_nasuko-cycle", ["defense.tag_prevention"]],
  ["onr_v1_144_tycho-mem-chip", ["setup.memory"]],
  ["onr_v1_145_wutech-mem-chip", ["setup.memory"]],
  ["onr_v1_146_zetatech-mem-chip", ["setup.memory"]],
  ["onr_v1_124_corolla-speed-chip", ["economy.recurring_killer_credit"]],
  ["onr_v1_147_zz22-speed-chip", ["economy.recurring_killer_credit"]],
  ["onr_v1_133_militech-mram-chip", ["setup.hand_size"]],
  ["onr_v1_134_mram-chip", ["setup.hand_size"]],
  ["onr_proteus_139_eurocorpse-tm-spin-chip", [
    "economy.recurring_breaker_credit",
    "setup.program_host",
  ]],
  ["onr_proteus_134_cortical-cybermodem", [
    "economy.recurring_breaker_credit",
    "setup.deck_exclusive",
    "setup.hand_size",
    "setup.memory",
  ]],
  ["onr_proteus_151_sunburst-cranial-interface", [
    "economy.recurring_non_noisy_breaker_credit",
    "setup.deck_exclusive",
    "setup.hand_size",
    "setup.memory",
  ]],
  ["onr_proteus_138_deck-the", [
    "defense.base_link",
    "setup.deck_exclusive",
    "setup.memory",
  ]],
  ["onr_v1_123_bodyweight-data-creche", [
    "run.extra_run_after_success",
    "setup.deck_exclusive",
    "setup.memory",
  ]],
  ["onr_v1_130_lifesaver-nanosurgeons", [
    "defense.brain_damage_prevention",
    "defense.damage_recovery_draw",
  ]],
  ["onr_proteus_144_lucidrinetm-drip-feed", [
    "action.recurring_extra_action",
    "risk.brain_damage_self_inflicted",
  ]],
  ["onr_v1_132_microtech-trode-set", [
    "defense.ap_subroutine_mitigation",
    "run.break_cost_penalty",
  ]],
  ["onr_v1_142_record-reconstructor", [
    "access.rnd_topdeck_setup",
    "run.archives_replacement_access",
  ]],
]);

const EXPECTED_SUBTYPES = new Map([
  ["onr_v1_120_armadillo-armored-road-home", ["vehicle"]],
  ["onr_v1_126_drifter-mobile-environment", ["vehicle"]],
  ["onr_v1_135_nasuko-cycle", ["vehicle"]],
  ["onr_v1_144_tycho-mem-chip", ["chip"]],
  ["onr_v1_145_wutech-mem-chip", ["chip"]],
  ["onr_v1_146_zetatech-mem-chip", ["chip"]],
  ["onr_v1_124_corolla-speed-chip", ["chip"]],
  ["onr_v1_147_zz22-speed-chip", ["chip"]],
  ["onr_v1_133_militech-mram-chip", ["chip", "cybernetics"]],
  ["onr_v1_134_mram-chip", ["chip", "cybernetics"]],
  ["onr_proteus_139_eurocorpse-tm-spin-chip", ["chip"]],
  ["onr_proteus_134_cortical-cybermodem", ["cybernetics", "deck"]],
  ["onr_proteus_151_sunburst-cranial-interface", ["cybernetics", "deck"]],
  ["onr_proteus_138_deck-the", ["deck"]],
  ["onr_v1_123_bodyweight-data-creche", ["deck"]],
]);

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function runnerHardwareInventory() {
  return CARD_FILES.flatMap((relativePath) => {
    const data = readJson(relativePath);
    return (data.cards ?? [])
      .filter(
        (card) =>
          card.side === "runner" && String(card.type).includes("hardware"),
      )
      .map((card) => ({
        cardId: card.cardId,
        title: card.title,
        setId: card.setId,
        subtypes: card.subtypes ?? [],
      }));
  });
}

function fail(errors, message) {
  errors.push(message);
}

function main() {
  const errors = [];
  const inventory = runnerHardwareInventory();
  const active = readJson(ACTIVE_HINTS_PATH);
  const compiled = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH);
  const derivation = readJson(FUNCTION_DERIVATION_PATH);
  const report = readJson(REPORT_PATH);

  const activeIds = new Set((active.cards ?? []).map((card) => card.cardId));
  const compiledIds = new Set((compiled.cards ?? []).map((card) => card.cardId));
  const activeCompiledHardware = inventory.filter(
    (card) => activeIds.has(card.cardId) && compiledIds.has(card.cardId),
  );
  const inactiveHardware = inventory.filter(
    (card) => !activeIds.has(card.cardId) || !compiledIds.has(card.cardId),
  );
  const reportIds = new Set(report.inventory?.activeCompiledHardwareCardIds ?? []);

  if (activeCompiledHardware.length !== report.summary.activeRunnerHardwareCount) {
    fail(
      errors,
      `activeRunnerHardwareCount mismatch: inventory=${activeCompiledHardware.length} report=${report.summary.activeRunnerHardwareCount}`,
    );
  }
  if ((report.postReviewAssignments ?? []).length !== activeCompiledHardware.length) {
    fail(errors, "postReviewAssignments length does not match active hardware count");
  }
  for (const card of activeCompiledHardware) {
    if (!reportIds.has(card.cardId)) {
      fail(errors, `missing report inventory card ${card.cardId}`);
    }
  }
  if (inactiveHardware.length !== report.summary.inactiveCheckedHardwareCount) {
    fail(
      errors,
      `inactiveCheckedHardwareCount mismatch: inventory=${inactiveHardware.length} report=${report.summary.inactiveCheckedHardwareCount}`,
    );
  }

  const signalIds = new Set((tacticSignals.signals ?? []).map((signal) => signal.signalId));
  for (const signalId of REQUIRED_SIGNALS) {
    if (!signalIds.has(signalId)) fail(errors, `missing AI020 signal ${signalId}`);
  }
  for (const signalId of FORBIDDEN_DESCRIPTIVE_SIGNALS) {
    if (signalIds.has(signalId)) fail(errors, `forbidden descriptive tactic signal cataloged: ${signalId}`);
  }
  for (const rule of derivation.derivationRules ?? []) {
    if (FORBIDDEN_DESCRIPTIVE_SIGNALS.includes(rule.signalId)) {
      fail(errors, `forbidden descriptive derivation rule remains: ${rule.signalId}`);
    }
  }
  for (const signal of tacticSignals.signals ?? []) {
    if (!signal.signalId) continue;
    if (signal.supportOnly && signal.mayAnchorStrategy) {
      fail(errors, `support-only signal mayAnchorStrategy=true: ${signal.signalId}`);
    }
  }

  const inspectorByCard = new Map(
    (inspector.cards ?? []).map((card) => [card.cardId, card]),
  );
  const activeByCard = new Map((active.cards ?? []).map((card) => [card.cardId, card]));
  const compiledByCard = new Map((compiled.cards ?? []).map((card) => [card.cardId, card]));
  const reportByCard = new Map(
    (report.postReviewAssignments ?? []).map((card) => [card.cardId, card]),
  );
  for (const card of activeCompiledHardware) {
    const inspectorCard = inspectorByCard.get(card.cardId);
    const activeCard = activeByCard.get(card.cardId);
    const compiledCard = compiledByCard.get(card.cardId);
    const reportCard = reportByCard.get(card.cardId);
    if (!inspectorCard) fail(errors, `missing inspector card ${card.cardId}`);
    if (!reportCard) {
      fail(errors, `missing post-review card ${card.cardId}`);
      continue;
    }
    for (const signal of reportCard.tacticSignals ?? []) {
      if (!signalIds.has(signal)) {
        fail(errors, `uncataloged tactic signal ${signal} on ${card.cardId}`);
      }
      if (FORBIDDEN_DESCRIPTIVE_SIGNALS.includes(signal)) {
        fail(errors, `forbidden descriptive report signal ${signal} on ${card.cardId}`);
      }
    }
    for (const signal of inspectorCard?.derivedFunctionSignals ?? []) {
      if (FORBIDDEN_DESCRIPTIVE_SIGNALS.includes(signal)) {
        fail(errors, `forbidden descriptive inspector signal ${signal} on ${card.cardId}`);
      }
    }
    for (const hintCard of [activeCard, compiledCard]) {
      for (const effect of hintCard?.effects ?? []) {
        if (
          effect.kind === "hardware_trait" &&
          FORBIDDEN_HARDWARE_TRAIT_TARGETS.includes(effect.target)
        ) {
          fail(errors, `forbidden descriptive hardware_trait ${effect.target} on ${card.cardId}`);
        }
      }
    }
    for (const expectedSignal of EXPECTED_CARD_SIGNALS.get(card.cardId) ?? []) {
      if (!(inspectorCard?.derivedFunctionSignals ?? []).includes(expectedSignal)) {
        fail(errors, `missing functional signal ${expectedSignal} on ${card.cardId}`);
      }
    }
    for (const expectedSubtype of EXPECTED_SUBTYPES.get(card.cardId) ?? []) {
      if (!(card.subtypes ?? []).includes(expectedSubtype)) {
        fail(errors, `missing card-data subtype ${expectedSubtype} on ${card.cardId}`);
      }
    }
    const expectedPairs = EXPECTED_ANCHOR_CARDS.get(card.cardId) ?? [];
    const pairKeys = new Set(
      (reportCard.strategySupportPairs ?? []).map(
        (pair) => `${pair.strategyId}:${pair.role}`,
      ),
    );
    for (const pair of expectedPairs) {
      if (!pairKeys.has(`${pair.strategyId}:${pair.role}`)) {
        fail(errors, `missing strategySupportPair ${pair.strategyId}:${pair.role} on ${card.cardId}`);
      }
    }
    if (expectedPairs.length === 0) {
      if ((reportCard.strategyAnchors ?? []).length > 0) {
        fail(errors, `unexpected strategy anchor on ${card.cardId}`);
      }
      if ((reportCard.strategySupportPairs ?? []).length > 0) {
        fail(errors, `unexpected strategySupportPairs on ${card.cardId}`);
      }
    }
    if (
      (inspectorCard?.derivedStrategyAnchors ?? []).length > 0 &&
      !["onr_v1_129_hq-interface", "onr_v1_139_r-and-d-interface"].includes(
        card.cardId,
      )
    ) {
      fail(errors, `unexpected derived strategy anchor on ${card.cardId}`);
    }
  }

  const microtechBackup = reportByCard.get("onr_v1_131_microtech-backup-drive");
  if (microtechBackup?.strategyAnchors?.includes("runner.search.breaker")) {
    fail(errors, "Microtech Backup Drive has runner.search.breaker anchor");
  }
  const trode = inspectorByCard.get("onr_v1_132_microtech-trode-set");
  if ((trode?.derivedFunctionSignals ?? []).some((signal) => signal.startsWith("breaker."))) {
    fail(errors, "Microtech Trode Set derives breaker coverage");
  }
  for (const flag of [
    "plannerEffect",
    "engineEffect",
    "legalEffect",
    "targetingAiEffect",
  ]) {
    if (report.summary?.[flag] !== false) fail(errors, `${flag} is not false`);
  }

  if (errors.length > 0) {
    console.error(`AI020_RUNNER_HARDWARE_SEMANTICS FAIL errors=${errors.length}`);
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exit(1);
  }
  console.log(
    `AI020_RUNNER_HARDWARE_SEMANTICS OK active=${activeCompiledHardware.length} inactive=${inactiveHardware.length} postReview=${report.postReviewAssignments.length} requiredSignals=${REQUIRED_SIGNALS.length} removedSubtypeSignals=${FORBIDDEN_DESCRIPTIVE_SIGNALS.slice(0, 3).length}`,
  );
}

main();
