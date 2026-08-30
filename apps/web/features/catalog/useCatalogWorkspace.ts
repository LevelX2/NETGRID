import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PlayerView, PublicGameEvent, Side } from "@netgrid/shared";

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

type CatalogWorkspacePayload = {
  eventTail: PublicGameEvent[];
  playerView: PlayerView;
};

export function useCatalogWorkspace(payload: CatalogWorkspacePayload | null) {
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
    const params = new URLSearchParams();
    if (catalogSearch.trim()) params.set("q", catalogSearch.trim());
    if (catalogSide !== "all") params.set("side", catalogSide);
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
  }, [catalogSearch, catalogSide]);

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
