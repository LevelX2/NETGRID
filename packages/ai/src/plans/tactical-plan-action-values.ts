import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import type { AiCardHint } from "../ai-hints";

export type TacticalPlanCreditValueDependencies = {
  aiHintsByCard: ReadonlyMap<string, AiCardHint>;
  visibleCardForAction: (
    playerView: PlayerView,
    action: LegalAction,
  ) => VisibleCard | undefined;
};

export function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
}

export function legalActionCreditNetGain(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: TacticalPlanCreditValueDependencies,
): number {
  const gain = legalActionCreditGainForPlan(input, action, dependencies);
  if (gain <= 0) return 0;
  return Math.max(0, gain - actionCreditCost(action));
}

export function legalActionCreditGainForPlan(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: TacticalPlanCreditValueDependencies,
): number {
  if (action.side !== input.side) return 0;
  const knownGain = Math.max(
    0,
    legalActionNumberPayload(action, "gainCreditsAmount"),
    legalActionNumberPayload(action, "gainedCredits"),
    legalActionNumberPayload(action, "amount"),
    legalActionCreditGainLabelAmount(legalActionCreditGainLabel(action)),
    legalActionCreditHintGain(input, action, dependencies),
  );
  if (action.type === "gain_credit") return Math.max(1, knownGain);
  if (action.type === "play_event") return knownGain;
  if (
    action.type !== "activated_card_ability" &&
    action.type !== "trigger_ability"
  ) {
    return 0;
  }
  return knownGain;
}

function legalActionCreditHintGain(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: TacticalPlanCreditValueDependencies,
): number {
  const sourceCard = dependencies.visibleCardForAction(
    input.playerView,
    action,
  );
  if (!sourceCard?.definitionId) return 0;
  const hint = dependencies.aiHintsByCard.get(sourceCard.definitionId);
  const amounts = (hint?.effects ?? [])
    .filter(
      (effect) =>
        (effect.kind === "action_economy" || effect.kind === "economy") &&
        effect.timing === "action" &&
        effect.scope === action.side &&
        effect.resource === "credits",
    )
    .map((effect) => effect.amount ?? 0)
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  if (amounts.length === 0) return 0;
  return Math.max(...amounts);
}

function legalActionCreditGainLabel(action: LegalAction): string {
  const abilityLabel = action.payload?.cardImplementationAbilityLabel;
  return typeof abilityLabel === "string" ? abilityLabel : action.label;
}

function legalActionCreditGainLabelAmount(label: string): number {
  const germanMatch = /(\d+)\s+Credits?\s+nehmen/i.exec(label);
  const englishMatch = /(?:gain|take)\s+(\d+)\s+Credits?/i.exec(label);
  const amount = Number(germanMatch?.[1] ?? englishMatch?.[1] ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function legalActionNumberPayload(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
