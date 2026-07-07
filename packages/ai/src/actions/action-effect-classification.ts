import type { LegalAction } from "@netgrid/shared";

export function actionProvidesCredits(action: LegalAction): boolean {
  if (action.type !== "gain_credit") return false;
  return !isKnownNonCreditGainAction(action);
}

export function knownNonCreditGainActionSemantics(
  action: LegalAction,
):
  | {
      semanticActionType: string;
      tacticSignals: readonly string[];
    }
  | undefined {
  if (action.type !== "gain_credit") return undefined;
  if (action.payload?.agendaAbility === "hq_archives_shuffle_draw") {
    return {
      semanticActionType: "draw.card",
      tacticSignals: ["draw.card", "setup.draw", "zone.shuffle_draw"],
    };
  }
  if (gainCreditActionHasHiddenZonePayload(action)) {
    return {
      semanticActionType: "card_ability.trigger",
      tacticSignals: ["card_ability.trigger", "zone.reveal"],
    };
  }
  if (gainCreditActionHasExplicitNoCreditPayload(action)) {
    return {
      semanticActionType: "card_ability.trigger",
      tacticSignals: ["card_ability.trigger", "economy.no_immediate_credit"],
    };
  }
  return undefined;
}

function isKnownNonCreditGainAction(action: LegalAction): boolean {
  return knownNonCreditGainActionSemantics(action) !== undefined;
}

function gainCreditActionHasHiddenZonePayload(action: LegalAction): boolean {
  const payload = action.payload;
  if (!payload) return false;
  return (
    payload.effectKind === "hidden_zone" ||
    payload.abilityFamily === "hidden-zone" ||
    typeof payload.hiddenZoneAction === "string"
  );
}

function gainCreditActionHasExplicitNoCreditPayload(action: LegalAction): boolean {
  const amount = action.payload?.gainCreditsAmount;
  return typeof amount === "number" && Number.isFinite(amount) && amount <= 0;
}
