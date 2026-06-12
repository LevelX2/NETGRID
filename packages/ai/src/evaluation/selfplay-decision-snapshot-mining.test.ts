import type { AiDecisionActionAlternative } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import type { SelfplayDecisionSnapshotMiningSummary } from "./selfplay-decision-snapshot-mining";
import {
  buildSelfplayDecisionSnapshotMiningReport,
  SELFPLAY_DECISION_SNAPSHOT_MINING_SCHEMA_VERSION,
} from "./selfplay-decision-snapshot-mining";

describe("SelfplayDecisionSnapshotMining", () => {
  it("mines suspicious selfplay decisions into diagnostic snapshot candidates", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-remote-1",
        targetServerId: "remote_1",
        reasonCode: "runner.plan.remote_contest",
        evidence: ["known_no_current_payoff"],
        actionAlternatives: [
          actionAlternative(1, "run-remote-1", "start_run", true),
          actionAlternative(2, "draw-1", "draw_card", false),
        ],
      }),
      selfplayAction("runner", 2, "start_run", {
        selectedActionId: "run-remote-2",
        targetServerId: "remote_1",
        reasonCode: "runner.plan.remote_contest",
        evidence: ["known_no_current_payoff"],
        runnerRunPenalizedAsKnownNoAccess: true,
        runnerRepeatRunOnKnownUnpayableRemotePath: true,
        actionAlternatives: [
          actionAlternative(1, "run-remote-2", "start_run", true, {
            whyNot: ["known_no_current_payoff"],
          }),
          actionAlternative(2, "gain-credit", "gain_credit", false),
        ],
      }),
    ]);

    const report = buildSelfplayDecisionSnapshotMiningReport([summary], {
      detectorIds: [
        "repeated_no_progress_run",
        "repeated_known_no_payoff_remote",
      ],
    });
    const candidate = report.candidates.find(
      (entry) => entry.selectedActionId === "run-remote-2",
    );

    expect(report.schemaVersion).toBe(
      SELFPLAY_DECISION_SNAPSHOT_MINING_SCHEMA_VERSION,
    );
    expect(report.scope).toBe("selfplay_decision_snapshot_mining_report_only");
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.noRuntimeEffect).toBe(true);
    expect(report.redactionStatus).toBe("passed");
    expect(report.sourceSummaryCount).toBe(1);
    expect(report.sourceDecisionPointCount).toBe(2);
    expect(report.findingCount).toBe(2);
    expect(report.candidateCount).toBe(2);
    expect(report.blockedCandidateCount).toBe(0);
    expect(candidate).toMatchObject({
      kind: "selfplay_decision_snapshot_candidate",
      status: "candidate_snapshot",
      side: "runner",
      selectedActionId: "run-remote-2",
      detectorIds: [
        "repeated_no_progress_run",
        "repeated_known_no_payoff_remote",
      ],
      mistakeClasses: ["ignored_remote_threat", "plan_step_mismatch", "unsafe_run"],
      executableDecisionSnapshotAvailable: false,
      diagnosticOnly: true,
      noRuntimeEffect: true,
    });
    expect(candidate?.candidateSnapshot.expectedProperties).toEqual({
      mustChooseFromLegalActions: true,
      forbiddenMistakes: [
        "ignored_remote_threat",
        "plan_step_mismatch",
        "unsafe_run",
      ],
    });
    expect(candidate?.candidateSnapshot.legalActionCandidates).toEqual([
      expect.objectContaining({
        actionId: "run-remote-2",
        actionType: "start_run",
        selected: true,
      }),
      expect.objectContaining({
        actionId: "gain-credit",
        actionType: "gain_credit",
        selected: false,
      }),
    ]);
    expect(report.candidatesByMistakeClass.unsafe_run).toBe(2);
    expect(report.candidatesByMistakeClass.ignored_remote_threat).toBe(2);
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });

  it("keeps findings without redacted action alternatives as blocked candidates", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "bank-load",
        reasonCode: "runner.bank.load",
        evidence: [
          "bankOverDesiredTarget:true",
          "bankConcreteFundingNeed:false",
        ],
      }),
    ]);

    const report = buildSelfplayDecisionSnapshotMiningReport([summary], {
      detectorIds: ["bank_over_target_without_funding_need"],
    });

    expect(report.candidates).toHaveLength(1);
    expect(report.blockedCandidateCount).toBe(1);
    expect(report.candidates[0]).toMatchObject({
      status: "blocked_missing_redacted_action_alternatives",
      mistakeClasses: ["economy_starvation"],
      executableDecisionSnapshotAvailable: false,
    });
    expect(report.candidates[0]?.candidateSnapshot.legalActionCandidates).toEqual(
      [],
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });
});

function selfplaySummary(
  actionSequence: SelfplayDecisionSnapshotMiningSummary["actionSequence"],
): SelfplayDecisionSnapshotMiningSummary {
  return {
    seed: "selfplay-snapshot-mining",
    winner: "action_limit_reached",
    actions: actionSequence.length,
    turns: 2,
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: "fnv1a:selfplay-snapshot-mining",
    eventLogLength: actionSequence.length,
    replayOk: true,
    replayErrors: [],
    actionSequence,
    errors: [],
    cardPoolVersion: "0.99.0",
    metrics: {
      illegalActions: 0,
      fallbackRate: 0,
      timeoutRate: 0,
      reasonCodeCoverage: [],
      actionTypeCoverage: [],
      roleCoverage: [],
      progressScore: 0,
      holdout: false,
      doctrine: {
        nakedAgendaInstalls: 0,
        agendaFloodExposure: 0,
        scoreWindowMissed: 0,
        remoteOverbuild: 0,
        economyStall: 0,
        repeatedLowValueCentralRun: 0,
        rigStall: 0,
        assetTrashNeglect: 0,
      },
    },
  };
}

function selfplayAction(
  side: SelfplayDecisionSnapshotMiningSummary["actionSequence"][number]["side"],
  stateVersionBefore: number,
  actionType: SelfplayDecisionSnapshotMiningSummary["actionSequence"][number]["actionType"],
  overrides: Partial<
    SelfplayDecisionSnapshotMiningSummary["actionSequence"][number]
  > = {},
): SelfplayDecisionSnapshotMiningSummary["actionSequence"][number] {
  return {
    ...overrides,
    side,
    stateVersionBefore,
    actionType,
    reasonCode: overrides.reasonCode ?? `${side}.synthetic`,
    explanation: overrides.explanation ?? "Synthetic selfplay action.",
    confidence: overrides.confidence ?? 0.5,
    evidence: overrides.evidence ?? [],
    fallbackUsed: overrides.fallbackUsed ?? false,
    timeoutUsed: overrides.timeoutUsed ?? false,
    qualityTags: overrides.qualityTags ?? [],
    stateHashAfter: overrides.stateHashAfter ?? `fnv1a:${stateVersionBefore}`,
  };
}

function actionAlternative(
  rank: number,
  actionId: string,
  actionType: string,
  selected: boolean,
  overrides: Partial<AiDecisionActionAlternative> = {},
): AiDecisionActionAlternative {
  return {
    rank,
    actionId,
    actionType,
    selected,
    whyChosen: [`rank:${rank}`],
    whyNot: [],
    ...overrides,
  };
}
