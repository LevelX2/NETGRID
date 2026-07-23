import { describe, expect, it } from "vitest";

import type { AiSimulationSummary } from "./ai-simulation-summary";
import { summarizeRunnerActionValuationBaselineMetrics } from "./runner-action-valuation-baseline-metrics";

describe("summarizeRunnerActionValuationBaselineMetrics", () => {
  it("separates premature Runner yield from zero-click and deckout controls", () => {
    const metrics = summarizeRunnerActionValuationBaselineMetrics([
      summary([
        action("end_turn", 4),
        action("end_turn", 0),
        action("end_turn", 4, ["runner_inevitable_corp_deckout:true"]),
      ]),
    ]);

    expect(metrics).toMatchObject({
      runnerEndTurnsWithClicks: 2,
      runnerInevitableCorpDeckoutEndTurnsWithClicks: 1,
      runnerPrematureEndTurnsWithClicks: 1,
    });
  });

  it("counts only structured negative redundant persistent installs", () => {
    const metrics = summarizeRunnerActionValuationBaselineMetrics([
      summary([
        action("install_card", 4, [
          "persistentInstallEvaluation:true",
          "persistentInstallDuplicateRole:redundant_duplicate",
          "persistentInstallFinalFit:-500",
        ]),
        action("install_card", 3, [
          "persistentInstallEvaluation:true",
          "persistentInstallDuplicateRole:useful_backup",
          "persistentInstallFinalFit:80",
        ]),
        action("install_card", 2, [
          "persistentInstallEvaluation:true",
          "persistentInstallDuplicateRole:redundant_duplicate",
          "persistentInstallFinalFit:40",
        ]),
        action("install_card", 1, [
          "persistentInstallDuplicateRole:redundant_duplicate",
          "persistentInstallFinalFit:-900",
        ]),
      ]),
    ]);

    expect(metrics).toMatchObject({
      runnerPersistentInstallSelections: 3,
      runnerRedundantPersistentInstallSelections: 1,
    });
  });

  it("ignores matching Corp actions", () => {
    const entry = action("end_turn", 3);
    entry.side = "corp";

    expect(
      summarizeRunnerActionValuationBaselineMetrics([summary([entry])]),
    ).toMatchObject({
      runnerEndTurnsWithClicks: 0,
      runnerPrematureEndTurnsWithClicks: 0,
    });
  });
});

function summary(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary {
  return { actionSequence } as AiSimulationSummary;
}

function action(
  actionType: AiSimulationSummary["actionSequence"][number]["actionType"],
  actionsRemainingBefore: number,
  evidence: string[] = [],
): AiSimulationSummary["actionSequence"][number] {
  return {
    side: "runner",
    stateVersionBefore: 1,
    actionType,
    actionsRemainingBefore,
    reasonCode: "test",
    explanation: "test",
    confidence: 1,
    evidence,
    fallbackUsed: false,
    timeoutUsed: false,
    qualityTags: [],
    stateHashAfter: "hash",
  };
}
