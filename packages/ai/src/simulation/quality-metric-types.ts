import type { AiDoctrineQualityMetrics } from "./doctrine-quality-types";

export type AiQualityMetrics = {
  illegalActions: number;
  runtimeFailures: number;
  fallbackRate: number;
  timeoutRate: number;
  reasonCodeCoverage: string[];
  actionTypeCoverage: string[];
  roleCoverage: string[];
  progressScore: number;
  holdout: boolean;
  doctrine: AiDoctrineQualityMetrics;
};
