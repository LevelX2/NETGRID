export function publicRoleEvidence(roles: string[]): string[] {
  return roles.slice(0, 2).map((role) => `role:${role}`);
}
