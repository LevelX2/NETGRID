import { useCallback, useEffect, useMemo, useState } from "react";

import type { PlayerView, PublicGameEvent, Side } from "@netgrid/shared";

import { revealedEventCardIds } from "../actions/access-review-derivation";
import { visibleKnownCardIds } from "../cards/card-view-model";
import {
  catalogSetFilterOptions,
  filterCatalogCardsByAiHint,
  filterCatalogCardsByBlockStatus,
  filterCatalogCardsByRarity,
  filterCatalogCardsBySetId,
  filterCatalogCardsByType,
  isCatalogVisibleCard,
  nextCatalogSelection,
  summarizeCatalogAiHintFilters,
  summarizeCatalogBlockStatusFilters,
  summarizeCatalogRarityFilters,
  summarizeCatalogStatuses,
  summarizeCatalogTypeFilters,
  type CatalogAiHintFilterKey,
  type CatalogBlockStatusFilterKey,
  type CatalogRarityFilterKey,
  type CatalogStatusKey,
  type CatalogTypeFilterState,
} from "./catalog-model";
import type {
  CatalogCardDetail,
  CatalogCardSummary,
  CatalogListResponse,
} from "./catalog-types";

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

type CatalogWorkspacePayload = {
  eventTail: PublicGameEvent[];
  playerView: PlayerView;
};

