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
  "docs/reviews/ai/ai021-runner-preps-semantics-review-report-2026-06-02.json";

const EXPECTED_ANCHOR_CARDS = new Map([
  [
    "onr_v1_078_arasaka-owns-you",
    [{ strategyId: "runner.survival_defense", role: "emergency_tool" }],
  ],
  [
    "onr_v1_081_custodial-position",
    [
      { strategyId: "runner.rnd_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_v1_084_edited-shipping-manifests",
    [{ strategyId: "runner.hq_pressure", role: "payoff_anchor" }],
  ],
  [
    "onr_v1_085_executive-wiretaps",
    [
      { strategyId: "runner.hq_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_v1_087_forgotten-backup-chip",
    [{ strategyId: "runner.search.breaker", role: "enabler" }],
  ],
  [
    "onr_v1_096_kilroy-was-here",
    [{ strategyId: "runner.rnd_pressure", role: "payoff_anchor" }],
  ],
  [
    "onr_v1_105_priority-wreck",
    [{ strategyId: "runner.hq_pressure", role: "payoff_anchor" }],
  ],
  [
    "onr_v1_106_private-ldl-access",
    [{ strategyId: "runner.rnd_pressure", role: "enabler" }],
  ],
  [
    "onr_v1_107_romp-through-hq",
    [{ strategyId: "runner.hq_pressure", role: "payoff_anchor" }],
  ],
  [
    "onr_v1_110_sneak-preview",
    [{ strategyId: "runner.search.breaker", role: "enabler" }],
  ],
  [
    "onr_v1_114_temple-microcode-outlet",
    [{ strategyId: "runner.search.breaker", role: "enabler" }],
  ],
  [
    "onr_proteus_101_all-hands",
    [
      { strategyId: "runner.hq_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_proteus_102_blackmail",
    [
      { strategyId: "runner.hq_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_proteus_119_promises-promises",
    [{ strategyId: "runner.interface_closeout", role: "payoff_anchor" }],
  ],
  [
    "onr_proteus_122_rush-hour",
    [
      { strategyId: "runner.rnd_pressure", role: "payoff_anchor" },
      { strategyId: "runner.interface_closeout", role: "payoff_anchor" },
    ],
  ],
  [
    "onr_proteus_126_test-spin",
    [{ strategyId: "runner.search.breaker", role: "enabler" }],
  ],
]);

const SIMPLE_SUPPORT_ONLY_CARDS = [
  "onr_v1_079_bodyweight-synthetic-blood",
  "onr_v1_095_jack-n-joe",
  "onr_v1_097_livewires-contacts",
  "onr_v1_108_score",
  "onr_proteus_103_cruising-for-netwatch",
  "onr_proteus_107_drone-for-a-day",
  "onr_proteus_124_stakeout",
];

const NO_BREAKER_SEARCH_ANCHOR = [
  "onr_v1_089_gideons-pawnshop",
  "onr_v1_093_if-you-want-it-done-right",
  "onr_v1_099_mantis-fixer-at-large",
];

const REQUIRED_SIGNALS_BY_CARD = new Map([
  ["onr_proteus_101_all-hands", ["access.hq_multiaccess", "run.noisy_breaker_restriction"]],
  ["onr_v1_085_executive-wiretaps", ["access.hq_multiaccess"]],
  ["onr_proteus_122_rush-hour", ["access.rnd_multiaccess", "run.noisy_breaker_restriction"]],
  ["onr_v1_081_custodial-position", ["access.rnd_multiaccess"]],
  ["onr_v1_096_kilroy-was-here", ["access.rnd_trash_pressure", "access.free_trash"]],
  ["onr_v1_107_romp-through-hq", ["access.hq_trash_pressure", "access.free_trash"]],
  ["onr_proteus_102_blackmail", ["score.agenda_point_gain"]],
  ["onr_proteus_119_promises-promises", ["score.bonus_agenda_point", "access.next_agenda_bonus"]],
  ["onr_v1_087_forgotten-backup-chip", ["setup.program_recovery"]],
  ["onr_v1_110_sneak-preview", ["setup.program_search", "setup.program_install", "setup.temporary_program_install"]],
  ["onr_v1_114_temple-microcode-outlet", ["setup.program_search"]],
  ["onr_proteus_126_test-spin", ["setup.program_search", "setup.program_install", "setup.temporary_program_install"]],
]);

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function fail(errors, message) {
  errors.push(message);
}

function runnerPrepInventory() {
  return CARD_FILES.flatMap((relativePath) => {
    const data = readJson(relativePath);
    return (data.cards ?? [])
      .filter((card) => card.side === "runner" && card.type === "event")
      .map((card) => ({
        cardId: card.cardId,
        title: card.title,
        source: relativePath,
      }));
  });
}

function main() {
  const errors = [];
  const inventory = runnerPrepInventory();
  const active = readJson(ACTIVE_HINTS_PATH);
  const compiled = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const tacticSignals = readJson(TACTIC_SIGNAL_PATH);
  const report = readJson(REPORT_PATH);

  const activeIds = new Set((active.cards ?? []).map((card) => card.cardId));
  const compiledIds = new Set((compiled.cards ?? []).map((card) => card.cardId));
  const activeCompiledPreps = inventory.filter(
    (card) => activeIds.has(card.cardId) && compiledIds.has(card.cardId),
  );
  const inactivePreps = inventory.filter(
    (card) => !activeIds.has(card.cardId) || !compiledIds.has(card.cardId),
  );
  const signalIds = new Set((tacticSignals.signals ?? []).map((signal) => signal.signalId));
  const inspectorByCard = new Map(
    (inspector.cards ?? []).map((card) => [card.cardId, card]),
  );
  const reportByCard = new Map(
    (report.postReviewAssignments ?? []).map((card) => [card.cardId, card]),
  );

  if (report.schemaVersion !== "ai021-runner-preps-semantics-review-report-v1") {
    fail(errors, "unexpected report schemaVersion");
  }
  if (activeCompiledPreps.length !== report.summary.activeRunnerPrepCount) {
    fail(errors, `activeRunnerPrepCount mismatch inventory=${activeCompiledPreps.length} report=${report.summary.activeRunnerPrepCount}`);
  }
  if ((report.postReviewAssignments ?? []).length !== activeCompiledPreps.length) {
    fail(errors, "postReviewAssignments length does not match active Prep count");
  }
  if (inactivePreps.length !== report.summary.inactiveCheckedPrepCount) {
    fail(errors, `inactiveCheckedPrepCount mismatch inventory=${inactivePreps.length} report=${report.summary.inactiveCheckedPrepCount}`);
  }
  if (report.summary.newStrategyIdCount !== 0) {
    fail(errors, "AI021 must not introduce a new Strategy ID");
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
  ]) {
    if (report.summary?.[flag] !== false) fail(errors, `${flag} is not false`);
  }

  for (const card of activeCompiledPreps) {
    const inspectorCard = inspectorByCard.get(card.cardId);
    const reportCard = reportByCard.get(card.cardId);
    if (!inspectorCard) fail(errors, `missing inspector card ${card.cardId}`);
    if (!reportCard) {
      fail(errors, `missing post-review assignment ${card.cardId}`);
      continue;
    }
    for (const signal of reportCard.tacticSignals ?? []) {
      if (!signalIds.has(signal)) fail(errors, `uncataloged tactic signal ${signal} on ${card.cardId}`);
      if (signal === "runner.prep") fail(errors, `generic runner.prep signal on ${card.cardId}`);
    }
    const pairKeys = new Set(
      (reportCard.strategySupportPairs ?? []).map(
        (pair) => `${pair.strategyId}:${pair.role}`,
      ),
    );
    const expectedPairs = EXPECTED_ANCHOR_CARDS.get(card.cardId) ?? [];
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
    }
    if ((inspectorCard?.derivedStrategyAnchors ?? []).includes("corp.fast_advance")) {
      fail(errors, `Runner Prep derives corp.fast_advance on ${card.cardId}`);
    }
  }

  for (const cardId of SIMPLE_SUPPORT_ONLY_CARDS) {
    const reportCard = reportByCard.get(cardId);
    if ((reportCard?.strategyAnchors ?? []).length > 0) {
      fail(errors, `simple support Prep has strategy anchor ${cardId}`);
    }
  }
  for (const cardId of NO_BREAKER_SEARCH_ANCHOR) {
    const reportCard = reportByCard.get(cardId);
    if ((reportCard?.strategyAnchors ?? []).includes("runner.search.breaker")) {
      fail(errors, `generic search/recovery Prep has runner.search.breaker ${cardId}`);
    }
  }
  for (const [cardId, signals] of REQUIRED_SIGNALS_BY_CARD) {
    const inspectorSignals = inspectorByCard.get(cardId)?.derivedFunctionSignals ?? [];
    for (const signal of signals) {
      if (!inspectorSignals.includes(signal)) {
        fail(errors, `missing derived signal ${signal} on ${cardId}`);
      }
    }
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
    console.error(`AI021_RUNNER_PREPS_SEMANTICS FAIL errors=${errors.length}`);
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exit(1);
  }
  console.log(
    `AI021_RUNNER_PREPS_SEMANTICS OK active=${activeCompiledPreps.length} inactive=${inactivePreps.length} postReview=${report.postReviewAssignments.length} pairs=${report.summary.strategySupportPairCount}`,
  );
}

main();
