import {
  createSemanticRuntimeCorpCentralRezContext,
} from "./semantic-runtime-corp-central-rez-context";
import {
  createSemanticRuntimeCorpRemoteContestabilityContext,
} from "./semantic-runtime-corp-remote-contestability-context";
import {
  createSemanticRuntimeCorpRezFloorContext,
} from "./semantic-runtime-corp-rez-floor-context";
import {
  createSemanticRuntimeVisibleCardContext,
  type SemanticRuntimeVisibleCardContextDependencies,
} from "./semantic-runtime-visible-card-context";

export type SemanticRuntimeCorpFundingContestabilityCompositionDependencies =
  SemanticRuntimeVisibleCardContextDependencies &
    Parameters<typeof createSemanticRuntimeCorpCentralRezContext>[0] &
    Parameters<typeof createSemanticRuntimeCorpRemoteContestabilityContext>[0] &
    Omit<
      Parameters<typeof createSemanticRuntimeCorpRezFloorContext>[0],
      "visibleIceRezCost"
    >;

export function createSemanticRuntimeCorpFundingContestabilityComposition(
  dependencies: SemanticRuntimeCorpFundingContestabilityCompositionDependencies,
) {
  const {
    normalizedRulesTextForDefinition,
    semanticRuntimeVisibleCardType,
    semanticRuntimeVisibleCardAdvancementRequirement,
    semanticRuntimeVisibleIceRezCost,
  } = createSemanticRuntimeVisibleCardContext({
    runtimeDefinition: dependencies.runtimeDefinition,
    demoDefinition: dependencies.demoDefinition,
  });

  const {
    semanticRuntimeCorpRemoteRezFloorAssessment,
    semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
  } = createSemanticRuntimeCorpRezFloorContext({
    actionServerId: dependencies.actionServerId,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
    server: dependencies.server,
    actionCreditCost: dependencies.actionCreditCost,
    advanceCompletesScore: dependencies.advanceCompletesScore,
    actionIsScoreLine: dependencies.actionIsScoreLine,
    remoteHasScoreLine: dependencies.remoteHasScoreLine,
    visibleIceRezCost: semanticRuntimeVisibleIceRezCost,
  });

  const {
    semanticRuntimeCorpCentralRezReserveAssessment,
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
  } = createSemanticRuntimeCorpCentralRezContext({
    actionCreditCost: dependencies.actionCreditCost,
    actionServerId: dependencies.actionServerId,
    actionSourceCard: dependencies.actionSourceCard,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
  });

  const {
    semanticRuntimeCorpRemoteScoreContestabilityAssessment,
  } = createSemanticRuntimeCorpRemoteContestabilityContext({
    actionServerId: dependencies.actionServerId,
    server: dependencies.server,
    actionIsScoreLine: dependencies.actionIsScoreLine,
    advanceCompletesScore: dependencies.advanceCompletesScore,
    remoteIsProtected: dependencies.remoteIsProtected,
    isRemoteServerTarget: dependencies.isRemoteServerTarget,
  });

  return {
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