export function useCatalogWorkspace(payload: CatalogWorkspacePayload | null) {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSide, setCatalogSide] = useState<Side | "all">("all");
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatusKey | "all">(
    "all",
  );
  const [catalogExpertStatuses, setCatalogExpertStatuses] = useState(false);
  const [catalogTypeFilters, setCatalogTypeFilters] =
    useState<CatalogTypeFilterState>({ ...ALL_CATALOG_TYPE_FILTERS });
  const [catalogSetFilter, setCatalogSetFilter] = useState("all");
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [catalogBlockStatusFilter, setCatalogBlockStatusFilter] =
    useState<CatalogBlockStatusFilterKey>("all");
  const [catalogRarityFilter, setCatalogRarityFilter] =
    useState<CatalogRarityFilterKey>("all");
  const [catalogAiHintFilter, setCatalogAiHintFilter] =
    useState<CatalogAiHintFilterKey>("all");
  const [catalogCards, setCatalogCards] = useState<CatalogCardSummary[]>([]);
  const [catalogFilters, setCatalogFilters] =
    useState<CatalogListResponse["filters"] | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
    null,
  );
  const [catalogDetail, setCatalogDetail] = useState<CatalogCardDetail | null>(
    null,
  );
  const [allCatalogCards, setAllCatalogCards] = useState<CatalogCardSummary[]>(
    [],
  );
  const [catalogDetailsById, setCatalogDetailsById] = useState<
    Record<string, CatalogCardDetail>
  >({});

  const blockStatusFilteredCatalogCards = useMemo(
    () => filterCatalogCardsByBlockStatus(catalogCards, catalogBlockStatusFilter),
    [catalogBlockStatusFilter, catalogCards],
  );
  const catalogBlockStatusCounts = useMemo(
    () => summarizeCatalogBlockStatusFilters(catalogCards),
    [catalogCards],
  );
  const catalogSetOptions = useMemo(
    () => catalogSetFilterOptions(blockStatusFilteredCatalogCards),
    [blockStatusFilteredCatalogCards],
  );
  const setFilteredCatalogCards = useMemo(
    () => filterCatalogCardsBySetId(blockStatusFilteredCatalogCards, catalogSetFilter),
    [blockStatusFilteredCatalogCards, catalogSetFilter],
  );
  const aiHintFilteredCatalogCards = useMemo(
    () => filterCatalogCardsByAiHint(setFilteredCatalogCards, catalogAiHintFilter),
    [setFilteredCatalogCards, catalogAiHintFilter],
  );
  const rarityFilteredCatalogCards = useMemo(
    () => filterCatalogCardsByRarity(aiHintFilteredCatalogCards, catalogRarityFilter),
    [aiHintFilteredCatalogCards, catalogRarityFilter],
  );
  const filteredCatalogCards = useMemo(
    () => filterCatalogCardsByType(rarityFilteredCatalogCards, catalogTypeFilters),
    [catalogTypeFilters, rarityFilteredCatalogCards],
  );
  const filteredCatalogSummary = useMemo(
    () => summarizeCatalogStatuses(filteredCatalogCards),
    [filteredCatalogCards],
  );
  const catalogAiHintCounts = useMemo(
    () => summarizeCatalogAiHintFilters(setFilteredCatalogCards),
    [setFilteredCatalogCards],
  );
  const catalogRarityCounts = useMemo(
    () => summarizeCatalogRarityFilters(aiHintFilteredCatalogCards),
    [aiHintFilteredCatalogCards],
  );
  const catalogTypeCounts = useMemo(
    () => summarizeCatalogTypeFilters(rarityFilteredCatalogCards),
    [rarityFilteredCatalogCards],
  );

  const ensureCatalogDetails = useCallback(
    async (cardIds: readonly string[]) => {
      const missingIds = Array.from(new Set(cardIds)).filter(
        (cardId) => !catalogDetailsById[cardId],
      );
      if (missingIds.length === 0) return;
      const details = await Promise.all(
        missingIds.map((cardId) =>
          fetch(`/api/cards/catalog/${encodeURIComponent(cardId)}`, {
            cache: "no-store",
          })
            .then((response) => response.json() as Promise<{ card?: CatalogCardDetail }>)
            .then((data) => data.card)
            .catch(() => null),
        ),
      );
      setCatalogDetailsById((current) => {
        const next = { ...current };
        details.forEach((detail) => {
          if (detail) next[detail.catalogCardId] = detail;
        });
        return next;
      });
    },
    [catalogDetailsById],
  );

  useEffect(() => {
    if (catalogSetFilter === "all") return;
    if (!catalogSetOptions.some((option) => option.key === catalogSetFilter))
      setCatalogSetFilter("all");
  }, [catalogSetFilter, catalogSetOptions]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (catalogSearch.trim()) params.set("q", catalogSearch.trim());
    if (catalogSide !== "all") params.set("side", catalogSide);
    if (catalogStatus !== "all") params.set("status", catalogStatus);
    void fetch(`/api/cards/catalog?${params.toString()}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<CatalogListResponse>)
      .then((data) => {
        const visibleCards = (data.cards ?? []).filter(isCatalogVisibleCard);
        setCatalogCards(visibleCards);
        setCatalogFilters(data.filters ?? null);
        setSelectedCatalogId((current) =>
          nextCatalogSelection(current, visibleCards, catalogTypeFilters),
        );
      })
      .catch(() => {
        setCatalogCards([]);
        setCatalogFilters(null);
        setSelectedCatalogId(null);
      });
  }, [catalogSearch, catalogSide, catalogStatus]);

  useEffect(() => {
    setSelectedCatalogId((current) =>
      current &&
      filteredCatalogCards.some((card) => card.catalogCardId === current)
        ? current
        : filteredCatalogCards[0]?.catalogCardId ?? null,
    );
  }, [filteredCatalogCards]);

  useEffect(() => {
    if (!selectedCatalogId) {
      setCatalogDetail(null);
      return;
    }
    let ignore = false;
    void fetch(`/api/cards/catalog/${encodeURIComponent(selectedCatalogId)}`, {
      cache: "no-store",
    })
      .then((response) => response.json() as Promise<{ card?: CatalogCardDetail }>)
      .then((data) => {
        if (!ignore) setCatalogDetail(data.card ?? null);
      })
      .catch(() => {
        if (!ignore) setCatalogDetail(null);
      });
    return () => {
      ignore = true;
    };
  }, [selectedCatalogId]);

  useEffect(() => {
    const eventIds = (payload?.eventTail ?? []).flatMap(revealedEventCardIds);
    const visibleIds = visibleKnownCardIds(payload?.playerView);
    void ensureCatalogDetails([...eventIds, ...visibleIds]);
  }, [payload?.eventTail, payload?.playerView, ensureCatalogDetails]);

  useEffect(() => {
    void fetch("/api/cards/catalog", { cache: "no-store" })
      .then((response) => response.json() as Promise<CatalogListResponse>)
      .then((data) =>
        setAllCatalogCards((data.cards ?? []).filter(isCatalogVisibleCard)),
      )
      .catch(() => setAllCatalogCards([]));
  }, []);

  return {
    allCatalogCards,
    catalogDetailsById,
    ensureCatalogDetails,
    catalogPanelProps: {
      cards: filteredCatalogCards,
      detail: catalogDetail,
      filters: catalogFilters,
      search: catalogSearch,
      side: catalogSide,
      status: catalogStatus,
      summary: filteredCatalogSummary,
      setFilter: catalogSetFilter,
      setOptions: catalogSetOptions,
      selectedId: selectedCatalogId,
      filtersOpen: catalogFiltersOpen,
      showExpertStatuses: catalogExpertStatuses,
      blockStatusCounts: catalogBlockStatusCounts,
      blockStatusFilter: catalogBlockStatusFilter,
      aiHintCounts: catalogAiHintCounts,
      aiHintFilter: catalogAiHintFilter,
      rarityCounts: catalogRarityCounts,
      rarityFilter: catalogRarityFilter,
      typeCounts: catalogTypeCounts,
      typeFilters: catalogTypeFilters,
      onSearch: setCatalogSearch,
      onSide: setCatalogSide,
      onStatus: setCatalogStatus,
      onSetFilter: setCatalogSetFilter,
      onSelect: setSelectedCatalogId,
      onFiltersOpen: setCatalogFiltersOpen,
      onToggleExpertStatuses: setCatalogExpertStatuses,
      onBlockStatusFilter: setCatalogBlockStatusFilter,
      onAiHintFilter: setCatalogAiHintFilter,
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
