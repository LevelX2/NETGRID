import {
  createSemanticRuntimeChoiceBuilderContext,
} from "./semantic-runtime-choice-builder-context";
import type { SemanticRuntimeChoiceBuilderDependencies } from "./semantic-runtime-choice-builder";
import {
  createSemanticRuntimeEvidenceContext,
} from "./semantic-runtime-evidence-context";
import type { SemanticRuntimeEvidenceDependencies } from "./semantic-runtime-evidence";
import {
  createSemanticRuntimeRunnerEvidenceComposition,
} from "./semantic-runtime-runner-evidence-composition";
import type { SemanticRuntimeRunnerEvidenceDependencies } from "./semantic-runtime-runner-evidence";
import {
  createSemanticRuntimeScoreBreakdownContext,
  type SemanticRuntimeScoreBreakdownContextDependencies,
} from "./semantic-runtime-score-breakdown";

export type SemanticRuntimeChoiceCompositionDependencies =
  SemanticRuntimeScoreBreakdownContextDependencies &
    Omit<SemanticRuntimeEvidenceDependencies, "runnerEvidence"> &
    SemanticRuntimeRunnerEvidenceDependencies &
    Omit<
      SemanticRuntimeChoiceBuilderDependencies,
      "scoreBreakdown" | "evidence"
    >;

export function createSemanticRuntimeChoiceComposition(
  dependencies: SemanticRuntimeChoiceCompositionDependencies,
) {
  const { semanticRuntimeScoreBreakdown } =
    createSemanticRuntimeScoreBreakdownContext({
      runnerComponents: dependencies.runnerComponents,
      corpComponents: dependencies.corpComponents,
      actionCreditCost: dependencies.actionCreditCost,
    });

  const { semanticRuntimeRunnerEvidence } =
    createSemanticRuntimeRunnerEvidenceComposition({
      programInstallTrashAssessmentForAction:
        dependencies.programInstallTrashAssessmentForAction,
      programInstallDisplacementPenalty:
        dependencies.programInstallDisplacementPenalty,
      muPressureActionEvidence: dependencies.muPressureActionEvidence,
      bankInvestmentCommitmentEvidence:
        dependencies.bankInvestmentCommitmentEvidence,
      noRunEconomyCommitmentEvidence:
        dependencies.noRunEconomyCommitmentEvidence,
      selfDamageSurvivalAssessment:
        dependencies.selfDamageSurvivalAssessment,
      blinkRiskEvidenceForAction: dependencies.blinkRiskEvidenceForAction,
      loanLiabilityAssessment: dependencies.loanLiabilityAssessment,
      persistentInstallEvidenceForAction:
        dependencies.persistentInstallEvidenceForAction,
      remoteTrashAccessContext: dependencies.remoteTrashAccessContext,
    });

  const { semanticRuntimeEvidence } = createSemanticRuntimeEvidenceContext({
    serverId: dependencies.serverId,
    runnerEvidence: semanticRuntimeRunnerEvidence,
    corpEvidence: dependencies.corpEvidence,
  });

  const { semanticRuntimeChoices } = createSemanticRuntimeChoiceBuilderContext({
    scope: dependencies.scope,
    actionExclusion: dependencies.actionExclusion,
    scoreBreakdown: semanticRuntimeScoreBreakdown,
    actionCreditCost: dependencies.actionCreditCost,
    evidence: semanticRuntimeEvidence,
    explanation: dependencies.explanation,
    compareAction: dependencies.compareAction,
  });

  return {
    semanticRuntimeScoreBreakdown,
    semanticRuntimeChoices,
  };
}
