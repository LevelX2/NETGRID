import type { AiDecisionInput } from "@netgrid/shared";
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
import { assessCorpScorelineWindow } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";

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
      | "corpScoringWindowAssessment"
      | "corpScorelineWindowAssessment"
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

  const semanticRuntimeCorpScorelineWindowAssessment = (
    input: AiDecisionInput,
  ) =>
    assessCorpScorelineWindow(input, {
      actionServerId: board.semanticRuntimeCorpActionServerId,
      server: board.semanticRuntimeCorpServer,
      actionCreditCost: dependencies.actionCreditCost,
      actionIsScoreLine: board.semanticRuntimeCorpActionIsScoreLine,
      advanceCompletesScore: board.semanticRuntimeCorpAdvanceCompletesScore,
      remoteHasScoreLine: board.semanticRuntimeCorpRemoteHasScoreLine,
      isRemoteServerTarget: dependencies.isRemoteServerTarget,
      visibleIceRezCost: board.semanticRuntimeVisibleIceRezCost,
      actionSourceCard: board.semanticRuntimeCorpActionSourceCard,
      rolesForAction: dependencies.rolesForAction,
      remoteIsProtected: board.semanticRuntimeCorpRemoteIsProtected,
      remoteContestabilityAssessment:
        board.semanticRuntimeCorpRemoteScoreContestabilityAssessment,
      actionIsEconomy: (runtimeInput, action) => {
        if (action.type === "draw_card") return false;
        if (action.type === "gain_credit") return true;
        return dependencies
          .rolesForAction(runtimeInput, action)
          .some((role) => role.includes("economy"));
      },
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
    corpScoringWindowAssessment:
      board.semanticRuntimeCorpScoringWindowAssessment,
    corpScorelineWindowAssessment:
      semanticRuntimeCorpScorelineWindowAssessment,
    corpTaggedRunnerPayoffPressure,
    corpTaggedPayoffWindowPassiveActionPenalty,
  });

  return {
    corpOntologyPayoffAvailableForTagSource,
    tagPunishWindowDiagnosticsForSimulationAction,
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
    semanticRuntimeCorpScorelineWindowAssessment,
    semanticRuntimeCorpEvidence,
    semanticRuntimeCorpScoreComponents,
  };
}
