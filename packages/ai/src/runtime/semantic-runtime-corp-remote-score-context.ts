import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpAdvanceRemoteScore,
  semanticRuntimeCorpInstallRemoteScore,
  semanticRuntimeCorpShouldBuildProtectedScoreRemote,
  type SemanticRuntimeCorpRemoteScoreDependencies,
} from "./semantic-runtime-corp-remote-score";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpRemoteScoreContext = {
  semanticRuntimeCorpInstallRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
    roles: string[],
  ) => number;
  semanticRuntimeCorpShouldBuildProtectedScoreRemote: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  semanticRuntimeCorpAdvanceRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
};

export function createSemanticRuntimeCorpRemoteScoreContext(
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<VisibleCorpServer>,
): SemanticRuntimeCorpRemoteScoreContext {
  return {
    semanticRuntimeCorpInstallRemoteScore: (input, action, roles) =>
      semanticRuntimeCorpInstallRemoteScore(input, action, roles, dependencies),
    semanticRuntimeCorpShouldBuildProtectedScoreRemote: (input, action) =>
      semanticRuntimeCorpShouldBuildProtectedScoreRemote(
        input,
        action,
        dependencies,
      ),
    semanticRuntimeCorpAdvanceRemoteScore: (input, action) =>
      semanticRuntimeCorpAdvanceRemoteScore(input, action, dependencies),
  };
}
