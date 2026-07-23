import { describe, expect, it } from "vitest";
import {
  compareAiBehaviorBaselines,
  createAiBehaviorBaseline,
  createAiBehaviorBaselineSlotResult,
  evaluateAiBehaviorBaselineGate,
  formatAiBehaviorBaselineReport,
} from "./ai-behavior-baseline";

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
    expect(baseline.gate.accepted).toBe(true);
    const report = formatAiBehaviorBaselineReport(baseline);
    expect(report).toContain("# AI Behavior Baseline v1");
    expect(report).toContain("Premature Runner end turns / 100 decisions");
    expect(report).toContain("Redundant Runner persistent install rate");
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
    actionLimitGames: 0,
    fallbackActions: overrides.fallbackActions ?? 0,
    timeoutActions: 0,
    runtimeErrors: 0,
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
        winner: "runner",
        actions: 100,
        turns: 20,
        runnerAgendaPoints: 4,
        corpAgendaPoints: 5,
        finalStateHash: "hash",
        replayOk: true,
        errorCount: 0,
      },
    ],
  });
}
