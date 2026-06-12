import { afterEach, describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildRealEngineDecisionCorpusScenarios } from "../evaluation/real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "../evaluation/real-engine-decision-corpus";
import {
  SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV,
  SEMANTIC_SHADOW_BASELINE_V1,
  SEMANTIC_SHADOW_CALIBRATED_V1,
  semanticShadowCalibrationProfileFromEnv,
} from "./semantic-shadow-calibration";
import { buildSemanticShadowDecision } from "./semantic-shadow-decision";

describe("SemanticShadowCalibration", () => {
  const originalCalibration =
    process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV];

  afterEach(() => {
    if (originalCalibration === undefined) {
      delete process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV];
    } else {
      process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV] =
        originalCalibration;
    }
  });

  it("binds calibration profiles to versioned baselines and evidence", () => {
    for (const profile of [
      SEMANTIC_SHADOW_BASELINE_V1,
      SEMANTIC_SHADOW_CALIBRATED_V1,
    ]) {
      expect(profile.version).toBe("2026-06-12");
      expect(profile.baselineReference).toBe(
        "ai-shadow-league-baseline-2026-06-12",
      );
      expect(profile.intendedScopes).toEqual(
        expect.arrayContaining([
          "semantic_shadow_league",
          "pilot_scope_registry",
          "play_strength_benchmark",
        ]),
      );
      expect(profile.weightSummary.pilotMinimumScoreGap).toBe(
        profile.pilotMinimumScoreGap,
      );
      expect(profile.evidence).toEqual(
        expect.arrayContaining([
          "baseline_reference:ai-shadow-league-baseline-2026-06-12",
        ]),
      );
      expect(profile.productiveUseAllowed).toBe(false);
      expect(profile.runtimeConsumerStatus).toBe("none");
    }
  });

  it("keeps baseline_v1 score-compatible with the current default shadow scorer", () => {
    delete process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV];
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );

    for (const sample of samples) {
      const current = buildSemanticShadowDecision(sample.frame);
      const baseline = buildSemanticShadowDecision(sample.frame, {
        calibrationProfile: "baseline_v1",
      });

      expect(scoreMap(baseline)).toEqual(scoreMap(current));
      expect(baseline.rankedActions.map((action) => action.actionId)).toEqual(
        current.rankedActions.map((action) => action.actionId),
      );
      expect(baseline.frameSummary.calibrationProfileId).toBe("baseline_v1");
      expect(baseline.frameSummary.calibrationMode).toBe("baseline");
    }
  });

  it("keeps shadow_calibrated_v1 diagnostic-only and legal-action bounded", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );
    const changedScoreSamples = samples.filter((sample) => {
      const baseline = buildSemanticShadowDecision(sample.frame, {
        calibrationProfile: SEMANTIC_SHADOW_BASELINE_V1,
      });
      const calibrated = buildSemanticShadowDecision(sample.frame, {
        calibrationProfile: SEMANTIC_SHADOW_CALIBRATED_V1,
      });
      expect(calibrated.frameSummary.calibrationProfileId).toBe(
        "shadow_calibrated_v1",
      );
      expect(calibrated.frameSummary.calibrationMode).toBe("shadow_only");
      expect(calibrated.noRuntimeEffect).toBe(true);
      expect(containsForbiddenSemanticMarker(calibrated)).toBe(false);
      expect(
        calibrated.rankedActions.every((action) =>
          sample.frame.legalActionIds.includes(action.actionId),
        ),
      ).toBe(true);
      return JSON.stringify(scoreMap(calibrated)) !== JSON.stringify(scoreMap(baseline));
    });

    expect(changedScoreSamples.length).toBeGreaterThan(0);
    expect(SEMANTIC_SHADOW_CALIBRATED_V1.productiveUseAllowed).toBe(false);
    expect(SEMANTIC_SHADOW_CALIBRATED_V1.runtimeConsumerStatus).toBe("none");
    expect(SEMANTIC_SHADOW_CALIBRATED_V1.noRuntimeEffect).toBe(true);
  });

  it("exposes the calibrated profile only through explicit env opt-in", () => {
    delete process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV];
    expect(semanticShadowCalibrationProfileFromEnv().profileId).toBe("baseline_v1");

    const [sample] = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );
    if (!sample) throw new Error("Missing calibration sample");

    const defaultTrace = buildSemanticShadowDecision(sample.frame);
    expect(defaultTrace.frameSummary.calibrationProfileId).toBeUndefined();

    process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV] =
      "shadow_calibrated_v1";

    expect(semanticShadowCalibrationProfileFromEnv().profileId).toBe(
      "shadow_calibrated_v1",
    );
    const envTrace = buildSemanticShadowDecision(sample.frame);
    expect(envTrace.frameSummary.calibrationProfileId).toBe(
      "shadow_calibrated_v1",
    );
    expect(envTrace.frameSummary.calibrationMode).toBe("shadow_only");
    expect(envTrace.noRuntimeEffect).toBe(true);
  });
});

function scoreMap(trace: ReturnType<typeof buildSemanticShadowDecision>) {
  return Object.fromEntries(
    trace.rankedActions.map((action) => [action.actionId, action.score]),
  );
}
