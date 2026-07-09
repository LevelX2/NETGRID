import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  AiDecisionActionAlternative,
  AiDecisionScoreComponent,
  DeckDefinition,
  DeckPublicMetadata,
  Side,
} from "@netgrid/shared";
import {
  simulateAiGame,
  summarizeMatchProgressionMetrics,
  type AiSimulationSummary,
  type SimulationControllerMode,
} from "../packages/ai/src/index";
import { progressAwareAlternativeSnapshot } from "../packages/ai/src/simulation/progress-aware-alternative-snapshot";

type ActionEntry = AiSimulationSummary["actionSequence"][number];

type StoredDeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId?: string;
  deckVersion?: string;
  name: string;
  side: Side;
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
  publicMetadata?: DeckPublicMetadata;
  deckHash?: string;
};

type PrivateDeckSnapshots = {
  runner: StoredDeckSnapshot;
  corp: StoredDeckSnapshot;
};

type MatchRecord = {
  match?: {
    matchId?: string;
    status?: string;
    mode?: string;
    seed?: string;
    updatedAt?: string;
    settings?: { agendaPointsToWin?: number; cardPool?: string };
    deckSetup?: {
      runner?: DeckPublicMetadata;
      corp?: DeckPublicMetadata;
    };
  };
  privateDeckSnapshots?: PrivateDeckSnapshots;
};

type Args = {
  sqlite: string;
  matchId?: string;
  seed: string;
  maxActions: number;
  runnerMode: SimulationControllerMode;
  corpMode: SimulationControllerMode;
  out: string;
  lastActions: number;
  maxAlternatives: number;
};

const RELEVANT_SCORE_COMPONENT_PATTERNS = [
  /triage/i,
  /score/i,
  /scoreline/i,
  /remote/i,
  /central/i,
  /hq/i,
  /rnd/i,
  /rd/i,
  /archive/i,
  /ice/i,
  /rez/i,
  /economy/i,
  /credit/i,
  /passive/i,
  /contest/i,
  /window/i,
  /advance/i,
  /strategy/i,
  /strategic/i,
  /intent/i,
  /punish/i,
  /tag/i,
  /damage/i,
  /virus/i,
];

const repoRoot = findRepoRoot(process.cwd());
const args = parseArgs(process.argv.slice(2));
const sqlitePath = resolve(repoRoot, args.sqlite);
const outPath = resolve(repoRoot, args.out);
const match = readMatchDecks(sqlitePath, args.matchId);
const runnerDeck = deckDefinitionFromSnapshot(match.decks.runner);
const corpDeck = deckDefinitionFromSnapshot(match.decks.corp);
const runnerDeckMetadata =
  match.decks.runner.publicMetadata ?? match.record.match?.deckSetup?.runner;
const corpDeckMetadata =
  match.decks.corp.publicMetadata ?? match.record.match?.deckSetup?.corp;

const summary = simulateAiGame({
  seed: args.seed,
  maxActions: args.maxActions,
  runnerDeck,
  corpDeck,
  ...(runnerDeckMetadata ? { runnerDeckMetadata } : {}),
  ...(corpDeckMetadata ? { corpDeckMetadata } : {}),
  runnerControllerMode: args.runnerMode,
  corpControllerMode: args.corpMode,
  includeActionAlternativesForFindings: true,
});
const progression = summarizeMatchProgressionMetrics([summary]);

