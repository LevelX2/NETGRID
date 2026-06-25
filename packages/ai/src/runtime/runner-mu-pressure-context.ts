import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { runnerMuPressureAssessment as buildRunnerMuPressureAssessment } from "./runner-mu-pressure-assessment";
import { runnerMuPressureActionEvidence as buildRunnerMuPressureActionEvidence } from "./runner-mu-pressure-action-evidence";
import {
  runnerMuPressureFundingScoreComponent as buildRunnerMuPressureFundingScoreComponent,
  runnerMuPressureInstallScoreComponent as buildRunnerMuPressureInstallScoreComponent,
} from "./runner-mu-pressure-score";
import {
  runnerMuPressureEvidence,
  runnerMuPressureReason,
  runnerMuPressureSeverity,
  runnerMuPressureSeverityBonus,
  runnerMuPressureSeverityFundingBonus,
  type RunnerMuPressureAssessment,
} from "./runner-mu-pressure-policy";
import {
  isRunnerMemorySupportAction as buildIsRunnerMemorySupportAction,
  isRunnerMemorySupportCard as buildIsRunnerMemorySupportCard,
  isRunnerProgramInstallActionForMuPressure as buildIsRunnerProgramInstallActionForMuPressure,
  isUsefulRunnerProgramInHandForMuPressure as buildIsUsefulRunnerProgramInHandForMuPressure,
  runnerMemorySupportSearchAction as buildRunnerMemorySupportSearchAction,
  runnerMissingCreditsForCheapestMemorySupport as buildRunnerMissingCreditsForCheapestMemorySupport,
} from "./runner-mu-pressure-memory-support";

type RunnerMuPressureProgramTrashAssessment = {
  memoryRequired: boolean;
  canFreeRequiredMemory: boolean;
  selectedCandidates: readonly { category?: string }[];
  candidates: readonly { category?: string }[];
};

export type RunnerMuPressureContextDependencies = {
  safeNonNegativeInteger: (value: number | undefined) => number;
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  visibleMemoryCost: (card: VisibleCard | undefined) => number;
  visibleInstallCost: (card: VisibleCard | undefined) => number;
  programInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMuPressureProgramTrashAssessment | undefined;
  actionCreditCost: (action: LegalAction) => number;
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  isRunnerPressureRole: (role: string) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
};

export type RunnerMuPressurePriorityBonus = {
  value: number;
  evidence: string[];
  assessment: RunnerMuPressureAssessment;
};

