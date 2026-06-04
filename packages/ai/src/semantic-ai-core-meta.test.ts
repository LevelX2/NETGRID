import { describe, expect, it } from "vitest";

import {
  META1_BOARDSTATE_OVERRIDE_EXAMPLES,
  META1_CORP_GOAL_FAMILIES,
  META1_PIVOT_RULES,
  META1_RUNNER_GOAL_FAMILIES,
  buildDeckDoctrineFromProfile,
  buildDeckStrategicProfile,
  buildMeta1DeckDoctrineTacticalGoalEngineReport,
} from "./semantic-ai-core-meta";

describe("META1 DeckDoctrine + Multi-Turn TacticalGoal Engine v0", () => {
  it("defines side-balanced schema coverage without enabling runtime action selection", () => {
    const report = buildMeta1DeckDoctrineTacticalGoalEngineReport();

    expect(report.schemaVersion).toBe(
      "meta1-deck-doctrine-tactical-goal-engine-v0",
    );
    expect(report.step).toBe("META1");
    expect(report.schemaCoverage).toMatchObject({
      deckStrategicProfileSchema: true,
      deckDoctrineSchema: true,
      tacticalGoalStateSchema: true,
      neutralDoctrineRule: true,
      boardstatePivotRules: META1_PIVOT_RULES.length,
      runnerGoalFamilies: META1_RUNNER_GOAL_FAMILIES.length,
      corpGoalFamilies: META1_CORP_GOAL_FAMILIES.length,
    });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.hardGates).toEqual({
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      runtimeConsumerCount: 0,
      actionSelectionCount: 0,
      plannerWeightChangeCount: 0,
    });
  });

  it("keeps NeutralDoctrine from inventing a primary strategy from support packages", () => {
    const neutralProfile = buildDeckStrategicProfile({
      profileId: "test-neutral-runner",
      side: "runner",
      supportPackages: [
        {
          packageId: "economy",
          cards: ["basic-credit"],
          signals: ["economy.basic"],
          strength: "strong",
        },
      ],
    });
    const doctrine = buildDeckDoctrineFromProfile(neutralProfile);

    expect(neutralProfile.neutralDoctrine).toBe(true);
    expect(neutralProfile.primaryStrategies).toEqual([]);
    expect(neutralProfile.warnings).toContain(
      "NeutralDoctrine: support packages were not promoted to strategy.",
    );
    expect(doctrine.neutralDoctrine).toBe(true);
    expect(doctrine.primaryPlan).toBeUndefined();
    expect(doctrine.supportPriorities).toEqual([
      expect.objectContaining({ priorityId: "runner_economy_stabilize" }),
    ]);
  });

  it("models multi-turn TacticalGoalState lifecycle, progress and blockers", () => {
    const report = buildMeta1DeckDoctrineTacticalGoalEngineReport();

    expect(report.tacticalGoalStates.length).toBeGreaterThan(0);
    expect(report.tacticalGoalStates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lifecycle: "active",
          requiredConditions: expect.arrayContaining([
            "engine_legal_action_membership",
            "side_safe_board_summary",
          ]),
          successCriteria: expect.any(Array),
          failureCriteria: expect.arrayContaining(["blocked_by_hard_gate"]),
        }),
        expect.objectContaining({
          lifecycle: "blocked",
          blockers: expect.arrayContaining(["boardstate_blocks_goal"]),
          whyBlocked: expect.arrayContaining([
            "Pivot rule blocks this goal until trigger condition is satisfied.",
          ]),
        }),
      ]),
    );
  });

  it("makes Boardstate able to override Doctrine through explicit pivot examples", () => {
    const report = buildMeta1DeckDoctrineTacticalGoalEngineReport();

    expect(META1_BOARDSTATE_OVERRIDE_EXAMPLES).toHaveLength(4);
    expect(report.gates.boardstateMayOverrideDoctrine).toBe(true);
    expect(report.boardstateOverrideExamples).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exampleId: "runner-rnd-pressure-contests-remote",
          doctrinePreference: "runner_pressure_rnd",
          boardstateOverride: "runner_contest_remote",
        }),
        expect.objectContaining({
          exampleId: "corp-score-window-needs-economy",
          doctrinePreference: "corp_score_agenda",
          boardstateOverride: "corp_economy_stabilize",
        }),
      ]),
    );
  });
});
