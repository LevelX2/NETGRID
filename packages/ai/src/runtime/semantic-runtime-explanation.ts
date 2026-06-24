import type { Side } from "@netgrid/shared";

export function semanticRuntimeExplanation(side: Side, scopeId: string): string {
  return `${side} Semantic Runtime waehlt eine legale Aktion im Scope ${scopeId}.`;
}
