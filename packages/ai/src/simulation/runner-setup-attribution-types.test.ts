import { describe, expect, it } from "vitest";

import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  runnerSetupChosenFamilyForEntry,
  summarizeRunnerSetupAttributionMetrics,
} from "./runner-setup-attribution-types";

describe("runner setup attribution", () => {
  it("classifies the selected setup family with explicit precedence", () => {
    expect(
      runnerSetupChosenFamilyForEntry({
        actionType: "start_run",
        runnerEconomyTaken: true,
      }),
    ).toBe("economy");
    expect(
      runnerSetupChosenFamilyForEntry({
        actionType: "install_card",
        runnerSearchTaken: true,
      }),
    ).toBe("searchRecovery");
    expect(runnerSetupChosenFamilyForEntry({ actionType: "end_turn" })).toBe(
      "endTurn",
    );
  });

  it("keeps unclassified windows when another window is both blocked and suspicious", () => {
    const summary = {
      terminationKind: "game_result",
      actionSequence: [
        {
          side: "runner",
          actionType: "draw_card",
          runnerHandSizeSupportSkippedWhileDamageRiskVisible: true,
          runnerEconomyTaken: true,
        },
        {
          side: "runner",
          actionType: "resolve_choice",
          runnerDiscardChoice: true,
        },
        {
          side: "runner",
          actionType: "draw_card",
          runnerHandSizeSupportSkippedWhileDamageRiskVisible: true,
        },
      ],
    } as unknown as AiSimulationSummary;

    expect(
      summarizeRunnerSetupAttributionMetrics([summary], () => false),
    ).toMatchObject({
      runnerSetupAttributionWindows: 2,
      runnerSetupAttributionBlocked: 1,
      runnerSetupAttributionSuspicious: 1,
      runnerSetupAttributionUnclassified: 1,
    });
  });

  it("keeps the follow-up window on Runner decisions and excludes distant limits", () => {
    const summary = {
      terminationKind: "action_limit",
      actionSequence: [
        {
          side: "runner",
          actionType: "draw_card",
          runnerEconomyFixGateEligibleStarvedSkip: true,
        },
        ...Array.from({ length: 5 }, (_, i) => [
          {
            side: "corp",
            actionType: "draw_card",
            stateVersionBefore: i * 2 + 1,
          },
          {
            side: "runner",
            actionType: i === 4 ? "install_card" : "draw_card",
            stateVersionBefore: i * 2 + 2,
          },
        ]).flat(),
      ],
    } as unknown as AiSimulationSummary;

    expect(
      summarizeRunnerSetupAttributionMetrics(
        [summary],
        (entry) => entry.actionType === "install_card",
      ),
    ).toMatchObject({
      runnerStarvedEconomySkipThenProgress: 1,
      runnerStarvedEconomySkipThenNoProgress: 0,
      runnerStarvedEconomySkipThenActionLimit: 0,
    });
  });

  it("attributes a skipped legal hand-size support window", () => {
    const summary = {
      terminationKind: "game_result",
      actionSequence: [
        {
          side: "runner",
          stateVersionBefore: 12,
          actionType: "gain_credit",
          reasonCode: "test",
          explanation: "test",
          confidence: 1,
          evidence: [],
          fallbackUsed: false,
          timeoutUsed: false,
          runnerHandSizeBottleneckDecisionWindow: true,
          runnerLegalHandSizeActions: 1,
          runnerHandSizeSupportSkippedWhileDamageRiskVisible: true,
        },
      ],
    } as unknown as AiSimulationSummary;

    const metrics = summarizeRunnerSetupAttributionMetrics(
      [summary],
      () => false,
    );

    expect(metrics.runnerHandSizeFixGateWindows).toBe(1);
    expect(metrics.runnerHandSizeFixGateLegalSupport).toBe(1);
    expect(metrics.runnerHandSizeNormalizedWindows).toBe(1);
    expect(metrics.runnerHandSizeNormalizedSkipped).toBe(1);
    expect(metrics.runnerSetupAttributionWindows).toBe(1);
  });
});
