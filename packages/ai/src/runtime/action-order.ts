import type { LegalAction } from "@netgrid/shared";

export function compareAction(left: LegalAction, right: LegalAction): number {
  return left.actionId.localeCompare(right.actionId);
}
