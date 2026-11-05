import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import * as registry from "./lib/ai-selfplay-evidence-registry.mjs";

function fixture(run, { matchReference = false, targetFix = false } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "netgrid-case-correction-"));
  const databasePath = join(directory, "evidence.sqlite");
  const { db } = registry.openEvidenceRegistry(databasePath);
  try {
    registry.registerJob(db, { jobId: "owner" });
    registry.registerJob(db, { jobId: "other" });
    for (const id of ["001", "002", "003"]) {
      registry.importPairingBundle(db, {
        schemaVersion: 1,
        pairing: { id, jobId: id === "001" ? "owner" : "other", title: id },
        games: [{ key: id, matchId: `match_registry${id}`, seed: id, decisionCount: 10 }],
        clusters: [{ id: "cause", capability: "A stable cause" }],
        cases: id === "003" ? [] : [{
          id: "SP-001", clusterId: "cause", grade: "Verdacht", side: "Corp",
          symptom: "One causal observation", ownerPath: "source-owner",
          detailsMarkdown: matchReference ? "Evidence match_registry001" : "Corrected causal content",
          pairingIds: [id],
        }, ...(id === "001" ? [{
          id: "SP-002", clusterId: "cause", grade: "Verdacht",
          symptom: "A different case", pairingIds: [id],
        }] : [])],
        fixes: (id === "002" || targetFix && id === "001") ? [{
          id: `fix-${id}`, caseId: "SP-001", title: "Required fix evidence", commitSha: "commit",
        }] : [],
      });
    }
    registry.recordReport(db, {
      reportId: "report-001", status: "generated", coveredPairingIds: ["001"],
      htmlBody: "<p>Exact report bytes</p>",
    });
    run({ db, databasePath });
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

function caseSnapshot(db) {
  return registry.exportEvidenceSnapshot(db).cases.find(c => c.case_id === "SP-001");
}

function persistentSnapshot(db) {
  // Export time is generated per read; every stored field still participates.
  const { generatedAt, ...content } = registry.exportEvidenceSnapshot(db);
  return content;
}

function fingerprint(c) {
  return createHash("sha256").update(JSON.stringify([
    c.case_id, c.cluster_id, c.grade, c.side, c.match_context, c.symptom,
    c.owner_path, c.details_markdown, c.updated_at, [...c.pairing_ids].sort(),
  ])).digest("hex");
}

function request(db, extra = {}) {
  return {
    jobId: "owner", caseId: "SP-001", pairingId: "001",
    expectedCaseFingerprint: fingerprint(caseSnapshot(db)),
    reason: "This observation belongs to another causal case", ...extra,
  };
}

test("case correction CLI removes only the mistaken link and preserves all other evidence", () => {
  fixture(({ db, databasePath }) => {
    const before = registry.exportEvidenceSnapshot(db);
    const report = registry.getStoredReport(db, "report-001");
    const input = request(db);
    const output = JSON.parse(execFileSync(process.execPath, [
      fileURLToPath(new URL("./ai-selfplay-evidence-registry.mjs", import.meta.url)),
      "correct-case-pairing", "--db", databasePath, "--job-id", input.jobId,
      "--case-id", input.caseId, "--pairing-id", input.pairingId,
      "--expected-case-fingerprint", input.expectedCaseFingerprint, "--reason", input.reason,
    ], { encoding: "utf8", windowsHide: true }));
    assert.equal(output.removedLinks, 1);
    assert.deepEqual(output.remainingPairingIds, ["002"]);
    const after = registry.exportEvidenceSnapshot(db);
    assert.deepEqual(caseSnapshot(db).pairing_ids, ["002"]);
    assert.deepEqual(after.cases.find(c => c.case_id === "SP-002"), before.cases.find(c => c.case_id === "SP-002"));
    for (const field of ["pairings", "games", "fixes", "reports", "clusters"]) {
      assert.deepEqual(after[field], before[field], field);
    }
    assert.deepEqual(registry.getStoredReport(db, "report-001"), report);
    assert.equal(registry.casePairingCorrectionFingerprint(caseSnapshot(db)), output.afterFingerprint);
    assert.throws(() => registry.correctCasePairing(db, request(db)), { code: "case_pairing_correction_link_missing" });
  });
});

test("case correction rejects stale snapshots, wrong jobs and incomplete requests atomically", () => {
  fixture(({ db }) => {
    const stale = request(db);
    registry.importPairingBundle(db, {
      schemaVersion: 1, pairing: { id: "001", jobId: "owner", title: "001" },
      games: [{ key: "001", matchId: "match_registry001", seed: "001", decisionCount: 10 }],
      cases: [{
        id: "SP-001", clusterId: "cause", grade: "Verdacht", side: "Corp",
        symptom: "One causal observation", ownerPath: "source-owner",
        detailsMarkdown: "A newer reviewed observation", pairingIds: ["001", "002"],
      }],
    });
    const before = persistentSnapshot(db);
    assert.throws(() => registry.correctCasePairing(db, stale), { code: "case_pairing_correction_snapshot_conflict" });
    assert.deepEqual(persistentSnapshot(db), before);
    for (const [extra, code] of [
      [{ expectedCaseFingerprint: "0".repeat(64) }, "case_pairing_correction_snapshot_conflict"],
      [{ jobId: "other" }, "case_pairing_correction_wrong_job"],
      [{ caseId: "SP-404" }, "case_pairing_correction_case_missing"],
      [{ pairingId: "999" }, "case_pairing_correction_pairing_missing"],
      [{ reason: "" }, "case_pairing_correction_input_invalid"],
    ]) {
      assert.throws(() => registry.correctCasePairing(db, request(db, extra)), { code });
      assert.deepEqual(persistentSnapshot(db), before);
    }
    assert.throws(() => registry.casePairingCorrectionFingerprint({ case_id: "SP-001" }), { code: "case_pairing_correction_snapshot_incomplete" });
  });
});

test("case correction retains links with matching original game evidence", () => {
  fixture(({ db }) => {
    const before = persistentSnapshot(db);
    assert.throws(() => registry.correctCasePairing(db, request(db)), { code: "case_pairing_correction_match_reference" });
    assert.deepEqual(persistentSnapshot(db), before);
  }, { matchReference: true });
});

test("case correction retains links required by a recorded fix", () => {
  fixture(({ db }) => {
    const before = persistentSnapshot(db);
    assert.throws(() => registry.correctCasePairing(db, request(db)), { code: "case_pairing_correction_fix_reference" });
    assert.deepEqual(persistentSnapshot(db), before);
  }, { targetFix: true });
});

test("case correction requires the owning job to remain active", () => {
  fixture(({ db }) => {
    registry.completeJob(db, { jobId: "owner", status: "completed" });
    const before = persistentSnapshot(db);
    assert.throws(() => registry.correctCasePairing(db, request(db)), { code: "case_pairing_correction_job_not_active" });
    assert.deepEqual(persistentSnapshot(db), before);
  });
});
