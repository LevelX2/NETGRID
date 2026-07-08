import { Activity, Bot, Check, Move, Play, Sparkles, User } from "lucide-react";
import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { Side, VisibleCard } from "@netgrid/shared";

import {
  clampCuePosition,
  cuePositionClassName,
  cuePositionStyle,
  type CuePositionPreference
} from "../../app/action-board-ui";
import type { OpponentActionCue } from "../../app/action-cues";
import { CardView } from "../cards/CardView";
import { enrichVisibleCard, type DisplayVisibleCard } from "../cards/card-view-model";
import type { CardDisplayMode } from "../settings/settings-model";

type OpponentOverlayCatalogDetail = {
  catalogCardId: string;
  title: string;
  side: Side;
  type: string;
  subtypes: string[];
  text: string;
  setId: string;
  setName: string;
  collectorNumber: string;
  numeric: Record<string, number | null | undefined>;
};

export function OpponentActionOverlay({
  cue,
  queued,
  position,
  cardDetailsById,
  displayMode,
  canAdvanceAi = false,
  renderTitle,
  onPosition,
  onDismiss,
  onAdvanceAi
}: {
  cue: OpponentActionCue | null;
  queued: number;
  position: CuePositionPreference;
  cardDetailsById: Record<string, OpponentOverlayCatalogDetail>;
  displayMode: CardDisplayMode;
  canAdvanceAi?: boolean;
  renderTitle(cue: OpponentActionCue): ReactNode;
  onPosition(position: CuePositionPreference): void;
  onDismiss(): void;
  onAdvanceAi?(): void;
}) {
  const overlayRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  if (!cue) return null;

  const relatedCard = cue.relatedCard ? enrichVisibleCard(cue.relatedCard, cardDetailsById) : null;
  const cueCardDisplayMode: CardDisplayMode = displayMode === "placeholder" ? displayMode : "placeholder";
  const showHiddenCardBack = cue.visibility === "redacted" && cue.actionType === "install_card";
  const hasCueVisual = Boolean(relatedCard || showHiddenCardBack);
  const showAiAdvanceButton = Boolean(cue.source === "ai" && canAdvanceAi && onAdvanceAi);
  const dismissLabel = showAiAdvanceButton ? "Weiter" : "Ausblenden";
  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragCue = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    onPosition(
      clampCuePosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height
      )
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <aside
      ref={overlayRef}
      className={`opponentCueOverlay ${cuePositionClassName(position)} actor-${cue.actor ?? "system"} importance-${cue.importance} visibility-${cue.visibility}`}
      style={cuePositionStyle(position)}
      aria-live="polite"
      data-testid="opponent-cue"
    >
      <div className="opponentCueHeader">
        <div className="opponentCueIdentity">
          <span className="opponentCueIcon" aria-hidden="true">
            {cue.source === "ai" ? <Bot size={18} /> : cue.source === "human" ? <User size={18} /> : cue.requiresLocalAttention ? <Sparkles size={18} /> : <Activity size={18} />}
          </span>
          <span>{cue.actorLabel}</span>
          {cue.actionUse ? <span className="opponentCueActionUse" title={cue.actionUse.title}>{cueActionUseLabel(cue)}</span> : null}
        </div>
        <button
          className="button iconOnly cueDragHandle"
          onPointerDown={startDrag}
          onPointerMove={dragCue}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          aria-label="Hinweis verschieben"
          title="Hinweis verschieben"
          type="button"
        >
          <Move size={15} />
        </button>
      </div>
      <div className={`opponentCueBody${hasCueVisual ? " hasVisual" : ""}`}>
        {relatedCard || showHiddenCardBack ? (
          <div className="opponentCueVisual">
            {relatedCard ? (
              <div className="opponentCueCard">
                <CardView
                  card={relatedCard}
                  displayMode={cueCardDisplayMode}
                  preview
                  {...(cue.relatedCardPositionBadge
                    ? { positionBadge: cue.relatedCardPositionBadge }
                    : {})}
                />
              </div>
            ) : (
              <div className="opponentCueCardBack" aria-hidden="true">
                <span>Verdeckte Karte</span>
              </div>
            )}
          </div>
        ) : null}
        <div className="opponentCueText">
          <strong>{renderTitle(cue)}</strong>
          {cue.description ? <p>{cue.description}</p> : null}
        </div>
      </div>
      <div className="opponentCueFooter">
        {queued > 0 ? <small>{queued} weitere {queued === 1 ? "Meldung" : "Meldungen"}</small> : <span aria-hidden="true" />}
        <button className="button cueAdvanceButton" onClick={showAiAdvanceButton && onAdvanceAi ? onAdvanceAi : onDismiss} aria-label={dismissLabel} title={dismissLabel} type="button">
          {showAiAdvanceButton ? <Play size={14} /> : <Check size={14} />}
          {dismissLabel}
        </button>
      </div>
    </aside>
  );
}

function cueActionUseLabel(cue: OpponentActionCue): string {
  const actor = cue.actor === "corp" ? "Korp" : cue.actor === "runner" ? "Runner" : "Spiel";
  if (!cue.actionUse) return actor;
  return cue.actionUse.start === cue.actionUse.end ? `${cue.actionUse.start}. ${actor}-Aktion` : `${actor}-Aktionen ${cue.actionUse.start}-${cue.actionUse.end}`;
}
