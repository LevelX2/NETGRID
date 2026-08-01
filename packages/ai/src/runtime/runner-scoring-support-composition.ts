import { createRunnerBadPublicityRelevanceContext } from "./runner-bad-publicity-relevance-context";
import { createRunnerCentralMemoryContext } from "./runner-central-memory-context";
import { createRunnerRecentHistoryContext } from "./runner-recent-history-context";
import { createRunnerRecoveryContext } from "./runner-recovery-context";
import { createRunnerRunComponentsContext } from "./runner-run-components-context";
import { createRunnerRunTargetGuidanceContext } from "./runner-run-target-guidance-context";
import {
  createRunnerScoreComponentsContext,
  type RunnerScoreComponentsDependencies,
} from "./runner-score-components";
import type { AiDecisionInput } from "@netgrid/shared";
import { reconstructBeliefState } from "../belief-state";
import type { RunnerPressureReadyForMetrics } from "../simulation/runner-pressure-metric-types";
import {
  runnerRunPathCreditBudgetWithVisiblePools,
  type RunnerRunPathCreditBudget,
  type assessKnownRezzedIcePath,
} from "../visible-run-analysis";
import { demoCardRulesTextForAi } from "./card-definition-lookup";
import { stringRecordValue } from "./record-value";

type RunnerScoringSupportHint = {
  effects?: readonly unknown[];
};

type RunnerScoringKnownPathAssessment = ReturnType<
  typeof assessKnownRezzedIcePath
>;

export type RunnerScoringSupportCompositionDependencies = Parameters<
  typeof createRunnerRunTargetGuidanceContext
