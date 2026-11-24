import { isCardDefinitionId, type CardDefinitionId, type PublicGameEvent } from "@netgrid/shared";
import { cardDefinitionIdsFromCsv } from "../../app/card-definition-id";

export function publicChronicleCardDefinitionIds(
  event: PublicGameEvent,
): CardDefinitionId[] {
  const ids = new Set<CardDefinitionId>();
  collectPublicCardDefinitionIds(event.publicPayload, ids);
  return Array.from(ids);
}

function collectPublicCardDefinitionIds(
  value: unknown,
  ids: Set<CardDefinitionId>,
): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const entry of value) collectPublicCardDefinitionIds(entry, ids);
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key.endsWith("DefinitionId") && isCardDefinitionId(entry)) {
      ids.add(entry);
    } else if (key.endsWith("DefinitionIds")) {
      const definitionIds = Array.isArray(entry)
        ? entry.filter(isCardDefinitionId)
        : cardDefinitionIdsFromCsv(entry);
      for (const definitionId of definitionIds) ids.add(definitionId);
    }
    collectPublicCardDefinitionIds(entry, ids);
  }
}
