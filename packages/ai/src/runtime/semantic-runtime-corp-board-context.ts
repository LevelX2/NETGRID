import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import {
  semanticRuntimeCorpActionIsScoreLine,
  semanticRuntimeCorpActionServerId,
  semanticRuntimeCorpActionSourceCard,
  semanticRuntimeCorpAdvanceCompletesScore,
  semanticRuntimeCorpEmptyRemoteCount,
  semanticRuntimeCorpRemoteHasScoreLine,
  semanticRuntimeCorpRemoteIsProtected,
  semanticRuntimeCorpServer,
  semanticRuntimeCorpVisibleServerCard,
  type SemanticRuntimeCorpBoardDependencies,
} from "./semantic-runtime-corp-board";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpBoardContext = {
  semanticRuntimeCorpActionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  semanticRuntimeCorpServer: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => VisibleCorpServer | undefined;
  semanticRuntimeCorpActionSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  semanticRuntimeCorpVisibleServerCard: (
    input: AiDecisionInput,
    cardId: string,
  ) => { card: VisibleCard; server: VisibleCorpServer } | undefined;
  semanticRuntimeCorpActionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  semanticRuntimeCorpAdvanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  semanticRuntimeCorpRemoteIsProtected: (
    server: VisibleCorpServer | undefined,
  ) => boolean;
  semanticRuntimeCorpRemoteHasScoreLine: (
    server: VisibleCorpServer | undefined,
  ) => boolean;
  semanticRuntimeCorpEmptyRemoteCount: (input: AiDecisionInput) => number;
};

export function createSemanticRuntimeCorpBoardContext(
  dependencies: SemanticRuntimeCorpBoardDependencies,
): SemanticRuntimeCorpBoardContext {
  return {
    semanticRuntimeCorpActionServerId: (input, action) =>
      semanticRuntimeCorpActionServerId(input, action, dependencies),
    semanticRuntimeCorpServer,
    semanticRuntimeCorpActionSourceCard: (input, action) =>
      semanticRuntimeCorpActionSourceCard(input, action, dependencies),
    semanticRuntimeCorpVisibleServerCard: (input, cardId) =>
      semanticRuntimeCorpVisibleServerCard(input, cardId, dependencies),
    semanticRuntimeCorpActionIsScoreLine: (input, action, roles) =>
      semanticRuntimeCorpActionIsScoreLine(input, action, dependencies, roles),
    semanticRuntimeCorpAdvanceCompletesScore: (input, action) =>
      semanticRuntimeCorpAdvanceCompletesScore(input, action, dependencies),
    semanticRuntimeCorpRemoteIsProtected,
    semanticRuntimeCorpRemoteHasScoreLine,
    semanticRuntimeCorpEmptyRemoteCount: (input) =>
      semanticRuntimeCorpEmptyRemoteCount(input, dependencies),
  };
}
