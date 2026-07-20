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
import { decisionDerivedValue } from "./decision-derived-cache";

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
    cardInstanceId: string;
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
  const handDevelopmentCacheKey = {};
  const actionEvaluationCacheKey = {};

  function evaluationForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerPersistentInstallEvaluation | undefined {
    const cache = decisionDerivedValue(
      input,
      actionEvaluationCacheKey,
      () =>
        new WeakMap<LegalAction, RunnerPersistentInstallEvaluation | null>(),
    );
    if (cache.has(action)) return cache.get(action) ?? undefined;
    const evaluation = runnerPersistentInstallEvaluationForAction(
      input,
      action,
      {
        deckCapabilities: dependencies.deckCapabilities,
        strategicIntent: dependencies.strategicIntent,
        handDevelopmentEvaluations: (params) =>
          decisionDerivedValue(input, handDevelopmentCacheKey, () =>
            dependencies.handDevelopmentEvaluations(params),
          ),
      },
    );
    cache.set(action, evaluation ?? null);
    return evaluation;
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
