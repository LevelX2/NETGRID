"use client";

import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "use-intl/react";
import type { Side } from "@netgrid/shared";

import { CardImage } from "../cards/card-image-service";
import { cardMetricLine, formatCardTypeLine } from "../cards/card-text-lines";
import { CardTextPreview } from "../cards/CardTextPreview";
import {
  CATALOG_AI_HINT_FILTERS,
  CATALOG_BLOCK_STATUS_FILTERS,
  CATALOG_RARITY_FILTERS,
  catalogRarityLabel,
  type CatalogAiHintFilterKey,
  type CatalogBlockStatusFilterKey,
  type CatalogSetIdFilterOption,
  type CatalogRarityFilterKey,
  type CatalogTypeFilterKey,
  type CatalogTypeFilterState
} from "./catalog-model";
import { type CatalogAiInspector } from "../../app/ai-hint-inspector-ui";
import {
  HardwareImageOverlay,
  OperationImageOverlay,
  SubroutineIcon,
  hasGeneratedCardArt,
  isHardwareCardType,
  isOperationCardType,
  isSubroutineRuleLine,
  renderRuleTextSegments,
  rulesTextLines,
  shouldAddFallbackSubroutineMarker
} from "../cards/CardTextRendering";
import { usePreferredCardImageSource } from "../cards/card-display-settings";
import { CatalogAiHintPanel, StatusBadges } from "./CatalogSupportPanels";

type CatalogStatusKey = "imported" | "validated" | "catalog_ready" | "implemented" | "engine_supported" | "playable" | "human_playable" | "ai_supported" | "deck_legal" | "format_legal" | "blocked";

type CatalogStatuses = Record<CatalogStatusKey, boolean>;

type CatalogAiHints = {
  roles: string[];
  planRoles: string[];
  requiredMechanics: string[];
  valueHints: Record<string, number>;
  riskTags: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  scenarioRefs: string[];
};

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
  aiInspectorSummary?: unknown;
};

type CatalogCardDetail = CatalogCardSummary & {
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null>;
  engineCardId: string | null;
  aiHints?: CatalogAiHints | null;
  aiInspector?: CatalogAiInspector | null;
};

type CatalogFilters = {
  sides: Side[];
  types: string[];
  statuses: CatalogStatusKey[];
};

const PRIMARY_CATALOG_STATUS_KEYS: CatalogStatusKey[] = ["human_playable", "deck_legal", "format_legal", "ai_supported", "blocked"];
const TECHNICAL_CATALOG_STATUS_KEYS: CatalogStatusKey[] = ["imported", "validated", "catalog_ready", "implemented", "engine_supported", "playable"];
const CATALOG_STATUS_FILTER_KEYS: CatalogStatusKey[] = [...PRIMARY_CATALOG_STATUS_KEYS, ...TECHNICAL_CATALOG_STATUS_KEYS];

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

