"use client";

import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Side } from "@netgrid/shared";

import { CardImage } from "../../app/card-image-service";
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
} from "../../app/catalog-ui";
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

const CATALOG_STATUS_LABELS: Record<CatalogStatusKey, string> = {
  imported: "Importiert",
  validated: "Geprüft",
  catalog_ready: "Im Katalog",
  implemented: "Implementiert",
  engine_supported: "Engine",
  playable: "Runtime spielbar",
  human_playable: "Für Menschen spielbar",
  ai_supported: "KI geeignet",
  deck_legal: "Deckbau erlaubt",
  format_legal: "Im lokalen Format",
  blocked: "Blockiert"
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

function catalogImageMetricTooltip(detail: CatalogCardDetail | null | undefined): string | undefined {
  if (!detail) return undefined;
  const tooltipParts = [
    detail.numeric.installCost !== null ? `Installkosten: ${detail.numeric.installCost}` : null,
    detail.numeric.strength !== null ? `Stärke: ${detail.numeric.strength}` : null,
    detail.numeric.cost !== null ? `Kosten: ${detail.numeric.cost}` : null
  ].filter((value): value is string => value !== null);
  if (tooltipParts.length === 0) return undefined;
  return tooltipParts.join(" · ");
}
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
  const catalogImageSource = usePreferredCardImageSource(detail?.catalogCardId);
  const catalogImageUrl = catalogImageSource.src;
  const catalogImageTooltip = catalogImageMetricTooltip(detail);
  const showCatalogHardwareOverlay = Boolean(catalogImageUrl) && Boolean(detail) && isHardwareCardType(detail?.type) && hasGeneratedCardArt(detail?.catalogCardId);
  const showCatalogOperationOverlay = Boolean(catalogImageUrl) && Boolean(detail) && isOperationCardType(detail?.type) && hasGeneratedCardArt(detail?.catalogCardId);
  const catalogImagePreviewMode = showCatalogHardwareOverlay ? "hardware" : showCatalogOperationOverlay ? "operation" : "";
  const visibleStatusKeys = showExpertStatuses ? CATALOG_STATUS_FILTER_KEYS : PRIMARY_CATALOG_STATUS_KEYS;
  const availableStatusKeys = new Set(filters?.statuses ?? CATALOG_STATUS_FILTER_KEYS);
  const statusOptions = visibleStatusKeys.filter((value) => availableStatusKeys.has(value));
  const detailRarityLabel = detail ? catalogRarityLabel(detail) : null;
  const detailRef = useRef<HTMLElement | null>(null);
  const [catalogListHeight, setCatalogListHeight] = useState<number | null>(null);
  const selectedSetLabel = setOptions.find((option) => option.key === setFilter)?.label ?? setFilter;
  const selectedBlockStatusLabel = CATALOG_BLOCK_STATUS_FILTERS.find((filter) => filter.key === blockStatusFilter)?.label ?? blockStatusFilter;
  const selectedAiHintLabel = CATALOG_AI_HINT_FILTERS.find((filter) => filter.key === aiHintFilter)?.label ?? aiHintFilter;
  const selectedRarityLabel = CATALOG_RARITY_FILTERS.find((filter) => filter.key === rarityFilter)?.label ?? rarityFilter;
  const hasTypeFilter = Object.values(typeFilters).some((selected) => !selected);
  const activeFilterLabels = [
    search.trim() ? `Suche: ${search.trim()}` : null,
    setFilter !== "all" ? selectedSetLabel : null,
    side !== "all" ? side : null,
    status !== "all" ? CATALOG_STATUS_LABELS[status] : null,
    blockStatusFilter !== "all" ? selectedBlockStatusLabel : null,
    aiHintFilter !== "all" ? selectedAiHintLabel : null,
    rarityFilter !== "all" ? selectedRarityLabel : null,
    hasTypeFilter ? "Kartentypen" : null
  ].filter((label): label is string => Boolean(label));

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
          <h2>Katalog</h2>
          <p className="meta">
            {cards.length} Karten · {summary.human_playable ?? 0} für Menschen spielbar · {summary.ai_supported ?? 0} KI geeignet
          </p>
        </div>
      </div>
      <div className="catalogFilterBar">
        <button className="catalogFilterToggle" onClick={() => onFiltersOpen(!filtersOpen)} type="button" aria-expanded={filtersOpen}>
          <SlidersHorizontal size={16} />
          <span>Filter</span>
          <small>{activeFilterLabels.length > 0 ? activeFilterLabels.join(" · ") : "Alle Karten"}</small>
          {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {filtersOpen ? (
        <div className="catalogControls">
          <div className="searchBox catalogField">
            <label htmlFor="catalogSearch">Suche</label>
            <Search className="searchIcon" size={16} />
            <input id="catalogSearch" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Kartenname, Text, Subtyp" />
            {search ? (
              <button className="searchClearButton" onClick={() => onSearch("")} type="button" aria-label="Suche löschen" title="Suche löschen">
                <X size={14} />
              </button>
            ) : null}
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
            Seite
            <select value={side} onChange={(event) => onSide(event.target.value as Side | "all")}>
              <option value="all">Alle</option>
              {(filters?.sides ?? ["runner", "corp"]).map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => onStatus(event.target.value as CatalogStatusKey | "all")}>
              <option value="all">Alle</option>
              {statusOptions.map((value) => (
                <option value={value} key={value}>
                  {CATALOG_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Blockstatus
            <select value={blockStatusFilter} onChange={(event) => onBlockStatusFilter(event.target.value as CatalogBlockStatusFilterKey)}>
              {CATALOG_BLOCK_STATUS_FILTERS.map((filter) => (
                <option value={filter.key} key={filter.key}>
                  {filter.label} ({blockStatusCounts[filter.key]})
                </option>
              ))}
            </select>
          </label>
          <label>
            KI-Hinweise
            <select value={aiHintFilter} onChange={(event) => onAiHintFilter(event.target.value as CatalogAiHintFilterKey)}>
              {CATALOG_AI_HINT_FILTERS.map((filter) => (
                <option value={filter.key} key={filter.key}>
                  {filter.label} ({aiHintCounts[filter.key]})
                </option>
              ))}
            </select>
          </label>
          <label>
            Rarität
            <select value={rarityFilter} onChange={(event) => onRarity(event.target.value as CatalogRarityFilterKey)}>
              {CATALOG_RARITY_FILTERS.map((filter) => (
                <option value={filter.key} key={filter.key}>
                  {filter.label} ({rarityCounts[filter.key]})
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
            Expertenstatus
          </label>
          <fieldset className="catalogTypeFilters">
            <legend>Kartentypen</legend>
            <div className="typeFilterActions">
              <button type="button" onClick={onSelectAllTypes}>
                Alle
              </button>
              <button type="button" onClick={onClearTypeFilters}>
                Keine
              </button>
            </div>
            <div className="typeFilterGroups">
              {CATALOG_TYPE_FILTER_GROUPS.map((group) => (
                <div className={`typeFilterGroup ${group.side}`} key={group.title}>
                  <div className="typeFilterGroupTitle">{group.title}</div>
                  <div className="typeFilterGrid">
                    {group.filters.map((filter) => (
                      <label className={`typeToggle ${group.side} ${typeFilters[filter.key] ? "checked" : ""}`} key={filter.key}>
                        <input checked={typeFilters[filter.key]} onChange={(event) => onTypeFilter(filter.key, event.target.checked)} type="checkbox" />
                        <span>{filter.label}</span>
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
                {card.side} · {formatCatalogTypeLine(card)}
              </span>
              <StatusBadges
                statuses={card.statuses}
                compact
                labels={CATALOG_STATUS_LABELS}
                statusKeys={showExpertStatuses ? CATALOG_STATUS_FILTER_KEYS : PRIMARY_CATALOG_STATUS_KEYS}
              />
            </button>
          ))}
          {cards.length === 0 ? <p className="meta catalogEmpty">Keine Treffer.</p> : null}
        </div>
        <article className="catalogDetail" ref={detailRef}>
          {detail ? (
            <>
              <div className="catalogDetailHead">
                <div>
                  <h3>{detail.title}</h3>
                  <p className="meta">
                    {detail.side} · {formatCatalogTypeLine(detail)} · {detail.setName} #{detail.collectorNumber}
                  </p>
                </div>
                <span className={`sideBadge ${detail.side}`}>{detail.side}</span>
              </div>
              {catalogImageUrl ? (
                <div className={`catalogImagePreview ${catalogImagePreviewMode}`} {...(catalogImageTooltip ? { title: catalogImageTooltip } : {})}>
                  <CardImage src={catalogImageUrl} fallbackSrc={catalogImageSource.fallbackSrc} alt={`Kartenbild ${detail.title}`} priority {...(catalogImageTooltip ? { title: catalogImageTooltip } : {})} />
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
                </div>
              ) : null}
              <StatusBadges
                statuses={detail.statuses}
                labels={CATALOG_STATUS_LABELS}
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
                  <strong>{detail.engineCardId ? "ja" : "nein"}</strong>
                  engine
                </span>
                {detailRarityLabel ? (
                  <span>
                    <strong>{detailRarityLabel}</strong>
                    Rarität
                  </span>
                ) : null}
              </div>
              {detail.aiInspector || detail.aiHints ? (
                <CatalogAiHintPanel
                  hints={detail.aiHints ?? null}
                  inspector={detail.aiInspector ?? null}
                  aiSupportedLabel={CATALOG_STATUS_LABELS.ai_supported}
                />
              ) : null}
              {detail.blockReasons.length > 0 ? <p className="notice catalogNotice">{detail.blockReasons.join(" ")}</p> : null}
            </>
          ) : (
            <p className="meta">Keine Karte ausgewählt.</p>
          )}
        </article>
      </div>
    </section>
  );
}
