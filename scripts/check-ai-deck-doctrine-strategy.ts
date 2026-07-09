#!/usr/bin/env tsx
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import snapshotsData08 from "../data/decks/deck-snapshots-0.8.json";
import type { AiDeckStrategyDeckSnapshot } from "../packages/ai/src/deck-strategy-snapshot";
import {
  buildDeckStrategyProfile,
  type AiDeckStrategyProfile,
  type DeckStrategyEvidence,
} from "../packages/ai/src/deck-doctrine-strategy";
import type { Side } from "@netgrid/shared";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPORT_PATH = path.join(
  REPO_ROOT,
  "docs/reviews/ai/ai006-deck-doctrine-strategy-aggregation-v1-report-2026-05-31.json",
);
const ANALYZED_DECK_IDS = [
  "king_of_the_road_runner_ai_snapshot_v1",
  "onr_origin_runner_ai_snapshot_v1",
  "onr_origin_runner_ai_event_pressure_snapshot_v1",
  "onr_origin_corp_ai_snapshot_v1",
  "onr_origin_corp_ai_tag_ops_snapshot_v1",
] as const;
const FORBIDDEN_OUTPUT_KEYS = [
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullGameState",
  "fullState",
  "stateHash",
  "deckHash",
  "legalActions",
  "playerActions",
  "stateVersion",
  "actionId",
];
const ALLOWED_ANCHOR_SOURCES = new Set<DeckStrategyEvidence["source"]>([
  "derivedStrategyAnchor",
  "lineSupport",
  "strategicRole",
]);

type DeckSnapshotFixture = {
  deckSnapshotId: string;
  side: Side;
  formatProfileId?: string;
  publicMetadata?: AiDeckStrategyDeckSnapshot["publicMetadata"];
  cards: Array<{ cardId: string; quantity: number }>;
};

type Ai006Report = {
  schemaVersion: "ai006-deck-doctrine-strategy-aggregation-report-v1";
  taskId: "AI006";
  generatedAt: "2026-05-31";
  source: {
    mode: "productive_strategy_profile";
    strategyGoals: string;
    compiledHints: string;
    inspectorIndex: string;
    deckSnapshots: string;
    plannerEffect: "strategic_intent_input";
  };
  analyzedDecks: AiDeckStrategyProfile[];
  validation: {
    plannerEffectGuard: "pass";
    legacyAnchorGuard: "pass";
    stableSourceGuard: "pass";
    hiddenInfoGuard: "pass";
    deterministicOutputGuard: "pass";
  };
  deterministicSummary: {
    deckCount: number;
    runnerDeckCount: number;
    corpDeckCount: number;
    deckIds: string[];
    primaryStrategyCounts: Record<string, number>;
    warningCounts: Record<string, number>;
    contentSha256: string;
  };
};

function main(): void {
  const snapshots = ANALYZED_DECK_IDS.map(snapshotById);
  const firstProfiles = snapshots.map((snapshot) => buildDeckStrategyProfile(snapshot));
  const secondProfiles = snapshots.map((snapshot) => buildDeckStrategyProfile(snapshot));
  assert(
    stableStringify(firstProfiles) === stableStringify(secondProfiles),
    "Deck strategy profile output is not deterministic",
  );

  validateProfiles(firstProfiles);
  validateNoLegacyDoctrineEffect();
  validateLegacyRolesDoNotAnchor();
  validateStableAnchorSources(firstProfiles);
  validateNoForbiddenOutputKeys(firstProfiles);

  const reportCore = {
    schemaVersion: "ai006-deck-doctrine-strategy-aggregation-report-v1" as const,
    taskId: "AI006" as const,
    generatedAt: "2026-05-31" as const,
    source: {
      mode: "productive_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      deckSnapshots: "data/decks/deck-snapshots-0.8.json",
      plannerEffect: "strategic_intent_input" as const,
    },
    analyzedDecks: firstProfiles,
    validation: {
      plannerEffectGuard: "pass" as const,
      legacyAnchorGuard: "pass" as const,
      stableSourceGuard: "pass" as const,
      hiddenInfoGuard: "pass" as const,
      deterministicOutputGuard: "pass" as const,
    },
  };
  const deterministicSummary = deterministicSummaryFor(firstProfiles, reportCore);
  const report: Ai006Report = {
    ...reportCore,
    deterministicSummary,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `AI006 DeckDoctrine strategy aggregation check passed: ${firstProfiles.length} deck profiles, report ${path.relative(REPO_ROOT, REPORT_PATH)}`,
  );
}

function validateProfiles(profiles: AiDeckStrategyProfile[]): void {
  assert(profiles.length === ANALYZED_DECK_IDS.length, "Unexpected profile count");
  for (const profile of profiles) {
    assert(profile.taskId === "AI006", `${profile.deckId}: missing task id`);
    assert(
      profile.source.plannerEffect === "strategic_intent_input",
      `${profile.deckId}: planner effect source mismatch`,
    );
    assert(profile.cardCount > 0, `${profile.deckId}: empty profile`);
    const strategyIds = Object.keys(profile.strategyScores);
    assert(strategyIds.length > 0, `${profile.deckId}: missing side strategy scores`);
    for (const strategyId of strategyIds) {
      assert(
        strategyId.startsWith(`${profile.side}.`),
        `${profile.deckId}: wrong-side strategy score ${strategyId}`,
      );
      const score = profile.strategyScores[strategyId];
      assert(score !== undefined, `${profile.deckId}: missing score ${strategyId}`);
      assert(score.anchorScore >= 0 && score.anchorScore <= 100, `${profile.deckId}: bad anchor score`);
      assert(score.supportScore >= 0 && score.supportScore <= 100, `${profile.deckId}: bad support score`);
      assert(score.finalScore >= 0 && score.finalScore <= 100, `${profile.deckId}: bad final score`);
    }
  }
}

