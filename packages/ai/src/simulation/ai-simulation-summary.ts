import type { CURRENT_RULES_BASELINE, GameState } from "@netgrid/shared";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiQualityMetrics } from "./quality-metrics";

export type AiSimulationSummary = {
  seed: string;
  winner: Exclude<GameState["winner"], null> | "action_limit_reached";
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
  cardPoolVersion: typeof CURRENT_RULES_BASELINE.engineSchemaVersion;
  metrics: AiQualityMetrics;
};
