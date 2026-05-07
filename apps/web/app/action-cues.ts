import type { PlayerView, PublicGameEvent, Side, VisibleCard } from "@netrunner/shared";
import { formatChronicleEvent, type ChronicleContext, type ChronicleImportance, type ChronicleVisibility } from "./chronicle";
import { serverDisplayLabel } from "./action-board-ui";

export type OpponentActionCue = {
  cueId: string;
  eventId: string;
  viewerSide: Side;
  actor?: Side;
  actorLabel: string;
  opponent: boolean;
  source: "human" | "ai" | "system";
  actionType: string;
  title: string;
  description?: string;
  visibility: ChronicleVisibility;
  importance: ChronicleImportance;
  highlight?: BoardHighlight;
  relatedCard?: VisibleCard;
  sound?: ActionSoundKind;
  requiresLocalAttention: boolean;
  aiExplanation?: string;
};

export type BoardHighlight =
  | { kind: "server"; serverId?: string; serverLabel?: string; lane?: "ice" | "root" | "central" }
  | { kind: "card"; cardInstanceId?: string; cardDefinitionId?: string; title?: string }
  | { kind: "zone"; side: Side; zone: "hq" | "rd" | "archives" | "grip" | "stack" | "heap" | "rig" | "scoreArea" }
  | { kind: "run"; serverId?: string; serverLabel?: string; phase?: string }
  | { kind: "economy"; side: Side }
  | { kind: "decision"; side: Side };

export type ActionSoundKind =
  | "turn"
  | "draw"
  | "credit"
  | "install_hidden"
  | "install_known"
  | "play"
  | "rez"
  | "run"
  | "access"
  | "agenda"
  | "trash"
  | "tag_or_damage"
  | "choice"
  | "game_end";

export type CueDerivationInput = {
  viewerSide: Side;
  playerView: PlayerView;
  events: PublicGameEvent[];
  lastPresentedEventId?: string | null;
  includeOwnActions?: boolean;
  contextByEventId?: Record<string, Omit<ChronicleContext, "side">>;
};

export function deriveOpponentActionCues(input: CueDerivationInput): OpponentActionCue[] {
  const relevantEvents = eventsAfter(input.events, input.lastPresentedEventId);
  const localAttention = hasLocalAttention(input.playerView, input.viewerSide);
  const visibleCards = visibleCardsByDefinition(input.playerView);

  const cues = relevantEvents.flatMap((event) => {
    const payload = event.publicPayload ?? {};
    const actionType = stringValue(payload.actionType) ?? event.type;
    if (actionType === "access_card" && stringValue(payload.cardDefinitionId) && stringValue(payload.title)) return [];
    const actor = sideValue(payload.actor);
    const opponent = Boolean(actor && actor !== input.viewerSide);
    const systemCue = !actor && actionType !== "game_created";
    if (!input.includeOwnActions && !opponent && !systemCue) return [];
    if (actionType === "end_turn" && opponent && localAttention && !input.playerView.pendingChoice) return [];

    const item = formatChronicleEvent(event, input.viewerSide, input.contextByEventId?.[event.eventId] ?? {});
    const aiExplanation = stringValue(payload.aiExplanation);
    const source = aiExplanation || stringValue(payload.aiReasonCode) ? "ai" : actor ? "human" : "system";
    const visibility = item.visibility;
    const highlight = deriveHighlight(actionType, payload, actor, visibility, visibleCards);
    const relatedCard = deriveRelatedCard(payload, visibility, visibleCards);
    const sound = actionSoundForActionType(actionType, visibility);

    const cue: OpponentActionCue = {
      cueId: `${input.viewerSide}:${event.eventId}`,
      eventId: event.eventId,
      viewerSide: input.viewerSide,
      ...(actor ? { actor } : {}),
      actorLabel: actorLabel(actor, source),
      opponent,
      source,
      actionType,
      title: item.title,
      ...(item.description ? { description: item.description } : {}),
      visibility,
      importance: item.importance,
      ...(highlight ? { highlight } : {}),
      ...(relatedCard ? { relatedCard } : {}),
      ...(sound ? { sound } : {}),
      requiresLocalAttention: localAttention,
      ...(aiExplanation ? { aiExplanation } : {})
    };
    return [cue];
  });

  return cues;
}

export function cueHasHiddenLeak(cue: OpponentActionCue): boolean {
  const serialized = JSON.stringify(cue);
  if (cue.visibility !== "redacted") return /cardInstances|sessionToken|joinToken|privatePayload/i.test(serialized);
  return /cardInstances|sessionToken|joinToken|privatePayload|imageUrl|Simple Agenda|simple_agenda/i.test(serialized);
}

function eventsAfter(events: PublicGameEvent[], lastPresentedEventId?: string | null): PublicGameEvent[] {
  if (!lastPresentedEventId) return events;
  const index = events.findIndex((event) => event.eventId === lastPresentedEventId);
  return index >= 0 ? events.slice(index + 1) : events;
}

