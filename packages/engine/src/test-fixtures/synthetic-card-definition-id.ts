import type { CardDefinitionId } from "@netgrid/shared";

/** Deterministic IDs for synthetic card definitions outside the real catalog. */
export function syntheticCardDefinitionId(label: string): CardDefinitionId {
  let hash = 2166136261;
  for (const character of label)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) + 10000;
}
