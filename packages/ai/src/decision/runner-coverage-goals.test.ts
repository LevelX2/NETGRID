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
});
