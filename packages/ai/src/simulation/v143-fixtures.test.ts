import { describe, expect, it } from "vitest";
import selfplayExploitLeagueData from "../../../../data/ai/ai-selfplay-exploit-league-2026-05-17.json";
import { listV143BenchmarkProfiles, listV143ExploitFixtures } from "../index";

describe("V1.4.3 simulation fixture contracts", () => {
  it("provides versioned benchmark profiles and exploit fixtures", () => {
    const profiles = listV143BenchmarkProfiles();
    const fixtures = listV143ExploitFixtures();

    expect(profiles.map((profile) => profile.benchmarkProfileId)).toEqual([
      "random_legal_bot",
      "current_candidate",
    ]);
    expect(fixtures.map((fixture) => fixture.fixtureId)).toEqual([
      "v143-rnd-repeat-access-freshness",
      "v143-visible-etr-blocker-no-repeat-run",
    ]);
    expect(fixtures.every((fixture) => fixture.hiddenInfoSafe)).toBe(true);
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
