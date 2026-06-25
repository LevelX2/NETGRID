import type { AiDecisionInput } from "@netgrid/shared";
import { isRemoteServerTarget } from "../runtime/server-target";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { remoteTrashCostForVisibleCard } from "./card-metric-lookup";
import { remoteTrashRoleForVisibleCard } from "./remote-trash-role";

export function runnerCreditReserveTargetForInput(
  input: AiDecisionInput,
  rolesForCardId: (cardId: string | undefined) => string[],
): number {
  if (input.side !== "runner") return 0;
  let target = 4;
  for (const server of input.playerView.servers) {
    if (!isRemoteServerTarget(server.id)) continue;
    const pathCost =
      assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        server.root,
      ).visibleBreakCost ?? 0;
    const hasThreat = server.root.some(
      (card) =>
        (card.advancementCounters ?? 0) > 0 ||
        (card.known && card.type === "agenda"),
    );
    const relevantTrashCosts = server.root
      .filter((card) => card.known)
      .filter((card) => {
        const role = remoteTrashRoleForVisibleCard(card);
        return role !== "low_value" && role !== "unknown";
      })
      .map((card) => remoteTrashCostForVisibleCard(card))
      .filter((cost): cost is number => typeof cost === "number");
    const cheapestRelevantTrash =
      relevantTrashCosts.length > 0 ? Math.min(...relevantTrashCosts) : 0;
    const visibleStealTax = server.root.some(
      (card) =>
        card.known &&
        rolesForCardId(card.definitionId).some(
          (role) =>
            role.includes("agenda_steal_tax") ||
            role.includes("remote_upgrade_tax") ||
            role.includes("access_tax"),
        ),
    )
      ? 5
      : 0;
    if (hasThreat) target = Math.max(target, pathCost + 3 + visibleStealTax);
    if (cheapestRelevantTrash > 0)
      target = Math.max(target, pathCost + cheapestRelevantTrash + 1);
  }
  return Math.min(12, Math.max(2, Math.ceil(target)));
}
