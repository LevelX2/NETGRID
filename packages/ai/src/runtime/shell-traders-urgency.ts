import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { actionCreditCost } from "./action-cost";

export function shellTradersDirectInstallUrgency(
  input: AiDecisionInput,
  roles: string[],
  directInstall: LegalAction,
  installedRigRoles: ReadonlySet<string>,
): number {
  const remainingCredits =
    input.playerView.own.credits - actionCreditCost(directInstall);
  let urgency = 0;
  if (
    roles.some(
      (role) => role.startsWith("breaker_") && !installedRigRoles.has(role),
    )
  )
    urgency += 145;
  const memoryRemaining =
    (input.playerView.own.memoryLimit ?? 0) -
    (input.playerView.own.memoryUsed ?? 0);
  if (roles.includes("memory") || roles.includes("memory_support"))
    urgency += memoryRemaining <= 1 ? 110 : 25;
  if (roles.includes("setup") || roles.includes("build_rig"))
    urgency += (input.playerView.own.rig ?? []).length === 0 ? 45 : 15;
  if (roles.includes("economy") || roles.includes("tempo"))
    urgency += input.playerView.own.credits < 4 ? 55 : 15;
  if (remainingCredits >= 2) urgency += 45;
  else if (remainingCredits < 1) urgency -= 35;
  return Math.max(0, urgency);
}
