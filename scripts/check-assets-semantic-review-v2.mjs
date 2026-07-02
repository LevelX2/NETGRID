import fs from "node:fs";

const reviewPath =
  "docs/reviews/ai/assets-ai-hints-change-list-v2-input-2026-07-01.json";
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
  return Object.fromEntries(Object.entries(object).sort(([left], [right]) =>
    left.localeCompare(right),
  ));
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

const recommendations = review.fullFinalRecommendations ?? [];
if (review.schemaVersion !== "assets-ai-hints-change-list-v2") {
  fail(`Unexpected review schemaVersion: ${review.schemaVersion}`);
}
if (recommendations.length !== 55) {
  fail(`Expected 55 asset recommendations, got ${recommendations.length}`);
}

const cardById = new Map((hints.cards ?? []).map((card) => [card.cardId, card]));
const signalById = new Map(
  (signals.signals ?? []).map((signal) => [signal.signalId, signal]),
);

const missingCards = recommendations
  .map((entry) => entry.cardId)
  .filter((cardId) => !cardById.has(cardId));
if (missingCards.length) {
  fail(`Missing reviewed asset hints: ${missingCards.join(", ")}`);
}

const usedSignals = new Set();
const strategyCounts = {};
let anchoredCards = 0;
let supportOnlyCards = 0;
let strategySupportPairCount = 0;

for (const entry of recommendations) {
  const card = cardById.get(entry.cardId);
  if (!card) continue;

  const final = entry.final ?? {};
  const expectedSignals = final.tacticSignals ?? [];
  const expectedLineSupport = final.lineSupport ?? [];
  const expectedStrategicRole = final.strategicRole ?? [];
  const expectedPairs = final.strategySupportPairs ?? [];

  expectEqual(
    card.tacticSignals ?? [],
    expectedSignals,
    `${entry.cardId}.tacticSignals`,
  );
  expectEqual(
    card.lineSupport ?? [],
    expectedLineSupport,
    `${entry.cardId}.lineSupport`,
  );
  expectEqual(
    card.strategicRole ?? [],
    expectedStrategicRole,
    `${entry.cardId}.strategicRole`,
  );
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
      String(note).startsWith("ASSET-V2: Target/Constraints:"),
    )
  ) {
    fail(`${entry.cardId}: missing ASSET-V2 target/constraint manual note`);
  }
}

const missingSignals = [...usedSignals].filter(
  (signalId) => !signalById.has(signalId),
);
if (missingSignals.length) {
  fail(`Missing tactic signals: ${missingSignals.join(", ")}`);
}

const newSupportOnlySignals = [
  "condition.runner_has_two_or_more_tags",
  "condition.runner_received_tag_this_turn",
  "economy.corp_installed_credit_pool",
  "economy.corp_rezzed_ice_cashout",
  "risk.ongoing_payment_liability",
  "risk.random_outcome",
];
for (const signalId of newSupportOnlySignals) {
  const signal = signalById.get(signalId);
  if (!signal) {
    fail(`Missing Assets-v2 signal: ${signalId}`);
    continue;
  }
  if (
    signal.supportOnly !== true ||
    signal.mayAnchorStrategy !== false ||
    (signal.allowedStrategyAnchors ?? []).length !== 0
  ) {
    fail(
      `${signalId}: Assets-v2 signal must remain supportOnly without automatic strategy anchors`,
    );
  }
}

const expectedSummary = review.summary ?? {};
expectEqual(anchoredCards, expectedSummary.finalAnchoredCards, "anchoredCards");
expectEqual(
  supportOnlyCards,
  expectedSummary.finalSupportOnlyCards,
  "supportOnlyCards",
);
expectEqual(
  strategySupportPairCount,
  expectedSummary.finalStrategySupportPairCount,
  "strategySupportPairCount",
);
expectEqual(
  sortObjectByKey(strategyCounts),
  sortObjectByKey(expectedSummary.strategyAnchorCounts ?? {}),
  "strategyAnchorCounts",
);

const forbiddenProductiveStrategies = [
  "corp.action_tempo",
  "corp.overadvance_value",
  "corp.deck_recycle_engine",
];
const productiveForbidden = recommendations
  .flatMap((entry) => entry.final?.strategySupportPairs ?? [])
  .map((pair) => pair.strategyId)
  .filter((strategyId) => forbiddenProductiveStrategies.includes(strategyId));
