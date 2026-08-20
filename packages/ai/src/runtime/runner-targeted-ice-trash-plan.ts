import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";

const PAY_REZ_COST_TO_TRASH_REZZED_ICE = "pay_rez_cost_to_trash_rezzed_ice";
const TRASH_UNREZZED_ICE = "trash_unrezzed_ice";
const TRASH_UNREZZED_ICE_ABILITY_KEY =
  "abilities_on_play_trash_unrezzed_ice";
const ROUTE_OPENING_PAYOFF_FLOOR = 120;

export type RunnerTargetedIceTrashState = "rezzed" | "unrezzed";

export type RunnerTargetedIceTrashCommitment = {
  kind: "targeted_ice_trash";
  sourceActionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  plannedAtStateVersion: number;
  ownerModuleId: "runner.pressure_central" | "runner.contest_remote";
  ownerDedupeKey: string;
  serverId: string;
  targetIceInstanceId: string;
  targetIcePosition: number;
  targetIceState: RunnerTargetedIceTrashState;
  targetRezCost: number;
  evidenceCodes: string[];
};

export type RunnerTargetedIceTrashChoiceContinuation =
  RunnerTargetedIceTrashCommitment & {
    family: "runner_targeted_ice_trash";
    selectedActionId: string;
    selectedAtStateVersion: number;
  };

export type RunnerTargetedIceTrashPlanTarget = {
  ownerModuleId: RunnerTargetedIceTrashCommitment["ownerModuleId"];
  ownerDedupeKey: string;
  serverId: string;
  payoffValue: number;
  knownAgendaThreat?: boolean;
};

type RunnerTargetedIceTrashRoute = {
  commitment: RunnerTargetedIceTrashCommitment;
  score: number;
};

export function runnerActionRequiresTargetedIceTrashPlan(
  candidate: ActionSemanticCandidate,
): boolean {
  return runnerTargetedIceTrashState(candidate) !== undefined;
}

export function runnerTargetedIceTrashState(
  candidate: ActionSemanticCandidate,
): RunnerTargetedIceTrashState | undefined {
  if (
    candidate.actorSide !== "runner" ||
    candidate.semanticActionType !== "play.runner_event"
  ) {
    return undefined;
  }
  const targets = new Set(candidate.effectTargets ?? []);
  if (targets.has(PAY_REZ_COST_TO_TRASH_REZZED_ICE)) return "rezzed";
  if (
    targets.has(TRASH_UNREZZED_ICE) ||
    candidate.abilityKey === TRASH_UNREZZED_ICE_ABILITY_KEY ||
    candidate.targetContext?.targetProfileMatches.some(
      (match) =>
        match.targetProfileId ===
        "use_target:installed_ice:unrezzed_ice_trash",
    )
  ) {
    return "unrezzed";
  }
  return undefined;
}

/**
 * Values a zero-credit targeted ICE removal when deleting one hidden layer
 * leaves an entirely visible route that the current rig can actually reach.
 * The helper does not guess the hidden ICE or create a run action; it only
 * restores the material preparation floor that the unknown layer suppressed
 * in the ordinary run quote.
 */
export function runnerUnrezzedIceTrashRouteOpeningPayoff(
  input: AiDecisionInput,
  serverId: string,
): number {
  if (input.side !== "runner") return 0;
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  if (!server || server.ice.every((ice) => ice.rezzed === true)) return 0;
  const rig = input.playerView.own.rig ?? [];
  const creditBudget = runnerRunPathCreditBudgetWithVisiblePools(
    input.playerView.own.credits,
    rig,
  );
  const opensReachableRoute = server.ice.some((ice, targetPosition) => {
    if (ice.rezzed === true) return false;
    const remainingIce = server.ice.filter(
      (_candidateIce, position) => position !== targetPosition,
    );
    if (
      remainingIce.some(
        (remaining) => remaining.known === false || remaining.rezzed !== true,
      )
    ) {
      return false;
    }
    const remainingPath = assessKnownRezzedIcePath(
      remainingIce,
      rig,
      creditBudget,
      server.root,
      input.playerView.opponent.credits,
    );
    return (
      remainingPath.canReachAccess &&
      (remainingPath.unavoidableVisibleIceHazardCount ?? 0) === 0
    );
  });
  return opensReachableRoute ? ROUTE_OPENING_PAYOFF_FLOOR : 0;
}

