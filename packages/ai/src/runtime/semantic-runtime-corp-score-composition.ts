import type { AiDecisionScoreComponent } from "@netgrid/shared";
import {
  createSemanticRuntimeCorpScoreContext,
} from "./semantic-runtime-corp-score-context";
import type { SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score";

export type SemanticRuntimeCorpScoreCompositionDependencies<
  TConsumer extends string,
> = SemanticRuntimeCorpScoreDependencies<TConsumer> & {
  scoreFromComponents: (components: AiDecisionScoreComponent[]) => number;
};

export function createSemanticRuntimeCorpScoreComposition<
  TConsumer extends string,
>(
  dependencies: SemanticRuntimeCorpScoreCompositionDependencies<TConsumer>,
) {
  return createSemanticRuntimeCorpScoreContext(
    {
      actionCreditCost: dependencies.actionCreditCost,
      rolesForAction: dependencies.rolesForAction,
      corpScoreNowSafetyGate: dependencies.corpScoreNowSafetyGate,
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
        dependencies.corpAdvancementCounterPlacementAssessment,
      corpHasRemoteInstability: dependencies.corpHasRemoteInstability,
      corpHasRemoteRezFloorFundingNeed:
        dependencies.corpHasRemoteRezFloorFundingNeed,
      corpHasCentralRezFloorFundingNeed:
        dependencies.corpHasCentralRezFloorFundingNeed,
      corpTaggedRunnerPayoffPressure:
        dependencies.corpTaggedRunnerPayoffPressure,
      corpTaggedPayoffWindowPassiveActionPenalty:
        dependencies.corpTaggedPayoffWindowPassiveActionPenalty,
      corpPassiveScoreLinePenalty: dependencies.corpPassiveScoreLinePenalty,
    },
    dependencies.scoreFromComponents,
  );
}
