import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  readEvaluation,
  summarizeGames,
} from "./lib/hidden-node-evaluation-summary.mjs";

const directory = resolve(process.argv[2] ?? "tmp/hidden-node");
const ids = (process.argv[3] ?? "").split(",");
if (ids.length !== 7 || ids.some((id) => !/^\d+$/.test(id)))
  throw new Error("provide_seven_reserved_pairing_ids");
const review = readFileSync(
  "docs/architecture/ai/hidden-node-capability-review.md",
  "utf8",
);
const comparison = JSON.parse(
  readFileSync(resolve(directory, "comparison.json"), "utf8"),
);
const evaluations = [
  "baseline-original",
  "economy-control",
  "balanced-pilot",
].map((name) => ({ name, ...readEvaluation(resolve(directory, name)) }));
const bundles = evaluations.flatMap((evaluation) =>
  [...new Set(evaluation.games.map((game) => game.runnerId))].map(
    (runnerId) => ({
      evaluation,
      runnerId,
      games: evaluation.games.filter((game) => game.runnerId === runnerId),
    }),
  ),
);
if (bundles.length !== ids.length) throw new Error("pairing_count_mismatch");
const output = resolve(directory, "registry");
mkdirSync(output, { recursive: true });
for (const [index, { evaluation, runnerId, games }] of bundles.entries()) {
  const first = games[0];
  const summary = summarizeGames(games);
  const isPilot = evaluation.name === "balanced-pilot";
  const bundle = {
    schemaVersion: 1,
    pairing: {
      id: ids[index],
      jobId: "hidden-node-character-20260905",
      status: "closed",
      title: `Hidden Node ${evaluation.name} / ${first.runnerSnapshot.deckName}`,
      reviewDate: "2026-09-05",
      sourceCommit: evaluation.manifest.sourceCommit,
      statusText: isPilot
        ? "Abgeschlossener, verworfener 8-Seed-Pilot"
        : "Abgeschlossener fester Kontrollvergleich; keine unabhängige Random-Meta-Serie",
      selectionSeed: "hidden-node-predeclared-20260905",
      rulesProfile: "modern_open",
      aiMode: "current_candidate / hard / unchanged-production-ai",
      runner: {
        name: first.runnerSnapshot.deckName,
        snapshotHash: first.runnerSnapshot.deckHash,
      },
      corp: {
        name: `${first.corpSnapshot.deckName} (${evaluation.manifest.config.label})`,
        size: 45,
        snapshotId: evaluation.manifest.corpSnapshot.deckSnapshotId,
        snapshotHash: first.corpSnapshot.deckHash,
      },
      winnerAnalysis: `Corp ${summary.corpWins}/${summary.games}, Runner ${summary.games - summary.corpWins}/${summary.games}. Terminale und Replays sind geprüft.`,
      loserAnalysis:
        "Keine erfundene Einzelverlustursache: Ergebnis- und Meilensteinvergleich ist vollständig; kausale Detaildiagnose beschränkt sich auf die ausdrücklich dokumentierten Checkpoints. Null Auswahlen bedeuten nicht null Karteneffekt.",
      metaAnalysis:
        "Kein allgemeiner Spielstärkenachweis. Identischer Seed bei anderer Liste verändert auch Starthand und weitere Verzweigungen. Pilotseeds werden nicht als zusätzliche unabhängige Spiele gezählt.",
      reproduction: {
        schemaVersion: "hidden-node-experiment-v1",
        runnerId,
        manifest: evaluation.manifest,
        summary,
        comparison,
        checkpointReproduction: {
          sourceCommit: "ecf81ecfb",
          seed: "meta-357-final-034",
          actionIndices: [69, 84, 96, 267, 278],
          configCommand:
            "corepack pnpm exec tsx scripts/create-hidden-node-evaluation-config.ts",
          captureCommand:
            "corepack pnpm exec tsx scripts/evaluate-hidden-node.ts --config tmp/hidden-node/checkpoint.json --out tmp/hidden-node/checkpoint-original",
          inspectionCommand:
            "corepack pnpm exec tsx scripts/inspect-hidden-node-checkpoints.ts",
          repeatedGameHash: "fnv1a:011f527e",
          historicalAuditMatchIdDiffers: true,
        },
      },
      fullReviewMarkdown: review,
    },
    games: games.map((game, ordinal) => ({
      key: `${game.runnerId}:${game.seed}`,
      ordinal: ordinal + 1,
      phase: isPilot
        ? "pilot"
        : game.seed.startsWith("meta-")
          ? "known_control"
          : "holdout",
      seed: game.seed,
      stateHash: game.hash,
      winner: game.winner === "corp" ? "Corp" : "Runner",
      runnerAgendaPoints: game.points.runner,
      corpAgendaPoints: game.points.corp,
      terminalReason: game.reason,
      decisionCount: game.actions,
      flagsCount: 0,
      resultText: `${game.winner}: Runner ${game.points.runner}, Corp ${game.points.corp}; ${game.reason}`,
      metadata: {
        ...game,
        flagsScope:
          "runtime/replay/fallback/timeout only; not a claim of zero strategic mistakes",
      },
    })),
  };
  writeFileSync(
    resolve(output, `${ids[index]}.json`),
    JSON.stringify(bundle, null, 2),
  );
}
const escape = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const rows = comparison.cohorts
  .map(
    ({ label, baseline, candidate }) =>
      `<tr><td>${escape(label)}</td><td>${baseline.corpWins}/${baseline.games}</td><td>${candidate.corpWins}/${candidate.games}</td><td>${baseline.corpPoints} → ${candidate.corpPoints}</td><td>${baseline.zeroScoreGames} → ${candidate.zeroScoreGames}</td></tr>`,
  )
  .join("");
const htmlBody = `<!doctype html><html lang="de"><meta charset="utf-8"><title>Hidden Node: kontrollierte Verbesserung</title><style>body{font:17px system-ui;max-width:1050px;margin:40px auto;padding:0 24px;color:#202b34}table{border-collapse:collapse;width:100%}td,th{border:1px solid #c8d2db;padding:10px;text-align:left}pre{white-space:pre-wrap;font:inherit;line-height:1.5}</style><h1>Hidden Node: kontrollierter Vergleich</h1><p>Lokale Evidence ${ids.join(", ")}. Kein Versand. Produktive KI unverändert.</p><table><thead><tr><th>Kohorte</th><th>Corp-Siege Original</th><th>Corp-Siege Economy</th><th>Corp-Punkte</th><th>Nullscore-Spiele</th></tr></thead><tbody>${rows}</tbody></table><pre>${escape(review)}</pre><h2>Messgrenzen</h2><ul>${comparison.caveats.map((caveat) => `<li>${escape(caveat)}</li>`).join("")}</ul></html>`;
writeFileSync(
  resolve(output, "report.json"),
  JSON.stringify(
    {
      reportId: "hidden-node-character-20260905",
      status: "generated",
      coveredPairingIds: ids,
      subject: "Hidden Node: kontrollierter Vergleich und Fähigkeitsgrenzen",
      htmlBody,
    },
    null,
    2,
  ),
);
writeFileSync(resolve(output, "report.html"), htmlBody);
process.stdout.write(
  JSON.stringify({
    pairingIds: ids,
    games: bundles.reduce((sum, bundle) => sum + bundle.games.length, 0),
    output,
  }) + "\n",
);
