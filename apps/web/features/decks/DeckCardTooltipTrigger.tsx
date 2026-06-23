"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { CardImage } from "../../app/card-image-service";
import { catalogSetDetailLabel } from "../../app/catalog-ui";
import {
  HardwareImageOverlay,
  OperationImageOverlay,
  SubroutineIcon,
  hasGeneratedCardArt,
  isSubroutineRuleLine,
  renderRuleTextSegments,
  rulesTextLines,
  shouldAddFallbackSubroutineMarker,
} from "../cards/CardTextRendering";
import { neededDevelopmentLabel } from "../cards/card-detail-lines";
import {
  useCardScaleSettings,
  useCardTooltipSettings,
  usePreferredCardImageSource,
} from "../cards/card-display-settings";
import { CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS } from "../settings/settings-model";

type DeckTooltipCard = {
  catalogCardId: string;
  title: string;
  type: string;
  subtypes: string[];
};

type DeckTooltipDetail = DeckTooltipCard & {
  side: string;
  setId: string;
  setName: string;
  collectorNumber: string;
  text: string;
  numeric: Record<string, number | null | undefined>;
  definitionId?: string;
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

export function DeckCardTooltipTrigger({
  card,
  detail,
  cardId,
  className,
  style,
  onSelect,
  children
}: {
  card: DeckTooltipCard | null;
  detail: DeckTooltipDetail | undefined;
  cardId: string;
  className: string;
  style?: CSSProperties;
  onSelect(): void;
  children: ReactNode;
}) {
  const { hoverOpenDelayMs, mode: tooltipMode } = useCardTooltipSettings();
  const { tooltipPercent } = useCardScaleSettings();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltipPositionStyle, setTooltipPositionStyle] = useState<CSSProperties>({});
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const [tooltipHoverVisible, setTooltipHoverVisible] = useState(false);
  const [tooltipFocusVisible, setTooltipFocusVisible] = useState(false);

  const detailLines = card && detail ? catalogDetailLines(detail) : [];
  const rulesText = card && detail ? detail.text : "";
  const hasRulesLines = rulesText.length > 0;
  const tooltipText = card ? deckBuilderCardTooltip(card, detail) : cardId;
  const tooltipImageId = detail?.definitionId ?? detail?.catalogCardId ?? card?.catalogCardId ?? cardId;
  const overlayImageId = detail?.definitionId;
  const tooltipImageSource = usePreferredCardImageSource(tooltipImageId);
  const tooltipImageUrl = tooltipImageSource.src;
  const showImageTooltip = tooltipMode === "image" && Boolean(tooltipImageUrl);
  const hasTooltipTextContent = Boolean(card && (card.title || detailLines.length > 0 || hasRulesLines));
  const tooltipEnabled = Boolean(card) && (showImageTooltip || hasTooltipTextContent);
  const tooltipId = tooltipEnabled && card ? `deck-card-tooltip-${card.catalogCardId.replace(/[^A-Za-z0-9_-]/g, "-")}` : undefined;
  const nativeTitle = tooltipEnabled ? undefined : tooltipText;
  const tooltipStats = detail
    ? [
        detail.numeric.cost !== null && detail.numeric.cost !== undefined ? { icon: "¢", label: "Kosten", value: String(detail.numeric.cost) } : null,
        detail.numeric.installCost !== null && detail.numeric.installCost !== undefined ? { icon: "↓", label: "Install", value: String(detail.numeric.installCost) } : null,
        detail.numeric.rezCost !== null && detail.numeric.rezCost !== undefined ? { icon: "R", label: "Rez", value: String(detail.numeric.rezCost) } : null,
        detail.numeric.trashCost !== null && detail.numeric.trashCost !== undefined ? { icon: "🗑", label: "Trash", value: String(detail.numeric.trashCost) } : null,
        detail.numeric.strength !== null && detail.numeric.strength !== undefined ? { icon: "⚔", label: "Stärke", value: String(detail.numeric.strength) } : null,
        detail.numeric.memoryCost !== null && detail.numeric.memoryCost !== undefined ? { icon: "MU", label: "MU", value: String(detail.numeric.memoryCost) } : null,
        detail.numeric.advancementRequirement !== null && detail.numeric.advancementRequirement !== undefined ? { icon: "⟐", label: "Benötigt", value: String(detail.numeric.advancementRequirement) } : null
      ].filter((entry): entry is { icon: string; label: string; value: string } => entry !== null)
    : [];
  const showHardwareOverlay = Boolean(tooltipImageUrl) && card?.type === "hardware" && Boolean(overlayImageId) && hasGeneratedCardArt(overlayImageId);
  const showOperationOverlay = Boolean(tooltipImageUrl) && card?.type === "operation" && Boolean(overlayImageId) && hasGeneratedCardArt(overlayImageId);
  const hasSubroutineMarkers = rulesTextLines(rulesText).some((line) => isSubroutineRuleLine(card?.type ?? "", rulesText, line));
  const tooltipScale = Math.max(0.5, tooltipPercent / 100);
  const showTooltip = tooltipEnabled && (tooltipHoverVisible || tooltipFocusVisible);

  const clearTooltipOpenTimer = () => {
    if (tooltipOpenTimerRef.current !== null) {
      clearTimeout(tooltipOpenTimerRef.current);
      tooltipOpenTimerRef.current = null;
    }
  };

  const clearTooltipCloseTimer = () => {
    if (tooltipCloseTimerRef.current !== null) {
      clearTimeout(tooltipCloseTimerRef.current);
      tooltipCloseTimerRef.current = null;
    }
  };

  const estimatedTooltipHeight = (): number => {
    if (showImageTooltip) return 320;
    const ruleLineCount = rulesTextLines(rulesText).length;
    const base = tooltipMode === "enhanced" ? 132 : 78;
    return Math.min(320, Math.round((base + ruleLineCount * 20) * tooltipScale));
  };

  const computedTooltipWidth = (): number => {
    const viewportLimit = Math.max(160, window.innerWidth - 32);
    const unscaled = showImageTooltip ? 220 : 300;
    return Math.min(Math.round(unscaled * tooltipScale), viewportLimit);
  };

  const updateTooltipPlacement = () => {
    const element = triggerRef.current;
    if (!element) return;
    const cardRect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - cardRect.bottom;
    const spaceAbove = cardRect.top;
    const tooltipHeight = estimatedTooltipHeight();
    const nextTooltipPlacement = spaceBelow < tooltipHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (tooltipEnabled) {
      const tooltipWidth = computedTooltipWidth();
      const margin = 16;
      const left = Math.max(margin, Math.min(cardRect.left + 6, window.innerWidth - tooltipWidth - margin));
      setTooltipPositionStyle(
        nextTooltipPlacement === "below"
          ? { left: `${left}px`, top: `${cardRect.bottom + 8}px`, width: `${tooltipWidth}px` }
          : { left: `${left}px`, top: `${cardRect.top - 8}px`, width: `${tooltipWidth}px` }
      );
    }
    if (tooltipEnabled) setTooltipPlacement(nextTooltipPlacement);
  };

  const scheduleTooltipOpen = () => {
    if (!tooltipEnabled) return;
    clearTooltipCloseTimer();
    if (tooltipHoverVisible) return;
    clearTooltipOpenTimer();
    tooltipOpenTimerRef.current = setTimeout(() => {
      tooltipOpenTimerRef.current = null;
      setTooltipHoverVisible(true);
    }, hoverOpenDelayMs);
  };

  const scheduleTooltipClose = () => {
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    tooltipCloseTimerRef.current = setTimeout(() => {
      tooltipCloseTimerRef.current = null;
      setTooltipHoverVisible(false);
    }, CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    if (tooltipEnabled) return;
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setTooltipPositionStyle({});
  }, [tooltipEnabled]);

  useEffect(() => {
    if (!showTooltip) return;
    updateTooltipPlacement();
  }, [showTooltip, tooltipMode]);

  useEffect(
    () => () => {
      clearTooltipOpenTimer();
      clearTooltipCloseTimer();
    },
    []
  );

  return (
    <article
      className={className}
      style={style}
      onClick={onSelect}
      ref={triggerRef}
      title={nativeTitle}
      aria-describedby={tooltipId}
      onFocus={(event) => {
        updateTooltipPlacement();
        if (tooltipEnabled && event.currentTarget.matches(":focus-visible")) setTooltipFocusVisible(true);
      }}
      onBlur={() => setTooltipFocusVisible(false)}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        updateTooltipPlacement();
        scheduleTooltipOpen();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        scheduleTooltipClose();
      }}
    >
      {children}
      {showTooltip && tooltipId && card ? (
        <span
          className={`cardTooltip ${tooltipPlacement} mode-${tooltipMode}${showImageTooltip ? " imageOnly" : ""}${showTooltip ? " visible" : ""}`}
          id={tooltipId}
          role="tooltip"
          style={tooltipPositionStyle}
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            clearTooltipCloseTimer();
            clearTooltipOpenTimer();
            if (!tooltipHoverVisible) setTooltipHoverVisible(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "touch") return;
            scheduleTooltipClose();
          }}
        >
          {showImageTooltip ? (
            <>
              {showHardwareOverlay ? <HardwareImageOverlay title={card.title} rulesText={rulesText} installCost={detail?.numeric.installCost} /> : null}
              {showOperationOverlay ? <OperationImageOverlay title={card.title} rulesText={rulesText} cost={detail?.numeric.cost} /> : null}
              <CardImage className="cardTooltipImage" src={tooltipImageUrl} fallbackSrc={tooltipImageSource.fallbackSrc} alt={`Kartenbild ${card.title ?? "Karte"}`} />
            </>
          ) : (
            <>
              <strong>{card.title}</strong>
              {tooltipMode === "enhanced" ? (
                <span className="cardTooltipStats">
                  {tooltipStats.map((stat) => (
                    <span key={`${card.catalogCardId}-tooltip-stat-${stat.label}`} className="cardTooltipStat" title={stat.label}>
                      <span className="icon">{stat.icon}</span>
                      <span>{stat.value}</span>
                    </span>
                  ))}
                </span>
              ) : null}
              {tooltipMode === "enhanced"
                ? detailLines.map((line) => (
                    <span key={`${card.catalogCardId}-tooltip-detail-${line}`}>{line}</span>
                  ))
                : null}
              <span className="cardTooltipText">
                {rulesTextLines(rulesText).map((line, index) => (
                  <span key={`${card.catalogCardId}-tooltip-rules-${index}`} className={hasSubroutineMarkers ? "subroutineLine" : undefined}>
                    {shouldAddFallbackSubroutineMarker(card.type, rulesText, line) ? <SubroutineIcon /> : null}
                    {renderRuleTextSegments(line, `${card.catalogCardId}-tooltip-rules-${index}`)}
                  </span>
                ))}
              </span>
            </>
          )}
        </span>
      ) : null}
    </article>
  );
}

