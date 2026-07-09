import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(
  root,
  "data/ai/proteus-ai-readiness-inventory-v1.json",
);
const shouldWrite = process.argv.includes("--write");
const shouldCheck = process.argv.includes("--check");

const [manifest, activeHints, compiledHints, pilotDecks] = await Promise.all([
  readJson("data/manifests/proteus-card-support.json"),
  readJson("data/ai/ai-card-hints-active.json"),
  readJson("data/ai/ai-card-hints-compiled.json"),
  readJson("data/decks/proteus-playtest-decks-2026-05-25.json"),
]);

const manifestCards = [...(manifest.cards ?? [])].sort((left, right) =>
  left.cardId.localeCompare(right.cardId),
);
const activeById = new Map(
  (activeHints.cards ?? []).map((entry) => [entry.cardId, entry]),
);
const compiledById = new Map(
  (compiledHints.cards ?? []).map((entry) => [entry.cardId, entry]),
);
const pilotDeckIdsByCard = buildPilotDeckIndex(pilotDecks.decks ?? []);

const cards = manifestCards.map((manifestCard) => {
  const activeHint = activeById.get(manifestCard.cardId);
  const compiledHint = compiledById.get(manifestCard.cardId);
  assert(activeHint, `Missing active hint for ${manifestCard.cardId}.`);
  assert(compiledHint, `Missing compiled hint for ${manifestCard.cardId}.`);
  const classification = classifyCard(activeHint, compiledHint);
  const pilotDeckIds = [
    ...(pilotDeckIdsByCard.get(manifestCard.cardId) ?? []),
  ].sort();
  return {
    cardId: manifestCard.cardId,
    side: activeHint.side,
    cardType: activeHint.cardType,
    primaryFamily: classification.family,
    classificationReasons: classification.reasons,
    pilotDeckIds,
    evidence: {
      hintReviewed: activeHint.quality?.hintReviewed === true,
      strategyCovered: activeHint.quality?.strategyCovered === true,
      benchmarkCovered: activeHint.quality?.benchmarkCovered === true,
      confidence: activeHint.quality?.confidence ?? "unknown",
      scenarioRefs: [
        ...(activeHint.scenarioRefs ?? []),
        ...(pilotDeckIds.length > 0
          ? [
              `data/scenarios/proteus-ai-family-decision-smokes-v1.json#proteus_${classification.family}`,
            ]
          : []),
      ].sort(),
      targetProfileCount: Array.isArray(compiledHint.targetProfiles)
        ? compiledHint.targetProfiles.length
        : 0,
      effectCount: Array.isArray(activeHint.effects)
        ? activeHint.effects.length
        : 0,
    },
    removalConditions: removalConditionsFor(
      classification.family,
      activeHint.quality,
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
    "data/manifests/proteus-card-support.json",
    "data/ai/ai-card-hints-active.json",
    "data/ai/ai-card-hints-compiled.json",
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

const serialized = `${JSON.stringify(inventory, null, 2)}\n`;
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

function classifyCard(activeHint, compiledHint) {
  const semantic = semanticText(activeHint, compiledHint);
  const roles = new Set([
    ...(activeHint.roles ?? []),
    ...(activeHint.riskTags ?? []),
  ]);
  const effects = activeHint.effects ?? [];
  const targetProfiles = compiledHint.targetProfiles ?? [];

  if (
    roles.has("hidden_zone_tool") ||
    roles.has("hidden_zone_barrier") ||
    effects.some((effect) => String(effect.target ?? "").includes("hidden."))
  ) {
    return result("hidden_resource", "hidden_resource_semantics");
  }
  if (/\b(virus|antibody|purge)\b/.test(semantic)) {
    return result("virus_counter", "virus_or_antibody_semantics");
  }
  if (/bad_publicity|bad publicity/.test(semantic)) {
    return result("bad_publicity", "bad_publicity_semantics");
  }
  if (/\b(random|dice|die roll|random_roll)\b/.test(semantic)) {
    return result("random_outcome", "random_outcome_semantics");
  }
  if (
    /\bselected x\b|\bvariable x\b|\bx cost\b|\bcosts? x\b|rez_paid_scaling/.test(
      semantic,
    ) ||
    (activeHint.manualNotes ?? []).some((note) => /\bX\b/.test(note))
  ) {
    return result("x_cost", "variable_x_semantics");
  }
  if (
    /temporary|delayed_|action_debt|extra_action|additional_action|forgo/.test(
      semantic,
    )
  ) {
    return result("temporary_action", "temporary_or_delayed_semantics");
  }
  if (/\b(access|ambush|steal|trash_accessed)\b/.test(semantic)) {
    return result("access_ambush", "access_or_ambush_semantics");
  }
  if (
    /run_pressure|successful_run|run_end|bypass|redirect|post_run|additional_subroutine|run_modification/.test(
      semantic,
    )
  ) {
    return result("run_modification", "run_modification_semantics");
  }
  if (targetProfiles.length > 0) {
    return result("target_choice", "target_profile_present");
  }
  if (
    effects.length >= 4 ||
    targetProfiles.length > 1 ||
    (activeHint.strategySupportPairs ?? []).length > 2
  ) {
    return result("complex_multi_ability", "multiple_semantic_surfaces");
  }
  return result("baseline", "no_specialized_readiness_model_required");
}

function semanticText(activeHint, compiledHint) {
  return [
    activeHint.roles,
    activeHint.planRoles,
    activeHint.requiredMechanics,
    activeHint.riskTags,
    activeHint.tacticSignals,
    activeHint.effects,
    activeHint.conditions,
    activeHint.targetProfiles,
    activeHint.manualNotes,
    compiledHint.targetProfiles,
    compiledHint.conditions,
  ]
    .flatMap(flattenSemanticValue)
    .join(" ")
    .toLowerCase();
}

function flattenSemanticValue(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap(flattenSemanticValue);
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => [
      key,
      ...flattenSemanticValue(nested),
    ]);
  }
  return [String(value)];
}

function result(family, reason) {
  return { family, reasons: [reason] };
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
