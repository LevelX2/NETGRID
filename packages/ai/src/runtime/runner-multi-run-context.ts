import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import {
  runnerMultiRunEventAssessment,
  type RunnerMultiRunEventAssessment,
} from "./runner-multi-run-event-assessment";
import { runnerMultiRunEventExclusion } from "./runner-multi-run-event-exclusion";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerMultiRunContextDependencies<
  TDeckCapabilities,
  TStrategicIntent,
> = {
  allNighterDefinitionId: string;
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
  function assessment(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerMultiRunEventAssessment | undefined {
    return runnerMultiRunEventAssessment(input, action, {
      allNighterDefinitionId: dependencies.allNighterDefinitionId,
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
      targetServerId: dependencies.targetServerId,
      targetEvaluation: runnerMultiRunTargetEvaluation,
      payoffClass: dependencies.payoffClass,
      canTakeRun: dependencies.canTakeRun,
      scoreValue: dependencies.scoreValue,
    });
  }

  function runnerMultiRunTargetEvaluation(
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ): RunnerRunTargetEvaluation | undefined {
    const runAction: LegalAction = {
      ...action,
      payload: {
        ...(action.payload ?? {}),
        serverId: targetServerId,
      },
    };
    const scopedInput: AiDecisionInput = {
      ...input,
      legalActions: [runAction],
      playerView: {
        ...input.playerView,
        legalActions: [runAction],
      },
    };
    const deckCapabilities = dependencies.deckCapabilitiesForInput(input);
    const strategicIntent = dependencies.strategicIntentForInput(
      input,
      deckCapabilities,
    );
    return dependencies.runTargets({
      input: scopedInput,
      deckCapabilities,
      strategicIntent,
    })[0];
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
    const scopedInput: AiDecisionInput = {
      ...input,
      legalActions: [action],
      playerView: {
        ...input.playerView,
        legalActions: [action],
      },
    };
    const deckCapabilities = dependencies.deckCapabilitiesForInput(input);
    const strategicIntent = dependencies.strategicIntentForInput(
      input,
      deckCapabilities,
    );
    return dependencies.runTargets({
      input: scopedInput,
      deckCapabilities,
      strategicIntent,
    })[0];
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
