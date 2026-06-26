import {
  createCorpTagPunishWindowComposition,
  type CorpTagPunishWindowCompositionDependencies,
} from "../simulation/corp-tag-punish-window-composition";
import {
  createSemanticRuntimeCorpBoardScoreComposition,
  type SemanticRuntimeCorpBoardScoreCompositionDependencies,
} from "./semantic-runtime-corp-board-score-composition";
import {
  createSemanticRuntimeCorpScoringEvidenceComposition,
  type SemanticRuntimeCorpScoringEvidenceCompositionDependencies,
} from "./semantic-runtime-corp-scoring-evidence-composition";

export type SemanticRuntimeCorpScoringCompositionDependencies<
  TConsumer extends string,
> =
  SemanticRuntimeCorpBoardScoreCompositionDependencies &
    Omit<
      CorpTagPunishWindowCompositionDependencies,
      "actionSourceCard" | "advanceCompletesScore" | "actionIsScoreLine"
    > &
    Omit<
      SemanticRuntimeCorpScoringEvidenceCompositionDependencies<TConsumer>,
      | "normalizedRulesTextForDefinition"
      | "actionSourceCard"
      | "visibleServerCard"
      | "cardType"
      | "cardAdvancementRequirement"
      | "emptyRemoteCount"
      | "hasNakedScoreLine"
      | "hasUnsafeRemoteScoreAction"
      | "actionServerId"
      | "server"
      | "remoteIsProtected"
      | "shouldBuildProtectedScoreRemote"
      | "actionWouldCreateUnsafeRemoteScoreLine"
      | "advanceCompletesScore"
      | "corpRemoteRezFloorAssessment"
      | "corpHasRemoteRezFloorFundingNeed"
      | "corpCentralRezReserveAssessment"
      | "corpHasCentralRezFloorFundingNeed"
      | "corpRemoteScoreContestabilityAssessment"
      | "corpActionIsScoreLine"
      | "corpInstallRemoteScore"
      | "corpHasRemoteInstability"
      | "corpAdvanceRemoteScore"
      | "corpTaggedRunnerPayoffPressure"
      | "corpTaggedPayoffWindowPassiveActionPenalty"
    >;

export function createSemanticRuntimeCorpScoringComposition<
  TConsumer extends string,
>(
  dependencies: SemanticRuntimeCorpScoringCompositionDependencies<TConsumer>,
) {
  const board = createSemanticRuntimeCorpBoardScoreComposition(dependencies);

  const {
    corpOntologyPayoffAvailableForTagSource,
    tagPunishWindowDiagnosticsForSimulationAction,
    corpTaggedPayoffWindowPassiveActionPenalty,
    corpTaggedRunnerPayoffPressure,
  } = createCorpTagPunishWindowComposition({
    ...dependencies,
    actionSourceCard: board.semanticRuntimeCorpActionSourceCard,
    advanceCompletesScore: board.semanticRuntimeCorpAdvanceCompletesScore,
    actionIsScoreLine: board.semanticRuntimeCorpActionIsScoreLine,
  });

  const {
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
    semanticRuntimeCorpEvidence,
    semanticRuntimeCorpScoreComponents,
  } = createSemanticRuntimeCorpScoringEvidenceComposition({
    ...dependencies,
    normalizedRulesTextForDefinition:
      board.normalizedRulesTextForDefinition,
    actionSourceCard: board.semanticRuntimeCorpActionSourceCard,
    visibleServerCard: dependencies.findVisibleCorpServerCard,
    cardType: board.semanticRuntimeVisibleCardType,
    cardAdvancementRequirement:
      board.semanticRuntimeVisibleCardAdvancementRequirement,
    emptyRemoteCount: board.semanticRuntimeCorpEmptyRemoteCount,
    hasNakedScoreLine: board.semanticRuntimeCorpHasNakedScoreLine,
    hasUnsafeRemoteScoreAction:
      board.semanticRuntimeCorpHasUnsafeRemoteScoreAction,
    actionServerId: board.semanticRuntimeCorpActionServerId,
    server: board.semanticRuntimeCorpServer,
    remoteIsProtected: board.semanticRuntimeCorpRemoteIsProtected,
    shouldBuildProtectedScoreRemote:
      board.semanticRuntimeCorpShouldBuildProtectedScoreRemote,
    actionWouldCreateUnsafeRemoteScoreLine:
      board.semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine,
    advanceCompletesScore: board.semanticRuntimeCorpAdvanceCompletesScore,
    corpRemoteRezFloorAssessment:
      board.semanticRuntimeCorpRemoteRezFloorAssessment,
    corpHasRemoteRezFloorFundingNeed:
      board.semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
    corpCentralRezReserveAssessment:
      board.semanticRuntimeCorpCentralRezReserveAssessment,
    corpHasCentralRezFloorFundingNeed:
      board.semanticRuntimeCorpHasCentralRezFloorFundingNeed,
    corpRemoteScoreContestabilityAssessment:
      board.semanticRuntimeCorpRemoteScoreContestabilityAssessment,
    corpActionIsScoreLine: board.semanticRuntimeCorpActionIsScoreLine,
    corpInstallRemoteScore: board.semanticRuntimeCorpInstallRemoteScore,
    corpHasRemoteInstability:
      board.semanticRuntimeCorpHasRemoteInstability,
    corpAdvanceRemoteScore: board.semanticRuntimeCorpAdvanceRemoteScore,
    corpTaggedRunnerPayoffPressure,
    corpTaggedPayoffWindowPassiveActionPenalty,
  });

  return {
    corpOntologyPayoffAvailableForTagSource,
    tagPunishWindowDiagnosticsForSimulationAction,
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
    semanticRuntimeCorpEvidence,
    semanticRuntimeCorpScoreComponents,
  };
}
