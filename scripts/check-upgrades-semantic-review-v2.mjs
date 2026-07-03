import fs from "node:fs";

const reviewPath =
  "docs/reviews/ai/upgrades-ai-hints-critical-review-v2-input-2026-07-02.json";
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
if (review.schemaVersion !== "upgrades-semantic-critical-review-v2") {
  fail(`Unexpected review schemaVersion: ${review.schemaVersion}`);
}
if (recommendations.length !== 45) {
  fail(`Expected 45 upgrade recommendations, got ${recommendations.length}`);
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
    fail(`Missing reviewed upgrade hint: ${entry.cardId}`);
    continue;
  }
  if (card.side !== "corp" || card.cardType !== "upgrade") {
    fail(`${entry.cardId}: expected Corp upgrade, got ${card.side}/${card.cardType}`);
  }

  const expectedSignals = entry.tacticSignals ?? [];
  const expectedLineSupport = entry.lineSupport ?? [];
  const expectedStrategicRole = entry.strategicRole ?? [];
  const expectedPairs = entry.strategySupportPairs ?? [];

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
      String(note).startsWith("UPGRADE-V2: Target/Constraints:"),
    )
  ) {
    fail(`${entry.cardId}: missing UPGRADE-V2 target/constraint manual note`);
  }
  if (card.quality?.reviewedDate !== "2026-07-03") {
    fail(`${entry.cardId}: missing 2026-07-03 quality review stamp`);
  }
}

const missingSignals = [...usedSignals].filter((signalId) => !signalById.has(signalId));
if (missingSignals.length) {
  fail(`Missing tactic signals: ${missingSignals.join(", ")}`);
}

const expectedSummary = review.summary?.final ?? {};
expectEqual(anchoredCards, expectedSummary.anchoredCards, "anchoredCards");
expectEqual(supportOnlyCards, expectedSummary.supportOnlyCards, "supportOnlyCards");
expectEqual(
  strategySupportPairCount,
  expectedSummary.strategySupportPairCount,
  "strategySupportPairCount",
);
expectEqual(
  sortObjectByKey(strategyCounts),
  sortObjectByKey(expectedSummary.strategyAnchorCounts ?? {}),
  "strategyAnchorCounts",
);

const expectedSupportOnlyTitles = [
  "Aardvark",
  "New Galveston City Grid",
  "Tokyo-Chiba Infighting",
  "Twenty-Four-Hour Surveillance",
  "Panic Button",
  "Simple Upgrade",
  "London City Grid",
].sort();
const actualSupportOnlyTitles = recommendations
  .filter((entry) => (entry.strategySupportPairs ?? []).length === 0)
  .map((entry) => entry.title)
  .sort();
expectEqual(actualSupportOnlyTitles, expectedSupportOnlyTitles, "supportOnlyCardSet");

const forbiddenProductiveStrategies = [
  "corp.action_tempo",
  "corp.overadvance_value",
  "corp.deck_recycle_engine",
  "corp.fast_advance",
];
const productiveForbidden = recommendations
  .flatMap((entry) => entry.strategySupportPairs ?? [])
  .map((pair) => pair.strategyId)
  .filter((strategyId) => forbiddenProductiveStrategies.includes(strategyId));
if (productiveForbidden.length) {
  fail(
    `Forbidden productive strategies present: ${[
      ...new Set(productiveForbidden),
    ].join(", ")}`,
  );
}

const newSupportOnlySignals = [
  "condition.corp_installed_or_advanced_this_fort_last_turn",
  "condition.during_hq_run",
  "condition.runner_has_four_or_more_tags",
  "condition.runner_has_one_or_more_tags",
  "condition.runner_passed_last_ice_this_fort",
  "remote.trash_tax_protection",
  "risk.temporary_ice_trash",
  "risk.trash_own_installed_cards",
];
for (const signalId of newSupportOnlySignals) {
  const signal = signalById.get(signalId);
  if (!signal) {
    fail(`Missing Upgrades-v2 support-only signal: ${signalId}`);
    continue;
  }
  if (
    signal.supportOnly !== true ||
    signal.mayAnchorStrategy !== false ||
    (signal.allowedStrategyAnchors ?? []).length !== 0
  ) {
    fail(
      `${signalId}: Upgrades-v2 support-only signal must not allow automatic strategy anchoring`,
    );
  }
}

