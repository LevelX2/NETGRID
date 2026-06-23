"use client";

import { Trash2 } from "lucide-react";
import type { CSSProperties } from "react";

import { neededDevelopmentLabel } from "../cards/card-detail-lines";
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
          {...(detail?.text ? { rulesText: detail.text } : {})}
          {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
          {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
        />
        <strong>{card.title}</strong>
        <span>{formatCatalogTypeLine(card)}</span>
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
  const metrics = deckBuilderMetricLine(detail);
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
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderCardText">
        <strong>{card.title}</strong>
        <span>{formatCatalogTypeLine(card)}</span>
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
  const metrics = deckBuilderMetricLine(detail);
  return (
    <section className="deckBuilderPreview" aria-label="Kartenpreview">
      <DeckCardThumb
        cardId={card.catalogCardId}
        title={card.title}
        cardType={card.type}
        preview
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderPreviewText">
        <span>{deckBuilderCardGroup(card)}</span>
        <strong>{card.title}</strong>
        <small>{formatCatalogTypeLine(card)}</small>
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
  const metrics = deckBuilderMetricLine(detail);
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
        {...(detail?.text ? { rulesText: detail.text } : {})}
        {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
        {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
      />
      <div className="deckBuilderCardText">
        <strong>{card?.title ?? cardId}</strong>
        <span>{card ? formatCatalogTypeLine(card) : "Nicht im gültigen Kartenpool"}</span>
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
  return [formatCatalogTerm(card.type), card.subtypes.map(formatCatalogTerm).join(" / ")].filter(Boolean).join(" - ");
}

function deckBuilderMetricLine(detail: DeckBuilderDetail | undefined): string {
  if (!detail) return "";
  return Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = detail.numeric[key];
      return catalogNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
}

function catalogNumericLabel(key: string, label: string, value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (key === "advancementRequirement") return neededDevelopmentLabel(value);
  return `${label} ${value}`;
}

function formatCatalogTypeLine(card: Pick<DeckBuilderCard, "type" | "subtypes">): string {
  const type = formatCatalogTerm(card.type);
  const subtypes = card.subtypes.map(formatCatalogTerm).join(" / ");
  return [type, subtypes].filter(Boolean).join(" - ");
}

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
