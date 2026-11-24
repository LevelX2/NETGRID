import { useLayoutEffect, useRef, type RefObject } from "react";
import {
  CARD_ACTION_MENU_MARGIN,
  cardActionMenuVerticalPosition,
} from "../../app/card-action-menu-ui";
import type { LegalAction } from "../../lib/presented-player-view";

import { OverflowAwareActionButton } from "../actions/ActionControls";

export function CardActionsPopover({
  actions,
  anchorRef,
  disabled,
  actionLabelForAction,
  onAction,
}: {
  actions: LegalAction[];
  anchorRef: RefObject<HTMLButtonElement | null>;
  disabled: boolean;
  actionLabelForAction(action: LegalAction): string;
  onAction(action: LegalAction): void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const list = listRef.current;
    const card = anchorRef.current;
    if (!menu || !list || !card) return;
    menu.showPopover();
    const viewport = window.visualViewport;
    let rect = card.getBoundingClientRect();
    const update = () => positionCardActionMenu(rect, menu, list, viewport);
    update();

    // Board reflow and card transforms can move the anchor without resizing it.
    let frame: number;
    const followCard = () => {
      const next = card.getBoundingClientRect();
      if (
        next.left !== rect.left ||
        next.top !== rect.top ||
        next.width !== rect.width ||
        next.height !== rect.height
      ) {
        rect = next;
        update();
      }
      frame = requestAnimationFrame(followCard);
    };
    frame = requestAnimationFrame(followCard);
    const observer = new ResizeObserver(update);
    observer.observe(list);
    const visibility = new IntersectionObserver(([entry]) => {
      menu.style.visibility = entry?.isIntersecting ? "visible" : "hidden";
    });
    visibility.observe(card);
    window.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    viewport?.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      viewport?.removeEventListener("resize", update);
      menu.hidePopover();
    };
  }, [anchorRef]);

  return (
    <div
      ref={menuRef}
      popover="manual"
      className="cardActionsPopover"
      role="menu"
      aria-label="Kartenaktionen"
      data-card-action-surface="true"
    >
      <div className="cardActionList" ref={listRef}>
        {actions.map((action, index) => {
          const fullLabel = actionLabelForAction(action);
          const label = compactCardActionMenuLabel(action, fullLabel);
          return (
            <OverflowAwareActionButton
              action={action}
              className="button actionButton cardActionButton"
              key={`${action.actionId}:${index}`}
              onClick={() => onAction(action)}
              disabled={disabled}
              type="button"
              label={fullLabel}
              displayLabel={label}
              role="menuitem"
              data-testid="card-action-button"
              data-action-type={action.type}
              iconSize={14}
            />
          );
        })}
      </div>
    </div>
  );
}

function positionCardActionMenu(
  rect: DOMRect,
  menu: HTMLElement,
  list: HTMLElement,
  viewport: VisualViewport | null,
): void {
  const viewportWidth = viewport?.width ?? document.documentElement.clientWidth;
  const leftEdge = (viewport?.offsetLeft ?? 0) + CARD_ACTION_MENU_MARGIN;
  const usableWidth = Math.max(0, viewportWidth - CARD_ACTION_MENU_MARGIN * 2);
  const width = Math.min(usableWidth, 260, Math.max(224, rect.width));
  const centeredLeft = rect.left + (rect.width - width) / 2;
  const left = Math.max(
    leftEdge,
    Math.min(centeredLeft, leftEdge + usableWidth - width),
  );
  menu.style.width = `${width}px`;
  menu.style.left = `${left}px`;
  const { above, top, maxHeight } = cardActionMenuVerticalPosition(
    rect,
    viewport?.offsetTop ?? 0,
    viewport?.height ?? document.documentElement.clientHeight,
    list.offsetHeight,
    (list.firstElementChild as HTMLButtonElement).offsetHeight,
  );
  menu.style.maxHeight = `${maxHeight}px`;
  menu.style.top = `${top}px`;
  menu.classList.toggle("above", above);
}

function compactCardActionMenuLabel(
  action: LegalAction,
  label: string,
): string {
  if (action.type !== "pump_breaker" && action.type !== "break_subroutine")
    return label;
  return label.replace(/\s+\([^)]*\)$/, "");
}
