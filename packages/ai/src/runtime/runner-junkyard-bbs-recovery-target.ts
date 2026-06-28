import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { rolesHaveBreakerRole } from "./breaker-role-match";
import { rolesMatch } from "./role-match";

export type RunnerJunkyardBbsRecoveryActionDependencies = {
  junkyardBbsDefinitionId: string;
  returnTopHeapAbility: string;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function runnerJunkyardBbsRecoveryAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerJunkyardBbsRecoveryActionDependencies,
): boolean {
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  if (action.type === "activated_card_ability") {
    return sourceDefinitionId === dependencies.junkyardBbsDefinitionId;
  }
  return (
    action.type === "trigger_ability" &&
    action.payload?.resourceAbility === dependencies.returnTopHeapAbility &&
    sourceDefinitionId === dependencies.junkyardBbsDefinitionId
  );
}

export type RunnerJunkyardBbsRecoveryTargetDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
};

export function runnerJunkyardBbsRecoveryTarget(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerJunkyardBbsRecoveryTargetDependencies,
): VisibleCard | undefined {
  const targetCardId =
    typeof action.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : undefined;
  if (targetCardId) return dependencies.findVisibleCard(input, targetCardId);
  return input.playerView.own.heapOrArchives.find((card) => card.known);
}

type RunnerRecoveryFundingNeedContext = {
  active: boolean;
  reason: string;
};

export type RunnerJunkyardBbsRecoveryTargetAssessmentDependencies = {
  cardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    target: VisibleCard,
  ) => boolean;
  isRunnerPressureRole: (role: string) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
  fundingNeedContext: (input: AiDecisionInput) => RunnerRecoveryFundingNeedContext;
  badPublicityOrTraceTechCard: (
    target: VisibleCard | undefined,
    targetRoles: readonly string[],
  ) => boolean;
};

export function runnerJunkyardBbsRecoveryTargetAssessment(
  input: AiDecisionInput,
  target: VisibleCard | undefined,
  targetDefinitionId: string | undefined,
  targetRoles: readonly string[],
  dependencies: RunnerJunkyardBbsRecoveryTargetAssessmentDependencies,
): { value: number; evidence: string[] } {
  if (!targetDefinitionId) {
    return { value: 0, evidence: ["target_class:unknown"] };
  }
  const values: Array<{ value: number; evidence: string }> = [];
  if (target && dependencies.cardAddressesVisibleBreakerNeed(input, target)) {
    values.push({
      value: 1350,
      evidence: "target_class:missing_breaker_coverage",
    });
  } else if (rolesHaveBreakerRole(targetRoles)) {
    values.push({
      value: 80,
      evidence: "target_class:breaker_no_visible_need",
    });
  }
  if (rolesMatch(targetRoles, ["memory", "memory_support"])) {
    const memoryRemaining =
      (input.playerView.own.memoryLimit ?? 0) -
      (input.playerView.own.memoryUsed ?? 0);
    values.push({
      value: memoryRemaining <= 1 ? 780 : 420,
      evidence: `target_class:memory_support:memory_remaining:${memoryRemaining}`,
    });
  }
  if (targetRoles.some((role) => dependencies.isRunnerPressureRole(role))) {
    values.push({ value: 650, evidence: "target_class:pressure" });
  }
  if (targetRoles.some((role) => dependencies.isRunnerEconomyRole(role))) {
    const fundingNeed = dependencies.fundingNeedContext(input);
    values.push({
      value: fundingNeed.active
        ? 900
        : input.playerView.own.credits < 5
          ? 420
          : 120,
      evidence: `target_class:economy:funding_need:${fundingNeed.active}:${fundingNeed.reason}`,
    });
  }
  if (rolesMatch(targetRoles, ["setup", "build_rig"])) {
    const rigSize = input.playerView.own.rig?.length ?? 0;
    values.push({
      value: rigSize <= 1 ? 180 : 80,
      evidence: `target_class:setup:rig_size:${rigSize}`,
    });
  }
  if (dependencies.badPublicityOrTraceTechCard(target, targetRoles)) {
    values.push({
      value: 430,
      evidence: "target_class:bad_publicity_or_trace",
    });
  }

  const duplicatePenalty = runnerJunkyardBbsRecoveredDefinitionAlreadyHeld(
    input,
    targetDefinitionId,
  )
    ? 180
    : 0;
  const best = values.sort((left, right) => right.value - left.value)[0] ?? {
    value: 80,
    evidence: "target_class:low_value",
  };
  const value = Math.max(0, best.value - duplicatePenalty);
  return {
    value,
    evidence: [
      best.evidence,
      ...(duplicatePenalty > 0
        ? [`target_duplicate_penalty:${duplicatePenalty}`]
        : []),
    ],
  };
}

function runnerJunkyardBbsRecoveredDefinitionAlreadyHeld(
  input: AiDecisionInput,
  targetDefinitionId: string,
): boolean {
  return [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
  ].some((card) => card.known && card.definitionId === targetDefinitionId);
}
