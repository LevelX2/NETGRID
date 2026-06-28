import { describe, expect, it } from "vitest";

import { resolveRunnerCoverageGoalForAction } from "./runner-coverage-goals";

describe("resolveRunnerCoverageGoalForAction", () => {
  it("uses structured coverage/search signals and ignores label-only matches", () => {
    const context = {
      missingCoverageTypes: ["barrier" as const],
      sideSafeSearchAvailable: true,
      visibleInstallableCoverageCards: [
        { title: "Wall Breaker", coverageTypes: ["barrier" as const] },
      ],
    };

    expect(
      resolveRunnerCoverageGoalForAction(context, {
        type: "install_card",
        label: "Wall Breaker",
      }).fit,
    ).toBe("unrelated");
    expect(
      resolveRunnerCoverageGoalForAction(context, {
        type: "install_card",
        sourceTitle: "Wall Breaker",
      }).fit,
    ).toBe("install_fixes_coverage");
    expect(
      resolveRunnerCoverageGoalForAction(context, {
        type: "play_event",
        label: "Find a breaker",
      }).fit,
    ).toBe("unrelated");
    expect(
      resolveRunnerCoverageGoalForAction(context, {
        type: "play_event",
        actionTacticSignals: ["program_search"],
      }).fit,
    ).toBe("search_likely_finds");
  });

  it("matches breaker search goal ids by bounded semantic terms", () => {
    const context = {
      missingCoverageTypes: ["barrier" as const],
      sideSafeSearchAvailable: false,
      activeCoverageGoalIds: ["runner.doctrine.breaker_search"],
    };

    expect(
      resolveRunnerCoverageGoalForAction(context, {
        type: "play_event",
        actionTacticSignals: ["setup.program_search"],
      }).matchedGoalIds,
    ).toEqual(["runner.doctrine.breaker_search"]);

    expect(
      resolveRunnerCoverageGoalForAction(
        {
          ...context,
          activeCoverageGoalIds: ["runner.doctrine.breaker_searchish_noise"],
        },
        {
          type: "play_event",
          actionTacticSignals: ["setup.program_search"],
        },
      ).fit,
    ).toBe("draw_may_find");

    expect(
      resolveRunnerCoverageGoalForAction(context, {
        type: "play_event",
        actionTacticSignals: ["setup.program_searchish_noise"],
      }).fit,
    ).toBe("unrelated");
  });
});
