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

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpScoringEvidenceCompositionDependencies =
  SemanticRuntimeCorpAdvancementCounterDependencies &
    SemanticRuntimeCorpPassiveScoreLineDependencies &
    SemanticRuntimeCorpScoreSafetyDependencies &
    Omit<
      SemanticRuntimeCorpEvidenceDependencies<VisibleCorpServer>,
      "advancementCounterPlacementAssessment" | "passiveScoreLinePenalty"
    >;

export function createSemanticRuntimeCorpScoringEvidenceComposition(
  dependencies: SemanticRuntimeCorpScoringEvidenceCompositionDependencies,
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

  return {
    semanticRuntimeCorpAdvancementCounterPlacementAssessment,
    semanticRuntimeCorpPassiveScoreLinePenalty,
    semanticRuntimeCorpScoreNowSafetyGate,
    semanticRuntimeCorpEvidence,
  };
}
