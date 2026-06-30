"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";

import { type BoardHighlight } from "../../app/action-cues";
import {
  actionMatchesContext,
  groupRunnerRigCards,
  runAwareActionButtonLabel,
  runnerRigMemorySummary,
  type ActionContext,
} from "../../app/action-board-ui";
import {
  enrichVisibleCard,
  type DisplayVisibleCard,
} from "../cards/card-view-model";
import { useCardScaleSettings } from "../cards/card-display-settings";
import { CARD_SCALE_PERCENT_MIN, type CardDisplayMode } from "../settings/settings-model";
import { CardView } from "../cards/CardView";
import { SideZoneFrame, zoneSideClass } from "./ZoneFrame";

const RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT = 18;
const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

type CardDetailsById = Parameters<typeof enrichVisibleCard>[1];

type CardChoiceShortcut = {
  selected: boolean;
  disabled: boolean;
  onToggle(): void;
  label: string;
  selectedLabel: string;
  icon?: "add" | "eye";
};

export type FieldChoiceCardProps = {
  choiceSelected?: boolean;
  choiceShortcut?: CardChoiceShortcut;
  onSelect?: (card: DisplayVisibleCard, hiddenSide?: Side) => void;
};

export function RunnerOpponentZonesStrip({
  view,
  cardDetailsById,
  displayMode,
  selectedContext,
  contextualActions,
  actionDisabled,
  highlightedZone,
  onFocus,
  onActionContext,
  onAction
}: {
  view: PlayerView;
  cardDetailsById: CardDetailsById;
  displayMode: CardDisplayMode;
  selectedContext: ActionContext | null;
  contextualActions: LegalAction[];
  actionDisabled: boolean;
  highlightedZone: BoardHighlight | null;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContext(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction(action: LegalAction): void;
}) {
  const { zonePercent } = useCardScaleSettings();
  const zoneCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, zonePercent / 100);
  const zoneCardsStyle = useMemo(() => ({ "--zone-card-scale": String(zoneCardScale) } as CSSProperties), [zoneCardScale]);
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>({});
  const zoneCollapsed = (zone: "grip" | "heap" | "stack") => (zone === "grip" ? collapsedZones[zone] ?? true : Boolean(collapsedZones[zone]));
  const toggleZoneCollapsed = (zone: "grip" | "heap" | "stack") => setCollapsedZones((current) => ({ ...current, [zone]: !current[zone] }));
  if (view.side !== "corp") return null;
  const heapCards = view.opponent.discardCards ?? [];
  const heapCount = view.opponent.discardCount ?? heapCards.length;
  const gripCount = Math.max(0, Math.floor(view.opponent.handCount));
  const gripCountLabel = formatHandLimitCount(view.opponent.handCount, view.opponent.maxHandSize);
  const stackCountLabel = formatCardCount(view.opponent.deckCount);
  const heapCountLabel = formatCardCount(heapCount);
  const gripPreviewCount = Math.min(gripCount, RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT);
  const gripPreviewCards = Array.from({ length: gripPreviewCount }, (_, index): DisplayVisibleCard => ({
    instanceId: `runner-opponent-grip-hidden-${index}`,
    known: false,
    rezzed: false,
    owner: "runner"
  }));
  const cardActionsForHeap = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
  };

  return (
    <section className="runnerOpponentZonesStrip" aria-label="Runner-Zonen" data-testid="runner-opponent-zones">
      <SideZoneFrame
        side="runner"
        label="Grip"
        countLabel={gripCountLabel}
        iconKind="grip"
        highlighted={zoneHighlighted(highlightedZone, "runner", "grip")}
        className="runnerOpponentZone runnerOpponentCountZone runnerOpponentGripZone"
        style={zoneCardsStyle}
        title="Grip: Runner-Hand. Aus Korp-Sicht ist nur die Kartenanzahl sichtbar."
        ariaLabel={`Runner-Grip ${gripCountLabel}`}
        collapsed={zoneCollapsed("grip")}
        onToggleCollapse={() => toggleZoneCollapsed("grip")}
        collapseLabel="Grip"
      >
        {gripPreviewCards.length > 0 ? (
          <div
            className="runnerOpponentGripPreview"
            style={{
              ...zoneCardsStyle,
              "--runner-grip-visible-steps": String(Math.max(0, gripPreviewCards.length - 1))
            } as CSSProperties}
            aria-label={`Runner-Grip: ${gripCountLabel}, verdeckte Karten`}
          >
            {gripPreviewCards.map((card) => (
              <CardView key={card.instanceId} card={card} compact displayMode={displayMode} hiddenSide="runner" onFocus={onFocus} />
            ))}
            {gripCount > RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{gripCount - RUNNER_OPPONENT_GRIP_PREVIEW_LIMIT}</span> : null}
          </div>
        ) : (
          <p className="archivesPileEmpty">Keine Karten im Grip.</p>
        )}
      </SideZoneFrame>
      <SideZoneFrame
        side="runner"
        label="Stack"
        countLabel={stackCountLabel}
        iconKind="stack"
        highlighted={zoneHighlighted(highlightedZone, "runner", "stack")}
        className="runnerOpponentZone runnerOpponentCountZone runnerOpponentStackZone"
        style={zoneCardsStyle}
        title="Stack: Runner-Deck. Aus Korp-Sicht ist nur die Kartenanzahl sichtbar."
        ariaLabel={`Runner-Stack ${stackCountLabel}`}
        collapsed
      />
      <SideZoneFrame
        side="runner"
        label="Heap"
        countLabel={heapCountLabel}
        iconKind="heap"
        highlighted={zoneHighlighted(highlightedZone, "runner", "heap")}
        className="runnerOpponentZone runnerOpponentHeapCompact"
        style={zoneCardsStyle}
        title="Heap: öffentliche Runner-Ablage."
        ariaLabel={`Runner-Heap ${heapCountLabel}`}
        collapsed={zoneCollapsed("heap")}
        onToggleCollapse={() => toggleZoneCollapsed("heap")}
        collapseLabel="Heap"
      >
        {heapCards.length > 0 ? (
          <div
            className="runnerHeapCompactPreview runnerHeapOverlapRow"
            style={{
              ...zoneCardsStyle,
              "--zone-stack-visible-steps": String(Math.max(0, heapCards.length - 1))
            } as CSSProperties}
          >
            {heapCards.map((card) => {
              const displayCard = enrichVisibleCard(card, cardDetailsById);
              return (
                <CardView
                  key={card.instanceId}
                  card={displayCard}
                  compact
                  displayMode={displayMode}
                  inactiveZone="heap"
                  selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                  actions={cardActionsForHeap(card)}
                  actionDisabled={actionDisabled}
                  onAction={onAction}
                  onFocus={onFocus}
                  onActionContextSelect={onActionContext}
                />
              );
            })}
          </div>
        ) : (
          <p className="archivesPileEmpty">Keine Karten im Heap.</p>
        )}
      </SideZoneFrame>
    </section>
  );
}

