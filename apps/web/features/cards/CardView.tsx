import { Check, Clipboard, Crosshair, Eye, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { LegalAction, Side } from "@netgrid/shared";

import {
  CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS,
  CARD_TOOLTIP_OUTSIDE_CARD_CLICK_CLOSE_DELAY_MS,
  CARD_TOOLTIP_PIN_EVENT,
  type CardDisplayMode
} from "../settings/settings-model";
import {
  advancementCounterDisplay,
  contextualCardActionLabel,
  corpInstalledCardState,
  counterDisplaysForRendering,
  inactiveCardZoneAriaSuffix,
  inactiveCardZoneBadgeLabel,
  inactiveCardZoneClassName,
  isConcealedRunnerResourceCard,
  type IceModifierBadgeView,
  type InactiveCardZone
} from "../../app/action-board-ui";
import { CardImage } from "./card-image-service";
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
} from "./CardTextRendering";
import {
  useCardImagePreference,
  useCardScaleSettings,
  useCardTooltipSettings,
  usePreferredCardImageSource
} from "./card-display-settings";
import { cardDetailLines, cardWithoutDevelopmentCounters } from "./card-detail-lines";
import { iceStrengthBadgeValue, type DisplayVisibleCard } from "./card-view-model";
import { CardActionsPopover } from "./CardActionsPopover";
import { AdvancementGems, CounterDisplayBadge, IceModifierBadges, IceStrengthBadge, StrengthBoostBadge } from "./CardBadges";
import { ScoreCardStateBadges, scoreCardStateBadges, type ScoredAgendaStateLine } from "./ScoredAgendaState";

type CardChoiceShortcut = {
  selected: boolean;
  disabled: boolean;
  onToggle(): void;
  label: string;
  selectedLabel: string;
  icon?: "add" | "eye";
};

