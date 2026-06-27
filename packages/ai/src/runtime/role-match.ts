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
  if (needle.endsWith("_")) return segment.startsWith(needle);
  return (
    segment.startsWith(`${needle}_`) ||
    segment.endsWith(`_${needle}`) ||
    segment.includes(`_${needle}_`)
  );
}
