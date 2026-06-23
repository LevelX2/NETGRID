"use client";

import { PanelTopClose, PanelTopOpen, Pause, Play, Route, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import type { LegalAction } from "@netgrid/shared";
import { actionConsumesClick, actionCostChips } from "../../app/action-board-ui";

export function ActionPanelDockPlaceholder({
  runActive,
  floatingVisible,
  onDock
}: {
  runActive: boolean;
  floatingVisible: boolean;
  onDock(): void;
}) {
  return (
    <section className="section actionPanelDockPlaceholder" data-testid="legal-actions-dock-placeholder">
      <div className="sectionTitleLine">
        <h2>Mögliche Aktionen</h2>
        <button className="button actionPanelDockButton" type="button" onClick={onDock} title="Aktionsfenster andocken">
          <PanelTopClose size={14} />
          Andocken
        </button>
      </div>
      <p className="meta">{runActive && !floatingVisible ? "Run-Fenster aktiv." : "Schwebendes Aktionsfenster aktiv."}</p>
    </section>
  );
}

export function ActionPanelFloatButton({ onFloat }: { onFloat(): void }) {
  return (
    <button className="priorityHoldToggle actionPanelFloatToggle" type="button" onClick={onFloat} aria-label="Aktionsfenster schweben lassen" title="Aktionsfenster schweben lassen">
      <PanelTopOpen size={14} />
    </button>
  );
}

export function PriorityWindowHoldToggle({ enabled, onToggle }: { enabled: boolean; onToggle(enabled: boolean): void }) {
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null);
  const tooltipText = "Bei deinem nächsten legalen Reaktions- oder Rez-Fenster anhalten. Bleibt aktiv, bis du es ausschaltest.";
  const label = enabled ? "Fensterhalt ausschalten" : "Fensterhalt einschalten";
  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const margin = 10;
    const width = 276;
    const left = Math.min(Math.max(margin, rect.right - width), window.innerWidth - width - margin);
    const belowTop = rect.bottom + 8;
    const top = belowTop + 64 < window.innerHeight ? belowTop : Math.max(margin, rect.top - 72);
    setTooltipStyle({ left, top, width });
  };
  const tooltip =
    tooltipStyle && typeof document !== "undefined"
      ? createPortal(
          <span className="priorityHoldTooltip" role="tooltip" style={tooltipStyle}>
            {tooltipText}
          </span>,
          document.body
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

export function CostChips({ action }: { action: LegalAction }) {
  const chips = actionCostChips(action);
  if (chips.length === 0) return null;
  return (
    <span className="costChips" aria-label={`Kosten: ${chips.map((chip) => chip.label).join(" + ")}`} data-testid="cost-chips">
      {chips.map((chip) => (
        <span className={`costChip ${chip.kind}`} key={`${chip.kind}-${chip.amount}`}>
          {chip.kind === "action" ? (
            Array.from({ length: chip.amount }, (_, index) => <span className="costActionIcon" aria-hidden="true" key={`action-${index}`} />)
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

type OverflowAwareActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  action: LegalAction;
  label: string;
  displayLabel?: string;
  iconSize?: number;
};

export function OverflowAwareActionButton({
  action,
  label,
  displayLabel = label,
  iconSize,
  type = "button",
  ...buttonProps
}: OverflowAwareActionButtonProps) {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [tooltipEnabled, setTooltipEnabled] = useState(false);

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
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateTooltipAvailability) : null;
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
      aria-label={label}
      data-tooltip={tooltipEnabled ? label : undefined}
    >
      <ActionLeadIcon action={action} {...(iconSize !== undefined ? { size: iconSize } : {})} />
      <span className="actionButtonLabel" ref={labelRef}>{displayLabel}</span>
      <CostChips action={action} />
    </button>
  );
}

export function ActionLeadIcon({ action, size = 15 }: { action: LegalAction; size?: number }) {
  if (action.type === "jack_out") return <X size={size} aria-hidden="true" />;
  if (action.type === "continue_run") return <Route size={size} aria-hidden="true" />;
  return actionConsumesClick(action) ? <Play size={size} aria-hidden="true" /> : <Zap size={size} aria-hidden="true" />;
}
