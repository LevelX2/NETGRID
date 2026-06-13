import { describe, expect, it } from "vitest";
import { formatDoctrineQualityCaseAnalysisReport } from "./simulation-report-formatters";
import type { AiDoctrineQualityCaseAnalysis } from "../index";

function emptyAnalysis(): AiDoctrineQualityCaseAnalysis {
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
          targetServerId: "remote_1",
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
  it("formats doctrine case analysis without runtime payload details", () => {
    const report = formatDoctrineQualityCaseAnalysisReport(
      emptyAnalysis(),
      "Custom Case Report",
    );

    expect(report).toContain("# Custom Case Report");
    expect(report).toContain("| scoreWindowMissed | 1 | 1 |");
    expect(report).toContain(
      "| case-seed | 7 | corp | end_turn | corp.plan.defer_score | remote_1 | score_window_missed |",
    );
    expect(report).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });
});
