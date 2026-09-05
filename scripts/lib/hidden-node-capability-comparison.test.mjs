import assert from "node:assert/strict";
import test from "node:test";
import {
  originalEvaluationFromRegistry,
  compareCapabilityEvaluations,
} from "./hidden-node-capability-comparison.mjs";

const game = {
  runnerId: "runner",
  seed: "meta-357-final-001",
  sourceCommit: "old",
  hash: "hash-old",
  actions: 5,
  corpSnapshot: { deckHash: "corp" },
  runnerSnapshot: { deckHash: "runner" },
  terminationKind: "game_result",
  winner: "runner",
  replayOk: true,
  errors: [],
  replayErrors: [],
  runtimeFailures: [],
  fallbacks: 0,
  timeouts: 0,
  points: { corp: 0, runner: 7 },
  byAction: {},
  byOwner: {},
  firstScoreTurn: null,
  firstAgendaInstallTurn: null,
};
const manifest = {
  sourceCommit: "old",
  config: {
    label: "original",
    games: [{ runnerId: game.runnerId, seed: game.seed }],
  },
  corpSnapshot: { publicMetadata: game.corpSnapshot },
};
const evidence = {
  pairings: [
    {
      pairing_id: "1",
      status: "closed",
      source_commit: "old",
      corp_snapshot_hash: "corp",
      reproduction_json: { manifest },
    },
  ],
  games: [
    {
      pairing_id: "1",
      game_key: `${game.runnerId}:${game.seed}`,
      seed: game.seed,
      state_hash: game.hash,
      corp_agenda_points: 0,
      runner_agenda_points: 7,
      winner: "Runner",
      decision_count: 5,
      metadata_json: game,
    },
  ],
};
const candidate = () => ({
  manifest: { ...manifest, sourceCommit: "new" },
  games: [{ ...game, sourceCommit: "new" }],
});

test("reconciles the complete original baseline from compact registry evidence", () => {
  assert.deepEqual(originalEvaluationFromRegistry(evidence, ["1"]), {
    manifest,
    games: [game],
  });
  const wrong = structuredClone(evidence);
  wrong.games[0].corp_agenda_points = 1;
  assert.throws(
    () => originalEvaluationFromRegistry(wrong, ["1"]),
    /metadata_mismatch/,
  );
  assert.throws(
    () => originalEvaluationFromRegistry(evidence, ["1", "1"]),
    /invalid_baseline/,
  );
  assert.throws(
    () => originalEvaluationFromRegistry({ ...evidence, games: [] }, ["1"]),
    /incomplete/,
  );
});

test("rejects changed decks, changed seeds, dirty runtime evidence and the same source", () => {
  const baseline = { manifest, games: [game] };
  const changed = candidate();
  changed.games[0].corpSnapshot = { deckHash: "variant" };
  assert.throws(
    () => compareCapabilityEvaluations(baseline, changed),
    /source_or_deck|changed_decks/,
  );
  const otherSeed = candidate();
  otherSeed.manifest = structuredClone(otherSeed.manifest);
  otherSeed.manifest.config.games[0].seed = "other";
  otherSeed.games[0].seed = "other";
  assert.throws(
    () => compareCapabilityEvaluations(baseline, otherSeed),
    /seed_set/,
  );
  const broken = candidate();
  broken.games[0].runtimeFailures = [{}];
  assert.throws(
    () => compareCapabilityEvaluations(baseline, broken),
    /nonclean/,
  );
  assert.throws(
    () => compareCapabilityEvaluations(baseline, baseline),
    /no_new_source/,
  );
});

test("reports a system comparison, exact hash parity and no invented fresh holdout evidence", () => {
  const result = compareCapabilityEvaluations(
    { manifest, games: [game] },
    candidate(),
  );
  assert.equal(result.sameFinalHashGames, 1);
  assert.equal(result.candidateSource, "new");
  assert.equal(result.candidate.firstScoreTurns[0].turn, null);
  assert.ok(result.caveats.some((line) => line.includes("Engine-Legalität")));
  assert.ok(
    result.caveats.some((line) =>
      line.includes("kein neuer unberührter Testsatz"),
    ),
  );
});
