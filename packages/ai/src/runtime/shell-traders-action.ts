import { type LegalAction } from "@netgrid/shared";
import { rolesMatch } from "./role-match";

export function shellTradersTargetValue(
  roles: string[],
  shellCounters: number,
): number {
  let value = 0;
  if (roles.some((role) => role.startsWith("breaker_"))) value += 105;
  if (rolesMatch(roles, ["memory", "memory_support"])) value += 55;
  if (rolesMatch(roles, ["setup", "build_rig"])) value += 45;
  if (rolesMatch(roles, ["economy", "tempo"])) value += 20;
  value += Math.min(60, Math.max(0, shellCounters) * 10);
  return value;
}

export function shellTradersAbility(
  action: LegalAction,
): string | undefined {
  const payload = action.payload;
  if (!payload) return undefined;
  return typeof payload.delayedInstallAbility === "string"
    ? payload.delayedInstallAbility
    : typeof payload.shellTradersAbility === "string"
      ? payload.shellTradersAbility
      : undefined;
}