export function runnerTargetedIceTrashPlanCommitment(params: {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  planTargets: readonly RunnerTargetedIceTrashPlanTarget[];
}): RunnerTargetedIceTrashCommitment | undefined {
  const { input, candidate } = params;
  const targetIceState = runnerTargetedIceTrashState(candidate);
  if (
    input.side !== "runner" ||
    !runnerActionRequiresTargetedIceTrashPlan(candidate) ||
    !candidate.sourceCardInstanceId ||
    !candidate.sourceDefinitionId ||
    targetIceState === undefined
  ) {
    return undefined;
  }
  const rig = input.playerView.own.rig ?? [];
  const routes = params.planTargets.flatMap<RunnerTargetedIceTrashRoute>(
    (target): RunnerTargetedIceTrashRoute[] => {
    if (target.payoffValue <= 0) return [];
    const server = input.playerView.servers.find(
      (candidateServer) => candidateServer.id === target.serverId,
    );
    if (!server || server.ice.length === 0) return [];
    if (
      target.ownerModuleId === "runner.contest_remote" &&
      target.knownAgendaThreat !== true &&
      server.root.length === 0
    ) {
      return [];
    }
    if (targetIceState === "unrezzed") {
      return server.ice.flatMap((ice, targetIcePosition) => {
        if (ice.rezzed === true) return [];
        const remainingUnrezzedCount = server.ice.filter(
          (candidateIce, index) =>
            index !== targetIcePosition && candidateIce.rezzed !== true,
        ).length;
        const routeNetValue =
          target.payoffValue - remainingUnrezzedCount * 25;
        if (routeNetValue <= 0) return [];
        return [
          {
            commitment: {
              kind: "targeted_ice_trash" as const,
              sourceActionId: candidate.actionId,
              sourceCardInstanceId: candidate.sourceCardInstanceId!,
              sourceDefinitionId: candidate.sourceDefinitionId!,
              plannedAtStateVersion: input.playerView.stateVersion,
              ownerModuleId: target.ownerModuleId,
              ownerDedupeKey: target.ownerDedupeKey,
              serverId: target.serverId,
              targetIceInstanceId: ice.instanceId,
              targetIcePosition,
              targetIceState,
              targetRezCost: 0,
              evidenceCodes: [
                "runner_targeted_ice_trash_preflight:complete",
                `runner_targeted_ice_trash_owner:${target.ownerModuleId}`,
                `runner_targeted_ice_trash_server:${target.serverId}`,
                `runner_targeted_ice_trash_position:${targetIcePosition}`,
                "runner_targeted_ice_trash_state:unrezzed",
                `runner_targeted_ice_trash_remaining_unrezzed:${remainingUnrezzedCount}`,
                `runner_targeted_ice_trash_route_net_value:${routeNetValue}`,
              ],
            },
            score: routeNetValue + targetIcePosition,
          },
        ];
      });
    }
    const originalPathFullyVisible = server.ice.every(
      (ice) => ice.known !== false && ice.rezzed === true,
    );
    if (!originalPathFullyVisible) return [];
    const originalPath = assessKnownRezzedIcePath(
      server.ice,
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(
        input.playerView.own.credits,
        rig,
      ),
      server.root,
      input.playerView.opponent.credits,
    );
    return server.ice.flatMap((ice) => {
      const targetRezCost = ice.rezCost;
      if (
        ice.known === false ||
        ice.rezzed !== true ||
        !Number.isSafeInteger(targetRezCost) ||
        (targetRezCost ?? -1) < 0 ||
        (targetRezCost ?? Number.POSITIVE_INFINITY) >
          input.playerView.own.credits
      ) {
        return [];
      }
      const remainingIce = server.ice.filter(
        (candidateIce) => candidateIce.instanceId !== ice.instanceId,
      );
      if (
        remainingIce.some(
          (remaining) => remaining.known === false || remaining.rezzed !== true,
        )
      ) {
        return [];
      }
      const remainingCredits =
        input.playerView.own.credits - (targetRezCost as number);
      const remainingPath = assessKnownRezzedIcePath(
        remainingIce,
        rig,
        runnerRunPathCreditBudgetWithVisiblePools(remainingCredits, rig),
        server.root,
        input.playerView.opponent.credits,
      );
      if (
        !remainingPath.canReachAccess ||
        (remainingPath.unavoidableVisibleIceHazardCount ?? 0) > 0
      ) {
        return [];
      }
      const originalPathProvenBlocked = !originalPath.canReachAccess;
      const guaranteedVisibleBreakSavings = Math.max(
        0,
        (originalPath.visibleBreakCost ?? 0) -
          (remainingPath.visibleBreakCost ?? 0),
      );
      if (
        !originalPathProvenBlocked &&
        guaranteedVisibleBreakSavings <= (targetRezCost as number)
      ) {
        return [];
      }
      const remainingPathCost = Math.max(
        0,
        remainingPath.visibleBreakCost ?? 0,
      );
      const routeNetValue =
        target.payoffValue -
        ((targetRezCost as number) + remainingPathCost) * 10;
      if (routeNetValue <= 0) return [];
      return [
        {
          commitment: {
            kind: "targeted_ice_trash" as const,
            sourceActionId: candidate.actionId,
            sourceCardInstanceId: candidate.sourceCardInstanceId!,
            sourceDefinitionId: candidate.sourceDefinitionId!,
            plannedAtStateVersion: input.playerView.stateVersion,
            ownerModuleId: target.ownerModuleId,
            ownerDedupeKey: target.ownerDedupeKey,
            serverId: target.serverId,
            targetIceInstanceId: ice.instanceId,
            targetIcePosition: server.ice.findIndex(
              (candidateIce) => candidateIce.instanceId === ice.instanceId,
            ),
            targetIceState,
            targetRezCost: targetRezCost as number,
            evidenceCodes: [
              "runner_targeted_ice_trash_preflight:complete",
              `runner_targeted_ice_trash_owner:${target.ownerModuleId}`,
              `runner_targeted_ice_trash_server:${target.serverId}`,
              `runner_targeted_ice_trash_target:${ice.instanceId}`,
              `runner_targeted_ice_trash_rez_cost:${targetRezCost}`,
              `runner_targeted_ice_trash_original_path_blocked:${originalPathProvenBlocked}`,
              `runner_targeted_ice_trash_guaranteed_savings:${guaranteedVisibleBreakSavings}`,
              `runner_targeted_ice_trash_remaining_path_cost:${remainingPathCost}`,
              `runner_targeted_ice_trash_route_net_value:${routeNetValue}`,
            ],
          },
          score: routeNetValue - remainingIce.length,
        },
      ];
    });
    },
  );
  return routes.sort(
    (left, right) =>
      right.score - left.score ||
      left.commitment.ownerModuleId.localeCompare(
        right.commitment.ownerModuleId,
      ) ||
      left.commitment.ownerDedupeKey.localeCompare(
        right.commitment.ownerDedupeKey,
      ) ||
      left.commitment.serverId.localeCompare(right.commitment.serverId) ||
      left.commitment.targetIceInstanceId.localeCompare(
        right.commitment.targetIceInstanceId,
      ),
  )[0]?.commitment;
}
