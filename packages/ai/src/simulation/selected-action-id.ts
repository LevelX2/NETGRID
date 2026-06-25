import { type LegalAction } from "@netgrid/shared";

export function simulationSafeSelectedActionId(
  action: LegalAction,
  targetServerId?: string,
): string {
  return [action.side, action.type, targetServerId].filter(Boolean).join(".");
}
