import type { CardDefinitionId, Side } from "@netgrid/shared";
import { useEffect, useMemo, useState } from "react";
import type { PlayerView } from "../../lib/presented-player-view";

import { revealedEventCardIds } from "../actions/access-review-derivation";
import { visibleKnownCardIds } from "../cards/card-view-model";
import {
  filterCatalogCardsByRarity,
  filterCatalogCardsByProductSets,
  filterCatalogCardsByType,
  isCatalogVisibleCard,
  nextCatalogSelection,
  summarizeCatalogRarityFilters,
  summarizeCatalogProductSets,
  summarizeCatalogTypeFilters,
  type CatalogRarityFilterKey,
  type CatalogProductSetSelection,
  type CatalogTypeFilterState,
} from "./catalog-model";
import type {
  CatalogCardList,
  CatalogCardSummary,
  CatalogDeckCard,
  CatalogListResponse,
  CatalogLoadStatus,
  CatalogPresentationCard,
} from "./catalog-types";
import type { PublicCardPresentationsById } from "../../app/public-card-presentation";
import { catalogCardPresentationsFor } from "./catalog-card-presentations";
import {
  useCatalogListResource,
  useCatalogPresentationIndex,
} from "./useCatalogListResource";
import { useCatalogDetails } from "./useCatalogDetails";

const ALL_CATALOG_TYPE_FILTERS: CatalogTypeFilterState = {
  ice: true,
  agenda: true,
  icebreaker: true,
  asset: true,
  upgrade: true,
  operation: true,
  event: true,
  hardware: true,
  resource: true,
  program: true,
};

const NO_CATALOG_TYPE_FILTERS: CatalogTypeFilterState = {
  ice: false,
  agenda: false,
  icebreaker: false,
  asset: false,
  upgrade: false,
  operation: false,
  event: false,
  hardware: false,
  resource: false,
  program: false,
};

const EMPTY_CARDS: CatalogCardSummary[] = [];
const EMPTY_PRESENTATION_CARDS: CatalogPresentationCard[] = [];
const EMPTY_DECK_CARDS: CatalogDeckCard[] = [];

function hasCatalogFilters(data: CatalogListResponse): boolean {
  return Boolean(data.filters);
}

