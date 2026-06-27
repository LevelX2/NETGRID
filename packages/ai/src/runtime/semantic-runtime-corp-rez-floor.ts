import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

type CorpServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

export type CorpRemoteRezFloorAssessment = {
  serverId: string;
  rezFloor: number;
  requiredCreditsAfterAction: number;
  creditsAfterAction: number;
  blockedByFloor: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpRezFloorDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
  actionCreditCost: (action: LegalAction) => number;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  actionIsScoreLine: (input: AiDecisionInput, action: LegalAction) => boolean;
  remoteHasScoreLine: (server: TServer | undefined) => boolean;
  visibleIceRezCost: (card: VisibleCard) => number | undefined;
};

export function semanticRuntimeCorpRemoteRezFloorAssessment<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpRezFloorDependencies<TServer>,
): CorpRemoteRezFloorAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  if (action.type !== "advance_card" && action.type !== "install_card") {
    return undefined;
  }
  const scoreLineInstall =
    action.type === "install_card" &&
    dependencies.actionIsScoreLine(input, action);
  if (
    action.type === "install_card" &&
    (action.payload?.placement === "ice" || !scoreLineInstall)
  ) {
    return undefined;
  }
  const serverId = dependencies.actionServerId(input, action);
  if (!serverId || !dependencies.isRemoteServerTarget(serverId)) {
    return undefined;
  }
  const server = dependencies.server(input, serverId);
  const rezFloor = semanticRuntimeCorpRemoteRezFloor(server, dependencies);
  const creditsAfterAction =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  const completesScore = dependencies.advanceCompletesScore(input, action);
  const requiredCreditsAfterAction =
    scoreLineInstall && !completesScore ? rezFloor + 1 : rezFloor;
  const blockedByFloor =
    !completesScore &&
    rezFloor > 0 &&
    creditsAfterAction < requiredCreditsAfterAction;
  return {
    serverId,
    rezFloor,
    requiredCreditsAfterAction,
    creditsAfterAction,
    blockedByFloor,
    evidence: [
      `remote_rez_floor_server:${serverId}`,
      `remote_rez_floor:${rezFloor}`,
      `remote_rez_floor_required_after_action:${requiredCreditsAfterAction}`,
      `credits_after_action:${creditsAfterAction}`,
      `low_rez_reserve:${blockedByFloor}`,
      ...(scoreLineInstall && !completesScore
        ? ["scoreline_install_next_advance_reserve:1"]
        : []),
      ...(blockedByFloor
        ? ["agenda_development_risk:below_remote_rez_floor"]
        : ["agenda_development_risk:remote_rez_floor_met"]),
      ...(completesScore
        ? ["corp_remote_score_line:scoreable_after_action"]
        : []),
    ],
  };
}

export function semanticRuntimeCorpRemoteRezFloor<
  TServer extends CorpServerLike,
>(
  server: TServer | undefined,
  dependencies: Pick<
    SemanticRuntimeCorpRezFloorDependencies<TServer>,
    "visibleIceRezCost"
  >,
): number {
  if (!server || server.ice.length === 0) return 0;
  if (server.ice.some((ice) => ice.rezzed === true)) return 0;
  const rezCosts = server.ice
    .filter((ice) => ice.rezzed !== true)
    .map(dependencies.visibleIceRezCost)
    .filter((cost): cost is number => cost !== undefined && cost > 0);
  if (rezCosts.length === 0) return 2;
  return Math.min(...rezCosts);
}

export function semanticRuntimeCorpHasRemoteRezFloorFundingNeed<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpRezFloorDependencies<TServer>,
): boolean {
  if (input.side !== "corp") return false;
  const currentCredits = input.playerView.own.credits;
  if (
    input.playerView.servers.some((server) => {
      if (!dependencies.isRemoteServerTarget(server.id)) return false;
      const candidate = server as unknown as TServer;
      if (!dependencies.remoteHasScoreLine(candidate)) return false;
      const rezFloor = semanticRuntimeCorpRemoteRezFloor(
        candidate,
        dependencies,
      );
      return rezFloor > 0 && currentCredits < rezFloor;
    })
  ) {
    return true;
  }
  return input.legalActions.some((action) => {
    const assessment = semanticRuntimeCorpRemoteRezFloorAssessment(
      input,
      action,
      dependencies,
    );
    return assessment?.blockedByFloor === true;
  });
}
