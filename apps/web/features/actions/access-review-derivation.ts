import type { LegalAction, PlayerView, PublicGameEvent, Side } from "@netgrid/shared";

import { accessRevealStatusLabel, serverDisplayLabel } from "../../app/action-board-ui";
import {
  enrichVisibleCard,
  visibleCardFromCatalogDetail,
  visibleCardFromPublicEvent
} from "../cards/card-view-model";
import type { AccessReveal, ExposeReview } from "./AccessReviewModals";

type CatalogCardSummary = {
  catalogCardId: string;
  title: string;
  side: Side;
  type: string;
  subtypes: string[];
};

type CatalogCardDetail = CatalogCardSummary & {
  setId: string;
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null | undefined>;
};

export function revealedEventCardIds(event: PublicGameEvent): string[] {
  const ids = [
    revealedEventCardId(event),
    ...payloadStringList(event.publicPayload, "publicRevealDefinitionIds"),
    ...payloadStringList(event.publicPayload, "revealedAgendaDefinitionIds")
  ].filter((value): value is string => Boolean(value));
  return Array.from(new Set(ids));
}

export function accessRevealFromLatestEvent(
  event: PublicGameEvent | undefined,
  detailsById: Record<string, CatalogCardDetail>,
  legalActions: LegalAction[],
  viewerSide: Side,
  events: PublicGameEvent[] = []
): AccessReveal | null {
  if (!event || event.publicPayload.actionType !== "access_card") return null;
  const cardId = payloadString(event.publicPayload, "cardDefinitionId");
  const title = payloadString(event.publicPayload, "title");
  if (!cardId || !title) return null;
  const actorSide = payloadSide(event.publicPayload, "actor") ?? "runner";
  const detail = detailsById[cardId] ?? null;
  const card = detail ? visibleCardFromCatalogDetail(detail) : visibleCardFromPublicEvent(event, cardId, title);
  const serverLabel = serverDisplayLabel(payloadString(event.publicPayload, "serverLabel") ?? "einen Server");
  const actions = legalActions.filter((action) => ["access_card", "steal_agenda", "trash_accessed_card", "decline_trash"].includes(action.type));
  const pendingAmbushStatus = accessAmbushPendingStatus(viewerSide, event, undefined, events);
  const highlighterStatus = accessHighlighterStatus(event.publicPayload);
  return {
    eventId: event.eventId,
    kind: "access",
    actorSide,
    viewerSide,
    serverLabel,
    serverTitleLabel: accessServerTitleLabel(serverLabel),
    serverLocationPhrase: accessServerLocationPhrase(serverLabel),
    description: accessRevealDescription(actorSide, viewerSide, serverLabel),
    card,
    actions,
    trashStatus: pendingAmbushStatus ?? accessRevealStatusLabel(card, actions, actorSide, viewerSide, serverLabel),
    ...(highlighterStatus ? { followupStatus: highlighterStatus } : {})
  };
}

export function accessRevealFromCurrentRun(
  view: PlayerView,
  detailsById: Record<string, CatalogCardDetail>,
  legalActions: LegalAction[],
  viewerSide: Side,
  events: PublicGameEvent[],
  accessEvent: PublicGameEvent | null,
  eventId?: string
): AccessReveal | null {
  const accessedCard = view.run?.accessedCard;
  if (!accessedCard?.known || !accessedCard.title) return null;
  const actorSide: Side = "runner";
  const serverLabel = serverDisplayLabel(view.run?.breach?.serverId ?? view.run?.attackedServerId ?? "einen Server");
  const actions = legalActions.filter((action) => ["access_card", "steal_agenda", "trash_accessed_card", "decline_trash"].includes(action.type));
  const card = enrichVisibleCard(accessedCard, detailsById);
  const followupStatus = latestAccessAmbushPaymentStatus(events, accessEvent, card.definitionId);
  const pendingAmbushStatus = accessAmbushPendingStatus(viewerSide, accessEvent, view, events);
  const highlighterStatus = accessEvent ? accessHighlighterStatus(accessEvent.publicPayload) : null;
  const accessFollowupStatus = highlighterStatus ?? followupStatus;
  return {
    eventId: eventId ?? accessEvent?.eventId ?? `current-access:${view.stateVersion}:${accessedCard.instanceId}`,
    kind: "access",
    actorSide,
    viewerSide,
    serverLabel,
    serverTitleLabel: accessServerTitleLabel(serverLabel),
    serverLocationPhrase: accessServerLocationPhrase(serverLabel),
    description: accessRevealDescription(actorSide, viewerSide, serverLabel),
    card,
    actions,
    trashStatus: pendingAmbushStatus ?? accessRevealStatusLabel(card, actions, actorSide, viewerSide, serverLabel),
    ...(accessFollowupStatus ? { followupStatus: accessFollowupStatus } : {})
  };
}

