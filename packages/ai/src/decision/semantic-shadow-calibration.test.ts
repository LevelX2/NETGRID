import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildRealEngineDecisionCorpusScenarios } from "../evaluation/real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "../evaluation/real-engine-decision-corpus";
import {
  SEMANTIC_SHADOW_BASELINE_V1,
  SEMANTIC_SHADOW_CALIBRATED_V1,
} from "./semantic-shadow-calibration";
import { buildSemanticShadowDecision } from "./semantic-shadow-decision";

describe("SemanticShadowCalibration", () => {
  it("keeps baseline_v1 score-compatible with the current default shadow scorer", () => {
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
});

function scoreMap(trace: ReturnType<typeof buildSemanticShadowDecision>) {
  return Object.fromEntries(
    trace.rankedActions.map((action) => [action.actionId, action.score]),
  );
}
