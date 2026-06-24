import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  runnerHqMemoryScoreComponents,
  runnerRndMemoryScoreComponents,
  type RunnerCentralMemoryScoreDependencies,
} from "./runner-central-memory-score";

export type RunnerCentralMemoryContext = {
  semanticRuntimeRunnerRndMemoryComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  semanticRuntimeRunnerHqMemoryComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
};

export function createRunnerCentralMemoryContext(
  dependencies: RunnerCentralMemoryScoreDependencies,
): RunnerCentralMemoryContext {
  return {
    semanticRuntimeRunnerRndMemoryComponents: (input, action) =>
      runnerRndMemoryScoreComponents(input, action, dependencies),
    semanticRuntimeRunnerHqMemoryComponents: (input, action) =>
      runnerHqMemoryScoreComponents(input, action, dependencies),
  };
}
