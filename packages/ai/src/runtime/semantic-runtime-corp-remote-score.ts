import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeCorpScoringWindowAssessment,
  type CorpScoringWindowAssessment,
} from "./semantic-runtime-corp-scoring-window";

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
  visibleIceRezCost: (card: VisibleCard) => number | undefined;
  actionSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
};

export function semanticRuntimeCorpInstallRemoteScore<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  roles: string[],
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
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
  const scoringWindow = semanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    dependencies,
    roles,
  );

  if (installsIce) {
    if (scoringWindow?.recommendedNextStep === "build_remote_ice") {
      if (scoringWindow.windowKind === "durable") return 1350;
      if (scoringWindow.windowKind === "temporary_safe") return 1150;
    }
    if (dependencies.remoteHasScoreLine(server)) {
      return protectedRemote ? 950 : 1150;
    }
    if (
      !hasRoot &&
      semanticRuntimeCorpShouldBuildProtectedScoreRemote(
        input,
        action,
        dependencies,
        actionSemanticCandidate,
      )
    ) {
      return serverId === "new_remote" ? 1050 : 900;
    }
    let score = serverId === "new_remote" ? -1600 : -900;
    if (!hasRoot) score -= Math.min(1200, emptyRemoteCount * 350);
    if (hasStabilizingAlternative) score -= 500;
    return score;
  }

  if (targetIsScoreLine) {
    const scoreWindowValue = semanticRuntimeCorpScoreLineWindowValue(
      scoringWindow,
    );
    if (scoreWindowValue !== 0) return scoreWindowValue;
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
  actionSemanticCandidate?: ActionSemanticCandidate,
): boolean {
  if (input.side !== "corp") return false;
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return false;
  }
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId)) return false;
  if (
    input.playerView.own.credits <
    semanticRuntimeCorpRemoteActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    ) +
      2
  ) {
    return false;
  }
  return (
    semanticRuntimeCorpHasAgendaInHq(input) &&
    !semanticRuntimeCorpHasProtectedRemoteCapacity(input, dependencies)
  );
}

function semanticRuntimeCorpRemoteActionCreditCost<TServer extends CorpServerLike>(
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number {
  const costProfile = actionSemanticCandidate?.costProfile;
  if (costProfile === undefined) return dependencies.actionCreditCost(action);
  if (typeof costProfile.creditCost === "number") return costProfile.creditCost;
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    return 0;
  }
  return dependencies.actionCreditCost(action);
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
  if (dependencies.advanceCompletesScore(input, action)) return 1250;
  const scoringWindow = semanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    dependencies,
  );
  const scoreWindowValue = semanticRuntimeCorpScoreLineWindowValue(
    scoringWindow,
  );
  if (scoreWindowValue !== 0) return scoreWindowValue;
  if (dependencies.remoteIsProtected(server)) return 900;
  return dependencies.hasStabilizingAlternative(input, action) ? -2700 : -1700;
}

function semanticRuntimeCorpScoreLineWindowValue(
  assessment: CorpScoringWindowAssessment | undefined,
): number {
  switch (assessment?.windowKind) {
    case "durable":
      return 1450;
    case "temporary_safe":
      return 1250;
    case "unsafe":
      return -2200;
    default:
      return 0;
  }
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
