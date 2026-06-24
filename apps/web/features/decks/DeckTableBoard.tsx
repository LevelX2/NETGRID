"use client";

import { Check, Move, Plus, Save, SlidersHorizontal, X } from "lucide-react";
import type { CSSProperties, DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from "react";

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
  deckTablePileSortModeLabel,
  deckTableSelectionKey,
  deckTableSortLabel,
  type DeckTableArrangeMode,
  type DeckTableLayout,
  type DeckTableLayoutEntry,
  type DeckTablePile,
  type DeckTablePileSortMode,
  type DeckTableSelectionEntry,
  type DeckTableSortKey,
} from "./deck-table-model";
import { DeckCardThumb } from "./DeckCardThumb";
import { DeckCardTooltipTrigger } from "./DeckCardTooltipTrigger";

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
  cardLookup,
  cardDetailsById,
  activeMenuKey,
  cardWidth,
  controlsOpen,
  costDetailsReady,
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
  cardLookup: Map<string, CatalogCardSummary>;
  cardDetailsById: Record<string, CatalogCardDetail>;
  activeMenuKey: string | null;
  cardWidth: number;
  controlsOpen: boolean;
  costDetailsReady: boolean;
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
  const totalCards = layout.piles.reduce((sum, pile) => sum + pile.entries.reduce((entrySum, entry) => entrySum + entry.quantity, 0), 0);
  return (
    <section className="deckTableBoardPanel">
      <div className="deckBuilderPanelHeader deckTableBoardHeader">
        <div>
          <h3>Deck-Tisch</h3>
          <p className="meta">{deckName} · {totalCards} Karten auf {layout.piles.length} Stapeln</p>
          <DeckAgendaStatusBadge status={agendaStatus} />
        </div>
        <div className="deckTableBoardTools">
          <button className={`button deckTableSelectionButton ${selectionMode ? "active" : ""}`} type="button" onClick={onToggleSelectionMode} aria-pressed={selectionMode}>
            <Check size={15} />
            Auswahl
          </button>
          {selectionMode ? (
            <>
              <span className="deckTableSelectionCount">{selectedCards.length} ausgewählt</span>
              {selectedCards.length > 0 ? (
                <button className="button deckTableSelectionClear" type="button" onClick={onClearSelection}>
                  <X size={14} />
                  Lösen
                </button>
              ) : null}
            </>
          ) : null}
          <span className={`deckTableSaveState ${dirty ? "dirty" : "ok"}`}>{dirty ? "Ungespeichert" : "Gespeichert"}</span>
          <button className="button primary deckTableSaveButton" type="button" onClick={onSave} disabled={!dirty}>
            <Save size={15} />
            Speichern
          </button>
          <button className={`button deckTableViewButton ${controlsOpen ? "active" : ""}`} type="button" onClick={onToggleControls} aria-expanded={controlsOpen}>
            <SlidersHorizontal size={15} />
            Ansicht
          </button>
          <button className="button" type="button" onClick={onBack}>
            Zurück zur Liste
          </button>
        </div>
      </div>
      {controlsOpen ? (
        <div className="deckTableControls" aria-label="Tischdarstellung">
          <label>
            <span>Tischbreite</span>
            <input min={DECK_TABLE_LIBRARY_WIDTH_MIN} max={DECK_TABLE_LIBRARY_WIDTH_MAX} step={DECK_TABLE_LIBRARY_WIDTH_STEP} type="range" value={tableWidth} onChange={(event) => onSetTableWidth(Number(event.target.value))} />
          </label>
          <label>
            <span>Kartengröße</span>
            <input min={DECK_TABLE_CARD_WIDTH_MIN} max={DECK_TABLE_CARD_WIDTH_MAX} step={DECK_TABLE_CARD_WIDTH_STEP} type="range" value={cardWidth} onChange={(event) => onSetCardWidth(Number(event.target.value))} />
          </label>
          <label>
            <span>Überlappung</span>
            <input min={DECK_TABLE_OVERLAP_MIN} max={DECK_TABLE_OVERLAP_MAX} step={DECK_TABLE_OVERLAP_STEP} type="range" value={overlapPercent} onChange={(event) => onSetOverlapPercent(Number(event.target.value))} />
          </label>
          <label>
            <span>Stapel</span>
            <input min={MIN_DECK_TABLE_PILE_COUNT} max={MAX_DECK_TABLE_PILE_COUNT} step={1} type="range" value={layout.piles.length} onChange={(event) => onSetPileCount(Number(event.target.value))} />
            <b>{layout.piles.length}</b>
          </label>
          <label className={`deckBuilderToggle deckTableNameToggle ${layout.showPileNames ? "checked" : ""}`}>
            <input checked={layout.showPileNames} onChange={(event) => onShowPileNames(event.target.checked)} type="checkbox" />
            Stapelnamen
          </label>
          <label>
            <span>Deck ordnen</span>
            <select
              defaultValue=""
              onChange={(event) => {
                const mode = event.currentTarget.value as "" | DeckTableArrangeMode;
                if (mode) onArrangeDeck(mode);
                event.currentTarget.value = "";
              }}
            >
              <option value="">Auswählen</option>
              <option value="type">Nach Typen auf Stapel verteilen</option>
              <option value="install-piles" disabled={!costDetailsReady}>
                {costDetailsReady ? "Nach Kartenkosten auf Stapel verteilen" : "Kartenkosten werden geladen"}
              </option>
              <option value="name">Alle Stapel nach Name</option>
              <option value="install">Alle Stapel nach Installkosten</option>
              <option value="rez">Alle Stapel nach Rez-Kosten</option>
              <option value="trash">Alle Stapel nach Trashkosten</option>
              <option value="cost">Alle Stapel nach Kosten</option>
              <option value="strength">Alle Stapel nach Stärke</option>
              <option value="agenda">Alle Stapel nach Agenda-Punkten</option>
            </select>
          </label>
        </div>
      ) : null}
      <div className="deckTableGrid">
        {layout.piles.map((pile) => (
          <DeckTablePileView
            activeMenuKey={activeMenuKey}
            cardDetailsById={cardDetailsById}
            cardLookup={cardLookup}
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
  const cardCount = pile.entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const pileSelectionKeys = pile.entries.map((entry) => deckTableSelectionKey(pile.id, entry.cardId, entry.order));
  const pileSelected = pileSelectionKeys.length > 0 && pileSelectionKeys.every((key) => selectedCardKeys.has(key));
  return (
    <section
      className="deckTablePile"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropCard(event, pile.id)}
      aria-label={`${pile.name || "Stapel"} mit ${cardCount} Karten`}
    >
      <div className="deckTablePileHeader">
        <div className="deckTablePileTitleRow">
          <button
            aria-label={`${pile.name || `Stapel ${pile.order + 1}`} verschieben`}
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
            aria-label={`Freien Stapel vor ${pile.name || `Stapel ${pile.order + 1}`} einfügen`}
            className="deckTablePileInsertButton"
            disabled={!canInsertPile}
            onClick={() => onInsertPileAt(pile.id)}
            title={canInsertPile ? "Freien Stapel hier einfügen" : "Maximale Stapelzahl erreicht"}
            type="button"
          >
            <Plus size={12} />
          </button>
          {showName ? (
            <input value={pile.name ?? ""} onChange={(event) => onRenamePile(pile.id, event.target.value)} aria-label="Stapelname" />
          ) : (
            <strong>Stapel {pile.order + 1}</strong>
          )}
          {selectionMode ? (
            <button className={`deckTableSelectPileButton ${pileSelected ? "active" : ""}`} onClick={() => onSelectPile(pile.id)} type="button">
              Alle
            </button>
          ) : null}
        </div>
        <select
          aria-label={`Sortierung für ${pile.name || `Stapel ${pile.order + 1}`}`}
          value={pile.sortMode}
          onChange={(event) => {
            const sortMode = event.currentTarget.value as DeckTablePileSortMode;
            onSetPileSortMode(pile.id, sortMode);
          }}
        >
          <option value="free">{deckTablePileSortModeLabel("free")}</option>
          {(["name", "type", "install", "rez", "trash", "cost", "strength", "agenda"] as DeckTableSortKey[]).map((sortBy) => (
            <option value={sortBy} key={sortBy}>
              {deckTableSortLabel(sortBy)}
            </option>
          ))}
        </select>
      </div>
      <div className="deckTablePileCards">
        {pile.entries.map((entry, index) => {
          const card = cardLookup.get(entry.cardId) ?? null;
          const detail = cardDetailsById[entry.cardId];
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
                    table
                    {...(detail?.text ? { rulesText: detail.text } : {})}
                    {...(detail?.numeric.installCost !== null && detail?.numeric.installCost !== undefined ? { installCost: detail.numeric.installCost } : {})}
                    {...(detail?.numeric.cost !== null && detail?.numeric.cost !== undefined ? { cost: detail.numeric.cost } : {})}
                  />
                ) : (
                  <span className="deckTableMissingCard">{entry.cardId}</span>
                )}
                <span className="deckTableCardCaption">{card?.title ?? entry.cardId}</span>
                {selectedIndex ? <span className="deckTableSelectionBadge">{selectedIndex}</span> : null}
                {activeMenuKey === menuKey ? (
                  <span className="deckTableCardMenu" onClick={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => onDuplicateCard(pile.id, entry.cardId, entry.order, 1)}>
                      Kopie
                    </button>
                    <button type="button" onClick={() => onDuplicateCard(pile.id, entry.cardId, entry.order, DECK_TABLE_MAX_COPIES_PER_CARD)}>
                      Bis 3
                    </button>
                    <button type="button" onClick={() => onRemoveCard(pile.id, entry.cardId, entry.order)}>
                      Entfernen
                    </button>
                  </span>
                ) : null}
              </div>
            </DeckCardTooltipTrigger>
          );
        })}
        {pile.entries.length === 0 ? <p className="meta deckTablePileEmpty">Karte hier ablegen</p> : null}
      </div>
    </section>
  );
}
