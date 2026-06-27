import { rolesMatch } from "./role-match";

export function isRunnerEconomyRole(role: string): boolean {
  return rolesMatch([role], ["economy", "tempo"]);
}

export function isRunnerPressureRole(role: string): boolean {
  return rolesMatch([role], [
    "run_pressure",
    "access",
    "pressure",
    "interface",
    "multiaccess",
  ]);
}

export function isRunnerNonAdditiveUtilityRole(role: string): boolean {
  return (
    role === "program_search" ||
    role === "stack_search" ||
    role === "trash_recovery" ||
    role === "search_trash" ||
    roleHasStructuredPath(role, "setup.recovery") ||
    roleHasStructuredPath(role, "setup.stack_filter")
  );
}

function roleHasStructuredPath(role: string, path: string): boolean {
  return role === path || role.startsWith(`${path}.`);
}
