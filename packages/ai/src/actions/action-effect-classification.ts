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
  return undefined;
}

function isKnownNonCreditGainAction(action: LegalAction): boolean {
  return knownNonCreditGainActionSemantics(action) !== undefined;
}
