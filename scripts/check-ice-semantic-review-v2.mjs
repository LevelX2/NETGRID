import fs from "node:fs";

const reviewPath =
  "docs/reviews/ai/ice-ai-hints-critical-review-v2-input-2026-07-03.json";
const hintsPath = "data/ai/ai-card-hints-active.json";
const signalsPath = "data/ai/tactic-signals-v1.json";

const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
const hints = JSON.parse(fs.readFileSync(hintsPath, "utf8"));
const signals = JSON.parse(fs.readFileSync(signalsPath, "utf8"));

const errors = [];

function fail(message) {
  errors.push(message);
}

function sortObjectByKey(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function expectEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(
        actual,
      )}`,
    );
  }
}

function byCardTitle(recommendations, title) {
  return recommendations.find((entry) => entry.title === title);
}

const recommendations = review.fullFinalRecommendations ?? [];
if (review.schemaVersion !== "netgrid.ai.ice-critical-review.v2") {
  fail(`Unexpected review schemaVersion: ${review.schemaVersion}`);
}
if (recommendations.length !== 114) {
  fail(`Expected 114 ICE recommendations, got ${recommendations.length}`);
}

const cardById = new Map((hints.cards ?? []).map((card) => [card.cardId, card]));
const signalById = new Map(
  (signals.signals ?? []).map((signal) => [signal.signalId, signal]),
);

const usedSignals = new Set();
const strategyCounts = {};
let anchoredCards = 0;
let supportOnlyCards = 0;
let strategySupportPairCount = 0;

for (const entry of recommendations) {
  const card = cardById.get(entry.cardId);
  if (!card) {
    fail(`Missing reviewed ICE hint: ${entry.cardId}`);
    continue;
  }
  if (card.side !== "corp" || card.cardType !== "ice") {
    fail(`${entry.cardId}: expected Corp ICE, got ${card.side}/${card.cardType}`);
  }

  const expectedSignals = entry.finalTacticSignals ?? [];
  const expectedLineSupport = entry.finalLineSupport ?? [];
  const expectedStrategicRole = entry.finalStrategicRole ?? [];
  const expectedPairs = entry.finalStrategySupportPairs ?? [];

  expectEqual(card.tacticSignals ?? [], expectedSignals, `${entry.cardId}.tacticSignals`);
  expectEqual(card.lineSupport ?? [], expectedLineSupport, `${entry.cardId}.lineSupport`);
  expectEqual(card.strategicRole ?? [], expectedStrategicRole, `${entry.cardId}.strategicRole`);
  expectEqual(
    card.strategySupportPairs ?? [],
    expectedPairs,
    `${entry.cardId}.strategySupportPairs`,
  );

  for (const signalId of expectedSignals) {
    usedSignals.add(signalId);
  }

  if (expectedPairs.length) {
    anchoredCards += 1;
  } else {
    supportOnlyCards += 1;
    if ((card.lineSupport ?? []).length || (card.strategicRole ?? []).length) {
      fail(`${entry.cardId}: support-only card has loose line/role anchors`);
    }
  }

  strategySupportPairCount += expectedPairs.length;
  for (const pair of expectedPairs) {
    strategyCounts[pair.strategyId] = (strategyCounts[pair.strategyId] ?? 0) + 1;
    if (!expectedStrategicRole.includes(pair.role)) {
      fail(`${entry.cardId}: pair role ${pair.role} is not in strategicRole`);
    }
    if (!expectedLineSupport.includes(pair.strategyId)) {
      fail(`${entry.cardId}: pair strategy ${pair.strategyId} is not in lineSupport`);
    }
    for (const evidenceSignal of pair.evidence ?? []) {
      if (!expectedSignals.includes(evidenceSignal)) {
        fail(
          `${entry.cardId}: pair ${pair.strategyId}/${pair.roleDetail} evidence ${evidenceSignal} is not in tacticSignals`,
        );
      }
    }
  }

  if (
    !Array.isArray(card.manualNotes) ||
    !card.manualNotes.some((note) =>
      String(note).startsWith("ICE-V2: Target/Constraints:"),
    )
  ) {
    fail(`${entry.cardId}: missing ICE-V2 target/constraint manual note`);
  }
  if (card.quality?.reviewedDate !== "2026-07-03") {
    fail(`${entry.cardId}: missing 2026-07-03 quality review stamp`);
  }
  if (card.quality?.hintReviewed !== true) {
    fail(`${entry.cardId}: hintReviewed is not true`);
  }
  if (card.quality?.strategyCovered !== (expectedPairs.length > 0)) {
    fail(`${entry.cardId}: strategyCovered does not match final pair presence`);
  }
}

const missingSignals = [...usedSignals].filter((signalId) => !signalById.has(signalId));
if (missingSignals.length) {
  fail(`Missing tactic signals: ${missingSignals.join(", ")}`);
}

const expectedSummary = review.summary?.v2 ?? {};
expectEqual(anchoredCards, expectedSummary.cardsWithStrategyAnchor, "anchoredCards");
expectEqual(
  supportOnlyCards,
  expectedSummary.corpIce - expectedSummary.cardsWithStrategyAnchor,
  "supportOnlyCards",
);
expectEqual(
  strategySupportPairCount,
  expectedSummary.strategySupportPairs,
  "strategySupportPairCount",
);
expectEqual(
  sortObjectByKey(strategyCounts),
  sortObjectByKey(expectedSummary.anchorOccurrences ?? {}),
  "strategyAnchorCounts",
);

const expectedSignalAnchors = {
  "corp_ice.multi_program_trash": ["corp.ice_tax_glacier"],
  "damage.corp_persistent_damage_counter": ["corp.damage_kill"],
  "run.corp_redirect": [
    "corp.central_stabilize",
    "corp.ice_tax_glacier",
    "corp.remote_scoring",
  ],
  "run.corp_run_rewind": ["corp.ice_tax_glacier"],
};
for (const [signalId, expectedAnchors] of Object.entries(expectedSignalAnchors)) {
  const signal = signalById.get(signalId);
  if (!signal) {
    fail(`Missing ICE-v2 signal: ${signalId}`);
    continue;
  }
  if (signal.supportOnly !== false || signal.mayAnchorStrategy !== true) {
    fail(`${signalId}: ICE-v2 signal must be explicitly anchor-capable`);
  }
  expectEqual(
    signal.allowedStrategyAnchors ?? [],
    expectedAnchors,
    `${signalId}.allowedStrategyAnchors`,
  );
  if (!String(signal.notes ?? "").includes("read-only")) {
    fail(`${signalId}: missing read-only safety note`);
  }
}

function expectCardSignals(title, expectedPresent, expectedAbsent) {
  const entry = byCardTitle(recommendations, title);
  const card = entry ? cardById.get(entry.cardId) : null;
  if (!entry || !card) {
    fail(`${title}: missing card for card-specific signal guard`);
    return;
  }
  const signalsForCard = card.tacticSignals ?? [];
  for (const signalId of expectedPresent) {
    if (!signalsForCard.includes(signalId)) fail(`${title}: missing ${signalId}`);
  }
  for (const signalId of expectedAbsent) {
    if (signalsForCard.includes(signalId)) fail(`${title}: forbidden ${signalId}`);
  }
}

function expectCardStrategies(title, expectedPresent, expectedAbsent = []) {
  const entry = byCardTitle(recommendations, title);
  const card = entry ? cardById.get(entry.cardId) : null;
  if (!entry || !card) {
    fail(`${title}: missing card for card-specific strategy guard`);
    return;
  }
  const strategies = (card.strategySupportPairs ?? []).map((pair) => pair.strategyId);
  expectEqual(strategies, expectedPresent, `${title}.strategyIds`);
  for (const strategyId of expectedAbsent) {
    if (strategies.includes(strategyId)) fail(`${title}: forbidden ${strategyId}`);
  }
}

expectCardSignals("Cortical Scrub", [], ["corp_ice.program_trash"]);
expectCardStrategies("Cortical Scrub", ["corp.damage_kill"], ["corp.ice_tax_glacier"]);

expectCardSignals("Data Darts", ["corp_ice.next_ice_break_lock", "corp_ice.run_lock"], []);
expectCardStrategies("Data Darts", ["corp.damage_kill", "corp.ice_tax_glacier"]);

expectCardSignals("Neural Blade", ["corp_ice.next_ice_break_lock", "corp_ice.run_lock"], []);
expectCardStrategies("Neural Blade", ["corp.ice_tax_glacier"], ["corp.damage_kill"]);

expectCardSignals("Bolter Cluster", ["corp_ice.next_ice_break_lock"], ["corp_ice.encounter_tax"]);
expectCardStrategies("Bolter Cluster", ["corp.damage_kill", "corp.ice_tax_glacier"]);

expectCardSignals("Colonel Failure", ["corp_ice.multi_program_trash"], []);
expectCardStrategies("Colonel Failure", ["corp.ice_tax_glacier"]);

expectCardSignals("Hunting Pack", ["corp_ice.trace_source", "trace.source"], [
  "ice.strength_modifier",
]);
expectCardStrategies("Hunting Pack", ["corp.ice_tax_glacier", "corp.tag_trace_punish"]);

expectCardSignals("Pocket Virtual Reality", ["trace.corp_credit_support"], []);
expectCardStrategies("Pocket Virtual Reality", ["corp.tag_trace_punish"]);

expectCardSignals("Bug Zapper", [], ["ice.strength_modifier"]);
expectCardStrategies("Bug Zapper", ["corp.damage_kill", "corp.ice_tax_glacier"]);

expectCardStrategies("Dog Pile", ["corp.damage_kill", "corp.ice_tax_glacier"]);
expectCardSignals("Minotaur", [], ["ice.strength_modifier"]);
expectCardStrategies("Minotaur", ["corp.ice_tax_glacier"]);

expectCardSignals("Entrapment", ["run.corp_redirect"], [
  "corp_ice.runner_pay_or_end_run",
  "corp_ice.other_utility",
]);
expectCardStrategies("Entrapment", ["corp.ice_tax_glacier", "corp.remote_scoring"]);

expectCardSignals("Vortex", ["run.corp_redirect"], [
  "corp_ice.runner_pay_or_end_run",
  "corp_ice.other_utility",
]);
expectCardStrategies("Vortex", ["corp.ice_tax_glacier", "corp.remote_scoring"]);

expectCardSignals("Ball and Chain", ["corp_ice.runner_pay_or_end_run", "corp_ice.run_lock"], [
  "corp_ice.jackout_tax",
  "corp_ice.multi_end_run",
]);
expectCardSignals("Tutor", [], ["corp_ice.jackout_tax"]);

expectCardSignals("Cinderella", ["corp_ice.conditional_end_run"], ["corp_ice.end_run"]);
expectCardSignals("Homewrecker™", ["corp_ice.conditional_end_run"], ["corp_ice.end_run"]);

expectCardSignals("Vacuum Link", ["run.corp_run_rewind", "risk.random_outcome"], []);
expectCardStrategies("Vacuum Link", ["corp.ice_tax_glacier"]);

expectCardStrategies("Glacier", ["corp.ice_tax_glacier"], [
  "corp.central_stabilize",
  "corp.remote_scoring",
]);

for (const title of ["Fetch 4.0.1", "Hunter", "Simple Tag ICE", "Watchdog ICE"]) {
  expectCardStrategies(title, [], ["corp.tag_trace_punish"]);
}
for (const title of ["Data Wall", "Filter", "Fire Wall", "Toughonium™ Wall"]) {
  expectCardStrategies(title, [], ["corp.ice_tax_glacier"]);
}

if (errors.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        errors,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedIce: recommendations.length,
      anchoredCards,
      supportOnlyCards,
      strategySupportPairCount,
      strategyAnchorCounts: sortObjectByKey(strategyCounts),
      usedSignals: usedSignals.size,
    },
    null,
    2,
  ),
);
