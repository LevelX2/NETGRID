import { describe, expect, it } from "vitest";
import {
  evaluateDoctrineQualityGate,
  formatDoctrineQualityBenchmarkReport,
  formatMatchProgressionBenchmarkReport,
  formatMatchProgressionBenchmarkSuiteReport,
} from "./benchmark-reports";
import {
  listMatchProgressionBenchmarkDeckSlots,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
} from "../index";

describe("benchmark report formatting", () => {
  it("formats doctrine quality benchmark reports with gate interpretation", () => {
    const benchmark = runDoctrineQualityBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 20,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });
    const gate = evaluateDoctrineQualityGate(benchmark);
    const report = formatDoctrineQualityBenchmarkReport(benchmark, gate);

    expect(report).toContain("# AI Deck Doctrine Quality Benchmark Report");
    expect(report).toContain("| nakedAgendaInstalls |");
    expect(report).toContain("## Safety Delta");
    expect(report).toContain(`Gate: ${gate.accepted ? "PASS" : "FAIL"}`);
    expect(gate.thresholds.maxCandidateIllegalActions).toBe(0);
    expect(JSON.stringify({ gate, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("reports match progression metrics alongside safety signals", () => {
    const benchmark = runMatchProgressionBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 20,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });
    const report = formatMatchProgressionBenchmarkReport(benchmark);

    expect(benchmark.version).toBe("ai-match-progression-v1");
    expect(benchmark.diagnosticOnly).toBe(true);
    expect(benchmark.baselineProfile).toBe("belief_ai_v1_4_2");
    expect(benchmark.candidateProfile).toBe("current_candidate");
    expect(benchmark.runnerDeckId).toBe("demo_runner_008");
    expect(benchmark.corpDeckId).toBe("demo_corp_008");
    expect(benchmark.maxActions).toBe(20);
    expect(benchmark.seeds.length).toBeGreaterThan(0);
    expect(benchmark.baseline.games).toBe(benchmark.seeds.length);
    expect(benchmark.candidate.games).toBe(benchmark.seeds.length);
    expect(benchmark.baseline.actionLimitRate).toBeGreaterThanOrEqual(0);
    expect(benchmark.candidate.actionLimitRate).toBeLessThanOrEqual(1);
    expect(benchmark.delta.actionLimitRate).toBe(
      benchmark.candidate.actionLimitRate - benchmark.baseline.actionLimitRate,
    );
    expect(benchmark.candidate.averageTurns).toBeGreaterThanOrEqual(0);
    expect(
      benchmark.candidate.scoreOrStealActionsPerMatch,
    ).toBeGreaterThanOrEqual(0);
    expect(benchmark.profileComparisons.map((entry) => entry.profile)).toEqual([
      "basic_corp_ai",
      "basic_runner_ai",
      "belief_ai_v1_4_2",
      "current_candidate",
    ]);
    expect(
      benchmark.candidate.centralPressureRuns +
        benchmark.candidate.remotePressureRuns,
    ).toBeGreaterThanOrEqual(0);
    expect(benchmark.candidate.illegalActions).toBe(0);
    expect(benchmark.candidate.replayFailures).toBe(0);
    expect(report).toContain("# AI Match Progression Benchmark Report");
    expect(report).toContain("## Progression Metrics");
    expect(report).toContain("successfulCentralRuns");
    expect(report).toContain("scoringRemoteDevelopmentActions");
    expect(report).toContain("## Profile Comparison");
    expect(report).toContain("## Safety Metrics");
    expect(report).toContain("Gate: diagnostic_only");
    expect(JSON.stringify({ benchmark, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("reports a deck-separated match progression suite with pending real-scene slots", () => {
    const suite = runMatchProgressionBenchmarkSuite({
      includeHoldout: false,
      maxActions: 10,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
      comparisonProfiles: [
        "basic_corp_ai",
        "belief_ai_v1_4_2",
        "current_candidate",
      ],
    });
    const report = formatMatchProgressionBenchmarkSuiteReport(suite);
    const slots = listMatchProgressionBenchmarkDeckSlots();
    const smoke = suite.slots.find(
      (slot) => slot.slotId === "safety_smoke_demo_008",
    );
    const snapshot = suite.slots.find(
      (slot) => slot.slotId === "progression_tuning_origin_rig_vs_tax",
    );
    const localRealisticSlots = suite.slots.filter(
      (slot) => slot.slotType === "local_realistic_holdout",
    );
    const realSceneSlots = suite.slots.filter(
      (slot) => slot.slotType === "real_scene_holdout",
    );

    expect(slots.some((slot) => slot.slotType === "smoke")).toBe(true);
    expect(
      slots.filter((slot) => slot.slotType === "snapshot_tuning"),
    ).toHaveLength(2);
    expect(
      slots.filter((slot) => slot.slotType === "local_realistic_holdout"),
    ).toHaveLength(2);
    expect(smoke?.status).toBe("runnable");
    expect(smoke?.runnerDeckRef).toBe("demo_runner_008");
    expect(snapshot?.status).toBe("runnable");
    expect(snapshot?.benchmark?.runnerDeckId).toBe(
      "onr_origin_runner_ai_snapshot_v1",
    );
    expect(snapshot?.benchmark?.corpDeckId).toBe(
      "onr_origin_corp_ai_snapshot_v1",
    );
    expect(snapshot?.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
    expect(snapshot?.benchmark?.candidate.illegalActions).toBe(0);
    expect(snapshot?.benchmark?.candidate.replayFailures).toBe(0);
    expect(localRealisticSlots).toHaveLength(2);
    expect(
      localRealisticSlots.every((slot) => slot.status === "runnable"),
    ).toBe(true);
    expect(
      localRealisticSlots.every(
        (slot) => !slot.runnerDeckRef.includes("demo_008"),
      ),
    ).toBe(true);
    for (const slot of localRealisticSlots) {
      expect(slot.runnerDeckRef).toContain("local_realistic_");
      expect(slot.benchmark?.runnerDeckId).toContain("local_realistic_");
      expect(slot.benchmark?.corpDeckId).toContain("local_realistic_");
      expect(slot.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
      expect(slot.benchmark?.corpDeckId).not.toBe("demo_corp_008");
      expect(slot.benchmark?.candidate.illegalActions).toBe(0);
      expect(slot.benchmark?.candidate.replayFailures).toBe(0);
    }
    expect(realSceneSlots).toHaveLength(2);
    expect(realSceneSlots.every((slot) => slot.status === "runnable")).toBe(
      true,
    );
    expect(
      realSceneSlots.every((slot) => !slot.runnerDeckRef.includes("demo_008")),
    ).toBe(true);
    for (const slot of realSceneSlots) {
      expect(slot.benchmark?.runnerDeckId).toContain("real_scene_");
      expect(slot.benchmark?.corpDeckId).toContain("real_scene_");
      expect(slot.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
      expect(slot.benchmark?.corpDeckId).not.toBe("demo_corp_008");
      expect(slot.benchmark?.candidate.illegalActions).toBe(0);
      expect(slot.benchmark?.candidate.replayFailures).toBe(0);
    }
    expect(report).toContain("## Demo Smoke");
    expect(report).toContain("## Snapshot Progression");
    expect(report).toContain("## Local Realistic Holdout");
    expect(report).toContain("## Real Scene Holdout");
    expect(report).toContain("remoteBuildActions");
    expect(JSON.stringify({ suite, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 45_000);
});
