import {
  createRunnerBadPublicityRelevanceContext,
} from "./runner-bad-publicity-relevance-context";
import {
  createRunnerCentralMemoryContext,
} from "./runner-central-memory-context";
import {
  createRunnerRecentHistoryContext,
} from "./runner-recent-history-context";
import { createRunnerRecoveryContext } from "./runner-recovery-context";
import { createRunnerRunComponentsContext } from "./runner-run-components-context";
import {
  createRunnerRunTargetGuidanceContext,
} from "./runner-run-target-guidance-context";
import {
  createRunnerScoreComponentsContext,
  type RunnerScoreComponentsDependencies,
} from "./runner-score-components";

export type RunnerScoringSupportCompositionDependencies =
  Parameters<typeof createRunnerRunTargetGuidanceContext>[0] &
    Parameters<typeof createRunnerCentralMemoryContext>[0] &
    Parameters<typeof createRunnerRecentHistoryContext>[0] &
    Omit<
      Parameters<typeof createRunnerRunComponentsContext>[0],
      "recentStartRunsOnServer"
    > &
    Omit<
      Parameters<typeof createRunnerRecoveryContext>[0],
      "recentBasicCreditActions" | "safeProgressTargets"
    > &
    Omit<
      RunnerScoreComponentsDependencies,
      "recoveryCommitment" | "startRun" | "followup"
    > & {
      badPublicityRelevance: Parameters<
        typeof createRunnerBadPublicityRelevanceContext
      >[0];
      recoveryCommitment: Omit<
        RunnerScoreComponentsDependencies["recoveryCommitment"],
        | "blinkRecoveryScoreComponent"
        | "junkyardRecoveryScoreComponent"
        | "lowValueRecoveryRepeatScoreComponent"
        | "lateNoFundingCreditRepeatScoreComponent"
      >;
      startRun: Omit<
        RunnerScoreComponentsDependencies["startRun"],
        | "hqMemoryComponents"
        | "rndMemoryComponents"
        | "archivesComponents"
        | "remoteComponents"
        | "knownIcePathComponents"
        | "repeatedRunTargetComponents"
      >;
    };