function validateNoLegacyDoctrineEffect(): void {
  const indexSource = fs.readFileSync(
    path.join(REPO_ROOT, "packages/ai/src/index.ts"),
    "utf8",
  );
  const runtimeInput = fs.readFileSync(
    path.join(REPO_ROOT, "packages/ai/src/runtime/ai-decision-input.ts"),
    "utf8",
  );
  for (const [label, source] of [
    ["public exports", indexSource],
    ["runtime ai decision input", runtimeInput],
  ] as const) {
    assert(!source.includes("buildDeckDoctrineProfile"), `${label}: builds v1 doctrine profile`);
    assert(!source.includes("AiDeckDoctrineProfile"), `${label}: references v1 doctrine type`);
    assert(!/\bownDeckDoctrine\b/.test(source), `${label}: consumes v1 ownDeckDoctrine`);
    assert(!source.includes("doctrinePlanWeight"), `${label}: exposes v1 doctrine plan weight`);
    assert(!source.includes("doctrine_plan_weight"), `${label}: emits v1 doctrine plan weight evidence`);
  }
}

function validateLegacyRolesDoNotAnchor(): void {
  const profile = buildDeckStrategyProfile({
    deckSnapshotId: "ai006-check-legacy-only-runner",
    side: "runner",
    cards: [{ cardId: "simple_run_event", quantity: 3 }],
  });
  assert(
    profile.legacySignalCounts["planRole:pressure_rnd"] === 3,
    "Legacy planRole fixture did not count pressure_rnd",
  );
  assert(
    profile.strategyScores["runner.rnd_pressure"]?.anchorScore === 0,
    "Legacy planRole created Runner R&D pressure anchor",
  );
}

function validateStableAnchorSources(profiles: AiDeckStrategyProfile[]): void {
  for (const profile of profiles) {
    for (const [strategyId, score] of Object.entries(profile.strategyScores)) {
      for (const evidence of score.anchorEvidence) {
        assert(
          ALLOWED_ANCHOR_SOURCES.has(evidence.source),
          `${profile.deckId}:${strategyId}: unstable anchor source ${evidence.source}`,
        );
        assert(
          evidence.source !== "compiledHint" && evidence.source !== "functionSignal",
          `${profile.deckId}:${strategyId}: support source used as anchor`,
        );
      }
    }
  }
}

function validateNoForbiddenOutputKeys(value: unknown): void {
  const seen = new Set<string>();
  visit(value);
  function visit(current: unknown): void {
    if (current === null || typeof current !== "object") return;
    if (seen.has(JSON.stringify(Object.keys(current).sort()))) {
      return;
    }
    if (Array.isArray(current)) {
      for (const entry of current) visit(entry);
      return;
    }
    const record = current as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      assert(
        !FORBIDDEN_OUTPUT_KEYS.includes(key),
        `Forbidden hidden/runtime key in AI006 output: ${key}`,
      );
      visit(record[key]);
    }
  }
}

function deterministicSummaryFor(
  profiles: AiDeckStrategyProfile[],
  reportCore: Omit<Ai006Report, "deterministicSummary">,
): Ai006Report["deterministicSummary"] {
  const primaryStrategyCounts: Record<string, number> = {};
  const warningCounts: Record<string, number> = {};
  for (const profile of profiles) {
    for (const strategyId of profile.primaryStrategies) {
      primaryStrategyCounts[strategyId] = (primaryStrategyCounts[strategyId] ?? 0) + 1;
    }
    for (const warning of profile.warnings) {
      warningCounts[warning] = (warningCounts[warning] ?? 0) + 1;
    }
  }
  return {
    deckCount: profiles.length,
    runnerDeckCount: profiles.filter((profile) => profile.side === "runner").length,
    corpDeckCount: profiles.filter((profile) => profile.side === "corp").length,
    deckIds: profiles.map((profile) => profile.deckId).sort(),
    primaryStrategyCounts: sortRecord(primaryStrategyCounts),
    warningCounts: sortRecord(warningCounts),
    contentSha256: crypto
      .createHash("sha256")
      .update(stableStringify(reportCore))
      .digest("hex"),
  };
}

function snapshotById(snapshotId: string): AiDeckStrategyDeckSnapshot {
  const snapshot = (snapshotsData08.snapshots as DeckSnapshotFixture[]).find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  assert(snapshot !== undefined, `Missing deck snapshot ${snapshotId}`);
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    ...(snapshot.formatProfileId ? { formatProfileId: snapshot.formatProfileId } : {}),
    ...(snapshot.publicMetadata ? { publicMetadata: snapshot.publicMetadata } : {}),
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortDeep(entry)]),
  );
}

function sortRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main();
