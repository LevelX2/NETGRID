import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type SignalCoverage = {
  signalId: string;
  hardGate: boolean;
  consumerModes: string[];
  derivedStrategyAnchors: string[];
  sourceRefs: Array<{ path: string; line: number }>;
};

type ConsumerReport = {
  hardErrorCount: number;
  summary: {
    hardGateRequiredCoverageCount: number;
    legacyBacklogRequiredCoverageCount: number;
  };
  signalCoverage: SignalCoverage[];
};

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function loadConsumerReport(): ConsumerReport {
  return JSON.parse(
    execFileSync(
      process.execPath,
      ["scripts/check-ai-tactic-signal-consumers.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as ConsumerReport;
}

function signalCoverage(
  report: ConsumerReport,
  signalId: string,
): SignalCoverage {
  const coverage = report.signalCoverage.find(
    (entry) => entry.signalId === signalId,
  );
  expect(coverage, signalId).toBeDefined();
  return coverage!;
}

describe("AI tactic signal consumer coverage", () => {
  it("keeps current review signal families covered by consumers or policy", () => {
    const report = loadConsumerReport();

    expect(report.hardErrorCount).toBe(0);
    expect(report.summary.hardGateRequiredCoverageCount).toBeGreaterThan(0);
    expect(report.summary.legacyBacklogRequiredCoverageCount).toBeGreaterThan(0);
  });

  it("binds ICE-v2 signals to the Corp ICE placement runtime consumer", () => {
    const report = loadConsumerReport();
    for (const signalId of [
      "corp_ice.multi_program_trash",
      "run.corp_run_rewind",
      "damage.corp_persistent_damage_counter",
    ]) {
      const coverage = signalCoverage(report, signalId);

      expect(coverage.hardGate).toBe(true);
      expect(coverage.consumerModes).toContain("runtime_source_reference");
      expect(coverage.consumerModes).toContain("strategy_derivation");
      expect(coverage.sourceRefs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining("corp-ice-placement"),
          }),
        ]),
      );
    }
  });
});
