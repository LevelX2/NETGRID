import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { runnerBlinkRecoveryScoreComponent } from "./runner-blink-recovery-score";
import { runnerJunkyardBbsRecoveryScoreComponent } from "./runner-junkyard-bbs-recovery-score";
import {
  runnerJunkyardBbsRecoveryAction,
  runnerJunkyardBbsRecoveryTarget,
  runnerJunkyardBbsRecoveryTargetAssessment,
} from "./runner-junkyard-bbs-recovery-target";
import { runnerRecoveryFundingNeedContext } from "./runner-recovery-funding-need";
import type { RunnerRecoveryFundingNeedContext } from "./runner-recovery-funding-need";
import {
  runnerLateNoFundingCreditRepeatScoreComponent,
  runnerLowValueRecoveryRepeatScoreComponent,
} from "./runner-recovery-repeat-score";
import {
  runnerActionLooksLikeRecovery,
  runnerRecentRecoveryActions,
} from "./runner-recovery-history";

type RunnerBlinkRecoveryAssessment = {
  active: boolean;
  evidence: string[];
};

type RunnerSafeProgressTarget = {
  serverId: string;
  targetType: string;
};

export type RunnerRecoveryContextDependencies = {
  targetServerId: (action: LegalAction) => string | undefined;
  blinkAssessment: (
    input: AiDecisionInput,
    targetServerId: string | undefined,
  ) => RunnerBlinkRecoveryAssessment | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  recentBasicCreditActions: (input: AiDecisionInput) => number;
  safeProgressTargets: (input: AiDecisionInput) => RunnerSafeProgressTarget[];
  handFundingTarget: (input: AiDecisionInput) => unknown;
  bankHasConcreteFundingNeed: (input: AiDecisionInput) => boolean;
  hasKnownUnaffordableLegalRun: (input: AiDecisionInput) => boolean;
  publicHistory: (input: AiDecisionInput) => PublicGameEvent[];
  eventVersion: (event: PublicGameEvent) => number;
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  cardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    target: VisibleCard,
  ) => boolean;
  isRunnerPressureRole: (role: string) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
  badPublicityOrTraceTechCard: (
    target: VisibleCard | undefined,
    targetRoles: readonly string[],
  ) => boolean;
  actionClickCost: (action: LegalAction) => number;
  actionCreditCost: (action: LegalAction) => number;
  junkyardBbsDefinitionId: string;
  junkyardBbsReturnTopHeapAbility: string;
};

export type RunnerRecoveryContext = {
  runnerBlinkRecoveryScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  runnerLowValueRecoveryRepeatScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  runnerLateNoFundingCreditRepeatScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  runnerJunkyardBbsRecoveryScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  runnerActionLooksLikeRecovery: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerRecoveryFundingNeedContext: (
    input: AiDecisionInput,
  ) => RunnerRecoveryFundingNeedContext;
  semanticRuntimeRecentRunnerRecoveryActions: (
    input: AiDecisionInput,
    action?: LegalAction,
  ) => number;
};

export function createRunnerRecoveryContext(
  dependencies: RunnerRecoveryContextDependencies,
): RunnerRecoveryContext {
  function fundingNeedContext(
    input: AiDecisionInput,
  ): RunnerRecoveryFundingNeedContext {
    return runnerRecoveryFundingNeedContext(input, {
      handFundingTarget: dependencies.handFundingTarget,
      bankHasConcreteFundingNeed: dependencies.bankHasConcreteFundingNeed,
      hasKnownUnaffordableLegalRun: dependencies.hasKnownUnaffordableLegalRun,
    });
  }

  function actionLooksLikeRecovery(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    return runnerActionLooksLikeRecovery(input, action, {
      sourceCard: (runtimeInput, runtimeAction) =>
        dependencies.findVisibleCard(runtimeInput, runtimeAction.source),
      rolesForAction: dependencies.rolesForAction,
    });
  }

  function recentRecoveryActions(
    input: AiDecisionInput,
    action?: LegalAction,
  ): number {
    return runnerRecentRecoveryActions(input, action, {
      publicHistory: dependencies.publicHistory,
      eventVersion: dependencies.eventVersion,
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    });
  }

  function junkyardBbsRecoveryAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    return runnerJunkyardBbsRecoveryAction(input, action, {
      junkyardBbsDefinitionId: dependencies.junkyardBbsDefinitionId,
      returnTopHeapAbility: dependencies.junkyardBbsReturnTopHeapAbility,
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    });
  }

  function junkyardBbsRecoveryTarget(
    input: AiDecisionInput,
    action: LegalAction,
  ): VisibleCard | undefined {
    return runnerJunkyardBbsRecoveryTarget(input, action, {
      findVisibleCard: dependencies.findVisibleCard,
    });
  }

  function junkyardBbsRecoveryTargetAssessment(
    input: AiDecisionInput,
    target: VisibleCard | undefined,
    targetDefinitionId: string | undefined,
    targetRoles: readonly string[],
  ): { value: number; evidence: string[] } {
    return runnerJunkyardBbsRecoveryTargetAssessment(
      input,
      target,
      targetDefinitionId,
      targetRoles,
      {
        cardAddressesVisibleBreakerNeed:
          dependencies.cardAddressesVisibleBreakerNeed,
        isRunnerPressureRole: dependencies.isRunnerPressureRole,
        isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
        fundingNeedContext,
        badPublicityOrTraceTechCard: dependencies.badPublicityOrTraceTechCard,
      },
    );
  }

  return {
    runnerBlinkRecoveryScoreComponent: (input, action) =>
      runnerBlinkRecoveryScoreComponent(input, action, {
        targetServerId: dependencies.targetServerId,
        assessment: dependencies.blinkAssessment,
        rolesForAction: dependencies.rolesForAction,
      }),
    runnerLowValueRecoveryRepeatScoreComponent: (input, action) =>
      runnerLowValueRecoveryRepeatScoreComponent(input, action, {
        actionLooksLikeRecovery,
        recentRecoveryActions,
        fundingNeedContext,
        sourceDefinitionId: dependencies.sourceDefinitionIdForAction,
      }),
    runnerLateNoFundingCreditRepeatScoreComponent: (input, action) =>
      runnerLateNoFundingCreditRepeatScoreComponent(input, action, {
        recentBasicCreditActions: dependencies.recentBasicCreditActions,
        fundingNeedContext,
        safeProgressTargets: dependencies.safeProgressTargets,
      }),
    runnerJunkyardBbsRecoveryScoreComponent: (input, action) =>
      runnerJunkyardBbsRecoveryScoreComponent(input, action, {
        isRecoveryAction: junkyardBbsRecoveryAction,
        target: junkyardBbsRecoveryTarget,
        rolesForCardId: dependencies.rolesForCardId,
        targetAssessment: junkyardBbsRecoveryTargetAssessment,
        actionClickCost: dependencies.actionClickCost,
        actionCreditCost: dependencies.actionCreditCost,
      }),
    runnerActionLooksLikeRecovery: actionLooksLikeRecovery,
    runnerRecoveryFundingNeedContext: fundingNeedContext,
    semanticRuntimeRecentRunnerRecoveryActions: recentRecoveryActions,
  };
}
