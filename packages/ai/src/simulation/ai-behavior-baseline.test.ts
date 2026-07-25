import { describe, expect, it } from "vitest";
import {
  compareAiBehaviorBaselines,
  createAiBehaviorBaseline,
  createAiBehaviorBaselineSlotResult,
  evaluateAiBehaviorBaselineGate,
  formatAiBehaviorBaselineReport,
} from "./ai-behavior-baseline";
import type { AiBehaviorActionLimitDiagnosis } from "./ai-behavior-baseline-runtime-evidence";
import type { AiSimulationRuntimeFailure } from "./ai-simulation-runtime-failure";

describe("AI behavior baseline", () => {
  it("normalizes behavioural metrics and preserves hard technical gates", () => {
    const slot = createSlot({
      scoreActionsAvailable: 8,
      missedScoreWindows: 2,
      remoteRunOpportunitiesAgainstAdvancedRemote: 10,
      remoteRunsAgainstAdvancedRemote: 4,
      skippedAdvancedRemoteContest: 3,
      planIntentConvertedWithin3OwnDecisions: 6,
      planIntentExpired: 1,
      planIntentAbandoned: 3,
      sameStrategicPlanRepeatedWithoutProgress: 5,
      decisions: 100,
      findings: 7,
      clearlyDominated: 2,
      actionCapacityOpportunities: 4,
      actionCapacityUses: 2,
      actionCapacityPlanConversions: 1,
      actionCapacityFollowupConversions: 2,
      actionCapacityExpiredUses: 0,
      actionCapacityMisconversions: 0,
      runnerEndTurnsWithClicks: 3,
      runnerInevitableCorpDeckoutEndTurnsWithClicks: 1,
      runnerPrematureEndTurnsWithClicks: 2,
      runnerPersistentInstallSelections: 5,
      runnerRedundantPersistentInstallSelections: 1,
    });
    const baseline = createBaseline(slot);

    expect(baseline.aggregate.missedScoreWindowRate).toBe(0.25);
    expect(baseline.aggregate.advancedRemoteContestSkipRate).toBe(0.3);
    expect(baseline.aggregate.planConversionRate).toBe(0.6);
    expect(baseline.aggregate.strategicNoProgressRatePer100Decisions).toBe(5);
    expect(
      baseline.aggregate.clearlyDominatedPlanChoiceRatePer100Decisions,
    ).toBe(2);
    expect(baseline.aggregate.actionCapacityUseRate).toBe(0.5);
    expect(baseline.aggregate.actionCapacityPlanConversionRate).toBe(0.5);
    expect(baseline.aggregate.actionCapacityExpirationRate).toBe(0);
    expect(baseline.aggregate.actionCapacityMisconversionRate).toBe(0);
    expect(baseline.aggregate.runnerPrematureEndTurnRatePer100Decisions).toBe(
      2,
    );
    expect(baseline.aggregate.runnerRedundantPersistentInstallRate).toBe(0.2);
    expect(baseline.gate.accepted).toBe(false);
    expect(baseline.gate.hardFailures).toEqual(
      expect.arrayContaining([
        "premature_runner_end_turns_with_clicks:2",
        "redundant_low_value_runner_persistent_installs:1",
      ]),
    );
    const report = formatAiBehaviorBaselineReport(baseline);
    expect(report).toContain("# AI Behavior Baseline v1");
    expect(report).toContain("Premature Runner end turns / 100 decisions");
    expect(report).toContain(
      "Redundant low-value Runner persistent install rate",
    );
  });

  it("allows only the separately verified Corp-deckout EndTurn control", () => {
    const baseline = createBaseline(
      createSlot({
        runnerEndTurnsWithClicks: 1,
        runnerInevitableCorpDeckoutEndTurnsWithClicks: 1,
        runnerPrematureEndTurnsWithClicks: 0,
      }),
    );

    expect(baseline.gate.accepted).toBe(true);
    expect(baseline.gate.hardFailures).not.toContain(
      expect.stringContaining("premature_runner_end_turns"),
    );
  });

  it("gates unclassified and repeated-owner runtime failures with code evidence", () => {
    const runtimeFailures: AiSimulationRuntimeFailure[] = [
      runtimeFailure("missing_plan_module_coverage", "plan_registry"),
      runtimeFailure("invalid_plan_identity", "plan_registry"),
      {
        classified: false,
        code: "unclassified_runtime_failure",
        side: "runner",
        stateVersion: 3,
        timingPoint: "runner_action.main",
      },
    ];
    const baseline = createBaseline(
      createSlot({
        runtimeFailures,
        runtimeErrorCount: runtimeFailures.length,
      }),
    );

    expect(baseline.aggregate.runtimeFailureCodeCounts).toEqual({
      invalid_plan_identity: 1,
      missing_plan_module_coverage: 1,
      unclassified_runtime_failure: 1,
    });
    expect(baseline.aggregate.runtimeFailureOwnerCounts).toEqual({
      plan_registry: 2,
    });
    expect(baseline.gate.hardFailures).toEqual(
      expect.arrayContaining([
        "runtime_errors:3",
        "unclassified_runtime_failures:1",
        "repeated_runtime_failure_owner:plan_registry:2",
      ]),
    );
    const report = formatAiBehaviorBaselineReport(baseline);
    expect(report).toContain("| missing_plan_module_coverage | 1 |");
    expect(report).toContain("| plan_registry | 2 |");
  });

  it("treats an action limit without complete owner-plan-step diagnosis as unclassified", () => {
    const baseline = createBaseline(
      createSlot({
        actionLimitGames: 1,
        winner: "action_limit_reached",
      }),
    );

    expect(baseline.aggregate.unclassifiedActionLimitGames).toBe(1);
    expect(baseline.gate.hardFailures).toEqual(
      expect.arrayContaining([
        "action_limit_games:1",
        "unclassified_action_limit_games:1",
      ]),
    );
  });

  it("reports a complete classified action-limit diagnosis without softening the gate", () => {
    const actionLimitDiagnosis: AiBehaviorActionLimitDiagnosis = {
      classified: true,
      owner: "plan_module",
      planInstanceId: "plan:runner.contest_remote:remote_1",
      stepId: "contest",
      noProgressCluster: "action_limit_runner_remote_contest_blocked",
      noProgressSubcluster: "late_run_step_stall",
    };
    const baseline = createBaseline(
      createSlot({
        actionLimitGames: 1,
        winner: "action_limit_reached",
        actionLimitDiagnosis,
      }),
    );

    expect(baseline.aggregate.classifiedActionLimitGames).toBe(1);
    expect(baseline.aggregate.unclassifiedActionLimitGames).toBe(0);
    expect(baseline.gate.hardFailures).toContain("action_limit_games:1");
    expect(formatAiBehaviorBaselineReport(baseline)).toContain(
      "| behavior-test-slot | baseline-seed | yes | plan_module | plan:runner.contest_remote:remote_1 | contest | action_limit_runner_remote_contest_blocked | late_run_step_stall |",
    );
  });

  it("does not relabel a classified runtime failure as an action-limit failure", () => {
    const runtimeFailures: AiSimulationRuntimeFailure[] = [
      runtimeFailure("missing_plan_module_coverage", "plan_registry"),
    ];
    const baseline = createBaseline(
      createSlot({
        actionLimitGames: 0,
        winner: "action_limit_reached",
        runtimeFailures,
        runtimeErrorCount: runtimeFailures.length,
      }),
    );

    expect(baseline.aggregate.classifiedRuntimeFailures).toBe(1);
    expect(baseline.aggregate.classifiedActionLimitGames).toBe(0);
    expect(baseline.aggregate.unclassifiedActionLimitGames).toBe(0);
    expect(baseline.gate.hardFailures).not.toContain(
      expect.stringContaining("action_limit_games"),
    );
  });

  it("fails the hard gate for technical safety regressions", () => {
    const gate = evaluateAiBehaviorBaselineGate(
      createBaseline(
        createSlot({
          illegalActions: 1,
          fallbackActions: 2,
          redactionSafe: false,
        }),
      ).aggregate,
    );

    expect(gate.accepted).toBe(false);
    expect(gate.hardFailures).toEqual(
      expect.arrayContaining([
        "illegal_actions:1",
        "fallback_actions:2",
        "redaction_safe:false",
      ]),
    );
  });

  it("only compares runs with matching slots, seeds, and deck fingerprints", () => {
    const baseline = createBaseline(createSlot({}), "baseline-head");
    const candidate = createBaseline(
      createSlot({ missedScoreWindows: 1 }),
      "candidate-head",
    );
    const comparison = compareAiBehaviorBaselines(baseline, candidate);

    expect(comparison.comparable).toBe(true);
    expect(comparison.aggregateDelta?.missedScoreWindowRate).toBe(0.25);

    const changedSeeds = createAiBehaviorBaseline({
      generatedAt: "2026-07-12T00:00:00.000Z",
      gitHead: "candidate-head",
      config: {
        ...candidate.config,
        seeds: ["different-seed"],
      },
      slots: candidate.slots,
    });
    expect(compareAiBehaviorBaselines(baseline, changedSeeds)).toMatchObject({
      comparable: false,
      incompatibilities: ["seeds"],
    });
  });
});

