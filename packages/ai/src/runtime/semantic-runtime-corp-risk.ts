import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

type CorpServerLike = {
  id: string;
};

export type SemanticRuntimeCorpRiskDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  emptyRemoteCount: (input: AiDecisionInput) => number;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  remoteIsProtected: (server: TServer | undefined) => boolean;
  remoteHasScoreLine: (server: TServer) => boolean;
  actionWouldCreateUnsafeRemoteScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  actionIsScoreLine: (input: AiDecisionInput, action: LegalAction) => boolean;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
};

export function semanticRuntimeCorpHasRemoteInstability<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpRiskDependencies<TServer>,
): boolean {
  return (
    dependencies.emptyRemoteCount(input) > 0 ||
    input.playerView.servers.some((server) => {
      const candidate = server as unknown as TServer;
      return (
        dependencies.isRemoteServerTarget(server.id) &&
        !dependencies.remoteIsProtected(candidate) &&
        dependencies.remoteHasScoreLine(candidate)
      );
    }) ||
    input.legalActions.some((action) =>
      dependencies.actionWouldCreateUnsafeRemoteScoreLine(input, action),
    )
  );
}

export function semanticRuntimeCorpActionWouldCreateUnsafeRemoteScoreLine<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpRiskDependencies<TServer>,
): boolean {
  const serverId = dependencies.actionServerId(input, action);
  if (
    action.type !== "install_card" ||
    action.payload?.placement === "ice" ||
    !dependencies.isRemoteServerTarget(serverId) ||
    !dependencies.actionIsScoreLine(input, action)
  ) {
    return false;
  }
  const server = dependencies.server(input, serverId);
  return !dependencies.remoteIsProtected(server);
}

export function semanticRuntimeCorpHasStabilizingAlternative<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  excludedAction: LegalAction,
  dependencies: SemanticRuntimeCorpRiskDependencies<TServer>,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === excludedAction.actionId || action.side !== "corp") {
      return false;
    }
    if (action.type === "gain_credit" || action.type === "draw_card") {
      return true;
    }
    if (action.type !== "install_card" || action.payload?.placement !== "ice") {
      return false;
    }
    const serverId = dependencies.actionServerId(input, action);
    return serverId === "hq" || serverId === "rd";
  });
}

export function semanticRuntimeCorpHasNakedScoreLine<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpRiskDependencies<TServer>,
): boolean {
  return input.playerView.servers.some((server) => {
    const candidate = server as unknown as TServer;
    return (
      dependencies.isRemoteServerTarget(server.id) &&
      !dependencies.remoteIsProtected(candidate) &&
      dependencies.remoteHasScoreLine(candidate)
    );
  });
}

export function semanticRuntimeCorpHasUnsafeRemoteScoreAction<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpRiskDependencies<TServer>,
): boolean {
  return input.legalActions.some((action) =>
    dependencies.actionWouldCreateUnsafeRemoteScoreLine(input, action),
  );
}
