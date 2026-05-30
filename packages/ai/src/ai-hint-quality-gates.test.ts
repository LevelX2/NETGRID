import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function runQualityGate(args: string[] = []): {
  status: "ok" | "failed";
  output: string;
} {
  try {
    return {
      status: "ok",
      output: execFileSync(
        process.execPath,
        ["scripts/check-ai-hint-quality.mjs", "--json", ...args],
        {
          cwd: repoRoot,
          encoding: "utf8",
        },
      ),
    };
  } catch (error) {
    const failure = error as { stdout?: string };
    return {
      status: "failed",
      output: failure.stdout ?? "",
    };
  }
}

describe("AI hint quality gates", () => {
  it("accepts the current active hint contract and benchmark coverage", () => {
    const result = runQualityGate();
    expect(result.status).toBe("ok");
    const report = JSON.parse(result.output);
    const activeHints = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "data/ai/ai-card-hints-active.json"),
        "utf8",
      ),
    );
    expect(report.errorCount).toBe(0);
    expect(report.hintCount).toBe(activeHints.cards.length);
    expect(report.benchmarkCoverage.totalUniqueCards).toBeGreaterThan(0);
    expect(report.benchmarkCoverage.missingHintCards).toEqual([]);
    expect(report.benchmarkCoverage.skippedDecks).toEqual([]);
  });

  it("keeps the Crystal Palace semantic denylist protected", () => {
    const hints = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "data/ai/ai-card-hints-active.json"),
        "utf8",
      ),
    );
    const crystalPalace = hints.cards.find(
      (card: { cardId?: string }) =>
        card.cardId === "onr_v1_355_crystal-palace-station-grid",
    );
    expect(crystalPalace).toBeDefined();
    crystalPalace.roles.push("economy");

    const tempFile = path.join(
      os.tmpdir(),
      `netgrid-ai-hint-quality-denylist-${process.pid}.json`,
    );
    fs.writeFileSync(tempFile, `${JSON.stringify(hints)}\n`);
    try {
      const result = runQualityGate(["--hints", tempFile]);
      expect(result.status).toBe("failed");
      const report = JSON.parse(result.output);
      expect(
        report.errors.some(
          (entry: { kind?: string }) => entry.kind === "denylist_violations",
        ),
      ).toBe(true);
    } finally {
      fs.rmSync(tempFile, { force: true });
    }
  });

  it("reports unknown roles in a fixture without changing active hints", () => {
    const hints = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "data/ai/ai-card-hints-active.json"),
        "utf8",
      ),
    );
    hints.cards[0].roles.push("fixture_unknown_role");

    const tempFile = path.join(
      os.tmpdir(),
      `netgrid-ai-hint-quality-unknown-${process.pid}.json`,
    );
    fs.writeFileSync(tempFile, `${JSON.stringify(hints)}\n`);
    try {
      const result = runQualityGate(["--hints", tempFile]);
      expect(result.status).toBe("failed");
      const report = JSON.parse(result.output);
      expect(
        report.errors.some(
          (entry: { kind?: string }) => entry.kind === "unknown_roles",
        ),
      ).toBe(true);
    } finally {
      fs.rmSync(tempFile, { force: true });
    }
  });

  it("keeps suspicious singleton roles as warnings instead of hard failures", () => {
    const result = runQualityGate();
    expect(result.status).toBe("ok");
    const report = JSON.parse(result.output);
    expect(
      report.warnings.some(
        (entry: { kind?: string }) =>
          entry.kind === "suspicious_singleton_roles",
      ),
    ).toBe(true);
  });
});
