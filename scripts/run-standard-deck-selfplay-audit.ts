import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type {
  AiDifficulty,
  DeckDefinition,
  DeckPublicMetadata,
  GameEvent,
  LegalAction,
  Side,
} from "../packages/shared/src/index";
import { simulateAiGame } from "../packages/ai/src/simulation";
import type { AiSimulationDecisionCheckpointCapture } from "../packages/ai/src/simulation/ai-simulation-config";

type StandardDeck = {
  standardDeckId: string;
  version: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion: string;
  formatProfileId: string;
  formatProfileVersion: string;
  cards: Array<{ cardId: string; quantity: number }>;
};

type StandardDeckCatalog = {
  decks: StandardDeck[];
};

type PrivilegedDecisionCapture = {
  actionIndex: number;
  side: Side;
  stateVersion: number;
  stateHashBefore: string;
  previousEvent?: GameEvent;
  input: AiSimulationDecisionCheckpointCapture["input"];
  deckSnapshot: AiSimulationDecisionCheckpointCapture["deckSnapshot"];
};

const repoRoot = resolve(import.meta.dirname, "..");
const args = parseArgs(process.argv.slice(2));
const catalog = JSON.parse(
  readFileSync(resolve(repoRoot, args.catalog), "utf8"),
) as StandardDeckCatalog;
const runner = findDeck(catalog, args.runnerDeckId, "runner");
const corp = findDeck(catalog, args.corpDeckId, "corp");
const captures = new Map<number, PrivilegedDecisionCapture>();

const summary = simulateAiGame({
  seed: args.seed,
  matchId: `selfplay:${args.seed}`,
  maxActions: args.maxActions,
  runnerDeck: deckDefinition(runner),
  corpDeck: deckDefinition(corp),
  runnerDeckMetadata: deckMetadata(runner, args.runnerDeckHash),
  corpDeckMetadata: deckMetadata(corp, args.corpDeckHash),
  runnerControllerMode: "current_candidate",
  corpControllerMode: "current_candidate",
  runnerDifficulty: args.runnerDifficulty,
  corpDifficulty: args.corpDifficulty,
  includeActionAlternativesForFindings: true,
  testOnlyDecisionCheckpointCapture: {
    actionIndices: Array.from({ length: args.maxActions }, (_, index) => index),
    capture: (snapshot) => {
      captures.set(snapshot.actionIndex, {
        actionIndex: snapshot.actionIndex,
        side: snapshot.side,
        stateVersion: snapshot.state.stateVersion,
        stateHashBefore: snapshot.input.stateHash,
        ...(snapshot.state.eventLog.at(-1)
          ? { previousEvent: structuredClone(snapshot.state.eventLog.at(-1)) }
          : {}),
        input: structuredClone(snapshot.input),
        deckSnapshot: structuredClone(snapshot.deckSnapshot),
      });
    },
  },
});

const decisions = summary.actionSequence.map((entry, actionIndex) => {
  const capture = captures.get(actionIndex);
  if (!capture) {
    throw new Error(`missing_privileged_capture:${actionIndex}`);
  }
  const appliedEvent = captures.get(actionIndex + 1)?.previousEvent;
  const selectedLegalAction =
    selectedLegalActionFromEvent(appliedEvent, entry.side) ??
    uniquelyMatchingLegalAction(capture.input.legalActions, entry.actionType);
  return {
    actionIndex,
    side: entry.side,
    stateVersionBefore: entry.stateVersionBefore,
    selectedLegalAction,
    appliedEvent,
    trace: entry,
    input: capture.input,
    deckSnapshot: capture.deckSnapshot,
  };
});

