"use client";

import {
  BookOpen,
  Cable,
  Check,
  ChevronDown,
  ChevronUp,
  CopyPlus,
  Download,
  ListFilter,
  Move,
  Play,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslations } from "use-intl/react";
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import type { DeckPublicMetadata, Side } from "@netgrid/shared";

import { deckAgendaStatusForEditor } from "./deck-editor-model";
import { type DeckStrategyProfileViewerResponse } from "../../app/deck-strategy-profile-ui";
import {
  CATALOG_RARITY_FILTERS,
  filterCatalogCardsByProductSets,
  filterCatalogCardsByRarity,
  catalogCardMatchesTypeFilters,
  catalogRarityLabel,
  summarizeCatalogRarityFilters,
  summarizeCatalogProductSets,
  summarizeCatalogTypeFilters,
  type CatalogRarityFilterKey,
  type CatalogProductSetSelection,
  type CatalogTypeFilterKey,
  type CatalogTypeFilterState,
} from "../catalog/catalog-model";
import { DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY } from "../../lib/storage-keys";
import { readLocalStorage } from "../../lib/local-storage";
import { formatCardTerm } from "../cards/card-text-lines";
import { CardSetPicker } from "../cards/CardSetPicker";
import { DeckAgendaStatusBadge } from "./DeckAgendaStatusBadge";
import type { StandardDeck } from "../account/account-deck-client";
import {
  DeckBuilderPreview,
  DeckLibraryCard,
  DeckListCard,
  DeckTableLibraryCard,
} from "./DeckBuilderCards";
import { DeckCardThumb } from "./DeckCardThumb";
import { DeckCardTooltipTrigger } from "./DeckCardTooltipTrigger";
import { DeckMetadataLine } from "./DeckSelectionControls";
import { StandardDeckGuideDialog } from "./StandardDeckGuideDialog";
import { standardDeckGuideControlState } from "./standard-deck-guide-ui";
import { editableStandardDeckPreview } from "./standard-deck-table-preview";
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
  type EditableDeck,
} from "./deck-table-model";

type DeckSideFilter = Side | "all";

type CatalogStatusKey =
  | "imported"
  | "validated"
  | "catalog_ready"
  | "implemented"
  | "engine_supported"
  | "playable"
  | "human_playable"
  | "ai_supported"
  | "deck_legal"
  | "format_legal"
  | "blocked";

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

const RUNNER_CATALOG_TYPE_FILTERS: Array<{
  key: CatalogTypeFilterKey;
  label: string;
}> = [
  { key: "event", label: "Prep" },
  { key: "hardware", label: "Hardware" },
  { key: "resource", label: "Ressource" },
  { key: "program", label: "Programm" },
  { key: "icebreaker", label: "Icebrecher" },
];

const CORP_CATALOG_TYPE_FILTERS: Array<{
  key: CatalogTypeFilterKey;
  label: string;
}> = [
  { key: "ice", label: "ICE" },
  { key: "agenda", label: "Agenda" },
  { key: "asset", label: "Asset" },
  { key: "upgrade", label: "Upgrade" },
  { key: "operation", label: "Operation" },
];

const CATALOG_TYPE_FILTER_GROUPS: Array<{
  title: string;
  side: Side;
  filters: Array<{ key: CatalogTypeFilterKey; label: string }>;
}> = [
  { title: "Runner", side: "runner", filters: RUNNER_CATALOG_TYPE_FILTERS },
  { title: "Korp", side: "corp", filters: CORP_CATALOG_TYPE_FILTERS },
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
  operation: true,
};

function deckBuilderCardGroup(card: CatalogCardSummary | null): string {
  if (!card) return "Unbekannt";
  return [
    formatCardTerm(card.type),
    card.subtypes.map(formatCardTerm).join(" / "),
  ]
    .filter(Boolean)
    .join(" - ");
}

function catalogCardAllowedForDeckEditor(
  card: CatalogCardSummary,
  deck: EditableDeck | null,
): boolean {
  if (!deck) return true;
  return card.side === deck.side;
}