export function archivesRevealFromLatestEvent(
  event: PublicGameEvent | undefined,
  detailsById: Record<string, CatalogCardDetail>,
  viewerSide: Side
): AccessReveal | null {
  if (!event || !isArchivesBreachRevealEvent(event)) return null;
  const actorSide = payloadSide(event.publicPayload, "actor") ?? "runner";
  const count = payloadPositiveInteger(event.publicPayload, "archivesRevealCount") ?? 0;
  const definitionIds = payloadStringList(event.publicPayload, "archivesRevealDefinitionIds").length > 0
    ? payloadStringList(event.publicPayload, "archivesRevealDefinitionIds")
    : payloadStringList(event.publicPayload, "publicRevealDefinitionIds");
  if (definitionIds.length === 0) return null;
  const titles = payloadPipeStringList(event.publicPayload, "archivesRevealTitles").length > 0
    ? payloadPipeStringList(event.publicPayload, "archivesRevealTitles")
    : payloadPipeStringList(event.publicPayload, "publicRevealTitles");
  const cards = definitionIds.map((definitionId, index) => {
    const detail = detailsById[definitionId] ?? null;
    const title = detail?.title ?? titles[index] ?? definitionId;
    return detail ? visibleCardFromCatalogDetail(detail) : visibleCardFromPublicEvent(event, definitionId, title);
  });
  const serverLabel = "Archive";
  return {
    eventId: event.eventId,
    kind: "archives_reveal",
    actorSide,
    viewerSide,
    serverLabel,
    serverTitleLabel: accessServerTitleLabel(serverLabel),
    serverLocationPhrase: accessServerLocationPhrase(serverLabel),
    description: archivesRevealDescription(actorSide, viewerSide, count || cards.length),
    revealedCards: cards,
    actions: [],
    trashStatus: cards.length === 1 ? "Diese Karte liegt jetzt offen im Archiv." : "Diese Karten liegen jetzt offen im Archiv."
  };
}

export function exposeReviewFromLatestEvent(
  event: PublicGameEvent | undefined,
  detailsById: Record<string, CatalogCardDetail>,
  viewerSide: Side
): ExposeReview | null {
  if (!event || event.publicPayload.publicRevealKind !== "expose") return null;
  if (event.publicPayload.approachIceExposeDecision) return null;
  const definitionIds = exposeReviewDefinitionIds(event);
  if (definitionIds.length === 0) return null;
  const cards = definitionIds.map((definitionId) => {
    const detail = detailsById[definitionId] ?? null;
    const title = detail?.title ?? definitionId;
    return detail ? visibleCardFromCatalogDetail(detail) : visibleCardFromPublicEvent(event, definitionId, title);
  });
  const actorSide = payloadSide(event.publicPayload, "actor") ?? "runner";
  const serverLabels = payloadStringList(event.publicPayload, "exposedServerLabels").map(serverDisplayLabel);
  return {
    eventId: event.eventId,
    actorSide,
    viewerSide,
    cards,
    serverLabels,
    title: cards.length === 1 ? "Karte angesehen" : `${cards.length} Karten angesehen`,
    description: exposeReviewDescription(actorSide, viewerSide, cards.length, serverLabels)
  };
}

export function retainedArchivesRevealEvent(events: PublicGameEvent[], dismissedEventIds: string[]): PublicGameEvent | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (isArchivesBreachRevealEvent(event))
      return dismissedEventIds.includes(event.eventId) ? null : event;
    if (event.publicPayload.actionType === "start_run") return null;
  }
  return null;
}

