import { rolesMatch } from "./role-match";

const BREAKER_ROLE_NEEDLES = [
  "breaker_fracter",
  "breaker_decoder",
  "breaker_killer",
  "breaker_wall",
  "breaker_code_gate",
  "breaker_sentry",
  "breaker_universal",
  "breaker_end_run",
] as const;

export function matchingBreakerRoleNeedles(
  roles: readonly string[],
): string[] {
  return BREAKER_ROLE_NEEDLES.filter((needle) => rolesMatch(roles, [needle]));
}

export function rolesHaveBreakerRole(roles: readonly string[]): boolean {
  return matchingBreakerRoleNeedles(roles).length > 0;
}

export function rolesHaveUnmatchedBreakerRole(
  roles: readonly string[],
  installedRoles: ReadonlySet<string>,
): boolean {
  const installedRoleList = [...installedRoles];
  return matchingBreakerRoleNeedles(roles).some(
    (needle) => !rolesMatch(installedRoleList, [needle]),
  );
}
