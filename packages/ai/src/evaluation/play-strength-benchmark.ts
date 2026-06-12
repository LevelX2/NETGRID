import type { AiDecision } from "@netgrid/shared";
import {
  SEMANTIC_SHADOW_BASELINE_V1,
  SEMANTIC_SHADOW_CALIBRATED_V1,
  type SemanticShadowCalibrationProfile,
} from "../decision/semantic-shadow-calibration";
import type { SemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import { redactSemanticString } from "../diagnostics/semantic-redaction";
import { compareSemanticShadowToRuntime } from "./semantic-shadow-report";
import type { AiMistakeClass } from "./mistake-taxonomy";

export type PlayStrengthBenchmarkSample = {
  snapshotId: string;
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
  runtimeDecision: AiDecision;
};

export type PlayStrengthCalibrationBenchmark = {
  sampleCount: number;
  averageTopScore: number;
  blockedActionCount: number;
  mistakeCountByClass: Partial<Record<AiMistakeClass, number>>;
  agreementWithRuntime: {
    agreed: number;
    total: number;
    rate: number;
  };
  scoreComponentContribution: Record<string, number>;
  evidence: string[];
};

export type PlayStrengthCalibrationProfileDiff = {
  baselineProfileId: string;
  baselineProfileVersion: string;
  candidateProfileId: string;
  candidateProfileVersion: string;
  baselineReference: string;
  baselineReportPath: string;
  baselineScenarioCount: number;
  sampleCount: number;
  changedScoreSampleCount: number;
  topActionChangedCount: number;
  averageTopScoreDelta: number;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildPlayStrengthCalibrationBenchmark(
  samples: readonly PlayStrengthBenchmarkSample[],
): PlayStrengthCalibrationBenchmark {
  const comparisons = samples.map((sample) =>
    compareSemanticShadowToRuntime({
      frame: sample.frame,
      trace: sample.trace,
      runtimeDecision: sample.runtimeDecision,
    }),
  );
  const topScores = samples
    .map((sample) => sample.trace.rankedActions[0]?.score)
    .filter((score): score is number => score !== undefined);
  const agreed = comparisons.filter((comparison) => comparison.agreement).length;
  return {
    sampleCount: samples.length,
    averageTopScore: average(topScores),
    blockedActionCount: samples.reduce(
      (sum, sample) => sum + sample.trace.rejectedActions.length,
      0,
    ),
    mistakeCountByClass: countMistakes(
      comparisons.flatMap((comparison) => comparison.observedMistakes),
    ),
    agreementWithRuntime: {
      agreed,
      total: comparisons.length,
      rate: comparisons.length === 0 ? 0 : round(agreed / comparisons.length),
    },
    scoreComponentContribution: scoreComponentContribution(samples),
    evidence: [
      "play_strength_calibration:diagnostic_only",
      `sample_count:${samples.length}`,
      `agreement_total:${comparisons.length}`,
      "productive_weight_change:false",
    ].map(redactSemanticString),
  };
}

export function comparePlayStrengthCalibrationProfiles(
  samples: readonly Pick<PlayStrengthBenchmarkSample, "snapshotId" | "frame">[],
  baselineProfile: SemanticShadowCalibrationProfile = SEMANTIC_SHADOW_BASELINE_V1,
  candidateProfile: SemanticShadowCalibrationProfile = SEMANTIC_SHADOW_CALIBRATED_V1,
): PlayStrengthCalibrationProfileDiff {
  const scoreDiffs = samples.map((sample) => {
    const baseline = buildSemanticShadowDecision(sample.frame, {
      calibrationProfile: baselineProfile,
    });
    const candidate = buildSemanticShadowDecision(sample.frame, {
      calibrationProfile: candidateProfile,
    });
    const baselineTop = baseline.rankedActions[0];
    const candidateTop = candidate.rankedActions[0];
    return {
      snapshotId: sample.snapshotId,
      scoreChanged:
        JSON.stringify(scoreMap(baseline)) !== JSON.stringify(scoreMap(candidate)),
      topActionChanged: baselineTop?.actionId !== candidateTop?.actionId,
      topScoreDelta: (candidateTop?.score ?? 0) - (baselineTop?.score ?? 0),
    };
  });
  return {
    baselineProfileId: baselineProfile.profileId,
    baselineProfileVersion: baselineProfile.version,
    candidateProfileId: candidateProfile.profileId,
    candidateProfileVersion: candidateProfile.version,
    baselineReference: candidateProfile.baselineReference,
    baselineReportPath: candidateProfile.baselineReportPath,
    baselineScenarioCount: candidateProfile.baselineScenarioCount,
    sampleCount: samples.length,
    changedScoreSampleCount: scoreDiffs.filter((diff) => diff.scoreChanged).length,
    topActionChangedCount: scoreDiffs.filter((diff) => diff.topActionChanged)
      .length,
    averageTopScoreDelta: average(scoreDiffs.map((diff) => diff.topScoreDelta)),
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "play_strength_calibration_profile_diff:diagnostic_only",
      `baseline_profile:${baselineProfile.profileId}`,
      `candidate_profile:${candidateProfile.profileId}`,
      `baseline_reference:${candidateProfile.baselineReference}`,
      `baseline_report_path:${candidateProfile.baselineReportPath}`,
      `baseline_scenario_count:${candidateProfile.baselineScenarioCount}`,
      "runtime_weight_change:false",
    ].map(redactSemanticString),
  };
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function countMistakes(
  mistakes: readonly AiMistakeClass[],
): Partial<Record<AiMistakeClass, number>> {
  const counts: Partial<Record<AiMistakeClass, number>> = {};
  for (const mistake of mistakes) {
    counts[mistake] = (counts[mistake] ?? 0) + 1;
  }
  return counts;
}

function scoreComponentContribution(
  samples: readonly PlayStrengthBenchmarkSample[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const sample of samples) {
    for (const ranked of sample.trace.rankedActions) {
      for (const component of ranked.components) {
        totals[component.component] =
          (totals[component.component] ?? 0) + component.delta;
      }
    }
  }
  return totals;
}

function scoreMap(trace: SemanticDecisionTrace): Record<string, number> {
  return Object.fromEntries(
    trace.rankedActions.map((action) => [action.actionId, action.score]),
  );
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