if (productiveForbidden.length) {
  fail(
    `Forbidden productive strategies present: ${[
      ...new Set(productiveForbidden),
    ].join(", ")}`,
  );
}

const supportOnlyExpectedCards = [
  "onr_v1_308_acme-savings-and-loan",
  "onr_v1_314_corporate-negotiating-center",
  "onr_v1_316_cowboy-sysop",
  "onr_v1_319_disinfectant-inc",
  "onr_v1_321_esa-contract",
  "onr_v1_322_euromarket-consortium",
  "onr_v1_331_nevinyrral",
  "onr_v1_335_remote-facility",
  "onr_v1_336_rescheduler",
  "onr_v1_338_rustbelt-hq-branch",
  "onr_v1_343_south-african-mining-corp",
  "onr_proteus_056_department-of-misinformation",
  "onr_proteus_076_syd-meyer-superstores",
];
const actualSupportOnlyCards = recommendations
  .filter((entry) => (entry.final?.strategySupportPairs ?? []).length === 0)
  .map((entry) => entry.cardId)
  .sort();
expectEqual(
  actualSupportOnlyCards,
  supportOnlyExpectedCards.slice().sort(),
  "supportOnlyCardSet",
);

const acme = cardById.get("onr_v1_308_acme-savings-and-loan");
if (
  (acme?.strategySupportPairs ?? []).length ||
  !(acme?.tacticSignals ?? []).includes("risk.ongoing_payment_liability")
) {
  fail("ACME Savings and Loan must remain support-only with ongoing liability");
}

const southAfrican = cardById.get("onr_v1_343_south-african-mining-corp");
if (
  (southAfrican?.strategySupportPairs ?? []).length ||
  JSON.stringify(southAfrican?.tacticSignals ?? []) !==
    JSON.stringify(["economy.corp_multi_action_credit"])
) {
  fail("South African Mining Corp must remain generic multi-action economy");
}

const sydMeyer = cardById.get("onr_proteus_076_syd-meyer-superstores");
if (
  (sydMeyer?.strategySupportPairs ?? []).length ||
  !(sydMeyer?.tacticSignals ?? []).includes("economy.corp_rezzed_ice_cashout") ||
  (sydMeyer?.tacticSignals ?? []).includes("economy.corp_asset_cashout")
) {
  fail("Syd Meyer Superstores must be own rezzed ICE cashout support-only");
}

const fortress = cardById.get("onr_v1_324_fortress-architects");
if (
  JSON.stringify(fortress?.lineSupport ?? []) !==
    JSON.stringify(["corp.ice_tax_glacier"]) ||
  (fortress?.strategySupportPairs ?? []).some(
    (pair) => pair.strategyId === "corp.economy_rez_reserve",
  ) ||
  !(fortress?.tacticSignals ?? []).includes("ice.corp_install_discount") ||
  (fortress?.tacticSignals ?? []).includes("economy.rez_discount")
) {
  fail("Fortress Architects must only support ice_tax_glacier via install discount");
}

const satellite = cardById.get("onr_classic_021_satellite-monitors");
if (
  !(satellite?.tacticSignals ?? []).includes(
    "condition.runner_attempted_run_last_turn",
  ) ||
  !(satellite?.tacticSignals ?? []).includes("risk.random_outcome") ||
  (satellite?.tacticSignals ?? []).includes("condition.multiple_runs_last_turn")
) {
  fail("Satellite Monitors must use last-turn run condition plus random outcome");
}

const government = cardById.get("onr_proteus_059_government-contract");
if (
  (government?.conditions ?? []).some(
    (condition) => condition?.kind === "requires_during_run",
  ) ||
  (government?.tacticSignals ?? []).includes("economy.advanceable")
) {
  fail("Government Contract must not keep requires_during_run or economy.advanceable");
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
      checkedAssets: recommendations.length,
      anchoredCards,
      supportOnlyCards,
      strategySupportPairCount,
      strategyAnchorCounts: sortObjectByKey(strategyCounts),
      usedSignals: usedSignals.size,
      assetsV2Signals: newSupportOnlySignals.length,
    },
    null,
    2,
  ),
);
