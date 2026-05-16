const CARD_ACTION_SURFACE_SELECTOR = "[data-card-action-surface='true']";

export function isCardActionSurfaceTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as { closest?: unknown }).closest !== "function") return false;
  return Boolean((target as Element).closest(CARD_ACTION_SURFACE_SELECTOR));
}
