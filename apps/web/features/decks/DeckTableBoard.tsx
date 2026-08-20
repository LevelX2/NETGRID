"use client";

import { Check, Move, Plus, Save, SlidersHorizontal, X } from "lucide-react";
import type { CSSProperties, DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from "react";
import { useTranslations } from "use-intl/react";

import type { Side } from "@netgrid/shared";

import { type DeckAgendaStatus } from "./deck-editor-model";
import { DeckAgendaStatusBadge } from "./DeckAgendaStatusBadge";
import {
  DECK_TABLE_CARD_WIDTH_MAX,
  DECK_TABLE_CARD_WIDTH_MIN,
  DECK_TABLE_CARD_WIDTH_STEP,
  DECK_TABLE_LIBRARY_WIDTH_MAX,
  DECK_TABLE_LIBRARY_WIDTH_MIN,
  DECK_TABLE_LIBRARY_WIDTH_STEP,
  DECK_TABLE_MAX_COPIES_PER_CARD,
  DECK_TABLE_OVERLAP_MAX,
  DECK_TABLE_OVERLAP_MIN,
  DECK_TABLE_OVERLAP_STEP,
  MAX_DECK_TABLE_PILE_COUNT,
  MIN_DECK_TABLE_PILE_COUNT,
  deckTableNumericSortValue,
  deckTableSelectionKey,
  deckTableSortKeysForSide,
  deckTableSortRequiresDetails,
  type DeckTableArrangeMode,
  type DeckTableLayout,
  type DeckTableLayoutEntry,
  type DeckTablePile,
  type DeckTablePileSortMode,
  type DeckTableSelectionEntry,
} from "./deck-table-model";
import { DeckCardThumb } from "./DeckCardThumb";
import { DeckCardTooltipTrigger } from "./DeckCardTooltipTrigger";
import { cardMetricLine, formatCardTypeLine } from "../cards/card-text-lines";

type CatalogCardSummary = {
  catalogCardId: string;
  title: string;
  type: string;
  subtypes: string[];
};

type CatalogCardDetail = CatalogCardSummary & {
  side: string;
  setId: string;
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null | undefined>;
  definitionId?: string;
};

export function DeckTableBoard({
  layout,
  deckName,
  deckSide,
  cardLookup,
  cardDetailsById,
  activeMenuKey,
  cardWidth,
  controlsOpen,
  numericDetailsReady,
  overlapPercent,
  tableWidth,
  dirty,
  selectedCardIndexes,
  selectedCardKeys,
  selectedCards,
  selectionMode,
  agendaStatus,
  onBack,
  onCardClick,
  onClearSelection,
  onDuplicateCard,
  onMenu,
  onDropCard,
  onRenamePile,
  onRemoveCard,
  onArrangeDeck,
  onInsertPileAt,
  onSave,
  onSelectPile,
  onSetTableWidth,
  onSetCardWidth,
  onSetOverlapPercent,
  onSetPileCount,
  onToggleControls,
  onShowPileNames,
  onSetPileSortMode,
  onToggleSelectionMode
}: {
  layout: DeckTableLayout;
  deckName: string;
  deckSide: Side;
  cardLookup: Map<string, CatalogCardSummary>;
  cardDetailsById: Record<string, CatalogCardDetail>;
  activeMenuKey: string | null;
  cardWidth: number;
  controlsOpen: boolean;
  numericDetailsReady: boolean;
  overlapPercent: number;
  tableWidth: number;
  dirty: boolean;
  selectedCardIndexes: Map<string, number>;
  selectedCardKeys: Set<string>;
  selectedCards: DeckTableSelectionEntry[];
  selectionMode: boolean;
  agendaStatus: DeckAgendaStatus | null;
  onBack(): void;
  onCardClick(event: ReactMouseEvent<HTMLElement>, pileId: string, entry: DeckTableLayoutEntry): void;
  onClearSelection(): void;
  onDuplicateCard(pileId: string, cardId: string, sourceOrder: number, copiesToAdd: number): void;
  onMenu(key: string | null): void;
  onDropCard(event: ReactDragEvent<HTMLElement>, pileId: string, targetOrder?: number): void;
  onRenamePile(pileId: string, name: string): void;
  onRemoveCard(pileId: string, cardId: string, sourceOrder: number): void;
  onArrangeDeck(mode: DeckTableArrangeMode): void;
  onInsertPileAt(pileId: string): void;
  onSave(): void;
  onSelectPile(pileId: string): void;
  onSetTableWidth(value: number): void;
  onSetCardWidth(value: number): void;
  onSetOverlapPercent(value: number): void;
  onSetPileCount(value: number): void;
  onToggleControls(): void;
  onShowPileNames(visible: boolean): void;
  onSetPileSortMode(pileId: string, sortMode: DeckTablePileSortMode): void;
  onToggleSelectionMode(): void;
}) {
  const t = useTranslations("Decks.table");
  const totalCards = layout.piles.reduce((sum, pile) => sum + pile.entries.reduce((entrySum, entry) => entrySum + entry.quantity, 0), 0);
  return (
    <section className="deckTableBoardPanel">
      <div className="deckBuilderPanelHeader deckTableBoardHeader">
        <div>
          <h3>{t("title")}</h3>
          <p className="meta">{t("summary", {name: deckName, cards: totalCards, piles: layout.piles.length})}</p>
          <DeckAgendaStatusBadge status={agendaStatus} />
        </div>
        <div className="deckTableBoardTools">
          <button className={`button deckTableSelectionButton ${selectionMode ? "active" : ""}`} type="button" onClick={onToggleSelectionMode} aria-pressed={selectionMode}>
            <Check size={15} />
            {t("selection")}
          </button>
          {selectionMode ? (
            <>
              <span className="deckTableSelectionCount">{t("selected", {count: selectedCards.length})}</span>
              {selectedCards.length > 0 ? (
                <button className="button deckTableSelectionClear" type="button" onClick={onClearSelection}>
                  <X size={14} />
                  {t("clear")}
                </button>
              ) : null}
            </>
          ) : null}
          <span className={`deckTableSaveState ${dirty ? "dirty" : "ok"}`}>{dirty ? t("unsaved") : t("saved")}</span>
          <button className="button primary deckTableSaveButton" type="button" onClick={onSave} disabled={!dirty}>
            <Save size={15} />
            {t("save")}
          </button>
          <button className={`button deckTableViewButton ${controlsOpen ? "active" : ""}`} type="button" onClick={onToggleControls} aria-expanded={controlsOpen}>
            <SlidersHorizontal size={15} />
            {t("view")}
          </button>
          <button className="button" type="button" onClick={onBack}>
            {t("back")}
          </button>
        </div>
      </div>
      {controlsOpen ? (
        <div className="deckTableControls" aria-label={t("tableView")}>
          <label>
            <span>{t("tableWidth")}</span>
            <input min={DECK_TABLE_LIBRARY_WIDTH_MIN} max={DECK_TABLE_LIBRARY_WIDTH_MAX} step={DECK_TABLE_LIBRARY_WIDTH_STEP} type="range" value={tableWidth} onChange={(event) => onSetTableWidth(Number(event.target.value))} />
          </label>
          <label>
            <span>{t("cardSize")}</span>
            <input min={DECK_TABLE_CARD_WIDTH_MIN} max={DECK_TABLE_CARD_WIDTH_MAX} step={DECK_TABLE_CARD_WIDTH_STEP} type="range" value={cardWidth} onChange={(event) => onSetCardWidth(Number(event.target.value))} />
          </label>
          <label>
            <span>{t("overlap")}</span>
            <input min={DECK_TABLE_OVERLAP_MIN} max={DECK_TABLE_OVERLAP_MAX} step={DECK_TABLE_OVERLAP_STEP} type="range" value={overlapPercent} onChange={(event) => onSetOverlapPercent(Number(event.target.value))} />
          </label>
          <label>
            <span>{t("piles")}</span>
            <input min={MIN_DECK_TABLE_PILE_COUNT} max={MAX_DECK_TABLE_PILE_COUNT} step={1} type="range" value={layout.piles.length} onChange={(event) => onSetPileCount(Number(event.target.value))} />
            <b>{layout.piles.length}</b>
          </label>
          <label className={`deckBuilderToggle deckTableNameToggle ${layout.showPileNames ? "checked" : ""}`}>
            <input checked={layout.showPileNames} onChange={(event) => onShowPileNames(event.target.checked)} type="checkbox" />
            {t("pileNames")}
          </label>
          <label>
            <span>{t("arrange")}</span>
            <select
              defaultValue=""
              onChange={(event) => {
                const mode = event.currentTarget.value as "" | DeckTableArrangeMode;
                if (mode) onArrangeDeck(mode);
                event.currentTarget.value = "";
              }}
            >
              <option value="">{t("choose")}</option>
              <option value="type">{t("arrangeByType")}</option>
              <option value="install-piles" disabled={!numericDetailsReady}>
                {numericDetailsReady ? t("arrangeByCost") : t("valuesLoading")}
              </option>
              {deckTableSortKeysForSide(deckSide).map((sortBy) => (
                <option disabled={deckTableSortRequiresDetails(sortBy) && !numericDetailsReady} key={sortBy} value={sortBy}>
                  {t("allPilesBy", {sort: t(`sort.${sortBy}`)})}
                  {deckTableSortRequiresDetails(sortBy) && !numericDetailsReady ? ` (${t("valuesLoading")})` : ""}
                </option>
              ))}
            </select>
            {!numericDetailsReady ? <small className="deckTableSortStatus" role="status">{t("numericSortHelp")}</small> : null}
          </label>
        </div>
      ) : null}
      <div className="deckTableGrid">
        {layout.piles.map((pile) => (
          <DeckTablePileView
            activeMenuKey={activeMenuKey}
            cardDetailsById={cardDetailsById}
            cardLookup={cardLookup}
            deckSide={deckSide}
            key={pile.id}
            selectedCardIndexes={selectedCardIndexes}
            selectedCardKeys={selectedCardKeys}
            selectedCards={selectedCards}
            selectionMode={selectionMode}
            canInsertPile={layout.piles.length < MAX_DECK_TABLE_PILE_COUNT}
            onCardClick={onCardClick}
            onDuplicateCard={onDuplicateCard}
            onDropCard={onDropCard}
            onInsertPileAt={onInsertPileAt}
            onMenu={onMenu}
            onRenamePile={onRenamePile}
            onRemoveCard={onRemoveCard}
            onSelectPile={onSelectPile}
            onSetPileSortMode={onSetPileSortMode}
            pile={pile}
            showName={layout.showPileNames}
          />
        ))}
      </div>
    </section>
  );
}

function DeckTablePileView({
  pile,
  showName,
  cardLookup,
  cardDetailsById,
  deckSide,
  activeMenuKey,
  selectedCardIndexes,
  selectedCardKeys,
  selectedCards,
  selectionMode,
  canInsertPile,
  onCardClick,
  onDuplicateCard,
  onMenu,
  onDropCard,
  onInsertPileAt,
  onRenamePile,
  onRemoveCard,
  onSelectPile,
  onSetPileSortMode
}: {
  pile: DeckTablePile;
  showName: boolean;
  cardLookup: Map<string, CatalogCardSummary>;
  cardDetailsById: Record<string, CatalogCardDetail>;
  deckSide: Side;
  activeMenuKey: string | null;
  selectedCardIndexes: Map<string, number>;
  selectedCardKeys: Set<string>;
  selectedCards: DeckTableSelectionEntry[];
  selectionMode: boolean;
  canInsertPile: boolean;
  onCardClick(event: ReactMouseEvent<HTMLElement>, pileId: string, entry: DeckTableLayoutEntry): void;
  onDuplicateCard(pileId: string, cardId: string, sourceOrder: number, copiesToAdd: number): void;
  onMenu(key: string | null): void;
  onDropCard(event: ReactDragEvent<HTMLElement>, pileId: string, targetOrder?: number): void;
  onInsertPileAt(pileId: string): void;
  onRenamePile(pileId: string, name: string): void;
  onRemoveCard(pileId: string, cardId: string, sourceOrder: number): void;
  onSelectPile(pileId: string): void;
  onSetPileSortMode(pileId: string, sortMode: DeckTablePileSortMode): void;
}) {
  const t = useTranslations("Decks.table");
  const cardCount = pile.entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const pileSelectionKeys = pile.entries.map((entry) => deckTableSelectionKey(pile.id, entry.cardId, entry.order));
  const pileSelected = pileSelectionKeys.length > 0 && pileSelectionKeys.every((key) => selectedCardKeys.has(key));
  const numericDetailsReady = pile.entries.every((entry) => Boolean(cardDetailsById[entry.cardId]));
  const numericSortWaiting = deckTableSortRequiresDetails(pile.sortMode) && !numericDetailsReady;
  const sortStatusId = `deck-table-sort-status-${pile.id}`;
  return (
    <section
      className="deckTablePile"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropCard(event, pile.id)}
      aria-label={t("pileAria", {name: pile.name || t("pile"), count: cardCount})}
    >
      <div className="deckTablePileHeader">
        <div className="deckTablePileTitleRow">
          <button
            aria-label={t("movePile", {name: pile.name || t("pileNumber", {number: pile.order + 1})})}
            className="deckTablePileMoveHandle"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-netgrid-pile", JSON.stringify({ pileId: pile.id }));
              event.dataTransfer.effectAllowed = "move";
            }}
            type="button"
          >
            <Move size={12} />
          </button>
          <button
            aria-label={t("insertBefore", {name: pile.name || t("pileNumber", {number: pile.order + 1})})}
            className="deckTablePileInsertButton"
            disabled={!canInsertPile}
            onClick={() => onInsertPileAt(pile.id)}
            title={canInsertPile ? t("insertHere") : t("maxPiles")}
            type="button"
          >
            <Plus size={12} />
          </button>
          {showName ? (
            <input value={pile.name ?? ""} onChange={(event) => onRenamePile(pile.id, event.target.value)} aria-label={t("pileName")} />
          ) : (
            <strong>{t("pileNumber", {number: pile.order + 1})}</strong>
          )}
          {selectionMode ? (
            <button className={`deckTableSelectPileButton ${pileSelected ? "active" : ""}`} onClick={() => onSelectPile(pile.id)} type="button">
              {t("all")}
            </button>
          ) : null}
        </div>
        <select
          aria-label={t("sortingFor", {name: pile.name || t("pileNumber", {number: pile.order + 1})})}
          aria-describedby={numericSortWaiting ? sortStatusId : undefined}
          value={pile.sortMode}
          onChange={(event) => {
            const sortMode = event.currentTarget.value as DeckTablePileSortMode;
            onSetPileSortMode(pile.id, sortMode);
          }}
        >
          <option value="free">{t("sort.free")}</option>
          {deckTableSortKeysForSide(deckSide).map((sortBy) => (
            <option disabled={deckTableSortRequiresDetails(sortBy) && !numericDetailsReady} value={sortBy} key={sortBy}>
              {t(`sort.${sortBy}`)}
              {deckTableSortRequiresDetails(sortBy) && !numericDetailsReady ? ` (${t("valuesLoading")})` : ""}
            </option>
          ))}
        </select>
        {numericSortWaiting ? <small className="deckTableSortStatus" id={sortStatusId} role="status">{t("sortWaiting")}</small> : null}
      </div>
      <div className="deckTablePileCards">
        {pile.entries.map((entry, index) => {
          const card = cardLookup.get(entry.cardId) ?? null;
          const detail = cardDetailsById[entry.cardId];
          const numericSortValue = deckTableNumericSortValue(pile.sortMode, detail);
          const menuKey = `${pile.id}:${entry.cardId}:${entry.order}`;
          const selectionKey = deckTableSelectionKey(pile.id, entry.cardId, entry.order);
          const selected = selectedCardKeys.has(selectionKey);
          const selectedIndex = selectedCardIndexes.get(selectionKey);
          const dragCards = selected && selectedCards.length > 0 ? selectedCards : [{ pileId: pile.id, cardId: entry.cardId, order: entry.order }];
          return (
            <DeckCardTooltipTrigger
              card={card}
              detail={detail}
              cardId={entry.cardId}
              className={`deckTableCard ${selected ? "selected" : ""}`}
              key={menuKey}
              onSelect={() => undefined}
              style={{ "--deck-table-card-z": index + 1 } as CSSProperties}
            >
              <div
                className="deckTableCardInner"
                draggable
                onClick={(event) => onCardClick(event, pile.id, entry)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-netgrid-card", JSON.stringify({ cards: dragCards, cardId: entry.cardId, sourcePileId: pile.id, sourceOrder: entry.order, quantity: 1 }));
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDrop={(event) => {
                  event.stopPropagation();
                  onDropCard(event, pile.id, entry.order);
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  onMenu(activeMenuKey === menuKey ? null : menuKey);
                }}
              >
                {card ? (
                  <DeckCardThumb
                    cardId={card.catalogCardId}
                    title={card.title}
                    cardType={card.type}
                    typeLine={formatCardTypeLine(card)}
                    metricLine={cardMetricLine(detail)}
                    table
                    {...(detail?.text ? { rulesText: detail.text } : {})}
                    {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
                    {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
                  />
                ) : (
                  <span className="deckTableMissingCard">{entry.cardId}</span>
                )}
                <span className="deckTableCardCaption">{card?.title ?? entry.cardId}</span>
                {numericSortValue !== null ? <span aria-label={`${t(`sort.${pile.sortMode}`)}: ${numericSortValue}`} className="deckTableSortValue">{numericSortValue}</span> : null}
                {selectedIndex ? <span className="deckTableSelectionBadge">{selectedIndex}</span> : null}
                {activeMenuKey === menuKey ? (
                  <span className="deckTableCardMenu" onClick={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => onDuplicateCard(pile.id, entry.cardId, entry.order, 1)}>
                      {t("copy")}
                    </button>
                    <button type="button" onClick={() => onDuplicateCard(pile.id, entry.cardId, entry.order, DECK_TABLE_MAX_COPIES_PER_CARD)}>
                      {t("upToThree")}
                    </button>
                    <button type="button" onClick={() => onRemoveCard(pile.id, entry.cardId, entry.order)}>
                      {t("remove")}
                    </button>
                  </span>
                ) : null}
              </div>
            </DeckCardTooltipTrigger>
          );
        })}
        {pile.entries.length === 0 ? <p className="meta deckTablePileEmpty">{t("dropCard")}</p> : null}
      </div>
    </section>
  );
}
