import type { LegalAction } from "@netgrid/shared";

export function semanticRuntimeServerId(
  action: LegalAction,
): string | undefined {
  const serverId = action.payload?.serverId;
  return typeof serverId === "string" ? serverId : undefined;
}
