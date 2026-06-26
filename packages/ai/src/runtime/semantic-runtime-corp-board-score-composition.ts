import type { LegalAction } from "@netgrid/shared";

import type { SemanticRuntimeCorpBoardDependencies } from "./semantic-runtime-corp-board";
import { createSemanticRuntimeCorpBoardContext } from "./semantic-runtime-corp-board-context";
import {
  createSemanticRuntimeCorpFundingContestabilityComposition,
  type SemanticRuntimeCorpFundingContestabilityCompositionDependencies,
} from "./semantic-runtime-corp-funding-contestability-composition";
import { createSemanticRuntimeCorpRemoteScoreContext } from "./semantic-runtime-corp-remote-score-context";
import { createSemanticRuntimeCorpRiskContext } from "./semantic-runtime-corp-risk-context";

export type SemanticRuntimeCorpBoardScoreCompositionDependencies =
  SemanticRuntimeCorpBoardDependencies & {
    actionCreditCost: (action: LegalAction) => number;
  } &
    Omit<
      SemanticRuntimeCorpFundingContestabilityCompositionDependencies,
      | "actionServerId"
      | "server"
      | "actionIsScoreLine"
      | "advanceCompletesScore"
      | "remoteHasScoreLine"
      | "actionSourceCard"
      | "remoteIsProtected"
    >;

export function createSemanticRuntimeCorpBoardScoreComposition(
  dependencies: SemanticRuntimeCorpBoardScoreCompositionDependencies,
) {
  const {
    semanticRuntimeCorpActionServerId,
    semanticRuntimeCorpServer,
    semanticRuntimeCorpActionSourceCard,
    semanticRuntimeCorpVisibleServerCard,
    semanticRuntimeCorpActionIsScoreLine,
    semanticRuntimeCorpAdvanceCompletesScore,
    semanticRuntimeCorpRemoteIsProtected,
    semanticRuntimeCorpRemoteHasScoreLine,
    semanticRuntimeCorpEmptyRemoteCount,
  } = createSemanticRuntimeCorpBoardContext({
    serverId: dependencies.serverId,
    findVisibleCard: dependencies.findVisibleCard,
    findVisibleCorpServerCard: dependencies.findVisibleCorpServerCard,
    rolesForAction: dependencies.rolesForAction,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
  });

  const {
    semanticRuntimeCorpHasRemoteInstability,
    semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine,
    semanticRuntimeCorpHasStabilizingAlternative,
    semanticRuntimeCorpHasNakedScoreLine,
    semanticRuntimeCorpHasUnsafeRemoteScoreAction,
  } = createSemanticRuntimeCorpRiskContext({
    emptyRemoteCount: semanticRuntimeCorpEmptyRemoteCount,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
    remoteIsProtected: semanticRuntimeCorpRemoteIsProtected,
    remoteHasScoreLine: semanticRuntimeCorpRemoteHasScoreLine,
    actionServerId: semanticRuntimeCorpActionServerId,
    actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
    server: semanticRuntimeCorpServer,
  });

  const {
    semanticRuntimeCorpInstallRemoteScore,
    semanticRuntimeCorpShouldBuildProtectedScoreRemote,
    semanticRuntimeCorpAdvanceRemoteScore,
  } = createSemanticRuntimeCorpRemoteScoreContext({
    actionServerId: semanticRuntimeCorpActionServerId,
    server: semanticRuntimeCorpServer,
    hasStabilizingAlternative:
      semanticRuntimeCorpHasStabilizingAlternative,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
    emptyRemoteCount: semanticRuntimeCorpEmptyRemoteCount,
    remoteIsProtected: semanticRuntimeCorpRemoteIsProtected,
    actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
    remoteHasScoreLine: semanticRuntimeCorpRemoteHasScoreLine,
    actionCreditCost: dependencies.actionCreditCost,
    advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
  });

  const {
    normalizedRulesTextForDefinition,
    semanticRuntimeVisibleCardType,
    semanticRuntimeVisibleCardAdvancementRequirement,
    semanticRuntimeVisibleIceRezCost,
    semanticRuntimeCorpRemoteRezFloorAssessment,
    semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
    semanticRuntimeCorpCentralRezReserveAssessment,
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
    semanticRuntimeCorpRemoteScoreContestabilityAssessment,
  } = createSemanticRuntimeCorpFundingContestabilityComposition({
    runtimeDefinition: dependencies.runtimeDefinition,
    demoDefinition: dependencies.demoDefinition,
    actionServerId: semanticRuntimeCorpActionServerId,
    server: semanticRuntimeCorpServer,
    actionCreditCost: dependencies.actionCreditCost,
    actionIsScoreLine: semanticRuntimeCorpActionIsScoreLine,
    advanceCompletesScore: semanticRuntimeCorpAdvanceCompletesScore,
    remoteHasScoreLine: semanticRuntimeCorpRemoteHasScoreLine,
    actionSourceCard: semanticRuntimeCorpActionSourceCard,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    remoteIsProtected: semanticRuntimeCorpRemoteIsProtected,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
  });

  return {
    semanticRuntimeCorpActionServerId,
    semanticRuntimeCorpServer,
    semanticRuntimeCorpActionSourceCard,
    semanticRuntimeCorpVisibleServerCard,
    semanticRuntimeCorpActionIsScoreLine,
    semanticRuntimeCorpAdvanceCompletesScore,
    semanticRuntimeCorpRemoteIsProtected,
    semanticRuntimeCorpRemoteHasScoreLine,
    semanticRuntimeCorpEmptyRemoteCount,
    semanticRuntimeCorpHasRemoteInstability,
    semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine,
    semanticRuntimeCorpHasStabilizingAlternative,
    semanticRuntimeCorpHasNakedScoreLine,
    semanticRuntimeCorpHasUnsafeRemoteScoreAction,
    semanticRuntimeCorpInstallRemoteScore,
    semanticRuntimeCorpShouldBuildProtectedScoreRemote,
    semanticRuntimeCorpAdvanceRemoteScore,
    normalizedRulesTextForDefinition,
    semanticRuntimeVisibleCardType,
    semanticRuntimeVisibleCardAdvancementRequirement,
    semanticRuntimeVisibleIceRezCost,
    semanticRuntimeCorpRemoteRezFloorAssessment,
    semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
    semanticRuntimeCorpCentralRezReserveAssessment,
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
    semanticRuntimeCorpRemoteScoreContestabilityAssessment,
  };
}
