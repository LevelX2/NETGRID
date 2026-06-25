"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { PublicGameEvent, Side } from "@netgrid/shared";

import {
  chronicleActionUseByEventId,
  chronicleGroupLabel,
  chronicleRunGroupLabelFromEvent,
  chronicleTurnGroupLabel,
  chronicleTurnNumberByEventId,
  chronicleTurnSideByEventId,
  formatChronicleEffectItems,
  formatChronicleEvent,
  isISpySuccessfulRunFollowupPayload,
  shouldSuppressChronicleEventItem,
  type ChronicleContext,
  type ChronicleItem
} from "../../app/chronicle";
import { localizedDeCardTitle } from "../../app/card-image-manifest";
import { groupChronicleEntriesForRender } from "../../app/chronicleGrouping";
import { type DisplayVisibleCard } from "../cards/card-view-model";
import { neededDevelopmentLabel } from "../cards/card-detail-lines";
import { type CardDisplayMode, type ChronicleDetailMode } from "../settings/settings-model";
import { ChronicleEntry, type ChronicleGroupKind } from "./ChronicleEntry";

type CatalogCardSummary = {
  catalogCardId: string;
  title: string;
  type: string;
  subtypes: string[];
};

type CatalogCardDetail = CatalogCardSummary & {
  side: Side;
  setId: string;
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null | undefined>;
  definitionId?: string;
};

const CATALOG_NUMERIC_LABELS: Record<string, string> = {
  cost: "Kosten",
  installCost: "Install",
  memoryCost: "MU",
  strength: "Stärke",
  rezCost: "Rez",
  trashCost: "Trash",
  advancementRequirement: "Benötigt",
  agendaPoints: "Agenda"
};

function formatCatalogTerm(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "ice") return "ICE";
  if (normalized === "event") return "Prep";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatCatalogTypeLine(card: Pick<CatalogCardSummary, "type" | "subtypes">): string {
  const type = formatCatalogTerm(card.type);
  const subtypes = card.subtypes.map(formatCatalogTerm).join(" / ");
  return [type, subtypes].filter(Boolean).join(" - ");
}

function catalogSetDetailLabel(card: CatalogCardDetail): string {
  return [card.setName, card.collectorNumber].filter(Boolean).join(" #");
}

function catalogDetailLines(card: CatalogCardDetail): string[] {
  const typeLine = [card.side, formatCatalogTypeLine(card)].filter(Boolean).join(" · ");
  const setLine = catalogSetDetailLabel(card);
  const numberLine = Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = card.numeric[key];
      return catalogNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
  return [typeLine, setLine, numberLine].filter((line): line is string => Boolean(line));
}

function catalogNumericLabel(key: string, label: string, value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (key === "advancementRequirement") return neededDevelopmentLabel(value);
  return `${label} ${value}`;
}

function payloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function payloadStringList(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function payloadSide(payload: Record<string, unknown>, key: string): Side | null {
  const value = payload[key];
  return value === "runner" || value === "corp" ? value : null;
}

function payloadPositiveInteger(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
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

function revealedEventCardIds(event: PublicGameEvent): string[] {
  const ids = [
    revealedEventCardId(event),
    ...payloadStringList(event.publicPayload, "publicRevealDefinitionIds"),
    ...payloadStringList(event.publicPayload, "revealedAgendaDefinitionIds")
  ].filter((value): value is string => Boolean(value));
  return Array.from(new Set(ids));
}

function eventCardDetail(event: PublicGameEvent, detailsById: Record<string, CatalogCardDetail>): CatalogCardDetail | null {
  const cardId = revealedEventCardId(event);
  return cardId ? (detailsById[cardId] ?? null) : null;
}

export function chronicleContextByEventId(
  events: PublicGameEvent[],
  detailsById: Record<string, CatalogCardDetail>,
  options: { preferGermanCardImages?: boolean } = {}
): Record<string, Omit<ChronicleContext, "side">> {
  const turnNumberByEventId = chronicleTurnNumberByEventId(events);
  const turnSideByEventId = chronicleTurnSideByEventId(events);
  const actionUseByEventId = chronicleActionUseByEventId(events);
  const hasServerTurnContext = events.some((event) => payloadPositiveInteger(event.publicPayload, "chronicleTurnNumber"));
  const firstEvent = events[0];
  const tailLikelyTruncated =
    firstEvent !== undefined &&
    !hasServerTurnContext &&
    firstEvent.type !== "game_created" &&
    payloadString(firstEvent.publicPayload, "actionType") !== "game_created";
  return Object.fromEntries(
    events.map((event) => {
      const card = eventCardDetail(event, detailsById);
      const cardId = card?.catalogCardId ?? revealedEventCardId(event);
      const cardTitle = options.preferGermanCardImages ? localizedDeCardTitle(cardId) ?? card?.title ?? null : card?.title ?? null;
      const serverTurnNumber = payloadPositiveInteger(event.publicPayload, "chronicleTurnNumber");
      return [
        event.eventId,
        {
          cardTitle,
          cardText: card?.text ?? null,
          cardType: card?.type ?? null,
          cardDetailLines: card ? catalogDetailLines(card) : [],
          agendaPoints: typeof card?.numeric.agendaPoints === "number" ? card.numeric.agendaPoints : null,
          turnNumber: serverTurnNumber ?? (tailLikelyTruncated ? null : turnNumberByEventId[event.eventId]) ?? null,
          turnSide: payloadSide(event.publicPayload, "chronicleTurnSide") ?? turnSideByEventId[event.eventId] ?? null,
          actionUse: actionUseByEventId[event.eventId] ?? null
        }
      ];
    })
  );
}

export function ChroniclePanel({
  events,
  turnContextEvents = events,
  side,
  cardDetailsById,
  displayMode,
  detailMode,
  preferGermanCardImages,
  onFocusCard
}: {
  events: PublicGameEvent[];
  turnContextEvents?: PublicGameEvent[];
  side: Side;
  cardDetailsById: Record<string, CatalogCardDetail>;
  displayMode: CardDisplayMode;
  detailMode: ChronicleDetailMode;
  preferGermanCardImages: boolean;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const contextByEventId = chronicleContextByEventId(turnContextEvents, cardDetailsById, { preferGermanCardImages });
  const entries = chronicleEntriesWithRunGroups(events, side, contextByEventId, cardDetailsById).reverse();
  const groupedEntries = groupChronicleEntriesForRender(entries);
  const shownChronicleGroupLabels = new Set<string>();
  function toggleChronicleGroup(key: string) {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className={`section chroniclePanel ${collapsed ? "collapsed" : ""}`} data-testid="chronicle">
      <div className="sectionTitleLine">
        <div>
          <h2>Spielchronik</h2>
          {collapsed && entries.length > 0 ? <p className="chronicleCollapsedMeta">{entries.length} Einträge</p> : null}
        </div>
        <button
          className="button iconOnly chronicleToggle"
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Spielchronik ausklappen" : "Spielchronik einklappen"}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
      {!collapsed ? (
        <div className="chronicleList">
          {entries.length === 0 ? <p className="meta">Noch keine Einträge.</p> : null}
          {groupedEntries.map((group) => {
            const groupKey = chronicleGroupCollapseKey(group.label, group.kind, group.turnGroupLabel, group.firstItemId);
            const groupRenderKey = `${groupKey}:${group.firstItemId}`;
            const turnKey = group.turnGroupLabel ? chronicleTurnGroupCollapseKey(group.turnGroupLabel) : null;
            const isTurnGroup = Boolean(group.turnGroupLabel && group.label === group.turnGroupLabel);
            const turnCollapsed = Boolean(turnKey && collapsedGroups.has(turnKey));
            const groupCollapsed = collapsedGroups.has(groupKey);
            const hiddenByParent = group.kind === "run" && turnCollapsed;
            const entriesCollapsed = isTurnGroup ? groupCollapsed : groupCollapsed || turnCollapsed;
            if (hiddenByParent) return null;
            const shouldRenderGroup = chronicleGroupShouldRender(group.label, shownChronicleGroupLabels);
            return (
              <div className={`chronicleGroupBlock group-${group.kind} ${entriesCollapsed ? "entriesCollapsed" : ""}`} key={groupRenderKey}>
                {shouldRenderGroup ? (
                  <button
                    className={`chronicleGroup ${group.kind} ${groupCollapsed ? "collapsed" : ""}`}
                    type="button"
                    aria-expanded={!groupCollapsed}
                    aria-label={`${group.label} ${groupCollapsed ? "ausklappen" : "einklappen"}`}
                    onClick={() => toggleChronicleGroup(isTurnGroup && turnKey ? turnKey : groupKey)}
                  >
                    <span>{group.label}</span>
                    {groupCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                  </button>
                ) : null}
                {!entriesCollapsed
                  ? group.entries.map((entry) => (
                      <ChronicleEntry key={entry.item.id} item={entry.item} card={entry.card} displayMode={displayMode} detailMode={detailMode} groupKind={entry.groupKind} onFocusCard={onFocusCard} />
                    ))
                  : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function chronicleTurnGroupCollapseKey(label: string): string {
  return `turn:${label}`;
}

function chronicleGroupCollapseKey(label: string, kind: ChronicleGroupKind, turnGroupLabel: string | null, firstItemId: string): string {
  if (turnGroupLabel && label === turnGroupLabel) return chronicleTurnGroupCollapseKey(label);
  return `${kind}:${turnGroupLabel ?? "none"}:${label}:${firstItemId}`;
}

function chronicleGroupShouldRender(label: string, shownLabels: Set<string>): boolean {
  if (!chronicleDeduplicatedGroupLabel(label)) return true;
  if (shownLabels.has(label)) return false;
  shownLabels.add(label);
  return true;
}

function chronicleDeduplicatedGroupLabel(label: string): boolean {
  return /^Zug(?:\s+\d+)?\s+-\s+(?:Korp|Runner)$/.test(label);
}

function chronicleEntriesWithRunGroups(
  events: PublicGameEvent[],
  side: Side,
  contextByEventId: Record<string, Omit<ChronicleContext, "side">>,
  cardDetailsById: Record<string, CatalogCardDetail>
): Array<{ card: CatalogCardDetail | null; item: ChronicleItem; groupLabel: string; groupKind: ChronicleGroupKind; turnGroupLabel: string | null; groupInstanceKey: string | null }> {
  const entries: Array<{ card: CatalogCardDetail | null; item: ChronicleItem; groupLabel: string; groupKind: ChronicleGroupKind; turnGroupLabel: string | null; groupInstanceKey: string | null }> = [];
  let activeRunGroupLabel: string | null = null;
  let activeRunGroupKey: string | null = null;
  let runEndPending = false;

  for (const event of events) {
    const actionType = payloadString(event.publicPayload, "actionType") ?? event.type;
    const actor = payloadSide(event.publicPayload, "actor");
    const turnNumber = contextByEventId[event.eventId]?.turnNumber ?? null;
    const turnSide = contextByEventId[event.eventId]?.turnSide ?? actor;
    const turnGroup = turnSide ? { label: chronicleTurnGroupLabel(turnSide, turnNumber), kind: turnSide } : null;
    if (runEndPending && !chronicleActionContinuesCompletedRun(event, actionType)) {
      activeRunGroupLabel = null;
      activeRunGroupKey = null;
      runEndPending = false;
    }
    const startedRunGroupLabel = chronicleRunGroupLabelFromEvent(event);
    if (startedRunGroupLabel) {
      activeRunGroupLabel = startedRunGroupLabel;
      activeRunGroupKey = `run:${event.eventId}`;
      runEndPending = false;
    }

    const eventItem = formatChronicleEvent(event, side, contextByEventId[event.eventId] ?? {});
    const effectItems = formatChronicleEffectItems(event, side);
    const items = shouldSuppressChronicleEventItem(event) ? effectItems : [eventItem, ...effectItems];
    const eventGroupLabel = activeRunGroupLabel && chronicleEventBelongsToActiveRun(event, actionType, items, cardDetailsById) ? activeRunGroupLabel : null;
    const eventGroupInstanceKey = eventGroupLabel ? activeRunGroupKey : null;
    for (const item of items) {
      const card = item.cardDefinitionId ? (cardDetailsById[item.cardDefinitionId] ?? null) : eventCardDetail(event, cardDetailsById);
      const startTurnEffectGroup = chronicleStartTurnEffectGroup(actionType, actor, turnNumber, item);
      const groupLabel = eventGroupLabel ?? startTurnEffectGroup?.label ?? turnGroup?.label ?? chronicleGroupLabel(item);
      const groupKind = eventGroupLabel ? "run" : startTurnEffectGroup?.kind ?? turnGroup?.kind ?? chronicleGroupKindFromItem(item);
      entries.push({ card, item, groupLabel, groupKind, turnGroupLabel: startTurnEffectGroup?.label ?? turnGroup?.label ?? null, groupInstanceKey: eventGroupInstanceKey });
    }

    if (chronicleActionCompletesRun(event, actionType)) runEndPending = true;
  }

  return entries;
}

function chronicleStartTurnEffectGroup(
  actionType: string,
  eventActor: Side | null,
  eventTurnNumber: number | null,
  item: ChronicleItem
): { label: string; kind: ChronicleGroupKind } | null {
  if (actionType !== "end_turn" || !eventActor || !item.actor || item.actor === eventActor) return null;
  if (!item.chips.includes("Automatisch")) return null;
  const label = chronicleTurnGroupLabel(item.actor, eventTurnNumber ? eventTurnNumber + 1 : null);
  return { label, kind: item.actor };
}

function chronicleGroupKindFromItem(item: ChronicleItem): ChronicleGroupKind {
  if (item.groupLabel.startsWith("Run")) return "run";
  if (item.actor === "corp" || /^Zug(?:\s+\d+)?\s+-\s+Korp$/.test(item.groupLabel)) return "corp";
  if (item.actor === "runner" || /^Zug(?:\s+\d+)?\s+-\s+Runner$/.test(item.groupLabel)) return "runner";
  if (item.category === "system") return "system";
  return "neutral";
}

function chronicleEventBelongsToActiveRun(
  event: PublicGameEvent,
  actionType: string,
  items: ChronicleItem[],
  cardDetailsById: Record<string, CatalogCardDetail>
): boolean {
  if (actionType === "end_turn" || actionType === "mandatory_draw") return false;
  if (actionType === "play_event" && event.publicPayload.runnerEventRun === true) return true;
  if (actionType === "resolve_choice" && chronicleResolveChoiceBelongsToRun(event)) return true;
  if (actionType === "trigger_ability" || actionType === "activated_card_ability") {
    const card = eventCardDetail(event, cardDetailsById);
    return card?.type === "ice" || items.some((item) => chronicleGroupLabel(item).startsWith("Run") || item.category === "run");
  }
  return chronicleRunContextActionTypes.has(actionType) || items.some((item) => chronicleGroupLabel(item).startsWith("Run") || item.category === "run");
}

function chronicleResolveChoiceBelongsToRun(event: PublicGameEvent): boolean {
  const payload = event.publicPayload ?? {};
  if (
    payload.socialEngineeringRun === true ||
    chroniclePayloadTargetBoolean(payload, "autoPassChosenIce") === true ||
    typeof payload.traceStep === "string" ||
    payload.ambushDefinitionId ||
    payload.accessEffectSourceDefinitionId ||
    payload.ambushPaidCost !== undefined ||
    payload.ambushPaymentDeclined === true ||
    payload.hiddenZoneAction === "proteus_breaker_strength_penalty_access_counters" ||
    payload.counterType === "breaker_strength_penalty"
  )
    return true;
  const effects = Array.isArray(payload.resolvedEffects) ? payload.resolvedEffects : [];
  return effects.some(
    (effect) =>
      effect &&
      typeof effect === "object" &&
      ((effect as Record<string, unknown>).reason === "access_effect" ||
        (effect as Record<string, unknown>).counterType ===
          "breaker_strength_penalty"),
  );
}

function chroniclePayloadTargetBoolean(payload: Record<string, unknown>, key: string): boolean | null {
  const direct = payload[key];
  if (typeof direct === "boolean") return direct;
  const targets = payload.targets;
  if (!targets || typeof targets !== "object") return null;
  const nested = (targets as Record<string, unknown>)[key];
  return typeof nested === "boolean" ? nested : null;
}

const chronicleRunContextActionTypes = new Set([
  "start_run",
  "rez_ice",
  "decline_rez",
  "pump_breaker",
  "break_subroutine",
  "continue_run",
  "jack_out",
  "access_card",
  "trash_accessed_card",
  "steal_agenda",
  "decline_trash"
]);

function chronicleActionContinuesCompletedRun(event: PublicGameEvent, actionType: string): boolean {
  if (actionType === "trigger_ability" && isISpySuccessfulRunFollowupPayload(event.publicPayload)) return true;
  return actionType === "access_card" || actionType === "resolve_choice" || actionType === "trash_accessed_card" || actionType === "steal_agenda" || actionType === "decline_trash";
}

function chronicleActionCompletesRun(event: PublicGameEvent, actionType: string): boolean {
  if (actionType === "jack_out" || actionType === "access_card" || actionType === "trash_accessed_card" || actionType === "steal_agenda" || actionType === "decline_trash") return true;
  if (actionType === "continue_run") return payloadString(event.publicPayload, "result") === "ended" || event.publicPayload.rioRunEnded === true;
  return false;
}
