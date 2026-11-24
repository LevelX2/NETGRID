import type {
  AiDoctrineQualityDelta,
  AiDoctrineQualityMetricName,
  AiDoctrineQualityMetrics,
} from "./doctrine-quality-types";

const EMPTY_DOCTRINE_METRICS = Object.freeze({
  nakedAgendaInstalls: 0,
  agendaFloodExposure: 0,
  scoreWindowMissed: 0,
  remoteOverbuild: 0,
  economyStall: 0,
  repeatedLowValueCentralRun: 0,
  rigStall: 0,
  assetTrashNeglect: 0,
} satisfies AiDoctrineQualityMetrics);

export const DOCTRINE_QUALITY_METRIC_NAMES = Object.freeze(
  Object.keys(EMPTY_DOCTRINE_METRICS) as AiDoctrineQualityMetricName[],
);

export function averageNumber(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function medianNumber(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return round(sorted[middle] ?? 0);
  return round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

export function sumDoctrineMetrics(
  metrics: readonly AiDoctrineQualityMetrics[],
): AiDoctrineQualityMetrics {
  const totals = emptyDoctrineMetrics();
  for (const entry of metrics) {
    for (const metric of DOCTRINE_QUALITY_METRIC_NAMES)
      totals[metric] += entry[metric];
  }
  return totals;
}

export function diffDoctrineMetrics(
  candidate: AiDoctrineQualityMetrics,
  baseline: AiDoctrineQualityMetrics,
): AiDoctrineQualityDelta {
  const delta = emptyDoctrineMetrics();
  for (const metric of DOCTRINE_QUALITY_METRIC_NAMES) {
    delta[metric] = candidate[metric] - baseline[metric];
  }
  return delta;
}

export function emptyDoctrineMetrics(): AiDoctrineQualityMetrics {
  return { ...EMPTY_DOCTRINE_METRICS };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
