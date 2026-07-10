import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { actionCreditCost } from "./action-cost";
import { rolesMatch } from "./role-match";

export type RemoteTrashCostBucket = "0_1" | "2_3" | "4_5" | "6_plus";

export function remoteTrashCostBucket(cost: number): RemoteTrashCostBucket {
  if (cost <= 1) return "0_1";
  if (cost <= 3) return "2_3";
  if (cost <= 5) return "4_5";
  return "6_plus";
}

export function remoteTrashActionTotalCost(action: LegalAction): number {
  const payloadCost = action.payload?.accessTrashTotalCost;
  return typeof payloadCost === "number" && Number.isFinite(payloadCost)
    ? payloadCost
    : actionCreditCost(action);
}

export function remoteTrashDedicatedCreditsForMetrics(
  input: AiDecisionInput,
  action: LegalAction,
  accessed: VisibleCard,
): number {
  const scatter =
    accessed.type === "upgrade" &&
    typeof action.payload?.scatterShotRecurringCreditsAvailable === "number"
      ? action.payload.scatterShotRecurringCreditsAvailable
      : 0;
  const poltergeist =
    accessed.type === "asset" &&
    typeof action.payload?.poltergeistRecurringCreditsAvailable === "number"
      ? action.payload.poltergeistRecurringCreditsAvailable
      : 0;
  const payloadCredits = scatter + poltergeist;
  const rigCredits =
    input.playerView.own.rig?.reduce((sum, card) => {
      const runtimeDefinition = card.definitionId
        ? RUNTIME_CARDS[card.definitionId]
        : undefined;
      const demoDefinition = card.definitionId
        ? CARD_DEFINITIONS_BY_ID[card.definitionId]
        : undefined;
      const mechanics = [
        ...("mechanics" in (runtimeDefinition ?? {})
          ? ((runtimeDefinition as { mechanics?: string[] } | undefined)
              ?.mechanics ?? [])
          : []),
        ...(demoDefinition?.mechanics ?? []),
      ];
      const supportsUpgradeTrash =
        accessed.type === "upgrade" &&
        rolesMatch(mechanics, ["upgrade_trash_payment"]);
      const supportsAssetTrash =
        accessed.type === "asset" &&
        rolesMatch(mechanics, ["node_trash_recurring_credit"]);
      if (!supportsUpgradeTrash && !supportsAssetTrash) return sum;
      return (
        sum + (card.counters?.recurring_credit ?? 0) + (card.counters?.bit ?? 0)
      );
    }, 0) ?? 0;
  return Math.min(
    remoteTrashActionTotalCost(action),
    Math.max(payloadCredits, rigCredits),
  );
}