export function useCatalogWorkspace({
  playerView,
  catalogOpen,
  decksOpen,
  runOutcomeCardId,
}: {
  playerView: PlayerView | undefined;
  catalogOpen: boolean;
  decksOpen: boolean;
  runOutcomeCardId: CardDefinitionId | undefined;
}) {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSide, setCatalogSide] = useState<Side | "all">("all");
  const [catalogTypeFilters, setCatalogTypeFilters] =
    useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [catalogSetAddons, setCatalogSetAddons] =
    useState<CatalogProductSetSelection>({
      original: true,
      classic: true,
      proteus: true,
    });
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [catalogRarityFilter, setCatalogRarityFilter] =
    useState<CatalogRarityFilterKey>("all");
  const [selectedCatalogId, setSelectedCatalogId] =
    useState<CardDefinitionId | null>(null);

  const params = new URLSearchParams();
  if (catalogSearch.trim()) params.set("q", catalogSearch.trim());
  if (catalogSide !== "all") params.set("side", catalogSide);
  const query = params.toString();
  const presentationIndex = useCatalogPresentationIndex();
  const deckCatalog = useCatalogListResource<CatalogCardList<CatalogDeckCard>>(
    "/api/cards/catalog/decks",
    decksOpen,
  );
  const baseCatalog = useCatalogListResource<CatalogListResponse>(
    "/api/cards/catalog",
    catalogOpen && !query,
    hasCatalogFilters,
  );
  const searchedCatalog = useCatalogListResource<CatalogListResponse>(
    `/api/cards/catalog?${query}`,
    catalogOpen && Boolean(query),
    hasCatalogFilters,
  );
  const currentCatalog = query ? searchedCatalog : baseCatalog;
  const resultStatus: CatalogLoadStatus = currentCatalog?.status ?? "loading";
  const deckCatalogStatus: CatalogLoadStatus = deckCatalog?.status ?? "loading";
  const presentationIndexStatus: CatalogLoadStatus =
    presentationIndex?.status ?? "loading";
  const presentationCards =
    presentationIndex?.status === "ready"
      ? presentationIndex.data.cards
      : EMPTY_PRESENTATION_CARDS;
  const catalogCardPresentationsById = useMemo<PublicCardPresentationsById>(
    () => catalogCardPresentationsFor(presentationCards),
    [presentationCards],
  );
  const catalogCards = useMemo(
    () =>
      currentCatalog?.status === "ready"
        ? currentCatalog.data.cards.filter(isCatalogVisibleCard)
        : EMPTY_CARDS,
    [currentCatalog],
  );

  const catalogSetCounts = useMemo(
    () => summarizeCatalogProductSets(catalogCards),
    [catalogCards],
  );
  const setFilteredCatalogCards = useMemo(
    () => filterCatalogCardsByProductSets(catalogCards, catalogSetAddons),
    [catalogCards, catalogSetAddons],
  );
  const rarityFilteredCatalogCards = useMemo(
    () =>
      filterCatalogCardsByRarity(setFilteredCatalogCards, catalogRarityFilter),
    [setFilteredCatalogCards, catalogRarityFilter],
  );
  const filteredCatalogCards = useMemo(
    () =>
      filterCatalogCardsByType(rarityFilteredCatalogCards, catalogTypeFilters),
    [catalogTypeFilters, rarityFilteredCatalogCards],
  );
  const catalogRarityCounts = useMemo(
    () => summarizeCatalogRarityFilters(setFilteredCatalogCards),
    [setFilteredCatalogCards],
  );
  const catalogTypeCounts = useMemo(
    () => summarizeCatalogTypeFilters(rarityFilteredCatalogCards),
    [rarityFilteredCatalogCards],
  );

  useEffect(() => {
    if (!catalogOpen || currentCatalog?.status !== "ready") return;
    setSelectedCatalogId((current) =>
      nextCatalogSelection(current, filteredCatalogCards),
    );
  }, [catalogOpen, currentCatalog, filteredCatalogCards]);

  const selectedDetailId =
    catalogOpen &&
    selectedCatalogId !== null &&
    filteredCatalogCards.some(
      (card) => card.catalogCardId === selectedCatalogId,
    )
      ? selectedCatalogId
      : null;
  const detailCardIds = useMemo(
    () => [
      ...(selectedDetailId !== null ? [selectedDetailId] : []),
      ...(runOutcomeCardId !== undefined ? [runOutcomeCardId] : []),
      ...visibleKnownCardIds(playerView),
      ...(playerView?.publicEvents ?? []).flatMap(revealedEventCardIds),
    ],
    [playerView, runOutcomeCardId, selectedDetailId],
  );
  const { cardDetailsById: catalogDetailsById, failedDetailIds } =
    useCatalogDetails(detailCardIds);

  return {
    presentationCards,
    presentationIndexStatus,
    catalogCardPresentationsById,
    catalogDetailsById,
    deckCatalogCards:
      deckCatalog?.status === "ready"
        ? deckCatalog.data.cards
        : EMPTY_DECK_CARDS,
    deckCatalogStatus,
    catalogPanelProps: {
      cards: filteredCatalogCards,
      detail:
        selectedDetailId !== null
          ? (catalogDetailsById[selectedDetailId] ?? null)
          : null,
      detailError:
        selectedDetailId !== null && failedDetailIds.has(selectedDetailId),
      filters:
        currentCatalog?.status === "ready" ? currentCatalog.data.filters : null,
      resultStatus,
      search: catalogSearch,
      side: catalogSide,
      setAddons: catalogSetAddons,
      setCounts: catalogSetCounts,
      selectedId: selectedCatalogId,
      filtersOpen: catalogFiltersOpen,
      rarityCounts: catalogRarityCounts,
      rarityFilter: catalogRarityFilter,
      typeCounts: catalogTypeCounts,
      typeFilters: catalogTypeFilters,
      onSearch: setCatalogSearch,
      onSide: setCatalogSide,
      onSetAddon: (
        addon: "original" | "classic" | "proteus",
        enabled: boolean,
      ) => setCatalogSetAddons((current) => ({ ...current, [addon]: enabled })),
      onSelect: setSelectedCatalogId,
      onFiltersOpen: setCatalogFiltersOpen,
      onRarity: setCatalogRarityFilter,
      onTypeFilter: (key: keyof CatalogTypeFilterState, selected: boolean) =>
        setCatalogTypeFilters((current) => ({ ...current, [key]: selected })),
      onSelectAllTypes: () =>
        setCatalogTypeFilters({ ...ALL_CATALOG_TYPE_FILTERS }),
      onClearTypeFilters: () =>
        setCatalogTypeFilters({ ...NO_CATALOG_TYPE_FILTERS }),
    },
  };
}
