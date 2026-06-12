import type { AiOpportunityProjection } from "./opportunity-projection";
import type { ScoreComponent } from "./score-components";
import type { AiThreatSeverity } from "./threat-projection";

export type SemanticShadowCalibrationProfileId =
  | "baseline_v1"
  | "shadow_calibrated_v1";

export type SemanticShadowCalibrationMode = "baseline" | "shadow_only";

export const SEMANTIC_SHADOW_CALIBRATION_PROFILE_SCHEMA_VERSION =
  "semantic-shadow-calibration-profile-v1" as const;
export const SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV =
  "NETGRID_AI_PLAY_STRENGTH_CALIBRATION_PROFILE";
export const SEMANTIC_SHADOW_CALIBRATION_BASELINE_REFERENCE =
  "ai-shadow-league-baseline-2026-06-12" as const;
export const SEMANTIC_SHADOW_CALIBRATION_BASELINE_REPORT_PATH =
  "docs/reviews/ai/ai-shadow-league-baseline-2026-06-12.md" as const;
export const SEMANTIC_SHADOW_CALIBRATION_BASELINE_SCENARIO_COUNT = 18;
export const SEMANTIC_SHADOW_CALIBRATION_CREATED_FROM_BENCHMARK_ID =
  "play-strength-calibration-baseline-2026-06-12" as const;
export const SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_ID =
  "real-engine-decision-corpus-v2-2026-06-13" as const;
export const SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_SCENARIO_COUNT = 50;

export type SemanticShadowCalibrationBenchmarkMetadata = {
  benchmarkId: typeof SEMANTIC_SHADOW_CALIBRATION_CREATED_FROM_BENCHMARK_ID;
  source: "play_strength_benchmark";
  sampleCount: number;
  reportPath: "docs/reviews/ai/ai-play-strength-calibration-baseline-2026-06-12.md";
  evidence: string[];
};

export type SemanticShadowCalibrationCorpusLock = {
  corpusId: typeof SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_ID;
  scenarioCount: typeof SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_SCENARIO_COUNT;
  scenarioIdSource: "REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS";
  evidence: string[];
};

