import { describe, expect, it } from "vitest";
import { diffMatchProgressionMetrics } from "./match-progression-metric-delta";
import { summarizeMatchProgressionMetrics } from "./match-progression-summary";

describe("match progression metric deltas", () => {
  it("includes each metric emitted by the current summary", () => {
    const baseline = summarizeMatchProgressionMetrics([]);
    const candidate = {
      ...baseline,
      runnerSearchRecoveryAttributionWindows: 2,
      runnerMemoryNormalizedMetricArtifact: 3,
    };
    const delta = diffMatchProgressionMetrics(candidate, baseline);
    expect(Object.keys(delta)).toEqual(Object.keys(candidate));
    expect(delta.runnerSearchRecoveryAttributionWindows).toBe(2);
    expect(delta.runnerMemoryNormalizedMetricArtifact).toBe(3);
  });

  it("fails visibly for missing or non-finite metric evidence", () => {
    const baseline = summarizeMatchProgressionMetrics([]);
    const candidate = { ...baseline, games: Number.NaN };
    expect(() => diffMatchProgressionMetrics(candidate, baseline)).toThrow(
      "Benchmark metric is missing or non-finite: games",
    );
    Reflect.deleteProperty(candidate, "games");
    expect(() => diffMatchProgressionMetrics(candidate, baseline)).toThrow(
      "Benchmark baseline and candidate have different metric sets.",
    );
  });
});