function deriveHighlight(
  actionType: string,
  payload: Record<string, unknown>,
  actor: Side | undefined,
  visibility: ChronicleVisibility,
  visibleCards: Map<string, VisibleCard>
): BoardHighlight | undefined {
  if (actionType === "game_created") return undefined;
  if (actionType === "start_run" || actionType === "continue_run" || actionType === "rez_ice" || actionType === "decline_rez" || actionType === "break_subroutine" || actionType === "pump_breaker") {
    return { kind: "run", ...(stringValue(payload.serverId) ? { serverId: stringValue(payload.serverId)! } : {}), ...(stringValue(payload.serverLabel) ? { serverLabel: serverDisplayLabel(stringValue(payload.serverLabel)!) } : {}), ...(stringValue(payload.runPhase) ? { phase: stringValue(payload.runPhase)! } : {}) };
  }
  if (actionType === "mandatory_draw" || actionType === "draw_card") {
    return { kind: "zone", side: actor ?? "corp", zone: actor === "runner" ? "grip" : "hq" };
  }
  if (actionType === "gain_credit") return { kind: "economy", side: actor ?? "corp" };
  if (actionType === "score_agenda") return { kind: "zone", side: "corp", zone: "scoreArea" };
  if (actionType === "steal_agenda") return { kind: "zone", side: "runner", zone: "scoreArea" };
  if (actionType === "access_card") {
    return { kind: "server", ...(stringValue(payload.serverId) ? { serverId: stringValue(payload.serverId)! } : {}), ...(stringValue(payload.serverLabel) ? { serverLabel: serverDisplayLabel(stringValue(payload.serverLabel)!) } : {}), lane: "central" };
  }
  if (actionType === "trash_accessed_card") return { kind: "zone", side: actor === "runner" ? "corp" : "runner", zone: actor === "runner" ? "archives" : "heap" };
  if (actionType === "trash_resource" || actionType === "remove_tag") return { kind: "zone", side: "runner", zone: "rig" };
  if (visibility === "redacted") return serverHighlight(payload);

  const cardDefinitionId = stringValue(payload.cardDefinitionId);
  const visibleCard = cardDefinitionId ? visibleCards.get(cardDefinitionId) : undefined;
  if (visibleCard?.instanceId) {
    return {
      kind: "card",
      cardInstanceId: visibleCard.instanceId,
      ...(visibleCard.definitionId ? { cardDefinitionId: visibleCard.definitionId } : {}),
      ...(visibleCard.title ? { title: visibleCard.title } : {})
    };
  }

  if (actionType === "install_card") {
    if (actor === "runner") return { kind: "zone", side: "runner", zone: "rig" };
    return serverHighlight(payload);
  }
  if (actionType === "play_event") return { kind: "zone", side: "runner", zone: "heap" };
  if (actionType === "play_operation") return { kind: "zone", side: "corp", zone: "archives" };
  if (actionType === "advance_card") return serverHighlight(payload);
  return undefined;
}

function deriveRelatedCard(payload: Record<string, unknown>, visibility: ChronicleVisibility, visibleCards: Map<string, VisibleCard>): VisibleCard | undefined {
  if (visibility === "redacted") return undefined;
  const cardDefinitionId = stringValue(payload.cardDefinitionId);
  const visibleCard = cardDefinitionId ? visibleCards.get(cardDefinitionId) : undefined;
  return visibleCard?.known ? visibleCard : undefined;
}

function serverHighlight(payload: Record<string, unknown>): BoardHighlight {
  const zoneLabel = stringValue(payload.zoneLabel);
  return {
    kind: "server",
    ...(stringValue(payload.serverId) ? { serverId: stringValue(payload.serverId)! } : {}),
    ...(stringValue(payload.serverLabel) ? { serverLabel: serverDisplayLabel(stringValue(payload.serverLabel)!) } : {}),
    lane: zoneLabel === "ICE" ? "ice" : zoneLabel === "Root" ? "root" : "central"
  };
}

export function actionSoundForActionType(actionType: string, visibility: ChronicleVisibility): ActionSoundKind | undefined {
  switch (actionType) {
    case "mandatory_draw":
    case "draw_card":
      return "draw";
    case "gain_credit":
      return "credit";
    case "install_card":
    case "advance_card":
      return visibility === "redacted" ? "install_hidden" : "install_known";
    case "play_event":
    case "play_operation":
      return "play";
    case "rez_ice":
      return "rez";
    case "start_run":
    case "continue_run":
    case "decline_rez":
    case "pump_breaker":
    case "break_subroutine":
      return "run";
    case "access_card":
      return "access";
    case "score_agenda":
    case "steal_agenda":
      return "agenda";
    case "trash_accessed_card":
    case "trash_resource":
      return "trash";
    case "remove_tag":
      return "tag_or_damage";
    case "end_turn":
      return "turn";
    default:
      return undefined;
  }
}

function visibleCardsByDefinition(view: PlayerView): Map<string, VisibleCard> {
  const cards = [
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    ...view.opponent.scoreArea,
    ...(view.opponent.rig ?? []),
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : []),
    ...(view.run?.accessedCard ? [view.run.accessedCard] : [])
  ];
  return new Map(cards.filter((card) => card.known && card.definitionId).map((card) => [card.definitionId!, card]));
}

function hasLocalAttention(view: PlayerView, viewerSide: Side): boolean {
  return Boolean(view.pendingChoice || (view.activeSide === viewerSide && view.legalActions.length > 0));
}

function actorLabel(actor: Side | undefined, source: OpponentActionCue["source"]): string {
  if (!actor) return "Spiel";
  if (actor === "corp") return source === "ai" ? "Korp-KI" : "Korp";
  return source === "ai" ? "Runner-KI" : "Runner";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}