const output = {
  schemaVersion: "netgrid-ai-match-deck-seed-diagnostics-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: {
    sqlite: relative(repoRoot, sqlitePath).replaceAll("\\", "/"),
    matchId: match.matchId,
    matchStatus: match.record.match?.status,
    matchMode: match.record.match?.mode,
    matchUpdatedAt: match.record.match?.updatedAt,
    matchSeed: match.record.match?.seed,
    cardPool: match.record.match?.settings?.cardPool,
  },
  config: {
    seed: args.seed,
    maxActions: args.maxActions,
    runnerMode: args.runnerMode,
    corpMode: args.corpMode,
    lastActions: args.lastActions,
    maxAlternatives: args.maxAlternatives,
  },
  decks: {
    runner: deckMetadata(match.decks.runner, runnerDeckMetadata),
    corp: deckMetadata(match.decks.corp, corpDeckMetadata),
  },
  summary: {
    winner: summary.winner,
    gameEndReason: summary.gameEndReason,
    actions: summary.actions,
    turns: summary.turns,
    finalAgendaPoints: summary.finalAgendaPoints,
    replayOk: summary.replayOk,
    replayErrors: summary.replayErrors,
    errors: summary.errors,
  },
  progression,
  counts: {
    bySideActionType: countBy(summary.actionSequence, (entry) =>
      [entry.side, entry.actionType].join(":"),
    ),
    corpActionTypes: countBy(
      summary.actionSequence.filter((entry) => entry.side === "corp"),
      (entry) => entry.actionType,
    ),
    runnerActionTypes: countBy(
      summary.actionSequence.filter((entry) => entry.side === "runner"),
      (entry) => entry.actionType,
    ),
    corpTargets: countBy(
      summary.actionSequence.filter((entry) => entry.side === "corp"),
      (entry) => entry.targetServerId ?? entry.installPlacement ?? "none",
    ),
    runnerTargets: countBy(
      summary.actionSequence.filter((entry) => entry.side === "runner"),
      (entry) => entry.targetServerId ?? "none",
    ),
    flags: flagCounts(summary.actionSequence),
  },
  corpKeyWindows: keyWindows(
    summary.actionSequence,
    "corp",
    args.maxAlternatives,
  ),
  runnerKeyWindows: keyWindows(
    summary.actionSequence,
    "runner",
    args.maxAlternatives,
  ),
  lastActions: summary.actionSequence
    .slice(-args.lastActions)
    .map((entry, offset) =>
      summarizeEntry(
        entry,
        summary.actionSequence.length - args.lastActions + offset,
        args.maxAlternatives,
      ),
    ),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      seed: args.seed,
      winner: summary.winner,
      actions: summary.actions,
      finalAgendaPoints: summary.finalAgendaPoints,
      corpScores: progression.corpScores,
      runnerSteals: progression.runnerSteals,
      flags: output.counts.flags,
      out: relative(repoRoot, outPath).replaceAll("\\", "/"),
    },
    null,
    2,
  ),
);

function keyWindows(
  entries: readonly ActionEntry[],
  side: Side,
  maxAlternatives: number,
) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.side === side && isKeyWindow(entry))
    .map(({ entry, index }) => summarizeEntry(entry, index, maxAlternatives));
}

function isKeyWindow(entry: ActionEntry): boolean {
  if (entry.scoreActionsAvailable && entry.scoreActionsAvailable > 0)
    return true;
  if (entry.finalAdvance) return true;
  if (entry.unsafeFinalAdvance) return true;
  if (entry.protectedFinalAdvance) return true;
  if (entry.advancedAgendaStolen) return true;
  if (entry.corpScoreTerminalWindow) return true;
  if (entry.corpEconomyBeforeScoreDiagnosticWindow) return true;
  if (entry.corpRemoteScoringUnderbuiltWhileCentralsOverIced) return true;
  if (entry.corpExtraCentralIceChosenOverReadyRemoteBuild) return true;
  if (entry.corpExtraCentralIceChosenOverAdvanceOrScore) return true;
  if (entry.corpExtraCentralIceChosenOverAgendaInstall) return true;
  if (entry.runnerRemoteRunOpportunityAgainstAdvancedRemote) return true;
  if (entry.runnerRemoteRunAgainstAdvancedRemote) return true;
  if (entry.runnerSkippedAdvancedRemoteContest) return true;
  if (entry.runnerCentralRunWhileRemoteScoreThreatVisible) return true;
  if (entry.runnerCentralCloseoutOpportunity) return true;
  if (entry.runnerKnownPathBlockedByMissingCoverage) return true;
  return false;
}

