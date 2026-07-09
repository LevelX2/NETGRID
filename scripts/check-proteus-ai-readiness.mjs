import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const [
  contract,
  manifest,
  activeHints,
  compiledHints,
  aiDeckPool,
  familyScenarios,
  selectedPilot,
] = await Promise.all([
  readJson("data/ai/card-set-ai-readiness-v1.json"),
  readJson("data/manifests/proteus-card-support.json"),
  readJson("data/ai/ai-card-hints-active.json"),
  readJson("data/ai/ai-card-hints-compiled.json"),
  readJson("data/ai/ai-deck-pool-1.1.0.json"),
  readJson("data/scenarios/proteus-ai-family-decision-smokes-v1.json"),
  readJson("data/ai/proteus-ai-selected-pilot-v1.json"),
]);

const readiness = contract.sets?.find((entry) => entry.setId === "proteus");
assert(readiness, "Proteus readiness entry is missing.");

const manifestCards = manifest.cards ?? [];
const activeProteusHints = (activeHints.cards ?? []).filter(isProteusCard);
const compiledProteusHints = (compiledHints.cards ?? []).filter(isProteusCard);
const scenarioRefs = new Set(
  activeProteusHints.flatMap((entry) => entry.scenarioRefs ?? []),
);
const proteusPoolEntries = (aiDeckPool.entries ?? []).filter((entry) =>
  String(entry.snapshotId ?? "").includes("proteus"),
);

const actualEvidence = {
  cardCount: manifestCards.length,
  aiSupportedCardCount: manifestCards.filter(
    (entry) => entry.statuses?.ai_supported === true,
  ).length,
  activeHintCount: activeProteusHints.length,
  compiledHintCount: compiledProteusHints.length,
  uniqueScenarioRefCount: scenarioRefs.size,
  humanReviewedHintCount: activeProteusHints.filter(
    (entry) => entry.quality?.hintReviewed === true,
  ).length,
  strategyCoveredHintCount: activeProteusHints.filter(
    (entry) => entry.quality?.strategyCovered === true,
  ).length,
  benchmarkCoveredHintCount: activeProteusHints.filter(
    (entry) => entry.quality?.benchmarkCovered === true,
  ).length,
  selectedDeckSmoke: true,
  familyScenarioCount: familyScenarios.summary?.familyCount,
  familyScenarioPilotCardCount: familyScenarios.summary?.coveredPilotCardCount,
  selectedPilotGameCount: selectedPilot.totals?.games,
  selectedPilotIllegalActionCount: selectedPilot.totals?.illegalActions,
  selectedPilotReplayFailureCount: selectedPilot.totals?.replayFailures,
  selectedPilotRedactionFailureCount: selectedPilot.totals?.redactionFailures,
  aiDeckPoolSnapshotCount: proteusPoolEntries.length,
};

for (const [key, actual] of Object.entries(actualEvidence)) {
  assert(
    readiness.evidence?.[key] === actual,
    `Proteus readiness evidence drift for ${key}: expected ${readiness.evidence?.[key]}, actual ${actual}.`,
  );
}

assert(
  readiness.stages?.hint_ready?.ready === true,
  "Proteus hint_ready must be true while all active hints are present.",
);
assert(
  readiness.stages?.selected_ai_playtest_ready?.ready === true,
  "Proteus selected_ai_playtest_ready must reflect the selected-deck smoke.",
);
assert(
  selectedPilot.gatePassed === true,
  "Proteus selected_ai_playtest_ready requires a green selected pilot report.",
);
assert(
  readiness.stages?.default_pool_ready?.ready === proteusPoolEntries.length > 0,
  "Proteus default_pool_ready must match versioned AI deck-pool promotion.",
);

const currentStatusFiles = [
  "data/decks/proteus-playtest-decks-2026-05-25.json",
  "data/decks/deck-format-profiles-1.3.0.json",
  "docs/reviews/ai/ai-proteus-play-strength-readiness-classes-2026-06-13.md",
  "docs/reviews/ai/ai-proteus-random-bad-publicity-readiness-2026-06-13.md",
  "docs/reviews/ai/ai-proteus-hidden-resource-ambush-readiness-2026-06-13.md",
];
const stalePatterns = [
  "proteus_ai_supported: false",
  "bleibt aber nicht ai_supported",
  '"proteus_ai_support"',
  '"ai_playability"',
];
for (const relativePath of currentStatusFiles) {
  const content = await readFile(path.join(root, relativePath), "utf8");
  for (const stalePattern of stalePatterns) {
    assert(
      !content.includes(stalePattern),
      `Unqualified stale Proteus AI status in ${relativePath}: ${stalePattern}`,
    );
  }
}

console.log(
  `Proteus AI readiness consistent: ${actualEvidence.cardCount} cards, ${actualEvidence.activeHintCount} active hints, stage ${readiness.highestApprovedStage}.`,
);

function isProteusCard(entry) {
  return String(entry.cardId ?? "").startsWith("onr_proteus_");
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
