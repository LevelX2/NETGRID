"use client";

import { Cable, Check, ChevronDown, ChevronUp, CopyPlus, Download, ListFilter, Move, Play, Plus, Save, Search, SlidersHorizontal, Trash2, Upload, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties, DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from "react";
import type { DeckPublicMetadata, Side } from "@netgrid/shared";

import { deckAgendaStatusForEditor } from "./deck-editor-model";
import { type DeckStrategyProfileViewerResponse } from "../../app/deck-strategy-profile-ui";
import {
  CATALOG_RARITY_FILTERS,
  filterCatalogCardsBySet,
  filterCatalogCardsByRarity,
  catalogCardMatchesTypeFilters,
  catalogRarityLabel,
  catalogSetDetailLabel,
  summarizeCatalogRarityFilters,
  summarizeCatalogSetFilters,
  summarizeCatalogTypeFilters,
  type CatalogRarityFilterKey,
  type CatalogSetFilterKey,
  type CatalogTypeFilterKey,
  type CatalogTypeFilterState
} from "../catalog/catalog-model";
import {
  DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY,
  LEGACY_DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY
} from "../../lib/storage-keys";
import { readLocalStorageWithLegacy } from "../../lib/local-storage";
import { neededDevelopmentLabel } from "../cards/card-detail-lines";
import { DeckAgendaStatusBadge } from "./DeckAgendaStatusBadge";
import {
  DeckBuilderPreview,
  DeckLibraryCard,
  DeckListCard,
  DeckTableLibraryCard
} from "./DeckBuilderCards";
import { DeckCardThumb } from "./DeckCardThumb";
import { DeckCardTooltipTrigger } from "./DeckCardTooltipTrigger";
import { DeckMetadataLine } from "./DeckSelectionControls";
import { DeckStrategyProfilePanel } from "./DeckStrategyProfilePanel";
import { DeckTableBoard } from "./DeckTableBoard";
import { DeckValidationSummary } from "./DeckValidationSummary";
import {
  DECK_TABLE_CARD_WIDTH_DEFAULT,
  DECK_TABLE_CARD_WIDTH_MAX,
  DECK_TABLE_CARD_WIDTH_MIN,
  DECK_TABLE_CARD_WIDTH_STEP,
  DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT,
  DECK_TABLE_LIBRARY_CARD_WIDTH_MAX,
  DECK_TABLE_LIBRARY_CARD_WIDTH_MIN,
  DECK_TABLE_LIBRARY_CARD_WIDTH_STEP,
  DECK_TABLE_LIBRARY_OVERLAP_DEFAULT,
  DECK_TABLE_LIBRARY_OVERLAP_MAX,
  DECK_TABLE_LIBRARY_OVERLAP_MIN,
  DECK_TABLE_LIBRARY_OVERLAP_STEP,
  DECK_TABLE_LIBRARY_WIDTH_DEFAULT,
  DECK_TABLE_LIBRARY_WIDTH_MAX,
  DECK_TABLE_LIBRARY_WIDTH_MIN,
  DECK_TABLE_LIBRARY_WIDTH_STEP,
  DECK_TABLE_MAX_COPIES_PER_CARD,
  DECK_TABLE_OVERLAP_DEFAULT,
  DECK_TABLE_OVERLAP_MAX,
  DECK_TABLE_OVERLAP_MIN,
  DECK_TABLE_OVERLAP_STEP,
  MAX_DECK_TABLE_PILE_COUNT,
  MIN_DECK_TABLE_PILE_COUNT,
  applyDeckTablePileSort,
  deckCardsFromTableLayout,
  deckFingerprint,
  deckMetadataFromEditable,
  deckStrategyProfileFingerprint,
  deckTableCardTotal,
  deckTableSelectionKey,
  defaultDeckTablePileName,
  distributeDeckTableByInstallCost,
  distributeDeckTableByType,
  insertDeckTableEntries,
  insertDeckTableEntry,
  normalizeDeckTableLayout,
  normalizeDeckTableViewSettings,
  normalizeSteppedNumber,
  parseDeckTableViewSettings,
  reorderDeckTableEntries,
  type DeckCardEntry,
  type DeckEditorMode,
  type DeckTableArrangeMode,
  type DeckTableLayout,
  type DeckTableLayoutEntry,
  type DeckTablePile,
  type DeckTablePileSortMode,
  type DeckTableSelectionEntry,
  type DeckTableViewSettings,
  type EditableDeck
} from "./deck-table-model";

type DeckSideFilter = Side | "all";

type CatalogStatusKey = "imported" | "validated" | "catalog_ready" | "implemented" | "engine_supported" | "playable" | "human_playable" | "ai_supported" | "deck_legal" | "format_legal" | "blocked";

type CatalogStatuses = Record<CatalogStatusKey, boolean>;

type CatalogCardSummary = {
  catalogCardId: string;
  title: string;
  side: Side;
  type: string;
  subtypes: string[];
  faction: string;
  setId: string;
  rarity?: {
    code: string;
    labelDe: string;
    labelEn?: string;
    sourceValue?: string;
    sourceId?: string;
  };
  statuses: CatalogStatuses;
  blockReasons: string[];
};

type CatalogCardDetail = CatalogCardSummary & {
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null>;
  engineCardId: string | null;
};

type DeckValidationResult = {
  ok: boolean;
  errors: string[];
  errorCodes?: string[];
  warnings: string[];
  totalCards: number;
  agendaPoints: number | null;
  influenceSpent?: number | null;
};

type DeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  deckVersion: string;
  name: string;
  side: Side;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  rulesBaselineId: string;
  immutable: boolean;
  cards: DeckCardEntry[];
  validation: DeckValidationResult;
  publicMetadata: DeckPublicMetadata;
  deckHash: string;
};

const RUNNER_CATALOG_TYPE_FILTERS: Array<{ key: CatalogTypeFilterKey; label: string }> = [
  { key: "event", label: "Prep" },
  { key: "hardware", label: "Hardware" },
  { key: "resource", label: "Ressource" },
  { key: "program", label: "Programm" },
  { key: "icebreaker", label: "Icebrecher" }
];

const CORP_CATALOG_TYPE_FILTERS: Array<{ key: CatalogTypeFilterKey; label: string }> = [
  { key: "ice", label: "ICE" },
  { key: "agenda", label: "Agenda" },
  { key: "asset", label: "Asset" },
  { key: "upgrade", label: "Upgrade" },
  { key: "operation", label: "Operation" }
];

const CATALOG_TYPE_FILTER_GROUPS: Array<{ title: string; side: Side; filters: Array<{ key: CatalogTypeFilterKey; label: string }> }> = [
  { title: "Runner", side: "runner", filters: RUNNER_CATALOG_TYPE_FILTERS },
  { title: "Korp", side: "corp", filters: CORP_CATALOG_TYPE_FILTERS }
];

const DECK_SOURCE_FILTERS: Array<{ key: CatalogSetFilterKey; label: string }> = [
  { key: "all", label: "Alle Sets" },
  { key: "original", label: "Original NetGrid Set" },
  { key: "test", label: "Testkarten" },
  { key: "other", label: "Andere Sets" }
];

