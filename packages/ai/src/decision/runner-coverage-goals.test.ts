import { describe, expect, it } from "vitest";
import { resolveRunnerCoverageGoalForAction } from "./runner-coverage-goals";

describe("runner coverage goal resolution", () => {
  it("prefers a visible affordable Wall coverage install over credit", () => {
    const context = {
      missingCoverageTypes: ["barrier"] as const,
      runnerCredits: 4,
      visibleInstallableCoverageCards: [
        { title: "Fractor", coverageTypes: ["barrier"] as const, installCost: 3 },
      ],
    };

    expect(
      resolveRunnerCoverageGoalForAction(context, {
        type: "install_card",
        sourceTitle: "Fractor",
        cost: 3,
      }).fit,
    ).toBe("install_fixes_coverage");
    expect(
      resolveRunnerCoverageGoalForAction(context, { type: "gain_credit" }).fit,
    ).toBe("credit_preserves_future_coverage");
  });

  it("keeps credit sensible when visible coverage is unaffordable", () => {
    const result = resolveRunnerCoverageGoalForAction(
      {
        missingCoverageTypes: ["barrier"],
        runnerCredits: 2,
        visibleInstallableCoverageCards: [
          { title: "Fractor", coverageTypes: ["barrier"], installCost: 5 },
        ],
      },
      { type: "install_card", sourceTitle: "Fractor", cost: 5 },
    );

    expect(result.fit).toBe("credit_preserves_future_coverage");
    expect(result.resolvedCoverageTypes).toEqual(["barrier"]);
  });

  it("keeps draw sensible when no visible coverage option exists", () => {
    const result = resolveRunnerCoverageGoalForAction(
      { missingCoverageTypes: ["code_gate"], runnerCredits: 4 },
      { type: "draw_card" },
    );

    expect(result.fit).toBe("draw_may_find");
    expect(result.sideSafe).toBe(true);
  });

  it("does not require hidden card names to classify search or run actions", () => {
    const search = resolveRunnerCoverageGoalForAction(
      {
        missingCoverageTypes: ["sentry"],
        sideSafeSearchAvailable: true,
      },
      { type: "play_event", label: "Search for a program" },
    );
    const run = resolveRunnerCoverageGoalForAction(
      { missingCoverageTypes: ["sentry"] },
      { type: "start_run", label: "Run remote" },
    );

    expect(search.fit).toBe("search_likely_finds");
    expect(run.fit).toBe("run_ignores_unresolved_coverage");
    expect(JSON.stringify({ search, run })).not.toMatch(
      /cardInstances|privatePayload|fullGameState|AIInput|DecisionDebug/i,
    );
  });
});
