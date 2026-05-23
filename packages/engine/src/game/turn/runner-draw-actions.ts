import type { GameState, LegalAction } from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export type RunnerDrawActionContext = {
  citySurveillanceSourceCount: number;
  projectedDrawCount: number;
};

export function buildRunnerDrawCardActions(
  state: GameState,
  context: RunnerDrawActionContext,
): LegalAction[] {
  const { citySurveillanceSourceCount, projectedDrawCount } = context;
  if (citySurveillanceSourceCount <= 0) {
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
  const projectedCitySurveillanceCost =
    citySurveillanceSourceCount * projectedDrawCount;
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
          citySurveillanceSourceCount,
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
      citySurveillanceSourceCount === 1
        ? "Karte ziehen (City Surveillance: 1 Tag nehmen)"
        : `Karte ziehen (City Surveillance: ${citySurveillanceSourceCount} Tags nehmen)`,
      "basic_action",
      [{ clicks: 1 }],
      {
        citySurveillanceSourceCount,
        citySurveillanceProjectedDrawCount: projectedDrawCount,
        citySurveillanceDrawDecision: "tag",
        citySurveillanceProjectedCreditsPaid: 0,
        citySurveillanceProjectedTagsAdded:
          citySurveillanceSourceCount * projectedDrawCount,
      },
    ),
  );
  return actions;
}