const output = {
  schemaVersion: "netgrid.standard-deck-privileged-selfplay-audit.v1",
  generatedAt: new Date().toISOString(),
  privilegedLocalAudit: true,
  config: {
    seed: args.seed,
    maxActions: args.maxActions,
    runnerDeckId: runner.standardDeckId,
    runnerDeckHash: args.runnerDeckHash,
    corpDeckId: corp.standardDeckId,
    corpDeckHash: args.corpDeckHash,
    runnerDifficulty: args.runnerDifficulty,
    corpDifficulty: args.corpDifficulty,
  },
  result: {
    terminationKind: summary.terminationKind,
    winner: summary.winner,
    gameEndReason: summary.gameEndReason,
    actions: summary.actions,
    turns: summary.turns,
    finalAgendaPoints: summary.finalAgendaPoints,
    finalStateHash: summary.finalStateHash,
    eventLogLength: summary.eventLogLength,
    replayOk: summary.replayOk,
    replayErrors: summary.replayErrors,
    errors: summary.errors,
    runtimeFailures: summary.runtimeFailures,
    metrics: summary.metrics,
  },
  decisions,
};

const outputPath = resolve(repoRoot, args.out);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(
  `${JSON.stringify({
    ok:
      summary.terminationKind === "game_result" &&
      summary.replayOk &&
      summary.errors.length === 0,
    out: outputPath,
    result: output.result,
  })}\n`,
);

function selectedLegalActionFromEvent(
  event: GameEvent | undefined,
  side: Side,
): LegalAction | undefined {
  const payload = event?.privatePayload?.[side] as
    | { legalAction?: LegalAction }
    | undefined;
  return payload?.legalAction;
}

function uniquelyMatchingLegalAction(
  legalActions: LegalAction[],
  actionType: LegalAction["type"],
): LegalAction | undefined {
  const matches = legalActions.filter((action) => action.type === actionType);
  return matches.length === 1 ? matches[0] : undefined;
}

function findDeck(
  catalog: StandardDeckCatalog,
  deckId: string,
  side: Side,
): StandardDeck {
  const deck = catalog.decks.find(
    (candidate) =>
      candidate.standardDeckId === deckId && candidate.side === side,
  );
  if (!deck) throw new Error(`standard_deck_not_found:${side}:${deckId}`);
  return deck;
}

function deckDefinition(deck: StandardDeck): DeckDefinition {
  return {
    id: `${deck.standardDeckId}_${deck.version}`,
    name: deck.name,
    side: deck.side,
    identity: deck.identityCardId,
    cards: deck.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function deckMetadata(
  deck: StandardDeck,
  deckHash: string,
): DeckPublicMetadata {
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion,
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion,
    deckHash,
  };
}

function parseArgs(values: string[]): {
  catalog: string;
  runnerDeckId: string;
  runnerDeckHash: string;
  corpDeckId: string;
  corpDeckHash: string;
  seed: string;
  maxActions: number;
  out: string;
  runnerDifficulty: AiDifficulty;
  corpDifficulty: AiDifficulty;
} {
  const value = (name: string, fallback?: string): string => {
    const index = values.indexOf(name);
    const result = index >= 0 ? values[index + 1] : fallback;
    if (!result) throw new Error(`missing_argument:${name}`);
    return result;
  };
  const difficulty = (name: string): AiDifficulty => {
    const result = value(name, "hard");
    if (result !== "easy" && result !== "normal" && result !== "hard") {
      throw new Error(`invalid_argument:${name}`);
    }
    return result;
  };
  const maxActions = Number.parseInt(value("--max-actions", "240"), 10);
  if (!Number.isInteger(maxActions) || maxActions < 1) {
    throw new Error("invalid_argument:--max-actions");
  }
  return {
    catalog: value("--catalog", "data/decks/standard-deck-catalog-1.0.0.json"),
    runnerDeckId: value("--runner-deck-id"),
    runnerDeckHash: value("--runner-deck-hash"),
    corpDeckId: value("--corp-deck-id"),
    corpDeckHash: value("--corp-deck-hash"),
    seed: value("--seed"),
    maxActions,
    out: value("--out"),
    runnerDifficulty: difficulty("--runner-difficulty"),
    corpDifficulty: difficulty("--corp-difficulty"),
  };
}
