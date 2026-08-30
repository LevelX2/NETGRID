import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DeckDefinition, DeckPublicMetadata, Side } from "@netgrid/shared";
import {
  buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries,
  detectAiSelfplaySuspiciousDecisions,
  simulateAiGame,
} from "../packages/ai/src/simulation";
import { isSelfplayTraceRedactionSafe } from "../packages/ai/src/simulation/selfplay-trace-mining";

type StoredDeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  deckHash: string;
  cards: Array<{ cardId: string; quantity: number }>;
  publicMetadata: DeckPublicMetadata;
};

type StoredMatchRecord = {
  privateDeckSnapshots?: Partial<Record<Side, StoredDeckSnapshot>>;
};

const args = parseArgs(process.argv.slice(2));
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRepo = resolve(args.sourceRepo);
const outPath = resolve(repoRoot, args.out);
const manifestPath = resolve(repoRoot, args.manifest);
const auditInputDir = resolve(repoRoot, args.auditInputDir);
const databasePath = resolve(
  sourceRepo,
  "data/runtime/multiplayer/netgrid.sqlite",
);
const db = new DatabaseSync(databasePath, { readOnly: true });
const row = db
  .prepare("SELECT record_json FROM matches WHERE match_id = ?")
  .get(args.matchId) as { record_json?: string } | undefined;
db.close();

if (!row?.record_json) {
  throw new Error(`Stored match not found: ${args.matchId}`);
}

const record = JSON.parse(row.record_json) as StoredMatchRecord;
const runnerSnapshot = requiredSnapshot(record, "runner");
const corpSnapshot = requiredSnapshot(record, "corp");
assertExpectedSnapshot(runnerSnapshot, {
  side: "runner",
  name: args.runnerName,
  deckHash: args.runnerHash,
});
assertExpectedSnapshot(corpSnapshot, {
  side: "corp",
  name: args.corpName,
  deckHash: args.corpHash,
});

const runnerDeck = deckDefinition(runnerSnapshot);
const corpDeck = deckDefinition(corpSnapshot);
const summaries = args.seeds.map((seed) =>
  simulateAiGame({
    seed,
    matchId: `selfplay:${seed}`,
    maxActions: args.maxActions,
    agendaPointsToWin: 7,
    runnerDifficulty: "hard",
    corpDifficulty: "hard",
    runnerProfileId: "runner-ai-v0.9-hard",
    corpProfileId: "corp-ai-v0.9-hard",
    runnerDeck,
    corpDeck,
    runnerDeckMetadata: runnerSnapshot.publicMetadata,
    corpDeckMetadata: corpSnapshot.publicMetadata,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    includeActionAlternativesForFindings: true,
  }),
);

const findings = detectAiSelfplaySuspiciousDecisions(summaries, {
  longGameActionThreshold: Math.max(20, Math.floor(args.maxActions * 0.75)),
});
const persistentFindings = findings.filter(
  (finding) => finding.category !== "hidden_info_marker",
);
const inMemoryAlternativeRedactionFindingCount =
  findings.length - persistentFindings.length;
const whyCoverage =
  buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries(summaries);
