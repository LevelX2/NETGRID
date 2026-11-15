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

export function createSemanticRuntimeCorpScoreComponents<
  TConsumer extends string,
>(dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>) {
  return (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands: readonly CreditDemand[] = [],
  ): AiDecisionScoreComponent[] =>
    buildSemanticRuntimeCorpScoreComponents(
      input,
      action,
      scopeId,
      dependencies,
      actionSemanticCandidate,
      creditDemands,
    );
}
