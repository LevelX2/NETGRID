import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpHasRemoteRezFloorFundingNeed,
  semanticRuntimeCorpRemoteRezFloorAssessment,
  type CorpRemoteRezFloorAssessment,
  type SemanticRuntimeCorpRezFloorDependencies,
} from "./semantic-runtime-corp-rez-floor";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpRezFloorContext = {
  semanticRuntimeCorpRemoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpRemoteRezFloorAssessment | undefined;
  semanticRuntimeCorpHasRemoteRezFloorFundingNeed: (
    input: AiDecisionInput,
  ) => boolean;
};

export function createSemanticRuntimeCorpRezFloorContext(
  dependencies: SemanticRuntimeCorpRezFloorDependencies<VisibleCorpServer>,
): SemanticRuntimeCorpRezFloorContext {
  return {
    semanticRuntimeCorpRemoteRezFloorAssessment: (input, action) =>
      semanticRuntimeCorpRemoteRezFloorAssessment(input, action, dependencies),
    semanticRuntimeCorpHasRemoteRezFloorFundingNeed: (input) =>
      semanticRuntimeCorpHasRemoteRezFloorFundingNeed(input, dependencies),
  };
}