function summarizeEntry(
  entry: ActionEntry,
  index: number,
  maxAlternatives: number,
) {
  return {
    index,
    side: entry.side,
    turnNumber: entry.turnNumber,
    stateVersionBefore: entry.stateVersionBefore,
    actionType: entry.actionType,
    selectedActionId: entry.selectedActionId,
    targetServerId: entry.targetServerId,
    installPlacement: entry.installPlacement,
    targetCardType: entry.targetCardType,
    advancementTargetTypes: entry.advancementTargetTypes,
    advancementCountersAdded: entry.advancementCountersAdded,
    scoreActionsAvailable: entry.scoreActionsAvailable,
    finalAdvance: entry.finalAdvance,
    unsafeFinalAdvance: entry.unsafeFinalAdvance,
    protectedFinalAdvance: entry.protectedFinalAdvance,
    remoteProtectionScore: entry.remoteProtectionScore,
    runnerContestRisk: entry.runnerContestRisk,
    advancesRemainingAfterAction: entry.advancesRemainingAfterAction,
    advancedAgendaStolen: entry.advancedAgendaStolen,
    advancedAgendaStealSource: entry.advancedAgendaStealSource,
    planKind: entry.planKind,
    reasonCode: entry.reasonCode,
    confidence: entry.confidence,
    keyFlags: selectedFlags(entry),
    evidence: safeStrings(entry.evidence, 12),
    debugFacts: safeStrings(relevantStrings(entry.debugFacts ?? []), 16),
    alternatives: (entry.actionAlternatives ?? [])
      .slice(0, maxAlternatives)
      .map(summarizeAlternative),
  };
}

function summarizeAlternative(alternative: AiDecisionActionAlternative) {
  return {
    ...progressAwareAlternativeSnapshot(alternative),
    actionId: alternative.actionId,
    selected: alternative.selected,
    score: scoreTotal(alternative.scoreBreakdown),
    relevantScoreBreakdown: relevantScoreBreakdown(alternative.scoreBreakdown),
  };
}

function scoreTotal(
  scoreBreakdown: readonly AiDecisionScoreComponent[] | undefined,
): number | undefined {
  if (!scoreBreakdown || scoreBreakdown.length === 0) return undefined;
  return round(
    scoreBreakdown.reduce((sum, component) => sum + (component.value ?? 0), 0),
  );
}

function relevantScoreBreakdown(
  scoreBreakdown: readonly AiDecisionScoreComponent[] | undefined,
) {
  return (scoreBreakdown ?? [])
    .filter((component) =>
      RELEVANT_SCORE_COMPONENT_PATTERNS.some((pattern) =>
        pattern.test(component.key),
      ),
    )
    .map((component) => ({
      key: component.key,
      value: component.value,
      reason: component.reason,
    }));
}

