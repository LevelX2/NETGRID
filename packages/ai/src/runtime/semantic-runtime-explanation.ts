import type { Side } from "@netgrid/shared";

export function semanticRuntimeExplanation(side: Side, scopeId: string): string {
  return `${side} Semantic Runtime wählt eine legale Aktion im Scope ${scopeId}.`;
}
