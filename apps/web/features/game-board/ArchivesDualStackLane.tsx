import { Eye, Image } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { LegalAction, Side, VisibleCard } from "@netgrid/shared";

import { splitArchiveCardsForDisplay, type ActionContext } from "../../app/action-board-ui";
import { useCardScaleSettings } from "../cards/card-display-settings";
import type { DisplayVisibleCard } from "../cards/card-view-model";
import { CardView } from "../cards/CardView";
import { CARD_SCALE_PERCENT_MIN, type CardDisplayMode } from "../settings/settings-model";
import { archiveCardStepPx } from "./archive-stack-layout";

const ARCHIVES_STACK_PREVIEW_LIMIT = 18;

export function ArchivesDualStackLane({
  viewerSide,
  visibleCards,
  totalArchivesCount,
  emptyLabel = "Leer",
  collapsed,
  displayMode,
  selectedContext,
  actionDisabled,
  cardActionsFor,
  onAction,
  onFocus,
  onActionContextSelect,
  enrichCard
}: {
  viewerSide: Side;
  visibleCards: VisibleCard[];
  totalArchivesCount: number;
  emptyLabel?: string;
  collapsed: boolean;
  displayMode: CardDisplayMode;
  selectedContext: ActionContext | null;
  actionDisabled: boolean;
  cardActionsFor(card: VisibleCard): LegalAction[];
  onAction(action: LegalAction): void;
  onFocus(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect(card: DisplayVisibleCard, hiddenSide?: Side): void;
  enrichCard(card: VisibleCard): DisplayVisibleCard;
}) {
  const stackRef = useRef<HTMLDivElement | null>(null);
  const { faceupCards, facedownCards, facedownCount } = splitArchiveCardsForDisplay(viewerSide, visibleCards, totalArchivesCount);
  const [corpArchivesFacedownView, setCorpArchivesFacedownView] = useState<"details" | "backs">("details");
  const { archivePercent } = useCardScaleSettings();
  const archiveCardScale = Math.max(CARD_SCALE_PERCENT_MIN / 100, archivePercent / 100);
  const shownFaceupCards = faceupCards.slice(0, ARCHIVES_STACK_PREVIEW_LIMIT);
  const shownFacedownCards = facedownCards.slice(0, ARCHIVES_STACK_PREVIEW_LIMIT);
  const shownFacedownCount = viewerSide === "corp" ? shownFacedownCards.length : Math.min(ARCHIVES_STACK_PREVIEW_LIMIT, facedownCount);
  const faceupOverflow = Math.max(0, faceupCards.length - shownFaceupCards.length);
  const facedownOverflow = Math.max(0, facedownCount - shownFacedownCount);
  const faceupRowItems = shownFaceupCards.length + (faceupOverflow > 0 ? 1 : 0);
  const facedownRowItems = shownFacedownCount + (facedownOverflow > 0 ? 1 : 0);
  const faceupRowStyle = { "--archive-visible-steps": String(Math.max(0, faceupRowItems - 1)) } as CSSProperties;
  const facedownRowStyle = { "--archive-visible-steps": String(Math.max(0, facedownRowItems - 1)) } as CSSProperties;
  const hasSeparateFacedownToggle = viewerSide === "corp" && faceupCards.length > 0 && facedownCards.length > 0;
  const [archiveStep, setArchiveStep] = useState<number | null>(null);
  const showCorpFacedownBacks = viewerSide === "corp" && corpArchivesFacedownView === "backs";
  const archiveCardsStyle = useMemo(
    () => ({ "--archive-card-scale": String(archiveCardScale), ...(archiveStep !== null ? { "--archive-card-step": `${archiveStep}px` } : {}) } as CSSProperties),
    [archiveCardScale, archiveStep]
  );

  useEffect(() => {
    const stack = stackRef.current;
    const lane = stack?.closest(".lane") as HTMLElement | null;
    if (!stack || !lane) {
      setArchiveStep(null);
      return;
    }

    const syncArchiveStep = () => {
      const laneStyle = window.getComputedStyle(lane);
      const horizontalPadding = (Number.parseFloat(laneStyle.paddingLeft) || 0) + (Number.parseFloat(laneStyle.paddingRight) || 0);
      const availableWidth = Math.max(0, lane.clientWidth - horizontalPadding);
      const nextStep = archiveCardStepPx({
        availableWidth,
        archiveCardScale,
        faceupItemCount: faceupRowItems,
        facedownItemCount: facedownRowItems,
        hasToggleColumn: hasSeparateFacedownToggle
      });
      setArchiveStep((current) => (current === nextStep ? current : nextStep));
    };

    syncArchiveStep();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncArchiveStep);
    observer?.observe(lane);
    window.addEventListener("resize", syncArchiveStep);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncArchiveStep);
    };
  }, [archiveCardScale, faceupRowItems, facedownRowItems, hasSeparateFacedownToggle]);

  if (collapsed) {
    return <span className="laneCollapsedPlaceholder archiveCollapsedPlaceholder" style={archiveCardsStyle} aria-label="Archive eingeklappt" />;
  }

  if (faceupCards.length === 0 && facedownCount === 0) {
    return (
      <span className="laneEmptyPlaceholder archiveEmptyPlaceholder" style={archiveCardsStyle}>
        {emptyLabel}
      </span>
    );
  }

  return (
    <div ref={stackRef} className="archivesDualStack" style={archiveCardsStyle} data-testid="archives-dual-stack">
      {faceupCards.length > 0 ? (
        <div className="archivesPile">
          <div className="archivesPileBody">
            <div className="archivesOverlapRow" style={faceupRowStyle}>
              {shownFaceupCards.map((card) => {
                const displayCard = enrichCard(card);
                return (
                  <CardView
                    key={card.instanceId}
                    card={displayCard}
                    compact
                    displayMode={displayMode}
                    hiddenSide="corp"
                    installedCorpCard={false}
                    inactiveZone="archives"
                    selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                    actions={cardActionsFor(card)}
                    actionDisabled={actionDisabled}
                    onAction={onAction}
                    onFocus={onFocus}
                    onActionContextSelect={onActionContextSelect}
                  />
                );
              })}
              {faceupOverflow > 0 ? <span className="archivesOverflowBadge">+{faceupOverflow}</span> : null}
            </div>
          </div>
        </div>
      ) : null}

      {hasSeparateFacedownToggle ? (
        <div className="archivesToggleColumn">
          <button
            className="archivesViewToggle"
            type="button"
            aria-label={showCorpFacedownBacks ? "Verdeckte Karten als lesbare Kartendetails anzeigen" : "Verdeckte Karten als Kartenrückseiten anzeigen"}
            aria-pressed={showCorpFacedownBacks}
            onClick={() => setCorpArchivesFacedownView((current) => (current === "details" ? "backs" : "details"))}
            title={showCorpFacedownBacks ? "Verdeckte Karten als lesbare Kartendetails anzeigen" : "Verdeckte Karten als Kartenrückseiten anzeigen"}
          >
            {showCorpFacedownBacks ? <Eye size={12} strokeWidth={2.4} /> : <Image size={12} strokeWidth={2.4} />}
          </button>
        </div>
      ) : null}

      {facedownCount > 0 ? (
        <div className="archivesPile archivesFacedownPile">
          {viewerSide === "corp" && faceupCards.length === 0 && facedownCards.length > 0 ? (
            <div className="archivesInlineToggle">
              <button
                className="archivesViewToggle"
                type="button"
                aria-label={showCorpFacedownBacks ? "Verdeckte Karten als lesbare Kartendetails anzeigen" : "Verdeckte Karten als Kartenrückseiten anzeigen"}
                aria-pressed={showCorpFacedownBacks}
                onClick={() => setCorpArchivesFacedownView((current) => (current === "details" ? "backs" : "details"))}
                title={showCorpFacedownBacks ? "Verdeckte Karten als lesbare Kartendetails anzeigen" : "Verdeckte Karten als Kartenrückseiten anzeigen"}
              >
                {showCorpFacedownBacks ? <Eye size={12} strokeWidth={2.4} /> : <Image size={12} strokeWidth={2.4} />}
              </button>
            </div>
          ) : null}
          <div className="archivesPileBody">
            <div className="archivesOverlapRow" style={facedownRowStyle}>
              {viewerSide === "corp"
                ? shownFacedownCards.map((card) => {
                    const displayCard = enrichCard(card);
                    return (
                      <CardView
                        key={card.instanceId}
                        card={displayCard}
                        compact
                        displayMode={displayMode}
                        hiddenSide="corp"
                        installedCorpCard={false}
                        archiveFacedown
                        {...(!showCorpFacedownBacks ? { inactiveZone: "archives" as const } : {})}
                        {...(showCorpFacedownBacks ? { forceCardBack: "corp" as Side } : {})}
                        selected={selectedContext?.kind === "card" && selectedContext.id === card.instanceId}
                        actions={cardActionsFor(card)}
                        actionDisabled={actionDisabled}
                        onAction={onAction}
                        onFocus={onFocus}
                        onActionContextSelect={onActionContextSelect}
                      />
                    );
                  })
                : Array.from({ length: shownFacedownCount }, (_, index) => (
                    <CardView
                      key={`archives-facedown-${index}`}
                      card={{ instanceId: `archives-facedown-${index}`, known: false, rezzed: false }}
                      compact
                      displayMode={displayMode}
                      hiddenSide="corp"
                      installedCorpCard={false}
                      actions={[]}
                      actionDisabled
                    />
                  ))}
              {facedownOverflow > 0 ? <span className="archivesOverflowBadge">+{facedownOverflow}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
