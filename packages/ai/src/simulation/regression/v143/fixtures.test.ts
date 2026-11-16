import type { AiSimulationSummary } from "../../ai-simulation-summary";
import { chooseAiAction } from "../../../ai-runtime-public-entrypoints";
import { reconstructBeliefState } from "../../../belief-state";
import { resetResidentPlanPortfolioMemory } from "../../../plans/resident-plan-portfolio-memory";

import { describe, expect, it } from "vitest";
import selfplayExploitLeagueData from "../../../../../../data/ai/ai-selfplay-exploit-league-2026-05-17.json";
import { listExploitFixtures } from "./fixture-data";
import { applyFixtureAction } from "../../fixture-actions";
import {
  buildRndRepeatAccessFixtureInput,
  createExploitRegressionFixturesRunner,
  evaluateVisibleEtrBlockerFixtureSummary,
  playRndRepeatAccessFixturePosition,
} from "./exploit-regression-fixtures";

describe("V1.4.3 regression fixture contracts", () => {
  it("invalidates the observed low-value top when Corp draws it", () => {
    const observed = playRndRepeatAccessFixturePosition();
    if (!observed.ok) throw new Error(observed.message);
    const ended = applyFixtureAction(
      observed.state,
      "runner",
      (action) => action.type === "end_turn",
      "end_runner_turn",
    );
    if (!ended.ok) throw new Error(ended.message);
    const drawn = applyFixtureAction(
      ended.state,
      "corp",
      (action) => action.type === "mandatory_draw",
      "draw_observed_rd_top",
    );
    if (!drawn.ok) throw new Error(drawn.message);

    const memory = reconstructBeliefState(
      buildRndRepeatAccessFixtureInput(drawn.state),
    ).runnerOpponentModel?.rndTopFreshness;
    expect(memory).toMatchObject({
      freshness: "invalidated",
      invalidationReasons: expect.arrayContaining([
        expect.stringMatching(/^rd_known_top_drawn_by_corp:/),
      ]),
    });
    expect(memory?.knownTopDefinitionId).toBeUndefined();
  });

  it("provides the historical exploit fixtures", () => {
    const fixtures = listExploitFixtures();

    expect(fixtures.map((fixture) => fixture.fixtureId)).toEqual([
      "v143-rnd-repeat-access-freshness",
      "v143-visible-etr-blocker-no-repeat-run",
    ]);
    expect(fixtures.every((fixture) => fixture.hiddenInfoSafe)).toBe(true);
  });

  it("requires observed visible ETR evidence and rejects a known-unbreakable run", () => {
    const summary = (actionSequence: AiSimulationSummary["actionSequence"]) =>
      ({
        errors: [],
        replayErrors: [],
        replayOk: true,
        actionSequence,
      }) as unknown as AiSimulationSummary;
    const observed: AiSimulationSummary["actionSequence"][number] = {
      side: "runner",
      stateVersionBefore: 12,
      actionType: "gain_credit",
      reasonCode: "test",
      explanation: "test",
      confidence: 1,
      evidence: [],
      qualityTags: [],
      stateHashAfter: "sha256:test",
      fallbackUsed: false,
      timeoutUsed: false,
      runnerKnownPathBlockedByKnownEtr: true,
    };

    expect(evaluateVisibleEtrBlockerFixtureSummary(summary([]))).toMatchObject({
      passed: false,
      message: expect.stringContaining("fixture_precondition_missing"),
    });
    expect(
      evaluateVisibleEtrBlockerFixtureSummary(summary([observed])),
    ).toMatchObject({ passed: true });
    expect(
      evaluateVisibleEtrBlockerFixtureSummary(
        summary([
          observed,
          {
            ...observed,
            stateVersionBefore: 13,
            actionType: "start_run",
            runnerRunStartedAgainstKnownUnbreakablePath: true,
          },
        ]),
      ),
    ).toMatchObject({
      passed: false,
      message: "known_visible_etr_run_selected:state_13",
    });
  });

  it("defines a manual optional selfplay exploit league without widening AI inputs", () => {
    const config = selfplayExploitLeagueData as {
      schemaVersion: string;
      status: string;
      seedSets: {
        smoke: { seeds: string[]; holdoutIncluded: boolean };
        tuning: { seeds: string[]; holdoutIncluded: boolean };
        holdout: { seeds: string[]; holdoutIncluded: boolean };
      };
      deckProfiles: Array<{
        deckProfileId: string;
        executionSupport: string;
        runnerDeckId?: string;
        corpDeckId?: string;
        runnerSnapshotId?: string;
        corpSnapshotId?: string;
      }>;
      leagueProfiles: Array<{
        profileId: string;
        executionMode: string;
        automaticDefault: boolean;
        runtimeMeasurementStatus?: string;
      }>;
      exploitClasses: Array<{
        classId: string;
        fixtureStatus: string;
        fixtureRefs?: string[];
        suggestedActivityId?: string;
      }>;
      reportSchema: {
        sections: Array<{ sectionId: string; regressionClass: string }>;
      };
      noCheatGate: {
        allowedDecisionInputs: string[];
        forbiddenDecisionInputs: string[];
        evidence: string[];
      };
      publicLeague: boolean;
      strategyFixesIncluded: boolean;
      standardTestGate: boolean;
    };

    expect(config.schemaVersion).toBe("ai-selfplay-exploit-league-v1");
    expect(config.status).toBe("manual_optional");
    expect(config.publicLeague).toBe(false);
    expect(config.strategyFixesIncluded).toBe(false);
    expect(config.standardTestGate).toBe(false);

    const tuningSeeds = new Set(config.seedSets.tuning.seeds);
    expect(config.seedSets.smoke.seeds.length).toBeGreaterThanOrEqual(3);
    expect(
      config.seedSets.holdout.seeds.every((seed) => !tuningSeeds.has(seed)),
    ).toBe(true);

    expect(config.deckProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          deckProfileId: "starter-v08",
          executionSupport: "runtime_deck_ids",
          runnerDeckId: "demo_runner_008",
          corpDeckId: "demo_corp_008",
        }),
        expect.objectContaining({
          executionSupport: "inventory_only",
          runnerSnapshotId: "onr_origin_runner_ai_snapshot_v1",
          corpSnapshotId: "onr_origin_corp_ai_snapshot_v1",
        }),
      ]),
    );

    const manualTuning = config.leagueProfiles.find(
      (profile) => profile.profileId === "starter-v08-tuning-manual",
    );
    expect(manualTuning).toMatchObject({
      executionMode: "manual_optional",
      automaticDefault: false,
    });
    expect(manualTuning?.runtimeMeasurementStatus).toBe(
      "needs_rerun_current_profiles",
    );

    expect(config.exploitClasses.map((entry) => entry.classId)).toEqual(
      expect.arrayContaining([
        "action_limit_stagnation",
        "stale_central_repeat_access",
        "unprofitable_visible_etr_run",
        "naked_agenda_install",
        "missing_breaker_preparation",
      ]),
    );
    expect(
      config.exploitClasses.filter((entry) =>
        [
          "implemented_fixture",
          "league_metric",
          "followup_activity_required",
        ].includes(entry.fixtureStatus),
      ).length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      config.exploitClasses
        .filter((entry) => entry.fixtureStatus === "followup_activity_required")
        .every((entry) => entry.suggestedActivityId),
    ).toBe(true);

    expect(
      config.reportSchema.sections.map((section) => section.sectionId),
    ).toEqual(["safety", "progression", "exploit", "variance", "runtime"]);
    expect(
      config.reportSchema.sections.map((section) => section.regressionClass),
    ).toEqual(
      expect.arrayContaining([
        "safety_regression",
        "progression_regression",
        "decision_regression",
        "expected_variance",
        "runtime_flakiness",
      ]),
    );

    expect(config.noCheatGate.allowedDecisionInputs).toEqual([
      "PlayerView",
      "LegalActions",
      "side_safe_public_events",
      "explicit_public_deck_metadata",
    ]);
    expect(config.noCheatGate.forbiddenDecisionInputs).toEqual(
      expect.arrayContaining([
        "FullState",
        "opponent_hidden_zones",
        "cardInstances",
        "privatePayload",
        "decklists",
      ]),
    );
    expect(config.noCheatGate.evidence.join(" ")).toContain(
      "buildAiDecisionInput",
    );
  });
});