export function createRunnerScoringSupportComposition(
  dependencies: RunnerScoringSupportCompositionDependencies,
) {
  const {
    semanticRuntimeRunnerRunTargetGuidanceComponent,
  } = createRunnerRunTargetGuidanceContext({
    evaluationForAction: dependencies.evaluationForAction,
    guidanceValue: dependencies.guidanceValue,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
    remoteRootTrashCost: dependencies.remoteRootTrashCost,
  });

  const {
    semanticRuntimeRunnerRndMemoryComponents,
    semanticRuntimeRunnerHqMemoryComponents,
  } = createRunnerCentralMemoryContext({
    rndTopFreshness: dependencies.rndTopFreshness,
    staleKnownRndRepeatRunPenalty:
      dependencies.staleKnownRndRepeatRunPenalty,
    rndFreshRepeatRunBoost: dependencies.rndFreshRepeatRunBoost,
    hqHandMemory: dependencies.hqHandMemory,
    definitionType: dependencies.definitionType,
    staleKnownHqRepeatRunPenalty: dependencies.staleKnownHqRepeatRunPenalty,
  });

  const {
    runnerLateNoFundingCreditSafeProgressTargets,
    semanticRuntimeRecentRunnerBasicCreditActions,
    semanticRuntimeRecentRunnerStartRunsOnServer,
  } = createRunnerRecentHistoryContext({
    publicHistory: dependencies.publicHistory,
    eventVersion: dependencies.eventVersion,
    serverIdFromEvent: dependencies.serverIdFromEvent,
    closeout: dependencies.closeout,
    pressureReadyTargets: dependencies.pressureReadyTargets,
  });

  const {
    semanticRuntimeRunnerAccessTrashComponents,
    semanticRuntimeRunnerArchivesComponents,
    semanticRuntimeRunnerKnownIcePathComponents,
    semanticRuntimeRunnerRemoteComponents,
    semanticRuntimeRepeatedRunTargetComponents,
  } = createRunnerRunComponentsContext({
    trashAccessContext: dependencies.trashAccessContext,
    evaluationForAction: dependencies.evaluationForAction,
    definitionType: dependencies.definitionType,
    knownIcePathAssessment: dependencies.knownIcePathAssessment,
    rootTrashCost: dependencies.rootTrashCost,
    candidateMemory: dependencies.candidateMemory,
    recentStartRunsOnServer: semanticRuntimeRecentRunnerStartRunsOnServer,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
  });

  const {
    runnerBlinkRecoveryScoreComponent,
    runnerLowValueRecoveryRepeatScoreComponent,
    runnerLateNoFundingCreditRepeatScoreComponent,
    runnerJunkyardBbsRecoveryScoreComponent,
  } = createRunnerRecoveryContext({
    targetServerId: dependencies.targetServerId,
    blinkAssessment: dependencies.blinkAssessment,
    rolesForAction: dependencies.rolesForAction,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    recentBasicCreditActions: semanticRuntimeRecentRunnerBasicCreditActions,
    safeProgressTargets: runnerLateNoFundingCreditSafeProgressTargets,
    handFundingTarget: dependencies.handFundingTarget,
    bankHasConcreteFundingNeed: dependencies.bankHasConcreteFundingNeed,
    hasKnownUnaffordableLegalRun: dependencies.hasKnownUnaffordableLegalRun,
    publicHistory: dependencies.publicHistory,
    eventVersion: dependencies.eventVersion,
    findVisibleCard: dependencies.findVisibleCard,
    rolesForCardId: dependencies.rolesForCardId,
    cardAddressesVisibleBreakerNeed:
      dependencies.cardAddressesVisibleBreakerNeed,
    isRunnerPressureRole: dependencies.isRunnerPressureRole,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    badPublicityOrTraceTechCard: dependencies.badPublicityOrTraceTechCard,
    actionClickCost: dependencies.actionClickCost,
    actionCreditCost: dependencies.actionCreditCost,
    junkyardBbsDefinitionId: dependencies.junkyardBbsDefinitionId,
    junkyardBbsReturnTopHeapAbility:
      dependencies.junkyardBbsReturnTopHeapAbility,
  });

  const {
    runnerBadPublicityRelevanceScoreComponent,
  } = createRunnerBadPublicityRelevanceContext(
    dependencies.badPublicityRelevance,
  );

  return createRunnerScoreComponentsContext({
    loanLiabilityAssessment: dependencies.loanLiabilityAssessment,
    goalFit: dependencies.goalFit,
    handFundingTarget: dependencies.handFundingTarget,
    recoveryCommitment: {
      ...dependencies.recoveryCommitment,
      blinkRecoveryScoreComponent: runnerBlinkRecoveryScoreComponent,
      junkyardRecoveryScoreComponent: runnerJunkyardBbsRecoveryScoreComponent,
      lowValueRecoveryRepeatScoreComponent:
        runnerLowValueRecoveryRepeatScoreComponent,
      lateNoFundingCreditRepeatScoreComponent:
        runnerLateNoFundingCreditRepeatScoreComponent,
    },
    install: dependencies.install,
    startRun: {
      ...dependencies.startRun,
      hqMemoryComponents: semanticRuntimeRunnerHqMemoryComponents,
      rndMemoryComponents: semanticRuntimeRunnerRndMemoryComponents,
      archivesComponents: semanticRuntimeRunnerArchivesComponents,
      remoteComponents: semanticRuntimeRunnerRemoteComponents,
      knownIcePathComponents: semanticRuntimeRunnerKnownIcePathComponents,
      repeatedRunTargetComponents: semanticRuntimeRepeatedRunTargetComponents,
    },
    followup: {
      runTargetGuidanceComponent:
        semanticRuntimeRunnerRunTargetGuidanceComponent,
      accessTrashComponents: semanticRuntimeRunnerAccessTrashComponents,
      badPublicityRelevanceScoreComponent:
        runnerBadPublicityRelevanceScoreComponent,
    },
  });
}
