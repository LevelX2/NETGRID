import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export type RunnerMuPressureScoreBonus<TAssessment> = {
  value: number;
  assessment: TAssessment;
};

export type RunnerMuPressureScoreDependencies<TAssessment> = {
  installPriorityBonus: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMuPressureScoreBonus<TAssessment>;
  fundingPriorityBonus: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMuPressureScoreBonus<TAssessment>;
  reason: (assessment: TAssessment) => string;
};

export function runnerMuPressureInstallScoreComponent<TAssessment>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerMuPressureScoreDependencies<TAssessment>,
): AiDecisionScoreComponent | undefined {
  const bonus = dependencies.installPriorityBonus(input, action);
  if (bonus.value <= 0) return undefined;
  return {
    key: "runner_mu_pressure_memory_support",
    label: "MU-Druck",
    value: bonus.value,
    reason: dependencies.reason(bonus.assessment),
  };
}

export function runnerMuPressureFundingScoreComponent<TAssessment>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerMuPressureScoreDependencies<TAssessment>,
): AiDecisionScoreComponent | undefined {
  const bonus = dependencies.fundingPriorityBonus(input, action);
  if (bonus.value <= 0) return undefined;
  return {
    key: "runner_mu_pressure_funding",
    label: "Memory-Support finanzieren",
    value: bonus.value,
    reason: dependencies.reason(bonus.assessment),
  };
}