export type SemanticShadowCalibrationProfile = {
  schemaVersion: typeof SEMANTIC_SHADOW_CALIBRATION_PROFILE_SCHEMA_VERSION;
  profileId: SemanticShadowCalibrationProfileId;
  version: string;
  mode: SemanticShadowCalibrationMode;
  scope: "semantic_shadow_decision_scoring";
  intendedScopes: readonly string[];
  baselineReference: string;
  baselineReportPath: string;
  baselineScenarioCount: number;
  createdFromBenchmark: SemanticShadowCalibrationBenchmarkMetadata;
  lockedAgainstCorpus: SemanticShadowCalibrationCorpusLock;
  weightSummary: Record<string, string | number>;
  pilotMinimumScoreGap: number;
  componentWeights: Record<ScoreComponent, number>;
  opportunityPriorityBonus: Record<AiOpportunityProjection["priority"], number>;
  threatSeverityBonus: Record<AiThreatSeverity, number>;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export const SEMANTIC_SHADOW_BASELINE_V1: SemanticShadowCalibrationProfile = {
  schemaVersion: SEMANTIC_SHADOW_CALIBRATION_PROFILE_SCHEMA_VERSION,
  profileId: "baseline_v1",
  version: "2026-06-12",
  mode: "baseline",
  scope: "semantic_shadow_decision_scoring",
  intendedScopes: [
    "semantic_shadow_league",
    "pilot_scope_registry",
    "play_strength_benchmark",
  ],
  baselineReference: SEMANTIC_SHADOW_CALIBRATION_BASELINE_REFERENCE,
  baselineReportPath: SEMANTIC_SHADOW_CALIBRATION_BASELINE_REPORT_PATH,
  baselineScenarioCount: SEMANTIC_SHADOW_CALIBRATION_BASELINE_SCENARIO_COUNT,
  createdFromBenchmark: calibrationBenchmarkMetadata(),
  lockedAgainstCorpus: calibrationCorpusLock(),
  weightSummary: {
    componentWeights: "all_components_1x",
    opportunityPriorityBonus: "low:2,medium:6,high:12,critical:18",
    threatSeverityBonus: "low:2,medium:6,high:12,critical:18",
    pilotMinimumScoreGap: 20,
  },
  pilotMinimumScoreGap: 20,
  componentWeights: {
    goal_fit: 1,
    cost_fit: 1,
    timing_fit: 1,
    risk_adjustment: 1,
    plan_alignment: 1,
    target_fit: 1,
    opportunity: 1,
    threat_response: 1,
    fallback_safety: 1,
  },
  opportunityPriorityBonus: {
    low: 2,
    medium: 6,
    high: 12,
    critical: 18,
  },
  threatSeverityBonus: {
    low: 2,
    medium: 6,
    high: 12,
    critical: 18,
  },
  productiveUseAllowed: false,
  runtimeConsumerStatus: "none",
  noRuntimeEffect: true,
  evidence: [
    "baseline_v1:current_semantic_shadow_score",
    "baseline_reference:ai-shadow-league-baseline-2026-06-12",
    "baseline_report_path:docs/reviews/ai/ai-shadow-league-baseline-2026-06-12.md",
    "baseline_scenario_count:18",
    "created_from_benchmark:play-strength-calibration-baseline-2026-06-12",
    "locked_against_corpus:real-engine-decision-corpus-v2-2026-06-13",
    "locked_corpus_scenario_count:50",
  ],
};

export const SEMANTIC_SHADOW_CALIBRATED_V1: SemanticShadowCalibrationProfile = {
  schemaVersion: SEMANTIC_SHADOW_CALIBRATION_PROFILE_SCHEMA_VERSION,
  profileId: "shadow_calibrated_v1",
  version: "2026-06-12",
  mode: "shadow_only",
  scope: "semantic_shadow_decision_scoring",
  intendedScopes: [
    "semantic_shadow_league",
    "pilot_scope_registry",
    "play_strength_benchmark",
  ],
  baselineReference: SEMANTIC_SHADOW_CALIBRATION_BASELINE_REFERENCE,
  baselineReportPath: SEMANTIC_SHADOW_CALIBRATION_BASELINE_REPORT_PATH,
  baselineScenarioCount: SEMANTIC_SHADOW_CALIBRATION_BASELINE_SCENARIO_COUNT,
  createdFromBenchmark: calibrationBenchmarkMetadata(),
  lockedAgainstCorpus: calibrationCorpusLock(),
  weightSummary: {
    componentWeights:
      "cost:1.15,timing:1.1,risk:1.25,plan:1.05,target:1.2,opportunity:1.15,threat:1.2",
    opportunityPriorityBonus: "low:3,medium:8,high:16,critical:24",
    threatSeverityBonus: "low:3,medium:8,high:16,critical:24",
    pilotMinimumScoreGap: 25,
  },
  pilotMinimumScoreGap: 25,
  componentWeights: {
    goal_fit: 1,
    cost_fit: 1.15,
    timing_fit: 1.1,
    risk_adjustment: 1.25,
    plan_alignment: 1.05,
    target_fit: 1.2,
    opportunity: 1.15,
    threat_response: 1.2,
    fallback_safety: 1,
  },
  opportunityPriorityBonus: {
    low: 3,
    medium: 8,
    high: 16,
    critical: 24,
  },
  threatSeverityBonus: {
    low: 3,
    medium: 8,
    high: 16,
    critical: 24,
  },
  productiveUseAllowed: false,
  runtimeConsumerStatus: "none",
  noRuntimeEffect: true,
  evidence: [
    "shadow_calibrated_v1:diagnostic_weight_experiment_only",
    "baseline_reference:ai-shadow-league-baseline-2026-06-12",
    "baseline_report_path:docs/reviews/ai/ai-shadow-league-baseline-2026-06-12.md",
    "baseline_scenario_count:18",
    "created_from_benchmark:play-strength-calibration-baseline-2026-06-12",
    "locked_against_corpus:real-engine-decision-corpus-v2-2026-06-13",
    "locked_corpus_scenario_count:50",
  ],
};

function calibrationBenchmarkMetadata(): SemanticShadowCalibrationBenchmarkMetadata {
  return {
    benchmarkId: SEMANTIC_SHADOW_CALIBRATION_CREATED_FROM_BENCHMARK_ID,
    source: "play_strength_benchmark",
    sampleCount: SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_SCENARIO_COUNT,
    reportPath:
      "docs/reviews/ai/ai-play-strength-calibration-baseline-2026-06-12.md",
    evidence: [
      `created_from_benchmark:${SEMANTIC_SHADOW_CALIBRATION_CREATED_FROM_BENCHMARK_ID}`,
      `benchmark_sample_count:${SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_SCENARIO_COUNT}`,
    ],
  };
}

function calibrationCorpusLock(): SemanticShadowCalibrationCorpusLock {
  return {
    corpusId: SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_ID,
    scenarioCount: SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_SCENARIO_COUNT,
    scenarioIdSource: "REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS",
    evidence: [
      `locked_against_corpus:${SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_ID}`,
      `locked_corpus_scenario_count:${SEMANTIC_SHADOW_CALIBRATION_LOCKED_CORPUS_SCENARIO_COUNT}`,
    ],
  };
}

export function resolveSemanticShadowCalibrationProfile(
  profile:
    | SemanticShadowCalibrationProfile
    | SemanticShadowCalibrationProfileId
    | undefined,
): SemanticShadowCalibrationProfile {
  if (!profile) return semanticShadowCalibrationProfileFromEnv();
  if (typeof profile !== "string") return profile;
  if (profile === "baseline_v1") return SEMANTIC_SHADOW_BASELINE_V1;
  return SEMANTIC_SHADOW_CALIBRATED_V1;
}

export function semanticShadowCalibrationProfileFromEnv(
  env: string | undefined = process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV],
): SemanticShadowCalibrationProfile {
  if (env === "shadow_calibrated_v1") return SEMANTIC_SHADOW_CALIBRATED_V1;
  return SEMANTIC_SHADOW_BASELINE_V1;
}

export function semanticShadowCalibrationProfileEnvEnabled(
  env: string | undefined = process.env[SEMANTIC_SHADOW_CALIBRATION_PROFILE_ENV],
): boolean {
  return env === "shadow_calibrated_v1" || env === "baseline_v1";
}

export function componentWeight(
  profile: SemanticShadowCalibrationProfile,
  component: ScoreComponent,
): number {
  return profile.componentWeights[component] ?? 1;
}

export function opportunityPriorityBonus(
  profile: SemanticShadowCalibrationProfile,
  priority: AiOpportunityProjection["priority"],
): number {
  return profile.opportunityPriorityBonus[priority];
}

export function threatSeverityBonus(
  profile: SemanticShadowCalibrationProfile,
  severity: AiThreatSeverity,
): number {
  return profile.threatSeverityBonus[severity];
}
