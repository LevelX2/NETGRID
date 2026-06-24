import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import {
  runnerRecentBasicCreditActions,
  runnerRecentStartRunsOnServer,
} from "./runner-run-history";
import { runnerLateNoFundingCreditSafeProgressTargets } from "./runner-recovery-repeat-score";

type RunnerSafeProgressTarget = {
  serverId: string;
  targetType: string;
};

export type RunnerRecentHistoryContextDependencies<
  TTarget extends RunnerSafeProgressTarget,
> = {
  publicHistory: (input: AiDecisionInput) => readonly PublicGameEvent[];
  eventVersion: (event: PublicGameEvent) => number;
  serverIdFromEvent: (event: PublicGameEvent) => string | undefined;
  closeout: (input: AiDecisionInput) => {
    opportunity: boolean;
    target?: string | undefined;
  };
  pressureReadyTargets: (input: AiDecisionInput) => TTarget[];
};

export type RunnerRecentHistoryContext<TTarget extends RunnerSafeProgressTarget> = {
  runnerLateNoFundingCreditSafeProgressTargets: (
    input: AiDecisionInput,
  ) => TTarget[];
  semanticRuntimeRecentRunnerBasicCreditActions: (
    input: AiDecisionInput,
  ) => number;
  semanticRuntimeRecentRunnerStartRunsOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => number;
};

export function createRunnerRecentHistoryContext<
  TTarget extends RunnerSafeProgressTarget,
>(
  dependencies: RunnerRecentHistoryContextDependencies<TTarget>,
): RunnerRecentHistoryContext<TTarget> {
  const historyDependencies = {
    publicHistory: dependencies.publicHistory,
    eventVersion: dependencies.eventVersion,
    serverIdFromEvent: dependencies.serverIdFromEvent,
  };

  function recentStartRunsOnServer(
    input: AiDecisionInput,
    serverId: string,
  ): number {
    return runnerRecentStartRunsOnServer(input, serverId, historyDependencies);
  }

  return {
    runnerLateNoFundingCreditSafeProgressTargets: (input) =>
      runnerLateNoFundingCreditSafeProgressTargets(input, {
        closeout: dependencies.closeout,
        pressureReadyTargets: dependencies.pressureReadyTargets,
        recentStartRunsOnServer,
      }),
    semanticRuntimeRecentRunnerBasicCreditActions: (input) =>
      runnerRecentBasicCreditActions(input, historyDependencies),
    semanticRuntimeRecentRunnerStartRunsOnServer: recentStartRunsOnServer,
  };
}
