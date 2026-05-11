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

function collectManifestConsistencyFailures(manifestPath, scenarioIndex) {
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

  if (!manifest.aiHintsId || typeof manifest.aiHintsId !== "string") {
    return { manifestName, ok: false, failures: [...failures, "manifest is missing aiHintsId"] };
  }
  if (!manifest.scenarioId || typeof manifest.scenarioId !== "string") {
    return { manifestName, ok: false, failures: [...failures, "manifest is missing scenarioId"] };
  }

  const hintFile = join("data", "ai", `${manifest.aiHintsId}.json`);
  if (!existsSync(hintFile)) {
    return {
      manifestName,
      ok: false,
      failures: [...failures, `hint file not found: ${hintFile}`]
    };
  }

  const hintData = readJson(hintFile);
  const hints = Array.isArray(hintData.cards) ? hintData.cards : [];
  const hintsById = new Map();

  for (const hint of hints) {
    if (typeof hint?.cardId === "string" && hint.cardId.trim()) {
      hintsById.set(hint.cardId, hint);
    }
  }

  const scenarioEntry = scenarioIndex.get(manifest.scenarioId);
  if (!scenarioEntry) {
    return {
      manifestName,
      ok: false,
      failures: [...failures, `scenario not found for scenarioId ${manifest.scenarioId}`]
    };
  }

  for (const card of manifestCards) {
    const cardId = card?.cardId;
    const hint = hintsById.get(cardId);
    if (!hint) {
      failures.push(`hint missing for manifest card ${cardId}`);
      continue;
    }
    if (card.status !== "ai_supported") {
      failures.push(`manifest status not ai_supported for ${cardId}`);
    }
    if (!Array.isArray(card.scenarioRefs) || card.scenarioRefs.length === 0) {
      failures.push(`manifest scenarioRefs empty for ${cardId}`);
    }
    if (hint.aiSupportStatus !== "ai_supported") {
      failures.push(`hint aiSupportStatus != ai_supported for ${cardId}`);
    }
    if (!Array.isArray(hint.scenarioRefs) || hint.scenarioRefs.length === 0) {
      failures.push(`hint scenarioRefs empty for ${cardId}`);
    }
    if (!scenarioEntry.cards.has(cardId)) {
      failures.push(`scenario ${manifest.scenarioId} missing card ${cardId}`);
    }
  }

  for (const hintCardId of hintsById.keys()) {
    if (!manifestCardIds.has(hintCardId)) {
      failures.push(`hint extra card not in manifest: ${hintCardId}`);
    }
  }

  return { manifestName, ok: failures.length === 0, failures };
}

function main() {
  const scenarioIndex = collectScenarioCardSets(join("data", "scenarios"));
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
      check = collectManifestConsistencyFailures(manifestPath, scenarioIndex);
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