function selectedFlags(entry: ActionEntry): Record<string, unknown> {
  const flags: Record<string, unknown> = {};
  const keys: Array<keyof ActionEntry> = [
    "corpScoreTerminalWindow",
    "corpScoreTerminalWindowScoreLegal",
    "corpScoreTerminalWindowAdvanceToScoreLegal",
    "corpScoreTerminalWindowAgendaInstallLegal",
    "corpScoreTerminalWindowProtectedRemoteReady",
    "corpScoreTerminalWindowRemoteContestLow",
    "corpScoreTerminalWindowCreditsSufficient",
    "corpScoreTerminalWindowRunnerAccessThreatHigh",
    "corpScoreTerminalScoreTaken",
    "corpScoreTerminalAdvanceTaken",
    "corpScoreTerminalAgendaInstalled",
    "corpScoreTerminalSkipped",
    "corpScoreTerminalSkippedForProtection",
    "corpScoreTerminalSkippedForEconomy",
    "corpScoreTerminalSkippedForDraw",
    "corpScoreTerminalSkippedForInstallIce",
    "corpScoreTerminalSkippedForHqProtection",
    "corpScoreTerminalSkippedForRndProtection",
    "corpScoreTerminalSkippedForRemotePortfolio",
    "corpEconomyBeforeScoreDiagnosticWindow",
    "corpEconomyBeforeScoreWindowWithInstalledAgenda",
    "corpEconomyBeforeScoreWindowWithAdvancedAgenda",
    "corpEconomyBeforeScoreWindowWithScoreLegalNext",
    "corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext",
    "corpEconomyBeforeScoreWindowWithReadyRemote",
    "corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote",
    "corpEconomyBeforeScoreWindowCreditsShort",
    "corpEconomyBeforeScoreWindowCreditsAlreadyEnough",
    "corpEconomyBeforeScoreWindowRemoteSafe",
    "corpEconomyBeforeScoreWindowRemoteContestHigh",
    "corpEconomyBeforeScoreTaken",
    "corpEconomyBeforeScoreTakenAsNecessaryCredits",
    "corpEconomyBeforeScoreTakenDespiteCreditsEnough",
    "corpEconomyBeforeScoreTakenOverScoreLegal",
    "corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal",
    "corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote",
    "corpRemoteScoringUnderbuiltWhileCentralsOverIced",
    "corpReadyRemoteExists",
    "corpAgendaInHqWithReadyRemote",
    "corpExtraCentralIceChosenOverReadyRemoteBuild",
    "corpExtraCentralIceChosenOverEconomy",
    "corpExtraCentralIceChosenOverRezReserve",
    "corpExtraCentralIceChosenOverAgendaInstall",
    "corpExtraCentralIceChosenOverAdvanceOrScore",
    "runnerRemoteRunOpportunityAgainstAdvancedRemote",
    "runnerRemoteRunAgainstAdvancedRemote",
    "runnerSkippedAdvancedRemoteContest",
    "runnerCentralRunWhileRemoteScoreThreatVisible",
    "runnerCentralRunInsteadOfContestableAdvancedRemote",
    "runnerCentralRunInsteadWasJustified",
    "runnerRemoteContestBlockedByCredits",
    "runnerRemoteContestBlockedByPostRunReserve",
    "runnerRemoteContestBlockedByBreakerCoverage",
    "runnerRemoteContestBlockedByKnownIceCost",
    "runnerCentralCloseoutOpportunity",
    "runnerCentralCloseoutRunTaken",
    "runnerCentralCloseoutSuccess",
    "runnerKnownPathBlockedByMissingCoverage",
    "runnerRunStartedAgainstKnownUnbreakablePath",
    "runnerRunSuppressedAsKnownNoAccess",
    "runnerRunPenalizedAsKnownNoAccess",
  ];
  for (const key of keys) {
    const value = entry[key];
    if (value !== undefined && value !== false) flags[key] = value;
  }
  return flags;
}

function flagCounts(entries: readonly ActionEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    for (const key of Object.keys(selectedFlags(entry))) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.fromEntries(
    Object.entries(counts).sort((left, right) => right[1] - left[1]),
  );
}

function relevantStrings(values: readonly string[]): string[] {
  return values.filter((value) =>
    RELEVANT_SCORE_COMPONENT_PATTERNS.some((pattern) => pattern.test(value)),
  );
}