const ALL_CATALOG_TYPE_FILTERS: CatalogTypeFilterState = {
  event: true,
  hardware: true,
  resource: true,
  program: true,
  icebreaker: true,
  ice: true,
  agenda: true,
  asset: true,
  upgrade: true,
  operation: true
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

function formatCatalogTypeLine(card: Pick<CatalogCardSummary, "type" | "subtypes">): string {
  const type = formatCatalogTerm(card.type);
  const subtypes = card.subtypes.map(formatCatalogTerm).join(" / ");
  return [type, subtypes].filter(Boolean).join(" - ");
}

function catalogNumericLabel(key: string, label: string, value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (key === "advancementRequirement") return neededDevelopmentLabel(value);
  return `${label} ${value}`;
}

function deckBuilderCardGroup(card: CatalogCardSummary | null): string {
  if (!card) return "Unbekannt";
  return [formatCatalogTerm(card.type), card.subtypes.map(formatCatalogTerm).join(" / ")].filter(Boolean).join(" - ");
}

function deckBuilderMetricLine(detail: CatalogCardDetail | undefined): string {
  if (!detail) return "";
  return Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = detail.numeric[key];
      return catalogNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
}

function deckBuilderCardTooltip(card: CatalogCardSummary, detail: CatalogCardDetail | undefined): string {
  return [card.title, formatCatalogTypeLine(card), detail ? catalogSetDetailLabel(detail) : "", detail ? deckBuilderMetricLine(detail) : "", detail?.text ?? ""].filter(Boolean).join("\n");
}

function catalogCardAllowedForDeckEditor(card: CatalogCardSummary, deck: EditableDeck | null): boolean {
  if (!deck) return true;
  return card.side === deck.side;
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}

function snapshotAllowedForMatchCardPool(snapshot: DeckSnapshot, matchCardPool: { kind: "latest" | "snapshot"; snapshotId?: string }): boolean {
  if (matchCardPool.kind !== "snapshot") return true;
  return snapshot.cardPoolSnapshotId === matchCardPool.snapshotId;
}
export function DeckEditorPanel({
  localDecks,
  selectedDeck,
  selectedDeckDirty,
  storagePath,
  validation,
  validatedSnapshot,
  playableCards,
  cardDetailsById,
  importText,
  exportText,
  onCreateEmpty,
  onSelectDeck,
  onUpdateDeck,
  onSave,
  onUpdateQuantity,
  onDuplicate,
  onDelete,
  onValidate,
  onUseForMatch,
  useForMatchLabel = "Im Matchstart auswählen",
  onExport,
  onImportText,
  onImport
}: {
  localDecks: EditableDeck[];
  selectedDeck: EditableDeck | null;
  selectedDeckDirty: boolean;
  storagePath: string;
  validation: DeckValidationResult | null;
  validatedSnapshot: DeckSnapshot | null;
  playableCards: CatalogCardSummary[];
  cardDetailsById: Record<string, CatalogCardDetail>;
  importText: string;
  exportText: string;
  onCreateEmpty(side: Side): void;
  onSelectDeck(deckId: string): void;
  onUpdateDeck(deck: EditableDeck): void;
  onSave(): void;
  onUpdateQuantity(cardId: string, quantity: number): void;
  onDuplicate(): void;
  onDelete(): void;
  onValidate(): void;
  onUseForMatch(): void;
  useForMatchLabel?: string;
  onExport(): void;
  onImportText(value: string): void;
  onImport(): void;
}) {
  const [builderSearch, setBuilderSearch] = useState("");
  const [builderTypeFilters, setBuilderTypeFilters] = useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [builderSetFilter, setBuilderSetFilter] = useState<CatalogSetFilterKey>("all");
  const [builderRarityFilter, setBuilderRarityFilter] = useState<CatalogRarityFilterKey>("all");
  const [builderOnlyInDeck, setBuilderOnlyInDeck] = useState(false);
  const [builderFiltersOpen, setBuilderFiltersOpen] = useState(false);
  const [deckDetailsOpen, setDeckDetailsOpen] = useState(true);
  const [deckPickerOpen, setDeckPickerOpen] = useState(true);
  const [deckEditorMode, setDeckEditorMode] = useState<DeckEditorMode>("list");
  const [tableCardMenuKey, setTableCardMenuKey] = useState<string | null>(null);
  const [tableCardWidth, setTableCardWidth] = useState(DECK_TABLE_CARD_WIDTH_DEFAULT);
  const [tableOverlapPercent, setTableOverlapPercent] = useState(DECK_TABLE_OVERLAP_DEFAULT);
  const [tableLibraryWidth, setTableLibraryWidth] = useState(DECK_TABLE_LIBRARY_WIDTH_DEFAULT);
  const [tableLibraryCardWidth, setTableLibraryCardWidth] = useState(DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT);
  const [tableLibraryOverlapPercent, setTableLibraryOverlapPercent] = useState(DECK_TABLE_LIBRARY_OVERLAP_DEFAULT);
  const [tableViewSettingsLoaded, setTableViewSettingsLoaded] = useState(false);
  const [tableControlsOpen, setTableControlsOpen] = useState(false);
  const [tableLibraryControlsOpen, setTableLibraryControlsOpen] = useState(false);
  const [tableSelectionMode, setTableSelectionMode] = useState(false);
  const [selectedTableCardKeys, setSelectedTableCardKeys] = useState<string[]>([]);
  const [tableSelectionAnchor, setTableSelectionAnchor] = useState<{ pileId: string; order: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deckSideFilter, setDeckSideFilter] = useState<DeckSideFilter>("all");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const totalCards = selectedDeck?.cards.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const deckQuantities = useMemo(() => new Map(selectedDeck?.cards.map((entry) => [entry.cardId, entry.quantity]) ?? []), [selectedDeck?.cards]);
  const cardLookup = useMemo(() => new Map(playableCards.map((card) => [card.catalogCardId, card])), [playableCards]);
  const agendaStatus = useMemo(() => deckAgendaStatusForEditor(selectedDeck, cardDetailsById, cardLookup), [cardDetailsById, cardLookup, selectedDeck]);
  const tableLayout = useMemo(() => (selectedDeck ? normalizeDeckTableLayout(selectedDeck, cardLookup, cardDetailsById) : null), [cardDetailsById, cardLookup, selectedDeck]);
  const sourceFilteredPlayableCards = useMemo(() => filterCatalogCardsBySet(playableCards, builderSetFilter), [builderSetFilter, playableCards]);
  const rarityFilteredPlayableCards = useMemo(() => filterCatalogCardsByRarity(sourceFilteredPlayableCards, builderRarityFilter), [builderRarityFilter, sourceFilteredPlayableCards]);
  const builderSetCounts = useMemo(() => summarizeCatalogSetFilters(playableCards), [playableCards]);
  const builderRarityCounts = useMemo(() => summarizeCatalogRarityFilters(sourceFilteredPlayableCards), [sourceFilteredPlayableCards]);
  const builderTypeCounts = useMemo(() => summarizeCatalogTypeFilters(rarityFilteredPlayableCards), [rarityFilteredPlayableCards]);
  const runnerDeckCount = localDecks.filter((deck) => deck.side === "runner").length;
  const corpDeckCount = localDecks.filter((deck) => deck.side === "corp").length;
  const filteredLocalDecks = useMemo(() => (deckSideFilter === "all" ? localDecks : localDecks.filter((deck) => deck.side === deckSideFilter)), [deckSideFilter, localDecks]);
  const selectedDeckSelectValue = selectedDeck && filteredLocalDecks.some((deck) => deck.deckId === selectedDeck.deckId) ? selectedDeck.deckId : "";
  const visibleTypeFilterGroups = selectedDeck ? CATALOG_TYPE_FILTER_GROUPS.filter((group) => group.side === selectedDeck.side) : CATALOG_TYPE_FILTER_GROUPS;
  const libraryCards = useMemo(() => {
    const search = builderSearch.trim().toLowerCase();
    return rarityFilteredPlayableCards
      .filter((card) => {
        if (builderOnlyInDeck && !deckQuantities.has(card.catalogCardId)) return false;
        if (!catalogCardMatchesTypeFilters(card, builderTypeFilters)) return false;
        if (!search) return true;
        const detail = cardDetailsById[card.catalogCardId];
        return [card.title, card.type, card.faction, ...card.subtypes, detail?.text ?? ""].some((value) => value.toLowerCase().includes(search));
      })
      .sort((left, right) => deckBuilderCardGroup(left).localeCompare(deckBuilderCardGroup(right)) || left.title.localeCompare(right.title));
  }, [builderOnlyInDeck, builderSearch, builderTypeFilters, cardDetailsById, deckQuantities, rarityFilteredPlayableCards]);
  const deckRows = useMemo(
    () =>
      (selectedDeck?.cards ?? [])
        .map((entry) => ({ entry, card: cardLookup.get(entry.cardId) ?? null }))
        .sort((left, right) => deckBuilderCardGroup(left.card).localeCompare(deckBuilderCardGroup(right.card)) || (left.card?.title ?? left.entry.cardId).localeCompare(right.card?.title ?? right.entry.cardId)),
    [cardLookup, selectedDeck?.cards]
  );
  const deckTableCostDetailsReady = useMemo(() => (selectedDeck?.cards ?? []).every((entry) => Boolean(cardDetailsById[entry.cardId])), [cardDetailsById, selectedDeck?.cards]);
  const tableLibraryColumnCount = Math.max(1, Math.floor((tableLibraryWidth - 18) / Math.max(70, tableLibraryCardWidth + 12)));
  const selectedTableCardKeySet = useMemo(() => new Set(selectedTableCardKeys), [selectedTableCardKeys]);
  const selectedTableCardIndexes = useMemo(() => {
    const indexes = new Map<string, number>();
    selectedTableCardKeys.forEach((key, index) => indexes.set(key, index + 1));
    return indexes;
  }, [selectedTableCardKeys]);
  const selectedTableCards = useMemo<DeckTableSelectionEntry[]>(() => {
    if (!tableLayout) return [];
    const selectedKeys = new Set(selectedTableCardKeys);
    return [...tableLayout.piles]
      .sort((left, right) => left.order - right.order)
      .flatMap((pile) =>
        [...pile.entries]
          .sort((left, right) => left.order - right.order)
          .filter((entry) => selectedKeys.has(deckTableSelectionKey(pile.id, entry.cardId, entry.order)))
          .map((entry) => ({ pileId: pile.id, cardId: entry.cardId, order: entry.order }))
      );
  }, [selectedTableCardKeys, tableLayout]);
  const deckTableStyle = useMemo(
    () =>
      ({
        "--deck-table-card-width": `${tableCardWidth}px`,
        "--deck-table-library-width": `${tableLibraryWidth}px`,
        "--deck-table-overlap-offset": `-${Math.round(tableCardWidth * 1.4 * (tableOverlapPercent / 100))}px`,
        "--deck-table-library-card-width": `${tableLibraryCardWidth}px`,
        "--deck-table-library-columns": tableLibraryColumnCount,
        "--deck-table-library-overlap-offset": `${6 - Math.round(tableLibraryCardWidth * 1.4 * (tableLibraryOverlapPercent / 100))}px`
      }) as CSSProperties,
    [tableCardWidth, tableLibraryCardWidth, tableLibraryColumnCount, tableLibraryOverlapPercent, tableLibraryWidth, tableOverlapPercent]
  );
  const tableWidthControlValue = DECK_TABLE_LIBRARY_WIDTH_MIN + DECK_TABLE_LIBRARY_WIDTH_MAX - tableLibraryWidth;
  const currentTableViewSettings = (): DeckTableViewSettings => ({
    cardWidth: tableCardWidth,
    overlapPercent: tableOverlapPercent,
    libraryWidth: tableLibraryWidth,
    libraryCardWidth: tableLibraryCardWidth,
    libraryOverlapPercent: tableLibraryOverlapPercent
  });
  const rememberTableViewSettings = (nextSettings: DeckTableViewSettings) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  };
  const updateTableCardWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      cardWidth: normalizeSteppedNumber(value, DECK_TABLE_CARD_WIDTH_DEFAULT, DECK_TABLE_CARD_WIDTH_MIN, DECK_TABLE_CARD_WIDTH_MAX, DECK_TABLE_CARD_WIDTH_STEP)
    };
    setTableCardWidth(next.cardWidth);
    rememberTableViewSettings(next);
  };
  const updateTableOverlapSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      overlapPercent: normalizeSteppedNumber(value, DECK_TABLE_OVERLAP_DEFAULT, DECK_TABLE_OVERLAP_MIN, DECK_TABLE_OVERLAP_MAX, DECK_TABLE_OVERLAP_STEP)
    };
    setTableOverlapPercent(next.overlapPercent);
    rememberTableViewSettings(next);
  };
  const updateTableLibraryWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryWidth: normalizeSteppedNumber(value, DECK_TABLE_LIBRARY_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_WIDTH_MIN, DECK_TABLE_LIBRARY_WIDTH_MAX, DECK_TABLE_LIBRARY_WIDTH_STEP)
    };
    setTableLibraryWidth(next.libraryWidth);
    rememberTableViewSettings(next);
  };
  const updateTableWidthSetting = (value: number) => {
    updateTableLibraryWidthSetting(DECK_TABLE_LIBRARY_WIDTH_MIN + DECK_TABLE_LIBRARY_WIDTH_MAX - value);
  };
  const updateTableLibraryCardWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryCardWidth: normalizeSteppedNumber(value, DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_CARD_WIDTH_MIN, DECK_TABLE_LIBRARY_CARD_WIDTH_MAX, DECK_TABLE_LIBRARY_CARD_WIDTH_STEP)
    };
    setTableLibraryCardWidth(next.libraryCardWidth);
    rememberTableViewSettings(next);
  };
  const updateTableLibraryOverlapSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryOverlapPercent: normalizeSteppedNumber(value, DECK_TABLE_LIBRARY_OVERLAP_DEFAULT, DECK_TABLE_LIBRARY_OVERLAP_MIN, DECK_TABLE_LIBRARY_OVERLAP_MAX, DECK_TABLE_LIBRARY_OVERLAP_STEP)
    };
    setTableLibraryOverlapPercent(next.libraryOverlapPercent);
    rememberTableViewSettings(next);
  };
  const previewCard = (previewCardId ? cardLookup.get(previewCardId) : null) ?? libraryCards[0] ?? deckRows[0]?.card ?? null;
  const previewQuantity = previewCard ? deckQuantities.get(previewCard.catalogCardId) ?? 0 : 0;
  const deckStrategyProfileKey = useMemo(() => (selectedDeck ? deckStrategyProfileFingerprint(selectedDeck) : ""), [selectedDeck]);
  const [deckStrategyProfileResponse, setDeckStrategyProfileResponse] = useState<DeckStrategyProfileViewerResponse | null>(null);
  const [deckStrategyProfileLoading, setDeckStrategyProfileLoading] = useState(false);
  useEffect(() => {
    if (!selectedDeck) {
      setDeckStrategyProfileResponse(null);
      setDeckStrategyProfileLoading(false);
      return;
    }
    let cancelled = false;
    setDeckStrategyProfileLoading(true);
    setDeckStrategyProfileResponse(null);
    void fetch("/api/decks/strategy-profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deck: selectedDeck })
    })
      .then((response) => response.json() as Promise<DeckStrategyProfileViewerResponse>)
      .then((data) => {
        if (!cancelled) setDeckStrategyProfileResponse(data);
      })
      .catch(() => {
        if (!cancelled) {
          setDeckStrategyProfileResponse({
            schemaVersion: "ai007-deck-strategy-viewer-response-v1",
            taskId: "AI007",
            status: "unavailable",
            reason: "Deckprofil konnte nicht berechnet werden",
            deck: {
              deckId: selectedDeck.deckId,
              deckName: selectedDeck.name,
              side: selectedDeck.side,
              cardCount: totalCards
            }
          });
        }
      })
      .finally(() => {
        if (!cancelled) setDeckStrategyProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deckStrategyProfileKey]);
  useEffect(() => {
    if (!selectedDeck || deckSideFilter === "all" || selectedDeck.side === deckSideFilter) return;
    setDeckSideFilter(selectedDeck.side);
  }, [deckSideFilter, selectedDeck?.side]);
  useEffect(() => {
    if (builderSetFilter === "all" || builderSetCounts[builderSetFilter] > 0) return;
    setBuilderSetFilter("all");
  }, [builderSetCounts, builderSetFilter]);
  useEffect(() => {
    if (builderRarityFilter === "all" || builderRarityCounts[builderRarityFilter] > 0) return;
    setBuilderRarityFilter("all");
  }, [builderRarityCounts, builderRarityFilter]);
  useEffect(() => {
    setTableSelectionMode(false);
    setSelectedTableCardKeys([]);
    setTableSelectionAnchor(null);
  }, [deckEditorMode, selectedDeck?.deckId]);
  useEffect(() => {
    const settings = parseDeckTableViewSettings(readLocalStorageWithLegacy(DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY, LEGACY_DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY));
    setTableCardWidth(settings.cardWidth);
    setTableOverlapPercent(settings.overlapPercent);
    setTableLibraryWidth(settings.libraryWidth);
    setTableLibraryCardWidth(settings.libraryCardWidth);
    setTableLibraryOverlapPercent(settings.libraryOverlapPercent);
    setTableViewSettingsLoaded(true);
  }, []);
  useEffect(() => {
    if (!tableViewSettingsLoaded) return;
    window.localStorage.setItem(
      DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        cardWidth: tableCardWidth,
        overlapPercent: tableOverlapPercent,
        libraryWidth: tableLibraryWidth,
        libraryCardWidth: tableLibraryCardWidth,
        libraryOverlapPercent: tableLibraryOverlapPercent
      })
    );
  }, [tableViewSettingsLoaded, tableCardWidth, tableOverlapPercent, tableLibraryWidth, tableLibraryCardWidth, tableLibraryOverlapPercent]);
  const handleDeckSideFilter = (nextFilter: DeckSideFilter) => {
    setDeckSideFilter(nextFilter);
    const candidates = nextFilter === "all" ? localDecks : localDecks.filter((deck) => deck.side === nextFilter);
    if (selectedDeck && candidates.some((deck) => deck.deckId === selectedDeck.deckId)) return;
    onSelectDeck(candidates[0]?.deckId ?? "");
  };
  const createBlankDeck = (side: Side) => {
    setDeckSideFilter(side);
    onCreateEmpty(side);
  };
  const setVisibleBuilderTypes = (selected: boolean) => {
    setBuilderTypeFilters((current) => {
      const next = { ...current };
      for (const group of visibleTypeFilterGroups) {
        for (const filter of group.filters) next[filter.key] = selected;
      }
      return next;
    });
  };
  const clearTableSelection = () => {
    setSelectedTableCardKeys([]);
    setTableSelectionAnchor(null);
  };
  const toggleTableSelectionMode = () => {
    if (tableSelectionMode) clearTableSelection();
    setTableSelectionMode((current) => !current);
  };
  const toggleTableCardSelection = (pileId: string, entry: DeckTableLayoutEntry) => {
    const key = deckTableSelectionKey(pileId, entry.cardId, entry.order);
    setSelectedTableCardKeys((current) => (current.includes(key) ? current.filter((candidate) => candidate !== key) : [...current, key]));
    setTableSelectionAnchor({ pileId, order: entry.order });
  };
  const selectTableCardRange = (pileId: string, order: number) => {
    if (!tableLayout) return;
    const pile = tableLayout.piles.find((candidate) => candidate.id === pileId);
    if (!pile) return;
    const anchorOrder = tableSelectionAnchor?.pileId === pileId ? tableSelectionAnchor.order : order;
    const lower = Math.min(anchorOrder, order);
    const upper = Math.max(anchorOrder, order);
    const rangeKeys = pile.entries
      .filter((entry) => entry.order >= lower && entry.order <= upper)
      .map((entry) => deckTableSelectionKey(pile.id, entry.cardId, entry.order));
    setSelectedTableCardKeys((current) => [...new Set([...current, ...rangeKeys])]);
    setTableSelectionAnchor({ pileId, order });
  };
  const toggleTablePileSelection = (pileId: string) => {
    if (!tableLayout) return;
    const pile = tableLayout.piles.find((candidate) => candidate.id === pileId);
    if (!pile) return;
    const pileKeys = pile.entries.map((entry) => deckTableSelectionKey(pile.id, entry.cardId, entry.order));
    const selectedKeys = new Set(selectedTableCardKeys);
    const allSelected = pileKeys.length > 0 && pileKeys.every((key) => selectedKeys.has(key));
    setTableSelectionMode(true);
    setSelectedTableCardKeys((current) => (allSelected ? current.filter((key) => !pileKeys.includes(key)) : [...new Set([...current, ...pileKeys])]));
    setTableSelectionAnchor(pile.entries[0] ? { pileId, order: pile.entries[0].order } : null);
  };
  const handleTableCardClick = (event: ReactMouseEvent<HTMLElement>, pileId: string, entry: DeckTableLayoutEntry) => {
    event.stopPropagation();
    const shouldSelect = tableSelectionMode || event.ctrlKey || event.metaKey || event.shiftKey;
    if (!shouldSelect) {
      setPreviewCardId(entry.cardId);
      return;
    }
    event.preventDefault();
    setTableCardMenuKey(null);
    setTableSelectionMode(true);
    if (event.shiftKey) selectTableCardRange(pileId, entry.order);
    else toggleTableCardSelection(pileId, entry);
  };
  const updateTableLayout = (nextLayout: DeckTableLayout) => {
    if (!selectedDeck) return;
    onUpdateDeck({
      ...selectedDeck,
      tableLayout: nextLayout,
      cards: deckCardsFromTableLayout(nextLayout)
    });
  };
  const addTableCardToPile = (cardId: string, pileId: string, targetOrder?: number) => {
    if (!tableLayout) return;
    if (deckTableCardTotal(tableLayout, cardId) >= DECK_TABLE_MAX_COPIES_PER_CARD) return;
    clearTableSelection();
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id !== pileId) return pile;
        return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntry(pile.entries, { cardId, quantity: 1, order: pile.entries.length }, targetOrder) }, cardLookup, cardDetailsById);
      })
    };
    updateTableLayout(nextLayout);
  };
  const moveTableCardsToPile = (cards: DeckTableSelectionEntry[], targetPileId: string, targetOrder?: number) => {
    if (!tableLayout) return;
    const existingEntries = new Map<string, DeckTableLayoutEntry>();
    for (const pile of tableLayout.piles) {
      for (const entry of pile.entries) existingEntries.set(deckTableSelectionKey(pile.id, entry.cardId, entry.order), entry);
    }
    const seenKeys = new Set<string>();
    const movingEntries = cards
      .map((card) => {
        const key = deckTableSelectionKey(card.pileId, card.cardId, card.order);
        if (seenKeys.has(key)) return null;
        seenKeys.add(key);
        const entry = existingEntries.get(key);
        return entry ? { ...entry, order: card.order } : null;
      })
      .filter((entry): entry is DeckTableLayoutEntry => entry !== null);
    if (movingEntries.length === 0) return;
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        const entriesWithoutMoved = pile.entries.filter((entry) => !seenKeys.has(deckTableSelectionKey(pile.id, entry.cardId, entry.order)));
        if (pile.id !== targetPileId) return applyDeckTablePileSort({ ...pile, entries: reorderDeckTableEntries(entriesWithoutMoved) }, cardLookup, cardDetailsById);
        return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntries(entriesWithoutMoved, movingEntries, targetOrder) }, cardLookup, cardDetailsById);
      })
    };
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const moveTableCardToPile = (cardId: string, sourcePileId: string, targetPileId: string, quantity = 1, sourceOrder?: number, targetOrder?: number) => {
    if (!tableLayout) return;
    const sourcePile = tableLayout.piles.find((pile) => pile.id === sourcePileId);
    const sourceEntryIndex = sourcePile?.entries.findIndex((entry) => entry.cardId === cardId && (sourceOrder === undefined || entry.order === sourceOrder)) ?? -1;
    const sourceEntry = sourceEntryIndex >= 0 ? sourcePile?.entries[sourceEntryIndex] : undefined;
    if (!sourceEntry) return;
    const moveQuantity = Math.min(sourceEntry.quantity, Math.max(1, Math.floor(quantity)));
    if (sourcePileId === targetPileId && sourceEntry.order === targetOrder) return;
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id === sourcePileId) {
          const entriesWithoutMoved = pile.entries
            .map((entry, index) => (index === sourceEntryIndex ? { ...entry, quantity: entry.quantity - moveQuantity } : entry))
            .filter((entry) => entry.quantity > 0);
          if (sourcePileId === targetPileId) {
            return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntry(entriesWithoutMoved, { ...sourceEntry, quantity: moveQuantity }, targetOrder) }, cardLookup, cardDetailsById);
          }
          return applyDeckTablePileSort({
            ...pile,
            entries: reorderDeckTableEntries(entriesWithoutMoved)
          }, cardLookup, cardDetailsById);
        }
        if (pile.id === targetPileId) {
          return applyDeckTablePileSort({ ...pile, entries: insertDeckTableEntry(pile.entries, { ...sourceEntry, quantity: moveQuantity }, targetOrder) }, cardLookup, cardDetailsById);
        }
        return pile;
      })
    };
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const duplicateTableCard = (pileId: string, cardId: string, sourceOrder: number, copiesToAdd: number) => {
    if (!tableLayout) return;
    const currentTotal = deckTableCardTotal(tableLayout, cardId);
    const nextCopies = Math.max(0, Math.min(DECK_TABLE_MAX_COPIES_PER_CARD - currentTotal, Math.floor(copiesToAdd)));
    if (nextCopies <= 0) {
      setTableCardMenuKey(null);
      return;
    }
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id !== pileId) return pile;
        let entries = pile.entries;
        const sourceEntry = pile.entries.find((entry) => entry.cardId === cardId && entry.order === sourceOrder);
        if (!sourceEntry) return pile;
        for (let copy = 0; copy < nextCopies; copy += 1) {
          entries = insertDeckTableEntry(entries, { ...sourceEntry, quantity: 1 }, sourceOrder + copy + 1);
        }
        return applyDeckTablePileSort({ ...pile, entries }, cardLookup, cardDetailsById);
      })
    };
    setTableCardMenuKey(null);
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const removeTableCardFromPile = (pileId: string, cardId: string, sourceOrder: number) => {
    if (!tableLayout) return;
    setTableCardMenuKey(null);
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => (pile.id === pileId ? applyDeckTablePileSort({ ...pile, entries: reorderDeckTableEntries(pile.entries.filter((entry) => !(entry.cardId === cardId && entry.order === sourceOrder))) }, cardLookup, cardDetailsById) : pile))
    });
  };
  const renameTablePile = (pileId: string, name: string) => {
    if (!tableLayout) return;
    updateTableLayout({ ...tableLayout, piles: tableLayout.piles.map((pile) => (pile.id === pileId ? { ...pile, name: name.slice(0, 40) } : pile)) });
  };
  const setTablePileNamesVisible = (visible: boolean) => {
    if (!tableLayout) return;
    updateTableLayout({ ...tableLayout, showPileNames: visible });
  };
  const setTablePileCount = (pileCount: number) => {
    if (!tableLayout || !selectedDeck) return;
    const nextCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, Math.floor(pileCount)));
    if (nextCount === tableLayout.piles.length) return;
    clearTableSelection();
    const orderedPiles = [...tableLayout.piles].sort((left, right) => left.order - right.order);
    let nextPiles: DeckTablePile[];
    if (nextCount > orderedPiles.length) {
      nextPiles = [
        ...orderedPiles,
        ...Array.from({ length: nextCount - orderedPiles.length }, (_, offset) => {
          const index = orderedPiles.length + offset;
          return {
            id: `pile-${index + 1}`,
            name: defaultDeckTablePileName(selectedDeck.side, index),
            order: index,
            sortMode: "free" as DeckTablePileSortMode,
            entries: []
          };
        })
      ];
    } else {
      nextPiles = orderedPiles.slice(0, nextCount);
      const removedEntries = orderedPiles.slice(nextCount).flatMap((pile) => pile.entries);
      if (removedEntries.length > 0) {
        const targetPile = nextPiles[nextPiles.length - 1]!;
        nextPiles[nextPiles.length - 1] = {
          ...targetPile,
          entries: reorderDeckTableEntries([...targetPile.entries, ...removedEntries])
        };
      }
    }
    updateTableLayout({
      ...tableLayout,
      piles: nextPiles.map((pile, order) => applyDeckTablePileSort({ ...pile, order, entries: reorderDeckTableEntries(pile.entries) }, cardLookup, cardDetailsById))
    });
  };
  const setTablePileSortMode = (pileId: string, sortMode: DeckTablePileSortMode) => {
    if (!tableLayout) return;
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => (pile.id === pileId ? applyDeckTablePileSort({ ...pile, sortMode }, cardLookup, cardDetailsById) : pile))
    });
  };
  const moveTablePile = (sourcePileId: string, targetPileId: string) => {
    if (!tableLayout || sourcePileId === targetPileId) return;
    const orderedPiles = [...tableLayout.piles].sort((left, right) => left.order - right.order);
    const sourceIndex = orderedPiles.findIndex((pile) => pile.id === sourcePileId);
    const targetIndex = orderedPiles.findIndex((pile) => pile.id === targetPileId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [movedPile] = orderedPiles.splice(sourceIndex, 1);
    if (!movedPile) return;
    orderedPiles.splice(targetIndex, 0, movedPile);
    updateTableLayout({
      ...tableLayout,
      piles: orderedPiles.map((pile, order) => ({ ...pile, order }))
    });
  };
  const insertTablePileAt = (targetPileId: string) => {
    if (!tableLayout || !selectedDeck || tableLayout.piles.length >= MAX_DECK_TABLE_PILE_COUNT) return;
    const orderedPiles = [...tableLayout.piles].sort((left, right) => left.order - right.order);
    const targetIndex = orderedPiles.findIndex((pile) => pile.id === targetPileId);
    if (targetIndex < 0) return;
    const existingPileIds = new Set(orderedPiles.map((pile) => pile.id));
    let nextPileNumber = orderedPiles.length + 1;
    while (existingPileIds.has(`pile-${nextPileNumber}`)) nextPileNumber += 1;
    orderedPiles.splice(targetIndex, 0, {
      id: `pile-${nextPileNumber}`,
      name: "Freier Stapel",
      order: targetIndex,
      sortMode: "free",
      entries: []
    });
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: orderedPiles.map((pile, order) => ({ ...pile, order, entries: reorderDeckTableEntries(pile.entries) }))
    });
  };
  const arrangeTableDeck = (mode: DeckTableArrangeMode) => {
    if (!tableLayout || !selectedDeck) return;
    clearTableSelection();
    if (mode === "type") {
      updateTableLayout(distributeDeckTableByType(tableLayout, selectedDeck.side, cardLookup, cardDetailsById));
      return;
    }
    if (mode === "install-piles") {
      if (!deckTableCostDetailsReady) return;
      updateTableLayout(distributeDeckTableByInstallCost(tableLayout, selectedDeck.side, cardLookup, cardDetailsById));
      return;
    }
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => applyDeckTablePileSort({ ...pile, sortMode: mode }, cardLookup, cardDetailsById))
    });
  };
  const handleTableDrop = (event: ReactDragEvent<HTMLElement>, pileId: string, targetOrder?: number) => {
    event.preventDefault();
    const pilePayloadText = event.dataTransfer.getData("application/x-netgrid-pile");
    if (pilePayloadText) {
      try {
        const payload = JSON.parse(pilePayloadText) as { pileId?: string };
        if (payload.pileId) moveTablePile(payload.pileId, pileId);
      } catch {
        return;
      }
      return;
    }
    const payloadText = event.dataTransfer.getData("application/x-netgrid-card");
    if (!payloadText) return;
    try {
      const payload = JSON.parse(payloadText) as { cards?: DeckTableSelectionEntry[]; cardId?: string; sourcePileId?: string; quantity?: number; sourceOrder?: number };
      if (payload.cards?.length) moveTableCardsToPile(payload.cards, pileId, targetOrder);
      else if (payload.cardId && payload.sourcePileId) moveTableCardToPile(payload.cardId, payload.sourcePileId, pileId, payload.quantity, payload.sourceOrder, targetOrder);
      else if (payload.cardId) addTableCardToPile(payload.cardId, pileId, targetOrder);
    } catch {
      return;
    }
  };
  const deckManagementPanel = (
    <section className={`deckPickerPanel ${deckPickerOpen ? "" : "collapsed"}`}>
      <div className="deckPickerHeader">
        <div>
          <h3>Meine Decks</h3>
          <p className="meta">
            {localDecks.length} gespeichert · Runner {runnerDeckCount} · Korp {corpDeckCount}
          </p>
        </div>
        <button
          className="button iconOnly"
          type="button"
          aria-expanded={deckPickerOpen}
          aria-label={deckPickerOpen ? "Deckbereich einklappen" : "Deckbereich ausklappen"}
          title={deckPickerOpen ? "Deckbereich einklappen" : "Deckbereich ausklappen"}
          onClick={() => setDeckPickerOpen((current) => !current)}
        >
          {deckPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {deckPickerOpen ? (
        <>
          <p className="meta deckStorageMeta" title={storagePath || "Deckspeicher"}>
            Deckspeicher {storagePath ? "aktiv" : "wird geladen"}
          </p>
          <div className="deckCreateActions">
            <button className="button deckRunner" onClick={() => createBlankDeck("runner")}>
              <Plus size={15} />
              Neues Runner-Deck
            </button>
            <button className="button deckCorp" onClick={() => createBlankDeck("corp")}>
              <Plus size={15} />
              Neues Korp-Deck
            </button>
            <button className={`button ${importOpen ? "primary" : ""}`} onClick={() => setImportOpen((current) => !current)} type="button" aria-expanded={importOpen}>
              <Upload size={15} />
              Import
            </button>
          </div>
          {importOpen ? (
            <div className="deckImportBox deckImportInline">
              <h3>Deck importieren</h3>
              <textarea className="deckTextArea" value={importText} onChange={(event) => onImportText(event.target.value)} placeholder='{"schemaVersion":"editable-deck-v0.6","deck":...}' />
              <button className="button wide" onClick={onImport} disabled={!importText.trim()}>
                <Upload size={15} />
                Importieren
              </button>
            </div>
          ) : null}
          <div className="deckDisplayRow">
            <div>
              <span className="settingsTitle">Anzeige</span>
              <span className="meta">{filteredLocalDecks.length} Decks in dieser Auswahl</span>
            </div>
            <div className="segmented deckSideFilter" role="group" aria-label="Deckseite anzeigen">
              <button className={deckSideFilter === "all" ? "active" : ""} onClick={() => handleDeckSideFilter("all")} type="button" aria-pressed={deckSideFilter === "all"}>
                Alle
              </button>
              <button className={deckSideFilter === "runner" ? "active runner" : "runner"} onClick={() => handleDeckSideFilter("runner")} type="button" aria-pressed={deckSideFilter === "runner"}>
                Runner
              </button>
              <button className={deckSideFilter === "corp" ? "active corp" : "corp"} onClick={() => handleDeckSideFilter("corp")} type="button" aria-pressed={deckSideFilter === "corp"}>
                Korp
              </button>
            </div>
          </div>
          <div className="deckSelectGrid">
            <label>
              Deck anzeigen
              <select value={selectedDeckSelectValue} onChange={(event) => onSelectDeck(event.target.value)} disabled={filteredLocalDecks.length === 0}>
                <option value="">Kein lokales Deck</option>
                {filteredLocalDecks.map((deck) => (
                  <option value={deck.deckId} key={deck.deckId}>
                    {sideLabel(deck.side)} · {deck.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      ) : null}
    </section>
  );
  return (
    <section className="deckPanel panel">
      <div className="deckWorkspace">
        <div className="deckEditor">
          {selectedDeck ? null : deckManagementPanel}
          {selectedDeck ? (
            <>
              <div className={`deckBuilderGrid ${deckEditorMode === "table" ? "deckBuilderGridTableMode" : ""}`} style={deckEditorMode === "table" ? deckTableStyle : undefined}>
                {deckEditorMode === "table" ? null : (
                  <aside className="deckPreviewColumn">
                    {deckManagementPanel}
                    {previewCard ? (
                      <DeckBuilderPreview
                        card={previewCard}
                        detail={cardDetailsById[previewCard.catalogCardId]}
                        quantity={previewQuantity}
                        onAdd={() => onUpdateQuantity(previewCard.catalogCardId, previewQuantity + 1)}
                        onRemove={() => onUpdateQuantity(previewCard.catalogCardId, previewQuantity - 1)}
                      />
                    ) : (
                      <p className="meta deckEmpty">Wähle eine Karte für die Vorschau.</p>
                    )}
                  </aside>
                )}
                <section className={`deckLibraryPanel ${deckEditorMode === "table" ? "deckTableLibraryPanel" : ""}`}>
                  <div className="deckBuilderPanelHeader">
                    <div>
                      <h3>Kartenbibliothek</h3>
                      <p className="meta">
                        {libraryCards.length} von {rarityFilteredPlayableCards.length} sichtbaren gültigen {sideLabel(selectedDeck.side)}-Karten
                      </p>
                    </div>
                    <div className="deckLibraryHeaderActions">
                      {deckEditorMode === "table" ? (
                        <button className={`deckLibraryFilterButton ${tableLibraryControlsOpen ? "active" : ""}`} type="button" onClick={() => setTableLibraryControlsOpen((current) => !current)} aria-expanded={tableLibraryControlsOpen}>
                          <SlidersHorizontal size={14} />
                          Ansicht
                        </button>
                      ) : null}
                      <button className={`deckLibraryFilterButton ${builderFiltersOpen ? "active" : ""}`} type="button" onClick={() => setBuilderFiltersOpen((current) => !current)} aria-expanded={builderFiltersOpen}>
                        <ListFilter size={14} />
                        Filter
                      </button>
                    </div>
                  </div>
                  {builderFiltersOpen ? (
                    <div className="deckBuilderTypes">
                      <div className="deckSourceFilter" role="group" aria-label="Kartenset anzeigen">
                        {DECK_SOURCE_FILTERS.map((filter) => (
                          <button className={builderSetFilter === filter.key ? "active" : ""} disabled={builderSetCounts[filter.key] === 0} key={filter.key} onClick={() => setBuilderSetFilter(filter.key)} type="button" aria-pressed={builderSetFilter === filter.key}>
                            <span>{filter.label}</span>
                            <small>{builderSetCounts[filter.key]}</small>
                          </button>
                        ))}
                      </div>
                      <div className="deckSourceFilter deckRarityFilter" role="group" aria-label="Rarität anzeigen">
                        {CATALOG_RARITY_FILTERS.map((filter) => (
                          <button className={builderRarityFilter === filter.key ? "active" : ""} disabled={builderRarityCounts[filter.key] === 0} key={filter.key} onClick={() => setBuilderRarityFilter(filter.key)} type="button" aria-pressed={builderRarityFilter === filter.key}>
                            <span>{filter.label}</span>
                            <small>{builderRarityCounts[filter.key]}</small>
                          </button>
                        ))}
                      </div>
                      <label className={`deckBuilderToggle ${builderOnlyInDeck ? "checked" : ""}`}>
                        <input checked={builderOnlyInDeck} onChange={(event) => setBuilderOnlyInDeck(event.target.checked)} type="checkbox" />
                        Nur im Deck
                      </label>
                      <div className="deckBuilderTypeActions">
                        <button type="button" onClick={() => setVisibleBuilderTypes(true)}>
                          Alle Typen
                        </button>
                        <button type="button" onClick={() => setVisibleBuilderTypes(false)}>
                          Keine Typen
                        </button>
                      </div>
                      {visibleTypeFilterGroups.map((group) => (
                        <div className={`typeFilterGroup ${group.side}`} key={group.title}>
                          <div className="typeFilterGrid">
                            {group.filters.map((filter) => (
                              <label className={`typeToggle ${group.side} ${builderTypeFilters[filter.key] ? "checked" : ""}`} key={filter.key}>
                                <input checked={builderTypeFilters[filter.key]} onChange={(event) => setBuilderTypeFilters((current) => ({ ...current, [filter.key]: event.target.checked }))} type="checkbox" />
                                <span>{filter.label}</span>
                                <small>{builderTypeCounts[filter.key] ?? 0}</small>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <label className="deckBuilderSearch">
                    Suche
                    <span className="deckSearchInputWrap">
                      <input value={builderSearch} onChange={(event) => setBuilderSearch(event.target.value)} placeholder="Titel, Regeltext, Typ, Subtyp" />
                      {builderSearch ? (
                        <button aria-label="Suche zurücksetzen" className="deckSearchClearButton" onClick={() => setBuilderSearch("")} type="button">
                          <X size={14} />
                        </button>
                      ) : null}
                    </span>
                  </label>
                  {deckEditorMode === "table" && tableLibraryControlsOpen ? (
                    <div className="deckTableLibraryControls" aria-label="Bibliotheksdarstellung">
                      <label>
                        <span>Kartengröße</span>
                        <input min={DECK_TABLE_LIBRARY_CARD_WIDTH_MIN} max={DECK_TABLE_LIBRARY_CARD_WIDTH_MAX} step={DECK_TABLE_LIBRARY_CARD_WIDTH_STEP} type="range" value={tableLibraryCardWidth} onChange={(event) => updateTableLibraryCardWidthSetting(Number(event.target.value))} />
                      </label>
                      <label>
                        <span>Überlappung</span>
                        <input min={DECK_TABLE_LIBRARY_OVERLAP_MIN} max={DECK_TABLE_LIBRARY_OVERLAP_MAX} step={DECK_TABLE_LIBRARY_OVERLAP_STEP} type="range" value={tableLibraryOverlapPercent} onChange={(event) => updateTableLibraryOverlapSetting(Number(event.target.value))} />
                      </label>
                    </div>
                  ) : null}
                  <div className="deckLibraryList">
                    {libraryCards.map((card, index) => (
                      deckEditorMode === "table" ? (
                        <DeckTableLibraryCard
                          card={card}
                          detail={cardDetailsById[card.catalogCardId]}
                          key={card.catalogCardId}
                          overlapped={index >= tableLibraryColumnCount}
                          quantity={deckQuantities.get(card.catalogCardId) ?? 0}
                          selected={previewCard?.catalogCardId === card.catalogCardId}
                          stackIndex={index + 1}
                          onAddToFirstPile={() => tableLayout && addTableCardToPile(card.catalogCardId, tableLayout.piles[0]?.id ?? "pile-1")}
                          onSelect={() => setPreviewCardId(card.catalogCardId)}
                        />
                      ) : (
                        <DeckLibraryCard
                          card={card}
                          detail={cardDetailsById[card.catalogCardId]}
                          key={card.catalogCardId}
                          quantity={deckQuantities.get(card.catalogCardId) ?? 0}
                          selected={previewCard?.catalogCardId === card.catalogCardId}
                          onAdd={() => onUpdateQuantity(card.catalogCardId, (deckQuantities.get(card.catalogCardId) ?? 0) + 1)}
                          onRemove={() => onUpdateQuantity(card.catalogCardId, (deckQuantities.get(card.catalogCardId) ?? 0) - 1)}
                          onSelect={() => setPreviewCardId(card.catalogCardId)}
                        />
                      )
                    ))}
                    {libraryCards.length === 0 ? <p className="meta deckEmpty">Keine passende Karte gefunden.</p> : null}
                  </div>
                </section>
                <div className="deckListColumn">
                  {deckEditorMode === "table" ? null : (
                    <section className={`deckDetailsPanel ${deckDetailsOpen ? "" : "collapsed"}`}>
                      <div className="deckDetailsHeader">
                        <div>
                          <h3>Deckdetails</h3>
                        </div>
                        <button
                          className="button iconOnly"
                          type="button"
                          aria-expanded={deckDetailsOpen}
                          aria-label={deckDetailsOpen ? "Deckdetails einklappen" : "Deckdetails ausklappen"}
                          title={deckDetailsOpen ? "Deckdetails einklappen" : "Deckdetails ausklappen"}
                          onClick={() => setDeckDetailsOpen((current) => !current)}
                        >
                          {deckDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {deckDetailsOpen ? (
                        <>
                          <div className="deckSelectGrid">
                            <label>
                              Deckname ändern
                              <input value={selectedDeck.name} onChange={(event) => onUpdateDeck({ ...selectedDeck, name: event.target.value })} />
                            </label>
                          </div>
                          <div className="deckFormGrid">
                            <label>
                              Notiz
                              <input value={selectedDeck.notes ?? ""} onChange={(event) => onUpdateDeck({ ...selectedDeck, notes: event.target.value })} />
                            </label>
                          </div>
                        </>
                      ) : null}
                    </section>
                  )}
                  <DeckStrategyProfilePanel response={deckStrategyProfileResponse} loading={deckStrategyProfileLoading} />
                  {deckEditorMode === "table" && tableLayout ? (
                    <DeckTableBoard
                      layout={tableLayout}
                      deckName={selectedDeck.name}
                      cardLookup={cardLookup}
                      cardDetailsById={cardDetailsById}
                      activeMenuKey={tableCardMenuKey}
                      cardWidth={tableCardWidth}
                      controlsOpen={tableControlsOpen}
                      costDetailsReady={deckTableCostDetailsReady}
                      overlapPercent={tableOverlapPercent}
                      tableWidth={tableWidthControlValue}
                      dirty={selectedDeckDirty}
                      selectedCardIndexes={selectedTableCardIndexes}
                      selectedCardKeys={selectedTableCardKeySet}
                      selectedCards={selectedTableCards}
                      selectionMode={tableSelectionMode}
                      agendaStatus={agendaStatus}
                      onBack={() => setDeckEditorMode("list")}
                      onCardClick={handleTableCardClick}
                      onClearSelection={clearTableSelection}
                      onDuplicateCard={duplicateTableCard}
                      onMenu={setTableCardMenuKey}
                      onDropCard={handleTableDrop}
                      onRenamePile={renameTablePile}
                      onRemoveCard={removeTableCardFromPile}
                      onArrangeDeck={arrangeTableDeck}
                      onInsertPileAt={insertTablePileAt}
                      onSave={onSave}
                      onSelectPile={toggleTablePileSelection}
                      onSetTableWidth={updateTableWidthSetting}
                      onSetCardWidth={updateTableCardWidthSetting}
                      onToggleControls={() => setTableControlsOpen((current) => !current)}
                      onSetOverlapPercent={updateTableOverlapSetting}
                      onSetPileCount={setTablePileCount}
                      onShowPileNames={setTablePileNamesVisible}
                      onSetPileSortMode={setTablePileSortMode}
                      onToggleSelectionMode={toggleTableSelectionMode}
                    />
                  ) : (
                    <section className="deckListPanel">
                      <div className="deckBuilderPanelHeader">
                        <div>
                          <h3>Deckliste</h3>
                          <p className="meta">{totalCards} Karten im aktuellen Entwurf</p>
                          <DeckAgendaStatusBadge status={agendaStatus} />
                        </div>
                        <button className="button deckTableEnterButton" onClick={() => setDeckEditorMode("table")} type="button">
                          <Move size={15} />
                          Auf Tisch bearbeiten
                        </button>
                      </div>
                      <div className="deckCardList">
                        {deckRows.map((row, index) => {
                          const group = deckBuilderCardGroup(row.card);
                          const previousGroup = index > 0 ? deckBuilderCardGroup(deckRows[index - 1]?.card ?? null) : "";
                          return (
                            <Fragment key={row.entry.cardId}>
                              {group !== previousGroup ? <div className="deckCardGroup">{group}</div> : null}
                              <DeckListCard
                                card={row.card}
                                cardId={row.entry.cardId}
                                detail={row.card ? cardDetailsById[row.card.catalogCardId] : undefined}
                                quantity={row.entry.quantity}
                                onIncrement={() => onUpdateQuantity(row.entry.cardId, row.entry.quantity + 1)}
                                onDecrement={() => onUpdateQuantity(row.entry.cardId, row.entry.quantity - 1)}
                                onRemove={() => onUpdateQuantity(row.entry.cardId, 0)}
                                onSelect={() => setPreviewCardId(row.entry.cardId)}
                              />
                            </Fragment>
                          );
                        })}
                        {deckRows.length === 0 ? <p className="meta deckEmpty">Dieses Deck ist noch leer.</p> : null}
                      </div>
                    </section>
                  )}
                  {deckEditorMode === "table" ? null : (
                  <section className="deckControlsPanel">
                    <div className="deckActions">
                      <button className="button primary" onClick={onSave} disabled={!selectedDeckDirty}>
                        <Save size={15} />
                        Speichern
                      </button>
                      <button className="button primary" onClick={onValidate}>
                        <Check size={15} />
                        Prüfen
                      </button>
                      <button className="button" onClick={onUseForMatch} disabled={!validatedSnapshot}>
                        <Play size={15} />
                        {useForMatchLabel}
                      </button>
                      <button className="button" onClick={onExport}>
                        <Download size={15} />
                        Export
                      </button>
                      <button className="button" onClick={onDuplicate}>
                        <CopyPlus size={15} />
                        Duplizieren
                      </button>
                      <button className="button" onClick={onDelete}>
                        <Trash2 size={15} />
                        Löschen
                      </button>
                    </div>
                    <p className={`deckSaveStatus ${selectedDeckDirty ? "dirty" : validation?.ok ? "ok" : validation && !validation.ok ? "bad" : "ok"}`}>
                      {selectedDeckDirty ? "Ungespeicherte Änderungen" : validation?.ok ? "Gespeichert · geprüft · matchstartfähig" : validation && !validation.ok ? "Gespeichert · geprüft · nicht matchstartfähig" : "Gespeichert"}
                    </p>
                    <DeckValidationSummary validation={validation} snapshot={validatedSnapshot} />
                    {exportText ? <textarea className="deckTextArea" value={exportText} readOnly /> : null}
                  </section>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="meta deckEmpty">
              {localDecks.length === 0 ? "Erstelle ein neues Deck oder importiere ein lokales Deck." : "In dieser Auswahl ist noch kein Deck vorhanden."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
