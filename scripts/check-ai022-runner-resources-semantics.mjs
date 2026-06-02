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
const REPORT_PATH =
  "docs/reviews/ai/ai022-runner-resources-semantics-review-report-2026-06-02.json";

const EXPECTED_ANCHOR_CARDS = new Map([
  [
    "onr_proteus_128_airport-locker",
    [{ strategyId: "runner.search.breaker", role: "engine_anchor" }],
  ],
  [
    "onr_v1_177_the-short-circuit",
    [{ strategyId: "runner.search.breaker", role: "enabler" }],
  ],
  [
    "onr_proteus_142_hq-mole",
    [
      { strategyId: "runner.hq_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_proteus_147_r-and-d-mole",
    [
      { strategyId: "runner.rnd_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_proteus_136_credit-subversion",
    [{ strategyId: "runner.hq_pressure", role: "sabotage_payoff" }],
  ],
  [
    "onr_proteus_137_death-from-above",
    [
      { strategyId: "runner.remote_contest", role: "sabotage_payoff" },
      { strategyId: "runner.remote_trash", role: "sabotage_payoff" },
    ],
  ],
  [
    "onr_proteus_146_precision-bribery",
    [{ strategyId: "runner.remote_contest", role: "lock_piece" }],
  ],
  [
    "onr_v1_173_restrictive-net-zoning",
    [{ strategyId: "runner.remote_contest", role: "tax_enabler" }],
  ],
  [
    "onr_v1_156_corporate-ally",
    [{ strategyId: "runner.remote_contest", role: "score_denial" }],
  ],
  [
    "onr_v1_160_diplomatic-immunity",
    [{ strategyId: "runner.survival_defense", role: "defensive_tool" }],
  ],
  [
    "onr_v1_187_wilson-weeflerunner-apprentice",
    [{ strategyId: "runner.survival_defense", role: "defensive_tool" }],
  ],
]);

const SIMPLE_SUPPORT_ONLY_CARDS = [
  "onr_v1_148_access-through-alpha",
  "onr_v1_149_access-to-arasaka",
  "onr_v1_150_access-to-kiribati",
  "onr_v1_152_back-door-to-hilliard",
  "onr_v1_153_back-door-to-orbital-air",
  "onr_v1_154_broker",
  "onr_v1_158_danshis-second-id",
  "onr_v1_159_databroker",
  "onr_v1_161_fall-guy",
  "onr_v1_163_floating-runner-bbs",
  "onr_v1_164_hells-run",
  "onr_v1_165_junkyard-bbs",
  "onr_v1_168_loan-from-chiba",
  "onr_v1_169_n-e-t-o",
  "onr_v1_170_nomad-allies",
  "onr_v1_181_the-springboard",
  "onr_v1_182_submarine-uplink",
  "onr_v1_185_trauma-team",
  "onr_proteus_130_back-door-to-rivals",
  "onr_proteus_132_bolt-hole",
  "onr_proteus_133_chiba-bank-account",
  "onr_proteus_140_expendable-family-member",
  "onr_proteus_143_liberated-savings-account",
  "onr_proteus_148_runner-sensei",
  "onr_proteus_150_streetware-distributor",
  "onr_proteus_152_swiss-bank-account",
  "onr_proteus_154_wired-switchboard",
];

const REQUIRED_SIGNALS_BY_CARD = new Map([
  ["onr_proteus_128_airport-locker", ["resource.hidden", "hidden.runner_resource", "setup.program_search", "setup.program_install", "setup.install_during_run"]],
  ["onr_v1_177_the-short-circuit", ["resource.bbs", "setup.program_search", "setup.card_search", "setup.search_reveals_to_corp"]],
  ["onr_v1_151_aujourdoui", ["resource.bbs", "setup.stack_filter", "setup.program_search", "setup.search_reveals_to_corp"]],
  ["onr_v1_169_n-e-t-o", ["resource.bbs", "setup.stack_filter", "setup.prep_resource_search", "setup.search_reveals_to_corp"]],
  ["onr_v1_175_ronin-around", ["resource.bbs", "setup.stack_filter", "setup.hardware_search", "setup.search_reveals_to_corp"]],
  ["onr_v1_165_junkyard-bbs", ["resource.bbs", "setup.top_trash_recovery", "setup.recovery"]],
  ["onr_proteus_142_hq-mole", ["resource.hidden", "access.hq_multiaccess", "access.hq_hidden_multiaccess"]],
  ["onr_proteus_147_r-and-d-mole", ["resource.hidden", "access.rnd_multiaccess", "access.rnd_hidden_multiaccess"]],
  ["onr_proteus_145_mercenary-subcontract", ["resource.hidden", "resource.sabotage", "access.free_trash", "access.trash_untrashable", "access.current_access_trash"]],
  ["onr_proteus_137_death-from-above", ["resource.hidden", "resource.sabotage", "access.remote_full_trash", "remote.full_fort_trash", "access.trash_untrashable"]],
  ["onr_proteus_146_precision-bribery", ["resource.unique", "fort.creation_lock"]],
  ["onr_v1_173_restrictive-net-zoning", ["remote.install_ice_tax", "fort.install_ice_tax"]],
  ["onr_v1_156_corporate-ally", ["resource.connection", "resource.unique", "remote.agenda_difficulty_tax", "cost.agenda_point_penalty"]],
  ["onr_proteus_129_back-door-to-netwatch", ["resource.hidden", "defense.trace_cancel", "defense.trace_cancel_bad_publicity", "corp.bad_publicity_pressure"]],
  ["onr_v1_155_code-viral-cache", ["virus.counter_protection", "virus.purge_resistance", "virus.counter_retention", "virus.support"]],
  ["onr_proteus_149_simulacrum", ["resource.hidden", "run.bypass_ap_ice", "defense.ap_ice_bypass", "run.encounter_escape"]],
]);

const FORBIDDEN_STRATEGIES = [
  "runner.resource",
  "runner.hidden_resource",
  "runner.connection",
  "runner.virus",
];

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function runnerResourceInventory() {
  return CARD_FILES.flatMap((relativePath) => {
    const data = readJson(relativePath);
    return (data.cards ?? [])
      .filter((card) => card.side === "runner" && card.type === "resource")
      .map((card) => ({
        cardId: card.cardId,
        title: card.title,
        subtypes: card.subtypes ?? [],
      }));
  });
}

function fail(errors, message) {
  errors.push(message);
}

function main() {
  const errors = [];
  const inventory = runnerResourceInventory();
  const active = readJson(ACTIVE_HINTS_PATH);
  const compiled = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH);
  const report = readJson(REPORT_PATH);

  const activeIds = new Set((active.cards ?? []).map((card) => card.cardId));
  const compiledIds = new Set((compiled.cards ?? []).map((card) => card.cardId));
  const activeCompiledResources = inventory.filter(
    (card) => activeIds.has(card.cardId) && compiledIds.has(card.cardId),
  );
  const inactiveResources = inventory.filter(
    (card) => !activeIds.has(card.cardId) || !compiledIds.has(card.cardId),
  );
  const signalIds = new Set((tacticSignals.signals ?? []).map((signal) => signal.signalId));
  const inspectorByCard = new Map((inspector.cards ?? []).map((card) => [card.cardId, card]));
  const reportByCard = new Map(
    (report.postReviewAssignments ?? []).map((card) => [card.cardId, card]),
  );

  if (report.schemaVersion !== "ai022-runner-resources-semantics-review-report-v1") {
    fail(errors, "unexpected report schemaVersion");
  }
  if (activeCompiledResources.length !== report.summary.activeRunnerResourceCount) {
    fail(errors, `activeRunnerResourceCount mismatch inventory=${activeCompiledResources.length} report=${report.summary.activeRunnerResourceCount}`);
  }
  if ((report.postReviewAssignments ?? []).length !== activeCompiledResources.length) {
    fail(errors, "postReviewAssignments length does not match active Resource count");
  }
  if (inactiveResources.length !== report.summary.inactiveCheckedResourceCount) {
    fail(errors, `inactiveCheckedResourceCount mismatch inventory=${inactiveResources.length} report=${report.summary.inactiveCheckedResourceCount}`);
  }
  if (report.summary.hiddenResourceCount !== 16) {
    fail(errors, `hiddenResourceCount expected=16 report=${report.summary.hiddenResourceCount}`);
  }
  if (report.summary.newStrategyIdCount !== 0) {
    fail(errors, "AI022 must not introduce a new Strategy ID");
  }
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
    if (report.summary?.[flag] !== false) fail(errors, `${flag} is not false`);
  }

  for (const forbidden of FORBIDDEN_STRATEGIES) {
    if ((report.newStrategyIds ?? []).some((entry) => entry.strategyId === forbidden || entry === forbidden)) {
      fail(errors, `forbidden new strategy ${forbidden}`);
    }
  }

  for (const card of activeCompiledResources) {
    const inspectorCard = inspectorByCard.get(card.cardId);
    const reportCard = reportByCard.get(card.cardId);
    if (!inspectorCard) fail(errors, `missing inspector card ${card.cardId}`);
    if (!reportCard) {
      fail(errors, `missing post-review assignment ${card.cardId}`);
      continue;
    }
    for (const signal of reportCard.tacticSignals ?? []) {
      if (!signalIds.has(signal)) fail(errors, `uncataloged tactic signal ${signal} on ${card.cardId}`);
      if (signal === "runner.resource" || signal === "runner.hidden_resource" || signal === "runner.connection") {
        fail(errors, `forbidden generic Resource signal ${signal} on ${card.cardId}`);
      }
    }
    for (const signal of inspectorCard?.derivedFunctionSignals ?? []) {
      const allowedAirportBreakerSearch =
        card.cardId === "onr_proteus_128_airport-locker" &&
        ["breaker.emergency_search", "breaker.search_during_encounter"].includes(
          signal,
        );
      if (signal.startsWith("breaker.") && !allowedAirportBreakerSearch) {
        fail(errors, `Resource derives breaker coverage ${signal} on ${card.cardId}`);
      }
      if (signal === "runner.resource" || signal === "runner.hidden_resource" || signal === "runner.connection") {
        fail(errors, `forbidden inspector Resource signal ${signal} on ${card.cardId}`);
      }
    }
    if (card.subtypes.includes("hidden")) {
      if (!reportCard.isHiddenResource) fail(errors, `hidden resource not marked ${card.cardId}`);
      if (!["runner_side_only", "public_after_use", "public_after_trash"].includes(reportCard.hiddenInfoPolicy)) {
        fail(errors, `hidden resource has bad hiddenInfoPolicy ${card.cardId}: ${reportCard.hiddenInfoPolicy}`);
      }
      for (const required of ["resource.hidden", "hidden.runner_resource"]) {
        if (!(reportCard.tacticSignals ?? []).includes(required)) {
          fail(errors, `hidden resource missing ${required} on ${card.cardId}`);
        }
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
      const unexpectedLegacyRoles = (reportCard.legacyStrategicRole ?? []).filter(
        (role) => role !== "support_tool",
      );
      if (unexpectedLegacyRoles.length > 0) {
        fail(errors, `canonical strategic role without anchor on ${card.cardId}: ${unexpectedLegacyRoles.join(",")}`);
      }
    }
    for (const pair of reportCard.strategySupportPairs ?? []) {
      if (!pair.strategyId) fail(errors, `strategySupportPair without strategyId on ${card.cardId}`);
      if (!pair.role) fail(errors, `strategySupportPair without role on ${card.cardId}`);
      if (!(reportCard.strategyAnchors ?? []).includes(pair.strategyId)) {
        fail(errors, `strategySupportPair strategy not present in anchors on ${card.cardId}: ${pair.strategyId}`);
      }
      if (FORBIDDEN_STRATEGIES.includes(pair.strategyId)) {
        fail(errors, `forbidden strategySupportPair strategy ${pair.strategyId} on ${card.cardId}`);
      }
    }
  }

  for (const cardId of SIMPLE_SUPPORT_ONLY_CARDS) {
    const reportCard = reportByCard.get(cardId);
    if ((reportCard?.strategyAnchors ?? []).length > 0) {
      fail(errors, `simple support Resource has strategy anchor ${cardId}`);
    }
  }
  for (const [cardId, signals] of REQUIRED_SIGNALS_BY_CARD) {
    const reportSignals = reportByCard.get(cardId)?.tacticSignals ?? [];
    const inspectorSignals = inspectorByCard.get(cardId)?.derivedFunctionSignals ?? [];
    for (const signal of signals) {
      if (!reportSignals.includes(signal)) fail(errors, `missing report signal ${signal} on ${cardId}`);
      if (!inspectorSignals.includes(signal)) fail(errors, `missing inspector signal ${signal} on ${cardId}`);
    }
  }
  const airport = reportByCard.get("onr_proteus_128_airport-locker");
  if (!airport?.strategyAnchors?.includes("runner.search.breaker")) {
    fail(errors, "Airport Locker lost runner.search.breaker anchor");
  }
  const simulacrumSignals = inspectorByCard.get("onr_proteus_149_simulacrum")?.derivedFunctionSignals ?? [];
  if (simulacrumSignals.some((signal) => signal.startsWith("breaker."))) {
    fail(errors, "Simulacrum derives breaker coverage");
  }
  const badPublicityDecision = report.deferredItems?.find(
    (item) => item.topic === "runner.bad_publicity_pressure",
  );
  if (!badPublicityDecision || badPublicityDecision.decision !== "deferred") {
    fail(errors, "bad-publicity decision must be deferred");
  }
  for (const signal of tacticSignals.signals ?? []) {
    if (signal.supportOnly && signal.mayAnchorStrategy) {
      fail(errors, `support-only signal mayAnchorStrategy=true: ${signal.signalId}`);
    }
  }

  if (errors.length > 0) {
    console.error(`AI022_RUNNER_RESOURCES_SEMANTICS FAIL errors=${errors.length}`);
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exit(1);
  }
  console.log(
    `AI022_RUNNER_RESOURCES_SEMANTICS OK active=${activeCompiledResources.length} inactive=${inactiveResources.length} hidden=${report.summary.hiddenResourceCount} postReview=${report.postReviewAssignments.length} pairs=${report.summary.strategySupportPairCount}`,
  );
}

main();