function catalogDetailLines(card: DeckTooltipDetail): string[] {
  const typeLine = [card.side, formatCatalogTypeLine(card)].filter(Boolean).join(" · ");
  const setLine = catalogSetDetailLabel(card);
  const numberLine = Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = card.numeric[key];
      return catalogNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
  return [typeLine, setLine, numberLine].filter((line): line is string => Boolean(line));
}

function deckBuilderCardTooltip(card: DeckTooltipCard, detail: DeckTooltipDetail | undefined): string {
  return [card.title, formatCatalogTypeLine(card), detail ? catalogSetDetailLabel(detail) : "", detail ? deckBuilderMetricLine(detail) : "", detail?.text ?? ""].filter(Boolean).join("\n");
}

function deckBuilderMetricLine(detail: DeckTooltipDetail | undefined): string {
  if (!detail) return "";
  return Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = detail.numeric[key];
      return catalogNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
}

function catalogNumericLabel(key: string, label: string, value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (key === "advancementRequirement") return neededDevelopmentLabel(value);
  return `${label} ${value}`;
}

function formatCatalogTypeLine(card: Pick<DeckTooltipCard, "type" | "subtypes">): string {
  const type = formatCatalogTerm(card.type);
  const subtypes = card.subtypes.map(formatCatalogTerm).join(" / ");
  return [type, subtypes].filter(Boolean).join(" - ");
}

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
