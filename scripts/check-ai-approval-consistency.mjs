import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { AI_HINTS_BY_CARD } from "../packages/ai/src/ai-hints.ts";
import { cardSetSupportEntries } from "../packages/catalog/src/card-set-loader.ts";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function collectScenarioCoverage(scenarioDir) {
  const coverageByRef = new Map();
  for (const file of readdirSync(scenarioDir).filter((item) =>
    item.endsWith(".json"),
  )) {
    const fullPath = join(scenarioDir, file);
    const payload = readJson(fullPath);
    const scenarios = Array.isArray(payload.scenarios)
      ? payload.scenarios
      : payload.id
        ? [payload]
        : [];
    for (const scenario of scenarios) {
      const id = typeof scenario.id === "string" ? scenario.id : payload.id;
      if (!id) continue;
      const cards = new Set();
      for (const key of ["cards", "coversCards"]) {
        for (const cardId of Array.isArray(scenario[key])
          ? scenario[key]
          : []) {
          if (typeof cardId === "string" && cardId.trim())
            cards.add(cardId.trim());
        }
      }
      coverageByRef.set(`data/scenarios/${file}#${id}`, cards);
    }
  }
  return coverageByRef;
}

function collectActiveSupportEntries(manifestDir) {
  return readdirSync(manifestDir)
    .filter((file) => file.endsWith("-card-support.json"))
    .sort()
    .flatMap((file) => {
      const payload = readJson(join(manifestDir, file));
      return (Array.isArray(payload.cards) ? payload.cards : []).map(
        (entry) => ({
          ...entry,
          sourceFile: `data/manifests/${file}`,
        }),
      );
    });
}

function normalizeScenarioRef(ref) {
  return normalize(ref).replaceAll("\\", "/");
}

function main() {
  const activeHintsById = AI_HINTS_BY_CARD;
  const scenarioCoverage = collectScenarioCoverage(join("data", "scenarios"));
  const supportEntries = cardSetSupportEntries;
  const failures = [];

  for (const entry of supportEntries) {
    if (entry?.statuses?.ai_supported !== true) continue;
    const cardId = entry.cardId;
    if (entry.statuses.human_playable !== true)
      failures.push(`${cardId}: ai_supported without human_playable`);
    if (entry.statuses.deck_legal !== true)
      failures.push(`${cardId}: ai_supported without deck_legal`);

    const hint = activeHintsById.get(cardId);
    if (!hint) {
      failures.push(`${cardId}: active AI hint missing`);
      continue;
    }
    if (hint.aiSupportStatus !== "ai_supported")
      failures.push(`${cardId}: active AI hint is not ai_supported`);

    const scenarioRefs = Array.isArray(entry.support?.scenarioRefs)
      ? entry.support.scenarioRefs
      : [];
    if (scenarioRefs.length === 0)
      failures.push(`${cardId}: scenarioRefs empty`);
    for (const ref of scenarioRefs) {
      const normalizedRef = normalizeScenarioRef(ref);
      const coveredCards = scenarioCoverage.get(normalizedRef);
      if (!coveredCards) {
        failures.push(`${cardId}: scenarioRef not found ${ref}`);
        continue;
      }
      if (!coveredCards.has(cardId))
        failures.push(`${cardId}: scenarioRef does not cover card ${ref}`);
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) console.log(`[FAIL] ${failure}`);
    console.error("CONSISTENCY_CHECK_FAIL");
    process.exit(1);
  }

  console.log(
    `CONSISTENCY_OK ${supportEntries.filter((entry) => entry.statuses?.ai_supported === true).length} ai_supported cards`,
  );
}

main();
