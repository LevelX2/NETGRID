"use client";

import {
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "use-intl/react";
import type { Side } from "@netgrid/shared";

import { CardImage } from "../cards/card-image-service";
import { cardMetricLine, formatCardTypeLine } from "../cards/card-text-lines";
import { CardSetPicker } from "../cards/CardSetPicker";
import { CardTextPreview } from "../cards/CardTextPreview";
import {
  CATALOG_RARITY_FILTERS,
  catalogRarityLabel,
  type CatalogProductSetKey,
  type CatalogRarityFilterKey,
  type CatalogProductSetSelection,
  type CatalogTypeFilterKey,
  type CatalogTypeFilterState,
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
  shouldAddFallbackSubroutineMarker,
} from "../cards/CardTextRendering";
import { usePreferredCardImageSource } from "../cards/card-display-settings";
import { CatalogAiHintPanel } from "./CatalogSupportPanels";

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

export function CatalogPanel({
  cards,
  detail,
  filters,
  search,
  side,
  setAddons,
  setCounts,
  selectedId,
  filtersOpen,
  rarityCounts,
  rarityFilter,
  typeCounts,
  typeFilters,
  onSearch,
  onSide,
  onSetAddon,
  onSelect,
  onFiltersOpen,
  onRarity,
  onTypeFilter,
  onSelectAllTypes,
  onClearTypeFilters,
}: {
  cards: CatalogCardSummary[];
  detail: CatalogCardDetail | null;
  filters: CatalogFilters | null;
  search: string;
  side: Side | "all";
  setAddons: CatalogProductSetSelection;
  setCounts: Record<CatalogProductSetKey, number>;
  selectedId: string | null;
  filtersOpen: boolean;
  rarityCounts: Record<CatalogRarityFilterKey, number>;
  rarityFilter: CatalogRarityFilterKey;
  typeCounts: Partial<Record<CatalogTypeFilterKey, number>>;
  typeFilters: CatalogTypeFilterState;
  onSearch(value: string): void;
  onSide(value: Side | "all"): void;
  onSetAddon(addon: "original" | "classic" | "proteus", enabled: boolean): void;
  onSelect(value: string): void;
  onFiltersOpen(value: boolean): void;
  onRarity(value: CatalogRarityFilterKey): void;
  onTypeFilter(key: CatalogTypeFilterKey, selected: boolean): void;
  onSelectAllTypes(): void;
  onClearTypeFilters(): void;
}) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const catalogImageSource = usePreferredCardImageSource(detail?.catalogCardId);
  const [catalogImageUnavailable, setCatalogImageUnavailable] = useState(false);
  useEffect(() => {
    setCatalogImageUnavailable(false);
  }, [
    detail?.catalogCardId,
    catalogImageSource.src,
    catalogImageSource.fallbackSrc,
  ]);

  const catalogImageUrl = catalogImageUnavailable
    ? undefined
    : catalogImageSource.src;
  const catalogImageTooltip = cardMetricLine(detail) || undefined;
  const showCatalogHardwareOverlay =
    Boolean(catalogImageUrl) &&
    Boolean(detail) &&
    isHardwareCardType(detail?.type) &&
    hasGeneratedCardArt(detail?.catalogCardId);
  const showCatalogOperationOverlay =
    Boolean(catalogImageUrl) &&
    Boolean(detail) &&
    isOperationCardType(detail?.type) &&
    hasGeneratedCardArt(detail?.catalogCardId);
  const catalogImagePreviewMode = showCatalogHardwareOverlay
    ? "hardware"
    : showCatalogOperationOverlay
      ? "operation"
      : "";
  const detailRarityLabel = detail
    ? ((locale === "en"
        ? detail.rarity?.labelEn || detail.rarity?.labelDe
        : detail.rarity?.labelDe) ?? catalogRarityLabel(detail))
    : null;
  const detailRef = useRef<HTMLElement | null>(null);
  const [catalogListHeight, setCatalogListHeight] = useState<number | null>(
    null,
  );
  const selectedRarityLabel = t(`rarityFilter.${rarityFilter}`);
  const hasTypeFilter = Object.values(typeFilters).some(
    (selected) => !selected,
  );
  const activeSpecialFilterLabels = [
    !setAddons.original ? t("setPicker.withoutOriginal") : null,
    !setAddons.classic ? t("setPicker.withoutClassic") : null,
    !setAddons.proteus ? t("setPicker.withoutProteus") : null,
    side !== "all" ? side : null,
    rarityFilter !== "all" ? selectedRarityLabel : null,
    hasTypeFilter ? t("cardTypes") : null,
  ].filter((label): label is string => Boolean(label));
  const resetSpecialFilters = () => {
    onSetAddon("original", true);
    onSetAddon("classic", true);
    onSetAddon("proteus", true);
    onSide("all");
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
      setCatalogListHeight(
        Math.max(380, Math.ceil(detailElement.getBoundingClientRect().height)),
      );
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
          <p className="meta">{t("summary", { cards: cards.length })}</p>
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
              <button
                className="searchClearButton"
                onClick={() => onSearch("")}
                type="button"
                aria-label={t("clearSearch")}
                title={t("clearSearch")}
              >
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
            title={
              activeSpecialFilterLabels.length > 0
                ? t("activeSpecialFilters", {
                    count: activeSpecialFilterLabels.length,
                  })
                : t("filter")
            }
          >
            <SlidersHorizontal size={16} />
            <span>{t("filter")}</span>
            {activeSpecialFilterLabels.length > 0 ? (
              <strong className="catalogFilterBadge">
                {activeSpecialFilterLabels.length}
              </strong>
            ) : null}
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
            <button
              className="button"
              type="button"
              onClick={resetSpecialFilters}
              disabled={activeSpecialFilterLabels.length === 0}
            >
              {t("resetSpecialFilters")}
            </button>
          </div>
          <CardSetPicker
            original={setAddons.original}
            originalSelectable
            classic={setAddons.classic}
            proteus={setAddons.proteus}
            baseDescription={t("setPicker.alwaysIncluded")}
            addonDescription={t("setPicker.includeAddon")}
            baseCount={setCounts.original}
            classicCount={setCounts.classic}
            proteusCount={setCounts.proteus}
            ariaLabel={t("setPicker.ariaLabel")}
            testIdPrefix="catalog-card-pool"
            className="catalogSetPicker"
            onSetChange={onSetAddon}
          />
          <label>
            {t("side")}
            <select
              value={side}
              onChange={(event) => onSide(event.target.value as Side | "all")}
            >
              <option value="all">{t("all")}</option>
              {(filters?.sides ?? ["runner", "corp"]).map((value) => (
                <option value={value} key={value}>
                  {t(`sideValue.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("rarity")}
            <select
              value={rarityFilter}
              onChange={(event) =>
                onRarity(event.target.value as CatalogRarityFilterKey)
              }
            >
              {CATALOG_RARITY_FILTERS.map((filter) => (
                <option value={filter.key} key={filter.key}>
                  {t(`rarityFilter.${filter.key}`)} ({rarityCounts[filter.key]})
                </option>
              ))}
            </select>
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
                <div
                  className={`typeFilterGroup ${group.side}`}
                  key={group.title}
                >
                  <div className="typeFilterGroupTitle">
                    {t(`sideValue.${group.side}`)}
                  </div>
                  <div className="typeFilterGrid">
                    {group.filters.map((filter) => (
                      <label
                        className={`typeToggle ${group.side} ${typeFilters[filter.key] ? "checked" : ""}`}
                        key={filter.key}
                      >
                        <input
                          checked={typeFilters[filter.key]}
                          onChange={(event) =>
                            onTypeFilter(filter.key, event.target.checked)
                          }
                          type="checkbox"
                        />
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
        <div
          className="catalogList"
          style={
            catalogListHeight
              ? { maxHeight: `${catalogListHeight}px` }
              : undefined
          }
        >
          {cards.map((card) => (
            <button
              className={`catalogItem ${selectedId === card.catalogCardId ? "active" : ""}`}
              key={card.catalogCardId}
              onClick={() => onSelect(card.catalogCardId)}
            >
              <strong>{card.title}</strong>
              <span>
                {t(`sideValue.${card.side}`)} · {formatCardTypeLine(card)}
              </span>
            </button>
          ))}
          {cards.length === 0 ? (
            <p className="meta catalogEmpty">{t("noResults")}</p>
          ) : null}
        </div>
        <article className="catalogDetail" ref={detailRef}>
          {detail ? (
            <>
              <div className="catalogDetailHead">
                <div>
                  <h3>{detail.title}</h3>
                  <p className="meta">
                    {t(`sideValue.${detail.side}`)} ·{" "}
                    {formatCardTypeLine(detail)} · {detail.setName} #
                    {detail.collectorNumber}
                  </p>
                </div>
                <span className={`sideBadge ${detail.side}`}>
                  {t(`sideValue.${detail.side}`)}
                </span>
              </div>
              <div
                className={`catalogImagePreview ${catalogImagePreviewMode} ${catalogImageUrl ? "hasImage" : "textFallback"}`}
                {...(catalogImageTooltip ? { title: catalogImageTooltip } : {})}
              >
                {catalogImageUrl ? (
                  <>
                    <CardImage
                      src={catalogImageUrl}
                      fallbackSrc={catalogImageSource.fallbackSrc}
                      variant="preview"
                      decorative
                      priority
                      onUnavailable={() => setCatalogImageUnavailable(true)}
                      {...(catalogImageTooltip
                        ? { title: catalogImageTooltip }
                        : {})}
                    />
                    {showCatalogHardwareOverlay ? (
                      <HardwareImageOverlay
                        title={detail.title}
                        rulesText={detail.text}
                        className="catalogHardwareOverlay"
                        {...(detail.numeric.installCost !== null
                          ? { installCost: detail.numeric.installCost }
                          : {})}
                      />
                    ) : showCatalogOperationOverlay ? (
                      <OperationImageOverlay
                        title={detail.title}
                        rulesText={detail.text}
                        className="catalogHardwareOverlay"
                        {...(detail.numeric.cost !== null
                          ? { cost: detail.numeric.cost }
                          : {})}
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
              <p className="catalogText">
                {rulesTextLines(detail.text).map((line, index) => (
                  <span
                    key={`${detail.catalogCardId}-rules-${index}`}
                    className={
                      isSubroutineRuleLine(detail.type, detail.text, line)
                        ? "subroutineLine"
                        : undefined
                    }
                  >
                    {shouldAddFallbackSubroutineMarker(
                      detail.type,
                      detail.text,
                      line,
                    ) ? (
                      <SubroutineIcon />
                    ) : null}
                    {renderRuleTextSegments(
                      line,
                      `${detail.catalogCardId}-rules-${index}`,
                    )}
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
                  aiSupportedLabel={t("status.ai_supported")}
                />
              ) : null}
              {detail.blockReasons.length > 0 ? (
                <p className="notice catalogNotice">
                  {detail.blockReasons.join(" ")}
                </p>
              ) : null}
            </>
          ) : (
            <p className="meta">{t("noCardSelected")}</p>
          )}
        </article>
      </div>
    </section>
  );
}