export function CardView({
  card,
  compact = false,
  preview = false,
  displayMode,
  hiddenSide,
  installedCorpCard = false,
  selected = false,
  actions = [],
  actionDisabled = false,
  actionLabelForAction = contextualCardActionLabel,
  slotClassName,
  positionBadge,
  modifierBadges = [],
  runPositionActive = false,
  runPositionLabel,
  viewMarkerActive = false,
  showAdvancementCounters = true,
  showScoreStateBadges = false,
  scoreStateBadges: explicitScoreStateBadges = [],
  archiveFacedown = false,
  inactiveZone,
  forceCardBack,
  choiceSelected = false,
  allowTooltipPinOnSelect = false,
  choiceShortcut,
  discardShortcut,
  onFocus,
  onSelect,
  onActionContextSelect,
  onAction
}: {
  card: DisplayVisibleCard;
  compact?: boolean;
  preview?: boolean;
  displayMode: CardDisplayMode;
  hiddenSide?: Side;
  installedCorpCard?: boolean;
  selected?: boolean;
  actions?: LegalAction[];
  actionDisabled?: boolean;
  actionLabelForAction?: (action: LegalAction) => string;
  slotClassName?: string;
  positionBadge?: string;
  modifierBadges?: IceModifierBadgeView[];
  runPositionActive?: boolean;
  runPositionLabel?: string | undefined;
  viewMarkerActive?: boolean;
  showAdvancementCounters?: boolean;
  showScoreStateBadges?: boolean;
  scoreStateBadges?: ScoredAgendaStateLine[];
  archiveFacedown?: boolean;
  inactiveZone?: InactiveCardZone;
  forceCardBack?: Side;
  choiceSelected?: boolean;
  allowTooltipPinOnSelect?: boolean;
  choiceShortcut?: CardChoiceShortcut;
  discardShortcut?: { selected: boolean; disabled: boolean; onToggle(): void };
  onFocus?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onSelect?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onActionContextSelect?(card: DisplayVisibleCard, hiddenSide?: Side): void;
  onAction?(action: LegalAction): void;
}) {
  const { hoverOpenDelayMs, mode: tooltipMode } = useCardTooltipSettings();
  const { tooltipPercent } = useCardScaleSettings();
  const tooltipViewId = useId();
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const tooltipOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipOutsideCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTapRef = useRef(0);
  const lastTouchTooltipPinRef = useRef(0);
  const tooltipPinnedVisibleRef = useRef(false);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [tooltipPositionStyle, setTooltipPositionStyle] = useState<CSSProperties>({});
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("below");
  const [actionMenuPlacement, setActionMenuPlacement] = useState<"above" | "below">("below");
  const [actionMenuPositionStyle, setActionMenuPositionStyle] = useState<CSSProperties>({});
  const [suppressCardTooltip, setSuppressCardTooltip] = useState(false);
  const [tooltipHoverVisible, setTooltipHoverVisible] = useState(false);
  const [tooltipFocusVisible, setTooltipFocusVisible] = useState(false);
  const [tooltipPinnedVisible, setTooltipPinnedVisible] = useState(false);
  const hasCardActions = actions.length > 0;
  const showCardActions = selected && hasCardActions && Boolean(onAction);
  const typeClass = card.known && card.type ? ` ${card.type}` : "";
  const hiddenBackClass = forceCardBack ? ` hiddenBack ${forceCardBack}HiddenBack forcedCardBack` : !card.known && hiddenSide ? ` hiddenBack ${hiddenSide}HiddenBack` : "";
  const concealedRunnerResource = isConcealedRunnerResourceCard(card);
  const knownConcealedRunnerResource = card.known && concealedRunnerResource && !forceCardBack;
  const concealedRunnerResourceClass = knownConcealedRunnerResource ? " concealedRunnerResource" : "";
  const archiveFacedownClass = archiveFacedown ? " archiveFacedown" : "";
  const inactiveZoneClass = inactiveZone ? ` inactiveZoneCard ${inactiveCardZoneClassName(inactiveZone)}` : "";
  const inactiveZoneBadge = inactiveZone ? inactiveCardZoneBadgeLabel(inactiveZone) : null;
  const inactiveZoneAriaSuffix = inactiveZone ? inactiveCardZoneAriaSuffix(inactiveZone) : "";
  const isCompact = compact || displayMode === "compact";
  const modeClass = displayMode === "text-card" ? " textCard" : displayMode === "compact" ? " compactCard" : " placeholderCard";
  const previewCard = preview ? cardWithoutDevelopmentCounters(card) : card;
  const detailLines = card.known ? cardDetailLines(previewCard) : [];
  const rulesText = card.known ? (card.rulesText ?? "") : "";
  const hasRulesText = rulesText.length > 0;
  const hasRulesLines = rulesTextLines(rulesText).length > 0;
  const hasSubroutineMarkers = rulesTextLines(rulesText).some((line) => isSubroutineRuleLine(card.type ?? "", rulesText, line));
  const tooltipText = card.known ? [card.title, ...detailLines, rulesText].filter(Boolean).join("\n") : undefined;
  const preferredImageSource = usePreferredCardImageSource(card.definitionId);
  const preferredImageUrl = preferredImageSource.src ?? card.imageUrl;
  const preferredImageFallbackUrl = preferredImageSource.fallbackSrc;
  const tooltipImageUrl = card.known ? preferredImageUrl : undefined;
  const { showSetBadges } = useCardImagePreference();
  const showImageTooltip = tooltipMode === "image" && Boolean(tooltipImageUrl);
  const hasTooltipTextContent = Boolean(card.title) || detailLines.length > 0 || hasRulesLines;
  const tooltipAvailable = card.known && !showCardActions && (showImageTooltip || hasTooltipTextContent);
  const canPinTooltip = tooltipAvailable && (!onSelect || allowTooltipPinOnSelect);
  const tooltipEnabled = tooltipAvailable && (!suppressCardTooltip || tooltipPinnedVisible);
  const showTooltip = tooltipEnabled && (tooltipHoverVisible || tooltipFocusVisible || tooltipPinnedVisible);
  const tooltipDomId = `${card.instanceId}-${tooltipViewId}`.replace(/[^A-Za-z0-9_-]/g, "-");
  const tooltipId = tooltipEnabled ? `card-tooltip-${tooltipDomId}` : undefined;
  const tooltipOwnerId = `card-tooltip-owner-${tooltipDomId}`;
  const nativeTitle = tooltipEnabled || showCardActions || suppressCardTooltip ? undefined : tooltipText;
  const tooltipStats = card.known
    ? [
        card.cost !== undefined ? { icon: "¢", label: "Kosten", value: String(card.cost) } : null,
        card.installCost !== undefined ? { icon: "↓", label: "Install", value: String(card.installCost) } : null,
        card.rezCost !== undefined ? { icon: "R", label: "Rez", value: String(card.rezCost) } : null,
        card.trashCost !== undefined ? { icon: "🗑", label: "Trash", value: String(card.trashCost) } : null,
        card.strength !== undefined ? { icon: "⚔", label: "Stärke", value: String(card.strength) } : null,
        card.memoryCost !== undefined ? { icon: "MU", label: "MU", value: String(card.memoryCost) } : null
      ].filter((entry): entry is { icon: string; label: string; value: string } => entry !== null)
    : [];
  const cardImageUrl = card.known && displayMode === "placeholder" && !forceCardBack ? preferredImageUrl : undefined;
  const visualImageUrl = cardImageUrl;
  const isHardwareImageCard = Boolean(visualImageUrl) && card.known && isHardwareCardType(card.type) && hasGeneratedCardArt(card.definitionId);
  const isOperationImageCard = Boolean(visualImageUrl) && card.known && isOperationCardType(card.type) && hasGeneratedCardArt(card.definitionId);
  const showArtBlock = !visualImageUrl && displayMode === "placeholder";
  const metaText = card.known ? detailLines.join(" · ") : "Verdeckt";
  const showMetaLine = !visualImageUrl && Boolean(metaText) && (!card.known || !compact || displayMode === "compact" || preview);
  const showRulesPreview = !visualImageUrl && card.known && hasRulesText && !isCompact;
  const tooltipScale = Math.max(0.5, tooltipPercent / 100);
  const installedState = installedCorpCard ? corpInstalledCardState(card) : null;
  const advancementDisplay = showAdvancementCounters && !preview ? advancementCounterDisplay(card) : null;
  const advancementCount = advancementDisplay?.amount ?? 0;
  const advancementLabel = advancementDisplay?.ariaLabel ?? null;
  const strengthModifier = preview ? 0 : Math.max(0, Math.floor(card.strengthModifier ?? 0));
  const iceStrength = iceStrengthBadgeValue(card, { preview, forceCardBack: Boolean(forceCardBack) });
  const tapped = card.known && card.tapped === true && !preview && !forceCardBack;
  const scoreStateBadges = explicitScoreStateBadges.length > 0 ? explicitScoreStateBadges : showScoreStateBadges ? scoreCardStateBadges(card) : [];
  const renderedCounterDisplays = preview ? [] : counterDisplaysForRendering(card);
  const counterAriaSuffix = renderedCounterDisplays.map((display) => display.ariaLabel).filter(Boolean).join(", ");
  const scoreStateAriaSuffix = scoreStateBadges.map((badge) => `${badge.value}: ${badge.label}`).join(", ");
  const tappedAriaSuffix = tapped ? "getappt" : "";
  const iceStrengthAriaSuffix = iceStrength !== null ? `Stärke ${iceStrength}` : "";
  const concealedRunnerResourceAriaSuffix = knownConcealedRunnerResource ? "verdeckte Runner-Resource, für die Korp nicht aufgedeckt" : "";
  const cardStateAriaText = [tappedAriaSuffix, concealedRunnerResourceAriaSuffix, iceStrengthAriaSuffix, counterAriaSuffix, scoreStateAriaSuffix].filter(Boolean).join(", ");
  const cardStateAria = cardStateAriaText ? `, ${cardStateAriaText}` : "";
  const modifierBadgeAria = modifierBadges.map((badge) => badge.ariaLabel).join(", ");
  const modifierBadgeAriaSuffix = modifierBadgeAria ? `, ${modifierBadgeAria}` : "";
  const setBadgeLabel = card.known && showSetBadges ? card.setShortLabel : undefined;
  const setBadgeTitle = card.known && showSetBadges ? card.setDetailLabel : undefined;
  const setBadgeAriaSuffix = setBadgeTitle ? `, Set ${setBadgeTitle}` : "";
  const cardAriaLabel = showAdvancementCounters && advancementLabel
    ? card.known
      ? `Karte ${card.title}, ${advancementLabel}${setBadgeAriaSuffix}${archiveFacedown ? ", verdeckt im Archiv" : ""}${inactiveZoneAriaSuffix}${forceCardBack ? ", Rückseite angezeigt" : ""}${viewMarkerActive ? ", wird gerade angesehen" : ""}${cardStateAria}${modifierBadgeAriaSuffix}`
      : `Verdeckte Karte, ${advancementLabel}`
    : card.known
      ? `Karte ${card.title}${setBadgeAriaSuffix}${archiveFacedown ? ", verdeckt im Archiv" : ""}${inactiveZoneAriaSuffix}${forceCardBack ? ", Rückseite angezeigt" : ""}${viewMarkerActive ? ", wird gerade angesehen" : ""}${cardStateAria}${modifierBadgeAriaSuffix}`
      : `Verdeckte Karte${inactiveZoneAriaSuffix}${modifierBadgeAriaSuffix}`;

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

  const clearTooltipOutsideCloseTimer = () => {
    if (tooltipOutsideCloseTimerRef.current !== null) {
      clearTimeout(tooltipOutsideCloseTimerRef.current);
      tooltipOutsideCloseTimerRef.current = null;
    }
  };

  const setPinnedTooltipVisible = (visible: boolean) => {
    tooltipPinnedVisibleRef.current = visible;
    setTooltipPinnedVisible(visible);
  };

  const updateOverlayPlacement = () => {
    const element = cardRef.current;
    if (!element) return;
    const cardRect = element.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportWidth = visualViewport?.width ?? window.innerWidth;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportBottom = viewportHeight;
    const spaceBelow = viewportBottom - cardRect.bottom;
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
    const estimatedActionMenuHeight = Math.min(260, Math.max(56, actions.length * 51 + Math.max(0, actions.length - 1) * 5));
    const nextActionMenuPlacement = spaceBelow < estimatedActionMenuHeight && spaceAbove > spaceBelow ? "above" : "below";
    if (tooltipEnabled) setTooltipPlacement(nextTooltipPlacement);
    if (hasCardActions) {
      const margin = viewportWidth < 360 ? 8 : 16;
      const availableWidth = Math.max(160, viewportWidth - margin * 2);
      const preferredWidth = Math.max(cardRect.width, Math.min(availableWidth, 224));
      const actionMenuWidth = Math.min(availableWidth, Math.min(260, preferredWidth));
      const cardCenter = cardRect.left + cardRect.width / 2;
      const left = Math.max(margin, Math.min(cardCenter - actionMenuWidth / 2, viewportWidth - actionMenuWidth - margin));
      const top = nextActionMenuPlacement === "below" ? cardRect.bottom + 7 : Math.max(margin, cardRect.top - estimatedActionMenuHeight - 7);
      setActionMenuPlacement(nextActionMenuPlacement);
      setActionMenuPositionStyle({
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        bottom: "auto",
        width: `${actionMenuWidth}px`,
        minWidth: `${Math.min(cardRect.width, actionMenuWidth)}px`,
        maxHeight: `${Math.max(72, viewportHeight - margin * 2)}px`
      });
    }
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
    tooltipPinnedVisibleRef.current = tooltipPinnedVisible;
  }, [tooltipPinnedVisible]);

  useEffect(() => {
    if (tooltipAvailable) return;
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    clearTooltipOutsideCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setPinnedTooltipVisible(false);
    setTooltipPositionStyle({});
  }, [tooltipAvailable]);

  const togglePinnedTooltip = () => {
    if (!canPinTooltip) return;
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    clearTooltipOutsideCloseTimer();
    setSuppressCardTooltip(false);
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    const nextVisible = !tooltipPinnedVisibleRef.current;
    setPinnedTooltipVisible(nextVisible);
    if (nextVisible) {
      window.dispatchEvent(new CustomEvent(CARD_TOOLTIP_PIN_EVENT, { detail: { ownerId: tooltipOwnerId } }));
    }
    updateOverlayPlacement();
  };

  const closePinnedTooltip = () => {
    clearTooltipOpenTimer();
    clearTooltipCloseTimer();
    clearTooltipOutsideCloseTimer();
    setTooltipHoverVisible(false);
    setTooltipFocusVisible(false);
    setPinnedTooltipVisible(false);
  };

  useEffect(() => {
    if (!showTooltip) return;
    updateOverlayPlacement();
  }, [showTooltip, tooltipMode]);

  useEffect(() => {
    const closeWhenOtherTooltipPins = (event: Event) => {
      const ownerId = event instanceof CustomEvent ? (event.detail as { ownerId?: unknown } | null)?.ownerId : undefined;
      if (ownerId === tooltipOwnerId) return;
      clearTooltipOpenTimer();
      clearTooltipCloseTimer();
      clearTooltipOutsideCloseTimer();
      setPinnedTooltipVisible(false);
      setTooltipHoverVisible(false);
      setTooltipFocusVisible(false);
    };
    window.addEventListener(CARD_TOOLTIP_PIN_EVENT, closeWhenOtherTooltipPins);
    return () => window.removeEventListener(CARD_TOOLTIP_PIN_EVENT, closeWhenOtherTooltipPins);
  }, [tooltipOwnerId]);

  useEffect(() => {
    if (!tooltipPinnedVisible) return;
    const closePinnedTooltipOnOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const cardElement = cardRef.current;
      const tooltipElement = tooltipRef.current;
      if (cardElement?.contains(target) || tooltipElement?.contains(target)) return;
      clearTooltipOutsideCloseTimer();
      const targetElement = target instanceof Element ? target : target.parentElement;
      const clickedCard = targetElement?.closest(
        'button[data-testid="known-card"], button[data-testid="hidden-card"], button[data-testid="card-choice-card"]',
      );
      if (clickedCard) {
        if (event.detail > 1) return;
        tooltipOutsideCloseTimerRef.current = setTimeout(() => {
          tooltipOutsideCloseTimerRef.current = null;
          if (tooltipPinnedVisibleRef.current) closePinnedTooltip();
        }, CARD_TOOLTIP_OUTSIDE_CARD_CLICK_CLOSE_DELAY_MS);
        return;
      }
      closePinnedTooltip();
    };
    window.addEventListener("click", closePinnedTooltipOnOutsideClick, true);
    return () => {
      window.removeEventListener("click", closePinnedTooltipOnOutsideClick, true);
      clearTooltipOutsideCloseTimer();
    };
  }, [tooltipPinnedVisible]);

  useEffect(() => {
    if (!showCardActions) {
      setActionMenuPositionStyle({});
      return;
    }
    updateOverlayPlacement();
  }, [showCardActions, actions.length]);

  useEffect(
    () => () => {
      clearTooltipOpenTimer();
      clearTooltipCloseTimer();
      clearTooltipOutsideCloseTimer();
    },
    []
  );

  const tooltipElement = showTooltip && tooltipId ? (
    <span
      ref={tooltipRef}
      className={`cardTooltip ${tooltipPlacement} mode-${tooltipMode}${showImageTooltip ? " imageOnly" : ""}${tooltipPinnedVisible ? " pinned" : ""}${showTooltip ? " visible" : ""}`}
      id={tooltipId}
      role="tooltip"
      style={tooltipPositionStyle}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        closePinnedTooltip();
      }}
      onPointerDown={(event) => {
        if (tooltipPinnedVisible) event.stopPropagation();
      }}
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
        <CardImage
          className="cardTooltipImage"
          src={tooltipImageUrl}
          fallbackSrc={preferredImageFallbackUrl}
          alt={`Kartenbild ${card.title ?? "Karte"}`}
        />
      ) : (
        <>
          <strong>{card.title}</strong>
          {tooltipMode === "enhanced" ? (
            <span className="cardTooltipStats">
              {tooltipStats.map((stat) => (
                <span
                  key={`${card.instanceId}-tooltip-stat-${stat.label}`}
                  className="cardTooltipStat"
                  title={stat.label}
                >
                  <span className="icon">{stat.icon}</span>
                  <span>{stat.value}</span>
                </span>
              ))}
            </span>
          ) : null}
          {tooltipMode === "enhanced"
            ? detailLines.map((line) => <span key={line}>{line}</span>)
            : null}
          <span className="cardTooltipText">
            {rulesTextLines(rulesText).map((line, index) => (
              <span
                key={`${card.instanceId}-tooltip-rules-${index}`}
                className={hasSubroutineMarkers ? "subroutineLine" : undefined}
              >
                {shouldAddFallbackSubroutineMarker(
                  card.type ?? "",
                  rulesText,
                  line,
                ) ? (
                  <SubroutineIcon />
                ) : null}
                {renderRuleTextSegments(
                  line,
                  `${card.instanceId}-tooltip-rules-${index}`,
                )}
              </span>
            ))}
          </span>
        </>
      )}
    </span>
  ) : null;

  return (
    <div className={`cardSlot${slotClassName ? ` ${slotClassName}` : ""}${showCardActions ? " actionMenuOpen" : ""}${runPositionActive ? " runPositionActiveSlot" : ""}${viewMarkerActive ? " viewMarkerActiveSlot" : ""}`}>
      {positionBadge ? (
        <span className="cardPositionBadge" aria-label={`ICE ${positionBadge}: Installationsreihenfolge von innen nach außen`}>
          {positionBadge}
        </span>
      ) : null}
      {runPositionActive ? (
        <span className="runPositionMarker" tabIndex={0} aria-label={runPositionLabel ?? "Aktuelles ICE"} data-tooltip={runPositionLabel ?? "Aktuelles ICE"} title={runPositionLabel ?? "Aktuelles ICE"}>
          <Crosshair size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
      ) : null}
      {viewMarkerActive ? (
        <span className="cardViewMarker" tabIndex={0} aria-label="Karte wird gerade angesehen" data-tooltip="Karte wird gerade angesehen" title="Karte wird gerade angesehen">
          <Eye size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
      ) : null}
      <button
        ref={cardRef}
        type="button"
        className={`card${card.known ? typeClass : " hidden"}${hiddenBackClass}${concealedRunnerResourceClass}${archiveFacedownClass}${inactiveZoneClass}${modeClass}${visualImageUrl ? " withImage" : ""}${preview ? " preview" : ""}${tapped ? " tappedCard" : ""}${installedState === "unrezzed" ? " unrezzedInstalled" : ""}${installedState === "rezzed" ? " rezzedInstalled" : ""}${modifierBadges.length > 0 ? " hasModifierBadges" : ""}${hasCardActions ? " hasActions" : ""}${selected ? " selectedActionSource" : ""}${choiceSelected ? " choiceSelected" : ""}${discardShortcut?.selected ? " discardSelected" : ""}${runPositionActive ? " runPositionActive" : ""}${viewMarkerActive ? " viewMarkerActive" : ""}`}
        onClick={() => {
          if (showCardActions) setSuppressCardTooltip(true);
          updateOverlayPlacement();
          if (onSelect) onSelect(card, hiddenSide);
          onFocus?.(card, hiddenSide);
        }}
        onFocus={(event) => {
          updateOverlayPlacement();
          if (tooltipEnabled && event.currentTarget.matches(":focus-visible")) setTooltipFocusVisible(true);
          onFocus?.(card, hiddenSide);
        }}
        onBlur={() => setTooltipFocusVisible(false)}
        onDoubleClick={(event) => {
          if (!canPinTooltip) return;
          if (Date.now() - lastTouchTooltipPinRef.current < 700) return;
          event.preventDefault();
          togglePinnedTooltip();
        }}
        onPointerEnter={(event) => {
          updateOverlayPlacement();
          if (event.pointerType === "touch") return;
          scheduleTooltipOpen();
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "touch" || !canPinTooltip) return;
          const now = Date.now();
          const elapsed = now - lastTouchTapRef.current;
          lastTouchTapRef.current = now;
          if (elapsed > 60 && elapsed < 420) {
            event.preventDefault();
            lastTouchTooltipPinRef.current = now;
            togglePinnedTooltip();
          }
        }}
        onPointerLeave={(event) => {
          setSuppressCardTooltip(false);
          if (event.pointerType === "touch") return;
          scheduleTooltipClose();
        }}
        aria-label={cardAriaLabel}
        aria-pressed={onSelect ? choiceSelected : undefined}
        aria-describedby={tooltipId}
        title={nativeTitle}
        data-testid={onSelect ? "card-choice-card" : card.known ? "known-card" : "hidden-card"}
        data-known={card.known ? "true" : "false"}
        data-concealed-runner-resource={concealedRunnerResource ? "true" : undefined}
        data-archive-facedown={archiveFacedown ? "true" : undefined}
        data-inactive-zone={inactiveZone}
      >
        {visualImageUrl ? <CardImage className="cardImage" src={visualImageUrl} fallbackSrc={preferredImageFallbackUrl} decorative /> : null}
        {visualImageUrl && setBadgeLabel && !isHardwareImageCard && !isOperationImageCard ? (
          <span className="cardImageSetBadge" title={setBadgeTitle} aria-hidden="true">
            {setBadgeLabel}
          </span>
        ) : null}
        {isHardwareImageCard ? (
          <HardwareImageOverlay
            title={card.title ?? "Hardware"}
            rulesText={rulesText}
            {...(setBadgeLabel ? { setBadgeLabel } : {})}
            {...(setBadgeTitle ? { setBadgeTitle } : {})}
            {...(card.installCost !== undefined ? { installCost: card.installCost } : {})}
          />
        ) : isOperationImageCard ? (
          <OperationImageOverlay
            title={card.title ?? "Operation"}
            rulesText={rulesText}
            {...(setBadgeLabel ? { setBadgeLabel } : {})}
            {...(setBadgeTitle ? { setBadgeTitle } : {})}
            {...(card.cost !== undefined ? { cost: card.cost } : {})}
          />
        ) : null}
        {showArtBlock ? <span className="cardArt" aria-hidden="true" /> : null}
        {visualImageUrl ? null : <span className="cardTitle">{card.known ? card.title : "Verdeckte Karte"}</span>}
        {!visualImageUrl && setBadgeLabel ? (
          <span className="cardSetBadge" title={setBadgeTitle} aria-hidden="true">
            {setBadgeLabel}
          </span>
        ) : null}
        {inactiveZoneBadge ? (
          <span className="cardInactiveZoneBadge" aria-hidden="true">
            {inactiveZone === "heap" ? <Trash2 size={10} strokeWidth={2.4} /> : <Clipboard size={10} strokeWidth={2.4} />}
            <span>{inactiveZoneBadge}</span>
          </span>
        ) : null}
        {tapped ? (
          <span className="cardTappedBadge" aria-hidden="true">
            Getappt
          </span>
        ) : null}
        {modifierBadges.length > 0 ? <IceModifierBadges badges={modifierBadges} /> : null}
        {showMetaLine ? <span className="cardMeta">{metaText}</span> : null}
        {showRulesPreview ? (
          <span className="cardRulesPreview">
            {rulesTextLines(rulesText).map((line, index) => (
              <span key={`${card.instanceId}-rules-${index}`} className={hasSubroutineMarkers ? "subroutineLine" : undefined}>
                {shouldAddFallbackSubroutineMarker(card.type ?? "", rulesText, line) ? <SubroutineIcon /> : null}
                {renderRuleTextSegments(line, `${card.instanceId}-rules-${index}`)}
              </span>
            ))}
          </span>
        ) : null}
        {advancementDisplay ? <AdvancementGems card={card} display={advancementDisplay} /> : null}
        {iceStrength !== null ? <IceStrengthBadge strength={iceStrength} /> : null}
        {strengthModifier > 0 ? <StrengthBoostBadge amount={strengthModifier} /> : null}
        {renderedCounterDisplays.map((display) => (
          <CounterDisplayBadge key={`${card.instanceId}-counter-display-${display.id}`} display={display} scoreState={showScoreStateBadges} />
        ))}
        {scoreStateBadges.length > 0 ? <ScoreCardStateBadges badges={scoreStateBadges} /> : null}
      </button>
      {discardShortcut ? (
        <button
          className={`cardDiscardShortcut${discardShortcut.selected ? " active" : ""}`}
          type="button"
          aria-label={discardShortcut.selected ? "Diese Handkarte nicht abwerfen" : "Diese Handkarte abwerfen"}
          aria-pressed={discardShortcut.selected}
          title={discardShortcut.selected ? "Discard-Auswahl aufheben" : "Für Discard auswählen"}
          data-testid="hand-discard-shortcut"
          disabled={discardShortcut.disabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSuppressCardTooltip(true);
            discardShortcut.onToggle();
          }}
        >
          {discardShortcut.selected ? <Check size={11} strokeWidth={2.5} /> : <Trash2 size={11} strokeWidth={2.35} />}
        </button>
      ) : null}
      {choiceShortcut ? (
        <button
          className={`cardChoiceShortcut${choiceShortcut.selected ? " active" : ""}`}
          type="button"
          aria-label={choiceShortcut.selected ? choiceShortcut.selectedLabel : choiceShortcut.label}
          aria-pressed={choiceShortcut.selected}
          title={choiceShortcut.selected ? choiceShortcut.selectedLabel : choiceShortcut.label}
          data-testid="field-card-choice-shortcut"
          disabled={choiceShortcut.disabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSuppressCardTooltip(true);
            choiceShortcut.onToggle();
          }}
        >
          {choiceShortcut.selected ? (
            <Check size={11} strokeWidth={2.5} />
          ) : choiceShortcut.icon === "eye" ? (
            <Eye size={11} strokeWidth={2.35} />
          ) : (
            <Plus size={11} strokeWidth={2.35} />
          )}
        </button>
      ) : null}
      {tooltipElement && typeof document !== "undefined" ? createPortal(tooltipElement, document.body) : null}
      {hasCardActions ? (
        <button
          className={`cardActionMarker${showCardActions ? " active" : ""}`}
          type="button"
          data-card-action-surface="true"
          aria-label={showCardActions ? "Kartenoptionen einklappen" : "Kartenoptionen anzeigen"}
          aria-expanded={showCardActions}
          aria-haspopup="menu"
          data-testid="card-action-marker"
          onPointerDown={(event) => {
            if (event.pointerType === "touch") {
              setSuppressCardTooltip(true);
              updateOverlayPlacement();
            }
          }}
          onClick={() => {
            if (showCardActions) setSuppressCardTooltip(true);
            updateOverlayPlacement();
            onFocus?.(card, hiddenSide);
            if (card.known) onActionContextSelect?.(card, hiddenSide);
          }}
          onDoubleClick={() => {
            if (actions.length === 1 && onAction && !actionDisabled) onAction(actions[0]!);
          }}
          onPointerEnter={updateOverlayPlacement}
          onPointerLeave={() => setSuppressCardTooltip(false)}
        >
          <Play size={10} strokeWidth={2.35} />
        </button>
      ) : null}
      {showCardActions ? <CardActionsPopover actions={actions} disabled={actionDisabled} placement={actionMenuPlacement} style={actionMenuPositionStyle} actionLabelForAction={actionLabelForAction} onAction={onAction!} /> : null}
    </div>
  );
}
