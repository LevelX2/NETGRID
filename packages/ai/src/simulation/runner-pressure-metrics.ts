import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import type { KnownPositionMemory } from "../belief-state";
import { centralServerId } from "../runtime/server-target";
import {
  runnerRunPathCreditBudgetWithVisiblePools,
  type KnownRezzedIcePathAssessment,
  type RunnerRunPathCreditBudget,
} from "../visible-run-analysis";
import { centralPressureTargetIsGoodForMetrics } from "./central-pressure-card";
import type {
  RunnerCoveragePressureForMetrics,
  RunnerPressureReadyForMetrics,
  RunnerPressureReadyTargetForMetrics,
} from "./runner-pressure-metric-types";

export type RunnerPressureMetricDependencies = {
  runnerStrategicBreakerTargetForMetrics: (
    server: AiDecisionInput["playerView"]["servers"][number],
  ) => boolean;
  assessKnownRezzedIcePath: (
    iceCards: AiDecisionInput["playerView"]["servers"][number]["ice"],
    rigCards: NonNullable<AiDecisionInput["playerView"]["own"]["rig"]>,
    runnerCredits: number | RunnerRunPathCreditBudget,
    rootCards: AiDecisionInput["playerView"]["servers"][number]["root"],
  ) => KnownRezzedIcePathAssessment;
  knownPositionMemoryForInput: (
    input: AiDecisionInput,
  ) => KnownPositionMemory[];
  definitionTypeForMetrics: (definitionId: string) => string | undefined;
  remoteRootTrashCostForMetrics: (card: VisibleCard) => number | undefined;
  canBreakerDefinitionBreakIce: (
    breakerDefinitionId: string,
    iceDefinitionId: string,
  ) => boolean;
  runnerVisibleIceCreatesCoverageNeedForMetrics: (
    ice: AiDecisionInput["playerView"]["servers"][number]["ice"][number],
  ) => boolean;
  runnerMissingBreakerRolesForMetrics: (definitionId: string) => string[];
  runnerCoverageSearchActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerCoverageRecoveryActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function createRunnerPressureMetricContext(
  dependencies: RunnerPressureMetricDependencies,
) {
  const runnerRemotePressureReadyForMetrics = (
    input: AiDecisionInput,
    server: AiDecisionInput["playerView"]["servers"][number],
    creditsAfterPath: number,
  ): boolean => {
    const hasVisibleScoreThreat = server.root.some(
      (card) =>
        (card.advancementCounters ?? 0) > 0 ||
        (card.known && card.type === "agenda"),
    );
    const knownMemory = dependencies.knownPositionMemoryForInput(input);
    const knownRemoteEntries = knownMemory.filter(
      (entry) =>
        entry.zone === server.id && entry.positionKey.startsWith("root:"),
    );
    const knownAgenda = knownRemoteEntries.some(
      (entry) =>
        dependencies.definitionTypeForMetrics(entry.definitionId) === "agenda",
    );
    const relevantTrash = server.root.some((card) => {
      if (!card.known) return false;
      const trashCost = dependencies.remoteRootTrashCostForMetrics(card);
      if (trashCost === undefined || creditsAfterPath < trashCost + 1)
        return false;
      if (!card.definitionId) return false;
      const type = dependencies.definitionTypeForMetrics(card.definitionId);
      return type === "asset" || type === "upgrade";
    });
    return (
      creditsAfterPath >= (hasVisibleScoreThreat || knownAgenda ? 1 : 2) &&
      (hasVisibleScoreThreat || knownAgenda || relevantTrash)
    );
  };

  const assessRunnerPressureReadyForMetrics = (
    input: AiDecisionInput,
  ): RunnerPressureReadyForMetrics => {
    const readyTargets: RunnerPressureReadyTargetForMetrics[] = [];
    const blockers = new Set<
      | "insufficient_credits"
      | "missing_post_run_reserve"
      | "stale_central"
      | "remote_too_dangerous"
      | "no_valuable_target"
    >();
    let broadReady = false;
    const seen = new Set<string>();
    for (const action of input.legalActions) {
      if (
        action.type !== "start_run" ||
        typeof action.payload?.serverId !== "string"
      )
        continue;
      const serverId = action.payload.serverId;
      if (seen.has(serverId)) continue;
      seen.add(serverId);
      const server = input.playerView.servers.find(
        (candidate) => candidate.id === serverId,
      );
      if (
        !server ||
        !dependencies.runnerStrategicBreakerTargetForMetrics(server)
      )
        continue;
      const assessment = dependencies.assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        runnerRunPathCreditBudgetWithVisiblePools(
          input.playerView.own.credits,
          input.playerView.own.rig ?? [],
        ),
        server.root,
      );
      const visibleBreakCost = assessment.visibleBreakCost ?? 0;
      const creditsAfterPath = assessment.creditsAfterPath;
      if (!assessment.blocked) broadReady = true;
      if (assessment.blocked) {
        blockers.add(
          assessment.unpayableReason === "ice_unaffordable" ||
            assessment.unpayableReason ===
              "later_ice_unaffordable_after_prior_ice_cost"
            ? "insufficient_credits"
            : "no_valuable_target",
        );
        continue;
      }
      if (serverId.startsWith("remote_")) {
        const remoteReady = runnerRemotePressureReadyForMetrics(
          input,
          server,
          creditsAfterPath,
        );
        if (remoteReady) readyTargets.push({ serverId, targetType: "remote" });
        else blockers.add("no_valuable_target");
        continue;
      }
      const central = centralServerId(serverId);
      if (!central) continue;
      if (creditsAfterPath < 1) {
        blockers.add("missing_post_run_reserve");
        continue;
      }
      if (!centralPressureTargetIsGoodForMetrics(input, central)) {
        blockers.add("stale_central");
        continue;
      }
      readyTargets.push({
        serverId,
        targetType: central === "rd" ? "rnd" : central,
      });
    }
    return {
      broadReady,
      readyTargets,
      falsePositive: broadReady && readyTargets.length === 0,
      blockers,
    };
  };

  const assessRunnerCoveragePressureForMetrics = (
    input: AiDecisionInput,
  ): RunnerCoveragePressureForMetrics => {
    const rigCards = input.playerView.own.rig ?? [];
    const gripCards = input.playerView.own.gripOrHq.filter(
      (card) => card.known && card.definitionId,
    );
    const heapCards = input.playerView.own.heapOrArchives.filter(
      (card) => card.known && card.definitionId,
    );
    const missingIceDefinitionIds = new Set<string>();
    const blockedServers = new Set<string>();
    const knownIceBlockedServers = new Set<string>();
    for (const server of input.playerView.servers) {
      if (!dependencies.runnerStrategicBreakerTargetForMetrics(server))
        continue;
      const assessment = dependencies.assessKnownRezzedIcePath(
        server.ice,
        rigCards,
        runnerRunPathCreditBudgetWithVisiblePools(
          input.playerView.own.credits,
          rigCards,
        ),
        server.root,
      );
      const rezzedMissing = assessment.blocked
        ? server.ice
            .filter(
              (ice) =>
                ice.known &&
                ice.rezzed === true &&
                ice.definitionId &&
                dependencies.runnerVisibleIceCreatesCoverageNeedForMetrics(ice),
            )
            .map((ice) => ice.definitionId!)
            .filter(
              (definitionId) =>
                !rigCards.some(
                  (card) =>
                    card.definitionId &&
                    dependencies.canBreakerDefinitionBreakIce(
                      card.definitionId,
                      definitionId,
                    ),
                ),
            )
        : [];
      const knownUnrezzedMissing = server.ice
        .filter(
          (ice) =>
            ice.known &&
            ice.rezzed !== true &&
            ice.definitionId &&
            dependencies.runnerVisibleIceCreatesCoverageNeedForMetrics(ice),
        )
        .map((ice) => ice.definitionId!)
        .filter(
          (definitionId) =>
            !rigCards.some(
              (card) =>
                card.definitionId &&
                dependencies.canBreakerDefinitionBreakIce(
                  card.definitionId,
                  definitionId,
                ),
            ),
        );
      if (rezzedMissing.length > 0) blockedServers.add(server.id);
      if (knownUnrezzedMissing.length > 0)
        knownIceBlockedServers.add(server.id);
      for (const definitionId of [...rezzedMissing, ...knownUnrezzedMissing])
        missingIceDefinitionIds.add(definitionId);
    }
    const missingBreakerRoles = new Set(
      [...missingIceDefinitionIds].flatMap(
        dependencies.runnerMissingBreakerRolesForMetrics,
      ),
    );
    const matchingGripIds = new Set(
      gripCards
        .filter((card) =>
          [...missingIceDefinitionIds].some((iceDefinitionId) =>
            dependencies.canBreakerDefinitionBreakIce(
              card.definitionId!,
              iceDefinitionId,
            ),
          ),
        )
        .map((card) => card.instanceId),
    );
    const heapMatchingBreakerCount = heapCards.filter((card) =>
      [...missingIceDefinitionIds].some((iceDefinitionId) =>
        dependencies.canBreakerDefinitionBreakIce(
          card.definitionId!,
          iceDefinitionId,
        ),
      ),
    ).length;
    const matchingInstallActionIds = new Set(
      input.legalActions
        .filter(
          (candidate) =>
            candidate.type === "install_card" &&
            typeof candidate.source === "string" &&
            matchingGripIds.has(candidate.source),
        )
        .map((candidate) => candidate.actionId),
    );
    const searchActionIds = new Set(
      input.legalActions
        .filter((candidate) =>
          dependencies.runnerCoverageSearchActionForMetrics(input, candidate),
        )
        .map((candidate) => candidate.actionId),
    );
    const recoveryActionIds = new Set(
      input.legalActions
        .filter((candidate) =>
          dependencies.runnerCoverageRecoveryActionForMetrics(input, candidate),
        )
        .filter(() => heapMatchingBreakerCount > 0)
        .map((candidate) => candidate.actionId),
    );
    return {
      blockedServers,
      knownIceBlockedServers,
      missingBreakerRoles,
      matchingInstallActionIds,
      searchActionIds,
      recoveryActionIds,
      heapMatchingBreakerCount,
    };
  };

  return {
    assessRunnerPressureReadyForMetrics,
    assessRunnerCoveragePressureForMetrics,
  };
}