function safeStrings(values: readonly string[], limit: number): string[] {
  return values
    .filter((value) => !/cardInstanceId|hidden|deck\[|hand\[/i.test(value))
    .slice(0, limit);
}

function readMatchDecks(
  dbPath: string,
  requestedMatchId: string | undefined,
): { matchId: string; record: MatchRecord; decks: PrivateDeckSnapshots } {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const matchRow = requestedMatchId
    ? (db
        .prepare(
          "select match_id as matchId, record_json as recordJson from matches where match_id = ?",
        )
        .get(requestedMatchId) as
        | { matchId: string; recordJson: string }
        | undefined)
    : (db
        .prepare(
          "select match_id as matchId, record_json as recordJson from matches where status = 'finished' order by updated_at desc limit 1",
        )
        .get() as { matchId: string; recordJson: string } | undefined);
  if (!matchRow) throw new Error("No matching finished match found.");
  const privateRow = db
    .prepare(
      "select private_deck_snapshots_json as privateDeckSnapshotsJson from private_deck_snapshots where match_id = ?",
    )
    .get(matchRow.matchId) as { privateDeckSnapshotsJson?: string } | undefined;
  const record = JSON.parse(matchRow.recordJson) as MatchRecord;
  const decks = privateRow?.privateDeckSnapshotsJson
    ? (JSON.parse(privateRow.privateDeckSnapshotsJson) as PrivateDeckSnapshots)
    : record.privateDeckSnapshots;
  if (!decks?.runner || !decks.corp) {
    throw new Error(`Match ${matchRow.matchId} has no private deck snapshots.`);
  }
  return { matchId: matchRow.matchId, record, decks };
}

function deckDefinitionFromSnapshot(
  snapshot: StoredDeckSnapshot,
): DeckDefinition {
  return {
    id: snapshot.sourceDeckId ?? snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function deckMetadata(
  snapshot: StoredDeckSnapshot,
  publicMetadata: DeckPublicMetadata | undefined,
) {
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    sourceDeckId: snapshot.sourceDeckId,
    deckVersion: snapshot.deckVersion,
    name: snapshot.name,
    side: snapshot.side,
    identityCardId: snapshot.identityCardId,
    deckHash: snapshot.deckHash ?? publicMetadata?.deckHash,
    totalCards: snapshot.cards.reduce((sum, card) => sum + card.quantity, 0),
  };
}

function parseArgs(argv: string[]): Args {
  let sqlite = "data/runtime/multiplayer/netgrid.sqlite";
  let matchId: string | undefined;
  let seed = "latest-match-baseline-001";
  let maxActions = 480;
  let runnerMode: SimulationControllerMode = "current_candidate";
  let corpMode: SimulationControllerMode = "current_candidate";
  let out = "docs/reviews/ai/ai-match-deck-seed-diagnostics.json";
  let lastActions = 80;
  let maxAlternatives = 8;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--sqlite" && next) {
      sqlite = next;
      index += 1;
      continue;
    }
    if (arg === "--match-id" && next) {
      matchId = next;
      index += 1;
      continue;
    }
    if (arg === "--seed" && next) {
      seed = next;
      index += 1;
      continue;
    }
    if (arg === "--max-actions" && next) {
      maxActions = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--runner-mode" && next) {
      runnerMode = parseControllerMode(next);
      index += 1;
      continue;
    }
    if (arg === "--corp-mode" && next) {
      corpMode = parseControllerMode(next);
      index += 1;
      continue;
    }
    if (arg === "--out" && next) {
      out = next;
      index += 1;
      continue;
    }
    if (arg === "--last-actions" && next) {
      lastActions = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (arg === "--max-alternatives" && next) {
      maxAlternatives = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
  }
  if (!Number.isInteger(maxActions) || maxActions <= 0) {
    throw new Error("--max-actions must be a positive integer.");
  }
  if (!Number.isInteger(lastActions) || lastActions <= 0) {
    throw new Error("--last-actions must be a positive integer.");
  }
  if (!Number.isInteger(maxAlternatives) || maxAlternatives <= 0) {
    throw new Error("--max-alternatives must be a positive integer.");
  }
  return {
    sqlite,
    ...(matchId ? { matchId } : {}),
    seed,
    maxActions,
    runnerMode,
    corpMode,
    out,
    lastActions,
    maxAlternatives,
  };
}

function parseControllerMode(value: string): SimulationControllerMode {
  const modes: SimulationControllerMode[] = [
    "random_legal_bot",
    "current_candidate",
  ];
  if (!modes.includes(value as SimulationControllerMode)) {
    throw new Error(`Unsupported controller mode: ${value}`);
  }
  return value as SimulationControllerMode;
}

function countBy<T>(
  values: readonly T[],
  select: (value: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = select(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort((left, right) => right[1] - left[1]),
  );
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(current, "package.json"), "utf8"),
      ) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not find NETGRID repo root from ${start}`);
    }
    current = parent;
  }
}
