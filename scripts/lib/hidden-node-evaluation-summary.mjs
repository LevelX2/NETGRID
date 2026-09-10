import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export const gameKey = (game) => `${game.runnerId}:${game.seed}`;

export function readEvaluation(directory) {
  const manifest = JSON.parse(
    readFileSync(resolve(directory, "manifest.json"), "utf8"),
  );
  const games = readdirSync(directory)
    .filter((name) => /^\d{3}\.json$/.test(name))
    .sort()
    .map((name) => JSON.parse(readFileSync(resolve(directory, name), "utf8")));
  validateEvaluation(manifest, games);
  return { manifest, games };
}

export function validateEvaluation(manifest, games) {
  const expected = manifest.config.games.map(gameKey);
  if (
    new Set(expected).size !== expected.length ||
    new Set(games.map(gameKey)).size !== games.length
  )
    throw new Error("duplicate_game_key");
  if (
    games.length !== expected.length ||
    expected.some((key, i) => gameKey(games[i]) !== key)
  )
    throw new Error("incomplete_or_misaligned_evaluation");
  for (const game of games) {
    if (
      game.sourceCommit !== manifest.sourceCommit ||
      game.corpSnapshot.deckHash !==
        manifest.corpSnapshot.publicMetadata.deckHash
    )
      throw new Error("source_or_deck_mismatch");
    if (
      game.terminationKind !== "game_result" ||
      !["corp", "runner"].includes(game.winner) ||
      game.replayOk !== true ||
      game.errors.length ||
      game.replayErrors.length ||
      game.runtimeFailures?.length ||
      game.fallbacks !== 0 ||
      game.timeouts !== 0
    )
      throw new Error("nonclean_game");
  }
}

export function summarizeGames(games) {
  const sum = (fn) => games.reduce((total, game) => total + fn(game), 0);
  return {
    games: games.length,
    corpWins: games.filter((game) => game.winner === "corp").length,
    corpPoints: sum((game) => game.points.corp),
    zeroScoreGames: games.filter((game) => game.points.corp === 0).length,
    zeroScoreLosses: games.filter(
      (game) => game.points.corp === 0 && game.winner !== "corp",
    ).length,
    nonScoreWins: games.filter(
      (game) => game.points.corp === 0 && game.winner === "corp",
    ).length,
    scoreActions: sum((game) => game.byAction.score_agenda ?? 0),
    basicCreditActions: sum((game) => game.byAction.gain_credit ?? 0),
    economyActions: sum((game) => game.byOwner["corp.economy"] ?? 0),
    scoreOwnedFirstInstallTurns: games.map((game) => ({
      seed: game.seed,
      turn: game.firstAgendaInstallTurn,
    })),
    firstScoreTurns: games.map((game) => ({
      seed: game.seed,
      turn: game.firstScoreTurn,
    })),
  };
}

export function compareEvaluations(baseline, candidate) {
  if (
    JSON.stringify(baseline.games.map(gameKey)) !==
    JSON.stringify(candidate.games.map(gameKey))
  )
    throw new Error("comparison_seed_set_mismatch");
  const cohorts = [
    ["known_krashkurs_40", (game) => game.seed.startsWith("meta-357-final-")],
    ...[1, 2, 3].map((opponent) => [
      `holdout_${opponent}_10`,
      (game) =>
        game.seed.startsWith(`hidden-node-holdout-20260905-${opponent}-`),
    ]),
  ];
  return {
    baseline: summarizeGames(baseline.games),
    candidate: summarizeGames(candidate.games),
    cohorts: cohorts.map(([label, accepts]) => ({
      label,
      baseline: summarizeGames(baseline.games.filter(accepts)),
      candidate: summarizeGames(candidate.games.filter(accepts)),
    })),
    pairs: baseline.games.map((before, index) => {
      const after = candidate.games[index];
      return {
        key: gameKey(before),
        beforeWinner: before.winner,
        afterWinner: after.winner,
        beforePoints: before.points.corp,
        afterPoints: after.points.corp,
        beforeFirstScore: before.firstScoreTurn,
        afterFirstScore: after.firstScoreTurn,
      };
    }),
    caveats: [
      "Fixed-seed paired experiment; changing the list also changes the deal and downstream decisions.",
      "The eight diagnostic pilot games are included in the known 40, not independent extra evidence.",
      "No production AI change: old/new AI with original deck are the same control condition.",
      "Observed action counts do not measure realized bluff, damage or Region effects.",
      "First-score and first-install turns retain nulls; no survivor-only averages are reported.",
      "A small number of wins does not establish a general playing-strength improvement.",
    ],
  };
}
