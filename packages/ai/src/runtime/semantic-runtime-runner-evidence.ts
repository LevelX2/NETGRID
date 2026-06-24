import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerProgramInstallTrashAssessment } from "./runner-program-install-trash-policy";

type EvidenceAssessment = {
  evidence: string[];
};

export type SemanticRuntimeRunnerEvidenceDependencies = {
  programInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramInstallTrashAssessment | undefined;
  programInstallDisplacementPenalty: (
    assessment: RunnerProgramInstallTrashAssessment | undefined,
  ) => number;
  muPressureActionEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  bankInvestmentCommitmentEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  noRunEconomyCommitmentEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  selfDamageSurvivalAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => EvidenceAssessment | undefined;
  blinkRiskEvidenceForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  loanLiabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => EvidenceAssessment | undefined;
  persistentInstallEvidenceForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  remoteTrashAccessContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => EvidenceAssessment;
};

export function semanticRuntimeRunnerEvidence(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeRunnerEvidenceDependencies,
): string[] {
  if (input.side !== "runner") return [];
  const sacrificeAssessment =
    dependencies.programInstallTrashAssessmentForAction(input, action);
  const actionMuPressureEvidence = dependencies.muPressureActionEvidence(
    input,
    action,
  );
  const bankCommitmentEvidence =
    dependencies.bankInvestmentCommitmentEvidence(input, action);
  const noRunEconomyCommitmentEvidence =
    dependencies.noRunEconomyCommitmentEvidence(input, action);
  const selfDamageSurvivalEvidence =
    dependencies.selfDamageSurvivalAssessment(input, action)?.evidence ?? [];
  const blinkRiskEvidence = dependencies.blinkRiskEvidenceForAction(
    input,
    action,
  );
  const loanLiabilityEvidence =
    dependencies.loanLiabilityAssessment(input, action)?.evidence ?? [];
  const persistentInstallEvidence =
    dependencies.persistentInstallEvidenceForAction(input, action);
  if (sacrificeAssessment?.memoryRequired) {
    return [
      `program_sacrifice_penalty:${dependencies.programInstallDisplacementPenalty(sacrificeAssessment)}`,
      ...sacrificeAssessment.evidence,
      ...actionMuPressureEvidence,
      ...bankCommitmentEvidence,
      ...noRunEconomyCommitmentEvidence,
      ...selfDamageSurvivalEvidence,
      ...blinkRiskEvidence,
      ...loanLiabilityEvidence,
      ...persistentInstallEvidence,
    ];
  }
  if (
    actionMuPressureEvidence.length > 0 ||
    bankCommitmentEvidence.length > 0 ||
    noRunEconomyCommitmentEvidence.length > 0 ||
    selfDamageSurvivalEvidence.length > 0 ||
    blinkRiskEvidence.length > 0 ||
    loanLiabilityEvidence.length > 0 ||
    persistentInstallEvidence.length > 0
  ) {
    return [
      ...actionMuPressureEvidence,
      ...bankCommitmentEvidence,
      ...noRunEconomyCommitmentEvidence,
      ...selfDamageSurvivalEvidence,
      ...blinkRiskEvidence,
      ...loanLiabilityEvidence,
      ...persistentInstallEvidence,
    ];
  }
  if (
    action.type !== "trash_accessed_card" &&
    action.type !== "decline_trash"
  ) {
    return [];
  }
  return dependencies.remoteTrashAccessContext(input, action).evidence;
}
