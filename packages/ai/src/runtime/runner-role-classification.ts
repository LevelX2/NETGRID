export function isRunnerEconomyRole(role: string): boolean {
  return role === "economy" || role === "tempo" || role.includes("economy");
}

export function isRunnerPressureRole(role: string): boolean {
  return (
    role === "run_pressure" ||
    role === "access" ||
    role.includes("pressure") ||
    role.includes("interface") ||
    role.includes("multiaccess")
  );
}

export function isRunnerNonAdditiveUtilityRole(role: string): boolean {
  return (
    role === "program_search" ||
    role === "stack_search" ||
    role === "trash_recovery" ||
    role === "search_trash" ||
    role.includes("setup.recovery") ||
    role.includes("setup.stack_filter")
  );
}