>[0] &
  Omit<
    Parameters<typeof createRunnerCentralMemoryContext>[0],
    "rndTopFreshness" | "hqHandMemory"
  > &
  Omit<
    Parameters<typeof createRunnerRecentHistoryContext>[0],
    "pressureReadyTargets"
  > &
  Omit<
    Parameters<typeof createRunnerRunComponentsContext>[0],
    "recentStartRunsOnServer" | "candidateMemory" | "knownIcePathAssessment"
  > &
  Omit<
    Parameters<typeof createRunnerRecoveryContext>[0],
    "recentBasicCreditActions" | "safeProgressTargets"
  > &
  Omit<
    RunnerScoreComponentsDependencies,
    "recoveryCommitment" | "install" | "startRun" | "followup"
  > & {
    badPublicityRelevance: Omit<
      Parameters<typeof createRunnerBadPublicityRelevanceContext>[0],
      "cardSupport"
    >;
    hintForDefinitionId: (
      definitionId: string,
    ) => RunnerScoringSupportHint | undefined;
    assessRunnerPressureReadyForMetrics: (
      input: AiDecisionInput,
    ) => RunnerPressureReadyForMetrics;
    assessKnownRezzedIcePath: (
      iceCards: AiDecisionInput["playerView"]["servers"][number]["ice"],
      rigCards: NonNullable<AiDecisionInput["playerView"]["own"]["rig"]>,
      runnerCredits: number | RunnerRunPathCreditBudget,
      rootCards: AiDecisionInput["playerView"]["servers"][number]["root"],
    ) => RunnerScoringKnownPathAssessment;
    recoveryCommitment: Omit<
      RunnerScoreComponentsDependencies["recoveryCommitment"],
      | "randomBreakOrDamageRecoveryScoreComponent"
      | "junkyardRecoveryScoreComponent"
      | "lowValueRecoveryRepeatScoreComponent"
      | "lateNoFundingCreditRepeatScoreComponent"
    >;
    install: Omit<RunnerScoreComponentsDependencies["install"], "sourceCard">;
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
  const { semanticRuntimeRunnerRunTargetGuidanceComponent } =
    createRunnerRunTargetGuidanceContext({
      evaluationForAction: dependencies.evaluationForAction,
      guidanceValue: dependencies.guidanceValue,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      remoteRootTrashCost: dependencies.remoteRootTrashCost,
    });

  const {
    semanticRuntimeRunnerRndMemoryComponents,
    semanticRuntimeRunnerHqMemoryComponents,
  } = createRunnerCentralMemoryContext({
    rndTopFreshness: (input) =>
      reconstructBeliefState(input).runnerOpponentModel?.rndTopFreshness,
    staleKnownRndRepeatRunPenalty: dependencies.staleKnownRndRepeatRunPenalty,
    rndFreshRepeatRunBoost: dependencies.rndFreshRepeatRunBoost,
    hqHandMemory: (input) =>
      reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory,
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
    pressureReadyTargets: (input) =>
      dependencies.assessRunnerPressureReadyForMetrics(input).readyTargets,
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
    knownIcePathAssessment: (input, server) =>
      dependencies.assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        runnerRunPathCreditBudgetWithVisiblePools(
          input.playerView.own.credits,
          input.playerView.own.rig ?? [],
        ),
        server.root,
      ),
    rootTrashCost: dependencies.rootTrashCost,
    candidateMemory: (input, server) => {
      return server
        ? reconstructBeliefState(input)
            .runnerOpponentModel?.hiddenRemoteCandidateMemory.slice()
            .reverse()
            .find((entry) => entry.serverId === server.id)
        : undefined;
    },
    recentStartRunsOnServer: semanticRuntimeRecentRunnerStartRunsOnServer,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
  });

  const {
    runnerRandomBreakOrDamageRecoveryScoreComponent,
    runnerLowValueRecoveryRepeatScoreComponent,
    runnerLateNoFundingCreditRepeatScoreComponent,
    runnerJunkyardBbsRecoveryScoreComponent,
  } = createRunnerRecoveryContext({
    targetServerId: dependencies.targetServerId,
    randomBreakRecoveryAssessment: dependencies.randomBreakRecoveryAssessment,
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

  const { runnerBadPublicityRelevanceScoreComponent } =
    createRunnerBadPublicityRelevanceContext({
      ...dependencies.badPublicityRelevance,
      cardSupport: {
        rolesForCardId: (definitionId) => [
          ...dependencies.rolesForCardId(definitionId),
        ],
        hintEffectsForCard: (definitionId: string) =>
          dependencies.hintForDefinitionId(definitionId)?.effects,
        rulesTextForCard: demoCardRulesTextForAi,
        effectTarget: (effect: unknown) =>
          effect && typeof effect === "object"
            ? stringRecordValue(effect as Record<string, unknown>, "target")
            : undefined,
      },
    });

  return createRunnerScoreComponentsContext({
    loanLiabilityAssessment: dependencies.loanLiabilityAssessment,
    goalFit: dependencies.goalFit,
    recoveryCommitment: {
      ...dependencies.recoveryCommitment,
      randomBreakOrDamageRecoveryScoreComponent:
        runnerRandomBreakOrDamageRecoveryScoreComponent,
      junkyardRecoveryScoreComponent: runnerJunkyardBbsRecoveryScoreComponent,
      lowValueRecoveryRepeatScoreComponent:
        runnerLowValueRecoveryRepeatScoreComponent,
      lateNoFundingCreditRepeatScoreComponent:
        runnerLateNoFundingCreditRepeatScoreComponent,
    },
    install: {
      ...dependencies.install,
      sourceCard: (input, action) =>
        dependencies.findVisibleCard(input, action.source),
    },
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
      projectedRunContextComponents: (input, action) => {
        if (action.type === "start_run") return [];
        const evaluation = dependencies.evaluationForAction(input, action);
        if (!evaluation) return [];
        const server = input.playerView.servers.find(
          (candidate) => candidate.id === evaluation.accessServerId,
        );
        if (
          evaluation.accessServerId === "hq" &&
          evaluation.recommendation === "run_now"
        ) {
          return [
            ...(input.playerView.opponent.handCount <= 0
              ? [
                  {
                    key: "runner_hq_empty_no_access_payoff",
                    label: "HQ leer",
                    value: -3200,
                    reason: "opponent_hand_count:0",
                  },
                ]
              : []),
            {
              key: "runner_hq_pressure",
              label: "HQ-Druck",
              value: 480,
              reason: "central:hq",
            },
          ];
        }
        if (
          evaluation.accessServerId === "rd" &&
          evaluation.recommendation === "run_now"
        ) {
          return [
            {
              key: "runner_rnd_pressure",
              label: "R&D-Druck",
              value: 640,
              reason: "central:rd",
            },
          ];
        }
        if (evaluation.accessServerId === "archives") {
          return semanticRuntimeRunnerArchivesComponents(input, action, server);
        }
        if (dependencies.isRemoteServerTarget(evaluation.accessServerId)) {
          return semanticRuntimeRunnerRemoteComponents(input, action, server);
        }
        return [];
      },
      accessTrashComponents: semanticRuntimeRunnerAccessTrashComponents,
      badPublicityRelevanceScoreComponent:
        runnerBadPublicityRelevanceScoreComponent,
    },
    encounterActionIsViable: dependencies.encounterActionIsViable,
  });
}
