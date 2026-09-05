import assert from "node:assert/strict";
import test from "node:test";
import {
  compareEvaluations,
  summarizeGames,
  validateEvaluation,
} from "./hidden-node-evaluation-summary.mjs";

const game = (seed = "one") => ({
  runnerId: "runner",
  seed,
  sourceCommit: "abc",
  corpSnapshot: { deckHash: "hash" },
  terminationKind: "game_result",
  winner: "runner",
  replayOk: true,
  errors: [],
  replayErrors: [],
  runtimeFailures: [],
  fallbacks: 0,
  timeouts: 0,
  points: { corp: 0 },
  byAction: {},
  byOwner: {},
  firstAgendaInstallTurn: null,
  firstScoreTurn: null,
});
const manifest = {
  sourceCommit: "abc",
  config: { games: [game()] },
  corpSnapshot: { publicMetadata: { deckHash: "hash" } },
};

test("accepts complete clean evidence but rejects missing, duplicate and wrong-source games", () => {
  validateEvaluation(manifest, [game()]);
  assert.throws(() => validateEvaluation(manifest, []), /incomplete/);
  assert.throws(
    () => validateEvaluation(manifest, [game(), game()]),
    /duplicate/,
  );
  assert.throws(
    () =>
      validateEvaluation(manifest, [{ ...game(), sourceCommit: "different" }]),
    /source/,
  );
});
test("does not hide runtime failures behind a terminal result", () => {
  assert.throws(
    () => validateEvaluation(manifest, [{ ...game(), runtimeFailures: [{}] }]),
    /nonclean/,
  );
});
test("retains null milestones and rejects unmatched seed comparisons", () => {
  assert.equal(summarizeGames([game()]).firstScoreTurns[0].turn, null);
  assert.throws(
    () => compareEvaluations({ games: [game()] }, { games: [game("other")] }),
    /seed_set/,
  );
});

test("a won kill game without scoring is not a zero-score loss", () => {
  const summary = summarizeGames([
    { ...game(), winner: "corp", reason: "flatline" },
  ]);
  assert.equal(summary.zeroScoreGames, 1);
  assert.equal(summary.nonScoreWins, 1);
  assert.equal(summary.zeroScoreLosses, 0);
});
