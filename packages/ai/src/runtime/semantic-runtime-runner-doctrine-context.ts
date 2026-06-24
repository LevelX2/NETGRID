import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  semanticRuntimeDoctrineActionGate,
  semanticRuntimeRunnerDoctrineActionGate,
  semanticRuntimeRunnerDoctrineRunWeight,
  semanticRuntimeRunnerLowValueRecoveryContext,
  semanticRuntimeRunnerRemoteContestDoctrineGuard,
  type SemanticRuntimeDoctrineConsumer,
  type SemanticRuntimeDoctrineGate,
  type SemanticRuntimeRunnerDoctrineActionGateDependencies,
  type SemanticRuntimeRunnerDoctrineRunWeightDependencies,
  type SemanticRuntimeRunnerLowValueRecoveryContextDependencies,
  type SemanticRuntimeRunnerRemoteContestDoctrineGuardDependencies,
} from "./semantic-runtime-doctrine-score";

type RunnerRunTargetEvaluation = SemanticRuntimeRunnerDoctrineActionGateDependencies["runnerRunTargetEvaluation"];
type RunnerRemoteContestEvaluation = SemanticRuntimeRunnerRemoteContestDoctrineGuardDependencies["runnerRunTargetEvaluation"];

export type SemanticRuntimeRunnerDoctrineContextDependencies = {
  actionCreditCost: (action: LegalAction) => number;
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeDoctrineGate;
  runnerRunTargetEvaluation: RunnerRunTargetEvaluation &
    RunnerRemoteContestEvaluation;
  recentRunnerStartRunsOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => number;
  recentRecoveryActions: (input: AiDecisionInput) => number;
  recoveryFundingNeedContext: SemanticRuntimeRunnerLowValueRecoveryContextDependencies["recoveryFundingNeedContext"];
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  rawWeight: (input: AiDecisionInput, planKey: string) => number;
  suppressedComponent: (evidence: readonly string[]) => AiDecisionScoreComponent;
  planWeightComponent: (
    input: AiDecisionInput,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
  ) => AiDecisionScoreComponent | undefined;
};

export type SemanticRuntimeRunnerDoctrineContext = {
  semanticRuntimeDoctrineActionGate: (
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
    context?: { serverId?: string | undefined },
  ) => SemanticRuntimeDoctrineGate;
  semanticRuntimeRunnerDoctrineActionGate: (
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
    serverId: string | undefined,
  ) => SemanticRuntimeDoctrineGate;
  semanticRuntimeRunnerDoctrineRunWeight: (
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string | undefined,
  ) => AiDecisionScoreComponent | undefined;
  semanticRuntimeRunnerRemoteContestDoctrineGuard: (
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string | undefined,
  ) => SemanticRuntimeDoctrineGate;
};

export function createSemanticRuntimeRunnerDoctrineContext(
  dependencies: SemanticRuntimeRunnerDoctrineContextDependencies,
): SemanticRuntimeRunnerDoctrineContext {
  function runnerRemoteContestDoctrineGuard(
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string | undefined,
  ): SemanticRuntimeDoctrineGate {
    return semanticRuntimeRunnerRemoteContestDoctrineGuard(
      input,
      action,
      serverId,
      {
        isRemoteServerTarget: dependencies.isRemoteServerTarget,
        runnerRunTargetEvaluation: dependencies.runnerRunTargetEvaluation,
        recentRunnerStartRunsOnServer:
          dependencies.recentRunnerStartRunsOnServer,
      },
    );
  }

  function runnerDoctrineActionGate(
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
    serverId: string | undefined,
  ): SemanticRuntimeDoctrineGate {
    return semanticRuntimeRunnerDoctrineActionGate(
      input,
      action,
      planKey,
      consumer,
      serverId,
      {
        runnerRunTargetEvaluation: dependencies.runnerRunTargetEvaluation,
        recentRunnerStartRunsOnServer:
          dependencies.recentRunnerStartRunsOnServer,
        runnerLowValueRecoveryContext: (contextInput) =>
          semanticRuntimeRunnerLowValueRecoveryContext(contextInput, {
            recentRecoveryActions: dependencies.recentRecoveryActions,
            recoveryFundingNeedContext: dependencies.recoveryFundingNeedContext,
          }),
        runnerRemoteContestDoctrineGuard,
      },
    );
  }

  function doctrineActionGate(
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
    context: { serverId?: string | undefined } = {},
  ): SemanticRuntimeDoctrineGate {
    return semanticRuntimeDoctrineActionGate(input, action, planKey, consumer, {
      actionCreditCost: dependencies.actionCreditCost,
      runnerDoctrineActionGate,
      corpScoreNowSafetyGate: dependencies.corpScoreNowSafetyGate,
    }, context);
  }

  function runnerDoctrineRunWeight(
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string | undefined,
  ): AiDecisionScoreComponent | undefined {
    return semanticRuntimeRunnerDoctrineRunWeight(input, action, serverId, {
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      rawWeight: dependencies.rawWeight,
      actionGate: doctrineActionGate,
      suppressedComponent: dependencies.suppressedComponent,
      planWeightComponent: dependencies.planWeightComponent,
    } satisfies SemanticRuntimeRunnerDoctrineRunWeightDependencies);
  }

  return {
    semanticRuntimeDoctrineActionGate: doctrineActionGate,
    semanticRuntimeRunnerDoctrineActionGate: runnerDoctrineActionGate,
    semanticRuntimeRunnerDoctrineRunWeight: runnerDoctrineRunWeight,
    semanticRuntimeRunnerRemoteContestDoctrineGuard:
      runnerRemoteContestDoctrineGuard,
  };
}
