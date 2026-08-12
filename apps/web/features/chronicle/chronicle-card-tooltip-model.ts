import type { CardTooltipMode } from "../settings/settings-model";

export function chronicleCardTooltipContentMode(
  tooltipMode: CardTooltipMode,
  hasImage: boolean,
  hasText: boolean,
): "image" | "text" | null {
  if (tooltipMode === "image" && hasImage) return "image";
  return hasText ? "text" : null;
}
