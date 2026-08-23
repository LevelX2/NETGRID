import { Activity, Bot, Check, Move, Play, User } from "lucide-react";
import { useEffect, useRef } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import type { Side, VisibleCard } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

import {
  actionCueInteractionAmbience,
  clampCuePosition,
  cuePositionClassName,
  cuePositionStyle,
  interactionAmbienceClassName,
  type CuePositionPreference,
} from "../../app/action-board-ui";
import type { OpponentActionCue } from "../../app/action-cues";
import { CardView } from "../cards/CardView";
import {
  enrichVisibleCard,
  type DisplayVisibleCard,
} from "../cards/card-view-model";
import type {
  CardDisplayMode,
  CueDisplayMode,
} from "../settings/settings-model";
import { shouldUseFloatingCue } from "./cue-display";
import { WindowEventIcon } from "./WindowEventIcon";
import { windowEventIconKindForActionCue } from "./window-event-icon-kind";

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
  cueDisplayMode,
  autoDismissMs,
  canAdvanceAi = false,
  manualAdvanceRequired = false,
  renderTitle,
  onPosition,
  onDismiss,
  onAdvanceAi,
}: {
  cue: OpponentActionCue | null;
  queued: number;
  position: CuePositionPreference;
  cardDetailsById: Record<string, OpponentOverlayCatalogDetail>;
  displayMode: CardDisplayMode;
  cueDisplayMode: CueDisplayMode;
  autoDismissMs: number;
  canAdvanceAi?: boolean;
  manualAdvanceRequired?: boolean;
  renderTitle(cue: OpponentActionCue): ReactNode;
  onPosition(position: CuePositionPreference): void;
  onDismiss(): void;
  onAdvanceAi?(): void;
}) {
  const t = useTranslations("Actions.opponentCue");
  const overlayRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const showAiAdvanceButton = Boolean(
    cue?.source === "ai" && canAdvanceAi && onAdvanceAi,
  );
  const showFloatingCue = Boolean(
    cue && shouldUseFloatingCue(cueDisplayMode, manualAdvanceRequired),
  );
  useEffect(() => {
    if (!cue || position.kind !== "custom") return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const keepInsideViewport = () => {
      const rect = overlay.getBoundingClientRect();
      const clamped = clampCuePosition(
        position.xPercent,
        position.yPercent,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height,
      );
      if (
        clamped.kind === "custom" &&
        (clamped.xPercent !== position.xPercent ||
          clamped.yPercent !== position.yPercent)
      )
        onPosition(clamped);
    };
    keepInsideViewport();
    window.addEventListener("resize", keepInsideViewport);
    const observer = new ResizeObserver(keepInsideViewport);
    observer.observe(overlay);
    return () => {
      window.removeEventListener("resize", keepInsideViewport);
      observer.disconnect();
    };
  }, [cue, onPosition, position, showFloatingCue]);
  if (!cue) return null;

  const relatedCard = cue.relatedCard
    ? enrichVisibleCard(cue.relatedCard, cardDetailsById)
    : null;
  const cueCardType =
    relatedCard?.type ??
    (cue.cardDefinitionId
      ? cardDetailsById[cue.cardDefinitionId]?.type
      : null) ??
    null;
  const ambience = actionCueInteractionAmbience({
    actionType: cue.actionType,
    title: cue.title,
    cardType: cueCardType,
    visibility: cue.visibility,
  });
  const ambienceClass = interactionAmbienceClassName(ambience);
  const runHighlight = cue.highlight?.kind === "run" ? cue.highlight : null;
  const cueCardDisplayMode: CardDisplayMode =
    displayMode === "placeholder" ? displayMode : "placeholder";
  const showHiddenCardBack =
    cue.visibility === "redacted" && cue.actionType === "install_card";
  const hasCueVisual = Boolean(relatedCard || showHiddenCardBack);
  const dismissLabel = showAiAdvanceButton ? t("continue") : t("dismiss");
  const cueStyle = {
    ...cuePositionStyle(position),
    "--cue-duration": `${autoDismissMs}ms`,
  } as CSSProperties;
  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
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
        rect.height,
      ),
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (showFloatingCue) {
    return (
      <aside
        ref={overlayRef}
        className={`opponentCueOverlay floatingCue ${ambienceClass} ${cuePositionClassName(position)} actor-${cue.actor ?? "system"} importance-${cue.importance} visibility-${cue.visibility}`}
        style={cueStyle}
        aria-live="polite"
        aria-atomic="true"
        data-testid="opponent-cue"
        data-cue-display="floating"
      >
        <div className="floatingCueMessage">
          <span className="floatingCueActor">{cue.actorLabel}</span>
          <strong>{renderTitle(cue)}</strong>
          {cue.description ? <span>{cue.description}</span> : null}
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={overlayRef}
      className={`opponentCueOverlay ${ambienceClass} ${cuePositionClassName(position)} actor-${cue.actor ?? "system"} importance-${cue.importance} visibility-${cue.visibility}`}
      style={cueStyle}
      aria-live="polite"
      data-testid="opponent-cue"
    >
      <div className="opponentCueHeader">
        <div className="opponentCueIdentity">
          <span className="opponentCueIcon" aria-hidden="true">
            {cue.source === "ai" ? (
              <Bot size={18} />
            ) : cue.source === "human" ? (
              <User size={18} />
            ) : (
              <Activity size={18} />
            )}
          </span>
          <span>{cue.actorLabel}</span>
          {cue.actionUse ? (
            <span className="opponentCueActionUse" title={cue.actionUse.title}>
              {cueActionUseLabel(cue, t)}
            </span>
          ) : null}
        </div>
        <div className="opponentCueHeaderActions">
          <button
            className="button iconOnly cueDragHandle"
            onPointerDown={startDrag}
            onPointerMove={dragCue}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            aria-label={t("move")}
            title={t("move")}
            type="button"
          >
            <Move size={15} />
          </button>
        </div>
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
                <span>{t("hiddenCard")}</span>
              </div>
            )}
          </div>
        ) : null}
        <div className="opponentCueMessage">
          <WindowEventIcon
            {...(cue.actor ? { side: cue.actor } : {})}
            kind={windowEventIconKindForActionCue({
              actionType: cue.actionType,
              ambience,
              title: cue.title,
              ...(runHighlight?.serverId
                ? { serverId: runHighlight.serverId }
                : {}),
              ...(runHighlight?.serverLabel
                ? { serverLabel: runHighlight.serverLabel }
                : {}),
            })}
            {...(cue.iconBadge ? { badge: cue.iconBadge } : {})}
          />
          <div className="opponentCueText">
            <strong>{renderTitle(cue)}</strong>
            {cue.description ? <p>{cue.description}</p> : null}
          </div>
        </div>
      </div>
      <div className="opponentCueFooter">
        {queued > 0 ? (
          <small>{t("queued", { count: queued })}</small>
        ) : (
          <span aria-hidden="true" />
        )}
        <button
          className="button cueAdvanceButton"
          onClick={showAiAdvanceButton && onAdvanceAi ? onAdvanceAi : onDismiss}
          aria-label={dismissLabel}
          title={dismissLabel}
          type="button"
        >
          {showAiAdvanceButton ? <Play size={14} /> : <Check size={14} />}
          {dismissLabel}
        </button>
      </div>
    </aside>
  );
}

function cueActionUseLabel(
  cue: OpponentActionCue,
  t: (key: any, values?: any) => string,
): string {
  const actor = t(`actor.${cue.actor ?? "game"}`);
  if (!cue.actionUse) return actor;
  return cue.actionUse.start === cue.actionUse.end
    ? t("singleAction", { number: cue.actionUse.start, actor })
    : t("actionRange", {
        actor,
        start: cue.actionUse.start,
        end: cue.actionUse.end,
      });
}
