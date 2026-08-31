import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DeckDefinition } from "@netgrid/shared";
import {
  runAiSelfplayTraceMining,
  simulateAiGame,
} from "../packages/ai/src/simulation";
import { proteusPilotTerminationTotals } from "./proteus-ai-selected-pilot-report";

type PlaytestDeckFile = {
  decks: DeckDefinition[];
};

const root = resolve(import.meta.dirname, "..");
const outputRelative = "data/ai/proteus-ai-selected-pilot-v1.json";
const outputPath = resolve(root, outputRelative);
const shouldWrite = process.argv.includes("--write");
const shouldCheck = process.argv.includes("--check");
const deckFile = readJson<PlaytestDeckFile>(
  "data/decks/proteus-playtest-decks-2026-05-25.json",
);
const runnerDecks = deckFile.decks.filter((deck) => deck.side === "runner");
const corpDecks = deckFile.decks.filter((deck) => deck.side === "corp");
const seeds = [
  "proteus-pilot-qualifier-01",
  "proteus-pilot-qualifier-02",
  "proteus-pilot-holdout-01",
  "proteus-pilot-holdout-02",
];
const maxActions = 480;
const workerResultMarker = "NETGRID_PROTEUS_PILOT_WORKER_RESULT ";

assert(runnerDecks.length === 2, "Expected two Proteus Runner pilot decks.");
assert(corpDecks.length === 2, "Expected two Proteus Corp pilot decks.");

if (process.argv.includes("--pair-worker")) {
  const runnerDeckId = requiredArgument("--runner-deck-id");
  const corpDeckId = requiredArgument("--corp-deck-id");
  const runnerDeck = requiredDeck(runnerDecks, runnerDeckId);
  const corpDeck = requiredDeck(corpDecks, corpDeckId);
  process.stdout.write(
    `${workerResultMarker}${JSON.stringify(simulatePair(runnerDeck, corpDeck))}\n`,
  );
  process.exit(0);
}

if (process.argv.includes("--control-worker")) {
  const seed = requiredArgument("--seed");
  process.stdout.write(
    `${workerResultMarker}${JSON.stringify(simulateControlGame(seed))}\n`,
  );
  process.exit(0);
}

const pairWorkerResults = runnerDecks.flatMap((runnerDeck) =>
  corpDecks.map((corpDeck) => runPairWorker(runnerDeck.id, corpDeck.id)),
);
const pairResults = pairWorkerResults.map((result) => result.pair);
const pilotFailureDiagnostics = pairWorkerResults.flatMap(
  (result) => result.failureDiagnostics,
);
const controlGames = seeds.map(runControlWorker);

function simulateControlGame(seed: string) {
  const summary = simulateAiGame({
    seed: `originalset-control:${seed}`,
    maxActions,
  });
  return {
    seed: summary.seed,
    winner: summary.winner,
    actions: summary.actions,
    finalStateHash: summary.finalStateHash,
    replayOk: summary.replayOk,
    illegalActions: summary.metrics.illegalActions,
  };
}

function simulatePair(runnerDeck: DeckDefinition, corpDeck: DeckDefinition) {
  const pairId = `${runnerDeck.id}__${corpDeck.id}`;
  const result = runAiSelfplayTraceMining({
    seeds,
    maxActions,
    runnerDeck,
    corpDeck,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    maxFindings: 20,
  });
  const failureDiagnostics = result.summaries.flatMap((summary) =>
    summary.errors.length > 0
      ? [
          {
            pairId,
            seed: summary.seed,
            errors: [...summary.errors],
          },
        ]
      : [],
  );
  return {
    pair: {
      pairId,
      runnerDeckId: runnerDeck.id,
      corpDeckId: corpDeck.id,
      aggregate: result.aggregate,
      games: result.summaries.map((summary) => ({
        seed: summary.seed,
        holdout: summary.seed.includes("holdout"),
        winner: summary.winner,
        gameEndReason: summary.gameEndReason ?? null,
        terminationKind: summary.terminationKind,
        actions: summary.actions,
        turns: summary.turns,
        finalAgendaPoints: summary.finalAgendaPoints,
        finalStateHash: summary.finalStateHash,
        replayOk: summary.replayOk,
        illegalActions: summary.metrics.illegalActions,
        fallbackRate: summary.metrics.fallbackRate,
        noProgress:
          summary.terminationKind === "action_limit" &&
          summary.finalAgendaPoints.runner === 0 &&
          summary.finalAgendaPoints.corp === 0,
      })),
    },
    failureDiagnostics,
  };
}

function runPairWorker(runnerDeckId: string, corpDeckId: string) {
  return runWorker<ReturnType<typeof simulatePair>>([
    "--pair-worker",
    `--runner-deck-id=${runnerDeckId}`,
    `--corp-deck-id=${corpDeckId}`,
  ]);
}

function runControlWorker(seed: string) {
  return runWorker<ReturnType<typeof simulateControlGame>>([
    "--control-worker",
    `--seed=${seed}`,
  ]);
}

