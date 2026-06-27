import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeCorpAdvanceRemoteScore,
  semanticRuntimeCorpInstallRemoteScore,
  semanticRuntimeCorpShouldBuildProtectedScoreRemote,
  type SemanticRuntimeCorpRemoteScoreDependencies,
} from "./semantic-runtime-corp-remote-score";
import {
  semanticRuntimeCorpScoringWindowAssessment,
  type CorpScoringWindowAssessment,
} from "./semantic-runtime-corp-scoring-window";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpRemoteScoreContext = {
  semanticRuntimeCorpInstallRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
    roles: string[],
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => number;
  semanticRuntimeCorpShouldBuildProtectedScoreRemote: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => boolean;
  semanticRuntimeCorpAdvanceRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  semanticRuntimeCorpScoringWindowAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => CorpScoringWindowAssessment | undefined;
};

export function createSemanticRuntimeCorpRemoteScoreContext(
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<VisibleCorpServer>,
): SemanticRuntimeCorpRemoteScoreContext {
  return {
    semanticRuntimeCorpInstallRemoteScore: (
      input,
      action,
      roles,
      actionSemanticCandidate,
    ) =>
      semanticRuntimeCorpInstallRemoteScore(
        input,
        action,
        roles,
        dependencies,
        actionSemanticCandidate,
      ),
    semanticRuntimeCorpShouldBuildProtectedScoreRemote: (
      input,
      action,
      actionSemanticCandidate,
    ) =>
      semanticRuntimeCorpShouldBuildProtectedScoreRemote(
        input,
        action,
        dependencies,
        actionSemanticCandidate,
      ),
    semanticRuntimeCorpAdvanceRemoteScore: (input, action) =>
      semanticRuntimeCorpAdvanceRemoteScore(input, action, dependencies),
    semanticRuntimeCorpScoringWindowAssessment: (input, action, roles) =>
      semanticRuntimeCorpScoringWindowAssessment(
        input,
        action,
        dependencies,
        roles,
      ),
  };
}
