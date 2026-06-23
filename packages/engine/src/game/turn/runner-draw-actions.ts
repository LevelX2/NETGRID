import type { GameState, LegalAction } from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export type RunnerDrawActionContext = {
  drawTaxSourceCount: number;
  projectedDrawCount: number;
};

export function buildRunnerDrawCardActions(
  state: GameState,
  context: RunnerDrawActionContext,
): LegalAction[] {
  const { drawTaxSourceCount, projectedDrawCount } = context;
  if (drawTaxSourceCount <= 0) {
    return [
      buildLegalAction(
        state,
        "runner",
        "draw_card",
        "Karte ziehen",
        "basic_action",
        [{ clicks: 1 }],
      ),
    ];
  }

  const actions: LegalAction[] = [];
  const projectedCitySurveillanceCost = drawTaxSourceCount * projectedDrawCount;
  if (state.runner.credits >= projectedCitySurveillanceCost) {
    actions.push(
      buildLegalAction(
        state,
        "runner",
        "draw_card",
        projectedCitySurveillanceCost === 1
          ? "Karte ziehen (City Surveillance: 1 Credit zahlen)"
          : `Karte ziehen (City Surveillance: ${projectedCitySurveillanceCost} Credits zahlen)`,
        "basic_action",
        [{ clicks: 1, credits: projectedCitySurveillanceCost }],
        {
          citySurveillanceSourceCount: drawTaxSourceCount,
          citySurveillanceProjectedDrawCount: projectedDrawCount,
          citySurveillanceDrawDecision: "pay",
          citySurveillanceProjectedCreditsPaid: projectedCitySurveillanceCost,
          citySurveillanceProjectedTagsAdded: 0,
        },
      ),
    );
  }

  actions.push(
    buildLegalAction(
      state,
      "runner",
      "draw_card",
      drawTaxSourceCount === 1
        ? "Karte ziehen (City Surveillance: 1 Tag nehmen)"
        : `Karte ziehen (City Surveillance: ${drawTaxSourceCount} Tags nehmen)`,
      "basic_action",
      [{ clicks: 1 }],
      {
        citySurveillanceSourceCount: drawTaxSourceCount,
        citySurveillanceProjectedDrawCount: projectedDrawCount,
        citySurveillanceDrawDecision: "tag",
        citySurveillanceProjectedCreditsPaid: 0,
        citySurveillanceProjectedTagsAdded:
          drawTaxSourceCount * projectedDrawCount,
      },
    ),
  );
  return actions;
}