export function CatalogPanel({
  cards,
  detail,
  filters,
  search,
  side,
  status,
  summary,
  setFilter,
  setOptions,
  selectedId,
  filtersOpen,
  showExpertStatuses,
  blockStatusCounts,
  blockStatusFilter,
  aiHintCounts,
  aiHintFilter,
  rarityCounts,
  rarityFilter,
  typeCounts,
  typeFilters,
  onSearch,
  onSide,
  onStatus,
  onSetFilter,
  onSelect,
  onFiltersOpen,
  onToggleExpertStatuses,
  onBlockStatusFilter,
  onAiHintFilter,
  onRarity,
  onTypeFilter,
  onSelectAllTypes,
  onClearTypeFilters
}: {
  cards: CatalogCardSummary[];
  detail: CatalogCardDetail | null;
  filters: CatalogFilters | null;
  search: string;
  side: Side | "all";
  status: CatalogStatusKey | "all";
  summary: Partial<Record<CatalogStatusKey, number>>;
  setFilter: string;
  setOptions: CatalogSetIdFilterOption[];
  selectedId: string | null;
  filtersOpen: boolean;
  showExpertStatuses: boolean;
  blockStatusCounts: Record<CatalogBlockStatusFilterKey, number>;
  blockStatusFilter: CatalogBlockStatusFilterKey;
  aiHintCounts: Record<CatalogAiHintFilterKey, number>;
  aiHintFilter: CatalogAiHintFilterKey;
  rarityCounts: Record<CatalogRarityFilterKey, number>;
  rarityFilter: CatalogRarityFilterKey;
  typeCounts: Partial<Record<CatalogTypeFilterKey, number>>;
  typeFilters: CatalogTypeFilterState;
  onSearch(value: string): void;
  onSide(value: Side | "all"): void;
  onStatus(value: CatalogStatusKey | "all"): void;
  onSetFilter(value: string): void;
  onSelect(value: string): void;
  onFiltersOpen(value: boolean): void;
  onToggleExpertStatuses(value: boolean): void;
  onBlockStatusFilter(value: CatalogBlockStatusFilterKey): void;
  onAiHintFilter(value: CatalogAiHintFilterKey): void;
  onRarity(value: CatalogRarityFilterKey): void;
  onTypeFilter(key: CatalogTypeFilterKey, selected: boolean): void;
  onSelectAllTypes(): void;
  onClearTypeFilters(): void;
}) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const statusLabels = Object.fromEntries(
    CATALOG_STATUS_FILTER_KEYS.map((key) => [key, t(`status.${key}`)]),
  ) as Record<CatalogStatusKey, string>;
  const catalogImageSource = usePreferredCardImageSource(detail?.catalogCardId);
  const [catalogImageUnavailable, setCatalogImageUnavailable] = useState(false);
  useEffect(() => {
    setCatalogImageUnavailable(false);
  }, [detail?.catalogCardId, catalogImageSource.src, catalogImageSource.fallbackSrc]);

  const catalogImageUrl = catalogImageUnavailable ? undefined : catalogImageSource.src;
  const catalogImageTooltip = cardMetricLine(detail) || undefined;
  const showCatalogHardwareOverlay = Boolean(catalogImageUrl) && Boolean(detail) && isHardwareCardType(detail?.type) && hasGeneratedCardArt(detail?.catalogCardId);
  const showCatalogOperationOverlay = Boolean(catalogImageUrl) && Boolean(detail) && isOperationCardType(detail?.type) && hasGeneratedCardArt(detail?.catalogCardId);
  const catalogImagePreviewMode = showCatalogHardwareOverlay ? "hardware" : showCatalogOperationOverlay ? "operation" : "";
  const visibleStatusKeys = showExpertStatuses ? CATALOG_STATUS_FILTER_KEYS : PRIMARY_CATALOG_STATUS_KEYS;
  const availableStatusKeys = new Set(filters?.statuses ?? CATALOG_STATUS_FILTER_KEYS);
  const statusOptions = visibleStatusKeys.filter((value) => availableStatusKeys.has(value));
  const detailRarityLabel = detail ? (locale === "en" ? detail.rarity?.labelEn || detail.rarity?.labelDe : detail.rarity?.labelDe) ?? catalogRarityLabel(detail) : null;
  const detailRef = useRef<HTMLElement | null>(null);
  const [catalogListHeight, setCatalogListHeight] = useState<number | null>(null);
  const selectedSetLabel = setOptions.find((option) => option.key === setFilter)?.label ?? setFilter;
  const selectedBlockStatusLabel = t(`blockFilter.${blockStatusFilter}`);
  const selectedAiHintLabel = t(`aiFilter.${aiHintFilter}`);
  const selectedRarityLabel = t(`rarityFilter.${rarityFilter}`);
  const hasTypeFilter = Object.values(typeFilters).some((selected) => !selected);
  const activeSpecialFilterLabels = [
    setFilter !== "all" ? selectedSetLabel : null,
    side !== "all" ? side : null,
    status !== "all" ? statusLabels[status] : null,
    blockStatusFilter !== "all" ? selectedBlockStatusLabel : null,
    aiHintFilter !== "all" ? selectedAiHintLabel : null,
    rarityFilter !== "all" ? selectedRarityLabel : null,
    hasTypeFilter ? t("cardTypes") : null
  ].filter((label): label is string => Boolean(label));
  const resetSpecialFilters = () => {
    onSetFilter("all");
    onSide("all");
    onStatus("all");
    onBlockStatusFilter("all");
    onAiHintFilter("all");
    onRarity("all");
    onSelectAllTypes();
  };

  useEffect(() => {
    const detailElement = detailRef.current;
    if (!detailElement) return;
    const syncListHeight = () => {
      if (!window.matchMedia("(min-width: 1081px)").matches) {
        setCatalogListHeight(null);
        return;
      }
      setCatalogListHeight(Math.max(380, Math.ceil(detailElement.getBoundingClientRect().height)));
    };
    syncListHeight();
    const observer = new ResizeObserver(syncListHeight);
    observer.observe(detailElement);
    window.addEventListener("resize", syncListHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncListHeight);
    };
  }, [detail?.catalogCardId]);

  return (
    <section className="catalogPanel panel">
      <div className="catalogHeader">
        <div>
          <h2>{t("title")}</h2>
          <p className="meta">
            {t("summary", {cards: cards.length, human: summary.human_playable ?? 0, ai: summary.ai_supported ?? 0})}
          </p>
        </div>
        <div className="catalogQuickTools">
          <div className="searchBox catalogQuickSearch">
            <Search className="searchIcon" size={16} aria-hidden="true" />
            <input
              id="catalogSearch"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("search")}
            />
            {search ? (
              <button className="searchClearButton" onClick={() => onSearch("")} type="button" aria-label={t("clearSearch")} title={t("clearSearch")}>
                <X size={14} />
              </button>
            ) : null}
          </div>
          <button
            className={`catalogFilterToggle${filtersOpen ? " open" : ""}${activeSpecialFilterLabels.length > 0 ? " filtered" : ""}`}
            onClick={() => onFiltersOpen(!filtersOpen)}
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="catalogAdvancedFilters"
            title={activeSpecialFilterLabels.length > 0 ? t("activeSpecialFilters", {count: activeSpecialFilterLabels.length}) : t("filter")}
          >
            <SlidersHorizontal size={16} />
            <span>{t("filter")}</span>
            {activeSpecialFilterLabels.length > 0 ? <strong className="catalogFilterBadge">{activeSpecialFilterLabels.length}</strong> : null}
            {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {filtersOpen ? (
        <div className="catalogControls" id="catalogAdvancedFilters">
          <div className="catalogAdvancedHeader">
            <span>
              {activeSpecialFilterLabels.length > 0
                ? activeSpecialFilterLabels.join(" · ")
                : t("noSpecialFilters")}
            </span>
            <button className="button" type="button" onClick={resetSpecialFilters} disabled={activeSpecialFilterLabels.length === 0}>
              {t("resetSpecialFilters")}
            </button>
          </div>
          <label>
            Set
            <select value={setFilter} onChange={(event) => onSetFilter(event.target.value)}>
              {setOptions.map((option) => (
                <option value={option.key} key={option.key}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("side")}
            <select value={side} onChange={(event) => onSide(event.target.value as Side | "all")}>
              <option value="all">{t("all")}</option>
              {(filters?.sides ?? ["runner", "corp"]).map((value) => (
                <option value={value} key={value}>
                  {t(`sideValue.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => onStatus(event.target.value as CatalogStatusKey | "all")}>
              <option value="all">{t("all")}</option>
              {statusOptions.map((value) => (
                <option value={value} key={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("blockStatus")}
            <select value={blockStatusFilter} onChange={(event) => onBlockStatusFilter(event.target.value as CatalogBlockStatusFilterKey)}>
              {CATALOG_BLOCK_STATUS_FILTERS.map((filter) => (
                <option value={filter.key} key={filter.key}>
                  {t(`blockFilter.${filter.key}`)} ({blockStatusCounts[filter.key]})
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("aiHints")}
            <select value={aiHintFilter} onChange={(event) => onAiHintFilter(event.target.value as CatalogAiHintFilterKey)}>
              {CATALOG_AI_HINT_FILTERS.map((filter) => (
                <option value={filter.key} key={filter.key}>
                  {t(`aiFilter.${filter.key}`)} ({aiHintCounts[filter.key]})
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("rarity")}
            <select value={rarityFilter} onChange={(event) => onRarity(event.target.value as CatalogRarityFilterKey)}>
              {CATALOG_RARITY_FILTERS.map((filter) => (
                <option value={filter.key} key={filter.key}>
                  {t(`rarityFilter.${filter.key}`)} ({rarityCounts[filter.key]})
                </option>
              ))}
            </select>
          </label>
          <label className="catalogExpertToggle">
            <input
              checked={showExpertStatuses}
              onChange={(event) => {
                const next = event.target.checked;
                onToggleExpertStatuses(next);
                if (!next && status !== "all" && !PRIMARY_CATALOG_STATUS_KEYS.includes(status)) onStatus("all");
              }}
              type="checkbox"
            />
            {t("expertStatus")}
          </label>
          <fieldset className="catalogTypeFilters">
            <legend>{t("cardTypes")}</legend>
            <div className="typeFilterActions">
              <button type="button" onClick={onSelectAllTypes}>
                {t("all")}
              </button>
              <button type="button" onClick={onClearTypeFilters}>
                {t("none")}
              </button>
            </div>
            <div className="typeFilterGroups">
              {CATALOG_TYPE_FILTER_GROUPS.map((group) => (
                <div className={`typeFilterGroup ${group.side}`} key={group.title}>
                  <div className="typeFilterGroupTitle">{t(`sideValue.${group.side}`)}</div>
                  <div className="typeFilterGrid">
                    {group.filters.map((filter) => (
                      <label className={`typeToggle ${group.side} ${typeFilters[filter.key] ? "checked" : ""}`} key={filter.key}>
                        <input checked={typeFilters[filter.key]} onChange={(event) => onTypeFilter(filter.key, event.target.checked)} type="checkbox" />
                        <span>{t(`type.${filter.key}`)}</span>
                        <small>{typeCounts[filter.key] ?? 0}</small>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
      <div className="catalogLayout">
        <div className="catalogList" style={catalogListHeight ? { maxHeight: `${catalogListHeight}px` } : undefined}>
          {cards.map((card) => (
            <button className={`catalogItem ${selectedId === card.catalogCardId ? "active" : ""}`} key={card.catalogCardId} onClick={() => onSelect(card.catalogCardId)}>
              <strong>{card.title}</strong>
              <span>
                {t(`sideValue.${card.side}`)} · {formatCardTypeLine(card)}
              </span>
              <StatusBadges
                statuses={card.statuses}
                compact
                labels={statusLabels}
                statusKeys={showExpertStatuses ? CATALOG_STATUS_FILTER_KEYS : PRIMARY_CATALOG_STATUS_KEYS}
              />
            </button>
          ))}
          {cards.length === 0 ? <p className="meta catalogEmpty">{t("noResults")}</p> : null}
        </div>
        <article className="catalogDetail" ref={detailRef}>
          {detail ? (
            <>
              <div className="catalogDetailHead">
                <div>
                  <h3>{detail.title}</h3>
                  <p className="meta">
                    {t(`sideValue.${detail.side}`)} · {formatCardTypeLine(detail)} · {detail.setName} #{detail.collectorNumber}
                  </p>
                </div>
                <span className={`sideBadge ${detail.side}`}>{t(`sideValue.${detail.side}`)}</span>
              </div>
              <div className={`catalogImagePreview ${catalogImagePreviewMode} ${catalogImageUrl ? "hasImage" : "textFallback"}`} {...(catalogImageTooltip ? { title: catalogImageTooltip } : {})}>
                {catalogImageUrl ? (
                  <>
                    <CardImage
                      src={catalogImageUrl}
                      fallbackSrc={catalogImageSource.fallbackSrc}
                      variant="preview"
                      decorative
                      priority
                      onUnavailable={() => setCatalogImageUnavailable(true)}
                      {...(catalogImageTooltip ? { title: catalogImageTooltip } : {})}
                    />
                    {showCatalogHardwareOverlay ? (
                      <HardwareImageOverlay
                        title={detail.title}
                        rulesText={detail.text}
                        className="catalogHardwareOverlay"
                        {...(detail.numeric.installCost !== null ? { installCost: detail.numeric.installCost } : {})}
                      />
                    ) : showCatalogOperationOverlay ? (
                      <OperationImageOverlay
                        title={detail.title}
                        rulesText={detail.text}
                        className="catalogHardwareOverlay"
                        {...(detail.numeric.cost !== null ? { cost: detail.numeric.cost } : {})}
                      />
                    ) : null}
                  </>
                ) : (
                  <CardTextPreview
                    title={detail.title}
                    cardType={detail.type}
                    typeLine={formatCardTypeLine(detail)}
                    metricLine={cardMetricLine(detail)}
                    rulesText={detail.text}
                    density="preview"
                  />
                )}
              </div>
              <StatusBadges
                statuses={detail.statuses}
                labels={statusLabels}
                statusKeys={showExpertStatuses ? CATALOG_STATUS_FILTER_KEYS : PRIMARY_CATALOG_STATUS_KEYS}
              />
              <p className="catalogText">
                {rulesTextLines(detail.text).map((line, index) => (
                  <span key={`${detail.catalogCardId}-rules-${index}`} className={isSubroutineRuleLine(detail.type, detail.text, line) ? "subroutineLine" : undefined}>
                    {shouldAddFallbackSubroutineMarker(detail.type, detail.text, line) ? <SubroutineIcon /> : null}
                    {renderRuleTextSegments(line, `${detail.catalogCardId}-rules-${index}`)}
                  </span>
                ))}
              </p>
              <div className="catalogMetaGrid">
                {Object.entries(detail.numeric)
                  .filter(([, value]) => value !== null)
                  .map(([key, value]) => (
                    <span key={key}>
                      <strong>{value}</strong>
                      {key}
                    </span>
                  ))}
                <span>
                  <strong>{detail.engineCardId ? t("yes") : t("no")}</strong>
                  engine
                </span>
                {detailRarityLabel ? (
                  <span>
                    <strong>{detailRarityLabel}</strong>
                    {t("rarity")}
                  </span>
                ) : null}
              </div>
              {detail.aiInspector || detail.aiHints ? (
                <CatalogAiHintPanel
                  hints={detail.aiHints ?? null}
                  inspector={detail.aiInspector ?? null}
                  aiSupportedLabel={statusLabels.ai_supported}
                />
              ) : null}
              {detail.blockReasons.length > 0 ? <p className="notice catalogNotice">{detail.blockReasons.join(" ")}</p> : null}
            </>
          ) : (
            <p className="meta">{t("noCardSelected")}</p>
          )}
        </article>
      </div>
    </section>
  );
}
