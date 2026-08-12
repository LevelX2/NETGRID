import type { PublicGameEvent } from "@netgrid/shared";

export function publicChronicleCardDefinitionIds(
  event: PublicGameEvent,
): string[] {
  const ids = new Set<string>();
  collectPublicCardDefinitionIds(event.publicPayload, ids);
  return Array.from(ids);
}

function collectPublicCardDefinitionIds(
  value: unknown,
  ids: Set<string>,
): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const entry of value) collectPublicCardDefinitionIds(entry, ids);
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key.endsWith("DefinitionId") && typeof entry === "string") {
      if (entry.length > 0) ids.add(entry);
    } else if (key.endsWith("DefinitionIds")) {
      const definitionIds = Array.isArray(entry)
        ? entry.filter(
            (item): item is string =>
              typeof item === "string" && item.length > 0,
          )
        : typeof entry === "string"
          ? entry
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];
      for (const definitionId of definitionIds) ids.add(definitionId);
    }
    collectPublicCardDefinitionIds(entry, ids);
  }
}
