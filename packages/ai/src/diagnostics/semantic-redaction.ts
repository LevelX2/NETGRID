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

const FORBIDDEN_SEMANTIC_MARKER_PATTERN = new RegExp(
  `(?:^|[^a-z0-9])(?:${FORBIDDEN_SEMANTIC_MARKERS.join("|")})(?=$|[^a-z0-9])`,
);

export function containsForbiddenSemanticMarker(value: unknown): boolean {
  return findForbiddenSemanticPath(value) !== undefined;
}

export function findForbiddenSemanticPath(
  value: unknown,
  path = "value",
): string | undefined {
  return findForbiddenSemanticPathInternal(value, path, new WeakSet<object>());
}

function findForbiddenSemanticPathInternal(
  value: unknown,
  path: string,
  visited: WeakSet<object>,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    return containsForbiddenMarkerText(value) ? path : undefined;
  }
  if (typeof value !== "object") return undefined;
  if (visited.has(value)) return undefined;
  visited.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findForbiddenSemanticPathInternal(
        value[index],
        `${path}[${index}]`,
        visited,
      );
      if (nestedPath) return nestedPath;
    }
    return undefined;
  }
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const currentPath = `${path}.${key}`;
    if (containsForbiddenMarkerText(key)) return currentPath;
    const nestedPath = findForbiddenSemanticPathInternal(
      nested,
      currentPath,
      visited,
    );
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
  return FORBIDDEN_SEMANTIC_MARKER_PATTERN.test(value.toLowerCase());
}
