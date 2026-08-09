import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createGameAfterSetup } from "../packages/engine/src/game/create-game";
import {
  CARD_REGISTRY_RETENTION_LEGACY_CONTROL_IDS,
  CARD_REGISTRY_RETENTION_STRESS_IDS,
  cardRegistryRetentionDecks,
} from "../packages/engine/src/test-fixtures/card-registry-retention-decks";
import type { GameState } from "../packages/shared/src/index";

const MATCH_COUNT = 500;
const SAMPLE_COUNT = 5;
const MAX_BYTES_PER_MATCH = 4_096;
const invokedAsScript =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));
if (invokedAsScript) {
  const childLane = process.argv[2];
  if (childLane === "stress" || childLane === "legacy") runChild(childLane);
  else runParent();
}

function runParent(): void {
  const scriptPath = fileURLToPath(import.meta.url);
  const samples = { stress: [] as number[], legacy: [] as number[] };
  for (let index = 0; index < SAMPLE_COUNT; index += 1)
    for (const lane of ["legacy", "stress"] as const) {
      const child = spawnSync(
        process.execPath,
        ["--expose-gc", ...process.execArgv, scriptPath, lane],
        { encoding: "utf8" },
      );
      if (child.status !== 0)
        throw new Error(
          `card_registry_retention_child_failed:${lane}:${child.stderr || child.stdout}`,
        );
      const result = JSON.parse(child.stdout.trim()) as {
        retainedBytes: number;
      };
      samples[lane].push(result.retainedBytes);
    }

  const legacyMedian = median(samples.legacy);
  const stressMedian = median(samples.stress);
  const differentialBytesPerMatch = Math.max(
    0,
    (stressMedian - legacyMedian) / MATCH_COUNT,
  );
  const report = {
    schemaVersion: "card-registry-match-retention-v1",
    matchCount: MATCH_COUNT,
    sampleCount: SAMPLE_COUNT,
    stressDefinitionIds: [...CARD_REGISTRY_RETENTION_STRESS_IDS],
    legacyControlDefinitionIds: [...CARD_REGISTRY_RETENTION_LEGACY_CONTROL_IDS],
    legacyRetainedByteSamples: samples.legacy,
    stressRetainedByteSamples: samples.stress,
    legacyMedianRetainedBytes: legacyMedian,
    stressMedianRetainedBytes: stressMedian,
    differentialBytesPerMatch,
    budgetBytesPerMatch: MAX_BYTES_PER_MATCH,
    status:
      differentialBytesPerMatch <= MAX_BYTES_PER_MATCH ? "passed" : "failed",
  } as const;
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== "passed") process.exitCode = 1;
}

function runChild(lane: "stress" | "legacy"): never {
  if (!global.gc) throw new Error("card_registry_retention_requires_expose_gc");
  const decks = cardRegistryRetentionDecks(lane);
  for (let index = 0; index < 20; index += 1)
    createGameAfterSetup({
      seed: `warmup-${lane}-${index}`,
      matchId: `warmup-${lane}-${index}`,
      ...decks,
    });
  collectGarbage();
  const before = process.memoryUsage().heapUsed;
  const retained: GameState[] = [];
  for (let index = 0; index < MATCH_COUNT; index += 1)
    retained.push(
      createGameAfterSetup({
        seed: `retained-${lane}-${index}`,
        matchId: `retained-${lane}-${index}`,
        ...decks,
      }),
    );
  collectGarbage();
  const retainedBytes = Math.max(0, process.memoryUsage().heapUsed - before);
  if (retained.length !== MATCH_COUNT)
    throw new Error("card_registry_retention_fixture_incomplete");
  process.stdout.write(JSON.stringify({ lane, retainedBytes }));
  process.exit(0);
}

function collectGarbage(): void {
  global.gc?.();
  global.gc?.();
  global.gc?.();
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)]!;
}
