import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AiBehaviorBaselineResult } from "../packages/ai/src/simulation/ai-behavior-baseline";
import {
  readAiBehaviorBaselineRawArtifact,
  writeAiBehaviorBaselineRawArtifact,
} from "./ai-behavior-baseline-raw-artifact";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("AI behavior baseline raw artifacts", () => {
  it("streams slot fragments into a lossless JSON artifact", async () => {
    const directory = temporaryDirectory();
    const fragments = writeFragments(directory);
    const outputPath = join(directory, "raw.json");

    await writeAiBehaviorBaselineRawArtifact({
      outputPath,
      result: baselineResult(),
      slotFragmentPaths: fragments,
    });

    expect(readAiBehaviorBaselineRawArtifact(outputPath)).toEqual({
      schemaVersion: "ai-behavior-baseline-v1-raw",
      result: baselineResult(),
      slots: [slotFragment(0), slotFragment(1)],
    });
  });

  it("roundtrips the same information through gzip", async () => {
    const directory = temporaryDirectory();
    const fragments = writeFragments(directory);
    const jsonPath = join(directory, "raw.json");
    const gzipPath = join(directory, "raw.json.gz");

    await writeAiBehaviorBaselineRawArtifact({
      outputPath: jsonPath,
      result: baselineResult(),
      slotFragmentPaths: fragments,
    });
    await writeAiBehaviorBaselineRawArtifact({
      outputPath: gzipPath,
      result: baselineResult(),
      slotFragmentPaths: fragments,
    });

    expect(readAiBehaviorBaselineRawArtifact(gzipPath)).toEqual(
      readAiBehaviorBaselineRawArtifact(jsonPath),
    );
    expect(readFileSync(gzipPath).length).toBeLessThan(
      readFileSync(jsonPath).length,
    );
  });

  it("keeps the previous artifact and removes temp files on failure", async () => {
    const directory = temporaryDirectory();
    const outputPath = join(directory, "raw.json");
    writeFileSync(outputPath, "previous-artifact", "utf8");

    await expect(
      writeAiBehaviorBaselineRawArtifact({
        outputPath,
        result: baselineResult(),
        slotFragmentPaths: [join(directory, "missing-fragment.json")],
      }),
    ).rejects.toThrow();

    expect(readFileSync(outputPath, "utf8")).toBe("previous-artifact");
    expect(
      readdirSync(directory).filter((name) => name.includes(".tmp-")),
    ).toEqual([]);
    expect(existsSync(outputPath)).toBe(true);
  });
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "netgrid-raw-artifact-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

function writeFragments(directory: string): string[] {
  return [0, 1].map((index) => {
    const path = join(directory, `slot-${index}.json`);
    writeFileSync(path, `${JSON.stringify(slotFragment(index))}\n`, "utf8");
    return path;
  });
}

function slotFragment(index: number): Record<string, unknown> {
  return {
    descriptor: { slotId: `slot-${index}` },
    trace: {
      summaries: [{ seed: `seed-${index}`, evidence: "x".repeat(1_000) }],
    },
  };
}

function baselineResult(): AiBehaviorBaselineResult {
  return {
    version: "ai-behavior-baseline-v1",
    generatedAt: "2026-07-20T00:00:00.000Z",
    gitHead: "test",
    config: {
      seeds: ["seed-0", "seed-1"],
      maxActions: 1,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      slotIds: ["slot-0", "slot-1"],
    },
    slots: [],
    aggregate: {
      games: 0,
      decisions: 0,
      averageActions: 0,
      averageTurns: 0,
      runnerAgendaPoints: 0,
      corpAgendaPoints: 0,
      runnerSteals: 0,
      corpScores: 0,
      scoreOrStealActions: 0,
      scoreOpportunities: 0,
      missedScoreWindows: 0,
      missedScoreWindowRate: null,
      advancedRemoteContestOpportunities: 0,
      advancedRemoteContestsTaken: 0,
      skippedAdvancedRemoteContests: 0,
      advancedRemoteContestSkipRate: null,
      settledPlanIntents: 0,
      planIntentsConvertedWithin3: 0,
      expiredPlanIntents: 0,
      abandonedPlanIntents: 0,
      planConversionRate: null,
      strategicNoProgressRepeats: 0,
      strategicNoProgressRatePer100Decisions: 0,
      clearlyDominatedPlanChoices: 0,
      clearlyDominatedPlanChoiceRatePer100Decisions: 0,
      actionCapacityOpportunities: 0,
      actionCapacityUses: 0,
      actionCapacityUseRate: null,
      actionCapacityPlanConversions: 0,
      actionCapacityPlanConversionRate: null,
      actionCapacityFollowupConversions: 0,
      actionCapacityExpiredUses: 0,
      actionCapacityExpirationRate: null,
      actionCapacityMisconversions: 0,
      actionCapacityMisconversionRate: null,
      runnerEndTurnsWithClicks: 0,
      runnerInevitableCorpDeckoutEndTurnsWithClicks: 0,
      runnerPrematureEndTurnsWithClicks: 0,
      runnerPrematureEndTurnRatePer100Decisions: 0,
      runnerPersistentInstallSelections: 0,
      runnerRedundantPersistentInstallSelections: 0,
      runnerRedundantPersistentInstallRate: null,
      findings: 0,
      findingRatePer100Decisions: 0,
      illegalActions: 0,
      replayFailures: 0,
      actionLimitGames: 0,
      fallbackActions: 0,
      timeoutActions: 0,
      runtimeErrors: 0,
      hiddenInfoFindings: 0,
      noLegalActionFailures: 0,
      redactionSafe: true,
    },
    gate: { accepted: true, hardFailures: [] },
  };
}
