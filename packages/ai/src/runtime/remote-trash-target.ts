import type { VisibleCard } from "@netgrid/shared";

export type RemoteTrashTargetType =
  | "asset_node"
  | "upgrade"
  | "ice"
  | "unknown";

export function remoteTrashTargetTypeForVisibleCard(
  card: VisibleCard,
): RemoteTrashTargetType {
  if (card.type === "asset") return "asset_node";
  if (card.type === "upgrade") return "upgrade";
  if (card.type === "ice") return "ice";
  return "unknown";
}
