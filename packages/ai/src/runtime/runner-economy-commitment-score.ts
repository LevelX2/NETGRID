import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerBankInvestmentCommitmentScoreAssessment = {
  active: boolean;
  status: string;
  buildActionLegal: boolean;
  buildBankPriority: number;
  cashOutPriority: number;
};

type RunnerNoRunEconomyCommitmentScoreAssessment = {
  active: boolean;
  status: string;
  runBreaksCommitment: boolean;
  noRunCommitmentPenalty: number;
  runOverride?: string;
};

export type RunnerBankInvestmentCommitmentScoreDependencies = {
  assessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerBankInvestmentCommitmentScoreAssessment;
  evidence: (input: AiDecisionInput, action: LegalAction) => string[];
  isBuildAction: (input: AiDecisionInput, action: LegalAction) => boolean;
  isCashOutAction: (input: AiDecisionInput, action: LegalAction) => boolean;
  isInstallAction: (input: AiDecisionInput, action: LegalAction) => boolean;
  runOverride: (input: AiDecisionInput, action: LegalAction) => string | undefined;
};

export type RunnerNoRunEconomyCommitmentScoreDependencies = {
  assessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerNoRunEconomyCommitmentScoreAssessment;
  evidence: (input: AiDecisionInput, action: LegalAction) => string[];
  isInstallAction: (input: AiDecisionInput, action: LegalAction) => boolean;
  isRigInstallAction: (input: AiDecisionInput, action: LegalAction) => boolean;
};

export function runnerBankInvestmentCommitmentScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerBankInvestmentCommitmentScoreDependencies,
): AiDecisionScoreComponent[] {
  if (input.side !== "runner" || action.side !== "runner") return [];
  const assessment = dependencies.assessment(input, action);
  if (!assessment.active && assessment.status === "inactive") return [];
  const evidence = dependencies.evidence(input, action).join("|");

  if (dependencies.isBuildAction(input, action)) {
    return [
      {
        key: "runner_bank_investment_commitment",
        label: "Bank-Commitment",
        value: assessment.buildBankPriority,
        reason: evidence,
      },
    ];
  }

  if (dependencies.isCashOutAction(input, action)) {
    return [
      {
        key: "runner_bank_cashout_gate",
        label: "Bank-Auszahlung",
        value: assessment.cashOutPriority,
        reason: evidence,
      },
    ];
  }

  if (dependencies.isInstallAction(input, action)) {
    const value = assessment.status === "install_deferred" ? -1600 : 350;
    return [
      {
        key: "runner_bank_install_commitment",
        label: "Bank-Install-Commitment",
        value,
        reason: evidence,
      },
    ];
  }

  if (
    action.type === "start_run" &&
    assessment.active &&
    assessment.buildActionLegal &&
    assessment.buildBankPriority > 0
  ) {
    const runOverride = dependencies.runOverride(input, action);
    return [
      {
        key: runOverride
          ? "runner_bank_commitment_run_override"
          : "runner_bank_commitment_build_over_low_run",
        label: "Bank-Commitment vs. Run",
        value: runOverride ? 950 : -1800,
        reason: evidence,
      },
    ];
  }

  return [];
}

export function runnerNoRunEconomyCommitmentScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerNoRunEconomyCommitmentScoreDependencies,
): AiDecisionScoreComponent[] {
  if (input.side !== "runner" || action.side !== "runner") return [];
  const assessment = dependencies.assessment(input, action);
  if (!assessment.active && assessment.status === "inactive") return [];
  const evidence = dependencies.evidence(input, action).join("|");

  if (dependencies.isInstallAction(input, action)) {
    return [
      {
        key: "runner_no_run_economy_install_commitment",
        label: "No-Run-Economy-Install",
        value: assessment.status === "install_deferred" ? -1450 : 420,
        reason: evidence,
      },
    ];
  }

  if (action.type === "start_run" && assessment.runBreaksCommitment) {
    const allowed = assessment.runOverride !== undefined;
    return [
      {
        key: allowed
          ? "runner_no_run_economy_run_override"
          : "runner_no_run_economy_run_penalty",
        label: "No-Run-Economy-Commitment",
        value: allowed ? 950 : assessment.noRunCommitmentPenalty,
        reason: evidence,
      },
    ];
  }

  if (
    assessment.active &&
    (action.type === "gain_credit" ||
      action.type === "draw_card" ||
      dependencies.isRigInstallAction(input, action))
  ) {
    return [
      {
        key: "runner_no_run_economy_setup_hold",
        label: "No-Run-Setup-Hold",
        value: action.type === "draw_card" ? 230 : 310,
        reason: evidence,
      },
    ];
  }

  return [];
}