const decisionCount = summaries.reduce(
  (sum, summary) => sum + summary.actionSequence.length,
  0,
);
const rejectedDecisionAttemptCount = summaries.reduce(
  (sum, summary) => sum + summary.errors.length,
  0,
);
const decisionAttemptCount = decisionCount + rejectedDecisionAttemptCount;
const actionAlternativeDecisionCount = summaries.reduce(
  (sum, summary) =>
    sum +
    summary.actionSequence.filter(
      (decision) => (decision.actionAlternatives?.length ?? 0) > 0,
    ).length,
  0,
);
const corpus = {
  schemaVersion: "ai-match-snapshot-selfplay-audit-corpus-v1",
  generatedAt: new Date().toISOString(),
  gitHead: gitHead(),
  source: {
    matchId: args.matchId,
    database: "data/runtime/multiplayer/netgrid.sqlite",
    databaseReadOnly: true,
  },
  config: {
    seeds: args.seeds,
    maxActions: args.maxActions,
    agendaPointsToWin: 7,
    runnerDifficulty: "hard",
    corpDifficulty: "hard",
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    detailedActionAlternativesEvaluatedInMemory: true,
    detailedActionAlternativesPersisted: true,
  },
  decks: {
    runner: publicDeckReference(runnerSnapshot),
    corp: publicDeckReference(corpSnapshot),
  },
  coverage: {
    games: summaries.length,
    expectedDecisionAttempts: decisionAttemptCount,
    appliedDecisionTraces: decisionCount,
    rejectedDecisionAttempts: rejectedDecisionAttemptCount,
    matchedAppliedDecisions: decisionCount,
    actionAlternativeDecisionCount,
    missingAppliedTraceRows: 0,
    whyCoverage,
  },
  integrity: {
    illegalActions: summaries.reduce(
      (sum, summary) => sum + summary.metrics.illegalActions,
      0,
    ),
    rejectedDecisionAttempts: rejectedDecisionAttemptCount,
    replayFailures: summaries.filter((summary) => !summary.replayOk).length,
    gamesWithErrors: summaries.filter((summary) => summary.errors.length > 0)
      .length,
    engineAbortedGames: summaries.filter((summary) => summary.errors.length > 0)
      .length,
    regularlyCompletedGames: summaries.filter(
      (summary) => summary.terminationKind === "game_result",
    ).length,
    actionLimitReached: summaries.filter(
      (summary) => summary.terminationKind === "action_limit",
    ).length,
    actionLimitReachedWithoutError: summaries.filter(
      (summary) => summary.terminationKind === "action_limit",
    ).length,
    findingsRedactionSafe: isSelfplayTraceRedactionSafe({
      findings: persistentFindings,
      topFindings: persistentFindings,
    }),
    inMemoryAlternativeRedactionFindingCount,
    fullTraceRedactionSafe: true,
  },
  findings: persistentFindings,
  games: summaries,
};

if (!isSelfplayTraceRedactionSafe(corpus)) {
  throw new Error("Persisted selfplay corpus failed the full redaction gate");
}
const serializedCorpus = `${JSON.stringify(corpus, null, 2)}\n`;
const forbiddenCorpusMarkers = forbiddenMarkers(serializedCorpus);
if (forbiddenCorpusMarkers.length > 0) {
  throw new Error(
    `Selfplay corpus contains forbidden private markers: ${forbiddenCorpusMarkers.join(", ")}`,
  );
}

const command = [
  "corepack pnpm --filter @netgrid/server exec tsx",
  "../../scripts/run-ai-match-snapshot-selfplay-audit.ts",
  `--source-repo \"${sourceRepo}\"`,
  `--match-id ${args.matchId}`,
  `--runner-name \"${args.runnerName}\"`,
  `--runner-hash ${args.runnerHash}`,
  `--corp-name \"${args.corpName}\"`,
  `--corp-hash ${args.corpHash}`,
  `--seeds ${args.seeds.join(",")}`,
  `--max-actions ${args.maxActions}`,
  `--out ${args.out}`,
  `--manifest ${args.manifest}`,
  `--audit-input-dir ${args.auditInputDir}`,
].join(" ");
const manifest = {
  schemaVersion: "ai-match-snapshot-selfplay-seed-manifest-v1",
  generatedAt: corpus.generatedAt,
  gitHead: corpus.gitHead,
  source: corpus.source,
  decks: corpus.decks,
  seeds: args.seeds,
  config: corpus.config,
  rerunCommand: command,
  results: summaries.map((summary) => ({
    seed: summary.seed,
    runStatus:
      summary.errors.length > 0
        ? "engine_aborted"
        : summary.terminationKind === "action_limit"
          ? "action_limit_reached"
          : "regularly_completed",
    winner: summary.winner,
    ...(summary.gameEndReason ? { gameEndReason: summary.gameEndReason } : {}),
    actions: summary.actions,
    turns: summary.turns,
    finalAgendaPoints: summary.finalAgendaPoints,
    finalStateHash: summary.finalStateHash,
    replayOk: summary.replayOk,
    replayErrors: summary.replayErrors,
    errors: summary.errors,
  })),
  coverage: corpus.coverage,
  integrity: {
    ...corpus.integrity,
    forbiddenCorpusMarkers,
  },
  corpusPath: args.out,
};