it("checks native R&D knowledge before judging a repeat run", () => {
  const simulateAiGame = () =>
    ({
      errors: [],
      replayOk: true,
      actionSequence: [{ runnerKnownPathBlockedByKnownEtr: true }],
    }) as unknown as AiSimulationSummary;
  const fixture = createExploitRegressionFixturesRunner({
    simulateAiGame,
    chooseRunnerAction: (input) => {
      const facts =
        reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness;
      expect(facts).toMatchObject({
        freshness: "stale_known_same_top",
        knownTopIsLowValue: true,
      });
      expect(
        input.eventTail.every(
          (event) => event.stateVersionAfter <= input.playerView.stateVersion,
        ),
      ).toBe(true);
      resetResidentPlanPortfolioMemory();
      return chooseAiAction(input);
    },
  });
  expect(fixture.runExploitRegressionFixtures()[0]).toMatchObject({
    fixtureId: "v143-rnd-repeat-access-freshness",
    passed: true,
  });
  const repeat = createExploitRegressionFixturesRunner({
    simulateAiGame,
    chooseRunnerAction: (input) =>
      ({
        actionId: input.legalActions.find(
          (action) => action.type === "start_run",
        )!.actionId,
        reasonCode: "test_repeat",
      }) as ReturnType<typeof chooseAiAction>,
  });
  expect(repeat.runExploitRegressionFixtures()[0]).toMatchObject({
    passed: false,
  });
});