function revealedEventCardId(event: PublicGameEvent): string | null {
  const cardId =
    event.publicPayload.cardDefinitionId ??
    event.publicPayload.sourceDefinitionId ??
    event.publicPayload.targetCardDefinitionId ??
    event.publicPayload.publicRevealDefinitionId ??
    event.publicPayload.priorityRequisitionTargetDefinitionId;
  return typeof cardId === "string" ? cardId : null;
}

function exposeReviewDefinitionIds(event: PublicGameEvent): string[] {
  return Array.from(
    new Set(
      [
        payloadString(event.publicPayload, "publicRevealDefinitionId"),
        ...payloadStringList(event.publicPayload, "publicRevealDefinitionIds")
      ].filter((value): value is string => Boolean(value))
    )
  );
}

function exposeReviewDescription(actorSide: Side, viewerSide: Side, count: number, serverLabels: string[]): string {
  const subject = actorSide === viewerSide ? "Du hast" : `${accessActorSubject(actorSide)} hat`;
  const object = count === 1 ? "eine Karte" : `${count} Karten`;
  const locations = Array.from(new Set(serverLabels)).filter(Boolean);
  return `${subject} ${object}${locations.length > 0 ? ` in ${locations.join(", ")}` : ""} angesehen.`;
}

function payloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function payloadStringList(payload: Record<string, unknown>, key: string): string[] {
  return (
    payloadString(payload, key)
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function payloadPipeStringList(payload: Record<string, unknown>, key: string): string[] {
  return (
    payloadString(payload, key)
      ?.split("|")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function payloadSide(payload: Record<string, unknown>, key: string): Side | null {
  const value = payloadString(payload, key);
  return value === "corp" || value === "runner" ? value : null;
}

function payloadPositiveInteger(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function payloadNumber(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function accessHighlighterStatus(payload: Record<string, unknown>): string | null {
  const highlighterCounterCount = payloadPositiveInteger(payload, "highlighterCounterCount") ?? 0;
  const highlighterAccessBonus = payloadPositiveInteger(payload, "highlighterAccessBonus") ?? Math.max(0, highlighterCounterCount - 1);
  const accessIndex = payloadNumber(payload, "accessIndex");
  const baseAccessCount = payloadPositiveInteger(payload, "baseAccessCount") ?? 1;
  const effectiveAccessCount = payloadPositiveInteger(payload, "effectiveAccessCount");
  if (
    highlighterCounterCount <= 1 ||
    highlighterAccessBonus <= 0 ||
    accessIndex === null ||
    effectiveAccessCount === null ||
    accessIndex < Math.max(1, baseAccessCount)
  )
    return null;
  return `Zusätzlicher R&D-Zugriff ${accessIndex + 1} von ${Math.max(accessIndex + 1, effectiveAccessCount)}: Die Korp hat ${highlighterCounterCount} Highlighter-Counter.`;
}

function accessRevealDescription(actorSide: Side, viewerSide: Side, serverLabel: string): string {
  const location = accessServerLocationPhrase(serverLabel);
  if (actorSide === viewerSide) return `Du hast auf eine Karte ${location} zugegriffen.`;
  return `${accessActorSubject(actorSide)} hat auf eine Karte ${location} zugegriffen.`;
}

function archivesRevealDescription(actorSide: Side, viewerSide: Side, count: number): string {
  const subject = actorSide === viewerSide ? "Du hast" : `${accessActorSubject(actorSide)} hat`;
  const object = count === 1 ? "eine verdeckte Karte" : `${count} verdeckte Karten`;
  return `${subject} ${object} im Archiv aufgedeckt.`;
}

function isArchivesBreachRevealEvent(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  if (payload.actionType !== "start_run") return false;
  if (payload.hiddenZoneAction !== "archives_breach_reveal") return false;
  const serverLabel = serverDisplayLabel(payloadString(payload, "serverLabel") ?? payloadString(payload, "serverId") ?? "");
  return serverLabel === "Archive" && Boolean(payloadPositiveInteger(payload, "archivesRevealCount"));
}

function accessActorSubject(side: Side): string {
  return side === "corp" ? "Die Korp" : "Der Runner";
}

function accessServerTitleLabel(serverLabel: string): string {
  if (serverLabel === "HQ") return "Hauptquartier (HQ)";
  return serverLabel;
}

function accessServerLocationPhrase(serverLabel: string): string {
  if (serverLabel === "HQ") return "im Hauptquartier (HQ)";
  if (serverLabel === "Archive") return "im Archiv";
  if (/^Remote \d+$/.test(serverLabel)) return `in ${serverLabel}`;
  return `in ${serverLabel}`;
}

function latestAccessAmbushPaymentStatus(events: PublicGameEvent[], accessEvent: PublicGameEvent | null, cardDefinitionId?: string): string | undefined {
  if (!accessEvent || !cardDefinitionId) return undefined;
  const accessIndex = events.findIndex((event) => event.eventId === accessEvent.eventId);
  if (accessIndex < 0) return undefined;
  for (let index = events.length - 1; index > accessIndex; index -= 1) {
    const payload = events[index]?.publicPayload;
    if (!payload || payload.actionType !== "resolve_choice") continue;
    const ambushDefinitionId = payloadString(payload, "ambushDefinitionId") ?? payloadString(payload, "accessEffectSourceDefinitionId");
    if (ambushDefinitionId !== cardDefinitionId) continue;
    const paidCost = payloadPositiveInteger(payload, "ambushPaidCost");
    if (paidCost) return `Die Korp hat ${paidCost} ${paidCost === 1 ? "Credit" : "Credits"} für den Access-Ambush bezahlt.`;
    if (payload.ambushPaymentDeclined === true) return "Die Korp hat den Access-Ambush nicht bezahlt.";
  }
  return undefined;
}

function accessAmbushPendingStatus(viewerSide: Side, accessEvent: PublicGameEvent | null | undefined, view?: PlayerView, events: PublicGameEvent[] = []): string | undefined {
  const eventChoiceResolved = accessEvent ? accessAmbushPaymentChoiceResolved(events, accessEvent) : false;
  const eventChoiceOpened = !eventChoiceResolved && accessEvent?.publicPayload.ambushPaymentChoiceOpened === true;
  const eventAmount = eventChoiceOpened ? payloadPositiveInteger(accessEvent.publicPayload, "ambushPaymentAmount") : null;
  const choiceAmount = view?.pendingChoice?.source.startsWith("p3_35.access_payment") ? accessAmbushChoiceAmount(view.pendingChoice) : null;
  const amount = eventAmount ?? choiceAmount;
  const pending = Boolean(amount || eventChoiceOpened || view?.pendingChoice?.source.startsWith("p3_35.access_payment"));
  if (!pending) return undefined;
  const amountText = amount ? `${amount} ${amount === 1 ? "Credit" : "Credits"}` : "Credits";
  if (viewerSide === "corp" && view?.pendingChoice?.source.startsWith("p3_35.access_payment")) {
    return `Du entscheidest jetzt, ob du ${amountText} für den Access-Ambush zahlst.`;
  }
  return `Die Korp entscheidet jetzt, ob sie ${amountText} für den Access-Ambush zahlt.`;
}

function accessAmbushPaymentChoiceResolved(events: PublicGameEvent[], accessEvent: PublicGameEvent): boolean {
  const accessIndex = events.findIndex((event) => event.eventId === accessEvent.eventId);
  if (accessIndex < 0) return false;
  const accessDefinitionId = payloadString(accessEvent.publicPayload, "cardDefinitionId");
  for (let index = accessIndex + 1; index < events.length; index += 1) {
    const payload = events[index]?.publicPayload;
    if (!payload || payload.actionType !== "resolve_choice") continue;
    const ambushDefinitionId = payloadString(payload, "ambushDefinitionId") ?? payloadString(payload, "accessEffectSourceDefinitionId");
    if (accessDefinitionId && ambushDefinitionId && ambushDefinitionId !== accessDefinitionId) continue;
    if (payload.ambushPaymentDeclined === true) return true;
    if (payloadPositiveInteger(payload, "ambushPaidCost")) return true;
  }
  return false;
}

function accessAmbushChoiceAmount(choice: NonNullable<PlayerView["pendingChoice"]>): number | null {
  for (const option of choice.options) {
    const match = /^(\d+)\s+Credits?\s+zahlen$/i.exec(option.label.trim());
    if (match?.[1]) return Number(match[1]);
  }
  return null;
}
