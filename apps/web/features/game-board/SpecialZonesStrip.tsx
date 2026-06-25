import { Layers3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { PlayerView, Side, VisibleCard } from "@netgrid/shared";

import { CardView } from "../cards/CardView";
import { enrichVisibleCard, type DisplayVisibleCard } from "../cards/card-view-model";
import type { CardDisplayMode } from "../settings/settings-model";

const SPECIAL_ZONE_PREVIEW_LIMIT = 14;
const SPECIAL_ZONE_CARD_WIDTH_MIN = 56;
const SPECIAL_ZONE_CARD_WIDTH_PREFERRED = 140;
const SPECIAL_ZONE_CARD_GAP = 6;

type SpecialZoneCatalogDetail = {
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

export function SpecialZonesStrip({
  view,
  cardDetailsById,
  displayMode,
  compact = false,
  onFocus
}: {
  view: PlayerView;
  cardDetailsById: Record<string, SpecialZoneCatalogDetail>;
  displayMode: CardDisplayMode;
  compact?: boolean;
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
}) {
  const zones = view.specialZones;
  if (!zones || (zones.setAsideCount === 0 && zones.removedFromGameCount === 0)) return null;
  const groups = [
    { key: "set-aside", label: "Set Aside", count: zones.setAsideCount, cards: zones.setAside },
    { key: "removed", label: "Aus dem Spiel entfernt", count: zones.removedFromGameCount, cards: zones.removedFromGame }
  ].filter((group) => group.count > 0);

  return (
    <section className={`specialZoneStrip${compact ? " compact" : ""}`} data-testid="special-zones">
      <div className="sectionTitleLine">
        <h2>Spezialzonen</h2>
        <Layers3 size={16} />
      </div>
      <div className="specialZoneGroups">
        {groups.map((group) => (
          <div className="specialZoneGroup" key={group.key}>
            <div className="specialZoneHead">
              <strong>{group.label}</strong>
              <span>{group.count}</span>
            </div>
            {compact ? (
              <SpecialZoneOverlapRow cards={group.cards} cardDetailsById={cardDetailsById} displayMode={displayMode} {...(onFocus ? { onFocus } : {})} />
            ) : (
              <div className="cards miniCards">
                {group.cards.map((card) => {
                  const displayCard = enrichVisibleCard(card, cardDetailsById);
                  return <CardView key={card.instanceId} card={displayCard} compact displayMode={displayMode} actions={[]} actionDisabled {...(onFocus ? { onFocus } : {})} />;
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SpecialZoneOverlapRow({
  cards,
  cardDetailsById,
  displayMode,
  onFocus
}: {
  cards: VisibleCard[];
  cardDetailsById: Record<string, SpecialZoneCatalogDetail>;
  displayMode: CardDisplayMode;
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const previewCards = cards.slice(0, SPECIAL_ZONE_PREVIEW_LIMIT);
  const previewCount = Math.max(1, previewCards.length);
  const [cardWidth, setCardWidth] = useState(SPECIAL_ZONE_CARD_WIDTH_PREFERRED);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const updateCardWidth = () => {
      const availableWidth = row.clientWidth;
      if (availableWidth <= 0) return;

      const singleRowWidth = Math.floor((availableWidth - SPECIAL_ZONE_CARD_GAP * (previewCount - 1)) / previewCount);
      const nextCardWidth = Math.max(SPECIAL_ZONE_CARD_WIDTH_MIN, Math.min(SPECIAL_ZONE_CARD_WIDTH_PREFERRED, singleRowWidth));
      setCardWidth((current) => (current === nextCardWidth ? current : nextCardWidth));
    };

    updateCardWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateCardWidth);
      observer.observe(row);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateCardWidth);
    return () => window.removeEventListener("resize", updateCardWidth);
  }, [previewCount]);

  const rowStyle = {
    "--special-zone-card-width": `${cardWidth}px`,
    "--special-zone-card-gap": `${SPECIAL_ZONE_CARD_GAP}px`
  } as CSSProperties;

  return (
    <div ref={rowRef} className="specialZoneOverlapRow" style={rowStyle}>
      {previewCards.map((card) => {
        const displayCard = enrichVisibleCard(card, cardDetailsById);
        return <CardView key={card.instanceId} card={displayCard} compact displayMode={displayMode} actions={[]} actionDisabled {...(onFocus ? { onFocus } : {})} />;
      })}
      {cards.length > SPECIAL_ZONE_PREVIEW_LIMIT ? <span className="archivesOverflowBadge">+{cards.length - SPECIAL_ZONE_PREVIEW_LIMIT}</span> : null}
    </div>
  );
}
