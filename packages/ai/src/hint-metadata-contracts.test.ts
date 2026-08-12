import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type MetadataContractReport = {
  hardErrorCount: number;
  summary: {
    valueHintAssignmentCount: number;
    runtimePairCount: number;
    evidenceOnlyPairCount: number;
    runtimeMechanicCount: number;
    evidenceOnlyMechanicCount: number;
    evidenceOnlyScenarioRefCount: number;
  };
};

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const tsxCliPath = fileURLToPath(import.meta.resolve("tsx/cli"));

function report(): MetadataContractReport {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [tsxCliPath, "scripts/check-ai-hint-metadata-contracts.mjs", "--json"],
      { cwd: repoRoot, encoding: "utf8" },
    ),
  ) as MetadataContractReport;
}

describe("AI hint metadata contracts", () => {
  it("classifies every retained metadata assignment", () => {
    const current = report();

    expect(current.hardErrorCount).toBe(0);
    // Classic Self-Destruct no longer claims a fixed damage value: its
    // canonical access effect scales by the cards actually trashed.
    expect(current.summary.valueHintAssignmentCount).toBe(200);
    expect(current.summary.runtimePairCount).toBe(125);
    expect(current.summary.evidenceOnlyPairCount).toBe(117);
    expect(current.summary.runtimeMechanicCount).toBe(9);
    expect(current.summary.evidenceOnlyMechanicCount).toBeGreaterThan(0);
    expect(current.summary.evidenceOnlyScenarioRefCount).toBeGreaterThan(0);
  });
});
