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
