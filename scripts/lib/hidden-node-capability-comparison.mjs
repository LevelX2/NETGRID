import {
  gameKey,
  compareEvaluations,
  validateEvaluation,
} from "./hidden-node-evaluation-summary.mjs";

export function originalEvaluationFromRegistry(evidence, pairingIds) {
  if (!pairingIds.length || new Set(pairingIds).size !== pairingIds.length)
    throw new Error("invalid_baseline_pairing_ids");
  const pairings = pairingIds.map((id) => {
    const matches = evidence.pairings.filter(
      (pairing) => pairing.pairing_id === id,
    );
    if (matches.length !== 1 || matches[0].status !== "closed")
      throw new Error("missing_closed_baseline_pairing");
    return matches[0];
  });
  const manifest = pairings[0].reproduction_json.manifest;
  if (
    manifest.config.label !== "original" ||
    (manifest.config.changes?.length ?? 0) !== 0
  )
    throw new Error("baseline_is_not_original");
  for (const pairing of pairings) {
    if (
      JSON.stringify(pairing.reproduction_json.manifest) !==
        JSON.stringify(manifest) ||
      pairing.source_commit !== manifest.sourceCommit ||
      pairing.corp_snapshot_hash !==
        manifest.corpSnapshot.publicMetadata.deckHash
    )
      throw new Error("baseline_manifest_mismatch");
  }
  const games = evidence.games
    .filter((row) => pairingIds.includes(row.pairing_id))
    .map((row) => {
      const game = row.metadata_json;
      if (
        row.game_key !== gameKey(game) ||
        row.seed !== game.seed ||
        row.state_hash !== game.hash ||
        row.corp_agenda_points !== game.points.corp ||
        row.runner_agenda_points !== game.points.runner ||
        row.winner.toLowerCase() !== game.winner ||
        row.decision_count !== game.actions
      )
        throw new Error("baseline_registry_metadata_mismatch");
      return game;
    });
  const order = new Map(
    manifest.config.games.map((game, index) => [gameKey(game), index]),
  );
  games.sort(
    (left, right) => order.get(gameKey(left)) - order.get(gameKey(right)),
  );
  validateEvaluation(manifest, games);
  return { manifest, games };
}

export function compareCapabilityEvaluations(baseline, candidate) {
  validateEvaluation(baseline.manifest, baseline.games);
  validateEvaluation(candidate.manifest, candidate.games);
  const sameDecks = baseline.games.every((before, index) => {
    const after = candidate.games[index];
    return (
      after &&
      JSON.stringify(before.corpSnapshot) ===
        JSON.stringify(after.corpSnapshot) &&
      JSON.stringify(before.runnerSnapshot) ===
        JSON.stringify(after.runnerSnapshot)
    );
  });
  if (!sameDecks || (candidate.manifest.config.changes?.length ?? 0) > 0)
    throw new Error("capability_comparison_changed_decks");
  if (baseline.manifest.sourceCommit === candidate.manifest.sourceCommit)
    throw new Error("capability_comparison_has_no_new_source");
  const comparison = compareEvaluations(baseline, candidate);
  return {
    ...comparison,
    baselineSource: baseline.manifest.sourceCommit,
    candidateSource: candidate.manifest.sourceCommit,
    sameFinalHashGames: baseline.games.filter(
      (before, index) => before.hash === candidate.games[index].hash,
    ).length,
    pairs: comparison.pairs.map((pair, index) => ({
      ...pair,
      sameFinalHash: baseline.games[index].hash === candidate.games[index].hash,
      beforeActions: baseline.games[index].actions,
      afterActions: candidate.games[index].actions,
    })),
    caveats: [
      "Identische Corp- und Runner-Snapshots; alte und neue Systemstände, keine neuen Deckvarianten.",
      "Der neue Stand korrigiert auch Engine-Legalität und Zahlungen. Der Vergleich isoliert keinen reinen KI-Bewertungseffekt.",
      "Die acht Pilotseeds sind Teil der 40 bekannten Seeds und keine zusätzlichen unabhängigen Spiele.",
      "Die 30 Holdout-Seeds wurden bereits im vorherigen Vergleich gespielt; sie sind kein neuer unberührter Testsatz.",
      "Vorbereitete Capability-Fixtures sind kein Nachweis für natürlich erreichte Vorbereitung oder allgemeine Spielstärke.",
      "Aktionszahlen messen weder realisierten Bluffwert noch sämtliche passiven Schadens-/Region-Effekte.",
      "Nullscore-Siege gelten nicht als Mangel; nicht erreichte Meilensteine bleiben als null erhalten.",
    ],
  };
}
