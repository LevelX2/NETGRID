import type { LegalAction } from "@netgrid/shared";
import type {
  ActionEconomyProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";
import { isBasicCreditAction } from "./action-effect-classification";

export function applyActionEconomyProjection(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const economyProjection = actionEconomyProjectionFor(candidate, action);
  return {
    ...candidate,
    economyProjection,
    evidence: [
      ...candidate.evidence,
      "AI economy resources projected from side-safe LegalAction facts",
      ...economyProjection.evidence.map((entry) => `economy:${entry}`),
    ],
  };
}

export function actionEconomyProjectionFor(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionEconomyProjection {
  const payloadGain = positiveNumber(action.payload?.gainCreditsAmount);
  const basicActionGain = isBasicCreditAction(action) ? 1 : undefined;
  const grossLiquidCreditGain = payloadGain ?? basicActionGain;
  const creditCost = Math.max(0, candidate.costProfile.creditCost ?? 0);
  const clickCost = Math.max(0, candidate.costProfile.clickCost ?? 0);
  const storedCreditsAdded = positiveNumber(
    action.payload?.hostedCreditAddAmount,
  );
  const storedCreditsTaken = positiveNumber(
    action.payload?.hostedCreditTakeAmount,
  );
  const cardsDrawn = firstPositiveNumber(action, [
    "drawCardsAmount",
    "drawAmount",
    "drawCount",
  ]);
  const cardsConsumed =
    action.type === "play_event" || action.type === "play_operation" ? 1 : 0;
  const netHandDelta = cardsDrawn - cardsConsumed;
  const source =
    payloadGain !== undefined ||
    storedCreditsAdded !== undefined ||
    storedCreditsTaken !== undefined
      ? "legal_action_payload"
      : basicActionGain !== undefined
        ? "basic_action_contract"
        : "unknown";
  const kind =
    grossLiquidCreditGain !== undefined
      ? "immediate_liquid"
      : storedCreditsAdded !== undefined
        ? "stored_credit_build"
        : "non_economy";
  const timing =
    grossLiquidCreditGain !== undefined
      ? "immediate"
      : storedCreditsAdded !== undefined
        ? "setup"
        : "unknown";
  const payoutMode =
    action.payload?.hostedCreditTakeMode === "all"
      ? "all_available"
      : storedCreditsTaken !== undefined || grossLiquidCreditGain !== undefined
        ? "fixed"
        : undefined;
  const evidence = [
    `kind:${kind}`,
    `click_cost:${clickCost}`,
    `credit_cost:${creditCost}`,
    `cards_drawn:${cardsDrawn}`,
    `cards_consumed:${cardsConsumed}`,
    `net_hand_delta:${netHandDelta}`,
    `source:${source}`,
    ...(grossLiquidCreditGain !== undefined
      ? [
          `gross_liquid_credit_gain:${grossLiquidCreditGain}`,
          `net_liquid_credit_gain:${grossLiquidCreditGain - creditCost}`,
        ]
      : []),
    ...(storedCreditsAdded !== undefined
      ? [`stored_credits_added:${storedCreditsAdded}`]
      : []),
    ...(storedCreditsTaken !== undefined
      ? [`stored_credits_taken:${storedCreditsTaken}`]
      : []),
    ...(payoutMode !== undefined ? [`payout_mode:${payoutMode}`] : []),
  ];

  return {
    schemaVersion: "action-economy-projection-v1",
    kind,
    timing,
    creditRestriction: "general",
    clickCost,
    creditCost,
    ...(grossLiquidCreditGain !== undefined
      ? {
          grossLiquidCreditGain,
          netLiquidCreditGain: grossLiquidCreditGain - creditCost,
        }
      : {}),
    ...(storedCreditsAdded !== undefined ? { storedCreditsAdded } : {}),
    ...(storedCreditsTaken !== undefined ? { storedCreditsTaken } : {}),
    cardsDrawn,
    cardsConsumed,
    netHandDelta,
    ...(payoutMode !== undefined ? { payoutMode } : {}),
    repeatable: isBasicCreditAction(action) ? true : "unknown",
    reliability:
      source === "legal_action_payload" || source === "basic_action_contract"
        ? "guaranteed"
        : "unknown",
    source,
    confidence:
      source === "legal_action_payload"
        ? "high"
        : source === "basic_action_contract"
          ? "medium"
          : "none",
    evidence,
  };
}

function firstPositiveNumber(
  action: LegalAction,
  keys: readonly string[],
): number {
  for (const key of keys) {
    const value = positiveNumber(action.payload?.[key]);
    if (value !== undefined) return value;
  }
  return 0;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}
