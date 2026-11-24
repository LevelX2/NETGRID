import type { CardDefinitionId } from "@netgrid/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Side } from "@netgrid/shared";
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
  CatalogCardDetail,
  CatalogCardSummary,
  CatalogListResponse,
} from "./catalog-types";
import type { PublicCardPresentationsById } from "../../app/public-card-presentation";
import { catalogCardPresentationsFor } from "./catalog-card-presentations";
import { CatalogDetailRequestCoordinator } from "./catalog-detail-loader";

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

type CatalogResult =
  | { status: "ready"; data: CatalogListResponse }
  | { status: "error" };

const EMPTY_CARDS: CatalogCardSummary[] = [];

async function loadCatalog(
  query: string,
  signal: AbortSignal,
): Promise<CatalogResult> {
  try {
    const response = await fetch(
      query ? `/api/cards/catalog?${query}` : "/api/cards/catalog",
      {
        cache: "no-store",
        signal,
      },
    );
    if (!response.ok) return { status: "error" };
    const data = (await response.json()) as CatalogListResponse;
    if (!Array.isArray(data.cards) || !data.filters) return { status: "error" };
    return { status: "ready", data };
  } catch {
    return { status: "error" };
  }
}

export function useCatalogWorkspace(playerView: PlayerView | undefined) {
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
  const [baseCatalog, setBaseCatalog] = useState<CatalogResult>();
  const [searchedCatalog, setSearchedCatalog] = useState<{
    query: string;
    result: CatalogResult;
  }>();
  const [selectedCatalogId, setSelectedCatalogId] =
    useState<CardDefinitionId | null>(null);
  const [catalogDetailsById, setCatalogDetailsById] = useState<
    Record<string, CatalogCardDetail>
  >({});
  const catalogDetailsByIdRef = useRef(catalogDetailsById);
  const catalogDetailRequestCoordinatorRef = useRef(
    new CatalogDetailRequestCoordinator(),
  );

  const params = new URLSearchParams();
  if (catalogSearch.trim()) params.set("q", catalogSearch.trim());
  if (catalogSide !== "all") params.set("side", catalogSide);
  const query = params.toString();
  const currentCatalog = query
    ? searchedCatalog?.query === query
      ? searchedCatalog.result
      : undefined
    : baseCatalog;
  const resultStatus: "loading" | CatalogResult["status"] =
    currentCatalog?.status ?? "loading";
  const allCatalogCards = useMemo(
    () =>
      baseCatalog?.status === "ready"
        ? baseCatalog.data.cards.filter(isCatalogVisibleCard)
        : EMPTY_CARDS,
    [baseCatalog],
  );
  const catalogCardPresentationsById = useMemo<PublicCardPresentationsById>(
    () =>
      baseCatalog?.status === "ready"
        ? catalogCardPresentationsFor(baseCatalog.data.cards)
        : {},
    [baseCatalog],
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

  const ensureCatalogDetails = useCallback(
    async (cardIds: readonly CardDefinitionId[]) => {
      await catalogDetailRequestCoordinatorRef.current.ensure(
        cardIds,
        (cardId) => Boolean(catalogDetailsByIdRef.current[cardId]),
        async (cardId) => {
          const response = await fetch(
            `/api/cards/catalog/${encodeURIComponent(cardId)}`,
            { cache: "no-store" },
          );
          if (!response.ok) return null;
          const data = (await response.json()) as { card?: CatalogCardDetail };
          return data.card ?? null;
        },
        (detail) => {
          setCatalogDetailsById((current) => {
            if (current[detail.catalogCardId]) return current;
            const next = { ...current, [detail.catalogCardId]: detail };
            catalogDetailsByIdRef.current = next;
            return next;
          });
        },
      );
    },
    [],
  );

  useEffect(() => {
    const request = new AbortController();
    void loadCatalog("", request.signal).then((result) => {
      if (!request.signal.aborted) setBaseCatalog(result);
    });
    return () => request.abort();
  }, []);

  useEffect(() => {
    if (!query) return;
    const request = new AbortController();
    void loadCatalog(query, request.signal).then((result) => {
      if (!request.signal.aborted) setSearchedCatalog({ query, result });
    });
    return () => request.abort();
  }, [query]);

  useEffect(() => {
    if (currentCatalog?.status !== "ready") return;
    setSelectedCatalogId((current) =>
      nextCatalogSelection(current, filteredCatalogCards),
    );
  }, [currentCatalog, filteredCatalogCards]);

  useEffect(() => {
    if (selectedCatalogId) void ensureCatalogDetails([selectedCatalogId]);
  }, [selectedCatalogId, ensureCatalogDetails]);

  useEffect(() => {
    const eventIds = (playerView?.publicEvents ?? []).flatMap(
      revealedEventCardIds,
    );
    const visibleIds = visibleKnownCardIds(playerView);
    void ensureCatalogDetails([...eventIds, ...visibleIds]);
  }, [playerView, ensureCatalogDetails]);

  return {
    allCatalogCards,
    catalogCardPresentationsById,
    catalogDetailsById,
    ensureCatalogDetails,
    catalogPanelProps: {
      cards: filteredCatalogCards,
      detail:
        selectedCatalogId &&
        filteredCatalogCards.some(
          (card) => card.catalogCardId === selectedCatalogId,
        )
          ? (catalogDetailsById[selectedCatalogId] ?? null)
          : null,
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
