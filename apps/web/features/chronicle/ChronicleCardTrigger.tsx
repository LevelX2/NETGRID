"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { shouldActivateChronicleCardTouchDoubleTap } from "../../app/chronicleInteraction";
import { CardImage } from "../cards/card-image-service";
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
import {
  CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS,
  CARD_TOOLTIP_PIN_EVENT,
  type CardDisplayMode,
} from "../settings/settings-model";
import {
  useCardScaleSettings,
  useCardTooltipSettings,
  usePreferredCardImageSource,
} from "../cards/card-display-settings";

type ChronicleTriggerCard = {
  catalogCardId: string;
  title: string;
  type: string;
  text: string;
  numeric: Record<"cost" | "installCost" | "rezCost" | "trashCost" | "strength" | "memoryCost", number | null | undefined>;
};

type ChronicleTriggerItem = {
  id: string;
  cardDetailLines: string[];
};

export function ChronicleCardTrigger({
  className,
  card,
  item,
  displayMode,
  disabled,
  title,
  onClick,
  children
}: {
  className: string;
  card: ChronicleTriggerCard | null;
  item: ChronicleTriggerItem;
  displayMode: CardDisplayMode;
  disabled: boolean;
  title: string;
  onClick(): void;
  children: ReactNode;
}) {
  const { hoverOpenDelayMs, mode: tooltipMode } = useCardTooltipSettings();
  const { tooltipPercent } = useCardScaleSettings();
  const tooltipViewId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTapRef = useRef(0);
  const [tooltipHoverVisible, setTooltipHoverVisible] = useState(false);
  const [tooltipFocusVisible, setTooltipFocusVisible] = useState(false);
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const [tooltipPositionStyle, setTooltipPositionStyle] = useState<CSSProperties>({});

  const imageSource = usePreferredCardImageSource(card?.catalogCardId);
  const imageUrl = imageSource.src;
  const showImageTooltip = tooltipMode === "image" && Boolean(imageUrl);
  const rulesLines = card ? rulesTextLines(card.text) : [];
  const hasTooltipTextContent = Boolean(card && (card.title || item.cardDetailLines.length > 0 || rulesLines.length > 0));
  const tooltipEnabled = Boolean(card) && !disabled && (showImageTooltip || hasTooltipTextContent);
  const showTooltip = tooltipEnabled && (tooltipHoverVisible || tooltipFocusVisible);
  const cardType = card?.type ?? "";
  const tooltipId =
    tooltipEnabled && card
      ? `chronicle-card-tooltip-${`${card.catalogCardId}-${item.id}`.replace(/[^A-Za-z0-9_-]/g, "-")}`
      : undefined;
  const tooltipOwnerId = `chronicle-card-tooltip-${tooltipViewId}`;
  const hasGeneratedImage = hasGeneratedCardArt(card?.catalogCardId);
  const showHardwareOverlay = Boolean(imageUrl) && displayMode === "placeholder" && isHardwareCardType(cardType) && hasGeneratedImage;
  const showOperationOverlay = Boolean(imageUrl) && displayMode === "placeholder" && isOperationCardType(cardType) && hasGeneratedImage;
  const cardTypeClassName = chronicleCardTypeClassName(card?.type);
  const tooltipStats = card
    ? [
        card.numeric.cost !== null ? { icon: "¢", label: "Kosten", value: String(card.numeric.cost) } : null,
        card.numeric.installCost !== null ? { icon: "↓", label: "Install", value: String(card.numeric.installCost) } : null,
        card.numeric.rezCost !== null ? { icon: "R", label: "Rez", value: String(card.numeric.rezCost) } : null,
        card.numeric.trashCost !== null ? { icon: "🗑", label: "Trash", value: String(card.numeric.trashCost) } : null,
        card.numeric.strength !== null ? { icon: "⚔", label: "Stärke", value: String(card.numeric.strength) } : null,
        card.numeric.memoryCost !== null ? { icon: "MU", label: "MU", value: String(card.numeric.memoryCost) } : null
      ].filter((entry): entry is { icon: string; label: string; value: string } => entry !== null)
    : [];
  const tooltipScale = Math.max(0.5, tooltipPercent / 100);

  const clearOpenTimer = () => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const estimatedTooltipHeight = (): number => {
    if (showImageTooltip) return 320;
    const base = tooltipMode === "enhanced" ? 132 : 78;
    return Math.min(320, Math.round((base + rulesLines.length * 20) * tooltipScale));
  };

  const computedTooltipWidth = (): number => {
    const viewportLimit = Math.max(160, window.innerWidth - 32);
    const unscaled = showImageTooltip ? 220 : 300;
    return Math.min(Math.round(unscaled * tooltipScale), viewportLimit);
  };

  const updateTooltipPlacement = () => {
    const element = triggerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const tooltipHeight = estimatedTooltipHeight();
    const nextPlacement = spaceBelow < tooltipHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (tooltipEnabled) {
      const tooltipWidth = computedTooltipWidth();
      const margin = 16;
      const left = Math.max(margin, Math.min(rect.left + 6, window.innerWidth - tooltipWidth - margin));
      setTooltipPositionStyle(
        nextPlacement === "below"
          ? { left: `${left}px`, top: `${rect.bottom + 8}px`, width: `${tooltipWidth}px` }
          : { left: `${left}px`, top: `${rect.top - 8}px`, width: `${tooltipWidth}px` }
      );
      setTooltipPlacement(nextPlacement);
    }
  };

  const scheduleOpen = () => {
    if (!tooltipEnabled) return;
    clearCloseTimer();
    if (tooltipHoverVisible) return;
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setTooltipHoverVisible(true);
    }, hoverOpenDelayMs);
  };

  const scheduleClose = () => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setTooltipHoverVisible(false);
    }, CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS);
  };

  const closeTooltip = () => {
    clearOpenTimer();
    clearCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
  };

  const openTouchTooltip = () => {
    clearOpenTimer();
    clearCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(true);
    window.dispatchEvent(new CustomEvent(CARD_TOOLTIP_PIN_EVENT, { detail: { ownerId: tooltipOwnerId } }));
  };

  const activateCardPreview = () => {
    if (disabled) return;
    onClick();
  };

  useEffect(() => {
    if (tooltipEnabled) return;
    clearOpenTimer();
    clearCloseTimer();
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
      clearOpenTimer();
      clearCloseTimer();
    },
    []
  );

  useEffect(() => {
    const closeWhenOtherTooltipOpens = (event: Event) => {
      const ownerId = event instanceof CustomEvent ? (event.detail as { ownerId?: unknown } | null)?.ownerId : undefined;
      if (ownerId === tooltipOwnerId) return;
      closeTooltip();
    };
    window.addEventListener(CARD_TOOLTIP_PIN_EVENT, closeWhenOtherTooltipOpens);
    return () => window.removeEventListener(CARD_TOOLTIP_PIN_EVENT, closeWhenOtherTooltipOpens);
  }, [tooltipOwnerId]);

  useEffect(() => {
    if (!tooltipFocusVisible) return;
    const closeFocusedTooltipOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const triggerElement = triggerRef.current;
      if (triggerElement?.contains(target)) return;
      closeTooltip();
    };
    window.addEventListener("pointerdown", closeFocusedTooltipOnOutsidePointer, true);
    return () => window.removeEventListener("pointerdown", closeFocusedTooltipOnOutsidePointer, true);
  }, [tooltipFocusVisible]);

  return (
    <button
      ref={triggerRef}
      className={`${className}${cardTypeClassName ? ` ${cardTypeClassName}` : ""}`}
      type="button"
      disabled={disabled}
      onClick={activateCardPreview}
      title={title}
      aria-describedby={tooltipId}
      onFocus={(event) => {
        updateTooltipPlacement();
        if (tooltipEnabled && event.currentTarget.matches(":focus-visible")) setTooltipFocusVisible(true);
      }}
      onBlur={() => setTooltipFocusVisible(false)}
      onDoubleClick={(event) => {
        if (disabled) return;
        event.preventDefault();
        activateCardPreview();
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        updateTooltipPlacement();
        scheduleOpen();
      }}
      onPointerUp={(event) => {
        if (event.pointerType !== "touch" || disabled) return;
        updateTooltipPlacement();
        if (tooltipEnabled) openTouchTooltip();
        const now = Date.now();
        const previousTapMs = lastTouchTapRef.current;
        lastTouchTapRef.current = now;
        if (shouldActivateChronicleCardTouchDoubleTap(previousTapMs, now)) {
          event.preventDefault();
          activateCardPreview();
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        scheduleClose();
      }}
    >
      {children}
      {showTooltip && tooltipId && card ? (
        <span
          className={`chronicleCardTooltip ${tooltipPlacement} mode-${tooltipMode}${showImageTooltip ? " imageOnly" : ""}${showTooltip ? " visible" : ""}`}
          id={tooltipId}
          role="tooltip"
          style={tooltipPositionStyle}
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            clearCloseTimer();
            clearOpenTimer();
            if (!tooltipHoverVisible) setTooltipHoverVisible(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "touch") return;
            scheduleClose();
          }}
        >
          {showImageTooltip ? (
            <span className={`chronicleCardImageFrame ${showHardwareOverlay || showOperationOverlay ? "withOverlay" : ""}`}>
              <CardImage className="chronicleCardImage" src={imageUrl} fallbackSrc={imageSource.fallbackSrc} alt={`Kartenbild ${card.title}`} />
              {showHardwareOverlay ? (
                <HardwareImageOverlay
                  title={card.title}
                  rulesText={card.text}
                  className="chronicleHardwareOverlay"
                  maxLines={2}
                  {...(typeof card.numeric.installCost === "number" ? { installCost: card.numeric.installCost } : {})}
                />
              ) : showOperationOverlay ? (
                <OperationImageOverlay
                  title={card.title}
                  rulesText={card.text}
                  className="chronicleHardwareOverlay"
                  maxLines={2}
                  {...(typeof card.numeric.cost === "number" ? { cost: card.numeric.cost } : {})}
                />
              ) : null}
            </span>
          ) : (
            <>
              <strong>{card.title}</strong>
              {tooltipMode === "enhanced" ? (
                <span className="cardTooltipStats">
                  {tooltipStats.map((stat) => (
                    <span key={`${card.catalogCardId}-chronicle-tooltip-stat-${stat.label}`} className="cardTooltipStat" title={stat.label}>
                      <span className="icon">{stat.icon}</span>
                      <span>{stat.value}</span>
                    </span>
                  ))}
                </span>
              ) : null}
              {tooltipMode === "enhanced"
                ? item.cardDetailLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))
                : null}
              <span className="cardTooltipText">
                {rulesLines.map((line, index) => (
                  <span key={`${card.catalogCardId}-chronicle-tooltip-rules-${index}`} className={isSubroutineRuleLine(card.type, card.text, line) ? "subroutineLine" : undefined}>
                    {shouldAddFallbackSubroutineMarker(card.type, card.text, line) ? <SubroutineIcon /> : null}
                    {renderRuleTextSegments(line, `${card.catalogCardId}-chronicle-tooltip-rules-${index}`)}
                  </span>
                ))}
              </span>
            </>
          )}
        </span>
      ) : null}
    </button>
  );
}

function chronicleCardTypeClassName(type: string | null | undefined): string {
  const normalized = type?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized ? `chronicleCardType-${normalized}` : "";
}
