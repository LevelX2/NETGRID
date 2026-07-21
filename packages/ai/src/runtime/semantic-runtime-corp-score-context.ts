import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { CreditDemand } from "../plans/credit-demand";
import {
  semanticRuntimeCorpScoreComponents as buildSemanticRuntimeCorpScoreComponents,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score";

export type SemanticRuntimeCorpScoreContext = {
  semanticRuntimeCorpScore: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands?: readonly CreditDemand[],
  ) => number;
  semanticRuntimeCorpScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands?: readonly CreditDemand[],
  ) => AiDecisionScoreComponent[];
};

export function createSemanticRuntimeCorpScoreContext<TConsumer extends string>(
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  scoreFromComponents: (components: AiDecisionScoreComponent[]) => number,
): SemanticRuntimeCorpScoreContext {
  function semanticRuntimeCorpScoreComponents(
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands: readonly CreditDemand[] = [],
  ): AiDecisionScoreComponent[] {
    return buildSemanticRuntimeCorpScoreComponents(
      input,
      action,
      scopeId,
      dependencies,
      actionSemanticCandidate,
      creditDemands,
    );
  }

  return {
    semanticRuntimeCorpScore: (
      input,
      action,
      scopeId,
      actionSemanticCandidate,
      creditDemands = [],
    ) =>
      scoreFromComponents(
        semanticRuntimeCorpScoreComponents(
          input,
          action,
          scopeId,
          actionSemanticCandidate,
          creditDemands,
        ),
      ),
    semanticRuntimeCorpScoreComponents,
  };
}
