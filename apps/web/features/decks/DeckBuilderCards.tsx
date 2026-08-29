"use client";

import { Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslations } from "use-intl/react";

import {
  cardMetricLine,
  formatCardTerm,
  formatCardTypeLine,
} from "../cards/card-text-lines";
import { DeckCardThumb } from "./DeckCardThumb";
import { DeckCardTooltipTrigger } from "./DeckCardTooltipTrigger";

type DeckBuilderCard = {
  catalogCardId: string;
  title: string;
  type: string;
  subtypes: string[];
};

type DeckBuilderDetail = DeckBuilderCard & {
  text: string;
  numeric: Record<string, number | null | undefined>;
  side: string;
  setId: string;
  setName: string;
  collectorNumber: string;
  definitionId?: string;
};

export function DeckTableLibraryCard({
  card,
  detail,
  overlapped,
  quantity,
  selected,
  readOnly = false,
  stackIndex,
  onAddToFirstPile,
  onSelect
}: {
  card: DeckBuilderCard;
  detail: DeckBuilderDetail | undefined;
  overlapped: boolean;
  quantity: number;
  selected: boolean;
  readOnly?: boolean;
  stackIndex: number;
  onAddToFirstPile(): void;
  onSelect(): void;
}) {
  return (
    <DeckCardTooltipTrigger
      card={card}
      detail={detail}
      cardId={card.catalogCardId}
      className={`deckTableLibraryCard ${overlapped ? "overlapped" : ""} ${quantity > 0 ? "inDeck" : ""} ${selected ? "selected" : ""}`}
      onSelect={onSelect}
      style={{ "--deck-table-card-z": stackIndex } as CSSProperties}
    >
      <div
        draggable={!readOnly}
        onDoubleClick={(event) => {
          event.stopPropagation();
          if (readOnly) return;
          onAddToFirstPile();
        }}
        onDragStart={(event) => {
          if (readOnly) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.setData("application/x-netgrid-card", JSON.stringify({ cardId: card.catalogCardId }));
          event.dataTransfer.effectAllowed = "copy";
        }}
      >
        <DeckCardThumb
          cardId={card.catalogCardId}
          title={card.title}
          cardType={card.type}
          typeLine={formatCardTypeLine(card)}
          metricLine={cardMetricLine(detail)}
          textDensity="table"
          {...(detail?.text ? { rulesText: detail.text } : {})}
          {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
          {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
        />
        <strong>{card.title}</strong>
        <span>{formatCardTypeLine(card)}</span>
        {quantity > 0 ? <b>x{quantity}</b> : null}
      </div>
    </DeckCardTooltipTrigger>
  );
}

export function DeckLibraryCard({
  card,
  detail,
  quantity,
  selected,
  onAdd,
  onRemove,
  onSelect
}: {
  card: DeckBuilderCard;
  detail: DeckBuilderDetail | undefined;
  quantity: number;
  selected: boolean;
  onAdd(): void;
  onRemove(): void;
  onSelect(): void;
}) {
  const t = useTranslations("Decks.cards");
  const metrics = cardMetricLine(detail);
  return (
    <DeckCardTooltipTrigger
      card={card}
      detail={detail}
      cardId={card.catalogCardId}
      className={`deckLibraryCard ${quantity > 0 ? "inDeck" : ""} ${selected ? "selected" : ""}`}
      onSelect={onSelect}
    >
      <DeckCardThumb
        cardId={card.catalogCardId}
        title={card.title}
        cardType={card.type}
        typeLine={formatCardTypeLine(card)}
        metricLine={metrics}
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderCardText">
        <strong>{card.title}</strong>
        <span>{formatCardTypeLine(card)}</span>
        {metrics ? <small>{metrics}</small> : null}
        {detail?.text ? <p>{detail.text}</p> : null}
      </div>
      <div className="deckQuantityControls" aria-label={t("quantity", {title: card.title})}>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onRemove(); }} disabled={quantity <= 0} type="button" aria-label={t("remove", {title: card.title})}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onAdd(); }} type="button" aria-label={t("add", {title: card.title})}>
          +
        </button>
      </div>
    </DeckCardTooltipTrigger>
  );
}

export function DeckBuilderPreview({
  card,
  detail,
  quantity,
  onAdd,
  onRemove
}: {
  card: DeckBuilderCard;
  detail: DeckBuilderDetail | undefined;
  quantity: number;
  onAdd(): void;
  onRemove(): void;
}) {
  const t = useTranslations("Decks.cards");
  const metrics = cardMetricLine(detail);
  return (
    <section className="deckBuilderPreview" aria-label={t("preview")}>
      <DeckCardThumb
        cardId={card.catalogCardId}
        title={card.title}
        cardType={card.type}
        typeLine={formatCardTypeLine(card)}
        metricLine={metrics}
        preview
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderPreviewText">
        <span>{deckBuilderCardGroup(card)}</span>
        <strong>{card.title}</strong>
        <small>{formatCardTypeLine(card)}</small>
        {metrics ? <small>{metrics}</small> : null}
        <p>{detail?.text ?? t("textLoading")}</p>
      </div>
      <div className="deckQuantityControls preview">
        <button className="deckQtyButton" onClick={onRemove} disabled={quantity <= 0} type="button" aria-label={t("remove", {title: card.title})}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={onAdd} type="button" aria-label={t("add", {title: card.title})}>
          +
        </button>
      </div>
    </section>
  );
}

export function DeckListCard({
  card,
  cardId,
  detail,
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
  onSelect
}: {
  card: DeckBuilderCard | null;
  cardId: string;
  detail: DeckBuilderDetail | undefined;
  quantity: number;
  onIncrement(): void;
  onDecrement(): void;
  onRemove(): void;
  onSelect(): void;
}) {
  const t = useTranslations("Decks.cards");
  const metrics = cardMetricLine(detail);
  return (
    <DeckCardTooltipTrigger
      card={card}
      detail={detail}
      cardId={cardId}
      className="deckListCard"
      onSelect={onSelect}
    >
      <DeckCardThumb
        cardId={card?.catalogCardId ?? cardId}
        title={card?.title ?? cardId}
        {...(card?.type ? { cardType: card.type } : {})}
        {...(card ? { typeLine: formatCardTypeLine(card) } : {})}
        {...(metrics ? { metricLine: metrics } : {})}
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderCardText">
        <strong>{card?.title ?? cardId}</strong>
        <span>{card ? formatCardTypeLine(card) : t("outsidePool")}</span>
        {metrics ? <small>{metrics}</small> : null}
      </div>
      <div className="deckQuantityControls">
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onDecrement(); }} type="button" aria-label={t("decrease", {title: card?.title ?? cardId})}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onIncrement(); }} type="button" aria-label={t("increase", {title: card?.title ?? cardId})}>
          +
        </button>
        <button className="deckQtyButton remove" onClick={(event) => { event.stopPropagation(); onRemove(); }} type="button" aria-label={t("remove", {title: card?.title ?? cardId})}>
          <Trash2 size={13} />
        </button>
      </div>
    </DeckCardTooltipTrigger>
  );
}

function deckBuilderCardGroup(card: DeckBuilderCard | null): string {
  if (!card) return "Unbekannt";
  return [formatCardTerm(card.type), card.subtypes.map(formatCardTerm).join(" / ")].filter(Boolean).join(" - ");
}
