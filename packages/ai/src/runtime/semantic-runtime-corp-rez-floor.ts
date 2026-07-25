import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { readExactCurrentInstalledCorpIceRezQuote } from "./corp-exact-ice-rez-route";

type CorpServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

export type CorpRemoteRezFloorAssessment = {
  serverId: string;
  knowledge: "known" | "unknown";
  rezFloor: number | undefined;
  requiredCreditsAfterAction: number | undefined;
  creditsAfterAction: number | undefined;
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
  const rezFloor = semanticRuntimeCorpRemoteRezFloor(input, server);
  const currentCredits = input.playerView.own.credits;
  const actionCreditCost = dependencies.actionCreditCost(action);
  const creditsAfterAction =
    nonNegativeSafeInteger(currentCredits) &&
    nonNegativeSafeInteger(actionCreditCost) &&
    currentCredits >= actionCreditCost
      ? currentCredits - actionCreditCost
      : undefined;
  const completesScore = dependencies.advanceCompletesScore(input, action);
  if (creditsAfterAction === undefined) {
    return {
      serverId,
      knowledge: "unknown",
      rezFloor: undefined,
      requiredCreditsAfterAction: undefined,
      creditsAfterAction: undefined,
      blockedByFloor: true,
      evidence: [
        `remote_rez_floor_server:${serverId}`,
        "remote_rez_floor_knowledge:unknown",
        "remote_rez_floor:unknown",
        "remote_rez_floor_required_after_action:unknown",
        "credits_after_action:unknown",
        "remote_rez_floor:invalid_credit_input",
        "low_rez_reserve:true",
        "agenda_development_risk:below_remote_rez_floor",
      ],
    };
  }
  const requiredCreditsAfterAction =
    rezFloor === undefined
      ? undefined
      : scoreLineInstall && !completesScore
        ? rezFloor + 1
        : rezFloor;
  const blockedByFloor =
    !completesScore &&
    (rezFloor === undefined ||
      (rezFloor > 0 &&
        creditsAfterAction < (requiredCreditsAfterAction ?? 0)));
  return {
    serverId,
    knowledge: rezFloor === undefined ? "unknown" : "known",
    rezFloor,
    requiredCreditsAfterAction,
    creditsAfterAction,
    blockedByFloor,
    evidence: [
      `remote_rez_floor_server:${serverId}`,
      `remote_rez_floor_knowledge:${rezFloor === undefined ? "unknown" : "known"}`,
      `remote_rez_floor:${rezFloor ?? "unknown"}`,
      `remote_rez_floor_required_after_action:${requiredCreditsAfterAction ?? "unknown"}`,
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
  input: AiDecisionInput,
  server: TServer | undefined,
): number | undefined {
  if (!server || server.ice.length === 0) return 0;
  if (server.ice.some((ice) => ice.rezzed === true)) return 0;
  const rezCosts: number[] = [];
  for (const ice of server.ice) {
    const quoteRead = readExactCurrentInstalledCorpIceRezQuote({
      input,
      sourceCard: ice,
      targetServerId: server.id,
    });
    if (
      !quoteRead ||
      quoteRead.quote.mandatoryAdditionalCosts.agendaPoints !== 0
    ) {
      return undefined;
    }
    rezCosts.push(quoteRead.totalRezCredits);
  }
  if (rezCosts.length === 0) return 0;
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
  if (!nonNegativeSafeInteger(currentCredits)) return false;
  if (
    input.playerView.servers.some((server) => {
      if (!dependencies.isRemoteServerTarget(server.id)) return false;
      const candidate = server as unknown as TServer;
      if (!dependencies.remoteHasScoreLine(candidate)) return false;
      const rezFloor = semanticRuntimeCorpRemoteRezFloor(input, candidate);
      return rezFloor !== undefined && rezFloor > 0 && currentCredits < rezFloor;
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
    return (
      assessment?.blockedByFloor === true &&
      assessment.rezFloor !== undefined
    );
  });
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
