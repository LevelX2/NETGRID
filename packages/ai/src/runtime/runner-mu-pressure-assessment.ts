import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import type { RunnerMuPressureAssessment } from "./runner-mu-pressure-policy";

type ProgramSacrificeCandidateLike = {
  category?: string;
};

type ProgramInstallTrashAssessmentLike = {
  memoryRequired: boolean;
  canFreeRequiredMemory: boolean;
  selectedCandidates: readonly ProgramSacrificeCandidateLike[];
  candidates: readonly ProgramSacrificeCandidateLike[];
};

export type RunnerMuPressureAssessmentDependencies = {
  safeNonNegativeInteger: (value: number | undefined) => number;
  isProgramInstallAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  visibleMemoryCostForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  programInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => ProgramInstallTrashAssessmentLike | undefined;
  isUsefulProgramInHand: (input: AiDecisionInput, card: VisibleCard) => boolean;
  isMemorySupportAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  actionCreditCost: (action: LegalAction) => number;
  isMemorySupportCard: (card: VisibleCard) => boolean;
  missingCreditsForCheapestMemorySupport: (
    input: AiDecisionInput,
    memorySupportCardsInHand: readonly VisibleCard[],
  ) => number | undefined;
  memorySupportSearchAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  severity: (context: {
    memoryAvailable: number;
    pendingProgramInstallMemory: number;
    requiresProgramTrash: boolean;
    criticalProgramSacrificeRisk: boolean;
    usefulProgramsInHand: number;
    memorySupportInHand: number;
    memorySupportLegalActions: number;
  }) => RunnerMuPressureAssessment["severity"];
  evidence: (
    assessment: Omit<RunnerMuPressureAssessment, "evidence">,
  ) => string[];
};

export function runnerMuPressureAssessment(
  input: AiDecisionInput,
  dependencies: RunnerMuPressureAssessmentDependencies,
): RunnerMuPressureAssessment {
  const memoryUsed = dependencies.safeNonNegativeInteger(
    input.playerView.own.memoryUsed,
  );
  const memoryLimit = dependencies.safeNonNegativeInteger(
    input.playerView.own.memoryLimit,
  );
  const memoryAvailable = Math.max(0, memoryLimit - memoryUsed);
  const installActions = input.legalActions.filter(
    (action) => action.side === "runner" && action.type === "install_card",
  );
  const programInstallActions = installActions.filter((action) =>
    dependencies.isProgramInstallAction(input, action),
  );
  const pendingProgramInstallMemory = Math.max(
    0,
    ...programInstallActions.map((action) =>
      dependencies.visibleMemoryCostForAction(input, action),
    ),
  );
  const muAfterInstall = Math.max(
    0,
    memoryUsed + pendingProgramInstallMemory - memoryLimit,
  );
  const sacrificeAssessments = programInstallActions
    .map((action) =>
      dependencies.programInstallTrashAssessmentForAction(input, action),
    )
    .filter(
      (
        assessment,
      ): assessment is ProgramInstallTrashAssessmentLike =>
        assessment !== undefined,
    );
  const requiresProgramTrash =
    sacrificeAssessments.some((assessment) => assessment.memoryRequired) ||
    programInstallActions.some(
      (action) =>
        dependencies.visibleMemoryCostForAction(input, action) >
        memoryAvailable,
    );
  const criticalProgramSacrificeRisk = sacrificeAssessments.some(
    (assessment) => {
      const bestCandidate =
        assessment.selectedCandidates[0] ?? assessment.candidates[0];
      return (
        assessment.memoryRequired &&
        (!assessment.canFreeRequiredMemory ||
          bestCandidate?.category === "critical" ||
          bestCandidate?.category === "high")
      );
    },
  );
  const usefulProgramsInHand = input.playerView.own.gripOrHq.filter((card) =>
    dependencies.isUsefulProgramInHand(input, card),
  ).length;
  const memorySupportLegalActions = installActions.filter((action) =>
    dependencies.isMemorySupportAction(input, action),
  );
  const affordableMemorySupportActions = memorySupportLegalActions.filter(
    (action) => dependencies.actionCreditCost(action) <= input.playerView.own.credits,
  );
  const memorySupportCardsInHand = input.playerView.own.gripOrHq.filter(
    (card) => dependencies.isMemorySupportCard(card),
  );
  const missingCreditsForCheapestMemorySupport =
    affordableMemorySupportActions.length > 0
      ? undefined
      : dependencies.missingCreditsForCheapestMemorySupport(
          input,
          memorySupportCardsInHand,
        );
  const memorySupportSearchable = input.legalActions.some((action) =>
    dependencies.memorySupportSearchAction(input, action),
  );
  const severity = dependencies.severity({
    memoryAvailable,
    pendingProgramInstallMemory,
    requiresProgramTrash,
    criticalProgramSacrificeRisk,
    usefulProgramsInHand,
    memorySupportInHand: memorySupportCardsInHand.length,
    memorySupportLegalActions: memorySupportLegalActions.length,
  });
  const evidence = dependencies.evidence({
    memoryUsed,
    memoryLimit,
    memoryAvailable,
    pendingProgramInstallMemory,
    muAfterInstall,
    requiresProgramTrash,
    criticalProgramSacrificeRisk,
    usefulProgramsInHand,
    memorySupportLegalActions: memorySupportLegalActions.length,
    affordableMemorySupportActions: affordableMemorySupportActions.length,
    memorySupportInHand: memorySupportCardsInHand.length,
    memorySupportSearchable,
    ...(missingCreditsForCheapestMemorySupport !== undefined
      ? { missingCreditsForCheapestMemorySupport }
      : {}),
    severity,
  });
  return {
    memoryUsed,
    memoryLimit,
    memoryAvailable,
    pendingProgramInstallMemory,
    muAfterInstall,
    requiresProgramTrash,
    criticalProgramSacrificeRisk,
    usefulProgramsInHand,
    memorySupportLegalActions: memorySupportLegalActions.length,
    affordableMemorySupportActions: affordableMemorySupportActions.length,
    memorySupportInHand: memorySupportCardsInHand.length,
    memorySupportSearchable,
    ...(missingCreditsForCheapestMemorySupport !== undefined
      ? { missingCreditsForCheapestMemorySupport }
      : {}),
    severity,
    evidence,
  };
}
