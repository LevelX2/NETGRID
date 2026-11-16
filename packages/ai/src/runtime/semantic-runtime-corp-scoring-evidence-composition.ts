import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { createSemanticRuntimeCorpAdvancementCounterContext } from "./semantic-runtime-corp-advancement-counter-context";
import type { SemanticRuntimeCorpAdvancementCounterDependencies } from "./semantic-runtime-corp-advancement-counter";
import { createSemanticRuntimeCorpPassiveScoreLineContext } from "./semantic-runtime-corp-passive-scoreline-context";
import type { SemanticRuntimeCorpPassiveScoreLineDependencies } from "./semantic-runtime-corp-passive-scoreline";
import { createSemanticRuntimeCorpScoreSafetyContext } from "./semantic-runtime-corp-score-safety-context";
import type { SemanticRuntimeCorpScoreSafetyDependencies } from "./semantic-runtime-corp-score-safety";
import { createSemanticRuntimeCorpScoreComponents } from "./semantic-runtime-corp-score-context";
import type { SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";
import type { CorpScorelineWindowAssessment } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";

export type SemanticRuntimeCorpScoringEvidenceCompositionDependencies<
  TConsumer extends string,
> = SemanticRuntimeCorpAdvancementCounterDependencies &
  Omit<SemanticRuntimeCorpPassiveScoreLineDependencies, "actionIsScoreLine"> &
  SemanticRuntimeCorpScoreSafetyDependencies &
  Omit<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    | "corpScoreNowSafetyGate"
    | "corpAdvancementCounterPlacementAssessment"
    | "corpPassiveScoreLinePenalty"
  > & {
    advanceCompletesScore: (
      input: AiDecisionInput,
      action: LegalAction,
    ) => boolean;
    corpScoringWindowAssessment: (
      input: AiDecisionInput,
      action: LegalAction,
      roles?: string[],
    ) => CorpScoringWindowAssessment | undefined;
    corpScorelineWindowAssessment: (
      input: AiDecisionInput,
    ) => CorpScorelineWindowAssessment;
  };

export function createSemanticRuntimeCorpScoringEvidenceComposition<
  TConsumer extends string,
>(
  dependencies: SemanticRuntimeCorpScoringEvidenceCompositionDependencies<TConsumer>,
) {
  const { semanticRuntimeCorpAdvancementCounterPlacementAssessment } =
    createSemanticRuntimeCorpAdvancementCounterContext({
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
      normalizedRulesTextForDefinition:
        dependencies.normalizedRulesTextForDefinition,
      actionCreditCost: dependencies.actionCreditCost,
      actionSourceCard: dependencies.actionSourceCard,
      visibleServerCard: dependencies.visibleServerCard,
      cardType: dependencies.cardType,
      cardAdvancementRequirement: dependencies.cardAdvancementRequirement,
      ...(dependencies.hintForDefinitionId
        ? { hintForDefinitionId: dependencies.hintForDefinitionId }
        : {}),
    });

  const { semanticRuntimeCorpPassiveScoreLinePenalty } =
    createSemanticRuntimeCorpPassiveScoreLineContext({
      ...(dependencies.scoreTerminalWindow
        ? { scoreTerminalWindow: dependencies.scoreTerminalWindow }
        : {}),
      scorelineWindowAssessment: dependencies.corpScorelineWindowAssessment,
      actionIsScoreLine: dependencies.corpActionIsScoreLine,
      rolesForAction: dependencies.rolesForAction,
      scoreLineActionIsRisky: (input, action) =>
        dependencies.corpRemoteRezFloorAssessment(input, action)
          ?.blockedByFloor === true ||
        dependencies.corpRemoteScoreContestabilityAssessment(input, action)
          ?.contestable === true ||
        !scoringWindowIsSafe(
          dependencies.corpScoringWindowAssessment(input, action),
        ),
    });

  const { semanticRuntimeCorpScoreNowSafetyGate } =
    createSemanticRuntimeCorpScoreSafetyContext({
      ...(dependencies.scoreTerminalWindow
        ? { scoreTerminalWindow: dependencies.scoreTerminalWindow }
        : {}),
      scorelineWindowAssessment: dependencies.corpScorelineWindowAssessment,
    });

  const semanticRuntimeCorpScoreComponents =
    createSemanticRuntimeCorpScoreComponents({
      actionCreditCost: dependencies.actionCreditCost,
      rolesForAction: dependencies.rolesForAction,
      corpScoreNowSafetyGate: semanticRuntimeCorpScoreNowSafetyGate,
      corpAdvanceRemoteScore: dependencies.corpAdvanceRemoteScore,
      corpRemoteRezFloorAssessment: dependencies.corpRemoteRezFloorAssessment,
      corpCentralRezReserveAssessment:
        dependencies.corpCentralRezReserveAssessment,
      corpRemoteScoreContestabilityAssessment:
        dependencies.corpRemoteScoreContestabilityAssessment,
      corpActionIsScoreLine: dependencies.corpActionIsScoreLine,
      corpAdvanceCompletesScore: dependencies.advanceCompletesScore,
      corpInstallRemoteScore: dependencies.corpInstallRemoteScore,
      corpScoringWindowAssessment: dependencies.corpScoringWindowAssessment,
      corpScorelineWindowAssessment: dependencies.corpScorelineWindowAssessment,
      corpAdvancementCounterPlacementAssessment:
        semanticRuntimeCorpAdvancementCounterPlacementAssessment,
      corpHasRemoteInstability: dependencies.corpHasRemoteInstability,
      corpHasRemoteRezFloorFundingNeed:
        dependencies.corpHasRemoteRezFloorFundingNeed,
      corpHasCentralRezFloorFundingNeed:
        dependencies.corpHasCentralRezFloorFundingNeed,
      corpTaggedRunnerPayoffPressure:
        dependencies.corpTaggedRunnerPayoffPressure,
      corpTaggedPayoffWindowPassiveActionPenalty:
        dependencies.corpTaggedPayoffWindowPassiveActionPenalty,
      corpPassiveScoreLinePenalty: semanticRuntimeCorpPassiveScoreLinePenalty,
    });

  return {
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
    semanticRuntimeCorpPassiveScoreLinePenalty,
    semanticRuntimeCorpScoreNowSafetyGate,
    semanticRuntimeCorpScoreComponents,
  };
}

function scoringWindowIsSafe(
  assessment: CorpScoringWindowAssessment | undefined,
): boolean {
  return (
    assessment?.windowKind === "temporary_safe" ||
    assessment?.windowKind === "durable"
  );
}
