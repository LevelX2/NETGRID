import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import { actionCreditCost } from "./action-cost";

const AI_HINTS_BY_CARD = createAiHintsByCard();

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
      const effects = card.definitionId
        ? (AI_HINTS_BY_CARD.get(card.definitionId)?.effects ?? [])
        : [];
      const supportsUpgradeTrash =
        accessed.type === "upgrade" &&
        effects.some(
          (effect) =>
            effect.kind === "recurring_economy" &&
            effect.resource === "credits" &&
            effect.economyMode === "restricted_credit" &&
            effect.target === "upgrade_trash",
        );
      const supportsAssetTrash =
        accessed.type === "asset" &&
        effects.some(
          (effect) =>
            effect.kind === "recurring_economy" &&
            effect.resource === "credits" &&
            effect.economyMode === "restricted_credit" &&
            effect.target === "node_trash",
        );
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
