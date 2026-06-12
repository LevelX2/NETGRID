export type PublicSurfacePayloadValue = string | number | boolean;
export type PublicSurfacePayload = Record<string, PublicSurfacePayloadValue>;

const PRIVATE_CARD_LIST_FIELD_PATTERNS = [
  /(?:hidden|private|unselected).*cardIds$/i,
  /(?:hq|rd|hand|stack|grip).*cardIds$/i,
];

/**
 * @contract Public payload surfaces may expose counts, public definition IDs
 * and explicit public facts, but not hidden-zone card lists or rich objects.
 */
export function sanitizeCardImplementationSurfacePayload(
  payload: PublicSurfacePayload,
): PublicSurfacePayload {
  for (const [key, value] of Object.entries(payload)) {
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    )
      throw new Error(
        `Public surface payload field ${key} has an unsupported value.`,
      );
    if (PRIVATE_CARD_LIST_FIELD_PATTERNS.some((pattern) => pattern.test(key)))
      throw new Error(
        `Public surface payload field ${key} may leak hidden card data.`,
      );
  }
  return { ...payload };
}