export type RunnerMuPressureContext = {
  runnerMuPressureAssessment: (
    input: AiDecisionInput,
  ) => RunnerMuPressureAssessment;
  runnerMuPressureInstallScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  runnerMuPressureFundingScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  runnerMuPressureInstallPriorityBonus: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMuPressurePriorityBonus;
  runnerMuPressureFundingPriorityBonus: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMuPressurePriorityBonus;
  runnerMuPressureActionEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
    providedAssessment?: RunnerMuPressureAssessment,
  ) => string[];
  isRunnerProgramInstallActionForMuPressure: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerMemorySupportAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function createRunnerMuPressureContext(
  dependencies: RunnerMuPressureContextDependencies,
): RunnerMuPressureContext {
  function runnerMuPressureAssessment(
    input: AiDecisionInput,
  ): RunnerMuPressureAssessment {
    return buildRunnerMuPressureAssessment(input, {
      safeNonNegativeInteger: dependencies.safeNonNegativeInteger,
      isProgramInstallAction: isRunnerProgramInstallActionForMuPressure,
      visibleMemoryCostForAction: (runtimeInput, action) =>
        dependencies.visibleMemoryCost(
          dependencies.findVisibleCard(runtimeInput, action.source),
        ),
      programInstallTrashAssessmentForAction:
        dependencies.programInstallTrashAssessmentForAction,
      isUsefulProgramInHand: isUsefulRunnerProgramInHandForMuPressure,
      isMemorySupportAction: isRunnerMemorySupportAction,
      actionCreditCost: dependencies.actionCreditCost,
      isMemorySupportCard: isRunnerMemorySupportCard,
      missingCreditsForCheapestMemorySupport,
      memorySupportSearchAction,
      severity: runnerMuPressureSeverity,
      evidence: runnerMuPressureEvidence,
    });
  }

  function runnerMuPressureInstallScoreComponent(
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent | undefined {
    return buildRunnerMuPressureInstallScoreComponent(input, action, {
      installPriorityBonus: runnerMuPressureInstallPriorityBonus,
      fundingPriorityBonus: runnerMuPressureFundingPriorityBonus,
      reason: runnerMuPressureReason,
    });
  }

  function runnerMuPressureFundingScoreComponent(
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent | undefined {
    return buildRunnerMuPressureFundingScoreComponent(input, action, {
      installPriorityBonus: runnerMuPressureInstallPriorityBonus,
      fundingPriorityBonus: runnerMuPressureFundingPriorityBonus,
      reason: runnerMuPressureReason,
    });
  }

  function runnerMuPressureInstallPriorityBonus(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerMuPressurePriorityBonus {
    const assessment = runnerMuPressureAssessment(input);
    if (
      assessment.severity === "none" ||
      !isRunnerMemorySupportAction(input, action)
    ) {
      return { value: 0, evidence: [], assessment };
    }
    const severityBonus = runnerMuPressureSeverityBonus(assessment.severity);
    const value = Math.min(
      1500,
      severityBonus +
        Math.min(260, assessment.usefulProgramsInHand * 90) +
        (assessment.requiresProgramTrash ? 240 : 0) +
        (assessment.affordableMemorySupportActions > 0 ? 120 : 0),
    );
    return {
      value,
      evidence: [
        `runner_mu_pressure_bonus:${value}`,
        "runner_memory_support_action:true",
        ...runnerMuPressureActionEvidence(input, action, assessment),
      ],
      assessment,
    };
  }

  function runnerMuPressureFundingPriorityBonus(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerMuPressurePriorityBonus {
    const assessment = runnerMuPressureAssessment(input);
    if (
      action.side !== "runner" ||
      action.type !== "gain_credit" ||
      assessment.severity === "none" ||
      assessment.missingCreditsForCheapestMemorySupport === undefined
    ) {
      return { value: 0, evidence: [], assessment };
    }
    const severityBonus = runnerMuPressureSeverityFundingBonus(
      assessment.severity,
    );
    const value = Math.min(
      1100,
      severityBonus + Math.min(180, assessment.usefulProgramsInHand * 60),
    );
    return {
      value,
      evidence: [
        `runner_mu_pressure_funding_bonus:${value}`,
        "runner_memory_support_funding_action:true",
        ...runnerMuPressureActionEvidence(input, action, assessment),
      ],
      assessment,
    };
  }

  function runnerMuPressureActionEvidence(
    input: AiDecisionInput,
    action: LegalAction,
    providedAssessment?: RunnerMuPressureAssessment,
  ): string[] {
    return buildRunnerMuPressureActionEvidence(
      input,
      action,
      providedAssessment,
      {
        assessment: runnerMuPressureAssessment,
        isMemorySupportAction: isRunnerMemorySupportAction,
        isProgramInstallAction: isRunnerProgramInstallActionForMuPressure,
      },
    );
  }

  function isRunnerProgramInstallActionForMuPressure(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    return buildIsRunnerProgramInstallActionForMuPressure(
      action,
      dependencies.findVisibleCard(input, action.source),
      dependencies.visibleMemoryCost,
    );
  }

  function isRunnerMemorySupportAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    return buildIsRunnerMemorySupportAction(
      action,
      dependencies.findVisibleCard(input, action.source),
      isRunnerMemorySupportCard,
    );
  }

  function isRunnerMemorySupportCard(card: VisibleCard | undefined): boolean {
    return buildIsRunnerMemorySupportCard(
      card,
      card ? dependencies.rolesForCardId(card.definitionId) : [],
      dependencies.safeNonNegativeInteger,
    );
  }

  function isUsefulRunnerProgramInHandForMuPressure(
    input: AiDecisionInput,
    card: VisibleCard,
  ): boolean {
    return buildIsUsefulRunnerProgramInHandForMuPressure(input, card, {
      visibleMemoryCost: dependencies.visibleMemoryCost,
      rolesForCardId: dependencies.rolesForCardId,
      isRunnerPressureRole: dependencies.isRunnerPressureRole,
      isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    });
  }

  function missingCreditsForCheapestMemorySupport(
    input: AiDecisionInput,
    memorySupportCards: readonly VisibleCard[],
  ): number | undefined {
    return buildRunnerMissingCreditsForCheapestMemorySupport(
      input.playerView.own.credits,
      memorySupportCards,
      dependencies.visibleInstallCost,
    );
  }

  function memorySupportSearchAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    return buildRunnerMemorySupportSearchAction(
      action,
      dependencies.rolesForAction(input, action),
    );
  }

  return {
    runnerMuPressureAssessment,
    runnerMuPressureInstallScoreComponent,
    runnerMuPressureFundingScoreComponent,
    runnerMuPressureInstallPriorityBonus,
    runnerMuPressureFundingPriorityBonus,
    runnerMuPressureActionEvidence,
    isRunnerProgramInstallActionForMuPressure,
    isRunnerMemorySupportAction,
  };
}
