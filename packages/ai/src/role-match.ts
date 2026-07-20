const ROLE_SEGMENT_CACHE_LIMIT = 4096;
const ROLE_SEGMENTS_BY_VALUE = new Map<string, readonly string[]>();
const UNDERSCORE_TOKENS_BY_VALUE = new Map<string, readonly string[]>();

export function rolesMatch(
  roles: readonly string[],
  needles: readonly string[],
): boolean {
  return needles.some((needle) =>
    roles.some((role) => roleMatchesNeedle(role, needle)),
  );
}

function roleMatchesNeedle(role: string, needle: string): boolean {
  if (role === needle) return true;
  return roleSegments(role).some((segment) =>
    roleSegmentMatchesNeedle(segment, needle),
  );
}

function roleSegmentMatchesNeedle(segment: string, needle: string): boolean {
  if (segment === needle) return true;
  const tokens = underscoreTokens(segment);
  if (needle.endsWith("_")) {
    const prefix = needle.slice(0, -1);
    return tokens[0] === prefix && tokens.length > 1;
  }
  const needleTokens = underscoreTokens(needle);
  if (needleTokens.length <= 1) {
    const tokenSet = new Set(tokens);
    return tokenSet.has(needle);
  }
  return tokens.some(
    (token, index) =>
      token === needleTokens[0] &&
      needleTokens.every(
        (needleToken, offset) => tokens[index + offset] === needleToken,
      ),
  );
}

function roleSegments(value: string): readonly string[] {
  return cachedTokens(ROLE_SEGMENTS_BY_VALUE, value, () =>
    value.split(/[.:-]+/),
  );
}

function underscoreTokens(value: string): readonly string[] {
  return cachedTokens(UNDERSCORE_TOKENS_BY_VALUE, value, () =>
    value.split("_").filter(Boolean),
  );
}

function cachedTokens(
  cache: Map<string, readonly string[]>,
  value: string,
  create: () => string[],
): readonly string[] {
  const cached = cache.get(value);
  if (cached) return cached;
  if (cache.size >= ROLE_SEGMENT_CACHE_LIMIT) cache.clear();
  const tokens = create();
  cache.set(value, tokens);
  return tokens;
}
