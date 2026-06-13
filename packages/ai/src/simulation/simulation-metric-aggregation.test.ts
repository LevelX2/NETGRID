import { describe, expect, it } from "vitest";

import {
  DOCTRINE_QUALITY_METRIC_NAMES,
  averageNumber,
  diffDoctrineMetrics,
  emptyDoctrineMetrics,
  sumDoctrineMetrics,
} from "./simulation-metric-aggregation";

describe("simulation metric aggregation", () => {
  it("keeps the doctrine metric name list aligned with the metric shape", () => {
    expect(DOCTRINE_QUALITY_METRIC_NAMES).toEqual([
      "nakedAgendaInstalls",
      "agendaFloodExposure",
      "scoreWindowMissed",
      "remoteOverbuild",
      "economyStall",
      "repeatedLowValueCentralRun",
      "rigStall",
      "assetTrashNeglect",
    ]);
  });

  it("aggregates and diffs doctrine quality metrics", () => {
    const baseline = {
      ...emptyDoctrineMetrics(),
      scoreWindowMissed: 2,
      rigStall: 1,
    };
    const candidate = {
      ...emptyDoctrineMetrics(),
      scoreWindowMissed: 5,
      economyStall: 3,
    };

    expect(sumDoctrineMetrics([baseline, candidate])).toEqual({
      ...emptyDoctrineMetrics(),
      scoreWindowMissed: 7,
      economyStall: 3,
      rigStall: 1,
    });
    expect(diffDoctrineMetrics(candidate, baseline)).toEqual({
      ...emptyDoctrineMetrics(),
      scoreWindowMissed: 3,
      economyStall: 3,
      rigStall: -1,
    });
  });

  it("rounds averages consistently for simulation summaries", () => {
    expect(averageNumber([])).toBe(0);
    expect(averageNumber([1, 2, 2])).toBe(1.667);
  });
});
