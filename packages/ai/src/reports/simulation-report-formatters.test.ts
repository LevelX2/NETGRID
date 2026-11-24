import { describe, expect, it } from "vitest";
import {
  formatDoctrineQualityCaseAnalysisReport,
  type DoctrineQualityCaseAnalysisReportInput,
} from "./simulation-report-formatters";

function emptyAnalysis(): DoctrineQualityCaseAnalysisReportInput {
  return {
    version: "ai-deck-doctrine-case-analysis-v1",
    maxExamplesPerMetric: 2,
    totals: {
      nakedAgendaInstalls: 0,
      agendaFloodExposure: 0,
      scoreWindowMissed: 1,
      remoteOverbuild: 0,
      economyStall: 0,
      repeatedLowValueCentralRun: 0,
      rigStall: 0,
      assetTrashNeglect: 0,
    },
    examples: {
      nakedAgendaInstalls: [],
      agendaFloodExposure: [],
      scoreWindowMissed: [
        {
          metric: "scoreWindowMissed",
          seed: "case-seed",
          actionIndex: 7,
          stateVersionBefore: 12,
          side: "corp",
          actionType: "end_turn",
          reasonCode: "corp.plan.defer_score",
          targetServerId: "r1",
          qualityTags: ["score_window_missed"],
        },
      ],
      remoteOverbuild: [],
      economyStall: [],
      repeatedLowValueCentralRun: [],
      rigStall: [],
      assetTrashNeglect: [],
    },
    redactionSafe: true,
  };
}

describe("simulation report formatters", () => {
  it("keeps delimiters and line breaks in examples inside their table cells", () => {
    const analysis = emptyAnalysis();
    const example = analysis.examples.scoreWindowMissed[0]!;
    example.seed = "seed|rerun";
    example.reasonCode = "reason\ncontinuation";
    const report = formatDoctrineQualityCaseAnalysisReport(analysis);
    expect(report).toContain(
      "| seed\\|rerun | 7 | corp | end_turn | reason continuation | r1 | score_window_missed |",
    );
  });
  it("formats doctrine case analysis without runtime payload details", () => {
    const report = formatDoctrineQualityCaseAnalysisReport(
      emptyAnalysis(),
      "Custom Case Report",
    );

    expect(report).toContain("# Custom Case Report");
    expect(report).toContain("| scoreWindowMissed | 1 | 1 |");
    expect(report).toContain(
      "| case-seed | 7 | corp | end_turn | corp.plan.defer_score | r1 | score_window_missed |",
    );
    expect(report).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });
});
