"use client";

import { Trash2 } from "lucide-react";
import type { CSSProperties } from "react";

import {
  deckCardMetricLine,
  formatDeckCardTerm,
  formatDeckCardTypeLine,
} from "./deck-card-text-lines";
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
  stackIndex,
  onAddToFirstPile,
  onSelect
}: {
  card: DeckBuilderCard;
  detail: DeckBuilderDetail | undefined;
  overlapped: boolean;
  quantity: number;
  selected: boolean;
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
        draggable
        onDoubleClick={(event) => {
          event.stopPropagation();
          onAddToFirstPile();
        }}
        onDragStart={(event) => {
          event.dataTransfer.setData("application/x-netgrid-card", JSON.stringify({ cardId: card.catalogCardId }));
          event.dataTransfer.effectAllowed = "copy";
        }}
      >
        <DeckCardThumb
          cardId={card.catalogCardId}
          title={card.title}
          cardType={card.type}
          typeLine={formatDeckCardTypeLine(card)}
          metricLine={deckCardMetricLine(detail)}
          textDensity="table"
          {...(detail?.text ? { rulesText: detail.text } : {})}
          {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
          {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
        />
        <strong>{card.title}</strong>
        <span>{formatDeckCardTypeLine(card)}</span>
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
  const metrics = deckCardMetricLine(detail);
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
        typeLine={formatDeckCardTypeLine(card)}
        metricLine={metrics}
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderCardText">
        <strong>{card.title}</strong>
        <span>{formatDeckCardTypeLine(card)}</span>
        {metrics ? <small>{metrics}</small> : null}
        {detail?.text ? <p>{detail.text}</p> : null}
      </div>
      <div className="deckQuantityControls" aria-label={`${card.title} Menge`}>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onRemove(); }} disabled={quantity <= 0} type="button" aria-label={`${card.title} entfernen`}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onAdd(); }} type="button" aria-label={`${card.title} hinzufügen`}>
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
  const metrics = deckCardMetricLine(detail);
  return (
    <section className="deckBuilderPreview" aria-label="Kartenpreview">
      <DeckCardThumb
        cardId={card.catalogCardId}
        title={card.title}
        cardType={card.type}
        typeLine={formatDeckCardTypeLine(card)}
        metricLine={metrics}
        preview
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderPreviewText">
        <span>{deckBuilderCardGroup(card)}</span>
        <strong>{card.title}</strong>
        <small>{formatDeckCardTypeLine(card)}</small>
        {metrics ? <small>{metrics}</small> : null}
        <p>{detail?.text ?? "Kartentext wird geladen."}</p>
      </div>
      <div className="deckQuantityControls preview">
        <button className="deckQtyButton" onClick={onRemove} disabled={quantity <= 0} type="button" aria-label={`${card.title} entfernen`}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={onAdd} type="button" aria-label={`${card.title} hinzufügen`}>
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
  const metrics = deckCardMetricLine(detail);
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
        {...(card ? { typeLine: formatDeckCardTypeLine(card) } : {})}
        {...(metrics ? { metricLine: metrics } : {})}
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderCardText">
        <strong>{card?.title ?? cardId}</strong>
        <span>{card ? formatDeckCardTypeLine(card) : "Nicht im gültigen Kartenpool"}</span>
        {metrics ? <small>{metrics}</small> : null}
      </div>
      <div className="deckQuantityControls">
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onDecrement(); }} type="button" aria-label={`${card?.title ?? cardId} reduzieren`}>
          -
        </button>
        <output>{quantity}</output>
        <button className="deckQtyButton" onClick={(event) => { event.stopPropagation(); onIncrement(); }} type="button" aria-label={`${card?.title ?? cardId} erhöhen`}>
          +
        </button>
        <button className="deckQtyButton remove" onClick={(event) => { event.stopPropagation(); onRemove(); }} type="button" aria-label={`${card?.title ?? cardId} entfernen`}>
          <Trash2 size={13} />
        </button>
      </div>
    </DeckCardTooltipTrigger>
  );
}

function deckBuilderCardGroup(card: DeckBuilderCard | null): string {
  if (!card) return "Unbekannt";
  return [formatDeckCardTerm(card.type), card.subtypes.map(formatDeckCardTerm).join(" / ")].filter(Boolean).join(" - ");
}
