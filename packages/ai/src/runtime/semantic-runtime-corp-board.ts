import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpBoardDependencies = {
  serverId: (action: LegalAction) => string | undefined;
  findVisibleCard: (
    input: AiDecisionInput,
    cardId: string,
  ) => VisibleCard | undefined;
  findVisibleCorpServerCard: (
    input: AiDecisionInput,
    cardId: string,
  ) => { card: VisibleCard; server: VisibleCorpServer } | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
};

export function semanticRuntimeCorpActionServerId(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpBoardDependencies,
): string | undefined {
  const payloadServerId = dependencies.serverId(action);
  if (payloadServerId) return payloadServerId;
  const sourceLocation = semanticRuntimeCorpVisibleServerCard(
    input,
    action.source,
    dependencies,
  );
  if (sourceLocation) return sourceLocation.server.id;
  const targetCardId =
    typeof action.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : undefined;
  return targetCardId
    ? semanticRuntimeCorpVisibleServerCard(input, targetCardId, dependencies)
        ?.server.id
    : undefined;
}

export function semanticRuntimeCorpServer(
  input: AiDecisionInput,
  serverId: string | undefined,
): VisibleCorpServer | undefined {
  return input.playerView.servers.find((server) => server.id === serverId);
}

export function semanticRuntimeCorpActionSourceCard(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpBoardDependencies,
): VisibleCard | undefined {
  if (action.source !== "basic_action" && action.source !== "game_rule") {
    const sourceCard = dependencies.findVisibleCard(input, action.source);
    if (sourceCard) return sourceCard;
  }
  const targetCardId =
    typeof action.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : undefined;
  return targetCardId
    ? dependencies.findVisibleCard(input, targetCardId)
    : undefined;
}

export function semanticRuntimeCorpVisibleServerCard(
  input: AiDecisionInput,
  cardId: string,
  dependencies: SemanticRuntimeCorpBoardDependencies,
):
  | {
      card: VisibleCard;
      server: VisibleCorpServer;
    }
  | undefined {
  if (cardId === "basic_action" || cardId === "game_rule") return undefined;
  return dependencies.findVisibleCorpServerCard(input, cardId);
}

export function semanticRuntimeCorpActionIsScoreLine(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpBoardDependencies,
  roles = dependencies.rolesForAction(input, action),
): boolean {
  const sourceCard = semanticRuntimeCorpActionSourceCard(
    input,
    action,
    dependencies,
  );
  return (
    sourceCard?.type === "agenda" ||
    action.payload?.cardType === "agenda" ||
    action.payload?.targetCardType === "agenda" ||
    roles.some(semanticRuntimeRoleIsAgenda)
  );
}

export function semanticRuntimeCorpAdvanceCompletesScore(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpBoardDependencies,
): boolean {
  if (action.type !== "advance_card") return false;
  const card = semanticRuntimeCorpActionSourceCard(input, action, dependencies);
  if (card?.type !== "agenda") return false;
  if (typeof card.advancementRequirement !== "number") return false;
  return (card.advancementCounters ?? 0) + 1 >= card.advancementRequirement;
}

export function semanticRuntimeCorpRemoteIsProtected(
  server: VisibleCorpServer | undefined,
): boolean {
  return (server?.ice.length ?? 0) > 0;
}

export function semanticRuntimeCorpRemoteHasScoreLine(
  server: VisibleCorpServer | undefined,
): boolean {
  return (
    server?.root.some(
      (card) =>
        (card.known && card.type === "agenda") ||
        (card.advancementCounters ?? 0) > 0,
    ) === true
  );
}

export function semanticRuntimeCorpEmptyRemoteCount(
  input: AiDecisionInput,
  dependencies: Pick<
    SemanticRuntimeCorpBoardDependencies,
    "isRemoteServerTarget"
  >,
): number {
  return input.playerView.servers.filter(
    (server) =>
      dependencies.isRemoteServerTarget(server.id) &&
      server.root.length === 0 &&
      server.ice.length > 0,
  ).length;
}

function semanticRuntimeRoleIsAgenda(role: string): boolean {
  return (
    role === "agenda" ||
    role === "corp_score_agenda" ||
    role === "score_agenda" ||
    role.startsWith("agenda_")
  );
}
