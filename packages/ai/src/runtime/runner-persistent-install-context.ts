import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  runnerPersistentInstallEvidenceForAction,
  runnerPersistentInstallEvaluationForAction,
  runnerPersistentInstallFitScoreComponent,
  runnerPersistentInstallLegacyScoreDelta,
} from "./runner-persistent-install-fit-score";

type RunnerPersistentInstallEvaluation = {
  stackabilityClass: string;
  capabilityDelta: string;
  duplicateRole: string;
  finalInstallFit: number;
  evidence: string[];
};

export type RunnerPersistentInstallContextDependencies<
  TDeckCapabilities,
  TStrategicIntent,
> = {
  deckCapabilities: (input: AiDecisionInput) => TDeckCapabilities;
  strategicIntent: (
    input: AiDecisionInput,
    deckCapabilities: TDeckCapabilities,
  ) => TStrategicIntent;
  handDevelopmentEvaluations: (params: {
    input: AiDecisionInput;
    deckCapabilities: TDeckCapabilities;
    strategicIntent: TStrategicIntent;
  }) => readonly {
    legalActionId?: string;
    persistentInstallEvaluation?: RunnerPersistentInstallEvaluation;
  }[];
};

export type RunnerPersistentInstallContext = {
  runnerPersistentInstallFitScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  runnerPersistentInstallLegacyScoreDelta: (
    evaluation: RunnerPersistentInstallEvaluation | undefined,
  ) => number;
  runnerPersistentInstallEvidenceForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  runnerPersistentInstallEvaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerPersistentInstallEvaluation | undefined;
};

export function createRunnerPersistentInstallContext<
  TDeckCapabilities,
  TStrategicIntent,
>(
  dependencies: RunnerPersistentInstallContextDependencies<
    TDeckCapabilities,
    TStrategicIntent
  >,
): RunnerPersistentInstallContext {
  function evaluationForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerPersistentInstallEvaluation | undefined {
    return runnerPersistentInstallEvaluationForAction(input, action, {
      deckCapabilities: dependencies.deckCapabilities,
      strategicIntent: dependencies.strategicIntent,
      handDevelopmentEvaluations: dependencies.handDevelopmentEvaluations,
    });
  }

  return {
    runnerPersistentInstallFitScoreComponent: (input, action) =>
      runnerPersistentInstallFitScoreComponent(input, action, {
        evaluationForAction,
      }),
    runnerPersistentInstallLegacyScoreDelta,
    runnerPersistentInstallEvidenceForAction: (input, action) =>
      runnerPersistentInstallEvidenceForAction(input, action, {
        evaluationForAction,
      }),
    runnerPersistentInstallEvaluationForAction: evaluationForAction,
  };
}
