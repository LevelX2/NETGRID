import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  allocateRegistryId,
  backupEvidenceRegistry,
  completeJob,
  exportEvidenceSnapshot,
  getStoredReport,
  importLegacyArtifacts,
  importPairingBundle,
  openEvidenceRegistry,
  parseLegacyMatrix,
  parseLegacyReview,
  recordReport,
  registerJob,
  registryCheck,
  registryStatus,
} from "./lib/ai-selfplay-evidence-registry.mjs";

function withRegistry(run) {
  const directory = mkdtempSync(join(tmpdir(), "netgrid-selfplay-evidence-"));
  const databasePath = join(directory, "evidence.sqlite");
  const { db } = openEvidenceRegistry(databasePath);
  try {
    run({ db, directory, databasePath });
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("allocates collision-free pairing and case ids across jobs", () => {
  withRegistry(({ db }) => {
    registerJob(db, { jobId: "job-a" });
    registerJob(db, { jobId: "job-b" });
    assert.equal(allocateRegistryId(db, "pairing", "job-a"), "001");
    assert.equal(allocateRegistryId(db, "pairing", "job-b"), "002");
    assert.equal(allocateRegistryId(db, "case", "job-a"), "SP-001");
    assert.equal(allocateRegistryId(db, "case", "job-b"), "SP-002");
  });
});

test("upserts a complete pairing bundle idempotently", () => {
  withRegistry(({ db }) => {
    const bundle = {
      schemaVersion: 1,
      pairing: {
        id: "042",
        title: "Testpaarung",
        status: "closed",
        selectionSeed: "selection-42",
        sourceCommit: "abcdef0",
        runner: {
          name: "Runner Deck",
          size: 45,
          snapshotId: "runner-v1",
          snapshotHash: "fnv1a:runner",
        },
        corp: {
          name: "Corp Deck",
          size: 45,
          snapshotId: "corp-v1",
          snapshotHash: "fnv1a:corp",
        },
        loserAnalysis: "Die Corp verlor wegen Deckout.",
      },
      games: [
        {
          key: "seed-1",
          ordinal: 1,
          matchId: "match_test42",
          seed: "seed-42-1",
          winner: "Runner",
          runnerMatchPoints: 10,
          corpMatchPoints: 4,
          runnerAgendaPoints: 7,
          corpAgendaPoints: 4,
          terminalReason: "Agendapunkte",
          decisionCount: 123,
          flagsCount: 0,
        },
      ],
    };
    importPairingBundle(db, bundle);
    importPairingBundle(db, {
      ...bundle,
      pairing: { ...bundle.pairing, title: "Aktualisierte Testpaarung" },
    });
    const status = registryStatus(db);
    assert.equal(status.pairings, 1);
    assert.equal(status.games, 1);
    assert.equal(
      exportEvidenceSnapshot(db, ["042"]).pairings[0].title,
      "Aktualisierte Testpaarung",
    );
  });
});

test("keeps historical case links and rejects silent case reassignment", () => {
  withRegistry(({ db }) => {
    const bundle = (pairingId, pairingIds, clusterId = "runner-purpose") => ({
      schemaVersion: 1,
      pairing: { id: pairingId, title: `Pairing ${pairingId}` },
      games: [],
      clusters: [
        {
          id: clusterId,
          capability: `Capability ${clusterId}`,
        },
      ],
      cases: [
        {
          id: "SP-001",
          clusterId,
          grade: "Verdacht",
          side: "Runner",
          symptom: "Eine stabile Beobachtung.",
          pairingIds,
        },
      ],
    });
    importPairingBundle(db, bundle("001", ["001"]));
    importPairingBundle(db, bundle("002", ["002"]));
    assert.deepEqual(
      db
        .prepare(
          `SELECT pairing_id FROM case_pairings WHERE case_id = 'SP-001' ORDER BY pairing_id`,
        )
        .all()
        .map((row) => row.pairing_id),
      ["001", "002"],
    );
    assert.throws(
      () => importPairingBundle(db, bundle("003", ["003"], "other-purpose")),
      /refusing reassignment/,
    );
  });
});

test("closes jobs and checks registry readiness", () => {
  withRegistry(({ db }) => {
    registerJob(db, { jobId: "job-a" });
    assert.equal(registryCheck(db).ok, false);
    completeJob(db, { jobId: "job-a" });
    const check = registryCheck(db);
    assert.equal(check.ok, true);
    assert.equal(check.activeJobs.length, 0);
  });
});

test("parses legacy review results and matrix rows", () => {
  const review = `# KI-Selbstspielzyklus 031 – Test\n\nStand: 2026-08-20\nStatus: geschlossen\n\n## Reproduktionsvertrag\n\n- Auswahlseed: \`selection\`\n- Runner: **Runner Deck**, 45 Karten, \`runner-v1\`, \`fnv1a:runner\`\n- Corp: **Corp Deck**, 46 Karten, \`corp-v1\`, \`fnv1a:corp\`\n- Spielseeds: \`seed-a\`, \`seed-b\` und \`seed-c\`\n- Ausgangsstand: \`abcdef0\`\n- Regelprofil: Originalset, \`modern_open\`, harte KI, Detailtrace\n\n## Ergebnis wie im Programm\n\n| Partie | Endergebnis | Agendapunkte | Ende | Entscheidungen |\n| --- | ---: | ---: | --- | ---: |\n| Seed 1 | Corp **10 – 6** Runner | **8:6** | Agendapunkte | 100 |\n| Seed 2 | Runner **10 – 0** Corp | **7:0** | Agendapunkte | 90 |\n| Seed 3 | Runner **10 – 1** Corp | **5:1** | Corp-Deck leer | 110 |\n\nFinale Match-IDs und StateHashes:\n\`match_a\` / \`fnv1a:a\`, \`match_b\` / \`fnv1a:b\` und \`match_c\` / \`fnv1a:c\`.\n\n## Gewinner-, Verlierer- und Metaanalyse\n\nEine vollständige Einordnung.\n`;
  const bundle = parseLegacyReview("ai-selfplay-cycle-031-review.md", review);
  assert.equal(bundle.pairing.id, "031");
  assert.equal(bundle.pairing.runner.name, "Runner Deck");
  assert.equal(bundle.games.length, 3);
  assert.equal(bundle.games[0].corpMatchPoints, 10);
  assert.equal(bundle.games[0].runnerMatchPoints, 6);
  assert.equal(bundle.games[0].corpAgendaPoints, 8);
  assert.equal(bundle.games[0].matchId, "match_a");

  const matrix = `## Clustermatrix\n\n| Cluster | Fähigkeit | Fälle | Verdacht | Bestätigt | Behoben/verifiziert | Nächste Verdichtung |\n| --- | --- | ---: | ---: | ---: | ---: | --- |\n| \`score-plan\` | Scorelinien konvertieren | 1 | 1 | 0 | 0 | Mehr Evidence |\n\n## Fallregister\n\n| Fall | Cluster | Evidenzgrad | Seite | Match und Entscheidungen | Symptom | Zuständiger Pfad |\n| --- | --- | --- | --- | --- | --- | --- |\n| \`SP-001\` | \`score-plan\` | Verdacht | Corp | Zyklus 031, \`match_a\`, D10 | Kein Score | \`corp.score_agenda\` |\n\n## SP-001 – Kein Score\n\nDetails.\n`;
  const parsed = parseLegacyMatrix(matrix);
  assert.equal(parsed.clusters.length, 1);
  assert.equal(parsed.cases.length, 1);
  assert.deepEqual(parsed.cases[0].pairingIds, ["031"]);
});

test("legacy import is repeatable and retains source documents", () => {
  withRegistry(({ db, directory }) => {
    const reviewsDir = join(directory, "reviews");
    const reportsDir = join(directory, "reports");
    mkdirSync(reviewsDir);
    mkdirSync(reportsDir);
    const review = `# KI-Selbstspielzyklus 001 – Test\n\n## Reproduktionsvertrag\n\n- Seed: \`seed-1\`\n- Runner: \`runner-v1\`, \`fnv1a:r\`, Runner\n- Corp: \`corp-v1\`, \`fnv1a:c\`, Corp\n`;
    const matrix = `## Clustermatrix\n\n| Cluster | Fähigkeit | Fälle | Verdacht | Bestätigt | Behoben/verifiziert | Nächste Verdichtung |\n| --- | --- | ---: | ---: | ---: | ---: | --- |\n| \`cluster\` | Fähigkeit | 1 | 1 | 0 | 0 | Proof |\n\n## Fallregister\n\n| Fall | Cluster | Evidenzgrad | Seite | Match und Entscheidungen | Symptom | Zuständiger Pfad |\n| --- | --- | --- | --- | --- | --- | --- |\n| \`SP-001\` | \`cluster\` | Verdacht | Corp | Zyklus 001 | Symptom | Owner |\n`;
    const reviewPath = join(reviewsDir, "ai-selfplay-cycle-001-review.md");
    const matrixPath = join(directory, "matrix.md");
    writeFileSync(reviewPath, review);
    writeFileSync(matrixPath, matrix);
    importPairingBundle(db, {
      schemaVersion: 1,
      pairing: { id: "999", title: "Native pairing" },
      games: [],
      clusters: [{ id: "native", capability: "Native capability" }],
      cases: [
        {
          id: "SP-999",
          clusterId: "native",
          grade: "Behoben/verifiziert",
          symptom: "Native case",
          pairingIds: ["999"],
        },
      ],
    });
    const input = { reviewsDir, matrixPath, reportsDir };
    importLegacyArtifacts(db, input);
    importLegacyArtifacts(db, input);
    assert.equal(registryStatus(db).pairings, 2);
    assert.equal(registryStatus(db).cases, 2);
    assert.equal(
      db.prepare(`SELECT COUNT(*) AS count FROM legacy_sources`).get().count,
      2,
    );
    assert.equal(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM fixes WHERE fix_id = 'legacy:SP-999'`,
        )
        .get().count,
      0,
    );
  });
});

test("records crash-safe report state and creates a consistent backup", async () => {
  const directory = mkdtempSync(join(tmpdir(), "netgrid-selfplay-report-"));
  const databasePath = join(directory, "evidence.sqlite");
  const backupPath = join(directory, "backup", "evidence.sqlite");
  const { db } = openEvidenceRegistry(databasePath);
  try {
    recordReport(db, {
      reportId: "report-041-045",
      status: "pending",
      coveredPairingIds: ["041", "042", "043", "044", "045"],
      recipient: "me",
      subject: "Testbericht",
      htmlBody: "<html><body>Test</body></html>",
      series: {
        id: "series-1",
        recipient: "me",
        interval: 5,
        unreportedPairingIds: ["041", "042", "043", "044", "045"],
        pendingReport: { reportId: "report-041-045" },
      },
    });
    recordReport(db, {
      reportId: "report-041-045",
      status: "sent",
      coveredPairingIds: ["041", "042", "043", "044", "045"],
      recipient: "me",
      subject: "Testbericht",
      htmlBody: "<html><body>Test</body></html>",
      sentAt: "2026-08-20T16:00:00.000Z",
      series: {
        id: "series-1",
        recipient: "me",
        interval: 5,
        unreportedPairingIds: [],
        lastReportedPairingId: "045",
        lastSentAt: "2026-08-20T16:00:00.000Z",
      },
    });
    assert.equal(getStoredReport(db, "latest").report_id, "report-041-045");
    assert.equal(
      getStoredReport(db, "report-041-045").html_body,
      "<html><body>Test</body></html>",
    );
    await backupEvidenceRegistry(db, backupPath);
    const { db: backupDb } = openEvidenceRegistry(backupPath);
    try {
      assert.equal(
        backupDb
          .prepare(`SELECT status FROM reports WHERE report_id = ?`)
          .get("report-041-045").status,
        "sent",
      );
      assert.equal(
        backupDb
          .prepare(
            `SELECT last_reported_pairing_id FROM reporting_series WHERE series_id = ?`,
          )
          .get("series-1").last_reported_pairing_id,
        "045",
      );
    } finally {
      backupDb.close();
    }
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
