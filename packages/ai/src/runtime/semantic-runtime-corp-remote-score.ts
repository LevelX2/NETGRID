import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

type CorpServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

export type SemanticRuntimeCorpRemoteScoreDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
  hasStabilizingAlternative: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  emptyRemoteCount: (input: AiDecisionInput) => number;
  remoteIsProtected: (server: TServer | undefined) => boolean;
  actionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  remoteHasScoreLine: (server: TServer | undefined) => boolean;
  actionCreditCost: (action: LegalAction) => number;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function semanticRuntimeCorpInstallRemoteScore<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  roles: string[],
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
): number {
  const serverId = dependencies.actionServerId(input, action);
  const server = dependencies.server(input, serverId);
  const placement = action.payload?.placement;
  const installsIce = placement === "ice";
  const hasStabilizingAlternative = dependencies.hasStabilizingAlternative(
    input,
    action,
  );

  if (installsIce && (serverId === "hq" || serverId === "rd")) {
    return (server?.ice.length ?? 0) === 0 ? 1200 : 850;
  }
  if (installsIce && serverId === "archives") return 350;
  if (!dependencies.isRemoteServerTarget(serverId)) return 0;

  const emptyRemoteCount = dependencies.emptyRemoteCount(input);
  const protectedRemote = dependencies.remoteIsProtected(server);
  const hasRoot = (server?.root.length ?? 0) > 0;
  const targetIsScoreLine = dependencies.actionIsScoreLine(
    input,
    action,
    roles,
  );

  if (installsIce) {
    if (dependencies.remoteHasScoreLine(server)) {
      return protectedRemote ? 650 : 950;
    }
    if (
      !hasRoot &&
      semanticRuntimeCorpShouldBuildProtectedScoreRemote(input, action, dependencies)
    ) {
      return serverId === "new_remote" ? 1050 : 900;
    }
    let score = serverId === "new_remote" ? -1600 : -900;
    if (!hasRoot) score -= Math.min(1200, emptyRemoteCount * 350);
    if (hasStabilizingAlternative) score -= 500;
    return score;
  }

  if (targetIsScoreLine) {
    if (protectedRemote) return 950;
    return hasStabilizingAlternative ? -2700 : -1700;
  }

  if (serverId === "new_remote" && emptyRemoteCount > 0) {
    return hasStabilizingAlternative ? -900 : -350;
  }
  return protectedRemote ? 250 : -150;
}

export function semanticRuntimeCorpShouldBuildProtectedScoreRemote<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
): boolean {
  if (input.side !== "corp") return false;
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return false;
  }
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId)) return false;
  if (input.playerView.own.credits < dependencies.actionCreditCost(action) + 2) {
    return false;
  }
  return (
    semanticRuntimeCorpHasAgendaInHq(input) &&
    !semanticRuntimeCorpHasProtectedRemoteCapacity(input, dependencies)
  );
}

export function semanticRuntimeCorpAdvanceRemoteScore<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
): number {
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId)) return 0;
  const server = dependencies.server(input, serverId);
  if (dependencies.advanceCompletesScore(input, action)) return 1100;
  if (dependencies.remoteIsProtected(server)) return 900;
  return dependencies.hasStabilizingAlternative(input, action) ? -2700 : -1700;
}

function semanticRuntimeCorpHasAgendaInHq(input: AiDecisionInput): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.type === "agenda",
  );
}

function semanticRuntimeCorpHasProtectedRemoteCapacity<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
): boolean {
  return input.playerView.servers.some((server) => {
    const candidate = server as unknown as TServer;
    return (
      dependencies.isRemoteServerTarget(server.id) &&
      dependencies.remoteIsProtected(candidate) &&
      server.root.length === 0
    );
  });
}
