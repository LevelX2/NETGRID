import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  buildReplayDecisionCaseExtractionReport,
  extractReplayDecisionCaseFromTrace,
  replayDecisionCaseSplit,
  REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
  type ReplayDecisionTraceInput,
} from "./replay-decision-case-extraction";

describe("ReplayDecisionCaseExtraction", () => {
  it("extracts side-safe replay decision cases from local trace rows", () => {
    const report = buildReplayDecisionCaseExtractionReport(
      [
        traceRow({
          matchId: "match_00ff5d28ba6a855e",
          traceId: "trace-1",
          side: "runner",
          selectedActionType: "start_run",
          planKind: "runner.contest_remote",
          traceJson: {
            selectedActionType: "start_run",
            planKind: "runner.contest_remote",
            planId: "runner-plan",
            profileId: "ai-profile",
            summary: "Contest remote while credits are sufficient.",
            facts: ["remote has visible agenda pressure", "fullGameState leak"],
            visibleReasons: ["safe visible reason"],
            warnings: ["privatePayload should redact"],
            whyNot: ["draw_card lower tempo"],
            scoreBreakdown: [
              {
                key: "tempo",
                label: "Tempo",
                value: 0.5,
                weight: 2,
                reason: "Visible tempo pressure.",
              },
            ],
            rankedAlternatives: [
              {
                rank: 1,
                selectedActionType: "start_run",
                planKind: "runner.contest_remote",
                score: 0.8,
                confidence: 0.7,
                summary: "Run remote.",
                visibleReasons: ["best payoff"],
                warnings: [],
                whyNot: [],
              },
              {
                rank: 2,
                selectedActionType: "draw_card",
                planKind: "runner.develop_hand_card",
                score: 0.2,
                confidence: 0.6,
                summary: "sessionToken leak",
                visibleReasons: [],
                warnings: [],
                whyNot: ["slower"],
              },
            ],
          },
        }),
        traceRow({
          matchId: "match_6812fb0eff800ba2",
          traceId: "trace-2",
          side: "corp",
          selectedActionType: "gain_credit",
          planKind: "recover_economy",
        }),
      ],
      { sourceLabel: "unit-test", generatedAt: "2026-06-23T00:00:00.000Z" },
    );

    expect(report.schemaVersion).toBe(
      REPLAY_DECISION_CASE_EXTRACTION_SCHEMA_VERSION,
    );
    expect(report.scope).toBe("local_replay_decision_case_extraction");
    expect(report.aggregate.cases).toBe(2);
    expect(report.aggregate.bySide).toEqual({ corp: 1, runner: 1 });
    expect(report.aggregate.bySelectedActionType).toEqual({
      gain_credit: 1,
      start_run: 1,
    });
    expect(report.aggregate.discoveryCases).toBe(1);
    expect(report.aggregate.holdoutCases).toBe(1);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noRuntimeEffect).toBe(true);
    expect(report.redactionStatus).toBe("passed");
    expect(report.cases[0]?.split).toBe("discovery");
    expect(report.cases[1]?.split).toBe("holdout");
    expect(report.cases[0]?.observables.facts).toContain("[redacted]");
    expect(report.cases[0]?.observables.rankedAlternatives[1]?.summary).toBe(
      "[redacted]",
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
    expect(JSON.stringify(report)).not.toContain("fullGameState leak");
    expect(JSON.stringify(report)).not.toContain("sessionToken leak");
  });

  it("keeps extraction deterministic for the same trace anchor", () => {
    const first = extractReplayDecisionCaseFromTrace(traceRow());
    const second = extractReplayDecisionCaseFromTrace(traceRow());

    expect(first.caseId).toBe(second.caseId);
    expect(first.source.traceDigest).toBe(second.source.traceDigest);
    expect(replayDecisionCaseSplit("match_00ff5d28ba6a855e")).toBe(
      "discovery",
    );
    expect(replayDecisionCaseSplit("match_6812fb0eff800ba2")).toBe("holdout");
  });
});

function traceRow(
  overrides: Partial<ReplayDecisionTraceInput> = {},
): ReplayDecisionTraceInput {
  return {
    matchId: "match_00ff5d28ba6a855e",
    traceId: "trace-1",
    eventId: "event-1",
    mode: "human_corp_vs_runner_ai",
    status: "finished",
    createdAt: "2026-06-23T00:00:00.000Z",
    stateVersion: 12,
    matchVersion: 1,
    side: "runner",
    turn: 3,
    decisionIndex: 4,
    selectedActionId: "action-1",
    selectedActionType: "start_run",
    planKind: "runner.contest_remote",
    score: 0.8,
    confidence: 0.7,
    traceJson: {
      selectedActionType: "start_run",
      planKind: "runner.contest_remote",
      facts: ["visible fact"],
    },
    ...overrides,
  };
}

