import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  buildRealEngineDecisionCorpusScenarios,
  REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
} from "./real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import {
  buildSemanticShadowLeagueReport,
  PLAY_STRENGTH_SHADOW_LEAGUE_EXPECTATIONS,
  SEMANTIC_SHADOW_LEAGUE_SCHEMA_VERSION,
} from "./semantic-shadow-league";

describe("SemanticShadowLeague", () => {
  it("aggregates agreement, mistakes, scores and blockers without runtime effect", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );
    const report = buildSemanticShadowLeagueReport(samples);
    expect(report.schemaVersion).toBe(SEMANTIC_SHADOW_LEAGUE_SCHEMA_VERSION);
    expect(report.scope).toBe("semantic_shadow_league_report_only");
    expect(report.scenarioCount).toBe(REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS.length);
    expect(report.sideCounts).toEqual({ runner: 6, corp: 6 });
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.semanticExecutionAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
    expect(report.noRuntimeEffect).toBe(true);

    expect(report.metrics.agreementComparedCount).toBe(
      PLAY_STRENGTH_SHADOW_LEAGUE_EXPECTATIONS.length,
    );
    expect(report.metrics.agreementRate).not.toBeNull();
    expect(report.metrics.agreementCount).toBeGreaterThan(0);
    expect(report.metrics.rankedActionCount).toBeGreaterThan(0);
    expect(report.metrics.rejectedActionCount).toBeGreaterThanOrEqual(0);
    expect(report.metrics.blockersByKind).toBeDefined();
    expect(report.metrics.topScoreAverage).not.toBeNull();
    expect(report.metrics.topScoreMin).not.toBeNull();
    expect(report.metrics.topScoreMax).not.toBeNull();
    expect(report.metrics.mistakesByClass.hidden_info_dependency).toBe(0);
    expect(report.metrics.pilotEligibleCount).toBe(9);
    expect(report.metrics.pilotWouldOverrideCount).toBe(9);
    expect(report.metrics.scopeBreakdown.basic_setup.eligibleCount).toBe(4);
    expect(report.metrics.scopeBreakdown.runner_safe_access.eligibleCount).toBe(4);
    expect(report.metrics.scopeBreakdown.corp_score_window.eligibleCount).toBe(1);
    expect(report.topDisagreementReasons).toEqual([
      "corp_real_advance_score_window:expected=advance_card:observed=gain_credit",
      "runner_real_damage_buffer_needed:expected=draw_card:observed=start_run",
      "runner_real_tag_cleanup:expected=remove_tag:observed=start_run",
    ]);
    expect(report.redactionStatus).toBe("passed");
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });

  it("keeps per-scenario observations stable enough for calibration work", () => {
    const report = buildSemanticShadowLeagueReport(
      buildRealEngineDecisionCorpus(buildRealEngineDecisionCorpusScenarios()),
    );

    expect(report.scenarios.map((scenario) => scenario.scenarioId)).toEqual(
      REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
    );
    expect(scenario(report, "corp_real_score_agenda_window")).toMatchObject({
      topActionType: "score_agenda",
      agreement: true,
    });
    expect(scenario(report, "runner_real_low_credits").expectedTopActionTypes).toEqual([
      "draw_card",
      "gain_credit",
    ]);
    expect(
      scenario(report, "runner_real_safe_hq_access").expectedTopActionTypes,
    ).toEqual(["start_run"]);
  });
});

function scenario(
  report: ReturnType<typeof buildSemanticShadowLeagueReport>,
  scenarioId: string,
) {
  const result = report.scenarios.find(
    (candidate) => candidate.scenarioId === scenarioId,
  );
  if (!result) throw new Error(`Missing scenario ${scenarioId}`);
  return result;
}
