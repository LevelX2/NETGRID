"use client";

import {
  PanelTopClose,
  PanelTopOpen,
  Pause,
  Play,
  Route,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import type { LegalAction } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";
import {
  actionConsumesClick,
  actionCostChips,
  serverDisplayLabel,
  serverTargetIdForAction,
  type ActionButtonTone,
  type CostChipView,
} from "../../app/action-board-ui";
import {
  ZoneIdentityIcon,
  serverZoneIdentityIconKind,
} from "../game-board/ZoneFrame";

export function ActionPanelDockPlaceholder({
  runActive,
  floatingVisible,
  onDock,
}: {
  runActive: boolean;
  floatingVisible: boolean;
  onDock(): void;
}) {
  const t = useTranslations("Actions.controls");
  return (
    <section
      className="section actionPanelDockPlaceholder"
      data-testid="legal-actions-dock-placeholder"
    >
      <div className="sectionTitleLine">
        <h2>{t("possible")}</h2>
        <button
          className="button actionPanelDockButton"
          type="button"
          onClick={onDock}
          title={t("dock")}
        >
          <PanelTopClose size={14} />
          {t("dockShort")}
        </button>
      </div>
      <p className="meta">
        {runActive && !floatingVisible
          ? t("runWindowActive")
          : t("floatingActive")}
      </p>
    </section>
  );
}

export function ActionPanelFloatButton({ onFloat }: { onFloat(): void }) {
  const t = useTranslations("Actions.controls");
  const tooltipId = useId();
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null);
  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const margin = 10;
    const width = Math.min(320, window.innerWidth - margin * 2);
    const left = Math.min(
      Math.max(margin, rect.right - width),
      window.innerWidth - width - margin,
    );
    const belowTop = rect.bottom + 8;
    const top =
      belowTop + 92 < window.innerHeight
        ? belowTop
        : Math.max(margin, rect.top - 100);
    setTooltipStyle({ left, top, width });
  };
  const tooltip =
    tooltipStyle && typeof document !== "undefined"
      ? createPortal(
          <span
            className="actionControlHelpTooltip"
            id={tooltipId}
            role="tooltip"
            style={tooltipStyle}
          >
            {t("floatHelp")}
          </span>,
          document.body,
        )
      : null;
  return (
    <>
      <button
        className="priorityHoldToggle actionPanelFloatToggle"
        type="button"
        onClick={onFloat}
        aria-label={t("float")}
        aria-describedby={tooltipStyle ? tooltipId : undefined}
        onPointerEnter={(event) => showTooltip(event.currentTarget)}
        onPointerLeave={() => setTooltipStyle(null)}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setTooltipStyle(null)}
      >
        <PanelTopOpen size={14} />
      </button>
      {tooltip}
    </>
  );
}

export function PriorityWindowHoldToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle(enabled: boolean): void;
}) {
  const t = useTranslations("Actions.controls");
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null);
  const tooltipText = t("holdHelp");
  const label = enabled ? t("holdOff") : t("holdOn");
  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const margin = 10;
    const width = 276;
    const left = Math.min(
      Math.max(margin, rect.right - width),
      window.innerWidth - width - margin,
    );
    const belowTop = rect.bottom + 8;
    const top =
      belowTop + 64 < window.innerHeight
        ? belowTop
        : Math.max(margin, rect.top - 72);
    setTooltipStyle({ left, top, width });
  };
  const tooltip =
    tooltipStyle && typeof document !== "undefined"
      ? createPortal(
          <span
            className="priorityHoldTooltip"
            role="tooltip"
            style={tooltipStyle}
          >
            {tooltipText}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        className={`priorityHoldToggle ${enabled ? "active" : ""}`}
        type="button"
        aria-label={label}
        aria-pressed={enabled}
        onClick={() => onToggle(!enabled)}
        onPointerEnter={(event) => showTooltip(event.currentTarget)}
        onPointerLeave={() => setTooltipStyle(null)}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setTooltipStyle(null)}
      >
        <Pause size={15} />
      </button>
      {tooltip}
    </>
  );
}

