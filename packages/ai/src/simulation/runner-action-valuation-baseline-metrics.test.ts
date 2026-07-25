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

  it("recognizes only an immediately verified plan-first Corp deckout closeout", () => {
    const terminalEndTurn = action("end_turn", 4);
    terminalEndTurn.planKind = "runner.secure_terminal_win";
    const forcedDraw = action("mandatory_draw", 3);
    forcedDraw.side = "corp";

    const metrics = summarizeRunnerActionValuationBaselineMetrics([
      summary([terminalEndTurn, forcedDraw], {
        winner: "runner",
        gameEndReason: "corp_deck_empty",
      }),
    ]);

    expect(metrics).toMatchObject({
      runnerEndTurnsWithClicks: 1,
      runnerInevitableCorpDeckoutEndTurnsWithClicks: 1,
      runnerPrematureEndTurnsWithClicks: 0,
    });
  });

  it("does not trust the terminal plan label without the immediate deckout outcome", () => {
    const mislabeledEndTurn = action("end_turn", 4);
    mislabeledEndTurn.planKind = "runner.secure_terminal_win";
    const forcedDraw = action("mandatory_draw", 3);
    forcedDraw.side = "corp";

    const metrics = summarizeRunnerActionValuationBaselineMetrics([
      summary([mislabeledEndTurn, forcedDraw], {
        winner: "runner",
        gameEndReason: "agenda_points",
      }),
    ]);

    expect(metrics).toMatchObject({
      runnerEndTurnsWithClicks: 1,
      runnerInevitableCorpDeckoutEndTurnsWithClicks: 0,
      runnerPrematureEndTurnsWithClicks: 1,
    });
  });

  it("does not call an alternative-free click-rich end turn premature", () => {
    const forcedEndTurn = action("end_turn", 7);
    forcedEndTurn.legalActionCount = 1;
    forcedEndTurn.actionableAlternativeCount = 0;

    expect(
      summarizeRunnerActionValuationBaselineMetrics([
        summary([forcedEndTurn]),
      ]),
    ).toMatchObject({
      runnerEndTurnsWithClicks: 1,
      runnerInevitableCorpDeckoutEndTurnsWithClicks: 0,
      runnerPrematureEndTurnsWithClicks: 0,
    });
  });

  it("accepts only a fully certified plan-first route-exhaustion completion", () => {
    const certified = action("end_turn", 3, [
      "plan_first_lane:plan",
      "plan_step_capability:complete_turn_after_productive_routes_exhausted",
      "plan_assessment_evidence:productive_legal_routes_exhausted",
    ]);
    certified.planKind = "runner.complete_turn";
    certified.reasonCode = "plan_first.runner.complete_turn";
    certified.actionableAlternativeCount = 7;
    const missingCapability = {
      ...certified,
      evidence: certified.evidence.filter(
        (entry) =>
          entry !==
          "plan_step_capability:complete_turn_after_productive_routes_exhausted",
      ),
    };

    expect(
      summarizeRunnerActionValuationBaselineMetrics([
        summary([certified, missingCapability]),
      ]),
    ).toMatchObject({
      runnerEndTurnsWithClicks: 2,
      runnerInevitableCorpDeckoutEndTurnsWithClicks: 0,
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
  overrides: Partial<AiSimulationSummary> = {},
): AiSimulationSummary {
  return { actionSequence, ...overrides } as AiSimulationSummary;
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
