import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";
import {
  runnerRunTargetGuidanceScoreComponent as buildRunnerRunTargetGuidanceScoreComponent,
} from "./runner-run-target-guidance-score";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

export type RunnerRunTargetGuidanceContextDependencies = {
  evaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRunTargetEvaluation | undefined;
  guidanceValue: (evaluation: RunnerRunTargetEvaluation) => number;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  remoteRootTrashCost: (card: VisibleCard) => number | undefined;
};

export type RunnerRunTargetGuidanceContext = {
  semanticRuntimeRunnerRunTargetGuidanceComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function createRunnerRunTargetGuidanceContext(
  dependencies: RunnerRunTargetGuidanceContextDependencies,
): RunnerRunTargetGuidanceContext {
  function semanticRuntimeRunnerRunTargetGuidanceComponent(
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent | undefined {
    return buildRunnerRunTargetGuidanceScoreComponent(input, action, {
      evaluationForAction: dependencies.evaluationForAction,
      guidanceValue: dependencies.guidanceValue,
      visibleHighPayoffRunOverride:
        semanticRuntimeRunnerVisibleHighPayoffRunOverride,
    });
  }

  function semanticRuntimeRunnerVisibleHighPayoffRunOverride(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    if (input.side !== "runner" || action.type !== "start_run") return false;
    const serverId = semanticRuntimeServerId(action);
    if (!serverId || !dependencies.isRemoteServerTarget(serverId)) {
      return false;
    }
    const server = input.playerView.servers.find(
      (entry) => entry.id === serverId,
    );
    if (!server) return false;
    return server.root.some((card) => {
      if (!card.known) return false;
      if (card.type === "agenda") return true;
      if ((card.advancementCounters ?? 0) > 0) return true;
      if (card.type !== "asset" && card.type !== "upgrade") return false;
      const trashCost = dependencies.remoteRootTrashCost(card);
      return (
        trashCost !== undefined &&
        input.playerView.own.credits >= trashCost + 1
      );
    });
  }

  return { semanticRuntimeRunnerRunTargetGuidanceComponent };
}
