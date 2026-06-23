import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  buildCurrentAiHoldoutRunnerReport,
  currentAiHoldoutActionDigest,
  currentAiHoldoutCaseKey,
  renderCurrentAiHoldoutRunnerMarkdown,
  type CurrentAiHoldoutEvaluation,
} from "./current-ai-holdout-runner";

describe("CurrentAiHoldoutRunner", () => {
  it("summarizes current-AI holdout execution without embedding raw ids", () => {
    const evaluations: CurrentAiHoldoutEvaluation[] = [
      evaluated({
        historicalType: "draw_card",
        historicalPlan: "runner.obtain_breaker_coverage",
        currentType: "start_run",
        currentPlan: "simple_hq_or_rnd_pressure",
        changedDecision: true,
      }),
      evaluated({
        historicalType: "gain_credit",
        historicalPlan: "runner.build_credit_base",
        currentType: "gain_credit",
        currentPlan: "runner.build_credit_base",
        legal: false,
        changedDecision: false,
      }),
      {
        status: "reconstruction_error",
        caseKey: currentAiHoldoutCaseKey({
          matchId: "match-3",
          traceId: "trace-3",
          eventId: "event-3",
          stateVersion: 3,
          decisionIndex: 3,
        }),
        side: "runner",
        historical: {
          actionType: "start_run",
          actionIdDigest: currentAiHoldoutActionDigest("run-remote"),
          planKind: "remote_contest",
        },
        errorCode: "snapshot_missing",
      },
    ];

    const report = buildCurrentAiHoldoutRunnerReport(evaluations, {
      runId: "unit-test",
      sourceLabel: "local_sqlite_runtime:provided",
      dbProvided: true,
      fixedPattern: {
        historicalActionType: "draw_card",
        historicalPlanKind: "runner.obtain_breaker_coverage",
        currentActionType: "start_run",
        currentPlanKind: "simple_hq_or_rnd_pressure",
      },
    });

    expect(report.aggregate.holdoutCases).toBe(3);
    expect(report.aggregate.evaluated).toBe(2);
    expect(report.aggregate.changedDecisions).toBe(1);
    expect(report.aggregate.illegalActions).toBe(1);
    expect(report.aggregate.reconstructionErrors).toBe(1);
    expect(report.aggregate.fixedPatternHistoricalCases).toBe(1);
    expect(report.aggregate.fixedPatternCurrentRecurrence).toBe(0);
    expect(report.gates.noIllegalActions).toBe(false);
    expect(report.gates.reconstructionComplete).toBe(false);
    expect(report.examples[0]?.caseKey).toMatch(/^holdout-/);
    expect(JSON.stringify(report)).not.toContain("match-1");
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
    expect(renderCurrentAiHoldoutRunnerMarkdown(report)).toContain(
      "IllegalActions",
    );
  });
});

function evaluated(input: {
  historicalType: string;
  historicalPlan: string;
  currentType: string;
  currentPlan: string;
  changedDecision: boolean;
  legal?: boolean;
}): CurrentAiHoldoutEvaluation {
  return {
    status: "evaluated",
    caseKey: currentAiHoldoutCaseKey({
      matchId: `match-${input.historicalType}`,
      traceId: `trace-${input.historicalType}`,
      eventId: `event-${input.historicalType}`,
      stateVersion: 1,
      decisionIndex: 1,
    }),
    side: "runner",
    historical: {
      actionType: input.historicalType,
      actionIdDigest: currentAiHoldoutActionDigest(input.historicalType),
      planKind: input.historicalPlan,
    },
    current: {
      actionType: input.currentType,
      actionIdDigest: currentAiHoldoutActionDigest(input.currentType),
      planKind: input.currentPlan,
      reasonCode: "unit_test",
      legalActionCount: 2,
      legal: input.legal ?? true,
    },
    changedDecision: input.changedDecision,
  };
}
