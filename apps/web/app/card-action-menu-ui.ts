const CARD_ACTION_SURFACE_SELECTOR = "[data-card-action-surface='true']";
export const CARD_ACTION_MENU_MARGIN = 8;

export function cardActionMenuVerticalPosition(
  card: Pick<DOMRect, "top" | "bottom">,
  viewportTop: number,
  viewportHeight: number,
  contentHeight: number,
  firstActionHeight: number,
) {
  const gap = 4;
  const topEdge = viewportTop + CARD_ACTION_MENU_MARGIN;
  const bottomEdge = viewportTop + viewportHeight - CARD_ACTION_MENU_MARGIN;
  const belowTop = card.bottom + gap;
  const aboveBottom = card.top - gap;
  const spaceBelow = bottomEdge - belowTop;
  const spaceAbove = aboveBottom - topEdge;
  const above = contentHeight > spaceBelow && spaceAbove > spaceBelow;
  const space = above ? spaceAbove : spaceBelow;
  const maxHeight = Math.min(
    Math.max(0, bottomEdge - topEdge),
    Math.max(firstActionHeight, space),
  );
  const height = Math.min(contentHeight, maxHeight);
  const preferredTop = above ? aboveBottom - height : belowTop;
  const top = Math.max(topEdge, Math.min(preferredTop, bottomEdge - height));
  return { above, top, maxHeight };
}

export function isCardActionSurfaceTarget(target: EventTarget | null): boolean {
  if (
    !target ||
    typeof (target as { closest?: unknown }).closest !== "function"
  )
    return false;
  return Boolean((target as Element).closest(CARD_ACTION_SURFACE_SELECTOR));
}