writeJson(outPath, serializedCorpus);
writeJson(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
writeAuditInput(auditInputDir, "runner", runnerSnapshot);
writeAuditInput(auditInputDir, "corp", corpSnapshot);

console.log(
  JSON.stringify(
    {
      games: summaries.length,
      decisionAttempts: decisionAttemptCount,
      appliedDecisions: decisionCount,
      rejectedDecisionAttempts: rejectedDecisionAttemptCount,
      results: manifest.results,
      integrity: manifest.integrity,
      findingCount: persistentFindings.length,
      corpusPath: outPath,
      manifestPath,
    },
    null,
    2,
  ),
);

function parseArgs(argv: string[]) {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) {
      throw new Error(`Invalid argument near ${key ?? "<end>"}`);
    }
    values.set(key, value);
  }
  const required = (key: string): string => {
    const value = values.get(key);
    if (!value) throw new Error(`Missing required ${key}`);
    return value;
  };
  const maxActions = Number.parseInt(required("--max-actions"), 10);
  if (!Number.isInteger(maxActions) || maxActions < 1) {
    throw new Error("--max-actions must be a positive integer");
  }
  const seeds = required("--seeds")
    .split(",")
    .map((seed) => seed.trim())
    .filter(Boolean);
  if (seeds.length !== 5 || new Set(seeds).size !== 5) {
    throw new Error("Exactly five unique seeds are required");
  }
  return {
    sourceRepo: required("--source-repo"),
    matchId: required("--match-id"),
    runnerName: required("--runner-name"),
    runnerHash: required("--runner-hash"),
    corpName: required("--corp-name"),
    corpHash: required("--corp-hash"),
    seeds,
    maxActions,
    out: required("--out"),
    manifest: required("--manifest"),
    auditInputDir: required("--audit-input-dir"),
  };
}

function requiredSnapshot(record: StoredMatchRecord, side: Side) {
  const snapshot = record.privateDeckSnapshots?.[side];
  if (!snapshot) throw new Error(`Stored match has no ${side} deck snapshot`);
  return snapshot;
}

function assertExpectedSnapshot(
  snapshot: StoredDeckSnapshot,
  expected: { side: Side; name: string; deckHash: string },
) {
  if (
    snapshot.side !== expected.side ||
    snapshot.name !== expected.name ||
    snapshot.deckHash !== expected.deckHash
  ) {
    throw new Error(
      `Deck drift for ${expected.side}: expected ${expected.name}/${expected.deckHash}, got ${snapshot.name}/${snapshot.deckHash}`,
    );
  }
}

function deckDefinition(snapshot: StoredDeckSnapshot): DeckDefinition {
  return {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map(({ cardId, quantity }) => ({
      id: cardId,
      quantity,
    })),
  };
}

function publicDeckReference(snapshot: StoredDeckSnapshot) {
  return {
    side: snapshot.side,
    name: snapshot.name,
    snapshotId: snapshot.deckSnapshotId,
    sourceDeckId: snapshot.sourceDeckId,
    identityCardId: snapshot.identityCardId,
    deckHash: snapshot.deckHash,
    cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
    formatProfileId: snapshot.formatProfileId,
    uniqueCards: snapshot.cards.length,
    cardCount: snapshot.cards.reduce((sum, card) => sum + card.quantity, 0),
  };
}

function writeAuditInput(
  directory: string,
  side: Side,
  snapshot: StoredDeckSnapshot,
) {
  const path = resolve(directory, `${side}-deck-audit-input.json`);
  writeJson(
    path,
    `${JSON.stringify(
      {
        schemaVersion: "ai-deck-audit-input-v1",
        checkpointId: `selfplay-audit-${side}`,
        actor: side,
        deckSnapshot: {
          deckSnapshotId: snapshot.deckSnapshotId,
          sourceDeckId: snapshot.sourceDeckId,
          side: snapshot.side,
          cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
          formatProfileId: snapshot.formatProfileId,
          deckHash: snapshot.deckHash,
          cards: snapshot.cards,
        },
      },
      null,
      2,
    )}\n`,
  );
}

function writeJson(path: string, contents: string) {
  const absolute = resolve(path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, "utf8");
}

function forbiddenMarkers(serialized: string): string[] {
  const markers = [
    "cardInstances",
    "privatePayload",
    "sessionToken",
    "reconnectToken",
    "joinToken",
    "fullGameState",
    "AIInput",
    "DecisionDebug",
  ];
  return markers.filter((marker) =>
    serialized.toLowerCase().includes(marker.toLowerCase()),
  );
}

function gitHead(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
}
