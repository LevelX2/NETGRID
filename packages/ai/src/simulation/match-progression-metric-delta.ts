import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import { roundNumber as round } from "../runtime/number-rounding";

export function diffMatchProgressionMetrics(
  candidate: AiMatchProgressionMetrics,
  baseline: AiMatchProgressionMetrics,
): AiMatchProgressionMetrics {
  const keys = Object.keys(candidate) as Array<keyof AiMatchProgressionMetrics>;
  if (keys.length !== Object.keys(baseline).length) {
    throw new Error("Benchmark baseline and candidate have different metric sets.");
  }
  return Object.fromEntries(
    keys.map((key) => {
      const current = candidate[key];
      const previous = baseline[key];
      if (
        !Object.hasOwn(baseline, key) ||
        !Number.isFinite(current) ||
        !Number.isFinite(previous)
      ) {
        throw new Error(`Benchmark metric is missing or non-finite: ${key}`);
      }
      return [key, round(current - previous)];
    }),
  ) as AiMatchProgressionMetrics;
}