export function CostChips({
  action,
  displayCostChips,
}: {
  action: LegalAction;
  displayCostChips?: CostChipView[] | undefined;
}) {
  const t = useTranslations("Actions.controls");
  const chips = displayCostChips ?? actionCostChips(action);
  if (chips.length === 0) return null;
  return (
    <span
      className="costChips"
      aria-label={t("cost", {cost: chips.map((chip) => chip.label).join(" + ")})}
      data-testid="cost-chips"
    >
      {chips.map((chip) => (
        <span
          className={`costChip ${chip.kind}`}
          key={`${chip.kind}-${chip.amount}`}
        >
          {chip.kind === "action" ? (
            Array.from({ length: chip.amount }, (_, index) => (
              <span
                className="costActionIcon"
                aria-hidden="true"
                key={`action-${index}`}
              />
            ))
          ) : (
            <>
              <span className="costCreditIcon" aria-hidden="true" />
              {chip.amount}
            </>
          )}
        </span>
      ))}
    </span>
  );
}

type OverflowAwareActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  action: LegalAction;
  label: string;
  displayLabel?: string;
  tooltipLabel?: string;
  displayCostChips?: CostChipView[] | undefined;
  iconSize?: number;
  tone?: ActionButtonTone;
  serverTargetId?: string | null;
};

const warningActionButtonStyle: CSSProperties = {
  background: "color-mix(in srgb, #f6b947 22%, var(--panel) 78%)",
  borderColor: "color-mix(in srgb, #f6b947 74%, var(--line) 26%)",
  color: "color-mix(in srgb, #f6b947 42%, var(--text) 58%)",
};

const dangerActionButtonStyle: CSSProperties = {
  background: "var(--danger-button-bg)",
  borderColor: "var(--danger-button-border)",
  color: "var(--danger)",
};

export function OverflowAwareActionButton({
  action,
  label,
  displayLabel = label,
  tooltipLabel,
  displayCostChips,
  iconSize,
  tone = "default",
  serverTargetId,
  className,
  style,
  type = "button",
  ...buttonProps
}: OverflowAwareActionButtonProps) {
  const t = useTranslations("Actions.controls");
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [tooltipEnabled, setTooltipEnabled] = useState(false);
  const targetServerId = serverTargetId ?? serverTargetIdForAction(action);
  const tonedClassName =
    [
      className,
      tone === "danger" ? "dangerButton" : null,
      targetServerId ? "hasServerTarget" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const tonedStyle =
    tone === "danger"
      ? { ...dangerActionButtonStyle, ...style }
      : tone === "warning"
        ? { ...warningActionButtonStyle, ...style }
        : style;

  useEffect(() => {
    const labelElement = labelRef.current;
    if (!labelElement) {
      setTooltipEnabled(false);
      return;
    }

    const updateTooltipAvailability = () => {
      const clipped =
        labelElement.scrollWidth > labelElement.clientWidth + 1 ||
        labelElement.scrollHeight > labelElement.clientHeight + 1;
      setTooltipEnabled((current) => (current === clipped ? current : clipped));
    };

    updateTooltipAvailability();
    const frame = window.requestAnimationFrame(updateTooltipAvailability);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateTooltipAvailability)
        : null;
    resizeObserver?.observe(labelElement);
    window.addEventListener("resize", updateTooltipAvailability);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateTooltipAvailability);
    };
  }, [displayLabel, label]);

  return (
    <button
      {...buttonProps}
      type={type}
      className={tonedClassName}
      style={tonedStyle}
      aria-label={label}
      data-tooltip={tooltipLabel ?? (tooltipEnabled ? label : undefined)}
      data-action-tone={tone === "default" ? undefined : tone}
    >
      <ActionLeadIcon
        action={action}
        {...(iconSize !== undefined ? { size: iconSize } : {})}
      />
      {targetServerId ? (
        <ZoneIdentityIcon
          side="corp"
          kind={serverZoneIdentityIconKind(targetServerId)}
          label={targetServerId === "new_remote" ? t("newRemote") : serverDisplayLabel(targetServerId)}
          className="actionTargetServerIcon"
        />
      ) : null}
      <span className="actionButtonLabel" ref={labelRef}>
        {displayLabel}
      </span>
      <CostChips action={action} displayCostChips={displayCostChips} />
    </button>
  );
}

export function ActionLeadIcon({
  action,
  size = 15,
}: {
  action: LegalAction;
  size?: number;
}) {
  if (action.type === "jack_out") return <X size={size} aria-hidden="true" />;
  if (action.type === "continue_run")
    return <Route size={size} aria-hidden="true" />;
  return actionConsumesClick(action) ? (
    <Play size={size} aria-hidden="true" />
  ) : (
    <Zap size={size} aria-hidden="true" />
  );
}
