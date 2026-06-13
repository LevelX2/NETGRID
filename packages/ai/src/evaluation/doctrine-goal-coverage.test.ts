import { describe, expect, it } from "vitest";
import type {
  DeckDoctrineV2Diagnostic,
  DeckDoctrineV2DiagnosticStatus,
  DeckDoctrineV2StrategyDiagnostic,
} from "../deck-doctrine-strategy";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import { buildDoctrineGoalCoverageReport } from "./doctrine-goal-coverage";

describe("DoctrineGoal coverage report", () => {
  it("reports covered goals and uncovered anchored strategies", () => {
    const report = buildDoctrineGoalCoverageReport([
      {
        scenarioId: "runner-covered",
        diagnostic: diagnostic("runner", "complete", false, [
          strategy("runner.rnd_pressure", "complete"),
          strategy("runner.unsupported_custom", "complete"),
        ]),
      },
      { scenarioId: "missing-diagnostic" },
    ]);

    expect(report).toMatchObject({
      version: "doctrine-goal-coverage-v1",
      scope: "doctrine_goal_coverage_report",
      diagnosticOnly: true,
      scenarioCount: 2,
      diagnosticCount: 1,
      sideCounts: {
        runner: 1,
        corp: 0,
        unknown: 0,
      },
      strategyCount: 2,
      strategyWithAnchorCount: 2,
      synthesizedGoalCount: 1,
      goalFamilyCounts: {
        pressure: 1,
      },
      scenariosWithoutDiagnostics: ["missing-diagnostic"],
      productiveUseAllowed: false,
      noRuntimeEffect: true,
    });
    expect(report.uncoveredAnchoredStrategies).toEqual([
      expect.objectContaining({
        scenarioId: "runner-covered",
        side: "runner",
        strategyId: "runner.unsupported_custom",
        status: "complete",
      }),
    ]);
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });

  it("summarizes doctrine goal coverage over the real Engine corpus", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );
    const report = buildDoctrineGoalCoverageReport(
      samples.map((sample) => ({
        scenarioId: sample.scenarioId,
        ...(sample.deckDoctrine ? { diagnostic: sample.deckDoctrine } : {}),
      })),
    );

    expect(report.scenarioCount).toBe(samples.length);
    expect(report.diagnosticCount).toBe(samples.length);
    expect(report.synthesizedGoalCount).toBeGreaterThan(0);
    expect(Object.keys(report.goalFamilyCounts).length).toBeGreaterThan(0);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });
});

function diagnostic(
  side: "runner" | "corp",
  status: DeckDoctrineV2DiagnosticStatus,
  neutralDoctrine: boolean,
  strategies: DeckDoctrineV2StrategyDiagnostic[],
): DeckDoctrineV2Diagnostic {
  return {
    schemaVersion: "deck-doctrine-v2-diagnostic-v1",
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    deckSnapshotId: `${side}-test`,
    side,
    status,
    neutralDoctrine,
    strategyDiagnostics: strategies,
    rolesStatus: {
      status,
      cardCount: 0,
      cardRows: 0,
      completeCards: 0,
      partialCards: 0,
      anchorlessCards: 0,
      cardsWithoutRoles: [],
      roleSignalCount: 0,
      functionSignalCount: 0,
      strategyAnchorCount: 0,
    },
    cardRoles: [],
    warnings: [],
    source: {
      strategyProfile: "buildDeckStrategyProfile",
      mode: "report_only",
      plannerEffect: "none",
    },
    noEffectFlags: {
      actionSelection: false,
      plannerWeights: false,
      scoring: false,
      legalActionGeneration: false,
      engineMutation: false,
      hiddenInfoProjection: false,
    },
  };
}

function strategy(
  strategyId: string,
  status: Exclude<DeckDoctrineV2DiagnosticStatus, "unknown_snapshot">,
  supportGaps: string[] = [],
): DeckDoctrineV2StrategyDiagnostic {
  return {
    strategyId,
    status,
    anchorScore: status === "complete" ? 80 : 35,
    supportScore: status === "complete" ? 80 : 20,
    finalScore: status === "complete" ? 80 : 35,
    confidence: status === "complete" ? "high" : "medium",
    anchorEvidenceCount: status === "anchorless" ? 0 : 1,
    supportEvidenceCount: supportGaps.length > 0 ? 0 : 1,
    supportGaps,
  };
}
