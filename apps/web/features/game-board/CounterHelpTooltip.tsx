import { useId, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

export function CounterHelpTooltipTrigger({
  children,
  className,
  tooltip,
  ariaLabel,
  role,
  "data-testid": testId
}: {
  children: ReactNode;
  className: string;
  tooltip: string;
  ariaLabel: string;
  role?: string;
  "data-testid"?: string;
}) {
  const tooltipId = useId();
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [tooltipPlacement, setTooltipPlacement] = useState<"above" | "below">("above");
  const [visible, setVisible] = useState(false);
  const [pinned, setPinned] = useState(false);
  const showTooltip = (element: HTMLElement, pin = false) => {
    const rect = element.getBoundingClientRect();
    const width = Math.min(280, Math.max(220, window.innerWidth - 16));
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), Math.max(8, window.innerWidth - width - 8));
    const above = rect.top > 132;
    const top = above ? rect.top - 10 : rect.bottom + 10;
    setTooltipPlacement(above ? "above" : "below");
    setTooltipStyle({ left, top, width });
    setPinned(pin);
    setVisible(true);
  };
  const hideTooltip = () => {
    setPinned(false);
    setVisible(false);
  };
  return (
    <span
      className={`${className} counterHelpTooltipTrigger`}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={visible ? tooltipId : undefined}
      data-testid={testId}
      tabIndex={0}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (visible && pinned) {
          hideTooltip();
          return;
        }
        showTooltip(event.currentTarget, true);
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") showTooltip(event.currentTarget);
      }}
      onPointerLeave={() => {
        if (!pinned) setVisible(false);
      }}
      onFocus={(event) => showTooltip(event.currentTarget)}
      onBlur={hideTooltip}
    >
      {children}
      {visible
        ? createPortal(
            <span id={tooltipId} className={`cardTooltip counterHelpTooltip ${tooltipPlacement} visible`} role="tooltip" style={tooltipStyle}>
              <span className="cardTooltipText">{tooltip}</span>
            </span>,
            document.body
          )
        : null}
    </span>
  );
}