export function RunnerRigStrip({
  view,
  cardDetailsById,
  displayMode,
  selectedContext,
  contextualActions,
  actionDisabled,
  highlightedZone,
  fieldChoiceCardProps,
  onFocus,
  onActionContext,
  onAction
}: {
  view: PlayerView;
  cardDetailsById: CardDetailsById;
  displayMode: CardDisplayMode;
  selectedContext: ActionContext | null;
  contextualActions: LegalAction[];
  actionDisabled: boolean;
  highlightedZone?: BoardHighlight | null;
  fieldChoiceCardProps?: (card: VisibleCard) => FieldChoiceCardProps;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContext(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction(action: LegalAction): void;
}) {
  const { zonePercent } = useCardScaleSettings();
  const zoneCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, zonePercent / 100);
  const opponentRigStyle = useMemo(
    () =>
      ({
        "--zone-card-scale": String(zoneCardScale),
        "--mini-cards-min-width": `${Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * zoneCardScale)}px`
      } as CSSProperties),
    [zoneCardScale]
  );
  const [rigCollapsed, setRigCollapsed] = useState(false);
  if (opponentSide(view.side) !== "runner") return null;
  const runnerRig = view.opponent.rig ?? [];
  const memorySummary = runnerRigMemorySummary(view, "opponent");
  const groups = groupRunnerRigCards(runnerRig, { includeEmptyProgramGroup: Boolean(memorySummary) });
  const cardActionsForRig = (card: VisibleCard): LegalAction[] => {
    if (!card.known) return [];
    return contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: card.instanceId, label: card.title ?? "Karte" }));
  };
  return (
    <SideZoneFrame
      side="runner"
      label="Rig"
      countLabel={formatCardCount(runnerRig.length)}
      iconKind="rig"
      highlighted={zoneHighlighted(highlightedZone ?? null, "runner", "rig")}
      className="runnerOpponentZone runnerOpponentRigZone runnerRigZone"
      style={opponentRigStyle}
      title="Rig: installierte Runner-Karten."
      ariaLabel={`Runner-Rig ${formatCardCount(runnerRig.length)}`}
      testId="runner-rig"
      collapsed={rigCollapsed}
      onToggleCollapse={() => setRigCollapsed((current) => !current)}
      collapseLabel="Rig"
    >
      {groups.length > 0 ? (
        <div className="rigGroups rigGroupsHorizontal rigGroupsTrack runnerRigZoneGroups">
          {groups.map((group) => (
            <div
              className="rigGroup rigGroupHorizontal"
              key={group.key}
              style={opponentRigStyle}
            >
              <div className="rigGroupLead">
                <h3 className={`rigGroupSideLabel ${zoneSideClass("runner")}`}>{group.label}</h3>
                {group.key === "program" && memorySummary ? (
                  <span className="zoneLimitBadge rigMemoryBadge" aria-label={memorySummary.ariaLabel}>
                    MU <strong>{memorySummary.text}</strong>
                  </span>
                ) : null}
              </div>
              <div className="cards rigGroupCards rigGroupCardsMini">
                {group.cards.length > 0 ? (
                  group.cards.map((card) => {
                    const displayCard = enrichVisibleCard(card, cardDetailsById);
                    return (
                      <CardView
                        key={card.instanceId}
                        card={displayCard}
                        compact
                        displayMode={displayMode}
                        {...(card.known ? {} : { hiddenSide: "runner" as const })}
                        selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                        actions={cardActionsForRig(card)}
                        actionDisabled={actionDisabled}
                        actionLabelForAction={(action) => runAwareActionButtonLabel(view, action)}
                        {...fieldChoiceCardProps?.(card)}
                        onFocus={onFocus}
                        onActionContextSelect={onActionContext}
                        onAction={onAction}
                      />
                    );
                  })
                ) : (
                  <span className="rigProgramEmptyPlaceholder compact" aria-hidden="true" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="archivesPileEmpty" style={opponentRigStyle}>Keine Karten im Rig.</p>
      )}
    </SideZoneFrame>
  );
}

function zoneHighlighted(highlight: BoardHighlight | null, side: Side, zone: "grip" | "stack" | "heap" | "rig"): boolean {
  return Boolean(highlight?.kind === "zone" && highlight.side === side && highlight.zone === zone);
}

function opponentSide(side: Side): Side {
  return side === "corp" ? "runner" : "corp";
}

function formatCardCount(count: number): string {
  return `${count} ${count === 1 ? "Karte" : "Karten"}`;
}

function formatHandLimitCount(count: number, limit: number): string {
  return `${count} von ${limit} Karten`;
}
