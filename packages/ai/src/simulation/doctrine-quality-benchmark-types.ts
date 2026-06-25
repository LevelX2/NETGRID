import type {
  AiDoctrineQualityDelta,
  AiDoctrineQualityMetrics,
} from "./doctrine-quality-tags";
import type { SimulationBenchmarkProfileId } from "./simulation-types";
import type {
  V143LeagueConfig,
  V143SimulationRunResult,
} from "./v143-tuning-gate";

export type AiDoctrineQualityBenchmarkResult = {
  version: "ai-deck-doctrine-quality-v1";
  baselineProfile: SimulationBenchmarkProfileId;
  candidateProfile: SimulationBenchmarkProfileId;
  seeds: string[];
  baseline: AiDoctrineQualityMetrics;
  candidate: AiDoctrineQualityMetrics;
  delta: AiDoctrineQualityDelta;
  safety: {
    illegalActionDelta: number;
    replayFailureDelta: number;
    timeoutRateDelta: number;
    fallbackRateDelta: number;
  };
  baselineRun: V143SimulationRunResult;
  candidateRun: V143SimulationRunResult;
};

export type AiDoctrineQualityBenchmarkConfig = V143LeagueConfig & {
  baselineProfile?: SimulationBenchmarkProfileId;
  candidateProfile?: SimulationBenchmarkProfileId;
  comparisonProfiles?: SimulationBenchmarkProfileId[];
};
