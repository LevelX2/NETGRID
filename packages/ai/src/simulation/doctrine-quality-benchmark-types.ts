import type {
  AiDoctrineQualityDelta,
  AiDoctrineQualityMetrics,
} from "./doctrine-quality-tags";
import type { SimulationBenchmarkProfileId } from "./simulation-types";
import type {
  AiSimulationLeagueConfig,
  AiSimulationRunResult,
} from "./simulation-quality-gate";

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
  baselineRun: AiSimulationRunResult;
  candidateRun: AiSimulationRunResult;
};

export type AiDoctrineQualityBenchmarkConfig = AiSimulationLeagueConfig & {
  baselineProfile?: SimulationBenchmarkProfileId;
  candidateProfile?: SimulationBenchmarkProfileId;
  comparisonProfiles?: SimulationBenchmarkProfileId[];
  slotIds?: string[];
};
