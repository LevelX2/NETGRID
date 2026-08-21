import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import { socialEngineeringCorpGuessAmount } from "./bid-choice-option";
import { runnerActionRequiresTargetedIceTrashPlan } from "./runner-targeted-ice-trash-plan";

export const SOCIAL_ENGINEERING_DEFINITION_ID = "onr_v1_111_social-engineering";

export type RunnerTargetedBypassCommitment = {
  kind: "targeted_bypass_run";
  sourceActionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: typeof SOCIAL_ENGINEERING_DEFINITION_ID;
  plannedAtStateVersion: number;
  ownerModuleId: "runner.pressure_central" | "runner.contest_remote";
  ownerDedupeKey: string;
  serverId: string;
  icePosition: number;
  visibleIceInstanceId: string;
  intendedHiddenAmount: number;
  expectedCorpGuessAmount: number;
  evidenceCodes: string[];
};

export type RunnerTargetedBypassChoiceContinuation =
  RunnerTargetedBypassCommitment & {
    family: "runner_targeted_bypass";
    selectedActionId: string;
    selectedAtStateVersion: number;
  };

export type RunnerTargetedBypassPlanTarget = {
  ownerModuleId: RunnerTargetedBypassCommitment["ownerModuleId"];
  ownerDedupeKey: string;
  serverId: string;
  payoffValue: number;
  knownAgendaThreat?: boolean;
};

export function runnerActionRequiresTargetedBypassPlan(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.actorSide === "runner" &&
    candidate.semanticActionType === "play.runner_event" &&
    runnerDefinitionRequiresTargetedBypassPlan(candidate.sourceDefinitionId)
  );
}

export function runnerDefinitionRequiresTargetedBypassPlan(
  definitionId: string | undefined,
): boolean {
  return definitionId === SOCIAL_ENGINEERING_DEFINITION_ID;
}

export function runnerGenericDevelopmentMayOwnAction(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    !runnerActionRequiresTargetedBypassPlan(candidate) &&
    !runnerActionRequiresTargetedIceTrashPlan(candidate) &&
    !runnerCandidateStartsRun(candidate) &&
    candidate.tagEffectProfile?.acuteTagRemoval !== true
  );
}

function runnerCandidateStartsRun(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.actorSide === "runner" &&
    candidate.semanticActionType === "play.runner_event" &&
    candidate.runProjectionSummary?.serverId !== undefined &&
    (candidate.functionalEffects ?? []).some(
      (effect) =>
        effect.kind === "future_run_effect" && effect.target === "make_run",
    )
  );
}

export function runnerTargetedBypassPlanCommitment(params: {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  planTargets: readonly RunnerTargetedBypassPlanTarget[];
}): RunnerTargetedBypassCommitment | undefined {
  const { input, candidate } = params;
  if (
    input.side !== "runner" ||
    !runnerActionRequiresTargetedBypassPlan(candidate) ||
    !candidate.sourceCardInstanceId ||
    candidate.costProfile.creditCost === undefined
  ) {
    return undefined;
  }
  const eventCreditCost = candidate.costProfile.creditCost;
  const projectedCredits = Math.max(
    0,
    input.playerView.own.credits - Math.max(0, eventCreditCost),
  );
  const expectedCorpGuessAmount = socialEngineeringCorpGuessAmount(
    input.difficulty,
    projectedCredits,
  );
  const intendedHiddenAmount = Array.from(
    { length: Math.max(0, projectedCredits - 1) },
    (_unused, index) => index + 2,
  ).find((amount) => amount !== expectedCorpGuessAmount);
  if (intendedHiddenAmount === undefined) return undefined;
  const rig = input.playerView.own.rig ?? [];
  const routes = params.planTargets.flatMap((target) => {
    if (target.payoffValue < 120) return [];
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
    const originalPathFullyVisible = server.ice.every(
      (ice) => ice.known !== false && ice.rezzed === true,
    );
    const originalPath = assessKnownRezzedIcePath(
      server.ice,
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(
        input.playerView.own.credits,
        rig,
      ),
      server.root,
    );
    return server.ice.flatMap((ice, icePosition) => {
      const remainingIce = server.ice.filter(
        (_candidateIce, candidatePosition) => candidatePosition !== icePosition,
      );
      if (
        remainingIce.some(
          (remaining) => remaining.known === false || remaining.rezzed !== true,
        )
      ) {
        return [];
      }
      const remainingPath = assessKnownRezzedIcePath(
        remainingIce,
        rig,
        runnerRunPathCreditBudgetWithVisiblePools(projectedCredits, rig),
        server.root,
      );
      if (
        !remainingPath.canReachAccess ||
        (remainingPath.unavoidableVisibleIceHazardCount ?? 0) > 0
      ) {
        return [];
      }
      const eventCost = Math.max(0, eventCreditCost);
      const originalPathProvenBlocked =
        originalPathFullyVisible && !originalPath.canReachAccess;
      const guaranteedVisibleBreakSavings = Math.max(
        0,
        (originalPath.visibleBreakCost ?? 0) -
          (remainingPath.visibleBreakCost ?? 0),
      );
      const minimumMaterialSavings = eventCost + intendedHiddenAmount + 2;
      if (!originalPathProvenBlocked) return [];
      const routeNetValue =
        target.payoffValue -
        (eventCost +
          intendedHiddenAmount +
          Math.max(0, remainingPath.visibleBreakCost ?? 0)) *
          10;
      if (routeNetValue <= 0) return [];
      return [
        {
          commitment: {
            kind: "targeted_bypass_run" as const,
            sourceActionId: candidate.actionId,
            sourceCardInstanceId: candidate.sourceCardInstanceId!,
            sourceDefinitionId:
              SOCIAL_ENGINEERING_DEFINITION_ID as typeof SOCIAL_ENGINEERING_DEFINITION_ID,
            plannedAtStateVersion: input.playerView.stateVersion,
            ownerModuleId: target.ownerModuleId,
            ownerDedupeKey: target.ownerDedupeKey,
            serverId: target.serverId,
            icePosition,
            visibleIceInstanceId: ice.instanceId,
            intendedHiddenAmount,
            expectedCorpGuessAmount,
            evidenceCodes: [
              "runner_targeted_bypass_preflight:complete",
              `runner_targeted_bypass_owner:${target.ownerModuleId}`,
              `runner_targeted_bypass_server:${target.serverId}`,
              `runner_targeted_bypass_ice_position:${icePosition}`,
              `runner_targeted_bypass_original_path_blocked:${originalPathProvenBlocked}`,
              `runner_targeted_bypass_guaranteed_savings:${guaranteedVisibleBreakSavings}`,
              `runner_targeted_bypass_required_savings:${minimumMaterialSavings}`,
              `runner_targeted_bypass_hidden_amount:${intendedHiddenAmount}`,
              `runner_targeted_bypass_expected_guess:${expectedCorpGuessAmount}`,
              `runner_targeted_bypass_remaining_path_cost:${remainingPath.visibleBreakCost ?? 0}`,
              `runner_targeted_bypass_route_net_value:${routeNetValue}`,
            ],
          },
          score: routeNetValue - remainingIce.length,
        },
      ];
    });
  });
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
      left.commitment.icePosition - right.commitment.icePosition,
  )[0]?.commitment;
}
