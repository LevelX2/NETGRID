import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerRecoveryFundingNeedContext = {
  active: boolean;
  reason: string;
};

type RunnerSafeProgressTarget = {
  serverId: string;
  targetType: string;
};

export type RunnerLowValueRecoveryRepeatScoreDependencies = {
  actionLooksLikeRecovery: (input: AiDecisionInput, action: LegalAction) => boolean;
  recentRecoveryActions: (input: AiDecisionInput, action: LegalAction) => number;
  fundingNeedContext: (input: AiDecisionInput) => RunnerRecoveryFundingNeedContext;
  sourceDefinitionId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export type RunnerLateNoFundingCreditRepeatScoreDependencies = {
  recentBasicCreditActions: (input: AiDecisionInput) => number;
  fundingNeedContext: (input: AiDecisionInput) => RunnerRecoveryFundingNeedContext;
  safeProgressTargets: (input: AiDecisionInput) => RunnerSafeProgressTarget[];
};

export type RunnerLateNoFundingCreditSafeProgressTargetsDependencies<
  TTarget extends RunnerSafeProgressTarget,
> = {
  closeout: (input: AiDecisionInput) => {
    opportunity: boolean;
    target?: string | undefined;
  };
  pressureReadyTargets: (input: AiDecisionInput) => TTarget[];
  recentStartRunsOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => number;
};

export function runnerLowValueRecoveryRepeatScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerLowValueRecoveryRepeatScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (!dependencies.actionLooksLikeRecovery(input, action)) return undefined;
  const recentRepeats = dependencies.recentRecoveryActions(input, action);
  if (recentRepeats <= 0) return undefined;
  const fundingNeed = dependencies.fundingNeedContext(input);
  if (fundingNeed.active) return undefined;
  const penalty = Math.min(520, 180 + recentRepeats * 140);
  return {
    key: "runner_low_value_recovery_repeat",
    label: "Recovery-Wiederholung",
    value: -penalty,
    reason: [
      `recent_recovery:${recentRepeats}`,
      "funding_need:false",
      `funding_context:${fundingNeed.reason}`,
      `source:${dependencies.sourceDefinitionId(input, action) || action.type}`,
    ].join("|"),
  };
}

export function runnerLateNoFundingCreditRepeatScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerLateNoFundingCreditRepeatScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "gain_credit") return undefined;
  const recentCredits = dependencies.recentBasicCreditActions(input);
  if (recentCredits <= 0) return undefined;
  const fundingNeed = dependencies.fundingNeedContext(input);
  if (fundingNeed.active) return undefined;
  const pressureReadyTargets = dependencies.safeProgressTargets(input);
  if (pressureReadyTargets.length === 0) return undefined;
  const credits = input.playerView.own.credits;
  if (credits < 3 && recentCredits < 2) return undefined;
  const penalty = Math.min(
    860,
    260 + recentCredits * 180 + Math.max(0, credits - 4) * 60,
  );
  return {
    key: "runner_late_no_funding_credit_repeat",
    label: "Credit-Wiederholung ohne Funding Need",
    value: -penalty,
    reason: [
      `recent_basic_credits:${recentCredits}`,
      "funding_need:false",
      `funding_context:${fundingNeed.reason}`,
      `safe_progress_targets:${pressureReadyTargets
        .map((target) => target.serverId)
        .join(",")}`,
      `safe_progress_target_types:${pressureReadyTargets
        .map((target) => target.targetType)
        .join(",")}`,
      `credits:${credits}`,
    ].join("|"),
  };
}

export function runnerLateNoFundingCreditSafeProgressTargets<
  TTarget extends RunnerSafeProgressTarget,
>(
  input: AiDecisionInput,
  dependencies: RunnerLateNoFundingCreditSafeProgressTargetsDependencies<TTarget>,
): TTarget[] {
  const closeout = dependencies.closeout(input);
  if (!closeout.opportunity || !closeout.target) return [];
  return dependencies.pressureReadyTargets(input).filter((target) => {
    if (dependencies.recentStartRunsOnServer(input, target.serverId) > 0)
      return false;
    return target.serverId === closeout.target;
  });
}
