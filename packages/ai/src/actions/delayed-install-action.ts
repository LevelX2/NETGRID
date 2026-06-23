import type { LegalAction } from "@netgrid/shared";

export type DelayedInstallAbility =
  | "set_aside_from_grip"
  | "remove_shell_counter";

export function delayedInstallAbilityForAction(
  action: LegalAction,
): DelayedInstallAbility | undefined {
  const payload = action.payload;
  const ability =
    payload?.delayedInstallAbility ?? payload?.shellTradersAbility;
  if (
    ability === "set_aside_from_grip" ||
    ability === "remove_shell_counter"
  ) {
    return ability;
  }
  return undefined;
}
