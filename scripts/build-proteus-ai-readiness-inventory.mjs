import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  AI_HINTS_BY_CARD,
  RUNTIME_CARDS,
} from "../packages/ai/src/ai-hints.ts";
import { classifyProteusAiReadiness } from "./lib/proteus-ai-readiness-classifier.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(
  root,
  "data/ai/proteus-ai-readiness-inventory-v1.json",
);
const shouldWrite = process.argv.includes("--write");
const shouldCheck = process.argv.includes("--check");

const pilotDecks = await readJson(
  "data/decks/proteus-playtest-decks-2026-05-25.json",
);

const manifestCards = Object.values(RUNTIME_CARDS)
  .filter((card) => card.setId === "proteus")
  .map((card) => ({ cardId: card.catalogCardId }))
  .sort((left, right) => left.cardId.localeCompare(right.cardId));
const activeById = AI_HINTS_BY_CARD;
const pilotDeckIdsByCard = buildPilotDeckIndex(pilotDecks.decks ?? []);

const cards = manifestCards.map((manifestCard) => {
  const cardHint = activeById.get(manifestCard.cardId);
  assert(cardHint, `Missing Karten-Hint for ${manifestCard.cardId}.`);
  const classification = classifyProteusAiReadiness(cardHint);
  const pilotDeckIds = [
    ...(pilotDeckIdsByCard.get(manifestCard.cardId) ?? []),
  ].sort();
  return {
    cardId: manifestCard.cardId,
    side: cardHint.side,
    cardType: cardHint.cardType,
    primaryFamily: classification.family,
    classificationReasons: classification.reasons,
    pilotDeckIds,
    evidence: {
      hintReviewed: cardHint.quality?.hintReviewed === true,
      strategyCovered: cardHint.quality?.strategyCovered === true,
      benchmarkCovered: cardHint.quality?.benchmarkCovered === true,
      confidence: cardHint.quality?.confidence ?? "unknown",
      scenarioRefs: [
        ...(cardHint.scenarioRefs ?? []),
        ...(pilotDeckIds.length > 0
          ? [
              `data/scenarios/proteus-ai-family-decision-smokes-v1.json#proteus_${classification.family}`,
            ]
          : []),
      ].sort(),
      targetProfileCount: Array.isArray(cardHint.targetProfiles)
        ? cardHint.targetProfiles.length
        : 0,
      effectCount: Array.isArray(cardHint.effects)
        ? cardHint.effects.length
        : 0,
    },
    removalConditions: removalConditionsFor(
      classification.family,
      cardHint.quality,
      pilotDeckIds.length > 0,
    ),
  };
});

const familyCounts = Object.fromEntries(
  [...new Set(cards.map((entry) => entry.primaryFamily))]
    .sort()
    .map((family) => [
      family,
      cards.filter((entry) => entry.primaryFamily === family).length,
    ]),
);

const inventory = {
  schemaVersion: "netgrid.proteus-ai-readiness-inventory.v1",
  inventoryId: "proteus-ai-readiness-inventory-v1",
  asOf: "2026-07-09",
  generatedFrom: [
    "@netgrid/catalog#createRuntimeCardsById",
    "@netgrid/ai#AI_HINTS_BY_CARD",
    "data/decks/proteus-playtest-decks-2026-05-25.json",
    "data/scenarios/proteus-ai-family-decision-smokes-v1.json",
  ],
  classificationPolicy: {
    source: "curated_ai_hint_semantics_only",
    cardTextParsingAllowed: false,
    exactlyOnePrimaryFamily: true,
    priority: [
      "hidden_resource",
      "virus_counter",
      "bad_publicity",
      "random_outcome",
      "x_cost",
      "temporary_action",
      "access_ambush",
      "run_modification",
      "target_choice",
      "complex_multi_ability",
      "baseline",
    ],
  },
  summary: {
    cardCount: cards.length,
    pilotDeckCardCount: cards.filter((entry) => entry.pilotDeckIds.length > 0)
      .length,
    hintReviewedCount: cards.filter((entry) => entry.evidence.hintReviewed)
      .length,
    strategyCoveredCount: cards.filter(
      (entry) => entry.evidence.strategyCovered,
    ).length,
    benchmarkCoveredCount: cards.filter(
      (entry) => entry.evidence.benchmarkCovered,
    ).length,
    familyCounts,
  },
  cards,
};

const serialized = await format(JSON.stringify(inventory), { parser: "json" });
if (shouldWrite) {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)}.`);
} else if (shouldCheck) {
  const current = JSON.parse(await readFile(outputPath, "utf8"));
  assert(
    JSON.stringify(current) === JSON.stringify(inventory),
    "Proteus AI readiness inventory is stale. Run build:proteus-ai-readiness-inventory.",
  );
  console.log(
    `Proteus AI readiness inventory current: ${cards.length} cards across ${Object.keys(familyCounts).length} families.`,
  );
} else {
  process.stdout.write(serialized);
}

function removalConditionsFor(family, quality, inPilotDeck) {
  const conditions = inPilotDeck ? [] : [`${family}_decision_smoke_green`];
  if (quality?.hintReviewed !== true) conditions.push("hint_human_reviewed");
  if (quality?.strategyCovered !== true)
    conditions.push("strategy_coverage_or_explicit_non_strategy_decision");
  if (quality?.benchmarkCovered !== true && inPilotDeck)
    conditions.push("pilot_benchmark_coverage");
  return conditions;
}

function buildPilotDeckIndex(decks) {
  const index = new Map();
  for (const deck of decks) {
    for (const entry of deck.cards ?? []) {
      if (!String(entry.id ?? "").startsWith("onr_proteus_")) continue;
      const deckIds = index.get(entry.id) ?? new Set();
      deckIds.add(deck.id);
      index.set(entry.id, deckIds);
    }
  }
  return index;
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
