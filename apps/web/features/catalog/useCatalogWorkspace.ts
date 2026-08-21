import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PlayerView, PublicGameEvent, Side } from "@netgrid/shared";

import { revealedEventCardIds } from "../actions/access-review-derivation";
import { visibleKnownCardIds } from "../cards/card-view-model";
import {
  filterCatalogCardsByAiHint,
  filterCatalogCardsByBlockStatus,
  filterCatalogCardsByRarity,
  filterCatalogCardsBySetAddons,
  filterCatalogCardsByType,
  isCatalogVisibleCard,
  nextCatalogSelection,
  summarizeCatalogAiHintFilters,
  summarizeCatalogBlockStatusFilters,
  summarizeCatalogRarityFilters,
  summarizeCatalogProductSets,
  summarizeCatalogStatuses,
  summarizeCatalogTypeFilters,
  type CatalogAiHintFilterKey,
  type CatalogBlockStatusFilterKey,
  type CatalogRarityFilterKey,
  type CatalogSetAddonSelection,
  type CatalogStatusKey,
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
  const [catalogSetAddons, setCatalogSetAddons] =
    useState<CatalogSetAddonSelection>({ classic: false, proteus: false });
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [catalogBlockStatusFilter, setCatalogBlockStatusFilter] =
    useState<CatalogBlockStatusFilterKey>("all");
  const [catalogRarityFilter, setCatalogRarityFilter] =
    useState<CatalogRarityFilterKey>("all");
  const [catalogAiHintFilter, setCatalogAiHintFilter] =
    useState<CatalogAiHintFilterKey>("all");
  const [catalogCards, setCatalogCards] = useState<CatalogCardSummary[]>([]);
  const [catalogFilters, setCatalogFilters] = useState<
    CatalogListResponse["filters"] | null
  >(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
    null,
  );
  const [catalogDetail, setCatalogDetail] = useState<CatalogCardDetail | null>(
    null,
  );
  const [allCatalogCards, setAllCatalogCards] = useState<CatalogCardSummary[]>(
    [],
  );
  const [catalogCardPresentationsById, setCatalogCardPresentationsById] =
    useState<PublicCardPresentationsById>({});
  const [catalogDetailsById, setCatalogDetailsById] = useState<
    Record<string, CatalogCardDetail>
  >({});
  const catalogDetailsByIdRef = useRef(catalogDetailsById);
  const catalogDetailRequestCoordinatorRef = useRef(
    new CatalogDetailRequestCoordinator(),
  );

  const blockStatusFilteredCatalogCards = useMemo(
    () =>
      filterCatalogCardsByBlockStatus(catalogCards, catalogBlockStatusFilter),
    [catalogBlockStatusFilter, catalogCards],
  );
  const catalogBlockStatusCounts = useMemo(
    () => summarizeCatalogBlockStatusFilters(catalogCards),
    [catalogCards],
  );
  const catalogSetCounts = useMemo(
    () => summarizeCatalogProductSets(blockStatusFilteredCatalogCards),
    [blockStatusFilteredCatalogCards],
  );
  const setFilteredCatalogCards = useMemo(
    () =>
      filterCatalogCardsBySetAddons(
        blockStatusFilteredCatalogCards,
        catalogSetAddons,
      ),
    [blockStatusFilteredCatalogCards, catalogSetAddons],
  );
  const aiHintFilteredCatalogCards = useMemo(
    () =>
      filterCatalogCardsByAiHint(setFilteredCatalogCards, catalogAiHintFilter),
    [setFilteredCatalogCards, catalogAiHintFilter],
  );
  const rarityFilteredCatalogCards = useMemo(
    () =>
      filterCatalogCardsByRarity(
        aiHintFilteredCatalogCards,
        catalogRarityFilter,
      ),
    [aiHintFilteredCatalogCards, catalogRarityFilter],
  );
  const filteredCatalogCards = useMemo(
    () =>
      filterCatalogCardsByType(rarityFilteredCatalogCards, catalogTypeFilters),
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
    setCatalogSetAddons((current) => ({
      classic: catalogSetCounts.classic > 0 && current.classic,
      proteus: catalogSetCounts.proteus > 0 && current.proteus,
    }));
  }, [catalogSetCounts.classic, catalogSetCounts.proteus]);

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
        : (filteredCatalogCards[0]?.catalogCardId ?? null),
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
      .then(
        (response) => response.json() as Promise<{ card?: CatalogCardDetail }>,
      )
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
      .then((data) => {
        const cards = data.cards ?? [];
        setAllCatalogCards(cards.filter(isCatalogVisibleCard));
        setCatalogCardPresentationsById(catalogCardPresentationsFor(cards));
      })
      .catch(() => {
        setAllCatalogCards([]);
        setCatalogCardPresentationsById({});
      });
  }, []);

  return {
    allCatalogCards,
    catalogCardPresentationsById,
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
      setAddons: catalogSetAddons,
      setCounts: catalogSetCounts,
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
      onSetAddon: (addon: "classic" | "proteus", enabled: boolean) =>
        setCatalogSetAddons((current) => ({ ...current, [addon]: enabled })),
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