function runWorker<Result>(arguments_: string[]): Result {
  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", fileURLToPath(import.meta.url), ...arguments_],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  const resultLine = output
    .split(/\r?\n/)
    .find((line) => line.startsWith(workerResultMarker));
  assert(
    resultLine,
    `Proteus pilot worker emitted no structured result: ${output.slice(-1000)}`,
  );
  return JSON.parse(resultLine.slice(workerResultMarker.length)) as Result;
}

function requiredArgument(name: string): string {
  const prefix = `${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix));
  assert(value, `Missing worker argument ${name}.`);
  return value.slice(prefix.length);
}

function requiredDeck(
  decks: readonly DeckDefinition[],
  deckId: string,
): DeckDefinition {
  const deck = decks.find((candidate) => candidate.id === deckId);
  assert(deck, `Unknown Proteus pilot deck ${deckId}.`);
  return deck;
}

const games = pairResults.flatMap((pair) => pair.games);
const terminationTotals = proteusPilotTerminationTotals(games);
const totals = {
  games: games.length,
  decisions: games.reduce((sum, game) => sum + game.actions, 0),
  ...terminationTotals,
  noProgressGames: games.filter((game) => game.noProgress).length,
  illegalActions: games.reduce((sum, game) => sum + game.illegalActions, 0),
  replayFailures: games.filter((game) => !game.replayOk).length,
  redactionFailures: pairResults.filter(
    (pair) => pair.aggregate.allRedactionSafe !== true,
  ).length,
};
const rates = {
  completionRate: round(totals.completedGames / totals.games),
  actionLimitRate: round(totals.actionLimitGames / totals.games),
  noProgressRate: round(totals.noProgressGames / totals.games),
  weightedFallbackRate: round(
    games.reduce((sum, game) => sum + game.fallbackRate * game.actions, 0) /
      Math.max(1, totals.decisions),
  ),
};
const thresholds = {
  illegalActionsMax: 0,
  replayFailuresMax: 0,
  redactionFailuresMax: 0,
  actionLimitRateMax: 0.75,
  noProgressRateMax: 0.25,
  weightedFallbackRateMax: 0.35,
  originalsetControlFailuresMax: 0,
};
const originalsetControlFailures = controlGames.filter(
  (game) => !game.replayOk || game.illegalActions > 0,
).length;
const gateChecks = {
  illegalActions: totals.illegalActions <= thresholds.illegalActionsMax,
  replay: totals.replayFailures <= thresholds.replayFailuresMax,
  redaction: totals.redactionFailures <= thresholds.redactionFailuresMax,
  actionLimit: rates.actionLimitRate <= thresholds.actionLimitRateMax,
  noProgress: rates.noProgressRate <= thresholds.noProgressRateMax,
  fallback: rates.weightedFallbackRate <= thresholds.weightedFallbackRateMax,
  originalsetControl:
    originalsetControlFailures <= thresholds.originalsetControlFailuresMax,
};
const gatePassed = Object.values(gateChecks).every(Boolean);
const gateFailureMessage = `Proteus selected pilot gate failed: ${JSON.stringify(
  gateChecks,
)}; totals=${JSON.stringify(totals)}; rates=${JSON.stringify(
  rates,
)}; actionLimitGames=${JSON.stringify(
  pairResults.flatMap((pair) =>
    pair.games
      .filter((game) => game.terminationKind === "action_limit")
      .map((game) => ({
        pairId: pair.pairId,
        seed: game.seed,
        actions: game.actions,
        turns: game.turns,
        finalAgendaPoints: game.finalAgendaPoints,
      })),
  ),
)}; diagnostics=${JSON.stringify(pilotFailureDiagnostics)}.`;

const report = {
  schemaVersion: "netgrid.proteus-ai-selected-pilot.v1",
  pilotId: "proteus-ai-selected-pilot-v1",
  asOf: "2026-07-09",
  status: gatePassed ? "qualified" : "blocked",
  config: {
    seeds,
    maxActions,
    pairCount: pairResults.length,
    controllerModes: {
      runner: "current_candidate",
      corp: "current_candidate",
    },
    selectedDeckIds: [...runnerDecks, ...corpDecks]
      .map((deck) => deck.id)
      .sort(),
  },
  thresholds,
  gateChecks,
  gatePassed,
  totals,
  rates,
  originalsetControl: {
    failures: originalsetControlFailures,
    games: controlGames,
  },
  pairs: pairResults,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (shouldWrite) {
  assert(gatePassed, gateFailureMessage);
  writeFileSync(outputPath, serialized, "utf8");
  console.log(`Wrote ${outputRelative}; gatePassed=${gatePassed}.`);
} else if (shouldCheck) {
  const current = readJson<typeof report>(outputRelative);
  assert(
    JSON.stringify(current) === JSON.stringify(report),
    "Proteus selected pilot report is stale. Run build:proteus-ai-selected-pilot.",
  );
  console.log(
    `Proteus selected pilot current: ${totals.games} games, gatePassed=${gatePassed}.`,
  );
} else {
  process.stdout.write(serialized);
}
assert(gatePassed, gateFailureMessage);

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8")) as T;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
