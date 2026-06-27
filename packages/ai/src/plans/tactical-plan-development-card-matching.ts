import type { LegalAction } from "@netgrid/shared";
import type { TacticalPlan } from "./tactical-plan-types";

export function developmentCardStepMatchesAction(
  plan: TacticalPlan,
  action: LegalAction,
): boolean {
  if (
    action.type !== "install_card" &&
    action.type !== "play_event" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  if (plan.target?.kind !== "card") return true;
  return legalActionReferencesCard(action, plan.target.id);
}

function legalActionReferencesCard(action: LegalAction, cardId: string): boolean {
  const payload = action.payload ?? {};
  return (
    action.source === cardId ||
    payload.cardId === cardId ||
    payload.sourceCardId === cardId ||
    payload.targetCardId === cardId ||
    payload.selectedCardId === cardId
  );
}
