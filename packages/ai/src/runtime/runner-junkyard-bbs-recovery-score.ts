import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

type RunnerJunkyardBbsRecoveryTargetAssessment = {
  value: number;
  evidence: string[];
};

export type RunnerJunkyardBbsRecoveryScoreDependencies = {
  isRecoveryAction: (input: AiDecisionInput, action: LegalAction) => boolean;
  target: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  targetAssessment: (
    input: AiDecisionInput,
    target: VisibleCard | undefined,
    targetDefinitionId: string | undefined,
    targetRoles: readonly string[],
  ) => RunnerJunkyardBbsRecoveryTargetAssessment;
  actionClickCost: (action: LegalAction) => number;
  actionCreditCost: (action: LegalAction) => number;
};

export function runnerJunkyardBbsRecoveryScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerJunkyardBbsRecoveryScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (!dependencies.isRecoveryAction(input, action)) return undefined;

  const target = dependencies.target(input, action);
  const targetDefinitionId = target?.definitionId;
  const targetRoles = dependencies.rolesForCardId(targetDefinitionId);
  const targetAssessment = dependencies.targetAssessment(
    input,
    target,
    targetDefinitionId,
    targetRoles,
  );
  const clickCost = dependencies.actionClickCost(action);
  const creditCost = dependencies.actionCreditCost(action);
  const actionOpportunityCost = 700 + clickCost * 130 + creditCost * 110;
  const value = targetAssessment.value - actionOpportunityCost;
  return {
    key: "runner_junkyard_bbs_recovery_target",
    label: "Junkyard-BBS-Zielwert",
    value,
    reason: sortedUnique([
      `target:${targetDefinitionId ?? "unknown"}`,
      `target_value:${targetAssessment.value}`,
      `opportunity_cost:${actionOpportunityCost}`,
      `click_cost:${clickCost}`,
      `credit_cost:${creditCost}`,
      ...targetAssessment.evidence,
    ]).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
