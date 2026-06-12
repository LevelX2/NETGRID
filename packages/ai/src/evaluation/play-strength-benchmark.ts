import type { AiDecision } from "@netgrid/shared";
import type { SemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
