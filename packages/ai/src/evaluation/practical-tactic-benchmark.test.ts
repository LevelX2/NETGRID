import { describe, expect, it } from "vitest";
import {
  PRACTICAL_TACTIC_BENCHMARK_CASES,
  evaluatePracticalTacticBenchmark,
  frozenLegacyPracticalTacticSelector,
} from "./practical-tactic-benchmark";

describe("PracticalTacticBenchmark", () => {
  it("contains a compact balanced corpus of concrete legal-action situations", () => {
    expect(PRACTICAL_TACTIC_BENCHMARK_CASES).toHaveLength(40);
    const categories = new Set(
      PRACTICAL_TACTIC_BENCHMARK_CASES.map((benchmarkCase) => benchmarkCase.category),
    );
    expect(categories).toEqual(
      new Set([
        "corp_safe_score",
        "runner_steal_agenda",
        "runner_trash_value",
        "runner_open_access_card",
        "runner_install_coverage",
        "runner_take_high_payoff_run",
        "corp_real_punish",
        "corp_abandon_stale_punish",
        "runner_continue_reachable_run",
        "runner_avoid_stale_run",
      ]),
    );
    for (const benchmarkCase of PRACTICAL_TACTIC_BENCHMARK_CASES) {
      const legalActionIds = benchmarkCase.input.legalActions.map(
        (action) => action.actionId,
      );
      expect(benchmarkCase.acceptableActionIds.length).toBeGreaterThan(0);
      expect(benchmarkCase.badActionIds.length).toBeGreaterThan(0);
      expect(legalActionIds).toEqual(
        expect.arrayContaining(benchmarkCase.acceptableActionIds),
      );
      expect(legalActionIds).toEqual(
        expect.arrayContaining(benchmarkCase.badActionIds),
      );
      expect(legalActionIds).toContain(benchmarkCase.frozenLegacyActionId);
    }
  });

  it("documents the frozen legacy hit rate without adding reporting infrastructure", () => {
    const result = evaluatePracticalTacticBenchmark(
      frozenLegacyPracticalTacticSelector,
    );

    expect(result.caseCount).toBe(40);
    expect(result.hits).toBe(0);
    expect(result.misses).toBe(40);
    expect(result.hitRate).toBe(0);
    expect(result.missesByCase).toHaveLength(40);
  });

  it("keeps benchmark fixtures side-safe and free of known hidden transport fields", () => {
    expect(JSON.stringify(PRACTICAL_TACTIC_BENCHMARK_CASES)).not.toMatch(
      /cardInstances|privatePayload|secretGripIds|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });
});
