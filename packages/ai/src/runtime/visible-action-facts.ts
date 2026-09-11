import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { visibleOwnCardByInstanceId } from "./runner-action-source-facts";

export function visibleCardIsAgenda(
  input: AiDecisionInput,
  card: VisibleCard,
): boolean {
  return visibleKnownCardType(input, card) === "agenda";
}

export function visibleKnownCardType(
  input: AiDecisionInput,
  card: VisibleCard,
): string | undefined {
  if (!card.known) return undefined;
  if (!card.definitionId || !card.type)
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition:
        "Every own known card must expose both definitionId and type in PlayerView.",
    });
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  if (!definition?.type)
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide an authoritative typed card definition for ${card.definitionId}.`,
    });
  if (definition.type !== card.type)
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Make PlayerView type match the authoritative definition for ${card.definitionId}.`,
    });
  return card.type;
}

export function requireVisibleCandidateSource(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): VisibleCard {
  const sourceId = candidate.sourceCardInstanceId;
  const visibleSource = sourceId
    ? visibleOwnCardByInstanceId(input, sourceId)
    : undefined;
  if (visibleSource) return visibleSource;
  throw new PlanResolutionFailure("missing_action_semantics", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "action_semantics",
    removalCondition:
      "Every card-sourced install or rez candidate must bind its visible sourceCardInstanceId.",
  });
}

export function currentLegalActionResourceCost(
  action: LegalAction,
  resource: "clicks" | "credits",
): number {
  return action.costs.reduce((sum, cost) => sum + (cost[resource] ?? 0), 0);
}

export function minimumVisiblePlayCost(
  card: AiDecisionInput["playerView"]["own"]["gripOrHq"][number],
): number | undefined {
  const playCost = card.playCost;
  if (playCost === undefined) return undefined;
  if (playCost.kind === "fixed") {
    return Number.isInteger(playCost.credits) && playCost.credits >= 0
      ? playCost.credits
      : undefined;
  }
  if (
    !Number.isInteger(playCost.minimumX) ||
    playCost.minimumX < 0 ||
    !Number.isInteger(playCost.creditsPerX) ||
    playCost.creditsPerX < 1 ||
    playCost.maximumX.kind !== "context"
  ) {
    return undefined;
  }
  return playCost.minimumX * playCost.creditsPerX;
}

export function visibleOwnDefinitionIds(input: AiDecisionInput): Set<string> {
  return new Set(
    [
      ...input.playerView.own.gripOrHq,
      ...input.playerView.own.scoreArea,
      ...input.playerView.servers
        .filter((server) => server.id !== "archives")
        .flatMap((server) => [...server.ice, ...server.root]),
    ]
      .filter((card) => card.known && card.definitionId)
      .map((card) => card.definitionId!),
  );
}

export function actionIsCurrentlyAffordable(
  input: AiDecisionInput,
  action: AiDecisionInput["legalActions"][number],
): boolean {
  const cost = action.costs.reduce<{ credits: number; clicks: number }>(
    (total, entry) => ({
      credits: total.credits + (entry.credits ?? 0),
      clicks: total.clicks + (entry.clicks ?? 0),
    }),
    { credits: 0, clicks: 0 },
  );
  return (
    cost.credits <= input.playerView.own.credits &&
    cost.clicks <= input.playerView.own.clicks
  );
}

export function candidateTargetIds(
  candidate: ActionSemanticCandidate,
): string[] {
  const selectedTargets =
    candidate.targetContext?.selectedTargets.map((target) => target.targetId) ??
    [];
  return [
    ...(selectedTargets.length > 0
      ? selectedTargets
      : (candidate.targetContext?.availableTargets?.map(
          (target) => target.targetId,
        ) ?? [])),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

export function candidateIsVisibleCorpIceInstall(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType !== "install.card") return false;
  const visibleSource = requireVisibleCandidateSource(input, candidate);
  return visibleKnownCardType(input, visibleSource) === "ice";
}

export function candidateIsVisibleCorpAgendaInstall(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType !== "install.card") return false;
  const visibleSource = requireVisibleCandidateSource(input, candidate);
  return visibleCardIsAgenda(input, visibleSource);
}

export function serverForInstalledCard(
  input: AiDecisionInput,
  cardId: string,
): string | undefined {
  return input.playerView.servers.find((server) =>
    [...server.ice, ...server.root].some((card) => card.instanceId === cardId),
  )?.id;
}

export function visibleInstalledCard(input: AiDecisionInput, cardId: string) {
  return input.playerView.servers
    .flatMap((server) => [...server.ice, ...server.root])
    .find((card) => card.instanceId === cardId);
}

export function isServerId(value: string): boolean {
  return (
    value === "hq" ||
    value === "rd" ||
    value === "archives" ||
    value.startsWith("remote_")
  );
}

export function isCorpInstallServerId(value: string): boolean {
  return value === "new_remote" || isServerId(value);
}
