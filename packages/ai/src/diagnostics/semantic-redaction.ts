const FORBIDDEN_SEMANTIC_MARKERS = [
  "cardinstances",
  "privatepayload",
  "sessiontoken",
  "reconnecttoken",
  "jointoken",
  "tokenhash",
  "fullgamestate",
  "secretgripids",
  "secrethqids",
  "deckorder",
  "hiddenremoteidentity",
] as const;

export function containsForbiddenSemanticMarker(value: unknown): boolean {
  return findForbiddenSemanticPath(value) !== undefined;
}

export function findForbiddenSemanticPath(
  value: unknown,
  path = "value",
): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    return containsForbiddenMarkerText(value) ? path : undefined;
  }
  if (typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findForbiddenSemanticPath(
        value[index],
        `${path}[${index}]`,
      );
      if (nestedPath) return nestedPath;
    }
    return undefined;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = `${path}.${key}`;
    if (containsForbiddenMarkerText(key)) return currentPath;
    const nestedPath = findForbiddenSemanticPath(nested, currentPath);
    if (nestedPath) return nestedPath;
  }
  return undefined;
}

export function redactSemanticString(value: string): string {
  return containsForbiddenMarkerText(value) ? "[redacted]" : value;
}

export function assertSemanticObjectSideSafe(
  value: unknown,
  label: string,
): void {
  const forbiddenPath = findForbiddenSemanticPath(value, label);
  if (!forbiddenPath) return;
  throw new Error(
    `${label} contains forbidden hidden-info marker: ${forbiddenPath}`,
  );
}

function containsForbiddenMarkerText(value: string): boolean {
  const tokenSet = new Set(semanticRedactionTokens(value));
  return FORBIDDEN_SEMANTIC_MARKERS.some((marker) => tokenSet.has(marker));
}

function semanticRedactionTokens(value: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const character of value) {
    if (isAsciiLetterOrDigit(character)) {
      current += character.toLocaleLowerCase("en-US");
    } else {
      if (current.length > 0) tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}
