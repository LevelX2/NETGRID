import type {
  AiDoctrineQualityDelta,
  AiDoctrineQualityMetricName,
  AiDoctrineQualityMetrics,
} from "./doctrine-quality-tags";

export const DOCTRINE_QUALITY_METRIC_NAMES: AiDoctrineQualityMetricName[] = [
  "nakedAgendaInstalls",
  "agendaFloodExposure",
  "scoreWindowMissed",
  "remoteOverbuild",
  "economyStall",
  "repeatedLowValueCentralRun",
  "rigStall",
  "assetTrashNeglect",
];

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
  return metrics.reduce(
    (sum, entry) => ({
      nakedAgendaInstalls: sum.nakedAgendaInstalls + entry.nakedAgendaInstalls,
      agendaFloodExposure: sum.agendaFloodExposure + entry.agendaFloodExposure,
      scoreWindowMissed: sum.scoreWindowMissed + entry.scoreWindowMissed,
      remoteOverbuild: sum.remoteOverbuild + entry.remoteOverbuild,
      economyStall: sum.economyStall + entry.economyStall,
      repeatedLowValueCentralRun:
        sum.repeatedLowValueCentralRun + entry.repeatedLowValueCentralRun,
      rigStall: sum.rigStall + entry.rigStall,
      assetTrashNeglect: sum.assetTrashNeglect + entry.assetTrashNeglect,
    }),
    emptyDoctrineMetrics(),
  );
}

export function diffDoctrineMetrics(
  candidate: AiDoctrineQualityMetrics,
  baseline: AiDoctrineQualityMetrics,
): AiDoctrineQualityDelta {
  return {
    nakedAgendaInstalls:
      candidate.nakedAgendaInstalls - baseline.nakedAgendaInstalls,
    agendaFloodExposure:
      candidate.agendaFloodExposure - baseline.agendaFloodExposure,
    scoreWindowMissed: candidate.scoreWindowMissed - baseline.scoreWindowMissed,
    remoteOverbuild: candidate.remoteOverbuild - baseline.remoteOverbuild,
    economyStall: candidate.economyStall - baseline.economyStall,
    repeatedLowValueCentralRun:
      candidate.repeatedLowValueCentralRun -
      baseline.repeatedLowValueCentralRun,
    rigStall: candidate.rigStall - baseline.rigStall,
    assetTrashNeglect: candidate.assetTrashNeglect - baseline.assetTrashNeglect,
  };
}

export function emptyDoctrineMetrics(): AiDoctrineQualityMetrics {
  return {
    nakedAgendaInstalls: 0,
    agendaFloodExposure: 0,
    scoreWindowMissed: 0,
    remoteOverbuild: 0,
    economyStall: 0,
    repeatedLowValueCentralRun: 0,
    rigStall: 0,
    assetTrashNeglect: 0,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
