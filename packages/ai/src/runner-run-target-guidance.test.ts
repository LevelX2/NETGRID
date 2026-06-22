import { describe, expect, it } from "vitest";

import type {
  RunnerAccessPayoff,
  RunnerRunTargetRecommendation,
} from "./runner-run-target-evaluation";
import {
  RUNNER_RUN_TARGET_TACTICAL_PRIORITY_DELTA_BY_RECOMMENDATION,
  runnerRunTargetHighPayoff,
  runnerRunTargetMultiRunPayoffClass,
  runnerRunTargetPlausibleForMultiRun,
  runnerRunTargetRecommendationGuidanceKeys,
  runnerRunTargetSemanticGuidanceValue,
  runnerRunTargetTacticalPriorityDelta,
} from "./runner-run-target-guidance";

describe("runner run target guidance", () => {
  it("keeps tactical priority deltas exhaustive for recommendations", () => {
    const expected: Record<RunnerRunTargetRecommendation, number> = {
      run_now: 180,
      run_if_free: 40,
      setup_first: -80,
      draw_for_damage_buffer: -520,
      gain_credits_first: -180,
      find_breaker_first: -220,
      known_no_current_payoff: -620,
      remote_changed_reassess: -180,
      declined_trash_memory_active: -520,
      do_not_run_now: -720,
    };

    expect(RUNNER_RUN_TARGET_TACTICAL_PRIORITY_DELTA_BY_RECOMMENDATION).toEqual(
      expected,
    );
    for (const recommendation of runnerRunTargetRecommendationGuidanceKeys()) {
      expect(runnerRunTargetTacticalPriorityDelta({ recommendation })).toBe(
        expected[recommendation],
      );
    }
  });

  it("keeps semantic guidance penalties separate from tactical deltas", () => {
    const cases: Array<{
      recommendation: RunnerRunTargetRecommendation;
      accessPayoff: RunnerAccessPayoff;
      expected: number;
    }> = [
      { recommendation: "run_now", accessPayoff: "agenda", expected: 0 },
      {
        recommendation: "run_if_free",
        accessPayoff: "unknown",
        expected: -1700,
      },
      {
        recommendation: "run_if_free",
        accessPayoff: "fresh",
        expected: -900,
      },
      {
        recommendation: "declined_trash_memory_active",
        accessPayoff: "known_low_value",
        expected: -4200,
      },
      {
        recommendation: "do_not_run_now",
        accessPayoff: "known_low_value",
        expected: -5000,
      },
    ];

    for (const entry of cases) {
      expect(runnerRunTargetSemanticGuidanceValue(entry)).toBe(entry.expected);
    }
  });

  it("classifies multi-run payoff without relying on semantic runtime state", () => {
    const base = {
      accessPayoff: "unknown" as RunnerAccessPayoff,
      creditsAfterRun: 2,
      knownAccessState: "unknown" as const,
      pathPassability: "reachable" as const,
      recommendation: "run_if_free" as RunnerRunTargetRecommendation,
    };

    expect(runnerRunTargetMultiRunPayoffClass(undefined)).toBe("missing_target");
    expect(
      runnerRunTargetMultiRunPayoffClass({
        ...base,
        pathPassability: "blocked_unpayable",
      }),
    ).toBe("blocked");
    expect(
      runnerRunTargetMultiRunPayoffClass({
        ...base,
        knownAccessState: "known_no_current_payoff",
      }),
    ).toBe("low_payoff");
    expect(runnerRunTargetMultiRunPayoffClass(base)).toBe("unknown_probe");
    expect(
      runnerRunTargetMultiRunPayoffClass({
        ...base,
        accessPayoff: "agenda",
        recommendation: "setup_first",
      }),
    ).toBe("high_payoff");
    expect(
      runnerRunTargetPlausibleForMultiRun({
        ...base,
        accessPayoff: "agenda",
        recommendation: "setup_first",
      }),
    ).toBe(true);
    expect(
      runnerRunTargetPlausibleForMultiRun({
        ...base,
        creditsAfterRun: -1,
      }),
    ).toBe(false);
    expect(runnerRunTargetHighPayoff({ accessPayoff: "fresh" })).toBe(true);
    expect(runnerRunTargetHighPayoff({ accessPayoff: "unknown" })).toBe(false);
  });
});
