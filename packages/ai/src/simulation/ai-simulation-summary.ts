import type { CURRENT_RULES_BASELINE, GameState } from "@netgrid/shared";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiSimulationRuntimeFailure } from "./ai-simulation-runtime-failure";
import type { AiQualityMetrics } from "./quality-metric-types";

export type AiSimulationTerminationKind =
  | "game_result"
  | "action_limit"
  | "runtime_failure";

export type AiSimulationSummary = {
  seed: string;
  terminationKind: AiSimulationTerminationKind;
  winner:
    | Exclude<GameState["winner"], null>
    | "action_limit_reached"
    | "runtime_failure";
  gameEndReason?: GameState["gameEndReason"];
  actions: number;
  turns: number;
  finalAgendaPoints: { runner: number; corp: number };
  finalStateHash: string;
  eventLogLength: number;
  replayOk: boolean;
  replayErrors: string[];
  actionSequence: AiSimulationActionSequenceEntry[];
  errors: string[];
  runtimeFailures?: AiSimulationRuntimeFailure[];
  cardPoolVersion: typeof CURRENT_RULES_BASELINE.engineSchemaVersion;
  metrics: AiQualityMetrics;
};
