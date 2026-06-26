import type {
  AiDecision,
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  qualityTagsForActionWithDependencies,
  summarizeDoctrineQualityMetrics,
} from "./doctrine-quality-tags";
import {
  metricsForSimulationActionSequence,
  type AiQualityMetrics,
} from "./quality-metrics";

export function metricsFor(
  actionSequence: AiSimulationSummary["actionSequence"],
  errors: string[],
  replayOk: boolean,
  holdout: boolean,
): AiQualityMetrics {
  return metricsForSimulationActionSequence(
    actionSequence,
    errors,
    replayOk,
    holdout,
    summarizeDoctrineQualityMetrics,
  );
}

export function createQualityTagsForAction(dependencies: {
  extractFeatures: (input: AiDecisionInput) => {
    serverFeaturesById: Map<string, { iceCount?: number; rootCount?: number }>;
    rigRoles: Set<string>;
  };
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
}): (
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
) => string[] {
  return (input, action, decision) =>
    qualityTagsForActionWithDependencies(input, action, decision, dependencies);
}
