export type AiDoctrineQualityMetrics = {
  nakedAgendaInstalls: number;
  agendaFloodExposure: number;
  scoreWindowMissed: number;
  remoteOverbuild: number;
  economyStall: number;
  repeatedLowValueCentralRun: number;
  rigStall: number;
  assetTrashNeglect: number;
};

export type AiDoctrineQualityMetricName = keyof AiDoctrineQualityMetrics;
export type AiDoctrineQualityDelta = AiDoctrineQualityMetrics;
