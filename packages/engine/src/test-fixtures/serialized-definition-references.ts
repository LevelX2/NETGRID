import { isCardDefinitionId, type CardDefinitionId } from "@netgrid/shared";

export function serializedDefinitionReferences(
  json: string,
): Set<CardDefinitionId> {
  const definitions = new Set<CardDefinitionId>();
  function walk(value: unknown, field = ""): void {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, field);
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) walk(child, key);
      return;
    }
    if (!/(?:definitionIds?$|^identityCardId$)/i.test(field)) return;
    if (isCardDefinitionId(value)) definitions.add(value);
    if (typeof value === "string" && /^[1-9]\d*(?:,[1-9]\d*)*$/.test(value)) {
      for (const token of value.split(",")) {
        const id = Number(token);
        if (isCardDefinitionId(id)) definitions.add(id);
      }
    }
  }
  walk(JSON.parse(json));
  return definitions;
}