function snapshotAllowedForMatchCardPool(
  snapshot: DeckSnapshot,
  matchCardPool: { kind: "latest" | "snapshot"; snapshotId?: string },
): boolean {
  if (matchCardPool.kind !== "snapshot") return true;
  return snapshot.cardPoolSnapshotId === matchCardPool.snapshotId;
}
export function DeckEditorPanel({
  localDecks,
  selectedDeck: personalSelectedDeck,
  selectedDeckDirty: personalSelectedDeckDirty,
  storagePath,
  validation,
  validatedSnapshot,
  playableCards,
  cardDetailsById,
  importText,
  exportText,
  onCreateEmpty,
  onSelectDeck,
  onUpdateDeck: onUpdatePersonalDeck,
  onSave,
  onUpdateQuantity: onUpdatePersonalQuantity,
  onDuplicate,
  onDelete,
  onValidate,
  onUseForMatch,
  useForMatchLabel,
  onExport,
  onImportText,
  onImport,
  standardDecks = [],
  standardDeckCatalogPhase = "ready",
  standardDeckCatalogRefreshing = false,
  standardCopyBusy = false,
  standardDeckPreview = null,
  onCopyStandard,
  onCloseStandardDeckPreview,
  onStandardDeckPreviewCopied,
  onReloadStandardDecks,
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
  standardDecks?: StandardDeck[];
  standardDeckCatalogPhase?: "loading" | "ready" | "error";
  standardDeckCatalogRefreshing?: boolean;
  standardCopyBusy?: boolean;
  standardDeckPreview?: StandardDeck | null;
  onCopyStandard?(
    deck: StandardDeck,
    name: string,
    draft?: EditableDeck,
  ): Promise<boolean>;
  onCloseStandardDeckPreview?(): void;
  onStandardDeckPreviewCopied?(): void;
  onReloadStandardDecks?(): void;
}) {
  const t = useTranslations("Decks.editor");
  const tableT = useTranslations("Decks.table");
  const [builderSearch, setBuilderSearch] = useState("");
  const [builderTypeFilters, setBuilderTypeFilters] =
    useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [builderSetAddons, setBuilderSetAddons] =
    useState<CatalogProductSetSelection>({
      original: true,
      classic: true,
      proteus: true,
    });
  const [builderRarityFilter, setBuilderRarityFilter] =
    useState<CatalogRarityFilterKey>("all");
  const [builderOnlyInDeck, setBuilderOnlyInDeck] = useState(false);
  const [builderFiltersOpen, setBuilderFiltersOpen] = useState(false);
  const [deckDetailsOpen, setDeckDetailsOpen] = useState(true);
  const [deckPickerOpen, setDeckPickerOpen] = useState(true);
  const [deckEditorMode, setDeckEditorMode] = useState<DeckEditorMode>("list");
  const [tableCardMenuKey, setTableCardMenuKey] = useState<string | null>(null);
  const [tableCardWidth, setTableCardWidth] = useState(
    DECK_TABLE_CARD_WIDTH_DEFAULT,
  );
  const [tableOverlapPercent, setTableOverlapPercent] = useState(
    DECK_TABLE_OVERLAP_DEFAULT,
  );
  const [tableLibraryWidth, setTableLibraryWidth] = useState(
    DECK_TABLE_LIBRARY_WIDTH_DEFAULT,
  );
  const [tableLibraryCardWidth, setTableLibraryCardWidth] = useState(
    DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT,
  );
  const [tableLibraryOverlapPercent, setTableLibraryOverlapPercent] = useState(
    DECK_TABLE_LIBRARY_OVERLAP_DEFAULT,
  );
  const [tableViewSettingsLoaded, setTableViewSettingsLoaded] = useState(false);
  const [tableControlsOpen, setTableControlsOpen] = useState(false);
  const [tableLibraryControlsOpen, setTableLibraryControlsOpen] =
    useState(false);
  const [tableSelectionMode, setTableSelectionMode] = useState(false);
  const [selectedTableCardKeys, setSelectedTableCardKeys] = useState<string[]>(
    [],
  );
  const [tableSelectionAnchor, setTableSelectionAnchor] = useState<{
    pileId: string;
    order: number;
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [standardCopyOpen, setStandardCopyOpen] = useState(false);
  const [standardCopyGuideOpen, setStandardCopyGuideOpen] = useState(false);
  const [standardPreviewDraft, setStandardPreviewDraft] =
    useState<EditableDeck | null>(() =>
      standardDeckPreview
        ? editableStandardDeckPreview(standardDeckPreview)
        : null,
    );
  const [standardCopySide, setStandardCopySide] = useState<Side>("runner");
  const [standardCopyDeckId, setStandardCopyDeckId] = useState("");
  const [standardCopyName, setStandardCopyName] = useState("");
  const [deckSideFilter, setDeckSideFilter] = useState<DeckSideFilter>("all");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const standardPreviewActive = Boolean(
    standardDeckPreview &&
    standardPreviewDraft?.deckId ===
      `standard-preview:${standardDeckPreview.standardDeckId}`,
  );
  const selectedDeck = standardPreviewActive
    ? standardPreviewDraft
    : personalSelectedDeck;
  const selectedDeckDirty = standardPreviewActive
    ? false
    : personalSelectedDeckDirty;
  const onUpdateDeck = (deck: EditableDeck) => {
    if (standardPreviewActive) {
      setStandardPreviewDraft(deck);
      return;
    }
    onUpdatePersonalDeck(deck);
  };
  const onUpdateQuantity = (cardId: string, quantity: number) => {
    if (standardPreviewActive) return;
    onUpdatePersonalQuantity(cardId, quantity);
  };
  const totalCards =
    selectedDeck?.cards.reduce((sum, entry) => sum + entry.quantity, 0) ?? 0;
  const deckQuantities = useMemo(
    () =>
      new Map(
        selectedDeck?.cards.map((entry) => [entry.cardId, entry.quantity]) ??
          [],
      ),
    [selectedDeck?.cards],
  );
  const cardLookup = useMemo(
    () => new Map(playableCards.map((card) => [card.catalogCardId, card])),
    [playableCards],
  );
  const agendaStatus = useMemo(
    () => deckAgendaStatusForEditor(selectedDeck, cardDetailsById, cardLookup),
    [cardDetailsById, cardLookup, selectedDeck],
  );
  const tableLayout = useMemo(
    () =>
      selectedDeck
        ? normalizeDeckTableLayout(selectedDeck, cardLookup, cardDetailsById)
        : null,
    [cardDetailsById, cardLookup, selectedDeck],
  );
  const sourceFilteredPlayableCards = useMemo(
    () => filterCatalogCardsByProductSets(playableCards, builderSetAddons),
    [builderSetAddons, playableCards],
  );
  const rarityFilteredPlayableCards = useMemo(
    () =>
      filterCatalogCardsByRarity(
        sourceFilteredPlayableCards,
        builderRarityFilter,
      ),
    [builderRarityFilter, sourceFilteredPlayableCards],
  );
  const builderSetCounts = useMemo(
    () => summarizeCatalogProductSets(playableCards),
    [playableCards],
  );
  const builderRarityCounts = useMemo(
    () => summarizeCatalogRarityFilters(sourceFilteredPlayableCards),
    [sourceFilteredPlayableCards],
  );
  const builderTypeCounts = useMemo(
    () => summarizeCatalogTypeFilters(rarityFilteredPlayableCards),
    [rarityFilteredPlayableCards],
  );
  const runnerDeckCount = localDecks.filter(
    (deck) => deck.side === "runner",
  ).length;
  const corpDeckCount = localDecks.filter(
    (deck) => deck.side === "corp",
  ).length;
  const filteredLocalDecks = useMemo(
    () =>
      deckSideFilter === "all"
        ? localDecks
        : localDecks.filter((deck) => deck.side === deckSideFilter),
    [deckSideFilter, localDecks],
  );
  const selectedDeckSelectValue =
    selectedDeck &&
    filteredLocalDecks.some((deck) => deck.deckId === selectedDeck.deckId)
      ? selectedDeck.deckId
      : "";
  const visibleTypeFilterGroups = selectedDeck
    ? CATALOG_TYPE_FILTER_GROUPS.filter(
        (group) => group.side === selectedDeck.side,
      )
    : CATALOG_TYPE_FILTER_GROUPS;
  const standardCopyCandidates = useMemo(
    () => standardDecks.filter((deck) => deck.side === standardCopySide),
    [standardCopySide, standardDecks],
  );
  const selectedStandardCopy =
    standardCopyCandidates.find(
      (deck) => deck.standardDeckId === standardCopyDeckId,
    ) ?? standardCopyCandidates[0];
  const standardCopyGuideControl = selectedStandardCopy
    ? standardDeckGuideControlState({
        source: "snapshot",
        snapshot: {
          deckSnapshotId: selectedStandardCopy.standardDeckId,
          sourceDeckId: selectedStandardCopy.standardDeckId,
          name: selectedStandardCopy.name,
          guideStatus: selectedStandardCopy.guideStatus,
          ...(selectedStandardCopy.guide
            ? { guide: selectedStandardCopy.guide }
            : {}),
        },
      })
    : null;
  const standardDeckCatalogLoading =
    standardDecks.length === 0 &&
    (standardDeckCatalogPhase === "loading" || standardDeckCatalogRefreshing);
  const standardDeckCatalogUnavailable =
    standardDecks.length === 0 && standardDeckCatalogPhase === "error";
  const standardCopyToggleTitle = standardDeckCatalogLoading
    ? t("standardLoading")
    : standardDeckCatalogUnavailable
      ? t("standardError")
      : standardDecks.length === 0
        ? t("noStandardDecks")
        : t("copyStandardHelp");
  const libraryCards = useMemo(() => {
    const search = builderSearch.trim().toLowerCase();
    return rarityFilteredPlayableCards
      .filter((card) => {
        if (builderOnlyInDeck && !deckQuantities.has(card.catalogCardId))
          return false;
        if (!catalogCardMatchesTypeFilters(card, builderTypeFilters))
          return false;
        if (!search) return true;
        const detail = cardDetailsById[card.catalogCardId];
        return [
          card.title,
          card.type,
          card.faction,
          ...card.subtypes,
          detail?.text ?? "",
        ].some((value) => value.toLowerCase().includes(search));
      })
      .sort(
        (left, right) =>
          deckBuilderCardGroup(left).localeCompare(
            deckBuilderCardGroup(right),
          ) || left.title.localeCompare(right.title),
      );
  }, [
    builderOnlyInDeck,
    builderSearch,
    builderTypeFilters,
    cardDetailsById,
    deckQuantities,
    rarityFilteredPlayableCards,
  ]);
  const deckRows = useMemo(
    () =>
      (selectedDeck?.cards ?? [])
        .map((entry) => ({ entry, card: cardLookup.get(entry.cardId) ?? null }))
        .sort(
          (left, right) =>
            deckBuilderCardGroup(left.card).localeCompare(
              deckBuilderCardGroup(right.card),
            ) ||
            (left.card?.title ?? left.entry.cardId).localeCompare(
              right.card?.title ?? right.entry.cardId,
            ),
        ),
    [cardLookup, selectedDeck?.cards],
  );
  const deckTableNumericDetailsReady = useMemo(
    () =>
      (selectedDeck?.cards ?? []).every((entry) =>
        Boolean(cardDetailsById[entry.cardId]),
      ),
    [cardDetailsById, selectedDeck?.cards],
  );
  const tableLibraryColumnCount = Math.max(
    1,
    Math.floor(
      (tableLibraryWidth - 18) / Math.max(70, tableLibraryCardWidth + 12),
    ),
  );
  const selectedTableCardKeySet = useMemo(
    () => new Set(selectedTableCardKeys),
    [selectedTableCardKeys],
  );
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
          .filter((entry) =>
            selectedKeys.has(
              deckTableSelectionKey(pile.id, entry.cardId, entry.order),
            ),
          )
          .map((entry) => ({
            pileId: pile.id,
            cardId: entry.cardId,
            order: entry.order,
          })),
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
        "--deck-table-library-overlap-offset": `${6 - Math.round(tableLibraryCardWidth * 1.4 * (tableLibraryOverlapPercent / 100))}px`,
      }) as CSSProperties,
    [
      tableCardWidth,
      tableLibraryCardWidth,
      tableLibraryColumnCount,
      tableLibraryOverlapPercent,
      tableLibraryWidth,
      tableOverlapPercent,
    ],
  );
  const tableWidthControlValue =
    DECK_TABLE_LIBRARY_WIDTH_MIN +
    DECK_TABLE_LIBRARY_WIDTH_MAX -
    tableLibraryWidth;
  const currentTableViewSettings = (): DeckTableViewSettings => ({
    cardWidth: tableCardWidth,
    overlapPercent: tableOverlapPercent,
    libraryWidth: tableLibraryWidth,
    libraryCardWidth: tableLibraryCardWidth,
    libraryOverlapPercent: tableLibraryOverlapPercent,
  });
  const rememberTableViewSettings = (nextSettings: DeckTableViewSettings) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY,
      JSON.stringify(nextSettings),
    );
  };
  const updateTableCardWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      cardWidth: normalizeSteppedNumber(
        value,
        DECK_TABLE_CARD_WIDTH_DEFAULT,
        DECK_TABLE_CARD_WIDTH_MIN,
        DECK_TABLE_CARD_WIDTH_MAX,
        DECK_TABLE_CARD_WIDTH_STEP,
      ),
    };
    setTableCardWidth(next.cardWidth);
    rememberTableViewSettings(next);
  };
  const updateTableOverlapSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      overlapPercent: normalizeSteppedNumber(
        value,
        DECK_TABLE_OVERLAP_DEFAULT,
        DECK_TABLE_OVERLAP_MIN,
        DECK_TABLE_OVERLAP_MAX,
        DECK_TABLE_OVERLAP_STEP,
      ),
    };
    setTableOverlapPercent(next.overlapPercent);
    rememberTableViewSettings(next);
  };
  const updateTableLibraryWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryWidth: normalizeSteppedNumber(
        value,
        DECK_TABLE_LIBRARY_WIDTH_DEFAULT,
        DECK_TABLE_LIBRARY_WIDTH_MIN,
        DECK_TABLE_LIBRARY_WIDTH_MAX,
        DECK_TABLE_LIBRARY_WIDTH_STEP,
      ),
    };
    setTableLibraryWidth(next.libraryWidth);
    rememberTableViewSettings(next);
  };
  const updateTableWidthSetting = (value: number) => {
    updateTableLibraryWidthSetting(
      DECK_TABLE_LIBRARY_WIDTH_MIN + DECK_TABLE_LIBRARY_WIDTH_MAX - value,
    );
  };
  const updateTableLibraryCardWidthSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryCardWidth: normalizeSteppedNumber(
        value,
        DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT,
        DECK_TABLE_LIBRARY_CARD_WIDTH_MIN,
        DECK_TABLE_LIBRARY_CARD_WIDTH_MAX,
        DECK_TABLE_LIBRARY_CARD_WIDTH_STEP,
      ),
    };
    setTableLibraryCardWidth(next.libraryCardWidth);
    rememberTableViewSettings(next);
  };
  const updateTableLibraryOverlapSetting = (value: number) => {
    const next = {
      ...currentTableViewSettings(),
      libraryOverlapPercent: normalizeSteppedNumber(
        value,
        DECK_TABLE_LIBRARY_OVERLAP_DEFAULT,
        DECK_TABLE_LIBRARY_OVERLAP_MIN,
        DECK_TABLE_LIBRARY_OVERLAP_MAX,
        DECK_TABLE_LIBRARY_OVERLAP_STEP,
      ),
    };
    setTableLibraryOverlapPercent(next.libraryOverlapPercent);
    rememberTableViewSettings(next);
  };
  const previewCard =
    (previewCardId ? cardLookup.get(previewCardId) : null) ??
    libraryCards[0] ??
    deckRows[0]?.card ??
    null;
  const previewQuantity = previewCard
    ? (deckQuantities.get(previewCard.catalogCardId) ?? 0)
    : 0;
  const deckStrategyProfileKey = useMemo(
    () => (selectedDeck ? deckStrategyProfileFingerprint(selectedDeck) : ""),
    [selectedDeck],
  );
  const [deckStrategyProfileResponse, setDeckStrategyProfileResponse] =
    useState<DeckStrategyProfileViewerResponse | null>(null);
  const [deckStrategyProfileLoading, setDeckStrategyProfileLoading] =
    useState(false);
  useEffect(() => {
    if (!standardDeckPreview) {
      setStandardPreviewDraft(null);
      return;
    }
    setStandardPreviewDraft(editableStandardDeckPreview(standardDeckPreview));
    setDeckEditorMode("table");
    setTableCardMenuKey(null);
    setTableSelectionMode(false);
    setSelectedTableCardKeys([]);
    setTableSelectionAnchor(null);
  }, [standardDeckPreview]);
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
      body: JSON.stringify({ deck: selectedDeck }),
    })
      .then(
        (response) =>
          response.json() as Promise<DeckStrategyProfileViewerResponse>,
      )
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
              cardCount: totalCards,
            },
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
    if (
      !selectedDeck ||
      deckSideFilter === "all" ||
      selectedDeck.side === deckSideFilter
    )
      return;
    setDeckSideFilter(selectedDeck.side);
  }, [deckSideFilter, selectedDeck?.side]);
  useEffect(() => {
    if (
      builderRarityFilter === "all" ||
      builderRarityCounts[builderRarityFilter] > 0
    )
      return;
    setBuilderRarityFilter("all");
  }, [builderRarityCounts, builderRarityFilter]);
  useEffect(() => {
    setTableSelectionMode(false);
    setSelectedTableCardKeys([]);
    setTableSelectionAnchor(null);
  }, [deckEditorMode, selectedDeck?.deckId]);
  useEffect(() => {
    const settings = parseDeckTableViewSettings(
      readLocalStorage(DECK_TABLE_VIEW_SETTINGS_STORAGE_KEY),
    );
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
        libraryOverlapPercent: tableLibraryOverlapPercent,
      }),
    );
  }, [
    tableViewSettingsLoaded,
    tableCardWidth,
    tableOverlapPercent,
    tableLibraryWidth,
    tableLibraryCardWidth,
    tableLibraryOverlapPercent,
  ]);
  const handleDeckSideFilter = (nextFilter: DeckSideFilter) => {
    setDeckSideFilter(nextFilter);
    const candidates =
      nextFilter === "all"
        ? localDecks
        : localDecks.filter((deck) => deck.side === nextFilter);
    if (
      selectedDeck &&
      candidates.some((deck) => deck.deckId === selectedDeck.deckId)
    )
      return;
    onSelectDeck(candidates[0]?.deckId ?? "");
  };
  const createBlankDeck = (side: Side) => {
    setDeckSideFilter(side);
    onCreateEmpty(side);
  };
  const toggleStandardCopy = () => {
    if (standardCopyOpen) {
      setStandardCopyOpen(false);
      setStandardCopyGuideOpen(false);
      return;
    }
    const first =
      standardDecks.find((deck) => deck.side === "runner") ?? standardDecks[0];
    if (!first) return;
    setStandardCopySide(first.side);
    setStandardCopyDeckId(first.standardDeckId);
    setStandardCopyName(`${first.name} Kopie`);
    setStandardCopyOpen(true);
  };
  const selectStandardCopySide = (side: Side) => {
    const first = standardDecks.find((deck) => deck.side === side);
    setStandardCopySide(side);
    setStandardCopyDeckId(first?.standardDeckId ?? "");
    setStandardCopyName(first ? `${first.name} Kopie` : "");
    setStandardCopyGuideOpen(false);
  };
  const selectStandardCopyDeck = (deckId: string) => {
    const deck = standardCopyCandidates.find(
      (candidate) => candidate.standardDeckId === deckId,
    );
    setStandardCopyDeckId(deckId);
    if (deck) setStandardCopyName(`${deck.name} Kopie`);
    setStandardCopyGuideOpen(false);
  };
  const submitStandardCopy = () => {
    if (!selectedStandardCopy || !onCopyStandard || !standardCopyName.trim())
      return;
    void onCopyStandard(selectedStandardCopy, standardCopyName.trim()).then(
      (copied) => {
        if (copied) {
          setStandardCopyOpen(false);
          setStandardCopyGuideOpen(false);
        }
      },
    );
  };
  const copyStandardPreviewAsOwnDeck = () => {
    if (!standardDeckPreview || !standardPreviewDraft || !onCopyStandard)
      return;
    void onCopyStandard(
      standardDeckPreview,
      `${standardDeckPreview.name} Kopie`,
      standardPreviewDraft,
    ).then((copied) => {
      if (copied) onStandardDeckPreviewCopied?.();
    });
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
  const toggleTableCardSelection = (
    pileId: string,
    entry: DeckTableLayoutEntry,
  ) => {
    const key = deckTableSelectionKey(pileId, entry.cardId, entry.order);
    setSelectedTableCardKeys((current) =>
      current.includes(key)
        ? current.filter((candidate) => candidate !== key)
        : [...current, key],
    );
    setTableSelectionAnchor({ pileId, order: entry.order });
  };
  const selectTableCardRange = (pileId: string, order: number) => {
    if (!tableLayout) return;
    const pile = tableLayout.piles.find((candidate) => candidate.id === pileId);
    if (!pile) return;
    const anchorOrder =
      tableSelectionAnchor?.pileId === pileId
        ? tableSelectionAnchor.order
        : order;
    const lower = Math.min(anchorOrder, order);
    const upper = Math.max(anchorOrder, order);
    const rangeKeys = pile.entries
      .filter((entry) => entry.order >= lower && entry.order <= upper)
      .map((entry) =>
        deckTableSelectionKey(pile.id, entry.cardId, entry.order),
      );
    setSelectedTableCardKeys((current) => [
      ...new Set([...current, ...rangeKeys]),
    ]);
    setTableSelectionAnchor({ pileId, order });
  };
  const toggleTablePileSelection = (pileId: string) => {
    if (!tableLayout) return;
    const pile = tableLayout.piles.find((candidate) => candidate.id === pileId);
    if (!pile) return;
    const pileKeys = pile.entries.map((entry) =>
      deckTableSelectionKey(pile.id, entry.cardId, entry.order),
    );
    const selectedKeys = new Set(selectedTableCardKeys);
    const allSelected =
      pileKeys.length > 0 && pileKeys.every((key) => selectedKeys.has(key));
    setTableSelectionMode(true);
    setSelectedTableCardKeys((current) =>
      allSelected
        ? current.filter((key) => !pileKeys.includes(key))
        : [...new Set([...current, ...pileKeys])],
    );
    setTableSelectionAnchor(
      pile.entries[0] ? { pileId, order: pile.entries[0].order } : null,
    );
  };
  const handleTableCardClick = (
    event: ReactMouseEvent<HTMLElement>,
    pileId: string,
    entry: DeckTableLayoutEntry,
  ) => {
    event.stopPropagation();
    const shouldSelect =
      tableSelectionMode || event.ctrlKey || event.metaKey || event.shiftKey;
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
      cards: deckCardsFromTableLayout(nextLayout),
    });
  };
  const addTableCardToPile = (
    cardId: string,
    pileId: string,
    targetOrder?: number,
  ) => {
    if (!tableLayout) return;
    if (
      deckTableCardTotal(tableLayout, cardId) >= DECK_TABLE_MAX_COPIES_PER_CARD
    )
      return;
    clearTableSelection();
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id !== pileId) return pile;
        return applyDeckTablePileSort(
          {
            ...pile,
            entries: insertDeckTableEntry(
              pile.entries,
              { cardId, quantity: 1, order: pile.entries.length },
              targetOrder,
            ),
          },
          cardLookup,
          cardDetailsById,
        );
      }),
    };
    updateTableLayout(nextLayout);
  };
  const moveTableCardsToPile = (
    cards: DeckTableSelectionEntry[],
    targetPileId: string,
    targetOrder?: number,
  ) => {
    if (!tableLayout) return;
    const existingEntries = new Map<string, DeckTableLayoutEntry>();
    for (const pile of tableLayout.piles) {
      for (const entry of pile.entries)
        existingEntries.set(
          deckTableSelectionKey(pile.id, entry.cardId, entry.order),
          entry,
        );
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
        const entriesWithoutMoved = pile.entries.filter(
          (entry) =>
            !seenKeys.has(
              deckTableSelectionKey(pile.id, entry.cardId, entry.order),
            ),
        );
        if (pile.id !== targetPileId)
          return applyDeckTablePileSort(
            { ...pile, entries: reorderDeckTableEntries(entriesWithoutMoved) },
            cardLookup,
            cardDetailsById,
          );
        return applyDeckTablePileSort(
          {
            ...pile,
            entries: insertDeckTableEntries(
              entriesWithoutMoved,
              movingEntries,
              targetOrder,
            ),
          },
          cardLookup,
          cardDetailsById,
        );
      }),
    };
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const moveTableCardToPile = (
    cardId: string,
    sourcePileId: string,
    targetPileId: string,
    quantity = 1,
    sourceOrder?: number,
    targetOrder?: number,
  ) => {
    if (!tableLayout) return;
    const sourcePile = tableLayout.piles.find(
      (pile) => pile.id === sourcePileId,
    );
    const sourceEntryIndex =
      sourcePile?.entries.findIndex(
        (entry) =>
          entry.cardId === cardId &&
          (sourceOrder === undefined || entry.order === sourceOrder),
      ) ?? -1;
    const sourceEntry =
      sourceEntryIndex >= 0 ? sourcePile?.entries[sourceEntryIndex] : undefined;
    if (!sourceEntry) return;
    const moveQuantity = Math.min(
      sourceEntry.quantity,
      Math.max(1, Math.floor(quantity)),
    );
    if (sourcePileId === targetPileId && sourceEntry.order === targetOrder)
      return;
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id === sourcePileId) {
          const entriesWithoutMoved = pile.entries
            .map((entry, index) =>
              index === sourceEntryIndex
                ? { ...entry, quantity: entry.quantity - moveQuantity }
                : entry,
            )
            .filter((entry) => entry.quantity > 0);
          if (sourcePileId === targetPileId) {
            return applyDeckTablePileSort(
              {
                ...pile,
                entries: insertDeckTableEntry(
                  entriesWithoutMoved,
                  { ...sourceEntry, quantity: moveQuantity },
                  targetOrder,
                ),
              },
              cardLookup,
              cardDetailsById,
            );
          }
          return applyDeckTablePileSort(
            {
              ...pile,
              entries: reorderDeckTableEntries(entriesWithoutMoved),
            },
            cardLookup,
            cardDetailsById,
          );
        }
        if (pile.id === targetPileId) {
          return applyDeckTablePileSort(
            {
              ...pile,
              entries: insertDeckTableEntry(
                pile.entries,
                { ...sourceEntry, quantity: moveQuantity },
                targetOrder,
              ),
            },
            cardLookup,
            cardDetailsById,
          );
        }
        return pile;
      }),
    };
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const duplicateTableCard = (
    pileId: string,
    cardId: string,
    sourceOrder: number,
    copiesToAdd: number,
  ) => {
    if (!tableLayout) return;
    const currentTotal = deckTableCardTotal(tableLayout, cardId);
    const nextCopies = Math.max(
      0,
      Math.min(
        DECK_TABLE_MAX_COPIES_PER_CARD - currentTotal,
        Math.floor(copiesToAdd),
      ),
    );
    if (nextCopies <= 0) {
      setTableCardMenuKey(null);
      return;
    }
    const nextLayout: DeckTableLayout = {
      ...tableLayout,
      piles: tableLayout.piles.map((pile) => {
        if (pile.id !== pileId) return pile;
        let entries = pile.entries;
        const sourceEntry = pile.entries.find(
          (entry) => entry.cardId === cardId && entry.order === sourceOrder,
        );
        if (!sourceEntry) return pile;
        for (let copy = 0; copy < nextCopies; copy += 1) {
          entries = insertDeckTableEntry(
            entries,
            { ...sourceEntry, quantity: 1 },
            sourceOrder + copy + 1,
          );
        }
        return applyDeckTablePileSort(
          { ...pile, entries },
          cardLookup,
          cardDetailsById,
        );
      }),
    };
    setTableCardMenuKey(null);
    clearTableSelection();
    updateTableLayout(nextLayout);
  };
  const removeTableCardFromPile = (
    pileId: string,
    cardId: string,
    sourceOrder: number,
  ) => {
    if (!tableLayout) return;
    setTableCardMenuKey(null);
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) =>
        pile.id === pileId
          ? applyDeckTablePileSort(
              {
                ...pile,
                entries: reorderDeckTableEntries(
                  pile.entries.filter(
                    (entry) =>
                      !(entry.cardId === cardId && entry.order === sourceOrder),
                  ),
                ),
              },
              cardLookup,
              cardDetailsById,
            )
          : pile,
      ),
    });
  };
  const renameTablePile = (pileId: string, name: string) => {
    if (!tableLayout) return;
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) =>
        pile.id === pileId ? { ...pile, name: name.slice(0, 40) } : pile,
      ),
    });
  };
  const setTablePileNamesVisible = (visible: boolean) => {
    if (!tableLayout) return;
    updateTableLayout({ ...tableLayout, showPileNames: visible });
  };
  const setTablePileCount = (pileCount: number) => {
    if (!tableLayout || !selectedDeck) return;
    const nextCount = Math.min(
      MAX_DECK_TABLE_PILE_COUNT,
      Math.max(MIN_DECK_TABLE_PILE_COUNT, Math.floor(pileCount)),
    );
    if (nextCount === tableLayout.piles.length) return;
    clearTableSelection();
    const orderedPiles = [...tableLayout.piles].sort(
      (left, right) => left.order - right.order,
    );
    let nextPiles: DeckTablePile[];
    if (nextCount > orderedPiles.length) {
      nextPiles = [
        ...orderedPiles,
        ...Array.from(
          { length: nextCount - orderedPiles.length },
          (_, offset) => {
            const index = orderedPiles.length + offset;
            return {
              id: `pile-${index + 1}`,
              name: defaultDeckTablePileName(selectedDeck.side, index),
              order: index,
              sortMode: "free" as DeckTablePileSortMode,
              entries: [],
            };
          },
        ),
      ];
    } else {
      nextPiles = orderedPiles.slice(0, nextCount);
      const removedEntries = orderedPiles
        .slice(nextCount)
        .flatMap((pile) => pile.entries);
      if (removedEntries.length > 0) {
        const targetPile = nextPiles[nextPiles.length - 1]!;
        nextPiles[nextPiles.length - 1] = {
          ...targetPile,
          entries: reorderDeckTableEntries([
            ...targetPile.entries,
            ...removedEntries,
          ]),
        };
      }
    }
    updateTableLayout({
      ...tableLayout,
      piles: nextPiles.map((pile, order) =>
        applyDeckTablePileSort(
          { ...pile, order, entries: reorderDeckTableEntries(pile.entries) },
          cardLookup,
          cardDetailsById,
        ),
      ),
    });
  };
  const setTablePileSortMode = (
    pileId: string,
    sortMode: DeckTablePileSortMode,
  ) => {
    if (!tableLayout) return;
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) =>
        pile.id === pileId
          ? applyDeckTablePileSort(
              { ...pile, sortMode },
              cardLookup,
              cardDetailsById,
            )
          : pile,
      ),
    });
  };
  const moveTablePile = (sourcePileId: string, targetPileId: string) => {
    if (!tableLayout || sourcePileId === targetPileId) return;
    const orderedPiles = [...tableLayout.piles].sort(
      (left, right) => left.order - right.order,
    );
    const sourceIndex = orderedPiles.findIndex(
      (pile) => pile.id === sourcePileId,
    );
    const targetIndex = orderedPiles.findIndex(
      (pile) => pile.id === targetPileId,
    );
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [movedPile] = orderedPiles.splice(sourceIndex, 1);
    if (!movedPile) return;
    orderedPiles.splice(targetIndex, 0, movedPile);
    updateTableLayout({
      ...tableLayout,
      piles: orderedPiles.map((pile, order) => ({ ...pile, order })),
    });
  };
  const insertTablePileAt = (targetPileId: string) => {
    if (
      !tableLayout ||
      !selectedDeck ||
      tableLayout.piles.length >= MAX_DECK_TABLE_PILE_COUNT
    )
      return;
    const orderedPiles = [...tableLayout.piles].sort(
      (left, right) => left.order - right.order,
    );
    const targetIndex = orderedPiles.findIndex(
      (pile) => pile.id === targetPileId,
    );
    if (targetIndex < 0) return;
    const existingPileIds = new Set(orderedPiles.map((pile) => pile.id));
    let nextPileNumber = orderedPiles.length + 1;
    while (existingPileIds.has(`pile-${nextPileNumber}`)) nextPileNumber += 1;
    orderedPiles.splice(targetIndex, 0, {
      id: `pile-${nextPileNumber}`,
      name: t("freePile"),
      order: targetIndex,
      sortMode: "free",
      entries: [],
    });
    clearTableSelection();
    updateTableLayout({
      ...tableLayout,
      piles: orderedPiles.map((pile, order) => ({
        ...pile,
        order,
        entries: reorderDeckTableEntries(pile.entries),
      })),
    });
  };
  const arrangeTableDeck = (mode: DeckTableArrangeMode) => {
    if (!tableLayout || !selectedDeck) return;
    clearTableSelection();
    if (mode === "type") {
      updateTableLayout(
        distributeDeckTableByType(
          tableLayout,
          selectedDeck.side,
          cardLookup,
          cardDetailsById,
        ),
      );
      return;
    }
    if (mode === "install-piles") {
      if (!deckTableNumericDetailsReady) return;
      updateTableLayout(
        distributeDeckTableByInstallCost(
          tableLayout,
          selectedDeck.side,
          cardLookup,
          cardDetailsById,
        ),
      );
      return;
    }
    updateTableLayout({
      ...tableLayout,
      piles: tableLayout.piles.map((pile) =>
        applyDeckTablePileSort(
          { ...pile, sortMode: mode },
          cardLookup,
          cardDetailsById,
        ),
      ),
    });
  };
  const handleTableDrop = (
    event: ReactDragEvent<HTMLElement>,
    pileId: string,
    targetOrder?: number,
  ) => {
    event.preventDefault();
    const pilePayloadText = event.dataTransfer.getData(
      "application/x-netgrid-pile",
    );
    if (pilePayloadText) {
      try {
        const payload = JSON.parse(pilePayloadText) as { pileId?: string };
        if (payload.pileId) moveTablePile(payload.pileId, pileId);
      } catch {
        return;
      }
      return;
    }
    const payloadText = event.dataTransfer.getData(
      "application/x-netgrid-card",
    );
    if (!payloadText) return;
    try {
      const payload = JSON.parse(payloadText) as {
        cards?: DeckTableSelectionEntry[];
        cardId?: string;
        sourcePileId?: string;
        quantity?: number;
        sourceOrder?: number;
      };
      if (payload.cards?.length)
        moveTableCardsToPile(payload.cards, pileId, targetOrder);
      else if (payload.cardId && payload.sourcePileId)
        moveTableCardToPile(
          payload.cardId,
          payload.sourcePileId,
          pileId,
          payload.quantity,
          payload.sourceOrder,
          targetOrder,
        );
      else if (payload.cardId)
        addTableCardToPile(payload.cardId, pileId, targetOrder);
    } catch {
      return;
    }
  };
  const deckManagementPanel = (
    <section className={`deckPickerPanel ${deckPickerOpen ? "" : "collapsed"}`}>
      <div className="deckPickerHeader">
        <div>
          <h3>{t("myDecks")}</h3>
          <p className="meta">
            {t("deckSummary", {
              count: localDecks.length,
              runner: runnerDeckCount,
              corp: corpDeckCount,
            })}
          </p>
        </div>
        <button
          className="button iconOnly"
          type="button"
          aria-expanded={deckPickerOpen}
          aria-label={
            deckPickerOpen ? t("collapseDeckArea") : t("expandDeckArea")
          }
          title={deckPickerOpen ? t("collapseDeckArea") : t("expandDeckArea")}
          onClick={() => setDeckPickerOpen((current) => !current)}
        >
          {deckPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {deckPickerOpen ? (
        <>
          <p
            className="meta deckStorageMeta"
            title={storagePath || t("deckStorage")}
          >
            {t("deckStorageStatus", {
              status: storagePath ? t("active") : t("loading"),
            })}
          </p>
          <div className="deckCreateActions">
            <button
              className="button deckRunner"
              onClick={() => createBlankDeck("runner")}
            >
              <Plus size={15} />
              {t("newRunnerDeck")}
            </button>
            <button
              className="button deckCorp"
              onClick={() => createBlankDeck("corp")}
            >
              <Plus size={15} />
              {t("newCorpDeck")}
            </button>
            <button
              className={`button ${importOpen ? "primary" : ""}`}
              onClick={() => setImportOpen((current) => !current)}
              type="button"
              aria-expanded={importOpen}
            >
              <Upload size={15} />
              Import
            </button>
            {onCopyStandard ? (
              <button
                className={`button deckStandardCopyToggle ${standardCopyOpen ? "primary" : ""}`}
                onClick={toggleStandardCopy}
                type="button"
                aria-expanded={standardCopyOpen}
                disabled={standardDecks.length === 0}
                title={standardCopyToggleTitle}
              >
                <CopyPlus size={15} />
                {standardDeckCatalogLoading
                  ? t("standardLoading")
                  : t("copyStandard")}
              </button>
            ) : null}
          </div>
          {onCopyStandard && standardDeckCatalogUnavailable ? (
            <div className="deckStandardCopyStatus" role="status">
              <span>{t("standardErrorSentence")}</span>
              {onReloadStandardDecks ? (
                <button
                  className="button"
                  type="button"
                  onClick={onReloadStandardDecks}
                  disabled={standardDeckCatalogRefreshing}
                >
                  {t("retry")}
                </button>
              ) : null}
            </div>
          ) : null}
          {importOpen ? (
            <div className="deckImportBox deckImportInline">
              <h3>{t("importDeck")}</h3>
              <textarea
                className="deckTextArea"
                value={importText}
                onChange={(event) => onImportText(event.target.value)}
                placeholder='{"schemaVersion":"editable-deck-v0.6","deck":...}'
              />
              <button
                className="button wide"
                onClick={onImport}
                disabled={!importText.trim()}
              >
                <Upload size={15} />
                {t("import")}
              </button>
            </div>
          ) : null}
          {standardCopyOpen ? (
            <div className="deckImportBox deckImportInline deckStandardCopyInline">
              <h3>{t("copyStandard")}</h3>
              <p className="meta">{t("copyStandardDescription")}</p>
              <div className="deckFormGrid">
                <label>
                  {t("side")}
                  <select
                    value={standardCopySide}
                    onChange={(event) =>
                      selectStandardCopySide(event.target.value as Side)
                    }
                  >
                    <option value="runner">Runner</option>
                    <option value="corp">{t("corp")}</option>
                  </select>
                </label>
                <label>
                  {t("standardDeck")}
                  <select
                    value={selectedStandardCopy?.standardDeckId ?? ""}
                    onChange={(event) =>
                      selectStandardCopyDeck(event.target.value)
                    }
                  >
                    {standardCopyCandidates.map((deck) => (
                      <option
                        key={deck.standardDeckId}
                        value={deck.standardDeckId}
                      >
                        {deck.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("copyName")}
                  <input
                    value={standardCopyName}
                    onChange={(event) =>
                      setStandardCopyName(event.target.value)
                    }
                  />
                </label>
              </div>
              <div className="deckActions">
                {standardCopyGuideControl ? (
                  <button
                    className={`button deckGuideButton status-${standardCopyGuideControl.status}`}
                    type="button"
                    disabled={standardCopyGuideControl.disabled}
                    title={t(`guide.${standardCopyGuideControl.status}`)}
                    onClick={() => setStandardCopyGuideOpen(true)}
                  >
                    <BookOpen size={15} />
                    {t(`guide.${standardCopyGuideControl.status}`)}
                  </button>
                ) : null}
                <button
                  className="button primary"
                  onClick={submitStandardCopy}
                  disabled={
                    !selectedStandardCopy ||
                    !standardCopyName.trim() ||
                    standardCopyBusy
                  }
                  type="button"
                >
                  <CopyPlus size={15} />
                  {t("copy")}
                </button>
                <button
                  className="button"
                  onClick={() => {
                    setStandardCopyOpen(false);
                    setStandardCopyGuideOpen(false);
                  }}
                  disabled={standardCopyBusy}
                  type="button"
                >
                  {t("cancel")}
                </button>
              </div>
              {standardCopyGuideOpen &&
              standardCopyGuideControl?.guide &&
              selectedStandardCopy ? (
                <StandardDeckGuideDialog
                  deckName={selectedStandardCopy.name}
                  side={selectedStandardCopy.side}
                  guide={standardCopyGuideControl.guide}
                  onDismiss={() => setStandardCopyGuideOpen(false)}
                />
              ) : null}
            </div>
          ) : null}
          <div className="deckDisplayRow">
            <div>
              <span className="settingsTitle">{t("display")}</span>
              <span className="meta">
                {t("decksInSelection", { count: filteredLocalDecks.length })}
              </span>
            </div>
            <div
              className="segmented deckSideFilter"
              role="group"
              aria-label={t("showDeckSide")}
            >
              <button
                className={deckSideFilter === "all" ? "active" : ""}
                onClick={() => handleDeckSideFilter("all")}
                type="button"
                aria-pressed={deckSideFilter === "all"}
              >
                {t("all")}
              </button>
              <button
                className={
                  deckSideFilter === "runner" ? "active runner" : "runner"
                }
                onClick={() => handleDeckSideFilter("runner")}
                type="button"
                aria-pressed={deckSideFilter === "runner"}
              >
                Runner
              </button>
              <button
                className={deckSideFilter === "corp" ? "active corp" : "corp"}
                onClick={() => handleDeckSideFilter("corp")}
                type="button"
                aria-pressed={deckSideFilter === "corp"}
              >
                {t("corp")}
              </button>
            </div>
          </div>
          <div className="deckSelectGrid">
            <label>
              {t("showDeck")}
              <select
                value={selectedDeckSelectValue}
                onChange={(event) => onSelectDeck(event.target.value)}
                disabled={filteredLocalDecks.length === 0}
              >
                <option value="">{t("noLocalDeck")}</option>
                {filteredLocalDecks.map((deck) => (
                  <option value={deck.deckId} key={deck.deckId}>
                    {t(`sideValue.${deck.side}`)} · {deck.name}
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
              {standardPreviewActive && standardDeckPreview ? (
                <div className="deckStandardPreviewNotice" role="status">
                  <div>
                    <strong>{t("standardPreviewTitle")}</strong>
                    <span>
                      {onCopyStandard
                        ? t("standardPreviewDescription")
                        : t("standardPreviewAccountRequired")}
                    </span>
                  </div>
                  <div className="deckStandardPreviewActions">
                    {onCopyStandard ? (
                      <button
                        className="button primary"
                        type="button"
                        disabled={standardCopyBusy}
                        onClick={copyStandardPreviewAsOwnDeck}
                      >
                        <CopyPlus size={15} />
                        {tableT("copyAsOwn")}
                      </button>
                    ) : null}
                    <button
                      className="button"
                      type="button"
                      onClick={() => onCloseStandardDeckPreview?.()}
                    >
                      {tableT("backToMatchStart")}
                    </button>
                  </div>
                </div>
              ) : null}
              <div
                className={`deckBuilderGrid ${deckEditorMode === "table" ? "deckBuilderGridTableMode" : ""} ${standardPreviewActive ? "deckBuilderGridStandardPreview" : ""}`}
                style={deckEditorMode === "table" ? deckTableStyle : undefined}
              >
                {deckEditorMode === "table" ? null : (
                  <aside className="deckPreviewColumn">
                    {deckManagementPanel}
                    {previewCard ? (
                      <DeckBuilderPreview
                        card={previewCard}
                        detail={cardDetailsById[previewCard.catalogCardId]}
                        quantity={previewQuantity}
                        onAdd={() =>
                          onUpdateQuantity(
                            previewCard.catalogCardId,
                            previewQuantity + 1,
                          )
                        }
                        onRemove={() =>
                          onUpdateQuantity(
                            previewCard.catalogCardId,
                            previewQuantity - 1,
                          )
                        }
                      />
                    ) : (
                      <p className="meta deckEmpty">{t("selectPreviewCard")}</p>
                    )}
                  </aside>
                )}
                <section
                  className={`deckLibraryPanel ${deckEditorMode === "table" ? "deckTableLibraryPanel" : ""} ${standardPreviewActive ? "deckStandardPreviewHidden" : ""}`}
                >
                  <div className="deckBuilderPanelHeader">
                    <div>
                      <h3>{t("cardLibrary")}</h3>
                      <p className="meta">
                        {t("librarySummary", {
                          visible: libraryCards.length,
                          total: rarityFilteredPlayableCards.length,
                          side: t(`sideValue.${selectedDeck.side}`),
                        })}
                      </p>
                    </div>
                    <div className="deckLibraryHeaderActions">
                      {deckEditorMode === "table" ? (
                        <button
                          className={`deckLibraryFilterButton ${tableLibraryControlsOpen ? "active" : ""}`}
                          type="button"
                          onClick={() =>
                            setTableLibraryControlsOpen((current) => !current)
                          }
                          aria-expanded={tableLibraryControlsOpen}
                        >
                          <SlidersHorizontal size={14} />
                          {t("view")}
                        </button>
                      ) : null}
                      <button
                        className={`deckLibraryFilterButton ${builderFiltersOpen ? "active" : ""}`}
                        type="button"
                        onClick={() =>
                          setBuilderFiltersOpen((current) => !current)
                        }
                        aria-expanded={builderFiltersOpen}
                      >
                        <ListFilter size={14} />
                        {t("filter")}
                      </button>
                    </div>
                  </div>
                  {builderFiltersOpen ? (
                    <div className="deckBuilderTypes">
                      <CardSetPicker
                        original={builderSetAddons.original}
                        originalSelectable
                        classic={builderSetAddons.classic}
                        proteus={builderSetAddons.proteus}
                        baseDescription={t("setPicker.alwaysIncluded")}
                        addonDescription={t("setPicker.includeAddon")}
                        baseCount={builderSetCounts.original}
                        classicCount={builderSetCounts.classic}
                        proteusCount={builderSetCounts.proteus}
                        ariaLabel={t("showCardSet")}
                        testIdPrefix="deck-editor-card-pool"
                        onSetChange={(addon, enabled) =>
                          setBuilderSetAddons((current) => ({
                            ...current,
                            [addon]: enabled,
                          }))
                        }
                      />
                      <div
                        className="deckSourceFilter deckRarityFilter"
                        role="group"
                        aria-label={t("showRarity")}
                      >
                        {CATALOG_RARITY_FILTERS.map((filter) => (
                          <button
                            className={
                              builderRarityFilter === filter.key ? "active" : ""
                            }
                            disabled={builderRarityCounts[filter.key] === 0}
                            key={filter.key}
                            onClick={() => setBuilderRarityFilter(filter.key)}
                            type="button"
                            aria-pressed={builderRarityFilter === filter.key}
                          >
                            <span>{t(`rarityFilter.${filter.key}`)}</span>
                            <small>{builderRarityCounts[filter.key]}</small>
                          </button>
                        ))}
                      </div>
                      <label
                        className={`deckBuilderToggle ${builderOnlyInDeck ? "checked" : ""}`}
                      >
                        <input
                          checked={builderOnlyInDeck}
                          onChange={(event) =>
                            setBuilderOnlyInDeck(event.target.checked)
                          }
                          type="checkbox"
                        />
                        {t("onlyInDeck")}
                      </label>
                      <div className="deckBuilderTypeActions">
                        <button
                          type="button"
                          onClick={() => setVisibleBuilderTypes(true)}
                        >
                          {t("allTypes")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisibleBuilderTypes(false)}
                        >
                          {t("noTypes")}
                        </button>
                      </div>
                      {visibleTypeFilterGroups.map((group) => (
                        <div
                          className={`typeFilterGroup ${group.side}`}
                          key={group.title}
                        >
                          <div className="typeFilterGrid">
                            {group.filters.map((filter) => (
                              <label
                                className={`typeToggle ${group.side} ${builderTypeFilters[filter.key] ? "checked" : ""}`}
                                key={filter.key}
                              >
                                <input
                                  checked={builderTypeFilters[filter.key]}
                                  onChange={(event) =>
                                    setBuilderTypeFilters((current) => ({
                                      ...current,
                                      [filter.key]: event.target.checked,
                                    }))
                                  }
                                  type="checkbox"
                                />
                                <span>{t(`type.${filter.key}`)}</span>
                                <small>
                                  {builderTypeCounts[filter.key] ?? 0}
                                </small>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <label className="deckBuilderSearch">
                    {t("search")}
                    <span className="deckSearchInputWrap">
                      <input
                        value={builderSearch}
                        onChange={(event) =>
                          setBuilderSearch(event.target.value)
                        }
                        placeholder={t("searchPlaceholder")}
                      />
                      {builderSearch ? (
                        <button
                          aria-label={t("clearSearch")}
                          className="deckSearchClearButton"
                          onClick={() => setBuilderSearch("")}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </span>
                  </label>
                  {deckEditorMode === "table" && tableLibraryControlsOpen ? (
                    <div
                      className="deckTableLibraryControls"
                      aria-label={t("libraryView")}
                    >
                      <label>
                        <span>{t("cardSize")}</span>
                        <input
                          min={DECK_TABLE_LIBRARY_CARD_WIDTH_MIN}
                          max={DECK_TABLE_LIBRARY_CARD_WIDTH_MAX}
                          step={DECK_TABLE_LIBRARY_CARD_WIDTH_STEP}
                          type="range"
                          value={tableLibraryCardWidth}
                          onChange={(event) =>
                            updateTableLibraryCardWidthSetting(
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        <span>{t("overlap")}</span>
                        <input
                          min={DECK_TABLE_LIBRARY_OVERLAP_MIN}
                          max={DECK_TABLE_LIBRARY_OVERLAP_MAX}
                          step={DECK_TABLE_LIBRARY_OVERLAP_STEP}
                          type="range"
                          value={tableLibraryOverlapPercent}
                          onChange={(event) =>
                            updateTableLibraryOverlapSetting(
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                  <div className="deckLibraryList">
                    {libraryCards.map((card, index) =>
                      deckEditorMode === "table" ? (
                        <DeckTableLibraryCard
                          card={card}
                          detail={cardDetailsById[card.catalogCardId]}
                          key={card.catalogCardId}
                          overlapped={index >= tableLibraryColumnCount}
                          quantity={deckQuantities.get(card.catalogCardId) ?? 0}
                          selected={
                            previewCard?.catalogCardId === card.catalogCardId
                          }
                          stackIndex={index + 1}
                          onAddToFirstPile={() =>
                            tableLayout &&
                            addTableCardToPile(
                              card.catalogCardId,
                              tableLayout.piles[0]?.id ?? "pile-1",
                            )
                          }
                          onSelect={() => setPreviewCardId(card.catalogCardId)}
                        />
                      ) : (
                        <DeckLibraryCard
                          card={card}
                          detail={cardDetailsById[card.catalogCardId]}
                          key={card.catalogCardId}
                          quantity={deckQuantities.get(card.catalogCardId) ?? 0}
                          selected={
                            previewCard?.catalogCardId === card.catalogCardId
                          }
                          onAdd={() =>
                            onUpdateQuantity(
                              card.catalogCardId,
                              (deckQuantities.get(card.catalogCardId) ?? 0) + 1,
                            )
                          }
                          onRemove={() =>
                            onUpdateQuantity(
                              card.catalogCardId,
                              (deckQuantities.get(card.catalogCardId) ?? 0) - 1,
                            )
                          }
                          onSelect={() => setPreviewCardId(card.catalogCardId)}
                        />
                      ),
                    )}
                    {libraryCards.length === 0 ? (
                      <p className="meta deckEmpty">{t("noMatchingCard")}</p>
                    ) : null}
                  </div>
                </section>
                <div className="deckListColumn">
                  {deckEditorMode === "table" ? null : (
                    <section
                      className={`deckDetailsPanel ${deckDetailsOpen ? "" : "collapsed"}`}
                    >
                      <div className="deckDetailsHeader">
                        <div>
                          <h3>{t("deckDetails")}</h3>
                        </div>
                        <button
                          className="button iconOnly"
                          type="button"
                          aria-expanded={deckDetailsOpen}
                          aria-label={
                            deckDetailsOpen
                              ? t("collapseDeckDetails")
                              : t("expandDeckDetails")
                          }
                          title={
                            deckDetailsOpen
                              ? t("collapseDeckDetails")
                              : t("expandDeckDetails")
                          }
                          onClick={() =>
                            setDeckDetailsOpen((current) => !current)
                          }
                        >
                          {deckDetailsOpen ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                      {deckDetailsOpen ? (
                        <>
                          <div className="deckSelectGrid">
                            <label>
                              {t("changeDeckName")}
                              <input
                                value={selectedDeck.name}
                                onChange={(event) =>
                                  onUpdateDeck({
                                    ...selectedDeck,
                                    name: event.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                          <div className="deckFormGrid">
                            <label>
                              {t("note")}
                              <input
                                value={selectedDeck.notes ?? ""}
                                onChange={(event) =>
                                  onUpdateDeck({
                                    ...selectedDeck,
                                    notes: event.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                        </>
                      ) : null}
                    </section>
                  )}
                  <DeckStrategyProfilePanel
                    response={deckStrategyProfileResponse}
                    loading={deckStrategyProfileLoading}
                  />
                  {deckEditorMode === "table" && tableLayout ? (
                    <DeckTableBoard
                      layout={tableLayout}
                      deckName={selectedDeck.name}
                      deckSide={selectedDeck.side}
                      cardLookup={cardLookup}
                      cardDetailsById={cardDetailsById}
                      activeMenuKey={tableCardMenuKey}
                      cardWidth={tableCardWidth}
                      controlsOpen={tableControlsOpen}
                      numericDetailsReady={deckTableNumericDetailsReady}
                      overlapPercent={tableOverlapPercent}
                      tableWidth={tableWidthControlValue}
                      dirty={selectedDeckDirty}
                      selectedCardIndexes={selectedTableCardIndexes}
                      selectedCardKeys={selectedTableCardKeySet}
                      selectedCards={selectedTableCards}
                      selectionMode={tableSelectionMode}
                      agendaStatus={agendaStatus}
                      onBack={() => {
                        if (standardPreviewActive) {
                          onCloseStandardDeckPreview?.();
                          return;
                        }
                        setDeckEditorMode("list");
                      }}
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
                      onToggleControls={() =>
                        setTableControlsOpen((current) => !current)
                      }
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
                          <h3>{t("deckList")}</h3>
                          <p className="meta">
                            {t("draftCards", { count: totalCards })}
                          </p>
                          <DeckAgendaStatusBadge status={agendaStatus} />
                        </div>
                        <button
                          className="button deckTableEnterButton"
                          onClick={() => setDeckEditorMode("table")}
                          type="button"
                        >
                          <Move size={15} />
                          {t("editOnTable")}
                        </button>
                      </div>
                      <div className="deckCardList">
                        {deckRows.map((row, index) => {
                          const group = deckBuilderCardGroup(row.card);
                          const previousGroup =
                            index > 0
                              ? deckBuilderCardGroup(
                                  deckRows[index - 1]?.card ?? null,
                                )
                              : "";
                          return (
                            <Fragment key={row.entry.cardId}>
                              {group !== previousGroup ? (
                                <div className="deckCardGroup">{group}</div>
                              ) : null}
                              <DeckListCard
                                card={row.card}
                                cardId={row.entry.cardId}
                                detail={
                                  row.card
                                    ? cardDetailsById[row.card.catalogCardId]
                                    : undefined
                                }
                                quantity={row.entry.quantity}
                                onIncrement={() =>
                                  onUpdateQuantity(
                                    row.entry.cardId,
                                    row.entry.quantity + 1,
                                  )
                                }
                                onDecrement={() =>
                                  onUpdateQuantity(
                                    row.entry.cardId,
                                    row.entry.quantity - 1,
                                  )
                                }
                                onRemove={() =>
                                  onUpdateQuantity(row.entry.cardId, 0)
                                }
                                onSelect={() =>
                                  setPreviewCardId(row.entry.cardId)
                                }
                              />
                            </Fragment>
                          );
                        })}
                        {deckRows.length === 0 ? (
                          <p className="meta deckEmpty">{t("deckEmpty")}</p>
                        ) : null}
                      </div>
                    </section>
                  )}
                  {deckEditorMode === "table" ? null : (
                    <section className="deckControlsPanel">
                      <div className="deckActions">
                        <button
                          className="button primary"
                          onClick={onSave}
                          disabled={!selectedDeckDirty}
                        >
                          <Save size={15} />
                          {t("save")}
                        </button>
                        <button className="button primary" onClick={onValidate}>
                          <Check size={15} />
                          {t("validate")}
                        </button>
                        <button
                          className="button"
                          onClick={onUseForMatch}
                          disabled={!validatedSnapshot}
                        >
                          <Play size={15} />
                          {useForMatchLabel ?? t("useForMatch")}
                        </button>
                        <button className="button" onClick={onExport}>
                          <Download size={15} />
                          Export
                        </button>
                        <button className="button" onClick={onDuplicate}>
                          <CopyPlus size={15} />
                          {t("duplicate")}
                        </button>
                        <button className="button" onClick={onDelete}>
                          <Trash2 size={15} />
                          {t("delete")}
                        </button>
                      </div>
                      <p
                        className={`deckSaveStatus ${selectedDeckDirty ? "dirty" : validation?.ok ? "ok" : validation && !validation.ok ? "bad" : "ok"}`}
                      >
                        {selectedDeckDirty
                          ? t("unsavedChanges")
                          : validation?.ok
                            ? t("savedValid")
                            : validation && !validation.ok
                              ? t("savedInvalid")
                              : t("saved")}
                      </p>
                      <DeckValidationSummary
                        validation={validation}
                        snapshot={validatedSnapshot}
                      />
                      {exportText ? (
                        <textarea
                          className="deckTextArea"
                          value={exportText}
                          readOnly
                        />
                      ) : null}
                    </section>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="meta deckEmpty">
              {localDecks.length === 0
                ? t("createOrImport")
                : t("noDeckInSelection")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
