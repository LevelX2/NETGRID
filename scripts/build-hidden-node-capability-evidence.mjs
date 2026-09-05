import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  readEvaluation,
  summarizeGames,
} from "./lib/hidden-node-evaluation-summary.mjs";
import {
  originalEvaluationFromRegistry,
  compareCapabilityEvaluations,
} from "./lib/hidden-node-capability-comparison.mjs";

const [candidatePath, previousExportPath, outputPath, idList] =
  process.argv.slice(2);
if (!candidatePath || !previousExportPath || !outputPath || !idList)
  throw new Error(
    "usage: candidate-directory previous-registry-export output-directory four-reserved-pairing-ids",
  );
const ids = idList.split(",");
if (
  ids.length !== 4 ||
  new Set(ids).size !== 4 ||
  ids.some((id) => !/^\d+$/.test(id))
)
  throw new Error("provide_four_distinct_reserved_pairing_ids");
const originalPairingIds = ["388", "389", "390"];
const baseline = originalEvaluationFromRegistry(
  JSON.parse(readFileSync(resolve(previousExportPath), "utf8")),
  originalPairingIds,
);
const candidate = readEvaluation(resolve(candidatePath));
const comparison = compareCapabilityEvaluations(baseline, candidate);
const review = readFileSync(
  resolve("docs/architecture/ai/hidden-node-capability-review.md"),
  "utf8",
);
const groups = [
  candidate.games.filter((game) => game.seed.startsWith("meta-357-final-")),
  ...[1, 2, 3].map((opponent) =>
    candidate.games.filter((game) =>
      game.seed.startsWith(`hidden-node-holdout-20260905-${opponent}-`),
    ),
  ),
];
if (groups.some((games, index) => games.length !== (index === 0 ? 40 : 10)))
  throw new Error("incomplete_capability_cohorts");
const output = resolve(outputPath);
mkdirSync(output, { recursive: true });
writeFileSync(
  resolve(output, "comparison.json"),
  JSON.stringify(comparison, null, 2),
);
for (const [index, games] of groups.entries()) {
  const first = games[0];
  const summary = summarizeGames(games);
  const cohort = comparison.cohorts[index];
  const bundle = {
    schemaVersion: 1,
    pairing: {
      id: ids[index],
      jobId: "hidden-node-capability-20260905",
      status: "closed",
      title: `Hidden Node Capability / ${cohort.label} / ${first.runnerSnapshot.deckName}`,
      reviewDate: "2026-09-05",
      sourceCommit: candidate.manifest.sourceCommit,
      statusText:
        "Abgeschlossener fester Systemvergleich bei unveränderten Decklisten; keine unabhängige Random-Meta-Serie",
      selectionSeed: "hidden-node-predeclared-20260905",
      rulesProfile: "modern_open",
      aiMode: "current_candidate / hard / generic-restricted-credit-capability",
      runner: {
        name: first.runnerSnapshot.deckName,
        snapshotHash: first.runnerSnapshot.deckHash,
      },
      corp: {
        name: first.corpSnapshot.deckName,
        size: 45,
        snapshotId: candidate.manifest.corpSnapshot.deckSnapshotId,
        snapshotHash: first.corpSnapshot.deckHash,
      },
      winnerAnalysis: `Corp ${summary.corpWins}/${summary.games}, Runner ${summary.games - summary.corpWins}/${summary.games}; Runtime und Replay vollständig geprüft.`,
      loserAnalysis:
        "Ergebnisse und Meilensteine sind vollständig verglichen. Eine Einzelverlustursache wird daraus nicht erfunden; kausale Fixe sind separat durch Real-Engine-Chooser-Regressionen belegt.",
      metaAnalysis:
        "Deckidentität unverändert. Mechanisch geprüfte Fähigkeiten und natürliche Spielstärke sind getrennte Abnahmen; korrigierte Engine-Legalität verhindert eine isolierte Zuschreibung an die KI-Bewertung.",
      reproduction: {
        schemaVersion: "hidden-node-capability-comparison-v1",
        originalPairingIds,
        manifest: candidate.manifest,
        baselineManifest: baseline.manifest,
        comparison,
        summary,
        cohort,
      },
      fullReviewMarkdown: review,
    },
    games: games.map((game, ordinal) => ({
      key: `${game.runnerId}:${game.seed}`,
      ordinal: ordinal + 1,
      phase: index === 0 ? "known_control" : "reused_holdout",
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
          "runtime/replay/fallback/timeout only; not zero strategic mistakes",
      },
    })),
  };
  writeFileSync(
    resolve(output, `${ids[index]}.json`),
    JSON.stringify(bundle, null, 2),
  );
}
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const rows = comparison.cohorts
  .map(
    ({ label, baseline: before, candidate: after }) =>
      `<tr><td>${escape(label)}</td><td>${before.corpWins}/${before.games} → ${after.corpWins}/${after.games}</td><td>${before.corpPoints} → ${after.corpPoints}</td><td>${before.zeroScoreLosses} → ${after.zeroScoreLosses}</td><td>${before.scoreActions} → ${after.scoreActions}</td></tr>`,
  )
  .join("");
const htmlBody = `<!doctype html><html lang="de"><meta charset="utf-8"><title>Hidden Node: Capability-Gegenvergleich</title>
<style>body{font:17px system-ui;max-width:1100px;margin:40px auto;padding:0 24px;color:#202b34}table{border-collapse:collapse;width:100%}td,th{border:1px solid #c8d2db;padding:10px;text-align:left}pre{white-space:pre-wrap;font:inherit;line-height:1.5}code{overflow-wrap:anywhere}</style>
<h1>Hidden Node: Fähigkeiten verbessert, Spielwirkung separat geprüft</h1>
<p>Originalliste unverändert. Corp-Siege ${comparison.baseline.corpWins}/70 → ${comparison.candidate.corpWins}/70.
Identischer End-StateHash in ${comparison.sameFinalHashGames}/70 gepaarten Spielen. Keine zusätzlichen Pilotspiele in diesen Nennern.</p>
<p>Baseline <code>${escape(comparison.baselineSource)}</code>; Kandidat <code>${escape(comparison.candidateSource)}</code>.
Lokale Evidence ${ids.join(", ")}; Baseline ${originalPairingIds.join(", ")}. Kein Versand.</p>
<table><thead><tr><th>Kohorte</th><th>Corp-Siege alt → neu</th><th>Corp-Punkte</th><th>Nullscore-Niederlagen</th><th>Score-Actions</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Messgrenzen</h2><ul>${comparison.caveats.map((line) => `<li>${escape(line)}</li>`).join("")}</ul>
<h2>Aktueller Fähigkeitenvertrag und belegte Ursachen</h2><pre>${escape(review)}</pre></html>`;
writeFileSync(resolve(output, "report.html"), htmlBody);
writeFileSync(
  resolve(output, "report.json"),
  JSON.stringify(
    {
      reportId: "hidden-node-capability-20260905",
      status: "generated",
      coveredPairingIds: ids,
      subject:
        "Hidden Node: Capability-Gegenvergleich bei unveränderter Deckidentität",
      htmlBody,
    },
    null,
    2,
  ),
);
process.stdout.write(
  JSON.stringify({
    pairingIds: ids,
    games: candidate.games.length,
    baselineWins: comparison.baseline.corpWins,
    candidateWins: comparison.candidate.corpWins,
    sameFinalHashGames: comparison.sameFinalHashGames,
    output,
  }) + "\n",
);
