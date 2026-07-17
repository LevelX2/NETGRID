import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDeckCapabilityProfile } from "../packages/ai/src/deck-capabilities";
import { buildDeckStrategyProfile } from "../packages/ai/src/deck-doctrine-strategy";
import type { AiDeckStrategyDeckSnapshot } from "../packages/ai/src/deck-strategy-snapshot";

type JsonRecord = Record<string, unknown>;

const args = process.argv.slice(2);
const checkpointArgument = optionValue("--checkpoint");
if (!checkpointArgument) {
  throw new Error(
    "Usage: tsx scripts/audit-ai-deck-hint-consumers.ts --checkpoint <checkpoint.json> [--exclude-card-id <cardId>]...",
  );
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const excludedCardIds = new Set(optionValues("--exclude-card-id"));
const checkpointPath = path.resolve(repoRoot, checkpointArgument);
const checkpoint = readJson(checkpointPath);
const capturedSnapshot = checkpoint.deckSnapshot as
  | AiDeckStrategyDeckSnapshot
  | undefined;
if (!capturedSnapshot?.cards || !Array.isArray(capturedSnapshot.cards)) {
  throw new Error(`Checkpoint has no deckSnapshot.cards: ${checkpointPath}`);
}

const deckSnapshot: AiDeckStrategyDeckSnapshot = {
  ...capturedSnapshot,
  cards: capturedSnapshot.cards.filter(
    (card) => !excludedCardIds.has(card.cardId),
  ),
};
const side = deckSnapshot.side;
const expectedStrategyPrefix = `${side}.`;
const unexpectedStrategyPrefix = side === "runner" ? "corp." : "runner.";

const activeByCard = cardMap(
  readJson(repoPath("data/ai/ai-card-hints-active.json")),
);
const compiledByCard = cardMap(
  readJson(repoPath("data/ai/ai-card-hints-compiled.json")),
);
const inspectorByCard = cardMap(
  readJson(repoPath("data/ai/ai-hint-inspector-index.json")),
);
const derivedByCard = cardMap(
  readJson(
    repoPath("data/ai/ai-derived-basic-facts-full-cards-2026-05-25.json"),
  ),
);

const blockingFindings: JsonRecord[] = [];
const warnings: JsonRecord[] = [];
const cards = deckSnapshot.cards.map(({ cardId, quantity }) => {
  const active = activeByCard.get(cardId);
  const compiled = compiledByCard.get(cardId);
  const inspector = inspectorByCard.get(cardId);
  const derived = derivedByCard.get(cardId);

  for (const [artifact, value] of [
    ["active_hint", active],
    ["compiled_hint", compiled],
    ["inspector_index", inspector],
    ["derived_facts", derived],
  ] as const) {
    if (!value) {
      blockingFindings.push({ cardId, kind: "missing_artifact", artifact });
    }
  }

  if (active?.side && active.side !== side) {
    blockingFindings.push({
      cardId,
      kind: "deck_side_mismatch",
      expectedSide: side,
      actualSide: active.side,
    });
  }

  const quality = objectValue(active?.quality);
  if (
    quality &&
    (quality.hintReviewed !== true || quality.needsHumanReview === true)
  ) {
    blockingFindings.push({
      cardId,
      kind: "hint_not_fully_reviewed",
      hintReviewed: quality.hintReviewed,
      needsHumanReview: quality.needsHumanReview,
    });
  }

  for (const field of ["roles", "planRoles", "valueHints"] as const) {
    if (
      active &&
      compiled &&
      stableJson(active[field]) !== stableJson(compiled[field])
    ) {
      blockingFindings.push({
        cardId,
        kind: "active_compiled_contract_drift",
        field,
        active: active[field],
        compiled: compiled[field],
      });
    }
  }

  const compiledEffects = arrayValue(compiled?.effects);
  for (const overlap of overlappingEffects(compiledEffects)) {
    blockingFindings.push({
      cardId,
      kind: "compiled_effect_overlap",
      ...overlap,
    });
  }

  const strategyAnchors = uniqueStrings([
    ...arrayValue(inspector?.derivedStrategyAnchors),
    ...arrayValue(inspector?.cardLevelStrategyAnchors),
  ]);
  const wrongSideAnchors = strategyAnchors.filter((anchor) =>
    anchor.startsWith(unexpectedStrategyPrefix),
  );
  if (wrongSideAnchors.length > 0) {
    blockingFindings.push({
      cardId,
      kind: "wrong_side_strategy_anchor",
      expectedStrategyPrefix,
      anchors: wrongSideAnchors,
    });
  }

  const classifications = [
    ...arrayValue(inspector?.rolesClassification),
    ...arrayValue(inspector?.planRolesClassification),
    ...arrayValue(inspector?.lineSupportClassification),
  ].filter(isJsonRecord);
  const unresolvedClassifications = classifications.filter((classification) =>
    /unknown|remove|deferred/.test(String(classification.triageCategory ?? "")),
  );
  if (unresolvedClassifications.length > 0) {
    warnings.push({
      cardId,
      kind: "unresolved_taxonomy_classification",
      classifications: unresolvedClassifications,
    });
  }

  return {
    cardId,
    quantity,
    reviewed: quality?.hintReviewed === true && quality.needsHumanReview !== true,
    roles: arrayValue(active?.roles),
    planRoles: arrayValue(active?.planRoles),
    valueHints: active?.valueHints ?? {},
    activeEffectCount: arrayValue(active?.effects).length,
    compiledEffectCount: compiledEffects.length,
    functionSignals: arrayValue(inspector?.derivedFunctionSignals),
    strategyAnchors,
    coverageClass: derived?.coverageClass ?? null,
  };
});

const capabilityProfile = buildDeckCapabilityProfile({
  side,
  deckSnapshot,
  legalActions: [],
});
const strategyProfile = buildDeckStrategyProfile(deckSnapshot);
const runner = capabilityProfile.runner;
const searchTools = runner?.searchAccess.tools.map((tool) => tool.cardId) ?? [];
const suspiciousSearchTools = searchTools.filter((cardId) => {
  const compiled = compiledByCard.get(cardId);
  const searchText = [
    ...arrayValue(compiled?.roles),
    ...arrayValue(compiled?.planRoles),
    ...arrayValue(compiled?.effects).flatMap((effect) =>
      isJsonRecord(effect)
        ? [effect.kind, effect.target, effect.scope].filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    ),
  ]
    .join(" ")
    .toLowerCase();
  return !/search|tutor|stack_access|hidden_zone_tool/.test(searchText);
});
if (suspiciousSearchTools.length > 0) {
  blockingFindings.push({
    kind: "consumer_search_without_search_semantics",
    cardIds: suspiciousSearchTools,
  });
}

const remoteContestTools = deckSnapshot.cards
  .filter(({ cardId }) => {
    const compiled = compiledByCard.get(cardId);
    const roles = stringSet(compiled?.roles);
    const planRoles = stringSet(compiled?.planRoles);
    const directRole =
      roles.has("remote_contest") || roles.has("trash_support");
    const structuredRun = arrayValue(compiled?.effects).some(
      (effect) =>
        isJsonRecord(effect) &&
        effect.kind === "future_run_effect" &&
        effect.scope === "server" &&
        effect.target === "make_run",
    );
    return directRole || (planRoles.has("contest_remote") && structuredRun);
  })
  .map(({ cardId }) => cardId);

if (
  runner &&
  runner.attackPlanProfile.remoteContestToolsKnown !== remoteContestTools.length
) {
  blockingFindings.push({
    kind: "remote_contest_consumer_count_mismatch",
    consumerCount: runner.attackPlanProfile.remoteContestToolsKnown,
    auditedCards: remoteContestTools,
  });
}

const report = {
  schemaVersion: "ai-deck-hint-consumer-audit-v1",
  checkpoint: {
    path: path.relative(repoRoot, checkpointPath).replaceAll("\\", "/"),
    checkpointId: checkpoint.checkpointId ?? null,
    matchId: objectValue(checkpoint.source)?.matchId ?? null,
  },
  scope: {
    side,
    capturedUniqueCards: capturedSnapshot.cards.length,
    auditedUniqueCards: deckSnapshot.cards.length,
    auditedCardCount: deckSnapshot.cards.reduce(
      (sum, card) => sum + card.quantity,
      0,
    ),
    excludedCardIds: [...excludedCardIds].sort(),
  },
  cards,
  consumers: {
    searchTools,
    remoteContestTools,
    remoteContestToolsKnown:
      runner?.attackPlanProfile.remoteContestToolsKnown ?? null,
    primaryStrategies: strategyProfile.primaryStrategies,
    secondaryStrategies: strategyProfile.secondaryStrategies,
    strategyScores: Object.fromEntries(
      [...strategyProfile.primaryStrategies, ...strategyProfile.secondaryStrategies]
        .filter((strategyId, index, all) => all.indexOf(strategyId) === index)
        .map((strategyId) => [
          strategyId,
          strategyProfile.strategyScores[strategyId]?.finalScore ?? null,
        ]),
    ),
  },
  result: {
    status: blockingFindings.length === 0 ? "ok" : "failed",
    blockingFindingCount: blockingFindings.length,
    warningCount: warnings.length,
  },
  blockingFindings,
  warnings,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (blockingFindings.length > 0) process.exitCode = 1;

function optionValue(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function optionValues(name: string): string[] {
  return args.flatMap((arg, index) =>
    arg === name && args[index + 1] ? [args[index + 1]] : [],
  );
}

function repoPath(relativePath: string): string {
  return path.join(repoRoot, relativePath);
}

function readJson(filePath: string): JsonRecord {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonRecord;
}

function cardMap(artifact: JsonRecord): Map<string, JsonRecord> {
  return new Map(
    arrayValue(artifact.cards)
      .filter(isJsonRecord)
      .flatMap((card) =>
        typeof card.cardId === "string" ? [[card.cardId, card] as const] : [],
      ),
  );
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function objectValue(value: unknown): JsonRecord | undefined {
  return isJsonRecord(value) ? value : undefined;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringSet(value: unknown): Set<string> {
  return new Set(arrayValue(value).filter((entry): entry is string => typeof entry === "string"));
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string"))].sort();
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(stableValue));
  return JSON.stringify(stableValue(value));
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isJsonRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])]),
  );
}

function overlappingEffects(effects: unknown[]): JsonRecord[] {
  const records = effects.filter(isJsonRecord);
  const overlaps: JsonRecord[] = [];
  for (let leftIndex = 0; leftIndex < records.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < records.length;
      rightIndex += 1
    ) {
      const left = records[leftIndex];
      const right = records[rightIndex];
      const sameCore = ["kind", "timing", "scope", "resource", "target"].every(
        (field) => left[field] === right[field],
      );
      if (!sameCore) continue;
      overlaps.push({ leftIndex, rightIndex, left, right });
    }
  }
  return overlaps;
}
