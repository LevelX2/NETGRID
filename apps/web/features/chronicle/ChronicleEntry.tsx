"use client";

import { Activity, Award, Eye, Layers3, PanelRightOpen, Plus, Route, X } from "lucide-react";

import {
  CHRONICLE_CATEGORY_LABELS,
  type ChronicleCategory,
  type ChronicleItem,
} from "../../app/chronicle";
import {
  visibleCardFromCatalogDetail,
  type DisplayVisibleCard,
} from "../cards/card-view-model";
import { type CardDisplayMode, type ChronicleDetailMode } from "../settings/settings-model";
import { ChronicleCardTrigger } from "./ChronicleCardTrigger";

type ChronicleEntryCard = Parameters<typeof visibleCardFromCatalogDetail>[0];
export type ChronicleGroupKind = "corp" | "runner" | "run" | "system" | "neutral";

export function ChronicleEntry({
  item,
  card,
  displayMode,
  detailMode,
  groupKind,
  onFocusCard
}: {
  item: ChronicleItem;
  card: ChronicleEntryCard | null;
  displayMode: CardDisplayMode;
  detailMode: ChronicleDetailMode;
  groupKind: ChronicleGroupKind;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  const titleContainsCard = Boolean(item.cardTitle && item.title.includes(item.cardTitle));
  const previewCard = card ? visibleCardFromCatalogDetail(card) : null;
  const showSupportingText = detailMode !== "simple";
  const showChips = detailMode !== "simple";
  const showRuleText = detailMode === "full";
  return (
    <article className={`chronicleEntry chronicle-${item.category} importance-${item.importance} visibility-${item.visibility} detail-${detailMode} group-${groupKind}`}>
      <div className="chronicleRail" aria-hidden={!item.actionUse}>
        <span className="chronicleRailIcon">
          <ChronicleIcon category={item.category} />
        </span>
        {item.actionUse ? (
          <span className="chronicleActionOrdinal" tabIndex={0} aria-label={item.actionUse.title}>
            {item.actionUse.label}
            <span className="chronicleActionTooltip" role="tooltip">
              {item.actionUse.title}
            </span>
          </span>
        ) : null}
      </div>
      <div className="chronicleContent">
        <div className="chronicleTopLine">
          <strong>
            <ChronicleTitle item={item} card={card} previewCard={previewCard} displayMode={displayMode} onFocusCard={onFocusCard} />
          </strong>
          {detailMode !== "simple" ? <span className="chronicleCategory">{CHRONICLE_CATEGORY_LABELS[item.category]}</span> : null}
        </div>
        {showSupportingText && item.description ? <p className="chronicleDescription">{item.description}</p> : null}
        {showChips && item.chips.length > 0 ? (
          <div className="chronicleChips">
            {item.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        ) : null}
        {showSupportingText && item.cardTitle && !titleContainsCard ? (
          <ChronicleCardTrigger
            className="chronicleCardLine"
            card={card}
            item={item}
            displayMode={displayMode}
            disabled={!previewCard}
            title={item.cardTitle}
            onClick={() => previewCard && onFocusCard(previewCard)}
          >
            Karte: {item.cardTitle}
          </ChronicleCardTrigger>
        ) : null}
        {showRuleText && item.cardText ? <p className="chronicleEffect">Effekt: {item.cardText}</p> : null}
      </div>
    </article>
  );
}

function ChronicleTitle({
  item,
  card,
  previewCard,
  displayMode,
  onFocusCard
}: {
  item: ChronicleItem;
  card: ChronicleEntryCard | null;
  previewCard: DisplayVisibleCard | null;
  displayMode: CardDisplayMode;
  onFocusCard(card: DisplayVisibleCard): void;
}) {
  if (!item.cardTitle) return <>{item.title}</>;
  const index = item.title.indexOf(item.cardTitle);
  if (index < 0) return <>{item.title}</>;
  return (
    <>
      {item.title.slice(0, index)}
      <ChronicleCardTrigger
        className={`chronicleCardName ${previewCard ? "hasDetail" : ""}`}
        card={card}
        item={item}
        displayMode={displayMode}
        disabled={!previewCard}
        title={item.cardTitle}
        onClick={() => previewCard && onFocusCard(previewCard)}
      >
        {item.cardTitle}
      </ChronicleCardTrigger>
      {item.title.slice(index + item.cardTitle.length)}
    </>
  );
}

function ChronicleIcon({ category }: { category: ChronicleCategory }) {
  switch (category) {
    case "turn":
      return <Activity size={15} />;
    case "economy":
      return <Plus size={15} />;
    case "card":
      return <Layers3 size={15} />;
    case "run":
      return <Route size={15} />;
    case "agenda":
      return <Award size={15} />;
    case "danger":
      return <X size={15} />;
    case "hidden":
      return <Eye size={15} />;
    case "system":
    default:
      return <PanelRightOpen size={15} />;
  }
}