function createBaseline(slot = createSlot({}), gitHead = "baseline-head") {
  return createAiBehaviorBaseline({
    generatedAt: "2026-07-12T00:00:00.000Z",
    gitHead,
    config: {
      seeds: ["baseline-seed"],
      maxActions: 480,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      slotIds: [slot.slotId],
    },
    slots: [slot],
  });
}

function createSlot(
  overrides: Partial<{
    scoreActionsAvailable: number;
    missedScoreWindows: number;
    remoteRunOpportunitiesAgainstAdvancedRemote: number;
    remoteRunsAgainstAdvancedRemote: number;
    skippedAdvancedRemoteContest: number;
    planIntentConvertedWithin3OwnDecisions: number;
    planIntentExpired: number;
    planIntentAbandoned: number;
    sameStrategicPlanRepeatedWithoutProgress: number;
    decisions: number;
    findings: number;
    clearlyDominated: number;
    illegalActions: number;
    fallbackActions: number;
    redactionSafe: boolean;
    actionCapacityOpportunities: number;
    actionCapacityUses: number;
    actionCapacityPlanConversions: number;
    actionCapacityFollowupConversions: number;
    actionCapacityExpiredUses: number;
    actionCapacityMisconversions: number;
    runnerEndTurnsWithClicks: number;
    runnerInevitableCorpDeckoutEndTurnsWithClicks: number;
    runnerPrematureEndTurnsWithClicks: number;
    runnerPersistentInstallSelections: number;
    runnerRedundantPersistentInstallSelections: number;
    runtimeFailures: AiSimulationRuntimeFailure[];
    runtimeErrorCount: number;
    actionLimitGames: number;
    winner: "runner" | "action_limit_reached";
    actionLimitDiagnosis: AiBehaviorActionLimitDiagnosis;
  }>,
) {
  return createAiBehaviorBaselineSlotResult({
    descriptor: {
      slotId: "behavior-test-slot",
      label: "Behavior test slot",
      slotType: "test",
      runnerArchetype: "rig_economy_pressure",
      corpArchetype: "remote_scoring",
      runnerDeckFingerprint: "runner-hash",
      corpDeckFingerprint: "corp-hash",
    },
    progression: {
      games: 1,
      averageActions: 100,
      averageTurns: 20,
      runnerAgendaPoints: 4,
      corpAgendaPoints: 5,
      runnerSteals: 2,
      corpScores: 2,
      scoreOrStealActions: 4,
      scoreActionsAvailable: overrides.scoreActionsAvailable ?? 4,
      missedScoreWindows: overrides.missedScoreWindows ?? 0,
      remoteRunOpportunitiesAgainstAdvancedRemote:
        overrides.remoteRunOpportunitiesAgainstAdvancedRemote ?? 0,
      remoteRunsAgainstAdvancedRemote:
        overrides.remoteRunsAgainstAdvancedRemote ?? 0,
      skippedAdvancedRemoteContest: overrides.skippedAdvancedRemoteContest ?? 0,
      planIntentConvertedWithin3OwnDecisions:
        overrides.planIntentConvertedWithin3OwnDecisions ?? 0,
      planIntentExpired: overrides.planIntentExpired ?? 0,
      planIntentAbandoned: overrides.planIntentAbandoned ?? 0,
      sameStrategicPlanRepeatedWithoutProgress:
        overrides.sameStrategicPlanRepeatedWithoutProgress ?? 0,
    },
    decisions: overrides.decisions ?? 100,
    findings: overrides.findings ?? 0,
    findingsByDetector: {
      clearly_dominated_plan_choice: overrides.clearlyDominated ?? 0,
    },
    illegalActions: overrides.illegalActions ?? 0,
    replayFailures: 0,
    actionLimitGames: overrides.actionLimitGames ?? 0,
    fallbackActions: overrides.fallbackActions ?? 0,
    timeoutActions: 0,
    runtimeErrors: overrides.runtimeErrorCount ?? 0,
    redactionSafe: overrides.redactionSafe ?? true,
    actionCapacity: {
      actionCapacityOpportunities: overrides.actionCapacityOpportunities ?? 0,
      actionCapacityUses: overrides.actionCapacityUses ?? 0,
      actionCapacityPlanConversions:
        overrides.actionCapacityPlanConversions ?? 0,
      actionCapacityFollowupConversions:
        overrides.actionCapacityFollowupConversions ?? 0,
      actionCapacityExpiredUses: overrides.actionCapacityExpiredUses ?? 0,
      actionCapacityMisconversions: overrides.actionCapacityMisconversions ?? 0,
    },
    runnerActionValuation: {
      runnerEndTurnsWithClicks: overrides.runnerEndTurnsWithClicks ?? 0,
      runnerInevitableCorpDeckoutEndTurnsWithClicks:
        overrides.runnerInevitableCorpDeckoutEndTurnsWithClicks ?? 0,
      runnerPrematureEndTurnsWithClicks:
        overrides.runnerPrematureEndTurnsWithClicks ?? 0,
      runnerPersistentInstallSelections:
        overrides.runnerPersistentInstallSelections ?? 0,
      runnerRedundantPersistentInstallSelections:
        overrides.runnerRedundantPersistentInstallSelections ?? 0,
    },
    games: [
      {
        seed: "baseline-seed",
        terminationKind:
          (overrides.runtimeErrorCount ?? 0) > 0
            ? "runtime_failure"
            : (overrides.winner ?? "runner") === "action_limit_reached"
              ? "action_limit"
              : "game_result",
        winner: overrides.winner ?? "runner",
        actions: 100,
        turns: 20,
        runnerAgendaPoints: 4,
        corpAgendaPoints: 5,
        finalStateHash: "hash",
        replayOk: true,
        errorCount: overrides.runtimeErrorCount ?? 0,
        ...(overrides.runtimeFailures
          ? { runtimeFailures: overrides.runtimeFailures }
          : {}),
        ...(overrides.actionLimitDiagnosis
          ? { actionLimitDiagnosis: overrides.actionLimitDiagnosis }
          : {}),
      },
    ],
  });
}

function runtimeFailure(
  code: string,
  owner: "plan_registry",
): AiSimulationRuntimeFailure {
  return {
    classified: true,
    code,
    owner,
    side: "runner",
    stateVersion: 1,
    timingPoint: "runner_action.main",
  };
}