const expectedSignalAnchors = {
  "advance.access_window_counter_support": ["corp.ambush_bluff"],
  "ice.corp_ice_swap": ["corp.ice_tax_glacier"],
  "ice.corp_install_during_run": ["corp.ice_tax_glacier", "corp.remote_scoring"],
  "ice.corp_targeted_strength_boost": ["corp.ice_tax_glacier"],
  "ice.corp_temporary_encounter": ["corp.ice_tax_glacier", "corp.remote_scoring"],
  "remote.content_swap_defense": ["corp.remote_scoring"],
  "run.corp_random_end_run": ["corp.remote_scoring"],
  "tag.runner_credit_loss_payoff": ["corp.tag_trace_punish"],
  "trace.runner_link_penalty": ["corp.ambush_bluff", "corp.tag_trace_punish"],
};
for (const [signalId, expectedAnchors] of Object.entries(expectedSignalAnchors)) {
  const signal = signalById.get(signalId);
  if (!signal) {
    fail(`Missing Upgrades-v2 anchor-capable signal: ${signalId}`);
    continue;
  }
  expectEqual(
    signal.allowedStrategyAnchors ?? [],
    expectedAnchors,
    `${signalId}.allowedStrategyAnchors`,
  );
}

function expectCardSignals(title, expectedPresent, expectedAbsent) {
  const entry = byCardTitle(recommendations, title);
  const card = entry ? cardById.get(entry.cardId) : null;
  if (!entry || !card) {
    fail(`${title}: missing card for card-specific guard`);
    return;
  }
  const signals = card.tacticSignals ?? [];
  for (const signalId of expectedPresent) {
    if (!signals.includes(signalId)) fail(`${title}: missing ${signalId}`);
  }
  for (const signalId of expectedAbsent) {
    if (signals.includes(signalId)) fail(`${title}: forbidden ${signalId}`);
  }
}

function expectCardStrategies(title, expectedPresent, expectedAbsent) {
  const entry = byCardTitle(recommendations, title);
  const card = entry ? cardById.get(entry.cardId) : null;
  if (!entry || !card) {
    fail(`${title}: missing card for strategy guard`);
    return;
  }
  const strategies = (card.strategySupportPairs ?? []).map((pair) => pair.strategyId);
  expectEqual(strategies, expectedPresent, `${title}.strategyIds`);
  for (const strategyId of expectedAbsent) {
    if (strategies.includes(strategyId)) fail(`${title}: forbidden ${strategyId}`);
  }
}

expectCardStrategies("Tokyo-Chiba Infighting", [], ["corp.ice_tax_glacier"]);
expectCardStrategies("Twenty-Four-Hour Surveillance", [], ["corp.ice_tax_glacier"]);
expectCardStrategies("London City Grid", [], ["corp.ice_tax_glacier", "corp.remote_scoring"]);
expectCardStrategies("Lesley Major", ["corp.ambush_bluff"], ["corp.remote_scoring"]);
expectCardStrategies("Street Enforcer", ["corp.tag_trace_punish"], [
  "corp.ice_tax_glacier",
  "corp.remote_scoring",
]);
expectCardStrategies("Sterdroid", ["corp.ice_tax_glacier"], ["corp.remote_scoring"]);
expectCardStrategies("Olivia Salazar", ["corp.ice_tax_glacier"], [
  "corp.economy_rez_reserve",
]);

expectCardSignals("Dr. Dreff", ["ice.corp_temporary_encounter", "risk.temporary_ice_trash"], [
  "ice.corp_hq_runpath_insert",
]);
expectCardSignals("Omni Kismet, Ph.D.", ["ice.corp_ice_swap"], [
  "ice.corp_hq_runpath_insert",
]);
expectCardSignals("Singapore City Grid", ["ice.corp_ice_swap"], [
  "ice.corp_hq_runpath_insert",
]);
expectCardSignals("Roving Submarine", [
  "condition.corp_installed_or_advanced_this_fort_last_turn",
], ["condition.corp_installed_or_advanced_last_turn"]);
expectCardSignals("Panic Button", ["condition.during_hq_run"], ["condition.hq_run"]);
expectCardSignals("Namatoki Plaza", ["remote.capacity_support"], [
  "remote.scoring_protection",
]);

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
      checkedUpgrades: recommendations.length,
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
