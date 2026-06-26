import type { AiDecisionInput } from "@netgrid/shared";
import {
  createSemanticRuntimeCorpAdvancementCounterContext,
} from "./semantic-runtime-corp-advancement-counter-context";
import type { SemanticRuntimeCorpAdvancementCounterDependencies } from "./semantic-runtime-corp-advancement-counter";
import {
  createSemanticRuntimeCorpEvidenceContext,
} from "./semantic-runtime-corp-evidence-context";
import type { SemanticRuntimeCorpEvidenceDependencies } from "./semantic-runtime-corp-evidence";
import {
  createSemanticRuntimeCorpPassiveScoreLineContext,
} from "./semantic-runtime-corp-passive-scoreline-context";
import type { SemanticRuntimeCorpPassiveScoreLineDependencies } from "./semantic-runtime-corp-passive-scoreline";
import {
  createSemanticRuntimeCorpScoreSafetyContext,
} from "./semantic-runtime-corp-score-safety-context";
import type { SemanticRuntimeCorpScoreSafetyDependencies } from "./semantic-runtime-corp-score-safety";
import {
  createSemanticRuntimeCorpScoreComposition,
  type SemanticRuntimeCorpScoreCompositionDependencies,
} from "./semantic-runtime-corp-score-composition";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpScoringEvidenceCompositionDependencies<
  TConsumer extends string,
> =
  SemanticRuntimeCorpAdvancementCounterDependencies &
    SemanticRuntimeCorpPassiveScoreLineDependencies &
    SemanticRuntimeCorpScoreSafetyDependencies &
    Omit<
      SemanticRuntimeCorpScoreCompositionDependencies<TConsumer>,
      | "corpScoreNowSafetyGate"
      | "corpAdvancementCounterPlacementAssessment"
      | "corpPassiveScoreLinePenalty"
    > &
    Omit<
      SemanticRuntimeCorpEvidenceDependencies<VisibleCorpServer>,
      "advancementCounterPlacementAssessment" | "passiveScoreLinePenalty"
    >;

export function createSemanticRuntimeCorpScoringEvidenceComposition<
  TConsumer extends string,
>(
  dependencies: SemanticRuntimeCorpScoringEvidenceCompositionDependencies<TConsumer>,
) {
  const {
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
  } = createSemanticRuntimeCorpAdvancementCounterContext({
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

  const {
    semanticRuntimeCorpPassiveScoreLinePenalty,
  } = createSemanticRuntimeCorpPassiveScoreLineContext({
    scoreTerminalWindow: dependencies.scoreTerminalWindow,
    actionIsScoreLine: dependencies.actionIsScoreLine,
    rolesForAction: dependencies.rolesForAction,
  });

  const {
    semanticRuntimeCorpScoreNowSafetyGate,
  } = createSemanticRuntimeCorpScoreSafetyContext({
    scoreTerminalWindow: dependencies.scoreTerminalWindow,
  });

  const { semanticRuntimeCorpEvidence } =
    createSemanticRuntimeCorpEvidenceContext({
      emptyRemoteCount: dependencies.emptyRemoteCount,
      hasRemoteInstability: dependencies.hasRemoteInstability,
      hasNakedScoreLine: dependencies.hasNakedScoreLine,
      hasUnsafeRemoteScoreAction: dependencies.hasUnsafeRemoteScoreAction,
      hasContestableRemoteScoreAction:
        dependencies.hasContestableRemoteScoreAction,
      hasRemoteRezFloorFundingNeed:
        dependencies.hasRemoteRezFloorFundingNeed,
      hasCentralRezFloorFundingNeed:
        dependencies.hasCentralRezFloorFundingNeed,
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
      remoteRezFloorAssessment: dependencies.remoteRezFloorAssessment,
    });

  const {
    semanticRuntimeCorpScoreComponents,
  } = createSemanticRuntimeCorpScoreComposition({
    actionCreditCost: dependencies.actionCreditCost,
    rolesForAction: dependencies.rolesForAction,
    corpScoreNowSafetyGate: semanticRuntimeCorpScoreNowSafetyGate,
    corpAdvanceRemoteScore: dependencies.corpAdvanceRemoteScore,
    corpRemoteRezFloorAssessment:
      dependencies.corpRemoteRezFloorAssessment,
    corpCentralRezReserveAssessment:
      dependencies.corpCentralRezReserveAssessment,
    corpRemoteScoreContestabilityAssessment:
      dependencies.corpRemoteScoreContestabilityAssessment,
    corpActionIsScoreLine: dependencies.corpActionIsScoreLine,
    corpInstallRemoteScore: dependencies.corpInstallRemoteScore,
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
