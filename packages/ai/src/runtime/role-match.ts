export function rolesMatch(
  roles: readonly string[],
  needles: readonly string[],
): boolean {
  return needles.some((needle) =>
    roles.some(
      (role) =>
        role === needle || role.includes(needle) || role.startsWith(needle),
    ),
  );
}
