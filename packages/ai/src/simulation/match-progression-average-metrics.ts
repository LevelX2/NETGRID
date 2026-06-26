import type { AiSimulationSummary } from "./ai-simulation-summary";
import { roundNumber as round } from "../runtime/number-rounding";

export function averageFinalAdvanceNumber(
  entries: AiSimulationSummary["actionSequence"],
  key: "remoteProtectionScore",
): number {
  const values = entries
    .map((entry) => entry[key])
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function averageRunnerContestRisk(
  entries: AiSimulationSummary["actionSequence"],
): number {
  const values = entries
    .map((entry): number | undefined => {
      if (entry.runnerContestRisk === "high") return 1;
      if (entry.runnerContestRisk === "medium") return 0.5;
      if (entry.runnerContestRisk === "low") return 0;
      return undefined;
    })
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
