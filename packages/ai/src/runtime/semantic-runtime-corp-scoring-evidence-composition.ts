import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { createSemanticRuntimeCorpAdvancementCounterContext } from "./semantic-runtime-corp-advancement-counter-context";
import type { SemanticRuntimeCorpAdvancementCounterDependencies } from "./semantic-runtime-corp-advancement-counter";
import { createSemanticRuntimeCorpEvidenceContext } from "./semantic-runtime-corp-evidence-context";
import type { SemanticRuntimeCorpEvidenceDependencies } from "./semantic-runtime-corp-evidence";
import { createSemanticRuntimeCorpPassiveScoreLineContext } from "./semantic-runtime-corp-passive-scoreline-context";
import type { SemanticRuntimeCorpPassiveScoreLineDependencies } from "./semantic-runtime-corp-passive-scoreline";
import { createSemanticRuntimeCorpScoreSafetyContext } from "./semantic-runtime-corp-score-safety-context";
import type { SemanticRuntimeCorpScoreSafetyDependencies } from "./semantic-runtime-corp-score-safety";
import {
  createSemanticRuntimeCorpScoreComposition,
  type SemanticRuntimeCorpScoreCompositionDependencies,
} from "./semantic-runtime-corp-score-composition";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";
import type { CorpScorelineWindowAssessment } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpScoringEvidenceCompositionDependencies<
  TConsumer extends string,
> = SemanticRuntimeCorpAdvancementCounterDependencies &
  Omit<SemanticRuntimeCorpPassiveScoreLineDependencies, "actionIsScoreLine"> &
  SemanticRuntimeCorpScoreSafetyDependencies &
  Omit<
    SemanticRuntimeCorpScoreCompositionDependencies<TConsumer>,
    | "corpScoreNowSafetyGate"
    | "corpAdvancementCounterPlacementAssessment"
    | "corpPassiveScoreLinePenalty"
  > &
  Omit<
    SemanticRuntimeCorpEvidenceDependencies<VisibleCorpServer>,
    | "advancementCounterPlacementAssessment"
    | "passiveScoreLinePenalty"
    | "hasContestableRemoteScoreAction"
    | "hasRemoteInstability"
    | "hasRemoteRezFloorFundingNeed"
    | "hasCentralRezFloorFundingNeed"
    | "remoteRezFloorAssessment"
  > & {
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
      teamRestructuringCardId: dependencies.teamRestructuringCardId,
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

  const { semanticRuntimeCorpEvidence } =
    createSemanticRuntimeCorpEvidenceContext({
      emptyRemoteCount: dependencies.emptyRemoteCount,
      hasRemoteInstability: dependencies.corpHasRemoteInstability,
      hasNakedScoreLine: dependencies.hasNakedScoreLine,
      hasUnsafeRemoteScoreAction: dependencies.hasUnsafeRemoteScoreAction,
      hasContestableRemoteScoreAction: (input) =>
        input.legalActions.some((action) =>
          Boolean(
            dependencies.corpRemoteScoreContestabilityAssessment(input, action)
              ?.contestable,
          ),
        ),
      hasRemoteRezFloorFundingNeed:
        dependencies.corpHasRemoteRezFloorFundingNeed,
      hasCentralRezFloorFundingNeed:
        dependencies.corpHasCentralRezFloorFundingNeed,
      advancementCounterPlacementAssessment:
        semanticRuntimeCorpAdvancementCounterPlacementAssessment,
      passiveScoreLinePenalty: semanticRuntimeCorpPassiveScoreLinePenalty,
      actionServerId: dependencies.actionServerId,
      server: dependencies.server,
      remoteIsProtected: dependencies.remoteIsProtected,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      shouldBuildProtectedScoreRemote:
        dependencies.shouldBuildProtectedScoreRemote,
      actionWouldCreateUnsafeRemoteScoreLine:
        dependencies.actionWouldCreateUnsafeRemoteScoreLine,
      advanceCompletesScore: dependencies.advanceCompletesScore,
      remoteRezFloorAssessment: dependencies.corpRemoteRezFloorAssessment,
    });

  const { semanticRuntimeCorpScoreComponents } =
    createSemanticRuntimeCorpScoreComposition({
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
      scoreFromComponents: dependencies.scoreFromComponents,
    });

  return {
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
    semanticRuntimeCorpPassiveScoreLinePenalty,
    semanticRuntimeCorpScoreNowSafetyGate,
    semanticRuntimeCorpEvidence,
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
