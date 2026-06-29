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
  return role
    .split(/[.:-]+/)
    .some((segment) => roleSegmentMatchesNeedle(segment, needle));
}

function roleSegmentMatchesNeedle(segment: string, needle: string): boolean {
  if (segment === needle) return true;
  const tokens = segment.split("_").filter(Boolean);
  if (needle.endsWith("_")) {
    const prefix = needle.slice(0, -1);
    return tokens[0] === prefix && tokens.length > 1;
  }
  const needleTokens = needle.split("_").filter(Boolean);
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
