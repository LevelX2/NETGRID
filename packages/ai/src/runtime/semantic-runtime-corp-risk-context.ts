import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine,
  semanticRuntimeCorpHasNakedScoreLine,
  semanticRuntimeCorpHasRemoteInstability,
  semanticRuntimeCorpHasStabilizingAlternative,
  semanticRuntimeCorpHasUnsafeRemoteScoreAction,
  type SemanticRuntimeCorpRiskDependencies,
} from "./semantic-runtime-corp-risk";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpRiskContext = {
  semanticRuntimeCorpHasRemoteInstability: (
    input: AiDecisionInput,
  ) => boolean;
  semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  semanticRuntimeCorpHasStabilizingAlternative: (
    input: AiDecisionInput,
    excludedAction: LegalAction,
  ) => boolean;
  semanticRuntimeCorpHasNakedScoreLine: (input: AiDecisionInput) => boolean;
  semanticRuntimeCorpHasUnsafeRemoteScoreAction: (
    input: AiDecisionInput,
  ) => boolean;
};

export function createSemanticRuntimeCorpRiskContext(
  dependencies: Omit<
    SemanticRuntimeCorpRiskDependencies<VisibleCorpServer>,
    "actionWouldCreateUnsafeRemoteScoreLine"
  >,
): SemanticRuntimeCorpRiskContext {
  const runtimeDependencies: SemanticRuntimeCorpRiskDependencies<VisibleCorpServer> =
    {
      ...dependencies,
      actionWouldCreateUnsafeRemoteScoreLine:
        semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLineForContext,
    };

  function semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLineForContext(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    return semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine(
      input,
      action,
      runtimeDependencies,
    );
  }

  return {
    semanticRuntimeCorpHasRemoteInstability: (input) =>
      semanticRuntimeCorpHasRemoteInstability(input, runtimeDependencies),
    semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine:
      semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLineForContext,
    semanticRuntimeCorpHasStabilizingAlternative: (input, excludedAction) =>
      semanticRuntimeCorpHasStabilizingAlternative(
        input,
        excludedAction,
        runtimeDependencies,
      ),
    semanticRuntimeCorpHasNakedScoreLine: (input) =>
      semanticRuntimeCorpHasNakedScoreLine(input, runtimeDependencies),
    semanticRuntimeCorpHasUnsafeRemoteScoreAction: (input) =>
      semanticRuntimeCorpHasUnsafeRemoteScoreAction(input, runtimeDependencies),
  };
}
