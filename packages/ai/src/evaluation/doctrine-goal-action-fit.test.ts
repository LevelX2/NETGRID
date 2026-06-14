import { describe, expect, it } from "vitest";

import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import { buildDoctrineGoalActionFitReport } from "./doctrine-goal-action-fit";

describe("DoctrineGoal action fit coverage", () => {
  it("measures whether doctrine goals find action candidate fits", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );
    const report = buildDoctrineGoalActionFitReport(
      samples.map((sample) => ({
        scenarioId: sample.scenarioId,
        ...(sample.deckDoctrine ? { diagnostic: sample.deckDoctrine } : {}),
        actionCandidates: sample.frame.actionCandidates,
      })),
    );

    expect(report).toMatchObject({
      version: "doctrine-goal-action-fit-v1",
      scope: "doctrine_goal_action_fit_report",
      diagnosticOnly: true,
      scenarioCount: samples.length,
      productiveUseAllowed: false,
      noRuntimeEffect: true,
    });
    expect(report.doctrineGoalsProduced).toBeGreaterThan(0);
    expect(report.goalsWithAtLeastOneFit).toBeGreaterThan(0);
    expect(
      report.goalsWithAtLeastOneFit +
        report.goalsOnlyBlocked +
        report.goalsNoCandidate,
    ).toBe(report.doctrineGoalsProduced);
    expect(report.worklistCandidates).toHaveLength(
      report.goalsOnlyBlocked + report.goalsNoCandidate,
    );
    expect(report.worklistCandidates.length).toBeGreaterThan(0);
    expect(report.worklistCandidates[0]).toEqual(
      expect.objectContaining({
        candidateId: expect.any(String),
        scenarioId: expect.any(String),
        goalId: expect.any(String),
        reason: expect.stringMatching(
          /^(blocked_action_fit|missing_action_candidate)$/,
        ),
        evidence: expect.arrayContaining([
          "doctrine_goal_action_fit_worklist:report_only",
          "productive_use_allowed:false",
        ]),
      }),
    );
    expect(report.evidence).toEqual(
      expect.arrayContaining([
        `worklist_candidate_count:${report.worklistCandidates.length}`,
      ]),
    );
    expect(Object.keys(report.topFitByFamily).length).toBeGreaterThan(0);
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });
});
