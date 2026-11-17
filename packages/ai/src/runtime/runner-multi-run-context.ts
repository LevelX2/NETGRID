import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import {
  runnerMultiRunEventAssessment,
  type RunnerMultiRunEventAssessment,
} from "./runner-multi-run-event-assessment";
import { runnerMultiRunEventExclusion } from "./runner-multi-run-event-exclusion";
import { decisionDerivedValue } from "../decision-derived-cache";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerMultiRunContextDependencies<
  TDeckCapabilities,
  TStrategicIntent,
> = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  targetServerId: (action: LegalAction) => string | undefined;
  payoffClass: (evaluation: RunnerRunTargetEvaluation | undefined) => string;
  canTakeRun: (evaluation: RunnerRunTargetEvaluation | undefined) => boolean;
  scoreValue: (
    phase: RunnerMultiRunEventAssessment["phase"],
    payoffClass: string,
    canTakeRun: boolean,
  ) => number;
  deckCapabilitiesForInput: (input: AiDecisionInput) => TDeckCapabilities;
  strategicIntentForInput: (
    input: AiDecisionInput,
    deckCapabilities: TDeckCapabilities,
  ) => TStrategicIntent;
  runTargets: (params: {
    input: AiDecisionInput;
    deckCapabilities: TDeckCapabilities;
    strategicIntent: TStrategicIntent;
  }) => readonly RunnerRunTargetEvaluation[];
};

export type RunnerMultiRunContext = {
  semanticRuntimeRunnerMultiRunEventExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  runnerMultiRunEventAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMultiRunEventAssessment | undefined;
  runnerMultiRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ) => RunnerRunTargetEvaluation | undefined;
  semanticRuntimeRunnerRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ) => RunnerRunTargetEvaluation | undefined;
  semanticRuntimeRunnerRunTargetEvaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRunTargetEvaluation | undefined;
};

export function createRunnerMultiRunContext<
  TDeckCapabilities,
  TStrategicIntent,
>(
  dependencies: RunnerMultiRunContextDependencies<
    TDeckCapabilities,
    TStrategicIntent
  >,
): RunnerMultiRunContext {
  const targetEvaluationCacheKey = {};
  const actionWithoutTargetCacheKey = Symbol("action_without_target");

  function cachedTargetEvaluation(
    input: AiDecisionInput,
    action: LegalAction,
    targetKey: string | symbol,
    create: () => RunnerRunTargetEvaluation | undefined,
  ): RunnerRunTargetEvaluation | undefined {
    const cache = decisionDerivedValue(
      input,
      targetEvaluationCacheKey,
      () =>
        new WeakMap<
          LegalAction,
          Map<string | symbol, RunnerRunTargetEvaluation | undefined>
        >(),
    );
    let evaluationsByTarget = cache.get(action);
    if (!evaluationsByTarget) {
      evaluationsByTarget = new Map();
      cache.set(action, evaluationsByTarget);
    }
    if (evaluationsByTarget.has(targetKey)) {
      return evaluationsByTarget.get(targetKey);
    }
    const evaluation = create();
    evaluationsByTarget.set(targetKey, evaluation);
    return evaluation;
  }

  function assessment(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerMultiRunEventAssessment | undefined {
    return runnerMultiRunEventAssessment(input, action, {
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
      targetServerId: dependencies.targetServerId,
      targetEvaluation: runnerMultiRunTargetEvaluation,
      payoffClass: dependencies.payoffClass,
      canTakeRun: dependencies.canTakeRun,
      scoreValue: dependencies.scoreValue,
    });
  }

  function scopedRunTargets(
    input: AiDecisionInput,
    offeredAction: LegalAction,
  ) {
    const legalActions = [offeredAction];
    const deckCapabilities = dependencies.deckCapabilitiesForInput(input);
    return dependencies
      .runTargets({
        input: {
          ...input,
          legalActions,
          playerView: { ...input.playerView, legalActions },
        },
        deckCapabilities,
        strategicIntent: dependencies.strategicIntentForInput(
          input,
          deckCapabilities,
        ),
      })
      .filter((evaluation) => evaluation.actionId === offeredAction.actionId);
  }

  function runnerMultiRunTargetEvaluation(
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ): RunnerRunTargetEvaluation | undefined {
    return cachedTargetEvaluation(input, action, targetServerId, () => {
      const runAction: LegalAction = {
        ...action,
        payload: {
          ...(action.payload ?? {}),
          serverId: targetServerId,
        },
      };
      return scopedRunTargets(input, runAction).find(
        (evaluation) => evaluation.targetServerId === targetServerId,
      );
    });
  }

  function semanticRuntimeRunnerRunTargetEvaluation(
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ): RunnerRunTargetEvaluation | undefined {
    if (input.side !== "runner" || action.side !== "runner") return undefined;
    return runnerMultiRunTargetEvaluation(input, action, targetServerId);
  }

  function semanticRuntimeRunnerRunTargetEvaluationForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerRunTargetEvaluation | undefined {
    if (input.side !== "runner" || action.side !== "runner") return undefined;
    const targetServerId = dependencies.targetServerId(action);
    if (targetServerId) {
      return semanticRuntimeRunnerRunTargetEvaluation(
        input,
        action,
        targetServerId,
      );
    }
    return cachedTargetEvaluation(
      input,
      action,
      actionWithoutTargetCacheKey,
      () => scopedRunTargets(input, action)[0],
    );
  }

  return {
    semanticRuntimeRunnerMultiRunEventExclusion: (input, action) =>
      runnerMultiRunEventExclusion(input, action, { assessment }),
    runnerMultiRunEventAssessment: assessment,
    runnerMultiRunTargetEvaluation,
    semanticRuntimeRunnerRunTargetEvaluation,
    semanticRuntimeRunnerRunTargetEvaluationForAction,
  };
}
