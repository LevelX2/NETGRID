import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function collectScenarioCardSets(scenarioDir) {
  const scenarios = new Map();
  const duplicates = new Map();
  const files = readdirSync(scenarioDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const fullPath = join(scenarioDir, file);
    let payload;
    try {
      payload = readJson(fullPath);
    } catch (error) {
      console.error(`SCENARIO_PARSE_ERROR ${fullPath}: ${error.message}`);
      continue;
    }

    const scenarioId = typeof payload?.id === "string" ? payload.id.trim() : "";
    if (!scenarioId) {
      continue;
    }

    const cardIds = new Set();

    for (const card of Array.isArray(payload.cards) ? payload.cards : []) {
      if (typeof card === "string" && card.trim()) {
        cardIds.add(card.trim());
      }
    }

    for (const item of Array.isArray(payload.scenarios) ? payload.scenarios : []) {
      if (Array.isArray(item?.cards)) {
        for (const card of item.cards) {
          if (typeof card === "string" && card.trim()) {
            cardIds.add(card.trim());
          }
        }
      }
    }

    if (scenarios.has(scenarioId)) {
      const existing = duplicates.get(scenarioId) ?? [scenarios.get(scenarioId).path];
      existing.push(fullPath);
      duplicates.set(scenarioId, existing);
      continue;
    }

    scenarios.set(scenarioId, { path: fullPath, cards: cardIds });
  }

  if (duplicates.size > 0) {
    for (const [scenarioId, paths] of duplicates) {
      console.error(`SCENARIO_ID_DUPLICATE ${scenarioId}: ${paths.join(" | ")}`);
    }
  }

  return scenarios;
}

const ACTIVE_AI_HINTS_PATH = join("data", "ai", "ai-card-hints-active.json");

function collectManifestConsistencyFailures(manifestPath, scenarioIndex, activeHintsById) {
  const manifest = readJson(manifestPath);
  const manifestName = manifest.id || manifestPath;
  const manifestCards = Array.isArray(manifest.cards) ? manifest.cards : [];
  const failures = [];
  const manifestCardIds = new Set();

  for (const card of manifestCards) {
    if (typeof card?.cardId !== "string" || !card.cardId.trim()) {
      failures.push(`missing cardId in manifest card entry`);
      continue;
    }
    manifestCardIds.add(card.cardId);
  }

  for (const card of manifestCards) {
    const cardId = card?.cardId;
    const hint = activeHintsById.get(cardId);
    if (!hint) {
      failures.push(`hint missing for manifest card ${cardId}`);
      continue;
    }
    if (card.status !== "ai_supported") {
      failures.push(`manifest status not ai_supported for ${cardId}`);
    }
    const scenarioRefs = Array.isArray(card.scenarioRefs) && card.scenarioRefs.length > 0
      ? card.scenarioRefs
      : typeof manifest.scenarioId === "string"
        ? [manifest.scenarioId]
        : [];
    if (scenarioRefs.length === 0) {
      failures.push(`manifest scenarioRefs empty for ${cardId}`);
    }
    if (hint.aiSupportStatus !== "ai_supported") {
      failures.push(`hint aiSupportStatus != ai_supported for ${cardId}`);
    }
    if (!Array.isArray(hint.scenarioRefs) || hint.scenarioRefs.length === 0) {
      failures.push(`hint scenarioRefs empty for ${cardId}`);
    }
    const scenarioIdsToCheck = typeof manifest.scenarioId === "string" ? [manifest.scenarioId] : [];
    for (const scenarioRef of scenarioIdsToCheck) {
      const scenarioEntry = scenarioIndex.get(scenarioRef);
      if (!scenarioEntry) {
        failures.push(`scenario not found for scenarioRef ${scenarioRef}`);
        continue;
      }
      if (!scenarioEntry.cards.has(cardId)) {
        failures.push(`scenario ${scenarioRef} missing card ${cardId}`);
      }
    }
  }

  return { manifestName, ok: failures.length === 0, failures };
}

function main() {
  const scenarioIndex = collectScenarioCardSets(join("data", "scenarios"));
  if (!existsSync(ACTIVE_AI_HINTS_PATH)) {
    console.error(`ACTIVE_AI_HINTS_NOT_FOUND ${ACTIVE_AI_HINTS_PATH}`);
    process.exit(1);
  }
  const activeHintData = readJson(ACTIVE_AI_HINTS_PATH);
  const activeHintsById = new Map(
    (Array.isArray(activeHintData.cards) ? activeHintData.cards : [])
      .filter((hint) => typeof hint?.cardId === "string" && hint.cardId.trim())
      .map((hint) => [hint.cardId, hint])
  );
  const manifestFiles = readdirSync(join("data", "manifests"))
    .filter((file) => file.startsWith("deck-legal-ai-approval-") && file.endsWith(".json"))
    .sort();

  if (manifestFiles.length === 0) {
    console.error("NO_MATCHING_MANIFEST");
    process.exit(1);
  }

  let hasFailures = false;
  const report = [];

  for (const file of manifestFiles) {
    const manifestPath = join("data", "manifests", file);
    let check;
    try {
      check = collectManifestConsistencyFailures(manifestPath, scenarioIndex, activeHintsById);
    } catch (error) {
      hasFailures = true;
      check = { manifestName: file, ok: false, failures: [`${error.name}: ${error.message}`] };
    }

    report.push(check);
    if (!check.ok) {
      hasFailures = true;
    }
  }

  for (const item of report) {
    const status = item.ok ? "[OK]" : "[FAIL]";
    console.log(`${status} ${item.manifestName}`);
    if (!item.ok) {
      for (const failure of item.failures) {
        console.log(`  - ${failure}`);
      }
    }
  }

  if (hasFailures) {
    console.error("CONSISTENCY_CHECK_FAIL");
    process.exit(1);
  }

  console.log("CONSISTENCY_OK");
}

main();
