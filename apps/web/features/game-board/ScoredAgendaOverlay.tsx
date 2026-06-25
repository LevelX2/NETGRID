"use client";

import { Move, X } from "lucide-react";
import { useMemo, useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { LegalAction, Side, VisibleCard } from "@netgrid/shared";

import { clampOverlayPosition, type OverlayPositionPreference } from "../../lib/overlay-position";
import { useCardScaleSettings } from "../cards/card-display-settings";
import { CARD_SCALE_PERCENT_MIN, type CardDisplayMode } from "../settings/settings-model";
import { CardView } from "../cards/CardView";
import { ScoredAgendaStateLines } from "../cards/ScoredAgendaState";
import { type ActionContext } from "../../app/action-board-ui";
import { type DisplayVisibleCard } from "../cards/card-view-model";

const SCORE_AREA_PREVIEW_LIMIT = 18;
const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

export function ScoredAgendaOverlay({
  side,
  cards,
  agendaPoints,
  agendaPointsToWin,
  open,
  position,
  cardDisplayMode,
  enrichCard,
  cardActionsFor,
  actionDisabled,
  selectedContext,
  onAction,
  onFocus,
  onActionContextSelect,
  onClose,
  onPosition
}: {
  side: Side;
  cards: VisibleCard[];
  agendaPoints: number;
  agendaPointsToWin: number;
  open: boolean;
  position: OverlayPositionPreference;
  cardDisplayMode: CardDisplayMode;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
  cardActionsFor(card: VisibleCard): LegalAction[];
  actionDisabled: boolean;
  selectedContext: ActionContext | null;
  onAction(action: LegalAction): void;
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onClose(): void;
  onPosition(position: OverlayPositionPreference): void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const { handPercent } = useCardScaleSettings();
  const handCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, handPercent / 100);
  const scoredAgendaCardsStyle = useMemo(
    () => {
      const columnCount = Math.min(Math.max(cards.length, 1), 3);
      const cardMinWidth = Math.round(CARD_DISPLAY_BASE_MIN_WIDTH * handCardScale);
      return {
        "--cards-min-width": `${cardMinWidth}px`,
        "--score-area-columns": String(columnCount),
        "--score-area-list-width": `${cardMinWidth * columnCount + 8 * (columnCount - 1)}px`
      } as CSSProperties;
    },
    [cards.length, handCardScale]
  );
  const visibleCards = cards.map((card) => enrichCard(card));
  if (!open || visibleCards.length === 0) return null;
  const visibleLimitCards = visibleCards.slice(0, SCORE_AREA_PREVIEW_LIMIT);
  const title = side === "corp" ? "Entwickelt" : "Gestohlen";
  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragOverlay = (event: ReactPointerEvent<HTMLElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    onPosition(
      clampOverlayPosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height
      )
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const overlayPositionStyle: CSSProperties = position.kind === "custom"
    ? { left: `${position.xPercent}%`, top: `${position.yPercent}%`, right: "auto", transform: "none" }
    : {};

  return (
    <div
      ref={overlayRef}
      className={`scoredAgendaOverlay ${side} ${position.kind === "custom" ? "custom" : ""}`}
      style={overlayPositionStyle}
    >
      <section className={`scoredAgendaPanel ${side}`}>
        <header
          className={`scoredAgendaHead ${side}`}
          onPointerDown={startDrag}
          onPointerMove={dragOverlay}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          title={`${title}-Fenster verschieben`}
          aria-label={`${title}-Fenster verschieben`}
        >
          <div className="scoreAreaWindowControls" aria-hidden="true">
            <span className="scoreAreaDragHint">
              <Move size={14} />
            </span>
          </div>
          <div className="scoredAgendaTitleBlock">
            <strong>{title}</strong>
            <span className="scoredAgendaPointBadge">{agendaPoints} / {agendaPointsToWin} Agenda-Punkte</span>
          </div>
        </header>
        <button
          className="button iconOnly scoreAreaFloatingClose"
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          aria-label={`${title}-Fenster schließen`}
          title={`${title}-Fenster schließen`}
        >
          <X size={14} />
        </button>
        <div className="scoredAgendaList cards" style={scoredAgendaCardsStyle}>
          {visibleLimitCards.map((card) => (
            <div key={card.instanceId} className="scoredAgendaEntry">
              <CardView
                card={card}
                displayMode={cardDisplayMode}
                showAdvancementCounters={false}
                actions={cardActionsFor(card)}
                actionDisabled={actionDisabled}
                selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                onAction={onAction}
                {...(onFocus ? { onFocus } : {})}
                {...(onActionContextSelect ? { onActionContextSelect } : {})}
              />
              <ScoredAgendaStateLines card={card} side={side} />
            </div>
          ))}
          {cards.length > SCORE_AREA_PREVIEW_LIMIT ? <div className="scoredAgendaOverflow">+{cards.length - SCORE_AREA_PREVIEW_LIMIT} weitere</div> : null}
        </div>
      </section>
    </div>
  );
}
